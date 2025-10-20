function createSystemDataFromAFile(fileData = null) {
  if (fileData) {
    systemData.supplyType = fileData.supplyType;
    initSystem.backup = fileData.backup;
    systemData.selectedStructure = fileData.selectedStructure;
    systemData.bus = fileData.bus;
    systemData.batteryBackUp = fileData.batteryBackUp;
    systemData.devicesTypes = fileData.devicesTypes;
  }
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

  const df = new DocumentFragment();
  //Ustawienie opisu "Urządzenie" i wartość pola czy jednostka sterująca może obsługiwać UPSa
  if (select === firstSegment) {
    const labelSelect = select.closest(`.segmentDeviceLabel`);
    const batteryBackUpInput = labelSelect.querySelector(`#modControlBatteryBackUp`);
    const before = labelSelect.querySelector("br");
    const text = TRANSLATION.systemSegmentDescription[lang];
    const prev = before && before.previousSibling;

    if (!(prev && prev.nodeType === Node.TEXT_NODE && prev.nodeValue === text)) {
      labelSelect.insertBefore(document.createTextNode(text), before);
    }

    const batteryTranslation =
      systemData.supplyType.possibleUPS === "no"
        ? TRANSLATION.batteryBackUpNo[lang]
        : TRANSLATION.batteryBackUpYes[lang];

    batteryBackUpInput.value = batteryTranslation;
  } else {
    select.innerHTML = "";

    // WYGENEROWANIE OPCJI DLA SELECTA URZĄDZENIA!
    systemData.selectedStructure.devices.forEach((device, i) => {
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
          selected: systemData.selectedStructure.devices[i].type === initSystem.detector.type ? "selected" : null,
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
  updateSelectValue();
  setSystemStatePowerConsumption();
  setSystemStateCableDim();
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
  if (!changeElement.matches("select.cable-select")) {
    if (changeElement.matches("input[type='checkbox']")) return;
    //Dane odnośnie segmentu
    const indexes = checkboxChecked();
    const isMulti = indexes.length > 0;
    const elements = isMulti
      ? indexes.map((i) => ({
        index: parseInt(i),
        segment: document.querySelector(`.systemActions #actionsSegment${i}`),
      }))
      : [
        {
          index: parseInt(event.target.closest(`.actionsSegment`).dataset.segmentindex),
          segment: event.target.closest(`.actionsSegment`),
        },
      ];

    elements.forEach(({ index, segment }) => {
      if (changeElement.matches("select.segmentDeviceSelect")) {
        const selected = systemData.selectedStructure.devices.find(
          (device) => device.type === changeElement.value
        );

        if (selected?.type === "TOLED") {
          const container = segment.querySelector(".deviceTypeWrapper");
          const wrapper = segment.querySelector(".deviceTypeWrapper");
          const toled = wrapper.querySelector(".toledContainer.toledDescriptionSelect");
          if (toled) toled.remove();

          container.appendChild(createSegmentTOLEDDescriptionSelect());

          const toledSelect = segment.querySelector(".toledDescriptionSelect select");
          systemData.bus[index - 1].description = toledSelect.value;

          // 🔹 DODANE: przypisanie labeling z wybranej opcji
          const selectedOption = toledSelect.selectedOptions[0];
          systemData.bus[index - 1].labeling = selectedOption?.dataset.label || null;
        }

        systemData.bus[index - 1].detector = { ...selected };
      }

      if (changeElement.matches("select.toledSelect")) {
        systemData.bus[index - 1].description = changeElement.value;

        // 🔹 DODANE: aktualizacja labeling przy zmianie opcji
        const selectedOption = changeElement.selectedOptions[0];
        systemData.bus[index - 1].labeling = selectedOption?.dataset.label || null;
      }

      if (changeElement.matches("input.segmentWireLength")) {
        systemData.bus[index - 1].wireLength = parseInt(changeElement.value);
      }
    });
}
functionToUpdateSystem();
checkIfToledExists();
}

clickEvent = function (event) {
  const btn = event.target;
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

function setupSystemEventHandlers() {
  const container = document.getElementById("system");
  container.addEventListener("change", changeEvent);

  container.addEventListener("click", clickEvent);
  setupRangeSelection();
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
function setSystemStatePowerConsumption(value = 1) {
  const powerConsumption = document.getElementById("powerConsumption");
  const powerSupplyDescription = document.getElementById("powerSupplyType");
  if (systemData.generatedSupply === null) {
    const powerSupplyGenerated = document.getElementById("powerSupplyGenerated")
    powerSupplyGenerated.style.display = "none";
  } else {
    powerSupplyDescription.textContent = `${systemData.generatedSupply}W`;
  }
  if (powerConsumption.textContent !== String(value)) {
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

