// dependencies
import L from 'leaflet';
import { basemapLayer } from 'esri-leaflet';
// may need feature layer latter if store the user generated shapefiles, drawon
// user drawn shapes somehere else if so add this
// import { basemapLayer, featureLayer } from 'esri-leaflet';

import { Component } from './components';
import { mapConfig } from '../config/mapConfig';

// SCSS
import '../css/_custom_leaflet.scss';

// Import custom classess
import { Store } from './store';

// import utilities
import {
  checkValidObject,
  spinnerOff,
  spinnerOn,
  googleAnalyticsEvent
} from './utilitys';

// Downloaded esri-leaflet-vector to utils directory so the package works with webpack es6
// Must update manually since there are custom changes to the component!
// vector layers not used yet will need to uncomment later
// See github issue https://github.com/Esri/esri-leaflet-vector/issues/31 from tgirgin23
// import * as vector from '../vendor/esri/esri-leaflet-vector/EsriLeafletVector';

// templates
import mapTemplate from '../templates/map.html';

const store = new Store({});

/**
 * Leaflet Map Component
 * Render map items, and provide user interactivity.
 * @extends Component
 */
export class Map extends Component {
  /**
   * Map Component Constructor
   * @param { String } placeholderId Element ID to inflate the map into
   * @param { Object } props.events.click Map item click listener
   */
  constructor(mapPlaceholderId, props) {
    super(mapPlaceholderId, props, mapTemplate);

    this.renderCount = 0;
    this.basemaploaded = false;
    // set last storage object, it will be overwritten after map is intialized
    this.restoreStateStore = store.getState();

    // Initialize Leaflet map
    this.map = L.map(this.refs.mapContainer, mapConfig.mapOptions);

    // not sure why but something changed and I can no longer use maptions for inital zoom
    if (Object.keys(this.restoreStateStore).length === 0 &&
                  this.restoreStateStore.constructor === Object) {
      this.map.panTo(mapConfig.mapDefaults.center);
      this.map.setZoom(mapConfig.mapDefaults.zoom);
      this.saveZoomAndMapPosition();
      store.saveAction('moveend');
    }

    this.map.zoomControl.setPosition('topleft'); // Position zoom control
    this.overlayMaps = {}; // Map layer dict (key/value = title/layer)
    this.value = null; // Store currently selected region
    this.mapOverlayLayers = {}; // map overlay (wms layer)
    this.mapStates = ['mapCenter', 'mapZoom', 'mapLayerDisplayStatus', 'mapContainerPoint', 'basemap']; // all the potential map states
    this.basemap = null;
    this.basemapLabels = null;

    // add base map
    this.addBaseMap();

    // force map re-render
    this.forceMapReRender();
    this.forceMapReRender();

    this.addWmsLayers();
    this.addTileLayers();
    // set the state to manage initial display status of wms "overlay" layers
    store.setStoreItem('mapLayerDisplayStatus', this.mapOverlayLayers);

    // add spinner element
    Map.addSpinnerElement();
  }

  // add spinner element to leftlet map panes
  // any user action with map will show the site is working by
  // by displaying a working spinner
  static addSpinnerElement() {
    const workingElement = L.DomUtil.create('div', 'position-relative d-flex align-items-center justify-content-center leaflet-working d-none', L.DomUtil.get('map'));
    workingElement.innerHTML = '<i id="map-working" class="fa fa-spinner fa-spin d-none"></i>';
    L.DomUtil.toFront(workingElement);
    L.DomEvent.disableClickPropagation(workingElement);
  }

  // make the map cursor a crosshair
  mapCursorCrosshair() {
    const mapElement = this.map.getContainer();
    mapElement.style.cursor = 'crosshair';
  }

  // make the map cursor a default
  mapCursorDefault() {
    const mapElement = this.map.getContainer();
    mapElement.style.cursor = '';
  }

  // saves the current map center and zoom level to state in locat storage
  saveZoomAndMapPosition() {
    console.log('saveZoomAndMapPosition', this.map.getCenter(), this.map.getZoom())
    store.setStoreItem('mapCenter', this.map.getCenter());
    store.setStoreItem('mapZoom', this.map.getZoom());
  }

  // force map render and setup
  forceMapReRender() {
    // this ensures the map is full setup.
    // we have issues becuase the map height is 100% and is
    // explicitly set
    L.Util.requestAnimFrame(this.map.invalidateSize, this.map, !1, this.map._container);
  }

  // change esri basemap
  changeBaseMap(basemapname) {
    if (this.basemap) {
      this.map.removeLayer(this.basemap);
    }

    if (this.basemapLabels) {
      this.map.removeLayer(this.basemapLabels);
    }

    this.basemap = basemapLayer(basemapname);
    this.basemapLabels = Map.addBaseMapLabels(basemapname);
    this.basemap.addTo(this.map);

    if (this.basemapLabels) {
      this.basemapLabels.addTo(this.map);
    }

    store.setStoreItem('basemap', basemapname);

    const labelElem = document.getElementById('btn-basemap-label');

    if (labelElem) {
      labelElem.innerHTML = Map.makeHumanBaseMapName(basemapname);
    }
    // add new event to check on base map has completed uploading
    //  map will not initialize settings untill this has completed
    this.basemap.on('load', () => {
      this.map.fireEvent('basemaploaded');
      this.basemaploaded = true;
      store.setStoreItem('working_basemap', false);
      spinnerOff('load');
    });

    // add new event to fire when on base map is in process of loading
    this.basemap.on('loading', () => {
      this.map.fireEvent('basemaploading');
      store.setStoreItem('working_basemap', true);
    });
  }

  static makeHumanBaseMapName(baseMapName) {
    if (baseMapName === 'DarkGray') {
      return 'Dark Gray';
    }
    if (baseMapName === 'Terrain') {
      return 'Terrain';
    }
    if (baseMapName === 'Imagery') {
      return 'Imagery';
    }
    if (baseMapName === 'Topographic') {
      return 'Topographic';
    }
    if (baseMapName === 'Streets') {
      return 'Streets';
    }
    return 'Dark Gray';
  }

  static addBaseMapLabels(basemap) {
    if (basemap === 'Oceans' ||
        basemap === 'DarkGray' ||
        basemap === 'Terrain') {
      return basemapLayer(`${basemap}Labels`);
    }
    if (basemap.includes('Imagery')) {
      return basemapLayer('ImageryLabels');
    }
    return '';
  }

  // adds leaflet base map defined in mapConfig.js
  addBaseMap() {
    /**
     * Adds ESRI  map (may switch to vector map layer)
     * var vectorTiles = vector.basemap(mapConfig.ESRIVectorBasemap.name);
     * Not using vector tiles yet since there is some bugginess from ESRI
     * mainly the map starts out not fully rendering
     */

    const basemap = mapConfig.ESRIVectorBasemap.name;
    this.basemap = basemapLayer(basemap);
    this.basemapLabels = Map.addBaseMapLabels(basemap);

    this.basemap.addTo(this.map);
    if (this.basemapLabels) {
      this.basemapLabels.addTo(this.map);
    }

    store.setStoreItem('basemap', basemap);

    // add new event to check on base map has completed uploading
    //  map will not initialize settings untill this has completed
    this.basemap.on('load', () => {
      this.map.fireEvent('basemaploaded');
      this.basemaploaded = true;
      store.setStoreItem('working_basemap', false);
      spinnerOff('load');
    });

    // add new event to fire when on base map is in process of loading
    this.basemap.on('loading', () => {
      this.map.fireEvent('basemaploading');
      store.setStoreItem('working_basemap', true);
    });
  }

  // iterate and add leaflet tile layers from  mapconfig.js
  // Iterate over each wms map layer and add them to the map
  addTileLayers() {
    // Adds wms layers
    // May switch this out for tiled s3 layers or tile esri layers later
    const { TMSLayers } = mapConfig;

    // Iterate over each wms map layer and add them to the map
    TMSLayers.forEach((layer) => {
      const tileLayer = L.tileLayer(layer.url, {
        tms: layer.tms,
        id: layer.id,
        layers: layer.layer,
        crs: layer.crs,
        opacity: layer.opacity,
        attribution: layer.attribution,
        tileSize: layer.tileSize,
        transparent: layer.transparent,
        zIndex: layer.zIndex,
        maxNativeZoom: layer.maxNativeZoom
      });

      // Current leaflet layer object
      const obj = {
        [layer.id]: tileLayer
      };

      // add all tile load handlers
      Map.handleAlllTileHanlders(tileLayer);

      // set inital display status
      const mapDisplayLayersObj = { [layer.id]: false };

      // merge map overlay (wms layers) objects display status
      Object.assign(this.mapOverlayLayers, mapDisplayLayersObj);

      // Merge current layer into overlayMaps layers object
      Object.assign(this.overlayMaps, obj);
    });
  }

  // iterate and add leaflet tile layers from  mapconfig.js
  // Iterate over each wms map layer and add them to the map
  addWmsLayers() {
    // Adds wms layers
    // May switch this out for tiled s3 layers or tile esri layers later
    const { WMSLayers } = mapConfig;

    // Iterate over each wms map layer and add them to the map
    WMSLayers.forEach((layer) => {
      const tileLayer = L.tileLayer.wms(layer.url, {
        id: layer.id,
        layers: layer.layer,
        crs: layer.crs,
        format: layer.format,
        opacity: layer.opacity,
        attribution: layer.attribution,
        tileSize: layer.tileSize,
        transparent: layer.transparent,
        zIndex: layer.zIndex
      });

      // Current leaflet layer object
      const obj = {
        [layer.id]: tileLayer
      };

      // add all tile load handlers
      Map.handleAlllTileHanlders(tileLayer);

      // set inital display status
      const mapDisplayLayersObj = { [layer.id]: false };

      // merge map overlay (wms layers) objects display status
      Object.assign(this.mapOverlayLayers, mapDisplayLayersObj);

      // Merge current layer into overlayMaps layers object
      Object.assign(this.overlayMaps, obj);
    });
  }

  // tile load handler
  // @param { Object } - tileLayer the leaflet tile layer to we adding a handler for
  static handleWMSLoad(tileLayer) {
    tileLayer.on('load', () => {
      store.setStoreItem('working_basemap', false);
      spinnerOff('handleWMSLoad');
    });
  }

  // tile unload handler
  // @param { Object } - tileLayer the leaflet tile layer to we adding a handler for
  static handleWMSUnload(tileLayer) {
    tileLayer.on('unload', () => {
      store.setStoreItem('working_basemap', false);
      spinnerOff('handleWMSUnload');
    });
  }

  // tile load error handler
  // @param { Object } - tileLayer the leaflet tile layer to we adding a handler for
  static handleWMSError(tileLayer) {
    tileLayer.on('error', () => {
      store.setStoreItem('working_basemap', false);
      spinnerOff('handleWMSError');
    });
  }

  // there are two types of unloads with tile layers
  // see leaflet documenation for differences
  // https://leafletjs.com/reference-1.3.0.html#gridlayer-tileunload
  // tile load error handler
  // @param { Object } - tileLayer the leaflet tile layer to we adding a handler for
  static handleTileUnload(tileLayer) {
    tileLayer.on('tileunload', () => {
      store.setStoreItem('working_basemap', false);
      spinnerOff('handleTileUnload');
    });
  }

  // there are two types of errors with tile layers
  // see leaflet documenation for differences
  // https://leafletjs.com/reference-1.3.0.html#gridlayer-tileerror
  // tile load error handler
  // @param { Object } - tileLayer the leaflet tile layer to we adding a handler for
  static handleTileError(tileLayer) {
    tileLayer.on('tileerror', () => {
      store.setStoreItem('working_basemap', false);
      spinnerOff('handleTileError');
    });
  }

  // add handler for loading for tile layer
  // @param { Object } - tileLayer the leaflet tile layer to we adding a handler for
  static handleAlllTileHanlders(tileLayer) {
    // add seperate map layer handlers
    Map.handleWMSLoad(tileLayer);
    Map.handleWMSUnload(tileLayer);
    Map.handleWMSError(tileLayer);
    Map.handleTileUnload(tileLayer);
    Map.handleTileError(tileLayer);
  }

  // force the map to redraw by zooming in than out.
  // this ensurese leaflet will intialize all the tile layers
  // and ensures leaflet with align the tile layers properly
  zoomInAndOut() {
    /**
     * Yes I am zooming in then zooming out. But leaflets tiles
     * do not setup with fully with a dynamic map container (set to 100% height.)
     * and the overlays are offset with intial draw. This zoom in zoom out
     * forces leaflet to Render everything correctly
     */
    this.map.zoomOut(1);
    this.map.zoomIn(1);
    return true;
  }

  // map move end map handler
  // https://leafletjs.com/reference-1.3.0.html#map-moveend
  mapMoveEndHandler() {
    this.map.on('moveend', (event) => {
      this.saveZoomAndMapPosition();
      store.saveAction('moveend');
    });
  }

  // map zoom end map handler
  // https://leafletjs.com/reference-1.3.0.html#map-zoomend
  mapZoomEndHandler() {
    this.map.on('zoomend', (event) => {
      this.saveZoomAndMapPosition();
      store.saveAction('zoomend');
    });
  }

  // map double click map handler
  // https://leafletjs.com/reference-1.3.0.html#map-dblclick
  mapDoubleClickHandler() {
    this.map.on('dblclick', (event) => {
      this.saveZoomAndMapPosition();
      store.saveAction('dblclick');
    });
  }

  // map keypress map handler
  // https://leafletjs.com/reference-1.3.0.html#map-keypress
  mapKeyPressHandler() {
    this.map.on('keypress', (event) => {
      this.saveZoomAndMapPosition();
      store.saveAction('keypress');
    });
  }

  // Add map listeners in function so we can call it from index or setup and we
  // only update state store after map is intialized.
  addMapEventListners() {
    // move end handler
    this.mapMoveEndHandler();

    // zoom end handler
    this.mapZoomEndHandler();

    // double click handler
    this.mapDoubleClickHandler();

    // key press handlers
    this.mapKeyPressHandler();
  }

  // check if should restore the map state
  static shouldRestore(props) {
    if (props === undefined || props.restore === undefined) {
      return false;
    }

    return props.restore;
  }

  // Toggle map layer visibility for nav swithcing
  toggleVisLayerOff(layerName) {
    store.saveAction('maplayertoggle');
    store.setStoreItem('working_basemap', true);
    spinnerOn();
    const layer = this.overlayMaps[layerName];
    if (this.map.hasLayer(layer)) {
      this.map.removeLayer(layer);
    }
    store.setStoreItem('working_basemap', false);
  }

  // Toggle map layer visibility for nav swithcing
  toggleVisLayerOn(layerName) {
    store.saveAction('maplayertoggle');
    store.setStoreItem('working_basemap', true);
    spinnerOn();
    const layer = this.overlayMaps[layerName];
    store.setStoreItem('working_basemap', false);
    spinnerOn();
    this.map.addLayer(layer);
  }

  // Toggle map layer visibility
  // this needs to be made more modular but not sure
  // ho do that yet
  toggleLayer(layerName) {
    store.saveAction('maplayertoggle');
    store.setStoreItem('working_basemap', true);
    spinnerOn();
    let mapDisplayLayersObj = {};
    const layer = this.overlayMaps[layerName];
    if (this.map.hasLayer(layer)) {
      this.map.removeLayer(layer);
      // ga event action, category, label
      googleAnalyticsEvent('click', 'maplayerlist', `layerToggle off ${layerName}`);
      mapDisplayLayersObj = { [layerName]: false };
    } else {
      store.setStoreItem('working_basemap', true);
      spinnerOn();
      this.map.addLayer(layer);
      mapDisplayLayersObj = { [layerName]: true };
      // ga event action, category, label
      googleAnalyticsEvent('click', 'maplayerlist', `layerToggle on ${layerName}`);
    }
    Object.assign(this.mapOverlayLayers, mapDisplayLayersObj);
    store.setStoreItem('mapLayerDisplayStatus', this.mapOverlayLayers);
  }

  /**
   *  recenters map accoring to a lat long
   *  @param { Object } - ex {lat: 32.76966654128219, lng: -79.93103027343751}
   *
   *  const ele.addEventListener('click', (e) => {
   *      this.setMapCenter({lat: 32.76966654128219, lng: -79.93103027343751});
   *   })
   */
  setMapCenter(value) {
    if (!checkValidObject(value)) {
      return value;
    }
    this.map.panTo(value);
    return value;
  }

  /**
   *  zooms map into zoom level
   *  @param { integer }  integer usuall 1-18
   *
   *  const ele.addEventListener('click', (e) => {
   *      this.setMapZoom(5);
   *   })
   */
  setMapZoom(value) {
    if (!checkValidObject(value)) {
      return value;
    }
    this.map.setZoom(value);
    return value;
  }

  /**
   *  Force a map click event without user interaction
   *  @param { Object }  {lat: 32.76966654128219, lng: -79.93103027343751}
   *
   *      this.setMapClick({lat: 32.76966654128219, lng: -79.93103027343751});
   *
   *
   */
  setMapClick(value) {
    if (!checkValidObject(value)) {
      return value;
    }
    const latlng = L.latLng([value.lat, value.lng]);
    this.map.fireEvent('click', { latlng });
    return value;
  }

  /**
   *  Force a map layer toggle event without user interaction
   *  @param { string }  layer id examples are SA_ExposureIndex, SA_AssetIndex, SA_ThreatIndex
   *
   *  const ele.addEventListener('click', (e) => {
   *      this.setLayerStatus('SA_ThreatIndex');
   *   })
   *
   */
  static setLayerStatus(value) {
    const layerToggleElement = document.getElementById(`${value}-toggle`);
    if (layerToggleElement) {
      const event = new Event('click');
      layerToggleElement.dispatchEvent(event);
      layerToggleElement.checked = !layerToggleElement.checked;
    }
  }

  // restores map display status..
  // ensures the vissibility of each tile layer (wms)
  // matches the last state the user set
  // @param { string }  layer id examples are SA_ExposureIndex, SA_AssetIndex, SA_ThreatIndex
  static restoreMapDisplayStatus(mapLayerDisplayStatus) {
    // check the mapdisplay variable and toggle layers on when state
    // says to display = true
    if (mapLayerDisplayStatus !== undefined) {
      if (mapLayerDisplayStatus !== null) {
        Object.keys(mapLayerDisplayStatus).forEach((key) => {
          if (mapLayerDisplayStatus[key]) {
            Map.setLayerStatus(key);
          }
        });
        return true;
      }
    }
    return false;
  }

  // restores map zoom level
  // @param { integer }  zoomLevel integer values depends on min and max zoom defined
  // in mapConfig.js  usually 1-20 I am setting to   4 -16
  restoreMapZoom(zoomLevel) {
    // check the mapdisplay variable and toggle layers on when state
    if (checkValidObject(zoomLevel)) {
      // handle zoom when only zoom object set
      this.setMapZoom(zoomLevel);
      return true;
    }
    return false;
  }

  // restores map center
  // @param { object }  mapCenter  {lat: 32.76966654128219, lng: -79.93103027343751}
  restoreMapCenter(mapCenter) {
    // check the mapdisplay variable and toggle layers on when state
    if (checkValidObject(mapCenter)) {
      // handle zoom when only mapCenter object set
      this.setMapCenter(mapCenter);
      return true;
    }
    return false;
  }

  /**
   *  restore mapComponent when state exists
   *
   *  const ele.addEventListener('click', (e) => {
   *      this.restoreState();
   *   })
   *
   */
  restoreMapState() {
    // check if last storage object exists and is not empty
    if (Object.keys(this.restoreStateStore).length === 0 &&
            this.restoreStateStore.constructor === Object) {
      return false;
    }

    // get last storage object
    store.setStateFromObject(this.restoreStateStore);
    const state = store.getState();

    // Instantiate store variables. Otherwise the order will cause
    // the startup position to shift occasionally
    let mapZoom = null;
    let mapCenter = null;
    let mapLayerDisplayStatus = null;
    let basemap = null;

    // iterate over the state objects and set the store variables
    // iterating so we can run checkes that the object exists in
    // the state (local storage)
    this.mapStates.forEach((stateItem) => {
      const stateObj = state[stateItem];
      if (stateItem === 'mapCenter') { mapCenter = stateObj; } // recenter from store
      if (stateItem === 'mapZoom') { mapZoom = stateObj; } // reset map zoom from store
      if (stateItem === 'mapLayerDisplayStatus') { mapLayerDisplayStatus = stateObj; } // set layer display
      if (stateItem === 'basemap') { basemap = stateObj; } // set basemap
    });

    // ensure basemap is set use default fromn config
    if (!basemap) {
      basemap = mapConfig.ESRIVectorBasemap.name;
    }
    // restore or set the Display status of tile layers
    Map.restoreMapDisplayStatus(mapLayerDisplayStatus);

    this.restoreMapZoom(mapZoom);
    this.restoreMapCenter(mapCenter);
    this.changeBaseMap(basemap);
    store.setStoreItem('mapZoom', mapZoom);
    store.setStoreItem('mapCenter', mapCenter);
    store.setStoreItem('basemap', basemap);

    return true;
  }
}
