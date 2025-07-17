// Ustawienie domyślnego języka widoku aplikacji
let lang = "pl";

// Główny obiekt zawierający dane utworzonego systemu
let systemData = {
	supplyType: ``,
	wiretype: '',
	devicesTypes: { detectors: [], signallers: [] },
	bus: [],
};

let initSystem = {
	systemIsGenerated: false
};

// Etykiety dla widoku aplikacji w obsługiwanych przez aplikację językach

// Ustawienie nasłuchiwania na przycisku mobilnego menu
function setMobileMenuClickEvent() {
	document.getElementById("navMobileActivationBtn").addEventListener("click", () => {
		document.getElementById("configuratorNavMobile").classList.toggle("active");
		document.querySelector(".navMobileActivationBtnIcon").classList.toggle("active");
	});
}

function checkLang() {
	let HREF = window.location.href;

	if (HREF.includes(`lang=pl`) || !HREF.includes(`lang`)) {
		lang = "pl";
	} else if (HREF.includes(`lang=en`)) {
		lang = "en";
	}
}	

function initSystemData() {
	const selectedStructure = STRUCTURE_TYPES[0];
	const selectedStructureGas = selectedStructure.detection[0];
	const selectedStructureDetector = selectedStructure.devices.find(device => device.gasDetected === selectedStructureGas);
	initSystem = {
		selectedStructure,
		amountOfDetectors: 1,
		EWL: 15,
		detector: selectedStructureDetector,
		batteryBackUp: "Tak",
	};
	return initSystem;
}

// Entry point aplikacji, generowanie całego widoku do wproadzenia danych
window.addEventListener("load", () => {
	checkLang();
	translate();
	initSystemData();
	setMobileMenuClickEvent();
	formInit();
	createSystemDataFromAFile();
	handleFormSubmit();
	const guidanceLink = document.querySelector(`.hvacGuidanceLink`);
	guidanceLink.setAttribute(`href`, `${TRANSLATION.hvacGuidance[lang]}`)
});

// Reset pozycji scrolla do początku strony
window.onbeforeunload = function () {
	window.scrollTo(0, 0);
};
