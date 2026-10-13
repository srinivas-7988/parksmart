import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'

const BANGALORE_HUBS = [
  { name: 'Brigade Road', lat: 12.9733, lng: 77.6074, avail: 72, total: 40, area: 'Central Bangalore' },
  { name: 'Commercial Street', lat: 12.9822, lng: 77.6083, avail: 45, total: 32, area: 'Shivajinagar' },
  { name: 'MG Road', lat: 12.9756, lng: 77.6095, avail: 61, total: 48, area: 'CBD' },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, avail: 83, total: 36, area: 'East Bangalore' },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245, avail: 38, total: 44, area: 'South-East' },
  { name: 'Jayanagar', lat: 12.9308, lng: 77.5838, avail: 91, total: 30, area: 'South Bangalore' },
  { name: 'Orion Mall', lat: 13.0112, lng: 77.5550, avail: 56, total: 80, area: 'Rajajinagar' },
  { name: 'Garuda Mall', lat: 12.9702, lng: 77.6098, avail: 29, total: 60, area: 'Magrath Road' },
]

export default function ParkingMap() {
  const { quickBook, showToast } = useApp()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [selectedHub, setSelectedHub] = useState(BANGALORE_HUBS[0])
  const [isLeafletReady, setIsLeafletReady] = useState(false)

  useEffect(() => {
    // Check if Leaflet is loaded
    if (typeof window !== 'undefined' && window.L) {
      setIsLeafletReady(true)
    } else {
      const interval = setInterval(() => {
        if (typeof window !== 'undefined' && window.L) {
          setIsLeafletReady(true)
          clearInterval(interval)
        }
      }, 500)
      return () => clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current) return

    // Avoid duplicate initialization
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    try {
      const L = window.L

      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.6000],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      })

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map)

      // Add Markers
      BANGALORE_HUBS.forEach((hub) => {
        const isFree = hub.avail > 40
        const color = isFree ? '#00c896' : '#ef4444'

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="
              background: ${color};
              color: #fff;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: 800;
              box-shadow: 0 4px 12px rgba(0,0,0,0.35);
              border: 2px solid #ffffff;
              cursor: pointer;
            ">
              🅿
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([hub.lat, hub.lng], { icon: customIcon }).addTo(map)

        marker.on('click', () => {
          setSelectedHub(hub)
          map.setView([hub.lat, hub.lng], 13, { animate: true })
        })
      })

      mapInstanceRef.current = map
    } catch (err) {
      console.warn('Map initialization notice:', err)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isLeafletReady])

  const handleBookNow = (hubName) => {
    showToast('Selecting Hub', `Opening slots for ${hubName}`)
    quickBook(hubName, 2)
  }

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([12.9716, 77.6000], 12, { animate: true })
    }
  }

  return (
    <div className="card fade" style={{ padding: '0.85rem', marginBottom: '1.25rem' }}>
      <div className="row-between" style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1.1rem' }}>🗺️</span>
          <b style={{ fontSize: '0.9rem' }}>Bangalore Parking Hubs</b>
        </div>
        <button
          className="quick-test-chip"
          onClick={handleRecenter}
          title="Recenter Map"
          style={{ cursor: 'pointer' }}
        >
          📍 Center
        </button>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '220px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'rgba(var(--fgc), 0.05)',
          position: 'relative',
        }}
      >
        {!isLeafletReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(var(--fgc), 0.5)',
              fontSize: '0.85rem',
            }}
          >
            Loading Interactive City Map...
          </div>
        )}
      </div>

      {/* Selected Hub Detail Bar */}
      {selectedHub && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'rgba(var(--fgc), 0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(var(--fgc), 0.06)',
          }}
        >
          <div className="row-between" style={{ marginBottom: '0.4rem' }}>
            <div>
              <b style={{ fontSize: '0.92rem', color: 'var(--text)' }}>{selectedHub.name}</b>
              <div className="muted" style={{ fontSize: '0.72rem' }}>{selectedHub.area} · ₹30/hr</div>
            </div>
            <span
              className={`status-pill ${selectedHub.avail > 40 ? 'bg-green' : 'bg-amber'}`}
              style={{ color: selectedHub.avail > 40 ? '#22c55e' : '#f59e0b' }}
            >
              {selectedHub.avail}% Available
            </span>
          </div>

          <button
            className="btn-sm"
            style={{ width: '100%', marginTop: '0.4rem', padding: '0.6rem' }}
            onClick={() => handleBookNow(selectedHub.name)}
          >
            Reserve at {selectedHub.name} →
          </button>
        </div>
      )}
    </div>
  )
}
