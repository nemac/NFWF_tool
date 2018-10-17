(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["index~store"],{

/***/ "./src/scripts/localStorageAPI.js":
/*!****************************************!*\
  !*** ./src/scripts/localStorageAPI.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Provides common functions used by the local storage API. Used in the Store and URL classes. In
 * the case that we cannot use localStorage or if we want to define multiple store providers for
 * backwards compatibility we will be able to swap out the storage object for one that implements
 * the getItem, setItem & removeItem functions in an equivalent way without changing any of the
 * code in the Store, URL, etc classes.
 */
var STATE_KEY = 'state';

var StorageAPI = exports.StorageAPI = function () {
  function StorageAPI() {
    _classCallCheck(this, StorageAPI);

    if (StorageAPI.storageAvailable()) {
      this.storage = window.localStorage;
    }
    // We need this custom event since browsers do not generally dispatch the 'storage' event most
    // of the time. They only tend to fire it when you have the same tab open in two windows and
    // one tab changes the localStorage.
    this.storageEvent = new CustomEvent('storages');
  }

  _createClass(StorageAPI, [{
    key: 'dispatchStorageEvent',
    value: function dispatchStorageEvent() {
      window.dispatchEvent(this.storageEvent);
    }

    // Gets an item from the storage provider, primarily used later in the composed functions
    //
    // @param key | string
    // @return string

  }, {
    key: 'getItem',
    value: function getItem() {
      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      return this.storage.getItem(key);
    }

    // Gets the state from the storage provider
    //
    // @return string

  }, {
    key: 'getStateAsString',
    value: function getStateAsString() {
      return this.getItem(STATE_KEY);
    }

    // Gets the state from the storage provider as an object
    //
    // @return object

  }, {
    key: 'getState',
    value: function getState() {
      return this.checkStateExists() ? JSON.parse(this.getItem(STATE_KEY)) : {};
    }

    // Sets a key/value pair to the storage provider, primarily used later in the composed functions
    //
    // @param key | string
    // @param value | string

  }, {
    key: 'setItem',
    value: function setItem() {
      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      this.storage.setItem(key, value);
      this.dispatchStorageEvent();
    }

    // Sets a new state string state, should be a stringified object
    //
    // @param value | string

  }, {
    key: 'setStateAsString',
    value: function setStateAsString() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      this.setItem(STATE_KEY, value);
      // console.log('setStateAsString', STATE_KEY, value)
    }

    // Sets a new state object state
    //
    // @param value | string

  }, {
    key: 'setState',
    value: function setState() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.setItem(STATE_KEY, JSON.stringify(value));
    }

    // Removes a key/value pair from the storage provider, primarily used later in the composed
    // functions
    //
    // @param key | string

  }, {
    key: 'removeItem',
    value: function removeItem() {
      var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      this.storage.removeItem(key);
      this.dispatchStorageEvent();
    }

    // Removes the current state from the store

  }, {
    key: 'removeState',
    value: function removeState() {
      this.removeItem(STATE_KEY);
    }

    // Checks if the state exists in the storage provider

  }, {
    key: 'checkStateExists',
    value: function checkStateExists() {
      return Boolean(this.getItem(STATE_KEY));
    }
  }], [{
    key: 'listenForStateChange',
    value: function listenForStateChange(handler) {
      window.addEventListener('storages', handler);
    }

    // Check if localStorage available.
    // Taken from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    //
    // @return boolean

  }, {
    key: 'storageAvailable',
    value: function storageAvailable() {
      var type = 'localStorage';
      var storage = void 0;
      try {
        storage = window[type];
        var x = '__storage_test__';
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
  }]);

  return StorageAPI;
}();

/***/ }),

/***/ "./src/scripts/store.js":
/*!******************************!*\
  !*** ./src/scripts/store.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Store = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _localStorageAPI = __webpack_require__(/*! ./localStorageAPI */ "./src/scripts/localStorageAPI.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * This component is intended to handle the storage and retrieval of the state of
 * the NFWF application. As of this writing it is using localStorage to do this.
 * Uses simple class instance methods with the short-hand method declaration
 * pattern.
 *
 * To note: There is a difference between the Store and the State. As of 0a3106e
 * the Store is a String saved to the browsers localStorage and is a serialized
 * version of the State. The State is an Object which is interacted with by
 * parsing the State string from the Store, modifying the results of the parse,
 * and re-serializing it back to the Store.
 */
var Store = exports.Store = function () {
  // ..and an (optional) custom class constructor. If one is
  // not supplied, a default constructor is used instead:
  // constructor() { }
  function Store() {
    _classCallCheck(this, Store);

    // this.state = state;
    this.store = new _localStorageAPI.StorageAPI();

    // this.state = {};
    // if(this.isStateExists){
    //   this.state = this.getState();
    // } else {
    //   const state = {};
    //   this.state = {state};
    // }
  }

  // // GETTERS

  // As of 0a3106e this is probably intended to be used as a getter for the
  // Store. However it is pulling an unused and undeclared variable _state so it
  // probably just returns undefined.


  _createClass(Store, [{
    key: 'getStateItem',


    // Gets an individual top level item from the state
    //
    // @param item - string
    // @return string || object
    value: function getStateItem(item) {
      return this.checkItem(item) ? this.getState()[item] : {};
    }

    // Gets the entire state object
    //
    // @return object

  }, {
    key: 'getState',
    value: function getState() {
      return this.store.getState();
    }

    // // SETTERS

    // Setter for the state to the Store, preserving any non-overwritten
    // properties in the Store.
    //
    // @param state - object

  }, {
    key: 'saveState',
    value: function saveState(state) {
      var currentState = this.getState();
      var newState = _extends({}, currentState, state);
      this.store.setState(newState);
    }

    // Setter for the state to the Store, overriding any non-overwritten
    // properties in the Store.
    //
    // @param state - object

  }, {
    key: 'saveNewState',
    value: function saveNewState(state) {
      this.store.setState(state);
    }

    // Setter which overrides the entire Store with a new State object.
    //
    // @param StateObject - object

  }, {
    key: 'setStateFromObject',
    value: function setStateFromObject(StateObject) {
      this.saveNewState(StateObject);
    }

    // Setter for a key value pair to the State, which means that it writes it to
    // the Store.
    //
    // @param key - string
    // @param value - string

  }, {
    key: 'addStateItem',
    value: function addStateItem(key, value) {
      var state = this.getState();
      state[key] = value;
      this.saveNewState(state);
    }

    // Setter for a key value pair to the Store.
    //
    // @param key - string
    // @param value - string

  }, {
    key: 'setStoreItem',
    value: function setStoreItem(key, value) {
      var storeObj = _defineProperty({}, key, value);
      var newStateObj = _extends({}, this.getState(), storeObj);
      this.saveNewState(newStateObj);
    }

    // // REMOVERS

    // Removes the entire state from the browser.

  }, {
    key: 'clearState',
    value: function clearState() {
      this.store.removeState();
    }

    // Removes a key value pair from the State and the Store.
    //
    // @param key - string

  }, {
    key: 'removeStateItem',
    value: function removeStateItem(key) {
      var currentState = this.getState();
      delete currentState[key];
      this.saveNewState(currentState);
    }

    // // UTILITIES

    // Check if localStorage available.
    // Taken from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    //
    // @return boolean

  }, {
    key: 'isStateExists',


    // Check if the state has been saved to the browser store
    //
    // @return boolean
    value: function isStateExists() {
      return this.store.checkStateExists();
    }

    // Check if an item has been saved to the store
    // unused as of 0a3106e
    //
    // @param item - string
    // @return boolean

  }, {
    key: 'isStateItemExist',
    value: function isStateItemExist(item) {
      if (this.isStateExists()) {
        var stateStr = this.store.getStateAsString();
        if (stateStr.indexOf(item) > 0) {
          return true;
        }
      }
      return false;
    }

    // Also checks if an item has been saved to the store
    // TODO: Rewrite the indexOf check to parse the deeply nested keys of an object since the current
    // code will give an error in some edge cases. EX:
    //
    // this.store.setStateAsString('{foo:"bar",bars:"baz"}');
    // checkItem('bar'); // returns TRUE ();
    //
    // @param item - string
    // @return boolean

  }, {
    key: 'checkItem',
    value: function checkItem(item) {
      return this.isStateExists() && this.store.getStateAsString().indexOf(item) > 0;
    }

    //  const ele.addEventListener('click', (e) => {
    //    this.setStateFromObject();
    //  })

    // We will look at static and subclassed methods shortly

    // save map action.
    // ensures the state map action is consistent

  }, {
    key: 'saveAction',
    value: function saveAction(type) {
      this.setStoreItem('lastaction', type);
    }
  }, {
    key: 'Store',
    get: function get() {
      return this._state;
    }
  }], [{
    key: 'storageAvailable',
    value: function storageAvailable() {
      return _localStorageAPI.StorageAPI.storageAvailable();
    }
  }]);

  return Store;
}();

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvc2NyaXB0cy9sb2NhbFN0b3JhZ2VBUEkuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3NjcmlwdHMvc3RvcmUuanMiXSwibmFtZXMiOlsiU1RBVEVfS0VZIiwiU3RvcmFnZUFQSSIsInN0b3JhZ2VBdmFpbGFibGUiLCJzdG9yYWdlIiwid2luZG93IiwibG9jYWxTdG9yYWdlIiwic3RvcmFnZUV2ZW50IiwiQ3VzdG9tRXZlbnQiLCJkaXNwYXRjaEV2ZW50Iiwia2V5IiwiZ2V0SXRlbSIsImNoZWNrU3RhdGVFeGlzdHMiLCJKU09OIiwicGFyc2UiLCJ2YWx1ZSIsInNldEl0ZW0iLCJkaXNwYXRjaFN0b3JhZ2VFdmVudCIsInN0cmluZ2lmeSIsInJlbW92ZUl0ZW0iLCJCb29sZWFuIiwiaGFuZGxlciIsImFkZEV2ZW50TGlzdGVuZXIiLCJ0eXBlIiwieCIsImUiLCJET01FeGNlcHRpb24iLCJjb2RlIiwibmFtZSIsImxlbmd0aCIsIlN0b3JlIiwic3RvcmUiLCJpdGVtIiwiY2hlY2tJdGVtIiwiZ2V0U3RhdGUiLCJzdGF0ZSIsImN1cnJlbnRTdGF0ZSIsIm5ld1N0YXRlIiwic2V0U3RhdGUiLCJTdGF0ZU9iamVjdCIsInNhdmVOZXdTdGF0ZSIsInN0b3JlT2JqIiwibmV3U3RhdGVPYmoiLCJyZW1vdmVTdGF0ZSIsImlzU3RhdGVFeGlzdHMiLCJzdGF0ZVN0ciIsImdldFN0YXRlQXNTdHJpbmciLCJpbmRleE9mIiwic2V0U3RvcmVJdGVtIiwiX3N0YXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7O0FBT0EsSUFBTUEsWUFBWSxPQUFsQjs7SUFFYUMsVSxXQUFBQSxVO0FBQ1gsd0JBQWM7QUFBQTs7QUFDWixRQUFJQSxXQUFXQyxnQkFBWCxFQUFKLEVBQW1DO0FBQ2pDLFdBQUtDLE9BQUwsR0FBZUMsT0FBT0MsWUFBdEI7QUFDRDtBQUNEO0FBQ0E7QUFDQTtBQUNBLFNBQUtDLFlBQUwsR0FBb0IsSUFB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LGVBQWUsS0FBS0YsUUFBTCxFQUFyQjtBQUNBLGFBQU9FLGFBQWExQixHQUFiLENBQVA7QUFDQSxXQUFLOEIsWUFBTCxDQUFrQkosWUFBbEI7QUFDRDs7QUFFRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FBS0E7QUFDQTtBQUNBO29DQUNnQjtBQUNkLGFBQU8sS0FBS0wsS0FBTCxDQUFXbkIsZ0JBQVgsRUFBUDtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7cUNBQ2lCb0IsSSxFQUFNO0FBQ3JCLFVBQUksS0FBS1ksYUFBTCxFQUFKLEVBQTBCO0FBQ3hCLFlBQU1DLFdBQVcsS0FBS2QsS0FBTCxDQUFXZSxnQkFBWCxFQUFqQjtBQUNBLFlBQUlELFNBQVNFLE9BQVQsQ0FBaUJmLElBQWpCLElBQXlCLENBQTdCLEVBQWdDO0FBQzlCLGlCQUFPLElBQVA7QUFDRDtBQUNGO0FBQ0QsYUFBTyxLQUFQO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OzhCQUNVQSxJLEVBQU07QUFDZCxhQUFPLEtBQUtZLGFBQUwsTUFBd0IsS0FBS2IsS0FBTCxDQUFXZSxnQkFBWCxHQUE4QkMsT0FBOUIsQ0FBc0NmLElBQXRDLElBQThDLENBQTdFO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7Ozs7K0JBQ1dULEksRUFBTTtBQUNmLFdBQUt5QixZQUFMLENBQWtCLFlBQWxCLEVBQWdDekIsSUFBaEM7QUFDRDs7O3dCQTFJVztBQUNWLGFBQU8sS0FBSzBCLE1BQVo7QUFDRDs7O3VDQXVGeUI7QUFDeEIsYUFBTy9DLDRCQUFXQyxnQkFBWCxFQUFQO0FBQ0QiLCJmaWxlIjoiaW5kZXh+c3RvcmUuYXBwLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHJvdmlkZXMgY29tbW9uIGZ1bmN0aW9ucyB1c2VkIGJ5IHRoZSBsb2NhbCBzdG9yYWdlIEFQSS4gVXNlZCBpbiB0aGUgU3RvcmUgYW5kIFVSTCBjbGFzc2VzLiBJblxuICogdGhlIGNhc2UgdGhhdCB3ZSBjYW5ub3QgdXNlIGxvY2FsU3RvcmFnZSBvciBpZiB3ZSB3YW50IHRvIGRlZmluZSBtdWx0aXBsZSBzdG9yZSBwcm92aWRlcnMgZm9yXG4gKiBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3ZSB3aWxsIGJlIGFibGUgdG8gc3dhcCBvdXQgdGhlIHN0b3JhZ2Ugb2JqZWN0IGZvciBvbmUgdGhhdCBpbXBsZW1lbnRzXG4gKiB0aGUgZ2V0SXRlbSwgc2V0SXRlbSAmIHJlbW92ZUl0ZW0gZnVuY3Rpb25zIGluIGFuIGVxdWl2YWxlbnQgd2F5IHdpdGhvdXQgY2hhbmdpbmcgYW55IG9mIHRoZVxuICogY29kZSBpbiB0aGUgU3RvcmUsIFVSTCwgZXRjIGNsYXNzZXMuXG4gKi9cbmNvbnN0IFNUQVRFX0tFWSA9ICdzdGF0ZSc7XG5cbmV4cG9ydCBjbGFzcyBTdG9yYWdlQVBJIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgaWYgKFN0b3JhZ2VBUEkuc3RvcmFnZUF2YWlsYWJsZSgpKSB7XG4gICAgICB0aGlzLnN0b3JhZ2UgPSB3aW5kb3cubG9jYWxTdG9yYWdlO1xuICAgIH1cbiAgICAvLyBXZSBuZWVkIHRoaXMgY3VzdG9tIGV2ZW50IHNpbmNlIGJyb3dzZXJzIGRvIG5vdCBnZW5lcmFsbHkgZGlzcGF0Y2ggdGhlICdzdG9yYWdlJyBldmVudCBtb3N0XG4gICAgLy8gb2YgdGhlIHRpbWUuIFRoZXkgb25seSB0ZW5kIHRvIGZpcmUgaXQgd2hlbiB5b3UgaGF2ZSB0aGUgc2FtZSB0YWIgb3BlbiBpbiB0d28gd2luZG93cyBhbmRcbiAgICAvLyBvbmUgdGFiIGNoYW5nZXMgdGhlIGxvY2FsU3RvcmFnZS5cbiAgICB0aGlzLnN0b3JhZ2VFdmVudCA9IG5ldyBDdXN0b21FdmVudCgnc3RvcmFnZXMnKTtcbiAgfVxuXG4gIGRpc3BhdGNoU3RvcmFnZUV2ZW50KCkge1xuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KHRoaXMuc3RvcmFnZUV2ZW50KTtcbiAgfVxuXG4gIC8vIEdldHMgYW4gaXRlbSBmcm9tIHRoZSBzdG9yYWdlIHByb3ZpZGVyLCBwcmltYXJpbHkgdXNlZCBsYXRlciBpbiB0aGUgY29tcG9zZWQgZnVuY3Rpb25zXG4gIC8vXG4gIC8vIEBwYXJhbSBrZXkgfCBzdHJpbmdcbiAgLy8gQHJldHVybiBzdHJpbmdcbiAgZ2V0SXRlbShrZXkgPSAnJykge1xuICAgIHJldHVybiB0aGlzLnN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICB9XG5cbiAgLy8gR2V0cyB0aGUgc3RhdGUgZnJvbSB0aGUgc3RvcmFnZSBwcm92aWRlclxuICAvL1xuICAvLyBAcmV0dXJuIHN0cmluZ1xuICBnZXRTdGF0ZUFzU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmdldEl0ZW0oU1RBVEVfS0VZKTtcbiAgfVxuXG4gIC8vIEdldHMgdGhlIHN0YXRlIGZyb20gdGhlIHN0b3JhZ2UgcHJvdmlkZXIgYXMgYW4gb2JqZWN0XG4gIC8vXG4gIC8vIEByZXR1cm4gb2JqZWN0XG4gIGdldFN0YXRlKCkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrU3RhdGVFeGlzdHMoKSA/IEpTT04ucGFyc2UodGhpcy5nZXRJdGVtKFNUQVRFX0tFWSkpIDoge307XG4gIH1cblxuICAvLyBTZXRzIGEga2V5L3ZhbHVlIHBhaXIgdG8gdGhlIHN0b3JhZ2UgcHJvdmlkZXIsIHByaW1hcmlseSB1c2VkIGxhdGVyIGluIHRoZSBjb21wb3NlZCBmdW5jdGlvbnNcbiAgLy9cbiAgLy8gQHBhcmFtIGtleSB8IHN0cmluZ1xuICAvLyBAcGFyYW0gdmFsdWUgfCBzdHJpbmdcbiAgc2V0SXRlbShrZXkgPSAnJywgdmFsdWUgPSAnJykge1xuICAgIHRoaXMuc3RvcmFnZS5zZXRJdGVtKGtleSwgdmFsdWUpO1xuICAgIHRoaXMuZGlzcGF0Y2hTdG9yYWdlRXZlbnQoKTtcbiAgfVxuXG4gIC8vIFNldHMgYSBuZXcgc3RhdGUgc3RyaW5nIHN0YXRlLCBzaG91bGQgYmUgYSBzdHJpbmdpZmllZCBvYmplY3RcbiAgLy9cbiAgLy8gQHBhcmFtIHZhbHVlIHwgc3RyaW5nXG4gIHNldFN0YXRlQXNTdHJpbmcodmFsdWUgPSAnJykge1xuICAgIHRoaXMuc2V0SXRlbShTVEFURV9LRVksIHZhbHVlKTtcbiAgICAvLyBjb25zb2xlLmxvZygnc2V0U3RhdGVBc1N0cmluZycsIFNUQVRFX0tFWSwgdmFsdWUpXG4gIH1cblxuICAvLyBTZXRzIGEgbmV3IHN0YXRlIG9iamVjdCBzdGF0ZVxuICAvL1xuICAvLyBAcGFyYW0gdmFsdWUgfCBzdHJpbmdcbiAgc2V0U3RhdGUodmFsdWUgPSB7fSkge1xuICAgIHRoaXMuc2V0SXRlbShTVEFURV9LRVksIEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XG4gIH1cblxuICAvLyBSZW1vdmVzIGEga2V5L3ZhbHVlIHBhaXIgZnJvbSB0aGUgc3RvcmFnZSBwcm92aWRlciwgcHJpbWFyaWx5IHVzZWQgbGF0ZXIgaW4gdGhlIGNvbXBvc2VkXG4gIC8vIGZ1bmN0aW9uc1xuICAvL1xuICAvLyBAcGFyYW0ga2V5IHwgc3RyaW5nXG4gIHJlbW92ZUl0ZW0oa2V5ID0gJycpIHtcbiAgICB0aGlzLnN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuICAgIHRoaXMuZGlzcGF0Y2hTdG9yYWdlRXZlbnQoKTtcbiAgfVxuXG4gIC8vIFJlbW92ZXMgdGhlIGN1cnJlbnQgc3RhdGUgZnJvbSB0aGUgc3RvcmVcbiAgcmVtb3ZlU3RhdGUoKSB7XG4gICAgdGhpcy5yZW1vdmVJdGVtKFNUQVRFX0tFWSk7XG4gIH1cblxuICAvLyBDaGVja3MgaWYgdGhlIHN0YXRlIGV4aXN0cyBpbiB0aGUgc3RvcmFnZSBwcm92aWRlclxuICBjaGVja1N0YXRlRXhpc3RzKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuZ2V0SXRlbShTVEFURV9LRVkpKTtcbiAgfVxuXG4gIHN0YXRpYyBsaXN0ZW5Gb3JTdGF0ZUNoYW5nZShoYW5kbGVyKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3N0b3JhZ2VzJywgaGFuZGxlcik7XG4gIH1cblxuICAvLyBDaGVjayBpZiBsb2NhbFN0b3JhZ2UgYXZhaWxhYmxlLlxuICAvLyBUYWtlbiBmcm9tIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJfU3RvcmFnZV9BUEkvVXNpbmdfdGhlX1dlYl9TdG9yYWdlX0FQSVxuICAvL1xuICAvLyBAcmV0dXJuIGJvb2xlYW5cbiAgc3RhdGljIHN0b3JhZ2VBdmFpbGFibGUoKSB7XG4gICAgY29uc3QgdHlwZSA9ICdsb2NhbFN0b3JhZ2UnO1xuICAgIGxldCBzdG9yYWdlO1xuICAgIHRyeSB7XG4gICAgICBzdG9yYWdlID0gd2luZG93W3R5cGVdO1xuICAgICAgY29uc3QgeCA9ICdfX3N0b3JhZ2VfdGVzdF9fJztcbiAgICAgIHN0b3JhZ2Uuc2V0SXRlbSh4LCB4KTtcbiAgICAgIHN0b3JhZ2UucmVtb3ZlSXRlbSh4KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIChcbiAgICAgICAgLy8gZXZlcnl0aGluZyBleGNlcHQgRmlyZWZveFxuICAgICAgICBlLmNvZGUgPT09IDIyIHx8XG4gICAgICAgIC8vIEZpcmVmb3hcbiAgICAgICAgZS5jb2RlID09PSAxMDE0IHx8XG4gICAgICAgIC8vIHRlc3QgbmFtZSBmaWVsZCB0b28sIGJlY2F1c2UgY29kZSBtaWdodCBub3QgYmUgcHJlc2VudFxuICAgICAgICAvLyBldmVyeXRoaW5nIGV4Y2VwdCBGaXJlZm94XG4gICAgICAgIGUubmFtZSA9PT0gJ1F1b3RhRXhjZWVkZWRFcnJvcicgfHxcbiAgICAgICAgLy8gRmlyZWZveFxuICAgICAgICBlLm5hbWUgPT09ICdOU19FUlJPUl9ET01fUVVPVEFfUkVBQ0hFRCcpICYmXG4gICAgICAgIC8vIGFja25vd2xlZGdlIFF1b3RhRXhjZWVkZWRFcnJvciBvbmx5IGlmIHRoZXJlJ3Mgc29tZXRoaW5nIGFscmVhZHkgc3RvcmVkXG4gICAgICAgIHN0b3JhZ2UubGVuZ3RoICE9PSAwO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgU3RvcmFnZUFQSSB9IGZyb20gJy4vbG9jYWxTdG9yYWdlQVBJJztcblxuLyoqXG4gKiBUaGlzIGNvbXBvbmVudCBpcyBpbnRlbmRlZCB0byBoYW5kbGUgdGhlIHN0b3JhZ2UgYW5kIHJldHJpZXZhbCBvZiB0aGUgc3RhdGUgb2ZcbiAqIHRoZSBORldGIGFwcGxpY2F0aW9uLiBBcyBvZiB0aGlzIHdyaXRpbmcgaXQgaXMgdXNpbmcgbG9jYWxTdG9yYWdlIHRvIGRvIHRoaXMuXG4gKiBVc2VzIHNpbXBsZSBjbGFzcyBpbnN0YW5jZSBtZXRob2RzIHdpdGggdGhlIHNob3J0LWhhbmQgbWV0aG9kIGRlY2xhcmF0aW9uXG4gKiBwYXR0ZXJuLlxuICpcbiAqIFRvIG5vdGU6IFRoZXJlIGlzIGEgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBTdG9yZSBhbmQgdGhlIFN0YXRlLiBBcyBvZiAwYTMxMDZlXG4gKiB0aGUgU3RvcmUgaXMgYSBTdHJpbmcgc2F2ZWQgdG8gdGhlIGJyb3dzZXJzIGxvY2FsU3RvcmFnZSBhbmQgaXMgYSBzZXJpYWxpemVkXG4gKiB2ZXJzaW9uIG9mIHRoZSBTdGF0ZS4gVGhlIFN0YXRlIGlzIGFuIE9iamVjdCB3aGljaCBpcyBpbnRlcmFjdGVkIHdpdGggYnlcbiAqIHBhcnNpbmcgdGhlIFN0YXRlIHN0cmluZyBmcm9tIHRoZSBTdG9yZSwgbW9kaWZ5aW5nIHRoZSByZXN1bHRzIG9mIHRoZSBwYXJzZSxcbiAqIGFuZCByZS1zZXJpYWxpemluZyBpdCBiYWNrIHRvIHRoZSBTdG9yZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b3JlIHtcbiAgLy8gLi5hbmQgYW4gKG9wdGlvbmFsKSBjdXN0b20gY2xhc3MgY29uc3RydWN0b3IuIElmIG9uZSBpc1xuICAvLyBub3Qgc3VwcGxpZWQsIGEgZGVmYXVsdCBjb25zdHJ1Y3RvciBpcyB1c2VkIGluc3RlYWQ6XG4gIC8vIGNvbnN0cnVjdG9yKCkgeyB9XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLnN0b3JlID0gbmV3IFN0b3JhZ2VBUEkoKTtcblxuICAgIC8vIHRoaXMuc3RhdGUgPSB7fTtcbiAgICAvLyBpZih0aGlzLmlzU3RhdGVFeGlzdHMpe1xuICAgIC8vICAgdGhpcy5zdGF0ZSA9IHRoaXMuZ2V0U3RhdGUoKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgY29uc3Qgc3RhdGUgPSB7fTtcbiAgICAvLyAgIHRoaXMuc3RhdGUgPSB7c3RhdGV9O1xuICAgIC8vIH1cbiAgfVxuXG4gIC8vIC8vIEdFVFRFUlNcblxuICAvLyBBcyBvZiAwYTMxMDZlIHRoaXMgaXMgcHJvYmFibHkgaW50ZW5kZWQgdG8gYmUgdXNlZCBhcyBhIGdldHRlciBmb3IgdGhlXG4gIC8vIFN0b3JlLiBIb3dldmVyIGl0IGlzIHB1bGxpbmcgYW4gdW51c2VkIGFuZCB1bmRlY2xhcmVkIHZhcmlhYmxlIF9zdGF0ZSBzbyBpdFxuICAvLyBwcm9iYWJseSBqdXN0IHJldHVybnMgdW5kZWZpbmVkLlxuICBnZXQgU3RvcmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0YXRlO1xuICB9XG5cbiAgLy8gR2V0cyBhbiBpbmRpdmlkdWFsIHRvcCBsZXZlbCBpdGVtIGZyb20gdGhlIHN0YXRlXG4gIC8vXG4gIC8vIEBwYXJhbSBpdGVtIC0gc3RyaW5nXG4gIC8vIEByZXR1cm4gc3RyaW5nIHx8IG9iamVjdFxuICBnZXRTdGF0ZUl0ZW0oaXRlbSkge1xuICAgIHJldHVybiB0aGlzLmNoZWNrSXRlbShpdGVtKSA/IHRoaXMuZ2V0U3RhdGUoKVtpdGVtXSA6IHt9O1xuICB9XG5cbiAgLy8gR2V0cyB0aGUgZW50aXJlIHN0YXRlIG9iamVjdFxuICAvL1xuICAvLyBAcmV0dXJuIG9iamVjdFxuICBnZXRTdGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9yZS5nZXRTdGF0ZSgpO1xuICB9XG5cbiAgLy8gLy8gU0VUVEVSU1xuXG4gIC8vIFNldHRlciBmb3IgdGhlIHN0YXRlIHRvIHRoZSBTdG9yZSwgcHJlc2VydmluZyBhbnkgbm9uLW92ZXJ3cml0dGVuXG4gIC8vIHByb3BlcnRpZXMgaW4gdGhlIFN0b3JlLlxuICAvL1xuICAvLyBAcGFyYW0gc3RhdGUgLSBvYmplY3RcbiAgc2F2ZVN0YXRlKHN0YXRlKSB7XG4gICAgY29uc3QgY3VycmVudFN0YXRlID0gdGhpcy5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IG5ld1N0YXRlID0geyAuLi5jdXJyZW50U3RhdGUsIC4uLnN0YXRlIH07XG4gICAgdGhpcy5zdG9yZS5zZXRTdGF0ZShuZXdTdGF0ZSk7XG4gIH1cblxuICAvLyBTZXR0ZXIgZm9yIHRoZSBzdGF0ZSB0byB0aGUgU3RvcmUsIG92ZXJyaWRpbmcgYW55IG5vbi1vdmVyd3JpdHRlblxuICAvLyBwcm9wZXJ0aWVzIGluIHRoZSBTdG9yZS5cbiAgLy9cbiAgLy8gQHBhcmFtIHN0YXRlIC0gb2JqZWN0XG4gIHNhdmVOZXdTdGF0ZShzdGF0ZSkge1xuICAgIHRoaXMuc3RvcmUuc2V0U3RhdGUoc3RhdGUpO1xuICB9XG5cbiAgLy8gU2V0dGVyIHdoaWNoIG92ZXJyaWRlcyB0aGUgZW50aXJlIFN0b3JlIHdpdGggYSBuZXcgU3RhdGUgb2JqZWN0LlxuICAvL1xuICAvLyBAcGFyYW0gU3RhdGVPYmplY3QgLSBvYmplY3RcbiAgc2V0U3RhdGVGcm9tT2JqZWN0KFN0YXRlT2JqZWN0KSB7XG4gICAgdGhpcy5zYXZlTmV3U3RhdGUoU3RhdGVPYmplY3QpO1xuICB9XG5cbiAgLy8gU2V0dGVyIGZvciBhIGtleSB2YWx1ZSBwYWlyIHRvIHRoZSBTdGF0ZSwgd2hpY2ggbWVhbnMgdGhhdCBpdCB3cml0ZXMgaXQgdG9cbiAgLy8gdGhlIFN0b3JlLlxuICAvL1xuICAvLyBAcGFyYW0ga2V5IC0gc3RyaW5nXG4gIC8vIEBwYXJhbSB2YWx1ZSAtIHN0cmluZ1xuICBhZGRTdGF0ZUl0ZW0oa2V5LCB2YWx1ZSkge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5nZXRTdGF0ZSgpO1xuICAgIHN0YXRlW2tleV0gPSB2YWx1ZTtcbiAgICB0aGlzLnNhdmVOZXdTdGF0ZShzdGF0ZSk7XG4gIH1cblxuICAvLyBTZXR0ZXIgZm9yIGEga2V5IHZhbHVlIHBhaXIgdG8gdGhlIFN0b3JlLlxuICAvL1xuICAvLyBAcGFyYW0ga2V5IC0gc3RyaW5nXG4gIC8vIEBwYXJhbSB2YWx1ZSAtIHN0cmluZ1xuICBzZXRTdG9yZUl0ZW0oa2V5LCB2YWx1ZSkge1xuICAgIGNvbnN0IHN0b3JlT2JqID0geyBba2V5XTogdmFsdWUgfTtcbiAgICBjb25zdCBuZXdTdGF0ZU9iaiA9IHsgLi4udGhpcy5nZXRTdGF0ZSgpLCAuLi5zdG9yZU9iaiB9O1xuICAgIHRoaXMuc2F2ZU5ld1N0YXRlKG5ld1N0YXRlT2JqKTtcbiAgfVxuXG4gIC8vIC8vIFJFTU9WRVJTXG5cbiAgLy8gUmVtb3ZlcyB0aGUgZW50aXJlIHN0YXRlIGZyb20gdGhlIGJyb3dzZXIuXG4gIGNsZWFyU3RhdGUoKSB7XG4gICAgdGhpcy5zdG9yZS5yZW1vdmVTdGF0ZSgpO1xuICB9XG5cbiAgLy8gUmVtb3ZlcyBhIGtleSB2YWx1ZSBwYWlyIGZyb20gdGhlIFN0YXRlIGFuZCB0aGUgU3RvcmUuXG4gIC8vXG4gIC8vIEBwYXJhbSBrZXkgLSBzdHJpbmdcbiAgcmVtb3ZlU3RhdGVJdGVtKGtleSkge1xuICAgIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IHRoaXMuZ2V0U3RhdGUoKTtcbiAgICBkZWxldGUgY3VycmVudFN0YXRlW2tleV07XG4gICAgdGhpcy5zYXZlTmV3U3RhdGUoY3VycmVudFN0YXRlKTtcbiAgfVxuXG4gIC8vIC8vIFVUSUxJVElFU1xuXG4gIC8vIENoZWNrIGlmIGxvY2FsU3RvcmFnZSBhdmFpbGFibGUuXG4gIC8vIFRha2VuIGZyb20gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYl9TdG9yYWdlX0FQSS9Vc2luZ190aGVfV2ViX1N0b3JhZ2VfQVBJXG4gIC8vXG4gIC8vIEByZXR1cm4gYm9vbGVhblxuICBzdGF0aWMgc3RvcmFnZUF2YWlsYWJsZSgpIHtcbiAgICByZXR1cm4gU3RvcmFnZUFQSS5zdG9yYWdlQXZhaWxhYmxlKCk7XG4gIH1cblxuICAvLyBDaGVjayBpZiB0aGUgc3RhdGUgaGFzIGJlZW4gc2F2ZWQgdG8gdGhlIGJyb3dzZXIgc3RvcmVcbiAgLy9cbiAgLy8gQHJldHVybiBib29sZWFuXG4gIGlzU3RhdGVFeGlzdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcmUuY2hlY2tTdGF0ZUV4aXN0cygpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgYW4gaXRlbSBoYXMgYmVlbiBzYXZlZCB0byB0aGUgc3RvcmVcbiAgLy8gdW51c2VkIGFzIG9mIDBhMzEwNmVcbiAgLy9cbiAgLy8gQHBhcmFtIGl0ZW0gLSBzdHJpbmdcbiAgLy8gQHJldHVybiBib29sZWFuXG4gIGlzU3RhdGVJdGVtRXhpc3QoaXRlbSkge1xuICAgIGlmICh0aGlzLmlzU3RhdGVFeGlzdHMoKSkge1xuICAgICAgY29uc3Qgc3RhdGVTdHIgPSB0aGlzLnN0b3JlLmdldFN0YXRlQXNTdHJpbmcoKTtcbiAgICAgIGlmIChzdGF0ZVN0ci5pbmRleE9mKGl0ZW0pID4gMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gQWxzbyBjaGVja3MgaWYgYW4gaXRlbSBoYXMgYmVlbiBzYXZlZCB0byB0aGUgc3RvcmVcbiAgLy8gVE9ETzogUmV3cml0ZSB0aGUgaW5kZXhPZiBjaGVjayB0byBwYXJzZSB0aGUgZGVlcGx5IG5lc3RlZCBrZXlzIG9mIGFuIG9iamVjdCBzaW5jZSB0aGUgY3VycmVudFxuICAvLyBjb2RlIHdpbGwgZ2l2ZSBhbiBlcnJvciBpbiBzb21lIGVkZ2UgY2FzZXMuIEVYOlxuICAvL1xuICAvLyB0aGlzLnN0b3JlLnNldFN0YXRlQXNTdHJpbmcoJ3tmb286XCJiYXJcIixiYXJzOlwiYmF6XCJ9Jyk7XG4gIC8vIGNoZWNrSXRlbSgnYmFyJyk7IC8vIHJldHVybnMgVFJVRSAoKTtcbiAgLy9cbiAgLy8gQHBhcmFtIGl0ZW0gLSBzdHJpbmdcbiAgLy8gQHJldHVybiBib29sZWFuXG4gIGNoZWNrSXRlbShpdGVtKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNTdGF0ZUV4aXN0cygpICYmIHRoaXMuc3RvcmUuZ2V0U3RhdGVBc1N0cmluZygpLmluZGV4T2YoaXRlbSkgPiAwO1xuICB9XG5cbiAgLy8gIGNvbnN0IGVsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gIC8vICAgIHRoaXMuc2V0U3RhdGVGcm9tT2JqZWN0KCk7XG4gIC8vICB9KVxuXG4gIC8vIFdlIHdpbGwgbG9vayBhdCBzdGF0aWMgYW5kIHN1YmNsYXNzZWQgbWV0aG9kcyBzaG9ydGx5XG5cbiAgLy8gc2F2ZSBtYXAgYWN0aW9uLlxuICAvLyBlbnN1cmVzIHRoZSBzdGF0ZSBtYXAgYWN0aW9uIGlzIGNvbnNpc3RlbnRcbiAgc2F2ZUFjdGlvbih0eXBlKSB7XG4gICAgdGhpcy5zZXRTdG9yZUl0ZW0oJ2xhc3RhY3Rpb24nLCB0eXBlKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==