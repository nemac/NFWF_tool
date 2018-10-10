import ZonalWrapper from '../templates/zonal_wrapper.html';
import ZonalLong from '../templates/zonal_long.html';
import ZonalShort from '../templates/zonal_short.html';

import { identifyConfig } from '../config/identifyConfig';
import { Store } from './store';
import { checkValidObject } from './utilitys';

const store = new Store({});

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

// // Creates a text node which is only seen by screen readers
// // @param text | string
// // @return DOM element
// function makeScreenReaderText(text) {
//   const elem = document.createElement('span');
//   elem.classList.add('hidden');
//   elem.appendChild(makeTextElement(text));
//   return elem;
// }

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

// Makes wrapper for short zonal stats
// @return DOM element
function makeZonalWrapper(name) {
  const zonalWrap = makeDiv();
  zonalWrap.classList.add('zonal-wrapper');
  zonalWrap.classList.add('active');
  const HTMLName = makeHTMLName(name);
  zonalWrap.setAttribute('id', `zonal-wrapper-${HTMLName}`);

  return zonalWrap;
}

// Makes wrapper for individual short zonal item
// @return DOM element
function makeBoxWrapper() {
  const boxWrap = makeDiv();
  boxWrap.classList.add('zonal-item');
  return boxWrap;
}

// Gets text for an individual short zonal stats item title
// @return String
function makeLabelText(name) {
  return `${name}`;
  // return `${name} ${document.getElementsByClassName('zonal-wrapper').length + 1}`;
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
  zonalLabel.classList.add('col-2');
  zonalLabel.setAttribute('id', `label-name-${HTMLName}`);
  zonalLabel.setAttribute('title', `View details for ${stripUserArea(name)}`);
  zonalLabel.setAttribute('aria-label', `View details for ${stripUserArea(name)}`);

  zonalLabel.innerHTML = '<span class="btn-icon" id="btn-details-icon" ><i class="far fa-chart-bar"></i></span>';
  // zonalLabel.setAttribute('id', 'zonal-label');
  zonalLabel.appendChild(makeTextElement(makeLabelText(name)));
  return zonalLabel;
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

// Parses the configuration of identify values and gets the requested configuration object
// @param type | String - matches the layer key
// @param rank | String || Number - rounded and matches the value key
// @return Object
function getIdentifyValue(type, rank) {
  const identifyData = identifyConfig.colorLookup;
  const trueRank = Math.round(typeof rank !== 'number' ? parseFloat(rank) : rank);
  let item;
  let i;
  let l;

  for (i = 0, l = identifyData.length; i < l; i += 1) {
    item = identifyData[i];
    if (item.layer === type && item.value === trueRank) {
      break;
    }
  }

  return item;
}

// Makes short zonal stats item
// @param type | String - matches the layer key
// @param rank | String || Number - rounded and matches the value key
// @return DOM element
function makeZonalBox(type, rank, name) {
  const HTMLName = makeHTMLName(name);
  const zonalBox = makeDiv();
  const zonalData = getIdentifyValue(type, rank);
  zonalBox.classList.add(`zonal-${type}`);
  zonalBox.classList.add('zonal-box');
  zonalBox.classList.add('noselect');
  zonalBox.setAttribute('data-ranking', rank);
  zonalBox.setAttribute('id', `zonal-box-${type}-${HTMLName}`);
  zonalBox.style.color = zonalData.color;
  zonalBox.style.backgroundColor = zonalData.backgroundColor;
  zonalBox.appendChild(makeTextElement(zonalData.label));
  return zonalBox;
}

// Makes html for the hub based short zonal stats block
// @param rank | String || Number
// @return DOM element
function makeInHubBox(rank, name) {
  return makeZonalBox('hubs', rank, name);
}

// Makes html for the asset based short zonal stats block
// @param rank | String || Number
// @return DOM element
function makeAssetBox(rank, name) {
  return makeZonalBox('asset', rank, name);
}

// Makes html for the threat based short zonal stats block
// @param rank | String || Number
// @return DOM element
function makeThreatBox(rank, name) {
  return makeZonalBox('threat', rank, name);
}

// Makes html for the terrestrial based short zonal stats block
// @param rank | String || Number
// @return DOM element
function makeTerrestrialBox(rank, name) {
  return makeZonalBox('terrestrial', rank, name);
}

// Makes html for the aquatic based short zonal stats block
// @param rank | String || Number
// @return DOM element
function makeAquaticBox(rank, name) {
  return makeZonalBox('aquatic', rank, name);
}

// Creates wrapper for hub and the content in it
// @param hubs | String || Number
// @return DOM element
function makeHubBox(hubs, name) {
  const HTMLName = makeHTMLName(name);
  const hubWrapper = makeBoxWrapper();
  hubWrapper.classList.add('zonal-item-hub');
  hubWrapper.setAttribute('id', `hub-${HTMLName}`);
  hubWrapper.appendChild(makeInHubBox(checkNoData(hubs) ? 255 : hubs, name));
  return hubWrapper;
}

// Creates wrapper for the aquatic and terrestrial section and the content in it
// @param wildlife | String || Number
// @param fish | String || Number
// @return DOM element
function makeFishWildBox(wildlife, fish, name) {
  const fishWildWrapper = makeBoxWrapper();
  fishWildWrapper.classList.add('zonal-item-fishwild');
  fishWildWrapper.appendChild(makeAquaticBox(fish, name));
  fishWildWrapper.appendChild(makeTerrestrialBox(wildlife, name));
  return fishWildWrapper;
}

// Creates wrapper for the exposure section and the content in it
// @param asset | String || Number
// @param threat | String || Number
// @return DOM element
function makeExposureBox(asset, threat, name) {
  const exposureWrapper = makeBoxWrapper();
  exposureWrapper.classList.add('zonal-item-exposure');
  exposureWrapper.appendChild(makeAssetBox(asset, name));
  exposureWrapper.appendChild(makeThreatBox(threat, name));
  return exposureWrapper;
}

// Creates all of the interior html for the short zonal stats
// @param data | Object
// @return Array
function makeShortZonalStatsInterior(data, name) {
  return [
    makeLabel(name),
    // makeHubBox(data.hubs, name),
    // makeFishWildBox(data.terrestrial, data.aquatic, name),
    // makeExposureBox(data.asset, data.threat, name)
  ];
}

function ZonalWrapperActiveRemove() {
  const x = document.querySelectorAll('.zonal-short-wrapper');
  let i;
  for (i = 0; i < x.length; i += 1) {
    x[i].classList.remove('active');
  }
}

function ZonalWrapperActiveAdd() {
  const x = document.querySelectorAll('.zonal-short-wrapper');
  let i;
  for (i = 0; i < x.length; i += 1) {
    x[i].classList.add('active');
  }
}

function setGraphsState(name, activetype) {
  let newname = name;
  const striptext = ['raw-name', 'graph-name', 'dismiss-name'];

  striptext.map((replacetext) => {
    if (name.indexOf(replacetext) >= 0) {
      newname = name.replace(replacetext, 'name');
      return newname;
    }
    return newname;
  });

  store.setStoreItem('zonalactive', [newname, activetype]);
  return newname;
}

// Switches the display to the long zonal stats
// @param shortElem | DOM element
function viewLongZonalStats(shortElem) {
  shortElem.nextElementSibling.classList.add('active');
  setGraphsState(shortElem.nextElementSibling.getAttribute('id'), 'graph');
  document.getElementById('zonal-header').classList.add('d-none');
  ZonalWrapperActiveRemove();
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

function togglePermHighLightsOff(elem) {
  if (elem) {
    elem.classList.remove('path-highlight-perm');
    elem.classList.add('path-nohighlight-perm');
  }
}

function togglePermHighLightsOn(elem) {
  if (elem) {
    elem.classList.add('path-highlight-perm');
    elem.classList.remove('path-nohighlight-perm');
  }
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
  hideLastLongStats();
  hideLastHighlight();

  document.getElementById('zonal-header').classList.add('d-none');
  ZonalWrapperActiveRemove();

  const pathid = `path--USERAREA-${name}`;
  const pathelem = document.querySelector(`.${pathid}`);
  togglePermHighLightsOn(pathelem);

  const idname = `name--USERAREA-${name}`;
  document.getElementById(idname).classList.add('active');
  setGraphsState(idname, 'graph');
}

// Click handler to trigger the load of the long zonal stats
function shortZonalClickHandler(e) {
  e.preventDefault();
  viewLongZonalStats(this);

  const id = e.target.getAttribute('id');
  const HTMLName = stripUserArea(id);
  if (HTMLName) {
    if (HTMLName.indexOf('div_class') === -1) {
      const path = document.querySelector(`.path-${HTMLName}`);
      togglePermHighLightsOn(path);
    }
  }
}

function zonalLabelMouseOverHandler(e) {
  const id = e.target.getAttribute('id');
  const HTMLName = stripUserArea(id);

  if (innerHTMLisText(HTMLName)) {
    const path = document.querySelector(`.path-${HTMLName}`);
    togglePermHighLightsAllOff(path);
    toggleMouseHighLightsOn(path);

    const labelName = `label-name-${HTMLName}`;
    const labelElem = document.getElementById(labelName);
    toggleLabelHighLightsOn(labelElem);

    const labelzName = `zonal-wrapper-${HTMLName}`;
    const labelzElem = document.getElementById(labelzName);
    toggleLabelHighLightsOn(labelzElem);
  }
}

function zonalLabelMouseOutHandler(e) {
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
  }
}

// Creates the entire short zonal stats block of html
// @param data | Object
// @return DOM element
function drawShortZonalStats(data, name, mapComponent) {
  // const wrapper = makeZonalWrapper(name);

  const wrapper = makeDiv();
  wrapper.classList.add('zonal-short-wrapper');
  wrapper.classList.add('row');
  wrapper.setAttribute('id', `name-`);

  wrapper.innerHTML = ZonalShort;

  makeShortZonalStatsInterior(data, name).forEach((elem) => {
    wrapper.insertBefore(elem, wrapper.childNodes[0]);
  });



  drawShortChart(wrapper, getShortDataChartData(data));


  wrapper.addEventListener('click', shortZonalClickHandler);
  wrapper.addEventListener('mouseover', zonalLabelMouseOverHandler);
  wrapper.addEventListener('mouseout', zonalLabelMouseOutHandler);
  const rem = makeRemoveLabel(name, mapComponent);
  wrapper.insertBefore(rem, wrapper.childNodes[0]);
  return wrapper;
}

// This function finds the scaled position of a value from [0,100]
// It does the addition of scale and division by scaleGroups since the value falls into one of
// multiple ranges and so it needs to put the scaled value into the correct area.
//
// @param val - float
// @param rangeMin - int
// @param rangeMax - int
// @param scale - int. [0,scaleGroups - 1]
// @param scaleGroups - int. Number of groups the value could be scaled for. [1,]
function getValuePosition(val, rangeMin, rangeMax, scale, scaleGroups) {
  let position = (val - rangeMin) / (rangeMax - rangeMin); // [0,1]
  position += scale; // [0,scaleGroups]
  position = (position / scaleGroups) * 100; // [0, 100]
  if (position === 100) {
    position = 99;
  }
  return position;
}

// Finds the scaled position for assets and threats
// @param val | float - value from the api for the asset or threat
// @param low | float - upper limit of the smallest quartile
// @param med | float - upper limit of the middle quartile
// @param high | float - upper limit of the largest quartile
// @return float - [0,100]
function getExposurePosition(val, low, med, high) {
  const BOTTOM_RANGE = 0;
  const LOW_SCALE = 0;
  const MED_SCALE = 1;
  const HIGH_SCALE = 2;
  const SCALE_GROUPS = 3;

  if (val < low) {
    return getValuePosition(val, BOTTOM_RANGE, low, LOW_SCALE, SCALE_GROUPS);
  }

  if (val < med) {
    return getValuePosition(val, low, med, MED_SCALE, SCALE_GROUPS);
  }

  return getValuePosition(val, med, high, HIGH_SCALE, SCALE_GROUPS);
}

// Finds the scaled position for the asset
// @param asset | float - value from the api for the asset
// @return float - [0,100]
function getAssetPosition(asset) {
  const LOW_ASSET = 1.5;
  const MED_ASSET = 2.5;
  const HIGH_ASSET = 13;

  return getExposurePosition(asset, LOW_ASSET, MED_ASSET, HIGH_ASSET);
}

// Finds the scaled position for the threats
// @param threat | float - value from the api for the threat
// @return float - [0,100]
function getThreatPosition(threat) {
  const LOW_THREAT = 7.5;
  const MED_THREAT = 11.5;
  const HIGH_THREAT = 29;

  return getExposurePosition(threat, LOW_THREAT, MED_THREAT, HIGH_THREAT);
}

// Finds the scaled position for the aquatic parameter
// @param fish | float - value from the api for aquatic
// @return float - [0,100]
function getFishPosition(fish) {
  const LOW_RANGE = 1;
  const HIGH_RANGE = 5;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(fish, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

// Finds the scaled position for the terrestrial parameter
// @param wildlife | float - value from the api for terrestrial
// @return float - [0,100]
function getWildlifePosition(wildlife) {
  const LOW_RANGE = 1;
  const HIGH_RANGE = 5;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(wildlife, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

// Finds the scaled position for the hubs
// @param hub | float - value from the api for hubs
// @return float - [0,100]
function getHubPosition(hub) {
  const LOW_RANGE = 1;
  const HIGH_RANGE = 7;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(hub, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

// Finds the scaled position for the drivers
// @param driver | float - value from the api for a driver
// @return float - [0,100]
function getDriverHeight(driver) {
  const LOW_RANGE = 0;
  const HIGH_RANGE = 5;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(driver, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}


// Finds the scaled position for the drivers
// @param driver | float - value from the api for a driver
// @return float - [0,100]
function getSevenHeight(driver) {
  const LOW_RANGE = 0;
  const HIGH_RANGE = 7;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(driver, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

// Finds the scaled position for the drivers
// @param driver | float - value from the api for a driver
// @return float - [0,100]
function getNineHeight(driver) {
  const LOW_RANGE = 0;
  const HIGH_RANGE = 9;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(driver, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

// Finds the scaled position for the drivers
// @param driver | float - value from the api for a driver
// @return float - [0,100]
function getThreatHeight(driver) {
  const LOW_RANGE = 0;
  const HIGH_RANGE = 33;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(driver, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

// Finds the scaled position for the drivers
// @param driver | float - value from the api for a driver
// @return float - [0,100]
function getAssetHeight(driver) {
  const LOW_RANGE = 0;
  const HIGH_RANGE = 13;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(driver, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}


// Finds the scaled position for the drivers
// @param driver | float - value from the api for a driver
// @return float - [0,100]
function getFiveHeight(driver) {
  const LOW_RANGE = 0;
  const HIGH_RANGE = 5;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(driver, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

// Finds the scaled position for the drivers
// @param driver | float - value from the api for a driver
// @return float - [0,100]
function getDriverOneZeroHeight(driver) {
  const LOW_RANGE = 0;
  const HIGH_RANGE = 1;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(driver, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}


// Returns a position formatted as a percentage
// @param position | float
// @return String
function formatPosition(position) {
  return `${position}%`;
}

// Configures the assets and threat bars in the exposure table and individual graphs
// @param wrapper | DOM element
// @param asset | float - value from the api for the asset
// @param threat | float - value from the api for the threat
function drawExposure(wrapper, asset, threat) {
  const assetPosition = formatPosition(getAssetPosition(asset));
  const threatPosition = formatPosition(getThreatPosition(threat));

  wrapper.querySelector('.zonal-long-table-exposure .zonal-long-table-bar-asset').style.bottom = assetPosition;
  wrapper.querySelector('.zonal-long-table-exposure .zonal-long-table-bar-threat').style.left = threatPosition;

  wrapper.querySelector('.zonal-long-table-bar-asset-asset').style.left = assetPosition;
  wrapper.querySelector('.zonal-long-table-bar-threat-threat').style.left = threatPosition;
}

// Configures the aquatic and terrestrial bars in the individual graphs
// @param wrapper | DOM element
// @param fish | float - value from the api for the aquatic parameter
// @param wildlife | float - value from the api for the terrestrial parameter
function drawFishWildlife(wrapper, fish, wildlife) {
  const fishPosition = getFishPosition(fish);
  const wildlifePosition = getWildlifePosition(wildlife);

  wrapper.querySelector('.zonal-long-table-bar-fish').style.left = formatPosition(fishPosition);
  wrapper.querySelector('.zonal-long-table-bar-wildlife').style.left = formatPosition(wildlifePosition);
}

// Configures the hub bar in the individual graph
// @param wrapper | DOM element
// @param threat | fish - value from the api for the aquatic parameter
function drawHub(wrapper, hub) {
  const hubPosition = getHubPosition(hub);

  wrapper.querySelector('.zonal-long-table-bar-hub').style.left = formatPosition(hubPosition);
}

function getTableCategoryText(type, rank) {
  return getIdentifyValue(type, rank).label;
}

// Reformats data for the indexes
// @param data | Object - all data from the API
// @return Array
function getIndexes(data) {
  return [
    {
      label: 'Hubs',
      key: 'hubs',
      value: data.hubs,
      category: getTableCategoryText('hubs', data.hubs)
    },
    {
      label: 'Assets',
      key: 'asset',
      value: data.asset,
      category: getTableCategoryText('asset', data.asset)
    },
    {
      label: 'Threats',
      key: 'threats',
      value: data.asset,
      category: getTableCategoryText('threat', data.asset)
    },
    {
      label: 'Aquatic',
      key: 'aquatic',
      value: data.aquatic,
      category: getTableCategoryText('aquatic', data.aquatic)
    },
    {
      label: 'Terrestrial',
      key: 'terrestrial',
      value: data.terrestrial,
      category: getTableCategoryText('terrestrial', data.terrestrial)
    }
  ];
}

// Reformats data for the short stats charts
// @param data | Object - all data from the API
// @return Array
function getShortDataChartData(data) {
  return [
    {
      label: 'hubs',
      key: 'hubs',
      value: data.hubs,
      category: 'TBD'
    },
    {
      label: 'exposure',
      key: 'exposure',
      value: data.exposure,
      category: 'TBD'
    },
    {
      label: 'asset',
      key: 'asset',
      value: data.asset,
      category: 'TBD'
    },
    {
      label: 'threat',
      key: 'threat',
      value: data.threat,
      category: 'TBD'
    },
    {
      label: 'aquatic',
      key: 'aquatic',
      value: data.aquatic,
      category: 'TBD'
    },
    {
      label: 'terrestrial',
      key: 'terrestrial',
      value: data.terrestrial,
      category: 'TBD'
    }
  ];
}


// Reformats data for the asset drivers
// @param data | Object - all data from the API
// @return Array
function getAssetDrivers(data) {
  return [
    {
      label: 'Population Density',
      key: 'population-density',
      value: data.pop_density,
      category: 'TBD'
    },
    {
      label: 'Social Vulnerability',
      key: 'social-vulnerability',
      value: data.social_vuln,
      category: 'TBD'
    },
    {
      label: 'Critical Facilities',
      key: 'critical-facilities',
      value: data.crit_facilities,
      category: 'TBD'
    },
    {
      label: 'Critical Infrastructure',
      key: 'critical-infrastructure',
      value: data.crit_infra,
      category: 'TBD'
    }
  ];
}

// Reformats data for the threat drivers
// @param data | Object - all data from the API
// @return Array
function getThreatDrivers(data) {
  return [
    {
      label: 'Drainage',
      key: 'drainage',
      value: data.drainage,
      category: 'TBD'
    },
    {
      label: 'Erosion',
      key: 'erosion',
      value: data.erosion,
      category: 'TBD'
    },
    {
      label: 'Flood Prone',
      key: 'floodprone-areas',
      value: data.floodprone_areas,
      category: 'TBD'
    },
    {
      label: 'Sea Level Rise',
      key: 'sea-level-rise',
      value: data.sea_level_rise,
      category: 'TBD'
    },
    {
      label: 'Storm Surge',
      key: 'storm-surge',
      value: data.storm_surge,
      category: 'TBD'
    },
    {
      label: 'Subsidence Shift',
      key: 'geostress',
      value: data.geostress,
      category: 'TBD'
    },
    {
      label: 'Slope',
      key: 'slope',
      value: data.slope,
      category: 'TBD'
    }
  ];
}

// Gets the color to be used for the driver bar
// @param driver | float - [0,100]
// @return String
function getDriverColor(driver) {
  if (driver <= 20) {
    return 'green';
  }
  if (driver <= 40) {
    return 'blue';
  }
  if (driver <= 60) {
    return 'yellow';
  }
  if (driver <= 80) {
    return 'orange';
  }
  return 'red';
}

// Configures each driver bar
// @param graph | DOM element
// @param driver | Object
function drawDriver(graph, driver) {
  // social-vulnerability is 0,1 scalled
  let height = getDriverHeight(driver.value);

  if (driver.key === 'hubs') {
    height = getSevenHeight(driver.value);
  }

  if (driver.key === 'aquatic' || driver.key === 'terrestrial' ) {
    height = getFiveHeight(driver.value);
  }

  if (driver.key === 'exposure') {
    height = getNineHeight(driver.value);
  }

  if (driver.key === 'threat') {
    height = getThreatHeight(driver.value);
  }

  if (driver.key === 'asset') {
    height = getAssetHeight(driver.value);
  }


  if (driver.key === 'social-vulnerability') {
    height = getDriverOneZeroHeight(driver.value);
  }

  const bar = graph.querySelector(`.zonal-long-graph-bar-${driver.key}`);
  bar.style.height = formatPosition(height);
  bar.style.backgroundColor = getDriverColor(height);
}

// Configures each short zonal driver bar
// @param wrapper | DOM element
// @param drivers | Array
function drawShortChart(wrapper, drivers) {
  const assetGraph = wrapper.querySelector('.zonal-long-graph-wrapper-short-chart .zonal-long-graph');
  drivers.forEach(drawDriver.bind(null, assetGraph));
}

// Configures each asset driver bar
// @param wrapper | DOM element
// @param drivers | Array
function drawAssetDrivers(wrapper, drivers) {
  const assetGraph = wrapper.querySelector('.zonal-long-graph-wrapper-asset .zonal-long-graph');
  drivers.forEach(drawDriver.bind(null, assetGraph));
}

// Configures each threat driver bar
// @param wrapper | DOM element
// @param drivers | Array
function drawThreatDrivers(wrapper, drivers) {
  const threatGraph = wrapper.querySelector('.zonal-long-graph-wrapper-threat .zonal-long-graph');
  drivers.forEach(drawDriver.bind(null, threatGraph));
}

function getZonalWrapper(elem) {
  return elem.closest('.zonal-long-wrapper.active');
}

// Switches the display to the short zonal stats
// @param wrapper | DOM element
function dismissLongZonalStats(wrapper) {
  wrapper.classList.remove('active');
  wrapper.classList.remove('active-table');
  document.getElementById('zonal-header').classList.remove('d-none');
  // wrapper.previousSibling.style.height = '100%';
  ZonalWrapperActiveAdd();
}

// Click handler to trigger the dismiss of the long zonal stats
function dismissZonalClickHandler(e) {
  e.preventDefault();
  setGraphsState('none', 'none');
  dismissLongZonalStats(getZonalWrapper(this));

  const name = e.target.getAttribute('id');

  if (name) {
    const HTMLName = name.replace(' ', '_').replace('dismiss-name-', '');
    const path = document.querySelector(`.path-${HTMLName}`);
    togglePermHighLightsOff(path);
  }
}

function findRawValue(wrapper, key) {
  return wrapper.querySelector(`.zonal-long-raw-value-${key}`);
}

function findRawCategory(wrapper, key) {
  return wrapper.querySelector(`.zonal-long-raw-category-${key}`);
}

function formatToThreePlaces(value) {
  return (Math.round(value * 1000) / 1000).toString();
}

function formatRawValue(value) {
  return checkNoData(value) ? 'No data' : formatToThreePlaces(value);
}

function drawRawValue(wrapper, value) {
  findRawValue(wrapper, value.key).appendChild(makeTextElement(formatRawValue(value.value)));
}

function drawRawCategory(wrapper, value) {
  findRawCategory(wrapper, value.key).appendChild(makeTextElement(value.category));
}

function populateRawTableRow(wrapper, value) {
  drawRawValue(wrapper, value);
  drawRawCategory(wrapper, value);
}

function drawRawValues(wrapper, data) {
  data.forEach(populateRawTableRow.bind(null, wrapper));
}

function displayRawValues(wrapper) {
  wrapper.classList.add('active-table');
}

function displayGraphs(wrapper) {
  wrapper.classList.remove('active-table');
}

function displayZonalTableHandler(e) {
  e.preventDefault();
  setGraphsState(this.getAttribute('id'), 'table');
  displayRawValues(getZonalWrapper(this));
}

function displayZonalGraphsHandler(e) {
  e.preventDefault();
  setGraphsState(this.getAttribute('id'), 'graph');
  displayGraphs(getZonalWrapper(this));
}

function drawName(wrapper, name) {
  wrapper.querySelector('#zonal-long-name').textContent = name;
}

// Draws and configures the long zonal stats
// @param data | Object - results of API
// @return DOM element
function drawLongZonalStats(data, name) {
  const HTMLName = makeHTMLName(name);
  const wrapper = makeDiv();
  wrapper.classList.add('zonal-long-wrapper');
  wrapper.setAttribute('id', `name-${HTMLName}`);
  wrapper.innerHTML = ZonalLong;
  drawName(wrapper, name);
  drawExposure(wrapper, data.asset, data.threat);
  drawAssetDrivers(wrapper, getAssetDrivers(data));
  drawThreatDrivers(wrapper, getThreatDrivers(data));
  drawFishWildlife(wrapper, data.aquatic, data.terrestrial);
  drawHub(wrapper, data.hubs);

  // add ids so we can deal with state
  wrapper.querySelector('.zonal-long-button-graphs').setAttribute('id', `graph-name-${HTMLName}`);
  wrapper.querySelector('.zonal-long-button-raw').setAttribute('id', `raw-name-${HTMLName}`);
  wrapper.querySelector('.zonal-long-button-dismiss').setAttribute('id', `dismiss-name-${HTMLName}`);

  wrapper.querySelector('.zonal-long-button-dismiss').addEventListener('click', dismissZonalClickHandler);
  wrapper.querySelector('.zonal-long-button-raw').addEventListener('click', displayZonalTableHandler);
  wrapper.querySelector('.zonal-long-button-graphs').addEventListener('click', displayZonalGraphsHandler);
  drawRawValues(wrapper, getIndexes(data).concat(getAssetDrivers(data), getThreatDrivers(data)));
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
    const elem = document.getElementById(elemid);
    const path = document.querySelector(`.path-${elemid.replace('name-', '')}`);

    switch (activestate) {
      case 'graph':
        displayGraphs(elem);
        elem.classList.add('active');
        document.getElementById('zonal-header').classList.add('d-none');

        togglePermHighLightsOn(path);
        ZonalWrapperActiveRemove();

        break;
      case 'table':
        elem.classList.add('active');
        elem.classList.add('active-table');
        document.getElementById('zonal-header').classList.add('d-none');

        togglePermHighLightsOn(path);
        ZonalWrapperActiveRemove();

        break;
      default:
        return null;
    }
  }
  return null;
}

// Draws and configures the entire zonal stats
// @param data | Object - results of API
function drawZonalStatsFromAPI(data, name, mapComponent) {
  const HTMLName = makeHTMLName(name);

  if (!document.getElementById('zonal-header')) {
    document.getElementById('zonal-area-wrapper').innerHTML = ZonalWrapper;
  }
  const wrapper = makeDiv();
  wrapper.classList.add('zonal-stats-wrapper');
  wrapper.setAttribute('id', `zonal-stats-wrapper-${HTMLName}`);

  wrapper.appendChild(drawShortZonalStats(data, name, mapComponent));
  wrapper.appendChild(drawLongZonalStats(data, name));
  document.getElementById('zonal-content').appendChild(wrapper);

  // const iconelem = document.getElementById('btn-details-icon');
  // iconelem.addEventListener('mouseover', zonalLabelMouseOverHandler);
  // iconelem.addEventListener('mouseout', zonalLabelMouseOutHandler);
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
  viewLongZonalStatsFromShape
};

// Polyfill for Element.closest for IE9+ and Safari
// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = (s) => {
    let el = this;

    if (!document.documentElement.contains(el)) {
      return null;
    }

    do {
      if (el.matches(s)) {
        return el;
      }
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);

    return null;
  };
}
