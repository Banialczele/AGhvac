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

/* =============================================================================
   DODANE: helpery do integracji z analysisEngine.js (PowerSupplies + ExampleSystem2)
   + dobór CONTROLUNITLIST po napięciu / UPS / mocy
============================================================================= */

// backup z selecta: bywa "TAK"/"NIE" albo tekst tłumaczenia
function isBackupYes(val) {
  const s = String(val ?? "").trim().toUpperCase();
  if (s === "TAK" || s === "YES" || s === "TRUE" || s === "1") return true;
  // wsparcie dla Twojego obecnego selecta (wartość = TRANSLATION.*)
  if (typeof TRANSLATION !== "undefined" && TRANSLATION.batteryBackUpYes && TRANSLATION.batteryBackUpYes[lang]) {
    return String(val) === String(TRANSLATION.batteryBackUpYes[lang]);
  }
  return false;
}

function buildEngineSystemFromUI(systemData, forcedSupplyTypeStr) {
  const defaultCableType = (Array.isArray(Cables) && Cables[0]) ? Cables[0].type : null;

  return {
    supplyType: forcedSupplyTypeStr, // string zgodny z PowerSupplies[*].type
    bus: (systemData.bus || []).map(seg => ({
      cableType: seg.cableType ?? defaultCableType,
      cableLen_m: Number(seg.cableLen_m ?? seg.wireLength ?? 0),
      deviceType: seg.deviceType ?? seg.detector?.type ?? null,
    })),
  };
}

// test: czy system przechodzi dla danego PowerSupplies.type
function testSystemForPowerSupplyType(systemData, supplyTypeStr) {
  const engineSystem = buildEngineSystemFromUI(systemData, supplyTypeStr);

  // dobór kabla
  matchSystemCables(engineSystem);

  // analiza
  const res = analiseSystem(engineSystem);

  // błędy
  const errors = (typeof getErrorDescription === "function") ? (getErrorDescription() || []) : [];

  return { ok: res != null, engineSystem, res, errors };
}

function getPowerSupplyObjByType(typeStr) {
  return (Array.isArray(PowerSupplies) ? PowerSupplies : []).find(ps => ps && ps.type === typeStr) || null;
}

// wybór CU po napięciu / mocy / UPS
function findBestControlUnit(controlUnits, wantedVoltage_V, requiredPower_W, backupYes) {
  const list = Array.isArray(controlUnits) ? controlUnits : [];
  const req = Number(requiredPower_W || 0);

  // filtr po napięciu
  let candidates = list.filter(cu => Number(cu?.description?.supplyVoltage) === Number(wantedVoltage_V));
  if (!candidates.length) return null;

  // preferencja UPS
  if (backupYes) {
    const ups = candidates.filter(cu => String(cu?.possibleUPS).toLowerCase() === "yes");
    if (ups.length) candidates = ups;
  }

  // podział po mocy
  const withPower = candidates.filter(cu => Number(cu?.description?.power || 0) > 0);
  const powerZero = candidates.filter(cu => Number(cu?.description?.power || 0) === 0);

  // jeśli req <= 0: wybierz "najmniejszą" sensowną mocą albo pierwszą
  if (req <= 0) {
    if (withPower.length) {
      return withPower.sort((a, b) => Number(a.description.power) - Number(b.description.power))[0];
    }
    return candidates[0];
  }

  // najpierw szukamy spełniających moc
  const enough = withPower.filter(cu => Number(cu.description.power) >= req);
  if (enough.length) {
    return enough.sort((a, b) => Number(a.description.power) - Number(b.description.power))[0];
  }

  // jeśli brak takich, ale są power==0 (traktujemy jako fallback "nieznane/bezlimit")
  if (powerZero.length) return powerZero[0];

  // ostatecznie największa moc z dostępnych
  if (withPower.length) {
    return withPower.sort((a, b) => Number(b.description.power) - Number(a.description.power))[0];
  }

  return candidates[0];
}

/* =============================================================================
   PODMIENIONE: validateSystem() — wymagania:
   - dobór 24V vs 48V wg analizy silnika
   - UPS: test 24V+UPS (21V) gdy backup TAK, ale CU 24V
   - dobór CU po napięciu i mocy + 15% zapasu
============================================================================= */

function validateSystem() {
  const backupYes = isBackupYes(initSystem.backup);

  // kolejność prób
  const supplyCandidates = backupYes
    ? ["24V + UPS", "48V / 48V + UPS"]
    : ["24V", "48V / 48V + UPS"];

  let chosen = null;

  for (const supplyTypeStr of supplyCandidates) {
    const t = testSystemForPowerSupplyType(systemData, supplyTypeStr);
    if (t.ok) {
      chosen = t; // zawiera engineSystem (z dobranym kablem) + res
      break;
    }
  }

  // jeśli nic nie przeszło — weź ostatni wynik dla błędów
  if (!chosen) {
    const lastTry = testSystemForPowerSupplyType(systemData, supplyCandidates[supplyCandidates.length - 1]);
    const engineErrors = lastTry.errors || [];
    systemData.errorList = (engineErrors || []).map(e => ({
      message: e?.[lang] ?? e?.pl ?? e?.en ?? String(e),
    }));

    systemData.res = null;
    systemData.wireType = "-";
    systemData.totalPower = 0;
    systemData.generatedSupply = null;

    initSystem.systemIsGenerated = true;
    errorHandling();
    return;
  }

  // błędy z silnika -> UI
  const engineErrors = chosen.errors || [];
  systemData.errorList = (engineErrors || []).map(e => ({
    message: e?.[lang] ?? e?.pl ?? e?.en ?? String(e),
  }));

  // wynik mocy z silnika (bez zapasu)
  const requiredPower_W = chosen.res?.powerConsumption_W ?? 0;

  // 15% zapasu do doboru jednostki sterującej
  const requiredPowerWithReserve_W = Math.ceil(Number(requiredPower_W) * 1.15);

  // napięcie wg PowerSupplies
  const psObj = getPowerSupplyObjByType(chosen.engineSystem.supplyType);
  const psVoltage = psObj?.supplyVoltage_V ?? null;

  // reguła UPS: 21V => CU 24V
  let wantedControlUnitVoltage = psVoltage;
  if (psVoltage === 21) wantedControlUnitVoltage = 24;

  // dobór CU po napięciu i mocy (z zapasem 15%)
  let controlUnit = findBestControlUnit(
    CONTROLUNITLIST,
    wantedControlUnitVoltage,
    requiredPowerWithReserve_W,
    backupYes
  );

  // fallback: jeśli brak na danym napięciu, spróbuj 48V
  if (!controlUnit) {
    controlUnit = findBestControlUnit(CONTROLUNITLIST, 48, requiredPowerWithReserve_W, backupYes)
      || ((Array.isArray(CONTROLUNITLIST) && CONTROLUNITLIST.length) ? CONTROLUNITLIST[0] : null);
  }

  // jeśli nadal brak — błąd
  if (!controlUnit) {
    systemData.errorList.push({ message: "Brak jednostki sterującej w CONTROLUNITLIST dla wymaganego napięcia/mocy (z zapasem 15%)." });
    systemData.res = null;
    systemData.wireType = "-";
    systemData.totalPower = 0;
    systemData.generatedSupply = null;

    initSystem.systemIsGenerated = true;
    errorHandling();
    return;
  }

  // dobrany kabel (po matchSystemCables już siedzi w chosen.engineSystem.bus)
  const cableType = chosen.engineSystem.bus?.[0]?.cableType ?? null;
  const cableObj = (Array.isArray(Cables) ? Cables : []).find(c => c.type === cableType) || null;

  // zapis do UI (trzymasz supplyType jako obiekt CU — zgodnie z Twoim UI)
  systemData.supplyType = controlUnit;

  // wynik w formacie UI (jak u Ciebie)
  systemData.res = {
    powerSupply: {
      controlUnit: controlUnit,
      cable: cableObj,
      systemPowerNoReserve: requiredPower_W, // czyste X z silnika
      powerSupply: null, // NIE dobieramy osobnych zasilaczy
    },
  };

  systemData.wireType = cableObj?.type ?? "-";

  // totalPower = minimalna moc, jaką CU ma dostarczyć (X + 15%)
  systemData.totalPower = Math.round(requiredPower_W);

  systemData.generatedSupply = null;

  initSystem.systemIsGenerated = true;
  errorHandling();
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
  if (systemData.errorList.length > 0) {
    errorContainer.classList.add("errorActive");
  } else {
    errorContainer.classList.remove("errorActive");
  }
}
