import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Point from 'ol/geom/Point.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import { venueStyle, getStandFillStyle } from './styles.js';
import { standNameLabel } from './utils.js';

// --- Scale Control ---
export const scaleControl = () =>
  new ScaleLine({
    units: "metric",
    bar: true,
    steps: 5,
    text: false,
    minWidth: 140,
  });

// --- Venue Layer ---
export const venueLayer = new VectorLayer({
  source: new VectorSource({
    url: import.meta.env.BASE_URL + 'WTMKT25venue.geojson',
    format: new GeoJSON(),
    zIndex: 0,
  }),
  style: venueStyle,
});

// --- Stands Layer ---
export function createStandsLayer(map) {
  return new VectorLayer({
    declutter: true,
    source: new VectorSource({
      url: import.meta.env.BASE_URL + 'WTMKT25.geojson',
      format: new GeoJSON(),
      zIndex: 1,
    }),
    style: feature => [
      ...standNameLabel(feature, map),
      getStandFillStyle(feature),
    ],
  });
}

// --- Stand Area Labels ---
export const standAreaLayer = new VectorLayer({
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