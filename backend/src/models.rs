//! 数据模型

use serde::{Deserialize, Serialize};

/// 设备信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub imei: String,
    pub iccid: String,
    pub model: String,
    pub firmware: String,
    pub revision: String,
}

/// SIM 卡信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimInfo {
    pub present: bool,
    pub imsi: Option<String>,
    pub iccid: Option<String>,
    pub locked: bool,
    pub operator: Option<String>,
}

/// 网络注册状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStatus {
    pub registered: bool,
    pub status: String,  // idle, searching, denied, home, roaming
    pub operator: Option<String>,
    pub operator_code: Option<String>,
    pub technology: Option<String>,  // GSM, LTE, NR
}

/// 信号强度
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalStrength {
    pub rssi: i32,
    pub rsrp: Option<i32>,
    pub rsrq: Option<i32>,
    pub sinr: Option<i32>,
    pub level: u8,  // 0-4
}

/// 小区信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CellInfo {
    pub type_: String,  // LTE, NR
    pub pci: i32,
    pub earfcn: i32,
    pub band: Option<String>,
    pub rsrp: Option<i32>,
    pub rsrq: Option<i32>,
}

/// 基站信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CellTower {
    pub cells: Vec<CellInfo>,
}

/// AT 指令请求
#[derive(Debug, Deserialize)]
pub struct AtRequest {
    pub cmd: String,
}

/// AT 指令响应
#[derive(Debug, Serialize)]
pub struct AtResponse {
    pub result: String,
}

/// AT 指令历史项
#[derive(Debug, Clone, Serialize)]
pub struct AtHistoryItem {
    pub cmd: String,
    pub result: String,
    pub timestamp: i64,
}

/// 流量统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficStats {
    pub rx_bytes: u64,
    pub tx_bytes: u64,
    pub total_bytes: u64,
}

/// 流量限制配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficLimit {
    pub enabled: bool,
    pub limit_bytes: Option<u64>,
    pub current_bytes: u64,
}

/// 短信
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmsMessage {
    pub index: i32,
    pub from: String,
    pub to: String,
    pub body: String,
    pub timestamp: String,
    pub read: bool,
}

/// 通话记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallRecord {
    pub id: i32,
    pub direction: String,  // incoming, outgoing, missed
    pub number: String,
    pub duration: i32,
    pub timestamp: String,
}
