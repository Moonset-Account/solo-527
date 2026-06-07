const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

function encodeGeoHash(lng: number, lat: number, precision: number = 8): string {
  let latRange = [-90, 90]
  let lngRange = [-180, 180]
  let hash = ''
  let bits = 0
  let bitCount = 0
  let isLng = true

  while (hash.length < precision) {
    const mid = isLng
      ? (lngRange[0] + lngRange[1]) / 2
      : (latRange[0] + latRange[1]) / 2

    if (isLng ? lng >= mid : lat >= mid) {
      bits = bits * 2 + 1
      if (isLng) lngRange[0] = mid
      else latRange[0] = mid
    } else {
      bits = bits * 2
      if (isLng) lngRange[1] = mid
      else latRange[1] = mid
    }

    isLng = !isLng
    bitCount++

    if (bitCount === 5) {
      hash += BASE32[bits]
      bits = 0
      bitCount = 0
    }
  }

  return hash
}

function decodeGeoHashBbox(hash: string): { minLng: number; maxLng: number; minLat: number; maxLat: number } {
  let latRange = [-90, 90]
  let lngRange = [-180, 180]
  let isLng = true

  for (let i = 0; i < hash.length; i++) {
    const idx = BASE32.indexOf(hash[i])
    for (let bit = 4; bit >= 0; bit--) {
      const mask = 1 << bit
      const mid = isLng
        ? (lngRange[0] + lngRange[1]) / 2
        : (latRange[0] + latRange[1]) / 2

      if (idx & mask) {
        if (isLng) lngRange[0] = mid
        else latRange[0] = mid
      } else {
        if (isLng) lngRange[1] = mid
        else latRange[1] = mid
      }
      isLng = !isLng
    }
  }

  return {
    minLng: lngRange[0],
    maxLng: lngRange[1],
    minLat: latRange[0],
    maxLat: latRange[1]
  }
}

export function getGeoHash(lng: number, lat: number, precision: number = 8): string {
  return encodeGeoHash(lng, lat, precision)
}

export function queryByGeoHashPrefix(
  items: Array<{ lng: number; lat: number; geoHash: string; [k: string]: any }>,
  prefix: string
): typeof items {
  return items.filter(item => item.geoHash.startsWith(prefix))
}

export function queryByBbox(
  items: Array<{ lng: number; lat: number; [k: string]: any }>,
  minLng: number,
  maxLng: number,
  minLat: number,
  maxLat: number
): typeof items {
  return items.filter(
    item => item.lng >= minLng && item.lng <= maxLng && item.lat >= minLat && item.lat <= maxLat
  )
}

export function getGeoHashBbox(hash: string) {
  return decodeGeoHashBbox(hash)
}

export function getNeighbors(hash: string): string[] {
  const neighbors: Record<string, string[]> = {
    n: [], ne: [], e: [], se: [], s: [], sw: [], w: [], nw: []
  }
  const bbox = decodeGeoHashBbox(hash)
  const centerLng = (bbox.minLng + bbox.maxLng) / 2
  const centerLat = (bbox.minLat + bbox.maxLat) / 2
  const lngStep = bbox.maxLng - bbox.minLng
  const latStep = bbox.maxLat - bbox.minLat

  const offsets: Array<[string, number, number]> = [
    ['n', 0, latStep],
    ['ne', lngStep, latStep],
    ['e', lngStep, 0],
    ['se', lngStep, -latStep],
    ['s', 0, -latStep],
    ['sw', -lngStep, -latStep],
    ['w', -lngStep, 0],
    ['nw', -lngStep, latStep]
  ]

  offsets.forEach(([dir, dLng, dLat]) => {
    neighbors[dir] = [encodeGeoHash(centerLng + dLng, centerLat + dLat, hash.length)]
  })

  return Object.values(neighbors).flat()
}

export function buildSpatialIndex(
  items: Array<{ lng: number; lat: number; [k: string]: any }>
): Map<string, Array<typeof items[number]>> {
  const index = new Map<string, Array<typeof items[number]>>()

  items.forEach(item => {
    const prefix6 = encodeGeoHash(item.lng, item.lat, 6)
    if (!index.has(prefix6)) {
      index.set(prefix6, [])
    }
    index.get(prefix6)!.push(item)
  })

  return index
}
