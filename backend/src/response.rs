//! 统一 API 响应格式

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub status: &'static str,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
}

impl<T> ApiResponse<T> {
    pub fn ok(message: impl Into<String>) -> Self {
        Self {
            status: "ok",
            message: message.into(),
            data: None,
        }
    }
    
    pub fn ok_with_data(message: impl Into<String>, data: T) -> Self {
        Self {
            status: "ok",
            message: message.into(),
            data: Some(data),
        }
    }
    
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            status: "error",
            message: message.into(),
            data: None,
        }
    }
}
