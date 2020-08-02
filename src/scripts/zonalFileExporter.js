import L from 'leaflet';
import { saveCsv } from './fileExporter';
import { Store } from './store';
import { mapConfig } from '../config/mapConfig';
import {
  googleAnalyticsEvent
} from './utilitys';

const store = new Store({});
const { TMSLayers } = mapConfig;

// rename field
function getCSVName(name) {
  if (name === 'TARGET_FID') {
    return 'Name';
  }
  if (name === 'name') {
    return 'Name';
  }

  // filter the region layer list so we can get map configation values for all
  // regions layers
  let region = store.getStateItem('region');
  const activeNav = store.getStateItem('activeNav');
  if (activeNav === 'main-nav-map-searchNShubs') {
    region = 'targetedwatershed';
  }
  const layerRegionInfo = TMSLayers.filter(layers => layers.region === region);

  // if layerRegionInfo empty array then exit nothing matches.
  if (layerRegionInfo.length === 0) {
    return null;
  }

  // check of data matches a driver
  let layerInfoHasKey = layerRegionInfo.filter(layer => layer.apikey === name);

  // filter the regions layers to the specifc layer so we can get map configation values
  if (activeNav === 'main-nav-map-searchhubs' || activeNav === 'main-nav-map-searchNShubs') {
    layerInfoHasKey = layerRegionInfo.filter(layer => layer.hubsapikey === name);
  }

  // check of data matches a driver and add it to a new object araray that is key, value
  if (layerInfoHasKey.length > 0) {
    const label = `${layerInfoHasKey[0].label}-data range (${layerInfoHasKey[0].chartMinValue} to ${layerInfoHasKey[0].chartMaxValue - 1})`;
    // have to add underscore for some csv conversions and I don't know why
    return label.replace(/ /g, '_');
  }
  return null;
}

// Implements a toString handler for each item in the array provided by getExportData to convert
// them into a line in a csv file.
//
// @param item | Object
// @return String
function exportDataToString(item) {
  return `${item.label},${item.value},${item.range}`;
}

// Converts the data provided by getExportData into the string based data of a csv file. Does not
// add the headers or neccesary extras for file-saver
//
// @param exportData | Array
// @return String
function formatExportData(exportData) {
  return `${exportData.map(exportDataToString).join('\r\n')}\r\n`;
}

// Creates the content of the file to be exported. Adds the header row and the array wrapper
// needed by file-saver.
//
// @param data | Object - Data from API
// @return Array
function makeExportFileContent(data) {
  // const csvString = formatExportData(getExportData(data));
  const csvString = formatExportData(data);
  return [`Index,Value,Range(s)\r\n${csvString}`];
}

// Triggers the save to CSV.
//
// @param fileContent | Array - Contents of the file
// @param name | String - Some sort of human readable identifier. Ex: Area-2 || Hub-13723
function triggerCsvExport(fileContent, name) {
  saveCsv(fileContent, name);
}

// The available name has extra text added for a unique id. This trims the name to the neccesary
// information.
//
// @param name | String
// @return String
function getZonalKeyFromName(name) {
  return name.replace('-USERAREA-', '').replace('Area_', '');
}

// Mines the state object for the data about a user defined zone from the API
//
// @param key | String - Will likely be an integer
// @return Object
function getZonalDataFromState(key) {
  return store.getStateItem('userareas')[`userarea${key}`][3]
    .zonalstatsjson.features[0].properties.mean;
}

// Mines the state object for the data about a hub from the API
//
// @param key | String - Will likely be a 5 digit integer
// @return Object
function getNatureServeHubDataFromState(key) {
  const NatureServehubData = store.getStateItem('NatureServeHubIntersectionJson');
  let i;
  let l;
  let data = {};
  for (i = 0, l = NatureServehubData.length; i < l; i += 1) {
    if (NatureServehubData[i].properties.mean.TARGET_FID.toString() === key) {
      data = NatureServehubData[i].properties.mean;
      break;
    }
  }
  return data;
}

// Mines the state object for the data about a hub from the API
//
// @param key | String - Will likely be a 5 digit integer
// @return Object
function getHubDataFromState(key) {
  const hubData = store.getStateItem('HubIntersectionJson');
  let i;
  let l;
  let data = {};
  for (i = 0, l = hubData.length; i < l; i += 1) {
    if (hubData[i].properties.mean.TARGET_FID.toString() === key) {
      data = hubData[i].properties.mean;
      break;
    }
  }

  return data;
}

// Formats the key information about a zone into the format needed for the filename
//
// @param key | String
// @return String
function makeZonalNameFromKey(key) {
  return `Area-${key}`;
}

function formatDataForTables(data) {
  // filter the region layer list so we can get map configation values for all
  // regions layers
  let region = store.getStateItem('region');
  const activeNav = store.getStateItem('activeNav');
  if (activeNav === 'main-nav-map-searchNShubs') {
    region = 'targetedwatershed';
  }
  const layerRegionInfo = TMSLayers.filter(layers => layers.region === region);

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

// Handles the export of zonal / hub data to a csv file.
//
// @param name | String - result of makeHTMLName from zonalStats.js
function handleZonalCsvExport(name) {
  const key = getZonalKeyFromName(name);
  const activeNav = store.getStateItem('activeNav');
  let data = {};
  const region = store.getStateItem('region');

  // state data depends on tab
  switch (activeNav) {
    case 'main-nav-map-searchhubs': {
      data = getHubDataFromState(key);
      break;
    }
    case 'main-nav-map-examples': {
      break;
    }
    case 'main-nav-map-searchNShubs': {
      data = getNatureServeHubDataFromState(key);
      break;
    }
    case 'main-nav-map': {
      data = getZonalDataFromState(key);
      break;
    }
    default: {
      data = getZonalDataFromState(key);
      break;
    }
  }

  const formatedData = formatDataForTables(data, region);
  const label = makeZonalNameFromKey(key);
  const fileContent = makeExportFileContent(formatedData);
  triggerCsvExport(fileContent, label);

  // ga event action, category, label
  googleAnalyticsEvent('click', 'download', `${name}`);
}

// converts the the multple record object to csv and renames headers (field names)
//
// @param name | String - data object from state that is properties.mean
function convertDataToCSV(data) {
  const items = data;
  const replacer = (key, value) => (value === null ? '' : value);
  const header = Object.keys(items[0]);
  const downloadHeader = header.map(name => getCSVName(name));
  let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer).replace(/\\"/g, '""')).join(','));

  // push header to begining of array
  csv.unshift(downloadHeader.join(','));
  csv = csv.join('\r\n');
  return csv;
}

// filter geojson by the current region
function regionFilter(feature) {
  const region = store.getStateItem('region');
  if (feature.properties.region === region) return true;
  return false;
}

// Mines the state object for the data about all user defined zones from the API
//
// @param none
// @return Object
function getAllZonesFromState() {
  const zonaldata = [];
  const userareas = store.getStateItem('userareas');

  Object.keys(userareas).forEach((key) => {
    const { name } = userareas[key][0];
    const zonalData = userareas[key][3].zonalstatsjson;
    const regionalData = L.geoJson(zonalData, { filter: regionFilter }).toGeoJSON();
    // limit to regional data, and make sure empty GeoJson is ignored
    if (regionalData.features[0]) {
      const data = { name, ...userareas[key][3].zonalstatsjson.features[0].properties.mean };
      zonaldata.push(data);
    }
  });
  return convertDataToCSV(zonaldata);
}

//  Mines the state object for the data about a hub from the API
//
// @param none
// @return Object
function getAllNatureServeHubsFromState() {
  const NatureServeHubData = store.getStateItem('NatureServeHubIntersectionJson');
  const data = [];
  NatureServeHubData.forEach((NatureServeHub) => {
    data.push(NatureServeHub.properties.mean);
  });
  return convertDataToCSV(data);
}

//  Mines the state object for the data about a hub from the API
//
// @param none
// @return Object
function getAllHubsFromState() {
  const hubData = store.getStateItem('HubIntersectionJson');
  const data = [];
  hubData.forEach((hub) => {
    data.push(hub.properties.mean);
  });
  return convertDataToCSV(data);
}

// Handles the export of zonal / hub data to a csv file when user downloads all
//
// @param name | String - result of makeHTMLName from zonalStats.js
function handleZonalAllCsvExport(name) {
  const activeNav = store.getStateItem('activeNav');

  switch (activeNav) {
    case 'main-nav-map-searchhubs': {
      const fileContent = [getAllHubsFromState()];
      triggerCsvExport(fileContent, 'All Data');
      break;
    }
    case 'main-nav-map-examples': {
      break;
    }
    case 'main-nav-map-searchNShubs': {
      const fileContent = [getAllNatureServeHubsFromState()];
      triggerCsvExport(fileContent, 'All Data');
      break;
    }
    case 'main-nav-map': {
      const fileContent = [getAllZonesFromState()];
      triggerCsvExport(fileContent, 'All Data');
      break;
    }
    default: {
      const fileContent = [getAllZonesFromState()];
      triggerCsvExport(fileContent, 'All Data');
      break;
    }
  }

  // ga event action, category, label
  googleAnalyticsEvent('click', 'download', 'all');
}

// Binds the export handler to the download button
//
// @param name | String - result of makeHTMLName from zonalStats.js
function bindZonalExportHandler(name) {
  const button = document.querySelector(`#download-name--${name}`);
  button.addEventListener('click', handleZonalCsvExport.bind(null, name));
}

// btn-download-all-zonal-stats
// Binds the export handler to the download button
//
// @param name | String - result of makeHTMLName from zonalStats.js
function bindZonalAllExportHandler() {
  const button = document.querySelector('#btn-download-all-zonal-stats');
  button.addEventListener('click', handleZonalAllCsvExport.bind(null));
}

export { bindZonalExportHandler, bindZonalAllExportHandler };
