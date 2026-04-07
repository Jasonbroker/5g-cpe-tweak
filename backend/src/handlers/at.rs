//! AT 指令处理 - 真实 oFono 实现

use axum::{Json, extract::State};
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::models::{AtRequest, AtResponse, AtHistoryItem};
use crate::response::ApiResponse;
use crate::ofono;

/// AT 指令历史（内存存储，最多 100 条）
pub struct AtHistory {
    items: Vec<AtHistoryItem>,
}

impl AtHistory {
    pub fn new() -> Self {
        Self { items: Vec::new() }
    }
    
    pub fn add(&mut self, cmd: String, result: String) {
        let timestamp = Utc::now().timestamp();
        self.items.push(AtHistoryItem { cmd, result, timestamp });
        // 保留最近 100 条
        if self.items.len() > 100 {
            self.items.remove(0);
        }
    }
    
    pub fn get_all(&self) -> Vec<AtHistoryItem> {
        self.items.clone()
    }
}

pub type AtHistoryState = Arc<RwLock<AtHistory>>;

/// 发送 AT 指令
pub async fn send_at(
    State(history): State<AtHistoryState>,
    Json(req): Json<AtRequest>,
) -> Json<ApiResponse<AtResponse>> {
    let cmd = req.cmd.trim().to_string();
    
    // 通过 oFono D-Bus 发送真实 AT 指令
    let result = match send_at_command(&cmd).await {
        Ok(response) => response,
        Err(e) => {
            tracing::warn!("AT command failed: {}", e);
            format!("ERROR: {}", e)
        }
    };
    
    // 添加到历史
    let mut history = history.write().await;
    history.add(cmd.clone(), result.clone());
    
    Json(ApiResponse::ok_with_data("AT command executed", AtResponse { result }))
}

/// 发送 AT 指令到 Modem
async fn send_at_command(cmd: &str) -> Result<String, anyhow::Error> {
    let conn = ofono::get_connection().await?;
    let response = ofono::send_at(&conn, cmd).await?;
    Ok(response)
}

/// 获取 AT 指令历史
pub async fn get_at_history(
    State(history): State<AtHistoryState>,
) -> Json<ApiResponse<Vec<AtHistoryItem>>> {
    let history = history.read().await;
    let items = history.get_all();
    
    Json(ApiResponse::ok_with_data("AT history retrieved", items))
}
