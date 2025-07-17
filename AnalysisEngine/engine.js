function validateBus(busSegments) {
  // Całkowita długość przewodów
  const totalLength =
    busSegments.reduce(
      (sum, seg) => sum + (seg.wireLength ?? seg.cableLen_m),
      0
    );
  if (totalLength > 1000) {
    return { valid: false, error: "Zbyt duża długość magistrali (>1000m)", code: "BUS_TOO_LONG" };
  }

  // Ilość sygnalizatorów
  const signallerCount = busSegments.filter(
    seg => seg.detector.class === "signaller"
  ).length;
  if (signallerCount > 26) {
    return { valid: false, error: "Zbyt dużo sygnalizatorów (>26 sztuk)", code: "TOO_MANY_SIGNALLERS" };
  }

  // Ilość zaworów
  const valveCount = busSegments.filter(
    seg => seg.detector.type === "valveCtrl"
  ).length;
  if (valveCount > 8) {
    return { valid: false, error: "Zbyt dużo sterowników zaworu (>8 sztuk)", code: "TOO_MANY_VALVES" };
  }

  return { valid: true };
}

// ------------------- Silnik: sprawdzanie kabli dla zasilacza -------------------

function checkSystemForPowerSupplyAndCable(controlUnit, busSegments, cables) {
  // supplyVoltage: zawsze wymagane!
  const supplyVoltage = controlUnit.description.supplyVoltage; // np. 24
  const maxPower = controlUnit.description.power; // zawsze limit mocy!

  const validCables = [];

  for (const cable of cables) {
    const lastDevice = busSegments[busSegments.length - 1].detector;
    let endVoltage = Math.max(lastDevice.minVoltage_V, supplyVoltage / 2);
    const voltageStep = 0.1;
    let foundWorkingPoint = false;
    let summary = null;

    while (endVoltage < supplyVoltage) {
      let voltageAtNode = endVoltage;
      let currentAtNode = 0;
      let isValid = true;

      for (let i = busSegments.length - 1; i >= 0; i--) {
        const segment = busSegments[i];
        const device = segment.detector;

        let deviceCurrent = 0;
        if (device.current_A != null && device.power_W != null) {
          deviceCurrent = device.current_A + (device.power_W / voltageAtNode);
        } else if (device.current_A != null) {
          deviceCurrent = device.current_A;
        } else if (device.power_W != null) {
          deviceCurrent = device.power_W / voltageAtNode;
        }

        let totalCurrent = currentAtNode + deviceCurrent;
        const resistance = cable.resistivity_OhmPerMeter * (segment.wireLength ?? segment.cableLen_m);
        const voltageDrop = 2 * resistance * totalCurrent;

        const inputVoltage = voltageAtNode + voltageDrop;

        if (voltageAtNode < device.minVoltage_V) {
          isValid = false;
          break;
        }

        voltageAtNode = inputVoltage;
        currentAtNode = totalCurrent;
      }

      if (voltageAtNode > supplyVoltage) break;

      if (isValid) {
        const powerW = voltageAtNode * currentAtNode;
        if (maxPower === undefined || powerW <= maxPower) {
          foundWorkingPoint = true;
          summary = {
            cable,
            requiredSupplyVoltage: voltageAtNode,
            requiredSupplyCurrent: currentAtNode,
            powerW: powerW
          };
        }
        break;
      }

      endVoltage += voltageStep;
    }

    if (foundWorkingPoint && summary) {
      validCables.push(summary);
    }
  }

  return validCables;
}

// -------- Główna funkcja --------

function findValidControlUnitsWithCables(controlUnits, busSegments, cables) {
  const validation = validateBus(busSegments);
  if (!validation.valid) {
    return {
      error: true,
      code: validation.code,
      message: validation.error,
      units: []
    };
  }

  const result = [];
  for (const unit of controlUnits) {
    const validCables = checkSystemForPowerSupplyAndCable(unit, busSegments, cables);

    if (validCables.length > 0) {
      result.push({
        controlUnit: unit,
        validCables
      });
    }
  }

  return {
    error: false,
    units: result
  };
}