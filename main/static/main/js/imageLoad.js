document
  .getElementById("file")
  .addEventListener("change", handleFileSelect, true);


function handleFileSelect(evt) {
  var files = evt.target.files;
  if (files[0].name.includes(".nii")) {
    readNiiFile(files[0]);
  } else if (files[0].name.includes(".txt")) {
    readNameFile(files[0]);
  } else {
    readDicom(evt);
  }
}

function readNameFile(file) {
  //92 characters before interesting part
  var blob = makeSlice(file, 92, file.size);
  var reader = new FileReader();
  reader.onloadend = function(evt) {
    let loadedString = evt.target.result;
    let splitString = loadedString.split(";");
    let length = parseInt(splitString.length / 5);
    for (let p = 0; p < length; p++) {
      if (p >= checkBoxValueCounter - 1) {
        buttonpress();
      }
      let p5 = p * 5;
      let maskVal = p + 1;
      let name = splitString[p5 + 1];
      let r = parseInt(splitString[p5 + 2]);
      let g = parseInt(splitString[p5 + 3]);
      let b = parseInt(splitString[p5 + 4]);

      let optionalString = splitString[p5];
      let splitOptionalString = optionalString.split(",");
      if (splitOptionalString.length > 1) {
        thectx.labels[maskVal].threshold = {};
        let threshold = thectx.labels[maskVal].threshold;
        threshold.activated = splitOptionalString[1];
        threshold.min = splitOptionalString[2];
        threshold.max = splitOptionalString[3];
      }

      let nameDiv = document.getElementById("nameDiv" + String(maskVal));

      let colorpicker = document.getElementById(
        "colorpicker" + String(maskVal)
      );
      let divColor = document.getElementById("divColor" + String(maskVal));

      function rgb(r, g, b) {
        var hexR = Number(r).toString(16);
        if (hexR.length < 2) {
          hexR = "0" + hexR;
        }
        var hexG = Number(g).toString(16);
        if (hexG.length < 2) {
          hexG = "0" + hexG;
        }
        var hexB = Number(b).toString(16);
        if (hexB.length < 2) {
          hexB = "0" + hexB;
        }
        return [hexR, hexG, hexB].join("");
      }
      let hex = "#" + rgb(r, g, b);

      colorpicker.value = hex;
      divColor.style.backgroundColor = colorpicker.value;

      nameDiv.innerHTML = name;
      nameDiv.setAttribute("title", nameDiv.innerHTML + ".  Click to rename.");

      thectx.labels[maskVal].colormap[0] = r;
      thectx.labels[maskVal].colormap[1] = g;
      thectx.labels[maskVal].colormap[2] = b;
    }
    if (!quizInitialized && quizMode) {
      quizInit();
    }
    drawCanvas(thectx);
  };
  reader.readAsText(blob);
}

function readNiiFile(file, knownMask = false) {
  //resetting rotation first
  thectx.rotRowAxisShow(0, (show = false));

  var blob = makeSlice(file, 0, file.size);
  var reader = new FileReader();
  reader.onloadend = function(evt) {
    if (evt.target.readyState === FileReader.DONE) {
      if (typeof file.name !== "undefined") {
        try {
          thectx.fileName = file.name.split(".nii")[0];
        } catch {
          thectx.fileName = file.name;
        }
      }

      let inputFileName = document.getElementById("inputFileName");
      inputFileName.value = thectx.fileName;

      if (nifti.isCompressed(evt.target.result)) {
        var decompressedData = nifti.decompress(evt.target.result);
      } else {
        var decompressedData = evt.target.result;
      }

      if (knownMask) {
        var possibleMask = checkIfPossibleMask(decompressedData);
        for (var p = 0; p < possibleMask.length; p += 1) {
          thectx.segData[p] = possibleMask[p];
          if (thectx.segData[p] >= checkBoxValueCounter) {
            for (
              var nr = 0;
              thectx.segData[p] + 1 - checkBoxValueCounter;
              nr += 1
            ) {
              buttonpress();
            }
          }
        }
        drawCanvas(thectx);
        return;
      }

      //if not first load, then will check if the same kind of nifti
      if (temp_nii_header != undefined) {
        //load mask starts here
        var possibleMask = checkIfPossibleMask(decompressedData);
        if (possibleMask) {
          if (confirm("Load as mask?")) {
            for (var p = 0; p < possibleMask.length; p += 1) {
              thectx.segData[p] = possibleMask[p];
              if (thectx.segData[p] >= checkBoxValueCounter) {
                for (
                  var nr = 0;
                  thectx.segData[p] + 1 - checkBoxValueCounter;
                  nr += 1
                ) {
                  buttonpress();
                }
              }
            }
            //ends here. The confirm is not needed if loading external
            drawCanvas(thectx);
          } else {
            readNIFTI(file.name, decompressedData);
          }
        } else {
          readNIFTI(file.name, decompressedData);
        }
      } else {
        readNIFTI(file.name, decompressedData);
      }
    }
  };
  reader.readAsArrayBuffer(blob);
}

function checkIfPossibleMask(data) {
  // if same header as loaded file + values 0-255, then returns
  // array with data. It needs to then be put into segData
  try {
    /*         if (nifti.isCompressed(data)) {
            var data = nifti.decompress(data);
        } */

    var sameAsLoaded = equal(temp_nii_header, data.slice(0, 352));
    if (sameAsLoaded) {
      var niftiHeader = (niftiHeader = nifti.readHeader(data));
      var niftiImage = nifti.readImage(niftiHeader, data);
      let maskData;

      if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT8) {
        maskData = new Uint8Array(niftiImage);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT16) {
        maskData = new Int16Array(niftiImage);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT32) {
        maskData = new Int32Array(niftiImage);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_FLOAT32) {
        maskData = new Float32Array(niftiImage);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_FLOAT64) {
        maskData = new Float64Array(niftiImage);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT8) {
        maskData = new Int8Array(niftiImage);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT16) {
        maskData = new Uint16Array(niftiImage);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT32) {
        maskData = new Uint32Array(niftiImage);
      } else {
        console.log("initTypedData: Error unknown header type");
        console.log(niftiHeader.datatypeCode);
        return;
      }

      let slope = niftiHeader.scl_slope;
      let baseline = niftiHeader.scl_inter;
      if ((slope != 1 || baseline != 0) && slope != 0) {
        //slope is in float32, encoded in bytes 112-116
        //baseline is in float32, encoded in bytes 116-120

        let temp = new Uint8Array(temp_nii_header);
        let slope8Bit = new Uint8Array(new Float32Array(1).fill(1).buffer);
        let baseline8Bit = new Uint8Array(new Float32Array(1).fill(0).buffer);
        for (let i = 0; i < 4; i++) {
          temp[112 + i] = slope8Bit[i];
          temp[116 + i] = baseline8Bit[i];
        }
        temp_nii_header = temp.buffer;

        console.log("rescaled");
        console.log(slope, baseline);

        let newMaskData = new Float32Array(maskData.length);

        for (let counter = 0; counter < maskData.length; counter++) {
          newMaskData[counter] = maskData[counter] * slope + baseline;
        }
        maskData = newMaskData;
        //need to change the header that is used when saving mask,
        //in it remove slope and inter
      }

      for (p = 0; p < maskData.length; p += 1) {
        if (maskData[p] > 255 || maskData[p] < 0) {
          console.log(maskData[p]);
          console.log("same form as loaded, but vals outside mask expected");

          return false;
        }
      }

      return maskData;
    } else {
      return false;
    }
    function equal(buf1, buf2) {
      //checks header info only where size info is (I think)
      if (buf1.byteLength != buf2.byteLength) return false;
      var dv1 = new Int16Array(buf1);
      var dv2 = new Int16Array(buf2);
      for (var i = 20; i != 24; i++) {
        //console.log(dv1)
        //console.log(dv2)
        if (dv1[i] != dv2[i]) return false;
      }
      return true;
    }
  } catch {
    return false;
  }
}

function makeSlice(file, start, length) {
  var fileType = typeof File;
  if (fileType === "undefined") {
    return function() {};
  }
  if (File.prototype.slice) {
    return file.slice(start, start + length);
  }
  if (File.prototype.mozSlice) {
    return file.mozSlice(start, length);
  }
  if (File.prototype.webkitSlice) {
    return file.webkitSlice(start, length);
  }
  return null;
}

function readNIFTI(name, data, dicom = false) {
  var canvas = document.getElementById("bg_canvas");
  var slider = document.getElementById("myRange");
  var niftiHeader = {};
  var niftiImage = {};
  var slices;

  if (!dicom) {
    // parse nifti
    /*         if (nifti.isCompressed(data)) {
            data = nifti.decompress(data);
        } */
    if (nifti.isNIFTI(data)) {
      niftiHeader = nifti.readHeader(data);
      niftiImage = nifti.readImage(niftiHeader, data);
      temp_nii_header = data.slice(0, 352);

      if (new Float32Array(temp_nii_header.slice(108, 112)) != 352) {
        console.log("vox offset is weird, setting it to 352");
        let temp = new Uint8Array(temp_nii_header);
        let vox_offset_8Bit = new Uint8Array(
          new Float32Array(1).fill(352).buffer
        );
        for (let i = 0; i < 4; i++) {
          temp[108 + i] = vox_offset_8Bit[i];
        }
        temp_nii_header = temp.buffer;
      }
    }

    slices = niftiHeader.dims[3];
  } else {
    slices = loadedDicom.images.length;
  }

  slider.max = parseInt(slices - 1);
  slider.value = parseInt(slices / 2);

  // Set up the context
  thectx.slider = slider;
  thectx.canvas = canvas;
  thectx.niftiHeader = niftiHeader;
  thectx.niftiImage = niftiImage;

  if (dicom) {
    var pixSp = loadedDicom.images[0].getPixelSpacing();
    var slThk = loadedDicom.images[0].getSliceThickness();
    var slGap = loadedDicom.images[0].getSliceGap();
    if (slGap > 0 && slGap > slThk) {
      slThk = slGap;
    }
    thectx.rows = loadedDicom.images[0].getRows();
    thectx.cols = loadedDicom.images[0].getCols();

    thectx.niftiHeader.pixDims = [0, pixSp[0], pixSp[1], slThk];
    thectx.niftiHeader.dims = [0, thectx.rows, thectx.cols];
  } else {
    thectx.rows = thectx.niftiHeader.dims[2];
    thectx.cols = thectx.niftiHeader.dims[1];

    //tried to get auto rotation right here - failed.
    //Keeping it only for the first guess

    if (!hasLoadedNifti) {
      let affine00 = thectx.niftiHeader.affine[0][0];
      let affine11 = thectx.niftiHeader.affine[1][1];

      if (affine00 > 0 && affine11 > 0) {
        // upside down and left/right, but rotation gives left/right
        rotationCSS = 180;
        mirrorActivated = false;
        changeCSSTransform();
      } else if (affine00 > 0 && !affine11 > 0) {
        rotationCSS = 180;
        mirrorActivated = true;
        changeCSSTransform();
      } else if (!affine00 > 0 && affine11 > 0) {
        rotationCSS = 0;
        mirrorActivated = true;
        changeCSSTransform();
      } else if (!affine00 > 0 && !affine11 > 0) {
        rotationCSS = 0;
        mirrorActivated = false;
        changeCSSTransform();
      }
    }
  }
  thectx.sliceSize = thectx.rows * thectx.cols;
  thectx.emptyImageData = uns_ctx.createImageData(thectx.cols, thectx.rows);

  sizeCanvases();

  fitToScreen();

  initTypedData(thectx, (dicom = dicom));

  slider.oninput = function() {
    requestAnimationFrame(simpleDrawCanvas);
  };

  requestAnimationFrame(simpleDrawCanvas);
  hasLoadedNifti = true;
}

function sizeCanvases() {
  document.getElementById("UnseenCanvasThr").height = thectx.rows;
  document.getElementById("UnseenCanvasThr").width = thectx.cols;
  document.getElementById("UnseenCanvas").height = thectx.rows;
  document.getElementById("UnseenCanvas").width = thectx.cols;
  document.getElementById("UnseenCanvasMask").height = thectx.rows;
  document.getElementById("UnseenCanvasMask").width = thectx.cols;
  document.getElementById("UnseenCanvasVis").height = thectx.rows;
  document.getElementById("UnseenCanvasVis").width = thectx.cols;
  document.getElementById("bg_canvas").height = thectx.rows;
  document.getElementById("bg_canvas").width = thectx.cols;
  document.getElementById("pr_canvas").height = thectx.rows;
  document.getElementById("pr_canvas").width = thectx.cols;
  document.getElementById("vis_canvas").height = thectx.rows;
  document.getElementById("vis_canvas").width = thectx.cols;

  uns_ctx.imageSmoothingEnabled = false;
  uns_ctx_thr.imageSmoothingEnabled = false;
  uns_ctx_mask.imageSmoothingEnabled = false;
  uns_ctx_vis.imageSmoothingEnabled = false;
  pr_ctx.imageSmoothingEnabled = false;
  vis_ctx.imageSmoothingEnabled = false;
}

let minThreshold, maxThreshold;
function initTypedData(ctx, dicom = false) {
  if (!initialized) {
    initialized = true;
  }
  var niftiHeader = ctx.niftiHeader;
  var niftiImage = ctx.niftiImage;
  // convert raw data to typed array based on nifti datatype
  var typedData; // Image data
  var maskData; // Mask data

  if (!dicom) {
    try {
      if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT8) {
        typedData = new Uint8Array(niftiImage);
        maskData = new Uint8Array(typedData.length).fill(0);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT16) {
        typedData = new Int16Array(niftiImage);
        maskData = new Int16Array(typedData.length).fill(0);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT32) {
        typedData = new Int32Array(niftiImage);
        maskData = new Int32Array(typedData.length).fill(0);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_FLOAT32) {
        typedData = new Float32Array(niftiImage);
        maskData = new Float32Array(typedData.length).fill(0);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_FLOAT64) {
        typedData = new Float64Array(niftiImage);
        maskData = new Float64Array(typedData.length).fill(0);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_INT8) {
        typedData = new Int8Array(niftiImage);
        maskData = new Int8Array(typedData.length).fill(0);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT16) {
        typedData = new Uint16Array(niftiImage);
        maskData = new Uint16Array(typedData.length).fill(0);
      } else if (niftiHeader.datatypeCode === nifti.NIFTI1.TYPE_UINT32) {
        typedData = new Uint32Array(niftiImage);
        maskData = new Uint32Array(typedData.length).fill(0);
      } else {
        console.log("initTypedData: Error unknown header type");
        console.log(niftiHeader.datatypeCode);
        return;
      }
    } catch {
      upperLeftInfoBar.innerHTML =
        "Ошибка - вероятно, проблема с выделением памяти. Убедитесь, что вы используете 64-разрядный браузер.";
      return;
    }

    //setting rotation failed, I think you must know the full orientation info...
    //let dim_info_byte = parseInt(new Uint8Array(temp_nii_header.slice(39,40)))
    //let slice_code_byte = parseInt(new Uint8Array(temp_nii_header.slice(39,40)))
    function splitByte(byteval) {
      let bits = [0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 7; i >= 0; i--) {
        if (byteval >= Math.pow(2, i)) {
          bits[7 - i] = 1;
          byteval -= Math.pow(2, i);
        }
      }
      return bits;
    }
    //console.log(splitByte(slice_code_byte))

    let slope = niftiHeader.scl_slope;
    let baseline = niftiHeader.scl_inter;
    if ((slope != 1 || baseline != 0) && slope != 0) {
      /* upperLeftInfoBar.innerHTML="RESCALED, because of slope or baseline"
            upperLeftInfoBar.innerHTML+="<br> Downloaded mask "
            upperLeftInfoBar.innerHTML+="might have weird values in some programs" */

      //slope is in float32, encoded in bytes 112-116
      //baseline is in float32, encoded in bytes 116-120

      let temp = new Uint8Array(temp_nii_header);
      let slope8Bit = new Uint8Array(new Float32Array(1).fill(1).buffer);
      let baseline8Bit = new Uint8Array(new Float32Array(1).fill(0).buffer);
      for (let i = 0; i < 4; i++) {
        temp[112 + i] = slope8Bit[i];
        temp[116 + i] = baseline8Bit[i];
      }
      temp_nii_header = temp.buffer;

      console.log("rescaled");
      console.log(slope, baseline);

      var newTypedData = new Float32Array(typedData.length);

      for (var counter = 0; counter < typedData.length; counter++) {
        newTypedData[counter] = typedData[counter] * slope + baseline;
      }
      typedData = newTypedData;
      //need to change the header that is used when saving mask,
      //in it remove slope and inter
    }
  } else {
    var oneSlice = ctx.cols * ctx.rows;
    try {
      typedData = new Float32Array(oneSlice * (parseInt(ctx.slider.max) + 1));
    } catch (error) {
      typedData = new Int16Array(oneSlice * (parseInt(ctx.slider.max) + 1));
      console.log("Too large file that didn't fit in memory, so created Int16");
      console.log("instead of Float32. This means decimal values got lost.");
    }
    typedData.set(loadedDicom.images[0].getInterpretedData());
    for (var i = 1; i <= parseInt(ctx.slider.max); i++) {
      typedData.set(loadedDicom.images[i].getInterpretedData(), oneSlice * i);
    }
    maskData = new Int16Array(oneSlice * (parseInt(ctx.slider.max) + 1)).fill(
      0
    );
  }

  ctx.typedData = typedData;

  let threshChBoxValue = document.getElementById("threshChBox").checked;

  let temp = minMaxArray(ctx.typedData);
  minThreshold = temp[0];
  maxThreshold = temp[1];

  MaxThrSlider.max = maxThreshold;
  MaxThrSlider.min = minThreshold;
  MaxThrSlider.step = (maxThreshold - minThreshold) / 1000;

  MinThrSlider.max = maxThreshold;
  MinThrSlider.min = minThreshold;
  MinThrSlider.step = (maxThreshold - minThreshold) / 1000;

  changeThresholdSlider();

  if (!threshChBoxValue) {
    document.getElementById("minThrText").value = minThreshold;
    document.getElementById("maxThrText").value = maxThreshold;

    //resets to full range if threshold is not on then loading a new image
    MinThrSlider.value = minThreshold;
    MaxThrSlider.value = maxThreshold;
  }

  ctx.maskData = maskData;
  ctx.segData = new Uint8ClampedArray(typedData.length).fill(0);
  ctx.DG = {
    positive: true,
    temp: new Int8Array(ctx.cols * ctx.rows).fill(0),
    full: new Int8Array(typedData.length).fill(0)
  };
  ctx.memorySeg = new Int8Array(ctx.cols * ctx.rows).fill(0);
  ctx.tempPredSeg = new Float32Array(ctx.cols * ctx.rows).fill(0);
  ctx.tempPredSeg[0] = 100;

  //thisslice
  var slice = ctx.slider.value;
  var sliceSize = ctx.cols * ctx.rows;
  var sliceOffset = sliceSize * slice;

  var thisslice = ctx.typedData.slice(sliceOffset, sliceOffset + sliceSize);

  window.onbeforeunload = function(e) {
    return "Вы уверены, что хотите выйти? Несохраненные изменения будут утеряны.";
  };
  initIntensityOnFirstLoad(thisslice);
}

function dcm2NiiITK(files, download = false, filename = "study_0225.nii") {
  itk.readImageDICOMFileSeries(files).then(function({ image }) {
    upperLeftInfoBar.innerHTML = "Началось преобразование DICOM в nifti";

    itk.writeImageArrayBuffer(null, false, image, filename).then(data => {
      upperLeftInfoBar.innerHTML =
        "Преобразование завершено, пожалуйста, дождитесь его загрузки";

      if (download) {
        let a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";

        let blob = new Blob([data["arrayBuffer"]]);
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        upperLeftInfoBar.innerHTML = "";
      } else {
        let blob = new Blob([data["arrayBuffer"]]);
        readNiiFile(blob);
        upperLeftInfoBar.innerHTML = "";
      }
    });
  });
}

var loadedDicom;
function readDicom(evt, loaded = false) {
  if (!loaded) {
    //by button upload
    var files = evt.target.files;
    dcm2NiiITK(files);
    return;
    /* a = files */
  } else {
    //by drag over
    var files = evt;
    dcm2NiiITK(files);
    return;
    /* a = files */
  }
}

/*     var series = new daikon.Series();
    var arrayBuffer
    var counter = 0
    var max = files.length

    for (var ctr in files) {
        if (!isNaN(ctr)) {
            var promise1 = new Promise(function(resolve) {
                var name = files[ctr];
                var reader = new FileReader();
                reader.onloadend = function() {
                    
                    arrayBuffer = reader.result;
                    var image = daikon.Series.parseImage(new DataView(arrayBuffer));

                    if (image === null) {
                        console.error(daikon.Series.parserError);
                    } else if (image.hasPixelData()) {
                        // if it's part of the same series, add it
                        if ((series.images.length === 0) || 
                                (image.getSeriesId() === series.images[0].getSeriesId())) {
                            series.addImage(image);
                            counter++
                            if (counter==max){
                                loadedDicom = series
                                buildDicom()
                            }
                            //console.log("halla")
                        }
                    }
                }
                
                reader.readAsArrayBuffer(name.slice());
                //console.log("heh")
                resolve()
                });
            promise1.then({});
        }
    } */

/* function buildDicom(){
    loadedDicom.buildSeries()
    readNIFTI("bleh", "blah", dicom=true)
} */

//writes info to drop data to load

let dropWriteArea = document.getElementById("bg_canvas");
var drop_ctx = dropWriteArea.getContext("2d");
//drop_ctx.fillStyle = 'rgb(180, 180, 180)';
//drop_ctx.font = "20px Arial";
//drop_ctx.fillText("Drag NIfTI file or DICOM files over here", 75, 250);
//drop_ctx.fillText("or select file(s) with button top right", 92, 280);

/* drop_ctx.fillStyle = 'rgb(1,220,255)';
drop_ctx.fillText("Lill-Sofies og Elisabeths MedSeg", 100, 250); */
//drop_ctx.fillText("or select file(s) with button top right", 92, 280);

//drop_ctx.font = "15px Arial";
//drop_ctx.fillStyle = 'rgb(1,220,255)';
//drop_ctx.fillText("Welcome to MedSeg! Press the keyboard button to see keybindings.", 33, 48);
//drop_ctx.fillText("Saving of masks only works working with NIfTI files, not DICOM.", 44, 68);

//show first image:

//To show logo, in a closed function:
/* (function (){var img = new Image()
    img.src = "./images/logo.png"
    img.onload = () => {
        drop_ctx.drawImage(img, 220, 30, img.width * 0.3, img.height * 0.3)
}})() */

vis_canvas.addEventListener("dragenter", dragEnterHandler, false);
vis_canvas.addEventListener("dragleave", dragLeaveHandler, false);
vis_canvas.addEventListener("drop", dropHandler, false);
window.addEventListener("drop", dropHandler, false);

//to stop propagation when dropping/dragging stuff
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  vis_canvas.addEventListener(eventName, preventDropDefaults, false);
  window.addEventListener(eventName, preventDropDefaults, false);
});
function preventDropDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function dragEnterHandler() {
  drop_ctx.fillStyle = "rgb(180, 180, 180)";
  drop_ctx.fillRect(0, 0, drop_ctx.canvas.width, drop_ctx.canvas.height);
  drop_ctx.fillStyle = "rgb(0, 0, 0)";
  drop_ctx.font = "20px Arial";
  drop_ctx.fillText("Переместите NIfTI или DICOM файл сюда", 75, 250);
  drop_ctx.fillText("или выберите файл с помощью кнопки", 92, 280);
}

function dragLeaveHandler() {
  drop_ctx.fillStyle = "rgb(128, 128, 128)";
  drop_ctx.fillRect(0, 0, drop_ctx.canvas.width, drop_ctx.canvas.height);
  drop_ctx.fillStyle = "rgb(0, 0, 0)";
  drop_ctx.font = "20px Arial";
  drop_ctx.fillText("Переместите NIfTI или DICOM файл сюда", 75, 250);
  drop_ctx.fillText("или выберите файл с помощью кнопки", 92, 280);
}

//executes following when dropping the data
function dropHandler(e) {
  let dt = e.dataTransfer;
  let files = dt.files;
  if (files[0].name.includes(".nii")) {
    readNiiFile(files[0]);
  } else if (files[0].name.includes(".txt")) {
    readNameFile(files[0]);
  } else {
    readDicom(files, (loaded = true));
  }
}

function loadDemo(filename, knownMask = false) {
  if (filename == "./demoVolumes/demoMRIProstate.nii.gz") {
    thectx.fileName = "prostateMRI";
  } else if (filename == "./demoVolumes/demoMRI.nii.gz") {
    thectx.fileName = "brainMRI";
  } else if (filename == "./demoVolumes/demoCT.nii.gz") {
    thectx.fileName = "bodyCT";
  }

  drop_ctx.fillStyle = "rgb(128, 128, 128)";
  drop_ctx.fillRect(0, 0, drop_ctx.canvas.width, drop_ctx.canvas.height);
  drop_ctx.fillStyle = "rgb(0, 0, 0)";
  drop_ctx.font = "20px Arial";
  drop_ctx.fillText("LOADING, please wait", 70, 250);
  fetch(filename)
    .then(function(response) {
      if (response.status !== 200) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        simpleDrawCanvas();
        return;
      }
      // Examine the text in the response
      response.blob().then(function(data) {
        readNiiFile(data, knownMask);
      });
    })
    .catch(function(err) {
      console.log("Fetch Error :-S", err);
    });
}
