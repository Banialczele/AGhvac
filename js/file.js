// ============================================================================
// EXPORT XLSX / JSON – poprawiona wersja dla nowej struktury systemData.res
// ============================================================================

function exportToXLSX() {
    const rows = getDataForExcel();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
        { wch: 5 },  // LP.
        { wch: 30 }, // Typ urządzenia / Typ przewodu
        { wch: 35 }, // Nazwa urządzenia / Długość przewodu
        { wch: 25 }, // PW
        { wch: 25 }, // Ilość
        { wch: 30 }, // Opis / TOLED
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "System");

    const fileName = prompt("Nazwa pliku?", `TetaSystem_${setDate()}.xlsx`);
    XLSX.writeFile(workbook, fileName || `TetaSystem_${setDate()}.xlsx`);
}

function getDataForExcel() {
    let currentLp = 1;

    const rowsDescription = {
        device: [`LP.`, `${TRANSLATION.fileDeviceType[lang]}`, `${TRANSLATION.fileDeviceName[lang]}`, `${TRANSLATION.filePW[lang]}`, `${TRANSLATION.fileQuantity[lang]}`, `${TRANSLATION.fileToled[lang]}`],
        accessories: ["", `${TRANSLATION.fileWireType[lang]}`, `${TRANSLATION.fileWireLength[lang]} [m]`],
    };
    const rows = [];

    rows.push(rowsDescription.device);

    const controlUnitWithSupply = systemData.res?.powerSupply;
    const alternativeConfig = systemData.res?.alternativeConfig;
    const wantsBackup =
        (String(initSystem?.backup || "").trim().toLowerCase() === "tak" ||
            String(initSystem?.backup || "").trim().toLowerCase() === "yes");

    if (controlUnitWithSupply && controlUnitWithSupply.controlUnit) {
        // --- 1. Główna jednostka sterująca ---
        currentLp = insertDeviceTypeData(
            currentLp,
            controlUnitWithSupply.controlUnit,
            `${TRANSLATION.fileCU[lang]}`,
            rows,
            { removeDotForOne: true }
        );

        // --- 2. Zasilacz / brak zasilacza ---
        if (wantsBackup) {
            const psuObj = controlUnitWithSupply.powerSupply?.supply || controlUnitWithSupply.psu;
            if (psuObj) {
                insertDeviceTypeData(
                    currentLp++,
                    psuObj,
                    `${TRANSLATION.fileBufferPSU[lang]}`,
                    rows
                );
            }
            // else {
            //     insertDeviceTypeData(
            //         currentLp++,
            //         "-",
            //         `${TRANSLATION.powerSupplyBackupNotFound[lang]}`,
            //         rows
            //     );
            // }
        } else {
            insertDeviceTypeData(
                currentLp++,
                "-",
                `${TRANSLATION.powerSupplyNotRequired[lang]}`,
                rows
            );
        }
    }

    const reducedDevices = reduceDevicesForFile();

    currentLp = insertDeviceTypeData(currentLp, reducedDevices.detector, `${TRANSLATION.fileDetector[lang]}`, rows);
    currentLp = insertDeviceTypeData(currentLp, reducedDevices.signaller, `${TRANSLATION.fileSignaller[lang]}`, rows);
    currentLp = insertDeviceTypeData(currentLp, reducedDevices.valveCtrl, `${TRANSLATION.fileValve[lang]}`, rows);
    currentLp = insertTconInCSV(currentLp, reducedDevices.tCon, "quantityTotal", rows);

    rows.push([]);
    rows.push([]);
    rows.push(rowsDescription.accessories);

    const busLengthValue = systemData.bus.reduce((acc, device) => acc + device.wireLength, 0);
    rows.push(["", `${systemData.wireType}`, busLengthValue]);
    rows.push([]);
    rows.push([]);

    rows.push(["",
        `${TRANSLATION.structureType[lang]}`, `${systemData.selectedStructure.type[lang]}`
    ]);
    rows.push([]);

    // --- Główna konfiguracja ---
    if (controlUnitWithSupply && controlUnitWithSupply.controlUnit) {
        const psuMain = controlUnitWithSupply.powerSupply?.supply || controlUnitWithSupply.psu;
        const psuDesc = psuMain ? ` (${psuMain.description})` : "";
        rows.push([
            `${TRANSLATION.modControlFileInfo[lang]} ${controlUnitWithSupply.controlUnit.type} ${TRANSLATION.modControlFileInfoEnd[lang]}`
        ]);
    }

    // --- Alternatywna konfiguracja ---
    if (alternativeConfig && alternativeConfig.controlUnit) {
        const altPSU = alternativeConfig.powerSupply?.supply || alternativeConfig.psu;
        const altDesc = altPSU?.description ? ` (${altPSU.description})` : "";
        rows.push([
            `${TRANSLATION.modControl35Info[lang]} ${alternativeConfig.controlUnit.type} ${TRANSLATION.modControl35InfoEnd[lang]}${altDesc}`
        ]);
    }
    return rows;
}

function insertTconInCSV(iterator, devices, label, row) {
    if (devices && devices.TConnector !== undefined) {
        const lpPrefix = iterator === 1 ? `` : `.`;
        row.push([`${iterator}${lpPrefix}`, `${TRANSLATION.TCON[lang]}`, `T-Con-X`, `PW-122-S2`, `${devices.TConnector}${TRANSLATION.quantity[lang]}`]);
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

            let found = toledArray.find(item => item.description === current.description && item.labeling === current.labeling);

            if (found) {
                found.quantity++;
            } else {
                toledArray.push({
                    ...current.detector,
                    description: current.description,
                    labeling: current.labeling,
                    quantity: 1,
                });
            }
        } else {
            const bucket = accumulator[detectorClass] ??= {};
            let entry = bucket[type];
            if (!entry) {
                entry = bucket[type] = { ...current.detector, quantity: 1 };
            } else {
                entry.quantity++;
            }
        }

        return accumulator;
    }, {});
    return total;
}


function CUUPS() {
    return document.querySelector(`#modControlBatteryBackUp`).value;
}

function insertDeviceTypeData(iterator, devices, label, store, options = {}) {
    const { removeDotForOne = false } = options;
    const lpPrefix = removeDotForOne && iterator === 1 ? `` : `.`

    if (devices) {
        if (label === `Jednostka sterująca` || label === `Control Unit`) {
            store.push([`${iterator}${lpPrefix}`, label, devices.type, devices.productKey, `1${TRANSLATION.quantity[lang]}`]);
            return iterator + 1;
        } else if (label === `Zasilacz buforowy` || label === `Zasilacz`) {
            const deviceType = typeof devices === 'object' ? devices.type : devices;
            const deviceDescription = typeof devices === 'object' ? devices.description : '';
            const deviceProductKey = typeof devices === 'object' ? devices.productKey : '';
            store.push([`${iterator}${lpPrefix}`, label, deviceType, deviceProductKey || deviceDescription, `1${TRANSLATION.quantity[lang]}`]);
            return iterator + 1;
        } else if (typeof devices === 'string' && devices === '-') {
            store.push([`${iterator}${lpPrefix}`, label, devices, '', '']);
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
                            store.push([`${iterator + devicesAdded}${lpPrefix}`, label, key, `${elem.productKey}-${elem.labeling}`, `${elem.quantity}${TRANSLATION.quantity[lang]}`, elem.description]);
                            devicesAdded++;
                        });
                    } else {
                        const quantity = value.quantity === undefined ? 0 : value.quantity;
                        store.push([`${iterator + devicesAdded}${lpPrefix}`, label, key, value.productKey, `${quantity}${TRANSLATION.quantity[lang]}`]);
                        devicesAdded++;
                    }
                }
            } else if (Array.isArray(devices)) {
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

function exportToJSON() {
    systemData.backup = initSystem.backup;
    const stringData = JSON.stringify(systemData);
    const blob = new Blob([stringData], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    downloadFile(url, "json");
}

function insertDeviceTypeWireLengthData(deviceType, deviceTypeLabel, store) {
    const wireLength = systemData.bus.reduce((acc, device) => {
        if (device.type === deviceType) return acc + device.wireLength;
        else return acc;
    }, 0);
    store.push(["Kabel", deviceTypeLabel, `${wireLength} m`]);
}

function downloadFile(url, fileType) {
    const defaultFileName = `TetaSystem_${setDate()}`;
    const fileName = prompt("Nazwa pliku?", defaultFileName);
    const anchor = document.createElement("a");
    anchor.style = "display: none";
    setAttributes(anchor, {
        href: url,
        download: `${fileName || defaultFileName}.${fileType}`,
    });
    anchor.click();
}

// Drag & Drop / Input Loader
function getFileLoadMessage(key) {
    const messages = {
        noFile: {
            pl: "Nie wybrano pliku do wczytania.",
            en: "No file was selected."
        },
        unsupportedFile: {
            pl: "Wybierz plik JSON z wcześniej zapisanym systemem.",
            en: "Please select a JSON file with a previously saved system."
        },
        invalidJson: {
            pl: "Nie udało się odczytać pliku JSON. Sprawdź, czy plik nie jest uszkodzony.",
            en: "The JSON file could not be read. Please check whether the file is not corrupted."
        },
        invalidStructure: {
            pl: "Plik JSON nie wygląda jak zapisany system TetaGas.",
            en: "The JSON file does not look like a saved TetaGas system."
        },
        loadFailed: {
            pl: "Nie udało się wczytać systemu z pliku.",
            en: "The system could not be loaded from the file."
        }
    };

    return messages[key]?.[lang] || messages[key]?.pl || key;
}

function getDragAndDropArea() {
    return document.getElementById("dragNDropArea");
}

function setDragAndDropActive(isActive) {
    const area = getDragAndDropArea();
    if (!area) return;
    area.classList.toggle("is-drag-over", Boolean(isActive));
}

function isProbablyJsonFile(file) {
    if (!file) return false;

    const name = String(file.name || "").toLowerCase();
    const type = String(file.type || "").toLowerCase();

    return (
        name.endsWith(".json") ||
        type === "" ||
        type.includes("json") ||
        type === "text/plain" ||
        type === "text/javascript" ||
        type === "application/octet-stream"
    );
}

function normalizeLoadedSystemPayload(parsedData) {
    if (!parsedData || typeof parsedData !== "object") {
        throw new Error("Invalid JSON payload");
    }

    const incomingSystem = parsedData.systemData || parsedData;

    const looksLikeSavedSystem =
        Array.isArray(incomingSystem.bus) ||
        incomingSystem.supplyType !== undefined ||
        incomingSystem.wireType !== undefined ||
        incomingSystem.batteryBackUp !== undefined ||
        incomingSystem.thRailing !== undefined ||
        incomingSystem.selectedStructure !== undefined ||
        incomingSystem.res !== undefined ||
        parsedData.initSystem !== undefined;

    if (!looksLikeSavedSystem) {
        throw new Error("Invalid TetaGas system file structure");
    }

    return parsedData;
}

function showFileLoadError(key, error) {
    console.error("TetaGas file load error:", error);
    alert(getFileLoadMessage(key));
}

function switchToSystemViewAfterFileLoad() {
    const systemSection = document.getElementById("system");

    if (typeof transitionToSystemView === "function") {
        transitionToSystemView();
        return;
    }

    document.body.classList.remove("scroll-locked");
    document.body.classList.add("system-active");
    systemSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderLoadedSystem() {
    if (typeof setSystem !== "function") {
        throw new Error("setSystem function is not available");
    }

    setSystem();

    if (typeof validateSystem === "function") {
        validateSystem();
        if (typeof functionToUpdateSystem === "function") functionToUpdateSystem();
    }

    if (typeof initSystem !== "undefined") initSystem.systemIsGenerated = true;

    switchToSystemViewAfterFileLoad();
}

function handleDropFile(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragAndDropActive(false);
    convertAndLoadFileData(event.dataTransfer?.files?.[0]);
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragAndDropActive(true);
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();

    const area = getDragAndDropArea();
    if (!area) return;
    if (event.relatedTarget && area.contains(event.relatedTarget)) return;
    setDragAndDropActive(false);
}

function handleInputLoadFile(event) {
    convertAndLoadFileData(event.target.files?.[0]);
    event.target.value = "";
}

function convertAndLoadFileData(file) {
    if (!file) {
        alert(getFileLoadMessage("noFile"));
        return;
    }

    if (!isProbablyJsonFile(file)) {
        alert(getFileLoadMessage("unsupportedFile"));
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        let parsedData;

        try {
            const rawText = String(reader.result || "").replace(/^\uFEFF/, "").trim();
            parsedData = JSON.parse(rawText);
        } catch (error) {
            showFileLoadError("invalidJson", error);
            return;
        }

        let normalizedData;
        try {
            normalizedData = normalizeLoadedSystemPayload(parsedData);
        } catch (error) {
            showFileLoadError("invalidStructure", error);
            return;
        }

        try {
            const loaded = createSystemDataFromAFile(normalizedData);
            if (loaded === false) throw new Error("createSystemDataFromAFile returned false");
            renderLoadedSystem();
        } catch (error) {
            showFileLoadError("loadFailed", error);
        }
    };

    reader.onerror = function () {
        showFileLoadError("loadFailed", reader.error || new Error("FileReader error"));
    };

    reader.readAsText(file, "utf-8");
}

function setupDragAndDropVisualState() {
    const area = getDragAndDropArea();
    if (!area || area.dataset.dragVisualBound === "true") return;

    area.dataset.dragVisualBound = "true";
    area.addEventListener("dragenter", handleDragOver);
    area.addEventListener("dragover", handleDragOver);
    area.addEventListener("dragleave", handleDragLeave);
    area.addEventListener("drop", handleDropFile);

    document.addEventListener("dragend", () => setDragAndDropActive(false));
    document.addEventListener("drop", () => setDragAndDropActive(false));
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupDragAndDropVisualState);
} else {
    setupDragAndDropVisualState();
}
