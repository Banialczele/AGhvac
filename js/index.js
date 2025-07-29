// Ustawienie domyślnego języka widoku aplikacji
let lang = "pl";

const REVISIONNUMBER = 123;

// Główny obiekt zawierający dane utworzonego systemu
let systemData = {
	supplyType: ``,
	wiretype: '',
	devicesTypes: { detectors: [], signallers: [] },
	bus: [],
	errorList: []
};

let initSystem = {
	systemIsGenerated: false
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
}

function setLinksForNavigation() {
	document.querySelectorAll(`.configuratorNavItem a`).forEach(elem => {
		if (NAVLINKS[elem.dataset.translate]) {
			elem.setAttribute(`href`, NAVLINKS[elem.dataset.translate][lang])
		}
	})
}

// Etykiety dla widoku aplikacji w obsługiwanych przez aplikację językach

// Ustawienie nasłuchiwania na przycisku mobilnego menu
function setMobileMenuClickEvent() {
	document.getElementById("navMobileActivationBtn").addEventListener("click", () => {
		document.getElementById("configuratorNavMobile").classList.toggle("active");
		document.querySelector(".navMobileActivationBtnIcon").classList.toggle("active");
	});
}

function configuratorHeaderDesc() {
	const container = document.querySelector(`#configuratorInfo`);

	const infoDescription = document.createElement(`div`);
	infoDescription.classList.add(`infoDescription`);

	const title = document.createElement(`h2`);
	title.classList.add(`configuratorTitle`);

	const tetaGasHeader = document.createElement(`h2`);
	const tetaGas = document.createElement(`h2`);

	tetaGasHeader.classList.add(`tetaGasRed`);
	tetaGas.classList.add(`gas`);

	title.innerText = TRANSLATION.configuratorHeader[lang];
	tetaGasHeader.innerText = TRANSLATION.teta;
	tetaGas.innerText = TRANSLATION.gas;

	const configuratordesc = document.createElement(`p`);
	configuratordesc.classList.add(`configuratorDescription`);
	configuratordesc.setAttribute(`id`, `configuratorDescription`);
	configuratordesc.innerText = REVISIONNUMBER;

	if (lang === `pl`) {
		infoDescription.appendChild(title);
		infoDescription.appendChild(tetaGasHeader);
		infoDescription.appendChild(tetaGas);
	} else {
		infoDescription.appendChild(tetaGasHeader);
		infoDescription.appendChild(tetaGas);
		infoDescription.appendChild(title);
	}
	container.appendChild(infoDescription);
	container.appendChild(configuratordesc)

}

function checkLang() {
	let HREF = window.location.href;

	if (HREF.includes(`lang=pl`) || !HREF.includes(`lang`)) {
		lang = "pl";
	} else if (HREF.includes(`lang=en`)) {
		lang = "en";
	}
}

function setTooltipText() {
	document.querySelectorAll(`.tooltip`).forEach(elem => {
		elem.setAttribute(`data-text`, TRANSLATION[elem.classList[0]][lang]);
	})
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
	configuratorHeaderDesc();
	setTooltipText();
	setLinksForNavigation();
	const guidanceLink = document.querySelector(`.hvacGuidanceLink`);
	guidanceLink.setAttribute(`href`, `${TRANSLATION.hvacGuidance[lang]}`)
});

// Reset pozycji scrolla do początku strony
window.onbeforeunload = function () {
	window.scrollTo(0, 0);
};


