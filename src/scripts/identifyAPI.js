import { CancelToken, get } from 'axios';

import { Store } from './store';
import { identifyConfig } from '../config/identifyConfig';

const store = new Store({});
// const apiEndpoint = 'https://ktj0thaws0.execute-api.us-east-1.amazonaws.com/';
// const identifyPath = 'Dev/';

const apiEndpoint = 'https://lg0njzoglg.execute-api.us-east-1.amazonaws.com/';
const identifyPath = 'Prod/';

/** API Wrapper Service Class
* this wrapps the lambda service into axios js calls
* it should only handle the api calls
*/
export class IdentifyAPI {
  constructor(url = apiEndpoint, path = identifyPath) {
    this.apiEndpoint = url;
    const activeNav = store.getStateItem('activeNav');
    if (activeNav === 'main-nav-map-searchNShubs') { this.apiEndpoint = 'https://dm3kiccxv2.execute-api.us-east-1.amazonaws.com/'; }
    this.url = this.apiEndpoint + path;
    this.cancelToken = CancelToken.source();

    // handle nav bar change and potentail data change
    // to targeted watersheds for identify
    window.addEventListener('aboutNavChange', (e) => {
      this.apiEndpoint = url;
      const activeNavList = store.getStateItem('activeNav');
      if (activeNavList === 'main-nav-map-searchNShubs') { this.apiEndpoint = 'https://dm3kiccxv2.execute-api.us-east-1.amazonaws.com/'; }
      this.url = this.apiEndpoint + path;
    });
  }

  async httpGet(queryString = '') {
    this.cancelToken.cancel('Cancelled Ongoing Request');
    this.cancelToken = CancelToken.source();
    const axiosConfig = {
      cancelToken: this.cancelToken.token
    };

    try {
      const response = await get(`${this.url}${queryString}`, axiosConfig);
      return response.data;
    } catch (err) {
      return {};
    }
  }

  getIdentifySummary(lat = '1745727', lng = '451980') {
    return this.httpGet(`identify?lat=${lat}&lng=${lng}`);
  }

  static getIdentifyItem(item, value) {
    let filteredItems = [{
      layer: item,
      value: 255,
      backgroundColor: '#e9ecef',
      color: '#343A4F',
      label: 'N/A'
    }];

    const returnedFilteredItems = identifyConfig.colorLookup.filter(layer => (
      layer.layer === item && layer.value === value
    ));

    if (returnedFilteredItems !== undefined && returnedFilteredItems.length > 0) {
      filteredItems = returnedFilteredItems;
    }
    return filteredItems;
  }
}
