function translate() {
  const data = document.querySelectorAll("[data-translate]");

  data.forEach((elem, i) => {
    const element = data[i];
    const key = element.getAttribute("data-translate");
    const translation = TRANSLATION[key]?.[lang];
    if (translation) {
      element.textContent = translation;
    }
  });
}