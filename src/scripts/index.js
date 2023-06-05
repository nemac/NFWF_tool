// import dependencies
import Navigo from 'navigo';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

// import custom classess
import { Store } from './store';
import { URL } from './url';
import {
  checkValidObject,
  addMissingStateItems,
  addDownloadGoogleEvents,
  formatChartData
  // askForHelp
} from './utilitys';

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
import LandingPage from '../templates/landingpage.html';
import { restoreGraphState } from './zonalStats';
import { mapConfig } from '../config/mapConfig';

// scss
import '../css/_print.scss';
// initialize navbar
// const aboutnavBarComponent = new AboutNavBar('about-nav-holder');
const navBarComponent = new NavBar('nav-holder');

const urlParams = new URLSearchParams(window.location.search);
const hasShareURL = urlParams.get('shareurl');
const theStartNav = urlParams.get('fornav');
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

// lint overirdes
store.setStoreItem('navBarComponent', navBarComponent);
store.removeStateItem('navBarComponent');
store.setStoreItem('maplayersComponent', maplayersComponent);
store.removeStateItem('maplayersComponent');
store.setStoreItem('aboutComponent', aboutComponent);
store.removeStateItem('aboutComponent');
store.setStoreItem('shareurl', shareurl);
store.removeStateItem('shareurl');

// reformat state data for use in charts.js
formatChartData();

let homeloc = window.location.origin;
const path = window.location.pathname;
// handle gh pages dist folder.
if (homeloc === 'https://nemac.github.io') {
  if (path.includes('crest-refresh-stagging')) {
    homeloc += '/crest-refresh-stagging/dist';
  } else {
    homeloc += '/NFWF_tool/dist';
  }
}

// triggers event for zomming to region with a quick link from home page
//  or anywhere really
function triggerZoomRegionQuikLink() {
  const navChangeEvent = new CustomEvent('zoomRegionQuikLink');
  window.dispatchEvent(navChangeEvent);
}

function setRegionsQuikLinkState(regionForState) {
  const { zoomRegions } = mapConfig;
  store.setStoreItem('region', regionForState);
  const region = zoomRegions.filter(regions => regions.region === regionForState);
  store.setStoreItem('region', regionForState);
  store.setStoreItem('mapCenter', { lat: region[0].center[0], lng: region[0].center[1] });
  store.setStoreItem('mapZoom', region[0].zoom);
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
function initMapComponent() { // add parameter for type of explore
  if (mapComponent === undefined) {
    mapComponent = initMap('map-holder');
    maplayersComponent = initMapLayerList(mapComponent, 'maplayers_list-holder');
    mapInfoComponent = new MapInfo('', { mapComponent });
    setworkingstates();
    exploreComponent = new Explore('explore-holder', {
      mapComponent,
      mapInfoComponent,
      hasShareURL,
      theStartNav
    });
    shareurl = new ShareUrl('', { mapComponent, URLCls });
    // add switch for type of explore
    searchLocationsComponent = new SearchLocations('', {
      mapComponent,
      mapInfoComponent,
      exploreComponent,
      hasShareURL,
      theStartNav
    });
  }

  // restore only if first render
  if (mapComponent.renderCount === 0) {
    mapComponent.restoreMapState();

    if (checkValidObject(mapInfoComponent)) {
      // mapInfoComponent.restoreMapInfoState();
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

  const activeNav = store.getStateItem('activeNav');

  // this very hacky need better way to handle
  if (selector === 'main-nav-map-searchhubs' || selector === 'main-nav-map-searchNShubs' || selector === 'main-nav-map-examples') {
    NavBar.toggleTabContent('main-nav-map');
  } else {
    NavBar.toggleTabContent(selector);
  }

  if (activeNav) {
    if (activeNav === 'main-nav-map-searchhubs' || activeNav === 'main-nav-map-searchNShubs' || activeNav === 'main-nav-map-examples') {
      NavBar.tabUpdate(activeNav);
    } else {
      NavBar.tabUpdate(selector);
    }
  } else {
    NavBar.tabUpdate(selector);
  }
  const navChangeEvent = new CustomEvent('aboutNavChange');
  window.dispatchEvent(navChangeEvent);
}

// Initializes the static pages by inserting the rendered template into the selected DOM element
//
// @param selector - string DOM selector
// @param template - HTML template
function initStaticPage(selector, template) {
  const componentElem = document.getElementById(selector);
  componentElem.innerHTML = template;
}

const router = new Navigo(homeloc, true);

addMissingStateItems();
if (window.screen.availWidth < 769) {
  store.setStoreItem('maplayerlist', 'close');
}

function addLandingListners() {
  const elemStartUsingCREST = document.getElementById('whatcando-btn-startusingCREST');
  if (elemStartUsingCREST) {
    const location = elemStartUsingCREST.getAttribute('href');
    elemStartUsingCREST.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map-searchhubs');
      if (elemCREST) {
        elemCREST.click();
        setNavBars('main-nav-map-searchhubs');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTALASKAIMG = document.getElementById('landingpage-btn-alaska-img');
  if (elemStartUsingCRESTALASKAIMG) {
    const location = elemStartUsingCRESTALASKAIMG.getAttribute('href');
    elemStartUsingCRESTALASKAIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('alaska');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTALASKA = document.getElementById('landingpage-btn-alaska');
  if (elemStartUsingCRESTALASKA) {
    const location = elemStartUsingCRESTALASKA.getAttribute('href');
    elemStartUsingCRESTALASKA.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('alaska');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTGREATLAKESIMG = document.getElementById('landingpage-btn-alaska-img');
  if (elemStartUsingCRESTGREATLAKESIMG) {
    const location = elemStartUsingCRESTGREATLAKESIMG.getAttribute('href');
    elemStartUsingCRESTGREATLAKESIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('great_lakes');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTGREATLAKES = document.getElementById('landingpage-btn-alaska');
  if (elemStartUsingCRESTGREATLAKES) {
    const location = elemStartUsingCRESTGREATLAKES.getAttribute('href');
    elemStartUsingCRESTGREATLAKES.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('alaska');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTCONUSIMG = document.getElementById('landingpage-btn-conus-img');
  if (elemStartUsingCRESTCONUSIMG) {
    const location = elemStartUsingCRESTCONUSIMG.getAttribute('href');
    elemStartUsingCRESTCONUSIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('continental_us');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTCONUS = document.getElementById('landingpage-btn-conus');
  if (elemStartUsingCRESTCONUS) {
    const location = elemStartUsingCRESTCONUS.getAttribute('href');
    elemStartUsingCRESTCONUS.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('continental_us');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTPuertoRicoIMG = document.getElementById('landingpage-btn-puerto_rico-img');
  if (elemStartUsingCRESTPuertoRicoIMG) {
    const location = elemStartUsingCRESTPuertoRicoIMG.getAttribute('href');
    elemStartUsingCRESTPuertoRicoIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('puerto_rico');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTPuertoRico = document.getElementById('landingpage-btn-puerto_rico');
  if (elemStartUsingCRESTPuertoRico) {
    const location = elemStartUsingCRESTPuertoRico.getAttribute('href');
    elemStartUsingCRESTPuertoRico.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('puerto_rico');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTHawaiiIMG = document.getElementById('landingpage-btn-hawaii-img');
  if (elemStartUsingCRESTHawaiiIMG) {
    const location = elemStartUsingCRESTHawaiiIMG.getAttribute('href');
    elemStartUsingCRESTHawaiiIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('hawaii');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTHawaii = document.getElementById('landingpage-btn-hawaii');
  if (elemStartUsingCRESTHawaii) {
    const location = elemStartUsingCRESTHawaii.getAttribute('href');
    elemStartUsingCRESTHawaii.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('hawaii');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTUSVirginIslandsIMG = document.getElementById('landingpage-btn-us_virgin_islands-img');
  if (elemStartUsingCRESTUSVirginIslandsIMG) {
    const location = elemStartUsingCRESTUSVirginIslandsIMG.getAttribute('href');
    elemStartUsingCRESTUSVirginIslandsIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('us_virgin_islands');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTUSVirginIslands = document.getElementById('landingpage-btn-us_virgin_islands');
  if (elemStartUsingCRESTUSVirginIslands) {
    const location = elemStartUsingCRESTUSVirginIslands.getAttribute('href');
    elemStartUsingCRESTUSVirginIslands.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('us_virgin_islands');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTNorthernMarianaIslands = document.getElementById('landingpage-btn-northern_mariana_islands');
  if (elemStartUsingCRESTNorthernMarianaIslands) {
    const location = elemStartUsingCRESTNorthernMarianaIslands.getAttribute('href');
    elemStartUsingCRESTNorthernMarianaIslands.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('northern_mariana_islands');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTNorthernMarianaIslandsIMG = document.getElementById('landingpage-btn-northern_mariana_islands-img');
  if (elemStartUsingCRESTNorthernMarianaIslandsIMG) {
    const location = elemStartUsingCRESTNorthernMarianaIslandsIMG.getAttribute('href');
    elemStartUsingCRESTNorthernMarianaIslandsIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('northern_mariana_islands');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTAmericanSamoa = document.getElementById('landingpage-btn-american_samoa');
  if (elemStartUsingCRESTAmericanSamoa) {
    const location = elemStartUsingCRESTAmericanSamoa.getAttribute('href');
    elemStartUsingCRESTAmericanSamoa.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('american_samoa');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTAmericanSamoaIMG = document.getElementById('landingpage-btn-american_samoa-img');
  if (elemStartUsingCRESTAmericanSamoaIMG) {
    const location = elemStartUsingCRESTAmericanSamoaIMG.getAttribute('href');
    elemStartUsingCRESTAmericanSamoaIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('american_samoa');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTGreatLakes = document.getElementById('landingpage-btn-great_lakes');
  if (elemStartUsingCRESTGreatLakes) {
    const location = elemStartUsingCRESTGreatLakes.getAttribute('href');
    elemStartUsingCRESTGreatLakes.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('great_lakes');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTGreatLakesIMG = document.getElementById('landingpage-btn-great_lakes-img');
  if (elemStartUsingCRESTGreatLakesIMG) {
    const location = elemStartUsingCRESTGreatLakesIMG.getAttribute('href');
    elemStartUsingCRESTGreatLakesIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('great_lakes');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTGuam = document.getElementById('landingpage-btn-guam');
  if (elemStartUsingCRESTGuam) {
    const location = elemStartUsingCRESTGuam.getAttribute('href');
    elemStartUsingCRESTGuam.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('guam');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingCRESTGuamIMG = document.getElementById('landingpage-btn-guam-img');
  if (elemStartUsingCRESTGuamIMG) {
    const location = elemStartUsingCRESTGuamIMG.getAttribute('href');
    elemStartUsingCRESTGuamIMG.addEventListener('click', (e) => {
      e.preventDefault();
      const elemCREST = document.getElementById('main-nav-map');
      if (elemCREST) {
        setRegionsQuikLinkState('guam');
        triggerZoomRegionQuikLink();
        elemCREST.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingRP = document.getElementById('whatcando-btn-reslinceprojects');
  if (elemStartUsingRP) {
    const location = elemStartUsingRP.getAttribute('href');
    elemStartUsingRP.addEventListener('click', (e) => {
      e.preventDefault();
      const elemSH = document.getElementById('main-nav-map-searchhubs');
      if (elemSH) {
        elemSH.click();
        setNavBars('main-nav-map-searchhubs');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingAS = document.getElementById('whatcando-btn-analyzesites');
  if (elemStartUsingAS) {
    const location = elemStartUsingAS.getAttribute('href');
    elemStartUsingAS.addEventListener('click', (e) => {
      e.preventDefault();
      const elemAS = document.getElementById('main-nav-map');
      if (elemAS) {
        elemAS.click();
        setNavBars('main-nav-map');
        router.navigate(location);
      }
    });
  }

  const elemStartUsingLM = document.getElementById('whatcando-btn-learnmore');
  if (elemStartUsingLM) {
    const location = elemStartUsingLM.getAttribute('href');
    elemStartUsingLM.addEventListener('click', (e) => {
      e.preventDefault();
      const elemLM = document.getElementById('main-nav-about');
      if (elemLM) {
        elemLM.click();
        setNavBars('main-nav-about');
        router.navigate(location);
        window.scrollTo(0, 0);
      }
    });
  }

  const elemStartUsingTS = document.getElementById('whatcando-btn-targetedwatershed');
  if (elemStartUsingTS) {
    const location = elemStartUsingTS.getAttribute('href');
    elemStartUsingTS.addEventListener('click', (e) => {
      e.preventDefault();
      const elemTS = document.getElementById('main-nav-map-searchNShubs');
      if (elemTS) {
        elemTS.click();
        setNavBars('main-nav-map-searchNShubs');
        router.navigate(location);
      }
    });
  }
}

router.on({
  '/': (params, query) => {
    initStaticPage('landingpage-holder', LandingPage);
    setNavBars('main-nav-landingpage');
    addDownloadGoogleEvents();
    addLandingListners();
  },
  '/Home': (params, query) => {
    initStaticPage('landingpage-holder', LandingPage);
    setNavBars('main-nav-landingpage');
    addDownloadGoogleEvents();
    addLandingListners();
  },
  '/AnalyzeProjectSites': (params, query) => {
    initMapComponent();
    setNavBars('main-nav-map');
  },
  '/SearchHubs': (params, query) => {
    initMapComponent();
    setNavBars('main-nav-map-searchhubs');
  },

  '/SearchNSHubs': (params, query) => {
    initMapComponent();
    setNavBars('main-nav-map-searchNShubs');
  },
  '/Examples': (params, query) => {
    initMapComponent();
    setNavBars('main-nav-map-examples');
  },
  '/About': (params, query) => {
    aboutComponent = initAbout('about-holder');
    setNavBars('main-nav-about');
  },
  '/Download': (params, query) => {
    initStaticPage('download-holder', DownloadDataPage);
    setNavBars('main-nav-download');
    addDownloadGoogleEvents();
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

// only run if share url has different start nav
if (checkValidObject(theStartNav)) {
  const elemMain = document.getElementById('main-nav-map');
  if (elemMain) {
    elemMain.click();
  }
  const elemStartNav = document.getElementById(theStartNav);
  if (elemStartNav) {
    elemStartNav.click();
  }
}

// askForHelp();
//
// function eventsaddtest() {
//   // need dom to be updated so timeout.
//   // handles navigation from landing page to the tool and search by hubs
//   setTimeout(() => {
//
//   }, 50);
//
// }
