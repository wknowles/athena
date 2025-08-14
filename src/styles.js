import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';

// --- Setup Colors ---
export const venueStyle = new Style({
  fill: new Fill({ color: '#E5E5E5' }),
  stroke: new Stroke({ color: '#205a4dff', width: 2}),
});

// Colour palette for product codes
export const productColors = {
  "1000004": "rgba(0, 123, 255, 0.7)",   // blue
  "1000057": "rgba(255, 193, 7, 0.7)",   // yellow
  "1000059": "rgba(108, 117, 125, 0.7)", // gray
  "1000001": "rgba(40, 167, 69, 0.7)",   // green
  "1000002": "rgba(220, 53, 69, 0.7)",   // red
  "1000007": "rgba(23, 162, 184, 0.7)",  // teal
};

// Colour palette for Stand Status  
export const statusColors = {
  'Sold': 'rgba(255, 255, 255, 1)',
  'Held': 'rgba(248, 254, 236, 1)',
  'Available': 'rgba(205, 239, 244, 1)',
};

// Colour palette for Stand Type  
export const standTypeColors = {
  'Shell': 'rgba(115, 212, 171, 1)',
  'Space': 'rgba(251, 202, 239, 1)',
  'ShellFur': 'rgba(40, 167, 69, 0.7)',
};

// --- Highlight Feature Style ---
export const highlightStyle = new Style({
  fill: new Fill({ color: 'rgba(255,255,0,0.3)' }),
  stroke: new Stroke({ color: '#f00', width: 2 }),
});

// --- Toggle states for styling ---
export let showStatusFill = false;
export let showProductFill = false;
export let showStandTypeFill = false;

export function setShowStatusFill(value) { showStatusFill = value; }
export function setShowProductFill(value) { showProductFill = value; }
export function setShowStandTypeFill(value) { showStandTypeFill = value; }

// --- Styling functions ---
export function getStandFillStyle(feature) {
  const defaultStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
    stroke: new Stroke({ color: '#8a8a8aff', width: 1 }),
  });
  
  if (showStatusFill) {
    const status = feature.get('Status');
    const fillColor = statusColors[status] || 'rgba(255, 255, 255, 1)';
    let strokeColor = status === 'Sold' ? '#8a8a8aff' : fillColor;
    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: 1 }),
    });
  }
  
  if (showProductFill) {
    const code = feature.get('Product: Product Code');
    const fillColor = productColors[code] || 'rgba(108, 117, 125, 0.7)';
    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: '#319FD3', width: 1 }),
    });
  }
  
  if (showStandTypeFill) {
    const type = feature.get('Stand Type');
    const fillColor = standTypeColors[type] || 'rgba(255, 255, 255, 1)';
    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: '#319FD3', width: 1 }),
    });
  }
  
  return defaultStyle;
}