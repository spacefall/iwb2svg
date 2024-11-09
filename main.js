let previewSvg = SVG();
const iwbFile = document.getElementById('iwb-loader');
const svgPadding = 250;

// gestione pagine
let currPage = 0;
let pageList = [];
let svgList = [];

// checkbox
const touchChk = document.getElementById("touchChk");
const pennaChk = document.getElementById("pennaChk");
const precisioneChk = document.getElementById("precisioneChk");
const cancellatiChk = document.getElementById("cancellatiChk");

const paginaTxt = document.getElementById("pagina");
const precBtn = document.getElementsByClassName("minibtn")[0];
const nextBtn = document.getElementsByClassName("minibtn")[1];

// cambia la pagina e carica la pagina corretta, le pagine invalide
function cambioPagina(prec) {
    if (prec) currPage--; else currPage++;
    refreshPagina();
}

// pulisce il svg, aggiorna l'indicatore della pagina e carica l'svg della pagina corretta
function refreshPagina() {
    if (pageList.length === 0) return;

    previewSvg.remove();
    previewSvg = svgList[currPage].clone().addTo("#preview");
    paginaTxt.innerText = currPage + 1;

    precBtn.disabled = (currPage - 1 < 0) ? "disabled" : "";
    nextBtn.disabled = (currPage + 1 >= pageList.length) ? "disabled" : "";
}

// forza un regen delle pagine già caricate
function rigeneraPagine() {
    batch_parseIWBList(pageList, cancellatiChk.checked, pennaChk.checked, touchChk.checked, precisioneChk.checked, svgPadding).then((value) => {
        svgList = value;
        refreshPagina();
    })
}

// carica il file e avvia l'elaborazione
iwbFile.addEventListener('change', (event) => {
    const fileList = event.target.files;
    if (fileList.length === 0 || !fileList[0].name.endsWith(".iwb")) {
        console.error("Input invalido");
        return;
    }
    const reader = new FileReader();

    reader.addEventListener("loadend", () => {
        let data = reader.result;
        pageList = iwbToList(data);
        currPage = 0;
        document.getElementById("previewdiv").style.display = "block";
        rigeneraPagine();
    });
    reader.readAsText(fileList[0]);
});

// idk easteregg?
function funfun() {
    return "fünfhundertfünfundfünfzigtausendfünfhundertfünfundfünfzig";
}