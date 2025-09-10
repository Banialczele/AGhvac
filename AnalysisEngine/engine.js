// Zwraca stabilny identyfikator zasilacza używany jako klucz mapy (id/sku lub zlep cech)
function supplyIdentityKey(s) {
  // Zwróć id jeżeli istnieje, inaczej sku, inaczej sklejone cechy tekstowe
  return (
    s.id ??
    s.sku ??
    [
      s.brand ?? "",
      s.model ?? "",
      s.supplyVoltage ?? "",
      s.power ?? "",
      s.type ?? ""
    ].join("|")
  );
}

// Usuwa duplikaty zasilaczy (po kluczu z supplyIdentityKey), zachowując pierwszy napotkany
function uniqSuppliesStable(list) {
  // Tworzy pustą mapę do deduplikacji
  const map = new Map();
  // Iteruje po wszystkich elementach listy
  for (const s of list) {
    // Wylicza klucz tożsamości dla danego zasilacza
    const key = supplyIdentityKey(s);
    // Dodaje do mapy tylko jeśli klucz nie występuje (pierwsze wystąpienie wygrywa)
    if (!map.has(key)) map.set(key, s);
  }
  // Zwraca tablicę unikalnych zasilaczy
  return Array.from(map.values());
}

// Dobiera zasilacze spełniające wymagania U i P oraz opcjonalnie runtime (dla bateryjnych)
function pickMatchingSupplies(
  suppliesList,
  requiredVoltage,
  requiredPowerW,
  { isBatteryList = false, minBackupHours = 0, powerHeadroom = 1.0 } = {}
) {
  // Gdy brak poprawnej listy – zwróć pustą tablicę
  if (!Array.isArray(suppliesList)) return [];
  // Wylicza zapotrzebowanie mocy powiększone o zapas
  const needPowerW = requiredPowerW * powerHeadroom;

  // Filtruje listę po U i P oraz wylicza runtime dla bateryjnych
  const augmented = suppliesList
    // Przepuszcza tylko zasilacze z wystarczającym napięciem i mocą
    .filter(s => (s.supplyVoltage ?? 0) >= requiredVoltage && (s.power ?? 0) >= needPowerW)
    // Dla list bateryjnych dociąża obiekt o szacowany runtime, dla pozostałych zwraca kopię
    .map(s => {
      // Dla zwykłych zasilaczy zwróć kopię obiektu bez runtime
      if (!isBatteryList) return { ...s };
      // Odczytuje pojemność, dopuszczalne rozładowanie i sprawność
      const Ah = s.batteryCapacity_Ah;
      const DoD = (s.usableDoD ?? 0.8);
      const eff = (s.efficiency ?? 0.9);
      // Jeżeli brak danych o pojemności – runtime nieznany
      if (Ah == null) return { ...s, estimatedRuntime_h: null };
      // Oblicza przybliżony runtime z równania energetycznego
      const runtime = (Ah * DoD * s.supplyVoltage * eff) / needPowerW;
      // Zwraca kopię zasilacza z zaokrąglonym runtime
      return { ...s, estimatedRuntime_h: Number(runtime.toFixed(2)) };
    });

  // Jeśli wymagamy runtime – filtruje po minimalnym czasie podtrzymania, inaczej zostawia jak jest
  const filtered = (isBatteryList && minBackupHours > 0)
    ? augmented.filter(s => s.estimatedRuntime_h != null && s.estimatedRuntime_h >= minBackupHours)
    : augmented;

  // Sortuje rosnąco po mocy i zwraca
  return filtered.sort((a, b) => (a.power ?? 0) - (b.power ?? 0));
}

// Sprawdza konfiguracje kabli dla CU: czy napięciowo i mocowo domyka się linia
function checkSystemForPowerSupplyAndCable(controlUnit, busSegments, cables) {
  // Przy pustej magistrali nie ma co liczyć – zwróć pustą tablicę
  if (!Array.isArray(busSegments) || busSegments.length === 0) return [];

  // Pobiera napięcie zasilania z opisu jednostki
  const supplyVoltage = controlUnit.description.supplyVoltage;
  // Ustala limit mocy CU (0/null oznacza brak limitu – Infinity)
  const rawMaxPower = controlUnit.description.power;
  // Ustala maksymalną moc dozwoloną przez CU
  const maxPower = (rawMaxPower === 0 || rawMaxPower == null) ? Infinity : rawMaxPower;

  // Definiuje stałą strat mocy CU (W)
  const CONTROL_UNIT_LOSSES_W = 3;
  // Tworzy kolekcję poprawnych konfiguracji kabli
  const validCables = [];

  // Iteruje po wszystkich typach kabli
  for (const cable of cables) {
    // Pobiera ostatnie urządzenie na linii
    const lastDevice = busSegments[busSegments.length - 1].detector;
    // Startuje skan napięcia końca linii od max(minV urządzenia, połowy napięcia zasilania)
    let endVoltage = Math.max(lastDevice.minVoltage_V, supplyVoltage / 2);
    // Ustala krok skanowania napięcia
    const voltageStep = 0.1;

    // Flaga znalezienia punktu pracy dla danego kabla
    let foundWorkingPoint = false;
    // Struktura podsumowania dla znalezionego punktu
    let summary = null;

    // Przesuwa napięcie końca linii w górę aż do napięcia zasilania
    while (endVoltage < supplyVoltage) {
      // Ustawia napięcie w aktualnym węźle na końcowe
      let voltageAtNode = endVoltage;
      // Ustawia prąd w aktualnym węźle na zero
      let currentAtNode = 0;
      // Zakłada, że konfiguracja jest poprawna, dopóki nie znajdziemy naruszenia
      let isValid = true;

      // Idzie od końca magistrali do początku, sumując prądy i spadki
      for (let i = busSegments.length - 1; i >= 0; i--) {
        // Pobiera segment linii
        const segment = busSegments[i];
        // Pobiera urządzenie na tym segmencie
        const device = segment.detector;

        // Inicjuje prąd urządzenia
        let deviceCurrent = 0;
        // Gdy mamy zarówno prąd, jak i moc – sumuje prąd bezpośredni i wynik z mocy/U
        if (device.current_A != null && device.power_W != null) {
          deviceCurrent = device.current_A + (device.power_W / voltageAtNode);
          // Gdy mamy tylko prąd – używa go wprost
        } else if (device.current_A != null) {
          deviceCurrent = device.current_A;
          // Gdy mamy tylko moc – przelicza na prąd przez dzielenie przez U
        } else if (device.power_W != null) {
          deviceCurrent = device.power_W / voltageAtNode;
        }

        // Sumuje prąd na węźle (bieżący + urządzenia)
        const totalCurrent = currentAtNode + deviceCurrent;
        // Oblicza rezystancję odcinka przewodu
        const resistance = cable.resistivity_OhmPerMeter * segment.wireLength;
        // Liczy spadek napięcia na dwóch żyłach
        const voltageDrop = 2 * resistance * totalCurrent;
        // Oblicza napięcie wejściowe do poprzedniego węzła
        const inputVoltage = voltageAtNode + voltageDrop;

        // Weryfikuje, czy napięcie na urządzeniu nie spadło poniżej minimalnego
        if (voltageAtNode < device.minVoltage_V) { isValid = false; break; }

        // Przenosi punkt obliczeń na poprzedni węzeł
        voltageAtNode = inputVoltage;
        // Zapamiętuje prąd skumulowany na poprzednim węźle
        currentAtNode = totalCurrent;
      }

      // Jeżeli napięcie na początku przekroczy zasilanie – kończy skan
      if (voltageAtNode > supplyVoltage) break;

      // Jeśli konfiguracja spełniła warunki napięciowe – podsumuj punkt pracy
      if (isValid) {
        // Liczy moc linii na początku (bez strat CU)
        const powerW = voltageAtNode * currentAtNode;
        // Dodaje straty CU do mocy linii
        const powerWithLossesW = powerW + CONTROL_UNIT_LOSSES_W;

        // Sprawdza, czy moc z uwzględnieniem strat mieści się w limicie CU
        if (powerWithLossesW <= maxPower) {
          // Zaznacza, że znaleziono działający punkt
          foundWorkingPoint = true;
          // Zapisuje podsumowanie działającej konfiguracji
          summary = {
            cable,
            requiredSupplyVoltage: voltageAtNode,
            requiredSupplyCurrent: currentAtNode,
            powerW,
            controlUnitLossesW: CONTROL_UNIT_LOSSES_W,
            powerWithLossesW
          };
        }
        // Kończy skanowanie dla tego kabla po pierwszym poprawnym punkcie
        break;
      }

      // Zwiększa napięcie końca linii o krok i próbuje ponownie
      endVoltage += voltageStep;
    }

    // Jeżeli znaleziono działający punkt – dodaje konfigurację do wyniku
    if (foundWorkingPoint && summary) validCables.push(summary);
  }

  // Zwraca listę działających konfiguracji kabli dla tej CU
  return validCables;
}

// Buduje wynik wg polityki backupu i zwraca w oczekiwanym kształcie dokumentu
// Buduje wynik wg polityki backupu i dokleja do każdego controlUnit tablicę kabli
// backup === NIE/NO
//  • JS z power>0, które SAME zasilą system (po teście kablowym).
//  • JS z power===0 + HDR (lista powersupplyTMC1) – retakt przy napięciu HDR.
//
// backup === TAK/YES
//  • JS z power>0, które SAME zasilą system + LISTA ZBF/MC (lista powersupplyMC) do PODTRZYMANIA,
//    selekcja TYLKO po mocy (z headroomem) i runtime — IGNORUJEMY napięcie linii.
//    (Tu CU dalej zasila 48 V, MC to wyłącznie backup energii.)
//  • JS z power===0 + MC (lista powersupplyMC) – retakt przy napięciu MC i wymóg runtime (bo MC zasila linię).
//
function findConfigsByBackupPolicy(
  CONTROLUNITLIST,
  busSegments,
  cables,
  initSystem,
  powersupplyTMC1,
  powersupplyMC
) {
  // === MODYFIKACJA: Dodatkowe filtrowanie jednostek bez wbudowanego zasilacza ===
  const filteredControlUnitList = CONTROLUNITLIST.filter(cu => 
    (cu.description.power ?? 0) > 0 || cu.type === "Teta MOD Control 1"
  );
  
  // === Walidacje jak wcześniej ===
  const errors = [];
  const totalLength = Array.isArray(busSegments)
    ? busSegments.reduce((sum, seg) => sum + (seg.wireLength ?? 0), 0)
    : 0;
  if (totalLength > 1000) {
    errors.push({ code: "BUS_TOO_LONG", message: "Zbyt długa magistrala! Max 1000m!" });
  }

  const signallerCount = Array.isArray(busSegments)
    ? busSegments.filter(seg => seg?.detector?.class === "signaller").length
    : 0;
  if (signallerCount > 26) {
    errors.push({ code: "TOO_MANY_SIGNALLERS", message: "Za dużo sygnalizatorów! Max 26 szt." });
  }

  const valveCount = Array.isArray(busSegments)
    ? busSegments.filter(seg => seg?.detector?.type === "valveCtrl").length
    : 0;
  if (valveCount > 8) {
    errors.push({ code: "TOO_MANY_VALVES", message: "Za dużo sterowników zaworu! Max 8 szt." });
  }

  // === Logika doboru (bez zmian) ===
  const b = String(initSystem?.backup || "").trim().toLowerCase();
  const wantsBackup = (b === "tak" || b === "yes");
  const mode = wantsBackup ? "Yes" : "No";

  const minBackupHours = initSystem?.minBackupHours ?? 0;
  const powerHeadroom = initSystem?.powerHeadroom ?? 1.0;

  const sortByCablePriority = (a, b) =>
    (a?.cable?.priority ?? Number.POSITIVE_INFINITY) - (b?.cable?.priority ?? Number.POSITIVE_INFINITY);

  const recheckWithSupplyVoltage = (js, psu) => {
    const cloned = { ...js, description: { ...js.description, supplyVoltage: psu.supplyVoltage, power: Infinity } };
    return checkSystemForPowerSupplyAndCable(cloned, busSegments, cables);
  };

  let builtInCandidates = [];     // { js, cable, cables, bestPowerW, maxPowerW }
  let moduleHDRCandidates = [];   // { js, supply, cable, cables, powerW }
  let moduleMCCandidates = [];    // { js, supply, cable, cables, powerW }
  let builtInMCCandidates = [];   // { js, supply }

  for (const js of filteredControlUnitList) { // Zmienione: iteracja po przefiltrowanej liście
    const hasBuiltInPower = (js?.description?.power ?? 0) > 0;

    if (hasBuiltInPower) {
      const cfgs = checkSystemForPowerSupplyAndCable(js, busSegments, cables);
      if (Array.isArray(cfgs) && cfgs.length > 0) {
        const sorted = [...cfgs].sort(sortByCablePriority);
        const bestCfg = sorted[0];

        const cablesWithPower = cfgs.map(c => ({
          ...c.cable,
          power: Math.ceil(c.powerWithLossesW)
        }));

        const bestPowerW = bestCfg.powerWithLossesW;
        const maxPowerW = cfgs.reduce((m, c) => Math.max(m, c.powerWithLossesW), 0);

        builtInCandidates.push({
          js,
          cable: bestCfg.cable,
          cables: cablesWithPower,
          bestPowerW,
          maxPowerW
        });

        if (wantsBackup) {
          const needBackupW = maxPowerW * powerHeadroom;
          const mcOptions = [...powersupplyMC]
            .sort((a, b) => (a.power ?? 0) - (b.power ?? 0))
            .filter(psu => (psu.power ?? 0) >= needBackupW)
            .filter(psu => {
              if (minBackupHours <= 0) return true;
              return pickMatchingSupplies([psu], 0, needBackupW, {
                isBatteryList: true, minBackupHours, powerHeadroom: 1.0
              }).length > 0;
            })
            .map(psu => ({ js, supply: psu }));
          builtInMCCandidates.push(...mcOptions);
        }
      }
    } else {
      if (!wantsBackup) {
        for (const psu of powersupplyTMC1) {
          const cfgs = recheckWithSupplyVoltage(js, psu);
          if (!Array.isArray(cfgs) || cfgs.length === 0) continue;
          const sorted = [...cfgs].sort(sortByCablePriority);
          const chosenCfg = sorted.find(cfg => (psu.power ?? 0) >= (cfg.powerWithLossesW * powerHeadroom));
          if (chosenCfg) {
            const cablesWithPower = cfgs.map(c => ({
              ...c.cable,
              power: Math.ceil(c.powerWithLossesW)
            }));
            moduleHDRCandidates.push({
              js,
              supply: psu,
              cable: chosenCfg.cable,
              cables: cablesWithPower,
              powerW: chosenCfg.powerWithLossesW
            });
          }
        }
      } else {
        for (const psu of powersupplyMC) {
          const cfgs = recheckWithSupplyVoltage(js, psu);
          if (!Array.isArray(cfgs) || cfgs.length === 0) continue;
          const sorted = [...cfgs].sort(sortByCablePriority);
          const chosenCfg = sorted.find(cfg => {
            const needW = cfg.powerWithLossesW * powerHeadroom;
            if ((psu.power ?? 0) < needW) return false;
            return pickMatchingSupplies([psu], cfg.requiredSupplyVoltage, cfg.powerWithLossesW, {
              isBatteryList: true, minBackupHours, powerHeadroom
            }).length > 0;
          });
          if (chosenCfg) {
            const cablesWithPower = cfgs.map(c => ({
              ...c.cable,
              power: Math.ceil(c.powerWithLossesW)
            }));
            moduleMCCandidates.push({
              js,
              supply: psu,
              cable: chosenCfg.cable,
              cables: cablesWithPower,
              powerW: chosenCfg.powerWithLossesW
            });
          }
        }
      }
    }
  }

  const byPsuPowerAsc = (a, b) => ((a?.supply?.power ?? Infinity) - (b?.supply?.power ?? Infinity));
  const byCableThenPower = (a, b) => {
    const cp = sortByCablePriority(a, b);
    if (cp !== 0) return cp;
    return byPsuPowerAsc(a, b);
  };

  const bestBuiltIn = [...builtInCandidates].sort((a, b) => sortByCablePriority(a, b))[0] || null;
  const bestHDR = !wantsBackup ? ([...moduleHDRCandidates].sort(byCableThenPower)[0] || null) : null;
  const bestMC_forModule = wantsBackup ? ([...moduleMCCandidates].sort(byCableThenPower)[0] || null) : null;

  const builtInMCOptionsForBest =
    wantsBackup && bestBuiltIn
      ? [...builtInMCCandidates].filter(x => x.js === bestBuiltIn.js).sort(byPsuPowerAsc)
      : [];
  const bestBuiltInMC = builtInMCOptionsForBest[0] || null;

  const builtInPowerW = (bestBuiltIn && typeof bestBuiltIn.bestPowerW === "number")
    ? Math.ceil(bestBuiltIn.bestPowerW)
    : null;

  const hdrPowerW = (bestHDR && typeof bestHDR.powerW === "number")
    ? Math.ceil(bestHDR.powerW)
    : null;

  const mcPowerW = (bestMC_forModule && typeof bestMC_forModule.powerW === "number")
    ? Math.ceil(bestMC_forModule.powerW)
    : null;

  const systemPower =
    !wantsBackup
      ? (builtInPowerW ?? hdrPowerW ?? null)
      : (builtInPowerW ?? mcPowerW ?? null);

  // === Złożenie wyniku ===
  const result =
    !wantsBackup
      ? {
        mode: "No",
        systemPower,
        controlUnitWithBuiltInSupply: {
          controlUnit: bestBuiltIn ? { ...bestBuiltIn.js } : {},
          cables: bestBuiltIn ? bestBuiltIn.cables : [],
          powerSupply: bestBuiltIn ? { supply: bestBuiltIn.js.description, cable: bestBuiltIn.cable} : {},
          power: builtInPowerW
        },
        controlUnitWithoutSupply: {
          controlUnit: bestHDR ? { ...bestHDR.js } : {},
          cables: bestHDR ? bestHDR.cables : [],
          powerSupply: bestHDR ? { supply: bestHDR.supply, cable: bestHDR.cable } : {},
          power: hdrPowerW
        }
      }
      : {
        mode: "Yes",
        systemPower,
        controlUnitWithBuiltInSupply: {
          controlUnit: bestBuiltIn ? { ...bestBuiltIn.js } : {},
          cables: bestBuiltIn ? bestBuiltIn.cables : [],
          powerSupply: bestBuiltInMC ? { supply: bestBuiltInMC.supply, cable: bestBuiltInMC.cable } : {},
          power: builtInPowerW
        },
        controlUnitWithoutSupply: {
          controlUnit: bestMC_forModule ? { ...bestMC_forModule.js } : {},
          cables: bestMC_forModule ? bestMC_forModule.cables : [],
          powerSupply: bestMC_forModule ? { supply: bestMC_forModule.supply, cable: bestMC_forModule.cable } : {},
          power: mcPowerW
        }
      };

  // === Kompatybilny zwrot: [errors, result] ===
  return [errors, result];
}