import axios, { type AxiosInstance } from 'axios'
import { API, MESSAGES } from '../constants'
import type { ApiError } from '../types'

/** Turn provider and network failures into one message the UI can show. */
export function toApiError(error: unknown): ApiError {
  if (axios.isCancel(error)) {
    return { message: '', kind: 'canceled' }
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return { message: MESSAGES.network, kind: 'network' }
    }

    const status = error.response.status
    if (status === 404) return { message: MESSAGES.cityNotFound, kind: 'not-found' }
    if (status === 429) return { message: MESSAGES.rateLimit, kind: 'rate-limit' }
    if (status >= 500) return { message: MESSAGES.server, kind: 'server' }
    return { message: MESSAGES.server, kind: 'unknown' }
  }

  return { message: MESSAGES.server, kind: 'unknown' }
}

/** Every client rejects with the same friendly `ApiError` shape. */
export function attachErrorInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(toApiError(error)),
  )
}

/** GeoDB is a RapidAPI service, so its key and host travel with every request. */
export function attachGeoDbHeaders(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    config.headers.set('X-RapidAPI-Key', API.geoDb.key)
    config.headers.set('X-RapidAPI-Host', API.geoDb.host)
    return config
  })
}
