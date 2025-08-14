import { gridSize } from './config.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';

// -- Function to wrap Exhibitor Name so it runs multiple lines ---
export function wrapExhibitorName(text, maxLen) {
  if (!text) return '';
  
  // If text is shorter than maxLen, return as-is
  if (text.length <= maxLen) return text;
  
  const words = text.split(' ');
  let lines = [];
  let line = '';
  
  words.forEach(word => {
    if ((line + word).length > maxLen) {
      if (line.trim()) lines.push(line.trim());
      line = word + ' ';
    } else {
      line += word + ' ';
    }
  });
  
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n');
}

// -- Exhibitor and StandID Labels ---
export function standNameLabel(feature, map) {
  const displayName = wrapExhibitorName(feature.get('Display Name'), 16);
  const standID = feature.get('standID');
  const geometry = feature.getGeometry();
  const center = geometry.getInteriorPoint ? geometry.getInteriorPoint() : geometry.getClosestPoint();

  // Get current map resolution (smaller = more zoomed in)
  const resolution = map.getView().getResolution();

  // Calculate feature dimensions
  const extent = geometry.getExtent();
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];

  // Convert to pixels for better font size calculation
  const widthInPixels = width / resolution;
  const heightInPixels = height / resolution;

  // --- Count lines in displayName ---
  const displayNameLines = displayName.split('\n').length;

  // Calculate font size that fits within the feature bounds
  const minFont = 8;
  const maxFont = 16;
  
  // Calculate max font size based on width (longest line should fit within feature bounds)
  const longestLine = displayName.split('\n').reduce((longest, line) => 
    line.length > longest.length ? line : longest, '');
  const maxFontByWidth = Math.floor(widthInPixels / (longestLine.length * 0.6)); // 0.6 is char width ratio
  
  // Calculate max font size based on height (all lines should fit)
  const totalTextHeight = displayNameLines + (standID ? 1 : 0); // +1 for standID if exists
  const maxFontByHeight = Math.floor(heightInPixels / (totalTextHeight * 1.4)); // 1.4 is line height ratio
  
  // Use the smaller of the two constraints
  let fontSize = Math.min(maxFontByWidth, maxFontByHeight);
  fontSize = Math.max(minFont, Math.min(maxFont, fontSize));
 
  // Calculate vertical offset with the new fontSize
  const lineHeight = fontSize * 1.1;
  let displayNameOffset = 0;
  let standIDOffset = 0;

  if (displayName && displayName.trim()) {
    // Calculate total heights
    const displayNameHeight = displayNameLines * lineHeight;
    const standIDHeight = standID ? fontSize * 0.8 : 0; // standID font is 0.8 of fontSize
    const totalTextHeight = displayNameHeight + standIDHeight;
    const gapBetweenTexts = standID ? fontSize * 0.8 : 0; // Small gap between texts
    
    // Center the entire text block within the feature
    const blockStartY = -(totalTextHeight + gapBetweenTexts) / 2;
    
    // Position displayName at the top of the centered block
    displayNameOffset = blockStartY + (displayNameHeight / 2);
    
    // Position standID below displayName
    standIDOffset = blockStartY + displayNameHeight + gapBetweenTexts + (standIDHeight / 2);
  } else {
    // If no displayName, center the standID
    standIDOffset = 0;
  }

  // Style for displayName
  const styles = [];

  if (displayName && displayName.trim()) {
    const displayNameStyle = new Style({
      geometry: center,
      text: new Text({
        text: displayName,
        font: `800 ${fontSize}px Lato, sans-serif`,
        fill: new Fill({ color: '#14213D'}),
        stroke: new Stroke({ color: '#fff', width: 2}),
        textAlign: 'center',
        textBaseline: 'middle',
        offsetY: displayNameOffset,
        overflow: false,
      }),
    });
    styles.push(displayNameStyle);
  }

  // Style for standID
  if (standID) {
    const standIDStyle = new Style({
      geometry: center,
      text: new Text({
        text: String(standID),
        font: `italic 400 ${fontSize * 0.8}px Lato, sans-serif`,
        fill: new Fill({ color: '#14213D' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
        textAlign: 'center',
        textBaseline: 'middle',
        offsetY: standIDOffset,
        overflow: false,
      }),
    });
    styles.push(standIDStyle);
  }

  return styles;
}

// Grid snapping function
export function snapToGrid(coord) {
  // Assuming your map units are meters
  return coord.map(c => Math.round(c / gridSize) * gridSize);
}

// Show width, length, and area of stand when drawing
export function showDrawInfo(length, width, area) {
  const infoDiv = document.getElementById('stand-draw-info');
  const dimsSpan = document.getElementById('stand-draw-dimensions');
  dimsSpan.innerHTML = `
    <b>Length:</b> ${length.toFixed(2)} m<br>
    <b>Width:</b> ${width.toFixed(2)} m<br>
    <b>Area:</b> ${area.toFixed(2)} m²
  `;
  infoDiv.style.display = 'block';
}

export function hideDrawInfo() {
  document.getElementById('stand-draw-info').style.display = 'none';
}