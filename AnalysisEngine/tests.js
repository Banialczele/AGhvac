// test data see adms://s:192.168.0.251/b:archidemes/i:224904
let ExampleSystem1 =
{
	supplyType: "24V bez podtrzymania",
	bus: 
	[
		{cableType: "2 x 1,5 mm2", cableLen_m: 250, deviceType: "Teta EcoWent"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 50, deviceType: "Teta EcoWent"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 50, deviceType: "Teta EcoWent"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 50, deviceType: "Teta EcoWent"}
	],
    require:
    [
        {deviceSupplyVoltage_V: 23.55, inputCurrent_A: 0.075, inputVoltage_V: 24, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 23.48, inputCurrent_A: 0.056, inputVoltage_V: 23.55, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 23.43, inputCurrent_A: 0.038, inputVoltage_V: 23.48, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 23.41, inputCurrent_A: 0.019, inputVoltage_V: 23.43, isDeviceGoodVoltage: true}
    ]
}

let ExampleSystem2 =
{
	supplyType: "48V z/bez podtrzymaniem",
	bus: 
	[
		{cableType: "2 x 1,5 mm2", cableLen_m: 250, deviceType: "Teta EcoWent"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 5, deviceType: "Teta EcoDet"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 50, deviceType: "Teta EcoTerm"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 50, deviceType: "Teta EcoWent + MiniDet"},
        {cableType: "2 x 4 mm2", cableLen_m: 2, deviceType: "Teta EcoWent + MiniDet"},
        {cableType: "2 x 1 mm2", cableLen_m: 1, deviceType: "Teta EcoWent + MiniDet"},
        {cableType: "2 x 4 mm2", cableLen_m: 250, deviceType: "Teta EcoWent + MiniDet"},
        {cableType: "2 x 2,5 mm2", cableLen_m: 1, deviceType: "Teta EcoDet"},
        {cableType: "2 x 1 mm2", cableLen_m: 1, deviceType: "Teta EcoDet"},
        {cableType: "2 x 1,5 mm2", cableLen_m: 0.1, deviceType: "Teta EcoDet"},
        {cableType: "2 x 1 mm2", cableLen_m: 1, deviceType:  "Teta EcoWent + MiniDet"},
        {cableType: "2 x 2,5 mm2", cableLen_m: 1, deviceType:  "Teta EcoDet"},
        {cableType: "2 x 1 mm2", cableLen_m: 1, deviceType:  "Teta EcoWent"},
        {cableType: "2 x 1,5 mm2", cableLen_m: 0.1, deviceType:  "Teta EcoDet"},
        {cableType: "2 x 4 mm2", cableLen_m: 2, deviceType:  "Teta EcoWent + MiniDet"},
        {cableType: "2 x 1 mm2", cableLen_m: 250, deviceType:  "Teta EcoWent + MiniDet"},
        {cableType: "2 x 2,5 mm2", cableLen_m: 1, deviceType:   "Teta EcoDet"},
        {cableType: "2 x 1 mm2", cableLen_m: 1, deviceType:   "Teta EcoDet"},
        {cableType: "2 x 1,5 mm2", cableLen_m: 0.1, deviceType:   "Teta EcoDet"},
        {cableType: "2 x 1 mm2", cableLen_m: 1, deviceType:  "Teta EcoWent + MiniDet"}
        
	],
    require:
    [
        {deviceSupplyVoltage_V: 43.569, inputCurrent_A: 0.734, inputVoltage_V: 48.00, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 43.482, inputCurrent_A: 0.722, inputVoltage_V: 43.569, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 42.656, inputCurrent_A: 0.684, inputVoltage_V: 43.482, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 41.876, inputCurrent_A: 0.647, inputVoltage_V: 42.656, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 41.865, inputCurrent_A: 0.608, inputVoltage_V: 41.876, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 41.845, inputCurrent_A: 0.569, inputVoltage_V: 41.865, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.642, inputCurrent_A: 0.532, inputVoltage_V: 41.845, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.635, inputCurrent_A: 0.492, inputVoltage_V: 40.642, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.619, inputCurrent_A: 0.453, inputVoltage_V: 40.635, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.618, inputCurrent_A: 0.413, inputVoltage_V: 40.619, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.604, inputCurrent_A: 0.374, inputVoltage_V: 40.618, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.589, inputCurrent_A: 0.335, inputVoltage_V: 40.599, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.588, inputCurrent_A: 0.296, inputVoltage_V: 40.589, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.587, inputCurrent_A: 0.282, inputVoltage_V: 40.588, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.583, inputCurrent_A: 0.243, inputVoltage_V: 40.587, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 38.738, inputCurrent_A: 0.204, inputVoltage_V: 40.583, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 38.735, inputCurrent_A: 0.163, inputVoltage_V: 38.738, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 38.7308, inputCurrent_A: 0.122, inputVoltage_V: 38.735, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 38.7306, inputCurrent_A: 0.082, inputVoltage_V: 38.7308, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 38.729, inputCurrent_A: 0.0408, inputVoltage_V: 38.7306, isDeviceGoodVoltage: true}        
   ]
}

let ExampleSystem3 =
{
	supplyType: "24V bez podtrzymania",
	bus: 
	[
        {cableType: "2 x 1,5 mm2", cableLen_m: 250, deviceType: "Teta EcoWent"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 5, deviceType: "Teta EcoDet"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 50, deviceType: "Teta EcoTerm"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 100, deviceType: "Teta EcoWent + MiniDet"},
        {cableType: "2 x 4 mm2", cableLen_m: 2, deviceType: "Teta EcoWent + MiniDet"},
        {cableType: "2 x 1 mm2", cableLen_m: 500, deviceType: "Teta EcoWent + MiniDet"},
        {cableType: "2 x 1 mm2", cableLen_m: 250, deviceType: "Teta EcoWent + MiniDet"},
        {cableType: "2 x 2,5 mm2", cableLen_m: 1, deviceType: "Teta EcoDet"}
        
    ],

    require:
    [
        {deviceSupplyVoltage_V: 19.735, inputCurrent_A: 0.707, inputVoltage_V: 24.00, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 19.652, inputCurrent_A: 0.686, inputVoltage_V: 19.735, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 18.904, inputCurrent_A: 0.545, inputVoltage_V: 19.652, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 17.589, inputCurrent_A: 0.465, inputVoltage_V: 18.904, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 17.580, inputCurrent_A: 0.384, inputVoltage_V: 17.589, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 10.618, inputCurrent_A: 0.257, inputVoltage_V: 17.580, isDeviceGoodVoltage: false},
        {deviceSupplyVoltage_V: 8.293, inputCurrent_A: 0.135, inputVoltage_V: 10.618, isDeviceGoodVoltage: false},
        {deviceSupplyVoltage_V: 8.291, inputCurrent_A: 0.122, inputVoltage_V: 8.293, isDeviceGoodVoltage: false}
        
    ]
}

let ExampleSystem4 =
{
	supplyType: "48V z/bez podtrzymaniem",
	bus: 
	[
        {cableType: "2 x 1,5 mm2", cableLen_m: 250, deviceType: "Teta EcoWent"},
		{cableType: "2 x 1 mm2", cableLen_m: 300, deviceType: "Teta EcoDet"},
		{cableType: "2 x 2,5 mm2", cableLen_m: 150.1, deviceType: "Teta EcoTerm"},
		{cableType: "2 x 1,5 mm2", cableLen_m: 300.5, deviceType: "Teta EcoWent + MiniDet"},
        {cableType: "2 x 4 mm2", cableLen_m: 20, deviceType: "Teta EcoH"},
        {cableType: "2 x 1 mm2", cableLen_m: 50, deviceType: "TOLED"},
        {cableType: "2 x 1 mm2", cableLen_m: 250, deviceType: "Teta SZOA"},
        {cableType: "2 x 2,5 mm2", cableLen_m: 100, deviceType: "Control V"},
        {cableType: "2 x 1 mm2", cableLen_m: 50, deviceType: "Teta EcoN"}
        
    ],

    require:
    [
        {deviceSupplyVoltage_V: 45.163, inputCurrent_A: 0.470, inputVoltage_V: 48.00, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 40.193, inputCurrent_A: 0.457, inputVoltage_V: 45.163, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 39.284, inputCurrent_A: 0.418, inputVoltage_V: 40.193, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 36.544, inputCurrent_A: 0.378, inputVoltage_V: 39.284, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 36.484, inputCurrent_A: 0.335, inputVoltage_V: 36.544, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 35.970, inputCurrent_A: 0.283, inputVoltage_V: 36.484, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 34.018, inputCurrent_A: 0.216, inputVoltage_V: 35.970, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 33.819, inputCurrent_A: 0.137, inputVoltage_V: 34.018, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 33.736, inputCurrent_A: 0.046, inputVoltage_V: 33.819, isDeviceGoodVoltage: true}
        
    ]
}

let ExampleSystem5 =
{
	supplyType: "24V bez podtrzymania",
	bus: 
	[
        {cableType: "2 x 1,5 mm2", cableLen_m: 401, deviceType: "Teta EcoWent"},
		{cableType: "2 x 1 mm2", cableLen_m: 550, deviceType: "Control V"},
		{cableType: "2 x 2,5 mm2", cableLen_m: 150.1, deviceType: "Teta EcoTerm"}
		
    ],

    require:
    [
        {deviceSupplyVoltage_V: 20.355, inputCurrent_A: 0.377, inputVoltage_V: 24.00, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 13.269, inputCurrent_A: 0.356, inputVoltage_V: 20.355, isDeviceGoodVoltage: false},
        {deviceSupplyVoltage_V: 13.04, inputCurrent_A: 0.105, inputVoltage_V: 13.269, isDeviceGoodVoltage: true}
        
    ]
}
let ExampleSystem6 =
{
	supplyType: "24V bez podtrzymania",
	bus: 
	[
        {cableType: "2 x 1,5 mm2", cableLen_m: 401, deviceType: "Teta EcoWent"},
		{cableType: "2 x 1 mm2", cableLen_m: 450, deviceType: "Control V"},
		{cableType: "2 x 1 mm2", cableLen_m: 750, deviceType: "Teta EcoTerm"}
		
    ],

    require:
    [
        {deviceSupplyVoltage_V: 20.636, inputCurrent_A: 0.348, inputVoltage_V: 24.00, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 15.308, inputCurrent_A: 0.327, inputVoltage_V: 20.636, isDeviceGoodVoltage: true},
        {deviceSupplyVoltage_V: 12.284, inputCurrent_A: 0.111, inputVoltage_V: 15.308, isDeviceGoodVoltage: true}
        
    ]
}


//-----------------------------------------------------------------------------
// helper functions

function logEleStatus(bus)
{
	console.log(bus);
	console.log("Sections:");
	for (let i = 0; i < bus.length; i++)
	{
		//console.log("Section " + i + ":");
		//console.log(bus[i].eleStatus);
	}
}

function calculateRelErr_percent (wasCalculated, requireValuje)
{
   
let relateiveErr_percent = (Math.abs(wasCalculated-requireValuje))/requireValuje*100;
return relateiveErr_percent;
    
}

function check (wasCalculated, requireValuje)
{
    if (wasCalculated == requireValuje)
        console.log("PASS");
    else
        console.log("FAIL");   
}

function checkWithTolerance (wasCalculated, requireValuje, tolerance_percent)
{
    if (calculateRelErr_percent(wasCalculated, requireValuje) < tolerance_percent)
        console.log("PASS");
    else
        console.log("FAIL");
}

function isGoodCalculateBusSection(bus, require, lambda_percent)
{
    for (let num = 0; num < bus.length; num++)
	{
    
    let inputVoltageErr_perc = calculateRelErr_percent(bus[num].eleStatus.inputVoltage_V, require[num].inputVoltage_V);
    let deviceSupplyVoltageErr_perc = calculateRelErr_percent(bus[num].eleStatus.deviceSupplyVoltage_V, require[num].deviceSupplyVoltage_V);
    let inputCurrentErr_perc = calculateRelErr_percent(bus[num].eleStatus.inputCurrent_A, require[num].inputCurrent_A);
        
    if ((inputVoltageErr_perc < lambda_percent) && 
        (deviceSupplyVoltageErr_perc < lambda_percent) && 
        (inputCurrentErr_perc < lambda_percent) &&
        (bus[num].eleStatus.isDeviceGoodVoltage == require[num].isDeviceGoodVoltage)
        )          
        
        {
		  console.log("Good");
        }
    else
	   {
		console.log("Wrong", "Section number:", num);
        console.log("Require:", require[num]);
        console.log("It was calculate:", bus[num].eleStatus);
	   }    
    }
}

//-----------------------------------------------------------------------------
// tests
function runTests()
{
	console.log("run tests");
	//console.log(ExampleSystem1);
	//console.log(isSystemOk(ExampleSystem1));
	
	console.log("----Teta EcoDet getDeviceCurrent test-----");
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoDet"), 20), 0.0715, 1);
    check(getDeviceCurrent(getObjByType(Devices, "Teta EcoDet"), 11.9), null);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoDet"), 30), 0.050, 1);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoDet"), 12), 0.114, 1);
    
    console.log("----Teta EcodWent getDeviceCurrent test-----");
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoWent"), 20), 0.021, 1);
    check(getDeviceCurrent(getObjByType(Devices, "Teta EcoWent"), 11.9), null);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoWent"), 30), 0.016, 1);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoWent"), 12), 0.031, 1);
    
    console.log("----Teta EcoWent + MiniDet getDeviceCurrent test-----");
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoWent + MiniDet"), 20), 0.0715, 1);
    check(getDeviceCurrent(getObjByType(Devices, "Teta EcoWent + MiniDet"), 11.9), null);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoWent + MiniDet"), 30), 0.050, 1);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoWent + MiniDet"), 12), 0.114, 1);
    
    console.log("----Teta EcoTerm getDeviceCurrent test-----");
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoTerm"), 13), 0.106, 1);
    check(getDeviceCurrent(getObjByType(Devices, "Teta EcoTerm"), 11.5), null);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoTerm"), 48), 0.034, 1);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoTerm"), 12), 0.114, 1);
    
    console.log("----Teta EcoH getDeviceCurrent test-----");
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoH"), 16), 0.115, 1);
    check(getDeviceCurrent(getObjByType(Devices, "Teta EcoH"), 11.9), null);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoH"), 48), 0.0395, 1);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoH"), 15), 0.122, 1);
    
    console.log("----Teta EcoN getDeviceCurrent test-----");
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoN"), 24), 0.061, 1);
    check(getDeviceCurrent(getObjByType(Devices, "Teta EcoN"), 11), null);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoN"), 36), 0.043, 1);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta EcoN"), 15), 0.093, 1);
    
    console.log("----TOLED getDeviceCurrent test-----");
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "TOLED"), 24), 0.104, 1);
    check(getDeviceCurrent(getObjByType(Devices, "TOLED"), 13), null);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "TOLED"), 36), 0.068, 1);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "TOLED"), 15), 0.170, 1);
    
    console.log("---- Teta SZOA getDeviceCurrent test-----");
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta SZOA"), 15.6), 0.180, 1);
    check(getDeviceCurrent(getObjByType(Devices, "Teta SZOA"), 13), null);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta SZOA"), 36), 0.074, 1);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Teta SZOA"), 22), 0.125, 1);
    
    console.log("---- Control V getDeviceCurrent test-----");
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Control V"), 17), 0.193, 1);
    check(getDeviceCurrent(getObjByType(Devices, "Control V"), 14.9), null);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Control V"), 30), 0.105, 1);
    checkWithTolerance(getDeviceCurrent(getObjByType(Devices, "Control V"), 48), 0.061, 1);
    
    
	console.log(getBusSectionVoltageDrop_V(ExampleSystem1.bus[1], 1));
	
	let sectEleStatus = {
		inputVoltage_V: 20,		
		inputCurrent_A: 0,
		deviceSupplyVoltage_V: 20
	};
	
	console.log(getBusSectionEleStatus(ExampleSystem1.bus[1], sectEleStatus));
	console.log(getBusEleStatus(ExampleSystem1.bus, 20));
    
    
    
    
	logEleStatus(ExampleSystem1.bus);
	console.log(ExampleSystem1.bus[1].eleStatus.inputVoltage_V);
	
	console.log(getBusEleStatus(ExampleSystem1.bus, 6));
	logEleStatus(ExampleSystem1.bus);
	
	console.log(analiseSystem(ExampleSystem1));
	
	console.log(isSystemOk(ExampleSystem1));
		
	console.log(analiseSystem(ExampleSystem2));
	//logEleStatus(ExampleSystem2.bus);
    console.log(analiseSystem(ExampleSystem4));
  
    
    console.log("---------------------------------------------");
    console.log("Tests ExampleSystem1");
    console.log("---------------------------------------------");
    isGoodCalculateBusSection(ExampleSystem1.bus, ExampleSystem1.require, 1);
    check(isSystemOk(ExampleSystem1), true);
    console.log("----------------END TESTs -----ExampleSystem1 ------------------");
    
    console.log("---------------------------------------------");
    console.log("Tests ExampleSystem2");
    console.log("---------------------------------------------");
    isGoodCalculateBusSection(ExampleSystem2.bus, ExampleSystem2.require, 1);
    check(isSystemOk(ExampleSystem2), true);
    console.log("----------------END TESTS -----ExampleSystem2 ------------------");
    
    console.log("---------------------------------------------");
    console.log("Tests ExampleSystem3");
    console.log("---------------------------------------------");
    check(isSystemOk(ExampleSystem3), false);
   // isGoodCalculateBusSection(ExampleSystem3.bus, ExampleSystem3.require, 1);
    console.log(getBusEleStatus(ExampleSystem3.bus, 12));
    console.log("----------------END TESTS -----ExampleSystem3------------------");
    
    console.log("---------------------------------------------");
    console.log("Tests ExampleSystem4");
    console.log("---------------------------------------------");
    check(isSystemOk(ExampleSystem4), true);
    isGoodCalculateBusSection(ExampleSystem4.bus, ExampleSystem4.require, 1);
    console.log(getBusEleStatus(ExampleSystem4.bus, 15));
    console.log("----------------END TESTS -----ExampleSystem4------------------");
    
    console.log("---------------------------------------------");
    console.log("Tests ExampleSystem5");
    console.log("---------------------------------------------");
    check(isSystemOk(ExampleSystem5), false);
    //isGoodCalculateBusSection(ExampleSystem5.bus, ExampleSystem5.require, 1);
    console.log(getBusEleStatus(ExampleSystem5.bus, 15));
    console.log("----------------END TESTS -----ExampleSystem5------------------");
    
    console.log("---------------------------------------------");
    console.log("Tests ExampleSystem6");
    console.log("---------------------------------------------");
    check(isSystemOk(ExampleSystem6), true);
    isGoodCalculateBusSection(ExampleSystem6.bus, ExampleSystem6.require, 1);
    console.log(getBusEleStatus(ExampleSystem6.bus, 19));
    console.log("----------------END TESTS -----ExampleSystem6------------------");
    
}
