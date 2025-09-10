const supplyDR60W48V = {
    description: `HDR-60W-48V`,
    type: "HDR",
    supplyVoltage: 42,
    power: 60
}

const supplyDR100W48V = {
    description: `HDR-100W-48V`,
    type: "HDR",
    supplyVoltage: 42,
    power: 100
}

const supplyDR150W48V = {
    description: `HDR-150W-48V`,
    type: "HDR",
    supplyVoltage: 42,
    power: 150
}


const supplyZBF12V4A7Ah60W = {
    description: `ZBF-12V-4A-7Ah`,
    type: "ZBF",
    supplyVoltage: 9,
    power: 60,
    batteryCapacity_Ah: 7
}

const supplyZBF24V7Ah40W = {
    description: `ZBF-24V-1.6A-7Ah`,
    type: "ZBF",
    supplyVoltage: 21,
    power: 40,
    batteryCapacity_Ah: 7
}

const supplyZBF24V4A7Ah100W = {
    description: `ZBF-24V-4A-7Ah`,
    type: "ZBF",
    supplyVoltage: 21,
    power: 100,
    batteryCapacity_Ah: 7
}

const supplyZBF24V4A17Ah100W = {
    description: `ZBF-24V-4A-17Ah`,
    type: "ZBF",
    supplyVoltage: 21,
    power: 100,
    batteryCapacity_Ah: 17
}

const supplyZBF24V5A7Ah140W = {
    description: `ZBF-24V-5A-7Ah`,
    type: "ZBF",
    supplyVoltage: 21,
    power: 140,
    batteryCapacity_Ah: 7
}

const supplyZBF24V5A17Ah140W = {
    description: `ZBF-24V-5A-17Ah`,
    type: "ZBF",    
    supplyVoltage: 21,
    power: 140,
    batteryCapacity_Ah: 17
}

const powersupplyTMC1 = [
    supplyDR60W48V, supplyDR100W48V, supplyDR150W48V
];
const powersupplyMC = [
    supplyZBF12V4A7Ah60W, supplyZBF24V7Ah40W,
    supplyZBF24V4A7Ah100W, supplyZBF24V4A17Ah100W,
    supplyZBF24V5A7Ah140W, supplyZBF24V5A17Ah140W
];
