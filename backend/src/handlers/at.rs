//! AT 指令处理

use axum::{Json, extract::State};
use std::sync::Arc;
use std::sync::Mutex;
use tokio::sync::RwLock;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::models::{AtRequest, AtResponse, AtHistoryItem};
use crate::response::ApiResponse;

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
    
    // TODO: 实际通过 oFono D-Bus 发送 AT 指令
    // 目前模拟响应
    let result = match cmd.as_str() {
        "AT+CSQ" => "+CSQ: 20,99".to_string(),
        "AT+CGMR" => "11.217.01.01.01".to_string(),
        "AT+CGSN" => "867062040123456".to_string(),
        "AT+ICCID" => "+ICCID: 898602xxxxxxxxxxxxxxx".to_string(),
        "AT+COPS?" => "+COPS: 0,0,\"CHINA MOBILE\",7".to_string(),
        "AT+CREG?" => "+CREG: 0,1".to_string(),
        "AT+CGATT?" => "+CGATT: 1".to_string(),
        _ => "OK".to_string(),
    };
    
    // 添加到历史
    let mut history = history.write().await;
    history.add(cmd.clone(), result.clone());
    
    Json(ApiResponse::ok_with_data("AT command executed", AtResponse { result }))
}

/// 获取 AT 指令历史
pub async fn get_at_history(
    State(history): State<AtHistoryState>,
) -> Json<ApiResponse<Vec<AtHistoryItem>>> {
    let history = history.read().await;
    let items = history.get_all();
    
    Json(ApiResponse::ok_with_data("AT history retrieved", items))
}
