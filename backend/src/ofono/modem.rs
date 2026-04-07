//! Modem 接口 - 通过 D-Bus 与 oFono 通信

use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use zbus::{Connection, Proxy, OwnedValue};

/// 全局 D-Bus 锁，防止 oFono 并发错误
static DBUS_LOCK: Mutex<()> = Mutex::const_new(());

/// 执行时持有全局 D-Bus 锁
async fn with_serial<F, T>(f: F) -> T
where
    F: async FnOnce() -> T,
{
    let _guard = DBUS_LOCK.lock().await;
    f()
}

/// 获取 D-Bus 连接
pub async fn get_connection() -> Result<Connection> {
    Ok(Connection::system().await?)
}

/// 发送 AT 指令
pub async fn send_at(conn: &Connection, cmd: &str) -> Result<String> {
    with_serial(|| async {
        let proxy = Proxy::new(conn, "org.ofono", "/ril_0", "org.ofono.Modem").await?;
        let result: String = proxy.call("SendAtcmd", &(cmd)).await?;
        Ok(result)
    }).await
}

/// 获取 Modem 属性
pub async fn get_modem_properties(conn: &Connection) -> Result<HashMap<String, OwnedValue>> {
    let proxy = Proxy::new(conn, "org.ofono", "/ril_0", "org.ofono.Modem").await?;
    let props = proxy.call("GetProperties", &()).await?;
    Ok(props)
}

/// 获取 Modem 列表
pub async fn get_modems(conn: &Connection) -> Result<Vec<String>> {
    let proxy = Proxy::new(conn, "org.ofono", "/", "org.ofono.Manager").await?;
    let modems: Vec<String> = proxy.call("GetModems", &()).await?;
    Ok(modems)
}
