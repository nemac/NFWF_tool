// default map template
import navTemplate from '../templates/aboutnav_bar.html';
import NavBarsTemplate from '../templates/aboutnav_bar_nav.html';
import { Component } from './components';
import { Store } from './store';

import { navConfig } from '../config/aboutConfig';
import {
  checkValidObject
} from './utilitys';

const store = new Store({});

/**
 * NavBar Component
 * Render and control map layer control
 */
export class AboutNavBar extends Component {
  constructor(placeholderId, props) {
    super(placeholderId, props, navTemplate);

    /**
     * get nav configuration
     */
    this.navConfig = navConfig;

    this.activeNav = '';

    // get the main nav element
    const navHeaderElement = document.getElementById('about-nav');


    /**
     *  iterate each nav and add it to the ui
     */
    let cnt = 1;
    navConfig.navs.forEach((nav) => {
      const navInnerHTML = navHeaderElement.innerHTML;
      navHeaderElement.innerHTML = navInnerHTML + NavBarsTemplate;
      const navElement = document.getElementById('about-nav-page');

      // first tab is always active
      if (cnt === 1) {
        navElement.className += ' active';
      }

      navElement.setAttribute('ref', nav.ref); // nav ref
      navElement.setAttribute('href', nav.href); // nav href
      navElement.setAttribute('id', nav.id); // nav id
      navElement.setAttribute('aria-label', nav.text); // aria-label
      navElement.setAttribute('title', nav.text); // title
      navElement.textContent = nav.text; // nav text

      cnt += 1;
    });

    const aboutNav = store.getStateItem('aboutNav');

    if (checkValidObject(aboutNav)) {
      AboutNavBar.deactivateAllNavs();
      AboutNavBar.toggleTabContent('aboutNav', aboutNav);

      const el = document.getElementById(aboutNav);
      if (el) {
        el.className += ' active';
      } else {
        // tab deleted and old tab still in Store
        //   make tab the genral about tab
        store.setStoreItem('aboutNav');
        const elrecover = document.getElementById('about-nav-aboutgen');
        if (elrecover) {
          elrecover.className += ' active';
        }
      }
    }
    // add click event for active toggle
    this.addTabClick();
  }

  addTabClick() {
    navConfig.navs.forEach((nav) => {
      const el = document.getElementById(nav.id);
      el.addEventListener('click', (e) => {
        AboutNavBar.deactivateAllNavs();
        AboutNavBar.toggleTabContent(e.target.id);
        const ele = e.target;
        ele.className += ' active';

        // add to store later
        this.activeNav = nav.id;
        store.setStoreItem('aboutNav', this.activeNav);
      });
    });
  }

  static tabUpdate(id) {
    AboutNavBar.deactivateAllNavs();
    const el = document.getElementById(id);
    if (el) {
      el.className = `${el.className} active`;
    } else {
      // tab deleted and old tab still in Store this recovers from that
      const elrecover = document.getElementById('tab-about-nav-aboutgen');
      if (elrecover) {
        elrecover.className = `${elrecover.className} active`;
      }
    }
  }

  static deactivateAllNavs() {
    navConfig.navs.forEach((nav) => {
      const el = document.getElementById(nav.id);
      if (el) {
        el.className = el.className.replace(' active', '');
      }
    });
  }

  static toggleTabContent(id) {
    AboutNavBar.resetTabContent();
    const el = document.getElementById(`tab-${id}`);
    if (el) {
      el.className = el.className.replace(' d-none', '');
    } else {
      // tab deleted and old tab still in Store this recovers from that
      const elrecover = document.getElementById('tab-about-nav-aboutgen');
      if (elrecover) {
        elrecover.className = elrecover.className.replace(' d-none', '');
      }
    }
  }

  static resetTabContent() {
    navConfig.navs.forEach((nav) => {
      const el = document.getElementById(`tab-${nav.id}`);
      if (el) {
        el.className = el.className.replace(' d-none', '');
        el.className += ' d-none';
      } else {
        // tab deleted and old tab still in Store this recovers from that
        const elrecover = document.getElementById('tab-about-nav-aboutgen');
        if (elrecover) {
          elrecover.className = elrecover.className.replace(' d-none', '');
          elrecover.className += ' d-none';
        }
      }
    });
  }
}
