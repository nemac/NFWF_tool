import { CancelToken, post } from 'axios';
import { Store } from './store';

// import { postData } from '../config/testpost';
import { checkValidObject } from './utilitys';

// prod api is having issues some I am switching ot the dev version until its resolved
// const apiEndpoint = 'https://c5pbxj0fe6.execute-api.us-east-1.amazonaws.com/'; // - production api
// const zonalStatsPath = 'prod/zonal_stats'; // - production path
const apiEndpoint = 'https://rlwk45u34h.execute-api.us-east-1.amazonaws.com/';  // - Dev api
const zonalStatsPath = 'beta/zonal_stats'; // - Dev path
const store = new Store({});

// const apiEndpoint = 'https://ktj0thaws0.execute-api.us-east-1.amazonaws.com/';
// const zonalStatsPath = 'Dev/zonal_stats';

const maxAttempts = 3;

/** API Wrapper Service Class
* this wraps the lambda service into axios js calls
* it should only handle the api calls
*/
export class ZonalStatsAPI {
  constructor(url = apiEndpoint, path = zonalStatsPath) {
    this.url = url + path;
    this.cancelToken = CancelToken.source();
    this.seedLambda();
  }

  makeConfigObj(postdata) {
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
    return axiosConfig;
  }

  // seeds zonal stats lambda so its ready for requests
  seedLambda() {
    const seedpostdata = {"type": "FeatureCollection","features": [{"type":"Feature","properties":{"region":"continental_us"},"geometry":{"type":"Polygon","coordinates":[[[-82.554037,35.594925],[-82.553758,35.594785999999985],[-82.553973,35.594715999999984],[-82.554037,35.594925]]]}}]} // eslint-disable-line
    const axiosConfig = this.makeConfigObj(seedpostdata);
    const region = 'continental_us';
    try {
      return post(`${this.url}?region=${region}`, seedpostdata, axiosConfig);
    } catch (err) {
      return err;
    }
  }

  async getZonalStatsSummary(postdata) {
    const axiosConfig = this.makeConfigObj(postdata);
    let numAttempts = 0;
    while (numAttempts < maxAttempts) {
      try {
        const region = store.getStateItem('region');
        const response = await post(`${this.url}?region=${region}`, postdata, axiosConfig);
        if (response.status === 200 && response.data) {
          return response.data;
        }
      } catch (err) {
        numAttempts += 1;
      }
    }
    // We've tried three times with no success. Throw an error with a message to the user.
    throw new Error('Something went wrong. Please try again.');
  }
}
