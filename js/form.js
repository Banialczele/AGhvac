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
// Przetwarzanie formularza dot. systemu
function handleFormSubmit() {
  //Zatwierdzenie formularza, przypisanie wybranych przez użytkownika parametrów do obiektu inicjującego podgląd systemu i wygenerowanie podglądu
  const form = document.querySelector(".form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (initSystem.systemIsGenerated) {
      const confirmRegenerate = window.confirm(TRANSLATION.regenerateSystemMessage[lang]);
      if (!confirmRegenerate) return;
      systemData = {
        supplyType: ``,
        wiretype: '',
        devicesTypes: { detectors: [], signallers: [] },
        bus: [],
      };
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
    validateSystem()
    setSystem();
    system.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
function validateSystem() {
  const result = findValidControlUnitsWithCables(CONTROLUNITLIST, systemData.bus, Cables);
  let controlUnit = result.units[0].controlUnit;
  let cable = result.units[0].validCables[0];
  const nextUnit = result.units[1];
  const higherPriorityCable = nextUnit.validCables.find(validCable => validCable.cable.priority < cable.cable.priority);
  if (higherPriorityCable !== undefined) {
    controlUnit = nextUnit.controlUnit;
    cable = higherPriorityCable;
  }
  const powerSupply = controlUnit;
  systemData.supplyType = powerSupply;
  systemData.wireType = cable.cable.type
  systemData.totalPower = Math.ceil(cable.powerW);
  systemData.errorList = result.error;
  initSystem.systemIsGenerated = true;
  errorHandling()
}

function errorHandling() {
  if (systemData.bus.length > 50 && !systemData.errorList.find(error => error.code === `TOO_MANY_DEVICES`)) {
    systemData.errorList.push({ code: `TOO_MANY_DEVICES`, message: `${TRANSLATION.busWarning[lang]}` })
  }
  const errorList = document.querySelector(`.errorList`);
  errorList.innerHTML = ""
  systemData.errorList.forEach(error => {
    const item = document.createElement(`li`);
    item.setAttribute(`id`, error.code);
    item.innerText = error.message;
    errorList.appendChild(item);
  })
}