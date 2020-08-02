// dependencies
import L from 'leaflet';
import { geosearch } from 'esri-leaflet-geocoder';

// default searchlocations template
import searchlocationsTemplate from '../templates/searchlocations.html';

import { Component } from './components';
import { Store } from './store';

import {
  checkValidObject,
  spinnerOn,
  spinnerOff,
  ParentContains,
  googleAnalyticsEvent
} from './utilitys';

const store = new Store({});

// required for bootstrap
window.$ = require('jquery');
// required for tooltip, popup...
window.Popper = require('popper.js');

window.jQuery = window.$;

/**
* SearchLocations Component
* SearchLocations handles searching places and geocoding,
* uses the https://github.com/Esri/esri-leaflet-geocoder leaflet plugin
* Apache License https://github.com/Esri/esri-leaflet-geocoder/blob/master/LICENSE
* and examples of use at http://esri.github.io/esri-leaflet/examples/geocoding-control.html
*/
export class SearchLocations extends Component {
  constructor(placeholderId, props) {
    super(placeholderId, props, searchlocationsTemplate);

    const { mapComponent, mapInfoComponent, exploreComponent } = props;

    this.mapComponent = mapComponent;
    this.mapInfoComponent = mapInfoComponent;
    this.exploreComponent = exploreComponent;
    // TODO: add config for geosearch
    // might need to add other limits
    const GeoSearchOptions = {
      useMapBounds: false,
      countries: 'USA',
      collapseAfterResult: false,
      allowMultipleResults: false,
      attribution: 'Powered by ESRI'
    };

    // add search control with options
    this.searchControl = geosearch(GeoSearchOptions).addTo(mapComponent.map);
    this.searchControlElement = document.querySelector('.geocoder-control.leaflet-control');
    this.searchBoxElement = document.querySelector('.geocoder-control-input.leaflet-bar');
    this.searchIconElement = document.querySelector('.geocoder-control-input');

    this.collapseSearch = L.DomUtil.create('div', 'btn-search-locations-collapse-holder leaflet-bar d-none', this.searchControlElement);
    this.collapseSearch.setAttribute('id', 'btn-search-locations-collapse');

    this.searchIconElement.setAttribute('data-toggle', 'tooltip');
    this.searchIconElement.setAttribute('data-placement', 'right');
    this.searchIconElement.setAttribute('data-original-title', 'Search by Place or Address');
    this.searchIconElement.setAttribute('title', 'Search by Place or Address');
    // make sure map click events do not fire when user clicks on search conrol
    L.DomEvent.disableClickPropagation(this.searchControlElement);

    // handle expanding of search box.  displays a collapse button to dom
    this.searchBoxElement = document.querySelector('.geocoder-control-input.leaflet-bar');
    this.searchBoxElement.addEventListener('mousedown', this.searchBoxExpandClickHandler.bind(this));
    this.searchBoxElement.addEventListener('click', this.searchBoxExpandClickHandler.bind(this));
    this.searchBoxElement.addEventListener('focus', SearchLocations.searchBoxExpandFocusHandler.bind(this));
    this.searchBoxElement.addEventListener('focusout', SearchLocations.searchBoxExpandBlurHandler.bind(this));
    this.searchBoxElement.addEventListener('blur', SearchLocations.searchBoxExpandBlurHandler.bind(this));

    // handle collapse of search box.  removed from displays the collapse button
    // from dom
    this.collapseSearch.addEventListener('click', this.searchBoxCollapseClickHandler.bind(this));

    this.collapseSearch.innerHTML = '<i class="fas fa-angle-double-left btn-search-locations-collapse"></i>';

    // get mapcompment
    this.mapComponent = mapComponent;

    // setup marker layer which is not set yet.
    this.marker = undefined;
    this.markerBounds = undefined;

    // add results hanlder for when user picks a location
    this.searchControl.on('results', this.resultsHandler.bind(this));

    // initalize new tooltips
    $(() => {
      $('.geocoder-control [data-toggle="tooltip"]').tooltip({ trigger: 'hover' });
    });
  }

  // handle search box click.  This expands the search box.
  searchBoxExpandClickHandler(ev) {
    this.searchControl.options.collapseAfterResult = false;
    L.DomUtil.removeClass(this.collapseSearch, 'd-none');
    // ga event action, category, label
    googleAnalyticsEvent('click', 'searchbox', 'expand');
  }

  static searchBoxExpandFocusHandler(ev) {
    const elem = document.querySelector('.geocoder-control');
    elem.classList.add('collapse-focus');
    if (window.screen.availWidth < 769) {
      const dnoneElem = document.querySelector('.leaflet-bottom.leaflet-left');
      dnoneElem.classList.add('d-none');
      const dnoneRightElem = document.querySelector('.leaflet-top.leaflet-right');
      dnoneRightElem.classList.add('d-none');
      const dnoneBntElem = document.querySelector('.maplayerslisttoggle-collapse');
      dnoneBntElem.classList.add('d-none');
      const attElem = document.querySelector('.leaflet-control-attribution');
      attElem.classList.add('d-none');
    }
  }

  static searchBoxExpandBlurHandler(ev) {
    const elem = document.querySelector('.geocoder-control');
    elem.classList.remove('collapse-focus');
    const dnoneElem = document.querySelector('.leaflet-bottom.leaflet-left');
    dnoneElem.classList.remove('d-none');
    const dnoneRightElem = document.querySelector('.leaflet-top.leaflet-right');
    dnoneRightElem.classList.remove('d-none');
    const dnoneBntElem = document.querySelector('.maplayerslisttoggle-collapse');
    dnoneBntElem.classList.remove('d-none');
    const attElem = document.querySelector('.leaflet-control-attribution');
    attElem.classList.remove('d-none');
  }

  // handle collapse of search box.  removed from displays the collapse button
  // from dom
  searchBoxCollapseClickHandler(ev) {
    // get the search location buttons holder element
    const CollapseElement = document.querySelector('.geocoder-control-expanded');

    // ga event action, category, label
    googleAnalyticsEvent('click', 'searchbox', 'collapse');

    // make the element exists in the dom
    if (CollapseElement !== null) {
      // if clicked child or explore buttton
      if (ev.target.id === 'btn-search-locations-collapse' || ParentContains(ev.target, 'btn-search-locations-collapse')) {
        this.searchControl.options.collapseAfterResult = true;
        this.searchControl.clear();
        this.searchControl.disable();
        // the leaflet-geocodiong force focus on the search input box
        // which forces the code to keep the css dom elements vissible
        // the onlly way to overcopme this is disable and the shortly
        // re-enable the dom element via the plugins code
        setTimeout(() => { this.searchControl.enable(); }, 0);
        L.DomUtil.addClass(this.collapseSearch, 'd-none');
      }
    }
  }

  // handle geocoding results from the esri leaflet geocoding plugin
  resultsHandler(data) {
    store.setStoreItem('working_search', true);
    spinnerOn();

    // clear old locations
    this.removeSearchLocations();

    // save results
    SearchLocations.saveResultsToStore(data);

    // add search location marker
    this.addSearchLocationsMarker(true);

    // add popup with slight delay
    this.addSearchLocationPopup();

    // force basemap redraw for force popup to
    // at similar location to open and bind
    this.mapComponent.zoomInAndOut();
  }

  // popup close handler
  searchLocationsPopupClose() {
    this.removeSearchLocations();
  }

  // add maker for idenSearchLocations
  // @param { Object } location object lat long
  // @param { Object } icon leaflet icon used as maker on map
  addMaker(location, icon) {
    this.marker = L.marker([location.lat, location.lng], { icon });
    this.mapComponent.map.addLayer(this.marker);
  }

  // remove old SearchLocations
  removeSearchLocations() {
    // clear old locations
    if (checkValidObject(this.marker)) {
      this.mapComponent.map.removeLayer(this.marker);
    }

    // ga event action, category, label
    googleAnalyticsEvent('click', 'searchbox', 'close');

    // remove the last location
    store.removeStateItem('mapSearchLocations');
  }

  // add search locations popup from the state store
  // @param { Boolean } zoomtolocation true zooms to location false just draws
  // default is false
  addSearchLocationsMarker(zoomtolocation = false) {
    // check the mapclick variable. if map clicked restore the state
    const { location } = store.getStateItem('mapSearchLocations');

    // ensure the mapSearchLocations state is a valid object
    if (checkValidObject(location)) {
      // get the custom map marker icon for the SearchLocations result
      const icon = SearchLocations.createSearchLocationsIcon();

      // zoom to location if searched we will not on restore (browser refresh)
      if (zoomtolocation) {
        // set map view to coordinates of the first item in the results and the zoom level to 18
        this.mapComponent.map.setView(location, 16);
      }

      // add marker at location to the map
      this.addMaker(location, icon);
    }
  }

  // handler for adding the location as an mapInfo point
  addSearchLocationsHandler() {
    // get the search location buttons holder element
    const iButtonElement = document.getElementById('searchlocations-buttons');

    // make the element exists in the dom
    if (iButtonElement !== null) {
      // add labels for assessabbility
      const SearchLocationsCloseButtonElement = document.querySelector('.search-locations-popup .leaflet-popup-close-button');
      SearchLocationsCloseButtonElement.setAttribute('aria-label', 'Close Locations');
      SearchLocationsCloseButtonElement.setAttribute('title', 'Close Locations');

      // add the click handler to parent element of buttons
      iButtonElement.addEventListener('click', (ev) => {
        // if clicked child or explore buttton
        if (ev.target.id === 'e-btn' || ParentContains(ev.target, 'e-btn')) {
          this.addSearchLocationsExploreHandler();
          // ga event action, category, label
          googleAnalyticsEvent('click', `searchbox ${store.getStateItem('activeNav')}`, 'exlpore');
        }
        // if clicked child or mapinfo buttton
        if (ev.target.id === 'i-btn' || ParentContains(ev.target, 'i-btn')) {
          this.addSearchLocationsMapInfoHandler();
          // ga event action, category, label
          googleAnalyticsEvent('click', `searchbox ${store.getStateItem('activeNav')}`, 'mapinfo');
        }
      });
    }
  }

  // handler for adding the location as an mapInfo point
  addSearchLocationsMapInfoHandler() {
    // spinnerOn();
    // remove old marker
    this.mapInfoComponent.removeMapMarker();

    // add new marker location to store so the new marker can be added
    store.setStoreItem('mapClick', store.getStateItem('mapSearchLocations').location);

    // add the marker for the mapinfo from the mapinfo component
    this.mapInfoComponent.retreiveMapClick();

    // remove search locations so there is not duplicate points
    this.removeSearchLocations();
  }

  addSearchLocationsExploreHandler() {
    // spinnerOn();
    if (this.markerBounds !== undefined) {
      this.mapInfoComponent.map.removeLayer(this.markerBounds);
    }

    // clear old user area
    // remove existing Area
    // this.exploreComponent.drawAreaGroup.clearLayers();
    store.removeStateItem('userarea');

    let shapecount = store.getStateItem('userareacount');

    // sometimes with the search by location the the count is returned as an object
    // if that is the case capture it and make it zero
    if (!Number.isInteger(shapecount)) {
      shapecount = 0;
    }

    store.setStoreItem('userareacount', shapecount + 1);
    // add the user area. in this case the user area is a point
    // we are running zonal states so we need a polygon. we are using a small
    // bounding box of "50" meters for now we may need to make 1 kilomter later
    // to pass to the zonal stats api
    const userArea = store.getStateItem('mapSearchLocations').location;
    const center = L.latLng(userArea.lat, userArea.lng);
    const bounds = center.toBounds(50);

    const latlngs = [];

    // get the corners of the box so we can convert it too geoJSON
    latlngs.push(bounds.getSouthWest()); // bottom left
    latlngs.push(bounds.getSouthEast()); // bottom right
    latlngs.push(bounds.getNorthEast()); // top right
    latlngs.push(bounds.getNorthWest()); // top left

    // create a polygon. leaflet can only convert shapes, markers to geoJSON
    const userPoly = L.polygon(latlngs);
    const userPolyGeoJSON = userPoly.toGeoJSON();

    // add the geoJSON to the store
    store.setStoreItem('userarea', userPolyGeoJSON);

    // add the shape to the map
    this.exploreComponent.drawUserArea();

    // remove old search locations? do I need this?
    this.removeSearchLocations();
    store.setStoreItem('working_search', false);
    spinnerOff('addSearchLocationsExploreHandler');
  }

  // Check for DOM animation.  This would include map
  // zooms, pans, etc.  We check becuase we cannot do things
  // like add a popup until the map completes this - it seems map will
  // not complete intialize until this is finsished
  checkAnimation() {
    const element = this.mapComponent.map.getContainer();
    if (element !== null) {
      window.requestAnimationFrame(this.checkAnimation(element));
    } else {
      return true;
    }
    return true;
  }

  // we need to check if the popup is open so we don't
  // render multiple popups
  checkPopupOpen() {
    if (checkValidObject(this.marker)) {
      return this.marker.isPopupOpen();
    }
    return false;
  }

  // just add the popup to map
  drawPopup() {
    const location = SearchLocations.getSearchLocationsLatLong();
    const popup = this.addSearchLocationsPopup(location, -123);

    if (checkValidObject(popup)) {
      // set popup close handler
      popup.on('popupclose', this.popupCloseHandler.bind(this));
    }

    this.mapComponent.map.invalidateSize();
  }

  // if map tiles are drawing for a base map leaflet will not
  // place the popup in the correct lication so we must wait till they
  // have completed to draw.
  // second we also have to make sure there is no popup already open
  // when panning or zooming otherwise it will draw multiple
  // popups.  When a new search is initated it will first delete the
  // popup so the new location should render once
  // TODO handle no basemap redraw aka the search subsequent search
  // locations are similar
  addSearchLocationPopup() {
    // spinnerOn();
    // see if popup is open
    let check = false;
    if (checkValidObject(this.marker)) {
      check = this.marker.isPopupOpen();
    }

    // have to set time the popup is not added to the dom immediately
    // so we must wait a very breif time to add the marker and popup.
    // otherwise the popup will be appear in the wrong location
    if (this.checkAnimation) {
      // needs to work when nothing loaded too
      this.mapComponent.map.on('basemaploaded', () => {
        // find if popu is currently open so we avoid
        // opening multiple instances
        check = this.checkPopupOpen();

        // only open the popup if it's not avoid s
        // opening multiple instances
        if (!check) {
          this.drawPopup();
          store.setStoreItem('working_search', false);
          spinnerOff('addSearchLocationsExploreHandler not finsiehd');
        }
      });
    } else {
      store.setStoreItem('working_search', false);
      spinnerOff('addSearchLocationsExploreHandler failed lookup');
    }

    store.setStoreItem('working_search', false);
    spinnerOff('addSearchLocationsExploreHandler failed lookup');
  }

  // handler for closing popup
  popupCloseHandler() {
    this.removeSearchLocations();
    // ga event action, category, label
    googleAnalyticsEvent('click', 'searchbox', 'popup close');
  }

  // restore the state form map info/identify
  restoreSearchLocationsState() {
    // add search location marker
    this.addSearchLocationsMarker(false);
    this.addSearchLocationPopup();
  }

  // add the search location popup to the maker (searched location)
  // @param { Object } location (marker) object lat long
  // @param { Integer } offsetx for offseting the popup
  // for some reason when I restore the offset is different so I have
  // pass it differently for search and add and restore and add
  addSearchLocationsPopup(location, offsetx) {
    if (checkValidObject(this.marker)) {
      const content = SearchLocations.getSearchLocationsLabel();

      // ga event action, category, label
      googleAnalyticsEvent('return', 'searchbox', content);

      const oldContentElement = document.getElementById('searchlocations_list');
      if (oldContentElement !== null) {
        oldContentElement.parentNode.removeChild(oldContentElement);
      }

      // get the SearchLocations html document and udpate
      // the content with returned values
      const doc = SearchLocations.getDocument();

      // get the Explore button element
      const element = doc.getElementById('searchlocations-content');
      if (element !== undefined && element !== null) {
        element.innerHTML = content;
      }

      // add the search locations html template to a dom element
      // so we can add the element as a leaflet popup
      const searchlocationsEl = doc.getElementById('searchlocations_list');
      const searchlocationsContent = L.Util.template(searchlocationsEl.outerHTML);

      // create popup object and bind it to location marker
      const popup = this.marker.bindPopup(
        searchlocationsContent,
        {
          autoClose: false,
          closeOnClick: false,
          opacity: 0.9,
          autoPan: false,
          className: 'search-locations-popup',
          offset: L.point(offsetx, 20)
        }
      );

      // open popup if location is valid
      if (checkValidObject(location)) {
        // open popup
        this.marker.openPopup(location);
        // add handler for parent button element
        // need parent to deal with lag in dom manipulation
        // with bootstrap, fontawesome, and leaflet
        this.addSearchLocationsHandler();
      }
      // return the popup object
      return popup;
    }
    return null;
  }

  // get text label from searched location from statore
  static getSearchLocationsLabel() {
    // check the mapclick variable. if map clicked restore the state
    const mapSearchLocations = store.getStateItem('mapSearchLocations');
    if (checkValidObject(mapSearchLocations)) {
      return mapSearchLocations.label;
    }
    return '';
  }

  // get location x y searched location from statore
  static getSearchLocationsLocation() {
    // check the mapclick variable. if map clicked restore the state
    const mapSearchLocations = store.getStateItem('mapSearchLocations');
    if (checkValidObject(mapSearchLocations)) {
      return mapSearchLocations.location;
    }
    return '';
  }

  // create a html dom element for the SearchLocations html template
  static getDocument() {
    const parser = new DOMParser();
    return parser.parseFromString(searchlocationsTemplate, 'text/html');
  }

  // return lat long of search location from store
  static getSearchLocationsLatLong() {
    return L.latLng(
      SearchLocations.getSearchLocationsLocation().lat,
      SearchLocations.getSearchLocationsLocation().lng
    );
  }

  // creates custom icon and adds css class for styling
  static createSearchLocationsIcon() {
    return L.divIcon({ className: 'searchlocations-point' });
  }

  // save the search results to the state store
  static saveResultsToStore(data) {
    // save location to store
    // only retrieve first item (need to remove multiselect)
    store.setStoreItem('mapSearchLocations', { location: data.results[0].latlng, label: data.results[0].properties.ShortLabel });
  }
}
