'use strict';

import { createObjectListForDSTDownload } from '../export/dstDownload';
import { version } from '../../../../package.json';
import { persistIconConfiguration, storyPersistTag } from '../iconSetCustomization/persitence';
import { domExists } from '../../language/testmode';


export const autoSaveTag = 'autosave';
export const autoSaveIntervallTag = 'autosaveIntervall';

// autosaveIntervall in min
let autosaveIntervallMin = 5;
let autosaver;

export function setAutoSaveIntervall(intervall) {
  if (intervall >= 1 && intervall <= 30) {
    autosaveIntervallMin = intervall;
    localStorage.setItem(autoSaveIntervallTag, intervall);
  }
  if (autosaver) {
    clearInterval(autosaver);
  }
}

export function getAutosaveIntervall() {
  return autosaveIntervallMin;
}

export function loadAutosaveIntervall() {
  const autoSaveIntervall = localStorage.getItem(autoSaveIntervallTag);
  if (autoSaveIntervall) {
    autosaveIntervallMin = autoSaveIntervall;
  } else {
    localStorage.setItem(autoSaveIntervallTag, autosaveIntervallMin);
  }
}

export function startAutosaves() {
  autosaver = window.setInterval(createBrowserSave(), autosaveIntervallMin*1000);
}

export function stopAutosaves() {
  clearInterval(autosaver);
}

export function createBrowserSave() {
  let objects = createObjectListForDSTDownload(version);
  let title = document.getElementById('title');
  let titleText = '';

  if (title) {
    titleText = title.innerText;
  }

  let previousAutosaves = getAllAutosaves()();
  if (previousAutosaves && previousAutosaves.lenght == 5) {
    previousAutosaves.pop();
  }

  const currentAutosave =
      JSON.stringify({
        title: titleText,
        objects: objects,
        time: Date.now()
      });

  const autoSaveList = [currentAutosave];
  previousAutosaves.forEach(autosave => autoSaveList.push(autosave));


  localStorage.setItem(
    autoSaveTag,
    autoSaveList
  );
}

export function getAllAutosaves() {
  return localStorage.getItem(autoSaveTag);
}

export function loadSpecificAutosave(autosave) {
  localStorage.setItem(
    storyPersistTag,
    autosave
  );
  persistIconConfiguration();

  if (domExists()) {
    location.reload();
  }
}