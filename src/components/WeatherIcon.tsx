import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from 'lucide-react'

const ICONS = {
  sun: Sun,
  partly: CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: CloudSnow,
  fog: CloudFog,
} as const

interface WeatherIconProps {
  name: string
  size?: number
  className?: string
}

/** One icon set for every provider, so condition names map to a consistent drawing. */
export function WeatherIcon({ name, size = 24, className }: WeatherIconProps) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Cloud
  return <Icon size={size} strokeWidth={1.6} className={className} aria-hidden="true" />
}
