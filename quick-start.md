# Quick Start Guide

## Running the Project

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    ```

3.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1.  **Add Markers**: Click anywhere on the map within the bounded area
2.  **Add Comments**: Click on any marker to open a popup and add/edit comments
3.  **Clear Markers**: Use the "Clear All Markers" button in the top-left panel
4.  **Data Persistence**: All markers and comments are automatically saved in your browser

## Change Map Location

To change the map location and bounds, edit `config/mapConfig.ts`:

```typescript
export const MAP_CONFIG = {
    center: [YOUR_LAT, YOUR_LNG] as [number, number],
    zoom: 15,
    bounds: {
        north: YOUR_NORTH_BOUND,
        south: YOUR_SOUTH_BOUND,
        east: YOUR_EAST_BOUND,
        west: YOUR_WEST_BOUND
    }
};
```

## Example Coordinates

-   **COMSATS Lahore**: `[31.4025255, 74.210633]`
-   **New York City**: `[40.7128, -74.0060]`
-   **London**: `[51.5074, -0.1278]`
-   **Tokyo**: `[35.6762, 139.6503]`

## Features Included

✅ ArcGIS World Imagery satellite basemap  
✅ Location-bounded map area  
✅ Click-to-add markers  
✅ Comment system for each marker  
✅ Local storage persistence  
✅ Responsive design  
✅ Esri attribution  
✅ Clear all markers functionality  
✅ Modern UI with instructions panel  
✅ Zoom level display on the bottom right

## Ready to Deploy

This project is built with Next.js and can be deployed to Vercel, Netlify, or any Node.js hosting platform. 