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

function makeHubBoxElem(hubText, hubStatus) {
  const hubWrapper = makeDiv();
  hubWrapper.className = 'zonal-hub-wrapper zonal-item';
  const hubElem = makeDiv();
  hubElem.className = `zonal-hub zonal-hub-${hubStatus} noselect`;
  hubElem.appendChild(makeScreenReaderText(hubText));
  hubWrapper.appendChild(hubElem);
  return hubWrapper;
}

function makeInHubBox() {
  return makeHubBoxElem('The Zone is in at least one Hub', 'in');
}

function makeOutHubBox() {
  return makeHubBoxElem('The Zone is not in at least one Hub', 'out');
}

function makeHubBox(inHub) {
  return checkNoData(inHub) ? makeOutHubBox() : makeInHubBox();
}

function makeShortZonalStatsInterior(data) {
  return [
    makeLabel(),
    makeHubBox(data.hubs),
    makeFishWildBox(data.terrestrial, data.aquatic),
    makeExposureBox(data.asset, data.threat)
  ];
}

function drawShortZonalStats(data) {
  const wrapper = makeZonalWrapper();
  makeShortZonalStatsInterior(data).forEach((elem) => {
    wrapper.appendChild(elem);
  });
  document.getElementById('zonal-content').appendChild(wrapper);
}

// This function finds the scaled position of a value from [0,100]
// It does the addition of scale and division by 3 since the value falls into one of three ranges
// and so it needs to put the scaled value into the correct area.
//
// @param val - float
// @param min - int
// @param max - int
// @param scale - int. Either 0, 1 or 2.
function getValuePosition(val, min, max, scale) {
  let position = (val - min) / (max - min); // [0,1]
  position = position + scale; // [0,3]
  position = (position / 3) * 100; // [0, 100]
  return position;
}

// Scales a value from [0,100] to [0,75] since the table has an extra row and column of headers that
// otherwise would throw off the position
function getTablePosition(val) {
  return (val * 75) / 100;
}

function getExposurePosition(val, low, med, high) {
  const BOTTOM_RANGE = 0;
  const LOW_SCALE = 0;
  const MED_SCALE = 1;
  const HIGH_SCALE = 2;

  if (asset < low) {
    return getValuePosition(asset, BOTTOM_RANGE, low, LOW_SCALE);
  }

  if (asset < med) {
    return getValuePosition(asset, low, med, MED_SCALE);
  }

  return getValuePosition(asset, med, high, HIGH_SCALE);
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

  return getExposurePosition(asset, LOW_THREAT, MED_THREAT, HIGH_THREAT);
}

function drawLongZonalStats(data) {
  console.log(data);
  const wrapper = makeDiv();
  wrapper.innerHTML = ZonalLong;
  document.getElementById('zonal-content').appendChild(wrapper);
}

function drawShortZonalStatsFromAPI(data) {
  if (!document.getElementById('zonal-header')) {
    document.getElementById('zonal-area-wrapper').innerHTML = ZonalWrapper;
  }
  drawShortZonalStats(data);
  drawLongZonalStats(data);
}

export { drawShortZonalStatsFromAPI };
