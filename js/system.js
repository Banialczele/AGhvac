// Inicjacja głównego obiektu z danymi systemu przy wczytaniu z pliku
function createSystemDataFromAFile(fileData = null) {
  if (fileData) {
    systemData.supplyType = fileData.supplyType;
    systemData.structureType = fileData.structureType;
    systemData.bus = fileData.bus;
    systemData.batteryBackUp = fileData.batteryBackUp;
    systemData.devicesTypes = fileData.devicesTypes;
  }
}

function copyImageSegmentOnFormSubmit(index) {
  const parentNode = document.querySelector(`.systemDiagram`);
  const firstSegment = document.getElementById(`segmentDiagram${index}`);
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

function generateOptionsForModControl(selectedUnit) {
  const selectModControl = document.getElementById(`actionsSegmentDevice0`);
  CONTROLUNITLIST.forEach((unit) => {
    const option = document.createElement("option");
    option.value = unit.productKey;
    option.textContent = unit.type;
    if (unit.productKey === selectedUnit.productKey) {
      option.selected = true;
    }
    selectModControl.appendChild(option);
  });
  return selectModControl;
}

function copyActionsSegmentOnFormSubmit(index) {
  const parentNode = document.querySelector(`.actionsList`);
  const firstSegment = document.getElementById(`actionsSegment1`);
  const actionsSegments = document.querySelectorAll(`.actionsSegment`);
  actionsSegments.forEach((elem, i) => (i > 1 ? parentNode.removeChild(elem) : ""));
  const df = new DocumentFragment();
  console.log(index)
  for (let i = 1; i < systemData.bus.length; i++) {
    console.log(i)
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
  // console.log(select)
  const firstSegment = document.getElementById(`actionsSegmentDevice0`);

  const df = new DocumentFragment();
  //Ustawienie opisu "Urządzenie" i wartość pola czy jednostka sterująca może obsługiwać UPSa
  if (select === firstSegment) {
    const labelSelect = select.closest(`.segmentDeviceLabel`);
    const batteryBackUpInput = labelSelect.querySelector(`#modControlBatteryBackUp`);
    const description = document.createTextNode(`${TRANSLATION.systemSegmentDescription[lang]}`);
    labelSelect.insertBefore(description, labelSelect.querySelector("br"));

    const batteryTranslation =
      systemData.supplyType.possibleUPS === "no"
        ? TRANSLATION.batteryBackUpNo[lang]
        : TRANSLATION.batteryBackUpYes[lang];

    batteryBackUpInput.value = batteryTranslation;
  } else {
    systemData.selectedStructure.devices.forEach((device, i) => {
      const text =
        device.class === "detector"
          ? `${TRANSLATION.deviceSegment.detector[lang]} ${device.gasDetected}`
          : `${TRANSLATION.deviceSegment.signaller[lang]} ${device.type}`;
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
  setList(`detectorsList`, deviceTotal.detector);
  setList(`signallersList`, deviceTotal.valveCtrl);
  setList(`signallersList`, deviceTotal.signaller);
  setList(`accessoriesList`, deviceTotal.tCon);
}

function setList(listName, deviceList) {
  const listToSet = document.getElementById(listName);
  listToSet.replaceChildren();
  for (const [key, value] of Object.entries(deviceList)) {
    listToSet.appendChild(createListItem(key, value));
  }
}



function updateSystemState() {
  const state = document.querySelector(`.systemOutput`);
  if (systemData.errorList.length === 0) {
    state.classList.remove(`falseSystem`);
    state.innerText = `OK`
  } else {
    state.classList.add(`falseSystem`);
    state.innerText = TRANSLATION.systemStateFalse[lang];
  }
}


// Tworzenie systemu
function setSystem() {
  const actionsList = document.getElementById('actionsList');
  const keep = [0, 1];
  Array.from(actionsList.children).forEach((child, idx) => {
    if (!keep.includes(idx)) actionsList.removeChild(child);
  });
  setSystemSegmentsLazy(systemData.bus);
  copyImageSegmentOnFormSubmit(1);
  // copyActionsSegmentOnFormSubmit(1);
  generateOptionsForModControl(systemData.supplyType);
  fillData();
  funtionToUpdateSystem();
  //obsługa zdarzeń
  setupSystemEventHandlers();
  errorHandling();
}

function funtionToUpdateSystem() {
  busImageController();
  setSystemStateLists();
  updateWireLength();
  setSystemStateBusLength();
  updateSelectValue()
  setSystemStatePowerConsumption();
  createSystemUsedDevicesPanel();
  updateSystemPowerSupply();
  const res = validateSystem();
  systemData.errorList = res.errors;
  errorHandling();
}

function handleButton(index) {
  copyImageSegmentOnFormSubmit(index);
  copyActionsSegmentOnFormSubmit(index);
  funtionToUpdateSystem();
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


function showOverlayPanel(data) {
  const overlay = document.getElementById('overlayPanel');
  const list = document.getElementById('overlayList');

  list.querySelectorAll('.panel-col:not(.template)').forEach(e => e.remove()); // wyczyść poprzednie (nie szablon!)

  const template = document.getElementById('colTemplate');
  data.results.forEach(item => {
    const col = template.cloneNode(true);
    col.classList.remove('template');
    col.id = ''; // usuwamy id z klona!
    col.style.display = '';

    // Obrazek
    const img = col.querySelector('.img');
    img.src = `./PNG/${item.supplyType.img}.png`;
    img.alt = item.supplyType.type;

    // Nazwa
    col.querySelector('.name').textContent = item.supplyType.type;
    // Dodatkowa wartość
    col.querySelector('.productKey').textContent = item.supplyType.productKey;

    // Kabel: select dla wielu, info dla jednego
    const select = col.querySelector('.cable-select');
    if (item.validCables.length > 0) {
      item.validCables.forEach(cable => {
        const option = document.createElement(`option`);
        option.textContent = cable.cableType.type;
        option.value = cable.cableType.type;
        select.appendChild(option);
      })
    }
    select.value = item.validCables[0].cableType.type;
    select.addEventListener(`change`, e => updateDataInOverlay(e, col, item));
    col.querySelector(`.totalPower`).textContent = `${TRANSLATION.popupPower[lang]}: ${item.validCables[0].totalPower}W`;
    col.querySelector(`.totalCurrent`).textContent = `${TRANSLATION.popupCurrent[lang]}: ${item.validCables[0].totalCurrent}A`;
    col.querySelector(`.totalVoltage`).textContent = `${TRANSLATION.popupVoltage[lang]}: ${item.validCables[0].totalVoltage}V`;
    const button = col.querySelector(`.choose-btn`);
    button.textContent = TRANSLATION.buttonText[lang];
    button.onclick = () => {
      const selectedCableType = select.value;
      const selectedCable = item.validCables.find(cab => cab.cableType.type === selectedCableType);
      systemData.supplyType = item.supplyType;
      systemData.wireType = selectedCable.cableType.type
      systemData.totalCurrent = selectedCable.totalCurrent;
      systemData.totalPower = selectedCable.totalPower;
      systemData.totalVoltage = selectedCable.totalVoltage;
      updateSystemPowerSupply();
      hideOverlayPanel();
    }

    list.appendChild(col);
  });

  overlay.classList.remove('hidden');
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


function setupSystemEventHandlers() {
  const container = document.getElementById("system");
  container.addEventListener("change", (event) => {
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
        if (changeElement.matches("select#actionsSegmentDevice0")) {
          const selecetedModControl = CONTROLUNITLIST.find(unit => unit.productKey === changeElement.value);
          const modControlInput = segment.querySelector("#modControlBatteryBackUp");
          const inputTranslation =
            selecetedModControl.possibleUPS === "no" ? TRANSLATION.batteryBackUpNo[lang] : TRANSLATION.batteryBackUpYes[lang];
          systemData.supplyType = selecetedModControl
          modControlInput.value = inputTranslation;
        } else {
          if (changeElement.matches("select.segmentDeviceSelect")) {
            const selected = systemData.selectedStructure.devices.find((device) => device.type === changeElement.value);

            if (selected?.type === "TOLED") {
              const container = segment.querySelector(".deviceTypeWrapper");
              container.appendChild(createSegmentTOLEDDescriptionSelect());
              const toledSelect = segment.querySelector(`.toledDescriptionSelect select`);
              systemData.bus[index - 1].description = toledSelect.value;
            }
            systemData.bus[index - 1].detector = { ...selected };
          }
          if (changeElement.matches("select.toledSelect")) {
            systemData.bus[index - 1].description = changeElement.value;
          }
          if (changeElement.matches("input.segmentWireLength")) {
            systemData.bus[index - 1].wireLength = parseInt(changeElement.value);
          }
        }
      });
      validateSystem();
      funtionToUpdateSystem();
      checkIfToledExists();
      updateSystemPowerSupply();
    }
  });

  container.addEventListener("click", (event) => {
    // event.preventDefault();
    const btn = event.target;
    const segmentEl = btn.closest(".actionsSegment");
    let index = segmentEl ? parseInt(segmentEl.dataset.segmentindex, 10) : null;
    if (btn.matches("button.duplicateDeviceButton")) {
      const copy = JSON.parse(JSON.stringify(systemData.bus[index - 1]));
      systemData.bus.splice(index, 0, copy);
      handleButton(index);
    }
    // Usunięcie segmentu
    if (btn.matches("button.removeDeviceButton")) {
      systemData.bus.splice(index - 1, 1);
      handleButton(index);
      checkIfToledExists();
    }

    if (btn.matches("button.modControlList")) {
      const res = validateSystem();
      showOverlayPanel(res);
    }

    // Zaznacz wszystkie
    if (btn.matches(".checkAll")) {
      document.querySelectorAll(".segmentCheckbox").forEach((cb) => (cb.checked = true));
    }
    if (btn.matches(`.close-btn`)) {
      hideOverlayPanel();
    }

    // Odznacz wszystkie
    if (btn.matches(".unCheckAll")) {
      document.querySelectorAll(".segmentCheckbox").forEach((cb) => (cb.checked = false));
    } else if (btn.matches("button#exportToCSV")) {
      exportToCSV();
    } else if (btn.matches("button#exportToJSON")) {
      exportToJSON();
    }
    validateSystem();
    funtionToUpdateSystem();
    checkIfToledExists();
  });
  const overlayPanel = document.querySelector('.overlay-panel-content');

  if (overlayPanel) {
    overlayPanel.addEventListener('wheel', function (e) {
      // znajdź najbliższą listę przewijaną
      const scrollList = overlayPanel.querySelector('.overlay-scroll-list');
      if (
        scrollList &&
        Math.abs(e.deltaY) > Math.abs(e.deltaX) &&
        scrollList.scrollWidth > scrollList.clientWidth // tylko jeśli jest overflow!
      ) {
        e.preventDefault();
        scrollList.scrollLeft += e.deltaY * 2;
      }
    }, { passive: false });
  }
}

function checkIfToledExists() {
  const toledDescription = document.querySelectorAll(`.toledDescriptionSelect`);
  toledDescription.forEach((element) => {
    const container = element.closest(`.actionsSegment`);
    const index = container.dataset.segmentindex;
    if (systemData.bus[index - 1].detector.type !== `TOLED`) {
      element.parentNode.removeChild(element);
      systemData.bus[index - 1].description = "";
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
  if (powerConsumption.textContent !== String(value)) {
    powerConsumption.textContent = systemData.totalPower;
  }
}

// // Tworzenie panelu z listą rodzajów wykorzystanych w systemie urządzeń
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
  const systemUsedPSUType = document.createElement("p");
  const systemUsedPSUBreak = document.createElement("br");
  const systemUsedPSUDocsLink = document.createElement("a");
  const systemUsedPSUImage = document.createElement("img");
  setAttributes(systemUsedPSUName, { class: "usedDeviceName" });
  setAttributes(systemUsedPSUType, {
    class: "systemUsedDeviceType",
    "data-translate": "controlUnitModule",
  });
  setAttributes(systemUsedPSUDocsLink, {
    class: "usedDeviceDocs",
    href: "https://www.atestgaz.pl/produkt/modul-js-teta-mod-control-1",
    target: "_blank",
    "data-translate": "appliedDevicesDocTech",
  });
  setAttributes(systemUsedPSUImage, {
    src: `./PNG/Teta MOD Control 1.png`,
    alt: `control unit image`,
  });
  systemUsedPSUName.appendChild(document.createTextNode(supplyType));
  // systemUsedPSUType.appendChild(
  //   document.createTextNode(`${TRANSLATION.controlUnitModule[lang]}`)
  // );
  systemUsedPSUDocsLink.appendChild(document.createTextNode(`${TRANSLATION.appliedDevicesDocTech[lang]}`));
  df.appendChild(systemUsedPSUName);
  df.appendChild(systemUsedPSUType);
  df.appendChild(systemUsedPSUBreak);
  df.appendChild(systemUsedPSUDocsLink);
  systemUsedPSUImageContainer.appendChild(systemUsedPSUImage);
  systemUsedPSU.appendChild(df);
  systemUsedPSU.appendChild(systemUsedPSUImageContainer);
  return systemUsedPSU;
}

// // Ustawienie wykorzystanego w systemie rodzaju urządzenia
// //ZESTAWIENIE URZĄDZEŃ
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
      href: device.doc.went,
      target: "_blank",
    });
    setAttributes(systemUsedDeviceDocsLink2, {
      class: "usedDeviceDocs",
      "data-translate": "appliedDevicesDocTech",
      href: device.doc.det,
      target: "_blank",
    });
    systemUsedDeviceDocsLink.appendChild(document.createTextNode(`${TRANSLATION.appliedDevicesDocTech[lang]} CO`));
    systemUsedDeviceDocsLink2.appendChild(document.createTextNode(`${TRANSLATION.appliedDevicesDocTech[lang]} LPG`));
    systemUsedDeviceDataContainer.appendChild(systemUsedDeviceDocsLink);
    systemUsedDeviceDataContainer.appendChild(systemUsedDeviceDocsLink2);
  } else {
    setAttributes(systemUsedDeviceDocsLink, {
      class: "usedDeviceDocs",
      href: device.doc,
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

function updateSystemPowerSupply() {
  const powerSupplyList = document.querySelector(`.powerSupplyList`);
  powerSupplyList.querySelector(`.modControlType`).innerText = systemData.supplyType.type;
  powerSupplyList.querySelector(`#powerSupply`).innerText = systemData.supplyType.productKey;
  powerSupplyList.querySelector(`#powerSupplyCableDim`).innerText = TRANSLATION.powerSupplyCableDim[lang];
  powerSupplyList.querySelector(`#wireCrossSection`).innerText = systemData.wireType;
}

function setSystemSegmentsLazy(bus) {
  const container = document.getElementById('actionsList');
  const SEGMENT_BATCH_SIZE = 10;
  let loadedCount = 1; // Start od 2, bo 0 i 1 już są w DOM!

  function renderSegment(index) {
    const template = document.getElementById('actionsSegment1');
    const newSegment = template.cloneNode(true);
    const newIndex = index + 1;
    newSegment.style.display = '';
    newSegment.id = `actionsSegment${newIndex}`;
    newSegment.dataset.segmentindex = newIndex;

    // Numer segmentu
    const inputId = newSegment.querySelector('.segmentId');
    if (inputId) {
      inputId.value = newIndex;
      inputId.id = `actionsSegmentIndex${newIndex}`;
    }
    // Select urządzenia
    const select = newSegment.querySelector('.segmentDeviceSelect');
    if (select && systemData.bus[newIndex] && systemData.bus[newIndex].detector) {
      select.value = systemData.bus[newIndex].detector.type || "";
      select.id = `actionsSegmentDevice${newIndex}`;
    }
    // Długość kabla
    const wireLengthInput = newSegment.querySelector('.segmentWireLength');
    if (wireLengthInput && systemData.bus[newIndex] && systemData.bus[newIndex].wireLength) {
      wireLengthInput.value = systemData.bus[newIndex].wireLength;
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