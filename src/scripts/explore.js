// dependencies
import proj4 from 'proj4';
import JSZip from 'jszip';
import L from 'leaflet';
import { Draw } from 'leaflet-draw';
import buffer from '@turf/buffer';

// default map template
import exploreTemplate from '../templates/explore.html';

import { Component } from './components';
import { Store } from './store';
import { StoreShapesAPI } from './StoreShapesAPI';
import { ZonalStatsAPI } from './ZonalStatsAPI';

import {
  checkValidObject,
  spinnerOff,
  spinnerOn
} from './utilitys';

import { drawShortZonalStatsFromAPI } from './zonalStats';

// Shapefile library must be imported with require.
const shapefile = require('shapefile');

const store = new Store({});

/**
 * explore Component
 * Explore handles drawing on map, uploading of shapefile,
 * and generally handles adding any shapes to the map.
 */
export class Explore extends Component {
  constructor(placeholderId, props) {
    super(placeholderId, props, exploreTemplate);

    const { mapComponent, mapInfoComponent } = props;
    this.mapComponent = mapComponent;

    this.drawAreaGroup = L.featureGroup().addTo(mapComponent.map);

    // defualt buffer style
    this.bufferedoptions = {
      fillColor: '#99c3ff',
      color: '#99c3ff'
    };

    // handler for when drawing is completed
    this.addDrawVertexCreatedHandler(mapComponent, mapInfoComponent);

    // handler for drawing first vertex
    Explore.addDrawVertexHandler(mapComponent);

    // handler for clicking the clear area button
    this.addClearAreaClickHandler();

    // handler for clicking the draw area button
    this.addDrawAreaClickHandler(mapComponent);

    // handle stop of draw with escape before finsihed
    Explore.addDrawVertexStop(mapComponent, mapInfoComponent);

    // initalize s3 stored shapes API
    this.StoreShapesAPI = new StoreShapesAPI();

    this.ZonalStatsAPI = new ZonalStatsAPI();

    // draw the user area on the map
    this.drawUserArea();

    this.addUploadShapeHandler();

    this.mapComponent.map.addEventListener('zonalstatsend', (e) => {
      Explore.zonalStatsHandler();
    });

    // uncomment this if we want to add the draw area button to leaflet
    // control
    // this.addDrawButtons(mapComponent);
  }

  bufferArea(unbufferedGeoJSON) {
    // buffer the geoJSON by 1 kilometer
    const bufferedGeoJSON = buffer(unbufferedGeoJSON, 1, { units: 'kilometers' });

    // convert geoJson to leaflet layer
    const bufferedLayer = L.geoJson(bufferedGeoJSON, this.bufferedoptions);

    // add buffered area to store
    store.setStoreItem('userarea_buffered', bufferedGeoJSON);

    return bufferedLayer;
  }

  static zonalStatsHandler() {
    const clearAreaElement = document.getElementById('details-holder');
    const zonalstatsgeojson = store.getStateItem('zonalstatsjson');

    if (checkValidObject(zonalstatsgeojson) && !checkValidObject(zonalstatsgeojson.err)) {
      const zonalstatsjson = zonalstatsgeojson.features[0].mean;

      if (clearAreaElement) {
        let html = '';
        Object.keys(zonalstatsjson).forEach((obj) => {
          let value = parseFloat(zonalstatsjson[obj]).toFixed(2);
          if (zonalstatsjson[obj] === 'NaN') {
            value = 'Not Available';
          }

          // setup cards for zonal stats just a place holder...
          html += '<div class="card text-dark bg-light mb-3" style="width: 18rem;">';
          html += '  <div class="card-header">';
          html += obj;
          html += '  </div>';
          html += '  <div class="card-body">';
          html += '   <h5 class="card-title">';
          html += value;
          html += '   </h5>';
          html += '  </div>';
          html += '</div>';
        });

        clearAreaElement.innerHTML = html;
      }
    }
    return '';
  }

  async getZonal() {
    spinnerOn();
    store.setStoreItem('working_zonalstats', true);
    store.removeStateItem('zonalstatsjson');

    // get geoJSON to send to zonal stats lambda function
    const rawpostdata = store.getStateItem('userarea_buffered');
    let postdata = '';

    // some Geojson is not a feature collection lambda function expects a
    // a feature collection
    if (rawpostdata.type === 'Feature') {
      const FeatureCollectionStart = '{"type": "FeatureCollection","features": [';
      const FeatureCollectionEnd = ']}';
      postdata = FeatureCollectionStart + JSON.stringify(rawpostdata) + FeatureCollectionEnd;
    }

    if (rawpostdata.type === 'FeatureCollection') {
      postdata = JSON.stringify(rawpostdata);
    }

    if (!checkValidObject(rawpostdata)) {
      store.setStoreItem('working_zonalstats', false);
      spinnerOff('getZonal checkValidObject rawpostdata');
      return {};
    }

    // send request to api
    const ZonalStatsJson = await this.ZonalStatsAPI.getZonalStatsSummary(postdata);
    store.setStoreItem('zonalstatsjson', ZonalStatsJson);
    store.setStoreItem('working_zonalstats', false);
    drawShortZonalStatsFromAPI(ZonalStatsJson.features[0].properties.mean);
    spinnerOff('getZonal done');

    // add event to map for a listner that zonal stats have been calculated
    //  add timeout for write of more complex data to complete
    setTimeout(() => { this.mapComponent.map.fireEvent('zonalstatsend'); }, 10);
    return ZonalStatsJson;
  }

  async retreiveS3GeojsonFile(projectfile = 'projected_4326_62155.geojson') {
    const geojson = await this.StoreShapesAPI.getSavedGeoJSON(projectfile);

    // draw poly on map
    // ensure the user area object is valid (actuall has a value)
    if (checkValidObject(geojson)) {
      spinnerOn();
      store.setStoreItem('working_zonalstats', true);
      this.removeExistingArea();
      store.setStoreItem('projectfile', projectfile);
      store.setStoreItem('userarea', geojson);
      this.drawSavedGeoJson(geojson);
    } else {
      // add failed to get file from s3 code

    }
    return geojson;
  }

  restoreSavedGeoJson() {
    const projectfile = store.getStateItem('projectfile');
    if (checkValidObject(projectfile)) {
      // now that we have a user area and buffer remove the projectfile
      // it's no longer needed.
      this.removeExistingArea();
      this.retreiveS3GeojsonFile(projectfile);
    }
  }

  drawSavedGeoJson(geojson) {
    if (checkValidObject(geojson)) {
      const layer = L.geoJson(geojson);
      const bufferedLayer = this.bufferArea(geojson);

      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(layer);
      this.drawAreaGroup.addLayer(bufferedLayer);

      // force map to bounds
      if (checkValidObject(this.mapComponent)) {
        this.mapComponent.map.fitBounds(bufferedLayer.getBounds());
        this.mapComponent.saveZoomAndMapPosition();
        store.saveAction('addsavedgeojson');
        this.getZonal();
      }
      return layer;
    }
    return null;
  }

  drawUserArea() {
    const userarea = store.getStateItem('userarea');
    if (checkValidObject(userarea)) {
      // convert geoJson to leaflet layer
      const layer = L.geoJson(userarea);
      const bufferedLayer = this.bufferArea(userarea);

      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(layer);
      this.drawAreaGroup.addLayer(bufferedLayer);

      this.getZonal();
      return layer;
    }
    return null;
  }

  // handler for stopping (cancel) drawing on the map
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // the other vertexes
  // @param { Object } mapComponent object
  // @param { Object } mapInfoComponent object
  static addDrawVertexStop(mapComponent, mapInfoComponent) {
    mapComponent.map.on('draw:deletestop', () => {
      this.removeExistingArea();

      // must click the i button to do this action we will have to remove this
      // if we want users to always be able to click the map and do mapinfo
      // if (checkValidObject(mapInfoComponent)) {
      //   // re-add indentify
      //   mapInfoComponent.addMapClickIdentifyClickHandler();
      // }
    });
  }

  // handler for drawing the first vertex (green) on the map differently then
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // the other vertexes
  // @param { Object } mapComponent object
  static addDrawVertexHandler(mapComponent) {
    // color first vertex green
    mapComponent.map.on('draw:drawvertex', (e) => {
      const vertexElements = document.querySelectorAll('.leaflet-marker-icon.leaflet-div-icon.leaflet-editing-icon.leaflet-zoom-animated.leaflet-interactive');
      const fistVertexElement = vertexElements[0];
      fistVertexElement.className += ' leaflet-marker-icon-first';
    });
  }

  // remove the existing area
  removeExistingArea() {
    this.drawAreaGroup.clearLayers();
    store.removeStateItem('userarea');
    store.removeStateItem('userarea_buffered');
    store.removeStateItem('projectfile');
    store.removeStateItem('zonalstatsjson');
    const clearAreaElement = document.getElementById('details-holder');
    if (clearAreaElement) {
      clearAreaElement.innerHTML = '';
    }
  }

  // handler for click the button tp clear all drawings
  addClearAreaClickHandler() {
    // Click handler for you button to start drawing polygons
    const clearAreaElement = document.getElementById('btn-clear-area');
    clearAreaElement.addEventListener('click', (ev) => {
      this.removeExistingArea();

      // this temp remove of stats while we work on multiple shapes.
      const zonalAreaWrapper = document.getElementById('zonal-area-wrapper');
      if (zonalAreaWrapper) {
        zonalAreaWrapper.innerHTML = '<p class="zonal-instructions-initial">Click on the map to bring up information. Select multiple points to draw an area and get information on the area.</p>';
      }
    });
  }

  // handler for click the button drawing vertexes on the map
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // @param { Object } mapComponent object
  addDrawAreaClickHandler(mapComponent) {
    // draw polygon options
    const options = {
      allowIntersection: false, // Restricts shapes to simple polygons
      drawError: {
        color: 'red', // Color the shape will turn when intersects
        message: '<strong>Oh snap!<strong> you can\'t draw a polygon that intersects itself!' // Message that will show when intersect
      }
    };

    // draw polygon handler
    const polygonDrawer = new L.Draw.Polygon(mapComponent.map, options);

    // Click handler for you button to start drawing polygons
    const drawAreaElement = document.getElementById('draw-area-btn');

    drawAreaElement.addEventListener('click', (ev) => {
      // remove existing Area
      this.removeExistingArea();

      // turn off other map click events expecting this
      //  to be indentify if we add other map click events
      //  we will have to add that back.  so this not ideal
      mapComponent.map.off('click');

      // enable polygon drawer for leaflet map
      polygonDrawer.enable();
    });
  }

  // add leaflet drawbuttons to leaflet Control area
  // only adding fro future use.
  addDrawButtons(mapComponent) {
    const options = {
      position: 'topleft',
      draw: {
        polyline: false,
        polygon: {
          allowIntersection: false, // Restricts shapes to simple polygons
          drawError: {
            color: '#e1e100', // Color the shape will turn when intersects
            message: '<strong>Oh snap!<strong> you can\'t draw a polygon that intersects itself!'// Message that will show when intersect
          }
        },
        circle: false, // Turns off this drawing tool
        circlemarker: false,
        rectangle: false,
        marker: false,
        edit: false
      }
    };

    const drawControl = new L.Control.Draw(options);
    mapComponent.map.addControl(drawControl);

    this.addDrawStartedHandler(mapComponent);
  }

  // handler for when drawing is started on the map
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // @param { Object } mapComponent object
  // @param { Object } mapInfoComponent object
  addDrawStartedHandler(mapComponent) {
    // Assumming you have a Leaflet map accessible
    mapComponent.map.on('draw:drawstart', (e) => {
      // remove existing Area
      this.removeExistingArea();

      // turn off other map click events expecting this
      //  to be indentify if we add other map click events
      //  we will have to add that back.  so this not ideal
      mapComponent.map.off('click');
    });
  }

  // handler for when drawing is complete on the map
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // @param { Object } mapComponent object
  // @param { Object } mapInfoComponent object
  addDrawVertexCreatedHandler(mapComponent, mapInfoComponent) {
    // Assumming you have a Leaflet map accessible
    mapComponent.map.on('draw:created', (e) => {
      const { layer } = e;
      const bufferedLayer = this.bufferArea(layer.toGeoJSON());

      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(layer);
      this.drawAreaGroup.addLayer(bufferedLayer);

      // start adding the user draw shape to the map
      layer.addTo(mapComponent.map);

      // must click the i button to do this action we will have to remove this
      // if we want users to always be able to click the map and do mapinfo
      // if (checkValidObject(mapInfoComponent)) {
      //   // re-add indentify
      //   mapInfoComponent.addMapClickIdentifyClickHandler();
      // }

      // update store
      store.setStoreItem('lastaction', 'draw area');
      store.setStoreItem('userarea', layer.toGeoJSON());
      this.getZonal();
    });
  }

  // Listens for click events on the upload shape button.
  addUploadShapeHandler() {
    spinnerOn();
    const uploadFeaturesBtn = document.getElementById('upload-shape-btn');
    uploadFeaturesBtn.addEventListener('change', e => this.fileSelectHandler(e));
    spinnerOff();
  }

  fileSelectHandler(event) {
    spinnerOn('');
    store.setStoreItem('working_zonalstats', true);
    const fileList = event.target.files;
    const files = Explore.convertFileListToArray(fileList);
    this.processFiles(files);
  }

  async processFiles(files) {
    spinnerOn();
    store.setStoreItem('working_zonalstats', true);
    const fileSets = [];
    // Treat each folder in a zip archive as its own file set.
    const zips = files.filter(file => Explore.fileExt(file.name) === 'zip');
    const readProms = zips.map(zip => Explore.readZip(zip));
    const zipFileSets = await Promise.all(readProms);
    fileSets.push(...zipFileSets);
    // Non-zip files are all put into one file set.
    const nonZips = files.filter(file => Explore.fileExt(file.name) !== 'zip');
    fileSets.push(nonZips);

    /*
    // We're not ready to handle multiple shapes yet.
    fileSets.forEach(Explore.processFileSet, this)
    */

    // For now just process the first fileset.
    const fileSet = fileSets[0];
    const featureCollection = await Explore.processFileSet(fileSet);

    if (!checkValidObject(featureCollection)) {
      store.setStoreItem('working_zonalstats', false);
      spinnerOff();
      return false;
    }
    // Just grab the first feature we find for now
    const feature = featureCollection.features[0];

    if (checkValidObject(feature)) {
      const newLayer = L.geoJson(feature);

      this.drawAreaGroup.getLayers().forEach((layer) => {
        this.drawAreaGroup.removeLayer(layer);
      });

      this.removeExistingArea();

      store.setStoreItem('lastaction', 'upload_shape');
      store.setStoreItem('userarea', newLayer.toGeoJSON());

      const bufferedLayer = this.bufferArea(newLayer.toGeoJSON());

      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(newLayer);
      this.drawAreaGroup.addLayer(bufferedLayer);

      this.mapComponent.map.fitBounds(bufferedLayer.getBounds());
      this.mapComponent.saveZoomAndMapPosition();
      store.saveAction('addsavedgeojson');
      this.getZonal();
      return true;
    }
    return false;
  }

  static async processFileSet(files) {
    spinnerOn();
    const shpfileFiles = files
      .filter(file => ['shp', 'dbf', 'prj'].indexOf(Explore.fileExt(file.name)) > -1);
    const otherFiles = files.filter(file => shpfileFiles.indexOf(file) === -1);
    const shpfileBundles = Explore.bundleShpfileFiles(shpfileFiles);

    /*
    // We're not ready to handle multiple shapes yet.

    shpfileBundles.forEach(bundle => this.processShpfileBundle(bundle))
    otherFiles.forEach(file => {
      Explore.readFileAsync(file, 'readAsText').then(
        text => {
          let geojson = JSON.parse(text)
          //this.doSomethingWithShape(geojson)
        },
        error => { console.error(error); }
      )
    })

    // For now just grab the first shapefile available.
    // If no shapefile bundles exist just grab the first geojson file.
    */
    if (shpfileBundles.length) {
      const bundleToProcess = shpfileBundles[0];
      const geojson = Explore.convertShpfileBundleToGeojson(bundleToProcess);
      return geojson;
    }

    const file = otherFiles[0];
    const text = await Explore.readFileAsync(file, 'readAsText');
    // only do this is the file has text
    if (checkValidObject(text)) {
      const geojson = JSON.parse(text);
      return geojson;
    }
    return {};
  }

  static bundleShpfileFiles(shpfileFiles) {
    const shpfileFilenames = new Set(
      shpfileFiles.map(file => Explore.getFilenameWithoutExt(file.name))
    );
    const shpfileBundles = [];
    shpfileFilenames.forEach((filename) => {
      const files = shpfileFiles
        .filter(file => Explore.getFilenameWithoutExt(file.name) === filename);
      const shp = files.filter(file => Explore.fileExt(file.name) === 'shp')[0];
      if (shp) {
        const obj = {}; obj.shp = shp;
        const dbf = files.filter(file => Explore.fileExt(file.name) === 'dbf')[0];
        const prj = files.filter(file => Explore.fileExt(file.name) === 'prj')[0];
        if (dbf) obj.dbf = dbf;
        if (prj) obj.prj = prj;
        shpfileBundles.push(obj);
      }
    });
    return shpfileBundles;
  }

  /**
   * Read a zip file and organize its contents by folder.
   *
   * Returns an Array of Arrays, where sub-arrays are lists of files
   * broken out by folder (top-level of zip is its own folder).
   *
   * @param archive is a File object representing a zip file
   */
  static async readZip(archive) {
    const jszip = new JSZip();
    const folders = await jszip.loadAsync(archive).then(
      (zip) => {
        const files = [];
        Object.keys(zip.files).forEach((key) => {
          const entry = zip.files[key];
          if (!entry.dir) files.push(entry);
        });
        return Explore.readZipFolders(files);
      },
      (err) => { throw new Error(`Error loading ${archive}: ${err}`); }
    );
    const fileSetProms = [];
    Object.keys(folders).forEach((dir) => {
      const files = folders[dir]
        .filter(file => Explore.isValidFile(file))
        .map((file) => {
          const filename = file.name.split('/').slice(-1).join('');
          return file.async('blob').then(
            blob => new File([blob], filename),
            (err) => { throw new Error(`Error reading ${filename}.`, `${err}`); }
          );
        });
      const prom = Promise.all(files);
      fileSetProms.push(prom);
    });
    return fileSetProms;
  }

  static readZipFolders(files) {
    const folders = { top: [] };
    files.forEach((f) => {
      let dir = f.name.split('/').slice(0, -1).join('');
      if (!dir) dir = 'top';
      if (!folders[dir]) folders[dir] = [];
      folders[dir].push(f);
    });
    return folders;
  }

  static async convertShpfileBundleToGeojson(bundle) {
    const dbf = await Explore.readFileAsync(bundle.shp);
    const shp = await Explore.readFileAsync(bundle.dbf);
    const geojson = await shapefile.read(dbf, shp);
    if (bundle.prj) {
      const prj = await Explore.readFileAsync(bundle.prj, 'readAsText');
      geojson.features = geojson.features
        .map(feature => Explore.convertFeatureProjection(feature, prj));
    }
    return geojson;
  }

  static convertFeatureProjection(feature, prj) {
    const converted = feature;
    converted.geometry.coordinates = feature.geometry.coordinates
      .map(coordSet => coordSet.map(coord => proj4(prj, 'EPSG:4326', coord)));
    return converted;
  }

  static readFileAsync(file, readFunc = 'readAsArrayBuffer', resolveUndefinedFiles = true) {
    return new Promise((resolve, reject) => {
      if (file !== undefined) {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          resolve(event.target.result);
        };
        fileReader.onerror = (error) => {
          reject(error);
        };
        fileReader[readFunc](file);
      } else if (resolveUndefinedFiles) {
        resolve();
      } else {
        reject(new Error('No file specified.'));
      }
    });
  }

  static getFilenameWithoutExt(filename) {
    return filename.split('.').slice(0, -1).join('');
  }

  static isValidFile(file) {
    const validExts = ['geojson', 'json', 'shp', 'dbf', 'prj'];
    const isValid = validExts.filter(ext => ext === Explore.fileExt(file.name)).length;
    return Boolean(isValid);
  }

  static replaceFilenameExtWith(ext, filename) {
    const nameform = filename.split('.').slice(0, -1).join('');
    return [nameform, ext].join('.');
  }

  static fileExt(filename) {
    return filename.split('.').pop();
  }

  static convertFileListToArray(fileList) {
    const files = [];
    const len = fileList.length;
    let i = 0;
    while (i < len) {
      files.push(fileList.item(i));
      i += 1;
    }
    return files;
  }
}
