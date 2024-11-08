const typeHandlers = {
    // linea retta
    9: (data, stroke, svgEl) => {
        stroke.linecap = "round";
        stroke.linejoin = "round";
        return svgEl.line(data.pps[0], data.pps[1], data.ppe[0], data.ppe[1]);
    },

    // ellisse
    10: (data, stroke, svgEl) => {
        const w = data.rect[2] - data.rect[0];
        const h = data.rect[3] - data.rect[1];
        if (data.rect.toString() === data.props.toString()) {
            console.log("Trovato ellisse malformato");
            stroke.color = data.pc;
        }
        return svgEl.ellipse(w, h).x(data.rect[0]).y(data.rect[1]);
    },

    // linea tratteggiata
    11: (data, stroke, svgEl) => {
        stroke.dasharray = "10,10";
        return svgEl.line(data.pps[0], data.pps[1], data.ppe[0], data.ppe[1]);
    },

    // cerchio
    12: (data, stroke, svgEl) => {
        const xCoord = data.cx - data.cr;
        const yCoord = data.cy - data.cr;
        return svgEl.circle().radius(data.cr).x(xCoord).y(yCoord);
    },

    // freccia
    13: (data, stroke, svgEl) => {
        stroke.linecap = "round";
        stroke.linejoin = "round";
        return svgEl
            .line(data.pps[0], data.pps[1], data.ppe[0], data.ppe[1])
            .marker('end', 8, 5, function (add) {
                add.polygon("0 0, 8 2.5, 0 5").fill(stroke.color)
            })
    },

    // triangolo
    14: (data, stroke, svgEl) => {
        let points = pointsConv(data.pp);
        console.log(points);
        return svgEl.polygon(points);
    },

    // esagono
    15: (data, stroke, svgEl) => {
        let points = pointsConv(data.pp);
        return svgEl.polygon(points);
    },

    // quadrilateri: trapezio, parallelepipedo, quadrato, rettangolo
    16: (data, stroke, svgEl) => {
        let points = pointsConv(data.rect);
        return svgEl.polygon(points);
    },
};

// scrittura a mano
function writingHandler(data, stroke, svgEl, precision) {
    stroke.linecap = "round";
    stroke.linejoin = "round";
    if (!precision) {
        const pointList = pointsConv(data.points);
        return svgEl.polyline(pointList).stroke(stroke);
    } else {
        const svgGroup = svgEl.group();
        let currPts = [];
        let currThick = 1.0;
        data.points.forEach((ptArray) => {
            if (parseFloat(ptArray[2]) !== currThick) {
                let strokeUpd = {...stroke};
                strokeUpd.width *= currThick;
                currPts.push(ptArray.slice(0,2).join());
                svgGroup.polyline(currPts.join(" ")).stroke(strokeUpd);
                currThick = parseFloat(ptArray[2]);
                currPts = [];
            }
            currPts.push(ptArray.slice(0,2).join());
        });
        stroke.width *= currThick;
        svgGroup.polyline(currPts.join(" ")).stroke(stroke);
        return svgGroup;
    }
}