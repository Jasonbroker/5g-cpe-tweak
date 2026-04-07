//! Modem 接口

use anyhow::Result;

/// 发送 AT 指令
pub async fn send_at(cmd: &str) -> Result<String> {
    // TODO: 通过 D-Bus 调用 oFono
    Ok("OK".to_string())
}

/// 获取 Modem 列表
pub async fn get_modems() -> Result<Vec<String>> {
    // TODO: 通过 D-Bus 获取
    Ok(vec!["/ril_0".to_string()])
}
