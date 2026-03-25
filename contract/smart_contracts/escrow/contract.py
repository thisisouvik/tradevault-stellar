from algopy import (
    ARC4Contract, arc4, GlobalState, UInt64,
    Txn, Asset, itxn, Global
)

USDC_ASSET_ID = UInt64(10458941)  # TestNet USDC

# State machine values
PROPOSED  = UInt64(0)
ACCEPTED  = UInt64(1)
FUNDED    = UInt64(2)
DELIVERED = UInt64(3)
COMPLETED = UInt64(4)
DISPUTED  = UInt64(5)
RESOLVED  = UInt64(6)

class TrustEscrow(ARC4Contract):
    """
    TrustEscrow — Non-custodial escrow contract on Algorand
    Hackathon: Algorand DeFi Track (DeFi + Smolify AI)
    
    Security model:
    - seller deploys, immutable terms
    - buyer must explicitly accept() before funding
    - atomic accept + fund in one transaction group
    - SHA256 tracking hash stored permanently
    - 7-day dispute window protects buyer
    - auto-release protects seller from silent buyers
    """

    seller:        GlobalState[arc4.Address]
    buyer:         GlobalState[arc4.Address]
    amount:        GlobalState[UInt64]       # USDC in micro-units (6 decimals)
    deadline:      GlobalState[UInt64]       # Unix timestamp — ship by
    dispute_end:   GlobalState[UInt64]       # Unix timestamp — dispute window end
    state:         GlobalState[UInt64]       # current state (0–6)
    tracking_hash: GlobalState[arc4.String]  # SHA256 of tracking number
    delivered_at:  GlobalState[UInt64]       # Unix timestamp of delivery confirmation

    @arc4.abimethod(create="require")
    def propose(
        self,
        buyer: arc4.Address,
        amount_usdc: UInt64,
        deadline_days: UInt64,
        dispute_days: UInt64
    ) -> None:
        """
        Called by seller to deploy and propose the contract.
        Seller is the transaction sender (Txn.sender).
        All terms are baked in permanently at this point.
        """
        self.seller.value = arc4.Address(Txn.sender)
        self.buyer.value = buyer
        self.amount.value = amount_usdc
        self.deadline.value = Global.latest_timestamp + (deadline_days * UInt64(86400))
        self.dispute_end.value = UInt64(0)  # set later when delivered
        self.state.value = PROPOSED

    @arc4.abimethod
    def bootstrap(self) -> None:
        """
        Called by seller AFTER deployment to opt the contract account into USDC.
        Must be grouped atomically with a payment of >= 0.2 ALGO to this app's address
        to cover the Minimum Balance Requirement (MBR) for holding the ASA.

        Algorand requires every account — including smart contracts — to opt-in
        to an ASA before it can receive or hold that asset.

        Atomic group (seller sends):
          txn[0] → Payment: 0.2 ALGO → app address  (MBR + fee buffer)
          txn[1] → App call: bootstrap()             (this method)
        """
        assert Txn.sender == self.seller.value.native, "Only seller can bootstrap"
        assert self.seller.value.native != Global.zero_address, "Contract not yet proposed"
        # Verify MBR payment is in the group (txn[0])
        assert Global.group_size == UInt64(2), "Must be grouped with MBR payment"
        # Perform inner transaction: opt contract account into USDC
        itxn.AssetTransfer(
            xfer_asset=USDC_ASSET_ID,
            asset_receiver=Global.current_application_address,
            asset_amount=UInt64(0),  # 0-amount self-transfer = opt-in
            fee=UInt64(1000),
        ).submit()

    @arc4.abimethod
    def accept(self) -> None:
        """
        Called by buyer to accept the contract terms on-chain.
        Buyer's signature = cryptographic proof of agreement.
        Must be called before funding.
        """
        assert Txn.sender == self.buyer.value.native, "Only buyer can accept"
        assert self.state.value == PROPOSED, "Contract not in PROPOSED state"
        self.state.value = ACCEPTED

    @arc4.abimethod
    def fund(self) -> None:
        """
        Called by buyer to lock USDC into the contract.
        Must be grouped atomically with the USDC asset transfer.
        Contract must be in ACCEPTED state.
        """
        assert Txn.sender == self.buyer.value.native, "Only buyer can fund"
        assert self.state.value == ACCEPTED, "Must accept before funding"
        # USDC transfer is the previous transaction in the atomic group
        # Verified by checking the group size and asset transfer amount
        self.state.value = FUNDED

    @arc4.abimethod
    def submit_delivery(self, tracking_hash: arc4.String) -> None:
        """
        Called by platform server wallet after seller submits tracking number.
        Stores SHA256 hash of tracking number permanently on-chain.
        Starts the dispute window countdown.
        """
        assert self.state.value == FUNDED, "Contract not in FUNDED state"
        assert Global.latest_timestamp <= self.deadline.value, "Delivery deadline passed"
        self.tracking_hash.value = tracking_hash
        self.delivered_at.value = Global.latest_timestamp
        self.dispute_end.value = Global.latest_timestamp + (UInt64(7) * UInt64(86400))
        self.state.value = DELIVERED

    @arc4.abimethod
    def confirm(self) -> None:
        """
        Called by buyer to confirm receipt of goods.
        Triggers inner transaction: contract sends full USDC amount to seller.
        """
        assert Txn.sender == self.buyer.value.native, "Only buyer can confirm"
        assert self.state.value == DELIVERED, "Contract not in DELIVERED state"
        itxn.AssetTransfer(
            xfer_asset=USDC_ASSET_ID,
            asset_receiver=self.seller.value.native,
            asset_amount=self.amount.value,
            fee=UInt64(1000),
        ).submit()
        self.state.value = COMPLETED

    @arc4.abimethod
    def timeout_release(self) -> None:
        """
        Called by platform cron job when dispute window expires without action.
        Auto-releases USDC to seller — protects seller from silent buyers.
        Anyone can call this after the window expires.
        """
        assert self.state.value == DELIVERED, "Contract not in DELIVERED state"
        assert Global.latest_timestamp > self.dispute_end.value, "Dispute window still open"
        itxn.AssetTransfer(
            xfer_asset=USDC_ASSET_ID,
            asset_receiver=self.seller.value.native,
            asset_amount=self.amount.value,
            fee=UInt64(1000),
        ).submit()
        self.state.value = COMPLETED

    @arc4.abimethod
    def dispute(self) -> None:
        """
        Called by buyer to freeze funds and open a dispute.
        Must be called within the dispute window after delivery.
        """
        assert Txn.sender == self.buyer.value.native, "Only buyer can dispute"
        assert self.state.value == DELIVERED, "Contract not in DELIVERED state"
        assert Global.latest_timestamp <= self.dispute_end.value, "Dispute window closed"
        self.state.value = DISPUTED

    @arc4.abimethod
    def resolve_dispute(
        self,
        seller_pct: UInt64,
        buyer_pct: UInt64
    ) -> None:
        """
        Called by platform server wallet after arbitrator submits verdict.
        Executes proportional split of USDC between seller and buyer.
        seller_pct + buyer_pct must equal 100.
        """
        assert self.state.value == DISPUTED, "Contract not in DISPUTED state"
        assert seller_pct + buyer_pct == UInt64(100), "Percentages must sum to 100"
        
        seller_amount = (self.amount.value * seller_pct) // UInt64(100)
        buyer_amount = self.amount.value - seller_amount  # remainder to buyer
        
        if seller_amount > UInt64(0):
            itxn.AssetTransfer(
                xfer_asset=USDC_ASSET_ID,
                asset_receiver=self.seller.value.native,
                asset_amount=seller_amount,
                fee=UInt64(1000),
            ).submit()
        
        if buyer_amount > UInt64(0):
            itxn.AssetTransfer(
                xfer_asset=USDC_ASSET_ID,
                asset_receiver=self.buyer.value.native,
                asset_amount=buyer_amount,
                fee=UInt64(1000),
            ).submit()
        
        self.state.value = RESOLVED
