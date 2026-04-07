// Change BASE_URL to your machine's LAN IP when running on a physical device,
// e.g. "http://192.168.1.42:8000/api"
export const BASE_URL = __DEV__ ? 'http://localhost:8000/api' : 'https://your-production-api.com/api';

export const PERIODS = ['1d', '5d', '1mo', '3mo', '6mo', '1y'] as const;
export const INTERVALS = ['1m', '5m', '15m', '1h', '1d', '1wk'] as const;

export type Period = (typeof PERIODS)[number];
export type Interval = (typeof INTERVALS)[number];
