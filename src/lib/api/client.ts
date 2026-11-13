import axios from 'axios'
import { API } from '../constants'
import { attachErrorInterceptor, attachGeoDbHeaders } from './interceptors'

/** OpenWeatherMap + Open-Meteo share this client and its error handling. */
export const weatherClient = axios.create({ timeout: 12000 })

/** GeoDB (RapidAPI) has its own headers and a shorter timeout. */
export const geoClient = axios.create({ baseURL: API.geoDb.baseUrl, timeout: 8000 })

/* Attach once here so every request from both clients behaves the same. */
attachErrorInterceptor(weatherClient)
attachErrorInterceptor(geoClient)
attachGeoDbHeaders(geoClient)
