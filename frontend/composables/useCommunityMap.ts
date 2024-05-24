export const useCommunityMap = () => {
    const fetchMapData = async (channelName: string) => {
        const response = await fetch(`${API_ENDPOINT}/worldmap/${channelName}`)
        if (!response.ok) {
            throw new Error(`Failed to fetch map data for ${channelName}`)
        }
        const data = await response.json()
        return data
    }
    const createMap = async (mapElement: HTMLElement) => {
        const L = (await import('leaflet')).default;
        const map = L.map(mapElement)
        map.
            attributionControl
            .setPrefix(false)
        return map

    }

    const createTileLayer = async (map: L.Map) => {
        const L = (await import('leaflet')).default;
        L.tileLayer('https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            minZoom: 2,
        })
        .addTo(map)
    }

    const createMarker = async (map: L.Map, lat: string, lng: string, options?: any) => {
        const L = (await import('leaflet')).default;
        const latitude = parseFloat(lat) + (Math.random() - 0.5) * 0.02;
        const longitude = parseFloat(lng) + (Math.random() - 0.5) * 0.02;
        const marker = L.marker([latitude, longitude])
        Object
            .entries(options)
            .forEach(([key, value]) => {
                // @ts-ignore
                marker.options[key] = value
            })


        // Don't add to map yet, because we want to customize the marker first
        return marker
    }

    return {
        fetchMapData,
        createMap,
        createTileLayer,
        createMarker,
    }
}
