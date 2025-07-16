function calculateRealisticSystemStatus(supplyType, cable, busSegments) {
  const resistivity = cable.resistivity_OhmPerMeter;
  // Zaczynamy od minimalnego napięcia wymaganego przez ostatnie urządzenie
  let voltageAtNode = busSegments[busSegments.length - 1].detector.minVoltage_V;
  let currentAtNode = 0;

  // Przechodzimy OD KOŃCA do POCZĄTKU busa!
  const segmentData = [];

  for (let i = busSegments.length - 1; i >= 0; i--) {
    const segment = busSegments[i];
    const device = segment.detector;

    // Prąd potrzebny przez to urządzenie:
    // UWAGA: urządzenie o stałej mocy = prąd = P/U (przyjmujemy, że przy niższym napięciu pobierze więcej prądu)
    let deviceCurrent = 0;
    if (device.current_A != null && device.power_W != null) {
      deviceCurrent = device.current_A + (device.power_W / voltageAtNode);
    } else if (device.current_A != null) {
      deviceCurrent = device.current_A;
    } else if (device.power_W != null) {
      deviceCurrent = device.power_W / voltageAtNode;
    }

    // Suma prądów na tym odcinku = prąd urządzenia + prąd downstream (czyli z poprzedniego "końca")
    let totalCurrent = currentAtNode + deviceCurrent;

    // Spadek napięcia na tym odcinku
    const resistance = resistivity * segment.wireLength;
    const voltageDrop = 2 * resistance * totalCurrent;

    // Napięcie wymagane na wejściu tego segmentu = napięcie na wyjściu + spadek na kablu
    const inputVoltage = voltageAtNode + voltageDrop;

    segmentData.unshift({
      segmentIndex: i,
      cableType: cable.type,
      length: segment.wireLength,
      current: totalCurrent,
      resistance,
      voltageDrop,
      voltageAtNode,
      deviceCurrent,
      inputVoltage,
    });

    // Przechodzimy do poprzedniego segmentu z wymaganym napięciem i prądem
    voltageAtNode = inputVoltage;
    currentAtNode = totalCurrent;
  }

  // Po pętli:
  const requiredSupplyVoltage = voltageAtNode;
  const requiredSupplyCurrent = currentAtNode;
  const requiredSupplyPower = requiredSupplyVoltage * requiredSupplyCurrent;

  // Warunki:
  const maxVoltage = Number(supplyType.outputVoltage);
  const maxCurrent = Number(supplyType.outputCurrent);
  const maxPower = maxVoltage * maxCurrent;
  const calcResult = {
    segmentData,
    requiredSupplyVoltage,
    requiredSupplyCurrent,
    requiredSupplyPower
  };
  // Sprawdź czy zasilacz daje radę
  if (
    requiredSupplyVoltage > maxVoltage ||
    requiredSupplyCurrent > maxCurrent ||
    requiredSupplyPower > maxPower
  ) {
    return { valid: false, calcResult };
  }

  // Sprawdź na każdym segmencie czy napięcie przy urządzeniu >= jego minVoltage
  for (const s of segmentData) {
    if (s.voltageAtNode < busSegments[s.segmentIndex].detector.minVoltage_V) {
      return { valid: false, calcResult };
    }
  }

  const validationErrors = validateSystemElectrically(busSegments, calcResult);
  return { valid: true, calcResult, validationErrors };
}

//funkcja zwracająca wszystkie poprawne konfiguracje zasilacz-kabel, które są w stanie "uciągnąć" stworzony system
function calculateAllSystemVariants() {
  const bus = systemData.bus;
  const cables = Cables;
  const supplyTypes = CONTROLUNITLIST;

  const selectedSupply = systemData.supplyType;
  const allResults = [];

  // zbieramy napięcia dostępne w zasilaczach
  function getAvailableVoltages(supply) {
    const voltages = [];
    if (supply.description?.voltageOut_V) voltages.push(supply.description.voltageOut_V);
    if (supply.description?.voltageOut_V48) voltages.push(supply.description.voltageOut_V48);
    return voltages;
  }

  // walidacja danych wprowadzonych przez użytkownika (TUTAJ TYLKO RAZ!)
  const errors = [];
  const validatorsSimple = [
    () => validateTotalWireLength(),
    () => validateSignallersCount(),
    () => validateValvesCount()
  ];
  for (const validator of validatorsSimple) {
    const r = validator();
    if (!r.valid) errors.push(r);
  }

  // bierzemy konkretny zasilacz i przypisujemy dane potrzebne do dalszych obliczeń
  function evaluateSupplyWithVoltage(baseSupply, voltage, isUserSelected = false) {
    const supply = {
      ...baseSupply,
      outputVoltage: voltage,
      outputCurrent:
        voltage === 48
          ? baseSupply.description.maxCurrent_V48
          : baseSupply.description.maxCurrent,
    };

    const validCables = [];
    // sprawdzamy każdy kabel dla konkretnego zasilacza czy jest w stanie podołać zadaniu, zwracamy tylko kable OK.
    for (const cable of cables) {
      const result = calculateRealisticSystemStatus(
        supply,
        cable,
        bus
      );
      if (result.valid) {
        validCables.push({
          cableType: cable,
          totalPower: Math.ceil(result.calcResult.requiredSupplyPower),
          totalCurrent: Math.ceil(result.calcResult.requiredSupplyCurrent),
          totalVoltage: Math.ceil(result.calcResult.requiredSupplyVoltage),
        });
      }
    }
    // jeżeli żaden kabel nie działa pomiń zasilacz.
    if (validCables.length === 0) return null;

    return {
      supplyType: supply,
      isUserSelected,
      validCables
    };
  }

  // 1. Konfiguracja wybrana przez użytkownika
  const userVoltages = getAvailableVoltages(selectedSupply);
  for (const voltage of userVoltages) {
    const result = evaluateSupplyWithVoltage(selectedSupply, voltage, true);
    if (result) allResults.push(result);
  }

  // 2. Pozostałe zasilacze
  for (const supply of supplyTypes) {
    if (supply.productKey === selectedSupply.productKey) continue;

    const voltages = getAvailableVoltages(supply);
    for (const voltage of voltages) {
      const result = evaluateSupplyWithVoltage(supply, voltage, false);
      if (result) allResults.push(result);
    }
  }

  // ZWRACASZ obiekt z wynikami i jedną tablicą errors
  return {
    results: allResults,
    errors: errors
  };
}

function validateSystem() {
  return calculateAllSystemVariants();
}

function validateSystemElectrically(busSegments, calcResult) {
  const errors = [];

  const validatorsCalc = [
    () => validateBusVoltage(calcResult, busSegments)
  ];
  for (const validator of validatorsCalc) {
    const r = validator();
    if (!r.valid) errors.push(r);
  }
  return errors;
}

function validateTotalWireLength() {
  const totalLength = systemData.bus.reduce((sum, seg) => sum + seg.wireLength, 0);
  if (totalLength > 1000) {
    return {
      valid: false,
      code: "TOO_LONG_BUS",
      message: busTooLong[lang]
    };
  }
  return { valid: true };
}


function validateSignallersCount() {
  const count = systemData.bus.filter(seg => seg.detector.class === "signaller").length;
  if (count > 26) {
    return {
      code: "TOO_MANY_SIGNALLERS",
      message: signallerToMany[lang]
    };
  }
  return { valid: true };
}

function validateValvesCount() {
  const count = systemData.bus.filter(seg => seg.detector.type === "valveCtrl").length;
  if (count > 8) {
    return {
      valid: false,
      code: "TOO_MANY_VALVES!",
      message: valvesTooMany[lang]
    };
  }
  return { valid: true };
}

function validateBusVoltage(result, busSegments) {
  for (const seg of result.segmentData) {
    const minV = busSegments[seg.segmentIndex].detector.minVoltage_V;
    if (seg.voltageAtNode < minV) {
      return {
        valid: false,
        code: "LOW_VOLTAGE_ON_BUS",
        message: `Za niskie napięcie na segmencie ${seg.segmentIndex}: ${seg.voltageAtNode.toFixed(2)}V < ${minV}V`
      };
    }
  }
  return { valid: true };
}