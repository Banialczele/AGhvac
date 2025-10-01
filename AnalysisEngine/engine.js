// ---- Konfiguracja globalna ----
const POWER_RESERVE = 0.15;       // +15% zapasu mocy (PSU i limit wyjściowy CU)
const CU_UTILIZATION_MAX = 0.90;  // maks. wykorzystanie wyjścia CU (90% limitu po rezerwie)

// ---- Pomocnicze ----
function supplyIdentityKey(psu) {
  return `${psu.type}-${psu.description}-${psu.power}-${psu.supplyVoltage}-${psu.batteryCapacity_Ah || 'noBat'}`;
}

function uniqSuppliesStable(powersupplies) {
  const seen = new Set();
  return (powersupplies || []).filter(psu => {
    const key = supplyIdentityKey(psu);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// UWAGA: pickMatchingSupplies używamy dla alternatywnych CU.
// PW-108A NIE filtrujemy tutaj (stosujemy prostą regułę HDR / ZBF>20 w main).
function pickMatchingSupplies(controlUnit, powersupplies, isBackupDesired) {
  const list = uniqSuppliesStable(powersupplies);
  if (!list || !list.length) return [];

  // S-UP300 traktujemy jak z przetwornicą 24→48V, więc dobór PSU do niej robimy jak dla 24 V
  let cuRequiredSupplyVoltage = controlUnit.description?.supplyVoltage;
  if (controlUnit.productKey === "PW-086-Control1-S-UP300") {
    cuRequiredSupplyVoltage = 24;
  }

  return list.filter(psu => {
    if (isBackupDesired ? psu.type !== "ZBF" : psu.type !== "HDR") return false;
    const v = psu.supplyVoltage;
    if (v > 40) return true;                        // np. 42V zasili dowolne CU (48V class po deratingu)
    if (v > 10 && v < 30) return cuRequiredSupplyVoltage === 24; // 21V (24V class) → tylko CU 24V (i S-UP300)
    return false;
  });
}

// --- Model elektryczny magistrali (obciążenie rozłożone wzdłuż przewodu)
// Założenia: urządzenia równomiernie rozmieszczone:
//   spadek na końcu ~ I_total * R_total / 2
//   straty miedzi ~ I_total^2 * R_total / 3
function computeBusElectricals(busSegments, cable, cuBusVoltage_V) {
  const totalBusLength_m = (busSegments || []).reduce((s, seg) => s + (seg.wireLength || 0), 0);
  const R_total_Ohm = (cable.resistivity_OhmPerMeter || 0) * totalBusLength_m;

  const powerDevicesOnly_W = (busSegments || []).reduce(
    (s, seg) => s + (seg?.detector?.power_W || 0),
    0
  );

  const I_total_A = cuBusVoltage_V > 0 ? powerDevicesOnly_W / cuBusVoltage_V : 0;

  const V_drop_end_V = I_total_A * R_total_Ohm * 0.5;
  const V_end_V = cuBusVoltage_V - V_drop_end_V;

  const busVoltageOk = (busSegments || []).every(seg => {
    const vMin = seg?.detector?.minVoltage_V ?? 0;
    return V_end_V >= vMin;
  });

  const P_losses_W = (I_total_A * I_total_A) * R_total_Ohm / 3;

  return {
    powerDevicesOnly_W,
    I_bus_A: I_total_A,
    V_drop_V: V_drop_end_V,
    V_end_V,
    P_losses_W,
    busVoltageOk
  };
}

// --- Walidacja: CU z ZEWNĘTRZNYM zasilaczem + dobór kabla (z 15% zapasem)
// Działa dla PW-108A oraz S/S-UP300 w trybie z ZBF.
function validateSystemWithExternalPSUAndCable(controlUnit, busSegments, cables, externalPSU_W) {
  if (!cables || !cables.length) return null;

  const cuBusVoltage_V = controlUnit.description.supplyVoltage;
  const cuOwnPower_W = (controlUnit.description.powerDemand || 0);

  const sortedCables = [...cables].sort((a, b) => a.priority - b.priority);

  for (const cable of sortedCables) {
    const e = computeBusElectricals(busSegments, cable, cuBusVoltage_V);
    if (!e.busVoltageOk) continue;

    // PSU pokrywa: (urządzenia + straty + własny pobór CU) z rezerwą
    const totalFromPSU_noReserve_W   = e.powerDevicesOnly_W + e.P_losses_W + cuOwnPower_W;
    const totalFromPSU_withReserve_W = totalFromPSU_noReserve_W * (1 + POWER_RESERVE);

    if (externalPSU_W < totalFromPSU_withReserve_W) continue;

    // Limit wyjściowy CU (jeżeli CU go ma) dotyczy tylko magistrali: (urządzenia + straty), z rezerwą
    // oraz dodatkowym headroomem (CU_UTILIZATION_MAX) aby nie dobierać „na styk”.
    const cuLimit_W = (controlUnit.power ?? controlUnit.description?.power ?? 0);
    if (cuLimit_W > 0) {
      const requiredBus_withReserve_W = (e.powerDevicesOnly_W + e.P_losses_W) * (1 + POWER_RESERVE);
      const cuAllowed_W = cuLimit_W * CU_UTILIZATION_MAX;
      if (requiredBus_withReserve_W > cuAllowed_W) continue;
    }

    return {
      cable,
      powerW_devicesOnly: e.powerDevicesOnly_W,
      powerW_totalWithLossesAndReserve: totalFromPSU_withReserve_W,
      voltageAtEnd_V: e.V_end_V
    };
  }
  return null;
}

// --- Walidacja: CU ze WBUDOWANYM zasilaniem + dobór kabla (z 15% zapasem)
// Działa dla S24 / S48-60 / S48-100 / S48-150
function validateSystemWithSelfPoweredCUAndCable(controlUnit, busSegments, cables) {
  // Najpierw normalizujemy limit mocy (pole top-level albo description.power)
  const cuOutputLimit_W = (controlUnit.power ?? controlUnit.description?.power ?? 0);
  if (cuOutputLimit_W <= 0) return null;

  const cuBusVoltage_V = controlUnit.description.supplyVoltage;
  const sortedCables = [...cables].sort((a, b) => a.priority - b.priority);

  for (const cable of sortedCables) {
    const e = computeBusElectricals(busSegments, cable, cuBusVoltage_V);
    if (!e.busVoltageOk) continue;

    // Wbudowany zasilacz CU musi pokryć (urządzenia + straty) z rezerwą oraz headroomem
    const required_withReserve_W = (e.powerDevicesOnly_W + e.P_losses_W) * (1 + POWER_RESERVE);
    const cuAllowed_W = cuOutputLimit_W * CU_UTILIZATION_MAX;

    if (required_withReserve_W <= cuAllowed_W) {
      return {
        cable,
        powerW_devicesOnly: e.powerDevicesOnly_W,
        powerW_totalWithLossesAndReserve: required_withReserve_W,
        voltageAtEnd_V: e.V_end_V
      };
    }
  }
  return null;
}

// --- Najlepsza konfiguracja CU+PSU (pełna iteracja PSU×kabel; minimalna wymagana moc + najcieńszy działający kabel)
function findBestConfigForExternalPSUCU(controlUnit, powerSupplies, busSegments, cables) {
  const sortedPSU = [...(powerSupplies || [])].sort((a, b) => (a.power || 0) - (b.power || 0));
  let bestCfg = null;

  for (const psu of sortedPSU) {
    for (const cable of [...cables].sort((a, b) => a.priority - b.priority)) {
      const cfg = validateSystemWithExternalPSUAndCable(controlUnit, busSegments, [cable], psu.power);
      if (cfg) {
        const candidate = {
          controlUnit,
          powerSupply: { supply: psu, powerRating: psu.power },
          cables: [cable],
          power: cfg.powerW_totalWithLossesAndReserve,
          power_devicesOnly: cfg.powerW_devicesOnly
        };
        if (!bestCfg || candidate.power < bestCfg.power) {
          bestCfg = candidate;
        }
        // dla tego PSU znaleźliśmy najcieńszy działający kabel → nie testujemy grubszych
        break;
      }
    }
  }
  return bestCfg;
}

// --- Najlepsza konfiguracja CU self-powered (z zapasem i headroomem)
function findBestConfigForSelfPoweredCU(controlUnit, busSegments, cables) {
  // Upewnij się, że limit jest na top-level (spójność z walidacją)
  const normalizedCU = {
    ...controlUnit,
    power: (controlUnit.power ?? controlUnit.description?.power ?? 0),
  };
  const cfg = validateSystemWithSelfPoweredCUAndCable(normalizedCU, busSegments, cables);
  if (!cfg) return null;

  return {
    controlUnit: normalizedCU,
    powerSupply: null,
    cables: [cfg.cable],
    power: cfg.powerW_totalWithLossesAndReserve,
    power_devicesOnly: cfg.powerW_devicesOnly
  };
}

// --- Główna funkcja ---
function findConfigsByBackupPolicy(
  CONTROLUNITLIST,
  busSegments,
  cables,
  initSystem,
  powersupplyTMC1, // HDR
  powersupplyMC    // ZBF
) {
  let errors = [];
  let result = {
    pw108AConfig: null,
    alternativeConfig: null,
    systemPower: 0,
    powerForDevicesOnly: 0
  };

  // Proste limity topologii
  const totalBusLength = (busSegments || []).reduce((sum, s) => sum + (s.wireLength || 0), 0);
  const totalSignallers = (busSegments || []).filter(s => s?.detector?.class === "signaller").length;
  const totalValves = (busSegments || []).filter(s => s?.detector?.class === "valveCtrl").length;

  if (busSegments?.length > 0 && totalBusLength > 1000) {
    errors.push({ code: "TOO_LONG_BUS", message: "Za długa magistrala! Max 1000m." });
  }
  if (totalSignallers > 26) {
    errors.push({ code: "TOO_MANY_SIGNALLERS", message: "Za dużo sygnalizatorów! Max 26 szt." });
  }
  if (totalValves > 8) {
    errors.push({ code: "TOO_MANY_VALVES", message: "Za dużo zaworów! Max 8 szt." });
  }
  if (errors.length) return [errors, result];

  const isBackupDesired = String(initSystem?.backup).toLowerCase() === "tak";

  // --- PW-108A (Teta MOD Control 1): zawsze liczona konfiguracja ---
  const cu108A = (CONTROLUNITLIST || []).find(cu => cu.productKey === "PW-108A");
  if (cu108A) {
    let suppliesFor108A = [];
    if (isBackupDesired) {
      // backup = TAK → ZBF 24V-class (po deratingu) → supplyVoltage > 20
      suppliesFor108A = uniqSuppliesStable((powersupplyMC || []).filter(psu => (psu.supplyVoltage || 0) > 20));
    } else {
      // backup = NIE → wszystkie HDR
      suppliesFor108A = uniqSuppliesStable(powersupplyTMC1 || []);
    }
    result.pw108AConfig = findBestConfigForExternalPSUCU(cu108A, suppliesFor108A, busSegments, cables);
  }

  // --- Alternatywa ---
  let alternativeCUCandidates = [];
  let alternativeConfig = null;

  if (isBackupDesired) {
    // Backup TAK → alternatywa: Teta Control 1-S (24V) lub Teta Control 1-S-UP300 (48V z przetwornicą 24→48)
    const cuS       = (CONTROLUNITLIST || []).find(cu => cu.productKey === "PW-086-Control1-S");
    const cuSUPS300 = (CONTROLUNITLIST || []).find(cu => cu.productKey === "PW-086-Control1-S-UP300");
    if (cuS)       alternativeCUCandidates.push(cuS);
    if (cuSUPS300) alternativeCUCandidates.push(cuSUPS300);

    const zbf24Class = uniqSuppliesStable((powersupplyMC || []).filter(psu => (psu.supplyVoltage || 0) > 20));
    for (const cu of alternativeCUCandidates) {
      const cfg = findBestConfigForExternalPSUCU(cu, zbf24Class, busSegments, cables);
      if (cfg) { alternativeConfig = cfg; break; } // „najmniejsza spełniająca” wg kolejności kandydatów
    }
  } else {
    // Backup NIE → alternatywa to self-powered: S24, S48-60, S48-100, S48-150 (najmniejsza spełniająca)
    const cuS24     = (CONTROLUNITLIST || []).find(cu => cu.productKey === "PW-086-Control1-S24");
    const cuS48_60  = (CONTROLUNITLIST || []).find(cu => cu.productKey === "PW-086-Control1-S48-60");
    const cuS48_100 = (CONTROLUNITLIST || []).find(cu => cu.productKey === "PW-086-Control1-S48-100");
    const cuS48_150 = (CONTROLUNITLIST || []).find(cu => cu.productKey === "PW-086-Control1-S48-150");

    if (cuS24)     alternativeCUCandidates.push(cuS24);
    if (cuS48_60)  alternativeCUCandidates.push(cuS48_60);
    if (cuS48_100) alternativeCUCandidates.push(cuS48_100);
    if (cuS48_150) alternativeCUCandidates.push(cuS48_150);

    // sort po limicie wyjściowym (rosnąco), normalizując power z description.power
    alternativeCUCandidates.sort((a, b) =>
      ((a.power ?? a.description?.power ?? 0) - (b.power ?? b.description?.power ?? 0))
    );

    for (const cu of alternativeCUCandidates) {
      const norm = { ...cu, power: (cu.power ?? cu.description?.power ?? 0) };
      const cfg = findBestConfigForSelfPoweredCU(norm, busSegments, cables);
      if (cfg) { alternativeConfig = cfg; break; }
    }
  }

  result.alternativeConfig = alternativeConfig;

  // --- Podsumowanie mocy systemu (wybierz mniejszą z dwóch, już z rezerwą) ---
  const pick = (a, b) => {
    if (a && b) return a.power <= b.power ? a : b;
    return a || b || null;
  };
  const chosen = pick(result.pw108AConfig, result.alternativeConfig);
  if (chosen) {
    result.systemPower = chosen.power;                 // zawiera +15% rezerwy
    result.powerForDevicesOnly = chosen.power_devicesOnly; // suma mocy urządzeń (bez rezerwy i strat CU)
  }

  return [errors, result];
}