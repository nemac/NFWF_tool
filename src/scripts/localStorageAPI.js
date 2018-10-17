/**
 * Provides common functions used by the local storage API. Used in the Store and URL classes. In
 * the case that we cannot use localStorage or if we want to define multiple store providers for
 * backwards compatibility we will be able to swap out the storage object for one that implements
 * the getItem, setItem & removeItem functions in an equivalent way without changing any of the
 * code in the Store, URL, etc classes.
 */
const STATE_KEY = 'state';

export class StorageAPI {
  constructor() {
    if (StorageAPI.storageAvailable()) {
      this.storage = window.localStorage;
    }
    // We need this custom event since browsers do not generally dispatch the 'storage' event most
    // of the time. They only tend to fire it when you have the same tab open in two windows and
    // one tab changes the localStorage.
    this.storageEvent = new CustomEvent('storages');
  }

  dispatchStorageEvent() {
    window.dispatchEvent(this.storageEvent);
  }

  // Gets an item from the storage provider, primarily used later in the composed functions
  //
  // @param key | string
  // @return string
  getItem(key = '') {
    return this.storage.getItem(key);
  }

  // Gets the state from the storage provider
  //
  // @return string
  getStateAsString() {
    return this.getItem(STATE_KEY);
  }

  // Gets the state from the storage provider as an object
  //
  // @return object
  getState() {
    return this.checkStateExists() ? JSON.parse(this.getItem(STATE_KEY)) : {};
  }

  // Sets a key/value pair to the storage provider, primarily used later in the composed functions
  //
  // @param key | string
  // @param value | string
  setItem(key = '', value = '') {
    this.storage.setItem(key, value);
    this.dispatchStorageEvent();
  }

  // Sets a new state string state, should be a stringified object
  //
  // @param value | string
  setStateAsString(value = '') {
    this.setItem(STATE_KEY, value);
    // console.log('setStateAsString', STATE_KEY, value)
  }

  // Sets a new state object state
  //
  // @param value | string
  setState(value = {}) {
    this.setItem(STATE_KEY, JSON.stringify(value));
  }

  // Removes a key/value pair from the storage provider, primarily used later in the composed
  // functions
  //
  // @param key | string
  removeItem(key = '') {
    this.storage.removeItem(key);
    this.dispatchStorageEvent();
  }

  // Removes the current state from the store
  removeState() {
    this.removeItem(STATE_KEY);
  }

  // Checks if the state exists in the storage provider
  checkStateExists() {
    return Boolean(this.getItem(STATE_KEY));
  }

  static listenForStateChange(handler) {
    window.addEventListener('storages', handler);
  }

  // Check if localStorage available.
  // Taken from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
  //
  // @return boolean
  static storageAvailable() {
    const type = 'localStorage';
    let storage;
    try {
      storage = window[type];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return e instanceof DOMException && (
        // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage.length !== 0;
    }
  }
}
