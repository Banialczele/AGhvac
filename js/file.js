function exportToXLSX() {
  const rows = getDataForExcel(); // analogiczne do CSV, tylko bez joinowania
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 30 },
  ]
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "System");

  const fileName = prompt("Nazwa pliku?", `TetaSystem_${setDate()}.xlsx`);
  XLSX.writeFile(workbook, fileName || `TetaSystem_${setDate()}.xlsx`);
}

//320px/300/270/240/350px

//20/25/30                   30 znakow

// Konwersja danych systemu do formatu CSV
function getDataForExcel() {
  const rowsDescription = {
    device: ["RODZAJ URZADZENIA", "NAZWA URZĄDZENIA", "KOD PW", "ILOŚĆ", "TOLEDOPIS"],
    deviceTotal: ["", "", "", "ILOŚĆ URZĄDZEŃ"],
    accessories: ["KONEKTOR", "KOD PW", "RODZAJ PRZEWODU", "DŁUGOŚĆ PRZEWODU"],
    controlUnit: ["JEDNOSTKA STERUJACA", "PODTRZYMANIE ZASILANIA", "KOD PW", "ILOŚĆ"],
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

  rows.push(rowsDescription.controlUnit);
  console.log(systemData.supplyType);

  insertDeviceTypeData(systemData.supplyType, "Jednostka sterująca", rows);
  rows.push([]);

  rows.push(rowsDescription.accessories);
  insertTconInCSV(reducedDevices.tCon, "quantityTotal", rows);
  rows.push([]);

  rows.push([TRANSLATION.modControltooltip[lang]]);
  return rows;
}

function insertTconInCSV(devices, label, row) {
  const busLengthValue = systemData.bus.reduce((acc, device) => acc + device.wireLength, 0);
  row.push([`${devices.TConnector}szt.`, `PW-122-S2`, `${systemData.wireType}`, busLengthValue]);
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

function translateUPS(type) {
  return type === `no` ? `nie` : `tak`;
}

// Wstawienie wierszy z danymi dot. użytych w systemie typów urządzeńs
function insertDeviceTypeData(devices, label, store) {
  if (devices) {
    if (label === `Jednostka sterująca`) {
      store.push([devices.type, translateUPS(devices.possibleUPS), devices.productKey, `1szt`]);
    } else if (label === `quantityTotal`) {
      store.push(["", "", "", `${devices.TConnector}szt.`]);
    } else {
      for (let [key, value] of Object.entries(devices)) {
        if (key === `Teta EcoWent+MiniDet`) {
          store.push([label, key, `${value.productKey.CO}, ${value.productKey.LPG}`, `${value.quantity} szt.`]);
        } else if (key === `TOLED`) {
          value.forEach(elem => {
            store.push([label, key, elem.productKey, `${elem.quantity} szt.`, elem.description]);
          })
        } else {
          store.push([label, key, value.productKey, `${value.quantity} szt.`]);
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
