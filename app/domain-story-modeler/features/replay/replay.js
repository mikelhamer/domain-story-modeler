'use strict';

import { CONNECTION, GROUP } from '../../language/elementTypes';
import {
  getActivitesFromActors,
  getAllCanvasObjects,
  wasInitialized
} from '../../language/canvasElementRegistry';
import { traceActivities } from './initializeReplay';

let canvas;
let selection;

let replayOn = false;
let currentStep = 0;
let replaySteps = [];
let stepViewboxes = [];
let initialViewbox;

let errorStep = 0;

const modal = document.getElementById('modal');
const canvasDOM = document.getElementById('canvas');
const logoContainer = document.getElementsByClassName('logoContainer')[0];
const startReplayButton = document.getElementById('buttonStartReplay');
const nextStepButton = document.getElementById('buttonNextStep');
const previousStepButton = document.getElementById('buttonPreviousStep');
const stopReplayButton = document.getElementById('buttonStopReplay');
const currentReplayStepLabel = document.getElementById('replayStep');
const incompleteStoryDialog = document.getElementById('incompleteStoryInfo');

export function getReplayOn() {
  return replayOn;
}

export function initReplay(inCanvas, inSelection) {
  canvas = inCanvas;
  selection = inSelection;

  document.addEventListener('keydown', function(e) {
    if (replayOn) {
      if (e.keyCode == 37 || e.keyCode == 40) {

        // leftArrow or downArrow
        previousStep();
      } else if (e.keyCode == 39 || e.keyCode == 38) {

        // rightArrow or UpArrow
        nextStep();
      }
    }
  });

  startReplayButton.addEventListener('click', function() {
    if (wasInitialized()) {
      initialViewbox = canvas.viewbox();
      let activities = getActivitesFromActors();

      if (!replayOn && activities.length > 0) {
        replaySteps = traceActivities(activities);

        if (isStoryConsecutivelyNumbered(replaySteps)) {
          replayOn = true;
          presentationMode();
          currentStep = 0;
          showCurrentStep();
        } else {
          let errorText = '\nThe numbers: ';
          for (let i = 0; i < replaySteps.length; i++) {
            if (errorStep[i]) {
              errorText += i + 1 + ',';
            }
          }
          errorText = errorText.substring(0, errorText.length - 1);
          errorText += ' are missing!';

          let oldText = incompleteStoryDialog.getElementsByTagName('text');
          if (oldText) {
            for (let i = 0; i < oldText.length; i++) {
              incompleteStoryDialog.removeChild(oldText[i]);
            }
          }

          let text = document.createElement('text');
          text.innerHTML =
            ' The activities in this Domain Story are not numbered consecutively.<br>' +
            'Please fix the numbering in order to replay the story.<br>' +
            errorText;
          incompleteStoryDialog.appendChild(text);
          incompleteStoryDialog.style.display = 'block';
          modal.style.display = 'block';
        }
      }
    }
  });

  nextStepButton.addEventListener('click', function() {
    nextStep();
  });

  previousStepButton.addEventListener('click', function() {
    previousStep();
  });

  stopReplayButton.addEventListener('click', function() {
    if (replayOn) {
      editMode();

      // show all canvas elements
      let allObjects = [];
      let groupObjects = [];
      let canvasObjects = canvas._rootElement.children;
      let i = 0;

      for (i = 0; i < canvasObjects.length; i++) {
        if (canvasObjects[i].type.includes(GROUP)) {
          groupObjects.push(canvasObjects[i]);
        } else {
          allObjects.push(canvasObjects[i]);
        }
      }

      i = groupObjects.length - 1;
      while (groupObjects.length >= 1) {
        let currentgroup = groupObjects.pop();
        currentgroup.children.forEach(child => {
          if (child.type.includes(GROUP)) {
            groupObjects.push(child);
          } else {
            allObjects.push(child);
          }
        });
        i = groupObjects.length - 1;
      }
      allObjects.forEach(element => {
        let domObject = document.querySelector(
          '[data-element-id=' + element.id + ']'
        );
        domObject.style.display = 'block';
      });

      replayOn = false;
      currentStep = 0;
      canvas.viewbox(initialViewbox);

      stepViewboxes = [];
    }
  });
}

function nextStep() {
  if (replayOn) {
    if (currentStep < replaySteps.length - 1) {
      currentStep += 1;
      showCurrentStep();
    }
  }
}

function previousStep() {
  if (replayOn) {
    if (currentStep > 0) {
      currentStep -= 1;
      showCurrentStep();
    }
  }
}

export function isPlaying() {
  return replayOn;
}

export function isStoryConsecutivelyNumbered(replaySteps) {
  errorStep = [];
  let complete = true;
  for (let i = 0; i < replaySteps.length; i++) {
    if (!replaySteps[i].activities[0]) {
      complete = false;
      errorStep[i] = true;
    } else {
      errorStep[i] = false;
    }
  }
  return complete;
}

// get all elements, that are supposed to be shown in the current step
export function getAllShown(stepsUntilNow) {
  let shownElements = [];

  // for each step until the current one, add all referenced elements to the list of shown elements
  stepsUntilNow.forEach(step => {

    // add the source of the step and their annotations to the shown elements
    step.sources.forEach(source => {
      shownElements.push(source);
      if (source.outgoing) {
        source.outgoing.forEach(out => {
          if (out.type.includes(CONNECTION)) {
            shownElements.push(out, out.target);
          }
        });
      }
    });

    // add the target of the step and their annotations to the shown elements
    step.targets.forEach(target => {
      shownElements.push(target);
      if (target.outgoing) {
        target.outgoing.forEach(out => {
          if (out.type.includes(CONNECTION)) {
            shownElements.push(out, out.target);
          }
        });
      }

      // add each activity to the step
      step.activities.forEach(activity => {
        shownElements.push(activity);
      });
    });
  });
  return shownElements;
}

// get all elements, that are supposed to be hidden in the current step
export function getAllNotShown(allObjects, shownElements) {
  let notShownElements = [];

  // every element that is not referenced in shownElements
  // and is neither a group (since they are not refeenced n allObjects),
  // nor an annotation conntected to a group should be hidden
  allObjects.forEach(element => {
    if (!shownElements.includes(element)) {
      if (element.type.includes(CONNECTION)) {
        if (!element.source.type.includes(GROUP)) {
          notShownElements.push(element);
        } else {
          shownElements.push(element.target);
        }
      } else {
        notShownElements.push(element);
      }
    }
  });
  return notShownElements;
}

// replay functions
function presentationMode() {

  removeSelectionAndEditing();
  hideLogos();
  addPaddingToCanvas();

  const contextPadElements = document.getElementsByClassName('djs-context-pad');
  const paletteElements = document.getElementsByClassName('djs-palette');

  const infoContainer = document.getElementById('infoContainer');
  infoContainer.style.display = 'none';

  const editModeButtons = document.getElementById('editModeButtons');
  editModeButtons.style.display = 'none';
  editModeButtons.style.pointerEvents = 'none';

  const presentationModeButtons = document.getElementById(
    'presentationModeButtons'
  );
  presentationModeButtons.style.display = 'block';
  presentationModeButtons.style.pointerEvents = 'all';

  const headerAndCanvas = document.getElementsByClassName('headerAndCanvas')[0];
  headerAndCanvas.style.gridTemplateRows = '0px 50px 1px auto';

  const headlineAndButtons = document.getElementById('headlineAndButtons');
  headlineAndButtons.style.gridTemplateColumns = 'auto 230px 3px';


  let i = 0;
  for (i = 0; i < contextPadElements.length; i++) {
    contextPadElements[i].style.display = 'none';
  }

  for (i = 0; i < paletteElements.length; i++) {
    paletteElements[i].style.display = 'none';
  }

  currentReplayStepLabel.style.opacity = 1;
}

function removeSelectionAndEditing() {
  selection.select([]);
  const directEditingBoxes = document.getElementsByClassName('djs-direct-editing-parent');

  if (directEditingBoxes.length > 0) {
    const directEditing = directEditingBoxes[0];
    directEditing.parentElement.removeChild(directEditing);
  }
}

function editMode() {
  showLogos();
  removePaddingFromCanvas();

  let contextPadElements = document.getElementsByClassName('djs-context-pad');
  let paletteElements = document.getElementsByClassName('djs-palette');

  let infoContainer = document.getElementById('infoContainer');
  infoContainer.style.display = 'block';
  infoContainer.style.height = '75px';

  let editModeButtons = document.getElementById('editModeButtons');
  editModeButtons.style.display = 'inherit';
  editModeButtons.style.pointerEvents = 'all';

  let presentationModeButtons = document.getElementById(
    'presentationModeButtons'
  );
  presentationModeButtons.style.display = 'none';
  presentationModeButtons.style.pointerEvents = 'none';

  let headerAndCanvas = document.getElementsByClassName('headerAndCanvas')[0];
  headerAndCanvas.style.gridTemplateRows = '0px 125px 1px auto';

  let headlineAndButtons = document.getElementById('headlineAndButtons');
  headlineAndButtons.style.gridTemplateColumns = 'auto 390px 3px';


  let i = 0;
  for (i = 0; i < contextPadElements.length; i++) {
    contextPadElements[i].style.display = 'block';
  }

  for (i = 0; i < paletteElements.length; i++) {
    paletteElements[i].style.display = 'block';
  }
  currentReplayStepLabel.style.opacity = 0;
}

function showCurrentStep() {
  let stepsUntilNow = [];
  let allObjects = [];
  let i = 0;

  currentReplayStepLabel.innerText =
    currentStep + 1 + ' / ' + replaySteps.length;

  for (i = 0; i <= currentStep; i++) {
    stepsUntilNow.push(replaySteps[i]);
  }

  allObjects = getAllCanvasObjects(canvas);

  let shownElements = getAllShown(stepsUntilNow);

  let notShownElements = getAllNotShown(allObjects, shownElements);

  // hide all elements, that are not to be shown
  notShownElements.forEach(element => {
    let domObject = document.querySelector(
      '[data-element-id=' + element.id + ']'
    );
    domObject.style.display = 'none';
  });

  shownElements.forEach(element => {
    let domObject = document.querySelector(
      '[data-element-id=' + element.id + ']'
    );
    domObject.style.display = 'block';
  });

  canvas.viewbox(initialViewbox);
  if (stepViewboxes[currentStep] == null) {
    if (currentStepFitsInWindow()) {
      const stepViewBox = canvas.viewbox();
      const boundingRectangle = stepViewBox.inner;

      stepViewBox.x = boundingRectangle.x;
      stepViewBox.y = boundingRectangle.y - 50;

      stepViewboxes[currentStep] = stepViewBox;
    } else {
      if (currentStep == 0) { // If the first step does not fin into the Viewbox, zoom to fit -> TODO check if needed
        canvas.zoom('fit-viewport');
        console.log('fit');
      } else {
        console.log(canvas.viewbox());
        console.log('newBox');
        findNewStepAreaAndFocus();
      }

    }
  }

  canvas.viewbox(stepViewboxes[currentStep]);
}

function findNewStepAreaAndFocus() {
  const previousViewbox = stepViewboxes[currentStep -1];
  const usedArea = canvas.viewbox().inner;

  const nextViewbox = JSON.parse(JSON.stringify(previousViewbox));

  const areaIncrease = getAreaIncrease(previousViewbox.inner , usedArea);

  if (usedArea.width > nextViewbox.width) {
    if (areaIncrease.width > 0) {
      nextViewbox.x += areaIncrease.width;
    } else {

      const newX = findNextStepBorder('x');
      if (newX < nextViewbox.x) {
        console.log('a');
        nextViewbox.x = newX - 10; // 10 px padding
      } else {

        // TODO -> does not work correlty yet
        nextViewbox.x = newX + nextViewbox.width - (usedArea.width - usedArea.x);
      }
    }
  }

  if (usedArea.height > nextViewbox.height) {
    if (areaIncrease.height > 0) {
      nextViewbox.y += areaIncrease.height;
    } else {
      const newY = findNextStepBorder('y');
      if (newY <= nextViewbox.y) {
        console.log('a');
        nextViewbox.y = newY - 10; // 10 px padding
      } else {

        // TODO -> does not work correlty yet
        nextViewbox.y = newY + nextViewbox.height - (usedArea.height - usedArea.y);
      }
    }
  }

  stepViewboxes[currentStep] = nextViewbox;
  canvas.viewbox(nextViewbox);
}

function findNextStepBorder(axis) {
  const stepObjects = [replaySteps[currentStep].source];
  replaySteps[currentStep].targets.forEach(target => {
    stepObjects.push(target);
  });
  replaySteps[currentStep].activities.forEach(activity => {
    stepObjects.push(activity);
  });

  let border = stepObjects[0][axis];

  stepObjects.forEach(object => {
    if (object[axis] <= border) {
      border = object[axis];
    }
  });

  console.log(axis, border);
  return border;
}

function getAreaIncrease(originalArea, modifiedArea) {
  const increase = {
    width: 0,
    height: 0
  };

  increase.width = modifiedArea.width - originalArea.width;
  increase.height = modifiedArea.height - originalArea.height;

  if (originalArea.y > modifiedArea.y) {
    increase.height *= -1;
  }
  if (originalArea.x > modifiedArea.x) {
    increase.width *= -1;
  }

  return increase;
}

function currentStepFitsInWindow() {
  const currentViewbox = canvas.viewbox();
  const boundingRectangle = canvas.viewbox().inner;

  const stepHeight = boundingRectangle.height;
  const stepWidth = boundingRectangle.width + 50;

  const viewBoxHeight = currentViewbox.height;
  const viewBoxWidth = currentViewbox.width;

  if (viewBoxHeight >= stepHeight && viewBoxWidth >= stepWidth) {
    return true;
  }
  return false;
}

function hideLogos() {
  logoContainer.style.display = 'none';
}

function showLogos() {
  logoContainer.style.display = 'block';
}

function addPaddingToCanvas() {
  canvasDOM.style.right = '3px';
}

function removePaddingFromCanvas() {
  canvasDOM.style.right = 'unset';
}