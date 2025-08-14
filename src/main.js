import './style.css';
import { Map, View } from 'ol';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import Link from 'ol/interaction/Link.js';
import { apply } from 'ol-mapbox-style';
import { center, zoom, rotation, extents } from './config.js';
import { scaleControl, createStandsLayer, venueLayer } from './layers.js';
import { featureOverlay, highlightFeatureAtPixel } from './interactions.js';
import { initializeUI, showStandEditForm } from './ui.js';

const link = new Link();

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

// Create stands layer with map reference
const standsLayer = createStandsLayer(map);

// Store references to basemap layers
let basemapLayers = [];

// Apply MapTiler Streets v2 style
apply(map, 'https://api.maptiler.com/maps/0198936d-95b3-7462-83fb-1066bb038158/style.json?key=L7Xr1fJJ4jBWX3rjyRgA')
  .then(() => {
    // Store references to basemap layers (all layers added by apply())
    basemapLayers = map.getLayers().getArray().slice(); // Copy current layers
    
    map.addLayer(venueLayer);
   
    // Add your custom layers after the style is loaded 
    map.addLayer(standsLayer);
    
    // Add feature overlay for highlighting
    featureOverlay.setMap(map);
    
    // Add interactions after map is ready
    map.addInteraction(link);

    // --- Highlight Feature on Hover ---
    map.on('pointermove', evt => {
      if (!evt.dragging) {
        highlightFeatureAtPixel(map, standsLayer, evt.pixel);
      }
    });

    map.on('click', evt => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, f => {
        return standsLayer.getSource().hasFeature(f) ? f : null;
      });

      if (feature) {
        showStandEditForm(feature);
      } else {
        highlightFeatureAtPixel(map, standsLayer, evt.pixel);
      }
    });
    
    // Initialize UI components
    initializeUI(map, standsLayer, basemapLayers);
    
    console.log('Map loaded successfully!');
    console.log('Map projection:', map.getView().getProjection().getCode());
    console.log('Map units:', map.getView().getProjection().getUnits());
  })
  .catch(error => {
    console.error('Error loading MapTiler style:', error);
  });