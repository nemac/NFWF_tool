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
  elHolder.className = elHolder.className.replace('h-100', '');
  elHolder.className = elHolder.className.replace('w-100', '');
  elHolder.className += ' h-100';
  elHolder.className += ' w-100';

  return true;
}

// toggle spinner visibility off
export function spinnerOff() {
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
  let flat = [];
  arr.forEach(d => {
    if (Array.isArray(d)) { flat.push(...d); }
    else { flat.push(d) }
  })
  return flat;
}
