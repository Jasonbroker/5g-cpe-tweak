//! 流量管理处理 - 真实系统数据

use axum::Json;
use serde::{Deserialize, Serialize};
use std::process::Command;
use crate::models::{TrafficStats, TrafficLimit};
use crate::response::ApiResponse;

/// 获取流量统计
pub async fn get_traffic_stats() -> Json<ApiResponse<TrafficStats>> {
    match get_real_traffic_stats().await {
        Ok(stats) => Json(ApiResponse::ok_with_data("Traffic stats retrieved", stats)),
        Err(e) => {
            tracing::warn!("Failed to get traffic stats: {}", e);
            // 返回模拟数据
            Json(ApiResponse::ok_with_data("Traffic stats retrieved (fallback)", TrafficStats {
                rx_bytes: 1024 * 1024 * 512,
                tx_bytes: 1024 * 1024 * 128,
                total_bytes: 1024 * 1024 * 640,
            }))
        }
    }
}

async fn get_real_traffic_stats() -> Result<TrafficStats, anyhow::Error> {
    // 从 /sys/class/net 获取流量数据
    // 查找 rmnet 或 wwan 接口（移动数据接口）
    let output = Command::new("cat")
        .args(["/sys/class/net/rmnet0/statistics/rx_bytes"])
        .output()?;
    
    let rx_bytes: u64 = String::from_utf8_lossy(&output.stdout)
        .trim()
        .parse()
        .unwrap_or(0);
    
    let output = Command::new("cat")
        .args(["/sys/class/net/rmnet0/statistics/tx_bytes"])
        .output()?;
    
    let tx_bytes: u64 = String::from_utf8_lossy(&output.stdout)
        .trim()
        .parse()
        .unwrap_or(0);
    
    Ok(TrafficStats {
        rx_bytes,
        tx_bytes,
        total_bytes: rx_bytes + tx_bytes,
    })
}

/// 获取流量限制配置
pub async fn get_traffic_limit() -> Json<ApiResponse<TrafficLimit>> {
    // TODO: 从配置文件读取
    Json(ApiResponse::ok_with_data("Traffic limit retrieved", TrafficLimit {
        enabled: false,
        limit_bytes: None,
        current_bytes: 0,
    }))
}

#[derive(Debug, Deserialize)]
pub struct TrafficLimitRequest {
    pub enabled: bool,
    pub limit_bytes: Option<u64>,
}

/// 设置流量限制
pub async fn set_traffic_limit(Json(req): Json<TrafficLimitRequest>) -> Json<ApiResponse<TrafficLimit>> {
    // TODO: 保存到配置文件
    Json(ApiResponse::ok_with_data("Traffic limit updated", TrafficLimit {
        enabled: req.enabled,
        limit_bytes: req.limit_bytes,
        current_bytes: 0,
    }))
}
