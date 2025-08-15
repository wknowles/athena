import Draw from 'ol/interaction/Draw';
import Polygon from 'ol/geom/Polygon';

// Grid size for snapping
const gridSize = 0.5;

// Snap coordinates to grid
function snapToGrid(coord) {
  return coord.map(c => Math.round(c / gridSize) * gridSize);
}

// Show drawing info (length, width, area)
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

// Hide drawing info
function hideDrawInfo() {
  document.getElementById('stand-draw-info').style.display = 'none';
}

// Activate draw interaction for new stand
export function activateDrawStand(map, standsLayer) {
  // Remove previous interaction if exists
  if (map._drawStandInteraction) {
    map.removeInteraction(map._drawStandInteraction);
  }

  const drawStandInteraction = new Draw({
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
  map._drawStandInteraction = drawStandInteraction;

   // Escape key handler
  function handleEscape(e) {
    if (e.key === 'Escape') {
      hideDrawInfo();
      map.removeInteraction(drawStandInteraction);
      map._drawStandInteraction = null;
      window.removeEventListener('keydown', handleEscape);
    }
  }
  window.addEventListener('keydown', handleEscape);

  // Prompt for standID when drawing ends
  drawStandInteraction.once('drawend', (evt) => {
    hideDrawInfo();
    map.removeInteraction(drawStandInteraction);
    map._drawStandInteraction = null;
    window.removeEventListener('keydown', handleEscape);
    const feature = evt.feature;
    const standID = prompt('Enter standID for this stand:', '');
    if (standID !== null) {
      feature.set('standID', standID);
    }
  });
}