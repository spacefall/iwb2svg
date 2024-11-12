import { SVG } from "https://cdnjs.cloudflare.com/ajax/libs/svg.js/3.2.4/svg.esm.min.js";
import { batch_parseIWBList, iwbToList } from "./iwb.js";


let previewSvg = SVG();
const fileSelector = document.getElementById('fileSelector');
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

const dndZone = document.getElementById("dndZone");



// cambia la pagina e ricarica la pagina
precBtn.addEventListener("click", () => {
   currPage--;
   refreshPagina();
});

nextBtn.addEventListener("click", () => {
    currPage++;
    refreshPagina();
})

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

// caricamento file

// evita di aprire il file come nuova tab
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dndZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});

// animazione
['dragenter', 'dragover'].forEach(eventName => {
    dndZone.addEventListener(eventName, () => dndZone.classList.add("dropping"))
});

['dragleave', 'drop'].forEach(eventName => {
    dndZone.addEventListener(eventName, () => dndZone.classList.remove("dropping"))
});

// carica file con selettore manuale
fileSelector.addEventListener('change', (event) => {
    const fileList = event.target.files;
    if (fileList.length === 0) return;
    handleFile(fileList[0]);
});

// carica file da drag and drop
dndZone.addEventListener('drop', (event) => {
    let dt = event.dataTransfer;
    let files = dt.files;
    handleFile(files[0]);
})

// gestisci il file "caricato"
function handleFile(file) {
    if (!file.name.endsWith(".iwb")) {
        console.error("Input invalido");
        return;
    }
    const reader = new FileReader();
    const prDiv = document.getElementById("previewdiv");

    reader.addEventListener("loadend", () => {
        let data = reader.result;
        pageList = iwbToList(data);
        currPage = 0;
        if (prDiv.classList.contains("hide")) prDiv.classList.remove("hide");
        rigeneraPagine();
    });
    reader.readAsText(file);
}
