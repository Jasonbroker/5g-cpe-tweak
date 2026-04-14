//! MessageManager 接口 - 短信管理

use anyhow::Result;
use std::collections::HashMap;
use zbus::{Connection, Proxy};
use zbus::zvariant::OwnedValue;

use super::modem::with_serial;

/// MessageManager proxy
pub struct MessageManagerProxy<'a> {
    proxy: Proxy<'a>,
}

impl<'a> MessageManagerProxy<'a> {
    pub async fn new(conn: &'a Connection) -> Result<Self> {
        let proxy = Proxy::new(conn, "org.ofono", "/ril_0", "org.ofono.MessageManager").await?;
        Ok(Self { proxy })
    }

    /// 获取短信属性
    pub async fn get_properties(&self) -> Result<HashMap<String, OwnedValue>> {
        let props = self.proxy.call("GetProperties", &()).await?;
        Ok(props)
    }

    /// 发送短信
    pub async fn send(&self, to: &str, body: &str) -> Result<String> {
        let result = self.proxy.call("Send", &(to, body)).await?;
        Ok(result)
    }

    /// 获取短信列表
    pub async fn get_messages(&self) -> Result<Vec<(String, HashMap<String, OwnedValue>)>> {
        let messages: Vec<(String, HashMap<String, OwnedValue>)> = 
            self.proxy.call("GetMessages", &()).await?;
        Ok(messages)
    }
}

/// 发送短信
pub async fn send_sms(conn: &Connection, to: &str, body: &str) -> Result<String> {
    with_serial(|| async {
        let proxy = MessageManagerProxy::new(conn).await?;
        proxy.send(to, body).await
    }).await
}

/// 获取所有短信
pub async fn get_all_messages(conn: &Connection) -> Result<Vec<SmsMessage>> {
    with_serial(|| async {
        let proxy = MessageManagerProxy::new(conn).await?;
        let messages = proxy.get_messages().await?;
        
        let result: Vec<SmsMessage> = messages
            .into_iter()
            .map(|(path, props)| {
                let from = props
                    .get("Sender")
                    .and_then(|v| String::try_from(v.clone()).ok())
                    .unwrap_or_default();
                let body = props
                    .get("Text")
                    .and_then(|v| String::try_from(v.clone()).ok())
                    .unwrap_or_default();
                let timestamp = props
                    .get("Timestamp")
                    .and_then(|v| String::try_from(v.clone()).ok())
                    .unwrap_or_default();
                let read = props
                    .get("Read")
                    .and_then(|v| bool::try_from(v.clone()).ok())
                    .unwrap_or(false);
                
                SmsMessage { path, from, body, timestamp, read }
            })
            .collect();
        
        Ok(result)
    }).await
}

#[derive(Debug)]
pub struct SmsMessage {
    pub path: String,
    pub from: String,
    pub body: String,
    pub timestamp: String,
    pub read: bool,
}
