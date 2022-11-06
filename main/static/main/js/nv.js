//Larger should-haves:
//Between-slice interpolation of segmentation (ITK)
//MPR
//3D/STL
//Upload 3D - get link to share
//to server interaction with models (and other processing) on server

//To fix:
//auto correct rotation when opening(!)
//fix resizing and mousepos when rot 90 or 270 - also adapt to deepgrow
//also make it possible to load new image or mask after applying MPR rotation

//deepgrow/pointersize slider set to correct on switching with g on/off

//Ideas:
//fill automatically after tracing outer boundaries
//train model in-browser
//change keybindings
//like "i", but for segmentation, both in current slice and 3d + volume + area
//add editable modelpredictionpercentage
//minus button to remove labels

//design:

//User experience:
//Undo more moves, including be taken to relevant slice and 3d schanges
//Possibly make ctrl + y possible.

//notes:
//fixes since React started:
//voxel offset when loading image (error in one neuro dataset)
//"are you sure you want to quit? warning"

let softSlice = {
  draw: false
};
let initialized = false;
var startUpConditions = {};

var selectedModel = {
  name: "none",
  lThr: "no",
  uThr: "no"
};
var modelPrediction;
var mirrorActivated = false;
var windowedImageDataPredicting = false;
var mousePos;
let highlightMaskBoundaries = false;

var DGInitialized = false;
var DGActivated = false;
var DLRunning = false;
var MPRActivated = false;
var thresholdPreview = true;
let deepGrowModel = {};
deepGrowModel.name = "none";

let roiPos1 = [100, 200];
let roiPos2 = [200, 300];

globalCaliperVals = {};

function resize2DImageFromPrediction(modelPred, shape = [512, 512, 1]) {
  //image in 1d becomes 2d image to known shape, resized, put back into 1d and sent back
  modelPred = tf.tensor(modelPred);
  modelPred = modelPred.reshape(shape);
  modelPred = tf.image.resizeNearestNeighbor(modelPred, [
    thectx.rows,
    thectx.cols
  ]);
  modelPred = modelPred.flatten().dataSync();
  return modelPred;
}

function finalizePrediction() {
  var slice = thectx.slider.value;
  var sliceOffset = thectx.sliceSize * slice;
  let CurrentSliceRawData; //if needed to look at raw values
  if (selectedModel.name == "BodySegAI" && !DGActivated) {
    CurrentSliceRawData = thectx.typedData.slice(
      sliceOffset,
      sliceOffset + thectx.sliceSize
    );
  }

  if (selectedModel.type == "multilabel" && !DGActivated) {
    let totalMP = modelPrediction.length;

    let outputLabels = selectedModel.outputs[0].shape[3];
    let predictionVols = [];
    for (let l = 0; l < outputLabels; l++) {
      //making prediction volumes, to be able to select the highest per pixel
      predictionVols[l] = new Float32Array(totalMP / outputLabels);
    }

    for (let p = 0; p < totalMP; p++) {
      let pMult = p * outputLabels;
      for (let l = 0; l < outputLabels; l++) {
        predictionVols[l][p] = modelPrediction[pMult + l];
      }
    }

    for (let l = 0; l < outputLabels; l++) {
      predictionVols[l] = resize2DImageFromPrediction(predictionVols[l]);
      predictionVols[l] = arrayTransformAuto(
        predictionVols[l],
        thectx.rows,
        thectx.cols,
        (reverse = true)
      );
      if (checkBoxValueCounter - 1 < outputLabels) {
        buttonpress();
      }
    }

    let total = predictionVols[0].length;
    let segData = thectx.segData;

    for (let l = 0; l < selectedModel.ordering.length; l++) {
      //prioritizing last labels if locked (if prediction is positive in multiple channels)

      let label = selectedModel.ordering[l] - 1;

      let predVol = predictionVols[label];
      let outputLabelNr = label + 1;

      for (var p = 0; p < total; p++) {
        if (predVol[p] > 0.5) {
          if (selectedModel.name == "BodySegAI" && !DGActivated) {
            let largest = true;
            let maxOutput = predVol[p];
            let CSRDP = CurrentSliceRawData[p]; //current pixel raw data
            for (let ch = 0; ch < 3; ch++) {
              if (predictionVols[ch][p] > maxOutput) {
                //make it non largest only if ok thresholding
                //to not get largest that then is thresholded away
                if (ch == 0) {
                  if (CSRDP >= -190 && CSRDP <= 150) {
                    largest = false;
                  }
                } else if (ch == 1) {
                  if (CSRDP >= -150 && CSRDP <= -50) {
                    largest = false;
                  }
                } else if (ch == 2) {
                  if (CSRDP >= -190 && CSRDP <= -30) {
                    largest = false;
                  }
                }
                largest = false;
              }
            }
            if (largest) {
              if (outputLabelNr == 1) {
                if (CSRDP >= -29 && CSRDP <= 150) {
                  segData[sliceOffset + p] = 1;
                } else if (CSRDP >= -190 && CSRDP <= -30) {
                  segData[sliceOffset + p] = 2;
                }
              } else if (outputLabelNr == 2) {
                if (CSRDP >= -150 && CSRDP <= -50) {
                  segData[sliceOffset + p] = 3;
                }
              } else if (outputLabelNr == 3) {
                if (CSRDP >= -190 && CSRDP <= -30) {
                  segData[sliceOffset + p] = 4;
                }
              }
            }
          } else if (selectedModel.name == "kneeDeepV5" && !DGActivated) {
            if (outputLabelNr == 2) {
              let largest = true;
              let maxOutput = predVol[p];
              for (let ch = 0; ch < 3; ch++) {
                if (predictionVols[ch][p] > maxOutput) {
                  largest = false;
                }
              }
              if (largest) {
                //make it
                segData[sliceOffset + p] = outputLabelNr;
              }
              //find max model output
              //set segdata only if really max
            } else {
              segData[sliceOffset + p] = outputLabelNr;
            }
          }
          //commenting because introducing ordering instead of lock status
          /* var segValueOfVoxel = segData[sliceOffset+p]
                    if (segValueOfVoxel>0){
                        var lockedStatus = thectx.labels[segValueOfVoxel].locked
                        if (!lockedStatus){
                            segData[sliceOffset+p] = outputLabelNr
                        }
                    }
                    else{
                        segData[sliceOffset+p] = outputLabelNr
                    } */
          else {
            segData[sliceOffset + p] = outputLabelNr;
          }
        }
      }
    }

    if (selectedModel.name == "kneeDeep" && !DGActivated) {
      //exception for kneedeep
      for (var p = 0; p < total; p++) {
        /* if (segData[sliceOffset+p]==4){
                    segData[sliceOffset+p]=5
                } */
        if (segData[sliceOffset + p] == 3) {
          segData[sliceOffset + p] = 5;
        }
      }
    }

    if (selectedModel.name == "kneeDeepV5" && !DGActivated) {
      //exception for kneedeep
      for (var p = 0; p < total; p++) {
        if (segData[sliceOffset + p] == 1) {
          segData[sliceOffset + p] = 5;
        } else if (segData[sliceOffset + p] == 2) {
          segData[sliceOffset + p] = 1;
        } else if (segData[sliceOffset + p] == 3) {
          segData[sliceOffset + p] = 2;
        }
      }
    }

    visualizeMaskData();
    draw(vis_canvas, posx, posy);
  } else {
    if (selectedModel.name == "roi" && !DGActivated) {
      //make it zeros around segmentation roi, make roi to original (usually 512,512)
      let lengthOfOrigData = thectx.rows * thectx.cols;
      let origSliceData = new Float32Array(lengthOfOrigData);
      let counter = 0;

      let minRow = Math.min(roiPos1[0], roiPos2[0]);
      let maxRow = Math.max(roiPos1[0], roiPos2[0]);

      let minCol = Math.min(roiPos1[1], roiPos2[1]);
      let maxCol = Math.max(roiPos1[1], roiPos2[1]);

      for (let row = minRow; row < maxRow; row++) {
        for (let col = minCol; col < maxCol; col++) {
          let rowOffset = row * thectx.cols;
          origSliceData[rowOffset + col] = modelPrediction[counter];
          counter += 1;
        }
      }
      modelPrediction = origSliceData;
    }

    //doing prediction with an editable threshold, therefore showing slider
    let div = document.getElementById("thresholdPredictionDiv");
    div.style.visibility = "visible";

    //memorizing which slice this is on, so that it will only run that function
    //on this slice where the initial prediction was performed
    thectx.predictionToSegSlice = parseInt(thectx.slider.value);

    thectx.predictionToSeg();
  }
}

function preprocess(img, norm = false) {
  // norm when img is from canvas (meaning it is normalized to 0-255)
  var tensor = 0;

  if (norm) {
    //convert the image data to a tensor
    tensor = tf.browser.fromPixels(img, 1);
  } else {
    var slice = thectx.slider.value;
    var sliceSize = thectx.sliceSize;
    var sliceOffset = sliceSize * slice;
    var CurrentSliceRawData = thectx.typedData.slice(
      sliceOffset,
      sliceOffset + sliceSize
    );
    //CurrentSliceRawData = arrayFlipUpDown(CurrentSliceRawData,thectx.rows,thectx.cols)
    CurrentSliceRawData = arrayTransformAuto(
      CurrentSliceRawData,
      thectx.rows,
      thectx.cols,
      false
    );

    if (selectedModel.name == "CTSlToSlModel" && !DGActivated) {
      //all the processing done inside here, including normalization
      return addTwoChannelsSlToSl(CurrentSliceRawData);
    }
    if (selectedModel.name == "CTPancreasMeanSS" && !DGActivated) {
      //all the processing done inside here, including normalization
      return prepareTensorsForSS(CurrentSliceRawData, 50, 0.1);
    }
    if (selectedModel.name == "CTSpleenMeanSS" && !DGActivated) {
      //all the processing done inside here, including normalization
      return prepareTensorsForSS(CurrentSliceRawData, 30, 0.25);
    }
    if (selectedModel.name == "CTLiverMeanSS" && !DGActivated) {
      //all the processing done inside here, including normalization
      return prepareTensorsForSS(CurrentSliceRawData, 30, 0.25);
    }
    if (selectedModel.name == "kneeDeepGrade2V4" && !DGActivated) {
      //all the processing done inside here, including normalization
      return addTwoChannelsSlices(CurrentSliceRawData);
    }
    if (selectedModel.name == "kneeDeepV5" && !DGActivated) {
      //all the processing done inside here, including normalization
      return addTwoChannelsSlices(CurrentSliceRawData);
    }
    if (selectedModel.name == "MRITuberousSclerosis" && !DGActivated) {
      //all the processing done inside here, including normalization
      return addTwoChannelsSlices(CurrentSliceRawData);
    }
    if (selectedModel.name == "MRIVentricles" && !DGActivated) {
      //all the processing done inside here, including normalization
      return addTwoChannelsSlices(CurrentSliceRawData);
    }

    if (selectedModel.name == "BodySegAI" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 600, -400);
    }
    if (selectedModel.name == "CTBrainHematomaModel" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 125, 0);
    }
    if (selectedModel.name == "covid19" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 300, -1024);
    }
    if (selectedModel.name == "igor" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 500, -1500);
    }
    if (selectedModel.name == "CTLiverMetsModel" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 400, -200);
    }
    if (selectedModel.name == "CTLiverSegments5" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 500, -500);
    }
    if (selectedModel.name == "CTBronchiModel" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 100, -1024);
    }
    if (selectedModel.name == "CTIVCModel" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 600, -200);
    }
    if (selectedModel.name == "CTPleuralEffusionModel" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 300, -200);
    }
    if (selectedModel.name == "CTLungsModel" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 300, -1000);
    }
    if (selectedModel.name == "Fissures" && !DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 300, -1000);
    }
    if (selectedModel.name == "roi" && !DGActivated) {
      //make input span only from roi1 to roi2
      let lengthOfNewData =
        Math.abs(roiPos1[0] - roiPos2[0]) * Math.abs(roiPos1[1] - roiPos2[1]);
      let roiSliceData = new Float32Array(lengthOfNewData);
      let counter = 0;

      let minRow = Math.min(roiPos1[0], roiPos2[0]);
      let maxRow = Math.max(roiPos1[0], roiPos2[0]);

      let minCol = Math.min(roiPos1[1], roiPos2[1]);
      let maxCol = Math.max(roiPos1[1], roiPos2[1]);

      for (let row = minRow; row < maxRow; row++) {
        for (let col = minCol; col < maxCol; col++) {
          let rowOffset = row * thectx.cols;
          roiSliceData[counter] = CurrentSliceRawData[rowOffset + col];
          counter += 1;
        }
      }
      CurrentSliceRawData = roiSliceData;
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 400, -200);
    }
    if (deepGrowModel.name == "DGV2LymphNodeModel" && DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 200, -200);
    }
    if (deepGrowModel.name == "DGCTPancreas" && DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 400, -200);
    }
    if (deepGrowModel.name == "DGCTLiverSegments" && DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 500, -500);
    }
    if (deepGrowModel.name == "DGCTThorax" && DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 500, -1024);
    }
    if (deepGrowModel.name == "DGV2CTLiverTumorModel" && DGActivated) {
      CurrentSliceRawData = thresholdFunction(CurrentSliceRawData, 200, -200);
    }

    try {
      tensor = tf.tensor(CurrentSliceRawData);
    } catch (error) {
      //this when MRI data
      CurrentSliceRawData = new Float32Array(CurrentSliceRawData);
      tensor = tf.tensor(CurrentSliceRawData);
    }

    if (selectedModel.name == "roi") {
      let newRows = Math.abs(roiPos1[0] - roiPos2[0]);
      let newCols = Math.abs(roiPos1[1] - roiPos2[1]);
      tensor = tf.reshape(tensor, [newRows, newCols]);
    } else {
      if (rotationCSS != 90 && rotationCSS != 270) {
        tensor = tf.reshape(tensor, [thectx.rows, thectx.cols]);
      } else {
        tensor = tf.reshape(tensor, [thectx.cols, thectx.rows]);
      }
    }
    tensor = tensor.expandDims(2); //makes shape (512,512,1)
  }

  //1ms until here
  if (selectedModel.name == "roi" && !DGActivated) {
    tensor = tf.image.resizeBilinear(tensor, [256, 256]);
  }

  // RESIZE TO 512 512
  else if (tensor.shape[0] != 512 || tensor.shape[1] != 512) {
    tensor = tf.image.resizeBilinear(tensor, [512, 512]);
  } else if (selectedModel.name == "igor" && !DGActivated) {
    tensor = tf.image.resizeBilinear(tensor, [256, 256]);
  }

  // Normalize the image
  if (norm) {
    //if using windowed
    tensor = tf.mul(tensor, tf.scalar(intensDiv));
    tensor = tf.add(tensor, tf.scalar(intensBaseline));
    console.log("normalizing window");
  } else if (deepGrowModel.normalize == "CT" && DGActivated) {
    tensor = tf.add(tensor, tf.scalar(535.7372827952495));
    tensor = tf.div(tensor, tf.scalar(492.83128067388367));
  } else if (selectedModel.name == "CTBrainHematomaModel" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(-10));
    tensor = tf.div(tensor, tf.scalar(30));
  } else if (selectedModel.name == "roi" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(-40));
    tensor = tf.div(tensor, tf.scalar(80));
  } else if (selectedModel.name == "BodySegAI" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(535.7372827952495));
    tensor = tf.div(tensor, tf.scalar(492.83128067388367));
  } else if (selectedModel.name == "covid19" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(535.7372827952495));
    tensor = tf.div(tensor, tf.scalar(492.83128067388367));
  } else if (selectedModel.name == "kneeDeep" && !DGActivated) {
    //subtract mean, divide by std for slice
    tensor = tf.sub(tensor, tensor.mean());
    tensor = tf.div(tensor, tf.moments(tensor).variance.sqrt());
  } else if (selectedModel.name == "kneeDeepGrade3" && !DGActivated) {
    //subtract mean, divide by std for slice
    tensor = tf.sub(tensor, tensor.mean());
    tensor = tf.div(tensor, tf.moments(tensor).variance.sqrt());
  } else if (selectedModel.name == "kneeDeepFat" && !DGActivated) {
    //trained with scalars for mean and std
    tensor = tf.sub(tensor, tf.scalar(17));
    tensor = tf.div(tensor, tf.scalar(40));
  } else if (selectedModel.name == "MS" && !DGActivated) {
    tensor = tf.sub(tensor, tensor.mean());
    tensor = tf.div(tensor, tf.moments(tensor).variance.sqrt());
  } else if (selectedModel.name == "PSD" && !DGActivated) {
    tensor = tf.sub(tensor, tf.scalar(69));
    tensor = tf.div(tensor, tf.scalar(80));
  } else if (selectedModel.name == "Fissures" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(535.7372827952495));
    tensor = tf.div(tensor, tf.scalar(492.83128067388367));
  } else if (selectedModel.name == "igor" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(445.2498673573911));
    tensor = tf.div(tensor, tf.scalar(498.8752600822467));
  } else if (selectedModel.name == "CTLiverMetsModel" && !DGActivated) {
    //no normalization
  } else if (selectedModel.name == "CTLiverSegments5" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(535.7372827952495));
    tensor = tf.div(tensor, tf.scalar(492.83128067388367));
  } else if (selectedModel.name == "CTIVCModel" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(535.7372827952495));
    tensor = tf.div(tensor, tf.scalar(492.83128067388367));
  } else if (selectedModel.name == "CTBronchiModel" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(535.7372827952495));
    tensor = tf.div(tensor, tf.scalar(492.83128067388367));
  } else if (selectedModel.name == "CTLungsModel" && !DGActivated) {
    tensor = tf.add(tensor, tf.scalar(535.7372827952495));
    tensor = tf.div(tensor, tf.scalar(492.83128067388367));
  } else if (selectedModel.name == "hippocampusModel" && !DGActivated) {
    tensor = tf.sub(tensor, tensor.mean());
    tensor = tf.div(tensor, tf.moments(tensor).variance.sqrt());
  } else if (
    (selectedModel.name == "standard" && !DGActivated) ||
    deepGrowModel.name == "DGStandard" ||
    deepGrowModel.type == "DGV2"
  ) {
    //note that all DG v2s have this
    tensor = tf.add(tensor, tf.scalar(535.7372827952495));
    tensor = tf.div(tensor, tf.scalar(492.83128067388367));
  } else if (deepGrowModel.name == "DGMRIAbdOrg" && DGActivated) {
    var mean = tensor.mean();
    tensor = tf.sub(tensor, mean);

    //from https://stackoverflow.com/questions/56943451/calculate-standard-deviation-in-tensorflowjs
    var std = tf.moments(tensor).variance.sqrt();
    tensor = tf.div(tensor, std);
  }

  //Add a dimension to get a batch shape
  var batched = tensor.expandDims(0);

  //sometimes 20ms, usually under 5ms
  return batched;
}

function selectCTSlToSlModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/CTSlToSl/model.json");
    selectedModelText.innerHTML =
      "CT + MRI: general slice-to-slice model loaded";
    selectedModel.name = "CTSlToSlModel";
    selectedModel.type = "slToSl";
  })();
}

function selectBodySegAIModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/BodySegAI/model.json");
    selectedModelText.innerHTML = "BodySegAI model loaded";
    selectedModel.name = "BodySegAI";
    selectedModel.type = "multilabel";
    //ordering means from first to last, last overwriting previous

    selectedModel.ordering = [1, 2, 3];

    while (checkBoxValueCounter - 1 < 4) {
      buttonpress();
      //to create 4 possible labels
    }
  })();
}

function selectKneeDeepFatModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/kneeDeepFat/model.json");
    selectedModelText.innerHTML = "KneeDeep fett modell lastet inn";
    selectedModel.name = "kneeDeepFat";
    selectedModel.type = "multilabel";
    //ordering means from first to last, last overwriting previous
    selectedModel.ordering = [1, 2, 3, 4];
  })();
}

function selectKneeDeepModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/kneeDeepV3/model.json");
    selectedModelText.innerHTML = "KneeDeep vann modell lastet inn";
    selectedModel.name = "kneeDeep";
    selectedModel.type = "multilabel";
    //selectedModel.ordering = [4,1,2,3]
    selectedModel.ordering = [3, 1, 2];
  })();
}

function selectKneeDeepGrade3Model() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/kneeDeepGrade3/model.json"
    );
    selectedModelText.innerHTML = "KneeDeep grad 3 modell lastet inn";
    selectedModel.name = "kneeDeepGrade3";
    //selectedModel.dontOverwrite0s = true
  })();
}

function selectKneeDeepGrade2Modelv4() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/kneeDeepGrade2V4/model.json"
    );
    selectedModelText.innerHTML = "KneeDeep grad 2 modell lastet inn";
    selectedModel.name = "kneeDeepGrade2V4";
    //selectedModel.dontOverwrite0s = true
  })();
}

function selectKneeDeepModelv5() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/kneeDeepV5/model.json");
    selectedModelText.innerHTML = "KneeDeep v5 vann modell lastet inn";
    selectedModel.name = "kneeDeepV5";
    selectedModel.type = "multilabel";
    selectedModel.ordering = [1, 2, 3]; //1=background/gr1 2=grade2, 3=grade3
    //selectedModel.dontOverwrite0s = true
  })();
}

function selectMRITuberousSclerosisModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/MRITuberousSclerosis/model.json"
    );
    selectedModelText.innerHTML = "MRI T2 tuberous sclerosis model loaded";
    selectedModel.name = "MRITuberousSclerosis";
  })();
}

function selectKneeDeepGrade3Modelv2() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/kneeDeepGrade3v2/model.json"
    );
    selectedModelText.innerHTML = "KneeDeep grad 3 modell v2 lastet inn";
    selectedModel.name = "kneeDeepGrade3";
    //selectedModel.dontOverwrite0s = true
  })();
}

function selectIgorModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/igor/model.json");
    selectedModelText.innerHTML = "Igor's model loaded";
    selectedModel.name = "igor";
    selectedModel.type = "multilabel";
  })();
}

function selectCovid19Model() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/covid19/model.json");
    selectedModelText.innerHTML = "CT Thorax Covid-19 model loaded";
    selectedModel.name = "covid19";
    selectedModel.type = "multilabel";
    selectedModel.ordering = [1, 2, 3];
  })();
}

function selectCerebellarModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/cerebellumModel/model.json"
    );
    selectedModelText.innerHTML = "MRI T2 Cerebellar 2d model loaded";
    selectedModel.name = "standard";
  })();
}
function selectHippocampusModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/hippocampus/model.json");
    selectedModelText.innerHTML = "MRI T1 Hippocampus 2d model loaded";
    selectedModel.name = "hippocampusModel";
  })();
}

function selectCTLiverMetsModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTLiverMetsModel/model.json"
    );
    selectedModelText.innerHTML = "CT Liver Mets 2d model loaded";
    selectedModel.name = "CTLiverMetsModel";
  })();
}
function selectPonsModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/ponsModel/model.json");
    selectedModelText.innerHTML = "MRI T2 Pons 2d model loaded";
    selectedModel.name = "standard";
  })();
}
function selectMSModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/MS/model.json");
    selectedModelText.innerHTML =
      "MRI T2 Flair Multipe Sclerosis 2d model loaded";
    selectedModel.name = "MS";
  })();
}

function selectPSDModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/PSD/model.json");
    selectedModelText.innerHTML = "MRI T2 Flair PSD 2d coronal model loaded";
    selectedModel.name = "PSD";
  })();
}

function selectFissuresModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/Fissures/model.json");
    selectedModelText.innerHTML = "CT Thorax fissures model loaded";
    selectedModel.name = "Fissures";
  })();
}

function selectCTLiverModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/CTLiverModel/model.json");
    selectedModelText.innerHTML = "CT Liver 2d model loaded";
    selectedModel.name = "standard";
  })();
}

function selectCTLiver5SegModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTLiverSegments5/model.json"
    );
    selectedModelText.innerHTML = "CT 5 liversegments 2d model loaded";
    selectedModel.name = "CTLiverSegments5";
    selectedModel.type = "multilabel";
    selectedModel.ordering = [5, 2, 3, 4, 1];
  })();
}

function selectCTPancreasModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTPancreasMeanSS/model.json"
    );
    selectedModelText.innerHTML = "CT Pancreas 2,5d model loaded";
    selectedModel.name = "CTPancreasMeanSS";
  })();
}

function selectCTSpleenModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTSpleenMeanSS/model.json"
    );
    selectedModelText.innerHTML = "CT Spleen 2,5d model loaded";
    selectedModel.name = "CTSpleenMeanSS";
  })();
}
function selectCTLiverSSModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/CTLiverSS/model.json");
    selectedModelText.innerHTML = "CT Liver 2.5d model loaded";
    selectedModel.name = "CTLiverMeanSS";
  })();
}
function selectCTKidneyLeftSSModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTKidneyLeftSS/model.json"
    );
    selectedModelText.innerHTML = "CT left kidney 2.5d model loaded";
    selectedModel.name = "CTLiverMeanSS"; //to not create new processing pipeline
  })();
}
function selectCTKidneyRightSSModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTKidneyRightSS/model.json"
    );
    selectedModelText.innerHTML = "CT right kidney 2.5d model loaded";
    selectedModel.name = "CTLiverMeanSS"; //to not create new processing pipeline
  })();
}

function selectCTVentriclesModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTVentriclesModel/model.json"
    );
    selectedModelText.innerHTML = "CT Brain ventricles 2d model loaded";
    selectedModel.name = "standard";
  })();
}
function selectCTBrainHematomaModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTBrainHematomaModel/model.json"
    );
    selectedModel.name = "CTBrainHematomaModel";
    selectedModelText.innerHTML = "CT Brain hematoma 2d model loaded";
  })();
}
function selectCTBronchiModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTBronchiModel/model.json"
    );
    selectedModel.name = "CTBronchiModel";
    selectedModelText.innerHTML = "CT Thorax central airways model loaded";
  })();
}

function selectCTIVCModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/CTIVC/model.json");
    selectedModel.name = "CTIVCModel";
    selectedModelText.innerHTML = "CT Abdomen inferior vena cava model loaded";
  })();
}
function selectCTAbdVentricleModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTAbdVentricle/model.json"
    );
    selectedModel.name = "CTIVCModel"; //same preprocessing as ivc
    selectedModelText.innerHTML = "CT Abdomen ventricle model loaded";
  })();
}

function selectCTPleuralEffusionModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/CTPleuralEffusion/model.json"
    );
    selectedModel.name = "CTPleuralEffusionModel";
    selectedModelText.innerHTML = "CT Thorax pleural effusion model loaded";
  })();
}

function selectCTLungsModel() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/CTLungs/model.json");
    selectedModel.name = "CTLungsModel";
    selectedModelText.innerHTML = "CT Thorax lungs model loaded";
  })();
}

function selectDeepGrow() {
  (async function() {
    selectedDGModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    deepGrowModel = await tf.loadLayersModel("models/deepGrowModel/model.json");
    deepGrowModel.name = "DGStandard";
    deepGrowModel.normalize = "standard";
    deepGrowModel.status = "none";
    deepGrowPreModel = false;
    selectedDGModelText.innerHTML =
      "DeepGrow CT liver/kidneys/spleen model loaded";
  })();
}

function selectDGCTThorax() {
  (async function() {
    selectedDGModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    deepGrowModel = await tf.loadLayersModel("models/DGCTThorax/model.json");
    deepGrowModel.name = "DGCTThorax";
    deepGrowModel.normalize = "CT";
    deepGrowModel.status = "none";
    deepGrowPreModel = false;
    selectedDGModelText.innerHTML = "DeepGrow CT Thorax model loaded";
  })();
}

function selectDGCTPancreas() {
  (async function() {
    selectedDGModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    deepGrowModel = await tf.loadLayersModel("models/DGCTPancreas/model.json");
    deepGrowModel.name = "DGCTPancreas";
    deepGrowModel.normalize = "CT";
    deepGrowModel.status = "none";
    deepGrowPreModel = false;
    selectedDGModelText.innerHTML = "DeepGrow CT pancreas model loaded";
  })();
}

function selectDGLiverSegments() {
  (async function() {
    selectedDGModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    deepGrowModel = await tf.loadLayersModel(
      "models/DGCTLiverSegments/model.json"
    );
    deepGrowModel.name = "DGCTLiverSegments";
    deepGrowModel.normalize = "CT";
    deepGrowModel.status = "none";
    deepGrowPreModel = false;
    selectedDGModelText.innerHTML = "DeepGrow CT liver segments model loaded";
  })();
}

function selectDGMRIAbdOrg() {
  (async function() {
    selectedDGModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    deepGrowModel = await tf.loadLayersModel("models/DGMRIAbdOrg/model.json");
    deepGrowModel.name = "DGMRIAbdOrg";
    deepGrowModel.normalize = "MRI";
    deepGrowModel.status = "none";
    deepGrowPreModel = false;
    selectedDGModelText.innerHTML =
      "DeepGrow MRI liver/kidneys/spleen model loaded";
  })();
}

function selectDGProstateModel() {
  (async function() {
    selectedDGModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    deepGrowModel = await tf.loadLayersModel(
      "models/DGProstateModel/model.json"
    );
    deepGrowModel.name = "DGStandard";
    deepGrowModel.normalize = "standard";
    deepGrowModel.status = "none";
    deepGrowPreModel = false;
    selectedDGModelText.innerHTML = "DeepGrow MRI prostate model loaded";
  })();
}

function selectDGV2LymphNodes() {
  (async function() {
    selectedDGModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    deepGrowModel = await tf.loadLayersModel(
      "models/DGV2LymphNodeModel/model.json"
    );
    deepGrowModel.name = "DGV2LymphNodeModel";
    deepGrowModel.normalize = "standard";
    deepGrowModel.type = "DGV2";
    deepGrowModel.status = "first";
    deepGrowPreModel = await tf.loadLayersModel(
      "models/DGV2LymphNodePreModel/model.json"
    );
    deepGrowPreModel.premodel = true;
    selectedDGModelText.innerHTML = "DeepGrow v2 CT lymph node model loaded";
  })();
}

function selectDGV2CTLiverTumorModel() {
  (async function() {
    selectedDGModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    deepGrowModel = await tf.loadLayersModel(
      "models/DGCTLiverTumorGrowingModel/model.json"
    );
    deepGrowModel.name = "DGV2CTLiverTumorModel";
    deepGrowModel.normalize = "standard";
    deepGrowModel.type = "DGV2";
    deepGrowModel.status = "first";
    deepGrowPreModel = await tf.loadLayersModel(
      "models/DGCTLiverTumorPreModel/model.json"
    );
    deepGrowPreModel.premodel = true;
    selectedDGModelText.innerHTML = "DeepGrow v2 CT liver tumor model loaded";
  })();
}

function selectRoiPancreas() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/roiPancreas/model.json");
    selectedModel.name = "roi";
    selectedModelText.innerHTML = "ROI CT pancreas model loaded";
  })();
}

function selectRoiLiverLesions() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/roiLiverLesions/model.json"
    );
    selectedModel.name = "roi";
    selectedModelText.innerHTML = "ROI CT liver lesions model loaded";
  })();
}

function selectRoiNet() {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel("models/roiNet/model.json");
    selectedModel.name = "roi";
    selectedModelText.innerHTML = "ROI CT liver NET lesions model loaded";
  })();
}

function selectMRIVentriclesModel() {
  selectModel("MRI lateral ventricles model", "MRIVentricles", "MRIVentricles");
}

function selectModel(longName, name, folderName) {
  (async function() {
    selectedModelText.innerHTML =
      "Loading of model started, please wait for this text to update.";
    selectedModel = await tf.loadLayersModel(
      "models/" + folderName + "/model.json"
    );
    selectedModel.name = name;
    selectedModelText.innerHTML = longName + " loaded";
  })();
}

function addSecondChannelDG(ch0) {
  //function gets channel 0, which is the image
  //it then creates a new channel using DG.temp and sets it as channel 1

  var ch1 = new Float32Array(thectx.DG.temp);

  ch1 = arrayTransformAuto(ch1, thectx.rows, thectx.cols, false);

  ch1 = tf.tensor(ch1);
  ch1 = tf.reshape(ch1, [thectx.rows, thectx.cols]);
  ch1 = ch1.expandDims(2);

  if (!(ch1.shape[0] == 512 && ch1.shape[1] == 512)) {
    ch1 = tf.image.resizeBilinear(ch1, [512, 512]).toFloat();
  }

  ch1 = ch1.expandDims(0);
  var bothChannels = ch0.concat(ch1, 3);

  return bothChannels;
}

function prepareTensorsForSS(ch0, th, r) {
  //Can change thickness and ratio, but should add changing of:
  //threshold, sumType, mean, std (evt. MRI mean and std)

  //ch0 = current slice
  //ch1 = up
  //ch2 = down

  // 0 threshold ch0
  let ch1, ch2, threeChannels;

  ch0 = thresholdFunction(ch0, 500, -400);

  //1. get soft slice data
  softSlice.thickness = th;
  softSlice.ratio = r;
  softSlice.type = "up";
  softSlice.centerPoint = 0;
  softSlice.lThr = -400;
  softSlice.uThr = 500;
  softSlice.sumType = "mean";

  ch1 = softSlice.createOneSlice();
  softSlice.type = "down";
  ch2 = softSlice.createOneSlice();

  //2. run arrayTransformAuto (to fix rotation/mirroring, only on ss data)
  ch1 = arrayTransformAuto(ch1, thectx.rows, thectx.cols, false);
  ch2 = arrayTransformAuto(ch2, thectx.rows, thectx.cols, false);

  //3. reshape and extend last dimensions, like function below
  ch0 = new Float32Array(ch0);
  ch0 = tf.tensor(ch0);
  ch0 = tf.reshape(ch0, [thectx.rows, thectx.cols]);
  ch0 = ch0.expandDims(2);

  ch1 = tf.tensor(ch1);
  ch1 = tf.reshape(ch1, [thectx.rows, thectx.cols]);
  ch1 = ch1.expandDims(2);

  ch2 = tf.tensor(ch2);
  ch2 = tf.reshape(ch2, [thectx.rows, thectx.cols]);
  ch2 = ch2.expandDims(2);

  //resize if needed
  if (!(ch1.shape[0] == 512 && ch1.shape[1] == 512)) {
    ch0 = tf.image.resizeBilinear(ch0, [512, 512]).toFloat();
    ch1 = tf.image.resizeBilinear(ch1, [512, 512]).toFloat();
    ch2 = tf.image.resizeBilinear(ch2, [512, 512]).toFloat();
  }

  //extending first dimensions
  ch0 = ch0.expandDims(0);
  ch1 = ch1.expandDims(0);
  ch2 = ch2.expandDims(0);

  //7. put them together
  threeChannels = ch0.concat(ch1, 3);
  threeChannels = threeChannels.concat(ch2, 3);
  //8. mean and std normalization
  threeChannels = tf.sub(threeChannels, -196);
  threeChannels = tf.div(threeChannels, 250);
  //9. return threeChannels

  return threeChannels;
}

function addTwoChannelsSlices(ch1) {
  //gets current slice image data, which is placed in channel 1
  //channel 0 is lower slice, channel 2 is higher
  //Essentially 3 slices input to model - above, below and current
  //currently subtracts mean and divides by std

  let currentSlice = parseInt(thectx.slider.value);
  let sliceSize = thectx.sliceSize;
  let sliceOffset = sliceSize * currentSlice;
  //let k = selectedModel.neighborSlice
  let threeChannels, ch0, ch2;

  //create channel 0 and channel 2

  if (currentSlice > 0) {
    ch0 = new Float32Array(
      thectx.typedData.slice(sliceOffset - sliceSize, sliceOffset)
    );
    ch0 = arrayTransformAuto(ch0, thectx.rows, thectx.cols, false);
  } else {
    ch0 = new Float32Array(sliceSize);
  }

  if (currentSlice < parseInt(thectx.slider.max)) {
    ch2 = new Float32Array(
      thectx.typedData.slice(
        sliceOffset + sliceSize,
        sliceOffset + sliceSize * 2
      )
    );
    ch2 = arrayTransformAuto(ch2, thectx.rows, thectx.cols, false);
  } else {
    ch2 = new Float32Array(sliceSize);
  }

  ch0 = tf.tensor(ch0);
  ch0 = tf.reshape(ch0, [thectx.rows, thectx.cols]);
  ch0 = ch0.expandDims(2);

  ch1 = new Float32Array(ch1);
  ch1 = tf.tensor(ch1);
  ch1 = tf.reshape(ch1, [thectx.rows, thectx.cols]);
  ch1 = ch1.expandDims(2);

  ch2 = tf.tensor(ch2);
  ch2 = tf.reshape(ch2, [thectx.rows, thectx.cols]);
  ch2 = ch2.expandDims(2);

  //resize if needed
  if (!(ch1.shape[0] == 512 && ch1.shape[1] == 512)) {
    ch0 = tf.image.resizeBilinear(ch0, [512, 512]).toFloat();
    ch1 = tf.image.resizeBilinear(ch1, [512, 512]).toFloat();
    ch2 = tf.image.resizeBilinear(ch2, [512, 512]).toFloat();
  }

  //extending first dimensions
  ch0 = ch0.expandDims(0);
  ch1 = ch1.expandDims(0);
  ch2 = ch2.expandDims(0);

  //putting it all together
  threeChannels = ch0.concat(ch1, 3);
  threeChannels = threeChannels.concat(ch2, 3);

  //mean and std normalization
  let mean = threeChannels.mean();
  let std = tf.moments(threeChannels).variance.sqrt();

  threeChannels = tf.sub(threeChannels, mean);
  threeChannels = tf.div(threeChannels, std);

  return threeChannels;
}

function addTwoChannelsSlToSl(ch0) {
  //to find correct data
  var slice = thectx.slider.value;
  var sliceSize = thectx.sliceSize;
  var sliceOffset = sliceSize * slice;
  let k = selectedModel.neighborSlice;
  let threeChannels, ch1, ch2;

  //takes out the image to channel 1
  ch1 = new Float32Array(
    thectx.typedData.slice(
      sliceOffset + k * sliceSize,
      sliceOffset + sliceSize + k * sliceSize
    )
  );
  ch1 = arrayTransformAuto(ch1, thectx.rows, thectx.cols, false);

  //takes out the mask of current image to channel 2
  ch2 = new Float32Array(
    thectx.segData.slice(
      sliceOffset + k * sliceSize,
      sliceOffset + sliceSize + k * sliceSize
    )
  );

  //takes out only the current label
  let total = ch2.length;
  let currentLabel = thectx.labels.currentLabel;
  for (var i = 0; i < total; i++) {
    if (ch2[i] != 0) {
      if (ch2[i] == currentLabel) {
        ch2[i] = 1;
      } else {
        ch2[i] = 0;
      }
    }
  }
  ch2 = arrayTransformAuto(ch2, thectx.rows, thectx.cols, false);

  //reshaping and extending last dimensions
  ch0 = new Float32Array(ch0);
  ch0 = tf.tensor(ch0);
  ch0 = tf.reshape(ch0, [thectx.rows, thectx.cols]);
  ch0 = ch0.expandDims(2);

  ch1 = tf.tensor(ch1);
  ch1 = tf.reshape(ch1, [thectx.rows, thectx.cols]);
  ch1 = ch1.expandDims(2);

  ch2 = tf.tensor(ch2);
  ch2 = tf.reshape(ch2, [thectx.rows, thectx.cols]);
  ch2 = ch2.expandDims(2);

  //resize if needed
  if (!(ch1.shape[0] == 512 && ch1.shape[1] == 512)) {
    ch0 = tf.image.resizeBilinear(ch0, [512, 512]).toFloat();
    ch1 = tf.image.resizeBilinear(ch1, [512, 512]).toFloat();
    ch2 = tf.image.resizeBilinear(ch2, [512, 512]).toFloat();
  }

  //extending first dimensions
  ch0 = ch0.expandDims(0);
  ch1 = ch1.expandDims(0);
  ch2 = ch2.expandDims(0);

  //mean and std normalization
  var mean = ch0.mean();
  ch0 = tf.sub(ch0, mean);
  var std = tf.moments(ch0).variance.sqrt();
  ch0 = tf.div(ch0, std);
  var mean = ch1.mean();
  ch1 = tf.sub(ch1, mean);
  var std = tf.moments(ch1).variance.sqrt();
  ch1 = tf.div(ch1, std);

  //putting it all together
  threeChannels = ch0.concat(ch1, 3);
  threeChannels = threeChannels.concat(ch2, 3);

  return threeChannels;
}

async function predictCurrentSlice(
  model,
  norm = false,
  sync = true,
  DGActivated = false
) {
  DLRunning = true;

  //commented times spent on 1 DG prediction on my laptop
  let imageData = uns_ctx.getImageData(0, 0, thectx.cols, thectx.rows);
  let preProcessedImage = preprocess(imageData, (norm = norm));
  //5 ms

  if (DGActivated) {
    preProcessedImage = addSecondChannelDG(preProcessedImage);
    //~5ms
  }

  //runs always synchronous, seems better now
  modelPrediction = model
    .predict(preProcessedImage)
    .flatten()
    .dataSync();
  if (modelPrediction.length != thectx.sliceSize) {
    //exception for multilabel and roi
    if (selectedModel.type != "multilabel" && selectedModel.name != "roi") {
      modelPrediction = tf.tensor(modelPrediction);
      modelPrediction = modelPrediction.reshape([512, 512, 1]);

      //do different if rotated by 90 or 270 degrees
      if (rotationCSS == 0 || rotationCSS == 180) {
        modelPrediction = tf.image.resizeNearestNeighbor(modelPrediction, [
          thectx.rows,
          thectx.cols
        ]);
      } else {
        modelPrediction = tf.image.resizeNearestNeighbor(modelPrediction, [
          thectx.cols,
          thectx.rows
        ]);
      }
      modelPrediction = modelPrediction.flatten().dataSync();
    } else if (selectedModel.name == "roi") {
      //check that both roi positions are defined
      if (typeof roiPos1 != "undefined" && typeof roiPos2 != "undefined") {
        let rowDelta = Math.abs(roiPos1[0] - roiPos2[0]);
        let colDelta = Math.abs(roiPos1[1] - roiPos2[1]);

        modelPrediction = tf.tensor(modelPrediction);
        modelPrediction = modelPrediction.reshape([256, 256, 1]);
        modelPrediction = tf.image.resizeNearestNeighbor(modelPrediction, [
          rowDelta,
          colDelta
        ]);
        modelPrediction = modelPrediction.flatten().dataSync();
      }
      //do something
    }
  }

  if (model.premodel) {
    var total = 0;
    for (var i = 0; i < modelPrediction.length; i++) {
      total += modelPrediction[i];
    }
    sizeOfCircle = Math.sqrt(Math.sqrt(total)) - 1;
    if (sizeOfCircle < 0.5) {
      sizeOfCircle = 0.5;
    }
    DLRunning = false;

    //overriding drawingNow, else it would not draw as this function is
    //called from within draw.
    drawingNow = false;
    draw(vis_canvas, posx, posy);
  } else {
    finalizePrediction();
    setTimeout(function() {
      DLRunning = false;
    }, 0);
  }
}

function resetPointerSize() {
  if (!DGInitialized) {
    sizeOfCircle = 20;
    document.getElementById("pointerSizeText").value = 20;
    changePointerSize();
  }
}

var zoomingAct = false;
var resizingAct = false;
var refreshIntervalId;
var startTime;
var sizeOfCircle = document.getElementById("pointerSizeText").value;

var upperThreshold = 10000;
var lowerThreshold = -10000;
var thresholdActivated = document.getElementById("threshChBox").checked;
var interpolActive = document.getElementById("interpolChBox").checked;
var fluidPointActive = document.getElementById("fluidPointChBox").checked;
var pixelValShowAct = document.getElementById("pixelValChBox").checked;
let infoAdvShow = false;

var segVolumeShowAct = document.getElementById("segVolumeChBox").checked;

/* function changeFluidPointerAct(){
    fluidPointActive = document.getElementById("fluidPointChBox").checked;
    draw(vis_canvas, posx, posy);
} */
function changePixValAct() {
  pixelValShowAct = document.getElementById("pixelValChBox").checked;
  if (!pixelValShowAct) upperLeftInfoBar.innerHTML = " ";
  draw(vis_canvas, posx, posy);
}
function changeSegVolumeShow() {
  //pretty ugly...
  segVolumeShowAct = document.getElementById("segVolumeChBox").checked;
  if (segVolumeShowAct) {
    var upperLeftInfoBar = document.getElementById("upperLeftInfoBar");
    var volumeOneVoxel =
      thectx.niftiHeader["pixDims"][1] *
      thectx.niftiHeader["pixDims"][2] *
      thectx.niftiHeader["pixDims"][3];
    var sumpixels = 0;
    var total = thectx.segData.length;
    var segData = thectx.segData;
    for (var counter = 0; counter < total; counter++) {
      if (segData[counter] > 0) {
        sumpixels += 1;
      }
    }
    upperLeftInfoBar.innerHTML =
      "Сегментированные воксели = " +
      String(sumpixels) +
      " <br> Значение = " +
      String(Math.round(sumpixels * volumeOneVoxel) / 1000) +
      " ml";
  } else {
    var upperLeftInfoBar = document.getElementById("upperLeftInfoBar");
    upperLeftInfoBar.innerHTML = " ";
  }
  draw(vis_canvas, posx, posy);
}
function changeThresh() {
  thresholdActivated = document.getElementById("threshChBox").checked;
  lowerThreshold = parseFloat(document.getElementById("minThrText").value);
  upperThreshold = parseFloat(document.getElementById("maxThrText").value);

  let thresholdSettingsDiv = document.getElementById("thresholdSettingsDiv");
  if (thresholdActivated) {
    thresholdSettingsDiv.style.visibility = "visible";
  } else {
    thresholdSettingsDiv.style.visibility = "hidden";
  }
  changeThresholdSlider();
  requestAnimationFrame(simpleDraw);
}
function changePointerSize() {
  if (!DGInitialized || deepGrowModel.type == "DGV2") {
    let targetValue = document.getElementById("pointerSizeText").value;
    changePointerSizeFinal(targetValue);

    ///////calculate and set slider position:
    let minp = 0;
    let maxp = 100;
    // The result should be between 0.01 and 1000
    let minv = Math.log(0.1);
    let maxv = Math.log(1000);
    // calculate adjustment factor
    let scale = (maxv - minv) / (maxp - minp);
    let position = (Math.log(sizeOfCircle + 0.1) - minv) / scale + minp;
    let PSRSlider = document.getElementById("pointerSizeRange");
    PSRSlider.value = position;
    /////////////////////////////////////////

    requestAnimationFrame(simpleDraw);
  }
}
changePointerSize();

function changePointerSizeFinal(value) {
  //when sure to change to this final value.
  //does check if below 0 to make red.
  //in time, make this function good and preferrably the only one

  let text = document.getElementById("pointerSizeText");
  value = parseFloat(value);
  if (value < 0) {
    value = 0;
  }

  if (value == 0) {
    text.style.backgroundColor = "rgb(255,0,0)";
  } else {
    text.style.backgroundColor = "";
  }
  sizeOfCircle = value;
}

var predictionCanvasOpacity = 0.7;
document.querySelector("#pr_canvas").style.opacity = predictionCanvasOpacity;

var translateActivated = false;
var scaleValue = 1;
var translationX = 0;
var translationY = 0;
var rotationCSS = 0;

var intensBaseline = 0;
var intensDiv = 5;
var windowingActivated = false;
var historyPosx, historyPosy;
var posx = 40.5,
  posy = 40.5;

var drawActivated = false;
var eraseActivated = false;
let eraseAndDrawActivated = false;

var mouse_over_canvas = false;

var thectx = {
  labels: {
    currentLabel: 1,
    vis: {
      colormap: [1, 220, 255],
      opacity: parseInt(255 * 0.3)
    },
    dgPos: {
      colormap: [1, 100, 0],
      opacity: parseInt(255 * 0.3)
    },
    dgNeg: {
      colormap: [200, 1, 0],
      opacity: parseInt(255 * 0.3)
    },
    1: {
      colormap: [50, 80, 170],
      opacity: 255,
      locked: false
    }
  },

  memorySeg: new Uint8Array(512 * 512).fill(0),
  niftiHeader: { pixDims: [0, 1, 1, 1, 0] },
  startTime: Date.now(),
  segData: new Uint8Array(512 * 512).fill(0),
  slider: { value: parseInt(0) },
  typedData: new Uint8Array(512 * 512).fill(0),
  rows: 512,
  cols: 512,
  sliceSize: 512 * 512
};

var origMousePos = {};
//var temp_data;
var temp_nii_header;

var uns_canvas = document.getElementById("UnseenCanvas");
var uns_ctx = uns_canvas.getContext("2d");

var uns_canvas_thr = document.getElementById("UnseenCanvasThr");
var uns_ctx_thr = uns_canvas_thr.getContext("2d");

var uns_canvas_mask = document.getElementById("UnseenCanvasMask");
var uns_ctx_mask = uns_canvas_mask.getContext("2d");

var uns_canvas_vis = document.getElementById("UnseenCanvasVis");
var uns_ctx_vis = uns_canvas_vis.getContext("2d");

var bg_canvas = document.getElementById("bg_canvas");
var bg_ctx = bg_canvas.getContext("2d");

var pr_canvas = document.getElementById("pr_canvas");
var pr_ctx = pr_canvas.getContext("2d");

var vis_canvas = document.getElementById("vis_canvas");
var vis_ctx = vis_canvas.getContext("2d");

//changed following line from vis_canvas to document
document.addEventListener("contextmenu", evt => evt.preventDefault());

vis_canvas.addEventListener("mousedown", mouseDownFunction);
vis_canvas.addEventListener("touchstart", mouseDownFunction);

function mouseDownFunction(evt) {
  evt.preventDefault();
  mouse_over_canvas = true;

  if (quizMode) {
    let mousePos = getMousePos(vis_canvas, evt);
    posx = mousePos.x;
    posy = mousePos.y;
    quizGuess(posx, posy);
    return;
  }

  /*    if (evt.pointerType!="mouse"){
        //making it not draw line to new touch position
        mousePos = getMousePos(vis_canvas, evt)
        let posXLocal = mousePos["x"]/scaleValue - translationX;
        let posYLocal = mousePos["y"]/scaleValue - translationY;

        drawingLine.fromX = posXLocal
        drawingLine.fromY = posYLocal

        //if fill activated
        let buttonFillColor = document.getElementById("buttonFillColor")
        let fillstatus = buttonFillColor.innerText
        if (fillstatus=="Fill activated"){

            fillColorFromMousePos()
            drawCanvas(thectx)
            buttonFillColor.innerHTML="Activate fill"
            return
        }

    } */

  if (MPRActivated) {
    return;
  }

  if (evt.touches) {
    let mousePos = getMousePos(vis_canvas, evt);
    posx = mousePos.x;
    posy = mousePos.y;

    drawingLine.fromX = posx / scaleValue - translationX;
    drawingLine.fromY = posy / scaleValue - translationY;

    if (touchSetting == "paint") {
      evt.button = 0;
    } else if (touchSetting == "erase") {
      evt.button = 2;
    } else if (touchSetting == "windowing") {
      evt.button = 1;
    } else if (touchSetting == "zoom") {
      //cant override ctrlkey it seems, therefore exception lower down
      evt.button = 2;
    } else if (touchSetting == "move") {
      //cant override ctrlkey it seems, therefore exception lower down
      evt.button = 0;
    } else if (touchSetting == "fill") {
      //fills one time, then reverts to paint mode

      fillColorFromMousePos();
      requestAnimationFrame(simpleDrawCanvas);
      touchSetting = memoryTouchSetting;
    }
  }

  if (evt.button != 1 && thectx.memorySeg && !evt.ctrlKey && !drawActivated) {
    memorizeSlice();
  }

  if (
    (evt.button == 0 && evt.ctrlKey) ||
    (evt.touches && touchSetting == "move")
  ) {
    //move
    //vis_canvas.requestPointerLock()
    translateActivated = true;
    let mousePos = getMousePos(vis_canvas, evt);

    historyPosx = mousePos.x;
    historyPosy = mousePos.y;
  } else if ((evt.button == 0 || evt.button == 2) && drawActivated == true) {
    //first erase, then draw. This is relevant when thresholding is active
    eraseActivated = true;
    draw(vis_canvas, posx, posy);
    eraseActivated = false;
    draw(vis_canvas, posx, posy);
    eraseAndDrawActivated = true;
  } else if (evt.button == 0 && !evt.ctrlKey) {
    if (DGInitialized) {
      DGActivated = true;
      thectx.DG.positive = true;
      sizeOfCircle = 5 * (thectx.cols / 512);
    } else {
      drawActivated = true;
    }
    draw(vis_canvas, posx, posy);
  } else if (evt.button == 1) {
    if (!evt.touches) {
      vis_canvas.requestPointerLock();
    }

    windowingActivated = true;
    let mousePos = getMousePos(vis_canvas, evt);
    historyPosx = mousePos.rX;
    historyPosy = mousePos.rY;
  } else if (
    (evt.button == 2 && evt.ctrlKey) ||
    (evt.touches && touchSetting == "zoom")
  ) {
    //zoom
    if (!evt.touches) {
      vis_canvas.requestPointerLock();
    }
    zoomingAct = true;
    let mousePos = getMousePos(vis_canvas, evt);
    historyPosx = mousePos.rX;
    historyPosy = mousePos.rY;
    origMousePos["x"] = mousePos.rX;
    origMousePos["y"] = mousePos.rY;
  } else if (evt.button == 2 && !evt.ctrlKey) {
    //erase
    if (DGInitialized) {
      DGActivated = true;
      thectx.DG.positive = false;
    } else {
      eraseActivated = true;
      drawActivated = true;
    }
    draw(vis_canvas, posx, posy);
  }
}

vis_canvas.addEventListener("wheel", mouseWheel);

window.addEventListener("mouseup", mouseUpFunction);
vis_canvas.addEventListener("touchend", mouseUpFunction);

function mouseUpFunction(evt) {
  evt.preventDefault();
  if (!evt.touches) {
    document.exitPointerLock();
  }

  drawActivated = false;
  eraseActivated = false;
  eraseAndDrawActivated = false;
  windowingActivated = false;
  translateActivated = false;
  zoomingAct = false;

  if (DGInitialized && !evt.ctrlKey && mouse_over_canvas && evt.button != 1) {
    if (deepGrowModel.type == "DGV2") {
      setTimeout(function() {
        deepGrowModel.status = "first";
      }, 0);
    }

    setTimeout(function() {
      DGActivated = false;
      var slice = thectx.slider.value;
      var sliceSize = thectx.sliceSize;
      var sliceOffset = sliceSize * slice;
      for (var p = 0; p < sliceSize; p++) {
        thectx.DG.full[sliceOffset + p] = thectx.DG.temp[p];
      }
      thectx.DG.positive = true;
    }, 0);
  }
}

vis_canvas.addEventListener("mousemove", mouseMoves);
vis_canvas.addEventListener("touchmove", mouseMoves);

function mouseMoves(evt) {
  evt.preventDefault();
  mouse_over_canvas = true;

  if (MPRActivated) {
    return;
  }

  mousePos = getMousePos(vis_canvas, evt);
  posx = mousePos.x;
  posy = mousePos.y;

  if (translateActivated) {
    //var ratioSizesX = thectx.canvas.width/thectx.cols
    //var ratioSizesY = thectx.canvas.height/thectx.rows

    //var changeX = evt.movementX/ratioSizesX;
    //var changeY = evt.movementY/ratioSizesY;

    //translationX += changeX/scaleValue;
    //translationY += changeY/scaleValue;

    let changeX = mousePos.x - historyPosx;
    let changeY = mousePos.y - historyPosy;

    translationX += changeX / scaleValue;
    translationY += changeY / scaleValue;

    requestAnimationFrame(simpleDrawCanvas);
    historyPosx = mousePos.x;
    historyPosy = mousePos.y;
  } else if (windowingActivated) {
    let changeX = evt.movementX;
    let changeY = evt.movementY;

    if (evt.touches) {
      changeX = (mousePos.rX - historyPosx) * 15;
      changeY = (mousePos.rY - historyPosy) * 15;

      historyPosx = mousePos.rX;
      historyPosy = mousePos.rY;
    }

    let windowWidth = intensDiv * 255;
    let windowLevel = intensBaseline + windowWidth / 2;

    windowWidth += changeX * windowWidth * 0.0006;
    windowLevel -= changeY * 0.25;
    windowLevel -= (Math.abs(windowLevel) * changeY) / 1000;

    changeWindowing(windowWidth, windowLevel, true);
  } else if (zoomingAct) {
    let changeY = evt.movementY / 3;

    if (evt.touches) {
      changeY = (mousePos.rY - historyPosy) * 2;
      historyPosy = mousePos.rY;
    }

    let scaleValueOld = scaleValue;

    scaleValue *= 1 - changeY / 75;
    if (scaleValue < 0.1) {
      scaleValue = 0.1;
    }
    if (scaleValue > 1000) {
      scaleValue = 1000;
    }

    translationX -= origMousePos["x"] * (1 / scaleValueOld - 1 / scaleValue);
    translationY -= origMousePos["y"] * (1 / scaleValueOld - 1 / scaleValue);

    requestAnimationFrame(simpleDrawCanvas);
  } else if (!DLRunning) {
    requestAnimationFrame(simpleDraw);
  }
}

function simpleDraw() {
  draw(vis_canvas, posx, posy);
}
function simpleDrawCanvas() {
  drawCanvas(thectx);
}

window.addEventListener("mouseleave", mouseLeaves);

vis_canvas.addEventListener("mouseenter", function() {
  //removes line visualization when entering and stopping
  requestAnimationFrame(simpleDraw);
});

vis_canvas.addEventListener("mouseleave", function() {
  mouse_over_canvas = false;
  /*     posx=100
    posy=100
    requestAnimationFrame(simpleDraw) */
  //removes line visualization when leaving
  requestAnimationFrame(simpleDraw);
});

changingMaskOpacity = false;

modalVisible = false; //to not run keydown when modal is shown
window.addEventListener("keydown", function(evt) {
  if (mouse_over_canvas) {
    evt.preventDefault();
  }
  if (MPRActivated || modalVisible) {
    return;
  } else if (
    mouse_over_canvas &&
    thectx.keys.windowingOnOff.matchesEvent(evt)
  ) {
    windowingActivated = !windowingActivated;

    if (windowingActivated) {
      vis_canvas.requestPointerLock();
      windowingActivated = true;
      let mousePos = getMousePos(vis_canvas, evt);
      historyPosx = mousePos.rX;
      historyPosy = mousePos.rY;
    } else {
      windowingActivated = false;
      document.exitPointerLock();
    }
  } else if (mouse_over_canvas && thectx.keys.DeleteSlice.matchesEvent(evt)) {
    var slice = thectx.slider.value;
    var sliceSize = thectx.sliceSize;
    var sliceOffset = sliceSize * slice;

    try {
      for (var p = 0; p < sliceSize; p++) {
        var value = thectx.DG.full[sliceOffset + p];
        if (value != 0) {
          thectx.DG.full[sliceOffset + p] = 0;
        }
      }
    } catch {}

    for (var p = 0; p < sliceSize; p++) {
      var value = thectx.segData[sliceOffset + p];
      if (value != 0) {
        var segValueOfVoxel = thectx.segData[sliceOffset + p];
        if (segValueOfVoxel > 0) {
          var lockedStatus = thectx.labels[segValueOfVoxel].locked;
          if (!lockedStatus) {
            thectx.segData[sliceOffset + p] = 0;
          }
        }
      }
    }
    visualizeMaskData();
    draw(vis_canvas, posx, posy);
  } else if (evt.key == "old") {
    //historical stuff. Earlier "Enter"
    console.log(
      "If only Halldor could make it save correct for all types of niftis"
    );
  } else if (
    thectx.keys.increasePointerSize.matchesEvent(evt) &&
    (!DGInitialized || deepGrowModel.type == "DGV2")
  ) {
    evt.preventDefault();
    if (!resizingAct) {
      startTime = Date.now();
      resizingAct = true;

      if (!drawingNow) {
        requestAnimationFrame(resizingPointerAnimationGrow);
      }
    } else {
      return;
    }
  } else if (
    thectx.keys.decreasePointerSize.matchesEvent(evt) &&
    (!DGInitialized || deepGrowModel.type == "DGV2")
  ) {
    if (!resizingAct) {
      startTime = Date.now();
      resizingAct = true;
      if (!drawingNow) {
        requestAnimationFrame(resizingPointerAnimationShrink);
      }
    } else {
      return;
    }
  } else if (
    thectx.keys.previousLabelLock.matchesEvent(evt) ||
    thectx.keys.previousLabelNoLock.matchesEvent(evt)
  ) {
    var rememberLabel = thectx.labels.currentLabel;
    if (thectx.labels.currentLabel > 1) {
      activateOtherLabelDiv(thectx.labels.currentLabel - 1);
    }

    try {
      thectx.DG.full.fill(0);
    } catch {}
    if (thectx.keys.previousLabelLock.matchesEvent(evt)) {
      lockLabel(rememberLabel);
    }
    unlockLabel(thectx.labels.currentLabel);
    draw(vis_canvas, posx, posy);
  } else if (
    thectx.keys.nextLabelLock.matchesEvent(evt) ||
    thectx.keys.nextLabelNoLock.matchesEvent(evt)
  ) {
    var rememberLabel = thectx.labels.currentLabel;

    if (thectx.labels.currentLabel < checkBoxValueCounter - 1) {
      activateOtherLabelDiv(thectx.labels.currentLabel + 1);
    } else {
      try {
        buttonpress();
        activateOtherLabelDiv(checkBoxValueCounter - 1);
      } catch (err) {
        console.log(err);
      }
    }
    try {
      thectx.DG.full.fill(0);
    } catch {}
    if (thectx.keys.nextLabelLock.matchesEvent(evt)) {
      lockLabel(rememberLabel);
    }
    unlockLabel(thectx.labels.currentLabel);
    draw(vis_canvas, posx, posy);
  } else if (thectx.keys.Undo.matchesEvent(evt)) {
    let slice = parseInt(thectx.slider.value);
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice;

    //memorize current segmentation first (to fall back on on 2nd undo)
    let tempMemory = thectx.segData.slice(sliceOffset, sliceOffset + sliceSize);

    for (var p = 0; p < thectx.memorySeg.length; p += 1) {
      thectx.segData[sliceOffset + p] = thectx.memorySeg[p];
    }
    thectx.memorySeg = tempMemory;

    drawCanvas(thectx);
  } else if (evt.key == "no longer used") {
    //replaced by button in settings. Previously "n"
    saveLabels();
  } else if (thectx.keys.openGDrive.matchesEvent(evt)) {
    googleAPILoadType = "load";
    loadPicker();
  } else if (thectx.keys.openFolder.matchesEvent(evt)) {
    let seriesUID = prompt("Series UID?");
    let imagePath = "./database/" + seriesUID + "/img.nii.gz";
    let maskPath = "./database/" + seriesUID + "/msk.nii.gz";
    loadDemo(imagePath);

    hasLoadedNifti = false;
    function waitForLoad(func) {
      setTimeout(() => {
        if (hasLoadedNifti) {
          func();
        } else {
          waitForLoad(func);
        }
      }, 10);
    }
    waitForLoad(function() {
      loadDemo(maskPath, (knownMask = true));
    });

    loadDemo(maskPath, true);
  } else if (thectx.keys.uploadGDrive.matchesEvent(evt)) {
    googleAPILoadType = "upload";
    loadPicker();
  } else if (thectx.keys.showHideMask.matchesEvent(evt)) {
    var currentCanvasOpacity = document.querySelector("#pr_canvas").style
      .opacity;
    if (currentCanvasOpacity > 0) {
      predictionCanvasOpacity = currentCanvasOpacity;
      changeMaskOpacity(0);
    } else {
      changeMaskOpacity(predictionCanvasOpacity);
    }
  } else if (thectx.keys.dontSegmentZero.matchesEvent(evt)) {
    document.getElementById("dontSegmentZeroChBox").click();
  } else if (thectx.keys.increaseMaskOpacity.matchesEvent(evt)) {
    if (!changingMaskOpacity) {
      changingMaskOpacity = true;
      changeMaskOpacityLoop("increaseMaskOpacity");
    } else {
      return;
    }

    /*         let x = parseFloat(document.querySelector("#pr_canvas").style.opacity);
        x += 0.1;
        if (x > 1) { x = 1; }
        changeMaskOpacity(x) */
  } else if (thectx.keys.increasePointerOpacity.matchesEvent(evt)) {
    if (!changingMaskOpacity) {
      changingMaskOpacity = true;
      changeMaskOpacityLoop("increasePointerOpacity");
    } else {
      return;
    }

    /* let x
        if (DGInitialized){
            x = parseFloat(thectx.labels.dgPos.opacity/255)
            x += 0.1;
            if (x > 1) { x = 1; }
            thectx.labels.dgPos.opacity = parseInt(x*255);
            thectx.labels.dgNeg.opacity = parseInt(x*255);
        }
        else{
            x = parseFloat(thectx.labels.vis.opacity/255)
            x += 0.1;
            if (x > 1) { x = 1; }
            thectx.labels.vis.opacity = parseInt(x*255);
        }
        changePointerOpacity(x) */
  } else if (thectx.keys.decreaseMaskOpacity.matchesEvent(evt)) {
    if (!changingMaskOpacity) {
      changingMaskOpacity = true;
      changeMaskOpacityLoop("decreaseMaskOpacity");
    } else {
      return;
    }
    /*         var x = parseFloat(document.querySelector("#pr_canvas").style.opacity)
        x -= 0.1;
        if (x < 0) { x = 0; }

        changeMaskOpacity(x) */
  } else if (thectx.keys.decreasePointerOpacity.matchesEvent(evt)) {
    if (!changingMaskOpacity) {
      changingMaskOpacity = true;
      changeMaskOpacityLoop("decreasePointerOpacity");
    } else {
      return;
    }
    /* let x
        if (DGInitialized){
            x = parseFloat(thectx.labels.dgPos.opacity/255)
            x -= 0.1;
            if (x < 0) { x = 0; }
            thectx.labels.dgPos.opacity = parseInt(x*255);
            thectx.labels.dgNeg.opacity = parseInt(x*255);
        }
        else{
            x = parseFloat(thectx.labels.vis.opacity/255)
            x -= 0.1;
            if (x < 0) { x = 0; }
            thectx.labels.vis.opacity = parseInt(x*255);
        }
        changePointerOpacity(x) */
  } else if (thectx.keys.resetView.matchesEvent(evt)) {
    /*         if (evt.ctrlKey){

            var slice = thectx.slider.value;
            var sliceSize = thectx.sliceSize;
            var sliceOffset = sliceSize * slice;
            var thisslice = thectx.typedData.slice(sliceOffset,sliceOffset+sliceSize)

            initIntensityOnFirstLoad(thisslice);

            mirrorActivated = false
            rotationCSS = 0
            changeCSSTransform()
        } */

    translationX = 0;
    translationY = 0;
    scaleValue = 1;
    drawCanvas(thectx);
    //to not have the long tail drag of pointer, draw two times
    drawCanvas(thectx);
  } else if (thectx.keys.fullResetView.matchesEvent(evt)) {
    var slice = thectx.slider.value;
    var sliceSize = thectx.sliceSize;
    var sliceOffset = sliceSize * slice;
    var thisslice = thectx.typedData.slice(
      sliceOffset,
      sliceOffset + sliceSize
    );
    initIntensityOnFirstLoad(thisslice);
    mirrorActivated = false;
    rotationCSS = 0;
    changeCSSTransform();
    translationX = 0;
    translationY = 0;
    scaleValue = 1;
    drawCanvas(thectx);
    //to not have the long tail drag of pointer, we draw two times
    drawCanvas(thectx);
  } else if (evt.key == "not used") {
    //previously "v", replaced by Calc. volumes button
    var sumpixels = 0;
    var volumeOneVoxel =
      thectx.niftiHeader["pixDims"][1] *
      thectx.niftiHeader["pixDims"][2] *
      thectx.niftiHeader["pixDims"][3];
    var sumpixels = 0;
    var total = thectx.segData.length;
    var segData = thectx.segData;
    for (var counter = 0; counter < total; counter++) {
      if (segData[counter] > 0) {
        sumpixels += 1;
      }
    }

    console.log("segmented voxels = " + String(sumpixels));
    console.log(
      "volume = " +
        String(Math.round(sumpixels * volumeOneVoxel) / 1000) +
        " ml"
    );
  } else if (thectx.keys.ThresholdingOnOff.matchesEvent(evt)) {
    thresholdActivated = !thresholdActivated;
    document.getElementById("threshChBox").checked = thresholdActivated;
    if (thresholdActivated) {
      document.getElementById("thresholdSettingsDiv").style.visibility =
        "visible";
    } else {
      document.getElementById("thresholdSettingsDiv").style.visibility =
        "hidden";
    }
    requestAnimationFrame(simpleDraw);
  } else if (thectx.keys.axialPlane.matchesEvent(evt)) {
    evt.preventDefault();
    translationX = 0;
    translationY = 0;
    scaleValue = 1;
    thectx.rotRowAxisShow(0);
  } else if (thectx.keys.coronalPlane.matchesEvent(evt)) {
    evt.preventDefault();
    if (initialized) {
      translationX = 0;
      translationY = 0;
      scaleValue = 1;
      thectx.rotRowAxisShow(1);
    }
  } else if (thectx.keys.sagittalPlane.matchesEvent(evt)) {
    evt.preventDefault();
    if (initialized) {
      translationX = 0;
      translationY = 0;
      scaleValue = 1;
      thectx.rotRowAxisShow(2);
    }
  } else if (evt.key == "not used anymore") {
    //previously "T"
    let unseenRoi = uns_ctx_vis.getImageData(0, 0, thectx.cols, thectx.rows);
    let slice = thectx.slider.value;
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice;

    //var x = Math.floor(posx/scaleValue - translationX);
    //var y = Math.floor(posy/scaleValue - translationY);
    //var centerValue = thectx.typedData[sliceOffset + y*thectx.cols + x]

    let array = [];

    for (let p = 0; p < unseenRoi.data.length; p += 4) {
      if (unseenRoi.data[p + 3] > 0) {
        array.push(thectx.typedData[sliceOffset + p / 4]);
      }
    }

    let minAndMax = minMaxArray(array);
    let min = minAndMax[0];
    let max = minAndMax[1];

    lowerThreshold = min;
    upperThreshold = max;
    thresholdActivated = true;

    minThrText.value = lowerThreshold;
    maxThrText.value = upperThreshold;

    document.getElementById("threshChBox").checked = true;

    document.getElementById("thresholdSettingsDiv").style.visibility =
      "visible";
    changeThresholdSlider();
    requestAnimationFrame(simpleDrawCanvas);
  } else if (thectx.keys.pointerInfo.matchesEvent(evt)) {
    roiAreaAnalysis();
  } else if (
    mouse_over_canvas &&
    thectx.keys.ThresholdingSetMin.matchesEvent(evt)
  ) {
    var unseenRoi = uns_ctx_vis.getImageData(0, 0, thectx.cols, thectx.rows);
    var slice = thectx.slider.value;
    var sliceSize = thectx.sliceSize;
    var sliceOffset = sliceSize * slice;

    var array = [];
    for (var p = 0; p < unseenRoi.data.length; p += 4) {
      if (unseenRoi.data[p + 3] > 0) {
        array.push(thectx.typedData[sliceOffset + p / 4]);
      }
    }
    var avergageValue = meanOfArray(array);

    lowerThreshold = avergageValue;
    thresholdActivated = true;
    document.getElementById("threshChBox").checked = true;
    //console.log("Lower threshold set to " + lowerThreshold)
    minThrText.value = lowerThreshold;

    document.getElementById("thresholdSettingsDiv").style.visibility =
      "visible";
    changeThresholdSlider();
    requestAnimationFrame(simpleDraw);
  } else if (
    mouse_over_canvas &&
    thectx.keys.ThresholdingSetMax.matchesEvent(evt)
  ) {
    var unseenRoi = uns_ctx_vis.getImageData(0, 0, thectx.cols, thectx.rows);
    var slice = thectx.slider.value;
    var sliceSize = thectx.sliceSize;
    var sliceOffset = sliceSize * slice;

    var array = [];
    for (var p = 0; p < unseenRoi.data.length; p += 4) {
      if (unseenRoi.data[p + 3] > 0) {
        array.push(thectx.typedData[sliceOffset + p / 4]);
      }
    }
    var avergageValue = meanOfArray(array);

    upperThreshold = avergageValue;
    thresholdActivated = true;
    document.getElementById("threshChBox").checked = true;
    //console.log("Upper threshold set to " + upperThreshold)
    maxThrText.value = upperThreshold;

    document.getElementById("thresholdSettingsDiv").style.visibility =
      "visible";
    changeThresholdSlider();
    requestAnimationFrame(simpleDraw);
  } else if (thectx.keys.predictSlice.matchesEvent(evt)) {
    if (selectedModel.name != "none") {
      if (thectx.memorySeg) {
        memorizeSlice();
      }
      selectedModel.neighborSlice = 0;
      tf.tidy(() => {
        predictCurrentSlice(selectedModel, windowedImageDataPredicting);
      });
      drawCanvas(thectx);
    } else {
      alert(
        "Error, no model loaded. To predict a slice, you must first load a 2D model"
      );
      return;
    }
  } else if (thectx.keys.predictAllSlices.matchesEvent(evt)) {
    //predict all slices
    if (selectedModel.name != "none") {
      let a;
      for (
        let i = 0, p = Promise.resolve();
        i <= parseInt(thectx.slider.max);
        i += 1
      ) {
        a = parseInt(thectx.slider.max);
        p = p.then(
          _ =>
            new Promise(resolve =>
              setTimeout(function() {
                thectx.slider.value = a;
                upperLeftInfoBar.innerHTML =
                  "Segmenting. " + String(a) + " slices left";
                tf.tidy(() => {
                  predictCurrentSlice(
                    selectedModel,
                    windowedImageDataPredicting,
                    (sync = true)
                  );
                });
                drawCanvas(thectx);
                a--;
                if (a < 0) {
                  upperLeftInfoBar.innerHTML = " ";
                }
                resolve();
              }, 0)
            )
        );
        upperLeftInfoBar.innerHTML = " ";
        //drawCanvas(thectx);
        //tf.tidy(() => {predictCurrentSlice(selectedModel, windowedImageDataPredicting, sync=true)});
      }
    } else {
      alert(
        "Ошибка, модель не загружена. Чтобы предсказать все срезы, вы должны сначала загрузить 2D-модель"
      );
    }
  } else if (thectx.keys.predictSliceBelow.matchesEvent(evt)) {
    if (selectedModel.name != "none") {
      //predict slice below
      if (thectx.slider.value > 0) {
        thectx.slider.value = parseInt(thectx.slider.value) - 1;
        drawCanvas(thectx);
        selectedModel.neighborSlice = 1;
        tf.tidy(() => {
          predictCurrentSlice(
            selectedModel,
            windowedImageDataPredicting,
            (sync = true)
          );
        });
      }
    }
  } else if (thectx.keys.predictSliceAbove.matchesEvent(evt)) {
    if (selectedModel.name != "none") {
      //predict slice above
      if (thectx.slider.value < parseInt(thectx.slider.max)) {
        thectx.slider.value = parseInt(thectx.slider.value) + 1;
        drawCanvas(thectx);
        selectedModel.neighborSlice = -1;
        tf.tidy(() => {
          predictCurrentSlice(
            selectedModel,
            windowedImageDataPredicting,
            (sync = true)
          );
        });
      }
    }
  } else if (thectx.keys.deepGrowOnOff.matchesEvent(evt)) {
    if (deepGrowModel.name != "none") {
      DGInitialized = !DGInitialized;
      if (!DGInitialized) {
        sizeOfCircle = parseFloat(histryPointerSize);
        document.getElementById("pointerSizeText").value = sizeOfCircle.toFixed(
          2
        );

        setTimeout(function() {
          DGActivated = false;
          DGInitialized = false;
          draw(vis_canvas, posx, posy);
        }, 0);
      } else {
        histryPointerSize = sizeOfCircle;
        sizeOfCircle = 5 * (thectx.cols / 512);
        document.getElementById("pointerSizeText").value = sizeOfCircle.toFixed(
          2
        );
        draw(vis_canvas, posx, posy);
      }
    } else {
      alert("You must load a DeepGrow model first");
    }
  } else if (
    mouse_over_canvas &&
    thectx.keys.CTMediastinumWindowing.matchesEvent(evt)
  ) {
    //mediastinum
    let windowWidth = 350;
    let windowLevel = 60;

    changeWindowing(windowWidth, windowLevel, true);
  } else if (
    mouse_over_canvas &&
    thectx.keys.CTBrainWindowing.matchesEvent(evt)
  ) {
    //brain
    let windowWidth = 80;
    let windowLevel = 40;

    changeWindowing(windowWidth, windowLevel, true);
  } else if (
    mouse_over_canvas &&
    thectx.keys.CTLungsWindowing.matchesEvent(evt)
  ) {
    //lungs
    let windowWidth = 1500;
    let windowLevel = -450;

    changeWindowing(windowWidth, windowLevel, true);
  } else if (
    mouse_over_canvas &&
    thectx.keys.CTSoftTissueWindowing.matchesEvent(evt)
  ) {
    //soft tissue
    let windowWidth = 450;
    let windowLevel = 50;

    changeWindowing(windowWidth, windowLevel, true);
  } else if (
    mouse_over_canvas &&
    thectx.keys.CTBoneWindowing.matchesEvent(evt)
  ) {
    //bones
    let windowWidth = 2000;
    let windowLevel = 350;

    changeWindowing(windowWidth, windowLevel, true);
  } else if (
    mouse_over_canvas &&
    thectx.keys.sliceWindowing.matchesEvent(evt)
  ) {
    //normalize to slice
    let slice = thectx.slider.value;
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice;

    let thisslice = thectx.typedData.slice(
      sliceOffset,
      sliceOffset + sliceSize
    );

    initIntensityOnFirstLoad(thisslice);
    drawCanvas(thectx);
  } else if (
    mouse_over_canvas &&
    thectx.keys.pointerWindowing.matchesEvent(evt)
  ) {
    //normalize to pointer
    let unseenRoi = uns_ctx_vis.getImageData(0, 0, thectx.cols, thectx.rows);
    let slice = thectx.slider.value;
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice;

    //let x = Math.floor(posx / scaleValue - translationX);
    //let y = Math.floor(posy / scaleValue - translationY);
    //var centerValue = thectx.typedData[sliceOffset + y*thectx.cols + x]

    let array = [];

    for (let p = 0; p < unseenRoi.data.length; p += 4) {
      if (unseenRoi.data[p + 3] > 0) {
        array.push(thectx.typedData[sliceOffset + p / 4]);
      }
    }

    let min, max;
    [min, max] = minMaxArray(array);

    changeWindowing(min, max);
  } else if (thectx.keys.sliceUp.matchesEvent(evt)) {
    var slice = parseInt(thectx.slider.value);
    slice += 1;
    if (slice >= 0 && slice <= thectx.slider.max) {
      thectx.slider.value = parseInt(slice);
      drawCanvas(thectx);
    }
  } else if (thectx.keys.sliceDown.matchesEvent(evt)) {
    var slice = parseInt(thectx.slider.value);
    slice -= 1;
    if (slice >= 0 && slice <= thectx.slider.max) {
      thectx.slider.value = parseInt(slice);
      drawCanvas(thectx);
    }
  } else if (thectx.keys.f1Info.matchesEvent(evt)) {
    evt.preventDefault();

    infoAdvShow = !infoAdvShow;

    if (!infoAdvShow) {
      upperLeftInfoBar.innerHTML = "";
    }

    requestAnimationFrame(simpleDraw);

    //if starts with #, then make zero
    //else display rows, cols, max slices, distance in x, y, z,
    //volume per voxel. Total voxels. Max val, min val.
    /* let pixDim1 = thectx.niftiHeader["pixDims"][1].toFixed(3)
        let pixDim2 = thectx.niftiHeader["pixDims"][2].toFixed(3)
        let pixDim3 = thectx.niftiHeader["pixDims"][3].toFixed(3)

        let windowWidth = intensDiv*255
        let windowLevel = intensBaseline+(windowWidth/2)

        if (upperLeftInfoBar.innerHTML[0]!="#"){
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
        }
        else{
            upperLeftInfoBar.innerHTML=" "
        } */
  } else if (!evt.shiftKey && (evt.key == "*" || evt.keyCode == 106)) {
    memorizeSlice();

    var slice = parseInt(thectx.slider.value);
    var sliceSize = thectx.sliceSize;
    var sliceOffset = sliceSize * slice;
    var sliceMask = thectx.segData.slice(sliceOffset, sliceOffset + sliceSize);

    let posX = posx / scaleValue - translationX;
    let posY = posy / scaleValue - translationY;

    var island = island2DFunction(
      sliceMask,
      posX,
      posY,
      thectx.rows,
      thectx.cols
    );

    console.log(island);

    segmValue = thectx.labels.currentLabel;

    //makes sure to not delete locked
    for (var p = 0; p < island.length; p += 1) {
      if (island[p] > 0) {
        var segValueOfVoxel = thectx.segData[sliceOffset + p];
        if (segValueOfVoxel > 0) {
          var lockedStatus = thectx.labels[segValueOfVoxel].locked;
          if (!lockedStatus) {
            thectx.segData[sliceOffset + p] = segmValue;
          }
        } else {
          thectx.segData[sliceOffset + p] = segmValue;
        }
      }

      //here deletion occurs
      else if (sliceMask[p] > 0) {
        var segValueOfVoxel = thectx.segData[sliceOffset + p];
        var lockedStatus = thectx.labels[segValueOfVoxel].locked;

        //if same value as current label and unlocked, then delete
        if (!lockedStatus && segmValue == segValueOfVoxel) {
          thectx.segData[sliceOffset + p] = 0;
        }
      }
      //this seems to never be relevant
      //else{
      //    thectx.segData[sliceOffset+p] = 0
      //}
    }
    drawCanvas(thectx);
  } else if (thectx.keys.liversplit.matchesEvent(evt)) {
    let posX = posx / scaleValue - translationX;
    let posY = posy / scaleValue - translationY;

    if (subSegmentation.mode == 1) {
      if (!subSegmentation.activated) {
        subSegmentation.activated = true;
        subSegmentation.pos["1"] = [posX, posY];
      } else {
        subSegmentation.activated = false;
        subSegmentation.pos["2"] = [posX, posY];
        subSegmentation.mode = 2;
        subsegment(1, 2);
      }
    } else if (subSegmentation.mode == 2) {
      if (!subSegmentation.activated) {
        subSegmentation.activated = true;
        subSegmentation.pos["1"] = [posX, posY];
      } else {
        subSegmentation.activated = false;
        subSegmentation.pos["2"] = [posX, posY];
        subSegmentation.mode = 1;
        subsegment(2, 3);
      }
    }
  } else if (evt.shiftKey && (evt.key == "*" || evt.keyCode == 106)) {
    //removes the island pointed on

    var slice = parseInt(thectx.slider.value);

    let posX = posx / scaleValue - translationX;
    let posY = posy / scaleValue - translationY;

    var island = island3DFunction(
      thectx.segData,
      posX,
      posY,
      slice,
      thectx.rows,
      thectx.cols
    );

    segmValue = thectx.labels.currentLabel;

    //makes sure to not delete locked
    for (var p = 0; p < island.length; p += 1) {
      if (island[p] > 0) {
        var segValueOfVoxel = thectx.segData[p];
        if (segValueOfVoxel > 0) {
          var lockedStatus = thectx.labels[segValueOfVoxel].locked;
          if (!lockedStatus) {
            thectx.segData[p] = segmValue;
          }
        } else {
          thectx.segData[p] = segmValue;
        }
      }

      //here deletion occurs
      else if (thectx.segData[p] > 0) {
        var segValueOfVoxel = thectx.segData[p];
        var lockedStatus = thectx.labels[segValueOfVoxel].locked;

        //if same value as current label and unlocked, then delete
        if (!lockedStatus && segmValue == segValueOfVoxel) {
          thectx.segData[p] = 0;
        }
      }
      //this seems to never be relevant
      //else{
      //    thectx.segData[sliceOffset+p] = 0
      //}
    }
    drawCanvas(thectx);
  } else if (
    evt.key == thectx.keys.fill2D.activationKey &&
    evt.ctrlKey == thectx.keys.fill2D.activationCtrl
  ) {
    /*     else if (evt.key == "," && !evt.ctrlKey){
        let posX = Math.round(posx/scaleValue - translationX);
        let posY = Math.round(posy/scaleValue - translationY);

        console.log(posX, posY)

        roiPos1 = [posY, posX]
    } */

    /*     else if (evt.key == "." && !evt.ctrlKey){
        let posX = Math.round(posx/scaleValue - translationX);
        let posY = Math.round(posy/scaleValue - translationY);

        roiPos2 = [posY, posX]
    } */

    /*     else if (evt.key == "," && evt.ctrlKey){

        let posX = Math.round(posx/scaleValue - translationX);
        let posY = Math.round(posy/scaleValue - translationY);


        let oldCenterX = Math.round((roiPos2[1]-roiPos1[1])/2)
        let oldCenterY = Math.round((roiPos2[0]-roiPos1[0])/2)

        
        roiPos1 = [posY-oldCenterY, posX-oldCenterX]
        roiPos2 = [posY+oldCenterY, posX+oldCenterX]

        if (selectedModel.name!="none"){
            if (thectx.memorySeg){
                memorizeSlice()
            }
            selectedModel.neighborSlice=0
            tf.tidy(() => {predictCurrentSlice(selectedModel, windowedImageDataPredicting)});
            drawCanvas(thectx);
        }
    } */
    //2D fill
    fillColorFromMousePos();
    visualizeMaskData();
    requestAnimationFrame(simpleDraw);
  } else if (evt.key == "<" && evt.ctrlKey) {
    //2D fill all islands except background (bg is island from pos 0,0)
    //ignores thresholdings
    thectx.fillAllIslands();
  } else if (
    evt.key == thectx.keys.fill3D.activationKey &&
    evt.ctrlKey == thectx.keys.fill3D.activationCtrl
  ) {
    //3D fill

    let sl = parseInt(thectx.slider.value);
    let posX = posx / scaleValue - translationX;
    let posY = posy / scaleValue - translationY;
    let segmValue = thectx.labels.currentLabel;

    let island = island3DFromPointV2(
      thectx.typedData,
      thectx.segData,
      posX,
      posY,
      sl,
      thectx.rows,
      thectx.cols
    );

    for (let p = 0; p < island.length; p += 1) {
      if (island[p] > 0) {
        thectx.segData[p] = segmValue;
      }
    }

    visualizeMaskData();
    requestAnimationFrame(simpleDraw);
  } else if (thectx.keys.ruler.matchesEvent(evt)) {
    //ææææææææ

    let posX = posx / scaleValue - translationX;
    let posY = posy / scaleValue - translationY;

    if (globalCaliperVals.activated) {
      globalCaliperVals.activated = false;
      visualizeMaskData();
      requestAnimationFrame(simpleDraw);
      upperLeftInfoBar.innerHTML = "";
    } else {
      globalCaliperVals.activated = true;
      globalCaliperVals.fromRow = posY;
      globalCaliperVals.fromCol = posX;
      visualizeMaskData();
      requestAnimationFrame(simpleDraw);
    }
  } else if (thectx.keys.roiRectangle.matchesEvent(evt)) {
    let posX = Math.round(posx / scaleValue - translationX);
    let posY = Math.round(posy / scaleValue - translationY);

    if (!globalCaliperVals.activated) {
      roiPos1 = [posY, posX];
      globalCaliperVals.activated = true;
      globalCaliperVals.roi = true;
      globalCaliperVals.fromRow = posY;
      globalCaliperVals.fromCol = posX;
      visualizeMaskData();
      requestAnimationFrame(simpleDraw);
    } else {
      roiPos2 = [posY, posX];
      globalCaliperVals.activated = false;
      delete globalCaliperVals.roi;
      visualizeMaskData();
      requestAnimationFrame(simpleDraw);
      if (selectedModel.name != "none") {
        if (thectx.memorySeg) {
          memorizeSlice();
        }
        selectedModel.neighborSlice = 0;
        tf.tidy(() => {
          predictCurrentSlice(selectedModel, windowedImageDataPredicting);
        });
        drawCanvas(thectx);
      }
    }
  } else if (thectx.keys.errorSegPoint.matchesEvent(evt)) {
    //run errorSeg

    let posX = Math.round(posx / scaleValue - translationX);
    let posY = Math.round(posy / scaleValue - translationY);

    errorSeg((mouseCol = posY), (mouseRow = posX));
  }
  //console.log(evt.key, evt.keyCode, evt.shiftKey)
});

document.addEventListener("keyup", function(evt) {
  if (thectx.keys.increasePointerSize.matchesEvent(evt, (keyup = true))) {
    clearInterval(refreshIntervalId);
    resizingAct = false;
    requestAnimationFrame(simpleDraw);
    /*         if (!drawingNow && !MPRActivated){
            draw(vis_canvas, posx, posy)
        } */
  }
  if (thectx.keys.decreasePointerSize.matchesEvent(evt, (keyup = true))) {
    clearInterval(refreshIntervalId);
    resizingAct = false;
    requestAnimationFrame(simpleDraw);
    /*         if (!drawingNow && !MPRActivated){
            draw(vis_canvas, posx, posy)
        } */
  }
  if (
    thectx.keys.increaseMaskOpacity.matchesEvent(evt, (keyup = true)) ||
    thectx.keys.decreaseMaskOpacity.matchesEvent(evt, (keyup = true)) ||
    thectx.keys.increasePointerOpacity.matchesEvent(evt, (keyup = true)) ||
    thectx.keys.decreasePointerOpacity.matchesEvent(evt, (keyup = true))
  ) {
    clearInterval(refreshIntervalId);
    changingMaskOpacity = false;
    /*         if (!drawingNow && !MPRActivated){
            draw(vis_canvas, posx, posy)
        } */
  }
});

function mouseWheel(evt) {
  evt.preventDefault();
  if (MPRActivated) {
    return;
  }
  if (!evt.ctrlKey) {
    var x = parseInt(evt.deltaY);
    var slice = parseInt(thectx.slider.value);
    if (!DLRunning) {
      if (x < 0) {
        slice += 1;
      } else if (x > 0) {
        slice -= 1;
      }
      if (slice >= 0 && slice <= thectx.slider.max) {
        thectx.slider.value = slice;
        drawCanvas(thectx);
      }
    }
  }

  if (evt.ctrlKey) {
    var x = parseInt(evt.deltaY);
    var scaleValueOld = scaleValue;

    if (x < 0) {
      scaleValue *= 1.2;
      if (scaleValue > 1000) {
        scaleValue = 1000;
      }
    } else {
      scaleValue /= 1.2;
      if (scaleValue < 0.1) {
        scaleValue = 0.1;
      }
    }

    var mousePos = getMousePos(vis_canvas, evt);
    posx = mousePos.x;
    posy = mousePos.y;
    translationX -= posx * (1 / scaleValueOld - 1 / scaleValue);
    translationY -= posy * (1 / scaleValueOld - 1 / scaleValue);
    drawCanvas(thectx);
  }
}

function exportMask(ctx) {
  thectx.rotRowAxisShow(0);
  for (var p = 0; p < thectx.segData.length; p++) {
    ctx.maskData[p] = ctx.segData[p];
  }
  ctx.maskImage = ctx.maskData.buffer;
}

var saveAsGZ = false;

function saveImage() {
  thectx.rotRowAxisShow(0);
  let a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";

  let data = [
    new Uint8Array(temp_nii_header, 0, temp_nii_header.length),
    new Uint8Array(thectx.niftiImage, 0, thectx.niftiImage.length)
  ];
  let fileName = thectx.fileName + ".nii";

  let blob;

  if (saveAsGZ) {
    let a2 = new Uint8Array(data[0]);
    let b = new Uint8Array(data[1]);
    let c = new Uint8Array(a2.length + b.length);
    c.set(a2);
    c.set(b, a2.length);
    c = nifti.compress(c);
    blob = new Blob([c]);
    fileName += ".gz";
  } else {
    blob = new Blob(data);
  }

  let url = window.URL.createObjectURL(blob);

  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

function save_nifti(ctx) {
  var saveData = (function() {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function(data, fileName) {
      let blob;

      if (saveAsGZ) {
        var a2 = new Uint8Array(data[0]);
        var b = new Uint8Array(data[1]);
        var c = new Uint8Array(a2.length + b.length);
        c.set(a2);
        c.set(b, a2.length);
        c = nifti.compress(c);
        blob = new Blob([c]);
        fileName += ".gz";
      } else {
        blob = new Blob(data);
      }

      var url = window.URL.createObjectURL(blob);

      a.href = url;
      a.download = fileName;

      a.click();
      window.URL.revokeObjectURL(url);
    };
  })();

  var data = [
    new Uint8Array(temp_nii_header, 0, temp_nii_header.length),
    new Uint8Array(ctx.maskImage, 0, ctx.maskImage.length)
  ];

  fileName = "mask" + thectx.fileName + ".nii";

  saveData(data, fileName);
}

function saveLabels() {
  let saveData = (function() {
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function(data, fileName) {
      let url = window.URL.createObjectURL(data);

      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    };
  })();

  let fullText = String();
  fullText += "MedSeg config file. Use it by dragging it into MedSeg.\n\n";
  fullText += "Mask value; Name; Red; Green; Blue;\n";
  let currentMaxLabel = checkBoxValueCounter - 1;
  for (let p = 1; p <= currentMaxLabel; p++) {
    let name = document.getElementById("nameDiv" + String(p));
    let rgb = thectx.labels[p].colormap;
    let r = rgb[0];
    let g = rgb[1];
    let b = rgb[2];
    fullText +=
      String(p) + ";" + name.innerHTML + ";" + r + ";" + g + ";" + b + ";\n";
  }

  let data = new Blob([fullText], { type: "text/plain" });
  let fileName = "config" + thectx.fileName + ".txt";

  saveData(data, fileName);
}

function mouseLeaves() {
  if (MPRActivated) {
    return;
  }
  mouse_over_canvas = false;
  drawActivated = false;
  eraseActivated = false;
  eraseAndDrawActivated = false;
  translateActivated = false;
  zoomingAct = false;
  windowingActivated = false;
}

function getMousePos(vis_canvas, evt) {
  let rect = vis_canvas.getBoundingClientRect();

  if (evt.touches) {
    evt.offsetX = evt.targetTouches[0].pageX - rect.left;
    evt.offsetY = evt.targetTouches[0].pageY - rect.top;
    evt.clientY = evt.targetTouches[0].clientY;
    evt.clientX = evt.targetTouches[0].clientX;
  }

  let heightDelta = vis_canvas.height / thectx.canvasHeight;
  let widthDelta = vis_canvas.width / thectx.canvasWidth;

  if (rotationCSS == 90 || rotationCSS == 270) {
    //heightDelta = vis_canvas.height / thectx.canvasWidth;
    //widthDelta = vis_canvas.width / thectx.canvasHeight;
  }

  if (thectx.canvasHeight) {
    //rX and rY are "real x and y", always returns same no matter css changes

    if (rotationCSS == 0) {
      if (!mirrorActivated) {
        //no transformation
        return {
          rX: evt.offsetX * widthDelta,
          rY: evt.offsetY * heightDelta,
          x: evt.offsetX * widthDelta,
          y: evt.offsetY * heightDelta
        };
      } else {
        return {
          rX: evt.offsetX * widthDelta,
          rY: evt.offsetY * heightDelta,
          x: (rect.left + thectx.canvasWidth + 2 - evt.clientX) * widthDelta,
          y: (evt.clientY - rect.top - 2) * heightDelta
        };
      }
    }
    if (rotationCSS == 90) {
      if (!mirrorActivated) {
        return {
          rX: evt.offsetX * widthDelta,
          rY: evt.offsetY * heightDelta,
          x: (evt.clientY - rect.top - 2) * widthDelta,
          y: (rect.left + thectx.canvasHeight + 2 - evt.clientX) * heightDelta
        };
      } else {
        return {
          rX: evt.offsetX * widthDelta,
          rY: evt.offsetY * heightDelta,
          x: (rect.top + thectx.canvasWidth + 2 - evt.clientY) * widthDelta,
          y: (rect.left + thectx.canvasHeight + 2 - evt.clientX) * heightDelta
        };
      }
    }
    if (rotationCSS == 180) {
      if (!mirrorActivated) {
        return {
          rX: evt.offsetX * widthDelta,
          rY: evt.offsetY * heightDelta,
          x: (rect.left + thectx.canvasWidth + 2 - evt.clientX) * widthDelta,
          y: (rect.top + thectx.canvasHeight + 2 - evt.clientY) * heightDelta
        };
      } else {
        return {
          rX: evt.offsetX * widthDelta,
          rY: evt.offsetY * heightDelta,
          x: (evt.clientX - rect.left - 2) * widthDelta,
          y: (rect.top + thectx.canvasHeight + 2 - evt.clientY) * heightDelta
        };
      }
    }
    if (rotationCSS == 270) {
      if (!mirrorActivated) {
        return {
          rX: evt.offsetX * widthDelta,
          rY: evt.offsetY * heightDelta,
          x: (rect.top + thectx.canvasWidth + 2 - evt.clientY) * widthDelta,
          y: (evt.clientX - rect.left - 2) * heightDelta
        };
      } else {
        return {
          rX: evt.offsetX * widthDelta,
          rY: evt.offsetY * heightDelta,
          x: (evt.clientY - rect.top - 2) * widthDelta,
          y: (evt.clientX - rect.left - 2) * heightDelta
        };
      }
    }
  }
  return {
    x: evt.clientX - rect.left - 2,
    y: evt.clientY - rect.top - 2
  };
}

var drawingNow = false;

drawingLine = {
  fromX: 0,
  fromY: 0,
  active: false,
  startX: 0,
  startY: 0
};
function draw(vis_canvas, posx, posy) {
  if (MPRActivated) {
    MPRPointerShort();
    return;
  }
  //returns if ongoing drawing...this saves unnecessary undisplayed drawing
  if (drawingNow) {
    return;
  }
  drawingNow = true;

  let logFrameRate = false;
  let frameRateTime;
  if (logFrameRate) {
    frameRateTime = Date.now();
  }

  posx = posx / scaleValue - translationX;
  posy = posy / scaleValue - translationY;

  let canvasWidth = vis_canvas.width;
  let canvasHeight = vis_canvas.height;

  //0. clear uns_thr
  uns_ctx_thr.clearRect(0, 0, canvasWidth, canvasHeight);

  //1. do circle in uns_thr
  uns_ctx_thr.fillStyle = "rgba(255,0,0,255)";
  uns_ctx_thr.beginPath();

  if (!fluidPointActive) {
    uns_ctx_thr.arc(
      Math.floor(posx) + 0.5,
      Math.floor(posy) + 0.5,
      sizeOfCircle,
      0,
      2 * Math.PI
    );
  } else {
    let dimRatio =
      thectx.niftiHeader.pixDims[2] / thectx.niftiHeader.pixDims[1];
    //dimratio to see if distance in x and y are same, usually there are,
    // but when not, the circle has to be an elipse to look as circle
    // because the voxels are not quadratic, but rectangles

    if (dimRatio != 1) {
      uns_ctx_thr.save();
    }

    if (!DGInitialized) {
      uns_ctx_thr.strokeStyle = "rgba(255,0,0,255)";
      uns_ctx_thr.lineWidth = (sizeOfCircle * 1.96) / dimRatio;
      if (sizeOfCircle < 1e-12) {
        uns_ctx_thr.lineWidth = 1e-12;
      }

      uns_ctx_thr.moveTo(drawingLine.fromX, drawingLine.fromY);
      uns_ctx_thr.lineTo(posx, posy);
      drawingLine.fromX = posx;
      drawingLine.fromY = posy;

      if (dimRatio != 1) {
        uns_ctx_thr.scale(dimRatio, 1);
      }

      uns_ctx_thr.closePath();

      uns_ctx_thr.stroke();
    }

    //drawing with square
    //uns_ctx_thr.rect(posx-sizeOfCircle/2, posy-sizeOfCircle/2, sizeOfCircle, sizeOfCircle);
    //uns_ctx_thr.stroke();

    //line to for evt. implementation of boundry delineation
    /*         uns_ctx_thr.lineWidth = sizeOfCircle;
        uns_ctx_thr.moveTo(historyPosx, historyPosy)
        uns_ctx_thr.lineTo(posx, posy)
        historyPosx = posx
        historyPosy = posy
        uns_ctx_thr.closePath()
        uns_ctx_thr.stroke() */

    //uns_ctx_thr.arc(posx, posy, sizeOfCircle, 0, 2 * Math.PI);
    if (dimRatio != 1) {
      uns_ctx_thr.restore();
      uns_ctx_thr.ellipse(
        posx,
        posy,
        sizeOfCircle,
        sizeOfCircle / dimRatio,
        0,
        0,
        2 * Math.PI
      );
    } else {
      uns_ctx_thr.arc(posx, posy, sizeOfCircle, 0, 2 * Math.PI);
    }

    //uns_ctx_thr.stroke()
  }

  uns_ctx_thr.fill();

  //2. binarize vis circle and give it its color and opacity
  let visImData = uns_ctx_thr.getImageData(0, 0, thectx.cols, thectx.rows);

  //"detaching from DOM", see http://www.onaluf.org/en/entry/13
  let visImData2 = visImData.data;
  //let visImData2 = new Uint8ClampedArray(visImData.data.buffer)
  let total = visImData2.length;

  if (!DGInitialized) {
    let colormap0 = thectx.labels.vis.colormap[0];
    let colormap1 = thectx.labels.vis.colormap[1];
    let colormap2 = thectx.labels.vis.colormap[2];
    let opacity = thectx.labels.vis.opacity;

    //threshold preview
    let slice, sliceSize, sliceOffset, typedData, halfOpacity;
    if (thresholdPreview && thresholdActivated) {
      slice = thectx.slider.value;
      sliceSize = thectx.sliceSize;
      sliceOffset = sliceSize * slice;
      typedData = thectx.typedData;
      halfOpacity = Math.round(opacity / 3);
    }

    for (let p = 0; p < total; p += 4) {
      if (visImData2[p] > 0) {
        visImData2[p] = colormap0;
        visImData2[p + 1] = colormap1;
        visImData2[p + 2] = colormap2;
        visImData2[p + 3] = opacity;

        //show borders
        if (false) {
          if (
            visImData2[p - 4] > 0 &&
            visImData2[p + 4] > 0 &&
            visImData2[p + thectx.cols * 4] > 0 &&
            visImData2[p - thectx.cols * 4] > 0
          ) {
            visImData2[p + 3] = 1;
          }
        }

        //threshold preview
        if (thresholdPreview && thresholdActivated) {
          let pos = sliceOffset + p / 4;

          if (
            typedData[pos] < lowerThreshold ||
            typedData[pos] > upperThreshold
          ) {
            //visImData2[p] = 0
            //visImData2[p+1] = 0
            //visImData2[p+2] = 0
            visImData2[p + 3] = halfOpacity;
          }
        }
      }
    }
  } else {
    //if deepgrow

    let colormapPos = thectx.labels.dgPos.colormap;
    let colormapNeg = thectx.labels.dgNeg.colormap;
    let opacity = thectx.labels.dgPos.opacity;

    let slice = thectx.slider.value;
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice;

    //1. make temp from full and vis data
    thectx.DG.temp = new Int8Array(sliceSize);

    for (let p = 0; p < total; p += 1) {
      let p4 = p * 4;
      //geting temp DG guides from DG volume
      thectx.DG.temp[p] = thectx.DG.full[sliceOffset + p];

      //if point is positive then draw it into temp
      if (visImData2[p4] > 0) {
        if (thectx.DG.positive) {
          thectx.DG.temp[p] += 1;
        } else {
          thectx.DG.temp[p] -= 1;
        }
        //the following is for overlapping negative and positive points
        //seems to be enough to remove opacity
        //visImData2[p] = 0
        //visImData2[p+1] = 0
        //visImData2[p+2] = 0
        visImData2[p4 + 3] = 0;
      }

      //if temp not zero, then draw it into vis
      if (thectx.DG.temp[p] != 0) {
        if (thectx.DG.temp[p] > 0) {
          visImData2[p4] = colormapPos[0];
          visImData2[p4 + 1] = colormapPos[1];
          visImData2[p4 + 2] = colormapPos[2];
          visImData2[p4 + 3] = opacity;
        } else {
          visImData2[p4] = colormapNeg[0];
          visImData2[p4 + 1] = colormapNeg[1];
          visImData2[p4 + 2] = colormapNeg[2];
          visImData2[p4 + 3] = opacity;
        }
      }
    }
  }

  //"attaching back" see http://www.onaluf.org/en/entry/13
  //visImData.data = visImData2

  uns_ctx_vis.putImageData(visImData, 0, 0);

  if (drawActivated && !thresholdActivated && !DGActivated) {
    //following adds to global mask
    if (eraseActivated) {
      segmToMaskData(visImData, 0);
    } else {
      segmToMaskData(visImData, thectx.labels.currentLabel);
    }
    //displays it...the slowest of all in normal draw
    visualizeMaskData();
  }

  if (thresholdActivated && drawActivated && !DGActivated) {
    try {
      if (eraseAndDrawActivated) {
        segmToMaskData(visImData, 0);
        thrsToMaskData(visImData, thectx.labels.currentLabel);
      } else if (eraseActivated) {
        segmToMaskData(visImData, 0);
      } else {
        thrsToMaskData(visImData, thectx.labels.currentLabel);
      }
      visualizeMaskData();
    } catch {}
  }

  if (DGActivated && !DLRunning) {
    DLRunning = true;

    if (deepGrowModel.status == "first") {
      deepGrowModel.status = "second";
      tf.tidy(() => {
        predictCurrentSlice(
          deepGrowPreModel,
          windowedImageDataPredicting,
          (sync = true),
          (DGActivated = true)
        );
      });
    } else {
      tf.tidy(() => {
        predictCurrentSlice(
          deepGrowModel,
          windowedImageDataPredicting,
          (sync = true),
          (DGActivated = true)
        );
      });
    }
  }

  //Below is only change of the canvases used for visualizing

  //this part visualizes pointer

  vis_ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  vis_ctx.scale(scaleValue, scaleValue);
  vis_ctx.drawImage(uns_canvas_vis, translationX, translationY);
  vis_ctx.setTransform(1, 0, 0, 1, 0, 0);
  //vis_ctx.scale(1/scaleValue, 1/scaleValue);

  //following visualizes segmentation
  pr_ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  pr_ctx.scale(scaleValue, scaleValue);
  pr_ctx.drawImage(uns_canvas_mask, translationX, translationY);
  pr_ctx.setTransform(1, 0, 0, 1, 0, 0);
  //pr_ctx.scale(1/scaleValue, 1/scaleValue);

  //this first if is to make sure that it's not showing status of segmentation

  if (infoAdvShow) {
    infoAdvShowFunc();
  }

  if (pixelValShowAct) {
    try {
      let x = Math.floor(posx);
      let y = Math.floor(posy);

      let slice = thectx.slider.value;
      let typedData = thectx.typedData;
      let cols = thectx.cols;
      let rows = thectx.rows;
      let sliceSize = cols * rows;
      let sliceOffset = sliceSize * slice;

      let voxelvalue = typedData[sliceOffset + y * cols + x];
      let maskValue = thectx.segData[sliceOffset + y * cols + x];

      let maskName;
      if (maskValue > 0) {
        maskName = document.getElementById("nameDiv" + String(maskValue))
          .innerHTML;
      }

      if (infoAdvShow) {
        upperLeftInfoBar.innerHTML += "<br>########Voxel info#######<br>";
      } else {
        upperLeftInfoBar.innerHTML = "";
      }
      upperLeftInfoBar.innerHTML += "Значение вокселя: " + String(voxelvalue);
      if (!quizMode) {
        upperLeftInfoBar.innerHTML +=
          "<br> Значение маски: " + String(maskValue) + "<br>";
        if (maskValue > 0) {
          if (maskName != "Unnamed") {
            upperLeftInfoBar.innerHTML += maskName;
          }
        }
      }
    } catch {}
  }

  if (segVolumeShowAct && (drawActivated || DGActivated)) {
    try {
      let upperLeftInfoBar = document.getElementById("upperLeftInfoBar");
      let volumeOneVoxel =
        thectx.niftiHeader["pixDims"][1] *
        thectx.niftiHeader["pixDims"][2] *
        thectx.niftiHeader["pixDims"][3];
      let sumpixels = 0;
      let total = thectx.segData.length;
      for (let counter = 0; counter < total; counter++) {
        if (thectx.segData[counter] > 0) {
          sumpixels += 1;
        }
      }
      if (pixelValShowAct) {
        upperLeftInfoBar.innerHTML +=
          "Сегментированные воксели = " +
          String(sumpixels) +
          " <br> Значение = " +
          String(Math.round(sumpixels * volumeOneVoxel) / 1000) +
          " ml";
      } else {
        upperLeftInfoBar.innerHTML =
          "Сегментированные воксели = " +
          String(sumpixels) +
          " <br> Значение = " +
          String(Math.round(sumpixels * volumeOneVoxel) / 1000) +
          " ml";
      }
    } catch {
      console.log("погрешность измерения объема");
    }
  }

  if (logFrameRate) {
    console.log(Date.now() - frameRateTime);
  }

  drawingNow = false;

  if (globalCaliperVals.activated) {
    globalCaliperVals.toRow = posy;
    globalCaliperVals.toCol = posx;

    if (typeof globalCaliperVals.roi == "undefined") {
      drawLineFuncLilSofieElisabeth();
    } else {
      drawRoiRectangle();
    }
  }

  //areaAnalysisExecute(thectx.labels.currentLabel)
}

///////////////////////////////////////////////////

function adjustWindowning(value) {
  //if (x > 255) { x = 255 }
  //if (x < 0) { x = 0 }
  return (value - intensBaseline) / intensDiv;
}

function drawCanvas(myctx) {
  if (MPRActivated) {
    showMatrixSimple(matrixGlobal);
    return;
  }
  if (!initialized) {
    ("чтобы снова сделать холст 512 x 512, сначала внесите изменения для отображения изображения");
    initialized = true;
    bg_canvas.width = "512";
    bg_canvas.height = "512";
  }

  //var a = Date.now()

  let slice = myctx.slider.value;
  let typedData = myctx.typedData;
  // get nifti dimensions
  let cols = thectx.cols;
  let rows = thectx.rows;

  let canvasWidth = bg_canvas.width;
  let canvasHeight = bg_canvas.height;

  // set canvas dimensions to nifti slice dimensions
  // canvas.width = cols;
  // canvas.height = rows;

  // make canvas image data
  let canvasImageData = new ImageData(cols, rows);
  //ctx.createImageData(cols, rows);

  // offset to specified slice
  let sliceSize = cols * rows;
  let sliceOffset = sliceSize * slice;
  // draw pixels

  let canvasImageData2 = canvasImageData.data;

  let rowOffset, offset, value, intensityValue, offsetMult4;

  if (softSlice.draw) {
    typedData = softSlice.createOneSlice();
    sliceOffset = 0;
  }

  for (let row = 0; row < rows; row++) {
    rowOffset = row * cols;
    for (let col = 0; col < cols; col++) {
      offset = sliceOffset + rowOffset + col;
      value = typedData[offset];

      intensityValue = adjustWindowning(value);
      offsetMult4 = (rowOffset + col) * 4;
      canvasImageData2[offsetMult4] = intensityValue;
      canvasImageData2[offsetMult4 + 1] = intensityValue;
      canvasImageData2[offsetMult4 + 2] = intensityValue;
      canvasImageData2[offsetMult4 + 3] = 255;
    }
  }
  canvasImageData.data = canvasImageData2;

  uns_ctx.putImageData(canvasImageData, 0, 0);

  if (interpolActive) {
    bg_ctx.imageSmoothingEnabled = "high"; //baseline is "low". High looks better
  } else {
    bg_ctx.imageSmoothingEnabled = false;
  }

  bg_ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  bg_ctx.scale(scaleValue, scaleValue);
  bg_ctx.drawImage(uns_canvas, translationX, translationY);

  bg_ctx.setTransform(1, 0, 0, 1, 0, 0);

  //shortShowMPR()

  visualizeMaskData();
  draw(vis_canvas, posx, posy);

  //console.log(Date.now()-a)
}

function initIntensityOnFirstLoad(imageData) {
  var max = 0;
  var min = 0;
  for (var i = 0; i < imageData.length; i++) {
    if (imageData[i] > max) {
      max = imageData[i];
    }
    if (imageData[i] < min) {
      min = imageData[i];
    }
  }
  if (min < -1024) {
    min = -1024;
  }

  if (inputQuery.slice(0, 10) == "?bodysegai") {
    min = -200;
    max = 300;
  }

  changeWindowing(min, max);
  //intensBaseline = min;
  //intensDiv = (max-min)/255;

  if (startUpConditions.intensBaseline) {
    intensBaseline = startUpConditions.intensBaseline;
    startUpConditions.intensBaseline = false;

    if (startUpConditions.intensDiv) {
      intensDiv = startUpConditions.intensDiv;
      startUpConditions.intensDiv = false;
    }
  }

  if (startUpConditions.rot180) {
    rot90CSS();
    rot90CSS();
  }
  if (startUpConditions.mirror) {
    mirrorCSS();
  }
}

function resizeCanvas(heightInPixels, widthInPixels) {
  //here add if pix dimensions for row are not same as for col

  let ratioColsRows = thectx.rows / thectx.cols;
  if (thectx.niftiHeader) {
    let pixDim1 = thectx.niftiHeader.pixDims[1];
    let pixDim2 = thectx.niftiHeader.pixDims[2];
    if (pixDim1 != pixDim2) {
      let ratioPixDims = pixDim1 / pixDim2;
      ratioColsRows /= ratioPixDims;
    }
  }

  let maxWidth;
  let maxHeight;

  if (rotationCSS == 0 || rotationCSS == 180) {
    maxWidth = widthInPixels;
    maxHeight = heightInPixels / ratioColsRows;
    if (maxWidth < maxHeight) {
      heightInPixels = maxWidth * ratioColsRows;
    }
  }

  if (rotationCSS == 90 || rotationCSS == 270) {
    heightInPixels = heightInPixels * ratioColsRows;
    maxWidth = widthInPixels;
    maxHeight = heightInPixels;
    if (maxWidth < maxHeight) {
      heightInPixels = maxWidth;
    }
  }

  thectx.canvasHeight = Math.round(heightInPixels);
  thectx.canvasWidth = Math.round(heightInPixels / ratioColsRows);

  bg_canvas.style.height = String(thectx.canvasHeight) + "px";
  bg_canvas.style.width = String(thectx.canvasWidth) + "px";

  pr_canvas.style.height = String(thectx.canvasHeight) + "px";
  pr_canvas.style.width = String(thectx.canvasWidth) + "px";

  vis_canvas.style.height = String(thectx.canvasHeight) + "px";
  vis_canvas.style.width = String(thectx.canvasWidth) + "px";

  var wrapper = document.getElementById("wrapper");
  wrapper.style.width = String(thectx.canvasWidth) + "px";
  wrapper.style.left = "296px";
  wrapper.style.top = "8px";

  var slider = document.getElementById("myRange");

  if (thectx.canvasHeight == thectx.canvasWidth) {
    slider.style.width = String(parseInt(thectx.canvasHeight - 6)) + "px";
    slider.style.right = String(-parseInt(thectx.canvasHeight / 2) + 11) + "px";
    slider.style.top = String(parseInt(thectx.canvasHeight / 2) - 11) + "px";
  } else {
    if (rotationCSS == 90 || rotationCSS == 270) {
      slider.style.width = String(parseInt(thectx.canvasWidth - 6)) + "px";
      slider.style.right =
        String(-parseInt(thectx.canvasHeight / 2) + 11) + "px";
      slider.style.top = String(parseInt(thectx.canvasHeight / 2) - 11) + "px";

      var wrapper = document.getElementById("wrapper");
      wrapper.style.top =
        String(Math.round((thectx.canvasWidth - thectx.canvasHeight) / 2) + 8) +
        "px";
      wrapper.style.left =
        String(
          Math.round((thectx.canvasHeight - thectx.canvasWidth) / 2) + 296
        ) + "px";
    } else {
      slider.style.width = String(parseInt(thectx.canvasHeight - 6)) + "px";
      slider.style.right =
        String(-parseInt(thectx.canvasHeight / 2) + 11) + "px";
      slider.style.top = String(parseInt(thectx.canvasHeight / 2) - 11) + "px";

      var wrapper = document.getElementById("wrapper");
    }
  }
}

fitToScreen();
document.body.onresize = fitToScreen;
function fitToScreen() {
  resizeCanvas(window.innerHeight - 12, window.innerWidth - 300);
}

function downloadSegmentation() {
  //logDownload()
  exportMask(thectx);
  save_nifti(thectx);
}
