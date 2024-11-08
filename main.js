const previewSvg = SVG("#preview", true)
const iwbFile = document.getElementById('iwb-loader');
const svgPadding = 250;
let currPage = 0;
let pageList = [];

let svgList = [];

const touchChk = document.getElementById("touchChk");
const pennaChk = document.getElementById("pennaChk");
const precisioneChk = document.getElementById("precisioneChk");
const cancellatiChk = document.getElementById("cancellatiChk");

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

// praticamente un wrapper di parseIWB che fa il parse di tutte le pagine in modo asincrono
async function buildSvgList(pages) {
    let promises = [];
    let list = [];
    pages.forEach((page) => {
        promises.push(parseIWB(page, cancellatiChk.checked/*, pennaChk.checked, touchChk.checked*/));
    })
    let results = await Promise.allSettled(promises);
    results.forEach((r) => {
        list.push(r.value);
    })
    return list;
}

function refreshPagina() {
    if (pageList.length === 0) return;
    //pr.value = "0";
    //pr.max = pageList[currPage].length-1;
    previewSvg.clear();
    document.getElementById("pagina").innerText = currPage + 1;
    previewSvg.svg(svgList[currPage][0]);
    previewSvg.css("background-color", svgList[currPage][1]);
    //parseIWB(pageList[currPage], cancellatiChk.checked, pennaChk.checked, touchChk.checked);
}

iwbFile.addEventListener('change', (event) => {
    const fileList = event.target.files;
    const reader = new FileReader();

    reader.addEventListener("loadend", () => {
        let data = reader.result;
        pageList = iwbToList(data);
        currPage = 0;
        console.time("parsingnew");
        buildSvgList(pageList).then((value) => {
            console.timeEnd("parsingnew");
            svgList = value;
            refreshPagina();
        });
    });
    reader.readAsText(fileList[0]);
});


function funfun() {
    return "fünfhundertfünfundfünfzigtausendfünfhundertfünfundfünfzig";
}