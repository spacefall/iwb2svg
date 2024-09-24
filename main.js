let svg = SVG().addTo('body');
let currPage = 0;
let globalPages = [];

function pointsConversion(points) {
    let pointsStr = "";
    for (let i = 0; i < points.length; i++) {
        pointsStr += points[i][0] + "," + points[i][1] + " ";
    }
    return pointsStr;
}

// TODO: controlla se il numero è codificato in argb e ff iniziali non sono quindi un artefatto
//  bisogna fare test con la trasparenza, nel frattempo il numero viene convertito in rgba
function signedInt2Hex(n) {
    let hexNum = (n >>> 0).toString(16);
    return "#" + hexNum.substring(2) + hexNum.substring(0,2);
}

// cancella i tag non riconosciuti (che al momento sono inutili) per velocizzare la conversione e divide tutto in pagine
function parseInput(iwb) {
    let pages = [];
    let lines = iwb.split("\n");
    for (let i = 0; i<lines.length; i++) {
        let curLine = lines[i];
        switch (curLine.substring(0,2)) {
            case "p{":
                pages.push([]);
                pages[pages.length-1].push(curLine);
                break;
            case "g:":
                pages[pages.length-1].push(curLine);
                break;
        }
    }
    console.log(pages);
    return pages;
}

function parseIWB(iwb, deleted = false, input_penna = true, input_dita = true) {
    let lines = iwb
    console.log(lines)
    for (let i = 0; i < lines.length; i++) {
        let lineJson = lines[i].substring(lines[i].indexOf("{"));
        let jsonData = JSON.parse(lineJson);
        switch (lines[i].charAt(0)) {
            case "g":
                if (jsonData.delete || deleted) {
                    let polyline = svg.polyline(pointsConversion(jsonData.points)).fill("none");
                    if (input_dita && jsonData.pt === 1) polyline.stroke({color: jsonData.pc, width: jsonData.ps});
                    if (input_penna && jsonData.pt === 2) polyline.stroke({color: jsonData.pc, width: jsonData.ps});
                    if ("transform" in jsonData) {
                        let matrix = jsonData.transform;
                        polyline.transform({a:matrix[0], b:matrix[1], c:matrix[2], d:matrix[3], e:matrix[4], f:matrix[5]});
                    }
                }

                break;

            case "p":
                if (lines[i].charAt(1) === "{") {
                    console.log(jsonData);
                    svg.css("background-color", signedInt2Hex(jsonData.bg.bc));
                }
                break;
            default:
                break;
        }
    }
    let box = svg.bbox();
    svg.viewbox([box.x, box.y, box.width, box.height]);
}

const fileSelector = document.getElementById('file-selector');
fileSelector.addEventListener('change', (event) => {
    const fileList = event.target.files;
    const reader = new FileReader();
    svg.clear();
    reader.addEventListener("loadend", () => {
        let data = reader.result;
        globalPages = parseInput(data);
        currPage = 0;
        parseIWB(globalPages[currPage], false, true, true)
        //parseIWB(data, false, true, true);
    });
    reader.readAsText(fileList[0]);
});

function nextpage() {
    if (currPage < globalPages.length) currPage++;
    svg.clear();
    document.getElementById("pcorr").innerText = currPage;
    parseIWB(globalPages[currPage], false, true, true)
}

function prevpage() {
    if (currPage > 0) currPage--;
    svg.clear();
    document.getElementById("pcorr").innerText = currPage;
    parseIWB(globalPages[currPage], false, true, true)
}

//parseIWB(iwbfile, false, true, true);