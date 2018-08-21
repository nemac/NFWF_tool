// dependencies
import proj4 from 'proj4';
import JSZip from 'jszip';
import L from 'leaflet';
import { Draw } from 'leaflet-draw';

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

// Shapefile library must be imported with require.
// import shapefile from 'shapefile' causes the library
// to be unavailable within a promise context for some reason.
var shapefile = require("shapefile");

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

    this.addUploadShapeHandler()
    // this.mapComponent.map.addEventListener('zonalstatsend', (e) => {
    //   console.log('zonalstatsend');
    // });

    // uncomment this if we want to add the draw area button to leaflet
    // control
    // this.addDrawButtons(mapComponent);
  }

  async getZonal() {
    spinnerOn();
    store.removeStateItem('zonalstatsjson');

    // get geoJSON to send to zonal stats lambda function
    const rawpostdata = store.getStateItem('userarea');
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

    // send request to api
    const ZonalStatsJson = await this.ZonalStatsAPI.getZonalStatsSummary(postdata);
    store.setStoreItem('zonalstatsjson', ZonalStatsJson);
    spinnerOff();

    // add event to map for a listner that zonal stats have been calculated
    this.mapComponent.map.fireEvent('zonalstatsend');
    return ZonalStatsJson;
  }

  async retreiveS3GeojsonFile(projectfile = 'projected_4326_62155.geojson') {
    const geojson = await this.StoreShapesAPI.getSavedGeoJSON(projectfile);

    // draw poly on map
    // ensure the user area object is valid (actuall has a value)
    if (checkValidObject(geojson)) {
      store.setStoreItem('projectfile', projectfile);

      this.drawSavedGeoJson(geojson);
      store.setStoreItem('userarea', geojson);
    } else {
      // add failed to get file from s3 code

    }
    return geojson;
  }

  restoreSavedGeoJson() {
    const projectfile = store.getStateItem('projectfile');
    this.retreiveS3GeojsonFile(projectfile);
  }

  drawSavedGeoJson(geojson) {
    if (checkValidObject(geojson)) {
      const layer = L.geoJson(geojson);
      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(layer);

      // force map to bounds
      if (checkValidObject(this.mapComponent)) {
        this.mapComponent.map.fitBounds(layer.getBounds());
        this.mapComponent.saveZoomAndMapPosition();
        store.saveAction('addsavedgeojson');
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

      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(layer);
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
    store.removeStateItem('projectfile');
  }

  // handler for click the button tp clear all drawings
  addClearAreaClickHandler() {
    // Click handler for you button to start drawing polygons
    const clearAreaElement = document.getElementById('btn-clear-area');
    clearAreaElement.addEventListener('click', (ev) => {
      this.removeExistingArea();
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
      this.drawAreaGroup.addLayer(layer);

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


  addShapeToMap(geojson) {

  }

  // Listens for click events on the upload shape button.
  addUploadShapeHandler() {
    const uploadFeaturesBtn = document.getElementById('upload-shape-btn');
    uploadFeaturesBtn.addEventListener('change', e => this.fileSelectHandler(e));
  }

  fileSelectHandler(event) {
    let fileList = event.target.files;
    // Move files from FileList object to an Array
    let files = []; for (let f of fileList) { files.push(f); }
    let validFiles = files.filter(this.isValidFile, this)
    if (validFiles.length) {
      this.processFiles(validFiles)
    } else {
      console.log("No valid files were selected.")
    }
  }

  isValidFile(file) {
    let validExts = [ 'zip', 'geojson', 'json', 'shp', 'dbf', 'prj' ]
    let isValid = validExts.filter(ext => ext === this.fileExt(file.name)).length
    return Boolean(isValid)
  }

  async processFiles(files) {
    let fileSets = [];
    // Treat each folder in a zip archive as its own file set.
    let zips = files.filter(file => this.fileExt(file.name) === 'zip')
    for (let zip of zips) {
      let zipFileSets = await this.readZip(zip);
      fileSets.push(...zipFileSets);
    }
    // Non-zip files are all put into one file set.
    let nonZips = files.filter(file => this.fileExt(file.name) !== 'zip')
    fileSets.push(nonZips)
    fileSets.forEach(this.processFileSet, this)
  }

  async processFileSet(files) {
    let shpfileFiles = files.filter(file => {
      return ['shp', 'dbf', 'prj'].indexOf(file.type) > -1;
    });
    let otherFiles = files.filter(file => shpfileFiles.indexOf(file) === -1);
    let shpfileBundles = this.bundleShpfileFiles(shpfileFiles);
    shpfileBundles.forEach(bundle => this.processShpfileBundle(bundle))
    otherFiles.forEach(file => {
      this.readFileAsync(file, 'readAsText').then(
        text => {
          let geojson = JSON.parse(text)
          this.doSomethingWithShape(geojson)
        },
        error => { console.error(error); }
      )
    })

  }

  doSomethingWithShape(geojson) {
    console.log(geojson);
  }

  bundleShpfileFiles(shpfileFiles) {
    let shpfileFilenames = new Set(
      shpfileFiles.map(file => this.getFilenameWithoutExt(file.name))
    )
    let shpfileBundles = [];
    shpfileFilenames.forEach(filename => {
      let files = shpfileFiles.filter(
        file => this.getFilenameWithoutExt(file.name) === filename
      )
      let shp = files.filter(file => file.type === 'shp')[0];
      if (shp) {
        let obj = {}; obj.shp = shp;
        let dbf = files.filter(file => file.type === 'dbf')[0];
        let prj = files.filter(file => file.type === 'prj')[0];
        if (dbf) obj.dbf = dbf;
        if (prj) obj.prj = prj;
        shpfileBundles.push(obj);
      }
    })
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
  async readZip(archive) {
    let jszip = new JSZip();
    let folders = await jszip.loadAsync(archive).then(
      zip => {
        let files = [];
        for (let key in zip.files) {
          let entry = zip.files[key];
          if (!entry.dir) files.push(entry);
        }
        return this.readZipFolders(files);
      },
      err => {
        console.log(
          `Error loading ${archive}.`,
          `Actual error: ${err}`
        );
      }
    )
    let fileSets = [];
    for (let dir in folders) {
      let files = await Promise.all(folders[dir]
        .filter(this.isValidFile, this)
        .map(file => {
          let filename = file.name.split('/').slice(-1).join('');
          return file.async('blob').then(
            blob => new File([blob], filename, { type: this.fileExt(filename) }),
            err => {
              console.log(`Error reading ${filename}.`, `${err}`)
            }
          )
        })
      )
      fileSets.push(files);
    }
    return fileSets;
  }

  readZipFolders(files) {
    let folders = {
      'top': []
    }
    files.forEach(f => {
      let dir = f.name.split('/').slice(0,-1).join('');
      dir = dir ? dir : 'top';
      if (!folders[dir]) folders[dir] = [];
      folders[dir].push(f);
    })
    return folders;
  }

  async processShpfileBundle(bundle) {
    let dbf = await this.readFileAsync(bundle.shp);
    let shp = await this.readFileAsync(bundle.dbf);
    let geojson = await shapefile.read(dbf, shp);
    if (bundle.prj) {
      let prj = await this.readFileAsync(bundle.prj, 'readAsText');
      geojson.features = geojson.features.map(feature => {
        return this.convertFeatureProjection(feature, prj);
      })
    }
    this.doSomethingWithShape(geojson);
  }

  convertFeatureProjection(feature, prj) {
    let coords = feature.geometry.coordinates
    feature.geometry.coordinates = coords.map(coordSet => {
      return coordSet.map(coord => proj4(prj, 'EPSG:4326', coord));
    })
    return feature;
  }

  readFileAsync(file, readFunc='readAsArrayBuffer', resolveUndefinedFiles=true) {
    return new Promise((resolve, reject) => {
      if (file !== undefined) {
        let fileReader = new FileReader();
        fileReader.onload = (event) => {
          resolve(event.target.result)
        }
        fileReader.onerror = (error) => {
          reject(error)
        }
        fileReader[readFunc](file)
      }
      else {
        if (resolveUndefinedFiles) {
          resolve()
        } else {
          reject("No file specified.")
        }
      }
    })
  }

  getFilenameWithoutExt(filename) {
    return filename.split('.').slice(0, -1).join('');
  }

  replaceFilenameExtWith(ext, filename) {
    let nameform = filename.split('.').slice(0, -1).join('');
    return [nameform, ext].join('.');
  }


  fileExt(filename) {
    return filename.split('.').pop()
  }

}
