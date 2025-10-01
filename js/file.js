// Ta zmienna globalna 'i' jest już niepotrzebna, zostanie usunięta
// let i = 3;

function exportToXLSX() {
    const rows = getDataForExcel(); // analogiczne do CSV, tylko bez joinowania
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
        { wch: 5 }, // LP.
        { wch: 30 }, // Typ urządzenia / Typ przewodu
        { wch: 35 }, // Nazwa urządzenia / Długość przewodu
        { wch: 25 }, // PW
        { wch: 25 }, // Ilość
        { wch: 30 }, // Opis / TOLED (jeśli istnieje)
    ]
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "System");

    const fileName = prompt("Nazwa pliku?", `TetaSystem_${setDate()}.xlsx`);
    XLSX.writeFile(workbook, fileName || `TetaSystem_${setDate()}.xlsx`);
}


// Konwersja danych systemu do formatu CSV
function getDataForExcel() {
    let currentLp = 1; // Lokalna zmienna do numerowania pozycji

    const rowsDescription = {
        device: [`LP.`, `${TRANSLATION.fileDeviceType[lang]}`, `${TRANSLATION.fileDeviceName[lang]}`, `${TRANSLATION.filePW[lang]}`, `${TRANSLATION.fileQuantity[lang]}`, `${TRANSLATION.fileToled[lang]}`],
        accessories: ["", `${TRANSLATION.fileWireType[lang]}`, `${TRANSLATION.fileWireLength[lang]}`],
    };
    const rows = [];

    // dodaj nagłówek urządzeń
    rows.push(rowsDescription.device);

    const controlUnitWithSupply = systemData.res.alternativeConfig;
    const controlUnitWithoutSupply = systemData.res.pw108AConfig;
    const wantsBackup = (String(initSystem?.backup || "").trim().toLowerCase() === "tak" || String(initSystem?.backup || "").trim().toLowerCase() === "yes");

    // === OBSŁUGA DLA controlUnitWithBuiltInSupply ===
    if (controlUnitWithSupply && controlUnitWithSupply.controlUnit.type) {
        // LP=1: Jednostka sterująca (CU z wbudowanym zasilaniem)
        currentLp = insertDeviceTypeData(currentLp, controlUnitWithSupply.controlUnit, `${TRANSLATION.fileCU[lang]}`, rows, { removeDotForOne: true });

        // LP=2: Zasilacz (buforowy lub informacja o braku)
        if (wantsBackup) {
            // Tryb TAK/YES: Ma być ten sam zasilacz co dla Mod Control (MC)
            const backupSupply = controlUnitWithoutSupply?.powerSupply?.supply || controlUnitWithSupply?.powerSupply?.supply; // Najpierw szukamy z Mod Control, potem z BuiltIn CU
            if (backupSupply && backupSupply.type) {
                insertDeviceTypeData(currentLp++, backupSupply, `${TRANSLATION.fileBufferPSU[lang]}`, rows);
            } else {
                // Jeśli nie znaleziono zasilacza backupowego (MC)
                insertDeviceTypeData(currentLp++, `-`, `${TRANSLATION.powerSupplyBackupNotFound[lang]}`, rows);
            }
        } else {
            // Tryb NIE/NO: "Zasilacz nie wymagany"
            insertDeviceTypeData(currentLp++, `-`, `${TRANSLATION.powerSupplyNotRequired[lang]}`, rows);
        }
    }


    const reducedDevices = reduceDevicesForFile();

    // dodaj wiersze urządzeń
    currentLp = insertDeviceTypeData(currentLp, reducedDevices.detector, `${TRANSLATION.fileDetector[lang]}`, rows);
    currentLp = insertDeviceTypeData(currentLp, reducedDevices.signaller, `${TRANSLATION.fileSignaller[lang]}`, rows);
    currentLp = insertDeviceTypeData(currentLp, reducedDevices.valveCtrl, `${TRANSLATION.fileDeviceType[lang]}`, rows); // Zmieniono label na ogólniejszy, bo to dla różnych urządzeń
    currentLp = insertTconInCSV(currentLp, reducedDevices.tCon, "quantityTotal", rows);

    rows.push([]);
    rows.push([]);
    rows.push(rowsDescription.accessories);
    const busLengthValue = systemData.bus.reduce((acc, device) => acc + device.wireLength, 0);

    rows.push(["", `${systemData.wireType}`, busLengthValue]);
    rows.push([]);
    rows.push([]);

    // === OBSŁUGA DLA controlUnitWithoutSupply (MOD Control lub podobne) ===
    if (controlUnitWithoutSupply && controlUnitWithoutSupply.controlUnit.type === "Teta MOD Control 1") { // Upewnij się, że jednostka jest wybrana i jest to MOD Control
        const supplyForCUWithout = controlUnitWithoutSupply.powerSupply.supply;
        if (supplyForCUWithout && supplyForCUWithout.type) { // Upewnij się, że zasilacz też jest wybrany
            rows.push([`${TRANSLATION.modControlFileInfo[lang]} ${controlUnitWithoutSupply.controlUnit.type} ${TRANSLATION.modControlFileInfoEnd[lang]}`]);
            rows.push([`${TRANSLATION.modControl35Info[lang]} ${controlUnitWithoutSupply.controlUnit.type} ${TRANSLATION.modControl35InfoEnd[lang]} ${supplyForCUWithout.description}`]);
        }
    }

    return rows;
}

// Funkcja pomocnicza dla T-Con (przystosowana do lokalnego 'iteratora')
function insertTconInCSV(iterator, devices, label, row) {
    if (devices && devices.TConnector !== undefined) {
        const lpPrefix = iterator === 1 ? `` : `.`
        row.push([`${iterator}${lpPrefix}`, `${TRANSLATION.TCON[lang]}`, `T-Con-X`, `PW-122-S2`, `${devices.TConnector}${TRANSLATION.quantity[lang]}`,]);
        return iterator + 1;
    }
    return iterator;
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

// Wstawienie wierszy z danymi dot. użytych w systemie typów urządzeń
// Zmienione: teraz przyjmuje i zwraca iterator, dodano opcję removeDotForOne
function insertDeviceTypeData(iterator, devices, label, store, options = {}) {
    const { removeDotForOne = false } = options;
    const lpPrefix = removeDotForOne && iterator === 1 ? `` : `.`

    if (devices) {
        if (label === `Jednostka sterująca` || label === `Control Unit`) {
            store.push([`${iterator}${lpPrefix}`, label, devices.type, devices.productKey, `1${TRANSLATION.quantity[lang]}`]);
            return iterator + 1;
        } else if (label === `Zasilacz buforowy` || label === `Zasilacz`) {
            // Zmieniono: devices może być stringiem "-" dla "nie wymagany"
            const deviceType = typeof devices === 'object' ? devices.type : devices;
            const deviceDescription = typeof devices === 'object' ? devices.description : '';
            const deviceProductKey = typeof devices === 'object' ? devices.productKey : '';

            store.push([`${iterator}${lpPrefix}`, label, deviceType, deviceProductKey || deviceDescription, `1${TRANSLATION.quantity[lang]}`]);
            return iterator + 1;
        } else if (typeof devices === 'string' && devices === '-') {
            // Obsługa specjalnego przypadku dla "Zasilacz nie wymagany"
            store.push([`${iterator}${lpPrefix}`, label, devices, '', '']); // Bez PW i ilości
            return iterator + 1;
        } else {
            let devicesAdded = 0;
            if (devices instanceof Object && !Array.isArray(devices)) {
                for (let [key, value] of Object.entries(devices)) {
                    if (key === `Teta EcoWent+MiniDet`) {
                        store.push([`${iterator + devicesAdded}${lpPrefix}`, label, key, `${value.productKey.CO}, ${value.productKey.LPG}`, `${value.quantity}${TRANSLATION.quantity[lang]}`]);
                        devicesAdded++;
                    } else if (key === `TOLED`) {
                        value.forEach(elem => {
                            store.push([`${iterator + devicesAdded}${lpPrefix}`, label, key, elem.productKey, `${elem.quantity}${TRANSLATION.quantity[lang]}`, elem.description]);
                            devicesAdded++;
                        });
                    } else {
                        const quantity = value.quantity === undefined ? 0 : value.quantity;
                        store.push([`${iterator + devicesAdded}${lpPrefix}`, label, key, value.productKey, `${quantity}${TRANSLATION.quantity[lang]}`]);
                        devicesAdded++;
                    }
                }
            } else if (Array.isArray(devices)) { // Jeśli devices to tablica (np. dla TOLED bez key)
                devices.forEach(elem => {
                    store.push([`${iterator + devicesAdded}${lpPrefix}`, label, elem.type, elem.productKey, `${elem.quantity}${TRANSLATION.quantity[lang]}`, elem.description]);
                    devicesAdded++;
                });
            }
            return iterator + devicesAdded;
        }
    }
    return iterator;
}

// Wyeksportowanie danych systemu do pliku JSON
function exportToJSON() {
    const stringData = JSON.stringify(systemData);
    const blob = new Blob([stringData], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    downloadFile(url, "json");
}

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