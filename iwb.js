async function parseIWBTagG(tag, svgElem, deleted, progress) {
    const jsonData = JSON.parse(tag.substring(tag.indexOf("{")));
    const strokeObj = {color: signedInt2Hex(jsonData.props.color), width: jsonData.ps};
    if (!deleted && !jsonData.delete) {
        progress.value++;
        return;
    }
    let svgObj;

    if (typeHandlers[jsonData.type]) {
        svgObj = typeHandlers[jsonData.type](jsonData, strokeObj, svgElem);
    } else {
        console.log("Incontrato un tag 'g' sconosciuto di tipo " + jsonData.type + ":\n" + jsonData);
        return;
    }

    svgObj.stroke(strokeObj);
    ("fill" in jsonData) && jsonData.props.fill ? svgObj.fill(strokeObj.color) : svgObj.fill("none");

    if ("transform" in jsonData) {
        let t = jsonData.transform;
        svgObj.transform({a: t[0], b: t[1], c: t[2], d: t[3], e: t[4], f: t[5]});
    }
    progress.value++;
}