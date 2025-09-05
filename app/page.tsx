'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the Map component to avoid SSR issues with Leaflet
const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="map-container flex items-center justify-center">
      <div className="text-lg">Loading map...</div>
    </div>
  ),
})

export default function Home() {
  return (
    <main className="map-container">
      <Suspense fallback={<div>Loading...</div>}>
        <InteractiveMap />
      </Suspense>
    </main>
  )
} 