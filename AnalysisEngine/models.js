const PowerSupplies = [
  { type: "24V", supplyVoltage_V: 24 },
  { type: "24V + UPS", supplyVoltage_V: 21 },
  { type: "48V / 48V + UPS", supplyVoltage_V: 48 },
];

const Cables = [
  { type: "2 x 1 mm2", resistivity_OhmPerMeter: 0.0181 },
  { type: "2 x 1,5 mm2", resistivity_OhmPerMeter: 0.0121 },
  { type: "2 x 2,5 mm2", resistivity_OhmPerMeter: 0.00741 },
  { type: "2 x 4 mm2", resistivity_OhmPerMeter: 0.00461 },
];

const busTooLong = {
  code: `TOO_LONG_BUS`,
  pl: `Za długa magistrala! Max 1000m!`,
  en: `bus too long! 1000m`
}

const signallerToMany = {
  code: `TOO_MANY_SIGNALLERS`,
  pl: `Za dużo sygnalizatorów! Max 26szt!`,
  en: `Too many signallers! Max 26pcs!`
}

const valvesTooMany = {
  code: `TOO_MANY_VALVES`,
  pl: `Za dużo zaworów! Max 8szt!`,
  en: `Too many valves! Max 8pcs!`
}

//sprawdzić description w controlUnitModule oraz controlUnitS
const controlUnitModule = {
  type: "Teta Mod Control 1",
  img: "Teta MOD Control 1",
  possibleUPS: `no`,
  description: {
    supplyVoltage: 24,
  },
  productKey: "PW-108A",
};

const controlUnitS = {
  type: "Teta Mod Control 1-S",
  img: "Teta MOD Control 1",
  possibleUPS: `yes`,
  description: {
   supplyVoltage: 24,
  },
  productKey: "PW-086-Control1-S",
};
const controlUnitS2460W = {
  type: "Teta Mod Control 1-S24",
  img: "Teta MOD Control 1",
  possibleUPS: `no`,
  description: {
   supplyVoltage: 24,
  },
  productKey: "PW-086-Control1-S24",
};

const controlUnitS4860W = {
  type: "Teta Mod Control 1-S48-60W",
  img: "Teta MOD Control 1",
  possibleUPS: `no`,
  description: {
    supplyVoltage: 48,
    power: 60
  },
  productKey: "PW-086-Control1-S48-60",
};
const controlUnitS48100W = {
  type: "Teta Mod Control 1-S48-100W",
  img: "Teta MOD Control 1",
  possibleUPS: `no`,
  description: {
   supplyVoltage:  48,
   power: 100
  },
  productKey: "PW-086-Control1-S48-100",
};

const controlUnitS48150W = {
  type: "Teta Mod Control 1-S48-150W",
  img: "Teta MOD Control 1",
  possibleUPS: `no`,
  description: {
   supplyVoltage:  48,
   power: 150
  },
  productKey: "PW-086-Control1-S48-150",
}

const controlUnitSUPS300 = {
  type: "Teta Mod Control 1-S-UP300W",
  img: "Teta MOD Control 1",
  possibleUPS: `yes`,
  description: {
    supplyVoltage:  48,
    power: 300
  },
  productKey: "PW-086-Control1-S-UP300",
};

const CONTROLUNITLIST = [
  controlUnitS,
  controlUnitS2460W,
  controlUnitS4860W,
  controlUnitS48100W,
  controlUnitS48150W,
  controlUnitSUPS300,
  controlUnitModule,
];

const DeviceCl = {
  detector: "detector",
  signaller: "signaller",
  valveCtrl: "valveCtrl",
};

const tetaEcoWentDevice = {
  type: `Teta EcoWent`,
  power_W: 0.3,
  current_A: 0.006,
  minVoltage_V: 12,
  class: DeviceCl.detector,
  gasDetected: "CO",
  productKey: "PW-105-CO",
  doc: {
    pl: "https://www.atestgaz.pl/produkt/czujnik-gazu-teta-ecowent",
    en: "https://atestgaz.pl/en/produkt/gas-detector-teta-ecowent/"
  }
}; // see adms://s:192.168.0.251/b:archidemes/i:165964

const tetaEcoDetDevice = {
  type: `Teta EcoDet`,
  power_W: 1.27,
  current_A: 0.008,
  minVoltage_V: 12,
  class: DeviceCl.detector,
  gasDetected: "LPG",
  doc: {
    pl: "https://www.atestgaz.pl/produkt/czujnik-gazu-teta-ecodet",
    en: "https://atestgaz.pl/en/produkt/gas-detector-teta-ecodet/"
  },
  productKey: "PW-106-LPG",
}; // see ://s:192.168.0.251/b:archidemes/i:165964

const tetaEcoWentMiniDetDevice = {
  type: `Teta EcoWent+MiniDet`,
  power_W: 1.27,
  current_A: 0.008,
  minVoltage_V: 12,
  isBig: true,
  class: DeviceCl.detector,
  gasDetected: "CO+LPG",
  productKey: {
    CO: "PW-105-CO",
    LPG: "PW-107-LPG",
  },
  doc: {
    went: {
      pl: "https://www.atestgaz.pl/produkt/czujnik-gazu-teta-ecowent",
      en: "https://atestgaz.pl/en/produkt/gas-detector-teta-ecowent/"
    },
    det: {
      pl: "https://atestgaz.pl/produkt/czujnik-gazu-teta-minidet/",
      en: "https://atestgaz.pl/en/produkt/gas-detector-teta-minidet/"
    }
  },

}; // see adms://s:192.168.0.251/b:archidemes/i:165964

const tetaEcoTermDevice = {
  type: `Teta EcoTerm`,
  power_W: 1.27,
  current_A: 0.008,
  minVoltage_V: 12,
  class: DeviceCl.detector,
  gasDetected: "NG",
  productKey: "PW-113-NG",
  doc: {
    pl: "https://atestgaz.pl/produkt/czujnik-gazu-teta-ecoterm/",
    en: "https://atestgaz.pl/en/produkt/gas-detector-teta-ecoterm/"
  }
}; // see adms://s:192.168.0.251/b:archidemes/i:165964

const tetaEcoHDevice = {
  type: "Teta EcoH",
  power_W: 1.8,
  current_A: 0.002,
  minVoltage_V: 12,
  class: DeviceCl.detector,
  gasDetected: "H2",
  productKey: "PW-123-H2",
  doc: {
    pl: "https://atestgaz.pl/produkt/czujnik-gazu-teta-ecoh/",
    en: "https://atestgaz.pl/en/produkt/gas-detector-teta-ecoh/"
  }
}; // see adms://s:192.168.0.251/b:archidemes/i:226424

const tetaEcoNDevice = {
  type: "Teta EcoN",
  power_W: 1.27,
  current_A: 0.008,
  minVoltage_V: 12,
  class: DeviceCl.detector,
  gasDetected: "NO2",
  productKey: "PW-111-NO2",
  doc: {
    pl: "https://www.atestgaz.pl/produkt/czujnik-gazu-teta-econ",
    en: "https://atestgaz.pl/en/produkt/gas-detector-teta-econ/"
  }
}; // see EcoTerm

const toledDevice = {
  type: "TOLED",
  power_W: 2.62,
  current_A: -0.005,
  minVoltage_V: 15,
  class: DeviceCl.signaller,
  productKey: "PW-127-X",
  doc: {
    pl: "https://www.atestgaz.pl/produkt/tablica-ostrzegawcza-toled",
    en: 'https://atestgaz.pl/en/produkt/warning-led-display-toled/'
  }
}; // see adms://s:192.168.0.251/b:archidemes/i:226424

// const tetaSZOADevice = {
//   type: "Teta SZOA",
//   power_W: 2.91,
//   current_A: -0.007,
//   minVoltage_V: 15,
//   class: DeviceCl.signaller,
//   productKey: "PW-118-TETA",
//   doc: {
//   pl: "https://www.atestgaz.pl/produkt/sygnalizator-teta-szoa",
// }; // see adms://s:192.168.0.251/b:archidemes/i:226424

const tetaSOLERTDevice = {
  type: "Teta SOLERT",
  power_W: 2.2,
  current_A: 0.021,
  minVoltage_V: 15,
  class: DeviceCl.signaller,
  productKey: "PW-132-T",
  doc: {
    pl: "https://atestgaz.pl/produkt/teta-solert/",
    en: "https://atestgaz.pl/en/produkt/teta-solert-2/"
  }
}; // see adms://s:192.168.0.251/b:archidemes/i:226424 + adms://s:192.168.0.251/b:archidemes/i:165964

const tetaControlVDevice = {
  type: "Teta Control V",
  power_W: 3.47,
  current_A: -0.011,
  minVoltage_V: 15,
  class: DeviceCl.valveCtrl,
  productKey: "PW-121-X",
  doc: {
    pl: "https://www.atestgaz.pl/produkt/sterownik-zaworu-control-v",
    en: "https://atestgaz.pl/en/produkt/valve-controller-control-v/"
  }
}; // see adms://s:192.168.0.251/b:archidemes/i:226424

const facilityTypeGarage = {
  type: {
    pl: "Garaże i parkingi podziemne",
    en: "Garage or underground parking",
  },
  devices: [
    tetaEcoWentDevice,
    tetaEcoDetDevice,
    tetaEcoWentMiniDetDevice,
    tetaEcoNDevice,
    tetaSOLERTDevice,
    toledDevice,
  ],
  detection: [
    tetaEcoWentDevice.gasDetected,
    tetaEcoDetDevice.gasDetected,
    tetaEcoWentMiniDetDevice.gasDetected,
    tetaEcoNDevice.gasDetected,
  ],
};

const facilityTypeBattery = {
  type: {
    pl: "Akumulatornie",
    en: "Battery room",
  },
  devices: [tetaEcoHDevice, tetaSOLERTDevice, toledDevice],
  detection: [tetaEcoHDevice.gasDetected],
};

const facilityTypeHall = {
  type: {
    pl: "Hala",
    en: "Hall",
  },
  devices: [tetaEcoDetDevice, tetaEcoTermDevice, tetaSOLERTDevice, toledDevice],
  detection: [tetaEcoDetDevice.gasDetected, tetaEcoTermDevice.gasDetected],
};

//TCON PW-99 - XT
//TCON PW-112-S2 zwykłe

const facilityTypeOther = {
  type: {
    pl: "Inne",
    en: "Other",
  },
  devices: [
    tetaEcoWentDevice,
    tetaEcoWentMiniDetDevice,
    tetaEcoDetDevice,
    tetaEcoTermDevice,
    tetaEcoHDevice,
    tetaEcoNDevice,
    toledDevice,
    tetaSOLERTDevice,
    tetaControlVDevice,
  ],
  detection: [
    tetaEcoWentDevice.gasDetected,
    tetaEcoWentMiniDetDevice.gasDetected,
    tetaEcoDetDevice.gasDetected,
    tetaEcoTermDevice.gasDetected,
    tetaEcoHDevice.gasDetected,
    tetaEcoNDevice.gasDetected,
  ],
};

const Devices = [
  tetaEcoWentDevice,
  tetaEcoWentMiniDetDevice,
  tetaEcoDetDevice,
  tetaEcoTermDevice,
  tetaEcoHDevice,
  tetaEcoNDevice,
  toledDevice,
  tetaSOLERTDevice,
  tetaControlVDevice,
];

const STRUCTURE_TYPES = [facilityTypeGarage, facilityTypeBattery, facilityTypeHall, facilityTypeOther];

const TOLED_OPTIONS = [
  {
    translate: "toledLabelWe",
    type: {
      pl: "NADMIAR SPALIN NIE WCHODZIĆ",
      en: "EXCESS EXHAUST GASES DO NOT ENTER",
    },
  },
  {
    translate: "toledLabelWj",
    type: {
      pl: "NADMIAR SPALIN NIE WJEŻDŻAĆ",
      en: "EXCESS EXHAUST GASES DO NOT DRIVE IN",
    },
  },
  {
    translate: "toledLabelOp",
    type: {
      pl: "NADMIAR SPALIN OPUŚĆ GARAŻ",
      en: "EXCESS EXHAUST GASES LEAVE THE GARAGE",
    },
  },
  {
    translate: "toledLabelWs",
    type: {
      pl: "Napis na życzenie klienta",
      en: "Inscription at the customer'S request",
    },
  },
];
