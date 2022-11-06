function createImgDataOfCurrentSl() {
  //creates and returns raw image data of the current slice in Float32 format

  let slice = thectx.slider.value;
  let sliceSize = thectx.sliceSize;
  let sliceOffset = sliceSize * slice;
  let currentSliceRawData = thectx.typedData.slice(
    sliceOffset,
    sliceOffset + sliceSize
  );
  currentSliceRawData = new Float32Array(currentSliceRawData);
  return currentSliceRawData;
}

function createMskDataOfCurrentSl(labelVal = "all", setOutput = 1) {
  //creates and returns raw mask data of the current slice in Float32 format
  //if labelVal is defined, then the function returns only of that label,
  //making everything else 0
  //setOutput is relevant when selecting one label to keep, in that case
  //you may want it as value 1 (for example label 3 becomes 1). If not
  //it can be set to the same as labelVal

  let slice = thectx.slider.value;
  let sliceSize = thectx.sliceSize;
  let sliceOffset = sliceSize * slice;
  let currentSliceRawData = thectx.segData.slice(
    sliceOffset,
    sliceOffset + sliceSize
  );

  if (labelVal != "all") {
    for (let i = 0; i < currentSliceRawData.length; i++) {
      if (currentSliceRawData[i] != 0) {
        if (currentSliceRawData[i] != labelVal) {
          currentSliceRawData[i] = 0;
        } else {
          currentSliceRawData[i] = setOutput;
        }
      }
    }
  }

  currentSliceRawData = new Float32Array(currentSliceRawData);
  return currentSliceRawData;
}

function selectCorrPancreas() {
  (async function() {
    //selectedModelText.innerHTML = "Loading of model started, please wait for this text to update."
    errorSegModel = await tf.loadLayersModel("models/corrPancreas/model.json");
    errorSegModel.name = "corrPancreas";
    console.log("Correction model loaded");
    //selectedModelText.innerHTML = "Correction model loaded";
  })();
}
let runningErrorSeg = false;
function errorSeg(mouseCol, mouseRow) {
  if (runningErrorSeg) {
    return;
  }
  runningErrorSeg = true;
  if (typeof errorSegModel == "undefined") {
    console.log("ErrorSeg model not loaded");
    return;
  }

  let ch0, ch1, ch2;
  let currentSliceMskData;
  let modelPrediction;
  let currentLabel = thectx.labels.currentLabel;

  //start with creating ch0
  //1. make it image data
  //2. transform it to correct orientation - skip for now
  //3. threshold
  //4. resize if needed
  //5. normalize

  ch0 = createImgDataOfCurrentSl();
  ch0 = thresholdFunction(ch0, 400, -200);

  ch0 = tf.tensor(ch0);
  ch0 = tf.reshape(ch0, [thectx.rows, thectx.cols]);
  ch0 = ch0.expandDims(2); // makes shape (512,512,1)

  if (ch0.shape[0] != 512 || ch0.shape[1] != 512) {
    ch0 = tf.image.resizeBilinear(ch0, [512, 512]);
  }

  ch0 = tf.add(ch0, tf.scalar(100));
  ch0 = tf.div(ch0, tf.scalar(130));

  //creating ch2
  //1. make it mask data of current slice segmentation
  //2. transform it to correct orientation - skip for now
  //3. consider making it binary after resize

  currentSliceMskData = createMskDataOfCurrentSl((labelVal = currentLabel));
  ch2 = currentSliceMskData;

  ch2 = tf.tensor(ch2);
  ch2 = tf.reshape(ch2, [thectx.rows, thectx.cols]);
  ch2 = ch2.expandDims(2); // makes shape (512,512,1)

  if (ch2.shape[0] != 512 || ch2.shape[1] != 512) {
    ch2 = tf.image.resizeBilinear(ch2, [512, 512]);
    console.log(
      "Resized segmentation. Consider making it binary if this gives bad results."
    );
  }

  //creating ch1
  //1. create zero array
  //2. find out if place positive or negative and place it
  //3. resize - skipping for now

  ch1 = new Float32Array(thectx.sliceSize);
  if (currentSliceMskData[thectx.rows * mouseCol + mouseRow] == 1) {
    //means the segmentation is already there from before, so should be removed
    ch1[thectx.rows * mouseCol + mouseRow] = -10;
    add = false;
  } else {
    ch1[thectx.rows * mouseCol + mouseRow] = 10;
    add = true;
  }

  //should resize here. Probably easiest to just resize, then locate maximum
  //or minimum and binarize (-10/0/10) based on that. Problem if several pixels
  //have same max/min, then keep only one random of those

  ch1 = tf.tensor(ch1);
  ch1 = tf.reshape(ch1, [thectx.rows, thectx.cols]);
  ch1 = ch1.expandDims(2); // makes shape (512,512,1)

  ch0 = ch0.expandDims(0);
  ch1 = ch1.expandDims(0);
  ch2 = ch2.expandDims(0);

  threeChannels = ch0.concat(ch1, 3);
  threeChannels = threeChannels.concat(ch2, 3);

  //make prediction using the model

  modelPrediction = errorSegModel
    .predict(threeChannels)
    .flatten()
    .dataSync();
  //modelPrediction is a Float32Array(262144)

  //should resize back here if needed

  //subtract or add

  let slice = thectx.slider.value;
  let sliceSize = thectx.sliceSize;
  let sliceOffset = sliceSize * slice;

  if (thectx.memorySeg) {
    memorizeSlice();
  }

  for (let i = 0; i < modelPrediction.length; i++) {
    if (modelPrediction[i] >= 0.5) {
      //should add so that it doesn't change locked value
      if (thectx.segData[sliceOffset + i] != currentLabel) {
        thectx.segData[sliceOffset + i] = currentLabel;
      }
    } else {
      //should add so that it doesn't change locked value
      thectx.segData[sliceOffset + i] = 0;
    }
  }

  //previous version below
  /*     if (add){
        for (let i = 0; i < modelPrediction.length; i++) {
            if (modelPrediction[i]>=0.5){
                //should add so that it doesn't change locked value
                if (thectx.segData[sliceOffset+i]!=currentLabel){
                    thectx.segData[sliceOffset+i] = currentLabel
                }
            }
        }
    }

    else {
        for (let i = 0; i < modelPrediction.length; i++) {
            if (modelPrediction[i]>=0.5){
                if (thectx.segData[sliceOffset+i]==currentLabel){
                    thectx.segData[sliceOffset+i] = 0
                }
            }
        }
    } */
  drawCanvas(thectx);
  runningErrorSeg = false;
}
