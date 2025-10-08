/* ============================================================================
   ENGINE.JS — Silnik doboru jednostek sterujących (CU) i zasilaczy (PSU)
   Wersja inżynierska — zoptymalizowana pod kątem fizyki, stabilności i zapasu mocy

   PRZYJĘTE NORMY I ZAPASY BEZPIECZEŃSTWA:
   ----------------------------------------
   • Rezerwa mocy systemu:
       - Systemy standardowe (backup = nie): +20% zapasu
       - Systemy z podtrzymaniem (backup = tak): +30% zapasu (tryb 24/7, systemy bezpieczeństwa)
   • Maksymalne wykorzystanie jednostki sterującej: 100%
   • Margines napięcia magistrali: +5% (inżynierska tolerancja)
   • Granica stabilności: napięcie na końcu magistrali (V_end) nie może spaść poniżej ½ napięcia zasilającego (po marginesie)
   • Długość magistrali: maksymalnie 1000 m
============================================================================ */

const POWER_RESERVE = 0.20;
const BACKUP_RESERVE = 0.30;
const CU_UTILIZATION_MAX = 1.00;
const VOLTAGE_MARGIN = 1.05;

function toNumber(x, def = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

function uniqByKey(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr || []) {
    const k = keyFn(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

function supplyIdentityKey(psu) {
  return `${psu.type}|${psu.description}|${psu.power}|${psu.supplyVoltage}|${psu.batteryCapacity_Ah || 'noBat'}`;
}

function pickCablesByPriority(cables) {
  return [...(cables || [])].sort((a, b) => (toNumber(a.priority, 9999) - toNumber(b.priority, 9999)));
}

function isPSUCompatibleWithCU(cu, psu) {
  if (!cu || !psu) return false;
  if (!Number.isFinite(psu.power) || psu.power <= 0) return false;
  const psuType = String(psu?.type || "").toUpperCase();
  const isBackupCU = ["PW-086-Control1-S", "PW-086-Control1-S-UP300"].includes(cu.productKey);
  const isPW108A = cu.productKey === "PW-108A";
  if (isBackupCU || isPW108A) return psuType === "ZBF" || psuType === "HDR";
  return true;
}

function computeBusElectricals(busSegments, cable, cuBusVoltage_V) {
  const totalBusLength_m = (busSegments || []).reduce((s, seg) => s + (toNumber(seg?.wireLength, 0)), 0);
  const R_total_Ohm = toNumber(cable?.resistivity_OhmPerMeter, 0) * totalBusLength_m;

  const powerDevicesOnly_W = (busSegments || []).reduce(
    (s, seg) => s + (toNumber(seg?.detector?.power_W, 0)),
    0
  );

  const I_total_A = cuBusVoltage_V > 0 ? (powerDevicesOnly_W / cuBusVoltage_V) : 0;
  const V_drop_end_V = I_total_A * R_total_Ohm * 0.5;
  let V_end_V = cuBusVoltage_V - V_drop_end_V;
  V_end_V = Math.ceil(V_end_V * 10) / 10;

  const minDeviceVoltage = (busSegments || []).reduce((mx, seg) => {
    const v = toNumber(seg?.detector?.minVoltage_V, 0);
    return Math.max(mx, v);
  }, 0);

  const stabilityThreshold = Math.max(minDeviceVoltage, cuBusVoltage_V / 2);
  const busVoltageOk = (V_end_V * VOLTAGE_MARGIN) >= stabilityThreshold;
  const P_losses_W = (I_total_A * I_total_A) * R_total_Ohm / 3;

  return {
    totalBusLength_m,
    powerDevicesOnly_W,
    I_bus_A: I_total_A,
    V_drop_V: V_drop_end_V,
    V_end_V,
    P_losses_W,
    busVoltageOk
  };
}

function validateSelfPoweredCU(cu, busSegments, cable) {
  const cuOutLimit_W = toNumber(cu?.power ?? cu?.description?.power, 0);
  if (cuOutLimit_W <= 0) return null;

  const cuBusVoltage_V = toNumber(cu?.description?.supplyVoltage, 0);
  const cuOwn_W = toNumber(cu?.description?.powerDemand, 0);
  const e = computeBusElectricals(busSegments, cable, cuBusVoltage_V);
  if (!e.busVoltageOk) return null;

  const total_noReserve_W = e.powerDevicesOnly_W + e.P_losses_W + cuOwn_W;
  const requiredWithReserve_W = total_noReserve_W * (1 + POWER_RESERVE);
  const cuAllowed_W = cuOutLimit_W * CU_UTILIZATION_MAX;

  if (requiredWithReserve_W <= cuAllowed_W) {
    return {
      cable,
      powerW_devicesOnly: e.powerDevicesOnly_W,
      powerW_totalWithoutReserve: total_noReserve_W, // 🟢 nowa wartość
      powerW_totalWithLossesAndReserve: requiredWithReserve_W,
      voltageAtEnd_V: e.V_end_V,
      P_losses_W: e.P_losses_W
    };
  }
  return null;
}

function validateCUWithExternalPSU(cu, psu, busSegments, cable, isBackup) {
  if (!isPSUCompatibleWithCU(cu, psu)) return null;

  const cuBusVoltage_V = toNumber(cu?.description?.supplyVoltage, 0);
  const cuOwn_W = toNumber(cu?.description?.powerDemand, 0);
  const cuOutLimit_W = toNumber(cu?.power ?? cu?.description?.power, 0);

  const e = computeBusElectricals(busSegments, cable, cuBusVoltage_V);
  if (!e.busVoltageOk) return null;

  const reserve = isBackup ? BACKUP_RESERVE : POWER_RESERVE;
  const totalFromPSU_noReserve_W = e.powerDevicesOnly_W + e.P_losses_W + cuOwn_W;
  const totalFromPSU_withReserve_W = totalFromPSU_noReserve_W * (1 + reserve);
  const psuPower_W = toNumber(psu?.power, 0);

  if (psuPower_W + 1e-9 < totalFromPSU_withReserve_W) return null;
  if (cuOutLimit_W > 0) {
    const allowed = cuOutLimit_W * CU_UTILIZATION_MAX;
    if ((e.powerDevicesOnly_W + e.P_losses_W) * (1 + reserve) > allowed) return null;
  }

  return {
    cable,
    powerW_devicesOnly: e.powerDevicesOnly_W,
    powerW_totalWithoutReserve: totalFromPSU_noReserve_W, // 🟢 nowa wartość
    powerW_totalWithLossesAndReserve: totalFromPSU_withReserve_W,
    voltageAtEnd_V: e.V_end_V,
    P_losses_W: e.P_losses_W
  };
}

function findConfigsByBackupPolicy(
  CONTROLUNITLIST,
  busSegments,
  cables,
  initSystem,
  powersupplyTMC1,
  powersupplyMC
) {
  const errors = [];
  const isBackupDesired = String(initSystem?.backup || "").trim().toLowerCase() === "tak";

  const totalBusLength_m = (busSegments || []).reduce((s, seg) => s + toNumber(seg?.wireLength, 0), 0);
  if (totalBusLength_m > 1000)
    errors.push({ code: "BUS_TOO_LONG", message: "Za długa magistrala (>1000 m)." });

  const cablesByPriority = pickCablesByPriority(cables);

  const SELF_POWERED_KEYS = [
    "PW-086-Control1-S24",
    "PW-086-Control1-S48-60",
    "PW-086-Control1-S48-100",
    "PW-086-Control1-S48-150"
  ];

  const BACKUP_CU_KEYS = [
    "PW-086-Control1-S",
    "PW-086-Control1-S-UP300"
  ];

  const cuCandidates = isBackupDesired
    ? BACKUP_CU_KEYS.map(k => (CONTROLUNITLIST || []).find(cu => cu?.productKey === k)).filter(Boolean)
    : SELF_POWERED_KEYS.map(k => (CONTROLUNITLIST || []).find(cu => cu?.productKey === k)).filter(Boolean);

  let powerSupply = null;

  for (const cable of cablesByPriority) {
    if (!cable) continue;

    if (!isBackupDesired) {
      const feasible = [];
      for (const cu of cuCandidates) {
        const cfg = validateSelfPoweredCU(cu, busSegments, cable);
        if (cfg) {
          const totalCost = toNumber(cable.pricePerM, 0) * totalBusLength_m + toNumber(cu.price, 0);
          feasible.push({
            controlUnit: cu,
            powerSupply: null,
            cable,
            totalCost,
            systemPower: cfg.powerW_totalWithLossesAndReserve,
            systemPowerNoReserve: cfg.powerW_totalWithoutReserve, // 🟢
            powerForDevicesOnly: cfg.powerW_devicesOnly,
            V_end_V: cfg.voltageAtEnd_V,
            P_losses_W: cfg.P_losses_W
          });
        }
      }
      if (feasible.length) {
        feasible.sort((a, b) => (a.totalCost - b.totalCost) || (a.P_losses_W - b.P_losses_W));
        powerSupply = feasible[0];
        break;
      }
    } else {
      const suppliesZBF = uniqByKey(
        (powersupplyMC || []).filter(psu => String(psu?.type).toUpperCase() === "ZBF"),
        supplyIdentityKey
      );

      const feasible = [];
      for (const cu of cuCandidates) {
        for (const psu of suppliesZBF) {
          const cfg = validateCUWithExternalPSU(cu, psu, busSegments, cable, true);
          if (!cfg) continue;

          const totalCost =
            toNumber(cable.pricePerM, 0) * totalBusLength_m +
            toNumber(cu.price, 0) +
            toNumber(psu.price, 0);

          feasible.push({
            controlUnit: cu,
            powerSupply: { supply: psu, powerRating: toNumber(psu.power, 0) },
            cable,
            totalCost,
            systemPower: cfg.powerW_totalWithLossesAndReserve,
            systemPowerNoReserve: cfg.powerW_totalWithoutReserve, // 🟢
            powerForDevicesOnly: cfg.powerW_devicesOnly,
            V_end_V: cfg.voltageAtEnd_V,
            P_losses_W: cfg.P_losses_W
          });
        }
      }
      if (feasible.length) {
        feasible.sort((a, b) => (a.totalCost - b.totalCost) || (a.P_losses_W - b.P_losses_W));
        powerSupply = feasible[0];
        break;
      }
    }
  }

  if (!powerSupply)
    errors.push({ code: "NO_MAIN_CONFIG", message: "Nie udało się dobrać głównej konfiguracji (CU [+PSU])." });

  const cu108A = (CONTROLUNITLIST || []).find(cu => cu?.productKey === "PW-108A");
  let alternativeConfig = null;

  if (!cu108A) {
    errors.push({ code: "PW108A_MISSING", message: "Brak PW-108A w CONTROLUNITLIST." });
  } else {
    const suppliesFor108A = isBackupDesired
      ? uniqByKey((powersupplyMC || []).filter(psu => String(psu?.type).toUpperCase() === "ZBF"), supplyIdentityKey)
      : uniqByKey((powersupplyTMC1 || []).filter(psu => String(psu?.type).toUpperCase() === "HDR"), supplyIdentityKey);

    const altCandidates = [];
    for (const cable of cablesByPriority) {
      for (const psu of suppliesFor108A) {
        const cfg = validateCUWithExternalPSU(cu108A, psu, busSegments, cable, isBackupDesired);
        if (!cfg) continue;

        const totalCost =
          toNumber(cable.pricePerM, 0) * totalBusLength_m +
          toNumber(cu108A.price, 0) +
          toNumber(psu.price, 0);

        altCandidates.push({
          controlUnit: cu108A,
          powerSupply: { supply: psu, powerRating: toNumber(psu.power, 0) },
          cable,
          totalCost,
          systemPower: cfg.powerW_totalWithLossesAndReserve,
          systemPowerNoReserve: cfg.powerW_totalWithoutReserve, // 🟢
          powerForDevicesOnly: cfg.powerW_devicesOnly,
          V_end_V: cfg.voltageAtEnd_V,
          P_losses_W: cfg.P_losses_W
        });
      }
      if (altCandidates.length) break;
    }

    if (altCandidates.length) {
      altCandidates.sort((a, b) => (a.totalCost - b.totalCost) || (a.P_losses_W - b.P_losses_W));
      alternativeConfig = altCandidates[0];
    } else {
      errors.push({
        code: "PW108A_NO_CONFIG",
        message: "Nie udało się dobrać alternatywy PW-108A + PSU."
      });
    }
  }

  return [errors, { alternativeConfig, powerSupply }];
}
