var MPRInitiated = false
var MPRRotating = false

var drawingNow = false
var matrixGlobal = [1,0,0,0,1,0,0,0,1]
var yPRGlobal = [0,0,0]


//first 3 values denote where the origin of rotation is, last are changeable
//on simple mousemove (without controlkey)
var mousePosGlobal = [0,0,0,0,0,0] //slice,row,col, newSl, newRow, newCol

function showMatrixSimple(matrix){
    var maxSlices = parseInt(thectx.slider.max)

    var currentSlice = mousePosGlobal[0]
    var mouseRow = mousePosGlobal[1]
    var mouseCol = mousePosGlobal[2]

    var newSlice = mousePosGlobal[3]

    /* let newMousePos = mousePosMatrix(matrixGlobal, currentSlice, mouseRow, mouseCol) */
/*     currentSlice = newMousePos[0]
    mouseCol = newMousePos[1]
    mouseCol = newMousePos[2] */

    showMatrix(thectx.typedData, matrix, newSlice, cPosSlice=currentSlice, cPosRow=mouseRow, cPosCol=mouseCol, slices=maxSlices, interpolate=interpolActive)
}

function showMatrix(data, matrix, newSlice, cPosSlice=0, cPosRow=0, cPosCol=0, slices=10, 
    interpolate=interpolActive, showMask=true, showPointer=false){
    
    //cPosSlice, cPosRow and cPosCol are current position where pointing

    if (drawingNow){
        return
    }
    
    let segDataShort = thectx.segData


    drawingNow = true
    let a = Date.now()

    let pixDim1 = thectx.niftiHeader["pixDims"][1]
    let pixDim2 = thectx.niftiHeader["pixDims"][2]
    let pixDim3 = thectx.niftiHeader["pixDims"][3]

    if (pixDim1==pixDim2){
        var tempScaleValue = scaleValue
        scaleValue = (1/pixDim1)*tempScaleValue
    }

    let r00 = matrix[0] / scaleValue / pixDim1
    let r01 = matrix[1] / scaleValue / pixDim1
    let r02 = matrix[2] / scaleValue / pixDim1

    let r10 = matrix[3] / scaleValue / pixDim2
    let r11 = matrix[4] / scaleValue / pixDim2
    let r12 = matrix[5] / scaleValue / pixDim2

    let r20 = matrix[6] / scaleValue / pixDim3
    let r21 = matrix[7] / scaleValue / pixDim3
    let r22 = matrix[8] / scaleValue / pixDim3

    let rows = bg_canvas.height
    let cols = bg_canvas.width
    let sliceSize = rows*cols

    let canvasImageData = bg_ctx.createImageData(cols, rows);
    let canvasImageData2 = canvasImageData.data

    let p,v0,v1,v2,v3,v4,v5,v6,v7, value, intensityValue

    if (showMask){                
        var imageData = uns_ctx_mask.createImageData(cols, rows);
        var imageData2 = imageData.data
    }

    if (showPointer){                
        var pointerImageData = uns_ctx_mask.createImageData(cols, rows);
        var pointerImageData2 = pointerImageData.data
        var pointerSize = sizeOfCircle*pixDim1
    }

    if (pixDim1==pixDim2){
        scaleValue = tempScaleValue
    }

    let sh0 = newSlice*r02 + cPosRow - cPosRow*r00 - cPosCol*r01 - cPosSlice*r02
    let sh1 = newSlice*r12 + cPosCol - cPosRow*r10 - cPosCol*r11 - cPosSlice*r12
    let sh2 = newSlice*r22 + cPosSlice - cPosRow*r20 - cPosCol *r21 - cPosSlice*r22

    for (let row = 0; row < rows; row++) {

        let rowOffset = row*cols;
        let sh3 = row*r00
        let sh4 = row*r10
        let sh5 = row*r20
        
        for (let col = 0; col < cols; col++) { 

            let pRow = sh3 + col*r01 + sh0
            let pCol = sh4 + col*r11 + sh1
            let pSlice = sh5 + col*r21 + sh2
            //(row - cPosRow)*r00

            if (interpolate){

                pRowMin = ~~pRow
                pRowMax = Math.ceil(pRow)
                pRowRatio = pRowMax-pRow

                pColMin = ~~pCol
                pColMax = Math.ceil(pCol)
                pColRatio = pColMax-pCol

                pSliceMin = ~~pSlice
                pSliceMax = Math.ceil(pSlice)
                pSliceRatio = pSliceMax-pSlice

                if ((pRowMax<rows && pRowMin>=0)&&(pColMax<cols && pColMin>=0)&&(pSliceMax<slices && pSliceMin>=0)){
                    
                    p = pSliceMin*sliceSize + pRowMin*cols + pColMin
                    v0 = data[p] * pSliceRatio * pRowRatio * pColRatio

                    p = pSliceMin*sliceSize + pRowMin*cols + pColMax
                    v1 = data[p] * pSliceRatio * pRowRatio * (1-pColRatio)

                    p = pSliceMin*sliceSize + pRowMax*cols + pColMin
                    v2 = data[p] * pSliceRatio * (1-pRowRatio) * pColRatio

                    p = pSliceMin*sliceSize + pRowMax*cols + pColMax
                    v3 = data[p] * pSliceRatio * (1-pRowRatio) * (1-pColRatio)

                    p = pSliceMax*sliceSize + pRowMin*cols + pColMin
                    v4 = data[p] * (1-pSliceRatio) * pRowRatio * pColRatio

                    p = pSliceMax*sliceSize + pRowMin*cols + pColMax
                    v5 = data[p] * (1-pSliceRatio) * pRowRatio * (1-pColRatio)

                    p = pSliceMax*sliceSize + pRowMax*cols + pColMin
                    v6 = data[p] * (1-pSliceRatio) * (1-pRowRatio) * pColRatio

                    p = pSliceMax*sliceSize + pRowMax*cols + pColMax
                    v7 = data[p] * (1-pSliceRatio) * (1-pRowRatio) * (1-pColRatio)

                    value = v0+v1+v2+v3+v4+v5+v6+v7

                    intensityValue = adjustWindowning(value);

                    let offset4 = (rowOffset + col) * 4
                    canvasImageData2[offset4] = intensityValue;
                    canvasImageData2[offset4 + 1] = intensityValue;
                    canvasImageData2[offset4 + 2] = intensityValue;
                    canvasImageData2[offset4 + 3] = 255;
                    
                    if (showMask){
                        /* pRow = Math.round(pRow)
                        pCol = Math.round(pCol)
                        pSlice = Math.round(pSlice) */

                        pRow = (pRow + 0.5) << 0;
                        pCol = (pCol + 0.5) << 0;
                        pSlice = (pSlice + 0.5) << 0;
                        
                        p = pSlice*sliceSize + pRow*cols + pCol;
                        
                        value = segDataShort[p];

                        if (value>0){
                            let colormap = thectx.labels[value].colormap;
                            imageData2[offset4] = colormap[0];
                            imageData2[offset4 + 1] = colormap[1];
                            imageData2[offset4 + 2] = colormap[2];
                            imageData2[offset4 + 3] = thectx.labels[value].opacity;
                        }
                    }

                    if (showPointer){

                        pRow = Math.round(pRow)
                        pCol = Math.round(pCol)
                        pSlice = Math.round(pSlice)

                        let dSliceSq = Math.pow(Math.abs((cPosSlice-pSlice)*pixDim3),2)
                        let dColSq = Math.pow(Math.abs((cPosCol-pCol)*pixDim2),2)
                        let dRowSq = Math.pow(Math.abs((cPosRow-pRow)*pixDim1),2)
                        let dist = Math.sqrt(dSliceSq+dColSq+dRowSq)

                        if (dist < pointerSize){
                            let colormap = thectx.labels["vis"].colormap;
                            pointerImageData2[offset4] = colormap[0];
                            pointerImageData2[offset4 + 1] = colormap[1];
                            pointerImageData2[offset4 + 2] = colormap[2];
                            pointerImageData2[offset4 + 3] = thectx.labels["vis"].opacity;
                        }
                    }
                }
            }

            else{
                pRow = Math.round(pRow)
                pCol = Math.round(pCol)
                pSlice = Math.round(pSlice)

                if ((pRow<rows && pRow>=0)&&(pCol<cols && pCol>=0)&&(pSlice<slices && pSlice>=0)){
                
                    p = pSlice*rows*cols + pRow*cols + pCol
                    value = data[p]

                    intensityValue = adjustWindowning(value);

                    canvasImageData2[(rowOffset + col) * 4] = intensityValue;
                    canvasImageData2[(rowOffset + col) * 4 + 1] = intensityValue;
                    canvasImageData2[(rowOffset + col) * 4 + 2] = intensityValue;
                    canvasImageData2[(rowOffset + col) * 4 + 3] = 255;

                    if (showMask){

                        pRow = Math.round(pRow)
                        pCol = Math.round(pCol)
                        pSlice = Math.round(pSlice)
                        
                        value = thectx.segData[p]

                        if (value>0){
                            let colormap = thectx.labels[value].colormap;
                            imageData2[(rowOffset + col) * 4] = colormap[0];
                            imageData2[(rowOffset + col) * 4 + 1] = colormap[1];
                            imageData2[(rowOffset + col) * 4 + 2] = colormap[2];
                            imageData2[(rowOffset + col) * 4 + 3] = thectx.labels[value].opacity;
                        }
                    }

                    if (showPointer){

                        pRow = Math.round(pRow)
                        pCol = Math.round(pCol)
                        pSlice = Math.round(pSlice)

                        let dSliceSq = Math.pow(Math.abs((cPosSlice-pSlice)*pixDim3),2)
                        let dColSq = Math.pow(Math.abs((cPosCol-pCol)*pixDim2),2)
                        let dRowSq = Math.pow(Math.abs((cPosRow-pRow)*pixDim1),2)
                        let dist = Math.sqrt(dSliceSq+dColSq+dRowSq)

                        if (dist < pointerSize){
                            let colormap = thectx.labels["vis"].colormap;
                            pointerImageData2[(rowOffset + col) * 4] = colormap[0];
                            pointerImageData2[(rowOffset + col) * 4 + 1] = colormap[1];
                            pointerImageData2[(rowOffset + col) * 4 + 2] = colormap[2];
                            pointerImageData2[(rowOffset + col) * 4 + 3] = thectx.labels["vis"].opacity;
                        }
                    }
                }
            }
        }
    }

    if (showMask){                
        imageData.data = imageData2
        pr_ctx.putImageData(imageData, 0 ,0);
    }
    if (showPointer){                
        pointerImageData.data = pointerImageData2
        vis_ctx.putImageData(pointerImageData, 0 ,0);
    }

    canvasImageData.data = canvasImageData2
    bg_ctx.putImageData(canvasImageData, 0, 0);

    //console.log(Date.now()-a)
    
    setTimeout(function(){
        drawingNow = false
    },0)
    
    //draw(vis_canvas, posx, posy);
    
}

function rotateMatrix(m, axis, rotAngle){

    let normal = true //meaning matrix*rotation, if false, then rotation*matrix
    let newMatrix

    if (axis==0){
        var r00 = Math.cos(rotAngle) 
        var r01 = -Math.sin(rotAngle) 
        var r02 = 0 

        var r10 = Math.sin(rotAngle) 
        var r11 = Math.cos(rotAngle) 
        var r12 = 0 

        var r20 = 0 
        var r21 = 0 
        var r22 = 1 
    }
    if (axis==1){
        var r00 = 1
        var r01 = 0
        var r02 = 0

        var r10 = 0
        var r11 = Math.cos(rotAngle)
        var r12 = -Math.sin(rotAngle)

        var r20 = 0
        var r21 = Math.sin(rotAngle)
        var r22 = Math.cos(rotAngle)
    }
    if (axis==2){
        var r00 = Math.cos(rotAngle)
        var r01 = 0
        var r02 = Math.sin(rotAngle)

        var r10 = 0
        var r11 = 1
        var r12 = 0

        var r20 = -Math.sin(rotAngle)
        var r21 = 0
        var r22 = Math.cos(rotAngle)
    }

    if (normal){
        newMatrix = [
            (m[0]*r00+m[1]*r10+m[2]*r20), (m[0]*r01+m[1]*r11+m[2]*r21), (m[0]*r02+m[1]*r12+m[2]*r22),
            (m[3]*r00+m[4]*r10+m[5]*r20), (m[3]*r01+m[4]*r11+m[5]*r21), (m[3]*r02+m[4]*r12+m[5]*r22),
            (m[6]*r00+m[7]*r10+m[8]*r20), (m[6]*r01+m[7]*r11+m[8]*r21), (m[6]*r02+m[7]*r12+m[8]*r22),
                        ]
    }

    else{
        newMatrix = [
            (m[0]*r00+m[3]*r01+m[6]*r02), (m[1]*r00+m[4]*r01+m[7]*r02), (m[2]*r00+m[5]*r01+m[8]*r02),
            (m[0]*r10+m[3]*r11+m[6]*r12), (m[1]*r10+m[4]*r11+m[7]*r12), (m[2]*r10+m[5]*r11+m[8]*r12),
            (m[0]*r20+m[3]*r21+m[6]*r22), (m[1]*r20+m[4]*r21+m[7]*r22), (m[2]*r20+m[5]*r21+m[8]*r22),
                        ]
    }




    return newMatrix

}

function yawPitchRollToMatrix(y,p,r){
    //y,p,r = angles of each

    var r00 = Math.cos(y)*Math.cos(p)
    var r01 = Math.cos(y)*Math.sin(p)*Math.sin(r) - Math.sin(y)*Math.cos(r)
    var r02 = Math.cos(y)*Math.sin(p)*Math.cos(r) + Math.sin(y)*Math.sin(r)

    var r10 = Math.sin(y)*Math.cos(p)
    var r11 = Math.sin(y)*Math.sin(p)*Math.sin(r) + Math.cos(y)*Math.cos(r)
    var r12 = Math.sin(y)*Math.sin(p)*Math.cos(y) - Math.cos(y)*Math.sin(r)

    var r20 = -Math.sin(p)
    var r21 = Math.cos(p)*Math.sin(r)
    var r22 = Math.cos(p)*Math.cos(r)

    var newMatrix = [r00,r01,r02,r10,r11,r12,r20,r21,r22]

    return newMatrix
}

function mousePosMatrix(m, slice, row, col, oSlice=false, oRow=false, oCol=false){

    //oSlice = slice on old update before moving mouse to new pos

    if (!oSlice){
        oSlice = slice
        oCol = col
        oRow = row
    }

    var pixDim1 = thectx.niftiHeader["pixDims"][1]
    var pixDim2 = thectx.niftiHeader["pixDims"][2]
    var pixDim3 = thectx.niftiHeader["pixDims"][3]

    if (pixDim1==pixDim2){
        var tempScaleValue = scaleValue
        scaleValue = (1/pixDim1)*tempScaleValue
    }

    let r00 = m[0] / scaleValue / pixDim1
    let r01 = m[1] / scaleValue / pixDim1
    let r02 = m[2] / scaleValue / pixDim1
    let r10 = m[3] / scaleValue / pixDim2
    let r11 = m[4] / scaleValue / pixDim2
    let r12 = m[5] / scaleValue / pixDim2
    let r20 = m[6] / scaleValue / pixDim3
    let r21 = m[7] / scaleValue / pixDim3
    let r22 = m[8] / scaleValue / pixDim3

    if (pixDim1==pixDim2){
        scaleValue = tempScaleValue
    }

    var pRow = row*r00 + col*r01 + slice*r02 + oRow - oRow*r00 - oCol*r01 - oSlice*r02
    var pCol = row*r10 + col*r11 + slice*r12 + oCol - oRow*r10 - oCol*r11 - oSlice*r12
    var pSlice = row*r20 + col*r21 + slice*r22 + oSlice - oRow*r20 - oCol *r21 - oSlice*r22

    var mousePos = [pSlice, pRow, pCol]
    return mousePos
}

vis_canvas.addEventListener('mousemove', function(evt){

    if (!MPRActivated){
        return
    }
    var changeX = evt.movementX;
    var changeY = evt.movementY;

    if (!MPRRotating){

        mousePosGlobal[4] = getMousePos(vis_canvas, evt)["y"]
        mousePosGlobal[5] = getMousePos(vis_canvas, evt)["x"]

        MPRPointerShort(evt)    
    }

    if (evt.ctrlKey && evt.button==0 && evt.buttons==1){
        
        /* matrixGlobal = rotateMatrix(matrixGlobal, 1, (Math.PI/180)*changeX*0.1)
        matrixGlobal = rotateMatrix(matrixGlobal, 2, (Math.PI/180)*changeY*0.1) */
        yPRGlobal[1]+=(Math.PI/180)*changeY*0.1
        yPRGlobal[2]-=(Math.PI/180)*changeX*0.1

        if (yPRGlobal[1]>Math.PI/2){
            yPRGlobal[1]=Math.PI/2
        }
        if (yPRGlobal[1]<-Math.PI/2){
            yPRGlobal[1]=-Math.PI/2
        }
        if (yPRGlobal[2]>Math.PI/2){
            yPRGlobal[2]=Math.PI/2
        }
        if (yPRGlobal[2]<-Math.PI/2){
            yPRGlobal[2]=-Math.PI/2
        }

        matrixGlobal = yawPitchRollToMatrix(yPRGlobal[0],yPRGlobal[1],yPRGlobal[2])

        showMatrixSimple(matrixGlobal)
        return
    }

})

vis_canvas.addEventListener('mousedown', function(evt){
    if (!MPRActivated){
        return
    }
    if (evt.button==0 && !evt.ctrlKey){
        drawActivated = true;
        MPRPointerShort()

    }
    if (evt.button==0 && evt.ctrlKey){
        MPRRotating = true
        vis_canvas.requestPointerLock()
    }

    if (evt.button==2 && !evt.ctrlKey){
        
        drawActivated = true;
        eraseActivated = true;
        MPRPointerShort(evt)
    }
})

vis_canvas.addEventListener('mouseup', function(evt){
    if (!MPRActivated){
        return
    }
    if (evt.button==0 || evt.button==2){

        //segment pixels, activate draw
        document.exitPointerLock()
        MPRRotating = false
        drawActivated = false;
        eraseActivated = false;
    }
})

vis_canvas.addEventListener('wheel', function(evt){
    if (!MPRActivated){
        return
    }
    var x = parseInt(evt.deltaY);

    if (evt.ctrlKey){
        if (x<0){
            scaleValue*=1.2;
            if (scaleValue>1000){scaleValue = 1000}
        }
        else{
            scaleValue/=1.2;
            if (scaleValue<0.1){scaleValue = 0.1}
        }
        showMatrixSimple(matrixGlobal)
    }

    if (!evt.ctrlKey){
        if (evt.deltaY>0){
            mousePosGlobal[3] += 2
        }
        else{
            mousePosGlobal[3] -= 2
        }
        showMatrixSimple(matrixGlobal)
        
    }

})

window.addEventListener('keydown', function(evt){
    if (thectx.keys.MPRMode.matchesEvent(evt) && mouse_over_canvas){
        MPRActivated =!MPRActivated

        if (MPRActivated){
            
            mousePosGlobal[0] = parseInt(thectx.slider.value)
            mousePosGlobal[1] = mousePos["y"]
            mousePosGlobal[2] = mousePos["x"]


            mousePosGlobal[3] = parseInt(thectx.slider.value)
            mousePosGlobal[4] = mousePos["y"]
            mousePosGlobal[5] = mousePos["x"]

            showMatrixSimple(matrixGlobal)
        }
        else{
            
            drawCanvas(thectx)
            matrixGlobal = [1,0,0,0,1,0,0,0,1]
            yPRGlobal = [0,0,0]

        }
    }
    if (!MPRActivated){
        return
    }


    if (evt.key == "p"){
        var NewMousePos = mousePosMatrix(matrixGlobal, mousePosGlobal[0],mousePosGlobal[1],mousePosGlobal[2])
        //console.log(NewMousePos)
    }

    if (mouse_over_canvas && evt.key == "1"){
        //mediastinum
        var windowWidth = 350;
        var windowLevel = 60;
    
        intensDiv = windowWidth/255;
        intensBaseline = windowLevel-(windowWidth/2);
        showMatrixSimple(matrixGlobal)
    }
    if (mouse_over_canvas && evt.key == "2"){
        //brain
        var windowWidth = 80;
        var windowLevel = 40;
    
        intensDiv = windowWidth/255;
        intensBaseline = windowLevel-(windowWidth/2);
        showMatrixSimple(matrixGlobal)
    }
    if (mouse_over_canvas && evt.key == "3"){
        //lungs
        var windowWidth = 1500;
        var windowLevel = -450;
    
        intensDiv = windowWidth/255;
        intensBaseline = windowLevel-(windowWidth/2);
        showMatrixSimple(matrixGlobal)
    }
    if (mouse_over_canvas && evt.key == "4"){
        //soft tissue
        var windowWidth = 450;
        var windowLevel = 50;
    
        intensDiv = windowWidth/255;
        intensBaseline = windowLevel-(windowWidth/2);
        showMatrixSimple(matrixGlobal)
    }
    if (mouse_over_canvas && evt.key == "5"){
        //bones
        var windowWidth = 2000;
        var windowLevel = 350;
    
        intensDiv = windowWidth/255
        intensBaseline = windowLevel-(windowWidth/2)
        showMatrixSimple(matrixGlobal)
    }

    if ((evt.key == "w" || evt.key == "W") && ((!DGInitialized) || (deepGrowModel.type == "DGV2"))){
        if (!resizingAct){
            startTime = Date.now()
            resizingAct = true
            refreshIntervalId = setInterval(() => {
                if (DGInitialized){
                    sizeOfCircle*=1.05;
                }
                else{
                    sizeOfCircle*=1.01+(Date.now()-startTime)/20000;
                }
                if (sizeOfCircle > 10000){
                    sizeOfCircle = 10000
                }
                document.getElementById("pointerSizeText").value = sizeOfCircle.toFixed(1)
                if (!drawingNow){
                    MPRPointerShort()
                }
            }, 10);
        }
    }
    if ((evt.key == "s" || evt.key == "S") && ((!DGInitialized) || (deepGrowModel.type == "DGV2"))){
        if (!resizingAct){
            startTime = Date.now()
            resizingAct = true
            refreshIntervalId = setInterval(() => {
                if (DGInitialized){
                    sizeOfCircle/=1.05;
                }
                else{
                    sizeOfCircle/=1.01+(Date.now()-startTime)/20000;
                }
                if (sizeOfCircle < 0.0001){
                    sizeOfCircle = 0.0001
                }
                document.getElementById("pointerSizeText").value = sizeOfCircle.toFixed(1)
                if (!drawingNow){
                    MPRPointerShort()
                }
            }, 10);
        }
    }
    if ((evt.key == "q") || (evt.key == "Q")){
        var rememberLabel = thectx.labels.currentLabel
        if (thectx.labels.currentLabel>1){
            activateOtherLabelDiv(thectx.labels.currentLabel-1)
        }

        try{thectx.DG.full.fill(0)}catch{}
        if (!evt.shiftKey){
            lockLabel(rememberLabel)
        }
        unlockLabel(thectx.labels.currentLabel)
        MPRPointerShort()
    }
    if ((evt.key == "e") || (evt.key == "E")){
        var rememberLabel = thectx.labels.currentLabel

        if (thectx.labels.currentLabel<checkBoxValueCounter-1){
            activateOtherLabelDiv(thectx.labels.currentLabel+1)
        }
        else{
            try{buttonpress()
                activateOtherLabelDiv(checkBoxValueCounter-1)
            }
            catch(err){console.log(err)}
        }
        try{thectx.DG.full.fill(0)}catch{}
        if (!evt.shiftKey){
            lockLabel(rememberLabel)
        }
        unlockLabel(thectx.labels.currentLabel)
        MPRPointerShort()
    }
})

function showMPRPointer(matrix, cPosSlice=0, cPosRow=0, cPosCol=0, 
    scrollSlice=0, nPosSlice=0, nPosRow=0, nPosCol=0, slices=10, showMask=true){
    
    //cPosSlice, cPosRow and cPosCol are current position where pointing
    
    if (drawingNow){
        return
    }
    
    drawingNow = true
    let a = Date.now()

    let pixDim1 = thectx.niftiHeader["pixDims"][1]
    let pixDim2 = thectx.niftiHeader["pixDims"][2]
    let pixDim3 = thectx.niftiHeader["pixDims"][3]

    if (pixDim1==pixDim2){
        var tempScaleValue = scaleValue
        scaleValue = (1/pixDim1)*tempScaleValue
    }

    let r00 = matrix[0] / scaleValue / pixDim1
    let r01 = matrix[1] / scaleValue / pixDim1
    let r02 = matrix[2] / scaleValue / pixDim1

    let r10 = matrix[3] / scaleValue / pixDim2
    let r11 = matrix[4] / scaleValue / pixDim2
    let r12 = matrix[5] / scaleValue / pixDim2

    let r20 = matrix[6] / scaleValue / pixDim3
    let r21 = matrix[7] / scaleValue / pixDim3
    let r22 = matrix[8] / scaleValue / pixDim3

    let rows = bg_canvas.height
    let cols = bg_canvas.width
    let sliceSize = rows*cols

    var pointerImageData = uns_ctx_mask.createImageData(cols, rows);
    var pointerImageData2 = pointerImageData.data
    var pointerSize = sizeOfCircle*pixDim1

    if (pixDim1==pixDim2){
        scaleValue = tempScaleValue
    }
    
    if (showMask){
        var imageData = uns_ctx_mask.createImageData(cols, rows);
        var imageData2 = imageData.data
    }

    let sh0 = scrollSlice*r02 + cPosRow - cPosRow*r00 - cPosCol*r01 - cPosSlice*r02
    let sh1 = scrollSlice*r12 + cPosCol - cPosRow*r10 - cPosCol*r11 - cPosSlice*r12
    let sh2 = scrollSlice*r22 + cPosSlice - cPosRow*r20 - cPosCol *r21 - cPosSlice*r22

    let pRow, pCol, pSlice, p

    let dSliceSq, dColSq, dRowSq, dist
    let colormap, rowOffset, offset4


    for (let row = 0; row < rows; row++) {

        rowOffset = row*cols;
        
        for (let col = 0; col < cols; col++) { 

            pRow = row*r00 + col*r01 + sh0
            pCol = row*r10 + col*r11 + sh1
            pSlice = row*r20 + col*r21 + sh2

            if ((pRow<rows && pRow>=0)&&(pCol<cols && pCol>=0)&&(pSlice<slices && pSlice>=0)){
            
                pRow = Math.round(pRow)
                pCol = Math.round(pCol)
                pSlice = Math.round(pSlice)

                p = pSlice*sliceSize + pRow*cols + pCol

                if (!fluidPointActive){
                    nPosSlice = Math.round(nPosSlice)
                    nPosCol = Math.round(nPosCol)
                    nPosRow = Math.round(nPosRow)
                }

                dSliceSq = Math.pow(Math.abs((nPosSlice-pSlice)*pixDim3),2)
                dColSq = Math.pow(Math.abs((nPosCol-pCol)*pixDim2),2)
                dRowSq = Math.pow(Math.abs((nPosRow-pRow)*pixDim1),2)
                dist = Math.sqrt(dSliceSq+dColSq+dRowSq)

                if (dist < pointerSize){
                    colormap = thectx.labels["vis"].colormap;

                    //  pointerImageData2.color(rowOffset, col, colormap, opacity)
                    //
                    // 
                    //
                    // Imagedata.data = data;
                    // ImageData.color = funciton (row, col, colormap, opacity) {
                    //    this.data
                    //}
                    //
                    offset4 = (rowOffset + col) * 4
                    pointerImageData2[offset4] = colormap[0];
                    pointerImageData2[offset4 + 1] = colormap[1];
                    pointerImageData2[offset4 + 2] = colormap[2];
                    pointerImageData2[offset4 + 3] = thectx.labels["vis"].opacity;
                
                    if (drawActivated){
                        if (eraseActivated == true){
                            thectx.segData[p] = 0
                        }
                        else{
                            thectx.segData[p] = thectx.labels.currentLabel
                        }
                    }
                
                }
                if (showMask){
                    let value = thectx.segData[p]

                    if (value>0){
                        colormap = thectx.labels[value].colormap;
                        offset4 = (rowOffset + col) * 4
                        imageData2[offset4] = colormap[0];
                        imageData2[offset4 + 1] = colormap[1];
                        imageData2[offset4 + 2] = colormap[2];
                        imageData2[offset4 + 3] = thectx.labels[value].opacity;
                    }
                }
            }
        }
    }

       
    pointerImageData.data = pointerImageData2
    vis_ctx.putImageData(pointerImageData, 0 ,0);

    if (showMask){
        imageData.data = imageData2
        pr_ctx.putImageData(imageData, 0 ,0);
    }
    //console.log(Date.now()-a)
    
    setTimeout(function(){
        drawingNow = false
    },0)
    
    //draw(vis_canvas, posx, posy);
}

function MPRPointerShort(){

    var newMousePos = mousePosMatrix(matrixGlobal, 
        mousePosGlobal[3], mousePosGlobal[4], mousePosGlobal[5], 
        oSlice=mousePosGlobal[0], oRow=mousePosGlobal[1], oCol=mousePosGlobal[2])
    
    //showMatrixSimple(matrixGlobal)

    showMPRPointer(matrixGlobal,mousePosGlobal[0], mousePosGlobal[1],mousePosGlobal[2],
        mousePosGlobal[3], newMousePos[0], newMousePos[1],newMousePos[2], parseInt(thectx.slider.max))

}