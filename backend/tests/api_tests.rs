//! CPE Ctrl API Tests
//!
//! Run with: cargo test

use serde_json;

// Test response format
#[test]
fn test_api_response_ok() {
    #[derive(serde::Serialize)]
    struct Data {
        value: i32,
    }
    
    let response = serde_json::json!({
        "status": "ok",
        "message": "Success",
        "data": {
            "value": 42
        }
    });
    
    assert_eq!(response["status"], "ok");
    assert_eq!(response["data"]["value"], 42);
}

#[test]
fn test_api_response_error() {
    let response = serde_json::json!({
        "status": "error",
        "message": "Not found"
    });
    
    assert_eq!(response["status"], "error");
    assert!(response.get("data").is_none());
}

// Test AT command parsing
#[test]
fn test_at_csq_parsing() {
    // AT+CSQ response format: +CSQ: <rssi>,<ber>
    let response = "+CSQ: 20,99";
    
    // Extract rssi value
    if let Some(csq_idx) = response.find("+CSQ:") {
        let values = &response[csq_idx + 5..];
        let parts: Vec<&str> = values.trim().split(',').collect();
        let rssi: i32 = parts[0].parse().unwrap();
        assert_eq!(rssi, 20);
    }
}

// Test traffic stats
#[test]
fn test_traffic_format() {
    let stats = serde_json::json!({
        "rx_bytes": 1024u64 * 1024 * 512,
        "tx_bytes": 1024u64 * 1024 * 128,
        "total_bytes": 1024u64 * 1024 * 640
    });
    
    assert!(stats["rx_bytes"].as_u64().unwrap() > 0);
    assert!(stats["tx_bytes"].as_u64().unwrap() > 0);
    assert_eq!(
        stats["total_bytes"].as_u64().unwrap(),
        stats["rx_bytes"].as_u64().unwrap() + stats["tx_bytes"].as_u64().unwrap()
    );
}

// Test band lock config
#[test]
fn test_band_lock_config() {
    let config = serde_json::json!({
        "enabled": true,
        "bands": ["B1", "B3", "N78"]
    });
    
    assert!(config["enabled"].as_bool().unwrap());
    let bands = config["bands"].as_array().unwrap();
    assert_eq!(bands.len(), 3);
}

// Test signal level calculation
#[test]
fn test_signal_level_rssi() {
    fn calculate_level(rssi: i32) -> u8 {
        match rssi {
            -113..=-96 => 0,
            -95..=-89 => 1,
            -88..=-81 => 2,
            -80..=-74 => 3,
            _ => 4,
        }
    }
    
    assert_eq!(calculate_level(-100), 0);
    assert_eq!(calculate_level(-92), 1);
    assert_eq!(calculate_level(-85), 2);
    assert_eq!(calculate_level(-77), 3);
    assert_eq!(calculate_level(-60), 4);
}

// Test phone number validation (basic)
#[test]
fn test_phone_number_validation() {
    fn is_valid_number(num: &str) -> bool {
        // Remove common prefixes
        let cleaned = num.replace("+86", "").replace("86", "");
        // Check if all digits
        cleaned.chars().all(|c| c.is_ascii_digit())
    }
    
    assert!(is_valid_number("13812345678"));
    assert!(is_valid_number("+8613812345678"));
    assert!(is_valid_number("008613812345678"));
    assert!(!is_valid_number("123abc"));
}
