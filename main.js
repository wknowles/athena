import './style.css';
import {Map, View} from 'ol';
import {defaults as defaultControls} from 'ol/control/defaults.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import Link from 'ol/interaction/Link.js';
import TileLayer from 'ol/layer/Tile';
import {apply} from 'ol-mapbox-style';
import {fromLonLat} from 'ol/proj.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Point from 'ol/geom/Point.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import Draw from 'ol/interaction/Draw';
import Polygon from 'ol/geom/Polygon';

// --- Config ---
const venueLonLat = [0.029912, 51.508144];
const extentValue = 1500;
const defaultZoom = 17;
// const defaultRotation = 1.570796;  // 90 degrees in radians
const defaultRotation = 0; // No rotation
const link = new Link();

// --- Center & Extents ---
let center = fromLonLat(venueLonLat);
let zoom = defaultZoom;
let rotation = defaultRotation;
const [x, y] = center;
const extents = [x - extentValue, y - extentValue, x + extentValue, y + extentValue];

// --- Setup Colors ---
const venueStyle = new Style({
    fill: new Fill({ color: '#E5E5E5' }),
    stroke: new Stroke({ color: '#205a4dff', width: 2}),
  });
  
// Colour palette for product codes
const productColors = {
  "1000004": "rgba(0, 123, 255, 0.7)",   // blue
  "1000057": "rgba(255, 193, 7, 0.7)",   // yellow
  "1000059": "rgba(108, 117, 125, 0.7)", // gray
  "1000001": "rgba(40, 167, 69, 0.7)",   // green
  "1000002": "rgba(220, 53, 69, 0.7)",   // red
  "1000007": "rgba(23, 162, 184, 0.7)",  // teal
};
// Colour palette for Stand Status  
const statusColors = {
  'Sold': 'rgba(255, 255, 255, 1)',
  'Held': 'rgba(248, 254, 236, 1)',
  'Available': 'rgba(205, 239, 244, 1)',
};
// Colour palette for Stand Type
const standTypeColors = {
  'Shell': 'rgba(115, 212, 171, 1)',
  'Space': 'rgba(251, 202, 239, 1)',
  'ShellFur': 'rgba(40, 167, 69, 0.7)',
};

// --- Styling stands ---
let showStatusFill = false;
let showProductFill = false;
let showStandTypeFill = false;

function getStandFillStyle(feature) {
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
      stroke: new Stroke({ color: strokeColor , width: 1 }),
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

// -- Function to wrap Exhibitor Name so it runs multiple lines ---
const standNameLabel = (feature) => {
  function wrapExhibitorName(text, maxLen) {
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
};

// --- Scale Control ---
const scaleControl = () =>
  new ScaleLine({
    units: "metric",
    bar: true,
    steps: 5,
    text: false,
    minWidth: 140,
  });

  // --- Venue Layer ---
const venueLayer = new VectorLayer({
  source: new VectorSource({
    url: import.meta.env.BASE_URL + 'WTMKT25venue.geojson',
    format: new GeoJSON(),
  }),
  // maxResolution: 0.4,
  style: venueStyle,
});

// --- Stands Layer ---
const standsLayer = new VectorLayer({
  declutter: true,
  source: new VectorSource({
    url: import.meta.env.BASE_URL + 'WTMKT25.geojson',
    format: new GeoJSON(),
  }),
  style: feature => [
    ...standNameLabel(feature),
    getStandFillStyle(feature),
  ],
});

 // --- Stand Area Labels ---
const standAreaLayer = new VectorLayer({
  source: new VectorSource({
    url: import.meta.env.BASE_URL + 'WTMKT25.geojson',
    format: new GeoJSON(),
  }),
  maxResolution: 0.15,
  style: feature => {
    const area = feature.get('Area') || '';
    const extent = feature.getGeometry().getExtent();
    const bottomRight = [extent[2], extent[1]];
    // Create a new style with the label at the bottom right corner
    return new Style({
      geometry: new Point(bottomRight),
      text: new Text({
        text: String(area),
        font: 'italic 8px Calibri,sans-serif',
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#fff', width: 4 }),
        offsetX: -8, // adjust as needed to avoid clipping
        offsetY: -6,  // adjust as needed to avoid clipping
        textAlign: 'right',
        textBaseline: 'bottom',
      }),
    });
  }
});

// --- Map ---
const map = new Map({
  controls: defaultControls().extend([scaleControl()]),
  target: 'map',
  view: new View({
    center: center,
    zoom: zoom,
    rotation: rotation,
    extent: extents,
  })
});
// Apply MapTiler Streets v2 style
apply(map, 'https://api.maptiler.com/maps/0198936d-95b3-7462-83fb-1066bb038158/style.json?key=L7Xr1fJJ4jBWX3rjyRgA')
  .then(() => {
    // Store references to basemap layers (all layers added by apply())
    basemapLayers = map.getLayers().getArray().slice(); // Copy current layers
    
    // Add your custom layers after the style is loaded
    map.addLayer(venueLayer);
    map.addLayer(standsLayer);
    // map.addLayer(standAreaLayer);
    
    // Add interactions after map is ready
    map.addInteraction(link);

       // --- Highlight Feature on Hover ---
    map.on('pointermove', evt => {
      if (!evt.dragging) {
        highlightFeatureAtPixel(evt.pixel);
      }
    });

    map.on('click', evt => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, f => {
        return standsLayer.getSource().hasFeature(f) ? f : null;
      });

      if (feature) {
        showStandEditForm(feature);
      } else {
        highlightFeatureAtPixel(evt.pixel);
      }
    });
    
    console.log('Map loaded successfully!');
    console.log('Map projection:', map.getView().getProjection().getCode());
    console.log('Map units:', map.getView().getProjection().getUnits());
  })
  .catch(error => {
    console.error('Error loading MapTiler style:', error);
  });

  // Basemap toggle function
function toggleBasemap(show) {
  showBasemap = show;
  basemapLayers.forEach(layer => {
    layer.setVisible(show);
  });
}

// Add basemap toggle event listener
document.getElementById('basemap-toggle').addEventListener('change', function(e) {
  toggleBasemap(e.target.checked);
});

// --- Highlight Feature on Hover ---
const highlightStyle = new Style({
  fill: new Fill({ color: 'rgba(255,255,0,0.3)' }),
  stroke: new Stroke({ color: '#f00', width: 2 }),
});

const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: highlightStyle,
});

let highlightedFeature = null;

const highlightFeatureAtPixel = pixel => {
  const feature = map.forEachFeatureAtPixel(pixel, f => {
    // Only highlight if feature is from standsLayer
    return standsLayer.getSource().hasFeature(f) ? f : null;
  });
  const overlaySource = featureOverlay.getSource();

  if (highlightedFeature && highlightedFeature !== feature) {
    overlaySource.removeFeature(highlightedFeature);
    highlightedFeature = null;
  }
  if (feature && feature !== highlightedFeature) {
    overlaySource.addFeature(feature);
    highlightedFeature = feature;
  }
};

// --- Toggle Configurations ---
// --- Basemap Toggle ---
let showBasemap = true;
let basemapLayers = []; // Store reference to basemap layers
// These toggles will allow users to show/hide different fill styles for the stands
const toggleConfig = {
  'status-toggle': () => (showStatusFill = false),
  'product-toggle': () => (showProductFill = false),
  'type-toggle': () => (showStandTypeFill = false),
};

const updateToggleState = {
  'status-toggle': isChecked => (showStatusFill = isChecked),
  'product-toggle': isChecked => (showProductFill = isChecked),
  'type-toggle': isChecked => (showStandTypeFill = isChecked),
};

function handleToggleChange(event, currentToggleId) {
  const isChecked = event.target.checked;
  if (isChecked) {
    Object.keys(toggleConfig).forEach(toggleId => {
      if (toggleId !== currentToggleId) {
        document.getElementById(toggleId).checked = false;
        toggleConfig[toggleId]();
      }
    });
  }
  updateToggleState[currentToggleId](isChecked);
  standsLayer.changed();
  updateLegend();
}

// Attach event listeners for the stand toggles
Object.keys(toggleConfig).forEach(toggleId => {
  document.getElementById(toggleId).addEventListener('change', e => handleToggleChange(e, toggleId));
});

// --- Legend ---
function updateLegend() {
  const legendDiv = document.getElementById('legend');
  legendDiv.innerHTML = ''; // Clear previous

  if (showStatusFill) {
    legendDiv.innerHTML = `<b>Status</b><br>` +
      Object.entries(statusColors).map(([status, color]) =>
        `<span style="display:inline-block;width:18px;height:18px;background:${color};border:1px solid #ccc;margin-right:6px;vertical-align:middle;"></span>${status}`
      ).join('<br>');
  } else if (showProductFill) {
    legendDiv.innerHTML = `<b>Product Code</b><br>` +
      Object.entries(productColors).map(([code, color]) =>
        `<span style="display:inline-block;width:18px;height:18px;background:${color};border:1px solid #ccc;margin-right:6px;vertical-align:middle;"></span>${code}`
      ).join('<br>');
  } else if (showStandTypeFill) {
    legendDiv.innerHTML = `<b>Stand Type</b><br>` +
      Object.entries(standTypeColors).map(([type, color]) =>
        `<span style="display:inline-block;width:18px;height:18px;background:${color};border:1px solid #ccc;margin-right:6px;vertical-align:middle;"></span>${type}`
      ).join('<br>');
  } else {
    legendDiv.innerHTML = '<b>Legend</b>';
  }
}

// Show width, length, and area of stand when drawing
function showDrawInfo(length, width, area) {
  const infoDiv = document.getElementById('stand-draw-info');
  const dimsSpan = document.getElementById('stand-draw-dimensions');
  dimsSpan.innerHTML = `
    <b>Length:</b> ${length.toFixed(2)} m<br>
    <b>Width:</b> ${width.toFixed(2)} m<br>
    <b>Area:</b> ${area.toFixed(2)} m²
  `;
  infoDiv.style.display = 'block';
}

function hideDrawInfo() {
  document.getElementById('stand-draw-info').style.display = 'none';
}

// --- Rectangle Drawing Interaction ---
let drawStandInteraction = null;

// --- Add Draw Interaction for rectangles ---
const gridSize = 0.5; // 0.5 meter grid

function snapToGrid(coord) {
  // Assuming your map units are meters
  return coord.map(c => Math.round(c / gridSize) * gridSize);
}

function activateDrawStand() {
  // Remove previous interaction if exists
  if (drawStandInteraction) {
    map.removeInteraction(drawStandInteraction);
  }
  drawStandInteraction = new Draw({
    source: standsLayer.getSource(),
    type: 'Circle',
    geometryFunction: function(coordinates, geometry) {
      const start = snapToGrid(coordinates[0]);
      const end = snapToGrid(coordinates[1]);
      const minX = Math.min(start[0], end[0]);
      const minY = Math.min(start[1], end[1]);
      const maxX = Math.max(start[0], end[0]);
      const maxY = Math.max(start[1], end[1]);
      const boxCoords = [
        [minX, minY],
        [minX, maxY],
        [maxX, maxY],
        [maxX, minY],
        [minX, minY]
      ];

      const length = Math.abs(maxY - minY);
      const width = Math.abs(maxX - minX);
      const area = length * width;
      showDrawInfo(length, width, area);

      if (!geometry) {
        geometry = new Polygon([boxCoords]);
      } else {
        geometry.setCoordinates([boxCoords]);
      }
      return geometry;
    }
  });
  map.addInteraction(drawStandInteraction);

 // Prompt for standID when drawing ends
  drawStandInteraction.once('drawend', (evt) => {
    hideDrawInfo();
    map.removeInteraction(drawStandInteraction);
    const feature = evt.feature;
    const standID = prompt('Enter standID for this stand:', '');
    if (standID !== null) {
      feature.set('standID', standID);
    }
  });
}

// --- Button event listener ---
document.getElementById('draw-stand-btn').addEventListener('click', activateDrawStand);

// --- Stand Edit Form ---
// This form will allow users to edit stand properties when clicking on a stand
let editingFeature = null;

function showStandEditForm(feature) {
  editingFeature = feature;
  const props = feature.getProperties();
  delete props.geometry;

  const fieldsDiv = document.getElementById('stand-properties-fields');
  fieldsDiv.innerHTML = '';

  Object.keys(props).forEach(key => {
    const value = props[key] ?? '';
    fieldsDiv.innerHTML += `
      <label class="form-group" style="display:block; margin-bottom:8px;">
        ${key}:<br>
        <input class="form-control" name="${key}" value="${value}" style="width:180px;" />
      </label>
    `;
  });

  document.getElementById('stand-edit-form').style.display = 'block';
}

function hideStandEditForm() {
  document.getElementById('stand-edit-form').style.display = 'none';
  editingFeature = null;
}

// Handle form submit
document.getElementById('stand-properties-form').addEventListener('submit', function(e) {
  e.preventDefault();
  if (!editingFeature) return;
  const formData = new FormData(e.target);
  for (const [key, value] of formData.entries()) {
    editingFeature.set(key, value);
  }
  standsLayer.changed();
  hideStandEditForm();
});

// Handle cancel button
document.getElementById('close-stand-form').addEventListener('click', function() {
  hideStandEditForm();
});