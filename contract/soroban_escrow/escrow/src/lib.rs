#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DealStatus {
    AwaitingFunding = 0,
    Funded = 1,
    Disputed = 2,
    Completed = 3,
    Refunded = 4,
}

#[contracttype]
pub struct EscrowConfig {
    pub buyer: Address,
    pub seller: Address,
    pub arbitrator: Address,
    pub token: Address,
    pub amount: i128,
    pub status: DealStatus,
}

#[contract]
pub struct TradeVaultEscrow;

#[contractimpl]
impl TradeVaultEscrow {
    /// Initialize the contract with the terms of the deal
    pub fn initialize(
        env: Env,
        deal_id: Symbol,
        buyer: Address,
        seller: Address,
        arbitrator: Address,
        token: Address,
        amount: i128,
    ) {
        if env.storage().persistent().has(&deal_id) {
            panic!("Already initialized");
        }
        
        let config = EscrowConfig {
            buyer,
            seller,
            arbitrator,
            token,
            amount,
            status: DealStatus::AwaitingFunding,
        };
        
        env.storage().persistent().set(&deal_id, &config);
    }

    /// Buyer locks the USDC into the smart contract
    pub fn fund(env: Env, deal_id: Symbol, buyer: Address) {
        buyer.require_auth();
        
        let mut config: EscrowConfig = env.storage().persistent().get(&deal_id).unwrap();
        
        if config.status != DealStatus::AwaitingFunding {
            panic!("Cannot fund: invalid status");
        }
        if config.buyer != buyer {
            panic!("Only buyer can fund");
        }

        let token_client = token::Client::new(&env, &config.token);
        
        // Contract pulls funds from the buyer's wallet into the contract's own balance
        token_client.transfer(&buyer, &env.current_contract_address(), &config.amount);
        
        // Update status to Funded
        config.status = DealStatus::Funded;
        env.storage().persistent().set(&deal_id, &config);
    }

    /// Buyer confirms receipt of goods, paying the seller
    pub fn release_funds(env: Env, deal_id: Symbol, buyer: Address) {
        buyer.require_auth();
        
        let mut config: EscrowConfig = env.storage().persistent().get(&deal_id).unwrap();
        
        if config.status != DealStatus::Funded {
            panic!("Cannot release: not funded");
        }
        if config.buyer != buyer {
            panic!("Only buyer can release funds");
        }

        let token_client = token::Client::new(&env, &config.token);
        
        // Transfer locked USDC from the contract to the seller's wallet
        token_client.transfer(&env.current_contract_address(), &config.seller, &config.amount);
        
        // Contract state is Completed
        config.status = DealStatus::Completed;
        env.storage().persistent().set(&deal_id, &config);
    }

    /// Buyer or Seller raises a dispute, locking release temporarily
    pub fn raise_dispute(env: Env, deal_id: Symbol, caller: Address) {
        caller.require_auth();
        
        let mut config: EscrowConfig = env.storage().persistent().get(&deal_id).unwrap();
        
        if config.status != DealStatus::Funded {
            panic!("Cannot dispute: not funded");
        }
        if config.buyer != caller && config.seller != caller {
            panic!("Only buyer or seller can dispute");
        }
        
        config.status = DealStatus::Disputed;
        env.storage().persistent().set(&deal_id, &config);
    }

    /// The Arbitrator (platform) splits the locked USDC after resolving dispute
    pub fn resolve_dispute(
        env: Env,
        deal_id: Symbol,
        arbitrator: Address,
        buyer_amount: i128,
        seller_amount: i128,
    ) {
        arbitrator.require_auth();
        
        let mut config: EscrowConfig = env.storage().persistent().get(&deal_id).unwrap();
        
        if config.status != DealStatus::Disputed {
            panic!("Cannot resolve: not in dispute");
        }
        if config.arbitrator != arbitrator {
            panic!("Only arbitrator can resolve");
        }
        if buyer_amount + seller_amount != config.amount {
            panic!("Resolution amounts do not match total escrow amount");
        }

        let token_client = token::Client::new(&env, &config.token);
        
        // Execute the arbitrator's ruling split
        if buyer_amount > 0 {
            token_client.transfer(&env.current_contract_address(), &config.buyer, &buyer_amount);
        }
        if seller_amount > 0 {
            token_client.transfer(&env.current_contract_address(), &config.seller, &seller_amount);
        }

        config.status = DealStatus::Completed;
        env.storage().persistent().set(&deal_id, &config);
    }

    /// Get current state of the escrow
    pub fn get_status(env: Env, deal_id: Symbol) -> EscrowConfig {
        env.storage().persistent().get(&deal_id).unwrap()
    }
}
