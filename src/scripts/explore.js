// dependencies
import proj4 from 'proj4';
import JSZip from 'jszip';
import L from 'leaflet';
import { Draw, drawLocal } from 'leaflet-draw';
import buffer from '@turf/buffer';

// default map template
import exploreTemplate from '../templates/explore.html';
import Shapebuttons from '../templates/shapebuttons.html';
import ZoomLinks from '../templates/zoomLinks.html';

import { mapConfig } from '../config/mapConfig';
import { Component } from './components';
import { Store } from './store';
import { StoreShapesAPI } from './StoreShapesAPI';
import { ZonalStatsAPI } from './ZonalStatsAPI';
import { HubIntersectionApi } from './HubIntersectionAPI';
import { NatureServeHubIntersectionApi } from './NatureServeHubIntersectionAPI';
import { CaseStudies } from './CaseStudies';
import { bindZonalAllExportHandler } from './zonalFileExporter';

import {
  checkValidObject,
  spinnerOff,
  spinnerOn,
  googleAnalyticsEvent
} from './utilitys';

import {
  drawZonalStatsFromAPI,
  toggleMouseHighLightsOn,
  toggleLabelHighLightsOn,
  toggleMouseHighLightsOff,
  toggleLabelHighLightsOff,
  togglePermHighLightsAllOff,
  makeHTMLName,
  isGraphActivetate,
  viewLongZonalStatsFromShape,
  enableOverView,
  disableOverView,
  enableZonalButtons,
  disableZonalButtons,
  toggleALLPathsOff,
  toggleAllLongZonalsOff
} from './zonalStats';

// Shapefile library must be imported with require.
const shapefile = require('shapefile');

const store = new Store({});


// required for bootstrap
window.$ = require('jquery');
// required for tooltip, popup...
window.Popper = require('popper.js');

window.jQuery = window.$;

store.setStoreItem('Draw', Draw);
store.removeStateItem('Draw');
store.setStoreItem('drawLocal', drawLocal);
store.removeStateItem('drawLocal');

/**
 * explore Component
 * Explore handles drawing on map, uploading of shapefile,
 * and generally handles adding any shapes to the map.
 */
export class Explore extends Component {
  constructor(placeholderId, props) {
    super(placeholderId, props, exploreTemplate);

    const {
      mapComponent,
      mapInfoComponent,
      URLCls,
      hasShareURL,
      theStartNav
    } = props;

    this.mapComponent = mapComponent;
    this.URL = URLCls;
    this.drawAreaGroup = L.featureGroup().addTo(mapComponent.map);
    this.hasShareURL = hasShareURL;
    this.theStartNav = theStartNav;
    this.caseStudies = new CaseStudies(this.mapComponent, this);

    const hasShapeButtonElem = document.getElementById('hasshape-button-holder');
    if (hasShapeButtonElem) {
      hasShapeButtonElem.innerHTML = Shapebuttons;
    }

    this.bufferSize = 1;

    // defualt buffer style
    this.bufferedoptions = {
      fillColor: '#99c3ff',
      color: '#99c3ff'
    };

    this.labelOptions = {
      className: 'userarealabel',
      direction: 'center',
      noHide: false,
      clickable: false,
      permanent: true
    };

    this.defaultAreaName = 'Area ';

    // handler for when drawing is completed
    this.addDrawVertexCreatedHandler(mapComponent, mapInfoComponent);

    // handler for drawing first vertex
    Explore.addDrawVertexHandler(mapComponent);

    // handler for clicking the clear area button
    this.addClearAreaClickHandler();

    // handler for clicking the draw area button
    Explore.addDrawAreaClickHandler(mapComponent);
    this.addUploadShapeHandler();

    // handle stop of draw with escape before finsihed
    Explore.addDrawVertexStop(mapComponent, mapInfoComponent);

    // initalize s3 stored shapes API
    this.StoreShapesAPI = new StoreShapesAPI();

    this.ZonalStatsAPI = new ZonalStatsAPI();


    this.DefaultMessageText = 'Zoom in to an area to explore the data, click <button class="btn btn-light btn-explore-info" title="description" ' +
                               'role="button" aria-label="description"><i class="fas fa-search"></i></button> to search by place or address, or click ' +
                               '<button class="btn btn-light btn-explore-info" title="description" role="button" aria-label="description"> ' +
                               '<i class="fas fa-info"></i></button> and then click a place on the map for summary data.<br /><br />';

    this.HubIntersectionApi = new HubIntersectionApi();
    this.NatureServeHubIntersectionApi = new NatureServeHubIntersectionApi();
    this.HubsExploreText = 'Where Should I Do a Resilience Project?';
    this.HubsNSExploreText = 'Targeted Watersheds';
    this.DefaultExploreText = 'Analyze Project Sites';
    this.ExamplesExploreText = 'Case Studies';
    this.exlporeAssmentMessage = `${this.DefaultMessageText} To analyze potential project sites, click the
                                                            <button type="button" class="btn btn-light btn-box user-shape btn-draw-area bnt-primary"><span class="btn-icon"><i class="fas fa-draw-polygon"></i></span><span class="btn-label">Draw Area on Map</span></button>
                                                            button and then sketch your project footprint(s)
                                                            on the map. If you have a shapefile of the project footprint(s), use the
                                                            <button type="button" class="btn btn-light btn-box user-shape btn-draw-area bnt-primary"><span class="btn-icon"><i class="fas fa-upload"></i></span><span class="btn-label">Upload Shapefile</span></button>
                                                            button.<br /><br />
                                                            The results will allow you to examine and compare your project site(s) by proximity to Resilience Hubs, and explore and compare the
                                                            Community Exposure and Fish and Wildlife Indices in the surrounding area.`;
    this.exlporeHubMessage = `${this.DefaultMessageText} To search for an area in which to implement a potential resilience project, click the
                                                        <button type="button" class="btn btn-light btn-box user-shape btn-draw-area bnt-primary"><span class="btn-icon"><i class="fas fa-draw-polygon"></i></span><span class="btn-label">Draw Area on Map</span></button>
                                                        button and then sketch an area on the map. If you have a shapefile of the area, use the
                                                        <button type="button" class="btn btn-light btn-box user-shape btn-draw-area bnt-primary"><span class="btn-icon"><i class="fas fa-upload"></i></span><span class="btn-label">Upload Shapefile</span></button>
                                                        button.
                                                        <br /><br />The results will identify all Resilience Hubs in your study area and rank them by their potential
                                                         for a project located therein to deliver both human community resilience and fish and wildlife benefits.`;
    this.exlporeNSHubMessage = `${this.DefaultMessageText} In-depth analyses were performed for eight locations in the United States.<br /><br />Data for targeted watersheds is simplified
                                                          for purposes of display in this webtool.  To access the complete detailed datasets, download the ArcGIS files from
                                                          the Download Data tab.<br /><br />To search for an area in which to implement a potential
                                                          resilience project, click the
                                                          <button type="button" class="btn btn-light btn-box user-shape btn-draw-area bnt-primary"><span class="btn-icon"><i class="fas fa-draw-polygon"></i></span><span class="btn-label">Draw Area on Map</span></button>
                                                          button and then sketch an area on the map.
                                                          If you have a shapefile of the area, use the
                                                          <button type="button" class="btn btn-light btn-box user-shape btn-draw-area bnt-primary"><span class="btn-icon"><i class="fas fa-upload"></i></span><span class="btn-label">Upload Shapefile</span></button>
                                                          button.<br /><br />The results will identify all
                                                          Resilience Hubs in your study area and rank them by their potential for a project located therein to deliver both human community
                                                          resilience and fish and wildlife benefits.`;

    this.restoreWhenNotShareURL();

    Explore.addListAreasHandler();

    this.addUpdateStatisticsHandler();

    this.mapComponent.map.addEventListener('zonalstatsend', (e) => {
      Explore.zonalStatsHandler();
    });

    this.mapComponent.map.addEventListener('retreives3end', (e) => {
      spinnerOff();
    });

    this.mapComponent.map.addEventListener('retreives3start', (e) => {
      spinnerOn();
    });

    this.navBarChangeListner();

    window.addEventListener('removeuserareend', (e) => {
      this.clearLayersAndDetails();
      this.drawUserAreaFromUsereas();
    });


    Explore.windowListnersToStopRoqueSpinner();
    // uncomment this if we want to add the draw area button to leaflet
    // control
    this.addDrawButtons(mapComponent);

    const btnBufferElem = document.getElementById('buffer-toggle');
    if (btnBufferElem) {
      btnBufferElem.click();
    }
    this.addBufferListner();

    Explore.addResetControl(this.mapComponent.map);
    bindZonalAllExportHandler();
    this.addZoomLinks();
    Explore.addUploadShapeToolTip();
    Explore.addUDrawShapeToolTip();
  }

  addZoomLinks() {
    const activeNav = store.getStateItem('activeNav');
    if (activeNav === 'main-nav-map-searchNShubs') {
      const zoomLinksElem = document.getElementById('has-zoomlinks-holder');
      if (zoomLinksElem) {
        zoomLinksElem.classList.remove('d-none');
        zoomLinksElem.innerHTML = ZoomLinks;
      }

      document.getElementById('zoomLinks-capefear').addEventListener('click', (e) => {
        this.mapComponent.map.setView({ lat: 34.870704177396405, lng: -77.70473241806032 }, 8);
        // ga event action, category, label
        googleAnalyticsEvent('click', 'zoomwatershed', 'cape fear');
      });

      document.getElementById('zoomLinks-charleston').addEventListener('click', (e) => {
        this.mapComponent.map.setView({ lat: 32.928958424724215, lng: -79.64163064956666 }, 10);
        // ga event action, category, label
        googleAnalyticsEvent('click', 'zoomwatershed', 'charleston');
      });

      document.getElementById('zoomLinks-delawarebay').addEventListener('click', (e) => {
        this.mapComponent.map.setView({ lat: 39.146952938375655, lng: -74.92013812065126 }, 9);
        // ga event action, category, label
        googleAnalyticsEvent('click', 'zoomwatershed', 'delaware bay');
      });

      document.getElementById('zoomLinks-narragansettbay').addEventListener('click', (e) => {
        this.mapComponent.map.setView({ lat: 41.66393558993828, lng: -71.06065392494203 }, 9);
        // ga event action, category, label
        googleAnalyticsEvent('click', 'zoomwatershed', 'narragansett bay');
      });

      document.getElementById('zoomLinks-portlandmaine').addEventListener('click', (e) => {
        this.mapComponent.map.setView({ lat: 44.117439313560126, lng: -69.54407930374147 }, 9);
        // ga event action, category, label
        googleAnalyticsEvent('click', 'zoomwatershed', 'portland maine');
      });

      document.getElementById('zoomLinks-sanfranciscobay').addEventListener('click', (e) => {
        this.mapComponent.map.setView({ lat: 37.786165147923775, lng: -122.12116956710817 }, 8);
        // ga event action, category, label
        googleAnalyticsEvent('click', 'zoomwatershed', 'sanfrancisco bay');
      });

      document.getElementById('zoomLinks-savannahriver').addEventListener('click', (e) => {
        this.mapComponent.map.setView({ lat: 32.03778445137059, lng: -80.64509868621826 }, 9);
        // ga event action, category, label
        googleAnalyticsEvent('click', 'zoomwatershed', 'savannah river');
      });

      document.getElementById('zoomLinks-stjohnsriver').addEventListener('click', (e) => {
        this.mapComponent.map.setView({ lat: 29.77754569469741, lng: -80.64698696136476 }, 8);
        // ga event action, category, label
        googleAnalyticsEvent('click', 'zoomwatershed', 'st johns river');
      });
    } else {
      const zoomLinksElem = document.getElementById('has-zoomlinks-holder');
      if (zoomLinksElem) {
        zoomLinksElem.classList.add('d-none');
      }
    }
  }

  static ResetControlHandler() {
    const sharebtn = L.DomUtil.create('div', 'btn-mapreset-holder');
    sharebtn.setAttribute('id', 'btn-mapreset-holder');
    sharebtn.innerHTML = '<a id="reset-settings" class="btn btn-light btn-mapreset"  href="#" title="Start Over and Clear Previous Selections" ' +
                          'role="button" aria-label="Start over to clear previous selections" ' +
                          'data-toggle="tooltip" data-placement="right" data-original-title="Start Over and Clear Previous Selections"> ' +
                          '<i class="fas fa-undo icon-reset"></i>' +
                          '<div class="btn-med-mapreset-label" >Start Over</div></a>';

    L.DomEvent.disableClickPropagation(sharebtn);
    // initalize new tooltips
    $(() => {
      $('#btn-mapreset-holder [data-toggle="tooltip"]').tooltip({ trigger: 'hover focus' });
    });
    return sharebtn;
  }

  // add Identify control to leaflet map
  static addResetControl(leafletmap) {
    L.Control.Watermark = L.Control.extend({
      onAdd: Explore.ResetControlHandler
    });

    if (window.innerWidth < 800) {
      L.control.watermark({ position: 'topright' }).addTo(leafletmap);
    } else {
      L.control.watermark({ position: 'bottomleft' }).addTo(leafletmap);
    }

    // get btn for mapinfo add click event
    const leafletControlElement = document.querySelector('.btn-mapreset');
    leafletControlElement.addEventListener('click', (e) => {
      const activeNav = store.getStateItem('activeNav');
      store.clearState();
      window.location.reload();
      // ga event action, category, label
      googleAnalyticsEvent('click', `explore ${activeNav}`, 'reset');
    });
  }


  // generic do thing functon for empty blocks
  //  only using this is a place holder
  static doNothing() {
    return null;
  }

  addBufferListner() {
    const sliderBufferElem = document.getElementById('buffer-range-slider');
    if (sliderBufferElem) {
      sliderBufferElem.value = this.bufferSize;
      sliderBufferElem.addEventListener('change', (e) => {
        const sliderBufferDistanceElem = document.getElementById('buffer-range-slider-distance');
        sliderBufferDistanceElem.innerHTML = `${e.target.value} KM`;
        this.bufferSize = e.target.value;
      });
    }
    const btnBufferElem = document.getElementById('buffer-toggle');
    if (btnBufferElem) {
      btnBufferElem.addEventListener('click', (e) => {
        if (this.bufferSize === 1) {
          this.bufferSize = 0;
        } else {
          this.bufferSize = 1;
        }
      });
    }
  }

  // restore for when not share URL
  restoreWhenNotShareURL() {
    // draw the user area on the map
    const checkHubIntersectionJson = store.getStateItem('HubIntersectionJson');
    const checkNatureServeHubIntersectionJson = store.getStateItem('NatureServeHubIntersectionJson');
    const checkUserareas = store.getStateItem('userareas');

    if (!this.hasShareURL) {
      const activeNav = store.getStateItem('activeNav');
      const exploreTitle = document.getElementById('explore-title');
      const exploreTitleResponsive = document.querySelector('.navbar-brand-exlore-title');
      const UpdateZonalStatsBtn = document.getElementById('btn-update-zonal-stats');

      if (activeNav) {
        Explore.enableShapeButtons();
        switch (activeNav) {
          case 'main-nav-map-searchhubs':
            UpdateZonalStatsBtn.classList.add('d-none');
            this.drawHubsFromStateObject();
            Explore.updateExploreText(exploreTitle, this.HubsExploreText);
            Explore.updateExploreText(exploreTitleResponsive, this.HubsExploreText);
            Explore.updateExploreDirections(this.exlporeHubMessage);
            Explore.dismissBufferCheckBox();
            if (checkValidObject(checkHubIntersectionJson)) {
              Explore.dismissExploreDirections();
              this.drawZonalStatsForStoredHubs();
            }
            return null;
          case 'main-nav-map-searchNShubs':
            UpdateZonalStatsBtn.classList.add('d-none');
            this.drawNatureServeHubsFromStateObject();
            Explore.updateExploreText(exploreTitle, this.HubsNSExploreText);
            Explore.updateExploreText(exploreTitleResponsive, this.HubsNSExploreText);
            Explore.updateExploreDirections(this.exlporeNSHubMessage);
            Explore.dismissBufferCheckBox();
            if (checkValidObject(checkNatureServeHubIntersectionJson)) {
              Explore.dismissExploreDirections();
              this.drawZonalStatsForStoredNatureServeHubs();
            }
            return null;
          case 'main-nav-map-examples':
            Explore.dismissExploreDirections();
            disableZonalButtons();
            disableOverView();
            Explore.dismissShapeButtons();
            Explore.updateExploreText(exploreTitle, this.ExamplesExploreText);
            Explore.dismissBufferCheckBox();
            this.caseStudies.initalize();
            return null;
          case 'main-nav-map':
            UpdateZonalStatsBtn.classList.remove('d-none');
            this.drawUserAreaFromUsereas();
            Explore.updateExploreText(exploreTitle, this.DefaultExploreText);
            Explore.updateExploreText(exploreTitleResponsive, this.DefaultExploreText);
            Explore.updateExploreDirections(this.exlporeAssmentMessage);
            Explore.enableBufferCheckBox();
            if (checkValidObject(checkUserareas)) {
              Explore.dismissExploreDirections();
            }
            return null;
          default:
            // UpdateZonalStatsBtn.classList.remove('d-none');
            // this.drawUserAreaFromUsereas();
            // Explore.updateExploreText(exploreTitle, this.DefaultExploreText);
            // Explore.updateExploreText(exploreTitleResponsive, this.DefaultExploreText);
            // Explore.updateExploreDirections(this.exlporeAssmentMessage);
            // Explore.enableBufferCheckBox();
            // if (checkValidObject(checkUserareas)) {
            //   Explore.dismissExploreDirections();
            // }
            return null;
        }
      }
    }

    this.addZoomLinks();
    return null;
  }


  // only display layers that are needed in current tab
  // this especially true for switching between targeted watershed data
  // and the default regional data.
  // the config has an item source that holds targetedwatershed or regional
  onlyDisplayValidLayers() {
    const activeNav = store.getStateItem('activeNav');
    let validSource = 'regional';

    // using current nav bar set the valid layers
    // either targetedwatershed or regional
    switch (activeNav) {
      case 'main-nav-map-searchhubs':
        validSource = 'regional';
        break;
      case 'main-nav-map-examples':
        validSource = 'regional';
        break;
      case 'main-nav-map-searchNShubs':
        validSource = 'targetedwatershed';
        break;
      default:
        // validSource = 'regional';
        break;
    }

    // get the layer list from the config file
    const { TMSLayers } = mapConfig;
    const layers = store.getStateItem('mapLayerDisplayStatus');

    // filter the layers based on current source
    Object.keys(layers).forEach((layer) => {
      const asource = TMSLayers.filter(TMSlayer => (
        TMSlayer.id === layer && TMSlayer.source === validSource
      ));

      // layer is on and not part of the tabs data so it needs to be off
      if (layers[layer] && asource.length === 0) {
        this.mapComponent.toggleVisLayerOff(layer);
      }

      // layer is on IS part of the tabs data os it needs to be on
      if (layers[layer] && asource.length > 0) {
        this.mapComponent.toggleVisLayerOn(layer);
      }
    });
  }

  // listens for the when the navbar changes EVENT, when it does
  // we re-draw the map for either the exlopre the assment or
  // search by hubs
  navBarChangeListner() {
    // event listner to handle nav change
    window.addEventListener('aboutNavChange', (e) => {
      this.drawAreaGroup.clearLayers();
      Explore.clearZonalHolderButtons();
      Explore.clearZonalStatsWrapperDiv();
      const activeNav = store.getStateItem('activeNav');
      const exploreTitle = document.getElementById('explore-title');
      const exploreTitleResponsive = document.querySelector('.navbar-brand-exlore-title');
      const checkHubIntersectionJson = store.getStateItem('HubIntersectionJson');
      const checkNatureServeHubIntersectionJson = store.getStateItem('NatureServeHubIntersectionJson');
      const checkUserareas = store.getStateItem('userareas');
      document.querySelector('.explore-row-container .sticky-top.sideheading').classList.remove('d-none');
      const UpdateZonalStatsBtn = document.getElementById('btn-update-zonal-stats');
      Explore.disableShapeExistsButtons();
      Explore.dismissExploreDirections();
      disableZonalButtons();
      disableOverView();
      Explore.enableShapeButtons();
      this.addZoomLinks();

      if (activeNav) {
        Explore.enableShapeButtons();
        switch (activeNav) {
          case 'main-nav-map-searchhubs':
            // check if there is hub data in the state store
            // if there is NONE dispolay the text
            // that tells the user what to do
            UpdateZonalStatsBtn.classList.add('d-none');
            this.onlyDisplayValidLayers();
            if (!checkValidObject(checkHubIntersectionJson)) {
              Explore.updateExploreText(exploreTitle, this.HubsExploreText);
              Explore.updateExploreText(exploreTitleResponsive, this.HubsExploreText);
              Explore.updateExploreDirections(this.exlporeHubMessage);
              Explore.dismissBufferCheckBox();
              disableZonalButtons();
              disableOverView();
              UpdateZonalStatsBtn.classList.add('d-none');

              // If there is hub data in store do NOT show text and draw the hubs
            } else {
              Explore.updateExploreText(exploreTitle, this.HubsExploreText);
              Explore.updateExploreText(exploreTitleResponsive, this.HubsExploreText);
              Explore.updateExploreDirections(this.exlporeHubMessage);
              Explore.dismissBufferCheckBox();
              Explore.dismissExploreDirections();
              this.drawHubsFromStateObject();
              this.drawZonalStatsForStoredHubs();
              enableZonalButtons();
              Explore.setOverviewText();
            }
            return null;
          case 'main-nav-map-examples':
            UpdateZonalStatsBtn.classList.add('d-none');
            Explore.dismissExploreDirections();
            disableZonalButtons();
            disableOverView();
            Explore.dismissShapeButtons();
            Explore.updateExploreText(exploreTitle, this.ExamplesExploreText);
            this.caseStudies.initalize();
            return null;
          case 'main-nav-map-searchNShubs':
            this.onlyDisplayValidLayers();
            UpdateZonalStatsBtn.classList.add('d-none');
            if (!checkValidObject(checkNatureServeHubIntersectionJson)) {
              Explore.updateExploreText(exploreTitle, this.HubsNSExploreText);
              Explore.updateExploreText(exploreTitleResponsive, this.HubsNSExploreText);
              Explore.updateExploreDirections(this.exlporeNSHubMessage);
              Explore.dismissBufferCheckBox();
              disableZonalButtons();
              disableOverView();
              UpdateZonalStatsBtn.classList.add('d-none');
            } else {
              Explore.updateExploreText(exploreTitle, this.HubsNSExploreText);
              Explore.updateExploreText(exploreTitleResponsive, this.HubsNSExploreText);
              Explore.updateExploreDirections(this.exlporeNSHubMessage);
              Explore.dismissBufferCheckBox();
              this.drawNatureServeHubsFromStateObject();
              this.drawZonalStatsForStoredNatureServeHubs();
              enableZonalButtons();
              Explore.setOverviewText();
            }
            return null;
          case 'main-nav-map':
            this.onlyDisplayValidLayers();
            if (!checkValidObject(checkUserareas)) {
              UpdateZonalStatsBtn.classList.remove('d-none');
              Explore.updateExploreText(exploreTitle, this.DefaultExploreText);
              Explore.updateExploreText(exploreTitleResponsive, this.DefaultExploreText);
              Explore.updateExploreDirections(this.exlporeAssmentMessage);
              Explore.enableBufferCheckBox();
              disableZonalButtons();
              disableOverView();
              // If there is explore assement data in store do NOT show text and draw the shpes
            } else {
              UpdateZonalStatsBtn.classList.remove('d-none');
              Explore.updateExploreText(exploreTitle, this.DefaultExploreText);
              Explore.updateExploreText(exploreTitleResponsive, this.DefaultExploreText);
              Explore.updateExploreDirections(this.exlporeAssmentMessage);
              Explore.enableBufferCheckBox();
              Explore.dismissExploreDirections();
              this.drawUserAreaFromUsereas();
              enableZonalButtons();
              Explore.setOverviewText();
            }
            return null;
          default:
            // this.onlyDisplayValidLayers();
            // if (!checkValidObject(checkUserareas)) {
            //   UpdateZonalStatsBtn.classList.remove('d-none');
            //   Explore.updateExploreText(exploreTitle, this.DefaultExploreText);
            //   Explore.updateExploreText(exploreTitleResponsive, this.DefaultExploreText);
            //   Explore.updateExploreDirections(this.exlporeAssmentMessage);
            //   Explore.enableBufferCheckBox();
            //   disableZonalButtons();
            //   disableOverView();
            //   // If there is explore assement data in store do NOT show text and draw the shpes
            // } else {
            //   UpdateZonalStatsBtn.classList.remove('d-none');
            //   Explore.updateExploreText(exploreTitle, this.DefaultExploreText);
            //   Explore.updateExploreText(exploreTitleResponsive, this.DefaultExploreText);
            //   Explore.updateExploreDirections(this.exlporeAssmentMessage);
            //   Explore.enableBufferCheckBox();
            //   Explore.dismissExploreDirections();
            //   this.drawUserAreaFromUsereas();
            //   enableZonalButtons();
            //   Explore.setOverviewText();
            // }
            return null;
        }
      } else if (!checkValidObject(checkUserareas)) {
        UpdateZonalStatsBtn.classList.remove('d-none');
        Explore.updateExploreDirections(this.exlporeAssmentMessage);
        disableZonalButtons();
        Explore.enableBufferCheckBox();
        Explore.setOverviewText();
        // If there is explore assement data in store do NOT show text and draw the shpes
      } else {
        UpdateZonalStatsBtn.classList.remove('d-none');
        Explore.updateExploreText(exploreTitle, this.DefaultExploreText);
        Explore.updateExploreText(exploreTitleResponsive, this.DefaultExploreText);
        Explore.enableBufferCheckBox();
        Explore.updateExploreDirections(this.exlporeAssmentMessage);
        Explore.dismissExploreDirections();
        this.drawUserAreaFromUsereas();
        enableZonalButtons();
        disableOverView();
      }
      return null;
    });
  }

  static dismissShapeButtons() {
    const directionElem = document.getElementById('primary-shape-holder');
    directionElem.classList.add('d-none');
  }

  static enableShapeButtons() {
    const directionElem = document.getElementById('primary-shape-holder');
    directionElem.classList.remove('d-none');
  }

  static dismissBufferCheckBox() {
    const directionElem = document.getElementById('buffer-layer-toggle');
    directionElem.classList.add('d-none');
  }

  static enableBufferCheckBox() {
    const directionElem = document.getElementById('buffer-layer-toggle');
    directionElem.classList.remove('d-none');
  }

  static dismissExploreDirections() {
    const directionElem = document.getElementById('exlpore-directions');
    directionElem.classList.add('d-none');
  }

  static updateExploreDirections(elemText) {
    const textElem = document.getElementById('exploreInfo');
    if (textElem) {
      textElem.innerHTML = elemText;
    }
  }

  // if parent is tooltip get id so we can hide it.
  static ParentTooltip(target, id) {
    for (let p = target && target.parentElement; p; p = p.parentElement) {
      if (p.id.substring(0, 7) === id) { return p; }
    }
    return null;
  }

  static updateExploreText(elem, elemText) {
    if (elem) {
      const helperElem = '<button id="exlpore-helper-directions" aria-label="Show layer description" class="explore-helper" ' +
                         'title=" " data-toggle="tooltip" data-placement="bottom">' +
                         '<i aria-label="Show layer description" class="fas fa-info"></i></button>';
      elem.innerHTML = elemText + helperElem;
    }
  }

  static windowListnersToStopRoqueSpinner() {
    // ensure spinener stops after working us complete...
    window.addEventListener('mouseover', (e) => {
      spinnerOff();
    });

    window.addEventListener('click', (e) => {
      spinnerOff();
    });

    window.addEventListener('touchmove', (e) => {
      spinnerOff();
    });

    window.addEventListener('touchstart', (e) => {
      spinnerOff();
    });
  }

  // user clickss path should navigate into zonal stats details
  static clickShape(e) {
    toggleALLPathsOff();
    toggleAllLongZonalsOff();
    const pathclass = e.target.options.className;
    const name = pathclass.replace('path--USERAREA-', '');
    viewLongZonalStatsFromShape(name);
  }

  bufferArea(unbufferedGeoJSON) {
    // buffer the geoJSON by 1 kilometer
    const bufferedGeoJSON = buffer(unbufferedGeoJSON, this.bufferSize, { units: 'kilometers' });

    let name = '';
    const shapecount = store.getStateItem('userareacount');
    name = `${this.defaultAreaName}${shapecount}`;

    const HTMLName = makeHTMLName(name);
    this.bufferedoptions.className = `path-${HTMLName}`;

    // convert geoJson to leaflet layer
    const bufferedLayer = L.geoJson(bufferedGeoJSON, this.bufferedoptions);
    // /bufferedLayer

    bufferedLayer.on({
      mouseover: (e) => {
        if (!isGraphActivetate()) {
          const path = e.target;
          const labelname = path.options.className.replace('path-', 'label-name-');
          const labelElem = document.getElementById(labelname);
          toggleLabelHighLightsOn(labelElem);
          const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
          const labelzElem = document.getElementById(labelzname);
          toggleLabelHighLightsOn(labelzElem);

          const shotChartsLabels = path.options.className.replace('path-', 'short-chart-');
          const shotChartsLabelsElem = document.getElementById(shotChartsLabels);
          toggleLabelHighLightsOn(shotChartsLabelsElem);

          const pathelem = document.querySelector(`.${path.options.className}`);
          toggleMouseHighLightsOn(pathelem);
        }
      },
      mouseout: (e) => {
        if (!isGraphActivetate()) {
          const path = e.target;
          const labelname = path.options.className.replace('path-', 'label-name-');
          const labelElem = document.getElementById(labelname);
          toggleLabelHighLightsOff(labelElem);
          const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
          const labelzElem = document.getElementById(labelzname);
          toggleLabelHighLightsOff(labelzElem);

          const shotChartsLabels = path.options.className.replace('path-', 'short-chart-');
          const shotChartsLabelsElem = document.getElementById(shotChartsLabels);
          toggleLabelHighLightsOff(shotChartsLabelsElem);

          const pathelem = document.querySelector(`.${path.options.className}`);
          toggleMouseHighLightsOff(pathelem);
        }
      },
      click: (e) => {
        Explore.clickShape(e);
      }
    });

    // add buffered area to store
    store.setStoreItem('userarea_buffered', bufferedGeoJSON);

    return bufferedLayer;
  }

  static zonalStatsHandler() {
    const clearAreaElement = document.getElementById('details-holder');
    const zonalstatsgeojson = store.getStateItem('zonalstatsjson');

    if (checkValidObject(zonalstatsgeojson) && !checkValidObject(zonalstatsgeojson.err)) {
      const zonalstatsjson = zonalstatsgeojson.features[0].mean;

      if (clearAreaElement) {
        let html = '';
        Object.keys(zonalstatsjson).forEach((obj) => {
          let value = parseFloat(zonalstatsjson[obj]).toFixed(2);
          if (zonalstatsjson[obj] === 'NaN') {
            value = 'Not Available';
          }

          // setup cards for zonal stats just a place holder...
          html += '<div class="card text-dark bg-light mb-3" style="width: 18rem;">';
          html += '  <div class="card-header">';
          html += obj;
          html += '  </div>';
          html += '  <div class="card-body">';
          html += '   <h5 class="card-title">';
          html += value;
          html += '   </h5>';
          html += '  </div>';
          html += '</div>';
        });

        clearAreaElement.innerHTML = html;
      }
    }
    return '';
  }

  // update zonal stats for all user ares in the state store
  async updateZonal() {
    // ga event action, category, label
    googleAnalyticsEvent('click', `explore ${store.getStateItem('activeNav')}`, 'refresh stats');

    store.setStoreItem('working_zonalstats', true);
    spinnerOn();
    // this temp remove of stats so we can recalulate.
    const zonalAreaWrapper = document.getElementById('zonal-area-wrapper');
    if (zonalAreaWrapper) {
      zonalAreaWrapper.innerHTML = 'Recalculating area information';
    }

    // get the curreent shapes from the sore
    const currentshapes = store.getStateItem('userareas');

    const checkobj = {}.hasOwnProperty;

    if (!checkValidObject(currentshapes)) {
      store.setStoreItem('working_zonalstats', false);
      zonalAreaWrapper.innerHTML = '';
      spinnerOff('getZonal checkValidObject rawpostdata');
      return JSON.parse('{}');
    }

    // using for loop because it allows await functionality with
    // async calls to zonal stats api.  this will ensure we wait for the promise to
    // resolve and is added to the store before we progress on. using a check for hasOwnProperty
    // to deal with all the prototpe entries
    for (const key in currentshapes) {  // eslint-disable-line
      if (checkobj.call(currentshapes, key)) {
        const rawpostdata = currentshapes[key][2].userarea_buffered;
        const { name } = currentshapes[key][0];

        let postdata = '';

        // some Geojson is not a feature collection lambda function expects a
        // a feature collection
        if (rawpostdata.type === 'Feature') {
          const FeatureCollectionStart = '{"type": "FeatureCollection","features": [';
          const FeatureCollectionEnd = ']}';
          postdata = FeatureCollectionStart + JSON.stringify(rawpostdata) + FeatureCollectionEnd;
        }

        if (rawpostdata.type === 'FeatureCollection') {
          postdata = JSON.stringify(rawpostdata);
        }

        if (!checkValidObject(rawpostdata)) {
          store.setStoreItem('working_zonalstats', false);
          zonalAreaWrapper.innerHTML = '';
          spinnerOff('getZonal checkValidObject rawpostdata');
          return {};
        }

        // send to zonal stas and await
        const ZonalStatsJson = await this.ZonalStatsAPI.getZonalStatsSummary(postdata);

        // ga event action, category, label
        googleAnalyticsEvent('call', 'lambda', 'ZonalStatsAPI');

        currentshapes[key][3].zonalstatsjson = ZonalStatsJson;
        if (checkValidObject(ZonalStatsJson.features)) {
          drawZonalStatsFromAPI(ZonalStatsJson.features[0].properties.mean,
            name,
            this.mapComponent.map);
        }
      }
    }

    // update as complete
    store.setStoreItem('userareas', currentshapes);
    store.setStoreItem('working_zonalstats', false);
    spinnerOff('getZonal done');
    return null;
  }

  async getNatureServeHubsZonal() {
    spinnerOn();
    store.setStoreItem('working_zonalstats', true);

    // get geoJSON to send to zonal stats lambda function
    // in this case do not use the buffered shape
    const rawpostdata = store.getStateItem('userarea');

    if (!checkValidObject(rawpostdata)) {
      store.setStoreItem('working_zonalstats', false);
      spinnerOff('getZonal checkValidObject rawpostdata');
      return JSON.parse('{}');
    }

    // send request to api
    const NatureServeHubIntersectionJson =
      await this.NatureServeHubIntersectionApi.getIntersectedNatureServeHubs(rawpostdata);

    // ga event action, category, label
    googleAnalyticsEvent('call', 'lambda', 'NatureServeHubIntersectionApi');

    // make sure there is valid data back as  a response
    if (!checkValidObject(NatureServeHubIntersectionJson)) {
      store.setStoreItem('working_zonalstats', false);
      spinnerOff('getZonal checkValidObject NatureServeHubIntersectionJson');
      return JSON.parse('{}');
    }

    await Explore.storeNatureServeHubsOnS3(NatureServeHubIntersectionJson);

    Explore.appendIntersectedNatureServeHubsToState(NatureServeHubIntersectionJson);
    Explore.sortNatureServeHubsByHubScore();

    store.setStoreItem('working_zonalstats', false);
    spinnerOff('getZonal done');
    Explore.enableShapeExistsButtons();
    Explore.dismissExploreDirections();
    return NatureServeHubIntersectionJson;
  }

  async getHubsZonal() {
    spinnerOn();
    store.setStoreItem('working_zonalstats', true);

    // get geoJSON to send to zonal stats lambda function
    // in this case do not use the buffered shape
    const rawpostdata = store.getStateItem('userarea');

    if (!checkValidObject(rawpostdata)) {
      store.setStoreItem('working_zonalstats', false);
      spinnerOff('getZonal checkValidObject rawpostdata');
      return JSON.parse('{}');
    }

    // send request to api
    const HubIntersectionJson = await this.HubIntersectionApi.getIntersectedHubs(rawpostdata);

    // ga event action, category, label
    googleAnalyticsEvent('call', 'lambda', 'HubIntersectionApi');

    // make sure there is valid data back as  a response
    if (!checkValidObject(HubIntersectionJson)) {
      store.setStoreItem('working_zonalstats', false);
      spinnerOff('getZonal checkValidObject HubIntersectionJson');
      return JSON.parse('{}');
    }

    await Explore.storeHubsOnS3(HubIntersectionJson);

    Explore.appendIntersectedHubsToState(HubIntersectionJson);
    Explore.sortHubsByHubScore();

    store.setStoreItem('working_zonalstats', false);
    spinnerOff('getZonal done');
    Explore.enableShapeExistsButtons();
    Explore.dismissExploreDirections();
    return HubIntersectionJson;
  }

  static async storeNatureServeHubsOnS3(hubs) {
    const checkobj = {}.hasOwnProperty;
    const hubBucketfolders = 'prod/hubs/';
    const hubBucket = 'nfwf-tool-user-shapes';

    // using for loop because it allows await functionality with
    // async calls to zonal stats api.  this will ensure we wait for the promise to
    // resolve and is added to the store before we progress on. using a check for hasOwnProperty
    // to deal with all the prototpe entries
    for (const key in hubs) {  // eslint-disable-line
      if (checkobj.call(hubs, key)) {
        const fid = hubs[key].properties.mean.TARGET_FID.toString().trim();
        const savedhub = { key: `${hubBucketfolders}${fid}.geojson`, bucket: hubBucket };
        const storedhubs = store.getStateItem('savedNatureServeHubs');

        if (checkValidObject(savedhub)) {
          const newhub = {
            [`savedhub${fid}`]: [
              { name: fid },
              { hub: savedhub }
            ]
          };
          const newsavedhubs = { ...storedhubs, ...newhub };
          store.setStoreItem('savedNatureServeHubs', newsavedhubs);
        }
      }
    }
  }

  static async storeHubsOnS3(hubs) {
    const checkobj = {}.hasOwnProperty;
    const hubBucketfolders = 'prod/hubs/';
    const hubBucket = 'nfwf-tool-user-shapes';

    // using for loop because it allows await functionality with
    // async calls to zonal stats api.  this will ensure we wait for the promise to
    // resolve and is added to the store before we progress on. using a check for hasOwnProperty
    // to deal with all the prototpe entries
    for (const key in hubs) {  // eslint-disable-line
      if (checkobj.call(hubs, key)) {
        const fid = hubs[key].properties.mean.TARGET_FID.toString().trim();
        const savedhub = { key: `${hubBucketfolders}${fid}.geojson`, bucket: hubBucket };
        const storedhubs = store.getStateItem('savedhubs');

        if (checkValidObject(savedhub)) {
          const newhub = {
            [`savedhub${fid}`]: [
              { name: fid },
              { hub: savedhub }
            ]
          };
          const newsavedhubs = { ...storedhubs, ...newhub };
          store.setStoreItem('savedhubs', newsavedhubs);
        }
      }
    }
  }

  static appendIntersectedNatureServeHubsToState(json) {
    const existingNatureServeHubs = store.getStateItem('NatureServeHubIntersectionJson');
    if (checkValidObject(existingNatureServeHubs)) {
      const newStateItem = existingNatureServeHubs;
      const newNatureServeHubsFiltered = json.filter((newNatureServeHub) => {
        let alreadyInState = false;
        existingNatureServeHubs.forEach((NatureServeHub) => {
          if (newNatureServeHub.properties.mean.TARGET_FID ===
                NatureServeHub.properties.mean.TARGET_FID.toString().trim()) {
            alreadyInState = true;
          }
        });
        return !alreadyInState;
      });
      newStateItem.push(...newNatureServeHubsFiltered);
      store.setStoreItem('NatureServeHubIntersectionJson', newStateItem);
    } else {
      store.setStoreItem('NatureServeHubIntersectionJson', json);
    }
  }

  // renders the shapes from the user areas state object
  drawNatureServeHubsFromStateObject() {
    store.setStoreItem('working_drawlayers', true);
    spinnerOn();

    const currentshapes = store.getStateItem('NatureServeHubIntersectionJson');

    if (!checkValidObject(currentshapes)) {
      store.setStoreItem('working_drawlayers', false);
      spinnerOff();
      return null;
    }

    currentshapes.forEach((feature) => {
      const userarea = feature;

      if (checkValidObject(userarea)) {
        const name = feature.properties.mean.TARGET_FID.toString().trim();
        const HTMLName = makeHTMLName(name);
        this.bufferedoptions.className = `path-${HTMLName}`;

        const NatureServeHubLayer = L.geoJson(userarea, this.bufferedoptions);

        // draw Resilience hub
        this.drawAreaGroup.addLayer(NatureServeHubLayer);

        // add mouserovers for the shapes.
        NatureServeHubLayer.on({
          mouseover: (e) => {
            if (!isGraphActivetate()) {
              const path = e.target;
              const labelname = path.options.className.replace('path-', 'label-name-');
              const labelElem = document.getElementById(labelname);
              toggleLabelHighLightsOn(labelElem);
              const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
              const labelzElem = document.getElementById(labelzname);
              toggleLabelHighLightsOn(labelzElem);

              const shotChartsLabels = path.options.className.replace('path-', 'short-chart-');
              const shotChartsLabelsElem = document.getElementById(shotChartsLabels);
              toggleLabelHighLightsOn(shotChartsLabelsElem);

              const pathelem = document.querySelector(`.${path.options.className}`);
              togglePermHighLightsAllOff(pathelem);
              toggleMouseHighLightsOn(pathelem);
            }
          },
          mouseout: (e) => {
            if (!isGraphActivetate()) {
              const path = e.target;
              const labelname = path.options.className.replace('path-', 'label-name-');
              const labelElem = document.getElementById(labelname);
              toggleLabelHighLightsOff(labelElem);
              const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
              const labelzElem = document.getElementById(labelzname);
              toggleLabelHighLightsOff(labelzElem);

              const shotChartsLabels = path.options.className.replace('path-', 'short-chart-');
              const shotChartsLabelsElem = document.getElementById(shotChartsLabels);
              toggleLabelHighLightsOff(shotChartsLabelsElem);

              const pathelem = document.querySelector(`.${path.options.className}`);
              toggleMouseHighLightsOff(pathelem);
            }
          },
          click: (e) => {
            Explore.clickShape(e);
          }
        });

        this.addUserAreaLabel(NatureServeHubLayer, name);

        Explore.enableShapeExistsButtons();
        Explore.dismissExploreDirections();
        return NatureServeHubLayer;
      }

      store.setStoreItem('working_drawlayers', false);
      spinnerOff();
      return null;
    });

    store.setStoreItem('working_drawlayers', false);
    spinnerOff();
    return null;
  }

  static appendIntersectedHubsToState(json) {
    const existingHubs = store.getStateItem('HubIntersectionJson');
    if (checkValidObject(existingHubs)) {
      const newStateItem = existingHubs;
      const newHubsFiltered = json.filter((newHub) => {
        let alreadyInState = false;
        existingHubs.forEach((hub) => {
          if (newHub.properties.mean.TARGET_FID ===
                hub.properties.mean.TARGET_FID.toString().trim()) {
            alreadyInState = true;
          }
        });
        return !alreadyInState;
      });
      newStateItem.push(...newHubsFiltered);
      store.setStoreItem('HubIntersectionJson', newStateItem);
    } else {
      store.setStoreItem('HubIntersectionJson', json);
    }
  }

  // renders the shapes from the user areas state object
  drawHubsFromStateObject() {
    store.setStoreItem('working_drawlayers', true);
    spinnerOn();

    const currentshapes = store.getStateItem('HubIntersectionJson');

    if (!checkValidObject(currentshapes)) {
      store.setStoreItem('working_drawlayers', false);
      spinnerOff();
      return null;
    }

    currentshapes.forEach((feature) => {
      const userarea = feature;

      if (checkValidObject(userarea)) {
        const name = feature.properties.mean.TARGET_FID.toString().trim();
        const HTMLName = makeHTMLName(name);
        this.bufferedoptions.className = `path-${HTMLName}`;

        const resilienceHubLayer = L.geoJson(userarea, this.bufferedoptions);

        // draw Resilience hub
        this.drawAreaGroup.addLayer(resilienceHubLayer);

        // add mouserovers for the shapes.
        resilienceHubLayer.on({
          mouseover: (e) => {
            if (!isGraphActivetate()) {
              const path = e.target;
              const labelname = path.options.className.replace('path-', 'label-name-');
              const labelElem = document.getElementById(labelname);
              toggleLabelHighLightsOn(labelElem);
              const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
              const labelzElem = document.getElementById(labelzname);
              toggleLabelHighLightsOn(labelzElem);

              const shotChartsLabels = path.options.className.replace('path-', 'short-chart-');
              const shotChartsLabelsElem = document.getElementById(shotChartsLabels);
              toggleLabelHighLightsOn(shotChartsLabelsElem);

              const pathelem = document.querySelector(`.${path.options.className}`);
              togglePermHighLightsAllOff(pathelem);
              toggleMouseHighLightsOn(pathelem);
            }
          },
          mouseout: (e) => {
            if (!isGraphActivetate()) {
              const path = e.target;
              const labelname = path.options.className.replace('path-', 'label-name-');
              const labelElem = document.getElementById(labelname);
              toggleLabelHighLightsOff(labelElem);
              const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
              const labelzElem = document.getElementById(labelzname);
              toggleLabelHighLightsOff(labelzElem);

              const shotChartsLabels = path.options.className.replace('path-', 'short-chart-');
              const shotChartsLabelsElem = document.getElementById(shotChartsLabels);
              toggleLabelHighLightsOff(shotChartsLabelsElem);

              const pathelem = document.querySelector(`.${path.options.className}`);
              toggleMouseHighLightsOff(pathelem);
            }
          },
          click: (e) => {
            Explore.clickShape(e);
          }
        });

        this.addUserAreaLabel(resilienceHubLayer, name);

        Explore.enableShapeExistsButtons();
        Explore.dismissExploreDirections();
        return resilienceHubLayer;
      }

      store.setStoreItem('working_drawlayers', false);
      spinnerOff();
      return null;
    });

    store.setStoreItem('working_drawlayers', false);
    spinnerOff();
    return null;
  }

  async getZonal() {
    spinnerOn();
    store.setStoreItem('working_zonalstats', true);
    store.removeStateItem('zonalstatsjson');

    // get geoJSON to send to zonal stats lambda function
    const rawpostdata = store.getStateItem('userarea_buffered');
    let postdata = '';

    // some Geojson is not a feature collection lambda function expects a
    // a feature collection
    if (rawpostdata.type === 'Feature') {
      const FeatureCollectionStart = '{"type": "FeatureCollection","features": [';
      const FeatureCollectionEnd = ']}';
      postdata = FeatureCollectionStart + JSON.stringify(rawpostdata) + FeatureCollectionEnd;
    }

    if (rawpostdata.type === 'FeatureCollection') {
      postdata = JSON.stringify(rawpostdata);
    }

    if (!checkValidObject(rawpostdata)) {
      store.setStoreItem('working_zonalstats', false);
      spinnerOff('getZonal checkValidObject rawpostdata');
      return JSON.parse('{}');
    }

    const ZonalStatsJson = await this.ZonalStatsAPI.getZonalStatsSummary(postdata);

    // ga event action, category, label
    googleAnalyticsEvent('call', 'lambda', 'ZonalStatsAPI');

    // If the API fails 3 times, error is thrown and no code below this point is run
    store.setStoreItem('zonalstatsjson', ZonalStatsJson);

    const name = this.storeShapes();
    this.saveUserShapesToS3();

    store.setStoreItem('working_zonalstats', false);
    if (checkValidObject(ZonalStatsJson.features)) {
      drawZonalStatsFromAPI(ZonalStatsJson.features[0].properties.mean,
        name,
        this.mapComponent.map);
    }

    this.mapComponent.map.fireEvent('zonalstatsend');
    store.setStoreItem('working_zonalstats', false);
    spinnerOff('getZonal done');

    Explore.enableShapeExistsButtons();
    Explore.dismissExploreDirections();
    return ZonalStatsJson;
  }

  async retreiveS3GeojsonFile(projectfile = 'projected_4326_62155.geojson') {
    const geojson = await this.StoreShapesAPI.getSavedGeoJSON(projectfile);

    // draw poly on map
    // ensure the user area object is valid (actuall has a value)
    if (checkValidObject(geojson)) {
      spinnerOn();
      store.setStoreItem('working_zonalstats', true);
      this.removeExistingArea();
      store.setStoreItem('projectfile', projectfile);
      store.setStoreItem('userarea', geojson);
      // this.drawSavedGeoJson(geojson);
    } else {
      // add failed to get file from s3 code

    }
    return geojson;
  }

  // restore explore for share url from s3
  restoreExploreForShareURL() {
    // if their is a query string paramter for shareurl=true restore the shapes.
    if (this.hasShareURL === 'true') {
      this.getShapesFromS3();
      Explore.setOverviewText();
    }
  }

  // restore hubs for share url from s3
  restoreHubsForShareURL() {
    if (this.hasShareURL === 'true') {
      this.getHubsFromS3();
      Explore.setOverviewText();
    }
  }

  // restore hubs for share url from s3
  restoreNatureServeHubsForShareURL() {
    if (this.hasShareURL === 'true') {
      this.getNatureServeHubsFromS3();
      Explore.setOverviewText();
    }
  }

  // clear the url after a share url has been processed so
  // it does not effect refreshes
  static clearURL() {
    const fullurl = window.location;
    const urlParams = window.location.search;
    const urlwithoutquery = fullurl.href.replace(urlParams, '');

    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', `${urlwithoutquery}`);
    }
  }

  // get geojson from s3
  restoreSavedGeoJson() {
    store.setStoreItem('working_s3retreive', true);
    spinnerOn();

    switch (this.theStartNav) {
      case 'main-nav-map-searchhubs':
        this.restoreHubsForShareURL();
        break;
      case 'main-nav-map-examples':
        break;
      case 'main-nav-map-searchNShubs':
        this.restoreNatureServeHubsForShareURL();
        break;
      case 'main-nav-map':
        this.restoreExploreForShareURL();
        break;
      default:
        // this.restoreExploreForShareURL();
        break;
    }

    Explore.clearURL();

    store.setStoreItem('working_s3retreive', false);
    spinnerOff();
  }

  // think this is no longer used...
  drawSavedGeoJson(geojson) {
    if (checkValidObject(geojson)) {
      const layer = L.geoJson(geojson);
      const bufferedLayer = this.bufferArea(geojson);

      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(layer);
      this.drawAreaGroup.addLayer(bufferedLayer);

      // force map to bounds
      if (checkValidObject(this.mapComponent)) {
        this.mapComponent.map.fitBounds(bufferedLayer.getBounds());
        this.mapComponent.saveZoomAndMapPosition();
        store.saveAction('addsavedgeojson');
      }
      return layer;
    }
    return null;
  }

  // get shapes that we saved on s3.  In order to create a share URL - a web URL
  // we can send to another users we need to be able to pass large geospatial datasets
  // we are using a lambda function/api to store the the files on s3 this will retreive this.
  //  the only thing in the url is the s3 bucket and file name
  async getShapesFromS3() {
    // start the working function so we have spinner active - informs
    // users the website is doing something
    store.setStoreItem('working_s3retreive', true);
    this.mapComponent.map.fireEvent('retreives3start');

    spinnerOn();
    // get the saved shapes state item - holds the s3 bucket and file name
    const currentshapes = store.getStateItem('savedshapes');
    const userareacount = store.getStateItem('userareacount');

    // remove old shapes so they are not duplicated.  also want to make sure make
    // sure we are replicating the shared map.
    Explore.removeExistingExplore();
    Explore.removeUserAreas();
    Explore.clearDetailsHolder();

    let newshapes = {};
    let count = 0;
    const checkobj = {}.hasOwnProperty;

    // using for loop because it allows await functionality with
    // async calls to zonal stats api.  this will ensure we wait for the promise to
    // resolve and is added to the store before we progress on. using a check for hasOwnProperty
    // to deal with all the prototpe entries
    for (const key in currentshapes) {  // eslint-disable-line
      if (checkobj.call(currentshapes, key)) {
        const nameSaved = currentshapes[key][0].name;

        // get bucket and file names for the user area, buffered user area, and zonal stats
        const userareaSaved = currentshapes[key][1].savedshape_userarea;
        const bufferedSaved = currentshapes[key][2].savedshape_userarea_buffered;
        const zonalSaved = currentshapes[key][3].savedshape_zonalstatsjson;

        let usershape = {};
        let bufferedshape = {};
        let zonalshape = {};

        // make sure each area is actuall object then retreive
        // the actual geospatial data from s3. no api required.
        // just a http get of data
        if (checkValidObject(userareaSaved)) {
          usershape = await this.StoreShapesAPI.httpGetSavedGeoJSON(userareaSaved.bucket,
            userareaSaved.key);
        }

        if (checkValidObject(bufferedSaved)) {
          bufferedshape = await this.StoreShapesAPI.httpGetSavedGeoJSON(bufferedSaved.bucket,
            bufferedSaved.key);
        }

        if (checkValidObject(zonalSaved)) {
          zonalshape = await this.StoreShapesAPI.httpGetSavedGeoJSON(zonalSaved.bucket,
            zonalSaved.key);
        }

        // counter for naming JSON object
        count += 1;

        // new geospatial data object for inserting into the userareas state item.
        // this items has the shapes we render on the map and has the zonal statiscs information
        // for the dashboard
        const newshape = {
          [`userarea${count}`]: [
            { name: nameSaved },
            { userarea: usershape },
            { userarea_buffered: bufferedshape },
            { zonalstatsjson: zonalshape }
          ]
        };

        // update the state item with new useras object
        const userareas = store.getStateItem('userareas');

        newshapes = { ...userareas, ...newshape };
        store.setStoreItem('userareas', newshapes);
        store.setStoreItem('savedshapes', currentshapes);
        store.setStoreItem('userareacount', userareacount);
      }
    }

    //  set the state items and turn of the site is working
    store.setStoreItem('userareas', newshapes);

    this.drawUserAreaFromUsereas();

    store.setStoreItem('working_s3retreive', false);
    this.mapComponent.map.fireEvent('retreives3end');
    spinnerOff();

    return null;
  }

  // sets overview text if on graphs or table
  static setOverviewText() {
    const graphstate = store.getStateItem('zonalactive');
    const activestate = graphstate[1];

    if (checkValidObject(activestate)) {
      if (activestate === 'graph' || activestate === 'table') {
        disableOverView();
      } else {
        enableOverView();
      }
    } else {
      enableOverView();
    }
  }

  // get hubs that we saved on s3.  In order to create a share URL - a web URL
  // we can send to another users we need to be able to pass large geospatial datasets
  // we are using a lambda function/api to store the the files on s3 this will retreive this.
  //  the only thing in the url is the s3 bucket and file name
  async getHubsFromS3() {
    // start the working function so we have spinner active - informs
    // users the website is doing something
    store.setStoreItem('working_s3retreive', true);
    this.mapComponent.map.fireEvent('retreives3start');

    spinnerOn();
    // get the saved shapes state item - holds the s3 bucket and file name
    const savedhubs = store.getStateItem('savedhubs');

    const newshapes = [];
    const checkobj = {}.hasOwnProperty;

    // using for loop because it allows await functionality with
    // async calls to zonal stats api.  this will ensure we wait for the promise to
    // resolve and is added to the store before we progress on. using a check for hasOwnProperty
    // to deal with all the prototpe entries
    for (const key in savedhubs) {  // eslint-disable-line
      if (checkobj.call(savedhubs, key)) {
        let hubsZonalshape = {};
        let simplifiedHubsZonalshape = {};
        const hubobj = savedhubs[key][1].hub;
        if (checkValidObject(savedhubs)) {
          hubsZonalshape = await this.StoreShapesAPI.httpGetSavedGeoJSON(hubobj.bucket,
            hubobj.key);

          // adds TARGET_FID to mean array
          hubsZonalshape.properties.mean.TARGET_FID = hubsZonalshape.properties.OBJECTID;
          // simplifies shape geometry
          simplifiedHubsZonalshape = HubIntersectionApi.simplifyshape(hubsZonalshape);

          // ga event action, category, label
          googleAnalyticsEvent('call', 'lambda', 'HubIntersectionApi');
        }
        // add hub geojson to array
        newshapes.push(simplifiedHubsZonalshape);
      }
    }

    store.setStoreItem('HubIntersectionJson', newshapes);
    this.drawHubsFromStateObject();
    this.drawZonalStatsForStoredHubs();
    Explore.sortHubsByHubScore();
    // draw the hubs and the zonal stats
    store.setStoreItem('working_s3retreive', false);
    this.mapComponent.map.fireEvent('retreives3end');
    spinnerOff();

    return null;
  }

  // get hubs that we saved on s3.  In order to create a share URL - a web URL
  // we can send to another users we need to be able to pass large geospatial datasets
  // we are using a lambda function/api to store the the files on s3 this will retreive this.
  //  the only thing in the url is the s3 bucket and file name
  async getNatureServeHubsFromS3() {
    // start the working function so we have spinner active - informs
    // users the website is doing something
    store.setStoreItem('working_s3retreive', true);
    this.mapComponent.map.fireEvent('retreives3start');

    spinnerOn();
    // get the saved shapes state item - holds the s3 bucket and file name
    const savedhubs = store.getStateItem('savedNatureServeHubs');

    const newshapes = [];
    const checkobj = {}.hasOwnProperty;

    // using for loop because it allows await functionality with
    // async calls to zonal stats api.  this will ensure we wait for the promise to
    // resolve and is added to the store before we progress on. using a check for hasOwnProperty
    // to deal with all the prototpe entries
    for (const key in savedhubs) {  // eslint-disable-line
      if (checkobj.call(savedhubs, key)) {
        let NatureServeHubsZonalshape = {};
        let simplifiedNatureServeHubsZonalshape = {};
        const hubobj = savedhubs[key][1].hub;
        if (checkValidObject(savedhubs)) {
          NatureServeHubsZonalshape = await this.StoreShapesAPI.httpGetSavedGeoJSON(hubobj.bucket,
            hubobj.key.replace('prod/hubs', 'prod/natureserve'));
          // adds TARGET_FID to mean array
          NatureServeHubsZonalshape.properties.mean =
            { ...NatureServeHubsZonalshape.properties };

          // simplifies shape geometry
          simplifiedNatureServeHubsZonalshape =
            NatureServeHubIntersectionApi.simplifyshape(NatureServeHubsZonalshape);

          // ga event action, category, label
          googleAnalyticsEvent('call', 'lambda', 'NatureServeHubIntersectionApi');
        }
        // add hub geojson to array
        newshapes.push(simplifiedNatureServeHubsZonalshape);
      }
    }

    store.setStoreItem('NatureServeHubIntersectionJson', newshapes);
    this.drawNatureServeHubsFromStateObject();
    this.drawZonalStatsForStoredNatureServeHubs();
    Explore.sortNatureServeHubsByHubScore();
    // draw the hubs and the zonal stats
    store.setStoreItem('working_s3retreive', false);
    this.mapComponent.map.fireEvent('retreives3end');
    spinnerOff();

    return null;
  }

  // used by search by location
  drawUserArea() {
    const userarea = store.getStateItem('userarea');
    if (checkValidObject(userarea)) {
      // convert geoJson to leaflet layer
      const layer = L.geoJson(userarea);
      const bufferedLayer = this.bufferArea(userarea);

      // add layer to the leaflet map
      this.drawAreaGroup.addLayer(layer);
      this.drawAreaGroup.addLayer(bufferedLayer);
      this.addUserAreaLabel(bufferedLayer);

      const activeNav = store.getStateItem('activeNav');

      switch (activeNav) {
        case 'main-nav-map-searchhubs':
          Explore.removeExistingHubs();
          this.getHubsZonal();
          this.drawHubsFromStateObject();
          this.drawZonalStatsForStoredHubs();
          break;
        case 'main-nav-map-examples':
          break;
        case 'main-nav-map-searchNShubs':
          Explore.removeExistingNatureServeHubs();
          this.getNatureServeHubsZonal();
          this.drawNatureServeHubsFromStateObject();
          this.drawZonalStatsForStoredNatureServeHubs();
          break;
        case 'main-nav-map':
          this.getZonal();
          break;
        default:
          // this.getZonal();
          break;
      }
      return layer;
    }
    return null;
  }

  // renders the shapes from the user areas state object
  drawUserAreaFromUsereas() {
    store.setStoreItem('working_drawlayers', true);
    spinnerOn();

    const currentshapes = store.getStateItem('userareas');

    Object.keys(currentshapes).forEach((key) => {
      const { name } = currentshapes[key][0];
      const { userarea } = currentshapes[key][1];
      const buffered = currentshapes[key][2].userarea_buffered;
      const zonal = currentshapes[key][3].zonalstatsjson;

      if (checkValidObject(userarea)) {
        // convert geoJson to leaflet layer
        const layer = L.geoJson(userarea);

        const HTMLName = makeHTMLName(name);
        this.bufferedoptions.className = `path-${HTMLName}`;

        const bufferedLayer = L.geoJson(buffered, this.bufferedoptions);

        // add mouserovers for the shapes.
        bufferedLayer.on({
          mouseover: (e) => {
            if (!isGraphActivetate()) {
              const path = e.target;
              const labelname = path.options.className.replace('path-', 'label-name-');
              const labelElem = document.getElementById(labelname);
              toggleLabelHighLightsOn(labelElem);
              const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
              const labelzElem = document.getElementById(labelzname);
              toggleLabelHighLightsOn(labelzElem);

              const shotChartsLabels = path.options.className.replace('path-', 'short-chart-');
              const shotChartsLabelsElem = document.getElementById(shotChartsLabels);
              toggleLabelHighLightsOn(shotChartsLabelsElem);

              const pathelem = document.querySelector(`.${path.options.className}`);
              togglePermHighLightsAllOff(pathelem);
              toggleMouseHighLightsOn(pathelem);
            }
          },
          mouseout: (e) => {
            if (!isGraphActivetate()) {
              const path = e.target;
              const labelname = path.options.className.replace('path-', 'label-name-');
              const labelElem = document.getElementById(labelname);
              toggleLabelHighLightsOff(labelElem);
              const labelzname = path.options.className.replace('path-', 'zonal-wrapper-');
              const labelzElem = document.getElementById(labelzname);
              toggleLabelHighLightsOff(labelzElem);

              const shotChartsLabels = path.options.className.replace('path-', 'short-chart-');
              const shotChartsLabelsElem = document.getElementById(shotChartsLabels);
              toggleLabelHighLightsOff(shotChartsLabelsElem);

              const pathelem = document.querySelector(`.${path.options.className}`);
              toggleMouseHighLightsOff(pathelem);
            }
          },
          click: (e) => {
            Explore.clickShape(e);
          }
        });

        // add layer to the leaflet map
        this.drawAreaGroup.addLayer(layer);
        this.drawAreaGroup.addLayer(bufferedLayer);

        this.addUserAreaLabel(bufferedLayer, name);

        if (checkValidObject(zonal.features)) {
          drawZonalStatsFromAPI(zonal.features[0].properties.mean, name, this.mapComponent);
        }

        Explore.enableShapeExistsButtons();
        Explore.dismissExploreDirections();

        return layer;
      }

      return null;
    });

    store.setStoreItem('working_drawlayers', false);
    spinnerOff();
    return null;
  }


  // handler for stopping (cancel) drawing on the map
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // the other vertexes
  // @param { Object } mapComponent object
  // @param { Object } mapInfoComponent object
  static addDrawVertexStop(mapComponent, mapInfoComponent) {
    mapComponent.map.on('draw:drawstop', () => {
      // this.removeExistingArea();
      Explore.removeDrawShapeToolTip();
      document.querySelector('.leaflet-draw').classList.remove('active');
      // must click the i button to do this action we will have to remove this
      // if we want users to always be able to click the map and do mapinfo
      // if (checkValidObject(mapInfoComponent)) {
      //   // re-add indentify
      //   mapInfoComponent.addMapClickIdentifyClickHandler();
      // }
    });
  }

  // handler for drawing the first vertex (green) on the map differently then
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // the other vertexes
  // @param { Object } mapComponent object
  static addDrawVertexHandler(mapComponent) {
    // color first vertex green
    mapComponent.map.on('draw:drawvertex', (e) => {
      const vertexElements = document.querySelectorAll('.leaflet-marker-icon.leaflet-div-icon.leaflet-editing-icon.leaflet-zoom-animated.leaflet-interactive');
      const fistVertexElement = vertexElements[0];
      fistVertexElement.className += ' leaflet-marker-icon-first';
    });
  }

  // clear zonalstats
  static clearDetails() {
    // this temp remove of stats while we work on multiple shapes.
    const zonalAreaWrapper = document.getElementById('zonal-area-wrapper');
    if (zonalAreaWrapper) {
      zonalAreaWrapper.innerHTML = '';
    }
  }

  // clear Details
  clearLayersAndDetails() {
    this.drawAreaGroup.clearLayers();
    Explore.clearDetails();
    enableOverView();
  }

  static removeExistingExplore() {
    store.removeStateItem('savedshapes');
    store.removeStateItem('savedshape');
    store.removeStateItem('userareas');
    store.removeStateItem('zonalstatsjson');
    Explore.resetshapescounter();
  }

  static removeUserAreas() {
    store.removeStateItem('userarea');
    store.removeStateItem('userarea_buffered');
    store.removeStateItem('projectfile');
  }

  static removeExistingHubs() {
    store.removeStateItem('HubIntersectionJson');
    store.removeStateItem('savedhubs');
  }

  static removeExistingNatureServeHubs() {
    store.removeStateItem('NatureServeHubIntersectionJson');
    store.removeStateItem('savedNatureServehubs');
  }

  static clearDetailsHolder() {
    const clearAreaElement = document.getElementById('details-holder');
    if (clearAreaElement) {
      clearAreaElement.innerHTML = '';
    }
  }

  static clearZonalHolderButtons() {
    const zonstatsholder = document.getElementById('zonal-stats-button-holder');
    if (zonstatsholder) {
      zonstatsholder.innerHTML = '';
    }
  }

  // remove the existing area
  removeExistingArea() {
    this.drawAreaGroup.clearLayers();
    Explore.clearZonalHolderButtons();
    const activeNav = store.getStateItem('activeNav');

    switch (activeNav) {
      case 'main-nav-map-searchhubs':
        Explore.removeExistingHubs();
        Explore.dismissExploreDirections();
        break;
      case 'main-nav-map-examples':
        break;
      case 'main-nav-map-searchNShubs':
        Explore.removeExistingNatureServeHubs();
        Explore.dismissExploreDirections();
        break;
      case 'main-nav-map':
        Explore.removeExistingExplore();
        Explore.removeUserAreas();
        Explore.dismissExploreDirections();
        break;
      default:
        // Explore.removeExistingExplore();
        // Explore.removeUserAreas();
        // Explore.dismissExploreDirections();
        break;
    }
  }

  // handler for click the button tp clear all drawings
  addClearAreaClickHandler() {
    // Click handler for you button to start drawing polygons
    const clearAreaElement = document.getElementById('btn-clear-area');
    clearAreaElement.addEventListener('click', (ev) => {
      // ga event action, category, label
      googleAnalyticsEvent('click', `explore ${store.getStateItem('activeNav')}`, 'remove areas');

      this.removeExistingArea();
      disableZonalButtons();

      // this temp remove of stats while we work on multiple shapes.
      Explore.clearDetails();
      Explore.disableShapeExistsButtons();

      const checkHubIntersectionJson = store.getStateItem('HubIntersectionJson');
      const checkNatureServeHubIntersectionJson = store.getStateItem('NatureServeHubIntersectionJson');
      const checkUserareas = store.getStateItem('userareas');
      const activeNav = store.getStateItem('activeNav');

      if (activeNav) {
        switch (activeNav) {
          case 'main-nav-map-searchhubs':
            if (checkValidObject(checkHubIntersectionJson)) {
              Explore.dismissExploreDirections();
            } else {
              Explore.updateExploreDirections(this.exlporeHubMessage);
            }
            break;
          case 'main-nav-map-examples':
            break;
          case 'main-nav-map-searchNShubs':
            if (checkValidObject(checkNatureServeHubIntersectionJson)) {
              Explore.dismissExploreDirections();
            } else {
              Explore.updateExploreDirections(this.exlporeNSHubMessage);
            }
            break;
          case 'main-nav-map':
            if (checkValidObject(checkUserareas)) {
              Explore.dismissExploreDirections();
            } else {
              Explore.updateExploreDirections(this.exlporeAssmentMessage);
            }
            break;
          default:
            // if (checkValidObject(checkUserareas)) {
            //   Explore.dismissExploreDirections();
            // } else {
            //   Explore.updateExploreDirections(this.exlporeAssmentMessage);
            // }
            break;
        }
      }
    });
  }

  static clearZonalStatsWrapperDiv() {
    const clearAreaElement = document.getElementById('zonal-area-wrapper');
    if (clearAreaElement) {
      clearAreaElement.innerHTML = '';
    }
  }

  static removeDrawShapeToolTip() {
    const tooltipContainerDelete = document.querySelector('.leaflet-draw-tooltip-top');
    if (tooltipContainerDelete) {
      tooltipContainerDelete.parentNode.removeChild(tooltipContainerDelete);
    }
  }

  static disableShapeExistsButtons() {
    const hasShapeHolder = document.getElementById('has-shape-holder');
    if (hasShapeHolder) {
      hasShapeHolder.classList.add('d-none');
    }
  }

  static enableShapeExistsButtons() {
    const hasShapeHolder = document.getElementById('has-shape-holder');
    if (hasShapeHolder) {
      hasShapeHolder.classList.remove('d-none');
    }
  }

  // handler for click the button drawing vertexes on the map
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // @param { Object } mapComponent object
  static addDrawAreaClickHandler(mapComponent) {
    // draw polygon options
    const options = {
      allowIntersection: false, // Restricts shapes to simple polygons
      drawError: {
        color: 'red', // Color the shape will turn when intersects
        message: '<strong>Oh snap!<strong> you can\'t draw a polygon that intersects itself!' // Message that will show when intersect
      }
    };

    // draw polygon handler
    const polygonDrawer = new L.Draw.Polygon(mapComponent.map, options);
    store.setStoreItem('polygonDrawer', String(polygonDrawer));
    store.removeStateItem('polygonDrawer');

    L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Click on the map to continue drawing the shape.';
    L.drawLocal.draw.handlers.polygon.tooltip.start = 'Click on the map to start drawing a shape';

    // Click handler for you button to start drawing polygons
    const drawAreaElement = document.getElementById('draw-area-btn');

    // lots of re-work needed
    drawAreaElement.addEventListener('click', (ev) => {
      // turn off other map click events expecting this
      //  to be indentify if we add other map click events
      //  we will have to add that back.  so this not ideal
      mapComponent.map.off('click');

      // ga event action, category, label
      googleAnalyticsEvent('click', `explore ${store.getStateItem('activeNav')}`, 'draw area');

      const bounds = mapComponent.map.getBounds();
      const topLeftCorner = bounds.getNorthWest();
      const TLpos = mapComponent.map.latLngToLayerPoint(topLeftCorner);

      // polygonDrawer.enable();
      // force click of draw polygon so we get cancel button;
      document.querySelector('.leaflet-draw-draw-polygon').click();
      document.querySelector('.leaflet-draw').classList.toggle('active');

      let tooltipContainer = document.querySelector('.leaflet-draw-tooltip');
      if (!tooltipContainer) {
        tooltipContainer = document.createElement('div');
        tooltipContainer.classList.add('leaflet-draw-tooltip');
        tooltipContainer.classList.add('leaflet-draw-tooltip-single');
      }

      let tooltipContainerSpan = document.querySelector('.leaflet-draw-tooltip span');
      if (tooltipContainerSpan) {
        tooltipContainerSpan.classList.add('d-flex');
        tooltipContainerSpan.classList.add('justify-content-right');
        tooltipContainerSpan.classList.add('draw-tip');
      } else {
        tooltipContainerSpan = document.createElement('span');
        tooltipContainerSpan.classList.add('d-flex');
        tooltipContainerSpan.classList.add('justify-content-right');
        tooltipContainerSpan.classList.add('draw-tip');
        tooltipContainerSpan.classList.add('leaflet-draw-tooltip');
        tooltipContainer.appendChild(tooltipContainerSpan);
      }

      const tooltipContainerDelete = document.querySelector('.leaflet-draw-tooltip-top');
      if (tooltipContainerDelete) {
        tooltipContainerDelete.parentNode.removeChild(tooltipContainerDelete);
      }

      const tooltipContainerNew = tooltipContainer.cloneNode(true);
      tooltipContainerNew.style.width = '100%';
      tooltipContainerNew.style.left = `${TLpos}px`;
      tooltipContainerNew.style.top = `${TLpos.y + 50}px`;
      tooltipContainerNew.style.height = '50px';
      tooltipContainerNew.style.fontSize = '2em';
      tooltipContainerNew.classList.remove('leaflet-draw-tooltip');
      tooltipContainerNew.classList.remove('leaflet-draw-tooltip-single');
      tooltipContainerNew.classList.add('leaflet-draw-tooltip-top');
      tooltipContainerNew.classList.add('leaflet-draw-tooltip-single-top');

      mapComponent.map.addEventListener('mousemove', (e) => {
        const tooltipContainerNewSpan = document.querySelector('.leaflet-draw-tooltip-top span');
        const tooltipContainerSpanList = document.querySelector('.leaflet-draw-tooltip span');

        if (tooltipContainerSpanList) {
          tooltipContainerNewSpan.innerHTML = tooltipContainerSpanList.innerHTML;
        }
      });
      document.getElementById('map').appendChild(tooltipContainerNew);
    });
  }

  // add leaflet drawbuttons to leaflet Control area
  // only adding fro future use.
  addDrawButtons(mapComponent) {
    const options = {
      position: 'topleft',
      draw: {
        polyline: false,
        polygon: {
          allowIntersection: false, // Restricts shapes to simple polygons
          message: 'test',
          drawError: {
            color: '#e1e100', // Color the shape will turn when intersects
            message: '<strong>Oh snap!<strong> you can\'t draw a polygon that intersects itself!'// Message that will show when intersect
          }
        },
        circle: false, // Turns off this drawing tool
        circlemarker: false,
        rectangle: false,
        marker: false,
        edit: false
      }
    };

    const drawControl = new L.Control.Draw(options);
    mapComponent.map.addControl(drawControl);

    this.addDrawStartedHandler(mapComponent);
  }

  // handler for when drawing is started on the map
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // @param { Object } mapComponent object
  // @param { Object } mapInfoComponent object
  addDrawStartedHandler(mapComponent) {
    // Assumming you have a Leaflet map accessible
    mapComponent.map.on('drawstart', (e) => {
      // remove existing Area
      this.removeExistingArea();
      // turn off other map click events expecting this
      //  to be indentify if we add other map click events
      //  we will have to add that back.  so this not ideal
      mapComponent.map.off('click');
    });
  }

  // add label to layer.
  // label option defined in Explore class
  addUserAreaLabel(layer, name) {
    // if name not passed create the default area name
    // this happens when the user is drawing a new area
    let newname = name;
    if (!checkValidObject(name)) {
      let shapecount = store.getStateItem('userareacount');
      if (!checkValidObject(shapecount)) {
        shapecount = 1;
      }

      newname = `${this.defaultAreaName}${shapecount}`;
    }

    // labels nees a sec so it's placed on the correct location
    setTimeout(() => { layer.bindTooltip(newname, this.labelOptions); }, 50);
  }

  // handler for when drawing is complete on the map
  // adding not as hanlder callback so I can use this (class) calls
  // would be better to handle this as a traditional callback
  // @param { Object } mapComponent object
  // @param { Object } mapInfoComponent object
  async addDrawVertexCreatedHandler(mapComponent, mapInfoComponent) {
    // Assumming you have a Leaflet map accessible
    mapComponent.map.on('draw:created', async (e) => {
      document.querySelector('.leaflet-draw').classList.remove('active');
      Explore.removeDrawShapeToolTip();
      const { layer } = e;
      Explore.storeshapescounter();
      const bufferedLayer = this.bufferArea(layer.toGeoJSON());
      const activeNav = store.getStateItem('activeNav');

      switch (activeNav) {
        case 'main-nav-map-searchhubs':
          break;
        case 'main-nav-map-examples':
          break;
        case 'main-nav-map-searchNShubs':
          break;
        case 'main-nav-map':
          // add layer to the leaflet map
          this.drawAreaGroup.addLayer(layer);
          this.drawAreaGroup.addLayer(bufferedLayer);

          // start adding the user draw shape to the map
          layer.addTo(mapComponent.map);
          this.addUserAreaLabel(bufferedLayer);
          break;
        default:
          // // add layer to the leaflet map
          // this.drawAreaGroup.addLayer(layer);
          // this.drawAreaGroup.addLayer(bufferedLayer);
          //
          // // start adding the user draw shape to the map
          // layer.addTo(mapComponent.map);
          // this.addUserAreaLabel(bufferedLayer);
          break;
      }

      // must click the i button to do this action we will have to remove this
      // if we want users to always be able to click the map and do mapinfo
      // if (checkValidObject(mapInfoComponent)) {
      //   // re-add indentify
      //   mapInfoComponent.addMapClickIdentifyClickHandler();
      // }

      const geojson = layer.toGeoJSON();
      // update store
      store.setStoreItem('lastaction', 'draw area');
      store.setStoreItem('userarea', geojson);

      switch (activeNav) {
        case 'main-nav-map-searchhubs':
          Explore.removeExistingHubs();
          Explore.clearZonalStatsWrapperDiv();
          this.drawAreaGroup.clearLayers();
          Explore.clearZonalHolderButtons();
          await this.getHubsZonal();
          this.drawHubsFromStateObject();
          this.drawZonalStatsForStoredHubs();
          break;
        case 'main-nav-map-examples':
          break;
        case 'main-nav-map-searchNShubs':
          Explore.removeExistingNatureServeHubs();
          Explore.clearZonalStatsWrapperDiv();
          this.drawAreaGroup.clearLayers();
          Explore.clearZonalHolderButtons();
          await this.getNatureServeHubsZonal();
          this.drawNatureServeHubsFromStateObject();
          this.drawZonalStatsForStoredNatureServeHubs();
          break;
        case 'main-nav-map':
          try {
            await this.getZonal();
          } catch (ev) {
            // TODO: display message to the user (was the area too big? what happened?)
            this.rollbackUserArea(layer, bufferedLayer);
            store.setStoreItem('working_zonalstats', false);
            spinnerOff();
          }
          break;
        default:
          // try {
          //   await this.getZonal();
          // } catch (ev) {
          //   // TODO: display message to the user (was the area too big? what happened?)
          //   this.rollbackUserArea(layer, bufferedLayer);
          //   store.setStoreItem('working_zonalstats', false);
          //   spinnerOff();
          // }
          break;
      }
    });
  }

  rollbackUserArea(layer, bufferedLayer) {
    store.removeStateItem('userarea');
    store.removeStateItem('userarea_buffered');
    this.drawAreaGroup.removeLayer(layer);
    this.drawAreaGroup.removeLayer(bufferedLayer);
    const userareacount = store.getStateItem('userareacount');
    store.setStoreItem('userareacount', userareacount - 1);
  }

  static resetshapescounter() {
    store.removeStateItem('userareacount');
  }

  static storeshapescounter() {
    let userareacount = store.getStateItem('userareacount');
    if (!checkValidObject(userareacount)) {
      userareacount = 1;
    } else {
      userareacount += 1;
    }

    store.setStoreItem('userareacount', userareacount);
    return userareacount;
  }

  // add a new shape to user shape store
  storeShapes() {
    const currentshapes = store.getStateItem('userareas');
    const shapecount = store.getStateItem('userareacount');
    const name = `${this.defaultAreaName}${shapecount}`;
    const newshape = {
      [`userarea${shapecount}`]: [
        { name },
        { userarea: store.getStateItem('userarea') },
        { userarea_buffered: store.getStateItem('userarea_buffered') },
        { zonalstatsjson: store.getStateItem('zonalstatsjson') }
      ]
    };

    const newshapes = { ...currentshapes, ...newshape };
    store.setStoreItem('userareas', newshapes);
    return name;
  }

  // saves shape to s3 and creates object in state.
  async saveUserShapesToS3() {
    const currentSavedShapes = store.getStateItem('savedshapes');

    // get the current users shapes
    const userarea = store.getStateItem('userarea');
    const buffered = store.getStateItem('userarea_buffered');
    const zonal = store.getStateItem('zonalstatsjson');
    const shapecount = store.getStateItem('userareacount');

    const savedUserarea = await this.StoreShapesAPI.saveShape(userarea);
    const savedUserareaBuffered = await this.StoreShapesAPI.saveShape(buffered);
    const savedZonalStatsJSON = await this.StoreShapesAPI.saveShape(zonal);

    const name = `${this.defaultAreaName}${shapecount}`;

    const newSavedShape = {
      [`savedshape${shapecount}`]: [
        { name },
        { savedshape_userarea: savedUserarea },
        { savedshape_userarea_buffered: savedUserareaBuffered },
        { savedshape_zonalstatsjson: savedZonalStatsJSON }
      ]
    };

    const newshapes = { ...currentSavedShapes, ...newSavedShape };
    store.setStoreItem('savedshapes', newshapes);
    return name;
  }


  addUpdateStatisticsHandler() {
    const UpdateZonalStatsBtn = document.getElementById('btn-update-zonal-stats');
    UpdateZonalStatsBtn.addEventListener('click', this.updateZonal.bind(this));
  }

  // Listens for click events on the upload shape button.
  static addListAreasHandler() {
    const ListAreasBtn = document.getElementById('btn-list-areas');
    if (checkValidObject(ListAreasBtn)) {
      ListAreasBtn.addEventListener('click', e => Explore.restoreshapes(e));
    }
  }

  // Listens for click events on the update statistics.
  static restoreshapes() {
    const ListAreasBtn = document.getElementById('btn-update-zonal-stats');
    if (checkValidObject(ListAreasBtn)) {
      ListAreasBtn.addEventListener('click', e => Explore.restoreshapes(e));
    }
  }

  static addUploadShapeToolTip() {
    const toolTemplate = '<div class="tooltip upload-shapefile" role="tooltip">' +
              '  <div class="arrow"></div><div class="tooltip-inner"></div>' +
              '  <div class="close-upload-shapefile"><i class="fa fa-times" aria-hidden="true"></i></div>' +
              '</div>';


    const uploadFeaturesBtn2 = document.querySelector('#upload-shapefile-btn');
    if (uploadFeaturesBtn2) {
      uploadFeaturesBtn2.setAttribute('title', 'The shapefile must include a .shp, .shx, .dbf, and .prj file. The upload is limited to 25-30 shapes.');
    }

    $(() => {
      $('#upload-shapefile-btn-tt [data-toggle="tooltip"]').tooltip({
        trigger: 'hover focus',
        template: toolTemplate
      });

      $('#upload-shapefile-btn-tt [data-toggle="tooltip"]').on('shown.bs.tooltip', () => {
        const elems = document.querySelectorAll('.tooltip.upload-shapefile .close-upload-shapefile');
        elems.forEach((elem) => {
          if (elem) {
            elem.addEventListener('click', (e) => {
              const toolTipElem = Explore.ParentTooltip(e.target, 'tooltip');
              $(toolTipElem).tooltip('hide');
            });
          }
        });
      });
    });
  }

  static addUDrawShapeToolTip() {
    const toolTemplate = '<div class="tooltip draw-shapefile" role="tooltip">' +
              '  <div class="arrow"></div><div class="tooltip-inner"></div>' +
              '  <div class="close-draw-shapefile"><i class="fa fa-times" aria-hidden="true"></i></div>' +
              '</div>';


    const uploadFeaturesBtn2 = document.querySelector('#draw-area-btn');
    if (uploadFeaturesBtn2) {
      uploadFeaturesBtn2.setAttribute('title', 'Sketch an area on the map.');
    }

    $(() => {
      $('#draw-area-btn[data-toggle="tooltip"]').tooltip({
        trigger: 'hover focus',
        template: toolTemplate
      });

      $('#draw-area-btn[data-toggle="tooltip"]').on('shown.bs.tooltip', () => {
        const elems = document.querySelectorAll('.tooltip.draw-shapefile .close-draw-shapefile');
        elems.forEach((elem) => {
          if (elem) {
            elem.addEventListener('click', (e) => {
              const toolTipElem = Explore.ParentTooltip(e.target, 'tooltip');
              $(toolTipElem).tooltip('hide');
            });
          }
        });
      });
    });
  }


  // Listens for click events on the upload shape button.
  addUploadShapeHandler() {
    const uploadFeaturesBtns = document.querySelectorAll('#upload-shape-btn');
    uploadFeaturesBtns.forEach((elem) => {
      if (elem) {
        elem.addEventListener('click', e => Explore.clickUploadHandler());
        elem.addEventListener('change', e => this.fileSelectHandler(e));
      }
    });
  }

  static clickUploadHandler() {
    // ga event action, category, label
    googleAnalyticsEvent('click', `explore ${store.getStateItem('activeNav')}`, 'upload shapefile');
  }

  // clears file input, incase user switches tabs then
  // uploads the same file.
  static clearFileInput(elem) {
    try {
      elem.value = null;
    } catch (e) { return null; }
    if (elem.value) {
      elem.parentNode.replaceChild(elem.cloneNode(true), elem);
    }
    return null;
  }

  fileSelectHandler(event) {
    store.setStoreItem('working_zonalstats', true);
    const fileList = event.target.files;
    const files = Explore.convertFileListToArray(fileList);
    this.processUploadedFiles(files);
    Explore.clearFileInput(document.getElementById(event.target.id));
  }

  async processUploadedFiles(files) {
    spinnerOn();
    store.setStoreItem('working_zonalstats', true);
    const fileSets = [];
    const featuresReady = [];
    // Treat each folder in a zip archive as its own set of files.
    const zips = files.filter(file => Explore.fileExt(file.name) === 'zip');
    for (let i = 0; i < zips.length; i += 1) {
      const zip = zips[i];
      let zipFileSets;
      try {
        zipFileSets = await Explore.readZip(zip);
      } catch (e) {
        // alert('Error opening zip archive.');
        zipFileSets = [];
      }
      if (zipFileSets.length) {
        fileSets.push(...zipFileSets);
      }
    }
    // Non-zip files are all put into one file set.
    const nonZips = files.filter(file => Explore.fileExt(file.name) !== 'zip');
    if (nonZips.length) { fileSets.push(nonZips); }
    Explore.clearZonalStatsWrapperDiv();
    for (let i = 0; i < fileSets.length; i += 1) {
      const fileSet = fileSets[i];
      const features = await Explore.extractFeaturesFromFileset(fileSet);
      featuresReady.push(...features);
    }
    const activeNav = store.getStateItem('activeNav');
    if (activeNav) {
      switch (activeNav) {
        case 'main-nav-map-searchhubs':
          Explore.removeExistingHubs();
          this.drawAreaGroup.clearLayers();
          for (let i = 0; i < featuresReady.length; i += 1) {
            store.setStoreItem('userarea', featuresReady[i]);
            await this.getHubsZonal();
          }
          Explore.sortHubsByHubScore();
          // draw zonal stats for each shape
          this.drawZonalStatsForStoredHubs();
          this.drawHubsFromStateObject();
          this.mapComponent.map.fireEvent('zonalstatsend');
          break;
        case 'main-nav-map-examples':
          break;
        case 'main-nav-map-searchNShubs':
          Explore.removeExistingNatureServeHubs();
          this.drawAreaGroup.clearLayers();
          for (let i = 0; i < featuresReady.length; i += 1) {
            store.setStoreItem('userarea', featuresReady[i]);
            await this.getNatureServeHubsZonal();
          }
          Explore.sortNatureServeHubsByHubScore();
          // draw zonal stats for each shape
          this.drawZonalStatsForStoredNatureServeHubs();
          this.drawNatureServeHubsFromStateObject();
          this.mapComponent.map.fireEvent('zonalstatsend');
          break;
        case 'main-nav-map':
          // Assume we're on the default explore tab
          this.drawAreaGroup.clearLayers();
          for (let i = 0; i < featuresReady.length; i += 1) {
            await this.addFeatureAsMapLayer(featuresReady[i]);
          }
          break;
        default:
          // // Assume we're on the default explore tab
          // this.drawAreaGroup.clearLayers();
          // for (let i = 0; i < featuresReady.length; i += 1) {
          //   await this.addFeatureAsMapLayer(featuresReady[i]);
          // }
          break;
      }
    }

    try {
      this.mapComponent.map.fitBounds(this.drawAreaGroup.getBounds());
      this.mapComponent.saveZoomAndMapPosition();
    } catch (e) {
      Explore.doNothing();
    }

    store.setStoreItem('working_zonalstats', false);
    spinnerOff();
  }

  drawZonalStatsForStoredNatureServeHubs() {
    const NatureServeHubs = store.getStateItem('NatureServeHubIntersectionJson');
    for (let i = 0; i < NatureServeHubs.length; i += 1) {
      const name = `${NatureServeHubs[i].properties.mean.TARGET_FID}`.toString().trim();
      drawZonalStatsFromAPI(NatureServeHubs[i].properties.mean, name, this.mapComponent.map);
    }
  }

  drawZonalStatsForStoredHubs() {
    const hubs = store.getStateItem('HubIntersectionJson');
    for (let i = 0; i < hubs.length; i += 1) {
      const name = `${hubs[i].properties.mean.TARGET_FID}`.toString().trim();
      drawZonalStatsFromAPI(hubs[i].properties.mean, name, this.mapComponent.map);
    }
  }


  static sortNatureServeHubsByHubScore() {
    const NatureServehubsHubs = store.getStateItem('NatureServeHubIntersectionJson');
    const NatureServeHubIntersectionJsonSorted = NatureServehubsHubs.sort((a, b) => {
      if (a.properties.mean.ns_hubs > b.properties.mean.ns_hubs) {
        return -1;
      }
      if (a.properties.mean.ns_hubs < b.properties.mean.ns_hubs) {
        return 1;
      }
      // a must be equal to b
      return 0;
    });
    store.setStoreItem('NatureServeHubIntersectionJson', NatureServeHubIntersectionJsonSorted);
  }

  static sortHubsByHubScore() {
    const hubs = store.getStateItem('HubIntersectionJson');
    const HubIntersectionJsonSorted = hubs.sort((a, b) => {
      if (a.properties.mean.hubs > b.properties.mean.hubs) {
        return -1;
      }
      if (a.properties.mean.hubs < b.properties.mean.hubs) {
        return 1;
      }
      // a must be equal to b
      return 0;
    });
    store.setStoreItem('HubIntersectionJson', HubIntersectionJsonSorted);
  }

  static async extractFeaturesFromFileset(files) {
    const shpfileFiles = files
      .filter(file => ['shp', 'dbf', 'prj'].indexOf(Explore.fileExt(file.name)) > -1);
    const otherFiles = files.filter(file => shpfileFiles.indexOf(file) === -1);
    const shpfileBundles = Explore.bundleShpfileFiles(shpfileFiles);
    const features = [];

    if (shpfileBundles.length) {
      const bundleToProcess = shpfileBundles[0];
      let geojsonFromShpfiles;
      try {
        geojsonFromShpfiles = await Explore.convertShpfileBundleToGeojson(bundleToProcess);
      } catch (e) {
        if (e instanceof RangeError) {
          Explore.doNothing();
          // alert('Error processing shapefile. Please use a
          // shapefile exported from QGIS or ArcGIS.');
        }
        geojsonFromShpfiles = { features: [] };
      }
      for (let i = 0; i < geojsonFromShpfiles.features.length; i += 1) {
        features.push(geojsonFromShpfiles.features[i]);
      }
    }

    for (let i = 0; i < otherFiles.length; i += 1) {
      let geojsonFromFile;
      try {
        geojsonFromFile = await Explore.readGeojsonFile(otherFiles[i]);
      } catch (e) {
        // alert('Error reading geojson.');
        geojsonFromFile = {};
      }
      if (geojsonFromFile.type === 'FeatureCollection') {
        for (let j = 0; j < geojsonFromFile.features.length; j += 1) {
          features.push(geojsonFromFile.features[j]);
        }
      }
      if (geojsonFromFile.type === 'Feature') {
        features.push(geojsonFromFile);
      }
    }
    return features;
  }

  async addFeatureAsMapLayer(feature) {
    Explore.storeshapescounter();
    if (!checkValidObject(feature)) {
      return false;
    }
    const newLayer = L.geoJson(feature);

    store.setStoreItem('lastaction', 'upload_shape');
    store.setStoreItem('userarea', newLayer.toGeoJSON());

    const bufferedLayer = this.bufferArea(newLayer.toGeoJSON());

    // add layer to the leaflet map
    this.drawAreaGroup.addLayer(newLayer);
    this.drawAreaGroup.addLayer(bufferedLayer);
    this.addUserAreaLabel(bufferedLayer);

    store.saveAction('addsavedgeojson');
    try {
      await this.getZonal();
    } catch (e) {
      // TODO: Display a message to the user
      // console.log('rollback uploaded feature');
      this.rollbackUserArea(newLayer, bufferedLayer);
      store.setStoreItem('working_zonalstats', false);
      spinnerOff();
    }
    return true;
  }

  static async readGeojsonFile(file) {
    const text = await Explore.readFileAsync(file, 'readAsText');
    const geojson = JSON.parse(text);
    return geojson;
  }

  static bundleShpfileFiles(shpfileFiles) {
    const shpfileFilenames = new Set(
      shpfileFiles.map(file => Explore.getFilenameWithoutExt(file.name))
    );
    const shpfileBundles = [];
    shpfileFilenames.forEach((filename) => {
      const files = shpfileFiles
        .filter(file => Explore.getFilenameWithoutExt(file.name) === filename);
      const shp = files.filter(file => Explore.fileExt(file.name) === 'shp')[0];
      if (shp) {
        const obj = {}; obj.shp = shp;
        const dbf = files.filter(file => Explore.fileExt(file.name) === 'dbf')[0];
        const prj = files.filter(file => Explore.fileExt(file.name) === 'prj')[0];
        if (dbf) obj.dbf = dbf;
        if (prj) obj.prj = prj;
        shpfileBundles.push(obj);
      }
    });
    return shpfileBundles;
  }

  /**
  * Read a zip file and organize its contents by folder.
  *
  * Returns an Array of Arrays, where sub-arrays are lists of files
  * broken out by folder (top-level of zip is its own folder).
  *
  * @param archive is a File object representing a zip file
  */
  static async readZip(archive) {
    const jszip = new JSZip();
    let folders;
    try {
      folders = await jszip.loadAsync(archive).then(
        (zip) => {
          const files = [];
          Object.keys(zip.files).forEach((key) => {
            const entry = zip.files[key];
            if (!entry.dir) files.push(entry);
          });
          return Explore.readZipFolders(files);
        }
      );
    } catch (e) {
      // alert('Error opening zip archive.');
      folders = {};
    }
    const fileSets = [];
    const keys = Object.keys(folders);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const fileProms = folders[key]
        .filter(file => Explore.isValidFile(file))
        .map((file) => {
          try {
            const filename = file.name.split('/').slice(-1).join('');
            return file.async('blob').then(
              blob => new File([blob], filename),
            );
          } catch (e) {
            Explore.doNothing();
            // alert('Error reading file!');
          }
          return null;
        })
      // filter undefined entries
        .filter(prom => prom);
      const files = await Promise.all(fileProms);
      fileSets.push(files);
    }
    return fileSets;
  }

  static readZipFolders(files) {
    const folders = { top: [] };
    files.forEach((f) => {
      let dir = f.name.split('/').slice(0, -1).join('');
      if (!dir) dir = 'top';
      if (!folders[dir]) folders[dir] = [];
      folders[dir].push(f);
    });
    return folders;
  }

  static async convertShpfileBundleToGeojson(bundle) {
    const dbf = await Explore.readFileAsync(bundle.dbf);
    const shp = await Explore.readFileAsync(bundle.shp);
    const geojson = await shapefile.read(shp, dbf);
    if (bundle.prj) {
      const prj = await Explore.readFileAsync(bundle.prj, 'readAsText');
      geojson.features = geojson.features
        .map(feature => Explore.convertFeatureProjection(feature, prj));
    }
    return geojson;
  }

  static convertFeatureProjection(feature, prj) {
    const converted = feature;
    converted.geometry.coordinates = feature.geometry.coordinates
      .map(coordSet => coordSet.map(coord => proj4(prj, 'EPSG:4326', coord)));
    return converted;
  }

  static readFileAsync(file, readFunc = 'readAsArrayBuffer', resolveUndefinedFiles = true) {
    return new Promise((resolve, reject) => {
      if (file !== undefined) {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          resolve(event.target.result);
        };
        fileReader.onerror = (error) => {
          reject(error);
        };
        fileReader[readFunc](file);
      } else if (resolveUndefinedFiles) {
        resolve();
      } else {
        reject(new Error('No file specified.'));
      }
    });
  }

  static getFilenameWithoutExt(filename) {
    return filename.split('.').slice(0, -1).join('');
  }

  static isValidFile(file) {
    const validExts = ['geojson', 'json', 'shp', 'dbf', 'prj'];
    const isValid = validExts.filter(ext => ext === Explore.fileExt(file.name)).length;
    return Boolean(isValid);
  }

  static replaceFilenameExtWith(ext, filename) {
    const nameform = filename.split('.').slice(0, -1).join('');
    return [nameform, ext].join('.');
  }

  static fileExt(filename) {
    return filename.split('.').pop();
  }

  static convertFileListToArray(fileList) {
    const files = [];
    const len = fileList.length;
    let i = 0;
    while (i < len) {
      files.push(fileList.item(i));
      i += 1;
    }
    return files;
  }
}
