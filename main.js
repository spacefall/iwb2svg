const svg = SVG("#preview")
const iwbFile = document.getElementById('iwb-loader');
let currPage = 0;
let pageList = [];

const touchChk = document.getElementById("touchChk");
const pennaChk = document.getElementById("pennaChk");
const precisioneChk = document.getElementById("precisioneChk");
const cancellatiChk = document.getElementById("cancellatiChk");

// Trasforma la lista di punti in stringhe per uso con polyline, saltando i cambiamenti di spessore per velocità
function pointsConvQuick(points) {
    const ptList = [[1, ""]]
    points.map((ptArray) => {
        ptList[0][1] += `${ptArray[0]},${ptArray[1]} `;
    })
    return ptList;
}

// Trasforma la lista di punti in stringhe per uso con polyline, separando anche i punti per spessore
// in modo da avere una conversione più precisa
function pointsConvPrecision(points) {
    const ptList = [];
    let thList = [0];
    let lastPoint = "";
    points.map((ptArray) => {
        let thickness = parseFloat(ptArray[2])
        if (thList[0] === thickness) {
            thList[1] += ` ${ptArray[0]},${ptArray[1]}`;
        } else {
            if (thList[0] !== 0) ptList.push(thList);
            thList = [thickness, `${lastPoint}${ptArray[0]},${ptArray[1]}`];
        }
        lastPoint = `${ptArray[0]},${ptArray[1]} `;
    })
    ptList.push(thList);
    return ptList;
}

// Questa funzione converte l'int con segno del colore in hex, per un utilizzo più semplice
// Il numero pare essere in ARGB al posto di RGBA, siccome nello sfondo la trasparenza non esiste,
//  non ho la certezza che il canale alpha non sia solo il loro modo di indicare un colore;
//  sarebbe quindi utile effettuare dei test con la penna in trasparenza, anche se questa funzione è stata rimossa. (nelle versioni aggiornate della lavagna)
//  Al momento però questa funzione lo trasforma in RGBA che produce comunque gli stessi risultati.
// TODO: test penna trasparenza, vedi sopra
function signedInt2Hex(n) {
    let hexNum = (n >>> 0).toString(16);
    return "#" + hexNum.substring(2) + hexNum.substring(0, 2);
}

// cancella i tag non riconosciuti (che al momento sono inutili) per velocizzare la conversione e divide tutto in pagine
function parseInput(iwb) {
    let pages = [];
    let lines = iwb.split("\n");
    for (let i = 0; i < lines.length; i++) {
        let curLine = lines[i];
        let curLineCut = curLine.substring(0, 2);
        switch (curLine.substring(0, 2)) {
            case "p{":
                pages.push([]);
                pages[pages.length - 1].push(curLine);
                break;
            case "g:":
                pages[pages.length - 1].push(curLine);
                break;
            default:
                if (!["a:", "pm", "am", ""].includes(curLineCut)) console.log("Rimuovendo attributo sconosciuto: ", curLine);
        }
    }
    //console.log(pages);
    return pages;
}

function parseIWB(iwb, deleted = false, input_penna = true, input_dita = true) {
    let lines = iwb
    console.time("parsing");
    //console.log(lines)
    for (let i = 0; i < lines.length; i++) {
        let lineJson = lines[i].substring(lines[i].indexOf("{"));
        let jsonData = JSON.parse(lineJson);

        switch (lines[i].charAt(0)) {
            case "g":
                const pColor = signedInt2Hex(jsonData.props.color);
                const pSize = jsonData.ps;
                let obj;
                let strokeObj;

                if (!deleted && !jsonData.delete) continue;
                switch (jsonData.type) {
                    case 1:
                        strokeObj = {color: pColor, width: pSize, linecap: "round", linejoin: "round"};
                        if (precisioneChk.checked) {
                            const pointList = pointsConvPrecision(jsonData.points);
                            pointList.map((pt) => {
                                if ((input_dita && jsonData.pt === 1) || (input_penna && jsonData.pt === 2)) {
                                    const strokeUpd = {...strokeObj};
                                    strokeUpd.width = strokeUpd.width * pt[0];

                                    obj = svg.polyline(pt[1]).fill("none").stroke(strokeUpd);
                                }
                            });
                        } else {
                            const pointList = pointsConvQuick(jsonData.points);
                            pointList.map((pt) => {
                                if ((input_dita && jsonData.pt === 1) || (input_penna && jsonData.pt === 2)) {
                                    obj = svg.polyline(pt[1]).fill("none").stroke(strokeObj);
                                }
                            });
                        }
                        break;

                    case 9:
                    case 11:
                    case 13:
                        strokeObj = {color: jsonData.pc, width: jsonData.ps};
                        obj = svg.line(jsonData.pps[0], jsonData.pps[1], jsonData.ppe[0], jsonData.ppe[1]);

                        if (jsonData.type === 11) {
                            strokeObj.dasharray = "10,10";
                        } else {
                            strokeObj.linecap = "round";
                            strokeObj.linejoin = "round";
                        }

                        if (jsonData.type === 13) {
                            obj.marker('end', 8, 5, function (add) {
                                add.polygon("0 0, 8 2.5, 0 5").fill(pColor)
                            })
                        }

                        obj.stroke(strokeObj);
                        break;

                    default:
                        console.log("Tipo di scrittura sconosciuto: ", lines[i].substring(2, lines[i].indexOf(":", 2)));
                        console.log(lines[i]);
                        break;
                }
                if ("transform" in jsonData) {
                    let t = jsonData.transform;
                    obj.transform({a: t[0], b: t[1], c: t[2], d: t[3], e: t[4], f: t[5]});
                }
                break;

            case "p":
                svg.css("background-color", signedInt2Hex(jsonData.bg.bc));
                break;
            default:
                break;
        }
    }
    let box = svg.bbox();
    let padding = 250;
    svg.viewbox([box.x - (padding / 2), box.y - (padding / 2), box.width + padding, box.height + padding]);
    console.timeEnd("parsing");
}

function cambioPagina(prec) {
    const oldPage = currPage
    if (prec) currPage--; else currPage++;
    if (currPage >= pageList.length) currPage = pageList.length - 1;
    if (currPage < 0) currPage = 0;
    if (currPage !== oldPage) refreshPagina();
}

function refreshPagina() {
    if (pageList.length === 0) return;
    svg.clear();
    document.getElementById("pagina").innerText = currPage + 1;
    parseIWB(pageList[currPage], cancellatiChk.checked, pennaChk.checked, touchChk.checked);
}

iwbFile.addEventListener('change', (event) => {
    const fileList = event.target.files;
    const reader = new FileReader();

    reader.addEventListener("loadend", () => {
        let data = reader.result;
        pageList = parseInput(data);
        currPage = 0;
        refreshPagina();
    });
    reader.readAsText(fileList[0]);
});
