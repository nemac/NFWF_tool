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

import {
  drawZonalStatsFromAPI,
  toggleMouseHighLightsOn,
  toggleLabelHighLightsOn,
  toggleMouseHighLightsOff,
  toggleLabelHighLightsOff,
  togglePermHighLightsAllOff,
  makeHTMLName,
  isGraphActivetate,
  viewLongZonalStatsFromShape
} from './zonalStats';

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

    const {
      mapComponent,
      mapInfoComponent,
      URLCls,
      hasShareURL
    } = props;

    this.mapComponent = mapComponent;
    this.URL = URLCls;
    this.drawAreaGroup = L.featureGroup().addTo(mapComponent.map);
    this.hasShareURL = hasShareURL;

    // defualt buffer style
    this.bufferedoptions = {
      fillColor: '#99c3ff',
      color: '#99c3ff'
    };

    this.labelOptions = {
      className: 'userarealabel',
      direction: 'center',
      noHide: false,
      clickable: false,
      permanent: true
    };


    this.defaultAreaName = 'Area ';

    // handler for when drawing is completed
    this.addDrawVertexCreatedHandler(mapComponent, mapInfoComponent);

    // handler for drawing first vertex
    Explore.addDrawVertexHandler(mapComponent);

    // handler for clicking the clear area button
    this.addClearAreaClickHandler();

    // handler for clicking the draw area button
    Explore.addDrawAreaClickHandler(mapComponent);

    // handle stop of draw with escape before finsihed
    Explore.addDrawVertexStop(mapComponent, mapInfoComponent);

    // initalize s3 stored shapes API
    this.StoreShapesAPI = new StoreShapesAPI();

    this.ZonalStatsAPI = new ZonalStatsAPI();

    // draw the user area on the map
    if (!this.hasShareURL) {
      this.drawUserAreaFromUsereas();
    }

    this.addUploadShapeHandler();

    Explore.addListAreasHandler();

    this.addUpdateStatisticsHandler();

    this.mapComponent.map.addEventListener('zonalstatsend', (e) => {
      Explore.zonalStatsHandler();
    });

    this.mapComponent.map.addEventListener('retreives3end', (e) => {
      spinnerOff();
    });

    this.mapComponent.map.addEventListener('retreives3start', (e) => {
      spinnerOn();
    });

    window.addEventListener('removeuserareend', (e) => {
      this.clearLayersAndDetails();
      this.drawUserAreaFromUsereas();
    });

    Explore.windowListnersToStopRoqueSpinner();
    // uncomment this if we want to add the draw area button to leaflet
    // control
    // this.addDrawButtons(mapComponent);
  }

  static windowListnersToStopRoqueSpinner() {
    // ensure spinener stops after working us complete...
    window.addEventListener('mouseover', (e) => {
      spinnerOff();
    });

    window.addEventListener('click', (e) => {
      spinnerOff();
    });

    window.addEventListener('touchmove', (e) => {
      spinnerOff();
    });

    window.addEventListener('touchstart', (e) => {
      spinnerOff();
    });
  }

  // user clickss path should navigate into zonal stats details
  static clickShape(e) {
    const pathclass = e.target.options.className;
    const name = pathclass.replace('path--USERAREA-', '');
    viewLongZonalStatsFromShape(name);
  }

  bufferArea(unbufferedGeoJSON) {
    // buffer the geoJSON by 1 kilometer
    const bufferedGeoJSON = buffer(unbufferedGeoJSON, 1, { units: 'kilometers' });

    let name = '';
    if (!checkValidObject(name)) {
      let shapecount = store.getStateItem('userareacount');
      if (!checkValidObject(shapecount)) {
        shapecount = 1;
      } else {
        shapecount += 1;
      }
      name = `${this.defaultAreaName}${shapecount}`;
    }

    const HTMLName = makeHTMLName(name);
    this.bufferedoptions.className = `path-${HTMLName}`;

    // convert geoJson to leaflet layer
    const bufferedLayer = L.geoJson(bufferedGeoJSON, this.bufferedoptions);
    // /bufferedLayer

    bufferedLayer.on({
      mouseover: (e) => {
        if (!isGraphActivetate()) {
          const path = e.target;
          const labelname = path.options.className.replace('path-', 'label-name-');
          const labelElem = document.getElementById(labelname);
          toggleLabelHighLightsOn(labelElem);
          const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
          const labelzElem = document.getElementById(labelzname);
          toggleLabelHighLightsOn(labelzElem);

          const pathelem = document.querySelector(`.${path.options.className}`);
          toggleMouseHighLightsOn(pathelem);
        }
      },
      mouseout: (e) => {
        if (!isGraphActivetate()) {
          const path = e.target;
          const labelname = path.options.className.replace('path-', 'label-name-');
          const labelElem = document.getElementById(labelname);
          toggleLabelHighLightsOff(labelElem);
          const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
          const labelzElem = document.getElementById(labelzname);
          toggleLabelHighLightsOff(labelzElem);

          const pathelem = document.querySelector(`.${path.options.className}`);
          toggleMouseHighLightsOff(pathelem);
        }
      },
      click: (e) => {
        Explore.clickShape(e);
      }
    });

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

  // update zonal stats for all user ares in the state store
  async updateZonal() {
    store.setStoreItem('working_zonalstats', true);
    spinnerOn();
    // this temp remove of stats so we can recalulate.
    const zonalAreaWrapper = document.getElementById('zonal-area-wrapper');
    if (zonalAreaWrapper) {
      zonalAreaWrapper.innerHTML = 'Recalculating area information';
    }

    // get the curreent shapes from the sore
    const currentshapes = store.getStateItem('userareas');

    const checkobj = {}.hasOwnProperty;

    if (!checkValidObject(currentshapes)) {
      store.setStoreItem('working_zonalstats', false);
      zonalAreaWrapper.innerHTML = 'Click on the map to bring up information. Select multiple points to draw an area and get information on the area.';
      spinnerOff('getZonal checkValidObject rawpostdata');
      return {};
    }

    // using for loop because it allows await functionality with
    // async calls to zonal stats api.  this will ensure we wait for the promise to
    // resolve and is added to the store before we progress on. using a check for hasOwnProperty
    // to deal with all the prototpe entries
    for (const key in currentshapes) {
      if (checkobj.call(currentshapes, key)) {
        const rawpostdata = currentshapes[key][2].userarea_buffered;
        const name = currentshapes[key][0].name;

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
          zonalAreaWrapper.innerHTML = 'Click on the map to bring up information. Select multiple points to draw an area and get information on the area.';
          spinnerOff('getZonal checkValidObject rawpostdata');
          return {};
        }

        // send to zonal stas and await
        const ZonalStatsJson = await this.ZonalStatsAPI.getZonalStatsSummary(postdata);

        currentshapes[key][3].zonalstatsjson = ZonalStatsJson;
        if (checkValidObject(ZonalStatsJson.features)) {
          drawZonalStatsFromAPI(ZonalStatsJson.features[0].properties.mean,
            name,
            this.mapComponent.map);
        }
      }
    }

    // update as complete
    store.setStoreItem('userareas', currentshapes);
    store.setStoreItem('working_zonalstats', false);
    spinnerOff('getZonal done');
    return null;
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
    const name = this.storeShapes();
    this.saveUserShapesToS3();

    store.setStoreItem('working_zonalstats', false);
    if (checkValidObject(ZonalStatsJson.features)) {
      drawZonalStatsFromAPI(ZonalStatsJson.features[0].properties.mean,
        name,
        this.mapComponent.map);
    }

    this.mapComponent.map.fireEvent('zonalstatsend');
    store.setStoreItem('working_zonalstats', false);
    spinnerOff('getZonal done');

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
      // this.drawSavedGeoJson(geojson);
    } else {
      // add failed to get file from s3 code

    }
    return geojson;
  }

  // get geojson from s3
  restoreSavedGeoJson() {
    store.setStoreItem('working_s3retreive', true);
    spinnerOn();
    // if their is a query string paramter for shareurl=trye restore the shapes.
    if (this.hasShareURL === 'true') {
      // restore users shapes from s3 when there is a share UTL
      // const userareas = store.getStateItem('savedshapes');
      this.getShapesFromS3();
    }

    store.setStoreItem('working_s3retreive', false);
    spinnerOff();
  }

  // think this is no longer used...
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
        // this.getZonal();
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
      this.addUserAreaLabel(bufferedLayer);

      this.getZonal();
      return layer;
    }
    return null;
  }

  // get shapes that we saved on s3.  In order to create a share URL - a web URL
  // we can send to another users we need to be able to pass large geospatial datasets
  // we are using a lambda function/api to store the the files on s3 this will retreive this.
  //  the only thing in the url is the s3 bucket and file name
  async getShapesFromS3() {
    // start the working function so we have spinner active - informs
    // users the website is doing something
    store.setStoreItem('working_s3retreive', true);
    this.mapComponent.map.fireEvent('retreives3start');

    spinnerOn();
    // get the saved shapes state item - holds the s3 bucket and file name
    const currentshapes = store.getStateItem('savedshapes');
    const userareacount = store.getStateItem('userareacount');

    // remove old shapes so they are not duplicated.  also want to make sure make
    // sure we are replicating the shared map.
    this.removeExistingArea();

    let newshapes = {};
    let count = 0;
    const checkobj = {}.hasOwnProperty;

    // using for loop because it allows await functionality with
    // async calls to zonal stats api.  this will ensure we wait for the promise to
    // resolve and is added to the store before we progress on. using a check for hasOwnProperty
    // to deal with all the prototpe entries
    for (const key in currentshapes) {
      if (checkobj.call(currentshapes, key)) {
        const nameSaved = currentshapes[key][0].name;

        // get bucket and file names for the user area, buffered user area, and zonal stats
        const userareaSaved = currentshapes[key][1].savedshape_userarea;
        const bufferedSaved = currentshapes[key][2].savedshape_userarea_buffered;
        const zonalSaved = currentshapes[key][3].savedshape_zonalstatsjson;

        let usershape = {};
        let bufferedshape = {};
        let zonalshape = {};

        // make sure each area is actuall object then retreive
        // the actual geospatial data from s3. no api required.
        // just a http get of data
        if (checkValidObject(userareaSaved)) {
          usershape = await this.StoreShapesAPI.httpGetSavedGeoJSON(userareaSaved.bucket,
            userareaSaved.key);
        }
        if (checkValidObject(bufferedSaved)) {
          bufferedshape = await this.StoreShapesAPI.httpGetSavedGeoJSON(bufferedSaved.bucket,
            bufferedSaved.key);
        }
        if (checkValidObject(zonalSaved)) {
          zonalshape = await this.StoreShapesAPI.httpGetSavedGeoJSON(zonalSaved.bucket,
            zonalSaved.key);
        }

        // counter for naming JSON object
        count += 1;

        // new geospatial data object for inserting into the userareas state item.
        // this items has the shapes we render on the map and has the zonal statiscs information
        // for the dashboard
        const newshape = {
          [`userarea${count}`]: [
            { name: nameSaved },
            { userarea: usershape },
            { userarea_buffered: bufferedshape },
            { zonalstatsjson: zonalshape }
          ]
        };

        // update the state item with new useras object
        const userareas = store.getStateItem('userareas');

        newshapes = { ...userareas, ...newshape };
        store.setStoreItem('userareas', newshapes);
        store.setStoreItem('savedshapes', currentshapes);
        store.setStoreItem('userareacount', userareacount);
      }
    }

    //  set the state items and turn of the site is working
    store.setStoreItem('userareas', newshapes);
    this.drawUserAreaFromUsereas();

    store.setStoreItem('working_s3retreive', false);
    this.mapComponent.map.fireEvent('retreives3end');
    spinnerOff();

    return null;
  }


  // renders the shapes from the user areas state object
  drawUserAreaFromUsereas() {
    store.setStoreItem('working_drawlayers', true);
    spinnerOn();

    const currentshapes = store.getStateItem('userareas');
    Object.keys(currentshapes).forEach((key) => {
      const name = currentshapes[key][0].name;
      const userarea = currentshapes[key][1].userarea;
      const buffered = currentshapes[key][2].userarea_buffered;
      const zonal = currentshapes[key][3].zonalstatsjson;

      if (checkValidObject(userarea)) {
        // convert geoJson to leaflet layer
        const layer = L.geoJson(userarea);

        const HTMLName = makeHTMLName(name);
        this.bufferedoptions.className = `path-${HTMLName}`;

        const bufferedLayer = L.geoJson(buffered, this.bufferedoptions);

        // add mouserovers for the shapes.
        bufferedLayer.on({
          mouseover: (e) => {
            if (!isGraphActivetate()) {
              const path = e.target;
              const labelname = path.options.className.replace('path-', 'label-name-');
              const labelElem = document.getElementById(labelname);
              toggleLabelHighLightsOn(labelElem);
              const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
              const labelzElem = document.getElementById(labelzname);
              toggleLabelHighLightsOn(labelzElem);

              const pathelem = document.querySelector(`.${path.options.className}`);
              togglePermHighLightsAllOff(pathelem);
              toggleMouseHighLightsOn(pathelem);
            }
          },
          mouseout: (e) => {
            if (!isGraphActivetate()) {
              const path = e.target;
              const labelname = path.options.className.replace('path-', 'label-name-');
              const labelElem = document.getElementById(labelname);
              toggleLabelHighLightsOff(labelElem);
              const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
              const labelzElem = document.getElementById(labelzname);
              toggleLabelHighLightsOff(labelzElem);

              const pathelem = document.querySelector(`.${path.options.className}`);
              toggleMouseHighLightsOff(pathelem);
            }
          },
          click: (e) => {
            Explore.clickShape(e);
          }
        });

        // add layer to the leaflet map
        this.drawAreaGroup.addLayer(layer);

        this.drawAreaGroup.addLayer(bufferedLayer);

        this.addUserAreaLabel(bufferedLayer, name);

        if (checkValidObject(zonal.features)) {
          drawZonalStatsFromAPI(zonal.features[0].properties.mean, name, this.mapComponent);
        }

        return layer;
      }

      return null;
    });

    store.setStoreItem('working_drawlayers', false);
    spinnerOff();

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

  // clear zonalstats
  static clearDetails() {
    // this temp remove of stats while we work on multiple shapes.
    const zonalAreaWrapper = document.getElementById('zonal-area-wrapper');
    if (zonalAreaWrapper) {
      zonalAreaWrapper.innerHTML = '<p class="zonal-instructions-initial">Click on the map to bring up information. Select multiple points to draw an area and get information on the area.</p>';
    }
  }

  // clear Details
  clearLayersAndDetails() {
    this.drawAreaGroup.clearLayers();
    Explore.clearDetails();
  }

  // remove the existing area
  removeExistingArea() {
    this.drawAreaGroup.clearLayers();
    store.removeStateItem('userarea');
    store.removeStateItem('userareas');
    store.removeStateItem('savedshapes');
    store.removeStateItem('savedshape');
    Explore.resetshapescounter();
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
      Explore.clearDetails();
    });
  }

  // handler for click the button drawing vertexes on the map
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // @param { Object } mapComponent object
  static addDrawAreaClickHandler(mapComponent) {
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
      // this.removeExistingArea();

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

  // add label to layer.
  // label option defined in Explore class
  addUserAreaLabel(layer, name) {
    // if name not passed create the default area name
    // this happens when the user is drawing a new area
    let newname = name;
    if (!checkValidObject(name)) {
      let shapecount = store.getStateItem('userareacount');
      if (!checkValidObject(shapecount)) {
        shapecount = 1;
      } else {
        shapecount += 1;
      }
      newname = `${this.defaultAreaName}${shapecount}`;
    }

    // labels nees a sec so it's placed on the correct location
    setTimeout(() => { layer.bindTooltip(newname, this.labelOptions).openTooltip(); }, 50);
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

      this.addUserAreaLabel(bufferedLayer);

      // must click the i button to do this action we will have to remove this
      // if we want users to always be able to click the map and do mapinfo
      // if (checkValidObject(mapInfoComponent)) {
      //   // re-add indentify
      //   mapInfoComponent.addMapClickIdentifyClickHandler();
      // }

      const geojson = layer.toGeoJSON();
      // update store
      store.setStoreItem('lastaction', 'draw area');
      store.setStoreItem('userarea', geojson);
      this.getZonal();
    });
  }

  static resetshapescounter() {
    store.removeStateItem('userareacount');
  }

  static storeshapescounter() {
    let userareacount = store.getStateItem('userareacount');
    if (!checkValidObject(userareacount)) {
      userareacount = 1;
    } else {
      userareacount += 1;
    }

    store.setStoreItem('userareacount', userareacount);
    return userareacount;
  }

  // add a new shape to user shape store
  storeShapes() {
    const currentshapes = store.getStateItem('userareas');

    const shapecount = Explore.storeshapescounter();
    const name = `${this.defaultAreaName}${shapecount}`;
    const newshape = {
      [`userarea${shapecount}`]: [
        { name },
        { userarea: store.getStateItem('userarea') },
        { userarea_buffered: store.getStateItem('userarea_buffered') },
        { zonalstatsjson: store.getStateItem('zonalstatsjson') }
      ]
    };

    const newshapes = { ...currentshapes, ...newshape };
    store.setStoreItem('userareas', newshapes);
    return name;
  }

  // saves shape to s3 and creates object in state.
  async saveUserShapesToS3() {
    const currentSavedShapes = store.getStateItem('savedshapes');

    // get the current users shapes
    const userarea = store.getStateItem('userarea');
    const buffered = store.getStateItem('userarea_buffered');
    const zonal = store.getStateItem('zonalstatsjson');
    const shapecount = store.getStateItem('userareacount');

    const savedUserarea = await this.StoreShapesAPI.saveShape(userarea);
    const savedUserareaBuffered = await this.StoreShapesAPI.saveShape(buffered);
    const savedZonalStatsJSON = await this.StoreShapesAPI.saveShape(zonal);

    const name = `${this.defaultAreaName}${shapecount}`;

    const newSavedShape = {
      [`savedshape${shapecount}`]: [
        { name },
        { savedshape_userarea: savedUserarea },
        { savedshape_userarea_buffered: savedUserareaBuffered },
        { savedshape_zonalstatsjson: savedZonalStatsJSON }
      ]
    };

    const newshapes = { ...currentSavedShapes, ...newSavedShape };
    store.setStoreItem('savedshapes', newshapes);
    return name;
  }


  addUpdateStatisticsHandler() {
    const UpdateZonalStatsBtn = document.getElementById('btn-update-zonal-stats');
    UpdateZonalStatsBtn.addEventListener('click', this.updateZonal.bind(this));
  }

  // Listens for click events on the upload shape button.
  static addListAreasHandler() {
    const ListAreasBtn = document.getElementById('btn-list-areas');
    if (checkValidObject(ListAreasBtn)) {
      ListAreasBtn.addEventListener('click', e => Explore.restoreshapes(e));
    }
  }

  // Listens for click events on the update statistics.
  static restoreshapes() {
    const ListAreasBtn = document.getElementById('btn-update-zonal-stats');
    if (checkValidObject(ListAreasBtn)) {
      ListAreasBtn.addEventListener('click', e => Explore.restoreshapes(e));
    }
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
