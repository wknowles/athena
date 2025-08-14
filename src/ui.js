import { 
  showStatusFill, 
  showProductFill, 
  showStandTypeFill,
  setShowStatusFill,
  setShowProductFill, 
  setShowStandTypeFill,
  statusColors,
  productColors,
  standTypeColors
} from './styles.js';
import { activateDrawStand } from './interactions.js';

// --- Toggle Configurations ---
const toggleConfig = {
  'status-toggle': () => setShowStatusFill(false),
  'product-toggle': () => setShowProductFill(false),
  'type-toggle': () => setShowStandTypeFill(false),
};

const updateToggleState = {
  'status-toggle': isChecked => setShowStatusFill(isChecked),
  'product-toggle': isChecked => setShowProductFill(isChecked),
  'type-toggle': isChecked => setShowStandTypeFill(isChecked),
};

function handleToggleChange(event, currentToggleId, standsLayer) {
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

// --- Legend ---
export function updateLegend() {
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

// --- Stand Edit Form ---
let editingFeature = null;

export function showStandEditForm(feature) {
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

// Basemap toggle function
export function toggleBasemap(basemapLayers, show) {
  basemapLayers.forEach(layer => {
    layer.setVisible(show);
  });
}

// Initialize UI event listeners
export function initializeUI(map, standsLayer, basemapLayers) {
  // Attach event listeners for the stand toggles
  Object.keys(toggleConfig).forEach(toggleId => {
    document.getElementById(toggleId).addEventListener('change', e => 
      handleToggleChange(e, toggleId, standsLayer)
    );
  });

  // Add basemap toggle event listener
  document.getElementById('basemap-toggle').addEventListener('change', function(e) {
    toggleBasemap(basemapLayers, e.target.checked);
  });

  // --- Button event listener ---
  document.getElementById('draw-stand-btn').addEventListener('click', () => 
    activateDrawStand(map, standsLayer)
  );

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
}

// export { showStandEditForm };