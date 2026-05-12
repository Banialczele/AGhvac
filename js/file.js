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
        accessories: ["", `${TRANSLATION.fileWireType[lang]}`, `${TRANSLATION.fileWireLength[lang]}`],
    };
    const rows = [];

    rows.push(rowsDescription.device);

    const controlUnitWithSupply = systemData.res?.powerSupply;
    const alternativeConfig = systemData.res?.alternativeConfig;
    const wantsBackup =
        (String(initSystem?.backup || systemData?.batteryBackUp || "").trim().toLowerCase() === "tak" ||
            String(initSystem?.backup || systemData?.batteryBackUp || "").trim().toLowerCase() === "yes");

    if (controlUnitWithSupply && controlUnitWithSupply.controlUnit) {
        currentLp = insertDeviceTypeData(
            currentLp,
            controlUnitWithSupply.controlUnit,
            `${TRANSLATION.fileCU[lang]}`,
            rows,
            { removeDotForOne: true }
        );

        const psuObj = controlUnitWithSupply.powerSupply?.supply || controlUnitWithSupply.psu;

        if (psuObj) {
            currentLp = insertDeviceTypeData(
                currentLp,
                psuObj,
                wantsBackup ? `${TRANSLATION.fileBufferPSU[lang]}` : `${TRANSLATION.filePSU[lang]}`,
                rows
            );
        } else if (!wantsBackup) {
            currentLp = insertDeviceTypeData(
                currentLp,
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

    const busLengthValue = systemData.bus.reduce((acc, device) => acc + (Number(device.wireLength) || 0), 0);
    rows.push(["", `${systemData.wireType}`, busLengthValue]);
    rows.push([]);
    rows.push([]);

    const structure = systemData.selectedStructure || initSystem.selectedStructure;
    rows.push(["", `${TRANSLATION.structureType[lang]}`, `${structure?.type?.[lang] || structure || ""}`]);
    rows.push([]);

    if (controlUnitWithSupply && controlUnitWithSupply.controlUnit) {
        rows.push([
            `${TRANSLATION.modControlFileInfo[lang]} ${controlUnitWithSupply.controlUnit.type} ${TRANSLATION.modControlFileInfoEnd[lang]}`
        ]);
    }

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
        } else if ([
            TRANSLATION.fileBufferPSU?.pl,
            TRANSLATION.fileBufferPSU?.en,
            TRANSLATION.filePSU?.pl,
            TRANSLATION.filePSU?.en,
            `Zasilacz buforowy`,
            `Zasilacz`,
            `Buffer power supply`,
            `Power supply`,
        ].includes(label)) {
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
    const exportData = {
        version: 2,
        revision: typeof REVISIONNUMBER !== "undefined" ? REVISIONNUMBER : null,
        lang,
        initSystem: {
            systemIsGenerated: initSystem.systemIsGenerated,
            amountOfDetectors: initSystem.amountOfDetectors,
            EWL: initSystem.EWL,
            backup: initSystem.backup,
            thRailing: initSystem.thRailing,
            selectedStructureType: initSystem.selectedStructure?.type?.pl || initSystem.selectedStructure?.type?.[lang] || null,
        },
        systemData: {
            ...systemData,
            selectedStructureType: systemData.selectedStructure?.type?.pl || systemData.selectedStructure?.type?.[lang] || null,
            // Nie serializujemy pełnego obiektu struktury jako źródła prawdy — odtwarzamy go z models.js przy imporcie.
            selectedStructure: undefined,
        },
    };

    const stringData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([stringData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadFile(url, "json");
    URL.revokeObjectURL(url);
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
function handleDropFile(event) {
    event.preventDefault();
    convertAndLoadFileData(event.dataTransfer.files[0]);
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleInputLoadFile(event) {
    convertAndLoadFileData(event.target.files[0]);
}


function convertAndLoadFileData(file) {
    if (!file) return;

    if (!file.type.match("^application/json") && !file.name?.toLowerCase().endsWith(".json")) {
        window.alert("Nieprawidłowy format pliku. Wczytaj plik JSON.");
        return;
    }

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
        try {
            const formattedData = JSON.parse(reader.result);
            createSystemDataFromAFile(formattedData);

            const isValid = validateSystem();
            if (!isValid) return;

            setSystem();
            document.body.classList.remove('scroll-locked');
            document.body.classList.add('system-active');

            const systemSection = document.getElementById("system");
            systemSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) {
            console.error(error);
            window.alert("Nie udało się wczytać pliku JSON. Sprawdź strukturę pliku.");
        } finally {
            const input = document.getElementById("readFileInput");
            if (input) input.value = "";
        }
    };
}