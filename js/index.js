let lang = "pl";

const REVISIONNUMBER = 123;

// Główny obiekt zawierający dane utworzonego systemu - JEDYNE ŹRÓDŁO PRAWDY
let systemData = {
	supplyType: ``,
	wireType: '',        // Optymalizacja: ujednolicony klucz (CamelCase)
	batteryBackUp: "Tak",
	thRailing: "Nie",    // Dodane: obsługa montażu na szynie TH35
	devicesTypes: { detectors: [], signallers: [] },
	bus: [],
	errorList: [],
	res: null,           // Przechowuje wyniki z AnalysisEngine
	totalPower: 0,
	generatedSupply: null,
	selectedStructure: null
};

let initSystem = {
	systemIsGenerated: false,
	amountOfDetectors: 1,
	EWL: 15,
	backup: "Nie",
	thRailing: "Tak",
	selectedStructure: null,
	detector: null
};


function getDefaultStructure() {
	if (typeof STRUCTURE_TYPES === 'undefined' || !Array.isArray(STRUCTURE_TYPES) || STRUCTURE_TYPES.length === 0) return null;
	return STRUCTURE_TYPES.find(structure => {
		const pl = String(structure?.type?.pl || "").trim().toLowerCase();
		const en = String(structure?.type?.en || "").trim().toLowerCase();
		return pl === "inne" || en === "other";
	}) || STRUCTURE_TYPES[0];
}

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
		selectedStructure: initSystem?.selectedStructure || getDefaultStructure(),
		...overrides,
	};
}

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

// Funkcja ustawiająca linki nawigacyjne na podstawie datasetów
function setLinksForNavigation() {
	document.querySelectorAll(`.configuratorNavItem a`).forEach(elem => {
		const translationKey = elem.dataset.translate;
		if (NAVLINKS[translationKey]) {
			elem.setAttribute(`href`, NAVLINKS[translationKey][lang]);
		}
	});
}

// Ustawienie nasłuchiwania na przycisku mobilnego menu
function setMobileMenuClickEvent() {
	const btn = document.getElementById("navMobileActivationBtn");
	const nav = document.getElementById("configuratorNavMobile");
	const icon = document.querySelector(".navMobileActivationBtnIcon");

	if (!btn || !nav || !icon || btn.dataset.listenerBound === "true") return;

	const closeMenu = () => {
		nav.classList.remove("active");
		icon.classList.remove("active");
		btn.setAttribute("aria-expanded", "false");
		btn.setAttribute("aria-label", lang === "en" ? "Open menu" : "Otwórz menu");
	};

	const openMenu = () => {
		nav.classList.add("active");
		icon.classList.add("active");
		btn.setAttribute("aria-expanded", "true");
		btn.setAttribute("aria-label", lang === "en" ? "Close menu" : "Zamknij menu");
	};

	btn.addEventListener("click", () => {
		nav.classList.contains("active") ? closeMenu() : openMenu();
	});

	nav.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", closeMenu);
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") closeMenu();
	});

	btn.dataset.listenerBound = "true";
}

// Generowanie nagłówka konfiguratora
function configuratorHeaderDesc() {
	const container = document.querySelector(`#configuratorInfo`);
	if (!container) return;

	container.innerHTML = ""; // Czyścimy przed renderowaniem

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

	// Logika kolejności wyświetlania zależna od języka
	if (lang === `pl`) {
		infoDescription.append(title, tetaGasHeader, tetaGas);
	} else {
		infoDescription.append(tetaGasHeader, tetaGas, title);
	}

	container.appendChild(infoDescription);
	container.appendChild(configuratordesc);
}

// Sprawdzanie języka na podstawie parametrów URL
function checkLang() {
	const params = new URLSearchParams(window.location.search);
	const langParam = params.get('lang');

	if (langParam === 'en') {
		lang = "en";
	} else {
		lang = "pl";
	}
}

// Ustawianie tekstów tooltipów na podstawie klas i tłumaczeń
function setTooltipText() {
	document.querySelectorAll(`.tooltip`).forEach(elem => {
		const translationKey = elem.classList[0]; // Pierwsza klasa jako klucz
		if (TRANSLATION[translationKey]) {
			elem.setAttribute(`data-text`, TRANSLATION[translationKey][lang]);
		}
	});
}

// Inicjalizacja domyślnych danych systemu
function initSystemData() {
	if (typeof STRUCTURE_TYPES === 'undefined') return;

	const selectedStructure = getDefaultStructure();
	const selectedStructureGas = selectedStructure?.detection?.[0];
	const selectedStructureDetector = selectedStructure?.devices?.find(device => device.gasDetected === selectedStructureGas)
		|| selectedStructure?.devices?.find(device => device.class === "detector")
		|| null;

	initSystem = {
		selectedStructure: selectedStructure,
		amountOfDetectors: 1,
		EWL: 15,
		detector: selectedStructureDetector,
		backup: TRANSLATION?.batteryBackUpNo?.[lang] || "Nie",
		thRailing: TRANSLATION?.batteryBackUpYes?.[lang] || "Tak",
		systemIsGenerated: false
	};

	systemData = createEmptySystemData({ selectedStructure });
}

// Entry point aplikacji
window.addEventListener("load", () => {
	checkLang();
	translate(); // Funkcja z translator.js
	initSystemData();
	setMobileMenuClickEvent();

	// Inicjalizacja formularza i wczytywanie danych
	if (typeof formInit === 'function') formInit();
	if (typeof createSystemDataFromAFile === 'function') createSystemDataFromAFile();
	if (typeof handleFormSubmit === 'function') handleFormSubmit();

	configuratorHeaderDesc();
	setTooltipText();
	setLinksForNavigation();

	// Link do wytycznych HVAC
	const guidanceLink = document.querySelector(`.hvacGuidanceLink`);
	if (guidanceLink && TRANSLATION.hvacGuidance) {
		guidanceLink.setAttribute(`href`, TRANSLATION.hvacGuidance[lang]);
	}
});

// Reset pozycji scrolla przy przeładowaniu
window.onbeforeunload = function () {
	window.scrollTo(0, 0);
};