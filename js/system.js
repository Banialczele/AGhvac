function findStructureByType(typeValue) {
  if (!typeValue || typeof STRUCTURE_TYPES === "undefined" || !Array.isArray(STRUCTURE_TYPES)) {
    return null;
  }

  const normalized = String(
    typeof typeValue === "object"
      ? typeValue?.[lang] || typeValue?.pl || typeValue?.en || ""
      : typeValue
  ).trim().toLowerCase();

  if (!normalized) return null;

  return STRUCTURE_TYPES.find((structure) => {
    const pl = String(structure?.type?.pl || "").trim().toLowerCase();
    const en = String(structure?.type?.en || "").trim().toLowerCase();
    const current = String(structure?.type?.[lang] || "").trim().toLowerCase();
    return normalized === pl || normalized === en || normalized === current;
  }) || null;
}

function getDefaultDetectorFromStructure(structure) {
  if (!structure?.devices?.length) return null;
  return structure.devices.find((device) => device.class === "detector") || structure.devices[0] || null;
}

function findDeviceByType(deviceType, selectedStructure = null) {
  if (!deviceType) return null;

  const fromStructure = selectedStructure?.devices?.find((device) => device.type === deviceType);
  if (fromStructure) return fromStructure;

  if (typeof Devices !== "undefined" && Array.isArray(Devices)) {
    const fromGlobal = Devices.find((device) => device.type === deviceType);
    if (fromGlobal) return fromGlobal;
  }

  return null;
}

function createSystemDataFromAFile(fileData = null) {
  if (!fileData) return false;

  // Obsługujemy zarówno stary format JSON, jak i eksport z wrapperem { systemData, initSystem }.
  const incomingSystem = fileData.systemData || fileData;
  const incomingInit = fileData.initSystem || {};

  const structureType = incomingSystem.selectedStructureType ||
    incomingSystem.selectedStructure?.type?.[lang] ||
    incomingSystem.selectedStructure?.type?.pl ||
    incomingSystem.selectedStructure?.type?.en ||
    incomingSystem.selectedStructure ||
    incomingInit.selectedStructure?.type?.[lang] ||
    incomingInit.selectedStructure?.type?.pl ||
    incomingInit.selectedStructure?.type?.en ||
    incomingInit.selectedStructure;

  const selectedStructure = findStructureByType(structureType)
    || incomingSystem.selectedStructure
    || initSystem?.selectedStructure
    || systemData?.selectedStructure
    || (typeof getDefaultStructure === "function" ? getDefaultStructure() : null)
    || (typeof STRUCTURE_TYPES !== "undefined" ? STRUCTURE_TYPES?.[0] : null);

  const normalizeDevice = (deviceLike) => {
    if (!deviceLike) return null;
    const deviceType = typeof deviceLike === "string" ? deviceLike : deviceLike.type;
    if (!deviceType) return typeof deviceLike === "object" ? deviceLike : null;
    return findDeviceByType(deviceType, selectedStructure) || (typeof deviceLike === "object" ? deviceLike : null);
  };

  const incomingBus = Array.isArray(incomingSystem.bus) ? incomingSystem.bus : [];
  const normalizedBus = incomingBus.map((segment, index) => {
    const detector = normalizeDevice(segment.detector || segment.device || segment.deviceType);
    return {
      ...segment,
      index: Number(segment.index) || index + 1,
      detector,
      wireLength: Number(segment.wireLength ?? segment.cableLen_m ?? segment.length ?? incomingInit.EWL ?? initSystem?.EWL ?? 15) || 15,
      description: segment.description || "",
      labeling: segment.labeling ?? null,
    };
  }).filter((segment) => segment.detector?.type);

  const backupValue = incomingSystem.batteryBackUp || incomingSystem.backup || incomingInit.backup || initSystem?.backup || TRANSLATION?.batteryBackUpNo?.[lang] || "Nie";
  const thRailingValue = incomingSystem.thRailing || incomingInit.thRailing || initSystem?.thRailing || TRANSLATION?.batteryBackUpYes?.[lang] || "Tak";

  const incomingSupplyType = incomingSystem.supplyType || incomingSystem.res?.powerSupply?.controlUnit || null;
  const supplyType = typeof incomingSupplyType === "string"
    ? (typeof CONTROLUNITLIST !== "undefined" && Array.isArray(CONTROLUNITLIST)
      ? CONTROLUNITLIST.find((controlUnit) => controlUnit.type === incomingSupplyType)
      : null) || incomingSupplyType
    : incomingSupplyType;

  systemData.supplyType = supplyType || ``;
  systemData.wireType = incomingSystem.wireType || incomingSystem.res?.powerSupply?.cable?.type || "";
  systemData.batteryBackUp = backupValue;
  systemData.thRailing = thRailingValue;
  systemData.devicesTypes = incomingSystem.devicesTypes || { detectors: [], signallers: [] };
  systemData.bus = normalizedBus;
  systemData.errorList = [];
  systemData.res = incomingSystem.res || null;
  systemData.totalPower = Number(incomingSystem.totalPower) || 0;
  systemData.generatedSupply = incomingSystem.generatedSupply ?? null;
  systemData.selectedStructure = selectedStructure;

  initSystem.selectedStructure = selectedStructure;
  initSystem.backup = backupValue;
  initSystem.thRailing = thRailingValue;
  initSystem.amountOfDetectors = normalizedBus.length || Number(incomingInit.amountOfDetectors) || 1;
  initSystem.EWL = Number(normalizedBus[0]?.wireLength || incomingInit.EWL || 15);
  initSystem.detector = normalizedBus[0]?.detector || getDefaultDetectorFromStructure(selectedStructure);
  initSystem.systemIsGenerated = normalizedBus.length > 0;

  const structureSelect = document.getElementById("structureType");
  if (structureSelect && selectedStructure?.type?.[lang]) {
    structureSelect.value = selectedStructure.type[lang];
  }

  if (typeof createDetectedGasListSelect === "function") {
    createDetectedGasListSelect();
  }

  const gasSelect = document.getElementById("gasDetected");
  if (gasSelect && initSystem.detector?.type) {
    const option = Array.from(gasSelect.options).find((opt) => opt.dataset?.devicename === initSystem.detector.type);
    if (option) gasSelect.value = option.value;
  }

  const thSelect = document.getElementById("thRailing");
  if (thSelect) thSelect.value = thRailingValue;

  const backupSelect = document.getElementById("batteryBackUp");
  if (backupSelect) backupSelect.value = backupValue;

  const amountInput = document.getElementById("amountOfDetectors");
  if (amountInput) amountInput.value = initSystem.amountOfDetectors;

  const ewlInput = document.getElementById("EWL");
  if (ewlInput) ewlInput.value = initSystem.EWL;

  return true;
}

function copyImageSegmentOnFormSubmit() {
  const parentNode = document.querySelector(`.systemDiagram`);
  const firstSegment = document.getElementById(`segmentDiagram1`);
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

function updateModControl() {
  const modControl = document.getElementById(`actionsSegmentDevice0`);
  modControl.innerText = systemData.supplyType.type
  return modControl;
}


function getSystemYesText() {
  return TRANSLATION?.batteryBackUpYes?.[lang] || (lang === "en" ? "Yes" : "Tak");
}

function getSystemNoText() {
  return TRANSLATION?.batteryBackUpNo?.[lang] || (lang === "en" ? "No" : "Nie");
}

function normalizeSystemBooleanLabel(value, defaultValue = false) {
  const normalized = String(value ?? "").trim().toUpperCase();
  const isYes = ["TAK", "YES", "TRUE", "1"].includes(normalized);
  const isNo = ["NIE", "NO", "FALSE", "0"].includes(normalized);
  return (isYes || (!isNo && defaultValue)) ? getSystemYesText() : getSystemNoText();
}

function getSystemBackupLabel() {
  return normalizeSystemBooleanLabel(initSystem.backup || systemData.batteryBackUp, false);
}

function getSystemThRailingLabel() {
  return normalizeSystemBooleanLabel(initSystem.thRailing || systemData.thRailing, true);
}

function prepareSystemOptionToggle(input, value, optionName) {
  if (!input) return;
  input.value = value;
  input.readOnly = true;
  input.classList.add("systemOptionToggleInput");
  input.setAttribute("role", "button");
  input.setAttribute("tabindex", "0");
  input.dataset.systemOption = optionName;
  input.setAttribute(
    "aria-label",
    optionName === "thRailing"
      ? (lang === "en" ? "Change TH35 mounting" : "Zmień montaż TH35")
      : (lang === "en" ? "Change UPS setting" : "Zmień podtrzymanie akumulatorowe")
  );
}

function ensureSystemOptionControls(labelSelect) {
  if (!labelSelect) return;

  const oldTooltip = labelSelect.querySelector(".modControltooltip, .tooltip");
  if (oldTooltip) oldTooltip.remove();

  const batteryInput = labelSelect.querySelector("#modControlBatteryBackUp");
  let thLabel = labelSelect.querySelector(".thRailingDescriptionSystem");
  let thInput = labelSelect.querySelector("#modControlThRailing");

  if (!thLabel) {
    thLabel = document.createElement("div");
    thLabel.className = "thRailingDescriptionSystem";
    thLabel.textContent = "TH35";
    labelSelect.appendChild(thLabel);
  } else {
    thLabel.textContent = "TH35";
  }

  if (!thInput) {
    thInput = document.createElement("input");
    thInput.type = "text";
    thInput.id = "modControlThRailing";
    thInput.className = "systemOptionToggleInput thRailingToggleInput";
    labelSelect.appendChild(thInput);
  }

  prepareSystemOptionToggle(batteryInput, getSystemBackupLabel(), "backup");
  prepareSystemOptionToggle(thInput, getSystemThRailingLabel(), "thRailing");
}

function updateSystemOptionControls() {
  const labelSelect = document.getElementById("segmentDeviceLabel");
  ensureSystemOptionControls(labelSelect);
}

function toggleSystemOption(optionName) {
  const yesText = getSystemYesText();
  const noText = getSystemNoText();

  if (optionName === "backup") {
    const nextValue = getSystemBackupLabel() === yesText ? noText : yesText;
    initSystem.backup = nextValue;
    systemData.batteryBackUp = nextValue;
    const formSelect = document.getElementById("batteryBackUp");
    if (formSelect) formSelect.value = nextValue;
  }

  if (optionName === "thRailing") {
    const nextValue = getSystemThRailingLabel() === yesText ? noText : yesText;
    initSystem.thRailing = nextValue;
    systemData.thRailing = nextValue;
    const formSelect = document.getElementById("thRailing");
    if (formSelect) formSelect.value = nextValue;
  }

  functionToUpdateSystem();
  updateSystemOptionControls();
}

function setSystemStateThRailing() {
  const list = document.getElementById("controlUnitList");
  if (!list) return;

  let row = document.getElementById("controlUnitThRailingRow");
  let value = document.getElementById("controlUnitThRailingValue");

  if (!row) {
    row = document.createElement("li");
    row.id = "controlUnitThRailingRow";

    const label = document.createElement("div");
    label.id = "controlUnitThRailingLabel";

    const valueWrapper = document.createElement("div");
    value = document.createElement("span");
    value.id = "controlUnitThRailingValue";
    valueWrapper.appendChild(value);

    row.append(label, valueWrapper);

    const cableRow = document.getElementById("powerSupplyCableDim")?.closest("li");
    list.insertBefore(row, cableRow?.nextSibling || null);
  }

  const label = document.getElementById("controlUnitThRailingLabel");
  if (label) label.textContent = lang === "en" ? "TH35 mounting" : "Montaż TH35";
  if (value) value.textContent = getSystemThRailingLabel();
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

  // Ustawienie opisu "Urządzenie" i wartości pola UPS dla jednostki sterującej.
  if (select === firstSegment) {
    const labelSelect = select.closest(`.segmentDeviceLabel`);
    const batteryBackUpInput = labelSelect?.querySelector(`#modControlBatteryBackUp`);
    const before = labelSelect?.querySelector("br");
    const text = TRANSLATION.systemSegmentDescription[lang];
    const prev = before && before.previousSibling;

    if (labelSelect && before && !(prev && prev.nodeType === Node.TEXT_NODE && prev.nodeValue === text)) {
      labelSelect.insertBefore(document.createTextNode(text), before);
    }

    ensureSystemOptionControls(labelSelect);
    return;
  }

  select.innerHTML = "";

  const structure = systemData.selectedStructure || initSystem.selectedStructure;
  if (!structure?.devices?.length) return;

  const currentIndex = Number(segment.dataset.segmentindex) - 1;
  const currentDeviceType = systemData.bus[currentIndex]?.detector?.type;

  // WYGENEROWANIE OPCJI DLA SELECTA URZĄDZENIA!
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
        selected: currentDeviceType === device.type ? "selected" : null,
      },
      [text]
    );

    df.appendChild(option);
  });
  select.appendChild(df);
}

function fillData() {
  const actionsSegments = document.querySelectorAll(`.actionsSegment`);
  actionsSegments.forEach((segment) => setSelectInSegment(segment));
  actionsSegments.forEach((segment) => {
    const input = segment.querySelector(`.segmentWireLength`);
    if (!input) return;
    const index = Number(segment.dataset.segmentindex) - 1;
    input.value = systemData.bus[index]?.wireLength ?? initSystem.EWL;
  });
}

//setup bus images
function setBusImages(busElem, type) {
  const busImage = busElem.querySelector(`.busImageContainer img`);
  if (!busImage) return;
  setAttributes(busImage, {
    src: `./SVG/tcon${type === "detector" ? "P" : "L"}.svg`,
    alt: "T-Konektor image",
  });
}

function setImage(busElem, device, detectorContainer, signallerContainer) {
  if (!busElem || !device?.type) return;

  const detectorImage = busElem.querySelector(detectorContainer);
  const signallerImg = busElem.querySelector(signallerContainer);
  if (!detectorImage || !signallerImg) return;

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

function updateBusImageForSegment(index) {
  const segment = document.querySelector(`#segmentDiagram${index}`)
    || document.querySelector(`.systemDiagram .deviceSegment[data-segmentindex="${index}"]`);
  const detector = systemData.bus[index - 1]?.detector;

  if (!segment || !detector) return;

  setBusImages(segment, detector.class);
  setImage(segment, detector, `.detectorImageContainer img`, `.warningDeviceImageContainer img`);
}

function busImageController() {
  const segments = document.querySelectorAll(`.systemDiagram .deviceSegment`);
  segments.forEach((segment, fallbackIndex) => {
    const index = Number(segment.dataset.segmentindex) || fallbackIndex + 1;
    const detector = systemData.bus[index - 1]?.detector;
    if (!detector) return;

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
  const keep = [0, 1];
  Array.from(actionsList.children).forEach((child, idx) => {
    if (!keep.includes(idx)) actionsList.removeChild(child);
  });
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
  setSystemSegmentsLazy(systemData.bus);
  copyImageSegmentOnFormSubmit();
  functionToUpdateSystem();
  ensureBackToHomeButton();

  fillData();
  updateSelectValue();
  setupSystemEventHandlers();
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
function setupRangeSelection() {
  const container = document.getElementById("system");
  if (!container) return;
  container.addEventListener("click", (e) => {
    if (e.target.matches(".segmentCheckbox")) handleSegmentCheckboxClick(e);
  });
}

// To powinno być wywoływane zawsze po zmianie w systemie:
function functionToUpdateSystem() {
  validateSystem();
  updateWireLength();
  setSystemStateBusLength();
  updateModControl();
  updateSystemOptionControls();
  updateSelectValue();
  setSystemStatePowerConsumption();
  setSystemStateCableDim();
  setSystemStateThRailing();
  createSystemUsedDevicesPanel();
  setSystemStateLists();
  busImageController()
}

function handleButton(index) {
  copyImageSegmentOnFormSubmit();
  copyActionsSegmentOnFormSubmit(index);
  functionToUpdateSystem();
}

function checkboxChecked() {
  return Array.from(document.querySelectorAll(".segmentCheckbox"))
    .filter((cb) => cb.checked) // zostaw zaznaczone
    .map((cb) => cb.closest(".deviceSegment")?.dataset.segmentindex) // weź indeks
    .filter(Boolean);
}

function updateWireLength() {
  document.querySelectorAll(`.segmentWireLength`).forEach((input, i) => (input.value = systemData.bus[i].wireLength));
}

function updateSelectValue() {
  document.querySelectorAll(`.segmentDeviceSelect`).forEach((select, i) => {
    if (i > 0) {
      select.selected = systemData.bus[i - 1].detector.type;
      select.value = systemData.bus[i - 1].detector.type;
    }
  });
}

function setUsedDevices() {
  const result = systemData.bus.reduce((accumulator, current) => {
    accumulator[current.detector.type] = current.detector;
    return accumulator;
  }, {});
  return result;
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

changeEvent = function (event) {
  const changeElement = event.target;
  if (changeElement.matches("select.cable-select")) return;
  if (changeElement.matches("input[type='checkbox']")) return;

  const sourceSegment = event.target.closest(`.actionsSegment`);
  if (!sourceSegment) return;

  const checkedIndexes = checkboxChecked().map(Number);
  const indexes = checkedIndexes.length > 0
    ? checkedIndexes
    : [Number(sourceSegment.dataset.segmentindex)];

  indexes.forEach((index) => {
    const segment = document.querySelector(`.systemActions #actionsSegment${index}`) || sourceSegment;
    if (!systemData.bus[index - 1]) return;

    if (changeElement.matches("select.segmentDeviceSelect")) {
      const structure = systemData.selectedStructure || initSystem.selectedStructure;
      const selected = structure?.devices?.find((device) => device.type === changeElement.value)
        || findDeviceByType(changeElement.value, structure);

      if (!selected) return;

      const wrapper = segment.querySelector(".deviceTypeWrapper");
      const existingToled = wrapper?.querySelector(".toledContainer.toledDescriptionSelect");

      if (selected.type === "TOLED") {
        if (existingToled) existingToled.remove();
        wrapper?.appendChild(createSegmentTOLEDDescriptionSelect());

        const toledSelect = segment.querySelector(".toledDescriptionSelect select");
        systemData.bus[index - 1].description = toledSelect?.value || "";
        systemData.bus[index - 1].labeling = toledSelect?.selectedOptions?.[0]?.dataset?.label || null;
      } else {
        if (existingToled) existingToled.remove();
        systemData.bus[index - 1].description = "";
        systemData.bus[index - 1].labeling = null;
      }

      systemData.bus[index - 1].detector = { ...selected };
      updateBusImageForSegment(index);
    }

    if (changeElement.matches("select.toledSelect")) {
      systemData.bus[index - 1].description = changeElement.value;
      systemData.bus[index - 1].labeling = changeElement.selectedOptions?.[0]?.dataset?.label || null;
    }

    if (changeElement.matches("input.segmentWireLength")) {
      systemData.bus[index - 1].wireLength = parseInt(changeElement.value, 10) || 1;
    }
  });

  functionToUpdateSystem();
  checkIfToledExists();
  requestAnimationFrame(() => busImageController());
}

clickEvent = function (event) {
  const btn = event.target;

  if (btn.closest("#backToHomeButton")) {
    returnToHomeView();
    return;
  }

  if (btn.matches(".systemOptionToggleInput")) {
    toggleSystemOption(btn.dataset.systemOption);
    return;
  }

  const segmentEl = btn.closest(".actionsSegment");
  let index = segmentEl ? parseInt(segmentEl.dataset.segmentindex, 10) : null;
  if (btn.matches("button.duplicateDeviceButton")) {
    const copy = JSON.parse(JSON.stringify(systemData.bus[index - 1]));
    systemData.bus.splice(index, 0, copy);
    handleButton(index);
    functionToUpdateSystem();
    checkIfToledExists();
  }
  // Usunięcie segmentu
  if (btn.matches("button.removeDeviceButton")) {
    systemData.bus.splice(index - 1, 1);
    handleButton(index);
    checkIfToledExists();
    functionToUpdateSystem();
  }
  // Zaznacz wszystkie
  if (btn.matches(".checkAll")) {
    document.querySelectorAll(".segmentCheckbox").forEach((cb) => (cb.checked = true));
  }
  // Odznacz wszystkie
  if (btn.matches(".unCheckAll")) {
    document.querySelectorAll(".segmentCheckbox").forEach((cb) => (cb.checked = false));
  } else if (btn.matches("button#exportToCSV")) {
    exportToXLSX();
  } else if (btn.matches("button#exportToJSON")) {
    exportToJSON();
  }
}

function keydownEvent(event) {
  const target = event.target;
  if (!target.matches(".systemOptionToggleInput")) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  toggleSystemOption(target.dataset.systemOption);
}

function setupSystemEventHandlers() {
  const container = document.getElementById("system");
  if (!container || container.dataset.systemHandlersBound === "true") return;

  container.addEventListener("change", changeEvent);
  container.addEventListener("click", clickEvent);
  container.addEventListener("keydown", keydownEvent);
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
  const busLengthValue = systemData.bus.reduce((acc, device) => acc + device.wireLength, 0);
  if (busLength.textContent !== String(busLengthValue)) {
    busLength.textContent = busLengthValue;
  }
}
// Ustawienie wartości zużycia energii dla systemu w panelu stanu
function getSelectedPowerSupplyDescription() {
  const selectedConfig = systemData.res?.powerSupply || null;

  const externalPowerSupply =
    selectedConfig?.powerSupply?.supply ||
    selectedConfig?.psu ||
    null;

  if (externalPowerSupply?.description) return externalPowerSupply.description;

  const controlUnit = selectedConfig?.controlUnit || systemData.supplyType || null;
  const power = Number(controlUnit?.description?.power);
  const voltage = Number(controlUnit?.description?.supplyVoltage);

  if (Number.isFinite(power) && power > 0 && Number.isFinite(voltage) && voltage > 0) {
    return `HDR-${power}W-${voltage}V`;
  }

  const generatedSupply = String(systemData.generatedSupply || "").trim();
  if (!generatedSupply) return "";
  return /^\d+$/.test(generatedSupply) ? `${generatedSupply}W` : generatedSupply;
}

function setSystemStatePowerConsumption(value = 1) {
  const powerConsumption = document.getElementById("powerConsumption");
  const powerSupplyDescription = document.getElementById("powerSupplyType");
  const powerSupplyGenerated = document.getElementById("powerSupplyGenerated");
  const powerSupplyRow = powerSupplyGenerated?.closest("li");
  const powerSupplyText = getSelectedPowerSupplyDescription();

  if (!powerSupplyText) {
    if (powerSupplyRow) powerSupplyRow.style.display = "none";
  } else {
    if (powerSupplyRow) powerSupplyRow.style.display = "";
    if (powerSupplyDescription) powerSupplyDescription.textContent = powerSupplyText;
  }

  if (powerConsumption && powerConsumption.textContent !== String(systemData.totalPower)) {
    powerConsumption.textContent = systemData.totalPower;
  }
}

function setSystemStateCableDim() {
  document.querySelector(`#wireCrossSection`).innerText = systemData.wireType;

}
function createSystemUsedDevicesPanel() {
  const systemUsedDevicesContainer = document.getElementById("usedDevicesContainer");
  systemUsedDevicesContainer.replaceChildren();
  const result = setUsedDevices();

  //ZNALEZIENIE OBRAZU JEDNOSTKI STERUJĄCEJ
  systemUsedDevicesContainer.appendChild(setSystemUsedPSU(systemData.supplyType.type));
  for (const [key, value] of Object.entries(result)) {
    systemUsedDevicesContainer.appendChild(setSystemUsedDevice(value));
  }
}

// // Ustawienie wykorzystanego w systemie rodzaju jednostki sterującej
// // USTAWIENIE JEDNOSTKI STERUJĄCEJ
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
  const SEGMENT_BATCH_SIZE = 10;
  let loadedCount = 1;

  function renderSegment(index) {
    const template = document.getElementById('actionsSegment1');
    const newSegment = template.cloneNode(true);
    const newIndex = index + 1;
    const detectorType = systemData.bus[index]?.detector?.type;
    const wrapper = newSegment.querySelector('.deviceTypeWrapper');
    const existingToled = wrapper?.querySelector('.toledContainer.toledDescriptionSelect');
    if (existingToled && detectorType !== 'TOLED') {
      existingToled.remove();
    } else if (!existingToled && detectorType === 'TOLED') {
      wrapper?.appendChild(createSegmentTOLEDDescriptionSelect());
    }
    newSegment.style.display = '';
    newSegment.id = `actionsSegment${newIndex}`;
    newSegment.dataset.segmentindex = newIndex;

    // Numer segmentu
    const inputId = newSegment.querySelector('.segmentId');
    if (inputId) {
      inputId.value = newIndex;
      inputId.id = `actionsSegmentIndex${newIndex}`;
    }
    //Label selecta
    const actionsSegmentDeviceLabel = newSegment.querySelector(`.segmentDeviceLabel`);
    actionsSegmentDeviceLabel.setAttribute(`for`, `actionsSegmentDevice${newIndex}`)
    // Select urządzenia
    const select = newSegment.querySelector('.segmentDeviceSelect');
    if (select && systemData.bus[index] && systemData.bus[index].detector) {
      select.value = systemData.bus[index].detector.type || "";
      select.id = `actionsSegmentDevice${newIndex}`;
    }
    const wireLengthLabel = newSegment.querySelector(`.segmentWireLengthLabel`);
    wireLengthLabel.setAttribute(`for`, `actionsSegmentWireLength${newIndex}`)
    // Długość kabla
    const wireLengthInput = newSegment.querySelector('.segmentWireLength');
    if (wireLengthInput && systemData.bus[index] && systemData.bus[index].wireLength) {
      wireLengthInput.value = systemData.bus[index].wireLength;
      wireLengthInput.id = `actionsSegmentWireLength${newIndex}`;
    }
    // Przycisk duplikacji i usuwania
    const dupBtn = newSegment.querySelector('.duplicateDeviceButton');
    if (dupBtn) dupBtn.id = `duplicateDevice${newIndex}`;
    const remBtn = newSegment.querySelector('.removeDeviceButton');
    if (remBtn) remBtn.id = `removeDevice${newIndex}`;
    return newSegment;
  }

  function loadMoreSegments() {
    const end = Math.min(loadedCount + SEGMENT_BATCH_SIZE, bus.length);
    for (let i = loadedCount; i < end; i++) {
      const seg = renderSegment(i);
      if (seg) container.appendChild(seg);
    }
    loadedCount = end;
  }

  loadMoreSegments();

  function onScroll() {
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
      if (loadedCount < bus.length) loadMoreSegments();
    }
  }
  container.removeEventListener('scroll', container._infiniteScrollHandler || (() => { }));
  container._infiniteScrollHandler = onScroll;
  container.addEventListener('scroll', onScroll);

  setTimeout(function tryLoadMore() {
    if (loadedCount < bus.length && container.scrollHeight <= container.clientHeight) {
      loadMoreSegments();
      setTimeout(tryLoadMore, 100);
    }
  }, 100);
}

