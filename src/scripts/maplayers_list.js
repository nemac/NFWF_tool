// default map template
import maplayersListTemplate from '../templates/maplayers_list.html';

import { Component } from './components';
import { mapConfig } from '../config/mapConfig';
import { Store } from './store';

// scss
import '../css/maplayers_list.scss';

import {
  googleAnalyticsEvent,
  numberToWord,
  getLegendHtml
} from './utilitys';

const store = new Store({});
// required for bootstrap
window.$ = require('jquery');
// required for tooltip, popup...
window.Popper = require('popper.js');

window.jQuery = window.$;

/**
 * MapLayersList Component
 * Render and control map layer control
 */
export class MapLayersList extends Component {
  constructor(placeholderId, props) {
    super(placeholderId, props, maplayersListTemplate);

    const { WMSLayers } = mapConfig;
    const { TMSLayers } = mapConfig;
    const { zoomRegions } = mapConfig;

    MapLayersList.addToggleMapLayerListener();

    // Add a toggle button for each layer
    WMSLayers.forEach((layerProps) => { this.updateMapLayer(layerProps); });
    TMSLayers.forEach((layerProps) => { this.updateMapLayer(layerProps); });
    TMSLayers.forEach((layerProps) => { MapLayersList.addLegendHTML(layerProps); });

    MapLayersList.ListHolderToggle();
    MapLayersList.ToggleLayerListToggle();
    MapLayersList.mapListToggleToggle();

    MapLayersList.addBaseMapListeners(props.mapComponent);
    MapLayersList.addZoomregionListeners(props.mapComponent, zoomRegions);
    MapLayersList.zoomRegionQuickLinkListener(props.mapComponent, zoomRegions);

    MapLayersList.addLegendListeners();

    this.LayerDescriptionTemplate = '<div class="tooltip layerlist" role="popover">' +
              '  <div class="arrow"></div><div class="tooltip-inner"></div>' +
              '  <div class="close-layerlist"><i class="fa fa-times" aria-hidden="true"></i></div>' +
              '</div>';

    MapLayersList.addToolTipListners();
    MapLayersList.resizeMapList();
    window.addEventListener('resize', MapLayersList.resizeMapList);

    window.addEventListener('aboutNavChange', (e) => {
      const activeNav = store.getStateItem('activeNav');
      const defaultLayerList = document.getElementById('defaultLayerList');
      const nsLayerList = document.getElementById('NS_LayerList');
      const btnZoomRegion = document.getElementById('btn-zoomregion');

      if (activeNav === 'main-nav-map-searchNShubs') {
        defaultLayerList.classList.add('d-none');
        nsLayerList.classList.remove('d-none');
        btnZoomRegion.classList.add('d-none');
      } else {
        defaultLayerList.classList.remove('d-none');
        nsLayerList.classList.add('d-none');
        btnZoomRegion.classList.remove('d-none');
      }
    });

    // change region is state changes
    window.addEventListener('regionChanged', (e) => {
      MapLayersList.toggleRegionLayerList();
      MapLayersList.toggleRegionsLayers(props.mapComponent);
    });

    // run at startup to capture region in current state
    MapLayersList.toggleRegionLayerList();
  }

  // tooltip and popover require javascript side modification to enable them (new in Bootstrap 4)
  // use tooltip and popover components everywhere
  // initalize new tooltips
  static addToolTipListners() {
    $(() => {
      $('#maplayers_list [data-toggle="popover"]').popover();
    });
  }

  // if parent is tooltip get id so we can hide it.
  static ParentTooltip(target, id) {
    for (let p = target && target.parentElement; p; p = p.parentElement) {
      if (p.id.substring(0, 7) === id) { return p; }
    }
    return null;
  }

  static resizeMapList() {
    const offset = 220;
    if (window.innerHeight < 1024) {
      document.querySelector('#maplayers_list-holder').style.maxHeight = `${window.innerHeight - offset}px`;
      document.querySelector('#maplayers_list-holder').style.height = `${window.innerHeight - offset}px`;
      document.querySelector('#maplayers_list').style.maxHeight = `${window.innerHeight - offset}px`;
      document.querySelector('#maplayers_list').style.height = `${window.innerHeight - offset}px`;
    } else {
      document.querySelector('#maplayers_list-holder').style.maxHeight = 'none';
      document.querySelector('#maplayers_list-holder').style.height = 'none';
      document.querySelector('#maplayers_list').style.maxHeight = 'none';
      document.querySelector('#maplayers_list').style.height = 'none';
    }

    document.querySelector('#maplayers_list-holder').style.maxHeight = `${window.innerHeight - offset}px`;
    document.querySelector('#maplayers_list').style.maxHeight = `${window.innerHeight - offset}px`;
  }

  static toggleRegionsLayers(mapComponent) {
    // get the region
    const region = store.getStateItem('region');
    const activeNav = store.getStateItem('activeNav');

    // make sure region list are not displaying when targetedwatershed Nature Server data
    // nav is current location
    if (activeNav === 'main-nav-map-searchNShubs') {
      return null;
    }

    // get the layer list from the config file
    const { TMSLayers } = mapConfig;
    const layers = store.getStateItem('mapLayerDisplayStatus');

    // filter the layers based on current source
    Object.keys(layers).forEach((layer) => {
      const asource = TMSLayers.filter(TMSlayer => (
        TMSlayer.id === layer && TMSlayer.region === region
      ));

      // layer is on and not part of the tabs data so it needs to be off
      if (layers[layer] && asource.length === 0) {
        mapComponent.toggleVisLayerOff(layer);
      }

      // layer is on IS part of the tabs data os it needs to be on
      if (layers[layer] && asource.length > 0) {
        mapComponent.toggleVisLayerOn(layer);
      }
    });

    return null;
  }

  static zoomRegionQuickLinkListener(mapComponent, zoomRegions) {
    window.addEventListener('zoomRegionQuikLink', (e) => {
      const region = store.getStateItem('region');
      const regionInfo = zoomRegions.filter(regions => regions.region === region);
      MapLayersList.zoomToRegion(mapComponent, regionInfo[0]);
    });
  }

  static addZoomregionListeners(mapComponent, zoomRegions) {
    const btnzoomregionElem = document.getElementById('btn-zoomregion');
    if (btnzoomregionElem) {
      btnzoomregionElem.addEventListener('click', (e) => { MapLayersList.zoomRegionListToggle(e); });
    }

    const btnzoomregionList = document.getElementById('zoomregionlist');
    if (btnzoomregionList) {
      btnzoomregionList.addEventListener('click', (e) => { MapLayersList.zoomRegionListToggle(e); });
    }

    document.getElementById('zoomregion-cus').addEventListener('click', (e) => {
      const region = zoomRegions.filter(regions => regions.region === 'continental_us');
      MapLayersList.zoomToRegion(mapComponent, region[0]);
      MapLayersList.updateZoomRegionLabel('Contiental U.S.');

      // set region to conus
      store.setStoreItem('region', 'continental_us');
      const navChangeEvent = new CustomEvent('regionChanged');
      window.dispatchEvent(navChangeEvent);

      // ga event action, category, label
      googleAnalyticsEvent('click', 'zoomregion', 'continental_us');
    });

    document.getElementById('zoomregion-pr').addEventListener('click', (e) => {
      const region = zoomRegions.filter(regions => regions.region === 'puerto_rico');
      MapLayersList.zoomToRegion(mapComponent, region[0]);
      MapLayersList.updateZoomRegionLabel('Puerto Rico');

      // set region to puerto_rico
      store.setStoreItem('region', 'puerto_rico');
      const navChangeEvent = new CustomEvent('regionChanged');
      window.dispatchEvent(navChangeEvent);

      // ga event action, category, label
      googleAnalyticsEvent('click', 'zoomregion', 'puerto_rico');
    });

    document.getElementById('zoomregion-uvi').addEventListener('click', (e) => {
      const region = zoomRegions.filter(regions => regions.region === 'us_virgin_islands');
      MapLayersList.zoomToRegion(mapComponent, region[0]);
      MapLayersList.updateZoomRegionLabel('US Virgin Islands');

      // set region to US Virgin Islands
      store.setStoreItem('region', 'us_virgin_islands');
      const navChangeEvent = new CustomEvent('regionChanged');
      window.dispatchEvent(navChangeEvent);

      // ga event action, category, label
      googleAnalyticsEvent('click', 'zoomregion', 'us_virgin_islands');
    });

    document.getElementById('zoomregion-cnmi').addEventListener('click', (e) => {
      const region = zoomRegions.filter(regions => regions.region === 'northern_mariana_islands');
      MapLayersList.zoomToRegion(mapComponent, region[0]);
      MapLayersList.updateZoomRegionLabel('Northern Mariana Islands');

      // set region to US Northern Mariana Islands
      store.setStoreItem('region', 'northern_mariana_islands');
      const navChangeEvent = new CustomEvent('regionChanged');
      window.dispatchEvent(navChangeEvent);

      // ga event action, category, label
      googleAnalyticsEvent('click', 'zoomregion', 'northern_mariana_islands');
    });

    // document.getElementById('zoomregion-as').addEventListener('click', (e) => {
    //   const region = zoomRegions.filter(regions => regions.region === 'american_samoa');
    //   MapLayersList.zoomToRegion(mapComponent, region[0]);
    //   MapLayersList.updateZoomRegionLabel('American Samoa');
    //
    //   // set region to US American Somoa
    //   store.setStoreItem('region', 'american_samoa');
    //   const navChangeEvent = new CustomEvent('regionChanged');
    //   window.dispatchEvent(navChangeEvent);
    //
    //   // ga event action, category, label
    //   googleAnalyticsEvent('click', 'zoomregion', 'american_samoa');
    // });

    document.getElementById('zoomregion-guam').addEventListener('click', (e) => {
      const region = zoomRegions.filter(regions => regions.region === 'guam');
      MapLayersList.zoomToRegion(mapComponent, region[0]);
      MapLayersList.updateZoomRegionLabel('Guam');

      // set region to US Guam
      store.setStoreItem('region', 'guam');
      const navChangeEvent = new CustomEvent('regionChanged');
      window.dispatchEvent(navChangeEvent);

      // ga event action, category, label
      googleAnalyticsEvent('click', 'zoomregion', 'guam');
    });

    // document.getElementById('zoomregion-alaska').addEventListener('click', (e) => {
    //   const region = zoomRegions.filter(regions => regions.region === 'alaska');
    //   MapLayersList.zoomToRegion(mapComponent, region[0]);
    //   MapLayersList.updateZoomRegionLabel('alaska');
    //   const navChangeEvent = new CustomEvent('regionChanged');
    //    window.dispatchEvent(navChangeEvent);
    //
    // set region to alaska
    // store.setStoreItem('region', 'alaska');
    //
    //   // ga event action, category, label
    //   googleAnalyticsEvent('click', 'zoomregion', 'alaska');
    // });
    //
    document.getElementById('zoomregion-hawaii').addEventListener('click', (e) => {
      const region = zoomRegions.filter(regions => regions.region === 'hawaii');
      MapLayersList.zoomToRegion(mapComponent, region[0]);
      MapLayersList.updateZoomRegionLabel('Hawai\'i');

      // set region to hawaii
      store.setStoreItem('region', 'hawaii');

      const navChangeEvent = new CustomEvent('regionChanged');
      window.dispatchEvent(navChangeEvent);

      // ga event action, category, label
      googleAnalyticsEvent('click', 'zoomregion', 'hawaii');
    });
  }

  // zppm to region
  static zoomToRegion(mapComponent, region) {
    mapComponent.map.setView({ lat: region.center[0], lng: region.center[1] }, region.zoom);
  }

  static addBaseMapListeners(mapComponent) {
    document.getElementById('basemap-DarkGray').addEventListener('click', (e) => {
      mapComponent.changeBaseMap('DarkGray');
      MapLayersList.updateBaseMapLabel('Dark Gray');
      // ga event action, category, label
      googleAnalyticsEvent('click', 'basemap', 'Dark Gray');
    });

    document.getElementById('basemap-Imagery').addEventListener('click', (e) => {
      mapComponent.changeBaseMap('Imagery');
      MapLayersList.updateBaseMapLabel('Imagery');
      // ga event action, category, label
      googleAnalyticsEvent('click', 'basemap', 'Imagery Gray');
    });

    document.getElementById('basemap-Topographic').addEventListener('click', (e) => {
      mapComponent.changeBaseMap('Topographic');
      MapLayersList.updateBaseMapLabel('Topographic');
      // ga event action, category, label
      googleAnalyticsEvent('click', 'basemap', 'Topographic');
    });

    document.getElementById('basemap-Streets').addEventListener('click', (e) => {
      mapComponent.changeBaseMap('Streets');
      MapLayersList.updateBaseMapLabel('Streets');
      // ga event action, category, label
      googleAnalyticsEvent('click', 'basemap', 'Streets');
    });

    const btnBaseMapElem = document.getElementById('btn-basemap');
    if (btnBaseMapElem) {
      btnBaseMapElem.addEventListener('click', (e) => { MapLayersList.baseMapListToggle(e); });
    }

    const btnBaseMapList = document.getElementById('basemaplist');
    if (btnBaseMapList) {
      btnBaseMapList.addEventListener('click', (e) => { MapLayersList.baseMapListToggle(e); });
    }
  }

  // toggle layer list for regions conus, pr, usvi, cnmi, alaska...
  static toggleRegionLayerList() {
    // get region state
    const region = store.getStateItem('region');
    const activeNav = store.getStateItem('activeNav');
    const defaultLayerList = document.getElementById('defaultLayerList');
    const puertoRicoLayerList = document.getElementById('puertoRicoLayerList');
    const usVirginIslandsLayerList = document.getElementById('usVirginIslandsLayerList');
    const northernMarianaIslandsLayerList = document.getElementById('northernMarianaIslandsLayerList');
    const americanSamoaLayerList = document.getElementById('americanSamoaLayerList');
    const guamLayerList = document.getElementById('guamLayerList');
    const hawaiiLayerList = document.getElementById('hawaiiLayerList');

    // make sure region list are not displaying when targetedwatershed Nature Server data
    // nav is current location
    if (activeNav === 'main-nav-map-searchNShubs') {
      defaultLayerList.classList.add('d-none');
      puertoRicoLayerList.classList.add('d-none');
      usVirginIslandsLayerList.classList.add('d-none');
      northernMarianaIslandsLayerList.classList.add('d-none');
      americanSamoaLayerList.classList.add('d-none');
      hawaiiLayerList.classList.add('d-none');
      guamLayerList.classList.add('d-none');
      return null;
    }

    switch (region) {
      case 'continental_us':
        defaultLayerList.classList.remove('d-none');
        puertoRicoLayerList.classList.add('d-none');
        usVirginIslandsLayerList.classList.add('d-none');
        northernMarianaIslandsLayerList.classList.add('d-none');
        americanSamoaLayerList.classList.add('d-none');
        hawaiiLayerList.classList.add('d-none');
        guamLayerList.classList.add('d-none');
        MapLayersList.updateZoomRegionLabel('Contiental U.S.');
        break;
      case 'puerto_rico':
        defaultLayerList.classList.add('d-none');
        puertoRicoLayerList.classList.remove('d-none');
        usVirginIslandsLayerList.classList.add('d-none');
        northernMarianaIslandsLayerList.classList.add('d-none');
        americanSamoaLayerList.classList.add('d-none');
        hawaiiLayerList.classList.add('d-none');
        guamLayerList.classList.add('d-none');
        MapLayersList.updateZoomRegionLabel('Puerto Rico');
        break;
      case 'northern_mariana_islands':
        defaultLayerList.classList.add('d-none');
        puertoRicoLayerList.classList.add('d-none');
        usVirginIslandsLayerList.classList.add('d-none');
        northernMarianaIslandsLayerList.classList.remove('d-none');
        americanSamoaLayerList.classList.add('d-none');
        hawaiiLayerList.classList.add('d-none');
        guamLayerList.classList.add('d-none');
        MapLayersList.updateZoomRegionLabel('Northern Mariana Islands');
        break;
      case 'us_virgin_islands':
        defaultLayerList.classList.add('d-none');
        puertoRicoLayerList.classList.add('d-none');
        usVirginIslandsLayerList.classList.remove('d-none');
        northernMarianaIslandsLayerList.classList.add('d-none');
        americanSamoaLayerList.classList.add('d-none');
        hawaiiLayerList.classList.add('d-none');
        guamLayerList.classList.add('d-none');
        MapLayersList.updateZoomRegionLabel('US Virgin Islands');
        break;
      case 'american_samoa':
        defaultLayerList.classList.add('d-none');
        puertoRicoLayerList.classList.add('d-none');
        usVirginIslandsLayerList.classList.add('d-none');
        northernMarianaIslandsLayerList.classList.add('d-none');
        americanSamoaLayerList.classList.remove('d-none');
        hawaiiLayerList.classList.add('d-none');
        guamLayerList.classList.add('d-none');
        MapLayersList.updateZoomRegionLabel('American Samoa');
        break;
      case 'alaska':
        MapLayersList.updateZoomRegionLabel('Alaska');
        break;
      case 'hawaii':
        defaultLayerList.classList.add('d-none');
        puertoRicoLayerList.classList.add('d-none');
        usVirginIslandsLayerList.classList.add('d-none');
        northernMarianaIslandsLayerList.classList.add('d-none');
        americanSamoaLayerList.classList.add('d-none');
        hawaiiLayerList.classList.remove('d-none');
        guamLayerList.classList.add('d-none');
        MapLayersList.updateZoomRegionLabel('Hawai\'i');
        break;
      case 'guam':
        defaultLayerList.classList.add('d-none');
        puertoRicoLayerList.classList.add('d-none');
        usVirginIslandsLayerList.classList.add('d-none');
        northernMarianaIslandsLayerList.classList.add('d-none');
        americanSamoaLayerList.classList.add('d-none');
        hawaiiLayerList.classList.add('d-none');
        guamLayerList.classList.remove('d-none');
        MapLayersList.updateZoomRegionLabel('Guam');
        break;
      default:
        defaultLayerList.classList.remove('d-none');
        puertoRicoLayerList.classList.add('d-none');
        usVirginIslandsLayerList.classList.add('d-none');
        northernMarianaIslandsLayerList.classList.add('d-none');
        americanSamoaLayerList.classList.add('d-none');
        hawaiiLayerList.classList.add('d-none');
        guamLayerList.classList.add('d-none');
        MapLayersList.updateZoomRegionLabel('Contiental U.S.');
        break;
    }

    return null;
  }

  static updateBaseMapLabel(basemapname) {
    const labelElem = document.getElementById('btn-basemap-label');
    if (labelElem) {
      labelElem.innerHTML = basemapname;
    }
  }

  static updateZoomRegionLabel(basemapname) {
    const labelElem = document.getElementById('btn-zoomregion-label');
    if (labelElem) {
      labelElem.innerHTML = basemapname;
    }
  }

  // toggle basemap list on
  static baseMapListToggle(e) {
    // ga event action, category, label
    googleAnalyticsEvent('click', 'button', 'basemaplist');

    const baseMapListElem = document.getElementById('basemaplist');
    const isBaseMapListVissible = baseMapListElem.classList.contains('closed');

    if (isBaseMapListVissible) {
      baseMapListElem.classList.remove('closed');
      // baseMapListElem.classList.remove('active');
    } else {
      baseMapListElem.classList.add('closed');
      // baseMapListElem.classList.add('active');
    }
  }

  // toggle zoom region list on
  static zoomRegionListToggle(e) {
    // ga event action, category, label
    googleAnalyticsEvent('click', 'button', 'zoomregionlist');

    const zoomRegionListElem = document.getElementById('zoomregionlist');
    const iszoomRegionListVissible = zoomRegionListElem.classList.contains('closed');

    if (iszoomRegionListVissible) {
      zoomRegionListElem.classList.remove('closed');
      // baseMapListElem.classList.remove('active');
    } else {
      zoomRegionListElem.classList.add('closed');
      // baseMapListElem.classList.add('active');
    }
  }

  static toggleMapLayerListState() {
    const mapLayerListState = store.getStateItem('maplayerlist');
    if (mapLayerListState === 'open') {
      store.setStoreItem('lastaction', 'maplayerlistclose');
      store.setStoreItem('maplayerlist', 'close');
      // ga event action, category, label
      googleAnalyticsEvent('click', 'maplayerlist', 'close');
    } else {
      store.setStoreItem('lastaction', 'maplayerlistopen');
      store.setStoreItem('maplayerlist', 'open');
      // ga event action, category, label
      googleAnalyticsEvent('click', 'maplayerlist', 'open');
    }

    MapLayersList.ListHolderToggle();
    MapLayersList.ToggleLayerListToggle();
    MapLayersList.mapListToggleToggle();
  }

  static ListHolderToggle() {
    const maplayersHolder = document.getElementById('maplayers_list-holder');
    const mapLayerListState = store.getStateItem('maplayerlist');
    if (maplayersHolder) {
      if (mapLayerListState === 'open') {
        maplayersHolder.classList.add('h-70');
        maplayersHolder.classList.remove('h-0');
      } else {
        maplayersHolder.classList.remove('h-70');
        maplayersHolder.classList.add('h-0');
      }
    }
  }

  static mapListToggleToggle() {
    const mapListToggle = document.getElementById('mapListToggle');
    const mapLayerListState = store.getStateItem('maplayerlist');
    if (mapListToggle) {
      if (mapLayerListState === 'open') {
        mapListToggle.classList.add('show');
      } else {
        mapListToggle.classList.remove('show');
      }
    }
  }

  static ToggleLayerListToggle() {
    const layerList = document.getElementById('ToggleLayerList');
    const mapLayerListState = store.getStateItem('maplayerlist');
    if (layerList) {
      if (mapLayerListState === 'open') {
        layerList.classList.remove('closed');
      } else {
        layerList.classList.add('closed');
      }
    }
  }

  static removeListners() {
    const layerListClose = document.querySelector('.bnt-MapLayersListToggle');
    if (layerListClose) {
      const newLayerListClose = layerListClose.cloneNode(true);
      layerListClose.parentNode.replaceChild(newLayerListClose, layerListClose);
      return newLayerListClose;
    }
    return layerListClose;
  }

  static addToggleMapLayerListener() {
    const layerListClose = document.querySelector('.bnt-MapLayersListToggle');
    if (layerListClose) {
      // add the listener
      layerListClose.addEventListener('click', (ev) => {
        MapLayersList.toggleMapLayerListState();
      });
    }
  }

  /** Create and append new layer button DIV */
  updateMapLayer(layerProps) {
    // add listener
    this.addLayerListListener(layerProps.id, layerProps.label);

    // update label
    MapLayersList.updateLayerListName(layerProps.id, layerProps.label);
  }

  // Gets the HTML wrapper of layer controls by id
  //
  // @param id | String
  // @return DOM Element
  static getLayerWrapperFromString(id) {
    return document.getElementById(`${id}-layerToggle`);
  }

  // Gets the HTML wrapper of layer controls by child elem
  //
  // @param elem | DOM Element
  // @return DOM Element
  static getLayerWrapperFromElem(elem) {
    return elem.closest('.custom-control');
  }

  // Multiple functions need to get the wrapper but have different parameters available in their
  // closure, so this gets the wrapper based on what they have.
  //
  // @param param | String || DOM Element
  // @return DOM Element
  static getLayerWrapper(param) {
    return typeof param === 'string' ? MapLayersList.getLayerWrapperFromString(param) :
      MapLayersList.getLayerWrapperFromElem(param);
  }

  // Gets the HTML wrapper of a layers legend and description
  //
  // @param elem | DOM Element
  // @return DOM Element
  static getLegendWrapper(elem) {
    return elem.querySelector('.layer-legend');
  }

  // Gets the HTML wrapper of a layers description
  //
  // @param elem | DOM Element
  // @return DOM Element
  static getDescriptionWrapper(elem) {
    return elem.querySelector('.layer-description-text');
  }

  // Opens and closes the legend area
  //
  // @param elem | DOM Element
  static toggleLegendHtml(elem) {
    elem.classList.toggle('closed');
    elem.classList.toggle('open');
    MapLayersList.getLayerWrapper(elem).querySelector('.layer-legend-wrapper').classList.toggle('closed');
    MapLayersList.getLayerWrapper(elem).querySelector('.layer-legend-wrapper').classList.toggle('open');
  }

  // Gets the id of the legend to be used in the store
  //
  // @param elem | DOM Element
  static getLegendId(elem) {
    return `${MapLayersList.getLayerWrapper(elem).id.replace('-layerToggle', '')}-legend`;
  }

  // Adds or removes the legend from the store
  //
  // @param elem | DOM Element
  static toggleLegendState(elem) {
    const legendId = MapLayersList.getLegendId(elem);
    let legendstate = false;
    if (store.checkItem(legendId)) {
      store.removeStateItem(legendId);
      // ga event action, category, label
      googleAnalyticsEvent('click', 'maplayerlist', `close legend ${elem.id}`);
      legendstate = false;
    } else {
      // ga event action, category, label
      googleAnalyticsEvent('click', 'maplayerlist', `open legend ${elem.id}`);
      store.addStateItem(legendId, 'true');
      legendstate = true;
    }
    return legendstate;
  }

  // Opens the legend block if the legend id is in the store
  //
  // @param elem | DOM Element
  static setInitialLegendStatus(elem) {
    const legendId = MapLayersList.getLegendId(elem);
    if (store.checkItem(legendId)) {
      MapLayersList.toggleLegendHtml(elem);
    }
  }

  // Inserts the legend and layer description
  //
  // @param layerProps | Object
  static addLegendHTML(layerProps) {
    const layerElem = MapLayersList.getLayerWrapper(layerProps.id);

    if (layerElem) {
      // get the legend html based on the number of breaks supports 1-10 breaks
      MapLayersList.getLegendWrapper(layerElem).innerHTML =
          getLegendHtml(layerProps.chartLegendValues);

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
          // hide legend numbers for now will anyone notice?
          valueELem.style.color = 'transparent';

          // add classes for region, chartCSSSelector, and source in case we want to find it later
          valueELem.classList.add(layerProps.chartCSSSelector);
          valueELem.classList.add(layerProps.region);
          valueELem.classList.add(layerProps.source);
        }

        // set attributes for popups
        MapLayersList.getDescriptionWrapper(layerElem).setAttribute('data-content', layerProps.description);
        MapLayersList.getDescriptionWrapper(layerElem).setAttribute('title', layerProps.label);
        MapLayersList.setInitialLegendStatus(layerElem.getElementsByClassName('layer-legend-toggler')[0]);
      });
    }
    const legendElem = document.getElementById(`legend-${layerProps.id}`);
    if (legendElem) {
      legendElem.setAttribute('title', `Legend for ${layerProps.label}`);
      legendElem.setAttribute('aria-label', `Legend for ${layerProps.label}`);
    }

    const legendShowElem = document.getElementById(`show-legend-${layerProps.id}`);
    if (legendShowElem) {
      legendShowElem.setAttribute('title', `Show legend for ${layerProps.label}`);
      legendShowElem.setAttribute('aria-label', `Show legend for ${layerProps.label}`);
    }

    const legendHideElem = document.getElementById(`hide-legend-${layerProps.id}`);
    if (legendHideElem) {
      legendHideElem.setAttribute('title', `Hide legend for ${layerProps.label}`);
      legendHideElem.setAttribute('aria-label', `Hide legend for ${layerProps.label}`);
    }
  }

  // Handles the toggle legend button being interacted with
  // `this` is the button dom element.
  static handleLegendChange(e) {
    MapLayersList.toggleLegendHtml(this);
    MapLayersList.toggleLegendState(this);
  }

  // Adds listeners to the legend buttons
  static addLegendListeners() {
    const legendButtons = document.getElementsByClassName('layer-legend-toggler');
    let i;
    let l;
    for (i = 0, l = legendButtons.length; i < l; i += 1) {
      legendButtons[i].addEventListener('click', MapLayersList.handleLegendChange);
    }
  }

  /**
   *  update the label text from the mapConfig.js file
   *    this is an overide so we can overide the default layer list text
   *  @param { string }  layer id for selecting the dom element.
   *   @param { string }  layer iname the layers name for the label text.
   *
   */
  static updateLayerListName(layerId, layerName) {
    // get and update the layer's label
    const label = document.getElementById(`${layerId}-label`);

    // ensure the html dom element exists
    if (label !== undefined) {
      if (label != null) {
        // update the label
        label.textContent = layerName;
        label.setAttribute('title', `Toggles the layer ${layerName} on or off`);
        label.setAttribute('aria-label', `Toggles the layer ${layerName} on or off`);
      }
    }
  }

  /**
   *  adds an event listner to the maplayer list.
   *    The listner fires when a user clicks and toggles the display of the map layer
   *  @param { string }  layer id.
   *
   */
  addLayerListListener(layerId, layerName) {
    // get and update the layer's checkbox
    const checkBox = document.getElementById(`${layerId}-toggle`);

    // ensure the html dom element exists
    if (checkBox !== undefined) {
      if (checkBox != null) {
        checkBox.setAttribute('title', `Toggles the layer ${layerName} on or off`);
        checkBox.setAttribute('aria-label', `Toggles the layer ${layerName} on or off`);

        // add the listner
        checkBox.addEventListener('click', (e) => {
          this.toggleMapLayer(layerId);
        });
      }
    }
  }

  /** Toggle map layer visibility */
  toggleMapLayer(layerName) {
    // Trigger layer toggle callback
    this.triggerEvent('layerToggle', layerName);
  }
}

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
