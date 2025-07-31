// Sprawdza, które kable są zgodne z jednostką sterującą i magistralą urządzeń
function checkSystemForPowerSupplyAndCable(controlUnit, busSegments, cables) {
  // Pobiera napięcie zasilania z jednostki sterującej
  const supplyVoltage = controlUnit.description.supplyVoltage;

  // Pobiera maksymalną dopuszczalną moc jednostki sterującej
  const maxPower = controlUnit.description.power;

  // Przechowuje kable, które spełniają wymagania
  const validCables = [];

  // Iteracja po wszystkich dostępnych kablach
  for (const cable of cables) {
    // Ostatnie urządzenie na magistrali
    const lastDevice = busSegments[busSegments.length - 1].detector;

    // Minimalne napięcie na końcu linii – połowa zasilania lub wymagane minimum
    let endVoltage = Math.max(lastDevice.minVoltage_V, supplyVoltage / 2);

    // Krok, o jaki zwiększamy napięcie w każdej iteracji
    const voltageStep = 0.1;

    // Flaga: czy znaleziono poprawny punkt pracy
    let foundWorkingPoint = false;

    // Przechowuje dane podsumowujące poprawny przypadek
    let summary = null;

    // Pętla szukająca punktu pracy od końca linii do początku
    while (endVoltage < supplyVoltage) {
      let voltageAtNode = endVoltage;   // Aktualne napięcie w punkcie
      let currentAtNode = 0;            // Aktualny prąd w punkcie
      let isValid = true;               // Czy konfiguracja jest prawidłowa

      // Iterujemy od końca magistrali do początku
      for (let i = busSegments.length - 1; i >= 0; i--) {
        const segment = busSegments[i];
        const device = segment.detector;

        let deviceCurrent = 0;

        // Oblicz zapotrzebowanie prądowe urządzenia
        if (device.current_A != null && device.power_W != null) {
          deviceCurrent = device.current_A + (device.power_W / voltageAtNode);
        } else if (device.current_A != null) {
          deviceCurrent = device.current_A;
        } else if (device.power_W != null) {
          deviceCurrent = device.power_W / voltageAtNode;
        }

        // Sumujemy prąd całkowity
        let totalCurrent = currentAtNode + deviceCurrent;

        // Oblicz spadek napięcia: R * I * 2 (dla 2 przewodów)
        const resistance = cable.resistivity_OhmPerMeter * (segment.wireLength);
        const voltageDrop = 2 * resistance * totalCurrent;

        // Napięcie wejściowe do urządzenia
        const inputVoltage = voltageAtNode + voltageDrop;

        // Jeśli napięcie jest zbyt niskie – przerywamy
        if (voltageAtNode < device.minVoltage_V) {
          isValid = false;
          break;
        }

        // Przechodzimy do wcześniejszego punktu
        voltageAtNode = inputVoltage;
        currentAtNode = totalCurrent;
      }

      // Jeśli napięcie przekracza zasilanie – zakończ pętlę
      if (voltageAtNode > supplyVoltage) break;

      // Jeśli cały przebieg był poprawny
      if (isValid) {
        const powerW = voltageAtNode * currentAtNode;

        // Jeśli nie przekracza maksymalnej mocy
        if (maxPower === undefined || powerW <= maxPower) {
          foundWorkingPoint = true;

          // Zapamiętaj konfigurację jako działającą
          summary = {
            cable,
            requiredSupplyVoltage: voltageAtNode,
            requiredSupplyCurrent: currentAtNode,
            powerW: powerW
          };
        }
        // Punkt pracy znaleziony – nie iterujemy dalej
        break;
      }

      // Zwiększ napięcie i próbuj ponownie
      endVoltage += voltageStep;
    }

    // Jeśli znaleziono poprawną konfigurację – dodaj kabel do listy
    if (foundWorkingPoint && summary) {
      validCables.push(summary);
    }
  }

  // Zwraca listę działających konfiguracji
  return validCables;
}

// -------- Główna funkcja --------
// Sprawdza, które jednostki sterujące i kable są kompatybilne z daną magistralą
function findValidControlUnitsWithCables(controlUnits, busSegments, cables) {
  // Lista błędów logicznych
  const errors = [];

  // Suma długości całej magistrali
  const totalLength = busSegments.reduce(
    (sum, seg) => sum + seg.wireLength, 0
  );

  // Walidacja długości magistrali
  if (totalLength > 1000) {
    errors.push({
      code: "BUS_TOO_LONG",
      message: "Zbyt długa magistrala! Max 1000m!"
    });
  }

  // Zlicz liczbę sygnalizatorów
  const signallerCount = busSegments.filter(
    seg => seg.detector.class === "signaller"
  ).length;

  // Walidacja: za dużo sygnalizatorów
  if (signallerCount > 26) {
    errors.push({
      code: "TOO_MANY_SIGNALLERS",
      message: "Za dużo sygnalizatorów! Max 26 szt."
    });
  }

  // Zlicz liczbę zaworów
  const valveCount = busSegments.filter(
    seg => seg.detector.type === "valveCtrl"
  ).length;

  // Walidacja: za dużo zaworów
  if (valveCount > 8) {
    errors.push({
      code: "TOO_MANY_VALVES",
      message: "Za dużo sterowników zaworu! Max 8 szt."
    });
  }

  // Szukamy pasujących jednostek sterujących z poprawnymi kablami
  const result = [];

  for (const unit of controlUnits) {
    // Dla każdej jednostki sprawdź dopuszczalne kable
    const validCables = checkSystemForPowerSupplyAndCable(unit, busSegments, cables);

    // Jeśli jakieś pasują – dodaj do wyniku
    if (validCables.length > 0) {
      result.push({
        controlUnit: unit,
        validCables
      });
    }
  }

  // Zwraca zestawienie błędów oraz pasujących jednostek z kablami
  return {
    error: errors,
    units: result
  };
}
