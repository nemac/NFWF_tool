import { CancelToken, post } from 'axios';
// import { postData } from '../config/testpost';
import { checkValidObject } from './utilitys';

const apiEndpoint = 'https://lg0njzoglg.execute-api.us-east-1.amazonaws.com/';
const zonalStatsPath = 'Prod/zonal_stats';

// https://xi4lrz17r8.execute-api.us-east-1.amazonaws.com/Prod/identify/proxy?x=1745727&y=451980

/** API Wrapper Service Class
* this wrapps the lambda service into axios js calls
* it should only handle the api calls
*/
export class ZonalStatsAPI {
  constructor(url = apiEndpoint, path = zonalStatsPath) {
    this.url = url + path;
    this.cancelToken = CancelToken.source();
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
      const response = await post(this.url, postdata, axiosConfig);
      return response.data;
    } catch (err) {
      return { err };
    }
  }

  // async httPut() {
  //   this.cancelToken.cancel('Cancelled Ongoing Request');
  //   this.cancelToken = CancelToken.source();
  //   const axiosConfig = {
  //     cancelToken: this.cancelToken.token,
  //     headers: {
  //       'content-type': 'text/plain'
  //     }
  //   };
  //
  //   try {
  //     const response = await puy(this.url, postData, axiosConfig);
  //     console.log(response.data);
  //     return response.data.features[0].mean;
  //   } catch (err) {
  //     console.log(err)
  //     return {};
  //   }
  // }


  getZonalStatsSummary(postdata) {
    return this.httpPost(postdata);
  }
}
