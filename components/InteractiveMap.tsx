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
}

export default function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [currentZoom, setCurrentZoom] = useState(MAP_CONFIG.zoom) // State to hold current zoom level

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
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
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
      fillOpacity: 0.85,
      weight: 0,
      interactive: false, // Make it non-interactive so clicks pass through
      className: 'blurred-overlay' // Add CSS class for blur effect
    }).addTo(map)

    // Add the visible polygon boundary
    const visiblePolygon = L.polygon(polygonCoords, {
      color: '#333',
      weight: 2,
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
        supabaseId: memory.id
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
      leafletMarker.bindPopup(popupContent)

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
      timestamp: Date.now()
    }

    // Add to state temporarily
    const updatedMarkers = [...markers, newMarker]
    setMarkers(updatedMarkers)

    // Add marker to map and open popup
    addMarkersToMap([newMarker], true)
  }

  // Create popup content for marker
  const createPopupContent = (marker: MarkerData, leafletMarker: L.Marker) => {
    const container = document.createElement('div')
    container.className = 'custom-popup'
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif'
    
    // Responsive width based on screen size
    const isMobile = window.innerWidth <= 768
    container.style.minWidth = isMobile ? '250px' : '180px'
    container.style.maxWidth = isMobile ? '280px' : '300px'

    // Check if this is a saved marker (has a comment already)
    const isExistingMarker = marker.comment.trim() !== ''

    if (isExistingMarker) {
      // Read-only view for existing markers
      const commentDisplay = document.createElement('div')
      commentDisplay.textContent = marker.comment
      commentDisplay.style.width = '100%'
      commentDisplay.style.minHeight = isMobile ? '60px' : '50px'
      commentDisplay.style.padding = isMobile ? '14px' : '12px'
      commentDisplay.style.border = '2px solid #e5e7eb'
      commentDisplay.style.borderRadius = '0'
      commentDisplay.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      commentDisplay.style.fontSize = isMobile ? '14px' : '12px'
      commentDisplay.style.lineHeight = isMobile ? '1.4' : '1.2'
      commentDisplay.style.backgroundColor = '#f9fafb'
      commentDisplay.style.color = '#374151'
      commentDisplay.style.whiteSpace = 'pre-wrap'
      commentDisplay.style.wordWrap = 'break-word'

      // const readOnlyLabel = document.createElement('div')
      // readOnlyLabel.textContent = 'Memory (read-only)'
      // readOnlyLabel.style.fontSize = isMobile ? '12px' : '10px'
      // readOnlyLabel.style.color = '#6b7280'
      // readOnlyLabel.style.marginBottom = '8px'
      // readOnlyLabel.style.fontWeight = '500'

      // container.appendChild(readOnlyLabel)
      container.appendChild(commentDisplay)
    } else {
      // Editable view for new markers
      const textarea = document.createElement('textarea')
      textarea.placeholder = 'Add your memory...'
      textarea.value = marker.comment
      textarea.style.width = '100%'
      textarea.style.minHeight = isMobile ? '60px' : '50px'
      textarea.style.padding = isMobile ? '14px' : '12px'
      textarea.style.border = '2px solid #e5e7eb'
      textarea.style.borderRadius = '0'
      textarea.style.resize = 'vertical'
      textarea.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      textarea.style.fontSize = isMobile ? '14px' : '12px'
      textarea.style.lineHeight = isMobile ? '1.4' : '1.2'
      textarea.style.outline = 'none'
      textarea.style.transition = 'border-color 0.2s ease'

      // Focus and blur effects
      textarea.addEventListener('focus', () => {
        textarea.style.borderColor = '#3b82f6'
      })
      textarea.addEventListener('blur', () => {
        textarea.style.borderColor = '#e5e7eb'
      })

      const saveButton = document.createElement('button')
      saveButton.textContent = 'Save memory'
      saveButton.style.marginTop = isMobile ? '14px' : '12px'
      saveButton.style.padding = isMobile ? '12px 24px' : '10px 20px'
      saveButton.style.backgroundColor = '#3b82f6'
      saveButton.style.color = 'white'
      saveButton.style.border = 'none'
      saveButton.style.borderRadius = '0'
      saveButton.style.cursor = 'pointer'
      saveButton.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      saveButton.style.fontSize = isMobile ? '14px' : '12px'
      saveButton.style.fontWeight = '500'
      saveButton.style.transition = 'background-color 0.2s ease'
      saveButton.style.width = '100%'
      saveButton.style.minHeight = isMobile ? '44px' : 'auto'

      // Hover effect
      saveButton.addEventListener('mouseenter', () => {
        saveButton.style.backgroundColor = '#2563eb'
      })
      saveButton.addEventListener('mouseleave', () => {
        saveButton.style.backgroundColor = '#3b82f6'
      })

      // Handle save button click
      saveButton.onclick = async () => {
        const comment = textarea.value.trim()
        
        if (comment === '') {
          alert('Please enter a memory before saving.')
          return
        }

        // Disable button while saving
        saveButton.disabled = true
        saveButton.textContent = 'Saving...'
        saveButton.style.backgroundColor = '#6b7280'

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
                    timestamp: savedMemory.created_at ? new Date(savedMemory.created_at).getTime() : Date.now()
                  }
                : m
            )
            setMarkers(updatedMarkers)
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
          saveButton.style.backgroundColor = '#3b82f6'
        }
      }

      container.appendChild(textarea)
      container.appendChild(saveButton)

      // Remove marker if popup is closed without a comment (only for new markers)
      leafletMarker.on('popupclose', () => {
        if (textarea.value.trim() === '') {
          mapInstanceRef.current?.removeLayer(leafletMarker)
          markersRef.current = markersRef.current.filter(m => m !== leafletMarker)
          const updatedMarkers = markers.filter(m => m.id !== marker.id)
          setMarkers(updatedMarkers)
        }
      })
    }

    return container
  }

  // Note: Markers are now saved directly to Supabase when created/updated
  // No need for separate storage function

  // Clear all markers (visual only - doesn't delete from database)
  const clearAllMarkers = () => {
    if (mapInstanceRef.current) {
      markersRef.current.forEach(marker => {
        mapInstanceRef.current!.removeLayer(marker)
      })
      markersRef.current = []
    }
    setMarkers([])
  }

  return (
    <div className="map-container">
      {/* Add CSS for blur effect and popup styling */}
      <style jsx>{`
        .map-container :global(.blurred-overlay) {
          filter: blur(8px);
          backdrop-filter: blur(10px);
        }
        .map-container :global(.leaflet-popup-content-wrapper) {
          border-radius: 0 !important;
        }
        .map-container :global(.leaflet-popup-tip) {
          display: none !important;
        }
        
        /* Responsive popup adjustments */
        @media (max-width: 768px) {
          .map-container :global(.leaflet-popup-content-wrapper) {
            max-width: 90vw !important;
            margin: 0 auto !important;
          }
          .map-container :global(.leaflet-popup-content) {
            margin: 8px !important;
          }
        }
        
        /* Ensure map container is responsive */
        .map-container {
          width: 100%;
          height: 100vh;
          position: relative;
        }
        
        @media (max-width: 768px) {
          .map-container {
            height: 100vh;
          }
        }
      `}</style>
      
      {/* Instructions Panel */}
      {/*<div className="instructions">
        <h3>Interactive Map</h3>
        <p>📍 Click anywhere on the map to add a marker</p>
        <button 
          onClick={clearAllMarkers}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear All Markers
        </button>
      </div> */}

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