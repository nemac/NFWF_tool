import { CancelToken, get, post } from 'axios';
import { checkValidObject } from './utilitys';


const apiEndpoint = 'https://s3.amazonaws.com/nfwf-tool-user-shapes/08-2018-projects/';
const testGeojsonFile = 'projected_4326_62155.geojson';
const apiEndpointSave = 'https://lg0njzoglg.execute-api.us-east-1.amazonaws.com/Prod/upload_shape';
// const savedShapeEndpoint = 'https://s3.amazonaws.com/nfwf-tool-user-shapes/Prod/';

/** API Wrapper Service Class
* this wrapps the call to a s3 bucket for save geojson into local storage
* TODO add support github gist
*/
export class StoreShapesAPI {
  constructor(url = apiEndpointSave) {
    this.url = url;
    this.cancelToken = CancelToken.source();
  }

  async httpGet(queryString = '') {
    this.cancelToken.cancel('Cancelled Ongoing Request');
    this.cancelToken = CancelToken.source();
    const axiosConfig = {
      cancelToken: this.cancelToken.token,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    };

    try {
      const response = await get(`${apiEndpoint}${queryString}`, axiosConfig);
      return response.data;
    } catch (err) {
      return {};
    }
  }

  async httpGetSavedGeoJSON(bucket = 'nfwf-tool-user-shapes', key = '') {
    this.cancelToken.cancel('Cancelled Ongoing Request');
    this.cancelToken = CancelToken.source();
    const axiosConfig = {
      cancelToken: this.cancelToken.token,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    };

    try {
      const response = await get(`https://s3.amazonaws.com/${bucket}/${key}`, axiosConfig);
      return response.data;
    } catch (err) {
      return {};
    }
  }

  // get geojson from s3 bucket
  getSavedGeoJSON(GeojsonFile = testGeojsonFile) {
    return this.httpGet(GeojsonFile);
  }

  async httpPost(postdata) {
    // make sure we have post data don't bother sending anything if we don't
    if (!checkValidObject(postdata)) {
      return { baddata: postdata };
    }

    this.cancelToken.cancel('Cancelled Ongoing Request');
    this.cancelToken = CancelToken.source();
    const axiosConfig = {
      cancelToken: this.cancelToken.token,
      headers: {
        'content-type': 'text/plain'
      }
    };

    try {
      const response = await post(apiEndpointSave, postdata, axiosConfig);
      return response.data; // features[0].mean;
    } catch (err) {
      return { err };
    }
  }

  saveShape(postdata) {
    return this.httpPost(postdata);
  }
}
