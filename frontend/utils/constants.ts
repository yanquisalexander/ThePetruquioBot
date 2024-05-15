export const isDevelopment = process.env.NODE_ENV === 'development'

export enum FRONTEND_URLS {
  development = 'localhost',
  production = 'petruquio.live'
}

export enum ENDPOINTS {
  development = 'http://localhost:3000/v2',
  production = 'https://api-prod-home.petruquio.live/v2',
}

export enum SOCKET_ENDPOINTS {
  development = 'localhost:3000',
  production = 'api.petruquio.live',
}

export const FRONTEND_URL = isDevelopment ? FRONTEND_URLS.development : FRONTEND_URLS.production
export const API_ENDPOINT = isDevelopment ? ENDPOINTS.development : ENDPOINTS.production
export const SOCKET_ENDPOINT = isDevelopment ? SOCKET_ENDPOINTS.development : SOCKET_ENDPOINTS.production