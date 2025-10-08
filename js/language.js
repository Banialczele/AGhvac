const TRANSLATION = {
  configuratorHeader: {
    pl: "Konfigurator Systemów",
    en: "System Configurator",
  },
  teta: "Teta",
  gas: "Gas",
  configuratorDescription: {
    pl: "REWIZJA",
    en: "REVISION",
  },
  tetaGasGuidance: {
    pl: "Przewodnik TetaGas",
    en: "TetaGas guidance",
  },
  detectedGas: {
    pl: "Wykrywany gaz",
    en: "Gas detected",
  },
  batteryBackUpYes: {
    pl: "Tak",
    en: "Yes",
  },
  buildingInformation: {
    pl: "Proszę wybrać rodzaj instalacji",
    en: "Please choose the type of installation"
  },
  detectedGasInformation: {
    pl: "Proszę wybrać gaz jaki będzie wykrywany przez system",
    en: "Please select main gas to be detected"
  },
  batteryBackUpInformation: {
    pl: "Proszę wybrać czy jednostka sterująca powinna mieć akumulatorowe podtrzymanie pracy",
    en: "Please choose if control unit module should have built-in UPS. "
  },
  wireLengthInformation: {
    pl: "Orientacyjna odległość ( długość przewodu ) pomiędzy urządeniami na magistrali. Przykładowo, w garażach podziemnych pomiędzy dwoma czujnikami CO przyjmuje się średnio 20m. ",
    en: "Approximate distance ( cable length ) between two devices on the bus. For example, in underground garages, the average distance between two CO detectors is 20m."
  },
  batteryBackUpNo: {
    pl: "Nie",
    en: "No",
  },
  dwgSchema: {
    pl: "Schematy DWG dla projektanta",
    en: "DWG schemes for designer",
  },
  contact: { pl: "Kontakt", en: "Contact" },
  shop: { pl: "Sklep", en: "Main Page" },
  confirmButton: { pl: "Zatwierdź ▶", en: "Confirm ▶" },
  defaultHeader: { pl: "Dane podstawowe", en: "Default data" },
  detectorAmountsLabel: { pl: "Ilość czujników", en: "Detector quantity" },
  quantity: { pl: " szt.", en: " pcs." },
  shadedAmount: { pl: "(max 50szt.)", en: "(max 50pcs.)" },
  structureLabel: { pl: "Rodzaj obiektu", en: "Structure type" },
  batteryBackUpLabel: {
    pl: "Akumulatorowe podtrzymanie pracy",
    en: "Uninterruptible power supply",
  },
  wireLengthLabel: {
    pl: "Orientacyjna odległość między urządzeniami",
    en: "Estimated distance among devices",
  },
  aboutAppDescriptionEntry: {
    pl: "Wprowadź podstawowe dane dotyczące Twojego systemu.",
    en: "Please enter basic information about your system.",
  },
  aboutAppDescriptionNext: {
    pl: "W następnym kroku będzie możliwość modyfikowania wprowadzonych danych oraz dodanie sygnalizatorów czy zaworów.",
    en: "In the next step, you will be able to modify the entered data and add signaling devices (sounders, beacons, etc.) or solenoid valves.",
  },
  aboutAppDescriptionEnd: {
    pl: "Na końcu system dobierze optymalny przekrój kabla dla systemu oraz umożliwi zarówno zapis jak i wygenerowanie zestawienia urządzeń z kodami PW.",
    en: "Finally, the configurator will select the control unit and the optimal cable for the system, and will allow you to save and generate a list of devices with product codes.",
  },
  aboutAppDescriptionInf: {
    pl: "Konfigurator prezentuje system detekcji gazu TetaGas w postaci konfigurowalnych segmentów zawierających urządzenia. Obecnie do systemu można dodać maksymalnie 50 segmentów - na przykład 40 segmentów zawierających detektory gazu i 10 segmentów zawierających sygnalizatory. System domyślnie przyjmuje 15% zapasu mocy przy doborze jednostki sterującej i/lub zasilacza w zależności od konfiguracji.",
    en: "The configurator presents the TetaGas gas detection system based on configurable segments containing devices. Currently, you can add up to 50 segments to the system – for example, 40 segments containing gas detectors and 10 segments containing signaling devices. By default, the system assumes a 15% power reserve when selecting the control unit and/or power supply depending on the configuration.",
  },
  aboutAppDescriptionAbout: {
    pl: "Więcej informacji znajdziecie Państwo w dokumencie ",
    en: "More information can be found in the document ",
  },
  aboutAppDescriptionLink: {
    pl: "Przewodnik Systemu TetaGas",
    en: "TetaGas System Guide",
  },
  fileLoadDesc: {
    pl: "UPUŚĆ PLIK TUTAJ, ABY WCZYTAĆ WCZEŚNIEJ ZAPISANY SYSTEM",
    en: "DROP A FILE TO LOAD PREVIOUSLY SAVED SYSTEM",
  },
  fileUpload: { pl: "Wczytaj system ▶", en: "Upload system ▶" },
  systemStatusHeader: { pl: "Stan systemu", en: "System status" },
  systemStatusDetectors: { pl: "CZUJNIKI GAZU", en: "GAS DETECTORS" },
  systemStatusSignallers: {
    pl: "SYGNALIZATORY/ZAWORY",
    en: "Signalling devices/Solenoid valves",
  },
  systemStatusAccessories: { pl: "AKCESORIA", en: "ACCESSORIES" },
  systemStatusPSU: {
    pl: "JEDNOSTKA STERUJĄCA I ZASILANIE",
    en: "CONTROL UNIT AND POWER",
  },
  busDescLength: { pl: "Długość magistrali", en: "BUS length" },
  controlUnitPowerConsumption: { pl: "Pobór mocy", en: "Power demand" },
  powerSupplyCableDim: { pl: "Przekrój kabla", en: "Wire diameter" },
  psuSystemStatus: { pl: "Status systemu", en: "System status" },
  optimizeSystem: { pl: "Optymalizuj", en: "Optimalize" },
  mainSystemPreview: { pl: "Podgląd systemu", en: "System preview" },
  mainSystemActions: { pl: "Działania", en: "Actions" },
  systemSegmentDescription: { pl: "Urządzenie", en: "Device" },
  systemSegmentText: { pl: "Napis", en: "Text" },
  systemFile: { pl: "Plik", en: "File" },
  mainSystemSaveFile: { pl: "Zapisz system", en: "Save system" },
  mainSystemDownloadFactsheet: {
    pl: "Pobierz zestawienie urządzeń",
    en: "Download the device list",
  },
  mainSystemUsedDevices: {
    pl: "Zastosowane urządzenia",
    en: "Applied devices",
  },
  appliedDevicesDocTech: {
    pl: "Dokumentacja Techniczna",
    en: "Technical documentation",
  },
  segmentWireLength: {
    pl: "Odległość do poprzedniego segmentu",
    en: "Distance to previous segment",
  },
  controlUnitModule: {
    pl: "Jednostka Sterująca",
    en: "Control Unit",
  },
  editMany: { pl: "Skonfiguruj wiele", en: "Edit multiple" },
  checkboxes: {
    pl: "Checkbox",
    en: "Checkboxses",
  },
  unCheckAll: {
    pl: "Odznacz wszystkie pola checkbox",
    en: "Deselect all checkboxes",
  },
  checkAll: {
    pl: "Zaznacz wszystkie pola checkbox",
    en: "Check all checkboxes",
  },
  deviceDescription: {
    pl: "Czujnik gazu",
    en: "Gas detector",
  },
  signallerDescription: {
    pl: "Sygnalizator op.-aku.",
    en: "Opt.-acu. signaling device",
  },
  toledDescription: {
    pl: "Tablica ostrzegawcza",
    en: "Warning LED Display",
  },
  valveControl: {
    pl: "Sterownik zaworu",
    en: "Valve controller"
  },
  deviceSegment: {
    detector: {
      pl: "Czujnik",
      en: "Detector",
    },
    signaller: {
      pl: "Sygnalizator",
      en: "Signaller",
    },
  },
  busWarning: {
    pl: "Zbyt duża liczba urządzeń na magistrali! Max 50 urządzeń!",
    en: "Too many devices on a bus! Max 50pcs !",
  },
  systemStateFalse: {
    pl: "Błędny system!",
    en: "False system"
  },
  regenerateSystemMessage: {
    pl: "Uwaga! Wciśnięcie przycisku potwierdz spowoduje skasowanie dotychczasowego systemu!",
    en: "Warning! Pressing the confirm button will delete the current system!"
  },
  popupPower: {
    pl: "Pobór mocy",
    en: "Power demand"
  },
  popupCurrent: {
    pl: "Prąd",
    en: "Current"
  },
  popupVoltage: {
    pl: "Napięcie",
    en: "Voltage"
  },
  buttonText: {
    pl: "Wybierz",
    en: "Select"
  },
  hvacGuidance: {
    pl: "https://doc.atestgaz.pl/AG/POD/POD-047-PLWydruk.pdf",
    en: "https://doc.atestgaz.pl/AG/POD/POD-047-ENGPrint.pdf"
  },
  modControltooltip: {
    pl: "Dostępne wykoania do montażu na szynie TH35, szczegóły w podręczniku użytkownika",
    en: "Available versions for mounting on a TH35 rail, details in the user manual"
  },
  modControlFileInfo: {
    pl: "Zestawienie zawiera kompletną, okablowaną jednostkę sterującą",
    en: "The equipment list includes a fully wired "
  },
  modControlFileInfoEnd: {
    pl: "z układem zasilania, w obudowie, przeznaczoną do montażu na ścianie.",
    en: "control unit with power supply, housed in a wall-mounted enclosure."
  },
  modControl35Info: {
    pl: "W przypadku zabudowy w istniejącej szafie na szynie TH35 możesz zastosować: ",
    en: "For installation in an existing cabinet on a TH35 rail, you can use: "
  },
  modControl35InfoEnd: {
    pl: "(zakres napięć zasilania 15-50V DC) z zasilaczem: ",
    en: "(supply voltage range 15-50V DC) with power supply: "
  },
  fileDeviceType: {
    pl: "RODZAJ URZĄDZENIA",
    en: "DEVICE TYPE"
  },
  fileDeviceName: {
    pl: "NAZWA URZĄDZENIA",
    en: "DEVICE NAME"
  }, filePW: {
    pl: "KOD PW",
    en: "PW CODE"
  }, fileQuantity: {
    pl: "ILOŚĆ",
    en: "QUANTITY"
  }, fileToled: {
    pl: "TOLED OPIS",
    en: "TOLED DESCRIPTION"
  }, fileDeviceQuantity: {
    pl: "ILOŚĆ URZĄDZEŃ",
    en: "DEVICE QUANTITY"
  }, fileConnector: {
    pl: "KONEKTOR",
    en: "CONNECTOR"
  }, fileWireType: {
    pl: "RODZAJ PRZEWODU",
    en: "WIRE TYPE"
  }, fileWireLength: {
    pl: "DŁUGOŚĆ PRZEWODU",
    en: "WIRE LENGTH"
  }, fileControlUnit: {
    pl: "JEDNOSTKA STERUJĄCA",
    en: "CONTROL UNIT"
  }, fileUPS: {
    pl: "PODTRZYMANIE ZASILANIA",
    en: "UNINTERRUPTIBLE POWER SUPPLY"
  },
  fileDetector: {
    pl: "Czujnik gazu",
    en: "Gas detector"
  }, fileSignaller: {
    pl: "Sygnalizator",
    en: "Signaller"
  }, fileValve: {
    pl: "Zawór",
    en: "Valve"
  }, fileCU: {
    pl: "Jednostka sterująca",
    en: "Control Unit"
  }, filePSU: {
    pl: "Zasilacz",
    en: "Power supply"
  },
  fileBufferPSU: {
    pl: "Zasilacz buforowy",
    en: "Buffer power supply"
  },
  TCON: {
    pl: "T-Konektor",
    en: "T-Connector"
  },
  powerSupplyNotRequired: {
    pl: "Nie wymaga dodatkowego zasilania",
    en: `Do not require additional power supply`
  },
  structureType: {
    pl: "Wybrano obiekt",
    en: "Selected structure"
  }
};
