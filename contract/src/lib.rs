#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Bytes, Env, Symbol};

#[contracttype]
#[derive(Clone, Copy, Eq, PartialEq)]
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
#[derive(Clone)]
pub enum DataKey {
    Seller,
    Buyer,
    Arbitrator,
    Token,
    Amount,
    DeliveryDays,
    DisputeDays,
    DisputeEndTs,
    DeliveredAt,
    TrackingHash,
    State,
    SellerPayout,
    BuyerPayout,
}

#[contract]
pub struct TradeVaultEscrow;

#[contractimpl]
impl TradeVaultEscrow {
    pub fn create_deal(
        env: Env,
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

        if env.storage().instance().has(&DataKey::State) {
            panic!("deal already initialized");
        }

        env.storage().instance().set(&DataKey::Seller, &seller);
        env.storage().instance().set(&DataKey::Buyer, &buyer);
        env.storage().instance().set(&DataKey::Arbitrator, &arbitrator);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Amount, &amount_usdc);
        env.storage().instance().set(&DataKey::DeliveryDays, &delivery_days);
        env.storage().instance().set(&DataKey::DisputeDays, &dispute_days);
        env.storage().instance().set(&DataKey::State, &DealState::Proposed);

        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "created")), amount_usdc);
    }

    pub fn accept_deal(env: Env) {
        let buyer: Address = get_required(&env, DataKey::Buyer);
        buyer.require_auth();
        assert_state(&env, DealState::Proposed);
        env.storage().instance().set(&DataKey::State, &DealState::Accepted);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "accepted")), 1u32);
    }

    pub fn fund_deal(env: Env) {
        let buyer: Address = get_required(&env, DataKey::Buyer);
        buyer.require_auth();
        assert_state(&env, DealState::Accepted);

        let token_addr: Address = get_required(&env, DataKey::Token);
        let amount: i128 = get_required(&env, DataKey::Amount);
        let contract_addr = env.current_contract_address();
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&buyer, &contract_addr, &amount);

        env.storage().instance().set(&DataKey::State, &DealState::Funded);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "funded")), 1u32);
    }

    pub fn submit_delivery(env: Env, tracking_hash: Bytes) {
        let seller: Address = get_required(&env, DataKey::Seller);
        seller.require_auth();
        assert_state(&env, DealState::Funded);

        let now = env.ledger().timestamp();
        let dispute_days: u32 = get_required(&env, DataKey::DisputeDays);
        let dispute_end_ts = now + (dispute_days as u64 * 86_400u64);

        env.storage().instance().set(&DataKey::TrackingHash, &tracking_hash);
        env.storage().instance().set(&DataKey::DeliveredAt, &now);
        env.storage().instance().set(&DataKey::DisputeEndTs, &dispute_end_ts);
        env.storage().instance().set(&DataKey::State, &DealState::Delivered);

        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "delivered")), dispute_end_ts);
    }

    pub fn confirm_package(env: Env) {
        let buyer: Address = get_required(&env, DataKey::Buyer);
        buyer.require_auth();
        assert_state(&env, DealState::Delivered);

        let token_addr: Address = get_required(&env, DataKey::Token);
        let seller: Address = get_required(&env, DataKey::Seller);
        let amount: i128 = get_required(&env, DataKey::Amount);
        let contract_addr = env.current_contract_address();
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&contract_addr, &seller, &amount);

        env.storage().instance().set(&DataKey::SellerPayout, &amount);
        env.storage().instance().set(&DataKey::BuyerPayout, &0i128);
        env.storage().instance().set(&DataKey::State, &DealState::Completed);

        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "completed")), amount);
    }

    pub fn raise_dispute(env: Env, reason_hash: Bytes) {
        let buyer: Address = get_required(&env, DataKey::Buyer);
        buyer.require_auth();
        assert_state(&env, DealState::Delivered);

        let now = env.ledger().timestamp();
        let dispute_end_ts: u64 = get_required(&env, DataKey::DisputeEndTs);
        if now > dispute_end_ts {
            panic!("dispute window closed");
        }

        env.storage().instance().set(&DataKey::State, &DealState::Disputed);
        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "disputed")), reason_hash);
    }

    pub fn resolve_dispute(env: Env, seller_pct: u32, buyer_pct: u32) {
        let arbitrator: Address = get_required(&env, DataKey::Arbitrator);
        arbitrator.require_auth();
        assert_state(&env, DealState::Disputed);

        if seller_pct + buyer_pct != 100 {
            panic!("percentages must sum to 100");
        }

        let amount: i128 = get_required(&env, DataKey::Amount);
        let seller_amount: i128 = amount * seller_pct as i128 / 100i128;
        let buyer_amount: i128 = amount - seller_amount;
        let token_addr: Address = get_required(&env, DataKey::Token);
        let seller: Address = get_required(&env, DataKey::Seller);
        let buyer: Address = get_required(&env, DataKey::Buyer);
        let contract_addr = env.current_contract_address();
        let token_client = token::Client::new(&env, &token_addr);

        if seller_amount > 0 {
            token_client.transfer(&contract_addr, &seller, &seller_amount);
        }
        if buyer_amount > 0 {
            token_client.transfer(&contract_addr, &buyer, &buyer_amount);
        }

        env.storage().instance().set(&DataKey::SellerPayout, &seller_amount);
        env.storage().instance().set(&DataKey::BuyerPayout, &buyer_amount);
        env.storage().instance().set(&DataKey::State, &DealState::Resolved);

        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "resolved")), (seller_amount, buyer_amount));
    }

    pub fn timeout_release(env: Env) {
        assert_state(&env, DealState::Delivered);

        let now = env.ledger().timestamp();
        let dispute_end_ts: u64 = get_required(&env, DataKey::DisputeEndTs);
        if now <= dispute_end_ts {
            panic!("dispute window still active");
        }

        let token_addr: Address = get_required(&env, DataKey::Token);
        let seller: Address = get_required(&env, DataKey::Seller);
        let amount: i128 = get_required(&env, DataKey::Amount);
        let contract_addr = env.current_contract_address();
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&contract_addr, &seller, &amount);

        env.storage().instance().set(&DataKey::SellerPayout, &amount);
        env.storage().instance().set(&DataKey::BuyerPayout, &0i128);
        env.storage().instance().set(&DataKey::State, &DealState::Completed);

        env.events().publish((Symbol::new(&env, "deal"), Symbol::new(&env, "timeout_release")), amount);
    }

    pub fn get_state(env: Env) -> DealState {
        get_required(&env, DataKey::State)
    }
}

fn assert_state(env: &Env, expected: DealState) {
    let current: DealState = get_required(env, DataKey::State);
    if current != expected {
        panic!("invalid state transition");
    }
}

fn get_required<T: soroban_sdk::TryFromVal<Env, soroban_sdk::Val>>(env: &Env, key: DataKey) -> T {
    match env.storage().instance().get::<DataKey, T>(&key) {
        Some(v) => v,
        None => panic!("missing key"),
    }
}
