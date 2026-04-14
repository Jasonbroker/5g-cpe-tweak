//! API Handlers

use std::sync::Arc;
use tokio::sync::RwLock;

pub mod at;
pub mod call;
pub mod control;
pub mod device;
pub mod network;
pub mod sms;
pub mod system;
pub mod traffic;
pub mod webhook;

// Re-export state types for AppState
pub use at::AtHistoryState;
pub use webhook::WebhookStateRef;
pub use at::AtHistory;
pub use webhook::WebhookState;

/// Combined app state for axum router
#[derive(Clone)]
pub struct AppState {
    pub at_history: AtHistoryState,
    pub webhook: WebhookStateRef,
}

impl AppState {
    pub fn new(at_history: AtHistoryState, webhook: WebhookStateRef) -> Self {
        Self { at_history, webhook }
    }
}
