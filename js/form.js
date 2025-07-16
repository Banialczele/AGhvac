// Tworzenie opcji dla selecta dot. rodzaju struktury
function createStructureTypesListSelect() {
  const select = document.getElementById("structureType");
  const fragment = document.createDocumentFragment();

  STRUCTURE_TYPES.forEach((elem) => {
    const option = createOption(elem.type[lang], elem.type[lang], {
      class: "structureOption",
      selected: elem.type[lang] === STRUCTURE_TYPES[0].type[lang],
    });
    fragment.appendChild(option);
  });

  select.innerHTML = "";
  select.appendChild(fragment);
  structureSelectHandler();
  createDetectedGasListSelect();
}

function getFirstDetector(structure, deviceName) {
  return structure.devices.find((device) => device.type === deviceName);
}

function structureSelectHandler() {
  const structureSelect = document.getElementById(`structureType`);
  structureSelect.addEventListener(`change`, (event) => {
    const gasDetectionSelect = document.getElementById(`gasDetected`);
    const selectedStructure = STRUCTURE_TYPES.find((structure) => structure.type[lang] === event.target.value);
    initSystem.selectedStructure = selectedStructure;
    createDetectedGasListSelect();
    initSystem.detector = getFirstDetector(selectedStructure, gasDetectionSelect.options[0].dataset.devicename);
  });
}

function gasListSelectHandler(select) {
  select.addEventListener("change", (event) => {
    const opt = event.target.selectedOptions[0];
    initSystem.detector = getFirstDetector(initSystem.selectedStructure, opt.dataset.devicename);
  });
}

function createDetectedGasListSelect() {
  const select = document.getElementById("gasDetected");
  const fragment = document.createDocumentFragment();

  select.innerHTML = "";

  const structure = initSystem.selectedStructure;
  if (!structure) return;

  structure.detection.forEach((gas, i) => {
    const device = structure.devices[i];
    if (device.class !== "detector") return;
    const option = createOption(gas, gas, {
      class: "gasOption",
      "data-devicename": device.type,
      "data-devicetype": device.class,
      selected: gas === initSystem.gasDetected,
    });
    fragment.appendChild(option);
  });

  select.appendChild(fragment);
  gasListSelectHandler(select);
}

function createBatteryBackUpListSelect() {
  const select = document.getElementById("batteryBackUp");
  const fragment = document.createDocumentFragment();

  const yesOption = createOption(TRANSLATION.batteryBackUpYes[lang], TRANSLATION.batteryBackUpYes[lang], {
    class: "batteryBackupOption",
  });

  const noOption = createOption(TRANSLATION.batteryBackUpNo[lang], TRANSLATION.batteryBackUpNo[lang], {
    class: "batteryBackupOption",
    selected: true,
  });

  fragment.appendChild(yesOption);
  fragment.appendChild(noOption);

  select.innerHTML = "";
  select.appendChild(fragment);
}

// Pomocnicza funkcja do tworzenia opcji
function createOption(value, text, attributes = {}) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  Object.entries(attributes).forEach(([key, val]) => {
    if (val === true) option.setAttribute(key, key);
    else if (val !== false && val != null) option.setAttribute(key, val);
  });
  return option;
}

// Ustawienie domyślnych wartości dla inputa liczby urządzeń oraz odległości między urządzeniami
function setInputDefaultData() {
  document.getElementById("amountOfDetectors").value = initSystem.amountOfDetectors;
  document.getElementById("EWL").value = initSystem.EWL;
}

function checkBusLength() {
  const amountOfDetectors = initSystem.amountOfDetectors;
  const busLength = systemData.bus[0].wireLength;
  return amountOfDetectors * busLength;
}

// Inicjowanie formularza wraz z domyślnymi ustawieniami
function formInit() {
  createStructureTypesListSelect();
  createDetectedGasListSelect();
  createBatteryBackUpListSelect();
  setInputDefaultData();
}

function handleErrorPopup(message) {
  const popupcontainer = document.querySelector(".configuratorPanel ");
  const df = document.createDocumentFragment();
  const paragraph = document.createElement(`p`);
  const paragraphContainer = document.createElement(`div`);
  const closeButton = document.createElement(`button`);
  closeButton.classList.add(`formPopUpParagraphCloseButton`);
  closeButton.classList.add(`formButton`);
  closeButton.innerText = "X";
  paragraph.classList.add(`formPopupParagraph`);
  paragraphContainer.classList.add(`formPopupContainer`);

  paragraphContainer.classList.add("formPopupContainerToggle");
  paragraphContainer.classList.add("panelContainer");
  paragraph.innerHTML = message;
  closeButton.addEventListener(`click`, () => {
    paragraphContainer.replaceChildren();
    paragraphContainer.classList.remove(`formPopupContainerToggle`);
    paragraphContainer.classList.remove(`panelContainer`);
  });
  paragraphContainer.appendChild(closeButton);
  paragraphContainer.appendChild(paragraph);
  df.appendChild(paragraphContainer);
  popupcontainer.appendChild(df);
}

function findControlUnit() {
  const batteryBackUp = document.getElementById("batteryBackUp").value;
  const backUpOption =
    batteryBackUp === `Nie`
      ? CONTROLUNITLIST.find((unit) => unit.possibleUPS === `no`)
      : CONTROLUNITLIST.find((unit) => unit.possibleUPS === `yes`);
  return backUpOption;
}

function updateModControlAndCable(item, newCable) {
  const modControl = CONTROLUNITLIST.find(unit => unit.productKey === item.supplyType.productKey);
  const elem = item.validCables.find(cable => cable.cableType.type === newCable);

  systemData.supplyType = modControl;
  systemData.totalCurrent = elem.totalCurrent;
  systemData.totalPower = elem.totalPower;
  systemData.totalVoltage = elem.totalVoltage;
  systemData.wireType = elem.cableType.type
}

// Przetwarzanie formularza dot. systemu
function handleFormSubmit() {
  //Zatwierdzenie formularza, przypisanie wybranych przez użytkownika parametrów do obiektu inicjującego podgląd systemu i wygenerowanie podglądu
  const form = document.querySelector(".form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (initSystem.systemIsGenerated) {
      const confirmRegenerate = window.confirm(TRANSLATION.regenerateSystemMessage[lang]);
      if (!confirmRegenerate) return;
    }
    systemData.supplyType = findControlUnit(batteryBackUp);
    initSystem.amountOfDetectors = parseInt(document.getElementById("amountOfDetectors").value);
    systemData.devicesTypes = { detectors: [], signallers: [] };
    systemData.bus = [];
    systemData.amountOfDetectors = initSystem.amountOfDetectors;
    for (let i = 0; i < initSystem.amountOfDetectors; i++) {
      systemData.bus.push({
        index: i + 1,
        detector: initSystem.detector,
        wireLength: parseInt(document.getElementById("EWL").value),
        description: "",
      });
    }
    systemData.selectedStructure = initSystem.selectedStructure;
    const res = validateSystem();
    const selectedPSU = res.results.find(element => element.isUserSelected === true ? element : '');
    //sprawdzam czy zasilacz wybrany domyślnie przez system jest odpowiednim
    const dataToFill = selectedPSU !== undefined ? selectedPSU : res.results[0];
    systemData.supplyType = dataToFill.supplyType;
    systemData.wireType = dataToFill.validCables[0].cableType.type;
    systemData.totalPower = dataToFill.validCables[0].totalPower;
    systemData.totalCurrent = dataToFill.validCables[0].totalCurrent;
    systemData.totalVoltage = dataToFill.validCables[0].totalVoltage;
    systemData.errorList = res.errors;
    initSystem.systemIsGenerated = true;
    setSystem();
    system.scrollIntoView({ behavior: "smooth", block: "start" });


  });
}

function errorHandling() {
  if (systemData.bus.length > 50 && !systemData.errorList.find(error => error.code === `deviceMaxExceeded`)) {
    systemData.errorList.push({ message: TRANSLATION.busWarning[lang], code: `deviceMaxExceeded` });
  }
  updateSystemState()
  updateErrors();

}

function updateErrors() {
  const errorList = document.querySelector('.errorList');
  errorList.innerHTML = ''; // Czyści całą listę
  systemData.errorList.forEach(elem => {
    const listItem = document.createElement('li');
    listItem.classList.add(elem.code);
    listItem.innerText = elem.message;
    errorList.appendChild(listItem);
  });
}