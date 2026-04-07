//! 流量管理处理

use axum::{Json};
use serde::{Deserialize, Serialize};
use crate::models::{TrafficStats, TrafficLimit};
use crate::response::ApiResponse;

/// 获取流量统计
pub async fn get_traffic_stats() -> Json<ApiResponse<TrafficStats>> {
    // TODO: 从 /sys/class/net 或 /proc/net/dev 获取真实流量数据
    Json(ApiResponse::ok_with_data("Traffic stats retrieved", TrafficStats {
        rx_bytes: 1024 * 1024 * 512,   // 512 MB received
        tx_bytes: 1024 * 1024 * 128,   // 128 MB sent
        total_bytes: 1024 * 1024 * 640, // 640 MB total
    }))
}

/// 获取流量限制配置
pub async fn get_traffic_limit() -> Json<ApiResponse<TrafficLimit>> {
    // TODO: 从配置文件或数据库读取
    Json(ApiResponse::ok_with_data("Traffic limit retrieved", TrafficLimit {
        enabled: false,
        limit_bytes: Some(1024 * 1024 * 1024 * 5), // 5GB
        current_bytes: 1024 * 1024 * 640, // 640MB
    }))
}

#[derive(Debug, Deserialize)]
pub struct TrafficLimitRequest {
    pub enabled: bool,
    pub limit_bytes: Option<u64>,
}

/// 设置流量限制
pub async fn set_traffic_limit(Json(req): Json<TrafficLimitRequest>) -> Json<ApiResponse<TrafficLimit>> {
    // TODO: 保存到配置文件，启用流量监控
    Json(ApiResponse::ok_with_data("Traffic limit updated", TrafficLimit {
        enabled: req.enabled,
        limit_bytes: req.limit_bytes,
        current_bytes: 0,
    }))
}
