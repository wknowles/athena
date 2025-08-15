# Athena Copilot Instructions

## Project Overview
Athena is a prototype web application for displaying and editing exhibition floorplans. It is built with Vite, OpenLayers, and vanilla JavaScript, with a modular structure for map logic, drawing, and UI controls.

## Architecture & Key Components
- **src/main.js**: Main entry point. Initializes the map, layers, and UI. Handles most app logic and event listeners.
- **src/drawStands.js**: Encapsulates all logic for drawing new stands, including grid snapping, info overlays, and canceling with Escape.
- **src/style.css**: Custom styles, imports OpenLayers CSS.
- **public/**: Contains GeoJSON files for venue and stands.
- **index.html**: UI layout, includes map container and controls.
- **vite.config.js**: Vite config, sets base path and excludes some dependencies from optimization.

## Developer Workflows
- **Development**: Use `npm run dev` to start the Vite dev server. The app is accessible at the configured base path.
- **Build**: Use `npm run build` to generate production assets in `dist/`.
- **Deploy**: Deployment to GitHub Pages is via `git subtree push --prefix dist origin gh-pages` (see Vite config for base path).
- **Testing**: No formal tests in Athena; see `dxf-processor/` for Python test examples.

## Project-Specific Patterns & Conventions
- **Drawing Stands**: All logic for drawing a new stand (snapping, info, cancel, prompt for standID) is in `src/drawStands.js`. Use `activateDrawStand(map, standsLayer)` to start drawing. Drawing can be canceled with Escape.
- **Event Listeners**: Attach all UI event listeners in a single place after DOM and map are ready. Use modular imports for feature logic (e.g., drawing, editing).
- **Styling**: Color palettes for products, status, and types are defined as JS objects in `main.js`.
- **Feature Editing**: Stand properties can be edited via a form overlay. See `showStandEditForm` and `hideStandEditForm` in `main.js`.
- **Map Layers**: Vector layers are loaded from GeoJSON in `public/`. MapTiler is used for basemap styling.
- **No Frameworks**: The app uses vanilla JS modules, not React/Vue/Angular.

## Integration & External Dependencies
- **OpenLayers**: Used for all map rendering and interaction.
- **MapTiler**: Basemap tiles via `ol-mapbox-style`.
- **Vite**: For dev server and builds.
- **GeoJSON**: All spatial data is in GeoJSON format.

## Examples
- To add a new drawing tool, follow the modular pattern in `drawStands.js` and import/export as needed.
- To add a new UI control, add the element in `index.html` and attach listeners in `main.js`.

## See Also
- `readme.md` for a high-level project summary.
- `vite.config.js` for build/deploy config.

---
If you are unsure about a workflow or pattern, check `src/main.js` for the canonical approach.
