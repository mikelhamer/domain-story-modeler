'use strict';

export function debounce(fn, timeout) {
  let timer;

  return function() {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(fn, timeout);
  };
}

export function changeWebsiteTitle(title) {
  document.title = title + ' - Domain Story Modeler';
}

export function keyReleased(keysPressed, keyCode) {
  keysPressed[keyCode] = false;
}

export function positionsMatch(width, height, elementX, elementY, clickX, clickY) {
  if (clickX > elementX && clickX < elementX + width) {
    if (clickY > elementY && clickY < elementY + height) {
      return true;
    }
  }
  return false;
}