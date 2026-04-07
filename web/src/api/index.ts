import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export interface ApiResponse<T> {
  status: 'ok' | 'error'
  message: string
  data?: T
}

// ============== Device ==============
export interface DeviceInfo {
  imei: string
  iccid: string
  model: string
  firmware: string
  revision: string
}

export interface SimInfo {
  present: boolean
  imsi?: string
  iccid?: string
  locked: boolean
  operator?: string
}

export const deviceApi = {
  getInfo: () => api.get<ApiResponse<DeviceInfo>>('/device/info'),
  getSim: () => api.get<ApiResponse<SimInfo>>('/device/sim'),
}

// ============== Network ==============
export interface NetworkStatus {
  registered: boolean
  status: string
  operator?: string
  operator_code?: string
  technology?: string
}

export interface SignalStrength {
  rssi: number
  rsrp?: number
  rsrq?: number
  sinr?: number
  level: number
}

export interface CellInfo {
  type: string
  pci: number
  earfcn: number
  band?: string
  rsrp?: number
  rsrq?: number
}

export interface CellTower {
  cells: CellInfo[]
}

export const networkApi = {
  getStatus: () => api.get<ApiResponse<NetworkStatus>>('/network/status'),
  getSignal: () => api.get<ApiResponse<SignalStrength>>('/network/signal'),
  getCells: () => api.get<ApiResponse<CellTower>>('/network/cells'),
}

// ============== Control ==============
export interface DataStatus {
  enabled: boolean
}

export interface AirplaneStatus {
  enabled: boolean
}

export interface RadioModeConfig {
  mode: string
}

export interface BandLockConfig {
  enabled: boolean
  bands: string[]
}

export interface CellLockConfig {
  enabled: boolean
  pci?: number
  earfcn?: number
}

export const controlApi = {
  getData: () => api.get<ApiResponse<DataStatus>>('/control/data'),
  setData: (enabled: boolean) => api.post('/control/data', { enabled }),
  getAirplane: () => api.get<ApiResponse<AirplaneStatus>>('/control/airplane'),
  setAirplane: (enabled: boolean) => api.post('/control/airplane', { enabled }),
  getRadioMode: () => api.get<ApiResponse<RadioModeConfig>>('/control/radio'),
  setRadioMode: (mode: string) => api.post('/control/radio', { mode }),
  getBandLock: () => api.get<ApiResponse<BandLockConfig>>('/control/band-lock'),
  setBandLock: (config: BandLockConfig) => api.post('/control/band-lock', config),
  getCellLock: () => api.get<ApiResponse<CellLockConfig>>('/control/cell-lock'),
  setCellLock: (config: CellLockConfig) => api.post('/control/cell-lock', config),
}

// ============== Traffic ==============
export interface TrafficStats {
  rx_bytes: number
  tx_bytes: number
  total_bytes: number
}

export interface TrafficLimit {
  enabled: boolean
  limit_bytes?: number
  current_bytes: number
}

export const trafficApi = {
  getStats: () => api.get<ApiResponse<TrafficStats>>('/traffic/stats'),
  getLimit: () => api.get<ApiResponse<TrafficLimit>>('/traffic/limit'),
  setLimit: (config: { enabled: boolean; limit_bytes?: number }) => 
    api.post('/traffic/limit', config),
}

// ============== SMS ==============
export interface SmsMessage {
  index: number
  from: string
  to: string
  body: string
  timestamp: string
  read: boolean
}

export interface SmsListResponse {
  messages: SmsMessage[]
}

export const smsApi = {
  getList: () => api.get<ApiResponse<SmsListResponse>>('/sms/list'),
  send: (to: string, body: string) => api.post('/sms/send', { to, body }),
  delete: (index: number) => api.post('/sms/delete', { index }),
}

// ============== Call ==============
export interface CallRecord {
  id: number
  direction: 'incoming' | 'outgoing' | 'missed'
  number: string
  duration: number
  timestamp: string
}

export interface CallListResponse {
  calls: CallRecord[]
}

export const callApi = {
  getList: () => api.get<ApiResponse<CallListResponse>>('/call/list'),
  dial: (number: string) => api.post('/call/dial', { number }),
  hangup: (path: string) => api.post('/call/hangup', { path }),
  answer: (path: string) => api.post('/call/answer', { path }),
}

// ============== AT ==============
export interface AtRequest {
  cmd: string
}

export interface AtResponse {
  result: string
}

export interface AtHistoryItem {
  cmd: string
  result: string
  timestamp: number
}

export const atApi = {
  send: (cmd: string) => api.post<ApiResponse<AtResponse>>('/at/send', { cmd }),
  getHistory: () => api.get<ApiResponse<AtHistoryItem[]>>('/at/history'),
}

export default api
