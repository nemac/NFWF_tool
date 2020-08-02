import L from 'leaflet';
import ZonalWrapper from '../templates/zonal_wrapper.html';
import ZonalLong from '../templates/zonal_long.html';
import ZonalShort from '../templates/zonal_short.html';
import ZonalButtons from '../templates/zonal_buttons.html';

import { Store } from './store';
import { mapConfig } from '../config/mapConfig';
import { bindZonalExportHandler } from './zonalFileExporter';

import {
  checkValidObject,
  googleAnalyticsEvent,
  groupByDriver,
  numberToWord,
  makeBasicBarChart,
  formatMapInfoChartData,
  hardSpinnerOff,
  getLegendHtml
} from './utilitys';

const { zoomRegions } = mapConfig;
const { TMSLayers } = mapConfig;

// required for bootstrap
window.$ = require('jquery');
// required for tooltip, popup...
window.Popper = require('popper.js');

window.jQuery = window.$;

const store = new Store({});

function shapeNavOff() {
  const elem = document.querySelector('.navbar-explore-shapes');
  if (elem) {
    elem.classList.add('long-graphs-active');
  }
}

function shapeNavOn() {
  const elem = document.querySelector('.navbar-explore-shapes');
  if (elem) {
    elem.classList.remove('long-graphs-active');
  }
}

// Checks if a value falls in the range of accepted values
// @param val | string || integer || float
// @return boolean
function checkNoData(val) {
  return Number.isNaN(Number.parseFloat(val)) || Number.parseInt(val, 10) === 255;
}

// Creates a div
function makeDiv() {
  return document.createElement('div');
}

// Creates a text element
// @param text | string
function makeTextElement(text) {
  return document.createTextNode(text);
}

function makeHTMLName(name) {
  return `-USERAREA-${name.replace(' ', '_')}`;
}

function stripUserArea(id) {
  if (!id) return id;
  const striptext = '-USERAREA-';
  const index = id.indexOf(striptext);
  const idLength = id.length;

  if (index >= 0) {
    return id.substring(index, idLength).trim();
  }

  return id;
}

// Gets text for an individual short zonal stats item title
// @return String
function makeLabelText(name) {
  return `Get Details for ${name}`;
}

function setGraphsState(name, activetype) {
  let newname = name;

  const striptext = ['raw-name', 'graph-name', 'dismiss-name', 'label-name'];

  striptext.map((replacetext) => {
    if (name.indexOf(replacetext) >= 0) {
      newname = name.replace(replacetext, 'name');
      return newname;
    }
    return newname;
  });

  newname = newname.replace('name--USERAREA', 'name---USERAREA');
  store.setStoreItem('zonalactive', [newname, activetype]);
  return newname;
}

function enableMainZonalButton() {
  const zonalHolders = document.querySelectorAll('.zonal-stats-button-holder');
  zonalHolders.forEach((zonalHolder) => {
    zonalHolder.classList.remove('d-none');
  });
}

function ZonalWrapperActiveRemove() {
  const x = document.querySelectorAll('.zonal-short-wrapper');
  let i;
  for (i = 0; i < x.length; i += 1) {
    x[i].classList.remove('active');
  }
}

function dissmissAllZonalStatsWrappers() {
  const zonalWrappers = document.querySelectorAll('.zonal-stats-wrapper');
  zonalWrappers.forEach((zonalwrapper) => {
    zonalwrapper.classList.remove('active');
    zonalwrapper.classList.add('d-none');
  });
}

function zonalStatsWrappersActive(name) {
  const zonalWrapper = document.getElementById(`zonal-stats-wrapper-${name}`);
  zonalWrapper.classList.remove('d-none');
  zonalWrapper.classList.add('active');
}

function disableMainZonalButton() {
  const zonalHolders = document.querySelectorAll('.zonal-stats-button-holder');
  zonalHolders.forEach((zonalHolder) => {
    zonalHolder.classList.add('d-none');
  });
}

function disableOverView(text = 'none') {
  const buttonHolder = document.getElementById('zonal-stats-short-title-holder');
  buttonHolder.classList.add('d-none');
}

function disableAllZonalButtons() {
  disableOverView();
  const buttons = document.querySelectorAll('.zonal-long-button-wrapper');
  buttons.forEach((button) => {
    button.classList.add('d-none');
  });
}

// set zonal buttons and header off
function disableZonalButtons(HTMLName) {
  disableMainZonalButton();
  disableAllZonalButtons();
  disableOverView();
  if (document.querySelector(`#button-name--${HTMLName}`)) {
    document.querySelector(`#button-name--${HTMLName}`).classList.add('d-none');
    document.querySelector(`#dismiss-name--${HTMLName}`).classList.add('d-none');
    document.querySelector(`#raw-name--${HTMLName}`).classList.add('d-none');
    document.querySelector(`#graph-name--${HTMLName}`).classList.add('d-none');
  }
}

function disableAllZonalWrappers() {
  const zonalWrappers = document.querySelectorAll('.zonal-long-wrapper ');
  zonalWrappers.forEach((zonalwrapper) => {
    zonalwrapper.classList.remove('active');
  });
}

function enableOverView(text = 'none') {
  const buttonHolder = document.getElementById('zonal-stats-short-title-holder');
  buttonHolder.classList.remove('d-none');
}

function ZonalWrapperActiveAdd() {
  const x = document.querySelectorAll('.zonal-short-wrapper');
  let i;
  for (i = 0; i < x.length; i += 1) {
    x[i].classList.add('active');
  }
}

// Switches the display to the short zonal stats
// @param wrapper | DOM element
function dismissLongZonalStats(wrapper) {
  wrapper.classList.remove('active');
  wrapper.classList.remove('active-table');
  document.getElementById('zonal-header').classList.remove('d-none');

  const id = wrapper.getAttribute('id');
  const HTMLName = stripUserArea(id);
  disableMainZonalButton();
  disableZonalButtons(HTMLName);
  disableAllZonalWrappers();
  enableOverView('dismissLongZonalStats');

  const hasShapeButtonElem = document.getElementById('hasshape-button-holder');
  hasShapeButtonElem.classList.remove('d-none');
  ZonalWrapperActiveAdd();
}

function enableAllZonalStatsWrappers() {
  const zonalWrappers = document.querySelectorAll('.zonal-stats-wrapper');
  zonalWrappers.forEach((zonalwrapper) => {
    zonalwrapper.classList.remove('d-none');
  });
}

function togglePermHighLightsOff(elem) {
  if (elem) {
    elem.classList.remove('path-highlight-perm');
    elem.classList.add('path-nohighlight-perm');
  }
}

function toggleALLPathsOff(elem) {
  const pathsHighlight = document.querySelectorAll('.path-highlight');
  const pathsHighlightPerm = document.querySelectorAll('.path-highlight-perm');

  pathsHighlight.forEach((path) => {
    path.classList.remove('path-highlight');
    path.classList.add('path-nohighlight');
  });

  pathsHighlightPerm.forEach((path) => {
    path.classList.remove('path-highlight-perm');
    path.classList.add('path-nohighlight-perm');
  });
}

function getZonalWrapper(elem) {
  const areanameid = elem.id;
  const areaname = stripUserArea(areanameid);
  const selector = `.zonal-long-wrapper.active#name-${areaname}`;
  const wrapperelem = document.querySelector(selector);
  return wrapperelem;
}

// limits charts to the current regions
function toggleRegionCharts() {
  const region = store.getStateItem('region');
  const notInRegionInfo = zoomRegions.filter(regions => regions.region !== region);
  const inRegionInfo = zoomRegions.filter(regions => regions.region === region);

  notInRegionInfo.forEach((theRegion) => {
    const notThisRegionElems = document.querySelectorAll(`.zonal-stats-wrapper.region-${theRegion.region}`);
    notThisRegionElems.forEach((notThisRegionElem) => {
      if (notThisRegionElem) {
        notThisRegionElem.classList.add('d-none');
      }
    });
  });

  inRegionInfo.forEach((theRegion) => {
    const inThisRegionElems = document.querySelectorAll(`.zonal-stats-wrapper.region-${theRegion.region}`);
    inThisRegionElems.forEach((inThisRegionElem) => {
      if (inThisRegionElem) {
        inThisRegionElem.classList.remove('d-none');
      }
    });
  });
}

// Click handler to trigger the dismiss of the long zonal stats
function dismissZonalClickHandler(e) {
  // ga event action, category, label
  googleAnalyticsEvent('click', `zonalstats ${store.getStateItem('activeNav')}`, 'dismiss graphs');
  shapeNavOn();

  e.preventDefault();
  setGraphsState('none', 'none');
  dismissLongZonalStats(getZonalWrapper(this));
  enableAllZonalStatsWrappers();
  const name = e.target.getAttribute('id');

  if (name) {
    const HTMLName = name.replace(' ', '_').replace('dismiss-name-', '');
    const path = document.querySelector(`.path-${HTMLName}`);
    togglePermHighLightsOff(path);
  }
  toggleALLPathsOff();
  toggleRegionCharts();
}

function displayRawValues(wrapper) {
  if (wrapper) {
    wrapper.classList.add('active-table');
    const holderElem = document.getElementById('zonal-stats-button-holder');
    if (holderElem) {
      holderElem.classList.add('active-table');
    }
  }
}

function displayGraphs(wrapper) {
  if (wrapper) {
    wrapper.classList.remove('active-table');
  }
  const holderElem = document.getElementById('zonal-stats-button-holder');
  if (holderElem) {
    holderElem.classList.remove('active-table');
  }
}

function displayZonalTableHandler(e) {
  // ga event action, category, label
  googleAnalyticsEvent('click', `zonalstats ${store.getStateItem('activeNav')}`, 'display table');

  e.preventDefault();
  setGraphsState(this.getAttribute('id'), 'table');
  displayRawValues(getZonalWrapper(this));
}


function displayZonalGraphsHandler(e) {
  // ga event action, category, label
  googleAnalyticsEvent('click', `zonalstats ${store.getStateItem('activeNav')}`, 'display graphs', 'from graphs');

  e.preventDefault();
  setGraphsState(this.getAttribute('id'), 'graph');
  displayGraphs(getZonalWrapper(this));
}


// Switches the display to the long zonal stats
// @param shortElem | DOM element
function viewLongZonalStats(shortElem) {
  if (shortElem) {
    enableMainZonalButton();
    shortElem.nextElementSibling.classList.add('active');
    setGraphsState(shortElem.nextElementSibling.getAttribute('id'), 'graph');
    document.getElementById('zonal-header').classList.add('d-none');
    shapeNavOff();
    ZonalWrapperActiveRemove();
    const HTMLName = stripUserArea(shortElem.id);
    dissmissAllZonalStatsWrappers();
    zonalStatsWrappersActive(HTMLName);
    const hasShapeButtonElem = document.getElementById('hasshape-button-holder');
    hasShapeButtonElem.classList.add('d-none');
    document.querySelector(`#dismiss-name--${HTMLName}`).addEventListener('click', dismissZonalClickHandler);
    document.querySelector(`#raw-name--${HTMLName}`).addEventListener('click', displayZonalTableHandler);
    document.querySelector(`#graph-name--${HTMLName}`).addEventListener('click', displayZonalGraphsHandler);
  }
}

// set zonal buttons and header on
function enableZonalButtons(HTMLName) {
  disableOverView();
  if (document.querySelector(`#button-name--${HTMLName}`)) {
    document.querySelector(`#button-name--${HTMLName}`).classList.remove('d-none');
    document.querySelector(`#dismiss-name--${HTMLName}`).classList.remove('d-none');
    document.querySelector(`#raw-name--${HTMLName}`).classList.remove('d-none');
    document.querySelector(`#graph-name--${HTMLName}`).classList.remove('d-none');


    document.querySelector(`#dismiss-name--${HTMLName}`).addEventListener('click', dismissZonalClickHandler);
    document.querySelector(`#raw-name--${HTMLName}`).addEventListener('click', displayZonalTableHandler);
    document.querySelector(`#graph-name--${HTMLName}`).addEventListener('click', displayZonalGraphsHandler);
    bindZonalExportHandler(HTMLName);
  }
}

function togglePermHighLightsOn(elem) {
  if (elem) {
    elem.classList.add('path-highlight-perm');
    elem.classList.remove('path-nohighlight-perm');
  }
}

// Click handler to trigger the load of the long zonal stats
function shortZonalClickHandler(e) {
  // ga event action, category, label
  googleAnalyticsEvent('click', `zonalstats ${store.getStateItem('activeNav')}`, 'display graphs', 'from details');

  e.preventDefault();
  const id = e.target.getAttribute('id');
  const HTMLName = stripUserArea(id);
  setGraphsState(this.getAttribute('id'), 'graph');
  const shortChartElem = document.getElementById(`short-chart-${HTMLName}`);
  viewLongZonalStats(shortChartElem);
  enableZonalButtons(HTMLName);
  disableOverView();

  if (HTMLName) {
    if (HTMLName.indexOf('div_class') === -1) {
      const path = document.querySelector(`.path-${HTMLName}`);
      togglePermHighLightsOn(path);
    }
  }
}

// Makes main title for an individual short zonal stats item
// @return DOM element
function makeLabel(name) {
  const zonalLabel = makeDiv();
  const HTMLName = makeHTMLName(name);
  zonalLabel.classList.add('zonal-label');
  zonalLabel.classList.add('btn');
  zonalLabel.classList.add('btn-light');
  zonalLabel.classList.add('btn-details');
  zonalLabel.classList.add('user-shape');
  zonalLabel.classList.add('col-7');
  zonalLabel.classList.add('col-sm-8');
  zonalLabel.classList.add('col-md-8');
  zonalLabel.classList.add('col-lg-8');

  zonalLabel.setAttribute('id', `label-name-${HTMLName}`);
  zonalLabel.setAttribute('title', `Get Details for ${stripUserArea(name)}`);
  zonalLabel.setAttribute('aria-label', `Get Details for ${stripUserArea(name)}`);

  zonalLabel.innerHTML = '<span class="btn-icon" id="btn-details-icon" ><i class="far fa-chart-bar"></i></span>';
  zonalLabel.appendChild(makeTextElement(makeLabelText(name)));

  if (window.screen.availWidth < 769) {
    zonalLabel.addEventListener('click', shortZonalClickHandler);
  }

  return zonalLabel;
}

// adds a generic id attribute to all the children so the hover and
// highlghts work for the dom elements and their children
function addUserAreaIdsToChildren(children, name) {
  if (!checkValidObject(children)) { return false; }
  if (children.length > 0) {
    // create children nodes array so we can map and change it
    const childrenArray = [...children];
    childrenArray.map((childItem) => {
      // add userarea name only if the node is an HTML element
      if (childItem instanceof Element) {
        childItem.setAttribute('id', `generic-${name}`);
        childItem.classList.add(`state${name}`);
      }

      // check if the child has children if so recursivly call this function again
      if (!checkValidObject(childItem.childNodes)) { return false; }
      if (childItem.childNodes.length > 0) {
        const grandChild = childItem.childNodes;
        addUserAreaIdsToChildren(grandChild, name);
      } else {
        return false;
      }
      return true;
    });
  } else {
    return false;
  }
  return true;
}

// remove one of the user shapes in the userarea object
function removeUserareaByName(name) {
  const currentshapes = store.getStateItem('userareas');
  Object.keys(currentshapes).map((key) => {
    if (currentshapes[key][0].name === name) {
      delete currentshapes[key];
    }
    return currentshapes;
  });

  store.setStoreItem('userareas', currentshapes);

  const savedshapes = store.getStateItem('savedshapes');
  Object.keys(savedshapes).map((key) => {
    if (savedshapes[key][0].name === name) {
      delete savedshapes[key];
    }
    return savedshapes;
  });

  store.setStoreItem('savedshapes', savedshapes);
}

function dispatchRemoveEnd() {
  const removeUserAreaEvent = new CustomEvent('removeuserareend');
  window.dispatchEvent(removeUserAreaEvent);
}

function returnSimpleButtonElementId(element) {
  let areaname = element.getAttribute('id');

  if (element instanceof SVGElement) {
    const parentElem = element.parentElement;
    areaname = parentElem.getAttribute('id');
    if (element instanceof SVGElement) {
      const GParent = parentElem.parentElement;
      areaname = GParent.getAttribute('id');
    }
  }
  return areaname;
}

function ZoomGeoJSON(zoomlayer, mapComponent) {
  const zoomBounds = zoomlayer.getBounds();
  if (mapComponent.map) {
    // flyToBounds is glithy
    // mapComponent.map.flyToBounds(zoomBounds.pad(0.2));
    mapComponent.map.fitBounds(zoomBounds);
  } else {
    // flyToBounds is glithy
    // mapComponent.flyToBounds(zoomBounds.pad(0.2));
    mapComponent.fitBounds(zoomBounds);
  }
}

// Makes main title for an individual short zonal stats item
// @return DOM element
function makeOverviewLabel() {
  const Overview = makeDiv();
  Overview.setAttribute('title', 'Overview');
  Overview.setAttribute('aria-label', 'Overview');
  Overview.classList.add('col-12');
  Overview.setAttribute('id', 'overview-label');
  Overview.innerHTML = '<h3>Overview</h3>';
  return Overview;
}

// get geojson for path soo we can zoom to the area
async function getExlporeGeoJson(areahml, mapComponent) {
  const area = areahml.replace('_', ' ');
  const currentshapes = store.getStateItem('userareas');
  const shape = Object.keys(currentshapes).filter((value) => {
    const val = currentshapes[value][0].name === area;
    return val;
  });

  const val = shape[0];
  const shapeObj = currentshapes[val];
  const zoomgeojson = shapeObj[2].userarea_buffered;
  const zoomlayer = L.geoJSON(zoomgeojson);
  ZoomGeoJSON(zoomlayer, mapComponent);
}

async function getHubGeoJson(areahml, mapComponent) {
  const area = areahml.replace('_', ' ');
  const HubIntersectionJson = store.getStateItem('HubIntersectionJson');
  let shape = {};
  Object.keys(HubIntersectionJson).forEach((val) => {
    if (HubIntersectionJson[val].properties.mean.TARGET_FID.toString().trim() === area) {
      shape = HubIntersectionJson[val];
    }
  });

  const zoomlayer = L.geoJSON(shape);
  ZoomGeoJSON(zoomlayer, mapComponent);
}

async function getNatureServeHubGeoJson(areahml, mapComponent) {
  const area = areahml.replace('_', ' ');
  const NatureServeHubIntersectionJson = store.getStateItem('NatureServeHubIntersectionJson');
  let shape = {};
  Object.keys(NatureServeHubIntersectionJson).forEach((val) => {
    if (NatureServeHubIntersectionJson[val].properties.mean.TARGET_FID.toString().trim() === area) {
      shape = NatureServeHubIntersectionJson[val];
    }
  });

  const zoomlayer = L.geoJSON(shape);
  ZoomGeoJSON(zoomlayer, mapComponent);
}

// Makes main title for an individual short zonal stats item
// @return DOM element
function makeZoom(name, mapComponent) {
  const Zoom = makeDiv();
  const HTMLName = makeHTMLName(name);

  Zoom.classList.add('zonal-label-zoom');
  Zoom.classList.add('btn');
  Zoom.classList.add('btn-light');
  Zoom.classList.add('btn-details');
  Zoom.classList.add('user-shape');
  Zoom.classList.add('col-1');
  Zoom.setAttribute('id', `label-name-zoom-${HTMLName}`);
  Zoom.setAttribute('title', `Zoom to ${stripUserArea(name)}`);
  Zoom.setAttribute('aria-label', `Zoom to ${stripUserArea(name)}`);

  Zoom.innerHTML = `<i class="fas fa-search-location" id="svg-name-zoom-${HTMLName}" style="z-index: -99;"></i>`;
  Zoom.addEventListener('click', (e) => {
    // ga event action, category, label
    googleAnalyticsEvent('click', `zonalstats ${store.getStateItem('activeNav')}`, 'zoom area');

    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    const areanameid = returnSimpleButtonElementId(e.target);
    let areaname = stripUserArea(areanameid);
    areaname = areaname.replace('-USERAREA-', '').replace('_', ' ');
    const activeNav = store.getStateItem('activeNav');

    if (activeNav) {
      switch (activeNav) {
        case 'main-nav-map-searchhubs':
          getHubGeoJson(areaname, mapComponent);
          break;
        case 'main-nav-map-examples':
          break;
        case 'main-nav-map-searchNShubs':
          getNatureServeHubGeoJson(areaname, mapComponent);
          break;
        case 'main-nav-map':
          getExlporeGeoJson(areaname, mapComponent);
          break;
        default:
          getExlporeGeoJson(areaname, mapComponent);
          break;
      }
    }
  });
  return Zoom;
}

// Makes main title for an individual short zonal stats item
// @return DOM element
function makeRemoveLabel(name, mapComponent) {
  const zonalLabel = makeDiv();
  const HTMLName = makeHTMLName(name);
  zonalLabel.classList.add('zonal-label-remove');
  zonalLabel.classList.add('btn');
  zonalLabel.classList.add('btn-light');
  zonalLabel.classList.add('btn-details');
  zonalLabel.classList.add('user-shape');
  zonalLabel.classList.add('text-danger');
  zonalLabel.classList.add('col-1');
  zonalLabel.setAttribute('id', `label-name-remove-${HTMLName}`);
  zonalLabel.setAttribute('title', `Remove ${stripUserArea(name)} from list`);
  zonalLabel.setAttribute('aria-label', `Remove ${stripUserArea(name)} from list`);

  zonalLabel.innerHTML = `<i class="far fa-trash-alt" id="svg-name-remove-${HTMLName}" style="z-index: -99;"></i>`;
  zonalLabel.addEventListener('click', (e) => {
    // ga event action, category, label
    googleAnalyticsEvent('click', `zonalstats ${store.getStateItem('activeNav')}`, 'remove area');

    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    const areanameid = returnSimpleButtonElementId(e.target);
    let areaname = stripUserArea(areanameid);
    const removeElemName = `zonal-stats-wrapper-${areaname}`;
    const removeElem = document.getElementById(removeElemName);
    removeElem.parentNode.removeChild(removeElem);
    areaname = areaname.replace('-USERAREA-', '').replace('_', ' ');
    removeUserareaByName(areaname);

    // dispatch a event to window so we can redraw the map layers
    // and redraw the zonal stat area
    dispatchRemoveEnd();
  });

  return zonalLabel;
}

// Creates all of the interior html for the short zonal stats
// @param data | Object
// @return Array
function makeShortZonalStatsInterior(data, name) {
  return [
    makeLabel(name)
  ];
}

// checks if inner HTML of element is Plain old Text
// instead of another HTML element
function innerHTMLisText(innerHTML) {
  if (typeof innerHTML === 'string') {
    if (innerHTML.indexOf('div') === -1) {
      return true;
    }
  }
  return false;
}

function toggleMouseHighLightsOn(elem) {
  if (elem) {
    elem.classList.add('path-highlight');
    elem.classList.remove('path-nohighlight');
  }
}

function toggleMouseHighLightsOff(elem) {
  if (elem) {
    elem.classList.remove('path-highlight');
    elem.classList.add('path-nohighlight');
  }
}

function togglePermHighLightsAllOff(elem) {
  if (elem) {
    elem.classList.remove('path-highlight-perm');
    elem.classList.remove('path-nohighlight-perm');
  }
}

function toggleAllLongZonalsOff(elem) {
  const zonalLongWrapper = document.querySelectorAll('.zonal-long-wrapper');

  zonalLongWrapper.forEach((zonal) => {
    zonal.classList.remove('active');
  });
}

function toggleLabelHighLightsOff(elem) {
  if (elem) {
    elem.classList.remove('label-name-highlight');
    elem.classList.add('label-name-nohighlight');
  }
}

function toggleLabelHighLightsOn(elem) {
  if (elem) {
    elem.classList.add('label-name-highlight');
    elem.classList.remove('label-name-nohighlight');
  }
}

function hideLastLongStats() {
  const graphstate = store.getStateItem('zonalactive');
  // remove any prevous long chart
  if (checkValidObject(graphstate)) {
    const elemid = graphstate[0];
    const activestate = graphstate[1];
    if (activestate === 'graph' || activestate === 'table') {
      const lastactive = document.getElementById(elemid);
      if (lastactive) {
        lastactive.classList.remove('active');
      }
    }
  }
}

function hideLastHighlight() {
  const graphstate = store.getStateItem('zonalactive');
  // remove any prevous long chart
  if (checkValidObject(graphstate)) {
    const elemid = graphstate[0];

    const lastpathid = elemid.replace('name--USERAREA-', 'path--USERAREA-');
    const lastpathelem = document.querySelector(`.${lastpathid}`);

    togglePermHighLightsOff(lastpathelem);
    toggleMouseHighLightsOff(lastpathelem);
  }
}

function viewLongZonalStatsFromShape(name) {
  // ga event action, category, label
  googleAnalyticsEvent('click', `zonalstats ${store.getStateItem('activeNav')}`, 'display graphs', 'from shape');

  hideLastLongStats();
  hideLastHighlight();

  document.getElementById('zonal-header').classList.add('d-none');
  ZonalWrapperActiveRemove();
  disableAllZonalButtons();
  enableZonalButtons(`-USERAREA-${name}`);
  disableOverView();
  enableMainZonalButton();
  dissmissAllZonalStatsWrappers();
  zonalStatsWrappersActive(`-USERAREA-${name}`);

  const hasShapeButtonElem = document.getElementById('hasshape-button-holder');
  hasShapeButtonElem.classList.add('d-none');

  const pathid = `path--USERAREA-${name}`;
  if (pathid) {
    const pathelem = document.querySelector(`.${pathid}`);
    togglePermHighLightsOn(pathelem);
  }

  const idname = `name--USERAREA-${name}`;
  if (idname) {
    document.getElementById(idname).classList.add('active');
    setGraphsState(idname, 'graph');
  }
}

function zonalLabelMouseOverHandler(e) {
  e.stopImmediatePropagation();
  e.stopPropagation();
  e.preventDefault();
  const id = e.target.getAttribute('id');
  const HTMLName = stripUserArea(id);
  if (innerHTMLisText(HTMLName)) {
    const path = document.querySelector(`.path-${HTMLName}`);
    togglePermHighLightsAllOff(path);
    toggleMouseHighLightsOn(path);
  }
}

function zonalLabelMouseOutHandler(e) {
  e.stopImmediatePropagation();
  e.stopPropagation();
  e.preventDefault();
  const id = e.target.getAttribute('id');
  const HTMLName = stripUserArea(id);

  if (innerHTMLisText(HTMLName)) {
    const path = document.querySelector(`.path-${HTMLName}`);
    toggleMouseHighLightsOff(path);

    const labelName = `label-name-${HTMLName}`;
    const labelElem = document.getElementById(labelName);
    toggleLabelHighLightsOff(labelElem);

    const labelzName = `zonal-wrapper-${HTMLName}`;
    const labelzElem = document.getElementById(labelzName);
    toggleLabelHighLightsOff(labelzElem);

    const shotChartsLabels = `short-chart-${HTMLName}`;
    const shotChartsLabelsElem = document.getElementById(shotChartsLabels);
    toggleLabelHighLightsOff(shotChartsLabelsElem);
  }
}

// Builds the inner HTML for the long zonal stats
// @param DOM Element | wrapper
function buildLongStatsHtml(wrapper) {
  // lint complains otherwise, but due to chaining of functions it's mistaken
  const innerWrapper = wrapper;
  // const region = store.getStateItem('region');
  innerWrapper.innerHTML = ZonalLong;
  const inputData = TMSLayers.filter(layer => layer.chartSummary);

  // iterate the layer props to assing apporaite thml
  inputData.forEach((layerProps) => {
    const layerElem = wrapper.querySelector(`.zonal-long-${layerProps.chartCSSSelector}-wrapper .zonal-long-table-wrapper`);

    if (layerElem) {
      const legendHTML = getLegendHtml(layerProps.chartLegendValues);
      layerElem.innerHTML = legendHTML;

      // get the color palette for layer, each layer can have its own
      const colorPalette = layerProps.chartCSSColor;

      // iterate the color palette for layer so we can assing apporaite css color to element
      Object.keys(colorPalette).forEach((color) => {
        // convert the color number to number word 2 - two
        // this is how html elments are named.
        const colorlueWord = numberToWord(Number(color));
        // get the element based on the color word
        const valueELem = layerElem.querySelector(`.value-${colorlueWord}`);

        // if the element exists add css color values
        if (valueELem) {
          // set background based on mapconfig values
          valueELem.style.background = colorPalette[color];

          // set font color
          valueELem.style.color = '#000';

          // // last color tends to be to dark for dark font
          // if (parseInt(color) >= layerProps.chartLegendValues ) {
          //   valueELem.style.color = '#fff';
          // }
          // add classes for region, chartCSSSelector, and source in case we want to find it later
          valueELem.classList.add(layerProps.chartCSSSelector);
          valueELem.classList.add(layerProps.region);
          valueELem.classList.add(layerProps.source);
        }
      });
    }
  });
}

// event function to draw mapinfp (identify) stats
function drawMapInfoStatsHandler() {
  // get chart data for summary data
  const activeNav = store.getStateItem('activeNav');
  let chartName = 'mapinfo_nfwf';
  let region = store.getStateItem('region');
  let mapinfochartdata = store.getStateItem('mapinfochartdata');

  // natureserve data in differ state key
  if (activeNav === 'main-nav-map-searchNShubs') {
    chartName = 'mapinfo_ns';
    region = 'targetedwatershed';
    mapinfochartdata = store.getStateItem('mapinfonschartdata');
  }

  // filter chart data
  const chartdata = mapinfochartdata.filter(data => data.name === chartName && data.groupname === 'summary' && data.region === region);
  const chartSelector = '.leaflet-popup #mapInfo-chart.summary-chart';

  // leaflet popup takes a second to render, chartjs needs to be rendered
  // to draw on the canvas and resize so timeout needed
  setTimeout(() => makeBasicBarChart(document, chartSelector, chartdata), 50);
  hardSpinnerOff();
  return null;
}

// draw the mapinfo chart. This is the indentify click function
function drawMapInfoStats() {
  // add listener for leaflets open popup
  window.addEventListener('mapinfo-data-ready', drawMapInfoStatsHandler);

  // reform identify data into chartjs data
  formatMapInfoChartData();
}

// Creates the entire short zonal stats block of html
// @param data | Object
// @return DOM element
function drawShortZonalStats(data, name, mapComponent, region) {
  const wrapper = makeDiv();
  const activeNav = store.getStateItem('activeNav');

  wrapper.classList.add('zonal-short-wrapper');
  wrapper.classList.add('w-100');
  wrapper.classList.add('active');
  wrapper.classList.add('row');
  wrapper.classList.add('justify-content-center');

  const HTMLName = makeHTMLName(name);
  wrapper.setAttribute('id', `short-chart-${HTMLName}`);

  wrapper.innerHTML = ZonalShort;

  const shortChart = wrapper.querySelector('.zonal-short-wrappper');
  addUserAreaIdsToChildren(shortChart.childNodes, HTMLName);

  makeShortZonalStatsInterior(data, name).forEach((elem) => {
    wrapper.insertBefore(elem, wrapper.childNodes[0]);
  });

  // get chart data for summary data
  const chartName = stripUserArea(name);
  const configchartdata = store.getStateItem('configchartdata');
  const chartdata = configchartdata.filter(configdata => configdata.name === chartName && configdata.groupname === 'summary' && configdata.region === region);
  const chartSelector = `.summary-chart.state${HTMLName}`;
  makeBasicBarChart(wrapper, chartSelector, chartdata);

  if (window.screen.availWidth > 769) {
    wrapper.addEventListener('click', shortZonalClickHandler);
  }

  wrapper.addEventListener('mouseover', zonalLabelMouseOverHandler);
  wrapper.addEventListener('mouseout', zonalLabelMouseOutHandler);

  shortChart.addEventListener('mouseout', zonalLabelMouseOutHandler);
  shortChart.addEventListener('mouseover', zonalLabelMouseOverHandler);

  switch (activeNav) {
    case 'main-nav-map-searchhubs':
      break;
    case 'main-nav-map-examples':
      break;
    case 'main-nav-map-searchNShubs':
      break;
    case 'main-nav-map': {
      // detete the area button
      const rem = makeRemoveLabel(name, mapComponent);
      wrapper.insertBefore(rem, wrapper.childNodes[1]);
      break;
    }
    default: {
      // detete the area button
      const rem = makeRemoveLabel(name, mapComponent);
      wrapper.insertBefore(rem, wrapper.childNodes[1]);
      break;
    }
  }

  // zoom to the area button
  const zoom = makeZoom(name, mapComponent);
  wrapper.insertBefore(zoom, wrapper.childNodes[1]);

  const defaultLongGraphs = wrapper.querySelector('.default-long-graphs');
  defaultLongGraphs.classList.remove('d-none');

  const ovr = makeOverviewLabel();
  const buttonHolder = document.getElementById('zonal-stats-short-title-holder');
  buttonHolder.innerHTML = ovr.innerHTML;
  buttonHolder.classList.remove('d-none');
  disableMainZonalButton();
  return wrapper;
}

function formatToThreePlaces(value) {
  return (Math.round(value * 1000) / 1000).toString();
}

function formatRawValue(value) {
  return checkNoData(value) ? 'No data' : formatToThreePlaces(value);
}

// renders data in a table format
// only renders data that is available for the region it is from.
function drawRawValue(wrapper, value) {
  const tr = document.createElement('tr');

  const th = document.createElement('th');
  const label = document.createTextNode(value.label);
  th.appendChild(label);

  const tdvalue = document.createElement('td');
  const dataValue = document.createTextNode(formatRawValue(value.value));
  tdvalue.appendChild(dataValue);

  const tdrange = document.createElement('td');
  const range = document.createTextNode(value.range);
  tdrange.appendChild(range);

  tr.appendChild(th);
  tr.appendChild(tdvalue);
  tr.appendChild(tdrange);

  wrapper.querySelector('.table-rawdata .body-rawdata').appendChild(tr);
}

function populateRawTableRow(wrapper, value) {
  drawRawValue(wrapper, value);
}

function drawRawValues(wrapper, data) {
  data.forEach(populateRawTableRow.bind(null, wrapper));
}

function drawName(wrapper, name) {
  wrapper.querySelector('#zonal-long-name').textContent = name;
}

// creates zonal buttons in sticky header.
function drawZonalButtons(HTMLName, name) {
  const buttonHolder = document.getElementById('zonal-stats-button-holder');
  const wrapper = makeDiv();
  wrapper.innerHTML = ZonalButtons;
  drawName(wrapper, name);
  wrapper.querySelector('.zonal-long-button-wrapper').setAttribute('id', `button-name--${HTMLName}`);
  wrapper.querySelector('.zonal-long-buttons-holder').setAttribute('id', `button-holder-name--${HTMLName}`);
  wrapper.querySelector('.zonal-long-button-graphs').setAttribute('id', `graph-name--${HTMLName}`);
  wrapper.querySelector('.zonal-long-button-download').setAttribute('id', `download-name--${HTMLName}`);
  wrapper.querySelector('.zonal-long-button-raw').setAttribute('id', `raw-name--${HTMLName}`);
  wrapper.querySelector('.zonal-long-button-dismiss').setAttribute('id', `dismiss-name--${HTMLName}`);
  wrapper.querySelector('#zonal-long-name').setAttribute('id', `zonal-long-name--${HTMLName}`);

  buttonHolder.innerHTML += wrapper.innerHTML;
}

// take map config data and api data and maps to
// the driver charts in the details, then dynamically uses the
// chartInputName key from the mapconfig.js to create driver charts
function makeDetailDriverCharts(wrapper, data, region, chartName) {
  const layerRegionInfo = TMSLayers.filter(layers => layers.region === region);
  const layerInfo = layerRegionInfo.filter(layer => layer.chartDriver);
  const driverGroups = groupByDriver(layerInfo, 'chartInputName');

  // iterate each group i.e. FishAndWildlife, assets, threats
  driverGroups.forEach((driver) => {
    const driverGroupName = driver[0].chartInputName;
    const driverGroupLabel = driver[0].chartInpuLabel;

    // filter data fro the group
    const configchartdata = store.getStateItem('configchartdata');
    const chartdata = configchartdata.filter(configdata => configdata.name === chartName &&
      configdata.groupname === driverGroupName &&
      configdata.region === region);

    // make new html elements
    const HTMLName = makeHTMLName(chartName);
    const driverHolder = wrapper.querySelector(`#name-${HTMLName} #driver-charts-holder`);


    // make title div to hold chart title
    const NewTitleDiv = makeDiv();
    NewTitleDiv.setAttribute('id', `driver-title-${driverGroupName}`);
    NewTitleDiv.innerHTML = `${driverGroupLabel}`;
    NewTitleDiv.classList.add('text-center');
    NewTitleDiv.classList.add('text-capitalize');
    NewTitleDiv.classList.add('font-weight-bold');
    NewTitleDiv.classList.add('pt-3');

    // make canvas div to hold chart
    const NewChartCanvasDiv = makeDiv();
    NewChartCanvasDiv.setAttribute('id', `driver-${driverGroupName}`);
    NewChartCanvasDiv.classList.add('chartjs-wrapper');
    NewChartCanvasDiv.innerHTML = `<canvas id="" class="d-flex details-chart group-${driverGroupName}"></canvas>`;

    // ensire the the html element that holds the driver charts exists
    if (driverHolder) {
      driverHolder.appendChild(NewTitleDiv);
      driverHolder.appendChild(NewChartCanvasDiv);
    }

    // make the driver charts
    const chartSelector = `#name-${HTMLName} #driver-charts-holder .details-chart.group-${driverGroupName}`;
    makeBasicBarChart(driverHolder, chartSelector, chartdata);
  });
}

function getDataForTables(data, argRegion) {
  // filter the region layer list so we can get map configation values for all
  // regions layers
  let region = argRegion;
  const layerRegionInfo = TMSLayers.filter(layers => layers.region === region);
  const activeNav = store.getStateItem('activeNav');
  if (activeNav === 'main-nav-map-searchNShubs') {
    region = 'targetedwatershed';
  }
  // if layerRegionInfo empty array then exit nothing matches.
  if (layerRegionInfo.length === 0) {
    return null;
  }

  // iterate over returned data and values and map it into a object array
  // that only contains summary data or input data not driver data
  const dataForTables = [];
  Object.keys(data).forEach((key) => {
    // check of data matches a driver
    let layerInfoHasKey = layerRegionInfo.filter(layer => layer.apikey === key);

    // filter the regions layers to the specifc layer so we can get map configation values
    if (activeNav === 'main-nav-map-searchhubs' || activeNav === 'main-nav-map-searchNShubs') {
      layerInfoHasKey = layerRegionInfo.filter(layer => layer.hubsapikey === key);
    }

    // check of data matches a driver and add it to a new object araray that is key, value
    if (layerInfoHasKey.length > 0) {
      dataForTables.push({
        key,
        value: data[key],
        cssselector: layerInfoHasKey[0].chartCSSSelector,
        label: layerInfoHasKey[0].label,
        range: `${layerInfoHasKey[0].chartMinValue} to ${layerInfoHasKey[0].chartMaxValue - 1}`,
        source: layerInfoHasKey[0].source
      });
    }
  });
  return dataForTables;
}

// Draws and configures the long zonal stats
// @param data | Object - results of API
// @return DOM element
function drawLongZonalStats(data, name, region) {
  const HTMLName = makeHTMLName(name);
  const wrapper = makeDiv();

  wrapper.classList.add('zonal-long-wrapper');
  wrapper.setAttribute('id', `name-${HTMLName}`);
  buildLongStatsHtml(wrapper);
  drawName(wrapper, name);
  drawZonalButtons(HTMLName, name);

  const dataForTable = getDataForTables(data, region);
  drawRawValues(wrapper, dataForTable);

  // get chart data for summary data
  const chartName = stripUserArea(name);
  const configchartdata = store.getStateItem('configchartdata');
  const chartdata = configchartdata.filter(configdata => configdata.name === chartName && configdata.groupname === 'summary' && configdata.region === region);
  const chartSelector = `#name-${HTMLName} .summary-chart-details`;
  makeBasicBarChart(wrapper, chartSelector, chartdata);

  // make drivers charts will create drivers based on mapconfig
  makeDetailDriverCharts(wrapper, data, region, chartName);
  return wrapper;
}

// check if graph or table is the active state is so we can disable the
// mouse off event on the shape.  This prevents the map from removeing the
// highlighted shape.
function isGraphActivetate() {
  const graphstate = store.getStateItem('zonalactive');
  if (checkValidObject(graphstate)) {
    const activestate = graphstate[1];
    if (activestate === 'graph' || activestate === 'table') return true;
  }
  return false;
}

function restoreGraphState() {
  const graphstate = store.getStateItem('zonalactive');
  if (checkValidObject(graphstate)) {
    const elemid = graphstate[0];
    const activestate = graphstate[1];
    const elem = document.getElementById(elemid.replace('name-', 'name'));
    const path = document.querySelector(`.path${elemid.replace('name-', '')}`);
    const HTMLName = stripUserArea(elemid);

    switch (activestate) {
      case 'graph':
        displayGraphs(elem);
        if (elem) {
          shapeNavOff();
          elem.classList.add('active');
          document.getElementById('zonal-header').classList.add('d-none');
          togglePermHighLightsOn(path);
          ZonalWrapperActiveRemove();
          enableZonalButtons(HTMLName);
          enableMainZonalButton();
          dissmissAllZonalStatsWrappers();
          zonalStatsWrappersActive(HTMLName);
          store.setStoreItem('zonalactive', [elemid, activestate]);
          disableOverView();
          const hasShapeButtonElem = document.getElementById('hasshape-button-holder');
          hasShapeButtonElem.classList.add('d-none');
        }

        break;
      case 'table':
        if (elem) {
          shapeNavOff();
          elem.classList.add('active');
          elem.classList.add('active-table');
          document.getElementById('zonal-header').classList.add('d-none');
          displayRawValues(elem);
          togglePermHighLightsOn(path);
          ZonalWrapperActiveRemove();
          enableZonalButtons(HTMLName);
          enableMainZonalButton();
          dissmissAllZonalStatsWrappers();
          zonalStatsWrappersActive(HTMLName);
          store.setStoreItem('zonalactive', [elemid, activestate]);
          disableOverView();
          const hasShapeButtonElem = document.getElementById('hasshape-button-holder');
          hasShapeButtonElem.classList.add('d-none');
        }
        break;
      default:
        return null;
    }
  }
  return null;
}

// Draws and configures the entire zonal stats
// @param data | Object - results of API
function drawZonalStatsFromAPI(data, name, mapComponent, region = 'continental_us') {
  const HTMLName = makeHTMLName(name);

  if (!document.getElementById('zonal-header')) {
    document.getElementById('zonal-area-wrapper').innerHTML = ZonalWrapper;
  }
  const wrapper = makeDiv();
  wrapper.classList.add('zonal-stats-wrapper');
  wrapper.classList.add('h-100');
  wrapper.classList.add(`region-${region}`);
  wrapper.setAttribute('id', `zonal-stats-wrapper-${HTMLName}`);
  wrapper.appendChild(drawShortZonalStats(data, name, mapComponent, region));
  wrapper.appendChild(drawLongZonalStats(data, name, region));
  document.getElementById('zonal-content').appendChild(wrapper);

  // initalize new tooltips
  $(() => {
    $('#zonal-content [data-toggle="tooltip"]').tooltip({ trigger: 'hover focus' });
  });

  const iconelem = document.getElementById('btn-details-icon');
  iconelem.addEventListener('mouseover', zonalLabelMouseOverHandler);
  iconelem.addEventListener('mouseout', zonalLabelMouseOutHandler);
  disableMainZonalButton();

  toggleRegionCharts();
  restoreGraphState();
}

export {
  drawZonalStatsFromAPI,
  restoreGraphState,
  toggleMouseHighLightsOn,
  toggleLabelHighLightsOn,
  toggleMouseHighLightsOff,
  toggleLabelHighLightsOff,
  togglePermHighLightsAllOff,
  makeHTMLName,
  stripUserArea,
  isGraphActivetate,
  viewLongZonalStatsFromShape,
  drawMapInfoStats,
  enableOverView,
  disableOverView,
  enableZonalButtons,
  disableZonalButtons,
  toggleALLPathsOff,
  toggleAllLongZonalsOff
};

// change region is state changes
window.addEventListener('regionChanged', (e) => {
  toggleRegionCharts();
});
