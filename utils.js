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

// Trasforma la lista di punti in stringhe per uso con polyline, saltando i cambiamenti di spessore per velocità
function pointsConvQuickOld(points) {
    let pointStr = points.map(ptArray => ptArray.slice(0, 2).join(",")).join(' ');
    return [[1, pointStr]];
}

// Questa funzione converte l'int del colore in hex, inoltre siccome la lavagna salva il colore in ARGB, lo converte in RGBA
function signedInt2Hex(n) {
    let hexNum = (n >>> 0).toString(16);
    return "#" + hexNum.substring(2) + hexNum.substring(0, 2);
}
