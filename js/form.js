function createStructureTypesListSelect() {
  const select = document.getElementById("structureType");
  if (!select || typeof STRUCTURE_TYPES === 'undefined') return;

  const fragment = document.createDocumentFragment();

  const defaultStructure = typeof getDefaultStructure === "function"
    ? getDefaultStructure()
    : (STRUCTURE_TYPES.find((s) => String(s.type?.pl || "").toLowerCase() === "inne" || String(s.type?.en || "").toLowerCase() === "other") || STRUCTURE_TYPES[0]);

  STRUCTURE_TYPES.forEach((elem) => {
    const isSelected = initSystem.selectedStructure
      ? elem.type?.[lang] === initSystem.selectedStructure.type?.[lang]
      : elem.type?.[lang] === defaultStructure?.type?.[lang];

    const option = createOption(elem.type[lang], elem.type[lang], {
      class: "structureOption",
      selected: isSelected,
    });
    fragment.appendChild(option);

    if (isSelected) {
      initSystem.selectedStructure = elem;
      systemData.selectedStructure = elem;
    }
  });

  select.innerHTML = "";
  select.appendChild(fragment);

  if (!select.dataset.listener) {
    select.addEventListener(`change`, (event) => {
      const selectedStructure = STRUCTURE_TYPES.find((s) => s.type[lang] === event.target.value) || STRUCTURE_TYPES[0];
      initSystem.selectedStructure = selectedStructure;
      systemData.selectedStructure = selectedStructure;
      createDetectedGasListSelect();

      const gasSelect = document.getElementById("gasDetected");
      if (gasSelect?.options?.length > 0) {
        initSystem.detector = getFirstDetector(selectedStructure, gasSelect.options[0].dataset.devicename);
      }
    });
    select.dataset.listener = "true";
  }
}

function getFirstDetector(structure, deviceName) {
  if (!structure?.devices) return null;
  return structure.devices.find((device) => device.type === deviceName) || null;
}

function createDetectedGasListSelect() {
  const select = document.getElementById("gasDetected");
  if (!select) return;

  const fragment = document.createDocumentFragment();
  const structure = initSystem.selectedStructure || STRUCTURE_TYPES?.[0];

  select.innerHTML = "";

  if (structure?.detection) {
    structure.detection.forEach((gas, i) => {
      const device = structure.devices?.find((device) =>
        device.class === "detector" && device.gasDetected === gas
      );

      if (!device) return;

      const option = createOption(gas, `${gas} ${structure.detectionDescription?.[i]?.[lang] || ""}`, {
        class: "gasOption",
        "data-devicename": device.type,
        "data-devicetype": device.class,
      });
      fragment.appendChild(option);
    });
  }

  select.appendChild(fragment);

  if (select.options.length > 0) {
    initSystem.detector = getFirstDetector(structure, select.options[0].dataset.devicename);
  }

  if (!select.dataset.listener) {
    select.addEventListener("change", (event) => {
      const opt = event.target.selectedOptions[0];
      initSystem.detector = getFirstDetector(initSystem.selectedStructure, opt?.dataset?.devicename);
    });
    select.dataset.listener = "true";
  }
}

function createBatteryBackUpListSelect() {
  const select = document.getElementById("batteryBackUp");
  if (!select) return;

  const fragment = document.createDocumentFragment();
  const yesText = TRANSLATION.batteryBackUpYes[lang];
  const noText = TRANSLATION.batteryBackUpNo[lang];

  fragment.appendChild(createOption(yesText, yesText, { class: "batteryBackupOption" }));
  fragment.appendChild(createOption(noText, noText, { class: "batteryBackupOption", selected: true }));

  select.innerHTML = "";
  select.appendChild(fragment);
  initSystem.backup = select.value;
}

function createThRailingListSelect() {
  const select = document.getElementById("thRailing");
  if (!select) return;

  const fragment = document.createDocumentFragment();
  const yesText = TRANSLATION.batteryBackUpYes[lang];
  const noText = TRANSLATION.batteryBackUpNo[lang];

  fragment.appendChild(createOption(yesText, yesText, { class: "thRailingOption", selected: true }));
  fragment.appendChild(createOption(noText, noText, { class: "thRailingOption" }));

  select.innerHTML = "";
  select.appendChild(fragment);
  initSystem.thRailing = select.value;
}

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

function getSystemErrorMessage(code, data = {}) {
  const messages = {
    EMPTY_BUS: {
      pl: "Dodaj co najmniej jedno urządzenie do systemu.",
      en: "Add at least one device to the system.",
    },
    INVALID_SEGMENT: {
      pl: "Sprawdź dane urządzeń i długości przewodów.",
      en: "Check the device data and cable lengths.",
    },
    NO_DEFAULT_DETECTOR: {
      pl: "Nie udało się przygotować systemu dla wybranych danych.",
      en: "The system could not be prepared for the selected data.",
    },
    NO_VALID_POWER_CONFIG_TH35_BACKUP: {
      pl: "Nie znaleziono poprawnej konfiguracji dla Państwa systemu.",
      en: "No valid configuration was found for this system.",
    },
    NO_VALID_POWER_CONFIG_TH35_NO_BACKUP: {
      pl: "Nie znaleziono poprawnej konfiguracji dla Państwa systemu.",
      en: "No valid configuration was found for this system.",
    },
    NO_VALID_POWER_CONFIG_WALL_BACKUP: {
      pl: "Nie znaleziono poprawnej konfiguracji dla Państwa systemu.",
      en: "No valid configuration was found for this system.",
    },
    NO_VALID_POWER_CONFIG_WALL_NO_BACKUP: {
      pl: "Nie znaleziono poprawnej konfiguracji dla Państwa systemu.",
      en: "No valid configuration was found for this system.",
    },
  };

  return messages[code]?.[lang] || messages[code]?.pl || code;
}

function getNoValidPowerConfigCode(backupNeeded, thRailingNeeded) {
  if (thRailingNeeded && backupNeeded) return "NO_VALID_POWER_CONFIG_TH35_BACKUP";
  if (thRailingNeeded && !backupNeeded) return "NO_VALID_POWER_CONFIG_TH35_NO_BACKUP";
  if (!thRailingNeeded && backupNeeded) return "NO_VALID_POWER_CONFIG_WALL_BACKUP";
  return "NO_VALID_POWER_CONFIG_WALL_NO_BACKUP";
}

function getLocalizedErrorMessage(error) {
  if (!error) return "";

  if (typeof error === "string") return error;

  if (typeof error.message === "object" && error.message !== null) {
    return error.message[lang] || error.message.pl || error.message.en || String(error.code || "");
  }

  if (typeof error.message === "string" && error.message.length > 0) {
    return error.message;
  }

  if (error.pl || error.en) {
    return error[lang] || error.pl || error.en || String(error.code || "");
  }

  if (error.code) {
    if (typeof getInputLimitMessage === "function" && [
      "INVALID_DEVICE_AMOUNT",
      "TOO_MANY_DEVICES",
      "TOO_MANY_SIGNALLERS",
      "TOO_MANY_VALVE_CTRLS",
      "INVALID_WIRE_LENGTH",
      "BUS_TOO_LONG",
    ].includes(error.code)) {
      return getInputLimitMessage(error.code, error.data || error);
    }
    return getSystemErrorMessage(error.code, error.data || error);
  }

  return String(error);
}

const SYSTEM_INPUT_LIMITS = {
  maxDevices: 50,
  maxSignallers: 28,
  maxValveCtrls: 8,
  maxTotalBusLengthM: 1000,
};

function getInputLimitMessage(code, data = {}) {
  const messages = {
    INVALID_DEVICE_AMOUNT: {
      pl: "Ilość urządzeń musi być liczbą większą lub równą 1.",
      en: "Device quantity must be a number greater than or equal to 1.",
    },
    TOO_MANY_DEVICES: {
      pl: data.current
        ? `Maksymalna ilość urządzeń na magistrali to ${data.maxDevices || SYSTEM_INPUT_LIMITS.maxDevices} szt. Aktualnie: ${data.current} szt.`
        : `Maksymalna ilość urządzeń to ${data.maxDevices || SYSTEM_INPUT_LIMITS.maxDevices} szt.`,
      en: data.current
        ? `Maximum device quantity on the bus is ${data.maxDevices || SYSTEM_INPUT_LIMITS.maxDevices} pcs. Current value: ${data.current} pcs.`
        : `Maximum device quantity is ${data.maxDevices || SYSTEM_INPUT_LIMITS.maxDevices} pcs.`,
    },
    TOO_MANY_SIGNALLERS: {
      pl: `Maksymalna ilość sygnalizatorów to ${data.maxSignallers || SYSTEM_INPUT_LIMITS.maxSignallers} szt. Aktualnie: ${data.current || 0} szt.`,
      en: `Maximum signalling devices quantity is ${data.maxSignallers || SYSTEM_INPUT_LIMITS.maxSignallers} pcs. Current value: ${data.current || 0} pcs.`,
    },
    TOO_MANY_VALVE_CTRLS: {
      pl: `Maksymalna ilość sterowników zaworu to ${data.maxValveCtrls || SYSTEM_INPUT_LIMITS.maxValveCtrls} szt. Aktualnie: ${data.current || 0} szt.`,
      en: `Maximum valve controllers quantity is ${data.maxValveCtrls || SYSTEM_INPUT_LIMITS.maxValveCtrls} pcs. Current value: ${data.current || 0} pcs.`,
    },
    INVALID_WIRE_LENGTH: {
      pl: "Orientacyjna odległość między urządzeniami musi być liczbą większą lub równą 1 m.",
      en: "Estimated distance between devices must be a number greater than or equal to 1 m.",
    },
    BUS_TOO_LONG: {
      pl: `Całkowita długość magistrali może wynosić maksymalnie ${data.maxTotal || SYSTEM_INPUT_LIMITS.maxTotalBusLengthM} m (1 km). Aktualnie: ${data.total || 0} m (${data.amount || 0} × ${data.ewl || 0} m). Zmniejsz ilość urządzeń albo orientacyjną odległość między urządzeniami.`,
      en: `Total bus length may be at most ${data.maxTotal || SYSTEM_INPUT_LIMITS.maxTotalBusLengthM} m (1 km). Current value: ${data.total || 0} m (${data.amount || 0} × ${data.ewl || 0} m). Reduce device quantity or estimated distance between devices.`,
    },
  };

  return messages[code]?.[lang] || messages[code]?.pl || code;
}

function getFormValidationContainer() {
  const form = document.querySelector(".form");
  if (!form) return null;

  let container = form.querySelector(".formValidationErrors");
  if (container) return container;

  container = document.createElement("div");
  container.className = "formValidationErrors";
  container.setAttribute("role", "alert");
  container.setAttribute("aria-live", "polite");
  container.hidden = true;

  Object.assign(container.style, {
    gridColumn: "1 / -1",
    padding: "12px 14px",
    margin: "2px 0 4px",
    border: "1px solid rgba(204, 42, 39, 0.45)",
    borderLeft: "5px solid var(--secondary-bg-color)",
    borderRadius: "8px",
    background: "rgba(204, 42, 39, 0.08)",
    color: "#6f1715",
    fontSize: "12px",
    lineHeight: "1.45",
  });

  const button = form.querySelector(".formButton");
  form.insertBefore(container, button || null);
  return container;
}

function clearFormFieldErrorStates() {
  ["amountOfDetectors", "EWL"].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.removeAttribute("aria-invalid");
    input.style.borderColor = "";
    input.style.boxShadow = "";
  });
}

function markFormFieldAsInvalid(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  input.setAttribute("aria-invalid", "true");
  input.style.borderColor = "var(--secondary-bg-color)";
  input.style.boxShadow = "0 0 0 2px rgba(204, 42, 39, 0.12)";
}

function setFormValidationErrors(errors = []) {
  const container = getFormValidationContainer();
  if (!container) return;

  clearFormFieldErrorStates();
  container.replaceChildren();

  if (!errors.length) {
    container.hidden = true;
    return;
  }

  const title = document.createElement("strong");
  title.textContent = lang === "en" ? "Please correct the configuration:" : "Popraw konfigurację:";

  const list = document.createElement("ul");
  Object.assign(list.style, {
    margin: "8px 0 0",
    paddingLeft: "18px",
  });

  errors.forEach((error) => {
    const item = document.createElement("li");
    item.textContent = getLocalizedErrorMessage(error);
    list.appendChild(item);
    if (error.field) markFormFieldAsInvalid(error.field);
  });

  container.appendChild(title);
  container.appendChild(list);
  container.hidden = false;
}

function getIntegerInputValue(id) {
  const input = document.getElementById(id);
  const value = Number.parseInt(input?.value, 10);
  return Number.isFinite(value) ? value : NaN;
}

function validateInitialFormInputLimits() {
  const amount = getIntegerInputValue("amountOfDetectors");
  const ewl = getIntegerInputValue("EWL");
  const errors = [];

  if (!Number.isFinite(amount) || amount < 1) {
    errors.push({
      code: "INVALID_DEVICE_AMOUNT",
      field: "amountOfDetectors",
      message: getInputLimitMessage("INVALID_DEVICE_AMOUNT"),
    });
  } else if (amount > SYSTEM_INPUT_LIMITS.maxDevices) {
    errors.push({
      code: "TOO_MANY_DEVICES",
      field: "amountOfDetectors",
      message: getInputLimitMessage("TOO_MANY_DEVICES", { maxDevices: SYSTEM_INPUT_LIMITS.maxDevices }),
    });
  }

  if (!Number.isFinite(ewl) || ewl < 1) {
    errors.push({
      code: "INVALID_WIRE_LENGTH",
      field: "EWL",
      message: getInputLimitMessage("INVALID_WIRE_LENGTH"),
    });
  }

  if (Number.isFinite(amount) && amount >= 1 && Number.isFinite(ewl) && ewl >= 1) {
    const total = amount * ewl;
    if (total > SYSTEM_INPUT_LIMITS.maxTotalBusLengthM) {
      errors.push({
        code: "BUS_TOO_LONG",
        field: "EWL",
        message: getInputLimitMessage("BUS_TOO_LONG", {
          total,
          amount,
          ewl,
          maxTotal: SYSTEM_INPUT_LIMITS.maxTotalBusLengthM,
        }),
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    amount,
    ewl,
    totalBusLength: Number.isFinite(amount) && Number.isFinite(ewl) ? amount * ewl : NaN,
  };
}

function setupInitialFormValidationListeners() {
  const form = document.querySelector(".form");
  if (!form) return;

  form.noValidate = true;

  if (form.dataset.validationListenersBound === "true") return;
  form.dataset.validationListenersBound = "true";

  ["amountOfDetectors", "EWL"].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", () => {
      const container = document.querySelector(".formValidationErrors");
      if (!container || container.hidden) return;

      const validation = validateInitialFormInputLimits();
      setFormValidationErrors(validation.errors);
    });
  });
}

function setInputDefaultData() {
  const amountInput = document.getElementById("amountOfDetectors");
  const ewlInput = document.getElementById("EWL");
  if (amountInput) {
    amountInput.max = String(SYSTEM_INPUT_LIMITS.maxDevices);
    amountInput.min = "1";
    amountInput.value = initSystem.amountOfDetectors;
  }
  if (ewlInput) {
    ewlInput.max = String(SYSTEM_INPUT_LIMITS.maxTotalBusLengthM);
    ewlInput.min = "1";
    ewlInput.value = initSystem.EWL;
  }
}

function syncInitSystemFromFormValues() {
  const structureSelect = document.getElementById("structureType");
  const gasSelect = document.getElementById("gasDetected");
  const backupSelect = document.getElementById("batteryBackUp");
  const thRailingSelect = document.getElementById("thRailing");
  const amountInput = document.getElementById("amountOfDetectors");
  const ewlInput = document.getElementById("EWL");

  let selectedStructure = initSystem.selectedStructure || null;

  if (typeof STRUCTURE_TYPES !== "undefined" && Array.isArray(STRUCTURE_TYPES) && STRUCTURE_TYPES.length > 0) {
    selectedStructure = STRUCTURE_TYPES.find((structure) => structure.type?.[lang] === structureSelect?.value)
      || selectedStructure
      || STRUCTURE_TYPES[0];
  }

  initSystem.selectedStructure = selectedStructure;
  systemData.selectedStructure = selectedStructure;

  const selectedGasOption = gasSelect?.selectedOptions?.[0] || gasSelect?.options?.[0] || null;
  const selectedDetector = selectedGasOption?.dataset?.devicename
    ? getFirstDetector(selectedStructure, selectedGasOption.dataset.devicename)
    : null;

  initSystem.detector = selectedDetector
    || initSystem.detector
    || selectedStructure?.devices?.find((device) => device.class === "detector")
    || null;

  initSystem.backup = backupSelect?.value || initSystem.backup || TRANSLATION.batteryBackUpNo?.[lang] || "Nie";
  initSystem.thRailing = thRailingSelect?.value || initSystem.thRailing || TRANSLATION.batteryBackUpYes?.[lang] || "Tak";
  initSystem.amountOfDetectors = normalizePositiveInteger(amountInput?.value, initSystem.amountOfDetectors || 1, 1, SYSTEM_INPUT_LIMITS.maxDevices);
  initSystem.EWL = normalizePositiveInteger(ewlInput?.value, initSystem.EWL || 15, 1, SYSTEM_INPUT_LIMITS.maxTotalBusLengthM);

  if (amountInput) amountInput.value = initSystem.amountOfDetectors;
  if (ewlInput) ewlInput.value = initSystem.EWL;

  systemData.batteryBackUp = initSystem.backup;
  systemData.thRailing = initSystem.thRailing;
  systemData.selectedStructure = initSystem.selectedStructure;

  return {
    selectedStructure: initSystem.selectedStructure,
    detector: initSystem.detector,
    backup: initSystem.backup,
    thRailing: initSystem.thRailing,
    amountOfDetectors: initSystem.amountOfDetectors,
    EWL: initSystem.EWL,
  };
}


function getReturnToSystemButtonText() {
  return lang === "en" ? "Back to system" : "Powrót do systemu";
}

function getReturnToSystemUnavailableMessage() {
  return lang === "en"
    ? "No system found. Please generate the system again."
    : "Brak systemu, proszę wygenerować system na nowo.";
}

function returnToGeneratedSystem() {
  if (Array.isArray(systemData?.bus) && systemData.bus.length > 1) {
    transitionToSystemView();
    return;
  }

  alert(getReturnToSystemUnavailableMessage());
}

function setupReturnToSystemButton() {
  const button = document.getElementById("returnToSystemButton");
  if (!button) return;

  button.textContent = getReturnToSystemButtonText();

  if (button.dataset.returnListenerBound === "true") return;
  button.dataset.returnListenerBound = "true";

  button.addEventListener("click", returnToGeneratedSystem);
}

function formInit() {
  createStructureTypesListSelect();
  createDetectedGasListSelect();
  createBatteryBackUpListSelect();
  createThRailingListSelect();
  setInputDefaultData();
  syncInitSystemFromFormValues();
  setupInitialFormValidationListeners();
  setupReturnToSystemButton();
  handleFormSubmit();
}

function normalizePositiveInteger(value, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function transitionToSystemView() {
  const body = document.body;
  const systemSection = document.getElementById("system");
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  body.classList.remove("scroll-locked");

  if (body.classList.contains("system-active")) {
    systemSection?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    return;
  }

  if (prefersReducedMotion) {
    body.classList.add("system-active");
    systemSection?.scrollIntoView({ behavior: "auto", block: "start" });
    return;
  }

  body.classList.add("view-transitioning");

  window.setTimeout(() => {
    body.classList.add("system-active");
    body.classList.remove("view-transitioning");

    requestAnimationFrame(() => {
      systemSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, 150);
}

function handleFormSubmit() {
  const form = document.querySelector(".form");
  if (!form || form.dataset.submitListenerBound === "true") return;

  form.dataset.submitListenerBound = "true";
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (initSystem.systemIsGenerated) {
      if (!window.confirm(TRANSLATION.regenerateSystemMessage[lang])) return;
      const preservedStructure = initSystem.selectedStructure || systemData.selectedStructure || (typeof getDefaultStructure === "function" ? getDefaultStructure() : null);
      systemData = createEmptySystemData({ selectedStructure: preservedStructure });
      initSystem.systemIsGenerated = false;
      initSystem.selectedStructure = preservedStructure;
    }

    const inputValidation = validateInitialFormInputLimits();
    if (!inputValidation.isValid) {
      systemData.errorList = inputValidation.errors.map(({ code, message, field }) => ({ code, message, field }));
      setFormValidationErrors(inputValidation.errors);
      errorHandling();
      return;
    }

    setFormValidationErrors([]);
    syncInitSystemFromFormValues();

    if (!initSystem.detector) {
      systemData.errorList = [{
        code: "NO_DEFAULT_DETECTOR"
      }];
      setFormValidationErrors(systemData.errorList);
      errorHandling();
      return;
    }
    systemData.bus = Array.from({ length: initSystem.amountOfDetectors }, (_, i) => ({
      index: i + 1,
      detector: initSystem.detector,
      wireLength: initSystem.EWL,
      description: "",
      labeling: null,
    }));

    const isValid = validateSystem();
    if (!isValid) return;

    setSystem();
    transitionToSystemView();
  });
}

function isBackupYes(val) {
  const yesTranslated = TRANSLATION.batteryBackUpYes?.[lang];
  return val === yesTranslated || ["TAK", "YES", "TRUE", "1"].includes(String(val).trim().toUpperCase());
}

function isThRailingYes(val) {
  const yesTranslated = TRANSLATION.batteryBackUpYes?.[lang];
  return val === yesTranslated || ["TAK", "YES", "TRUE", "1"].includes(String(val).trim().toUpperCase());
}

function buildEngineSystem(supplyType) {
  return {
    supplyType,
    bus: systemData.bus.map(seg => ({
      cableLen_m: Number(seg.wireLength) || 1,
      deviceType: seg.detector?.type,
    })),
  };
}

function getControlUnitByType(type) {
  if (!Array.isArray(CONTROLUNITLIST)) return null;
  return CONTROLUNITLIST.find(cu => cu.type === type) || null;
}

function getPowerSupplyList(backupNeeded) {
  if (backupNeeded) return Array.isArray(powersupplyMC) ? powersupplyMC : [];
  return Array.isArray(powersupplyTMC1) ? powersupplyTMC1 : [];
}

function getNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getPowerSupplySortValue(powerSupply) {
  return {
    price: getNumber(powerSupply?.price, Number.MAX_SAFE_INTEGER),
    power: getNumber(powerSupply?.power, Number.MAX_SAFE_INTEGER),
    capacity: getNumber(powerSupply?.batteryCapacity_Ah, 0),
  };
}

function comparePowerSupplies(a, b) {
  const aValue = getPowerSupplySortValue(a);
  const bValue = getPowerSupplySortValue(b);

  // Dobór zasilacza ma być najpierw inżynierski: najmniejsza moc spełniająca wymagania,
  // a dopiero później cena. Dzięki temu np. mały system nie wybierze 100 W tylko dlatego,
  // że w cenniku 100 W jest tańszy niż 60 W.
  return (aValue.power - bValue.power)
    || (aValue.price - bValue.price)
    || (aValue.capacity - bValue.capacity)
    || String(a?.description || "").localeCompare(String(b?.description || ""));
}

function getTotalBusLength() {
  return (systemData.bus || []).reduce((sum, segment) => sum + (Number(segment.wireLength) || 0), 0);
}

function getCableByType(type) {
  if (!Array.isArray(Cables)) return null;
  return Cables.find(cable => cable.type === type) || null;
}

function getCablePricePerMeter(type) {
  const cable = getCableByType(type);
  return getNumber(cable?.pricePerM, 0);
}

function getCablePriority(type) {
  const cable = getCableByType(type);
  return getNumber(cable?.priority, Number.MAX_SAFE_INTEGER);
}

function getConfigEstimatedCost(config) {
  const value = Number(config?.optimization?.totalEstimatedCost ?? config?.totalEstimatedCost);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function hasEnoughPower(powerSource, minPower) {
  return getNumber(powerSource?.power, 0) >= getNumber(minPower, 0);
}

function hasEnoughVoltage(powerSource, requiredVoltage) {
  const sourceVoltage = getNumber(powerSource?.supplyVoltage, NaN);
  const required = getNumber(requiredVoltage, NaN);

  if (!Number.isFinite(sourceVoltage) || !Number.isFinite(required)) return true;
  return sourceVoltage + 0.001 >= required;
}

function findSmallestPowerSupply(list, minPower, requiredVoltage, options = {}) {
  const { requireVoltageMatch = true, minSupplyVoltage = null } = options;
  if (!Array.isArray(list)) return null;

  return [...list]
    .filter(psu => hasEnoughPower(psu, minPower))
    .filter(psu => minSupplyVoltage == null || getNumber(psu?.supplyVoltage, 0) + 0.001 >= getNumber(minSupplyVoltage, 0))
    .filter(psu => !requireVoltageMatch || hasEnoughVoltage(psu, requiredVoltage))
    .sort(comparePowerSupplies)[0] || null;
}

function makePowerConfig({
  mode,
  label,
  controlUnit,
  powerSupply = null,
  powerSupplyListName = null,
  analysis,
  priority,
}) {
  const powerSourcePower = powerSupply
    ? getNumber(powerSupply.power, 0)
    : getNumber(controlUnit?.description?.power, 0);

  const cableType = analysis.engineSystem.bus[0]?.cableType || "2 x 1 mm2";
  const busLength = getTotalBusLength();
  const cablePricePerMeter = getCablePricePerMeter(cableType);
  const cableCost = busLength * cablePricePerMeter;
  const controlUnitCost = getNumber(controlUnit?.price, 0);
  const powerSupplyCost = getNumber(powerSupply?.price, 0);
  const totalEstimatedCost = controlUnitCost + powerSupplyCost + cableCost;

  return {
    mode,
    label,
    controlUnit,
    powerSupply,
    powerSupplyListName,
    analysisType: analysis.type,
    analysisPriority: analysis.analysisPriority,
    engineSystem: analysis.engineSystem,
    result: analysis.result,
    systemPowerNoReserve: analysis.pwrNoReserve,
    systemPowerWithReserve: analysis.pwrWithReserve,
    requiredSupplyVoltage: analysis.result.requiredSupplyVoltage_V,
    currentConsumption: analysis.result.currentConsumption_A,
    cable: {
      type: cableType,
      pricePerM: cablePricePerMeter,
      priority: getCablePriority(cableType),
    },
    priority,
    powerSourcePower,
    optimization: {
      strategy: "smallest-sufficient-power-then-lowest-cost",
      totalEstimatedCost,
      controlUnitCost,
      powerSupplyCost,
      cableCost,
      cablePricePerMeter,
      busLength,
    },
  };
}

function addDirectControlUnitConfig(configs, type, analysis, priority) {
  const controlUnit = getControlUnitByType(type);
  if (!controlUnit) return;

  const unitPower = getNumber(controlUnit.description?.power, 0);
  const unitVoltage = getNumber(controlUnit.description?.supplyVoltage, 0);
  const requiredVoltage = getNumber(analysis.result.requiredSupplyVoltage_V, 0);

  if (unitPower < analysis.pwrWithReserve) return;
  if (unitVoltage + 0.001 < requiredVoltage) return;

  configs.push(makePowerConfig({
    mode: "integrated-control-unit",
    label: controlUnit.type,
    controlUnit,
    analysis,
    priority,
  }));
}

function addExternalPowerSupplyConfig(configs, controlUnitType, powerSupplyList, powerSupplyListName, analysis, priority, options = {}) {
  const controlUnit = getControlUnitByType(controlUnitType);
  if (!controlUnit) return;

  const powerSupply = findSmallestPowerSupply(
    powerSupplyList,
    analysis.pwrWithReserve,
    analysis.result.requiredSupplyVoltage_V,
    options
  );

  if (!powerSupply) return;

  configs.push(makePowerConfig({
    mode: "control-unit-with-external-power-supply",
    label: `${controlUnit.type} + ${powerSupply.description}`,
    controlUnit,
    powerSupply,
    powerSupplyListName,
    analysis,
    priority,
  }));
}

function buildPowerConfigurationsForAnalysis(analysis, backupNeeded, thRailingNeeded) {
  const configs = [];
  const hdrList = getPowerSupplyList(false);
  const zbfList = getPowerSupplyList(true);

  // TH35 = wybieramy wyłącznie Teta MOD Control 1.
  // Dla braku podtrzymania dobieramy zasilacz HDR, dla podtrzymania akumulatorowego dobieramy ZBF.
  if (thRailingNeeded) {
    if (!backupNeeded && analysis.type === "48V / 48V + UPS") {
      // HDR-y w batteryList mają pole supplyVoltage ustawione na wartość roboczą/minimalną,
      // a analysisEngine waliduje wariant jako magistralę 48 V. Dla Teta MOD Control 1 + HDR
      // nie odrzucamy więc konfiguracji po samym supplyVoltage z obiektu zasilacza.
      addExternalPowerSupplyConfig(configs, "Teta MOD Control 1", hdrList, "powersupplyTMC1", analysis, 5, {
        requireVoltageMatch: false,
      });
    }

    if (backupNeeded && analysis.type === "24V + UPS") {
      addExternalPowerSupplyConfig(configs, "Teta MOD Control 1", zbfList, "powersupplyMC", analysis, 5, {
        requireVoltageMatch: true,
      });
    }

    if (backupNeeded && analysis.type === "48V / 48V + UPS") {
      // Dla konfiguracji na szynę TH35 nie zatrzymujemy się wyłącznie na wariancie 24V + UPS.
      // Jeżeli magistrala przechodzi dopiero jako 48V, najpierw próbujemy Teta MOD Control 1 + ZBF.
      // ZBF jest filtrowany do wariantów 24V, żeby nie wybrać zasilacza 12V.
      addExternalPowerSupplyConfig(configs, "Teta MOD Control 1", zbfList, "powersupplyMC", analysis, 5, {
        requireVoltageMatch: false,
        minSupplyVoltage: 21,
      });

      // Jeżeli system wymaga więcej mocy niż największy ZBF z listy (140 W), poprzedni filtr
      // zwracał pustą listę i aplikacja pokazywała błąd mimo tego, że w CONTROLUNITLIST istnieje
      // jednostka 48 V / 300 W z UPS. Traktujemy ją jako bezpieczny fallback zasilający system.
      addDirectControlUnitConfig(configs, "Teta Control 1-S-UP300W", analysis, 50);
    }

    return configs.sort(comparePowerConfigurations);
  }

  // Bez montażu na TH35 nie proponujemy Teta MOD Control 1, bo jest to moduł na szynę TH35.
  if (!backupNeeded) {
    if (analysis.type === "24V") {
      addDirectControlUnitConfig(configs, "Teta Control 1-S24-60W", analysis, 10);
    }

    if (analysis.type === "48V / 48V + UPS") {
      addDirectControlUnitConfig(configs, "Teta Control 1-S48-60W", analysis, 10);
      addDirectControlUnitConfig(configs, "Teta Control 1-S48-100W", analysis, 10);
      addDirectControlUnitConfig(configs, "Teta Control 1-S48-150W", analysis, 10);
    }
  } else {
    if (analysis.type === "24V + UPS") {
      addExternalPowerSupplyConfig(configs, "Teta Control 1-S", zbfList, "powersupplyMC", analysis, 10, {
        requireVoltageMatch: true,
      });
    }

    if (analysis.type === "48V / 48V + UPS") {
      // Teta Control 1-S-UP300W ma własny zasilacz magistrali 48 V / 300 W, więc może zasilić
      // systemy, dla których zewnętrzne ZBF-y 140 W są za małe. Dodajemy ją bezpośrednio jako
      // konfigurację podstawową dla układów wymagających UPS.
      addDirectControlUnitConfig(configs, "Teta Control 1-S-UP300W", analysis, 25);

      // Zachowujemy starszą ścieżkę z ZBF jako dodatkową alternatywę dla mniejszych systemów.
      // Dla tej konfiguracji nie porównujemy napięcia ZBF z napięciem magistrali 48 V.
      addExternalPowerSupplyConfig(configs, "Teta Control 1-S-UP300W", zbfList, "powersupplyMC", analysis, 30, {
        requireVoltageMatch: false,
      });
    }
  }

  return configs.sort(comparePowerConfigurations);
}

function getConfigCableCost(config) {
  const value = Number(config?.optimization?.cableCost);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function getConfigVoltage(config) {
  const value = Number(config?.controlUnit?.description?.supplyVoltage);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function comparePowerConfigurations(a, b) {
  // Definicja „najlepszego zestawu”:
  // 1) najmniejsza wystarczająca moc źródła zasilania,
  // 2) najniższy koszt całkowity zestawu: jednostka + zasilacz + kabel,
  // 3) najniższy koszt samego kabla,
  // 4) priorytet kabla z models.js,
  // 5) niższe napięcie, jeżeli poprzednie kryteria są równe,
  // 6) stabilny tie-breaker po nazwie jednostki.
  return (getNumber(a.powerSourcePower, 0) - getNumber(b.powerSourcePower, 0))
    || (getConfigEstimatedCost(a) - getConfigEstimatedCost(b))
    || (getConfigCableCost(a) - getConfigCableCost(b))
    || (getCablePriority(a.cable?.type) - getCablePriority(b.cable?.type))
    || (getConfigVoltage(a) - getConfigVoltage(b))
    || ((a.analysisPriority ?? Number.MAX_SAFE_INTEGER) - (b.analysisPriority ?? Number.MAX_SAFE_INTEGER))
    || (a.priority - b.priority)
    || comparePowerSupplies(a.powerSupply, b.powerSupply)
    || String(a.controlUnit?.type || "").localeCompare(String(b.controlUnit?.type || ""));
}

function toSerializablePowerConfig(config) {
  return {
    mode: config.mode,
    label: config.label,
    controlUnit: config.controlUnit,
    powerSupply: config.powerSupply ? {
      supply: config.powerSupply,
      listName: config.powerSupplyListName,
    } : null,
    analysisType: config.analysisType,
    systemPowerNoReserve: config.systemPowerNoReserve,
    systemPowerWithReserve: config.systemPowerWithReserve,
    requiredSupplyVoltage: config.requiredSupplyVoltage,
    currentConsumption: config.currentConsumption,
    cable: config.cable,
    priority: config.priority,
    powerSourcePower: config.powerSourcePower,
    optimization: config.optimization,
  };
}


function analyseSystemForConfigurator(engineSystem) {
  // Nie modyfikujemy analysisEngine.js. Ta funkcja używa jego niższych funkcji obliczeniowych,
  // ale limity biznesowe (>50 urządzeń, >28 sygnalizatorów, >8 zaworów, >1000 m) obsługujemy w GUI.
  // Dzięki temu nie dziedziczymy starego limitu 26 sygnalizatorów z analiseSystem().
  if (!engineSystem?.bus?.length) return null;
  if (typeof getObjByType !== "function" || typeof getBusEleStatus !== "function") return null;

  const supply = getObjByType(PowerSupplies, engineSystem.supplyType);
  const lastSection = engineSystem.bus[engineSystem.bus.length - 1];
  const lastDevice = getObjByType(Devices, lastSection?.deviceType);

  if (!supply || !lastDevice) return null;

  const supplyVoltage_V = Number(supply.supplyVoltage_V);
  const voltageStep_V = 0.1;
  let busEndVoltage_V = Number(lastDevice.minVoltage_V);
  let busStat = null;
  let result = null;

  if (!Number.isFinite(supplyVoltage_V) || !Number.isFinite(busEndVoltage_V)) return null;
  if (busEndVoltage_V < supplyVoltage_V / 2) busEndVoltage_V = supplyVoltage_V / 2;

  const firstStepBusEndVoltage_V = busEndVoltage_V;

  do {
    busStat = getBusEleStatus(engineSystem.bus, busEndVoltage_V);
    if (busStat != null && busStat.requiredSupplyVoltage_V > supplyVoltage_V) break;
    busEndVoltage_V += voltageStep_V;
  } while (busEndVoltage_V < supplyVoltage_V);

  if (busStat != null) {
    busEndVoltage_V -= voltageStep_V;
    if (busEndVoltage_V > firstStepBusEndVoltage_V) {
      result = getBusEleStatus(engineSystem.bus, busEndVoltage_V);
    }
  }

  return result;
}

function matchSystemCablesForConfigurator(engineSystem) {
  if (!engineSystem?.bus?.length || !Array.isArray(Cables)) return engineSystem;

  const cables = JSON.parse(JSON.stringify(Cables)).sort((a, b) => {
    return Number(b.resistivity_OhmPerMeter) - Number(a.resistivity_OhmPerMeter);
  });

  for (let cableIndex = 0; cableIndex < cables.length; cableIndex++) {
    for (let segmentIndex = 0; segmentIndex < engineSystem.bus.length; segmentIndex++) {
      engineSystem.bus[segmentIndex].cableType = cables[cableIndex].type;
    }

    if (analyseSystemForConfigurator(engineSystem) != null) break;
  }

  return engineSystem;
}

function countBusDevicesByClass(deviceClass) {
  if (!Array.isArray(systemData.bus)) return 0;
  return systemData.bus.reduce((total, segment) => {
    return total + (segment.detector?.class === deviceClass ? 1 : 0);
  }, 0);
}

function getSystemStatusLimitErrors() {
  const errors = [];
  const devicesCount = Array.isArray(systemData.bus) ? systemData.bus.length : 0;
  const signallersCount = countBusDevicesByClass("signaller");
  const valveCtrlsCount = countBusDevicesByClass("valveCtrl");
  const totalBusLength = getTotalBusLength();

  if (devicesCount > SYSTEM_INPUT_LIMITS.maxDevices) {
    errors.push({
      code: "TOO_MANY_DEVICES",
      message: getInputLimitMessage("TOO_MANY_DEVICES", {
        maxDevices: SYSTEM_INPUT_LIMITS.maxDevices,
        current: devicesCount,
      }),
    });
  }

  if (signallersCount > SYSTEM_INPUT_LIMITS.maxSignallers) {
    errors.push({
      code: "TOO_MANY_SIGNALLERS",
      message: getInputLimitMessage("TOO_MANY_SIGNALLERS", {
        maxSignallers: SYSTEM_INPUT_LIMITS.maxSignallers,
        current: signallersCount,
      }),
    });
  }

  if (valveCtrlsCount > SYSTEM_INPUT_LIMITS.maxValveCtrls) {
    errors.push({
      code: "TOO_MANY_VALVE_CTRLS",
      message: getInputLimitMessage("TOO_MANY_VALVE_CTRLS", {
        maxValveCtrls: SYSTEM_INPUT_LIMITS.maxValveCtrls,
        current: valveCtrlsCount,
      }),
    });
  }

  if (totalBusLength > SYSTEM_INPUT_LIMITS.maxTotalBusLengthM) {
    errors.push({
      code: "BUS_TOO_LONG",
      message: getInputLimitMessage("BUS_TOO_LONG", {
        total: totalBusLength,
        amount: devicesCount,
        ewl: devicesCount ? Math.round(totalBusLength / devicesCount) : 0,
        maxTotal: SYSTEM_INPUT_LIMITS.maxTotalBusLengthM,
      }),
    });
  }

  return errors;
}

function validateSystem() {
  if (!Array.isArray(systemData.bus) || systemData.bus.length === 0) {
    systemData.errorList = [{ code: "EMPTY_BUS" }];
    errorHandling();
    return false;
  }

  const limitErrors = getSystemStatusLimitErrors();
  const hasInvalidSegment = systemData.bus.some(seg => !seg.detector?.type || !Number.isFinite(Number(seg.wireLength)) || Number(seg.wireLength) <= 0);

  if (hasInvalidSegment) {
    limitErrors.push({
      code: "INVALID_SEGMENT",
    });
  }

  if (limitErrors.length > 0) {
    systemData.errorList = limitErrors;
    errorHandling();
    return false;
  }

  const backupNeeded = isBackupYes(initSystem.backup || systemData.batteryBackUp);
  const thRailingNeeded = isThRailingYes(initSystem.thRailing || systemData.thRailing);
  const supplyCandidates = backupNeeded ? ["24V + UPS", "48V / 48V + UPS"] : ["24V", "48V / 48V + UPS"];
  const possibleConfigs = [];

  supplyCandidates.forEach((type, analysisPriority) => {
    const engineSystem = buildEngineSystem(type);
    matchSystemCablesForConfigurator(engineSystem);

    const result = analyseSystemForConfigurator(engineSystem);
    if (!result || result.status === "error") return;

    const pwrNoReserve = Number(result.powerConsumption_W) || 0;
    const pwrWithReserve = Math.ceil(pwrNoReserve * 1.10);
    const voltageForCU = (type.includes("24V") || Number(result.supplyVoltage_V) < 30) ? 24 : 48;

    const analysis = {
      result,
      engineSystem,
      type,
      pwrNoReserve,
      pwrWithReserve,
      voltageForCU,
      analysisPriority,
    };

    buildPowerConfigurationsForAnalysis(analysis, backupNeeded, thRailingNeeded)
      .forEach(config => {
        config.analysisPriority = analysisPriority;
        possibleConfigs.push(config);
      });
  });

  possibleConfigs.sort(comparePowerConfigurations);
  const chosenConfig = possibleConfigs[0] || null;

  if (!chosenConfig) {
    // Nie zostawiamy starego wyniku z poprzedniej poprawnej analizy, bo po zmianie urządzeń
    // panel statusu mógł pokazywać nieaktualną konfigurację razem z nowym błędem.
    systemData.res = null;
    systemData.generatedSupply = null;
    systemData.errorList = [{
      code: getNoValidPowerConfigCode(backupNeeded, thRailingNeeded)
    }];
    errorHandling();
    if (!document.body.classList.contains("system-active")) {
      setFormValidationErrors(systemData.errorList);
    }
    return false;
  }

  systemData.supplyType = chosenConfig.controlUnit;
  systemData.totalPower = Math.round(chosenConfig.systemPowerNoReserve);
  systemData.wireType = chosenConfig.cable.type || "2 x 1 mm2";
  systemData.generatedSupply = chosenConfig.powerSupply
    ? chosenConfig.powerSupply.description
    : (chosenConfig.controlUnit.description?.power ? `${chosenConfig.controlUnit.description.power}W` : null);
  systemData.selectedStructure = initSystem.selectedStructure || systemData.selectedStructure;
  systemData.batteryBackUp = initSystem.backup || systemData.batteryBackUp;
  systemData.thRailing = initSystem.thRailing || systemData.thRailing;
  systemData.res = {
    powerSupply: {
      controlUnit: chosenConfig.controlUnit,
      powerSupply: chosenConfig.powerSupply ? {
        supply: chosenConfig.powerSupply,
        listName: chosenConfig.powerSupplyListName,
      } : null,
      psu: chosenConfig.powerSupply || null,
      mode: chosenConfig.mode,
      label: chosenConfig.label,
      systemPowerNoReserve: chosenConfig.systemPowerNoReserve,
      systemPowerWithReserve: chosenConfig.systemPowerWithReserve,
      cable: chosenConfig.cable,
      analysisType: chosenConfig.analysisType,
      requiredSupplyVoltage: chosenConfig.requiredSupplyVoltage,
      currentConsumption: chosenConfig.currentConsumption,
      powerSourcePower: chosenConfig.powerSourcePower,
      optimization: chosenConfig.optimization,
      backupRequested: backupNeeded,
      thRailingRequested: thRailingNeeded,
    },
    possibleConfigs: possibleConfigs.map(toSerializablePowerConfig),
  };

  systemData.errorList = [];
  initSystem.systemIsGenerated = true;
  setFormValidationErrors([]);
  errorHandling();
  return true;
}

function findBestControlUnit(list, voltage, minPower, needsUPS) {
  if (!Array.isArray(list)) return null;

  return [...list]
    .filter(cu =>
      Number(cu.description?.supplyVoltage) === Number(voltage) &&
      Number(cu.description?.power) >= Number(minPower) &&
      (!needsUPS || String(cu.possibleUPS).toLowerCase() === "yes")
    )
    .sort((a, b) => Number(a.description?.power) - Number(b.description?.power))[0] || null;
}

function errorHandling() {
  const errorContainer = document.querySelector(`.errors`);
  const errorList = document.querySelector(`.errorList`);
  if (!errorList) return;

  errorList.innerHTML = "";

  const uniqueErrors = [];
  const seen = new Set();
  (systemData.errorList || []).forEach(error => {
    const key = error.code || getLocalizedErrorMessage(error);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueErrors.push(error);
    }
  });
  systemData.errorList = uniqueErrors;

  systemData.errorList.forEach(error => {
    const item = document.createElement(`li`);
    if (error.code) item.id = error.code;
    item.innerText = getLocalizedErrorMessage(error);
    errorList.appendChild(item);
  });

  if (errorContainer) {
    errorContainer.classList.toggle("errorActive", systemData.errorList.length > 0);
  }

  if (!document.body.classList.contains("system-active")) {
    setFormValidationErrors(systemData.errorList || []);
  }
}
