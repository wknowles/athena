import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Draw from 'ol/interaction/Draw';
import Polygon from 'ol/geom/Polygon';
import { highlightStyle } from './styles.js';
import { snapToGrid, showDrawInfo, hideDrawInfo } from './utils.js';

// --- Highlight Feature on Hover ---
export const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  style: highlightStyle,
});

export let highlightedFeature = null;

export function highlightFeatureAtPixel(map, standsLayer, pixel) {
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
}

// --- Rectangle Drawing Interaction ---
export let drawStandInteraction = null;

export function activateDrawStand(map, standsLayer) {
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