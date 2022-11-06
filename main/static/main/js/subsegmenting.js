var subSegmentation = {}
subSegmentation.mode = 1
subSegmentation.activated = false
subSegmentation.pos = {
    1: [20,50],
    2: [60,60],
}

function subsegment(lookFor=1, segTo=2){

    var pos1 = subSegmentation.pos["1"]
    var pos2 = subSegmentation.pos["2"]


    var xD = pos1[0]-pos2[0]
    var yD = pos1[1]-pos2[1]

    var ratioX = yD/xD

    var zero = pos1[1]-ratioX*pos1[0]

    //console.log(zero, ratioX)

    var rows = thectx.rows
    var cols = thectx.cols

    for (var sl=0; sl < parseInt(thectx.slider.max)+1; sl++){
        var sliceSize = thectx.cols * thectx.rows;
        var sliceOffset = sliceSize * sl;
        var sliceMask = thectx.segData.slice(sliceOffset,sliceOffset+sliceSize)

        for (var row=0; row < rows; row++){
            for (var col=0; col < cols; col++){
                var point = row*rows + col
                if (sliceMask[point]==lookFor){
                    if (zero+col*ratioX>row){
                        thectx.segData[sliceOffset+point]=segTo
                    }
                }
            }
        }
    }
    drawCanvas(thectx)

}
