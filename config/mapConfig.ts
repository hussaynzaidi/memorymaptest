// Map Configuration - Easily changeable for different locations
export const MAP_CONFIG = {
  // COMSATS Lahore coordinates (can be adjusted to be within the new bounds)
  center: [31.4025255, 74.210633], // A central point within the new bounds
  zoom: 16,
  
  // Custom polygon boundary for COMSATS Lahore area
  polygonBounds: [
    [74.20550737084938, 31.406192560246453],
    [74.20516020996513, 31.403528648841544],
    [74.20440869754225, 31.401389900285366],
    [74.20432349776945, 31.400924990781533],
    [74.20588784737765, 31.399901350854137],
    [74.20513106726784, 31.39888086586498],
    [74.21717278188575, 31.398691925644158],
    [74.2170621043621, 31.399523259769765],
    [74.21022223337434, 31.405569104645508],
    [74.20867274803769, 31.40570135314968],
    [74.20741102426376, 31.405814708861357],
    [74.20550737084938, 31.406192560246453]
  ],
  
  // Bounding box for maxBounds (approximate rectangle around polygon)
  bounds: {
    north: 31.406516, // North boundary
    south: 31.398535, // South boundary
    east: 74.217080,  // East boundary
    west: 74.204186   // West boundary
  }
} 