import { SVG } from "https://cdnjs.cloudflare.com/ajax/libs/svg.js/3.2.4/svg.esm.min.js";
import { intToHexColor } from "./utils.js";
import { typeHandlers, writingHandler } from "./typeHandle.js";

// esegue la conversione da iwb (in formato lista) a svg
async function parseIWBList(lines, deleted, penIn, touchIn, precision, padding) {
    let svgObj = SVG();
    let promises = lines.slice(1).map(line => parseIWB_gTag(line, svgObj, deleted, penIn, touchIn, precision));

    const pTagJson = JSON.parse(lines[0].substring(lines[0].indexOf("{")));
    svgObj.css("background-color", intToHexColor(pTagJson.bg.bc));
    let results = await Promise.allSettled(promises);

    results.forEach((r) => {
        if (r.status === "rejected") {
            console.error("Errore nella conversione: " + r.reason);
        }
    });

    let box = svgObj.bbox();
    svgObj.viewbox([box.x - (padding / 2), box.y - (padding / 2), box.width + padding, box.height + padding]);
    return svgObj;
}

// esegue il parse di un tag "g"
async function parseIWB_gTag(tag, svgElem, deleted, penIn, touchIn, precision) {
    const jsonData = JSON.parse(tag.substring(tag.indexOf("{")));
    const strokeObj = {color: intToHexColor(jsonData.props.color), width: jsonData.ps};
    if (!deleted && !jsonData.delete) return;
    let svgObj;

    if (jsonData.type === 1) {
        if ((touchIn && jsonData.pt === 1) || (penIn && jsonData.pt === 2)) {
            svgObj = writingHandler(jsonData, strokeObj, svgElem, precision);
        } else return;
    } else if (typeHandlers[jsonData.type]) {
        svgObj = typeHandlers[jsonData.type](jsonData, strokeObj, svgElem);
        svgObj.stroke(strokeObj);
    } else {
        console.log("Incontrato un tag 'g' sconosciuto di tipo " + jsonData.type + ":\n" + jsonData);
        return;
    }

    ("fill" in jsonData) && jsonData.props.fill ? svgObj.fill(strokeObj.color) : svgObj.fill("none");

    if ("transform" in jsonData) {
        let t = jsonData.transform;
        svgObj.transform({a: t[0], b: t[1], c: t[2], d: t[3], e: t[4], f: t[5]});
    }
}

// semplifica un iwb rimuovendo le cose (ritenute) inutili e dividendo le pagine in liste al posto di essere limitate da tag
export function iwbToList(iwb) {
    let pages = [];
    iwb.split("\n").forEach(line => {
        if (line.startsWith("p{")) {
            pages.push([line]);
        } else if (line.startsWith("g:")) {
            pages[pages.length - 1].push(line);
        } else if (!["a:", "pm", "am", ""].includes(line.substring(0, 2))) {
            console.log("Rimuovendo attributo sconosciuto: ", line);
        }
    });
    return pages;
}

// praticamente un wrapper di parseIWB che fa il parse di tutte le pagine in modo asincrono
export async function batch_parseIWBList(pages, deleted, penIn, touchIn, precision, padding) {
    const promises = pages.map(page => parseIWBList(page, deleted, penIn, touchIn, precision, padding));
    const results = await Promise.allSettled(promises);
    return results.map(r => r.value);
}