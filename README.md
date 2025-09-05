# Interactive Map Prototype

A fully working web-based interactive map built with Next.js and Leaflet.js, featuring satellite imagery from ArcGIS World Imagery.

## Features

- 🗺️ **ArcGIS World Imagery Basemap**: High-quality satellite view
- 📍 **Interactive Markers**: Click anywhere on the map to drop markers
- 💬 **Comment System**: Add and edit comments for each marker
- 🔒 **Location-Bound**: Map is restricted to a specific rectangular area
- 💾 **Local Storage**: Markers and comments are saved locally
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Clean and intuitive user interface
- ➕ **Zoom Level Display**: Shows current zoom level on the bottom right

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Adding Markers
- Click anywhere within the bounded area on the map
- A marker will appear at the clicked location
- Click on the marker to add or edit a comment

### Managing Comments
- Click on any marker to open the popup
- Type your comment in the text area
- Click "Save Comment" to save your changes

### Clearing Markers
- Use the "Clear All Markers" button in the instructions panel to remove all markers

## Configuration

### Changing Map Location

To change the map location and bounds, edit the `MAP_CONFIG` object in `components/InteractiveMap.tsx`:

```typescript
const MAP_CONFIG = {
  // Change these coordinates to your desired location
  center: [31.5204, 74.3587], // [latitude, longitude]
  zoom: 15,
  bounds: {
    north: 31.5304, // North boundary
    south: 31.5104, // South boundary
    east: 74.3687,  // East boundary
    west: 74.3487   // West boundary
  }
}
```

### Example: Change to a different location

```typescript
// For New York City area
const MAP_CONFIG = {
  center: [40.7128, -74.0060],
  zoom: 12,
  bounds: {
    north: 40.8128,
    south: 40.6128,
    east: -73.9060,
    west: -74.1060
  }
}
```

## Project Structure

```
interactive-map-prototype/
├── app/
│   ├── globals.css          # Global styles and Tailwind CSS
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main page component
├── components/
│   └── InteractiveMap.tsx   # Main map component
├── config/
│   └── mapConfig.ts         # Map configuration for bounds and center
├── package.json             # Dependencies and scripts
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── tsconfig.json            # TypeScript configuration
├── .gitignore               # Git ignore file
├── README.md                # Project documentation
├── DEPLOYMENT.md            # Deployment guide
└── quick-start.md           # Quick start guide
```

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Leaflet.js**: Interactive maps library
- **ArcGIS World Imagery**: Satellite basemap tiles
- **Tailwind CSS**: Utility-first CSS framework
- **Local Storage**: Client-side data persistence

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

Build the project for production:

```bash
npm run build
npm start
```

## Customization

### Adding Backend Integration

To replace localStorage with a backend (Supabase, Firebase, etc.):

1. Update the `saveMarkersToStorage` function to call your API
2. Update the `loadMarkersFromStorage` function to fetch from your API
3. Add authentication if needed

### Example with Supabase:

```typescript
// Install: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY')

const saveMarkersToStorage = async (markerData: MarkerData[]) => {
  const { error } = await supabase
    .from('markers')
    .upsert(markerData)
  
  if (error) console.error('Error saving markers:', error)
}
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 