import { useEffect, useState } from 'react'

// 광역시(작은 범위)를 도(넓은 범위)보다 먼저 검사 — 첫 매칭 우선이므로 순서 중요
const REGION_MAP = [
  { name: '서울특별시', lat: [37.4, 37.7], lng: [126.7, 127.2] },
  { name: '인천광역시', lat: [37.2, 37.8], lng: [126.0, 126.9] },
  { name: '대전광역시', lat: [36.1, 36.5], lng: [127.2, 127.6] },
  { name: '세종특별자치시', lat: [36.4, 36.7], lng: [127.1, 127.4] },
  { name: '대구광역시', lat: [35.7, 36.0], lng: [128.4, 128.8] },
  { name: '부산광역시', lat: [35.0, 35.4], lng: [128.8, 129.3] },
  { name: '울산광역시', lat: [35.3, 35.7], lng: [129.0, 129.5] },
  { name: '광주광역시', lat: [35.0, 35.3], lng: [126.7, 127.0] },
  { name: '제주도', lat: [33.1, 33.7], lng: [126.1, 126.9] },
  { name: '경기도', lat: [36.9, 38.3], lng: [126.1, 127.9] },
  { name: '강원도', lat: [37.0, 38.6], lng: [127.1, 129.4] },
  { name: '충청북도', lat: [36.2, 37.3], lng: [127.2, 128.5] },
  { name: '충청남도', lat: [36.0, 37.1], lng: [125.9, 127.5] },
  { name: '경상북도', lat: [35.6, 37.1], lng: [127.8, 129.6] },
  { name: '경상남도', lat: [34.6, 36.0], lng: [127.5, 129.4] },
  { name: '전라북도', lat: [35.3, 36.2], lng: [126.1, 127.9] },
  { name: '전라남도', lat: [34.0, 35.6], lng: [125.6, 127.9] },
]

function coordsToRegion(lat, lng) {
  for (const r of REGION_MAP) {
    if (lat >= r.lat[0] && lat <= r.lat[1] && lng >= r.lng[0] && lng <= r.lng[1]) {
      return r.name
    }
  }
  return '경기도'
}

export function useRegion() {
  const [region, setRegion] = useState(localStorage.getItem('region') || null)
  const [loading, setLoading] = useState(!region)

  useEffect(() => {
    if (region) return

    if (!navigator.geolocation) {
      setRegion('경기도')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const detected = coordsToRegion(coords.latitude, coords.longitude)
        setRegion(detected)
        localStorage.setItem('region', detected)
        setLoading(false)
      },
      () => {
        setRegion('경기도')
        setLoading(false)
      },
      { timeout: 5000 }
    )
  }, [region])

  const changeRegion = (r) => {
    setRegion(r)
    localStorage.setItem('region', r)
  }

  return { region, loading, changeRegion }
}
