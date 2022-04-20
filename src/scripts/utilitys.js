// eslint comaplins about L. but its needed to process  mapconfig
import L from 'leaflet'; // eslint-disable-line
import Chart from 'chart.js';

// import classes and configs
import { Store } from './store';
import { identifyConfig } from '../config/identifyConfig';
import { mapConfig } from '../config/mapConfig';

// Legend Templates
import ColorRampFifteenBreaks from '../templates/colorramp_breaks_fifteen.html';
import ColorRampTenBreaks from '../templates/colorramp_breaks_ten.html';
import ColorRampNineBreaks from '../templates/colorramp_breaks_nine.html';
import ColorRampEightBreaks from '../templates/colorramp_breaks_eight.html';
import ColorRampSevenBreaks from '../templates/colorramp_breaks_seven.html';
import ColorRampSixBreaks from '../templates/colorramp_breaks_six.html';
import ColorRampFiveBreaks from '../templates/colorramp_breaks_five.html';
import ColorRampFourBreaks from '../templates/colorramp_breaks_four.html';
import ColorRampThreeBreaks from '../templates/colorramp_breaks_three.html';
import ColorRampTwoBreaks from '../templates/colorramp_breaks_two.html';
import ColorRampOneBreaks from '../templates/colorramp_breaks_one.html';
import AskForHelpPage from '../templates/askforhelp.html';


const store = new Store({});
const { TMSLayers } = mapConfig;

// Parses the configuration of identify values and gets the requested configuration object
// @param type | String - matches the layer key
// @param rank | String || Number - rounded and matches the value key
// @return Object
export function getIdentifyValue(type, rank) {
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

/**
 * update the display of element
 *  @param { Object } element - Element object from click event, used to toggle
 *                   display state
 */
export function toggleElementDisplay(thisEle, elements) {
  elements.forEach((ele) => {
    const name = ele.replace('main_nav_', '');
    const tabEle = document.querySelector(`[ref="tab-${name}"]`);
    const mapClass = tabEle.className;
    const newMapClass = mapClass + (mapClass.indexOf(' d-none') > 0) ? ' ' : 'd-none';

    tabEle.className = newMapClass;
  });
}

// convert a number to to the word representation
// of the number.  We are using the word in the HTML class
// and will use this to highlight the value in the chart details
export function numberToWord(number) {
  let numberWord = 'none';

  switch (number) {
    case 0:
      numberWord = 'none';
      break;
    case 1:
      numberWord = 'one';
      break;
    case 2:
      numberWord = 'two';
      break;
    case 3:
      numberWord = 'three';
      break;
    case 4:
      numberWord = 'four';
      break;
    case 5:
      numberWord = 'five';
      break;
    case 6:
      numberWord = 'six';
      break;
    case 7:
      numberWord = 'seven';
      break;
    case 8:
      numberWord = 'eight';
      break;
    case 9:
      numberWord = 'nine';
      break;
    case 10:
      numberWord = 'ten';
      break;
    case 11:
      numberWord = 'eleven';
      break;
    case 12:
      numberWord = 'twelve';
      break;
    case 13:
      numberWord = 'thirteen';
      break;
    case 14:
      numberWord = 'fourteen';
      break;
    case 15:
      numberWord = 'fifteen';
      break;
    case 16:
      numberWord = 'sixteen';
      break;
    case 17:
      numberWord = 'seventeen';
      break;
    case 18:
      numberWord = 'eightteen';
      break;
    case 19:
      numberWord = 'nineteen';
      break;
    case 20:
      numberWord = 'twenty';
      break;
    default:
  }
  return numberWord;
}

// Returns the HTML for a specified legend type
//
// @param type | String
// @return String
export function getLegendHtml(maxValue) {
  switch (maxValue) {
    case 15:
      return ColorRampFifteenBreaks;
    case 10:
      return ColorRampTenBreaks;
    case 9:
      return ColorRampNineBreaks;
    case 8:
      return ColorRampEightBreaks;
    case 7:
      return ColorRampSevenBreaks;
    case 6:
      return ColorRampSixBreaks;
    case 5:
      return ColorRampFiveBreaks;
    case 4:
      return ColorRampFourBreaks;
    case 3:
      return ColorRampThreeBreaks;
    case 2:
      return ColorRampTwoBreaks;
    case 1:
      return ColorRampOneBreaks;
    default:
      return ColorRampTenBreaks;
  }
}

// Reformats data for the drivers of inputs
// @param data | Object - all data from the API
// @return Array
export function groupByDriver(collection, property) {
  let val;
  let index;
  const values = [];
  const result = [];
  Object.keys(collection).forEach((prop) => {
    val = collection[prop][property];
    index = values.indexOf(val);
    if (index > -1) {
      result[index].push(collection[prop]);
    } else {
      values.push(val);
      result.push([collection[prop]]);
    }
  });
  return result;
}

// ensure the object or variable is valid...
// TODO: This should probably be looking for positives rather than checking it
// isn't one of a few negatives. For example this will let booleans, malformed
// lat/long objects, arrays and floats through when it probably shouldn't. The
// code doesn't really say what a valid object is other than not undefined,
// null, empty arrays, empty objects and empty strings.
//
// @param obj - typeless
export function checkValidObject(obj) {
  if (obj === undefined || obj === null) { return false; }
  if (typeof obj === 'object' && Object.keys(obj).length === 0) { return false; }
  if (typeof obj === 'string' && obj.length === 0) { return false; }

  return true;
}

// toggle spinner visibility on
export function spinnerOn() {
  const el = document.getElementById('map-working');
  const elHolder = document.querySelector('.leaflet-working');

  // ensure elements and class names exists
  if (el === undefined) { return false; }
  if (el.className.baseVal === undefined) { return false; }
  if (elHolder === undefined) { return false; }
  if (elHolder.className === undefined) { return false; }

  // update class for svg spinner
  const elClassName = el.className.baseVal;
  el.className.baseVal = elClassName.replace(' d-none', '');

  // update class for div element that holds svg.  Do this so it dose not cover
  // cover other map elements and panes
  elHolder.className = elHolder.className.replace(' d-none', '');
  elHolder.className = elHolder.className.replace('h-10', '');
  elHolder.className = elHolder.className.replace('w-10', '');
  elHolder.className += ' h-10';
  elHolder.className += ' w-10';

  return true;
}

// check if one of our ajax calls is working
// if we add anymore we will need to add it here
export function checkworking() {
  const workingDrawlayers = store.getStateItem('working_drawlayers');
  if (workingDrawlayers) { return true; }
  // console.log('working_drawlayers');

  const workingBasemap = store.getStateItem('working_basemap');
  if (workingBasemap) { return true; }
  // console.log('working_basemap');

  const workingMapinfo = store.getStateItem('working_mapinfo');
  if (workingMapinfo) { return true; }
  // console.log('working_mapinfo');

  const workingZonalstats = store.getStateItem('working_zonalstats');
  if (workingZonalstats) { return true; }
  // console.log('working_zonalstats');

  const workingSearch = store.getStateItem('working_search');
  if (workingSearch) { return true; }
  // console.log('working_search');

  const workingS3Retreive = store.getStateItem('working_s3retreive');
  if (workingS3Retreive) { return true; }
  // console.log('working_s3retreive');

  const workingS3Save = store.getStateItem('working_s3save');
  if (workingS3Save) { return true; }
  // console.log('working_s3save');

  return false;
}

// toggle spinner visibility off
export function spinnerOff(source = '') {
  if (checkworking()) { return false; }

  const el = document.getElementById('map-working');
  const elHolder = document.querySelector('.leaflet-working');

  // ensure elements and class names exists
  if (el === undefined) { return false; }
  if (el.className.baseVal === undefined) { return false; }
  if (elHolder === undefined) { return false; }
  if (elHolder.className === undefined) { return false; }

  // update class for svg spinner
  const elClassName = el.className.baseVal;
  el.className.baseVal = elClassName.replace(' d-none', '');
  el.className.baseVal += ' d-none';

  // update class for div element that holds svg.  Do this so it dose not cover
  // cover other map elements and panes
  elHolder.className = elHolder.className.replace(' d-none', '');
  elHolder.className = elHolder.className.replace('h-100', '');
  elHolder.className = elHolder.className.replace('w-100', '');
  elHolder.className += ' d-none';

  return true;
}

// toggle spinner visibility off
export function hardSpinnerOff(source = '') {
  const el = document.getElementById('map-working');
  const elHolder = document.querySelector('.leaflet-working');

  // ensure elements and class names exists
  if (el === undefined) { return false; }
  if (el.className.baseVal === undefined) { return false; }
  if (elHolder === undefined) { return false; }
  if (elHolder.className === undefined) { return false; }

  // update class for svg spinner
  const elClassName = el.className.baseVal;
  el.className.baseVal = elClassName.replace(' d-none', '');
  el.className.baseVal += ' d-none';

  // update class for div element that holds svg.  Do this so it dose not cover
  // cover other map elements and panes
  elHolder.className = elHolder.className.replace(' d-none', '');
  elHolder.className = elHolder.className.replace('h-100', '');
  elHolder.className = elHolder.className.replace('w-100', '');
  elHolder.className += ' d-none';

  return true;
}

// TODO: Either generalize this so it isn't always background color and color but instead
// an attribute/value pair. Or preferably make this use classes so we can have the colors
// be in css.
export function addStyle(doc, type, values) {
  const element = doc.getElementById(`${type}-score`);
  if (element !== undefined && element !== null) {
    element.setAttribute('style', `background-color: ${values.backgroundColor}; color: ${values.color};`);
  }
}

// Note that the back-ticks are intentional. They use the new ES6 Template
// Literals pattern.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
export function replaceMapInfoValue(doc, type, values) {
  const element = doc.getElementById(`${type}-score`);
  if (element !== undefined && element !== null) {
    element.textContent = values.label;
  }
}

// check if a parentelemet contains a dom id
// deals with event bubbling so we can check
// if the child is in a specifc parent
export function ParentContains(target, id) {
  for (let p = target && target.parentElement; p; p = p.parentElement) {
    if (p.id === id) { return true; }
  }
  return false;
}

export function flatten(arr) {
  const flat = [];
  arr.forEach((d) => {
    if (Array.isArray(d)) {
      flat.push(...d);
    } else {
      flat.push(d);
    }
  });
  return flat;
}

export function uuid() {
  return crypto.getRandomValues(new Uint32Array(4)).join('-');
}

// adds a custom google events
export function googleAnalyticsEvent(action = '', category = '', label = '', value = 0) {
  gtag('event', action, {  // eslint-disable-line
    event_category: category,
    event_label: label,
    value: `${value}`,
    uuid: store.getStateItem('uuid')
  });
}

// Checks if a value falls in the range of accepted values
// @param val | string || integer || float
// @return boolean
function checkNoData(val) {
  return Number.isNaN(Number.parseFloat(val)) || Number.parseInt(val, 10) === 255;
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
// TODO ADD TO MAPCONFIG nodata value overide
function getValuePosition(val, rangeMin, rangeMax, scale, scaleGroups) {
  let valOveride = val;
  // no data overide
  if (val === '255') {
    valOveride = 0;
  }
  if (val === '255.0') {
    valOveride = 0;
  }
  if (val === '128') {
    valOveride = 0;
  }
  if (val === '128.0') {
    valOveride = 0;
  }
  let position = (valOveride - rangeMin) / ((rangeMax - 1) - rangeMin); // [0,1]
  position += scale; // [0,scaleGroups]
  position = (position / scaleGroups) * 100; // [0, 100]
  if (position === 100) {
    position = 99;
  }
  return position;
}

// generic function for chartdata and identify data formating
function chartDataReformat(allchartdata) {
  const configchartdata = [];
  // map the chart data object to transform labels and groups
  allchartdata.forEach((area) => {
    const regionLayers = TMSLayers.filter(layers => layers.region === area.region);

    // get chart groups from mapConfig
    const driverGroups = groupByDriver(regionLayers, 'chartInputName');

    // iterate the the chart groups to ensure data is seperated by chart type
    // all of this is dervived from mapConfig
    Object.keys(driverGroups).forEach((group) => {
      // get group name
      const grouplayers = driverGroups[group];
      const groupname = grouplayers[0].chartInputName;
      const grouplabel = grouplayers[0].chartInpuLabel;
      const totalChartValues = area.statistics.length - 1;
      const values = [totalChartValues];
      const hovervalues = [totalChartValues];
      const labels = [totalChartValues];
      const colors = [totalChartValues];

      // iterate the zonal stats and remap values to mapconfig chart types
      Object.keys(area.statistics).forEach((statisticskey) => {
        let configlayer = grouplayers.filter(layer => layer.apikey === statisticskey);
        console.log('configlayer', configlayer)
        // apikey match could is different for hubs will work on this later to make names consistent
        if (area.source === 'nfwf_hubs' || area.source === 'mapinfo_ns') {
          configlayer = grouplayers.filter(layer => layer.hubsapikey === statisticskey);
        }

        // ensure that the data exists if no data for the matches in config and return ignore this
        // this can happent with hubs and id field
        if (configlayer[0]) {
          // get value convert NaN to 0
          const value = checkNoData(area.statistics[statisticskey]) ? 0 :
            (Math.round(area.statistics[statisticskey] * 100) / 100);

          // get the percent translation of the actual value so we
          // compare all the values on the chart
          const height = getValuePosition(value,
            configlayer[0].chartMinValue,
            configlayer[0].chartMaxValue,
            configlayer[0].chartScale,
            configlayer[0].chartScaleGroups);

          // get mapConfig data
          const label = configlayer[0].chartLabel;

          // get mapConfig colors
          const color = configlayer[0].chartCSSColor[parseInt(area.statistics[statisticskey], 10)];

          // get chart order
          const orderValue = configlayer[0].chartOrder;

          // push dat into data, label, color arrays most charting libraries
          // need this use sort order for array positions - sorts data for charts
          values[orderValue - 1] = height;
          hovervalues[orderValue - 1] = value;
          labels[orderValue - 1] = label;
          colors[orderValue - 1] = color;
        }
      });

      // get name, region, and source for chart json
      const name = area.name;
      const region = area.region;
      const source = area.source;

      //  create group chart data object
      const data = {
        name,
        region,
        source,
        groupname,
        grouplabel,
        values,
        hovervalues,
        colors,
        labels
      };

      // push group into into chart object
      configchartdata.push(data);
    });
  });

  return configchartdata;
}

// prepare mapinfo Identify Data for charting
export function formatMapInfoChartData() {
  const activeNav = store.getStateItem('activeNav');
  //  get identify data from state
  let Mapinfo = store.getStateItem('mapinfo');
  let region = store.getStateItem('region');
  let source = 'mapinfo_nfwf';
  let name = 'mapinfo_nfwf';
  if (activeNav === 'main-nav-map-searchNShubs') {
    Mapinfo = store.getStateItem('mapinfons');
    region = 'targetedwatershed';
    source = 'mapinfo_ns';
    name = 'mapinfo_ns';
  }

  const allchartdata = [];
  const statistics = Mapinfo;
  const chartdata = {
    name,
    region,
    source,
    statistics
  };
  allchartdata.push(chartdata);

  const mapinfochartdata = chartDataReformat(allchartdata);

  if (activeNav === 'main-nav-map-searchNShubs') {
    store.setStoreItem('mapinfonschartdata', mapinfochartdata);
  } else {
    store.setStoreItem('mapinfochartdata', mapinfochartdata);
  }
  const mapinfoDataReadyEvent = new CustomEvent('mapinfo-data-ready');
  window.dispatchEvent(mapinfoDataReadyEvent);
}

// prep all userareas data for charting, and dump into the state
export function formatChartData() {
  //  get user areas and uploaded shapefiles from state
  const Currentshapes = store.getStateItem('userareas');
  //  get hubs from state
  const HubIntersectionJson = store.getStateItem('HubIntersectionJson');
  //  get nature server hubs from state
  const NatureServeHubIntersectionJson = store.getStateItem('NatureServeHubIntersectionJson');
  // object to hold chart data
  const allchartdata = [];

  // get user shapes
  if (checkValidObject(Currentshapes)) {
    Object.keys(Currentshapes).forEach((currentshapekey) => {
      const name = Currentshapes[currentshapekey][0].name;
      const source = 'zonalstats';
      const statsJson = Currentshapes[currentshapekey][3].zonalstatsjson;
      const statistics = statsJson.features[0].properties.mean;
      let region = 'continental_us';

      if (statsJson.features[0].properties.region) {
        region = statsJson.features[0].properties.region.toString().trim();
      }

      const chartdata = {
        name,
        region,
        source,
        statistics
      };
      allchartdata.push(chartdata);
    });
  }

  // get hubs
  if (checkValidObject(HubIntersectionJson)) {
    HubIntersectionJson.forEach((feature) => {
      const userarea = feature;

      if (checkValidObject(userarea)) {
        const name = feature.properties.mean.TARGET_FID.toString().trim();
        const source = 'nfwf_hubs';
        let region = 'continental_us';
        const statistics = feature.properties.mean;

        // make region exists it will not exist in old data
        if (feature.properties.region) {
          region = feature.properties.region.toString().trim();
        }

        const chartdata = {
          name,
          region,
          source,
          statistics
        };
        allchartdata.push(chartdata);
      }
    });
  }

  // get nature serve hubs
  if (checkValidObject(NatureServeHubIntersectionJson)) {
    NatureServeHubIntersectionJson.forEach((feature) => {
      const userarea = feature;

      if (checkValidObject(userarea)) {
        const name = feature.properties.mean.TARGET_FID.toString().trim();
        const source = 'natureserve_hubs';
        let region = 'targetedwatershed';
        const statistics = feature.properties.mean;

        // make region exists it will not exist in old data
        if (feature.properties.region) {
          region = feature.properties.region.toString().trim();
        }

        const chartdata = {
          name,
          region,
          source,
          statistics
        };
        allchartdata.push(chartdata);
      }
    });
  }

  const configchartdata = chartDataReformat(allchartdata);
  store.setStoreItem('configchartdata', configchartdata);
}

// chartjs axis label function to wrap text, labels are too ling
function chartjsWrapTextLabel(label) {
  if (/\s/.test(label)) {
    return label.split(' ');
  }
  return label;
}

// custom chartjs y axis labels high to low
function chartjsYLabels(value, index, values) {
  let label = '';
  switch (value) {
    case 0:
      label = 'Low';
      break;
    case 50:
      label = '';
      break;
    case 100:
      label = 'High';
      break;
    default:
      label = '';
  }
  return label;
}

// custom charths tool tip label chart values are percent of total so
// users can compare the actual values are not percents this makes
// the tooltip the actual value
function chartjsCustomToolTipLabel(chartdata) {
  return (tooltipItem, data) => chartdata[0].hovervalues[tooltipItem.index];
}

// custom chartjs tool tip this needs work later
function chartjsCustomToolTip(tooltipModel) {
  // Tooltip Element
  let tooltipEl = document.getElementById('chartjs-tooltip');

  // Create element on first render
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'chartjs-tooltip';
    tooltipEl.innerHTML = '<table></table>';
    document.body.appendChild(tooltipEl);
  }

  // Set caret Position
  tooltipEl.classList.add('above');

  // Hide if no tooltip
  if (tooltipModel.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  function getBody(bodyItem) {
    return bodyItem.lines;
  }

  // Set Text
  if (tooltipModel.body) {
    const titleLines = tooltipModel.title || [];
    const bodyLines = tooltipModel.body.map(getBody);
    let innerHtml = '<thead>';

    titleLines.forEach((title) => {
      innerHtml += `<tr><th>${title}</th></tr>`;
    });
    innerHtml += '</thead><tbody class="w-100">';

    bodyLines.forEach((body, i) => {
      const span = '<span class="chartjs-tooltip-body-text text-center justify-content-center align-items-center align-self-center w-100"></span>';
      innerHtml += `<tr class="w-100"><td class="w-100">${span}${body}</td></tr>`;
    });
    innerHtml += '</tbody>';

    const tableRoot = tooltipEl.querySelector('table');
    tableRoot.innerHTML = innerHtml;
  }

  // `this` will be the overall tooltip
  const position = this._chart.canvas.getBoundingClientRect();

  // Display, position, and set styles for font

  tooltipEl.style.backgroundColor = tooltipModel.backgroundColor;
  tooltipEl.style.color = tooltipModel.bodyFontColor;

  // tooltip.style
  const accountForFontSize = 12;
  tooltipEl.style.opacity = 1;
  tooltipEl.style.position = 'absolute';
  tooltipEl.style.caretSize = 5;
  tooltipEl.style.left = `${(position.left + tooltipModel.caretX) - (tooltipModel.width / 2)}px`;
  tooltipEl.style.top = `${position.top - tooltipModel.height - (tooltipModel.yPadding * 2) - (accountForFontSize) - tooltipEl.style.caretSize + tooltipModel.caretY}px`;
  tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
  tooltipEl.style.fontSize = `${tooltipModel.bodyFontSize}px`;
  tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
  tooltipEl.style.padding = `${tooltipModel.yPadding}px`;
  tooltipEl.style.zIndex = 4444;
  tooltipEl.style.pointerEvents = 'none';
}

// function to create charts using chart.js
export function makeBasicBarChart(wrapper, selector, chartdata) {
  const fontDarkColor = '#1c1c20';
  const fontLightColor = '#e9ecef';
  const backgroundDarkColor = '#1c1c20';
  const backgroundLightColor = '#e9ecef';
  const backgroundSecondaryColor = '#999';
  const chartFontFamily = 'Roboto';
  const chartFontSize = 10;

  // escape error when chart selector not found
  if (!wrapper.querySelector(selector)) {
    // console.log(`Chart with selector ${selector} not found!`)
    return null;
  }
  // probably need to pagging next ten etc
  return new Chart(wrapper.querySelector(selector), {
    type: 'bar',
    data: {
      labels: chartdata[0].labels,
      datasets: [
        {
          label: chartdata[0].groupname,
          backgroundColor: chartdata[0].colors,
          hoverBackgroundColor: chartdata[0].colors,
          data: chartdata[0].values
        }
      ]
    },
    options: {
      scales: {
        xAxes: [{
          gridLines: {
            drawBorder: true,
            drawTicks: false,
            color: backgroundDarkColor,
            lineWidth: 0.0,
            zeroLineWidth: 1.5,
            zeroLineColor: backgroundSecondaryColor,
            borderDash: [5, 5]
          },
          ticks: {
            reverse: false,
            fontColor: fontLightColor,
            fontSize: chartFontSize,
            color: backgroundLightColor,
            lineWidth: 0.25,
            borderDash: [2, 2],
            padding: 5,
            maxRotation: 0,
            minRotation: 0,
            callback: chartjsWrapTextLabel
          }
        }],
        yAxes: [{
          gridLines: {
            beginAtZero: true,
            display: true,
            drawTicks: false,
            color: backgroundSecondaryColor,
            lineWidth: 0.25,
            zeroLineWidth: 1.5,
            zeroLineColor: backgroundSecondaryColor,
            borderDash: [2, 2]
          },
          ticks: {
            fontColor: fontLightColor,
            reverse: false,
            padding: 5,
            stepSize: 25,
            min: 0,
            max: 100,
            callback: chartjsYLabels
          }
        }]
      },
      responsive: true,
      maintainAspectRatio: false,
      fontFamily: chartFontFamily,
      legend: { display: false },
      title: {
        display: false,
        text: chartdata[0].groupname
      },
      tooltips: {
        backgroundColor: backgroundLightColor,
        titleFontColor: fontDarkColor,
        bodyFontColor: fontDarkColor,
        displayColors: false,
        enabled: false,
        titleAlign: 'center',
        bodyAlign: 'center',
        bodyFontFamily: chartFontFamily,
        fontFamily: chartFontFamily,
        yAlign: 'bottom',
        xAlign: 'center',
        callbacks: {
          label: chartjsCustomToolTipLabel(chartdata)
          // title: () => {}
        },
        // uncomment later once I can work on this. position of tip is off.
        custom: chartjsCustomToolTip
      }
    }
  });
}

// add google event tags for downloads.
export function addDownloadGoogleEvents() {
  const downloadIds = [
    'download-conus-data',
    'download-conus-report',
    'download-puerto-rico-data-eng',
    'download-puerto-rico-data-esp',
    'download-puerto-rico-report',
    'download-virgin-islands-data',
    'download-virgin-islands-repoprt',
    'download-northern-mariana-islands-data',
    'download-northern-mariana-islands-report',
    'download-american_samoa-data',
    'download-alaska-data',
    'download-guam-data',
    'download-guam-report',
    'download-american_samoa-report',
    'download-american_alaska-report',
    'download-regional-report',
    'download-cape-fear-data',
    'download-charleston-harbor-data',
    'download-download-delaware-bay-data',
    'download-narragansett-bay-data',
    'download-portland-maine-data',
    'download-san-francisco-bay-data'
  ];

  downloadIds.forEach((id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.addEventListener('click', (ev) => {
        // ga event action, category, label
        googleAnalyticsEvent('click', 'downloads', id);
      });
    }
  });

  const watersheds = [
    'landingpage-btn-conus',
    'landingpage-btn-northern_mariana_islands',
    'landingpage-btn-american_samoa',
    'landingpage-btn-american_alaska',
    'landingpage-btn-guam',
    'landingpage-btn-puerto_rico',
    'landingpage-btn-us_virgin_islands',
    'landingpage-btn-hawaii',
    'landingpage-not-sure',
    'landingpage-analyze-projets',
    'landingpage-search-hubs',
    'landingpage-download-reports',
    'landingpage-about'
  ];

  watersheds.forEach((id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.addEventListener('click', (ev) => {
        // ga event action, category, label
        googleAnalyticsEvent('click', 'landingpage', id);
      });
    }
  });
}

// set stateitems if they do not exist
// we will have to any new ones if added.
// this will help when we adding new statitems "breaks" the webpage
export function addMissingStateItems() {
  // check for base map default is DarkGray
  if (!checkValidObject(store.getStateItem('basemap'))) {
    store.setStoreItem('basemap', 'DarkGray');
  }

  if (!checkValidObject(store.getStateItem('uuid'))) {
    store.setStoreItem('uuid', uuid());
  }

  // check for lastaction default is moveend
  if (!checkValidObject(store.getStateItem('lastaction'))) {
    store.setStoreItem('lastaction', 'moveend');
  }

  // check for mapCenter default is {lat: 32.7765, lng: -79.9311} (charleston for now)
  if (!checkValidObject(store.getStateItem('mapCenter'))) {
    store.setStoreItem('mapCenter', { lat: 36.27970720524017, lng: -95.05371093750001 });
  }

  // check for mapLayerDisplayStatus default is listed below
  // to long to list again
  if (!checkValidObject(store.getStateItem('mapLayerDisplayStatus'))) {
    store.setStoreItem('mapLayerDisplayStatus', {
      CONUS_HubsTMS: true,
      NS_HubsTMS: true,
      CONUS_ExposureTMS: false,
      NS_ExposureTMS: false,
      CONUS_AssetsTMS: false,
      NS_AssetsTMS: false,
      CONUS_ThreatsTMS: false,
      NS_ThreatsTMS: false,
      CONUS_AquaticTMS: false,
      CONUS_TerrestrialTMS: false,
      NSFishAndWildlifeTMS: false,
      CONUS_PopDensityTMS: false,
      CONUS_SocVulnTMS: false,
      CONUS_CriticalFacilitiesTMS: false,
      CONUS_CriticalInfrastructureTMS: false,
      CONUS_DraingeTMS: false,
      CONUS_ErosionTMS: false,
      CONUS_SLRTMS: false,
      CONUS_StormSurgeTMS: false,
      CONUS_GeoStressTMS: false,
      CONUS_SlopeTMS: false,
      CONUS_FloodProneAreasTMS: false,
      CONUS_FishAndWildlifeTMS: false,

      HI_HubsTMS: true,
      HI_ExposureTMS: false,
      HI_AssetsTMS: false,
      HI_ThreatsTMS: false,
      HI_AquaticTMS: false,
      HI_TerrestrialTMS: false,
      HI_PopDensityTMS: false,
      HI_SocVulnTMS: false,
      HI_CriticalFacilitiesTMS: false,
      HI_CriticalInfrastructureTMS: false,
      HI_DraingeTMS: false,
      HI_ErosionTMS: false,
      HI_SLRTMS: false,
      HI_StormSurgeTMS: false,
      HI_GeoStressTMS: false,
      HI_SlopeTMS: false,
      HI_FloodProneAreasTMS: false,
      HI_FishAndWildlifeTMS: false,
      HI_LandslideIndexTiles: false,
      HI_TsunamiIndexTiles: false,

      PR_HubsTMS: true,
      PR_ExposureTMS: false,
      PR_AssetsTMS: false,
      PR_ThreatsTMS: false,
      PR_AquaticTMS: false,
      PR_TerrestrialTMS: false,
      PR_PopDensityTMS: false,
      PR_SocVulnTMS: false,
      PR_CriticalFacilitiesTMS: false,
      PR_CriticalInfrastructureTMS: false,
      PR_DraingeTMS: false,
      PR_ErosionTMS: false,
      PR_SLRTMS: false,
      PR_StormSurgeTMS: false,
      PR_GeoStressTMS: false,
      PR_SlopeTMS: false,
      PR_FloodProneAreasTMS: false,
      PR_FishAndWildlifeTMS: false,
      PR_LandslideIndexTiles: false,
      PR_TsunamiIndexTiles: false,

      USVI_HubsTMS: true,
      USVI_ExposureTMS: false,
      USVI_AssetsTMS: false,
      USVI_ThreatsTMS: false,
      USVI_AquaticTMS: false,
      USVI_TerrestrialTMS: false,
      USVI_PopDensityTMS: false,
      USVI_SocVulnTMS: false,
      USVI_CriticalFacilitiesTMS: false,
      USVI_CriticalInfrastructureTMS: false,
      USVI_DraingeTMS: false,
      USVI_ErosionTMS: false,
      USVI_SLRTMS: false,
      USVI_StormSurgeTMS: false,
      USVI_GeoStressTMS: false,
      USVI_SlopeTMS: false,
      USVI_FloodProneAreasTMS: false,
      USVI_FishAndWildlifeTMS: false,

      CNMI_HubsTMS: true,
      CNMI_ExposureTMS: false,
      CNMI_AssetsTMS: false,
      CNMI_ThreatsTMS: false,
      CNMI_AquaticTMS: false,
      CNMI_TerrestrialTMS: false,
      CNMI_PopDensityTMS: false,
      CNMI_SocVulnTMS: false,
      CNMI_CriticalFacilitiesTMS: false,
      CNMI_CriticalInfrastructureTMS: false,
      CNMI_DraingeTMS: false,
      CNMI_ErosionTMS: false,
      CNMI_SLRTMS: false,
      CNMI_StormSurgeTMS: false,
      CNMI_GeoStressTMS: false,
      CNMI_SlopeTMS: false,
      CNMI_FloodProneAreasTMS: false,
      CNMI_FishAndWildlifeTMS: false,

      AS_HubsTMS: true,
      AS_HubsHexTMS: false,
      AS_ExposureTMS: false,
      AS_AssetsTMS: false,
      AS_ThreatsTMS: false,
      AS_AquaticTMS: false,
      AS_TerrestrialTMS: false,
      AS_PopDensityTMS: false,
      AS_SocVulnTMS: false,
      AS_CriticalFacilitiesTMS: false,
      AS_CriticalInfrastructureTMS: false,
      AS_DraingeTMS: false,
      AS_ErosionTMS: false,
      AS_SLRTMS: false,
      AS_WaveDrivenFloodingIndexTiles: false,
      AS_GeoStressTMS: false,
      AS_SlopeTMS: false,
      AS_TsunamiIndexTiles: false,
      AS_FishAndWildlifeTMS: false,

      GU_HubsTMS: true,
      GU_HubsHexTMS: false,
      GU_ExposureTMS: false,
      GU_AssetsTMS: false,
      GU_ThreatsTMS: false,
      GU_AquaticTMS: false,
      GU_TerrestrialTMS: false,
      GU_PopDensityTMS: false,
      GU_SocVulnTMS: false,
      GU_CriticalFacilitiesTMS: false,
      GU_CriticalInfrastructureTMS: false,
      GU_DraingeTMS: false,
      GU_ErosionTMS: false,
      GU_SLRTMS: false,
      GU_WaveDrivenFloodingIndexTiles: false,
      GU_GeoStressTMS: false,
      GU_SlopeTMS: false,
      GU_TsunamiIndexTiles: false,
      GU_FishAndWildlifeTMS: false,
      GU_WaveExposureTiles: false,
      GU_LandslideIndexTiles: false,

      AK_HubsTMS: true,
      AK_HubsHexTMS: false,
      AK_ExposureTMS: false,
      AK_AssetsTMS: false,
      AK_ThreatsTMS: false,
      AK_WildlifeTMS: false,
      AK_AquaticTMS: false,
      AK_TerrestrialTMS: false,
      AK_SocVulnTMS: false,
      AK_CriticalFacilitiesTMS: false,
      AK_CommunityInfrastructureTMS: false,
      AK_TransporationInfrastructureTMS: false,
      AK_ErosionTMS: false,
      AK_FloodProneTMS: false,
      AK_TsunamiTiles: false,
      AK_PermaFrostTMS: false,
      AK_LowLyingAreasTMS: false,
    });
  }

  // check for maplayerlist default is open
  if (!checkValidObject(store.getStateItem('maplayerlist'))) {
    if (window.screen.availWidth < 769) {
      store.setStoreItem('maplayerlist', 'close');
    } else {
      store.setStoreItem('maplayerlist', 'open');
    }
  }

  // check for region default is conus
  if (!checkValidObject(store.getStateItem('region'))) {
    store.setStoreItem('region', 'continental_us');
  }


  // check for userareacount default is 0
  if (!checkValidObject(store.getStateItem('userareacount'))) {
    store.setStoreItem('userareacount', 0);
  }

  // check for mapCenter default is {lat: 32.7765, lng: -79.9311} (charleston for now)
  if (!checkValidObject(store.getStateItem('mapZoom'))) {
    store.setStoreItem('mapZoom', 4);
  }

  // check for activeNav default is main-nav-map
  if (!checkValidObject(store.getStateItem('activeNav'))) {
    store.setStoreItem('activeNav', 'main-nav-map');
  }

  // check for aboutNav default is about-nav-aboutgen
  if (!checkValidObject(store.getStateItem('aboutNav'))) {
    store.setStoreItem('aboutNav', 'about-nav-aboutgen');
  }

  // check for savedshapes default is {} NULL object
  if (!checkValidObject(store.getStateItem('savedshapes'))) {
    store.setStoreItem('savedshapes', {});
  }

  // check for userarea default is {} NULL object
  if (!checkValidObject(store.getStateItem('userarea'))) {
    store.setStoreItem('userarea', {});
  }

  // check for userareas default is {} NULL object
  if (!checkValidObject(store.getStateItem('userareas'))) {
    store.setStoreItem('userareas', {});
  }

  // check for userarea_buffered default is {} NULL object
  if (!checkValidObject(store.getStateItem('userarea_buffered'))) {
    store.setStoreItem('userarea_buffered', {});
  }

  // check for zonalstatsjson default is {} NULL object
  if (!checkValidObject(store.getStateItem('zonalstatsjson'))) {
    store.setStoreItem('zonalstatsjson', {});
  }

  // check for working_basemap default is false
  if (!checkValidObject(store.getStateItem('working_basemap'))) {
    store.setStoreItem('working_basemap', false);
  }

  // check for working_mapinfo default is false
  if (!checkValidObject(store.getStateItem('working_mapinfo'))) {
    store.setStoreItem('working_mapinfo', false);
  }

  // check for working_mapinfo default is false
  if (!checkValidObject(store.getStateItem('working_zonalstats'))) {
    store.setStoreItem('working_zonalstats', false);
  }

  // check for working_s3retreive default is false
  if (!checkValidObject(store.getStateItem('working_s3retreive'))) {
    store.setStoreItem('working_s3retreive', false);
  }

  // check for working_search default is false
  if (!checkValidObject(store.getStateItem('working_search'))) {
    store.setStoreItem('working_search', false);
  }

  // check for working_s3save default is false
  if (!checkValidObject(store.getStateItem('working_s3save'))) {
    store.setStoreItem('working_s3save', false);
  }

  // check for working_drawlayers default is false
  if (!checkValidObject(store.getStateItem('working_drawlayers'))) {
    store.setStoreItem('working_drawlayers', false);
  }

  // check for zonalactive default is false
  if (!checkValidObject(store.getStateItem('zonalactive'))) {
    store.setStoreItem('zonalactive', ['none', 'none']);
  }
}

// randomly ask user for feedaback and display a link for a google form
// will open and modal form with a link to a google form https://forms.gle/21PPCSobQCGN7m157
export function askForHelp() {
  const start = 0;
  const end = 5;
  const shouldIAsk = Math.floor((Math.random() * end) + start);
  if (!shouldIAsk) {
    // is zero ask for help
    const componentElem = document.getElementById('askforhelp-holder');
    componentElem.innerHTML = AskForHelpPage;
    $(() => {
      $('#askForHelpModal').modal('show');
    });
  }
}
