// ===== Helpery =====

// 1) Zwróć WSZYSTKIE pasujące zasilacze (posortowane rosnąco po mocy).
//    Uwzględnia margines mocy (powerHeadroom). Dla powersupplyMC wylicza estimatedRuntime_h.
function pickMatchingSupplies(
  suppliesList,
  requiredVoltage,
  requiredPowerW,
  { isBatteryList = false, minBackupHours = 0, powerHeadroom = 1.0 } = {}
) {
  if (!Array.isArray(suppliesList)) return [];

  const needPowerW = requiredPowerW * powerHeadroom;

  const augmented = suppliesList
    .filter(s => s.supplyVoltage >= requiredVoltage && s.power >= needPowerW)
    .map(s => {
      if (!isBatteryList) return { ...s }; // klasyczne zasilacze – bez runtime

      const Ah  = s.batteryCapacity_Ah;
      const DoD = (s.usableDoD ?? 0.8);
      const eff = (s.efficiency ?? 0.9);

      if (Ah == null) return { ...s, estimatedRuntime_h: null };

      // supplyVoltage traktujemy jako "realne" (po stratach) → używamy wprost
      const runtime = (Ah * DoD * s.supplyVoltage * eff) / needPowerW;
      return { ...s, estimatedRuntime_h: Number(runtime.toFixed(2)) };
    });

  const filtered = (isBatteryList && minBackupHours > 0)
    ? augmented.filter(s => s.estimatedRuntime_h != null && s.estimatedRuntime_h >= minBackupHours)
    : augmented;

  return filtered.sort((a, b) => a.power - b.power);
}

// 2) Unikalizacja zasilaczy (Twoja wersja – bez „lepszej” deduplikacji).
function uniqSupplies(list) {
  return Array.from(new Map(list.map(s => [JSON.stringify(s), s])).values());
}

// 3) Najmocniejsze zasilacze (po polu power) – wygodny helper.
function getStrongestSupplies(powersupplyTMC1, powersupplyMC, topN = null) {
  const all = [...(powersupplyTMC1 || []), ...(powersupplyMC || [])];
  const sorted = all.sort((a, b) => b.power - a.power);
  return topN ? sorted.slice(0, topN) : sorted;
}


// ===== Rdzeń obliczeń (jak dotąd) + 3 W strat CU i brak limitu gdy power===0 =====

// Sprawdza, które kable są zgodne z jednostką sterującą i magistralą urządzeń
// (+ 3W strat CU; zwraca powerWithLossesW do doboru zasilacza)
function checkSystemForPowerSupplyAndCable(controlUnit, busSegments, cables) {
  const supplyVoltage = controlUnit.description.supplyVoltage;

  // 0 / null / undefined => brak limitu mocy CU
  const rawMaxPower = controlUnit.description.power;
  const maxPower = (rawMaxPower === 0 || rawMaxPower == null) ? Infinity : rawMaxPower;

  const CONTROL_UNIT_LOSSES_W = 3;
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

      // od końca magistrali do początku
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

        const totalCurrent = currentAtNode + deviceCurrent;
        const resistance = cable.resistivity_OhmPerMeter * segment.wireLength;
        const voltageDrop = 2 * resistance * totalCurrent; // 2 żyły
        const inputVoltage = voltageAtNode + voltageDrop;

        if (voltageAtNode < device.minVoltage_V) { isValid = false; break; }

        voltageAtNode = inputVoltage;
        currentAtNode = totalCurrent;
      }

      if (voltageAtNode > supplyVoltage) break;

      if (isValid) {
        const powerW = voltageAtNode * currentAtNode;            // moc linii (bez strat CU)
        const powerWithLossesW = powerW + CONTROL_UNIT_LOSSES_W; // do doboru zasilacza

        if (powerWithLossesW <= maxPower) {
          foundWorkingPoint = true;
          summary = {
            cable,
            requiredSupplyVoltage: voltageAtNode, // wymagane U na początku linii
            requiredSupplyCurrent: currentAtNode, // wymagany I na początku linii
            powerW,
            controlUnitLossesW: CONTROL_UNIT_LOSSES_W,
            powerWithLossesW
          };
        }
        break; // pierwszy poprawny punkt
      }

      endVoltage += voltageStep;
    }

    if (foundWorkingPoint && summary) validCables.push(summary);
  }

  return validCables;
}


// ===== Główna funkcja =====
// ZAWSZE dobiera zewnętrzny zasilacz (również dla unit.description.power > 0).
// Zwraca: validCables, matchingSupplies, minimalSupply (najmniejszy zasilacz + lista kabli, które obsłuży).
function findValidControlUnitsWithCables(
  controlUnits,
  busSegments,
  cables,
  initSystem,
  powersupplyTMC1,
  powersupplyMC
) {
  const errors = [];

  // Walidacje magistrali
  const totalLength = busSegments.reduce((sum, seg) => sum + seg.wireLength, 0);
  if (totalLength > 1000) errors.push({ code: "BUS_TOO_LONG", message: "Zbyt długa magistrala! Max 1000m!" });

  const signallerCount = busSegments.filter(seg => seg.detector.class === "signaller").length;
  if (signallerCount > 26) errors.push({ code: "TOO_MANY_SIGNALLERS", message: "Za dużo sygnalizatorów! Max 26 szt." });

  const valveCount = busSegments.filter(seg => seg.detector.type === "valveCtrl").length;
  if (valveCount > 8) errors.push({ code: "TOO_MANY_VALVES", message: "Za dużo sterowników zaworu! Max 8 szt." });

  const result = [];

  // Parametry doboru zasilaczy wg backup i wymogów
  const useTMC1       = (initSystem?.backup === "Nie");       // "Nie" => klasyczne (bez baterii)
  const suppliesList  = useTMC1 ? powersupplyTMC1 : powersupplyMC;
  const isBatteryList = !useTMC1;
  const minBackupHours = initSystem?.minBackupHours ?? 0;
  const powerHeadroom  = initSystem?.powerHeadroom ?? 1.0;     // np. 1.1 dla +10%

  for (const unit of controlUnits) {
    // 1) policz działające kable (z 3W strat) – jak dotąd
    const validCablesRaw = checkSystemForPowerSupplyAndCable(unit, busSegments, cables);
    if (validCablesRaw.length === 0) continue;

    // 2) Dobierz zasilacze dla każdego kabla (zawsze)
    let unitMatchingSupplies = [];
    for (const cfg of validCablesRaw) {
      const ms = pickMatchingSupplies(
        suppliesList,
        cfg.requiredSupplyVoltage,
        cfg.powerWithLossesW,
        { isBatteryList, minBackupHours, powerHeadroom }
      );
      unitMatchingSupplies.push(...ms);
    }

    // 3) Unikalna lista zasilaczy dla jednostki (Twoja wersja uniq)
    const matchingSupplies = uniqSupplies(unitMatchingSupplies).sort((a, b) => a.power - b.power);

    // 4) Minimalny zasilacz + kable, które on obsłuży
    let minimalSupply = null;
    if (matchingSupplies.length > 0) {
      const minSupply = matchingSupplies[0];
      const needPowerWWithHeadroom = (cfg) => cfg.powerWithLossesW * powerHeadroom;

      const cablesForMinSupply = validCablesRaw
        .filter(cfg =>
          minSupply.supplyVoltage >= cfg.requiredSupplyVoltage &&
          minSupply.power >= needPowerWWithHeadroom(cfg)
        )
        .map(cfg => cfg.cable);

      minimalSupply = { ...minSupply, cables: cablesForMinSupply };
    }

    // 5) Wynik dla jednostki
    result.push({
      controlUnit: unit,
      validCables: validCablesRaw,
      matchingSupplies,
      minimalSupply
    });
  }

  return { error: errors, units: result };
}
