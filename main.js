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
// import TopoJSON from 'ol/format/TopoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Point from 'ol/geom/Point.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import { withinExtentAndZ } from 'ol/tilecoord';

// --- Config ---
const venueLonLat = [0.029912, 51.508144];
const extentValue = 1500;
const defaultZoom = 17;
const defaultRotation = 1.570796;
const link = new Link();

// --- Center & Extents ---
let center = fromLonLat(venueLonLat);
let zoom = defaultZoom;
let rotation = defaultRotation;
const [x, y] = center;
const extents = [x - extentValue, y - extentValue, x + extentValue, y + extentValue];

// --- Styles ---
const labelStyle = new Style({
  text: new Text({
    font: '14px Georgia,sans-serif',
    overflow: true,
    fill: new Fill({ color: '#000'}),
    stroke: new Stroke({ color: '#fff', width: 4 }),
  }),
});
const standStyle = new Style({
  fill: new Fill({ color: 'rgba(255, 255, 255, 1' }),
  stroke: new Stroke({ color: '#319FD3', width: 1 }),
});
const style = [standStyle, labelStyle];

// Caches for label styles
const standIDLabelCache = {};
const standAreaLabelCache = {};

const standIDLabel = (feature) => {
  const standID = feature.get('standID') || '';
  if (standIDLabelCache[standID]) return standIDLabelCache[standID];
  // Get the geometry's extent
  const extent = feature.getGeometry().getExtent();
  // Top left corner: [maxX, maxY]
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
  standIDLabelCache[standID] = style;
  return style;
};

const standAreaLabel = (feature) => {
  const area = feature.get('Area') || '';
  if (standAreaLabelCache[area]) return standAreaLabelCache[area];
  // Get the geometry's extent
  const extent = feature.getGeometry().getExtent();
  // Top left corner: [maxX, maxY]
  const bottomRight = [extent[2], extent[1]];

  // Create a new style with the label at the top left
  const style = new Style({
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
  standAreaLabelCache[area] = style;
  return style;
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

// --- Stands Layer ---
const standsLayer = new VectorLayer({
  declutter: true,
  source: new VectorSource({
    url: 'LBF25.geojson',
    format: new GeoJSON(),
  }),
  style: feature => [
    standStyle,
    standIDLabel(feature),
    standAreaLabel(feature)
  ],
});

// --- Map ---
const map = new Map({
  controls: defaultControls().extend([scaleControl()]),
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
      minResolution: 0.3,
      }),
    standsLayer,
  ],
  view: new View({
    center: center,
    zoom: zoom,
    rotation: rotation,
    extent: extents,
  })
});

map.addInteraction(link);

// //  --- Add tooltips styled by bootstrap ---
// document
//   .querySelectorAll('.ol-zoom-in, .ol-zoom-out, .ol-rotate-reset')
//   .forEach(function (el) {
//     new bootstrap.Tooltip(el, {
//       container: '#map',
//     });
//   });

// // --- Highlight Feature on Hover ---
// const highlightStyle = new Style({
//   fill: new Fill({ color: 'rgba(255,255,0,0.3)' }),
//   stroke: new Stroke({ color: '#f00', width: 2 }),
// });

// const featureOverlay = new VectorLayer({
//   source: new VectorSource(),
//   map: map,
//   style: highlightStyle,
// });

// let highlightedFeature = null;

// const highlightFeatureAtPixel = pixel => {
//   const feature = map.forEachFeatureAtPixel(pixel, f => f);
//   const overlaySource = featureOverlay.getSource();

//   if (highlightedFeature && highlightedFeature !== feature) {
//     overlaySource.removeFeature(highlightedFeature);
//     highlightedFeature = null;
//   }
//   if (feature && feature !== highlightedFeature) {
//     overlaySource.addFeature(feature);
//     highlightedFeature = feature;
//   }
// };

// map.on('pointermove', evt => {
//   if (!evt.dragging) {
//     highlightFeatureAtPixel(evt.pixel);
//   }
// });

// map.on('click', evt => {
//   highlightFeatureAtPixel(evt.pixel);
// });