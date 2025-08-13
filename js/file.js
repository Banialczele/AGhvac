function exportToXLSX() {
  const rows = getDataForExcel(); // analogiczne do CSV, tylko bez joinowania
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 35 },
    { wch: 25 },
    { wch: 25 },
    { wch: 30 },
  ]
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "System");

  const fileName = prompt("Nazwa pliku?", `TetaSystem_${setDate()}.xlsx`);
  XLSX.writeFile(workbook, fileName || `TetaSystem_${setDate()}.xlsx`);
}


// Konwersja danych systemu do formatu CSV
function getDataForExcel() {
  const rowsDescription = {
    device: [`${TRANSLATION.fileDeviceType[lang]}`,`${TRANSLATION.fileDeviceName[lang]}`, `${TRANSLATION.filePW[lang]}`,`${TRANSLATION.fileQuantity[lang]}`, `${TRANSLATION.fileToled[lang]}`],
    deviceTotal: ["", "", "", `${TRANSLATION.fileDeviceQuantity[lang]}`],
    accessories: [`${TRANSLATION.fileConnector[lang]}`, `${TRANSLATION.filePW[lang]}`, `${TRANSLATION.fileWireType[lang]}`, `${TRANSLATION.fileWireLength[lang]}`],
    controlUnit: [`${TRANSLATION.fileControlUnit[lang]}`,`${TRANSLATION.fileUPS[lang]}`, `${TRANSLATION.filePW[lang]}`, `${TRANSLATION.fileQuantity[lang]}`],
  };
  const rows = [];

  const reducedDevices = reduceDevicesForFile();
  // dodaj nagłówek urządzeń
  rows.push(rowsDescription.device);

  // dodaj wiersze urządzeń
  insertDeviceTypeData(reducedDevices.detector, `${TRANSLATION.fileDetector[lang]}`, rows);
  insertDeviceTypeData(reducedDevices.signaller, `${TRANSLATION.fileSignaller[lang]}`, rows);
  insertDeviceTypeData(reducedDevices.valveCtrl, `${TRANSLATION.fileValve[lang]}`, rows);

  rows.push([]);
  rows.push([]);

  // dodaj nagłówek i sumę
  rows.push(rowsDescription.deviceTotal);
  insertDeviceTypeData(reducedDevices.tCon, "quantityTotal", rows);
  rows.push([]);

  rows.push(rowsDescription.controlUnit);
  console.log(systemData.supplyType);

  insertDeviceTypeData(systemData.supplyType, `${TRANSLATION.fileCU[lang]}`, rows);
  rows.push([]);

  rows.push(rowsDescription.accessories);
  insertTconInCSV(reducedDevices.tCon, "quantityTotal", rows);
  rows.push([]);

  rows.push([TRANSLATION.modControlFileInfo[lang]]);
  rows.push([`${TRANSLATION.modControlTMC1TH35Info[lang]} ${systemData.minimalSupply.description}`]);
  return rows;
}

function insertTconInCSV(devices, label, row) {
  const busLengthValue = systemData.bus.reduce((acc, device) => acc + device.wireLength, 0);
  row.push([`${devices.TConnector}${TRANSLATION.quantity[lang]}`, `PW-122-S2`, `${systemData.wireType}`, busLengthValue]);
}

function reduceDevicesForFile() {
  const total = systemData.bus.reduce((accumulator, current) => {
    const deviceClassSignaller = `signaller`;
    accumulator[deviceClassSignaller] ??= {};
    accumulator.tCon ??= {};
    accumulator.tCon.TConnector = (accumulator.tCon.TConnector || 0) + 1;
    const { class: detectorClass, type } = current.detector;

    if (detectorClass === "signaller" && type === "TOLED") {
      accumulator[deviceClassSignaller][type] ??= [];
      const toledArray = accumulator[deviceClassSignaller][type];

      // Szukamy w tablicy, czy taki opis już istnieje
      let found = toledArray.find(
        item => item.description === current.description
      );

      if (found) {
        found.quantity++;
      } else {
        toledArray.push({
          ...current.detector,
          description: current.description,
          quantity: 1,
        });
      }
    } else {
      // Pozostałe typy: po staremu, możesz je zgrupować wg własnych reguł
      const bucket = accumulator[detectorClass] ??= {};
      let entry = bucket[type];
      if (!entry) {
        entry = bucket[type] = {
          ...current.detector,
          quantity: 1,
        };
      } else {
        entry.quantity++;
      }
    }

    return accumulator;
  }, {});
  return total;
}

function CUUPS() {
  return document.querySelector(`#modControlBatteryBackUp`).value
}


// Wstawienie wierszy z danymi dot. użytych w systemie typów urządzeńs
function insertDeviceTypeData(devices, label, store) {
  if (devices) {
    if (label === `Jednostka sterująca` || label === `Control Unit`) {
      store.push([devices.type, CUUPS(), devices.productKey, `1${TRANSLATION.quantity[lang]}`]);
    } else if (label === `quantityTotal`) {
      store.push(["", "", "", `${devices.TConnector}${TRANSLATION.quantity[lang]}`]);
    } else {
      for (let [key, value] of Object.entries(devices)) {
        if (key === `Teta EcoWent+MiniDet`) {
          store.push([label, key, `${value.productKey.CO}, ${value.productKey.LPG}`, `${value.quantity}${TRANSLATION.quantity[lang]}`]);
        } else if (key === `TOLED`) {
          value.forEach(elem => {
            store.push([label, key, elem.productKey, `${elem.quantity}${TRANSLATION.quantity[lang]}`, elem.description]);
          })
        } else {
          store.push([label, key, value.productKey, `${value.quantity}${TRANSLATION.quantity[lang]}`]);
        }
      }
    }
  }
}

// Wyeksportowanie danych systemu do pliku JSON
function exportToJSON() {
  const stringData = JSON.stringify(systemData);
  const blob = new Blob([stringData], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  downloadFile(url, "json");
}

// Rząd identyfikator

// Wstawienie wierszy z danymi dot. kabli użytych w systemie
function insertDeviceTypeWireLengthData(deviceType, deviceTypeLabel, store) {
  const wireLength = systemData.bus.reduce((accumulator, device) => {
    if (device.type === deviceType) {
      return (accumulator += device.wireLength);
    } else {
      return accumulator;
    }
  }, 0);
  store.push(["Kabel", deviceTypeLabel, `${wireLength} m`]);
}

// Ustawienie parametrów pliku i pobranie go przez użytkownika
function downloadFile(url, fileType) {
  const defaultFileName = `TetaSystem_${setDate()}`;
  const fileName = prompt("Nazwa pliku?", defaultFileName);
  const anchor = document.createElement("a");
  anchor.style = "display: none";
  if (!fileName) {
    setAttributes(anchor, {
      href: url,
      download: `${defaultFileName}.${fileType}`,
    });
  } else {
    setAttributes(anchor, { href: url, download: `${fileName}.${fileType}` });
  }
  anchor.click();
}

// Obsługa ładowania pliku przyciągniętego i upuszczonego na drop area
function handleDropFile(event) {
  event.preventDefault();
  convertAndLoadFileData(event.dataTransfer.files[0]);
}

// Zatrzymanie domyślnej akcji przeglądarki przy ładowaniu pliku
function handleDragOver(event) {
  event.preventDefault();
}

// Obsługa ładowania pliku przez inputa
function handleInputLoadFile(event) {
  convertAndLoadFileData(event.target.files[0]);
}

// Konwersja pliku JSON do obiektu JS i wygenerowanie systemu
function convertAndLoadFileData(file) {
  if (file.type.match("^application/json")) {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
      const data = reader.result;
      const formattedData = JSON.parse(data);
      createSystemDataFromAFile(formattedData);
      setSystem();
      system.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }
}
