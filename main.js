const svg = SVG("#preview")
const iwbFile = document.getElementById('iwb-loader');
const svgPadding = 250;
let currPage = 0;
let pageList = [];

const touchChk = document.getElementById("touchChk");
const pennaChk = document.getElementById("pennaChk");
const precisioneChk = document.getElementById("precisioneChk");
const cancellatiChk = document.getElementById("cancellatiChk");

// Trasforma la lista di punti in stringhe per uso con polyline, saltando i cambiamenti di spessore per velocità
function pointsConvQuick(points) {
    let pointStr = points.map(ptArray => ptArray.slice(0, 2).join(",")).join(' ');
    return [[1, pointStr]];
}

// Trasforma la lista di punti in stringhe per uso con polyline, separando anche i punti per spessore
// in modo da avere una conversione più precisa
function pointsConvPrecision(points) {
    const ptList = [];
    let thList = [1, ""];
    let lastPoint = "";
    points.forEach((ptArray) => {
        let thickness = parseFloat(ptArray[2]);
        let curPt = ptArray.slice(0, 2).join(",");
        if (thList[0] === thickness) {
            thList[1] += " " + curPt;
        } else {
            ptList.push(thList);
            thList = [thickness, lastPoint + curPt];
        }
        lastPoint = curPt + " ";
    })
    ptList.push(thList);
    return ptList;
}

// Questa funzione converte l'int del colore in hex, inoltre siccome la lavagna salva il colore in ARGB, lo converte in RGBA
function signedInt2Hex(n) {
    let hexNum = (n >>> 0).toString(16);
    return "#" + hexNum.substring(2) + hexNum.substring(0, 2);
}

// cancella i tag non riconosciuti (che al momento sono inutili) per velocizzare la conversione e divide tutto in pagine
function parseInput(iwb) {
    let pages = [];
    let lines = iwb.split("\n");
    lines.forEach(curLine => {
        switch (curLine.substring(0, 2)) {
            case "p{":
                pages.push([]);
                pages[pages.length - 1].push(curLine);
                break;

            case "g:":
                pages[pages.length - 1].push(curLine);
                break;

            case "a:":
            case "pm":
            case "am":
            case "":
                break;

            default:
                console.log("Rimuovendo attributo sconosciuto: ", curLine);
                break;
        }
    })
    return pages;
}

function parseIWB(lines, deleted = false, input_penna = true, input_dita = true) {
    console.time("parsing");
    //console.log(lines)
    for (let i = 0; i < lines.length; i++) {
        let lineJson = lines[i].substring(lines[i].indexOf("{"));
        let jsonData = JSON.parse(lineJson);
        let skipTransform = false;
        let err = false;

        switch (lines[i].charAt(0)) {
            case "g":
                let obj;
                let strokeObj = {color: signedInt2Hex(jsonData.props.color), width: jsonData.ps};

                if (!deleted && !jsonData.delete) continue;
                switch (jsonData.type) {
                    case 1: // scrittura
                        strokeObj.linecap = "round";
                        strokeObj.linejoin = "round";
                        if (precisioneChk.checked) {
                            const pointList = pointsConvPrecision(jsonData.points);
                            skipTransform = true;
                            pointList.map((pt) => {
                                if ((input_dita && jsonData.pt === 1) || (input_penna && jsonData.pt === 2)) {
                                    const strokeUpd = {...strokeObj};
                                    strokeUpd.width = strokeUpd.width * pt[0];

                                    obj = svg.polyline(pt[1]).fill("none").stroke(strokeUpd);
                                    if ("transform" in jsonData) {
                                        let t = jsonData.transform;
                                        obj.transform({a: t[0], b: t[1], c: t[2], d: t[3], e: t[4], f: t[5]});
                                    }
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

                    case 9: // linea retta
                    case 11: // linea tratteggiata
                    case 13: // freccia
                        obj = svg.line(jsonData.pps[0], jsonData.pps[1], jsonData.ppe[0], jsonData.ppe[1]);

                        if (jsonData.type === 11) {
                            strokeObj.dasharray = "10,10";
                        } else {
                            strokeObj.linecap = "round";
                            strokeObj.linejoin = "round";
                        }

                        if (jsonData.type === 13) {
                            obj.marker('end', 8, 5, function (add) {
                                add.polygon("0 0, 8 2.5, 0 5").fill(strokeObj.color)
                            })
                        }

                        obj.stroke(strokeObj);
                        break;

                    case 10: // ellisse
                        const w = jsonData.rect[2] - jsonData.rect[0];
                        const h = jsonData.rect[3] - jsonData.rect[1];
                        if (jsonData.rect.toString() === jsonData.props.toString()) {
                            console.log("Trovato ellisse malformato, sarà trattato come un ellisse non riempito e senza trasparenza")
                            strokeObj.color = jsonData.pc;
                        }
                        obj = svg.ellipse(w, h).x(jsonData.rect[0]).y(jsonData.rect[1]).stroke(strokeObj);
                        break;

                    case 12: // cerchio
                        obj = svg.circle()
                            .radius(jsonData.cr)
                            .x(jsonData.cx - jsonData.cr)
                            .y(jsonData.cy - jsonData.cr)
                            .stroke(strokeObj);
                        break;

                    case 14: // triangolo
                    case 15: // esagono
                    case 16: // quadrilateri: trapezio, parallelepipedo, quadrato, rettangolo
                        let points = jsonData.rect || jsonData.pp;
                        let ptStr = points.join(" ");
                        obj = svg.polygon(ptStr).stroke(strokeObj);
                        break;

                    default:
                        console.log("Tag sconosciuto: ", jsonData.type, jsonData);
                        err = true;
                        break;
                }
                if (!err) {
                    ("fill" in jsonData) && jsonData.props.fill ? obj.fill(strokeObj.color) : obj.fill("none");

                    if ("transform" in jsonData && !skipTransform && !err) {
                        let t = jsonData.transform;
                        obj.transform({a: t[0], b: t[1], c: t[2], d: t[3], e: t[4], f: t[5]});
                    }
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
    svg.viewbox([box.x - (svgPadding / 2), box.y - (svgPadding / 2), box.width + svgPadding, box.height + svgPadding])
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
