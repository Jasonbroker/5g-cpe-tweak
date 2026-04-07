//! VoiceCallManager 接口 - 通话管理

use anyhow::Result;
use std::collections::HashMap;
use zbus::{Connection, Proxy, OwnedValue};

use super::modem::with_serial;

/// VoiceCallManager proxy
pub struct VoiceCallManagerProxy<'a> {
    proxy: Proxy<'a>,
}

impl<'a> VoiceCallManagerProxy<'a> {
    pub async fn new(conn: &'a Connection) -> Result<Self> {
        let proxy = Proxy::new(conn, "org.ofono", "/ril_0", "org.ofono.VoiceCallManager").await?;
        Ok(Self { proxy })
    }

    /// 获取通话列表
    pub async fn get_calls(&self) -> Result<Vec<(String, HashMap<String, OwnedValue>)>> {
        let calls: Vec<(String, HashMap<String, OwnedValue>)> = 
            self.proxy.call("GetCalls", &()).await?;
        Ok(calls)
    }

    /// 拨号
    pub async fn dial(&self, number: &str) -> Result<String> {
        let result = self.proxy.call("Dial", &(number, "")).await?;
        Ok(result)
    }

    /// 挂断
    pub async fn hangup(&self, path: &str) -> Result<()> {
        let proxy = Proxy::new(&self.proxy.connection(), "org.ofono", path, "org.ofono.VoiceCall").await?;
        proxy.call("Hangup", &()).await?;
        Ok(())
    }

    /// 接听
    pub async fn answer(&self, path: &str) -> Result<()> {
        let proxy = Proxy::new(&self.proxy.connection(), "org.ofono", path, "org.ofono.VoiceCall").await?;
        proxy.call("Answer", &()).await?;
        Ok(())
    }
}

/// 拨号
pub async fn dial(conn: &Connection, number: &str) -> Result<String> {
    with_serial(|| async {
        let proxy = VoiceCallManagerProxy::new(conn).await?;
        proxy.dial(number).await
    }).await
}

/// 挂断通话
pub async fn hangup(conn: &Connection, path: &str) -> Result<()> {
    with_serial(|| async {
        let proxy = VoiceCallManagerProxy::new(conn).await?;
        proxy.hangup(path).await
    }).await
}

/// 接听来电
pub async fn answer(conn: &Connection, path: &str) -> Result<()> {
    with_serial(|| async {
        let proxy = VoiceCallManagerProxy::new(conn).await?;
        proxy.answer(path).await
    }).await
}

/// 获取当前通话列表
pub async fn get_calls(conn: &Connection) -> Result<Vec<CallInfo>> {
    with_serial(|| async {
        let proxy = VoiceCallManagerProxy::new(conn).await?;
        let calls = proxy.get_calls().await?;
        
        let result: Vec<CallInfo> = calls
            .into_iter()
            .map(|(path, props)| {
                let line_id = props
                    .get("LineIdentification")
                    .and_then(|v| String::try_from(v.clone()).ok())
                    .unwrap_or_default();
                let state = props
                    .get("State")
                    .and_then(|v| String::try_from(v.clone()).ok())
                    .unwrap_or_default();
                let incoming = props
                    .get("Incoming")
                    .and_then(|v| bool::try_from(v.clone()).ok())
                    .unwrap_or(false);
                
                CallInfo { path, line_id, state, incoming }
            })
            .collect();
        
        Ok(result)
    }).await
}

#[derive(Debug)]
pub struct CallInfo {
    pub path: String,
    pub line_id: String,
    pub state: String,
    pub incoming: bool,
}
