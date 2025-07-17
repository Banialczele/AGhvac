// Wyeksportowanie danych systemu do pliku CSV
function exportToCSV() {
  const csvData = setDataToCSVFormat();
  const url = "data:text/csv;charset=utf-8," + encodeURI(csvData);
  downloadFile(url, "csv");
}

// Konwersja danych systemu do formatu CSV
function setDataToCSVFormat() {
  const rowsDescription = {
    device: ["RODZAJ URZADZENIA", "NAZWA URZĄDZENIA", "KOD PW", "ILOSC", "TOLEDOPIS"],
    deviceTotal: ["", "", "", "ILOSC URZADZEN"],
    accessories: ["KONEKTOR", "KOD PW", "RODZAJ PRZEWODU", "DŁUGOSC PRZEWODU"],
    controlUnit: ["JEDNOSTKA STERUJACA", "PODTRZYMANIE ZASILANIA", "KOD PW", "ILOSC"],
  };
  const rows = [];

  const reducedDevices = reduceDevicesForFile();
  // dodaj nagłówek urządzeń
  rows.push(rowsDescription.device);

  // dodaj wiersze urządzeń
  insertDeviceTypeData(reducedDevices.detector, "Czujnik gazu", rows);
  insertDeviceTypeData(reducedDevices.signaller, "Sygnalizator", rows);
  insertDeviceTypeData(reducedDevices.valveCtrl, "Zawór", rows);

  rows.push([]);
  rows.push([]);

  // dodaj nagłówek i sumę
  rows.push(rowsDescription.deviceTotal);
  insertDeviceTypeData(reducedDevices.tCon, "quantityTotal", rows);
  rows.push([]);

  rows.push(rowsDescription.accessories);
  insertTconInCSV(reducedDevices.tCon, "quantityTotal", rows);
  rows.push([]);

  rows.push(rowsDescription.controlUnit);
  insertDeviceTypeData(systemData.supplyType, "Jednostka sterująca", rows);
  rows.push([]);
  rows.push([]);

  // generuj CSV
  const csvString = rows.map((row) => row.join(",")).join("\r\n");

  return "sep=,\r\n" + csvString;
}

function insertTconInCSV(devices, label, row) {
  const busLengthValue = systemData.bus.reduce((acc, device) => acc + device.wireLength, 0);
  row.push([`${devices.TConnector}szt.`, `PW-122-S2`, systemData.wireType, busLengthValue]);
}

function reduceDevicesForFile() {
  const total = systemData.bus.reduce((accumulator, current) => {
    const deviceClassDetector = `detector`;
    const deviceClassSignaller = `signaller`;
    const deviceClassValve = `valveCtrl`;
    accumulator[deviceClassDetector] ??= {};
    accumulator[deviceClassSignaller] ??= {};
    accumulator[deviceClassValve] ??= {};

    accumulator[`tCon`] ??= {};

    const { class: detectorClass, type } = current.detector;

    let bucket;

    if (detectorClass === "detector") {
      bucket = accumulator[deviceClassDetector];
    } else if (detectorClass === "signaller") {
      bucket = accumulator[deviceClassSignaller];
    } else {
      bucket = accumulator[deviceClassValve];
    }

    let entry = bucket[type];

    if (!entry) {
      entry = bucket[type] = {
        ...current.detector,
        quantity: 1,
        ...(detectorClass === "signaller" &&
          type === "TOLED" && {
          description: [current.description],
        }),
      };
    } else {
      entry.quantity++;

      if (detectorClass === "signaller" && type === "TOLED") {
        if (!entry.description.includes(current.description)) {
          entry.description.push(current.description);
        }
      }
    }
    accumulator[`tCon`][`TConnector`] = (accumulator[`tCon`][`TConnector`] || 0) + 1;
    return accumulator;
  }, {});
  return total;
}

// Wstawienie wierszy z danymi dot. użytych w systemie typów urządzeń
function insertDeviceTypeData(devices, label, store) {
  if (label === `Jednostka sterująca`) {
    store.push([label, devices.type, devices.productKey, `1szt`]);
  } else if (label === `quantityTotal`) {
    store.push(["", "", "", `${devices.TConnector}szt.`]);
  } else {
    for (let [key, value] of Object.entries(devices)) {
      if (key === `Teta EcoWent+MiniDet`) {
        store.push([label, key, (value.productKey.CO, value.productKey.LPG), `${value.quantity} szt.`]);
      }
      if (key === `TOLED`) {
        console.log(key);
        console.log(value);
        store.push([label, key, value.productKey, `${value.quantity} szt.`, value.description]);
      } else {
        store.push([label, key, value.productKey, `${value.quantity} szt.`]);
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
      console.log(formattedData);
      systemData = formattedData;
      setSystem();
      system.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }
}
