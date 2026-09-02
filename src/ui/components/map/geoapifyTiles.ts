// Basemap tiles are proxied through our own /api/tiles endpoint so the Geoapify
// key stays server-side (never shipped to the browser). The style is the closest
// free match to the retired CARTO Voyager look; one composite tile carries labels.
const STYLE = "osm-bright";

export const tileUrl = `/api/tiles/${STYLE}/{z}/{x}/{y}.png`;

export const tileAttribution =
  'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors';
