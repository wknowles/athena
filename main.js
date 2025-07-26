// --- Imports ---
import './style.css';
import {Map, View} from 'ol';
import {defaults as defaultControls} from 'ol/control/defaults.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import Link from 'ol/interaction/Link.js';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM.js';
import {fromLonLat} from 'ol/proj.js';
// import GeoJSON from 'ol/format/GeoJSON.js';
import TopoJSON from 'ol/format/TopoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';

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
    overflow: 'show',
    fill: new Fill({ color: '#000'}),
    stroke: new Stroke({ color: '#fff', width: 4 }),
  }),
});
const standStyle = new Style({
  fill: new Fill({ color: 'rgba(255, 255, 255, 1' }),
  stroke: new Stroke({ color: '#319FD3', width: 1 }),
});
const style = [standStyle, labelStyle];

// --- Scale Control ---
const scaleControl = () =>
  new ScaleLine({
    units: "metric",
    bar: true,
    steps: 5,
    text: false,
    minWidth: 140,
  });

// -- Stands Layer ---
const standsLayer = new VectorLayer({
    declutter: 'separate',
    source: new VectorSource({
    url: 'LBF25.json',
    format: new TopoJSON(), 
  }),
  style: feature => {
    labelStyle.getText().setText(
      [
        `${feature.get('standID')}`,
        'bold 12px Calibri,sans-serif',
        '\n',
        '',
        ` ${feature.get('Display Name')}`,
        '',
        '\n',
        '',
        `${feature.get('Area')} m²`,
        'italic 10px Calibri,sans-serif',
      ]
    );
    return style;
  },
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

//  --- Add tooltips styled by bootstrap ---
document
  .querySelectorAll('.ol-zoom-in, .ol-zoom-out, .ol-rotate-reset')
  .forEach(function (el) {
    new bootstrap.Tooltip(el, {
      container: '#map',
    });
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
  const feature = map.forEachFeatureAtPixel(pixel, f => f);
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