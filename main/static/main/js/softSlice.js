softSlice.activate = function(thickness, ratio, centerPoint=0, type="original", lThr="no", uThr="no", sumType="mip"){
    softSlice.thickness = parseFloat(thickness)
    softSlice.ratio = parseFloat(ratio)
    softSlice.type = type
    softSlice.centerPoint = parseFloat(centerPoint)
    softSlice.lThr = parseFloat(lThr)
    softSlice.uThr = parseFloat(uThr)
    softSlice.sumType = sumType
    softSlice.draw = true
    requestAnimationFrame(simpleDrawCanvas)
}

softSlice.deactivate = function(){
    softSlice.draw = false
    requestAnimationFrame(simpleDrawCanvas)
}

softSlice.createOneSlice = function(){

    // th_mm = thickness in mm
    // r = ratio of the furthest slice included
    // type = "original" for both up/down, "up" and "down"
    // c = center point
    // lThr, uThr = lower/upper threshold

    let thicknessOneSlice = parseFloat(thectx.niftiHeader["pixDims"][3].toFixed(3))
    let slices
    let ratio
    let currentSlice = parseInt(thectx.slider.value) //can be 0
    let totalSlices = parseInt(thectx.slider.max)+1 //includes 0
    let sliceSize = thectx.sliceSize
    let typedData = thectx.typedData
    let sliceOffset = thectx.sliceSize * currentSlice
    let slicesToUse, slicesToUseUp, slicesToUseDown
    let ratioCounter = 1 //initial value for ratio

    let th_mm = softSlice.thickness
    let r = softSlice.ratio
    let type = softSlice.type
    let c = softSlice.centerPoint
    let lThr = softSlice.lThr
    let uThr = softSlice.uThr
    let sumType = softSlice.sumType
    let multFactor, multFactorDivBySlicesToUse

    if (type == "up" || type == "down"){
        slices = Math.round((th_mm-thicknessOneSlice)/thicknessOneSlice)
        //"slices" does not include "center slice"
    }
    else if (type == "original"){

        //for example 40 mm, with 3 mm thick slices
        //that means we want ((40-3)/3)/2 ~ 6 from each side, meaning
        //the current slice + 6 slices above + 6 below = sum of 13 slices = 39 mm.

        slices = Math.round(((th_mm - thicknessOneSlice)/thicknessOneSlice)/2)
        //"slices" does not include "center slice"
        if (slices<1){
            console.log("error, 0 or lower in softslice function")
            return
        }
    }
    else{
        console.log("error, wrong type in softSlice function")
        return
    }

    //recalculate ratio

    ratio = r**(1/slices)
    //so if 2 slices, then first will have ratio = 1*ratio
    //2nd will have ratio = 1*ratio*ratio, this will be same as initial r


    if (sumType=="mean"){
        multFactor = 1/(ratio**(slices/2))
    }


    
    if (type == "up"){
        //figure out nr of actual slices to use (can be restricted by volume)
        if ((currentSlice+slices)<totalSlices){
            slicesToUse = slices
        }
        else{
            slicesToUse = totalSlices - currentSlice - 1
            multFactor = 1/(ratio**(slicesToUse/2))
        }

        if (sumType=="mean"){
            //to do this division only once
            multFactorDivBySlicesToUse = multFactor/slicesToUse
        }
        
        //create new empty array, the size of one image
        //for each of axial pixelpos (starting with current):
        //  set initial max 
        //  for each slice(total is slices+1):
        //      recalculate ratioCounter
        //      subtract centerpoint
        //      calculate resulting pixel value
        //      if result is higher than max, then it is max
        //  add back centerpoint to max
        //  add max as the final value of that position

        let finalArray = new Float32Array(thectx.sliceSize)
        let realPixPos, maxVal, pixVal
        
        for (let p = 0; p<finalArray.length; p++) {
            if (sumType=="mip"){
                maxVal = -1000000000000000
            }
            else if (sumType=="mean"){
                maxVal = 0
            }
            else if (sumType=="minip"){
                maxVal = 1000000000000000
            }
            for (let s = 1; s < slicesToUse+1; s++) {
                realPixPos = sliceOffset+(s*sliceSize)+p
                pixVal = typedData[realPixPos]
                if (lThr!="no"){
                    if (pixVal<lThr){
                        pixVal=lThr
                    }
                }
                if (uThr!="no"){
                    if (pixVal>uThr){
                        pixVal=uThr
                    }
                }
                pixVal-=c
                ratioCounter = ratio**s

                if (sumType=="mip"){
                    if (pixVal>0){
                        pixVal*=ratioCounter
                    }
                    else {
                        pixVal/=ratioCounter
                    }

                    if (pixVal>maxVal){
                        maxVal = pixVal
                    }
                }

                else if (sumType=="minip"){
                    //note the name is still maxVal, but here it's min
                    if (pixVal<0){
                        pixVal*=ratioCounter
                    }
                    else {
                        pixVal/=ratioCounter
                    }

                    if (pixVal<maxVal){
                        maxVal = pixVal
                    }
                }

                else if (sumType=="mean"){
                    //note the name is still maxVal, but here it's mean
                    pixVal*=ratioCounter

                    maxVal += pixVal*multFactorDivBySlicesToUse

                }

            }
            maxVal+=c
            finalArray[p] = maxVal
        }
        return finalArray
    }


    else if (type == "down"){
        if ((currentSlice-slices)>=0){
            slicesToUse = slices
        }
        else{
            slicesToUse = currentSlice
            multFactor = 1/(ratio**(slicesToUse/2))
        }

        if (sumType=="mean"){
            //to do this division only once
            multFactorDivBySlicesToUse = multFactor/slicesToUse
        }

        let finalArray = new Float32Array(thectx.sliceSize)
        let realPixPos, maxVal, pixVal
        
        for (let p = 0; p<finalArray.length; p++) {
            if (sumType=="mip"){
                maxVal = -1000000000000000
            }
            else if (sumType=="mean"){
                maxVal = 0
            }
            else if (sumType=="minip"){
                maxVal = 1000000000000000
            }
            for (let s = 1; s < slicesToUse+1; s++) {
                realPixPos = sliceOffset-(s*sliceSize)+p
                pixVal = typedData[realPixPos]

                if (lThr!="no"){
                    if (pixVal<lThr){
                        pixVal=lThr
                    }
                }
                if (uThr!="no"){
                    if (pixVal>uThr){
                        pixVal=uThr
                    }
                }
                pixVal-=c
                ratioCounter = ratio**s

                if (sumType=="mip"){
                    if (pixVal>0){
                        pixVal*=ratioCounter
                    }
                    else {
                        pixVal/=ratioCounter
                    }

                    if (pixVal>maxVal){
                        maxVal = pixVal
                    }
                }

                else if (sumType=="minip"){
                    //note the name is still maxVal, but here it's min
                    if (pixVal<0){
                        pixVal*=ratioCounter
                    }
                    else {
                        pixVal/=ratioCounter
                    }

                    if (pixVal<maxVal){
                        maxVal = pixVal
                    }
                }
                
                else if (sumType=="mean"){
                    //note the name is still maxVal, but here it's mean
                    pixVal*=ratioCounter

                    maxVal += pixVal*multFactorDivBySlicesToUse
                }

            }
            maxVal+=c
            finalArray[p] = maxVal
        }
        return finalArray
    }

    else if (type == "original"){
        if ((currentSlice+slices)<totalSlices){
            slicesToUseUp = slices
        }
        else{
            slicesToUseUp = totalSlices - currentSlice - 1
        }
        if ((currentSlice-slices)>=0){
            slicesToUseDown = slices
        }
        else{
            slicesToUseDown = currentSlice
        }

        let finalArray = new Float32Array(thectx.sliceSize)
        let realPixPos, maxVal, pixVal

        for (let p = 0; p<finalArray.length; p++) {

            if (sumType=="mip"){
                maxVal = -1000000000000000
            }
            else if (sumType=="mean"){
                maxVal = 0
            }
            else if (sumType=="minip"){
                maxVal = 1000000000000000
            }

            for (let s = 1; s < slicesToUseDown+1; s++) {
                realPixPos = sliceOffset-(s*sliceSize)+p
                pixVal = typedData[realPixPos]
                if (lThr!="no"){
                    if (pixVal<lThr){
                        pixVal=lThr
                    }
                }
                if (uThr!="no"){
                    if (pixVal>uThr){
                        pixVal=uThr
                    }
                }
                pixVal-=c
                ratioCounter = ratio**s
                if (sumType=="mip"){
                    if (pixVal>0){
                        pixVal*=ratioCounter
                    }
                    else {
                        pixVal/=ratioCounter
                    }

                    if (pixVal>maxVal){
                        maxVal = pixVal
                    }
                }

                else if (sumType=="minip"){
                    //note the name is still maxVal, but here it's min
                    if (pixVal<0){
                        pixVal*=ratioCounter
                    }
                    else {
                        pixVal/=ratioCounter
                    }

                    if (pixVal<maxVal){
                        maxVal = pixVal
                    }
                }
                
                else if (sumType=="mean"){
                    //note the name is still maxVal, but here it's mean
                    pixVal*=ratioCounter

                    maxVal += pixVal/slicesToUse

                }
            }

            //here going from s = 0, to include center slice
            for (let s = 0; s < slicesToUseUp+1; s++) {
                realPixPos = sliceOffset+(s*sliceSize)+p
                pixVal = typedData[realPixPos]
                if (lThr!="no"){
                    if (pixVal<lThr){
                        pixVal=lThr
                    }
                }
                if (uThr!="no"){
                    if (pixVal>uThr){
                        pixVal=uThr
                    }
                }
                pixVal-=c
                ratioCounter = ratio**s
                if (sumType=="mip"){
                    if (pixVal>0){
                        pixVal*=ratioCounter
                    }
                    else {
                        pixVal/=ratioCounter
                    }

                    if (pixVal>maxVal){
                        maxVal = pixVal
                    }
                }

                else if (sumType=="minip"){
                    //note the name is still maxVal, but here it's min
                    if (pixVal<0){
                        pixVal*=ratioCounter
                    }
                    else {
                        pixVal/=ratioCounter
                    }

                    if (pixVal<maxVal){
                        maxVal = pixVal
                    }
                }
                
                else if (sumType=="mean"){
                    //note the name is still maxVal, but here it's mean
                    pixVal*=ratioCounter

                    maxVal += pixVal/slicesToUse

                }
            }

            maxVal+=c
            finalArray[p] = maxVal
        }
        return finalArray

    }

}