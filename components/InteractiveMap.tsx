'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { MAP_CONFIG } from '../config/mapConfig'
import { createMemory, getMemories, type Memory } from '../utils/memories'

// Types for our marker data
interface MarkerData {
  id: string
  lat: number
  lng: number
  comment: string
  timestamp: number
  saved?: boolean
}

export default function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [currentZoom, setCurrentZoom] = useState(MAP_CONFIG.zoom) // State to hold current zoom level

  // Helper: for UNSAVED markers, closing the popup should discard the marker
  // Returns a function to detach this behavior (used after a successful save)
  const attachRemoveOnClose = (
    leafletMarker: L.Marker,
    _textarea: HTMLTextAreaElement,
    markerId: string
  ): (() => void) => {
    const handler = () => {
      // Always remove the temporary marker when popup closes (unless detached)
      mapInstanceRef.current?.removeLayer(leafletMarker)
      markersRef.current = markersRef.current.filter(m => m !== leafletMarker)
      const updatedMarkers = markers.filter(m => m.id !== markerId)
      setMarkers(updatedMarkers)
    }
    leafletMarker.on('popupclose', handler)
    return () => leafletMarker.off('popupclose', handler)
  }

  // Initialize map on component mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: MAP_CONFIG.center as [number, number],
      zoom: MAP_CONFIG.zoom,
      zoomControl: false, // Disable default zoom control
      maxBounds: [
        [MAP_CONFIG.bounds.south, MAP_CONFIG.bounds.west],
        [MAP_CONFIG.bounds.north, MAP_CONFIG.bounds.east]
      ],
      maxBoundsViscosity: 1.0, // Prevent dragging outside bounds
      minZoom: 16, // Prevent zooming out too far from the university area
      maxZoom: 19 // Increased maxZoom to allow zooming in further
    })

    // Add ArcGIS World Imagery basemap
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Source: Esri',
      maxZoom: 19 // Increased maxZoom to match map instance
    }).addTo(map)

    // Add custom zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Create white blurry overlay to hide areas outside the custom polygon
    // Convert polygon coordinates to Leaflet format [lat, lng]
    const polygonCoords: L.LatLngExpression[] = MAP_CONFIG.polygonBounds.map(coord => [coord[1], coord[0]])

    // Create a polygon that covers the world but has a hole for the custom area
    const maskCoords: L.LatLngExpression[][] = [
      // Outer ring (world bounds)
      [[-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180]],
      // Inner ring (custom polygon bounds - this creates the "hole")
      polygonCoords
    ]

    // Add the mask polygon with blur effect
    const maskPolygon = L.polygon(maskCoords, {
      color: 'white',
      fillColor: 'white',
      fillOpacity: 0.90,
      weight: 0,
      interactive: false, // Make it non-interactive so clicks pass through
      className: 'blurred-overlay' // Add CSS class for blur effect
    }).addTo(map)

    // Add the visible polygon boundary (white outline)
    const visiblePolygon = L.polygon(polygonCoords, {
      color: 'white',
      weight: 3,
      fillOpacity: 0,
      interactive: false
    }).addTo(map)

    // Store map instance and initial zoom
    mapInstanceRef.current = map
    setCurrentZoom(map.getZoom()) // Set initial zoom level

    // Listen for zoom changes
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom())
    })

    // Load existing markers from Supabase
    loadMarkersFromSupabase()

    // Add click event listener for adding new markers
    map.on('click', handleMapClick)

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Load markers from Supabase
  const loadMarkersFromSupabase = async () => {
    try {
      const memories = await getMemories()
      const markerData: MarkerData[] = memories.map(memory => ({
        id: memory.id || Date.now().toString(),
        lat: memory.lat,
        lng: memory.lng,
        comment: memory.comment,
        timestamp: memory.created_at ? new Date(memory.created_at).getTime() : Date.now(),
        saved: true
      }))
      setMarkers(markerData)
      addMarkersToMap(markerData)
    } catch (error) {
      console.error('Error loading markers from Supabase:', error)
    }
  }

  // Add markers to the map
  const addMarkersToMap = (markerData: MarkerData[], openPopup: boolean = false) => {
    if (!mapInstanceRef.current) return

    markerData.forEach(marker => {
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#e0c724" viewBox="0 0 256 256"><path d="M128,24a80,80,0,0,0-80,80c0,72,80,128,80,128s80-56,80-128A80,80,0,0,0,128,24Zm0,112a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z" opacity="0.2"></path><path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path></svg>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        })
      }).addTo(mapInstanceRef.current!)

      // Create popup with comment
      const popupContent = createPopupContent(marker, leafletMarker)
      // Allow wider content and attach a class to the popup wrapper
      leafletMarker.bindPopup(popupContent, {
        maxWidth: 420,
        minWidth: 220,
        className: 'custom-popup',
        offset: L.point(0, -20) // lift popup above marker so location stays visible
      })

      if (openPopup) {
        leafletMarker.openPopup()
      }

      markersRef.current.push(leafletMarker)
    })
  }

  // Function to check if a point is inside the polygon
  const isPointInPolygon = (lat: number, lng: number): boolean => {
    const polygon = MAP_CONFIG.polygonBounds
    let inside = false

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1]
      const xj = polygon[j][0], yj = polygon[j][1]

      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }

    return inside
  }

  // Handle map click to add new marker
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng

    // Check if click is within the custom polygon
    if (!isPointInPolygon(lat, lng)) {
      return
    }

    // Create new marker data (temporary, will be saved to Supabase when comment is added)
    const newMarker: MarkerData = {
      id: Date.now().toString(),
      lat,
      lng,
      comment: '',
      timestamp: Date.now(),
      saved: false
    }

    // Add to state temporarily
    const updatedMarkers = [...markers, newMarker]
    setMarkers(updatedMarkers)

    // Add marker to map and open popup
    addMarkersToMap([newMarker], true)
  }

  // Create popup content for marker
  const createPopupContent = (marker: MarkerData, leafletMarker: L.Marker) => {
    // Responsive width based on screen size
    const isMobile = window.innerWidth <= 768

    // Create content area
    const dialogContent = document.createElement('div')
    dialogContent.className = `dialog-content${isMobile ? ' mobile' : ''}`

    // Check if this is a saved marker (has a comment already)
    const isExistingMarker = marker.saved === true

    if (isExistingMarker) {
      // Add memory text for existing markers
      const memoryText = document.createElement('p')
      memoryText.className = `memory-text${isMobile ? ' mobile' : ''}`
      memoryText.textContent = marker.comment
      dialogContent.appendChild(memoryText)
    } else {
      const inputWrapper = document.createElement('div')
      inputWrapper.className = `input-wrapper${isMobile ? ' mobile' : ''}`
      // Add textarea and save button for new markers
      const textarea = document.createElement('textarea')
      textarea.className = `memory-textarea${isMobile ? ' mobile' : ''}`
      textarea.placeholder = 'Tell us about a memory (20 characters min)...'
      textarea.value = marker.comment

      const saveButton = document.createElement('button')
      saveButton.className = `save-memory-btn${isMobile ? ' mobile' : ''}`
      saveButton.textContent = 'Save memory'
      // Disable until minimum length reached
      saveButton.disabled = textarea.value.trim().length < 20

      // Enable/disable button based on input length
      textarea.addEventListener('input', () => {
        const len = textarea.value.trim().length
        saveButton.disabled = len < 20
      })

      // Attach auto-remove on popup close for UNSAVED marker
      let detachOnClose = attachRemoveOnClose(leafletMarker, textarea, marker.id)

      // Handle save button click
      saveButton.onclick = async () => {
        const comment = textarea.value.trim()

        if (comment.length < 20) {
          return
        }

        // Disable button while saving
        saveButton.disabled = true
        saveButton.textContent = 'Saving...'

        try {
          // Save to Supabase
          const savedMemory = await createMemory({
            comment,
            lat: marker.lat,
            lng: marker.lng
          })

          if (savedMemory) {
            // Update marker with Supabase data
            const updatedMarkers = markers.map(m =>
              m.id === marker.id
                ? {
                  ...m,
                  comment,
                  timestamp: savedMemory.created_at ? new Date(savedMemory.created_at).getTime() : Date.now(),
                  saved: true
                }
                : m
            )
            setMarkers(updatedMarkers)
            detachOnClose()
            leafletMarker.closePopup()
          } else {
            alert('Failed to save memory. Please try again.')
          }
        } catch (error) {
          console.error('Error saving memory:', error)
          alert('Failed to save memory. Please try again.')
        } finally {
          // Re-enable button
          saveButton.disabled = false
          saveButton.textContent = 'Save memory'
        }
      }

      inputWrapper.appendChild(textarea)
      inputWrapper.appendChild(saveButton)
      dialogContent.appendChild(inputWrapper)
    }
    // Return dialog content directly; styling is handled by Leaflet popup class and CSS
    return dialogContent
  }

  return (
    <div className="map-container">
      {/* Zoom Level Display */}
      <div className="zoom-level-display" style={{
        position: 'absolute',
        bottom: '10px', // Changed from top to bottom
        right: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#333',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        Zoom: {currentZoom}
      </div>

      {/* Map Container */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Attribution */}
      {/* <div className="attribution">
        © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community
      </div> */}
    </div>
  )
} 