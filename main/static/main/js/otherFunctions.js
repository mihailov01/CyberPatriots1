function memorizeSlice(threeD=false){
    if (!threeD){
        thectx.memorySeg.fill(0)
        var slice = thectx.slider.value;
        var sliceSize = thectx.cols * thectx.rows;
        var sliceOffset = sliceSize * slice;
        for (var p=0; p<sliceSize; p++){
            thectx.memorySeg[p] = thectx.segData[sliceOffset+p]
        }
    }
}

function changeLabelValue(fromLabel, toLabel){

    let currentMaxLabel = checkBoxValueCounter - 1
    while (toLabel>currentMaxLabel){
        buttonpress()
        currentMaxLabel = checkBoxValueCounter - 1
    }

    let total = thectx.segData.length
    let segdata = thectx.segData
    for (let p=0; p < total; p++){
        if (segdata[p]==fromLabel){
            segdata[p] = toLabel
        }
    }
    requestAnimationFrame(simpleDrawCanvas)
}




function arrayFlipUpDown(data, rows, cols){
    newData = new Float32Array(data.length)

    for (var row=0; row < rows; row++){
        for (var col=0; col < cols; col++){
            var rowOffset = row*cols
            var invertedRowOffset = (rows-row-1)*cols
            newData[invertedRowOffset+col] = data[rowOffset+col]
        }
    }
    return newData
}
function arrayMirror(data, rows, cols){
    newData = new Float32Array(data.length)

    for (var row=0; row < rows; row++){
        for (var col=0; col < cols; col++){
            var rowOffset = row*cols
            newData[rowOffset+(cols-col-1)] = data[rowOffset+col]
        }
    }
    return newData
}
function arrayRot90(data, rows, cols){
    newData = new Float32Array(data.length)

    for (var row=0; row < rows; row++){
        for (var col=0; col < cols; col++){
            var rowOffset = row*cols
            var newOffset = rows*col
            newData[newOffset+(rows-row)] = data[rowOffset+col]
        }
    }
    return newData
}
function arrayTransformAuto(data, rows, cols, reverse=false){
    //if no transform...
    if (rotationCSS==0 && !mirrorActivated){
        return data
    }

    //mirror first if normal and mirror last if it is reverse
    if (mirrorActivated && !reverse){
        data = arrayMirror(data, rows, cols)
    }

    if (rotationCSS==0 && !reverse){
        return data
    }

    if (rotationCSS==90 && !reverse){
        //the if is because otherwise with rows!=cols doesn't work for some reason

        data = arrayRot90(data, rows, cols)
        return data
    }
    if (rotationCSS==180 && !reverse){
        data = arrayRot90(data, rows, cols)
        data = arrayRot90(data, cols, rows)
        return data
    }
    if (rotationCSS==270 && !reverse){
        data = arrayRot90(data, rows, cols)
        data = arrayRot90(data, cols, rows)
        data = arrayRot90(data, rows, cols)
        return data
    }

    if (rotationCSS==90 && reverse){
        
        data = arrayRot90(data, cols, rows)
        data = arrayRot90(data, rows, cols)
        data = arrayRot90(data, cols, rows)

    }
    if (rotationCSS==180 && reverse){
        data = arrayRot90(data, rows, cols)
        data = arrayRot90(data, cols, rows)
    }
    if (rotationCSS==270 && reverse){
        data = arrayRot90(data, cols, rows)
    }
    if (mirrorActivated && reverse){
        data = arrayMirror(data, rows, cols)
    }
    return data
    
}




function rot90CSS(){
    
    rotationCSS+= 90
    if (rotationCSS==360){rotationCSS = 0}
    changeCSSTransform()
    /*if (thectx.canvasHeight!=thectx.canvasWidth){
        if (rotationCSS==90 || rotationCSS==270){
            var wrapper = document.getElementById("wrapper")
            wrapper.style.top = String(Math.round((thectx.canvasWidth-thectx.canvasHeight)/2)+8)+"px"
            wrapper.style.left = String(Math.round((thectx.canvasHeight-thectx.canvasWidth)/2)+8)+"px"
        }
        else{
            var wrapper = document.getElementById("wrapper")
            wrapper.style.top = "8px"
            wrapper.style.left = "8px"
        }
    }*/
    //fitToScreen()
    requestAnimationFrame(simpleDraw)
 }

function mirrorCSS(){

    mirrorActivated=!mirrorActivated
    changeCSSTransform()
    requestAnimationFrame(simpleDraw)
}

function changeCSSTransform(){

    if (mirrorActivated){
        document.getElementById("bg_canvas").style.transform = "rotate("+String(rotationCSS)+"deg) scale("+String(-1)+","+String(1)+")"
        document.getElementById("pr_canvas").style.transform = "rotate("+String(rotationCSS)+"deg) scale("+String(-1)+","+String(1)+")"
        document.getElementById("vis_canvas").style.transform = "rotate("+String(rotationCSS)+"deg) scale("+String(-1)+","+String(1)+")"
    }
    else {
        document.getElementById("bg_canvas").style.transform = "rotate("+String(rotationCSS)+"deg) scale("+String(1)+","+String(1)+")"
        document.getElementById("pr_canvas").style.transform = "rotate("+String(rotationCSS)+"deg) scale("+String(1)+","+String(1)+")"
        document.getElementById("vis_canvas").style.transform = "rotate("+String(rotationCSS)+"deg) scale("+String(1)+","+String(1)+")"
    }

    fitToScreen()
}


//modal stuff

function createModal(modalId, btnId, closeId){
    let modal = document.getElementById(modalId)
    let btn = document.getElementById(btnId)
    let close = document.getElementById(closeId)

    btn.onclick = function() {
        modalVisible = true
        modal.style.display = "block";
    }
    close.onclick = function() {
        modalVisible = false
        modal.style.display = "none";
    }
    window.addEventListener('click', hide)
    function hide(evt){
        if (evt.target == modal) {
            modalVisible = false
            modal.style.display = "none";
        }
    }
}

createModal("controlsModal", "controlsModalBtn", "closeKeybindingsModal")
createModal("settingsModal", "settingsModalBtn", "closeSettingsModal")

function changeWindImData(){
    windowedImageDataPredicting = document.getElementById("windowImDataChBox").checked;
}

var fullscreenActivated = false
function fullscreenSwitch(){
    if (fullscreenActivated) {
        closeFullscreen();
        var image = document.getElementById("fullscreenImage")
        image.setAttribute("src", "../../static/main/img/full_screen.png")
        image.setAttribute("title", "fullscreen")
        fullscreenActivated = false
    }
    else{
        openFullscreen()
        var image = document.getElementById("fullscreenImage")
        image.setAttribute("src", "../../static/main/img/full_screen.png")
        image.setAttribute("title", "exit fullscreen")
        fullscreenActivated = true
    }
}

function openFullscreen() {
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
}

function closeFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
}




function meanOfArray(array){
    let sum = array.reduce((previous, current) => current += previous);
    let avg = sum / array.length;
    return avg
}
function medianOfArray(array){
    array.sort((a, b) => a - b);
    let median = (array[(array.length - 1) >> 1] + array[array.length >> 1]) / 2
    return median
}
function stdOfArray(array){
    let n = array.length;
    let mean = array.reduce((a,b) => a+b)/n;
    let s = Math.sqrt(array.map(x => Math.pow(x-mean,2)).reduce((a,b) => a+b)/n);
    return s
}

function minMaxArray(arr) {
    let min = arr[0]
    let max = arr[0];
    let total = arr.length
    for (let i = 0; i < total; i++) {
      let v = arr[i];
      min = (v < min) ? v : min;
      max = (v > max) ? v : max;
    }
  
    return [min, max];
  }

// async function firstAsync() {
//     let promise = new Promise((res) => {
//         tf.tidy(() => {predictCurrentSlice(deepGrowModel, windowedImageDataPredicting)});
//         res()
//     });
//     await promise;
//     DGRunning = false;
// };

// lemoWorker = new Worker("webWorker.js");
// lemoWorker.onmessage = function(e) {
//     uns_ctx_mask.putImageData(e.data,0,0);
//     saveCanvasToMask(thectx)
//     draw(vis_canvas, posx, posy)
//     DGRunning = false
// }


var segmentAboveBelow = 0
let dontSegmentZero = false

function segmToMaskData(segmImgData, segmValue=1){
    //let time0 = Date.now()

    // for loop, where all positive become 1
    let slice = thectx.slider.value;
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice;

    //"detaching from DOM", see http://www.onaluf.org/en/entry/13
    let segmImgData2 = segmImgData.data
    let total = segmImgData2.length
    let segData = thectx.segData
    let labels = thectx.labels
    let lockedStatus, pos, segValueOfVoxel

    for (let p4=0; p4<total; p4+=4){
        if (segmImgData2[p4]>0){
            pos = sliceOffset+p4/4
            segValueOfVoxel = segData[pos]
            //to only segment within other masks:
            if (dontSegmentZero){
                if (segValueOfVoxel==0){
                    continue
                }
            }
            if (segValueOfVoxel>0){
                lockedStatus = labels[segValueOfVoxel].locked
                if (!lockedStatus){
                    segData[pos] = segmValue
                }
            }
            else{
                segData[pos] = segmValue
            }

            if (segmentAboveBelow>0){
                for (let c=1; c<=segmentAboveBelow*2; c+=1){
                    if (c<=segmentAboveBelow){
                        if (thectx.slider.value-c>=0){
                            var newSlice = thectx.slider.value - c
                            var newSliceOffset = sliceSize * newSlice
                        }
                    }
                    else{
                        if (thectx.slider.value-segmentAboveBelow+c <= parseInt(thectx.slider.max)){
                            var newSlice = thectx.slider.value-segmentAboveBelow+c
                            var newSliceOffset = sliceSize * newSlice
                        }
                    }
                    let pos = newSliceOffset+p4/4
                    let segValueOfVoxel = segData[pos]
                    if (segValueOfVoxel>0){
                        lockedStatus = labels[segValueOfVoxel].locked
                        if (!lockedStatus){
                            segData[pos] = segmValue
                        }
                    }
                    else{
                        segData[pos] = segmValue
                    }
                }
            }

        }
    }
    //console.log("takes" + String(Date.now()-time0))
}

function thrsToMaskData(segmImgData, segmValue=1){
    //var time0 = Date.now()

    let slice = thectx.slider.value;
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice;
    let typedData = thectx.typedData;

    let segmImgData2 = segmImgData.data
    let total = segmImgData2.length

    let pos, segValueOfVoxel, lockedStatus
    let newSlice, newSliceOffset

    for (let p=0; p<total; p+=4){
        if (segmImgData2[p+3]>0){
            pos = sliceOffset+p/4



            if (typedData[pos]>=lowerThreshold && typedData[pos]<=upperThreshold){
                segValueOfVoxel = thectx.segData[pos]

                if (dontSegmentZero){
                    if (segValueOfVoxel==0){
                        continue
                    }
                }
                
                if (segValueOfVoxel>0){
                    lockedStatus = thectx.labels[segValueOfVoxel].locked
                    if (!lockedStatus){
                        thectx.segData[pos] = segmValue
                    }
                }
                else{
                    thectx.segData[pos] = segmValue
                }
            }

            if (segmentAboveBelow>0){
                for (let c=1; c<=segmentAboveBelow*2; c+=1){
                    if (c<=segmentAboveBelow){
                        if (thectx.slider.value-c>=0){
                            newSlice = thectx.slider.value - c
                            newSliceOffset = sliceSize * newSlice
                        }
                    }
                    else{
                        if (thectx.slider.value-segmentAboveBelow+c <= parseInt(thectx.slider.max)){
                            newSlice = thectx.slider.value-segmentAboveBelow+c
                            newSliceOffset = sliceSize * newSlice
                        }
                    }
                    pos = newSliceOffset+p/4
                    if (typedData[pos]>=lowerThreshold && typedData[pos]<=upperThreshold){
                        segValueOfVoxel = thectx.segData[pos]
                        if (segValueOfVoxel>0){
                            lockedStatus = thectx.labels[segValueOfVoxel].locked
                            if (!lockedStatus){
                                thectx.segData[pos] = segmValue
                            }
                        }
                        else{
                            thectx.segData[pos] = segmValue
                        }
                    }
                }
            }
        }
    }
    //console.log("takes" + String(Date.now()-time0))
}

function visualizeMaskData(){
    //var time0 = Date.now()
    //can make faster by updating just part of it, the part that is getting changed
    //ok speed...approx 1-6

    let slice = thectx.slider.value;
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice
    let imageData = new ImageData(thectx.cols, thectx.rows)
    //let imageData = uns_ctx_mask.createImageData(thectx.cols, thectx.rows);
    //testing fix by "detaching from DOM", see http://www.onaluf.org/en/entry/13
    let imageData2 = imageData.data

    let maskData = thectx.segData;

    let shortcut = thectx.labels

    let value, p4, colormap

    for (let p=0; p<sliceSize; p=p+1){

        value = maskData[sliceOffset+p];
        if (value>0){
            p4 = p*4;
            colormap = shortcut[value].colormap;
            imageData2[p4] = colormap[0];
            imageData2[p4+1] = colormap[1];
            imageData2[p4+2] = colormap[2];
            imageData2[p4+3] = shortcut[value].opacity;
            //evt show borders
            if (highlightMaskBoundaries){
                if (maskData[sliceOffset+p-1]==value && maskData[sliceOffset+p+1]==value && maskData[sliceOffset+p+thectx.cols]==value && maskData[sliceOffset+p-thectx.cols]==value){
                    imageData2[p4+3] = 100
                }
            }
        }
    }
    imageData.data = imageData2

    uns_ctx_mask.putImageData(imageData, 0 ,0);
    //console.log("takes" + String(Date.now()-time0))

}

function thresholdFunction(data, uTh, lTh){
    //makes all above upper thr value = upper thr value and same for lower.
    let length = data.length
    for (let p=0; p<length; p=p+1){
        if (data[p]>uTh){
            data[p] = uTh
        }
        else if (data[p]<lTh){
            data[p] = lTh
        }
    }
    return data
}

function fillColorFromMousePos(){

    memorizeSlice()

    let slice = parseInt(thectx.slider.value);
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice;
    let sliceMask = thectx.segData.slice(sliceOffset,sliceOffset+sliceSize)

    let posX = posx/scaleValue - translationX;
    let posY = posy/scaleValue - translationY;
    let island

    if (!thresholdActivated){
        island = island2DFunction(sliceMask, posX, posY, thectx.rows, thectx.cols,do0=true)
    }
    else {
        let imageData = thectx.typedData.slice(sliceOffset,sliceOffset+sliceSize)
        island = island2DFunction(sliceMask, posX, posY, thectx.rows, thectx.cols,do0=true, threshold=true, imageData=imageData)
    }

    let segmValue = thectx.labels.currentLabel

    for (let p=0; p<island.length; p+=1){
        if (island[p]>0){
            let segValueOfVoxel = thectx.segData[sliceOffset+p]
            if (segValueOfVoxel>0){
                let lockedStatus = thectx.labels[segValueOfVoxel].locked
                if (!lockedStatus){
                    thectx.segData[sliceOffset+p] = segmValue
                }
            }
            else {
                thectx.segData[sliceOffset+p] = segmValue
            }
        }
    }

}

function island2DFunction(data, pointPosX, pointPosY, rows, cols, do0=false, threshold=false, imageData=false){

    let length = data.length

    //switch
    let tempx = pointPosX
    pointPosX = Math.floor(pointPosY)
    pointPosY = Math.floor(tempx)
    let temprows = rows
    rows = cols
    cols = temprows


    let startPixelVal = data[(rows*pointPosX)+pointPosY]



    if (startPixelVal==0 && !do0){
        console.log("point is in background")
        return
    }

    //def new island that will be filled
    let newIsland = new Uint8Array(length).fill(0)

    //To not place point if outside thresholding
    let pixelStartData = imageData[(rows*pointPosX)+pointPosY]
    if (threshold && (pixelStartData<lowerThreshold || pixelStartData>upperThreshold)){
        return newIsland
    }
    
    
    newIsland[(rows*pointPosX)+pointPosY] = 1

    let theList = []
    theList.push([pointPosX,pointPosY])

    while (theList.length>0){

        [pointX, pointY] = theList.pop()

        if (pointX<cols-1){
            let pXp = pointX+1
            if (newIsland[rows*(pXp)+pointY]!=1){
                if (data[rows*pXp+pointY]==startPixelVal){
                    if (!threshold){
                        newIsland[rows*pXp+pointY] = 1
                        theList.push([pXp, pointY])
                    }
                    else {
                        let value = imageData[rows*pXp+pointY]
                        if (value>=lowerThreshold && value<=upperThreshold){
                            newIsland[rows*pXp+pointY] = 1
                            theList.push([pXp, pointY])
                        }
                    }
                }
            }
        }
        if (pointX>0){
            let pXm = pointX-1
            if (newIsland[rows*(pXm)+pointY]!=1){
                if (data[rows*pXm+pointY]==startPixelVal){
                    if (!threshold){
                        newIsland[rows*pXm+pointY] = 1
                        theList.push([pXm, pointY])
                    }
                    else {
                        let value = imageData[rows*pXm+pointY]
                        if (value>=lowerThreshold && value<=upperThreshold){
                            newIsland[rows*pXm+pointY] = 1
                            theList.push([pXm, pointY])
                        }
                    }
                }
            }
        }        
        if (pointY<rows-1){
            let pYp = pointY+1
            if (newIsland[rows*pointX+pYp]!=1){
                if (data[rows*pointX+pYp]==startPixelVal){
                    if (!threshold){
                        newIsland[rows*pointX+pYp] = 1
                        theList.push([pointX, pYp])
                    }
                    else {
                        let value = imageData[rows*pointX+pYp]
                        if (value>=lowerThreshold && value<=upperThreshold){
                            newIsland[rows*pointX+pYp] = 1
                            theList.push([pointX, pYp])
                        }
                    }
                }
            }
        }        
        if (pointY>0){
            let pYm = pointY-1
            if (newIsland[rows*pointX+pYm]!=1){
                if (data[rows*pointX+pYm]==startPixelVal){
                    if (!threshold){
                        newIsland[rows*pointX+pYm] = 1
                        theList.push([pointX, pYm])
                    }
                    else {
                        let value = imageData[rows*pointX+pYm]
                        if (value>=lowerThreshold && value<=upperThreshold){
                            newIsland[rows*pointX+pYm] = 1
                            theList.push([pointX, pYm])
                        }
                    }
                }
            }
        }     
    }
    
    return newIsland

}

function island3DFromPointV2(imData, segData, pointPosX, pointPosY, currentSlice, rows, cols){
    let length = imData.length

    let pointPosRowOffset = currentSlice * rows * cols
    let pointZMax = length/rows/cols - 1

    pointPosX = Math.floor(pointPosX)
    pointPosY = Math.floor(pointPosY)

    let startPixelPos = pointPosRowOffset+(cols*pointPosY)+pointPosX

    let startPixelImVal = imData[startPixelPos]
    let startPixelSegVal = segData[startPixelPos]
    //if startPixelVal outside threshold, stop here should be implemented
    //if pressing on segmentation, then should perform other kind of function

    let newIsland = new Uint8Array(length).fill(0)
    
    //newIsland[startPixelPos] = 1

    let theList = []
    theList.push([pointPosX,pointPosY,currentSlice])

    let pointX, pointY, pointZ

    let colsXrows = rows * cols

    let addToListFunction 
    
    if (startPixelSegVal==0){
        addToListFunction = function(pos, pX, pY, pZ){
            if (newIsland[pos]==0 && segData[pos]==0){
                if (thresholdActivated){
                    if (imData[pos]>=lowerThreshold && imData[pos]<=upperThreshold){
                        newIsland[pos] = 1
                        theList.push([pX, pY, pZ])
                    }
                }
                else{
                    newIsland[pos] = 1
                    theList.push([pX, pY, pZ])
                }
            }
        }
    }
    else{
        if (!thectx.labels[startPixelSegVal].locked){
            addToListFunction = function(pos, pX, pY, pZ){
                if (newIsland[pos]==0 && segData[pos]==startPixelSegVal){
                    if (thresholdActivated){
                        if (imData[pos]>=lowerThreshold && imData[pos]<=upperThreshold){
                            newIsland[pos] = 1
                            theList.push([pX, pY, pZ])
                        }
                    }
                    else{
                        newIsland[pos] = 1
                        theList.push([pX, pY, pZ])
                    }
                }
            }
        }
    }

    while (theList.length>0){
        let points = theList.pop()
        pointX = points[0]
        pointY = points[1]
        pointZ = points[2]

        if (pointZ < pointZMax){
            let pZ = pointZ + 1
            let pY = pointY
            let pX = pointX
            let pos = pZ*colsXrows+cols*pY+pX

            addToListFunction(pos, pX, pY, pZ)
        }

        if (pointZ > 0){
            let pZ = pointZ - 1
            let pY = pointY
            let pX = pointX
            let pos = pZ*colsXrows+cols*pY+pX

            addToListFunction(pos, pX, pY, pZ)
        }

        if (pointY < rows-1){
            let pZ = pointZ
            let pY = pointY + 1
            let pX = pointX
            let pos = pZ*colsXrows+cols*pY+pX

            addToListFunction(pos, pX, pY, pZ)
        }

        if (pointY > 0){
            let pZ = pointZ
            let pY = pointY - 1
            let pX = pointX
            let pos = pZ*colsXrows+cols*pY+pX

            addToListFunction(pos, pX, pY, pZ)
        }

        if (pointX < cols-1){
            let pZ = pointZ
            let pY = pointY
            let pX = pointX + 1
            let pos = pZ*colsXrows+cols*pY+pX

            addToListFunction(pos, pX, pY, pZ)
        }

        if (pointX > 0){
            let pZ = pointZ
            let pY = pointY
            let pX = pointX - 1
            let pos = pZ*colsXrows+cols*pY+pX

            addToListFunction(pos, pX, pY, pZ)
        }
    }

    return newIsland

}

function island3DFunction(data, pointPosX, pointPosY, currentSlice, rows, cols){

    let length = data.length

    //switch
    let tempx = pointPosX
    let pointX, pointY, pointZ
    pointPosX = Math.floor(pointPosY)
    pointPosY = Math.floor(tempx)
    var temprows = rows
    rows = cols
    cols = temprows


    var pointPosRowOffset = currentSlice * rows * cols
    var pointZMax = length/rows/cols - 1

    var startPixelVal = data[pointPosRowOffset+(rows*pointPosX)+pointPosY]
    if (startPixelVal==0){
        console.log("point is in background")
        return
    }

    //def new island that will be filled
    var newIsland = new Uint8Array(length).fill(0)
    newIsland[pointPosRowOffset+(rows*pointPosX)+pointPosY] = 1

    var theList = []
    theList.push([pointPosX,pointPosY,currentSlice])

    while (theList.length>0){

        var points = theList.pop()
        pointX = points[0]
        pointY = points[1]
        pointZ = points[2]

        if (pointZ<pointZMax){
            var pZp = pointZ+1
            var pos = pZp*rows*cols+rows*pointX+pointY

            if (newIsland[pos]!=1){
                if (data[pos]==startPixelVal){
                    newIsland[pos] = 1
                    theList.push([pointX, pointY, pZp])
                }
            }
        }

        if (pointZ>0){
            var pZm = pointZ-1
            var pos = pZm*rows*cols+rows*pointX+pointY

            if (newIsland[pos]!=1){
                if (data[pos]==startPixelVal){
                    newIsland[pos] = 1
                    theList.push([pointX, pointY, pZm])
                }
            }
        }

        if (pointX<cols-1){
            var pXp = pointX+1
            var pos = pointZ*rows*cols+rows*pXp+pointY

            if (newIsland[pos]!=1){
                if (data[pos]==startPixelVal){
                    newIsland[pos] = 1
                    theList.push([pXp, pointY, pointZ])
                }
            }
        }

        if (pointX>0){
            var pXm = pointX-1
            var pos = pointZ*rows*cols+rows*(pXm)+pointY

            if (newIsland[pos]!=1){
                if (data[pos]==startPixelVal){
                    newIsland[pos] = 1
                    theList.push([pXm, pointY, pointZ])
                }
            }
        }

        if (pointY<rows-1){
            var pYp = pointY+1
            var pos = pointZ*rows*cols+rows*pointX+pYp

            if (newIsland[pos]!=1){
                if (data[pos]==startPixelVal){
                    newIsland[pos] = 1
                    theList.push([pointX, pYp, pointZ])
                }
            }
        }

        if (pointY>0){
            var pYm = pointY-1
            var pos = pointZ*rows*cols+rows*pointX+pYm

            if (newIsland[pos]!=1){
                if (data[pos]==startPixelVal){
                    newIsland[pos] = 1
                    theList.push([pointX, pYm, pointZ])
                }
            }
        }     
    }
    
    return newIsland

}

function contributeSegmentation(){


    //MAKING MASK NIFTI
    //makes some buffer to thectx.maskImage
    exportMask(thectx)

    let maskData = [new Uint8Array(temp_nii_header,0,temp_nii_header.length), new Uint8Array(thectx.maskImage,0,thectx.maskImage.length)];
    
    let maskBlob,a,b,c

    a = new Uint8Array(maskData[0]);
    b = new Uint8Array(maskData[1]);
    c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    c = nifti.compress(c)
    maskBlob = new Blob([c]);

    //FILENAME
    let fileName = thectx.fileName + ".gz"


    //IMAGE TO NIFTI
    let imageData = [new Uint8Array(temp_nii_header,0,temp_nii_header.length), new Uint8Array(thectx.niftiImage,0,thectx.niftiImage.length)];

    a = new Uint8Array(imageData[0]);
    b = new Uint8Array(imageData[1]);
    c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    c = nifti.compress(c)
    let imageBlob = new Blob([c]);

    //CONFIG FILE
    let fullText = String()
    fullText += "MedSeg config file. Use it by dragging it into MedSeg.\n\n"
    fullText += "Mask value; Name; Red; Green; Blue;\n"
    let currentMaxLabel = checkBoxValueCounter-1
    for (let p = 1; p <= currentMaxLabel; p++) {
        let name = document.getElementById("nameDiv"+String(p))
        let rgb = thectx.labels[p].colormap
        let r = rgb[0]
        let g = rgb[1]
        let b = rgb[2]
        fullText+=String(p)+";"+name.innerHTML+";"+r+";"+g+";"+b+";\n"
    }
    let configBlob = new Blob([fullText], {type: 'text/plain'})


    let formData = new FormData();

    formData.append("image", imageBlob, "image");
    formData.append("mask", maskBlob, "mask");
    formData.append("config", configBlob, "config");
    formData.append("filename", new Blob([fileName]), "filename");

    let request = new XMLHttpRequest();
    request.responseType = "blob"

    request.onload = function() {
        if (request.status == 200) {
            console.log("successfully sent")
            
            //To download the results:
            /* toDownload = new Blob([request.response])

            var a = document.createElement('a');
            a.href = window.URL.createObjectURL(toDownload);
            a.download = "Covid19Report.pdf";
            a.dispatchEvent(new MouseEvent('click'));
            
            //not sure if needed:
            //window.URL.revokeObjectURL(url) */
            
        //console.log(resultblob)
        //console.log(request)
        }
        else{
            console.log("bad response from server")
            /* submitButton.style.backgroundColor = "rgba(193, 39, 45, 0.5)"
            submitButton.onclick = ""
            submitButton.innerHTML = "Something went wrong on server-side." */
        }
    }
    request.open("POST", "http://84.211.226.243:5000/contribute");
    request.send(formData);
}



function logDownload(){
    var formData = new FormData();
    var blob = new Blob([Date.now()-thectx.startTime]);

    formData.append("file", blob, "timeSpent");

    var request = new XMLHttpRequest();

/*     request.onload = function() {
        if (request.status == 200) {
        var blob = request.responseText;
        console.log(blob)
        console.log(request)
        }
    } */

    request.open("POST", "http://84.211.226.243:5000/logSegDownload");
    request.send(formData);
}


function resizingPointerAnimationGrow() {
    if (DGInitialized){
        sizeOfCircle*=1.05;
    }
    else{
        sizeOfCircle*=1.011+(Date.now()-startTime)/10000;
        if (sizeOfCircle==0){
            sizeOfCircle=0.0001
        }
    }
    if (sizeOfCircle > 10000){
        sizeOfCircle = 10000
    }
    
    document.getElementById("pointerSizeText").value = sizeOfCircle//.toFixed(1)
    
    if (DGActivated && deepGrowModel.type != "DGV2"){
        requestAnimationFrame(simpleDraw)
    }
    else{
        changePointerSize()
    }

    if (resizingAct && !drawingNow){
        requestAnimationFrame(resizingPointerAnimationGrow);
    }
}
function changeMaskOpacityLoop(toDo){
    if (!changingMaskOpacity){
        return
    }

    if (toDo=="increaseMaskOpacity"){
        let x = parseFloat(document.querySelector("#pr_canvas").style.opacity);
        x += 0.02;
        if (x > 1) { x = 1; }
        changeMaskOpacity(x)
    }
    else if (toDo=="decreaseMaskOpacity"){
        var x = parseFloat(document.querySelector("#pr_canvas").style.opacity)
        x -= 0.02;
        if (x < 0) { x = 0; }
        changeMaskOpacity(x)
    }

    else if (toDo=="increasePointerOpacity"){
        let x
        if (DGInitialized){
            x = parseFloat(thectx.labels.dgPos.opacity/255)
            x += 0.02;
            if (x > 1) { x = 1; }
            thectx.labels.dgPos.opacity = parseInt(x*255);
            thectx.labels.dgNeg.opacity = parseInt(x*255);
        }
        else{
            x = parseFloat(thectx.labels.vis.opacity/255)
            x += 0.02;
            if (x > 1) { x = 1; }
            thectx.labels.vis.opacity = parseInt(x*255);
        }
        changePointerOpacity(x)
    }

    else if (toDo=="decreasePointerOpacity"){
        let x
        if (DGInitialized){
            x = parseFloat(thectx.labels.dgPos.opacity/255)
            x -= 0.02;
            if (x < 0) { x = 0; }
            thectx.labels.dgPos.opacity = parseInt(x*255);
            thectx.labels.dgNeg.opacity = parseInt(x*255);
        }
        else{
            x = parseFloat(thectx.labels.vis.opacity/255)
            x -= 0.02;
            if (x < 0) { x = 0; }
            thectx.labels.vis.opacity = parseInt(x*255);
        }
        changePointerOpacity(x)
    }



    window.setTimeout(function(){
        changeMaskOpacityLoop(toDo)
    },25)        

}

function resizingPointerAnimationShrink() {
    if (DGInitialized){
        sizeOfCircle/=1.05;
    }
    else{
        sizeOfCircle/=1.01+(Date.now()-startTime)/10000;
    }
    if (sizeOfCircle<0.0001){
        sizeOfCircle=0
    }
    
    document.getElementById("pointerSizeText").value = sizeOfCircle//.toFixed(1)
    
    if (DGActivated && deepGrowModel.type != "DGV2"){
        requestAnimationFrame(simpleDraw)
    }
    else{
        changePointerSize()
    }

    if (resizingAct){
        requestAnimationFrame(resizingPointerAnimationShrink);
    }
}

let pixelValChBox = document.getElementById("pixelValChBox")
pixelValChBox.addEventListener('wheel', function(evt){
    evt.preventDefault()
    let fontSize = parseInt(upperLeftInfoBar.style.fontSize)
    if (!fontSize){
        fontSize =16
    }

    var x = parseInt(evt.deltaY);
    if (x<0){
        if (fontSize<10){
            fontSize += 1
        }
        else{
            fontSize *= 1.1;
        }
    }
    else if (x>0){
        fontSize /= 1.1;
    }
    upperLeftInfoBar.style.fontSize = String(fontSize)+"px"
});

//////////Pointer size range slider/////////////
let PSRSlider = document.getElementById("pointerSizeRange")
PSRSlider.oninput = function() {

    let position = parseFloat(PSRSlider.value)

    // help from: https://stackoverflow.com/questions/846221/logarithmic-slider
    // position will be between 0 and 100
    let minp = 0;
    let maxp = 100;

    // The result should be between 0.01 and 1000
    let minv = Math.log(0.1);
    let maxv = Math.log(1000);

    // calculate adjustment factor
    let scale = (maxv-minv) / (maxp-minp);

    let result = Math.exp(minv + scale*(position-minp))-0.1;

    if (result<0.001){
        result=0
    }
    else if (result<0.02){
        result=0.02
    }
    else if (result>999){
        result=1000
    }
    let pointerSizeText = document.getElementById("pointerSizeText")
    pointerSizeText.value = result
    changePointerSize()
}
///


//////////Mask opacity range slider/////////////

let MORSlider = document.getElementById("maskOpacityRange")
MORSlider.oninput = function() {

    let value = parseFloat(MORSlider.value)
    changeMaskOpacity(value)
    
}
///

//////////Threshold range sliders/////////////
let MaxThrSlider = document.getElementById("maxThrRange")
let MinThrSlider = document.getElementById("minThrRange")

MaxThrSlider.oninput = maxThresholdSliderChange
MinThrSlider.oninput = minThresholdSliderChange

function maxThresholdSliderChange(){
    let maxThr = parseFloat(MaxThrSlider.value)
    let maxThrText = document.getElementById("maxThrText")
    maxThrText.value = maxThr
    upperThreshold = maxThr
    requestAnimationFrame(simpleDraw)
}
function minThresholdSliderChange(){
    let minThr = parseFloat(MinThrSlider.value)
    let minThrText = document.getElementById("minThrText")
    minThrText.value = minThr
    lowerThreshold = minThr
    requestAnimationFrame(simpleDraw)
}


function changeThresholdSlider(){
    MaxThrSlider.value = upperThreshold
    MinThrSlider.value = lowerThreshold
}

function changePointerOpacity(value, textChange="yes"){

    let text = document.getElementById("pointerOpacityText")

    let slider = document.getElementById("pointerOpacityRange")
    slider.value = parseFloat(value)
    
    if (value<0){value=0}
    if (value>1){value=1}

    if(value==0){
        text.style.backgroundColor="rgb(255,0,0)"
    }
    else{
        text.style.backgroundColor=""
    }

    if (DGInitialized){
        thectx.labels.dgPos.opacity = parseInt(value*255);
        thectx.labels.dgNeg.opacity = parseInt(value*255);
    }
    else{
        thectx.labels.vis.opacity = parseInt(value*255)
    }

    if (textChange=="yes"){
        text.value = parseFloat(value).toFixed(1)
    }
    requestAnimationFrame(simpleDraw)
}

function changeMaskOpacity(value, textChange="yes"){

    if (value<0){value=0}
    if (value>1){value=1}

    document.querySelector("#pr_canvas").style.opacity = parseFloat(value)

    let text = document.getElementById("maskOpacityText")
    if (textChange=="yes"){
        text.value = parseFloat(value).toFixed(1)
    }
    if (value==0){
        text.style.backgroundColor="rgb(255,0,0)"
    }
    else{
        text.style.backgroundColor=""
    }

    let pointerOpacityRange = document.getElementById("maskOpacityRange")
    pointerOpacityRange.value = parseFloat(value)
}

document.getElementById("pointerOpacityRange").oninput = function() {
    let value = parseFloat(document.getElementById("pointerOpacityRange").value)
    changePointerOpacity(value)
}

function infoAdvShowFunc(){
    //if starts with #, then make zero
    //else display rows, cols, max slices, distance in x, y, z, 
    //volume per voxel. Total voxels. Max val, min val.
    let pixDim1 = thectx.niftiHeader["pixDims"][1].toFixed(3)
    let pixDim2 = thectx.niftiHeader["pixDims"][2].toFixed(3)
    let pixDim3 = thectx.niftiHeader["pixDims"][3].toFixed(3)

    let windowWidth = Math.round(intensDiv*255)
    let windowLevel = Math.round(intensBaseline+(windowWidth/2))

    upperLeftInfoBar.innerHTML=("########Volume info####### <br>");
    upperLeftInfoBar.innerHTML+=("Filename: "+String(thectx.fileName)+"<br>");
    upperLeftInfoBar.innerHTML+=("Slices: "+String(parseInt(thectx.slider.max)+1)+"<br>");
    upperLeftInfoBar.innerHTML+=("Rows: "+String(thectx.rows)+"<br>");
    upperLeftInfoBar.innerHTML+=("Cols: "+String(thectx.cols)+"<br>");
    upperLeftInfoBar.innerHTML+=("pixDim 1: "+String(pixDim1)+" mm <br>");
    upperLeftInfoBar.innerHTML+=("pixDim 2: "+String(pixDim2)+" mm <br>");
    upperLeftInfoBar.innerHTML+=("pixDim 3 (sl. thickness): "+String(pixDim3)+" mm <br>");
    upperLeftInfoBar.innerHTML+=("<br>")
    upperLeftInfoBar.innerHTML+=("########Display info####### <br>");
    upperLeftInfoBar.innerHTML+=("Window level: "+String(windowLevel)+"<br>");
    upperLeftInfoBar.innerHTML+=("Window width: "+String(windowWidth)+"<br>");
    upperLeftInfoBar.innerHTML+=("Current slice: "+thectx.slider.value+"<br>");
    upperLeftInfoBar.innerHTML+=("Rotation: "+String(rotationCSS)+" degrees<br>");
    upperLeftInfoBar.innerHTML+=("Mirroring: "+String(mirrorActivated)+"<br>");

}

function changeWindowing(min, max, radiological=false, changeInputs=true){
    
    if (radiological){
        //means min = windowWidth and max = windowLevel
        intensBaseline = max-(min/2)
        intensDiv = min/255
    }
     
    else{
        intensBaseline = min;
        intensDiv = (max-min)/255;
    }

    if (changeInputs){

        if (radiological){
            //then need to get the real min and max values
            min = intensBaseline
            max = (intensDiv*255)+min
        }

        let inputMin = document.getElementById("windowingInputMin")
        let inputMax = document.getElementById("windowingInputMax")
        
        inputMin.value = min
        inputMax.value = max

    }

    requestAnimationFrame(simpleDrawCanvas)
}

thectx.fillAllIslands = function(){
    
    //1. get 2d island from point 0,0 (ignore thresholding)
    //2. fill all background but that island

    memorizeSlice()

    let slice = parseInt(this.slider.value);
    let sliceSize = this.sliceSize;
    let sliceOffset = sliceSize * slice;
    let label = this.labels.currentLabel

    let currentSliceMask = thectx.returnCurrentSliceMask()
    let backgroundIsland = island2DFunction(currentSliceMask, 0, 0, thectx.rows, thectx.cols, do0=true)

    for (let p=0; p<backgroundIsland.length; p+=1){
        if (backgroundIsland[p]==0){
            let segValueOfVoxel = thectx.segData[sliceOffset+p]
            if (segValueOfVoxel==0){
                thectx.segData[sliceOffset+p] = label
            }
        }
    }

    visualizeMaskData()
    requestAnimationFrame(simpleDraw)
}

thectx.returnCurrentSliceImage = function(){
    let slice = parseInt(this.slider.value);
    let sliceSize = this.sliceSize;
    let sliceOffset = sliceSize * slice;
    let imageSlice = this.typedData.slice(sliceOffset, sliceOffset+sliceSize);
    return imageSlice
}

thectx.returnCurrentSliceMask = function(){
    let slice = parseInt(this.slider.value);
    let sliceSize = this.sliceSize;
    let sliceOffset = sliceSize * slice;
    let maskSlice = this.segData.slice(sliceOffset, sliceOffset+sliceSize);
    return maskSlice
}



/* let island

if (!thresholdActivated){
    island = island2DFunction(sliceMask, posX, posY, thectx.rows, thectx.cols,do0=true)
}
else {
    let imageData = thectx.typedData.slice(sliceOffset,sliceOffset+sliceSize)
    island = island2DFunction(sliceMask, posX, posY, thectx.rows, thectx.cols,do0=true, threshold=true, imageData=imageData)
}

let segmValue = thectx.labels.currentLabel

for (let p=0; p<island.length; p+=1){
    if (island[p]>0){
        let segValueOfVoxel = thectx.segData[sliceOffset+p]
        if (segValueOfVoxel>0){
            let lockedStatus = thectx.labels[segValueOfVoxel].locked
            if (!lockedStatus){
                thectx.segData[sliceOffset+p] = segmValue
            }
        }
        else {
            thectx.segData[sliceOffset+p] = segmValue
        }
    }
} */

thectx.predictionToSeg = function(){

    let slice = parseInt(thectx.slider.value);

    //don't run this function if it's not the same slice as initial prediction
    //this function is often used to quickly visualize without making a new pred
    if(slice != this.predictionToSegSlice){
        return
    }

    thectx.tempPredSeg = arrayTransformAuto(modelPrediction, thectx.rows, thectx.cols, reverse=true)
        
    let logSlider = function(pos){
        // position will be between 0 and 100
        var minp = 0;
        var maxp = 0.75;

        // The result will be between 100 an 10000000
        var minv = Math.log(1);
        var maxv = Math.log(1e40);

        // calculate adjustment factor
        var scale = (maxv-minv) / (maxp-minp);

        return Math.exp(minv + scale*(pos-minp));
    }

    let thresholdOnSlider = parseFloat(document.getElementById("predThr").value)
    let change = logSlider(Math.abs(thresholdOnSlider-0.75))
    let threshold

    if (thresholdOnSlider>0.75){
        threshold = 1-(0.5/change)
    }
    else{
        threshold = 0.5/change
    }

    if(threshold!=0.5){
        console.log(threshold)
    }

    let sliceOffset = thectx.sliceSize * slice;
    let prediction = this.tempPredSeg
    let total = prediction.length
    let typedData = this.typedData
    let segData = this.segData
    let labels = this.labels
    
    let segValueOfVoxel, lockedStatus
    let pos


    for (let p=0; p<total; p++){
        pos = sliceOffset+p
        if (prediction[p]>=threshold){

            //the prediciton score is over selected threshold (will be segmented)

            segValueOfVoxel = segData[pos]
            if (segValueOfVoxel>0){

                //the voxel is segmented from before

                lockedStatus = labels[segValueOfVoxel].locked
                if (!lockedStatus){

                    //if it's unlocked, it will be modified

                    if (thresholdActivated){
                        if (typedData[pos]>=lowerThreshold && typedData[pos]<=upperThreshold){
                            segData[pos] = labels.currentLabel
                        }
                        else{
                            segData[pos] = 0
                        }
                    }
                    else{
                        segData[pos] = labels.currentLabel
                    }
                }
            }
            else{
                if (thresholdActivated){
                    if (typedData[pos]>=lowerThreshold && typedData[pos]<=upperThreshold){
                        segData[pos] = labels.currentLabel
                    }
                }
                else{
                    segData[pos] = labels.currentLabel
                }
            }
        }
        else{
            //could do dontOverwrite0s here
            //dontOverwrite0s means that a 0 prediction will not overwrite earlier positive prediction
            if (selectedModel.name!="kneeDeepGrade3" && selectedModel.name!="kneeDeepGrade2V4"){
                segValueOfVoxel = segData[pos]
                if (segValueOfVoxel>0){
                    lockedStatus = labels[segValueOfVoxel].locked
                    if (!lockedStatus){
                        segData[pos] = 0
                    }
                }
            }
        }
    }
    visualizeMaskData()
    requestAnimationFrame(simpleDraw)
}