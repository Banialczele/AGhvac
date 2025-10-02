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

    const option = createOption(gas, `${gas} ${structure.detectionDescription[i][lang]}`, {
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

// Przetwarzanie formularza dot. systemu
function handleFormSubmit() {
  //Zatwierdzenie formularza, przypisanie wybranych przez użytkownika parametrów do obiektu inicjującego podgląd systemu i wygenerowanie podglądu
  const form = document.querySelector(".form");
  const container = document.getElementById("system");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (initSystem.systemIsGenerated) {
      const confirmRegenerate = window.confirm(TRANSLATION.regenerateSystemMessage[lang]);
      if (!confirmRegenerate) return;
      systemData = {
        supplyType: ``,
        devicesTypes: { detectors: [], signallers: [] },
        bus: [],
      };
      container.removeEventListener("change", changeEvent);
      container.removeEventListener("click", clickEvent);
    }

    initSystem.backup = document.getElementById("batteryBackUp").value;
    initSystem.amountOfDetectors = parseInt(document.getElementById("amountOfDetectors").value);
    systemData.devicesTypes = { detectors: [], signallers: [] };
    systemData.bus = [];
    systemData.amountOfDetectors = initSystem.amountOfDetectors;
    initSystem.EWL = document.getElementById("EWL").value;
    for (let i = 0; i < initSystem.amountOfDetectors; i++) {
      systemData.bus.push({
        index: i + 1,
        detector: initSystem.detector,
        wireLength: parseInt(document.getElementById("EWL").value),
        description: "",
      });
    }
    systemData.selectedStructure = initSystem.selectedStructure;
    setSystem();
    system.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
function validateSystem() {
  const [errors, result] = findConfigsByBackupPolicy(CONTROLUNITLIST, systemData.bus, Cables, initSystem, powersupplyTMC1, powersupplyMC);
  console.log(result)
  const controlUnit = result.alternativeConfig.controlUnit;
  const cable = result.alternativeConfig.cables[0];
  systemData.supplyType = controlUnit;
  systemData.res = result;
  systemData.wireType = cable.type
  systemData.totalPower = Math.ceil(result.systemPower);
  systemData.errorList = errors;
  initSystem.systemIsGenerated = true;
  errorHandling()
}

function errorHandling() {
  if (systemData.bus.length > 50 && !systemData.errorList.find(error => error.code === `TOO_MANY_DEVICES`)) {
    systemData.errorList.push({ code: `TOO_MANY_DEVICES`, message: `${TRANSLATION.busWarning[lang]}` })
  }
  const errorContainer = document.querySelector(`.errors`);
  const errorList = document.querySelector(`.errorList`);
  errorList.innerHTML = ""
  systemData.errorList.forEach(error => {
    const item = document.createElement(`li`);
    item.setAttribute(`id`, error.code);
    item.innerText = error.message;
    errorList.appendChild(item);
  });
  if(systemData.errorList.length > 0){
    errorContainer.classList.add("errorActive");
  } else {
     errorContainer.classList.remove("errorActive");
  }
}