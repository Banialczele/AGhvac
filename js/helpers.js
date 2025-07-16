function setAttributes(el, attrs) {
    Object.keys(attrs).forEach(key => el.setAttribute(key, attrs[key]));
}

function setDate() {
    const date = new Date();
    return `${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}__${date.getHours()}_${date.getMinutes()}`;
}

// // Pomocniczy skrót do tworzenia elementów z atrybutami
function el(tag, attrs = {}, children = []) {
	const element = document.createElement(tag);
	const df = document.createDocumentFragment();
	// Ustaw atrybuty
	Object.entries(attrs).forEach(([key, val]) => {
		if (val !== false && val !== null && val !== undefined) {
			element.setAttribute(key, val);
		}
	});

	// Obsługa dzieci (tekst, element, tablica)
	if (!Array.isArray(children)) {
		children = [children];
	}

	children.forEach(child => {
		if (typeof child === "string") {
			df.appendChild(document.createTextNode(child));
		} else if (child instanceof Node) {
			df.appendChild(child);
		}
	});
	element.appendChild(df);
	return element;
}