//-----------------------------------------------------------------------------
// return: true if is OK, false if
function isSystemOk(system) {
	return (analiseSystem(system) != null);
}

//-----------------------------------------------------------------------------
// return: system with matched cables or null if there is no cable could make
// system work
function matchSystemCables(system) {
	let cb = copyObj(Cables);

	// iterate systemem analyse most to less cables resistivity
	cb.sort(function (a, b) {
		return b.resistivity_OhmPerMeter - a.resistivity_OhmPerMeter;
	});

	for (let i = 0; i < cb.length; i++) {
		for (segIdx = 0; segIdx < system.bus.length; segIdx++) {
			system.bus[segIdx].cableType = cb[i].type;
		}
		if (analiseSystem(system) != null) break;
	}
	return system;
}


//-----------------------------------------------------------------------------
// return: found obj from obj table matches typeVal
function getObjByType(table, typeVal) {
	return table.find(table => table.type == typeVal);
}

//-----------------------------------------------------------------------------
// return: device current [A] or null if deviceSupplyVoltage_V is lower than
// devices minVoltage_V
function getDeviceCurrent(device, deviceSupplyVoltage_V) {
	let current_A = null;
	if (deviceSupplyVoltage_V >= device.minVoltage_V) {
		current_A = device.current_A;
		current_A = current_A + (device.power_W / deviceSupplyVoltage_V);
	}
	return current_A;
}

//-----------------------------------------------------------------------------
// return: NCN
function getBusSectionVoltageDrop_V(busSection, wireCurrent_A) {
	let cable = getObjByType(Cables, busSection.cableType);
	let singleWireRes_Ohm = cable.resistivity_OhmPerMeter * busSection.cableLen_m;
	return 2 * singleWireRes_Ohm * wireCurrent_A;
}

//-----------------------------------------------------------------------------
// return: NCN
function makeEleStatusObj() {
	let eleStatus = {
		inputVoltage_V: 0,
		inputCurrent_A: 0,
		deviceSupplyVoltage_V: 0,
		isDeviceGoodVoltage: true
	};
	return eleStatus;
}

//-----------------------------------------------------------------------------
// return:	ele. status if calculations was possible
// 			null - idf error ocured
//								to prev. section - bus begin direction
// thisSection.inputVoltage_V ->		|
// thisSection.inputCurrent_A ->		|
//									   | |
// thisSection.cableR	->			   | |
//									   | |
//										|
//										|      |----------------------|
// thisSection.deviceSupplyVoltage_V ->	*------| thisSection.Device	  |
//										|      |					  |
//										|   ^  |----------------------|
//										|	|
//										|   thisSection.deviceSupplyCurrent
// nextSection.inputCurrent_A ->		|
//										|
//								to next section - bus end direction
//
function getBusSectionEleStatus(busSection, nextSectionEleStatus) {
	let eleStatus = null;

	if (nextSectionEleStatus != null) {
		let device = getObjByType(Devices, busSection.deviceType);
		if (device != undefined) {
			eleStatus = makeEleStatusObj();
			eleStatus.deviceSupplyVoltage_V = nextSectionEleStatus.inputVoltage_V;
			let deviceSupplyCurrent_A = getDeviceCurrent(device, eleStatus.deviceSupplyVoltage_V);
			if ((deviceSupplyCurrent_A != null) && (nextSectionEleStatus.isDeviceGoodVoltage == true)) {
				eleStatus.isDeviceGoodVoltage = true;
				eleStatus.inputCurrent_A = nextSectionEleStatus.inputCurrent_A + deviceSupplyCurrent_A;
				let vDrop_V = getBusSectionVoltageDrop_V(busSection, eleStatus.inputCurrent_A);
				eleStatus.inputVoltage_V = nextSectionEleStatus.inputVoltage_V + vDrop_V;
			}
			else {
				eleStatus.isDeviceGoodVoltage = false;
			}
		}
	}
	else {
		eleStatus = null;
	}

	return eleStatus;
}

//-----------------------------------------------------------------------------
// return: bus stat if calculation was possible, null if not
function getBusEleStatus(allBusSections, lastSectionDeviceSupplyVoltage_V) {
	let setcQty = allBusSections.length;

	let eleStatus = makeEleStatusObj();
	eleStatus.inputVoltage_V = lastSectionDeviceSupplyVoltage_V;

	for (i = setcQty - 1; i >= 0; i--) {
		eleStatus = getBusSectionEleStatus(allBusSections[i], eleStatus);
		allBusSections[i].eleStatus = copyObj(eleStatus);
		if (eleStatus.isDeviceGoodVoltage == false) break;
	}

	let stat = null;
	if ((eleStatus != null) && (eleStatus.isDeviceGoodVoltage == true)) {
		stat = {
			requiredSupplyVoltage_V: eleStatus.inputVoltage_V,
			currentConsumption_A: eleStatus.inputCurrent_A,
			isEveryDeviceGoodVoltage: eleStatus.isDeviceGoodVoltage,
			powerConsumption_W: eleStatus.inputCurrent_A * eleStatus.inputVoltage_V
		};
	}
	return stat;
}

//-----------------------------------------------------------------------------
// return: NCN
function copyObj(obj) {
	return JSON.parse(JSON.stringify(obj));
}

//-----------------------------------------------------------------------------
// return: NCN
function analiseSystem(system) {
	let res = null;
	let bus = system.bus;
	let lastSect = bus[bus.length - 1];
	let supplyVoltage_V = getObjByType(PowerSupplies, system.supplyType).supplyVoltage_V;
	let busStat;

	const voltageStep_V = 0.1;

	clearErrorDescription();

	let lastDevice = getObjByType(Devices, lastSect.deviceType);
	if (lastDevice != undefined) {
		let busEndVoltage_V = lastDevice.minVoltage_V;

		// Voltage at bus end must not drop grater than half of it's supply voltage.
		// Othervise, If there are "constant power consumption" devices (and it is typical) this leads to
		// two possible sollutions result of bus operation point. One of them (end bus voltage
		// below half of it's supply voltage) makes very big power loss in cables.
		// Such a system is improper, that's why calculation stars above this critical point.

		if (busEndVoltage_V < (supplyVoltage_V / 2)) busEndVoltage_V = (supplyVoltage_V / 2);

		let firsStepbusEndVoltage_V = busEndVoltage_V;
		do {
			busStat = getBusEleStatus(bus, busEndVoltage_V);
			if (busStat != null) {
				if (busStat.requiredSupplyVoltage_V > supplyVoltage_V) break;
			}
			busEndVoltage_V += voltageStep_V;
		}
		while (busEndVoltage_V < supplyVoltage_V);

		if (busStat != null) {
			// make one extra iteration to make input bus voltage below supplyVoltage_V
			// while loop above terminates when this voltage is above limit, so we have to make previous
			// iteration once again, unless it was not firts iteration
			busEndVoltage_V -= voltageStep_V;
			if (busEndVoltage_V > firsStepbusEndVoltage_V) {
				busStat = getBusEleStatus(bus, busEndVoltage_V);
				res = busStat;
			}
		}

		if (res == null) addErrorDescription(errorMsg.busVoltageTooLow);
	}
	else {
		addErrorDescription(errorMsg.internalError);
	}

	if (getBusLenght(system.bus) > 1000) {
		res = null;
		addErrorDescription(errorMsg.busTooLong);
	}

	if (system.bus.length > 50) {
		res = null;
		addErrorDescription(errorMsg.tooManyDevices);
	}

	if (getElementQtyByClass(DeviceCl.signaller, system.bus) > 26) {
		res = null;
		addErrorDescription(errorMsg.tooManySignallers);
	}

	if (getElementQtyByClass(DeviceCl.valveCtrl, system.bus) > 8) {
		res = null;
		addErrorDescription(errorMsg.tooManyValveCtrls,);
	}


	if (getErrorDescription().length == 0) addErrorDescription(errorMsg.noError);

	return res;
}

//-----------------------------------------------------------------------------
// return: NCN
function getBusLenght(allBusSections) {
	let setcQty = allBusSections.length;
	let len_m = 0;

	for (i = setcQty - 1; i >= 0; i--) {
		len_m += allBusSections[i].cableLen_m;
	}

	return len_m;
}

//-----------------------------------------------------------------------------
// return: NCN
function getElementQtyByClass(devDlass, allBusSections) {
	let qty = 0;
	let setcQty = allBusSections.length;

	for (i = setcQty - 1; i >= 0; i--) {
		let device = getObjByType(Devices, allBusSections[i].deviceType);
		if (device.class == devDlass) qty++;
	}

	return qty;
}

//-----------------------------------------------------------------------------
// return: NCN
function clearErrorDescription() {
	currentErrorMessages = [];
}

//-----------------------------------------------------------------------------
// return: NCN
function addErrorDescription(errorMsg) {
	currentErrorMessages.push(errorMsg);
}

//-----------------------------------------------------------------------------
// return: NCN
function getErrorDescription() {
	return currentErrorMessages;
}

//-----------------------------------------------------------------------------
// Error obj.
let currentErrorMessages;

const errorMsg =
{
	noError:
	{
		pl: 'Brak błędów',
		en: 'No errors'
	},
	internalError:
	{
		pl: 'Błąd wewnętrzny obliczeń',
		en: 'Internal calculation error'
	},
	busTooLong:
	{
		pl: 'Zbyt duża długość magistrali (maks. 1000m)',
		en: 'Bus too long (max. 1000m)'
	},
	busVoltageTooLow:
	{
		pl: 'Zbyt małe napięcie na jednym z urządzeń magistrali',
		en: 'Bus device voltage to low'
	},
	tooManyDevices:
	{
		pl: 'Zbyt dużo urządzeń na magistrali (maks. 50)',
		en: 'Too many devices (max 50)'
	},
	tooManySignallers:
	{
		pl: 'Zbyt dużo sygnalizatorów (maks. 26)',
		en: 'Too many signallers (max 26)'
	},
	tooManyValveCtrls:
	{
		pl: 'Zbyt dużo sterowników zaworu (maks. 8)',
		en: 'Too many valve controllers (max 8)'
	}
}