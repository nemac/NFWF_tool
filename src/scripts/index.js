// import dependencies
import Navigo from 'navigo';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

// import custom classess
import { Store } from './store';
import { URL } from './url';
import { checkValidObject } from './utilitys';

// import extended components
import { Map } from './map';
import { MapLayersList } from './maplayers_list';
import { NavBar } from './navBar';
import { About } from './about';
import { Explore } from './explore';
import { MapInfo } from './mapinfo';
import { ShareUrl } from './shareurl';
import { SearchLocations } from './searchlocations';

// import html templates
import DownloadDataPage from '../templates/downloaddata.html';
import NotFoundPage from '../templates/notfound.html';

import { restoreGraphState } from './zonalStats';

// initialize navbar
// const aboutnavBarComponent = new AboutNavBar('about-nav-holder');
const navBarComponent = new NavBar('nav-holder');

const urlParams = new URLSearchParams(window.location.search);
const hasShareURL = urlParams.get('shareurl');

const URLCls = new URL();

library.add(fas, far);

// Kicks off the process of finding <i> tags and replacing with <svg>
dom.watch();

let mapComponent;
let maplayersComponent;
let exploreComponent;
let mapInfoComponent;
let searchLocationsComponent;
let aboutComponent;
let shareurl;

const store = new Store({});

let homeloc = window.location.origin;
// handle gh pages dist folder.
if (homeloc === 'https://nemac.github.io') {
  homeloc += '/NFWF_tool/dist';
}

// Creates a new Leaflet Map in the target DOM element
//
// @param selector - string DOM selector
// Closes over global import Map
function initMap(selector) {
  return new Map(selector);
}

// Creates a new about page component
//
// @param selector - string DOM selector
// Closes over global import Map
function initAbout(selector) {
  return new About(selector);
}

// Creates a new Leaflet Map in the target DOM element
//
// @param map - instantiated element of class Map
// @param selector - string DOM selector
// Closes over global import MapLayersList
function initMapLayerList(map, selector) {
  return new MapLayersList(selector, {
    mapComponent: map,
    events: {
      layerToggle: (event) => { map.toggleLayer(event.detail); }
    }
  });
}

// set the state for items that could be working
// we will need this to make sure we do not stop the spinner befire the work
// is actually complete
function setworkingstates() {
  store.setStoreItem('working_basemap', false);
  store.setStoreItem('working_mapinfo', false);
  store.setStoreItem('working_zonalstats', false);
  store.setStoreItem('working_search', false);
  store.setStoreItem('working_s3retreive', false);
  store.setStoreItem('working_s3save', false);
  store.setStoreItem('working_drawlayers', false);
}

// Creates the entire map component
//
// Closes over global import Map
function initMapComponent() {
  if (mapComponent === undefined) {
    mapComponent = initMap('map-holder');
    maplayersComponent = initMapLayerList(mapComponent, 'maplayers_list-holder');
    mapInfoComponent = new MapInfo('', { mapComponent });
    setworkingstates();
    exploreComponent = new Explore('explore-holder', {
      mapComponent,
      mapInfoComponent,
      hasShareURL
    });
    searchLocationsComponent = new SearchLocations('', {
      mapComponent,
      mapInfoComponent,
      exploreComponent,
      hasShareURL
    });
    shareurl = new ShareUrl('', { mapComponent, URLCls });
  }

  // restore only if first render
  if (mapComponent.renderCount === 0) {
    mapComponent.restoreMapState();

    if (checkValidObject(mapInfoComponent)) {
      mapInfoComponent.restoreMapInfoState();
    }

    if (checkValidObject(searchLocationsComponent)) {
      searchLocationsComponent.restoreSearchLocationsState();
    }

    if (checkValidObject(exploreComponent)) {
      exploreComponent.restoreSavedGeoJson();
      restoreGraphState();
    }
  }

  mapComponent.renderCount += 1;

  // delay listners unitll after setup also needs slight time out so the map dose not move on start
  setTimeout(() => { mapComponent.addMapEventListners(mapComponent.map); }, 1000);
}

// deal with nav bars so back button is not broken
//
// @param selector - string DOM selector
// Closes over global import NavBar
function setNavBars(selector) {
  NavBar.resetTabContent();
  NavBar.toggleTabContent(selector);
  NavBar.tabUpdate(selector);
}
// function setAboutNavBars(selector) {
//   AboutNavBar.resetTabContent();
//   AboutNavBar.toggleTabContent(selector);
//   AboutNavBar.tabUpdate(selector);
// }

// Initializes the static pages by inserting the rendered template into the selected DOM element
//
// @param selector - string DOM selector
// @param template - HTML template
function initStaticPage(selector, template) {
  const componentElem = document.getElementById(selector);
  componentElem.innerHTML = template;
}

const router = new Navigo(homeloc, true);

// TODO: make the tab content area dynamic also similar to the nav tabs

// examples of coded map interactions for testing
// const maintitleElement = document.getElementById('maintitle');
// maintitleElement.addEventListener('click', (e) => {
//   console.log(mapInfoComponent.marker)
//   searchLocationsComponent.delayedSearchLocationPopup();
//   const mapCenter = store.getStateItem('mapCenter')
//
//   mapComponent.restoreMapCenter(mapCenter)
//   mapComponent.map.panTo(mapCenter);
//   console.log('end', mapCenter)
//   const store = new Store({});
//   mapComponent.setLayerStatus('SA_ThreatIndex');
//   mapComponent.setMapClick({lat: 32.76966654128219, lng: -79.93103027343751});
//   mapComponent.setMapZoom(5);
//   mapComponent.setMapCenter({lat: 32.76966654128219, lng: -79.93103027343751});
//   console.log('test')
//   mapComponent.clearState();
//   console.log(store.clearState())
//   console.log(store.getStateItem("mapClick"))
//   console.log(mapComponent.restoreMapState())
//   mapComponent.setStateFromObject(store.getState())
//   console.log(store.getStateItem('mapLayerDisplayStatus'))
//   console.log(store.removeStateItem('mapClick'));
//   console.log(store.addStateItem('mapClick',{lat: 32.76966654128219, lng: -79.93103027343751}));
//   console.log()
// });

router.on({
  '/': (params, query) => {
    setNavBars('main-nav-map');
    initMapComponent();
  },
  '/Home': (params, query) => {
    setNavBars('main-nav-map');
    initMapComponent();
  },
  '/About': (params, query) => {
    setNavBars('main-nav-about');
    // setAboutNavBars('about-nav');
    aboutComponent = initAbout('about-holder');
    // initStaticPage('about-holder', AboutPage);
  },
  '/Download': (params, query) => {
    setNavBars('main-nav-download');
    initStaticPage('download-holder', DownloadDataPage);
  }
});

// implement later need to make the tab content area dynamic also
router.notFound((query) => {
  NavBar.resetTabContent();
  NavBar.toggleTabContent('main-nav-notfound');

  // initialize 404
  initStaticPage('notfound-holder', NotFoundPage);
});

router.resolve();
