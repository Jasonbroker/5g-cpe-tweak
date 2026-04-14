//! NetworkRegistration 接口

use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;
use zbus::{Connection, Proxy};
use zbus::zvariant::OwnedValue;

use super::modem::with_serial;

/// NetworkRegistration proxy
pub struct NetworkRegistrationProxy<'a> {
    proxy: Proxy<'a>,
}

impl<'a> NetworkRegistrationProxy<'a> {
    pub async fn new(conn: &'a Connection) -> Result<Self> {
        let proxy = Proxy::new(conn, "org.ofono", "/ril_0", "org.ofono.NetworkRegistration").await?;
        Ok(Self { proxy })
    }

    /// 获取网络注册属性
    pub async fn get_properties(&self) -> Result<HashMap<String, OwnedValue>> {
        let props = self.proxy.call("GetProperties", &()).await?;
        Ok(props)
    }

    /// 获取网络注册状态
    pub async fn get_registration_status(&self) -> Result<(u32, u32)> {
        let props = self.get_properties().await?;
        
        let status = props
            .get("Status")
            .and_then(|v| String::try_from(v.clone()).ok())
            .unwrap_or_default();
        
        let lac = props
            .get("LocationAreaCode")
            .and_then(|v| u32::try_from(v.clone()).ok())
            .unwrap_or(0);
        
        let cell_id = props
            .get("CellId")
            .and_then(|v| u32::try_from(v.clone()).ok())
            .unwrap_or(0);
        
        Ok((lac, cell_id))
    }

    /// 获取信号强度
    pub async fn get_signal_strength(&self) -> Result<i32> {
        let props = self.get_properties().await?;
        let strength = props
            .get("SignalStrength")
            .and_then(|v| i32::try_from(v.clone()).ok())
            .unwrap_or(-999);
        Ok(strength)
    }

    /// 获取当前运营商信息
    pub async fn get_operator(&self) -> Result<(String, String, String)> {
        let props = self.get_properties().await?;
        
        let name = props
            .get("Name")
            .and_then(|v| String::try_from(v.clone()).ok())
            .unwrap_or_default();
        
        let code = props
            .get("OperatorCode")
            .and_then(|v| String::try_from(v.clone()).ok())
            .unwrap_or_default();
        
        let status = props
            .get("Status")
            .and_then(|v| String::try_from(v.clone()).ok())
            .unwrap_or_default();
        
        Ok((name, code, status))
    }
}

/// 获取网络注册信息
pub async fn get_network_status(conn: &Connection) -> Result<NetworkStatusInfo> {
    with_serial(|| async {
        let proxy = NetworkRegistrationProxy::new(conn).await?;
        let (name, code, status) = proxy.get_operator().await?;
        let strength = proxy.get_signal_strength().await?;
        Ok(NetworkStatusInfo { name, code, status, strength })
    }).await
}

#[derive(Debug)]
pub struct NetworkStatusInfo {
    pub name: String,
    pub code: String,
    pub status: String,
    pub strength: i32,
}
