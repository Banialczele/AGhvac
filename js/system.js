
function createSystemDataFromAFile(fileData = null) {
  if (!fileData) return;

  // Obsługujemy zarówno stare pliki JSON, jak i nowszy eksport z wrapperem { systemData, initSystem }.
  const incomingSystem = fileData.systemData || fileData;
  const incomingInit = fileData.initSystem || {};

  const structureType = incomingSystem.selectedStructureType ||
    incomingSystem.selectedStructure?.type?.pl ||
    incomingSystem.selectedStructure?.type?.[lang] ||
    incomingSystem.selectedStructure;

  const selectedStructure = findStructureByType(structureType) || initSystem.selectedStructure || STRUCTURE_TYPES?.[0] || null;

  systemData = createEmptySystemData({
    supplyType: incomingSystem.supplyType || ``,
    wireType: incomingSystem.wireType || '',
    batteryBackUp: incomingSystem.batteryBackUp || incomingSystem.backup || incomingInit.backup || TRANSLATION.batteryBackUpNo[lang],
    thRailing: incomingSystem.thRailing || incomingInit.thRailing || TRANSLATION.batteryBackUpYes[lang],
    bus: Array.isArray(incomingSystem.bus) ? incomingSystem.bus : [],
    errorList: [],
    res: incomingSystem.res || null,
    totalPower: Number(incomingSystem.totalPower) || 0,
    generatedSupply: incomingSystem.generatedSupply ?? null,
    selectedStructure,
  });

  initSystem.selectedStructure = selectedStructure;
  initSystem.backup = systemData.batteryBackUp;
  initSystem.thRailing = systemData.thRailing;
  initSystem.amountOfDetectors = systemData.bus.length || Number(incomingInit.amountOfDetectors) || 1;
  initSystem.EWL = Number(systemData.bus[0]?.wireLength || incomingInit.EWL || 15);
  initSystem.detector = systemData.bus[0]?.detector || getDefaultDetectorFromStructure(selectedStructure);

  const thSelect = document.getElementById("thRailing");
  if (thSelect) thSelect.value = systemData.thRailing;

  const backupSelect = document.getElementById("batteryBackUp");
  if (backupSelect) backupSelect.value = systemData.batteryBackUp;

  const amountInput = document.getElementById("amountOfDetectors");
  if (amountInput) amountInput.value = initSystem.amountOfDetectors;

  const ewlInput = document.getElementById("EWL");
  if (ewlInput) ewlInput.value = initSystem.EWL;
}

function findStructureByType(typeValue) {
  if (!typeValue || typeof STRUCTURE_TYPES === 'undefined') return null;
  return STRUCTURE_TYPES.find(structure =>
    structure.type?.pl === typeValue ||
    structure.type?.en === typeValue ||
    structure.type?.[lang] === typeValue
  ) || null;
}

function getDefaultDetectorFromStructure(structure) {
  if (!structure?.devices?.length) return null;
  return structure.devices.find(device => device.class === "detector") || structure.devices[0];
}


function copyImageSegmentOnFormSubmit() {
  const parentNode = document.querySelector(`.systemDiagram`);
  const firstSegment = document.getElementById(`segmentDiagram1`);
  if (!parentNode || !firstSegment) return;

  const segmentsDiagrams = document.querySelectorAll(`.deviceSegment`);
  segmentsDiagrams.forEach((elem, i) => (i > 0 ? parentNode.removeChild(elem) : ""));

  const df = new DocumentFragment();
  for (let i = 1; i < systemData.bus.length; i++) {
    const cloned = firstSegment.cloneNode(true);
    cloned.setAttribute(`id`, `segmentDiagram${i + 1}`);
    cloned.setAttribute(`data-segmentindex`, i + 1);
    df.appendChild(cloned);
  }
  parentNode.appendChild(df);
}


function getSelectedExternalPowerSupply() {
  return systemData.res?.powerSupply?.powerSupply?.supply
    || systemData.res?.powerSupply?.psu
    || null;
}

function getSelectedPowerConfigurationLabel() {
  const config = systemData.res?.powerSupply;
  if (config?.label) return config.label;

  const controlUnitName = config?.controlUnit?.type || systemData.supplyType?.type || "";
  const externalPowerSupply = getSelectedExternalPowerSupply();

  return externalPowerSupply?.description
    ? `${controlUnitName} + ${externalPowerSupply.description}`
    : controlUnitName;
}

function getSelectedControlUnitName() {
  return systemData.res?.powerSupply?.controlUnit?.type
    || systemData.supplyType?.type
    || "";
}

function updateModControl() {
  const modControl = document.getElementById(`actionsSegmentDevice0`);
  if (!modControl) return null;

  // W górnym polu „Urządzenie” pokazujemy wyłącznie jednostkę sterującą.
  // Zasilacz zewnętrzny jest prezentowany osobno w panelu „Stan systemu”.
  const controlUnitName = getSelectedControlUnitName();
  if (modControl.value !== undefined) {
    modControl.value = controlUnitName;
  } else {
    modControl.innerText = controlUnitName;
  }

  return modControl;
}

function copyActionsSegmentOnFormSubmit() {
  const parentNode = document.querySelector(".actionsList");
  const firstSegment = document.getElementById(`actionsSegment1`);
  document.querySelectorAll('.actionsSegment').forEach((segment, i) => {
    const detectorType = systemData.bus[i]?.detector?.type;
    const wrapper = segment.querySelector('.deviceTypeWrapper');
    const existingToled = wrapper?.querySelector('.toledContainer.toledDescriptionSelect');
    if (existingToled && detectorType !== 'TOLED') {
      existingToled.remove();
    } else if (!existingToled && detectorType === 'TOLED') {
      wrapper?.appendChild(createSegmentTOLEDDescriptionSelect());
    }
  });
  const actionsSegments = document.querySelectorAll(`.actionsSegment`);
  actionsSegments.forEach((elem, i) => (i > 1 ? parentNode.removeChild(elem) : ""));
  const df = new DocumentFragment();
  for (let i = 1; i < systemData.bus.length; i++) {
    const cloned = firstSegment.cloneNode(true);
    const actionsSegmentIndexLabel = cloned.querySelector(`.segmentIndexLabel`);
    const actionsSegmentIndexInput = cloned.querySelector(`.segmentId`);
    const segmentDeviceLabel = cloned.querySelector(`.segmentDeviceLabel`);
    const segmentDeviceSelect = cloned.querySelector(`.segmentDeviceSelect`);
    const segmentWireLengthLabel = cloned.querySelector(`.segmentWireLengthLabel`);
    const segmentWireLength = cloned.querySelector(`.segmentWireLength`);
    const addButton = cloned.querySelector(`.duplicateDeviceButton`);
    const removeButton = cloned.querySelector(`.removeDeviceButton`);

    cloned.setAttribute(`id`, `actionsSegment${i + 1}`);
    cloned.setAttribute(`data-segmentindex`, i + 1);
    actionsSegmentIndexLabel.setAttribute(`for`, `actionsSegmentIndex${i + 1}`);
    setAttributes(actionsSegmentIndexInput, {
      id: `actionsSegmentIndex${i + 1}`,
      value: i + 1,
    });
    segmentDeviceLabel.setAttribute(`for`, `actionsSegmentDevice${i + 1}`);
    segmentDeviceSelect.setAttribute(`id`, `actionsSegmentDevice${i + 1}`);
    segmentDeviceSelect.setAttribute(`selected`, systemData.bus[i].detector.type);
    segmentWireLengthLabel.setAttribute(`for`, `actionsSegmentWireLength${i + 1}`);
    segmentWireLength.setAttribute(`id`, `actionsSegmentWireLength${i + 1}`);
    addButton.setAttribute(`id`, `duplicateDevice${i + 1}`);
    removeButton.setAttribute(`id`, `removeDevice${i + 1}`);
    df.appendChild(cloned);
  }
  parentNode.appendChild(df);
}


function setSelectInSegment(segment) {
  const select = segment.querySelector(`.segmentDeviceSelect`);
  const firstSegment = document.getElementById(`actionsSegmentDevice0`);
  if (!select) return;

  const df = new DocumentFragment();
  const structure = systemData.selectedStructure || initSystem.selectedStructure;

  if (select === firstSegment) {
    const labelSelect = select.closest(`.segmentDeviceLabel`);
    const batteryBackUpInput = labelSelect?.querySelector(`#modControlBatteryBackUp`);
    const before = labelSelect?.querySelector("br");
    const text = TRANSLATION.systemSegmentDescription[lang];
    const prev = before && before.previousSibling;

    if (labelSelect && before && !(prev && prev.nodeType === Node.TEXT_NODE && prev.nodeValue === text)) {
      labelSelect.insertBefore(document.createTextNode(text), before);
    }

    if (batteryBackUpInput) {
      const batteryTranslation =
        systemData.supplyType?.possibleUPS === "no"
          ? TRANSLATION.batteryBackUpNo[lang]
          : TRANSLATION.batteryBackUpYes[lang];
      batteryBackUpInput.value = batteryTranslation;
    }
  } else {
    select.innerHTML = "";
    if (!structure?.devices?.length) return;

    const currentIndex = Number(segment.dataset.segmentindex) - 1;
    structure.devices.forEach((device) => {
      let text = '';
      if (device.class === "detector") {
        text = `${TRANSLATION.deviceSegment.detector[lang]} ${device.gasDetected}`;
      } else if (device.type === "Teta Control V") {
        text = `${TRANSLATION.valveControl[lang]}`;
      } else if (device.type === "TOLED") {
        text = `${TRANSLATION.toledDescription[lang]} ${device.type}`;
      } else {
        text = `${TRANSLATION.deviceSegment.signaller[lang]} ${device.type}`;
      }

      const option = el(
        "option",
        {
          value: device.type,
          selected: systemData.bus[currentIndex]?.detector?.type === device.type ? "selected" : null,
        },
        [text]
      );
      df.appendChild(option);
    });
    select.appendChild(df);
  }
}

function fillData() {
  const actionsSegments = document.querySelectorAll(`.actionsSegment`);
  actionsSegments.forEach((segment) => setSelectInSegment(segment));
  actionsSegments.forEach((segment) =>
    segment.querySelector(`.segmentWireLength`) !== null
      ? (segment.querySelector(`.segmentWireLength`).value = initSystem.EWL)
      : ""
  );
}

//setup bus images
function setBusImages(busElem, type) {
  const busImage = busElem.querySelector(`.busImageContainer img`);
  setAttributes(busImage, {
    src: `./SVG/tcon${type === "detector" ? "P" : "L"}.svg`,
    alt: "T-Konektor image",
  });
}

function setImage(busElem, device, detectorContainer, signallerContainer) {
  const detectorImage = busElem.querySelector(detectorContainer);
  const signallerImg = busElem.querySelector(signallerContainer);

  if (device.class === `detector`) {
    setAttributes(detectorImage, {
      src: `./SVG/${device.type}.svg`,
      alt: "Device image",
    });
    detectorImage.style.visibility = `visible`;
    signallerImg.style.visibility = `hidden`;
  } else {
    setAttributes(signallerImg, {
      src: `./SVG/${device.type}.svg`,
      alt: "Device image",
    });
    detectorImage.style.visibility = `hidden`;
    signallerImg.style.visibility = `visible`;
  }
}

function busImageController() {
  const segments = document.querySelectorAll(`.deviceSegment`);
  segments.forEach((segment, i) => {
    const detector = systemData.bus[i].detector;
    setBusImages(segment, detector.class);
    setImage(segment, detector, `.detectorImageContainer img`, `.warningDeviceImageContainer img`);
  });
}

//Zliczanie ile jest sygnalizatorów, zaworów i detektorów
function reduceDetectors() {
  const total = systemData.bus.reduce((accumulator, current) => {
    const deviceClassDetector = `detector`;
    const deviceClassSignaller = `signaller`;
    const deviceClassValve = `valveCtrl`;
    accumulator[deviceClassDetector] ??= {};
    accumulator[deviceClassSignaller] ??= {};
    accumulator[deviceClassValve] ??= {};
    accumulator[`tCon`] ??= {};
    if (current.detector.class === `detector`) {
      accumulator[deviceClassDetector][current.detector.gasDetected] =
        (accumulator[deviceClassDetector][current.detector.gasDetected] || 0) + 1;
    } else if (current.detector.class === `signaller`) {
      accumulator[deviceClassSignaller][current.detector.type] =
        (accumulator[deviceClassSignaller][current.detector.type] || 0) + 1;
    } else {
      accumulator[deviceClassValve][current.detector.type] =
        (accumulator[deviceClassValve][current.detector.type] || 0) + 1;
    }

    accumulator[`tCon`][`T-Connector`] = (accumulator[`tCon`][`T-Connector`] || 0) + 1;

    return accumulator;
  }, {});
  return total;
}

function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  const df = document.createDocumentFragment();
  // Ustaw atrybuty
  Object.entries(attrs).forEach(([key, val]) => {
    if (val !== false && val !== null && val !== undefined) {
      element.setAttribute(key, val);
    }
  });

  // Obsługa dzieci (tekst, element, tablica)
  if (!Array.isArray(children)) {
    children = [children];
  }

  children.forEach((child) => {
    if (typeof child === "string") {
      df.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      df.appendChild(child);
    }
  });
  element.appendChild(df);
  return element;
}

// Tworzenie selecta dla segmentu urządzenia typu TOLED
function createSegmentTOLEDDescriptionSelect() {
  const container = el("div", {
    class: "toledContainer toledDescriptionSelect",
  });
  const label = el("label", { class: "toledDescription" }, TRANSLATION.systemSegmentText[lang]);
  const wrapper = el("div", { class: "formSelectInput" });
  const select = el("select", { class: "toledSelect" });

  TOLED_OPTIONS.forEach((option) => {
    const optionEl = el(
      "option",
      {
        value: option.type[lang],
        "data-translate": option.translate,
        "data-label": option.labeling,
        selected: option[0],
      },
      option.type[lang]
    );
    select.appendChild(optionEl);
  });

  wrapper.appendChild(select);
  container.appendChild(label);
  container.appendChild(wrapper);
  return container;
}

function createListItem(label, count) {
  const listItem = document.createElement("li");
  const typeContainer = document.createElement("div");
  const quantityContainer = document.createElement("div");
  const quantity = document.createElement("span");
  typeContainer.textContent = label;
  quantity.textContent = count;
  quantityContainer.appendChild(quantity);
  quantityContainer.appendChild(document.createTextNode(`${TRANSLATION.quantity[lang]}`));
  listItem.appendChild(typeContainer);
  listItem.appendChild(quantityContainer);
  return listItem;
}

function setSystemStateLists() {
  const deviceTotal = reduceDetectors();
  const combinedSignallers = {
    ...deviceTotal.valveCtrl,
    ...deviceTotal.signaller
  }
  //console.log(deviceTotal)
  setList(`detectorsList`, deviceTotal.detector);
  setList(`signallersList`, combinedSignallers);
  setList(`accessoriesList`, deviceTotal.tCon);
}

function setList(listName, deviceList) {
  const listToSet = document.getElementById(listName);
  listToSet.replaceChildren();
  for (const [key, value] of Object.entries(deviceList)) {
    //if(listName === `signallersList`) console.log(key, value)
    listToSet.appendChild(createListItem(key, value));
  }
}

// Tworzenie systemu

function setSystem() {
  const actionsList = document.getElementById('actionsList');
  if (!actionsList || !Array.isArray(systemData.bus) || systemData.bus.length === 0) return;

  resetRenderSignatures();
  setSystemSegmentsLazy(systemData.bus);
  copyImageSegmentOnFormSubmit();
  fillData();
  updateSelectValue();
  checkIfToledExists();
  renderSystemStateOnly();
  ensureBackToHomeButton();
  setupSystemEventHandlers();
}

function getBackToHomeButtonText() {
  return lang === "en" ? "Back to main page" : "Powrót na stronę główną";
}

function ensureBackToHomeButton() {
  const statusPanel = document.querySelector(".systemStatus");
  if (!statusPanel) return;

  let actions = document.getElementById("systemHomeActions");
  let button = document.getElementById("backToHomeButton");

  if (!actions) {
    actions = document.createElement("div");
    actions.id = "systemHomeActions";
    actions.className = "systemHomeActions";
    statusPanel.appendChild(actions);
  }

  if (!button) {
    button = document.createElement("button");
    button.id = "backToHomeButton";
    button.type = "button";
    button.className = "systemHomeButton";
    actions.appendChild(button);
  }

  button.textContent = getBackToHomeButtonText();
}

function returnToHomeView() {
  const body = document.body;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  body.classList.remove("view-transitioning");
  body.classList.remove("system-active");
  body.classList.add("scroll-locked");

  window.setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, 0);
}

let lastCheckedSegment = null;

function handleSegmentCheckboxClick(e) {
  const checkboxes = Array.from(document.querySelectorAll('.segmentCheckbox'));
  const current = e.target;

  // Jeśli to pierwsze kliknięcie – zapamiętaj i wyjdź
  if (!lastCheckedSegment) {
    lastCheckedSegment = current;
    return;
  }

  // Jeśli trzymamy SHIFT
  if (e.shiftKey) {
    const start = checkboxes.indexOf(lastCheckedSegment);
    const end = checkboxes.indexOf(current);

    if (start === -1 || end === -1) return;

    const shouldCheck = current.checked;
    const [from, to] = start < end ? [start, end] : [end, start];

    // Ustawienie wszystkich w zakresie niezależnie od kierunku
    for (let i = from; i <= to; i++) {
      checkboxes[i].checked = shouldCheck;
    }
  }

  // Zaktualizuj ostatnio kliknięty
  lastCheckedSegment = current;
}

function handleRangeSelectionClick(e) {
  if (e.target.matches(".segmentCheckbox")) {
    handleSegmentCheckboxClick(e);
  }
}

function setupRangeSelection() {
  const container = document.getElementById("system");
  if (!container || container.dataset.rangeSelectionBound === "true") return;

  container.addEventListener("click", handleRangeSelectionClick);
  container.dataset.rangeSelectionBound = "true";
}

// To powinno być wywoływane zawsze po zmianie w systemie:

function getCalculationSignature() {
  return JSON.stringify({
    backup: initSystem.backup || systemData.batteryBackUp,
    thRailing: initSystem.thRailing || systemData.thRailing,
    bus: systemData.bus.map(seg => ({
      type: seg.detector?.type,
      wireLength: Number(seg.wireLength),
      description: seg.description || "",
      labeling: seg.labeling || "",
    })),
  });
}

let lastCalculationSignature = null;
let lastUsedDevicesSignature = null;

function resetRenderSignatures() {
  lastUsedDevicesSignature = null;
}

function renderSystemStateOnly() {
  updateWireLength();
  setSystemStateBusLength();
  updateModControl();
  updateSelectValue();
  setSystemStatePowerConsumption();
  setSystemStateCableDim();
  createSystemUsedDevicesPanel();
  setSystemStateLists();
  busImageController();
}

function functionToUpdateSystem({ forceValidation = false } = {}) {
  const signature = getCalculationSignature();

  if (forceValidation || signature !== lastCalculationSignature) {
    const isValid = validateSystem();
    if (!isValid) return false;
    lastCalculationSignature = signature;
  }

  renderSystemStateOnly();
  return true;
}


function handleButton() {
  setSystemSegmentsLazy(systemData.bus);
  copyImageSegmentOnFormSubmit();
  fillData();
  updateSelectValue();
}

function checkboxChecked() {
  return Array.from(document.querySelectorAll(".segmentCheckbox"))
    .filter((cb) => cb.checked) // zostaw zaznaczone
    .map((cb) => cb.closest(".deviceSegment")?.dataset.segmentindex) // weź indeks
    .filter(Boolean);
}


function updateWireLength() {
  document.querySelectorAll(`.segmentWireLength`).forEach((input, i) => {
    if (systemData.bus[i] && document.activeElement !== input) {
      input.value = systemData.bus[i].wireLength;
    }
  });
}


function updateSelectValue() {
  document.querySelectorAll(`.segmentDeviceSelect`).forEach((select, i) => {
    if (i > 0 && systemData.bus[i - 1]?.detector?.type) {
      select.value = systemData.bus[i - 1].detector.type;
    }
  });
}


function setUsedDevices() {
  return systemData.bus.reduce((accumulator, current) => {
    if (current.detector?.type) accumulator[current.detector.type] = current.detector;
    return accumulator;
  }, {});
}

function updateDataInOverlay(event, col, item) {
  const newCable = item.validCables.find(cable => cable.cableType.type === event.target.value);
  col.querySelector(`.totalPower`).textContent = `Pobór mocy: ${newCable.totalPower}W`;
  col.querySelector(`.totalCurrent`).textContent = `Prąd: ${newCable.totalCurrent}A`;
  col.querySelector(`.totalVoltage`).textContent = `Napięcie: ${newCable.totalVoltage}V`;
}

function hideOverlayPanel() {
  document.getElementById('overlayPanel').classList.add('hidden');
}


const debounce = (fn, delay = 180) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const debouncedUpdateSystem = debounce(() => {
  functionToUpdateSystem();
  checkIfToledExists();
}, 180);

const changeEvent = function (event) {
  const changeElement = event.target;
  if (changeElement.matches("select.cable-select")) return;
  if (changeElement.matches("input[type='checkbox']")) return;

  const segmentRoot = event.target.closest(`.actionsSegment`);
  if (!segmentRoot) return;

  const checkedIndexes = checkboxChecked().map(Number);
  const isMulti = checkedIndexes.length > 0;
  const targetIndex = parseInt(segmentRoot.dataset.segmentindex, 10);
  const elements = isMulti
    ? checkedIndexes.map((index) => ({ index, segment: document.querySelector(`.systemActions #actionsSegment${index}`) })).filter(item => item.segment)
    : [{ index: targetIndex, segment: segmentRoot }];

  const structure = systemData.selectedStructure || initSystem.selectedStructure;

  elements.forEach(({ index, segment }) => {
    const busIndex = index - 1;
    if (!systemData.bus[busIndex]) return;

    if (changeElement.matches("select.segmentDeviceSelect")) {
      const selected = structure?.devices?.find((device) => device.type === changeElement.value);
      if (!selected) return;

      systemData.bus[busIndex].detector = { ...selected };

      if (selected.type === "TOLED") {
        const wrapper = segment.querySelector(".deviceTypeWrapper");
        let toledContainer = wrapper?.querySelector(".toledContainer.toledDescriptionSelect");
        if (!toledContainer && wrapper) {
          toledContainer = createSegmentTOLEDDescriptionSelect();
          wrapper.appendChild(toledContainer);
        }

        const toledSelect = segment.querySelector(".toledDescriptionSelect select");
        const selectedOption = toledSelect?.selectedOptions?.[0];
        systemData.bus[busIndex].description = toledSelect?.value || "";
        systemData.bus[busIndex].labeling = selectedOption?.dataset.label || null;
      } else {
        const toled = segment.querySelector(".toledContainer.toledDescriptionSelect");
        if (toled) toled.remove();
        systemData.bus[busIndex].description = "";
        systemData.bus[busIndex].labeling = null;
      }
    }

    if (changeElement.matches("select.toledSelect")) {
      systemData.bus[busIndex].description = changeElement.value;
      const selectedOption = changeElement.selectedOptions[0];
      systemData.bus[busIndex].labeling = selectedOption?.dataset.label || null;
    }

    if (changeElement.matches("input.segmentWireLength")) {
      systemData.bus[busIndex].wireLength = Math.max(1, parseInt(changeElement.value, 10) || 1);
    }
  });

  if (changeElement.matches("input.segmentWireLength")) {
    debouncedUpdateSystem();
  } else {
    functionToUpdateSystem();
    checkIfToledExists();
  }
}



const clickEvent = function (event) {
  const btn = event.target;

  if (btn.matches("#backToHomeButton")) {
    returnToHomeView();
    return;
  }

  const segmentEl = btn.closest(".actionsSegment");
  const index = segmentEl ? parseInt(segmentEl.dataset.segmentindex, 10) : null;

  if (btn.matches("button.duplicateDeviceButton")) {
    if (!index || !systemData.bus[index - 1]) return;
    if (systemData.bus.length >= 50) {
      systemData.errorList = [{ code: `TOO_MANY_DEVICES`, message: TRANSLATION.busWarning?.[lang] || "Maksymalna liczba segmentów to 50." }];
      errorHandling();
      return;
    }

    const copy = JSON.parse(JSON.stringify(systemData.bus[index - 1]));
    systemData.bus.splice(index, 0, copy);
    reindexBus();
    handleButton();
    functionToUpdateSystem({ forceValidation: true });
    checkIfToledExists();
    return;
  }

  if (btn.matches("button.removeDeviceButton")) {
    if (!index || systemData.bus.length <= 1) return;

    systemData.bus.splice(index - 1, 1);
    reindexBus();
    handleButton();
    functionToUpdateSystem({ forceValidation: true });
    checkIfToledExists();
    return;
  }

  if (btn.matches(".checkAll")) {
    document.querySelectorAll(".segmentCheckbox").forEach((cb) => (cb.checked = true));
    return;
  }

  if (btn.matches(".unCheckAll")) {
    document.querySelectorAll(".segmentCheckbox").forEach((cb) => (cb.checked = false));
    return;
  }

  if (btn.matches("button#exportToCSV")) {
    exportToXLSX();
    return;
  }

  if (btn.matches("button#exportToJSON")) {
    exportToJSON();
  }
}

function reindexBus() {
  systemData.bus.forEach((segment, i) => {
    segment.index = i + 1;
  });
}



function setupSystemEventHandlers() {
  const container = document.getElementById("system");
  if (!container || container.dataset.systemHandlersBound === "true") return;

  container.addEventListener("change", changeEvent);
  container.addEventListener("input", (event) => {
    if (event.target.matches("input.segmentWireLength")) changeEvent(event);
  });
  container.addEventListener("click", clickEvent);
  setupRangeSelection();

  container.dataset.systemHandlersBound = "true";
}

function checkIfToledExists() {
  const segments = document.querySelectorAll(`.actionsSegment`);
  segments.forEach((segment) => {
    const index = parseInt(segment.dataset.segmentindex, 10);
    const wrapper = segment.querySelector('.deviceTypeWrapper');
    const existingToled = wrapper?.querySelector('.toledContainer.toledDescriptionSelect');

    const detector = systemData.bus[index - 1]?.detector;

    if (!detector) return;

    if (detector.type === "TOLED") {
      if (!existingToled) {
        wrapper?.appendChild(createSegmentTOLEDDescriptionSelect());
      }
    } else {
      if (existingToled) {
        existingToled.remove();
        systemData.bus[index - 1].description = "";
      }
    }
  });
}

// Ustawienie długości magistrali w panelu stanu

function setSystemStateBusLength() {
  const busLength = document.getElementById("busLength");
  if (!busLength) return;
  const busLengthValue = systemData.bus.reduce((acc, device) => acc + (Number(device.wireLength) || 0), 0);
  if (busLength.textContent !== String(busLengthValue)) {
    busLength.textContent = busLengthValue;
  }
}
// Ustawienie wartości zużycia energii dla systemu w panelu stanu

function getSelectedPowerSupplyDisplayName() {
  const externalPowerSupply = getSelectedExternalPowerSupply();
  if (externalPowerSupply?.description) return externalPowerSupply.description;

  const generatedSupply = systemData.generatedSupply;
  if (generatedSupply) return generatedSupply;

  const integratedPower = systemData.supplyType?.description?.power;
  return integratedPower ? `${integratedPower}W` : "";
}

function setSystemStatePowerConsumption() {
  const powerConsumption = document.getElementById("powerConsumption");
  const powerSupplyDescription = document.getElementById("powerSupplyType");
  const powerSupplyGenerated = document.getElementById("powerSupplyGenerated");
  const powerSupplyRow = powerSupplyGenerated?.closest("li");

  if (powerConsumption) {
    const totalPower = String(systemData.totalPower || 0);
    if (powerConsumption.textContent !== totalPower) powerConsumption.textContent = totalPower;
  }

  const generatedSupply = getSelectedPowerSupplyDisplayName();

  if (powerSupplyRow) {
    powerSupplyRow.classList.add("powerSupplyStatusItem");
    powerSupplyRow.style.display = generatedSupply ? "" : "none";
  } else if (powerSupplyGenerated) {
    powerSupplyGenerated.style.display = generatedSupply ? "" : "none";
  }

  if (powerSupplyDescription && powerSupplyDescription.textContent !== generatedSupply) {
    powerSupplyDescription.textContent = generatedSupply;
  }
}


function setSystemStateCableDim() {
  const wireCrossSection = document.querySelector(`#wireCrossSection`);
  if (wireCrossSection && wireCrossSection.innerText !== systemData.wireType) {
    wireCrossSection.innerText = systemData.wireType || "";
  }
}

function createSystemUsedDevicesPanel() {
  const systemUsedDevicesContainer = document.getElementById("usedDevicesContainer");
  if (!systemUsedDevicesContainer) return;

  const result = setUsedDevices();
  const externalPowerSupply = getSelectedExternalPowerSupply();
  const signature = JSON.stringify({
    supplyType: systemData.supplyType?.type || "",
    powerSupply: externalPowerSupply?.description || "",
    configLabel: systemData.res?.powerSupply?.label || "",
    devices: Object.keys(result).sort(),
    lang,
  });

  if (signature === lastUsedDevicesSignature) return;
  lastUsedDevicesSignature = signature;

  const df = document.createDocumentFragment();
  if (systemData.supplyType?.type) df.appendChild(setSystemUsedPSU(systemData.supplyType.type));
  if (externalPowerSupply?.description) df.appendChild(setSystemUsedExternalPowerSupply(externalPowerSupply));

  for (const value of Object.values(result)) {
    df.appendChild(setSystemUsedDevice(value));
  }

  systemUsedDevicesContainer.replaceChildren(df);
}

// // Ustawienie wykorzystanego w systemie rodzaju jednostki sterującej
// // USTAWIENIE JEDNOSTKI STERUJĄCEJ
function setSystemUsedExternalPowerSupply(powerSupply) {
  const item = document.createElement("div");
  const dataContainer = document.createElement("div");
  const imageContainer = document.createElement("div");
  const name = document.createElement("p");
  const description = document.createElement("p");
  const image = document.createElement("img");

  setAttributes(item, {
    class: "usedDeviceItem",
    id: `used${String(powerSupply.description || powerSupply.type || "PowerSupply").replace(/ |\+|-/g, "")}Device`,
  });
  setAttributes(dataContainer, { class: "systemUsedDeviceDataContainer" });
  setAttributes(imageContainer, { class: "usedDeviceImageContainer" });
  setAttributes(name, { class: "usedDeviceName" });
  setAttributes(description, { class: "systemUsedDeviceType" });
  setAttributes(image, {
    src: `./PNG/Teta MOD Control 1.png`,
    alt: `power supply image`,
  });

  name.appendChild(document.createTextNode(powerSupply.description || powerSupply.type || "Zasilacz"));
  description.appendChild(document.createTextNode(`${TRANSLATION.filePSU?.[lang] || "Zasilacz"} ${powerSupply.power ? `- ${powerSupply.power}W` : ""}`));

  dataContainer.appendChild(name);
  dataContainer.appendChild(description);
  imageContainer.appendChild(image);
  item.appendChild(dataContainer);
  item.appendChild(imageContainer);

  return item;
}

function setSystemUsedPSU(supplyType) {
  const systemUsedPSU = document.createElement("div");
  const systemUsedPSUDataContainer = document.createElement("div");
  const systemUsedPSUImageContainer = document.createElement("div");
  const df = document.createDocumentFragment();

  setAttributes(systemUsedPSU, { class: "usedDeviceItem", id: "usedPSU" });
  setAttributes(systemUsedPSUDataContainer, {
    class: "systemUsedDeviceDataContainer",
  });
  setAttributes(systemUsedPSUImageContainer, {
    class: "usedDeviceImageContainer",
  });
  const systemUsedPSUName = document.createElement("p");
  const systemUsedPSUBreak = document.createElement("br");
  const systemUsedPSUDocsLink = document.createElement("a");
  const systemUsedPSUImage = document.createElement("img");
  setAttributes(systemUsedPSUName, { class: "usedDeviceName" });

  setAttributes(systemUsedPSUDocsLink, {
    class: "usedDeviceDocs",
    href: lang === `pl` ? "https://www.atestgaz.pl/produkt/modul-js-teta-mod-control-1" : "https://atestgaz.pl/en/produkt/teta-mod-control-1-control-unit-module/",
    target: "_blank",
    "data-translate": "appliedDevicesDocTech",
  });
  setAttributes(systemUsedPSUImage, {
    src: `./PNG/Teta MOD Control 1.png`,
    alt: `control unit image`,
  });
  systemUsedPSUName.appendChild(document.createTextNode(supplyType));
  systemUsedPSUDocsLink.appendChild(document.createTextNode(`${TRANSLATION.appliedDevicesDocTech[lang]}`));
  df.appendChild(systemUsedPSUName);
  df.appendChild(systemUsedPSUBreak);
  df.appendChild(systemUsedPSUDocsLink);
  systemUsedPSUImageContainer.appendChild(systemUsedPSUImage);
  systemUsedPSU.appendChild(df);
  systemUsedPSU.appendChild(systemUsedPSUImageContainer);
  return systemUsedPSU;
}

// Ustawienie wykorzystanego w systemie rodzaju urządzenia
//ZESTAWIENIE URZĄDZEŃ
function setSystemUsedDevice(device) {
  const systemUsedDevice = document.createElement("div");
  const systemUsedDeviceDataContainer = document.createElement("div");
  const systemUsedDeviceImageContainer = document.createElement("div");
  setAttributes(systemUsedDevice, {
    class: "usedDeviceItem",
    id: `used${device.type.replace(/ |\+/g, "")}Device`,
  });
  setAttributes(systemUsedDeviceDataContainer, {
    class: "systemUsedDeviceDataContainer",
  });
  setAttributes(systemUsedDeviceImageContainer, {
    class: "usedDeviceImageContainer",
  });
  const systemUsedDeviceName = document.createElement("p");
  const systemUsedDeviceType = document.createElement("p");
  const systemUsedDeviceBreak = document.createElement("br");
  const systemUsedDeviceImage = document.createElement("img");
  setAttributes(systemUsedDeviceName, { class: "usedDeviceName" });
  setAttributes(systemUsedDeviceType, { class: "systemUsedDeviceType" });
  setAttributes(systemUsedDeviceImage, {
    src: `./PNG/${device.type}.png`,
    alt: `${device.type} image`,
  });
  systemUsedDeviceName.appendChild(document.createTextNode(device.type));
  if (device.class === `detector`) {
    systemUsedDeviceType.appendChild(
      document.createTextNode(`${TRANSLATION.deviceDescription[lang]} ${device.gasDetected}`)
    );
  } else {
    systemUsedDeviceType.appendChild(document.createTextNode(`${TRANSLATION.signallerDescription[lang]}`));
  }
  systemUsedDeviceDataContainer.appendChild(systemUsedDeviceName);
  systemUsedDeviceDataContainer.appendChild(systemUsedDeviceType);
  systemUsedDeviceDataContainer.appendChild(systemUsedDeviceBreak);

  const systemUsedDeviceDocsLink = document.createElement("a");
  if (device.type === "Teta EcoWent+MiniDet") {
    const systemUsedDeviceDocsLink2 = document.createElement("a");
    setAttributes(systemUsedDeviceDocsLink, {
      class: "usedDeviceDocs",
      "data-translate": "appliedDevicesDocTech",
      href: device.doc.went[lang],
      target: "_blank",
    });
    setAttributes(systemUsedDeviceDocsLink2, {
      class: "usedDeviceDocs",
      "data-translate": "appliedDevicesDocTech",
      href: device.doc.det[lang],
      target: "_blank",
    });
    systemUsedDeviceDocsLink.appendChild(document.createTextNode(`${TRANSLATION.appliedDevicesDocTech[lang]} CO`));
    systemUsedDeviceDocsLink2.appendChild(document.createTextNode(`${TRANSLATION.appliedDevicesDocTech[lang]} LPG`));
    systemUsedDeviceDataContainer.appendChild(systemUsedDeviceDocsLink);
    systemUsedDeviceDataContainer.appendChild(systemUsedDeviceDocsLink2);
  } else {
    setAttributes(systemUsedDeviceDocsLink, {
      class: "usedDeviceDocs",
      href: device.doc[lang],
      target: "_blank",
      "data-translate": "appliedDevicesDocTech",
    });
    systemUsedDeviceDocsLink.appendChild(document.createTextNode(`${TRANSLATION.appliedDevicesDocTech[lang]}`));
    systemUsedDeviceDataContainer.appendChild(systemUsedDeviceDocsLink);
  }

  systemUsedDeviceImageContainer.appendChild(systemUsedDeviceImage);
  systemUsedDevice.appendChild(systemUsedDeviceDataContainer);
  systemUsedDevice.appendChild(systemUsedDeviceImageContainer);

  return systemUsedDevice;
}


function setSystemSegmentsLazy(bus) {
  const container = document.getElementById('actionsList');
  const template = document.getElementById('actionsSegment1');
  if (!container || !template) return;

  // Limit aplikacji to 50 segmentów, więc jednorazowy render przez DocumentFragment
  // jest prostszy i stabilniejszy niż lazy loading + scroll listener + setTimeout.
  Array.from(container.querySelectorAll('.actionsSegment')).forEach((segment) => {
    if (segment.id !== 'actionsSegment0' && segment.id !== 'actionsSegment1') segment.remove();
  });

  if (!bus.length) return;

  updateSegmentDom(template, 1, bus[0]);
  const df = document.createDocumentFragment();

  for (let i = 1; i < bus.length; i++) {
    const newSegment = template.cloneNode(true);
    updateSegmentDom(newSegment, i + 1, bus[i]);
    df.appendChild(newSegment);
  }

  container.appendChild(df);
}

function updateSegmentDom(segment, newIndex, busSegment) {
  segment.style.display = '';
  segment.id = `actionsSegment${newIndex}`;
  segment.dataset.segmentindex = newIndex;

  const inputId = segment.querySelector('.segmentId');
  if (inputId) {
    inputId.value = newIndex;
    inputId.id = `actionsSegmentIndex${newIndex}`;
  }

  const indexLabel = segment.querySelector('.segmentIndexLabel');
  if (indexLabel) indexLabel.setAttribute(`for`, `actionsSegmentIndex${newIndex}`);

  const actionsSegmentDeviceLabel = segment.querySelector(`.segmentDeviceLabel`);
  if (actionsSegmentDeviceLabel) actionsSegmentDeviceLabel.setAttribute(`for`, `actionsSegmentDevice${newIndex}`);

  const select = segment.querySelector('.segmentDeviceSelect');
  if (select) {
    select.id = `actionsSegmentDevice${newIndex}`;
    select.value = busSegment?.detector?.type || "";
  }

  const wireLengthLabel = segment.querySelector(`.segmentWireLengthLabel`);
  if (wireLengthLabel) wireLengthLabel.setAttribute(`for`, `actionsSegmentWireLength${newIndex}`);

  const wireLengthInput = segment.querySelector('.segmentWireLength');
  if (wireLengthInput) {
    wireLengthInput.value = busSegment?.wireLength || 1;
    wireLengthInput.id = `actionsSegmentWireLength${newIndex}`;
  }

  const dupBtn = segment.querySelector('.duplicateDeviceButton');
  if (dupBtn) dupBtn.id = `duplicateDevice${newIndex}`;

  const remBtn = segment.querySelector('.removeDeviceButton');
  if (remBtn) remBtn.id = `removeDevice${newIndex}`;

  const wrapper = segment.querySelector('.deviceTypeWrapper');
  const existingToled = wrapper?.querySelector('.toledContainer.toledDescriptionSelect');
  if (existingToled) existingToled.remove();

  if (busSegment?.detector?.type === 'TOLED' && wrapper) {
    const toledContainer = createSegmentTOLEDDescriptionSelect();
    const toledSelect = toledContainer.querySelector('select');
    if (toledSelect && busSegment.description) toledSelect.value = busSegment.description;
    wrapper.appendChild(toledContainer);
  }
}

