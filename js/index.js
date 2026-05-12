let lang = "pl";

const REVISIONNUMBER = 123;

// Główny obiekt zawierający dane utworzonego systemu - JEDYNE ŹRÓDŁO PRAWDY
let systemData = {
	supplyType: ``,
	wireType: '',
	batteryBackUp: "Tak",
	thRailing: "Nie",
	devicesTypes: { detectors: [], signallers: [] },
	bus: [],
	errorList: [],
	res: null,
	totalPower: 0,
	generatedSupply: null,
	selectedStructure: null,
};

let initSystem = {
	systemIsGenerated: false,
	amountOfDetectors: 1,
	EWL: 15,
	backup: "Nie",
	thRailing: "Tak",
	selectedStructure: null,
	detector: null,
};

const NAVLINKS = {
	tetaGasGuidance: {
		pl: "https://doc.atestgaz.pl/AG/POD/POD-047-PLWydruk.pdf",
		en: "https://doc.atestgaz.pl/AG/POD/POD-047-ENGPrint.pdf"
	},
	dwgSchema: {
		pl: "https://doc.atestgaz.pl/AG/PROJ/PROJ-LIB-037.dwg",
		en: "https://doc.atestgaz.pl/AG/PROJ/PROJ-LIB-037.dwg"
	},
	shop: {
		pl: "https://shop.atestgaz.com/teta-gas-adresowalny/49",
		en: "https://atestgaz.pl/en/main-page/"
	},
	contact: {
		pl: "https://www.atestgaz.pl/kontakt",
		en: "https://atestgaz.pl/en/contact-2/"
	}
};

function createEmptySystemData(overrides = {}) {
	return {
		supplyType: ``,
		wireType: '',
		batteryBackUp: TRANSLATION?.batteryBackUpNo?.[lang] || "Nie",
		thRailing: TRANSLATION?.batteryBackUpYes?.[lang] || "Tak",
		devicesTypes: { detectors: [], signallers: [] },
		bus: [],
		errorList: [],
		res: null,
		totalPower: 0,
		generatedSupply: null,
		selectedStructure: initSystem?.selectedStructure || null,
		...overrides,
	};
}

function setLinksForNavigation() {
	document.querySelectorAll(`.configuratorNavItem a`).forEach(elem => {
		const translationKey = elem.dataset.translate;
		if (NAVLINKS[translationKey]) {
			elem.setAttribute(`href`, NAVLINKS[translationKey][lang]);
		}
	});
}

function setMobileMenuClickEvent() {
	const btn = document.getElementById("navMobileActivationBtn");
	const nav = document.getElementById("configuratorNavMobile");
	const icon = document.querySelector(".navMobileActivationBtnIcon");

	if (!btn || !nav || !icon || btn.dataset.listenerBound === "true") return;

	btn.addEventListener("click", () => {
		nav.classList.toggle("active");
		icon.classList.toggle("active");
	});
	btn.dataset.listenerBound = "true";
}

function configuratorHeaderDesc() {
	const container = document.querySelector(`#configuratorInfo`);
	if (!container) return;

	container.innerHTML = "";

	const infoDescription = document.createElement(`div`);
	infoDescription.classList.add(`infoDescription`);

	const title = document.createElement(`h2`);
	title.classList.add(`configuratorTitle`);
	title.innerText = TRANSLATION.configuratorHeader[lang];

	const tetaGasHeader = document.createElement(`h2`);
	tetaGasHeader.classList.add(`tetaGasRed`);
	tetaGasHeader.innerText = TRANSLATION.teta;

	const tetaGas = document.createElement(`h2`);
	tetaGas.classList.add(`gas`);
	tetaGas.innerText = TRANSLATION.gas;

	const configuratordesc = document.createElement(`p`);
	configuratordesc.classList.add(`configuratorDescription`);
	configuratordesc.setAttribute(`id`, `configuratorDescription`);
	configuratordesc.innerText = `Revision: ${REVISIONNUMBER}`;

	if (lang === `pl`) {
		infoDescription.append(title, tetaGasHeader, tetaGas);
	} else {
		infoDescription.append(tetaGasHeader, tetaGas, title);
	}

	container.appendChild(infoDescription);
	container.appendChild(configuratordesc);
}

function checkLang() {
	const params = new URLSearchParams(window.location.search);
	const langParam = params.get('lang');
	lang = langParam === 'en' ? "en" : "pl";
}

function setTooltipText() {
	document.querySelectorAll(`.tooltip`).forEach(elem => {
		const translationKey = elem.classList[0];
		if (TRANSLATION[translationKey]) {
			elem.setAttribute(`data-text`, TRANSLATION[translationKey][lang]);
		}
	});
}

function getDefaultStructure() {
	if (typeof STRUCTURE_TYPES === 'undefined' || !Array.isArray(STRUCTURE_TYPES) || STRUCTURE_TYPES.length === 0) {
		return null;
	}
	return STRUCTURE_TYPES[0];
}

function getDefaultDetectorForStructure(structure) {
	if (!structure?.devices?.length) return null;
	const selectedStructureGas = structure.detection?.[0];
	return structure.devices.find(device => device.gasDetected === selectedStructureGas) ||
		structure.devices.find(device => device.class === "detector") ||
		structure.devices[0];
}

function initSystemData() {
	const selectedStructure = getDefaultStructure();
	const selectedStructureDetector = getDefaultDetectorForStructure(selectedStructure);

	initSystem = {
		selectedStructure,
		amountOfDetectors: 1,
		EWL: 15,
		detector: selectedStructureDetector,
		backup: TRANSLATION?.batteryBackUpNo?.[lang] || "Nie",
		thRailing: TRANSLATION?.batteryBackUpYes?.[lang] || "Tak",
		systemIsGenerated: false,
	};

	systemData = createEmptySystemData({ selectedStructure });
}

window.addEventListener("load", () => {
	checkLang();

	// Po odświeżeniu zawsze pokazujemy punkt wejścia: formularz.
	document.body.classList.remove("system-active"); document.body.classList.add("scroll-locked");

	if (typeof translate === 'function') translate();
	initSystemData();
	setMobileMenuClickEvent();

	if (typeof formInit === 'function') formInit();
	if (typeof createSystemDataFromAFile === 'function') createSystemDataFromAFile();

	configuratorHeaderDesc();
	setTooltipText();
	setLinksForNavigation();

	const guidanceLink = document.querySelector(`.hvacGuidanceLink`);
	if (guidanceLink && TRANSLATION.hvacGuidance) {
		guidanceLink.setAttribute(`href`, TRANSLATION.hvacGuidance[lang]);
	}
});

window.onbeforeunload = function () {
	window.scrollTo(0, 0);
};
