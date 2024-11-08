// Trasforma la lista di punti in stringhe per uso con polyline, saltando i cambiamenti di spessore per velocità
function pointsConv(points) {
    return points.map(ptArray => ptArray[0] + "," + ptArray[1] + " ").join(" ");
}

// Questa funzione converte l'int del colore in hex, inoltre siccome la lavagna salva il colore in ARGB, lo converte in RGBA
function intToHexColor(n) {
    let hexNum = (n >>> 0).toString(16);
    return "#" + hexNum.substring(2) + hexNum.substring(0, 2);
}