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

// --- Scale Control ---
let control;
function scaleControl() {
    control = new ScaleLine({
      units: "metric",
      bar: true,
      steps: parseInt(5, 10),
      text: false,
      minWidth: 140,
    });
    return control;
  };

// styling for the vector stand layer
const labelStyle = new Style({
  text: new Text({
    font: '14px Georgia,sans-serif',
    overflow: 'show',
    fill: new Fill({
      color: '#000',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 4,
    }),
  }),
});
const standStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 1',
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1,
  }),
});
const style = [standStyle, labelStyle];

// vector layer for the stands
let standsLayer = new VectorLayer({
    declutter: 'separate',
    source: new VectorSource({
    url: 'LBF25.geojson',
    format: new GeoJSON(), 
  }),
  // style: {
  //   'stroke-color': 'rgba(180, 180, 255, 1)',
  //   'stroke-width': 1,
  //   'fill-color': 'rgba(200, 200, 255, 0.85)',
  //   'text-value': ['get', 'standID'],
  //   'text-font': '12px sans-serif',
  //   'text-overflow': true,
  // },
  style: function (feature) {
    labelStyle
      .getText()
      .setText([
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
      ]);
    return style;
  },
});

// Add an event listener to the stands layer to log the number of features found in the GeoJSON file
standsLayer.getSource().on('change', function(evt){
  const source = evt.target;
  if (source.getState() === 'ready') {
    const numFeatures = source.getFeatures().length;
    console.log("Count after change: " + numFeatures);
  }
});

// Create the map with the specified layers and view
const map = new Map({
  controls: defaultControls().extend([scaleControl()]),
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
      minResolution: 0.3,
      // maxResolution: 200,
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



// // <<--- highlight feature on hover -->> //
// const featureOverlay = new VectorLayer({
//   source: new VectorSource(),
//   map: map,
//   style: {
//     'fill-color': 'rgba(255, 255, 255, 0.7)',
//     'stroke-width': 2,
//   },
// });

// let highlight;
// const displayFeatureInfo = function (pixel) {
//   const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
//     return feature;
//   });

//   if (feature !== highlight) {
//     if (highlight) {
//       featureOverlay.getSource().removeFeature(highlight);
//     }
//     if (feature) {
//       featureOverlay.getSource().addFeature(feature);
//     }
//     highlight = feature;
//   }
// };

// map.on('pointermove', function (evt) {
//   if (evt.dragging) {
//     return;
//   }
//   displayFeatureInfo(evt.pixel);
// });

// map.on('click', function (evt) {
//   displayFeatureInfo(evt.pixel);
// });

// Add tooltips to the zoom buttons
document
  .querySelectorAll('.ol-zoom-in, .ol-zoom-out, .ol-rotate-reset')
  .forEach(function (el) {
    new bootstrap.Tooltip(el, {
      container: '#map',
    });
  });