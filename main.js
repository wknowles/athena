// --- Imports ---
import './style.css';
import {Map, View} from 'ol';
import {defaults as defaultControls} from 'ol/control/defaults.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import Link from 'ol/interaction/Link.js';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM.js';
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
    fill: new Fill({ color: 'rgba(218, 218, 218, 1)' }),
    stroke: new Stroke({ color: '#1a2a31ff', width: 3 }),
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
  'Sold': 'rgba(242, 166, 166, 1)',
  'Available': 'rgba(237, 255, 194, 1)',
  'Held': 'rgba(205, 239, 244, 1)',
};
// Colour palette for Stand Status  
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
    stroke: new Stroke({ color: '#319FD3', width: 1 }),
  });
  if (showStatusFill) {
    const status = feature.get('Status');
    const fillColor = statusColors[status] || 'rgba(255, 255, 255, 1)';
    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: '#319FD3', width: 1 }),
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

// --- Stand ID Labels ---
const standIDLabel = (feature) => {
  const standID = feature.get('standID') || '';
  const extent = feature.getGeometry().getExtent();
  const topLeft = [extent[0], extent[3]];
  // Create a new style with the label at the top left
  const style = new Style({
    geometry: new Point(topLeft),
    text: new Text({
      text: String(standID),
      font: 'bold 10px Calibri,sans-serif',
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({ color: '#fff', width: 4 }),
      offsetX: 10, // adjust as needed to avoid clipping
      offsetY: 10,  // adjust as needed to avoid clipping
      textAlign: 'left',
      textBaseline: 'top',
    }),
  });
  return style;
};
// -- Function to wrap Exhibitor Name so it runs multiple lines ---
const standNameLabel = (feature) => {
  function wrapExhibitorName(text, maxLen) {
    if (!text) return '';
    const words = text.split(' ');
    let lines = [];
    let line = '';
    words.forEach(word => {
      if ((line + word).length > maxLen) {
        lines.push(line.trim());
        line = '';
      }
      line += word + ' ';
    });
    if (line) lines.push(line.trim());
    return lines.join('\n');
  }

// -- Exhibitor Name Label ---
  const displayName = wrapExhibitorName(feature.get('Display Name'), 12);
  const geometry = feature.getGeometry();
  const center = geometry.getInteriorPoint ? geometry.getInteriorPoint() : geometry.getClosestPoint();

  // Get current map resolution (smaller = more zoomed in)
  const resolution = map.getView().getResolution();

 // Calculate font size based on feature size and map resolution 
  const extent = geometry.getExtent();
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  // Choose a scaling factor that works for your map units
  const minFont = 4;
  const maxFont = 16;
  
  let baseFont = Math.min(width, height) / 8;
  let zoomFont = baseFont / resolution;
  let fontSize = Math.max(minFont, Math.min(maxFont, Math.round(zoomFont)));

  return new Style({
    geometry: center,
    text: new Text({
      text: displayName,
      font: `${fontSize}px Georgia, serif`,
      fill: new Fill({ color: '#000'}),
      stroke: new Stroke({ color: '#fff', width: 4 }),
      textAlign: 'center',
      textBaseline: 'middle',
    }),
  });
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
    url: 'WTMKT25venue.geojson',
    format: new GeoJSON(),
  }),
  maxResolution: 0.4,
  style: venueStyle,
});

// --- Stands Layer ---
const standsLayer = new VectorLayer({
  declutter: true,
  source: new VectorSource({
    url: 'WTMKT25.geojson',
    format: new GeoJSON(),
  }),
  style: feature => [
    standIDLabel(feature),
    standNameLabel(feature),
    getStandFillStyle(feature),
  ],
});

 // --- Stand Area Labels ---
const standAreaLayer = new VectorLayer({
  source: new VectorSource({
    url: 'WTMKT25.geojson',
    format: new GeoJSON(),
  }),
  maxResolution: 0.15,
  style: feature => {
    const area = feature.get('Area') || '';
    const extent = feature.getGeometry().getExtent();
    const bottomRight = [extent[2], extent[1]];
    // Create a new style with the label at the top left
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
  layers: [
    new TileLayer({
      source: new OSM(),
      minResolution: 0.4,
      }),
    venueLayer,
    standsLayer,
    standAreaLayer,
  ],
  view: new View({
    center: center,
    zoom: zoom,
    rotation: rotation,
    extent: extents,
  })
});
map.addInteraction(link);


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

map.on('pointermove', evt => {
  if (!evt.dragging) {
    highlightFeatureAtPixel(evt.pixel);
  }
});

map.on('click', evt => {
  highlightFeatureAtPixel(evt.pixel);
});

// --- Toggle Configurations ---
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

// --- Rectangle Drawing Interaction ---
let drawStandInteraction = null;

// --- Add Draw Interaction for rectangles ---
const gridSize = 2; // 2 meter grid

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
      // Draw a rectangle (box) instead of a circle
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