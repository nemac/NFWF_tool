/* eslint import/no-webpack-loader-syntax: off */
import { yaml } from 'js-yaml';
import L from 'leaflet';

import caseStudyConfig from 'js-yaml-loader!../config/caseStudyConfig.yml';  // eslint-disable-line
import caseStudiesTemplate from '../templates/case_studies.html';
import { mapConfig } from '../config/mapConfig';

import { Store } from './store';

import {
  checkValidObject,
  googleAnalyticsEvent
} from './utilitys';

const store = new Store({});

// lint overirdes
store.setStoreItem('yaml', yaml);
store.removeStateItem('yaml');

export class CaseStudies {
  constructor(mapComponent, exlore) {
    this.mapComponent = mapComponent;
    this.drawAreaGroup = exlore.drawAreaGroup;
    this.caseStudyConfig = caseStudyConfig;
    this.caseStudies = caseStudyConfig.caseStudies;
    this.labelOptions = {
      className: 'userarealabel',
      direction: 'center',
      noHide: false,
      clickable: false,
      permanent: true
    };
  }

  // only display layers that are needed in current tab
  // this especially true for switching between targeted watershed data
  // and the default regional data.
  // the config has an item source that holds targetedwatershed or regional
  onlyDisplayValidLayers() {
    const validSource = 'regional';

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

  initalize() {
    const zonalAreaWrapper = document.getElementById('zonal-area-wrapper');
    if (zonalAreaWrapper) {
      zonalAreaWrapper.innerHTML = caseStudiesTemplate;

      const heading = document.querySelector('.explore-row-container .sticky-top.sideheading');
      CaseStudies.displayOff(heading);
    }

    this.addClearEvent();
    this.onlyDisplayValidLayers();
    this.caseStudies.forEach((study) => {
      // update main study narrative
      CaseStudies.updateNarrative(study.htmlid,
        study.narrative);
      CaseStudies.updateName(study.htmlid,
        study.name);

      study.steps.forEach((step) => {
        CaseStudies.updateNarrative(step.htmlid,
          step.narrative);
        CaseStudies.updateName(step.htmlid,
          step.name);

        if (step.nexthtmlid) {
          this.addNextEvent(step.htmlid,
            step.nexthtmlid,
            study.htmlid,
            step.position);
        }

        if (step.lasthtmlid) {
          const lastposition = CaseStudies.getLastPosition(step.position);
          this.addLastEvent(step.htmlid,
            step.lasthtmlid,
            study.htmlid,
            lastposition);
        }

        if (step.actions.layerToggle) {
          this.updateLayerToggleActionEvent(step.htmlid,
            step.actions.layerToggle,
            false);
        }

        if (step.lastactions.layerToggle) {
          this.updateLayerToggleActionEvent(step.htmlid,
            step.lastactions.layerToggle,
            true);
        }

        if (step.actions.legendScroll) {
          CaseStudies.legendScroll(step.htmlid,
            step.actions.legendScroll,
            false);
        }

        if (step.lastactions.legendScroll) {
          CaseStudies.legendScroll(step.htmlid,
            step.lastactions.legendScroll,
            true);
        }

        if (step.actions.legendToggle) {
          CaseStudies.updateLegendToggleActionEvent(step.htmlid,
            step.actions.legendToggle,
            false);
        }

        if (step.lastactions.legendToggle) {
          CaseStudies.updateLegendToggleActionEvent(step.htmlid,
            step.lastactions.legendToggle,
            true);
        }

        if (step.actions.geojson) {
          this.updateDrawGeoJSONActionEvent(step.htmlid,
            step.actions.geojsonlabel,
            step.actions.geojson,
            false);
        }

        if (step.lastactions.geojsonlabel) {
          this.updateDrawGeoJSONActionEvent(step.htmlid,
            step.actions.geojsonlabel,
            step.lastactions.geojsonlabel,
            false);
        }

        if (step.actions.viewerlink) {
          CaseStudies.addViewerLinkEvent(step.htmlid, step.actions.viewerlink, step.nexthtmlid);
          if (step.actions.name) {
            CaseStudies.updateActionName(step.htmlid, step.actions.name);
          }
        }
      });
    });
  }

  addClearEvent() {
    const selector = '.figure-caption.title-caption.sticky-top';
    const elems = document.querySelectorAll(selector);
    elems.forEach((elem) => {
      if (elem) {
        elem.addEventListener('click', (e) => {
          CaseStudies.descriptionOn();
          this.unCheckLayers();
          CaseStudies.collapseLayerLegends();
          this.drawAreaGroup.clearLayers();
          CaseStudies.clearPosition();
          CaseStudies.setFirstPositionActive();
          // ga event action, category, label
          googleAnalyticsEvent('click', 'example', elem.getAttribute('data-target'));
        });
      }
    });
  }

  unCheckLayers() {
    const layers = store.getStateItem('mapLayerDisplayStatus');
    const validSource = 'regional';
    // get the layer list from the config file
    const { TMSLayers } = mapConfig;
    Object.keys(layers).forEach((layer) => {
      // only tuggle if regional data. targeted watershed
      // data is not used in case studies
      const asource = TMSLayers.filter(TMSlayer => (
        TMSlayer.id === layer && TMSlayer.source === validSource
      ));
      if (layers[layer] && asource.length > 0) {
        this.layerToggle(layer);
      }
    });
  }

  static collapseLayerLegends() {
    const layers = store.getStateItem('mapLayerDisplayStatus');
    Object.keys(layers).forEach((layer) => {
      CaseStudies.legendToggleOff(layer);
    });
  }

  static getLastPosition(position) {
    let lastposition = position - 2;
    if (lastposition < -1) {
      lastposition = 0;
    }
    return lastposition;
  }

  static clearPosition() {
    const selector = '.position';
    const elems = document.querySelectorAll(selector);
    elems.forEach((elem) => {
      elem.classList.remove('active');
    });
  }

  static setFirstPositionActive() {
    const selector = '.position-0';
    const elems = document.querySelectorAll(selector);
    elems.forEach((elem) => {
      elem.classList.add('active');
    });
  }

  static addPosition(studyhtmlid, position) {
    const selector = `#${studyhtmlid}  #positions .position-${position + 1}`;
    const elem = document.querySelector(selector);
    if (elem) {
      CaseStudies.clearPosition();
      elem.classList.add('active');
    }
  }

  static descriptionOff() {
    const elems = document.querySelectorAll('.narrative-main');
    elems.forEach((elem) => {
      if (elem) {
        elem.classList.add('steps-active');
      }
    });
  }

  static descriptionOn() {
    const elems = document.querySelectorAll('.narrative-main');
    elems.forEach((elem) => {
      if (elem) {
        elem.classList.remove('steps-active');
      }
    });
  }

  addNextEvent(htmlid, nexthtmlid, studyhtmlid, position) {
    const selector = `#${htmlid} #action`;
    const elem = document.querySelector(selector);
    if (elem) {
      elem.addEventListener('click', (e) => {
        this.unCheckLayers();
        CaseStudies.collapseLayerLegends();

        CaseStudies.descriptionOff();
        CaseStudies.addPosition(studyhtmlid, position);
        CaseStudies.displayOffStep(htmlid);
        CaseStudies.displayOnStep(nexthtmlid);
      });
    }
  }

  addLastEvent(htmlid, lasthtmlid, studyhtmlid, position) {
    const selector = `#${htmlid} #action-last`;
    const elem = document.querySelector(selector);
    if (elem) {
      elem.addEventListener('click', (e) => {
        if (position < 0) {
          this.unCheckLayers();
          CaseStudies.collapseLayerLegends();
          this.drawAreaGroup.clearLayers();
        }
        this.unCheckLayers();
        CaseStudies.collapseLayerLegends();

        CaseStudies.addPosition(studyhtmlid, position);
        CaseStudies.displayOffStep(htmlid);
        CaseStudies.displayOnStep(lasthtmlid);
      });
    }
  }

  static displayOnStep(htmlid) {
    const selector = `#${htmlid}`;
    const elem = document.querySelector(selector);
    CaseStudies.displayActionButton(elem);
  }

  static displayOffStep(htmlid) {
    const selector = `#${htmlid}`;
    const elem = document.querySelector(selector);
    CaseStudies.displayOff(elem);
  }

  zoomToGeoJson(zoomlayer) {
    const zoomBounds = zoomlayer.getBounds();
    this.mapComponent.map.flyToBounds(zoomBounds.pad(4));
  }


  static displayActionButton(elem) {
    if (elem) {
      elem.classList.remove('d-none');
    }
  }

  static displayOff(elem) {
    if (elem) {
      elem.classList.add('d-none');
    }
  }

  // add label to layer.
  // label option defined in Explore class
  addUserAreaLabel(layer, name) {
    // if name not passed create the default area name
    // this happens when the user is drawing a new area
    let newname = name;
    if (!checkValidObject(name)) {
      newname = 'Case Study Area';
    }
    // labels needs a sec so it's placed on the correct location
    setTimeout(() => { layer.bindTooltip(newname, this.labelOptions); }, 50);
  }

  static addViewerLinkEvent(htmlid, href) {
    const selector = `#${htmlid} #action`;
    const elem = document.querySelector(selector);
    if (elem) {
      let homeloc = window.location.origin;
      // handle gh pages dist folder.
      if (homeloc === 'https://nemac.github.io') {
        homeloc += '/NFWF_tool/dist';
      }

      elem.href = `${homeloc}${href}`;
      elem.addEventListener('click', (e) => {
        // ga event action, category, label
        googleAnalyticsEvent('click', 'example', 'viewerlink');
      });
    }
    CaseStudies.displayActionButton(elem);
  }

  static actionSelector(lastaction) {
    if (lastaction) {
      return '#action-last';
    }
    return '#action';
  }

  updateDrawGeoJSONActionEvent(htmlid, label, geojson, lastaction = false) {
    const selector = `#${htmlid} ${CaseStudies.actionSelector(lastaction)}`;
    const elem = document.querySelector(selector);
    if (elem) {
      elem.addEventListener('click', (e) => {
        this.unCheckLayers();
        CaseStudies.collapseLayerLegends();
        this.drawCaseStudyArea(JSON.parse(geojson), label);
      });
      CaseStudies.displayActionButton(elem);
    }
  }

  static updateLegendToggleActionEvent(htmlid, layer, lastaction = false) {
    const selector = `#${htmlid} ${CaseStudies.actionSelector(lastaction)}`;
    const elem = document.querySelector(selector);
    if (elem) {
      elem.addEventListener('click', (e) => {
        CaseStudies.legendToggle(layer);
      });
      CaseStudies.displayActionButton(elem);
    }
  }

  static legendScroll(htmlid, top, lastaction = false) {
    const selector = `#${htmlid} ${CaseStudies.actionSelector(lastaction)}`;
    const elem = document.querySelector(selector);
    if (elem) {
      elem.addEventListener('click', (e) => {
        const maplayerlist = document.querySelector('.map_responsive');
        maplayerlist.scrollTop = top;
      });
    }
  }

  updateLayerToggleActionEvent(htmlid, layer, lastaction = false) {
    const selector = `#${htmlid} ${CaseStudies.actionSelector(lastaction)}`;
    const elem = document.querySelector(selector);
    if (elem) {
      elem.addEventListener('click', (e) => {
        this.layerToggle(layer);
      });
      CaseStudies.displayActionButton(elem);
    }
  }

  static updateActionName(htmlid, narrative) {
    const selector = `#${htmlid} #action`;
    const elem = document.querySelector(selector);
    if (elem) {
      elem.innerHTML = narrative;
    }
  }

  static updateNarrative(htmlid, narrative) {
    const selector = `#${htmlid} #narrative`;
    const elem = document.querySelector(selector);
    if (elem) {
      elem.innerHTML = narrative;
    }
  }

  static updateName(htmlid, narrative) {
    const selector = `#${htmlid} #name`;
    const elem = document.querySelector(selector);
    if (elem) {
      elem.innerHTML = narrative;
    }
  }

  static triggerEvent(element, eventName) {
    const event = new Event(eventName);
    if (element) {
      element.dispatchEvent(event);
    }
  }

  layerToggle(layer) {
    setTimeout(() => {
      const toggleBox = document.querySelector(`input#${layer}-toggle`);
      CaseStudies.triggerEvent(toggleBox, 'change');
      toggleBox.checked = !toggleBox.checked;
      this.mapComponent.toggleLayer(layer);
    }, 1);
    // ga event action, category, label
    googleAnalyticsEvent('click', 'example', `layer toggle ${layer}`);
  }


  static legendToggle(layer) {
    setTimeout(() => {
      const toggle = document.getElementById(`${layer}-layerToggle`);
      toggle.classList.toggle('closed');
      toggle.querySelector('.layer-legend-wrapper').classList.toggle('closed');
    }, 1);
    // ga event action, category, label
    googleAnalyticsEvent('click', 'example', `legend toggle ${layer}`);
  }

  static legendToggleOff(layer) {
    setTimeout(() => {
      const toggle = document.getElementById(`${layer}-layerToggle`);
      if (toggle) {
        toggle.classList.add('closed');
        toggle.querySelector('.layer-legend-wrapper').classList.add('closed');
      }
    }, 1);
    // ga event action, category, label
    googleAnalyticsEvent('click', 'example', `legend off ${layer}`);
  }

  // used by search by location
  drawCaseStudyArea(GeoJSON, Label) {
    // ga event action, category, label
    googleAnalyticsEvent('click', 'example', `draw area ${Label}`);
    if (checkValidObject(GeoJSON)) {
      setTimeout(() => {
        const checklayer = this.drawAreaGroup.getLayers();
        if (checklayer.length > 0) {
          this.drawAreaGroup.clearLayers();
        } else {
          // convert geoJson to leaflet layer
          const layer = L.geoJson(GeoJSON);
          // add layer to the leaflet map
          this.drawAreaGroup.addLayer(layer);
          this.addUserAreaLabel(layer, Label);
          this.zoomToGeoJson(layer);
        }
      }, 1);
    }
  }
}
