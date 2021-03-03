'use strict';

import { domExists } from '../../language/testmode';
import { loadSpecificAutosave, getAllAutosaves } from './autosave';

const autosaveList = document.getElementById('AutosaveList');

export function createAutosaveListElement(name, autosave, time) {
  let listElement = document.createElement('li');
  let nameElement = document.createElement('text');
  let timeElement = document.createElement('text');

  nameElement.innerHTML = name;
  timeElement.innerHTML = time;

  listElement.appendChild(nameElement);
  listElement.appendChild(timeElement);
  listElement.addEventListener('dblclick', function() {
    loadSpecificAutosave(autosave);
  });
  return listElement;
}

export function createAutosaveList() {
  if (domExists()) {

    let autosaves = getAllAutosaves();

    let autosaveHTMLList = [];

    autosaves.forEach(autosave => autosaveHTMLList.push(createAutosaveListElement(autosave.title, autosave.objects, autosave.time)));
  }
}