#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, vec, Address, Bytes, Env, Symbol, Vec, Map};

#[contracttype]
#[derive(Clone, Debug, Copy, Eq, PartialEq)]
pub enum DealState {
    Proposed,
    Accepted,
    Funded,
    Delivered,
    Completed,
    Disputed,
    Resolved,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Deal {
    pub seller: Address,
    pub buyer: Address,
    pub arbitrator: Address,
    pub token: Address,
    pub amount_usdc: i128,
    pub delivery_days: u32,
    pub dispute_days: u32,
    pub dispute_end_ts: u64,
    pub delivered_at: u64,
    pub tracking_hash: Bytes,
    pub state: DealState,
    pub seller_payout: i128,
    pub buyer_payout: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Deals,
}

#[contract]
pub struct TradeVaultEscrow;

#[contractimpl]
impl TradeVaultEscrow {
    pub fn create_deal(
        env: Env,
        deal_id: u32,
        seller: Address,
        buyer: Address,
        arbitrator: Address,
        token: Address,
        amount_usdc: i128,
        delivery_days: u32,
        dispute_days: u32,
    ) {
        seller.require_auth();

        if amount_usdc <= 0 {
            panic!("amount must be > 0");
        }
        if delivery_days == 0 {
            panic!("delivery_days must be > 0");
        }
        if dispute_days == 0 {
            panic!("dispute_days must be > 0");
        }

        // Get or initialize deals map
        let deals_key = DataKey::Deals;
        let mut deals: Map<u32, Deal> = if env.storage().persistent().has(&deals_key) {
            env.storage().persistent().get(&deals_key).unwrap()
        } else {
            Map::new(&env)
        };

        // Ensure caller-provided deal_id is unique
        if deals.contains_key(deal_id) {
            panic!("deal_id already exists");
        }

        // Create new deal
        let new_deal = Deal {
            seller: seller.clone(),
            buyer: buyer.clone(),
            arbitrator: arbitrator.clone(),
            token: token.clone(),
            amount_usdc,
            delivery_days,
            dispute_days,
            dispute_end_ts: 0,
            delivered_at: 0,
            tracking_hash: Bytes::new(&env),
            state: DealState::Proposed,
            seller_payout: 0,
            buyer_payout: 0,
        };

        deals.set(deal_id, new_deal);
        env.storage().persistent().set(&deals_key, &deals);

        env.events().publish(
            (Symbol::new(&env, "deal"), Symbol::new(&env, "created")),
            deal_id,
        );
    }

    pub fn accept_deal(env: Env, deal_id: u32) {
        let deals_key = DataKey::Deals;
        let mut deals: Map<u32, Deal> = env.storage().persistent().get(&deals_key).unwrap_or_else(|| Map::new(&env));
        
        let mut deal = deals.get(deal_id).unwrap_or_else(|| panic!("deal not found"));
        deal.buyer.require_auth();
        
        if deal.state != DealState::Proposed {
            panic!("invalid state transition");
        }
        
        deal.state = DealState::Accepted;
        deals.set(deal_id, deal);
        env.storage().persistent().set(&deals_key, &deals);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "accepted")), deal_id);
    }

    pub fn fund_deal(env: Env, deal_id: u32) {
        let deals_key = DataKey::Deals;
        let mut deals: Map<u32, Deal> = env.storage().persistent().get(&deals_key).unwrap_or_else(|| Map::new(&env));
        
        let mut deal = deals.get(deal_id).unwrap_or_else(|| panic!("deal not found"));
        deal.buyer.require_auth();
        
        if deal.state != DealState::Accepted {
            panic!("invalid state transition");
        }

        let token_client = token::Client::new(&env, &deal.token);
        let contract_addr = env.current_contract_address();

        token_client.transfer(&deal.buyer, &contract_addr, &deal.amount_usdc);

        deal.state = DealState::Funded;
        deals.set(deal_id, deal);
        env.storage().persistent().set(&deals_key, &deals);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "funded")), deal_id);
    }

    pub fn submit_delivery(env: Env, deal_id: u32, tracking_hash: Bytes) {
        let deals_key = DataKey::Deals;
        let mut deals: Map<u32, Deal> = env.storage().persistent().get(&deals_key).unwrap_or_else(|| Map::new(&env));
        
        let mut deal = deals.get(deal_id).unwrap_or_else(|| panic!("deal not found"));
        deal.seller.require_auth();
        
        if deal.state != DealState::Funded {
            panic!("invalid state transition");
        }

        let now = env.ledger().timestamp();
        deal.dispute_end_ts = now + (deal.dispute_days as u64 * 86_400u64);
        deal.delivered_at = now;
        deal.tracking_hash = tracking_hash;
        deal.state = DealState::Delivered;

        deals.set(deal_id, deal);
        env.storage().persistent().set(&deals_key, &deals);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "delivered")), deal_id);
    }

    pub fn confirm_package(env: Env, deal_id: u32) {
        let deals_key = DataKey::Deals;
        let mut deals: Map<u32, Deal> = env.storage().persistent().get(&deals_key).unwrap_or_else(|| Map::new(&env));
        
        let mut deal = deals.get(deal_id).unwrap_or_else(|| panic!("deal not found"));
        deal.buyer.require_auth();
        
        if deal.state != DealState::Delivered {
            panic!("invalid state transition");
        }

        let token_client = token::Client::new(&env, &deal.token);
        let contract_addr = env.current_contract_address();

        token_client.transfer(&contract_addr, &deal.seller, &deal.amount_usdc);

        deal.seller_payout = deal.amount_usdc;
        deal.buyer_payout = 0;
        deal.state = DealState::Completed;

        deals.set(deal_id, deal);
        env.storage().persistent().set(&deals_key, &deals);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "completed")), deal_id);
    }

    pub fn raise_dispute(env: Env, deal_id: u32, reason_hash: Bytes) {
        let deals_key = DataKey::Deals;
        let mut deals: Map<u32, Deal> = env.storage().persistent().get(&deals_key).unwrap_or_else(|| Map::new(&env));
        
        let mut deal = deals.get(deal_id).unwrap_or_else(|| panic!("deal not found"));
        deal.buyer.require_auth();
        
        if deal.state != DealState::Delivered {
            panic!("invalid state transition");
        }

        let now = env.ledger().timestamp();
        if now > deal.dispute_end_ts {
            panic!("dispute window closed");
        }

        deal.state = DealState::Disputed;
        deals.set(deal_id, deal);
        env.storage().persistent().set(&deals_key, &deals);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "disputed")), deal_id);
    }

    pub fn resolve_dispute(env: Env, deal_id: u32, seller_pct: u32, buyer_pct: u32) {
        let deals_key = DataKey::Deals;
        let mut deals: Map<u32, Deal> = env.storage().persistent().get(&deals_key).unwrap_or_else(|| Map::new(&env));
        
        let mut deal = deals.get(deal_id).unwrap_or_else(|| panic!("deal not found"));
        deal.arbitrator.require_auth();
        
        if deal.state != DealState::Disputed {
            panic!("invalid state transition");
        }

        if seller_pct + buyer_pct != 100 {
            panic!("percentages must sum to 100");
        }

        let seller_amount: i128 = deal.amount_usdc * seller_pct as i128 / 100i128;
        let buyer_amount: i128 = deal.amount_usdc - seller_amount;

        let token_client = token::Client::new(&env, &deal.token);
        let contract_addr = env.current_contract_address();

        if seller_amount > 0 {
            token_client.transfer(&contract_addr, &deal.seller, &seller_amount);
        }
        if buyer_amount > 0 {
            token_client.transfer(&contract_addr, &deal.buyer, &buyer_amount);
        }

        deal.seller_payout = seller_amount;
        deal.buyer_payout = buyer_amount;
        deal.state = DealState::Resolved;

        deals.set(deal_id, deal);
        env.storage().persistent().set(&deals_key, &deals);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "resolved")), deal_id);
    }

    pub fn timeout_release(env: Env, deal_id: u32) {
        let deals_key = DataKey::Deals;
        let mut deals: Map<u32, Deal> = env.storage().persistent().get(&deals_key).unwrap_or_else(|| Map::new(&env));
        
        let mut deal = deals.get(deal_id).unwrap_or_else(|| panic!("deal not found"));
        
        if deal.state != DealState::Delivered {
            panic!("invalid state transition");
        }

        let now = env.ledger().timestamp();
        if now <= deal.dispute_end_ts {
            panic!("dispute window still active");
        }

        let token_client = token::Client::new(&env, &deal.token);
        let contract_addr = env.current_contract_address();

        token_client.transfer(&contract_addr, &deal.seller, &deal.amount_usdc);

        deal.seller_payout = deal.amount_usdc;
        deal.buyer_payout = 0;
        deal.state = DealState::Completed;

        deals.set(deal_id, deal);
        env.storage().persistent().set(&deals_key, &deals);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "timeout_release")), deal_id);
    }

    pub fn get_deal(env: Env, deal_id: u32) -> Deal {
        let deals_key = DataKey::Deals;
        let deals: Map<u32, Deal> = env.storage().persistent().get(&deals_key).unwrap_or_else(|| Map::new(&env));
        deals.get(deal_id).unwrap_or_else(|| panic!("deal not found"))
    }

    pub fn get_deal_state(env: Env, deal_id: u32) -> DealState {
        let deal = Self::get_deal(env, deal_id);
        deal.state
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{Address, Env};

    fn setup_addresses(env: &Env) -> (Address, Address, Address, Address) {
        (
            Address::generate(env),
            Address::generate(env),
            Address::generate(env),
            Address::generate(env),
        )
    }

    #[test]
    fn create_deal_sets_state_to_proposed() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(TradeVaultEscrow, ());
        let client = TradeVaultEscrowClient::new(&env, &contract_id);

        let (seller, buyer, arbitrator, token) = setup_addresses(&env);

        client.create_deal(&1u32, &seller, &buyer, &arbitrator, &token, &100, &7, &7);

        let deal_id = 1u32;

        let state = client.get_deal_state(&deal_id);
        assert_eq!(state, DealState::Proposed);
    }

    #[test]
    #[should_panic]
    fn create_deal_rejects_zero_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(TradeVaultEscrow, ());
        let client = TradeVaultEscrowClient::new(&env, &contract_id);

        let (seller, buyer, arbitrator, token) = setup_addresses(&env);

        client.create_deal(&1u32, &seller, &buyer, &arbitrator, &token, &0, &7, &7);
    }

    #[test]
    fn create_multiple_deals_allowed() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(TradeVaultEscrow, ());
        let client = TradeVaultEscrowClient::new(&env, &contract_id);

        let (seller, buyer, arbitrator, token) = setup_addresses(&env);

        client.create_deal(&1u32, &seller, &buyer, &arbitrator, &token, &100, &7, &7);
        client.create_deal(&2u32, &seller, &buyer, &arbitrator, &token, &200, &10, &7);

        let deal_id1 = 1u32;
        let deal_id2 = 2u32;

        assert_eq!(deal_id1, 1u32);
        assert_eq!(deal_id2, 2u32);

        let state1 = client.get_deal_state(&deal_id1);
        let state2 = client.get_deal_state(&deal_id2);

        assert_eq!(state1, DealState::Proposed);
        assert_eq!(state2, DealState::Proposed);
    }
}
