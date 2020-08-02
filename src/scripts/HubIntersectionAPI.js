
// Use Case
//
// Normal Flow:
//  Using a supplied geojson feature, convert the geometry to Esri json and
//  send a request for an intersection query to the hubs Feature Server hosted on ArcGIS Online.
//  The response contains a list of Esri feature objects that intersect the supplied feature.
//
//  Each feature object is then transformed back into a geojson feature to match the structure
//  of a geojson feature returned from the zonal stats API (nfwf-tool-api).
//  When all features have finished processing, return an Array of processed features.
//
// Alternate Flow:
//  The request for intersection is a success, but no features are returned.
//  Return an empty Array.
//
// Alternate Flow (Errors):
//  - The geojson feature is malformed.
//  - The Feature Server returns a bad request status code (400).
//  In these cases an Error object is returned.
import simplify from '@turf/simplify';
import hubIntersectionConfig from '../config/hubIntersectionConfig';

// Import custom classess
import { Store } from './store';

const Terraformer = require('terraformer');
Terraformer.ArcGIS = require('terraformer-arcgis-parser');
const axios = require('axios');

const store = new Store({});

export class HubIntersectionApi {
  constructor() {
    this.hubIntersectionConfig = hubIntersectionConfig;
  }

  static filterConfig() {
    // get current region
    this.region = store.getStateItem('region');

    // limit hub AGOL config to the current region
    const regionConfig = hubIntersectionConfig.filter(region => (
      region.region === this.region
    ));

    // get AGOL url from region limited config
    return regionConfig[0];
  }

  static transformAgolAttrs(attrs) {
    const props = { mean: {} };
    const config = HubIntersectionApi.filterConfig();

    Object.keys(attrs).forEach((agolField) => {
      let fieldName;
      const val = attrs[agolField];
      if (agolField in config.fieldMaps) {
        fieldName = config.fieldMaps[agolField];
      } else {
        fieldName = agolField;
      }
      props.mean[fieldName] = val;
    });
    return props;
  }

  static simplifyshape(feature) {
    const options = { tolerance: 0.0009, highQuality: false };
    const simplified = simplify(feature, options);
    return simplified;
  }

  static simplifyGeoJson(geojsonFeatures) {
    return geojsonFeatures.map((feature) => {
      const options = { tolerance: 0.0009, highQuality: false };
      const simplified = simplify(feature, options);
      return simplified;
    });
  }

  static convertAgolHubsFeature(feature) {
    const geojsonGeom = Terraformer.ArcGIS.parse(feature.geometry);
    const featureGeojson = {
      type: 'Feature',
      properties: HubIntersectionApi.transformAgolAttrs(feature.attributes),
      geometry: geojsonGeom
    };
    return featureGeojson;
  }

  async getIntersectedHubs(feature) {
    try {
      let doesNothing = this.hubIntersectionConfig; // eslint-disable-line
      const esriGeom = Terraformer.ArcGIS.convert(feature.geometry);
      const esriGeomStr = JSON.stringify(esriGeom);
      const config = HubIntersectionApi.filterConfig();
      const url = config.queryUrl;
      const agolOutFields = config.agolOutFields;

      // create post form data
      const postBody = new URLSearchParams();
      postBody.append('f', 'json');
      postBody.append('inS', '4326');
      postBody.append('outSR', '4326');
      postBody.append('outFields', agolOutFields.join());
      postBody.append('geometryType', 'esriGeometryPolygon');
      postBody.append('spatialRel', 'esriSpatialRelIntersects');
      postBody.append('geometry', esriGeomStr);

      const response = await axios.post(url, postBody);

      if (Object.prototype.hasOwnProperty.call(response.data, 'error')) {
        throw response.data.message;
      }

      const esriFeatures = response.data.features;
      const geojsonFeatures = esriFeatures.map(f => HubIntersectionApi.convertAgolHubsFeature(f));
      const newgeojson = HubIntersectionApi.simplifyGeoJson(geojsonFeatures);
      const region = store.getStateItem('region');

      newgeojson.forEach((newgeojsonfeature) => {
        newgeojsonfeature.properties.region = region; // eslint-disable-line
      });

      return newgeojson;
    } catch (err) {
      return new Error(err);
    }
  }
}
