const previewSvg = SVG("#preview", true)
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

// cambia la pagina assicurandosi che non vada sotto 0 e sopra le pagine disponibili, poi carica la pagina corretta
function cambioPagina(prec) {
    if (prec) {
        if (currPage-1 < 0) return;
        currPage--;
    } else {
        if (currPage+1 >= pageList.length) return;
        currPage++;
    }
    refreshPagina();
}

// pulisce il svg, aggiorna l'indicatore della pagina e carica l'svg della pagina corretta
function refreshPagina() {
    if (pageList.length === 0) return;
    previewSvg.clear();
    document.getElementById("pagina").innerText = currPage + 1;
    previewSvg.svg(svgList[currPage][0]);
    previewSvg.css("background-color", svgList[currPage][1]);
    //parseIWB(pageList[currPage], cancellatiChk.checked, pennaChk.checked, touchChk.checked);
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
    if (fileList.length === 0) return;
    const reader = new FileReader();

    reader.addEventListener("loadend", () => {
        let data = reader.result;
        pageList = iwbToList(data);
        currPage = 0;
        rigeneraPagine();
    });
    reader.readAsText(fileList[0]);
});

// idk easteregg?
function funfun() {
    return "fünfhundertfünfundfünfzigtausendfünfhundertfünfundfünfzig";
}