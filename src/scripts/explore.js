// dependencies
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

    this.mapComponent.map.addEventListener('zonalstatsend', (e) => {
      Explore.zonalStatsHandler();
    });

    // uncomment this if we want to add the draw area button to leaflet
    // control
    // this.addDrawButtons(mapComponent);
  }

  static zonalStatsHandler() {
    const clearAreaElement = document.getElementById('details-holder');
    const zonalstatsgeojson = store.getStateItem('zonalstatsjson');
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

  async getZonal() {
    spinnerOn();
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

    // send request to api
    const ZonalStatsJson = await this.ZonalStatsAPI.getZonalStatsSummary(postdata);
    store.setStoreItem('zonalstatsjson', ZonalStatsJson);

    spinnerOff();

    // add event to map for a listner that zonal stats have been calculated
    this.mapComponent.map.fireEvent('zonalstatsend');
    return ZonalStatsJson;
  }

  // retreive a saved geojson data from s3
  // assume the buffer has NOT been applied
  async retreiveS3GeojsonFile(projectfile = 'projected_4326_62155.geojson') {
    // remove existing Area
    this.removeExistingArea();

    const SaveGeoJSON = await this.StoreShapesAPI.getSavedGeoJSON(projectfile);

    // draw poly on map
    // ensure the user area object is valid (actuall has a value)
    if (checkValidObject(SaveGeoJSON)) {
      store.setStoreItem('projectfile', projectfile);

      this.drawSavedGeoJson(SaveGeoJSON);
      store.setStoreItem('userarea', SaveGeoJSON);
    } else {
      // add failed to get file from s3 code

    }

    // return geoJson
    return SaveGeoJSON;
  }

  // restore saved Geojson File
  restoreSavedGeoJson() {
    const projectfile = store.getStateItem('projectfile');
    this.retreiveS3GeojsonFile(projectfile);
  }

  // draw saved Geojson File
  drawSavedGeoJson(SaveGeoJSON) {
    // ensure the user area object is valid (actuall has a value)
    if (checkValidObject(SaveGeoJSON)) {
      // convert geoJson to leaflet layer
      const layer = L.geoJson(SaveGeoJSON);

      // buffer the geoJSON by 1 kilometer
      const bufferedGeoJSON = buffer(SaveGeoJSON, 1, { units: 'kilometers' });
      store.setStoreItem('userarea_buffered', bufferedGeoJSON);

      // convert geoJson to leaflet layer
      const bufferedLayer = L.geoJson(bufferedGeoJSON, this.bufferedoptions);

      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(layer);
      this.drawAreaGroup.addLayer(bufferedLayer);

      // force map to bounds
      if (checkValidObject(this.mapComponent)) {
        this.mapComponent.map.fitBounds(bufferedLayer.getBounds());
        this.mapComponent.saveZoomAndMapPosition();
        store.saveAction('addsavedgeojson');
      }

      return layer;
    }
    return null;
  }

  // draw the user area on the map
  drawUserArea() {
    const userarea = store.getStateItem('userarea');
    const userareaBuffered = store.getStateItem('userarea_buffered');


    // console.log(' drawUserArea', userarea)
    // ensure the user area object is valid (actuall has a value)
    if (checkValidObject(userarea) && checkValidObject(userareaBuffered)) {
      // convert geoJson to leaflet layer
      const layer = L.geoJson(userarea);
      const userareaBufferedLayer = L.geoJson(userareaBuffered, this.bufferedoptions);

      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(userareaBufferedLayer);
      this.drawAreaGroup.addLayer(layer);

      this.getZonal();
      return userareaBufferedLayer;
    }
    return null;
  }

  // handler for stoping (cancel) drawing on the map
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
    store.removeStateItem('zonalstatsjson');
    store.removeStateItem('projectfile');
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

      // buffer the geoJSON by 1 kilometer
      const bufferedGeoJSON = buffer(layer.toGeoJSON(), 1, { units: 'kilometers' });

      // convert geoJson to leaflet layer
      const bufferedLayer = L.geoJson(bufferedGeoJSON, this.bufferedoptions);
      this.drawAreaGroup.addLayer(bufferedLayer);
      this.drawAreaGroup.addLayer(layer);

      // start adding the user draw shape to the map
      // this.drawAreaGroup.addTo(mapComponent.map);
      // layer.addTo(mapComponent.map);

      // must click the i button to do this action we will have to remove this
      // if we want users to always be able to click the map and do mapinfo
      // if (checkValidObject(mapInfoComponent)) {
      //   // re-add indentify
      //   mapInfoComponent.addMapClickIdentifyClickHandler();
      // }

      // update store
      store.setStoreItem('lastaction', 'draw area');
      store.setStoreItem('userarea', layer.toGeoJSON());
      store.setStoreItem('userarea_buffered', bufferedLayer.toGeoJSON());


      this.getZonal();
    });
  }
}
