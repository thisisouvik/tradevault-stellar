<div align="center">
  <img src="public/logo.png" alt="TradeVault Logo" width="200" style="border-radius: 20px; margin-bottom: 20px;" />
  
  <h1>TradeVault</h1>
  <h3><strong>Secure, Trustless, and Seamless Escrow for the Decentralized Web.</strong></h3>

  <p>
    <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
    <img src="https://img.shields.io/badge/Stellar-14161A?style=for-the-badge&logo=stellar&logoColor=white" alt="Stellar" />
  </p>
</div>

<br/>

## 📖 What is TradeVault?
TradeVault is a secure, trustless, decentralized escrow marketplace built on the Stellar network. It eliminates the risk of fraud in peer-to-peer online transactions by locking funds (USDC) securely inside a Soroban smart contract. Funds are only released when both parties are satisfied, or after a fair resolution by an independent platform Arbitrator.

## ⚠️ The Current Gap
In today's digital economy, transacting with unknown parties across the globe is incredibly risky. 
- **For Buyers:** Paying upfront without a guarantee of delivery often leads to scams.
- **For Sellers:** Delivering work or shipping physical goods before payment exposes them to chargebacks and non-payment.
- **Legacy Solutions:** Traditional escrow platforms (like Escrow.com) or freelance marketplaces (like Upwork/Fiverr) charge exorbitant fees (often 5% to 20%), require lengthy KYC delays, hold funds for weeks, and process slow cross-border fiat settlements. 

## 💡 What We Provide (Our USP)
TradeVault provides a **trustless, instant, and low-cost** alternative by moving the escrow process entirely on-chain using Stellar's Soroban smart contracts. 
- **Zero Middleman Risk:** We don't hold your funds. They are locked cryptographically in a smart contract.
- **Fractional Fees:** Leveraging the Stellar network, transaction fees are pennies, compared to hundreds of dollars on legacy platforms.
- **Global & Permissionless:** Anyone with a Freighter wallet can instantly lock USDC and conduct business globally without banking restrictions.
- **Fair Dispute Resolution:** If things go wrong, an impartial platform Arbitrator steps in to fairly distribute the locked funds based on evidence, preventing unilateral chargebacks.

## 🏢 Use Cases & Example Projects
TradeVault is flexible enough to handle almost any peer-to-peer transaction:
1. **Freelance Contracts:** A freelance developer in India builds a website for a client in the US. The client locks $5,000 USDC in TradeVault. The developer builds with peace of mind knowing the funds are secured. Once the site is delivered, the funds are instantly released.
2. **High-Value Digital Assets:** Buying or selling domains, social media accounts, or rare game items. TradeVault ensures the buyer has the funds and the seller delivers the asset before the swap finalizes.
3. **Physical Goods Delivery:** Purchasing a luxury watch from an international seller. The funds are locked up until the buyer confirms the tracking number shows "Delivered" and the item is authentic.
4. **Over-The-Counter (OTC) Crypto Trades:** Large buyers and sellers exchanging tokens without trusting a centralized exchange to hold custody.

## 📊 Market Analysis: Traditional vs. Decentralized Escrow

**Major Inefficiencies in the Traditional Escrow Market:**
```mermaid
pie
    "High Middleman Fees (up to 5-10%)" : 45
    "Slow Cross-Border Settlement" : 25
    "Lack of Transparency" : 20
    "High Fraud / Chargeback Rates" : 10
```

TradeVault directly addresses these pain points by utilizing Stellar's near-instant block finality and mathematically proven Soroban smart contracts.

## 💰 Business Scope & Platform Fees
TradeVault introduces a highly scalable and sustainable revenue model while remaining an order of magnitude cheaper than centralized competitors:
- **Contract Interaction Fee:** A flat fee (e.g., ~$1-2) or a minimal percentage (e.g., 0.5% - 1%) charged upon the successful release of funds, drastically undercutting traditional 5-10% fees.
- **Arbitration Fees:** In the event of a dispute, a nominal fee is taken from the escrowed amount to compensate the Arbitrator for their time resolving the issue.
- **Premium Features:** Future scoping includes white-labeling the escrow API for other marketplaces, tiered merchant accounts, and integrations with stablecoin yield generation while funds are locked.

## 🛠️ Tech Stack Overview
- **Frontend & Backend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Framer Motion, Lucide Icons
- **Database & Auth:** Supabase (PostgreSQL)
- **Blockchain Interface:** `@stellar/stellar-sdk`, `@stellar/freighter-api`
- **Smart Contracts:** Rust, Soroban SDK (Compiled to `wasm32v1-none`)

## 🌌 Why Stellar & Soroban?
TradeVault specifically utilizes the Stellar network and Soroban (Stellar's smart contract platform) for several crucial reasons:
- **Cost-Efficiency:** Escrow relies on locking and transferring value. Traditional blockchains have high gas fees that make micro-escrows impossible. Stellar’s fees are fractions of a cent.
- **Speed:** Stellar boasts near-instant block finality (3-5 seconds). Users don't have to wait minutes for a transaction to clear before shipping goods or confirming receipt.
- **First-Class Stablecoins:** Stellar treats USDC and other stable assets natively without complex token wrappers, making dollar-pegged transfers incredibly secure.
- **Performance & Safety:** Soroban allows us to write safe, highly performant, and deeply auditable smart contracts using Rust.

---

## ✨ Features

| Feature                                                    | Status  |
| ---------------------------------------------------------- | ------- |
| Wallet connect via Freighter                               | ✅ Live |
| Trustless Wallet-to-Contract Escrow (Soroban)              | ✅ Live |
| Real-time milestone & tracking sync (Supabase)             | ✅ Live |
| Pay and lock shares with USDC via Freighter                | ✅ Live |
| Dispute resolution mechanism                               | ✅ Live |
| Transaction hash receipt linked to Stellar Explorer        | ✅ Live |
| Arbitrator dashboard & granular percentage splits          | ✅ Live |
| Immutable on-chain payment recording                       | ✅ Live |
| Mobile-responsive UI                                       | ✅ Live |

---

## 🔄 User Workflow

```mermaid
graph TD
    A[Buyer & Seller Agree on Terms] --> B(Buyer Connects Freighter Wallet)
    B --> C{Fund Escrow}
    C -->|Invokes initialize & fund| D[(Soroban Smart Contract)]
    D --> E[Seller Delivers Goods/Services]
    
    E --> F{Buyer Satisfied?}
    
    F -- Yes --> G[Buyer Confirms Receipt]
    G -->|Invokes release_funds| H((Funds Released to Seller))
    
    F -- No --> I[Raise Dispute]
    I -->|Invokes raise_dispute| J[Escrow Locked & Arbitrator Notified]
    J --> K[Arbitrator Reviews Evidence]
    K --> L[Arbitrator Resolves Dispute]
    L -->|Invokes resolve_dispute| M((Funds Split / Refunded based on Verdict))
```

---

## 🏛️ Core Architecture

```mermaid
graph LR
    User[User] <--> UI[Next.js Client]
    
    subgraph Frontend Backend
        UI <--> API[Next.js API Routes]
        API <--> DB[(Supabase DB)]
    end
    
    subgraph Stellar Network
        UI <--> Freighter[Freighter Wallet Extension]
        Freighter <--> SorobanRPC[Soroban RPC Server]
        API <--> SorobanRPC
        SorobanRPC <--> Contract[(TradeVault Soroban Contract)]
    end
```

---

## 🚀 Deployment Status & Contract Details

The TradeVault escrow system has been fully migrated to Stellar's Soroban architecture and is currently live on the **Stellar Testnet**.

### Deployed Contract

| Field       | Value                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Contract ID | `CD7P7SINFDFSHLBOGEBFMAJWPZC4CULFASS4JQF22YJ3LQVNNJRWV2HP`                                                                             |
| Network     | Stellar Testnet                                                                                                                        |
| Language    | Rust                                                                                                           |
| Explorer    | [stellar.expert → contract](https://stellar.expert/explorer/testnet/contract/CD7P7SINFDFSHLBOGEBFMAJWPZC4CULFASS4JQF22YJ3LQVNNJRWV2HP) |

### Verified Contract Call Transaction

**Transaction hash:** `71fa9900c3b53f6fbacdb560a8b92b67f168fbc50fbcc4468f71295fc74f4b23` *(Example initialization)*

[View on Stellar Explorer](https://stellar.expert/explorer/testnet/tx/71fa9900c3b53f6fbacdb560a8b92b67f168fbc50fbcc4468f71295fc74f4b23)

### Contract Functions

| Function                                                              | Type  | Purpose                                                 |
| --------------------------------------------------------------------- | ----- | ------------------------------------------------------- |
| `initialize(deal_id, buyer, seller, arbitrator, token, amount)`       | Write | Sets up the initial escrow terms and participants       |
| `fund(deal_id, buyer)`                                                | Write | Pulls funds from buyer's wallet into the smart contract |
| `release_funds(deal_id, buyer)`                                       | Write | Buyer approves transferring the locked USDC to seller   |
| `raise_dispute(deal_id, caller)`                                      | Write | Either party can lock the escrow to require an admin    |
| `resolve_dispute(deal_id, arbitrator, buyer_amount, seller_amount)`   | Write | Arbitrator splits the funds between buyer and seller    |
| `get_status(deal_id)`                                                 | Read  | Checks the real-time funding and dispute status         |

**Error codes / Panics handled:**

| Condition              | Meaning                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `Already initialized`  | Deal state is already configured on-chain                                  |
| `Cannot fund`          | Status is not awaiting funding                                             |
| `Only buyer can fund`  | Validates that the transaction signer matches the initial configuration    |
| `Cannot release`       | Execution blocked because funds are not currently locked in the contract   |
| `Resolution mismatch`  | Split logic amounts do not sum perfectly to the total escrow lock          |

---

## 📂 Project Structure

```text
tradevault/
├── contract/                   # Rust smart contract source code
│   └── smart_contracts/        # Soroban contract for escrow logic (fund, release, dispute)
├── src/
│   ├── app/                    # Next.js App Router UI pages and Backend API routes
│   │   ├── arbitrator/         # Arbitrator dashboard & dispute management UI
│   │   ├── deal/               # Deal creation and escrow management flows
│   │   └── api/                # Backend routes for DB sync & resolving disputes
│   ├── components/             # Reusable React components (UI, Forms, Modals)
│   │   └── ui/                 # Pre-built UI elements like buttons & cards
│   ├── lib/                    # Helper functions and core platform logic
│   │   ├── stellar.ts          # Soroban RPC and Freighter wallet integration logic
│   │   └── supabase/           # Database schema and client initialization
│   └── middleware.ts           # Next.js auth & route protection logic
├── supabase/                   # Supabase DB SQL schema, policies, and roles
├── public/                     # Static assets (including the TradeVault logo)
└── package.json                # Project dependencies and deployment scripts
```

---

## 💻 How to Start the Project Locally

### Prerequisites
1. **Node.js** (v18+)
2. **Freighter Wallet Extension** installed in your browser (Set to Testnet with funded test USDC).
3. **Rust** & **Stellar CLI** (Only if you intend to recompile the Soroban contract locally).

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/thisisouvik/tradevault-stellar
   cd tradevault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Ensure you have a `.env.local` file at the root of the project with the required Supabase and Stellar config variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   STELLAR_PLATFORM_SECRET=your_trusted_backend_signer_secret
   NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
   NEXT_PUBLIC_STELLAR_CONTRACT_ID=CD7P7SINFDFSHLBOGEBFMAJWPZC4CULFASS4JQF22YJ3LQVNNJRWV2HP
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the App:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💖 Thank You!
Thank you for checking out TradeVault! We believe decentralized technology is the future of fair and secure peer-to-peer commerce. If you have any feedback or wish to contribute, please feel free to open an issue or submit a pull request!
