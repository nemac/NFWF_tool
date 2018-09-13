import ZonalWrapper from '../templates/zonal_wrapper.html';
import ZonalLong from '../templates/zonal_long.html';
import identifyConfig from '../config/identifyConfig';

function checkNoData(val) {
  return Number.isNaN(Number.parseFloat(val)) || Number.parseInt(val, 10) === 255;
}

function makeDiv() {
  return document.createElement('div');
}

function makeTextElement(text) {
  return document.createTextNode(text);
}

function makeScreenReaderText(text) {
  const elem = document.createElement('span');
  elem.className = 'hidden';
  elem.appendChild(makeTextElement(text));
  return elem;
}

function makeZonalWrapper() {
  const zonalWrap = makeDiv();
  zonalWrap.className = 'zonal-wrapper';
  return zonalWrap;
}

function makeBoxWrapper() {
  const boxWrap = makeDiv();
  boxWrap.className = 'zonal-item';
  return boxWrap;
}

function makeLabel() {
  const zonalLabel = makeDiv();
  zonalLabel.className = 'zonal-label';
  const areaCount = document.getElementsByClassName('zonal-wrapper').length + 1;
  zonalLabel.appendChild(makeTextElement(`Area ${areaCount}`));
  return zonalLabel;
}

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

function makeZonalBox(type, rank) {
  const zonalBox = makeDiv();
  const zonalData = getIdentifyValue(type, rank);
  zonalBox.className = `zonal-${type} zonal-box noselect`;
  zonalBox.setAttribute('data-ranking', rank);
  zonalBox.style.color = zonalData.color;
  zonalBox.style.backgroundColor = zonalData.backgroundColor;
  zonalBox.appendChild(makeTextElement(zonalData.label));
  return zonalBox;
}

function makeInHubBox(rank) {
  return makeZonalBox('hubs', rank);
}

function makeHubBox(hubs) {
  const hubWrapper = makeBoxWrapper();
  hubWrapper.classList.add("zonal-item-hub");
  hubWrapper.appendChild(makeInHubBox(checkNoData(hubs) ? 255 : hubs));
  return hubWrapper;
}

function makeAssetBox(rank) {
  return makeZonalBox('asset', rank);
}

function makeThreatBox(rank) {
  return makeZonalBox('threat', rank);
}

function makeTerrestrialBox(rank) {
  return makeZonalBox('terrestrial', rank);
}

function makeAquaticBox(rank) {
  return makeZonalBox('aquatic', rank);
}

function makeFishWildBox(wildlife, fish) {
  const fishWildWrapper = makeBoxWrapper();
  fishWildWrapper.appendChild(makeAquaticBox(fish));
  fishWildWrapper.appendChild(makeTerrestrialBox(wildlife));
  return fishWildWrapper;
}

function makeExposureBox(asset, threat) {
  const exposureWrapper = makeBoxWrapper();
  exposureWrapper.appendChild(makeAssetBox(asset));
  exposureWrapper.appendChild(makeThreatBox(threat));
  return exposureWrapper;
}

function makeShortZonalStatsInterior(data) {
  return [
    makeLabel(),
    makeHubBox(data.hubs),
    makeFishWildBox(data.terrestrial, data.aquatic),
    makeExposureBox(data.asset, data.threat)
  ];
}

function viewLongZonalStats(shortElem) {
  shortElem.nextElementSibling.classList.add('active');
}

function shortZonalClickHandler(e) {
  e.preventDefault();
  viewLongZonalStats(this);
}

function drawShortZonalStats(data) {
  const wrapper = makeZonalWrapper();
  makeShortZonalStatsInterior(data).forEach((elem) => {
    wrapper.appendChild(elem);
  });
  wrapper.addEventListener('click', shortZonalClickHandler);
  return wrapper;
//  document.getElementById('zonal-content').appendChild(wrapper);
}

// This function finds the scaled position of a value from [0,100]
// It does the addition of scale and division by scaleGroups since the value falls into one of
//  multiple ranges and so it needs to put the scaled value into the correct area.
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
  return position;
}

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

function getAssetPosition(asset) {
  const LOW_ASSET = 1.5;
  const MED_ASSET = 2.5;
  const HIGH_ASSET = 13;

  return getExposurePosition(asset, LOW_ASSET, MED_ASSET, HIGH_ASSET);
}

function getThreatPosition(threat) {
  const LOW_THREAT = 7.5;
  const MED_THREAT = 11.5;
  const HIGH_THREAT = 29;

  return getExposurePosition(threat, LOW_THREAT, MED_THREAT, HIGH_THREAT);
}

function getFishPosition(fish) {
  const LOW_RANGE = 1;
  const HIGH_RANGE = 5;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(fish, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

function getWildlifePosition(wildlife) {
  const LOW_RANGE = 1;
  const HIGH_RANGE = 5;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(wildlife, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

function getHubPosition(hub) {
  const LOW_RANGE = 1;
  const HIGH_RANGE = 7;
  const SCALE = 0;
  const SCALE_GROUPS = 1;

  return getValuePosition(hub, LOW_RANGE, HIGH_RANGE, SCALE, SCALE_GROUPS);
}

function formatTablePosition(position) {
  return `${position}%`;
}

function drawExposure(wrapper, asset, threat) {
  const assetPosition = getAssetPosition(asset);
  const threatPosition = getThreatPosition(threat);

  wrapper.querySelector('.zonal-long-table-exposure .zonal-long-table-bar-asset').style.bottom = formatTablePosition(assetPosition);
  wrapper.querySelector('.zonal-long-table-exposure .zonal-long-table-bar-threat').style.left = formatTablePosition(threatPosition);

  wrapper.querySelector('.zonal-long-table-bar-asset-asset').style.left = formatTablePosition(assetPosition);
  wrapper.querySelector('.zonal-long-table-bar-threat-threat').style.left = formatTablePosition(threatPosition);
}

function drawFishWildlife(wrapper, fish, wildlife) {
  const fishPosition = getFishPosition(fish);
  const wildlifePosition = getWildlifePosition(wildlife);

  wrapper.querySelector('.zonal-long-table-bar-fish').style.left = formatTablePosition(fishPosition);
  wrapper.querySelector('.zonal-long-table-bar-wildlife').style.left = formatTablePosition(wildlifePosition);
}

function drawHub(wrapper, hub) {
  const hubPosition = getHubPosition(hub);

  wrapper.querySelector('.zonal-long-table-bar-hub').style.left = formatTablePosition(hubPosition);
}

function getAssetDrivers(data) {
  return [
    {
      label: 'Population Density',
      value: data.pop_density
    },
    {
      label: 'SOVI',
      value: data.social_vuln
    },
    {
      label: 'Critical Facilities',
      value: data.crit_facilities
    },
    {
      label: 'Critical Infrastructure',
      value: data.crit_infra
    }
  ];
}

function makeDriverHtml(driver) {
  return {
//    label: makeDriverLabel(driver.)
  };
}

function insertDrivers(graph, driver) {
    
}

function drawAssetDrivers(wrapper, drivers) {
  const assetGraph = wrapper.querySelector('.zonal-long-graph-wrapper-asset .zonal-long-graph');
//  drivers.map(makeDriverHtml).forEach(elem => { insertDrivers(assetGraph, elem); });
}

function dismissLongZonalStats(elem) {
  elem.parentElement.parentElement.classList.remove('active');
}

function dismissZonalClickHandler(e) {
  e.preventDefault();
  dismissLongZonalStats(this);
}

function drawLongZonalStats(data) {
  console.log(data);
  const wrapper = makeDiv();
  wrapper.classList.add('zonal-long-wrapper');
  wrapper.innerHTML = ZonalLong;
  drawExposure(wrapper, data.asset, data.threat);
  drawAssetDrivers(wrapper, getAssetDrivers(data));
  drawFishWildlife(wrapper, data.aquatic, data.terrestrial);
  drawHub(wrapper, data.hubs);
  wrapper.querySelector('.zonal-long-dismiss').addEventListener('click', dismissZonalClickHandler);
  return wrapper;
}

function drawShortZonalStatsFromAPI(data) {
  if (!document.getElementById('zonal-header')) {
    document.getElementById('zonal-area-wrapper').innerHTML = ZonalWrapper;
  }
  const wrapper = makeDiv();
  wrapper.classList.add('zonal-stats-wrapper');
  wrapper.appendChild(drawShortZonalStats(data));
  wrapper.appendChild(drawLongZonalStats(data));
  document.getElementById('zonal-content').appendChild(wrapper);
}

export { drawShortZonalStatsFromAPI };
