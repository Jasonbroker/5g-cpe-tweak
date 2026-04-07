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

// API functions
export const deviceApi = {
  getInfo: () => api.get<ApiResponse<DeviceInfo>>('/device/info'),
  getSim: () => api.get<ApiResponse<SimInfo>>('/device/sim'),
}

export const networkApi = {
  getStatus: () => api.get<ApiResponse<NetworkStatus>>('/network/status'),
  getSignal: () => api.get<ApiResponse<SignalStrength>>('/network/signal'),
  getCells: () => api.get('/network/cells'),
}

export const controlApi = {
  getData: () => api.get('/control/data'),
  setData: (enabled: boolean) => api.post('/control/data', { enabled }),
  getAirplane: () => api.get('/control/airplane'),
  setAirplane: (enabled: boolean) => api.post('/control/airplane', { enabled }),
}

export const atApi = {
  send: (cmd: string) => api.post<ApiResponse<AtResponse>>('/at/send', { cmd }),
  getHistory: () => api.get<ApiResponse<AtHistoryItem[]>>('/at/history'),
}

export default api
