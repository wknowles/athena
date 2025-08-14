import { fromLonLat } from 'ol/proj.js';

// --- Config ---
export const venueLonLat = [0.029912, 51.508144];
export const extentValue = 1250; // show 1.25km around venue centre
export const defaultZoom = 17;
export const defaultRotation = 0; // No rotation
export const gridSize = 0.5; // 2 meter grid

// --- Center & Extents ---
export const center = fromLonLat(venueLonLat);
export const zoom = defaultZoom;
export const rotation = defaultRotation;
const [x, y] = center;
export const extents = [x - extentValue, y - extentValue, x + extentValue, y + extentValue];