import ZonalWrapper from '../templates/zonal_wrapper.html';
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

function drawShortZonalStatsFromAPI(data) {
  if (!document.getElementById('zonal-header')) {
    document.getElementById('zonal-area-wrapper').innerHTML = ZonalWrapper;
  }
  drawShortZonalStats(data);
}

export { drawShortZonalStatsFromAPI };
