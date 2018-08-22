import { StorageAPI } from './localStorageAPI';
import { checkValidObject } from './utilitys';

const URL_IGNORE_KEYS = ['userarea', 'userarea_buffered', 'zonalstatsjson'];

/**
 * This component listens for the localstoreage to be updated, and will update the url
 * if the browser is able to do so.
 */
export class URL {
  constructor() {
    this.url = new StorageAPI();
    const handler = this.setUrl.bind(this);
    StorageAPI.listenForStateChange(handler);
    this.setStateFromURL();
  }

  static updateURL(url) {
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', url);
    }
  }

  encodeStateString() {
    const stateStringWithOutIgnoredKeys = this.removeIgnoreKeys();
    return encodeURIComponent(stateStringWithOutIgnoredKeys);
  }

  setUrl() {
    const state = this.encodeStateString();
    URL.updateURL(`?state=${state}`);
  }

  static getUrl() {
    return window.location.search;
  }

  static getStateFromURL() {
    const url = URL.getUrl().substring(1);
    let state = '';
    url.split('&').forEach((param) => {
      const args = param.split('=');
      if (args[0] === 'state') {
        [, state] = args;
      }
    });

    return decodeURIComponent(state);
  }

  // some keys are to big for the URL so we have to ignore them
  // i.e geoJson instead we will have to share the geojson in
  // s3 or github-gists - TODO expand the share geojson to use gists
  // the shape remains in the state store but is removed from the URL
  // use the constant URL_IGNORE_KEY to ignore state items from the URL
  removeIgnoreKeys() {
    // get current state
    const stateOBJ = JSON.parse(this.url.getStateAsString());

    // remove the ignored keys
    const filtered = Object.keys(stateOBJ)
      .filter(key => !URL_IGNORE_KEYS.includes(key))
      .reduce((obj, key) => {
        const newobj = { ...obj, [key]: stateOBJ[key] };
        return newobj;
      }, {});

    // return state string
    return JSON.stringify(filtered);
  }

  // some keys are to big for the URL so we have to ignore them
  // i.e geoJson instead we will have to share the geojson in
  // s3 or github-gists - TODO expand the share geojson to use gists
  // the shape remains in the state store but is removed from the URL
  // use the constant URL_IGNORE_KEY to ignore state items from the URL
  // this will add the key back to string so we can retain the state in a refersh
  addIgnoreKeys() {
    // get current state
    const stateOBJ = this.url.getState();

    // not state return {} object
    if (!checkValidObject(stateOBJ)) {
      return '';
    }

    // get current state from url without ignored stae
    const urlstate = URL.getStateFromURL();

    // not state return {} object
    if (!checkValidObject(urlstate)) {
      return '';
    }
    // convert the URL state string to a object
    const urlstateOBJ = JSON.parse(urlstate);

    // add the ignored keys
    const filtered = Object.keys(stateOBJ)
      .filter(key => URL_IGNORE_KEYS.includes(key))
      .reduce((obj, key) => {
        const newobj = { ...obj, [key]: stateOBJ[key] };
        return newobj;
      }, {});

    // add the ignore state to url state
    const realstate = { ...urlstateOBJ, ...filtered };

    // return state string
    return JSON.stringify(realstate);
  }

  // TODO: Add handler to ensure the state string is valid and that the end user did not tamper with
  // it
  setStateFromURL() {
    const addState = this.addIgnoreKeys();
    if (addState) {
      this.url.setStateAsString(addState);
    }
  }
}
