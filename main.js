import './style.css';
import {Map, View} from 'ol';
import ScaleLine from 'ol/control/ScaleLine.js';
import {defaults as defaultControls} from 'ol/control/defaults.js';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM.js';
// imports for Web Mercator projection
import {fromLonLat} from 'ol/proj.js';
// imports for stands layer
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
// imports for styling text on the vector layer
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';


// Define the venue's longitude and latitude in WGS84
const venueLonLat = [0.029912, 51.508144];
// Convert the venue's longitude and latitude to Web Mercator coordinates - meters
let center = fromLonLat(venueLonLat);
// Define the extent value in meters for the map - 2km around the venue
const extentValue = 1500;

// default zoom and rotation, centre is above
let zoom = 17;
let rotation = 0;

// Calculate the extent based on the venue's Web Mercator coordinates
let [x, y] = center;
const extents = [x - extentValue, y - extentValue, x + extentValue, y + extentValue];

// Create a scale control and add it to the map
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

// Permalink reload functionality
if (window.location.hash !== '') {
  // try to restore center, zoom-level and rotation from the URL
  const hash = window.location.hash.replace('#map=', '');
  const parts = hash.split('/');
  if (parts.length === 4) {
    zoom = parseFloat(parts[0]);
    center = [parseFloat(parts[1]), parseFloat(parts[2])];
    rotation = parseFloat(parts[3]);
  }
}
// End of permalink reload functionality

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

// Permalink functionality
let shouldUpdate = true;
const view = map.getView();
const updatePermalink = function () {
  if (!shouldUpdate) {
    // do not update the URL when the view was changed in the 'popstate' handler
    shouldUpdate = true;
    return;
  }

  const center = view.getCenter();
  const hash =
    '#map=' +
    view.getZoom().toFixed(2) +
    '/' +
    center[0].toFixed(2) +
    '/' +
    center[1].toFixed(2) +
    '/' +
    view.getRotation();
  const state = {
    zoom: view.getZoom(),
    center: view.getCenter(),
    rotation: view.getRotation(),
  };
  window.history.pushState(state, 'map', hash);
};

map.on('moveend', updatePermalink);

// restore the view state when navigating through the history, see
// https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
window.addEventListener('popstate', function (event) {
  if (event.state === null) {
    return;
  }
  map.getView().setCenter(event.state.center);
  map.getView().setZoom(event.state.zoom);
  map.getView().setRotation(event.state.rotation);
  shouldUpdate = false;
});
//end of permalink functionality

// Add tooltips to the zoom buttons
document
  .querySelectorAll('.ol-zoom-in, .ol-zoom-out')
  .forEach(function (el) {
    new bootstrap.Tooltip(el, {
      container: '#map',
    });
  });