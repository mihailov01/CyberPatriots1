//placement of voxel value show

var upperLeftInfoBar = document.getElementById("upperLeftInfoBar");
upperLeftInfoBar.style.position = "absolute";
upperLeftInfoBar.style.left = "59px";
upperLeftInfoBar.style.zIndex = "99";
upperLeftInfoBar.style.color = "white";

//volume analysis button
var volumeAnalysisButton = document.createElement("BUTTON");
volumeAnalysisButton.style.padding = "0px 8px";
volumeAnalysisButton.style.left = "140px";
volumeAnalysisButton.style.top = "575px";
volumeAnalysisButton.style.margin = "10px";
volumeAnalysisButton.style.position = "absolute";
volumeAnalysisButton.id = "mainButtonToAddSegValues";
//volumeAnalysisButton.style.color = "blue"
volumeAnalysisButton.style.fontSize = "12px";
volumeAnalysisButton.innerHTML = "Calc. volumes";
/* document.getElementById("allText").appendChild(volumeAnalysisButton);
 */
//function when clicking the button
volumeAnalysisButton.onclick = function() {
  let div = visualizeMedSeg.createWindowDiv();

  //for each color make a new list number and calc. volumes
  let listOfVols = [0];
  for (let colorNr = 1; colorNr < checkBoxValueCounter; colorNr += 1) {
    listOfVols.push(0);
  }
  let total = thectx.segData.length;
  let segData = thectx.segData;
  let totalSegVoxels = 0;
  for (let counter = 0; counter < total; counter++) {
    let segVal = segData[counter];
    if (segVal > 0) {
      totalSegVoxels += 1;
    }
    listOfVols[segVal] += 1;
  }

  let volumeOneVoxel =
    thectx.niftiHeader["pixDims"][1] *
    thectx.niftiHeader["pixDims"][2] *
    thectx.niftiHeader["pixDims"][3];

  let text0 = document.createElement("text");
  text0.innerHTML = "Total segmented voxels: ";
  text0.style.fontSize = "30px";
  text0.style.textShadow = "0px 0px 5px #ffffff";

  let text01 = document.createElement("text");
  text01.style.fontSize = "30px";

  text01.innerHTML = String(totalSegVoxels);
  text01.innerHTML += "<br>";

  let text = document.createElement("text");
  text.innerHTML = "Total segmented volume: ";
  let text2 = document.createElement("text");
  text2.innerHTML +=
    " " + String(((totalSegVoxels * volumeOneVoxel) / 1000).toFixed(3)) + " ml";
  text2.innerHTML += "<br><br>";
  text2.style.fontSize = "30px";
  text.style.fontSize = "30px";
  text.style.textShadow = "0px 0px 5px #ffffff";
  div.appendChild(text0);
  div.appendChild(text01);
  div.appendChild(text);
  div.appendChild(text2);

  //for each color add new line
  for (let colorNr = 1; colorNr < checkBoxValueCounter; colorNr += 1) {
    let text = document.createElement("text");
    let nameDiv = document.getElementById("nameDiv" + String(colorNr));
    text.innerHTML = String(colorNr) + "- " + nameDiv.innerHTML + " volume:";

    let sumpixels = listOfVols[colorNr];

    let text2 = document.createElement("text");
    text2.innerHTML +=
      " " + String(((sumpixels * volumeOneVoxel) / 1000).toFixed(3)) + " ml";
    text2.innerHTML += "<br>";
    text2.style.fontSize = "30px";

    let rgb = thectx.labels[colorNr].colormap;
    text.style.backgroundColor =
      "rgb(" +
      String(rgb[0]) +
      "," +
      String(rgb[1]) +
      "," +
      String(rgb[2]) +
      ")";
    text.style.fontSize = "30px";
    text.style.textShadow = "0px 0px 5px #ffffff";
    div.appendChild(text);
    div.appendChild(text2);
  }
};

var areaAnalysisButton = document.createElement("BUTTON");
areaAnalysisButton.style.padding = "0px 8px";
areaAnalysisButton.style.left = "140px";
areaAnalysisButton.style.top = "592px";
areaAnalysisButton.style.margin = "10px";
areaAnalysisButton.style.position = "absolute";
areaAnalysisButton.id = "mainButtonToAddSegValues";
//areaAnalysisButton.style.color = "blue"
areaAnalysisButton.style.fontSize = "12px";
areaAnalysisButton.innerHTML = "Calc. axes";


var axesText = document.createElement("text");
axesText.style.padding = "0px 8px";
axesText.style.left = "32px";
axesText.style.top = "576px";
axesText.style.margin = "10px";
axesText.style.position = "absolute";
axesText.id = "mainButtonToAddSegValues";
axesText.style.color = "white";
axesText.style.fontSize = "12px";
axesText.onclick = function() {
  axesText.innerHTML = " ";
};

document.getElementById("allText").appendChild(axesText);

areaAnalysisButton.onclick = function() {
  areaAnalysisExecute((label = thectx.labels.currentLabel));
};

//Calc. axes
function areaAnalysisExecute(label = 1) {
  //if written already, then delete it
  if (upperLeftInfoBar.innerHTML[0] == "l") {
    upperLeftInfoBar.innerHTML = "";
    return;
  }

  var drawLines = true;

  //1.selecting positive voxels. Next step is to select only outer voxels

  var slice = thectx.slider.value;
  var sliceSize = thectx.cols * thectx.rows;
  var sliceOffset = sliceSize * slice;

  var emptyArray = [];
  var firstRow = 100000000;
  var lastRow = 0;
  var firstCol = 100000000;
  var lastCol = 0;

  var saveLastCol = false;

  for (var row = 0; row < thectx.rows; row++) {
    var rowOffset = row * thectx.cols;

    firstCol = 100000000;
    lastCol = 0;
    saveLastCol = false;

    for (var col = 0; col < thectx.cols; col++) {
      var offset = sliceOffset + rowOffset + col;
      if (thectx.segData[offset] == label) {
        if (row <= firstRow) {
          //adds all in top row
          firstRow = row;
          emptyArray.push([row, col]);
        }
        if (row > lastRow) {
          //saves bottom row
          lastRow = row;
        }
        if (col < firstCol) {
          //adds first col
          firstCol = col;
          emptyArray.push([row, col]);
        }
        if (col > lastCol) {
          //saves last col
          lastCol = col;
          saveLastCol = true;
        }
      }
    }

    //adds last col
    if (saveLastCol) {
      emptyArray.push([row, lastCol]);
    }
  }

  //adds all in last row
  rowOffset = lastRow * thectx.cols;
  for (var col = 0; col < thectx.cols; col++) {
    var offset = sliceOffset + rowOffset + col;
    if (thectx.segData[offset] == label) {
      emptyArray.push([lastRow, col]);
    }
  }

  //remove duplicates
  emptyArray = removeDuplicates(emptyArray);
  function removeDuplicates(array) {
    return emptyArray.filter(((t = {}), a => !(t[a] = a in t)));
    //magic from https://stackoverflow.com/questions/44014799/javascript-how-to-remove-duplicate-arrays-inside-array-of-arrays
  }

  function measureDistanceAndAngle(x1, y1, x2, y2) {
    var x_diff = Math.abs(x1 - x2) + 1;
    var y_diff = Math.abs(y1 - y2) + 1;
    var hypothenuse = Math.sqrt(x_diff ** 2 + y_diff ** 2);

    var degrees;
    var deg90;
    //to get correct angle i y direction (including negative, -90 to 90).
    var y_diff = y1 - y2;
    if (y_diff >= 0) {
      y_diff += 1;
    } else {
      y_diff -= 1;
    }
    var DD = measureAngle(x_diff, y_diff);

    degrees = DD[0];
    deg90 = DD[1];

    return [hypothenuse, degrees, deg90];
  }

  function measureAngle(deltaY, deltaX) {
    //mixup between what is x and y. Seems to work now, from -90 to 90
    var rad = Math.atan2(deltaX, deltaY);
    var degrees = rad * (180 / Math.PI);
    var deg90;
    if (degrees > 0) {
      deg90 = degrees - 90;
    } else {
      deg90 = degrees + 90;
    }
    return [degrees, deg90];
  }

  //measure longest distance and get x and y locations
  //also measure angles between all points
  var longestDistance = 0;
  var longestDistanceAngle = 0;
  var x1, y1, x2, y2;

  var longList = [];
  for (var p = 0; p < emptyArray.length; p++) {
    var xy1 = emptyArray[p];
    for (var q = p; q < emptyArray.length; q++) {
      xy2 = emptyArray[q];
      var dist;
      var degrees;
      var deg90;

      var DDD = measureDistanceAndAngle(xy1[0], xy1[1], xy2[0], xy2[1]);
      dist = DDD[0];
      degrees = DDD[1];
      deg90 = DDD[2];
      longList.push([xy1[0], xy1[1], xy2[0], xy2[1], dist, degrees, deg90]);

      if (dist > longestDistance) {
        longestDistance = dist;
        longestDistanceAngle = degrees;
        x1 = xy1[0];
        y1 = xy1[1];
        x2 = xy2[0];
        y2 = xy2[1];
      }
    }
  }

  //draw long axis end points
  var imageData = uns_ctx_mask.createImageData(1, 1);
  imageData.data[0] = 50;
  imageData.data[1] = 255;
  imageData.data[2] = 100;
  imageData.data[3] = thectx.labels[1].opacity;
  uns_ctx_mask.putImageData(imageData, y1, x1);
  uns_ctx_mask.putImageData(imageData, y2, x2);

  if (drawLines) {
    uns_ctx_mask.beginPath();
    uns_ctx_mask.moveTo(y1, x1);
    uns_ctx_mask.lineTo(y2, x2);
    uns_ctx_mask.strokeStyle = "rgb(50 255 100)";
    uns_ctx_mask.stroke();
  }

  //find longest short axis length within 10 deg 90 deg to long axis longest
  var longestDistanceShortAxis = 0;
  var shortAxisDraw = false;

  for (var p = 0; p < longList.length; p++) {
    dist = longList[p][4];

    ShAxDegrees = longList[p][6];

    if (
      dist > longestDistanceShortAxis &&
      Math.abs(ShAxDegrees - longestDistanceAngle) < 2
    ) {
      longestDistanceShortAxis = dist;
      x1 = longList[p][0];
      y1 = longList[p][1];
      x2 = longList[p][2];
      y2 = longList[p][3];
      shortAxisDraw = true;
    }
  }

  //drawing short axis end points
  if (shortAxisDraw) {
    if (drawLines) {
      uns_ctx_mask.lineWidth = 1;
      uns_ctx_mask.shadowColor = "black";
      uns_ctx_mask.shadowBlur = 10;
      uns_ctx_mask.beginPath();
      uns_ctx_mask.moveTo(y1, x1);
      uns_ctx_mask.lineTo(y2, x2);
      uns_ctx_mask.strokeStyle = "rgb(200 100 0)";
      uns_ctx_mask.stroke();
    }

    var imageData = uns_ctx_mask.createImageData(1, 1);
    imageData.data[0] = 200;
    imageData.data[1] = 100;
    imageData.data[3] = thectx.labels[label].opacity;
    uns_ctx_mask.putImageData(imageData, y1, x1);
    uns_ctx_mask.putImageData(imageData, y2, x2);
  }

  pr_ctx.scale(scaleValue, scaleValue);
  pr_ctx.drawImage(uns_canvas_mask, translationX, translationY);
  pr_ctx.scale(1 / scaleValue, 1 / scaleValue);

  //upperLeftInfoBar.style.fontSize="30px"

  //axesText.innerHTML="long axis: "+String((longestDistance*thectx.niftiHeader["pixDims"][1]).toFixed(1)) + "mm"
  //axesText.innerHTML+="<br>"+"short axis: "+String((longestDistanceShortAxis*thectx.niftiHeader["pixDims"][1]).toFixed(1)) + "mm"
  upperLeftInfoBar.innerHTML =
    "long axis: " +
    String((longestDistance * thectx.niftiHeader["pixDims"][1]).toFixed(1)) +
    "mm";
  upperLeftInfoBar.innerHTML +=
    "<br>" +
    "short axis: " +
    String(
      (longestDistanceShortAxis * thectx.niftiHeader["pixDims"][1]).toFixed(1)
    ) +
    "mm";
}

function roiAreaAnalysis() {
  //this to exclude the line between points
  simpleDraw();
  simpleDraw();

  let div = visualizeMedSeg.createWindowDiv();

  var unseenRoi = uns_ctx_vis.getImageData(0, 0, thectx.cols, thectx.rows);
  var slice = thectx.slider.value;
  var sliceSize = thectx.cols * thectx.rows;
  var sliceOffset = sliceSize * slice;

  var x = Math.floor(posx / scaleValue - translationX);
  var y = Math.floor(posy / scaleValue - translationY);
  var centerValue = thectx.typedData[sliceOffset + y * thectx.cols + x];

  let counter = 0;
  for (var p = 0; p < unseenRoi.data.length; p += 4) {
    if (unseenRoi.data[p + 3] > 0) {
      counter += 1;
    }
  }

  let array = new Float32Array(counter);

  counter = 0;
  for (var p = 0; p < unseenRoi.data.length; p += 4) {
    if (unseenRoi.data[p + 3] > 0) {
      array[counter] = thectx.typedData[sliceOffset + p / 4];
      counter++;
    }
  }

  div.style.fontSize = "20px";

  div.innerHTML += "<b>Values within pointer/ROI:</b>";
  div.innerHTML += "<br>";
  div.innerHTML += "<br>";
  div.innerHTML += "Minimum: " + String(minMaxArray(array)[0]);
  div.innerHTML += "<br>";
  div.innerHTML += "Maximum: " + String(minMaxArray(array)[1]);
  div.innerHTML += "<br>";
  div.innerHTML += "Average: " + String(meanOfArray(array));
  div.innerHTML += "<br>";
  div.innerHTML += "Median: " + String(medianOfArray(array));
  div.innerHTML += "<br>";
  div.innerHTML += "Standard deviation: " + String(stdOfArray(array));
  div.innerHTML += "<br>";
  div.innerHTML += "Central voxel value: " + String(centerValue);
  div.innerHTML += "<br>";
  div.innerHTML += "<br>";

  let histogram = histogramCreateFromArray(
    array,
    20,
    "Histogram of image values within pointer"
  );
  div.appendChild(histogram);
}

function drawLineFuncLilSofieElisabeth() {
  let fromRow = globalCaliperVals.fromRow;
  let fromCol = globalCaliperVals.fromCol;
  let toRow = globalCaliperVals.toRow;
  let toCol = globalCaliperVals.toCol;

  var x_diff = Math.abs(fromCol - toCol) * thectx.niftiHeader["pixDims"][1];
  var y_diff = Math.abs(fromRow - toRow) * thectx.niftiHeader["pixDims"][2];
  var hypothenuse = Math.sqrt(x_diff ** 2 + y_diff ** 2);
  upperLeftInfoBar.innerHTML = String(hypothenuse.toFixed(1)) + "  mm";

  let canvasWidth = vis_canvas.width;
  let canvasHeight = vis_canvas.height;
  uns_ctx_mask.clearRect(0, 0, canvasWidth, canvasHeight);
  //pr_ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  vis_ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  uns_ctx_mask.lineWidth = 1;
  uns_ctx_mask.shadowColor = "black";
  uns_ctx_mask.shadowBlur = 10;
  uns_ctx_mask.beginPath();
  uns_ctx_mask.moveTo(fromCol, fromRow);
  uns_ctx_mask.lineTo(toCol, toRow);
  uns_ctx_mask.strokeStyle = "rgb(1,220,255)";
  uns_ctx_mask.stroke();
  //requestAnimationFrame(simpleDraw)
}

function drawRoiRectangle() {
  let fromRow = globalCaliperVals.fromRow;
  let fromCol = globalCaliperVals.fromCol;
  let toRow = globalCaliperVals.toRow;
  let toCol = globalCaliperVals.toCol;

  let canvasWidth = vis_canvas.width;
  let canvasHeight = vis_canvas.height;

  uns_ctx_mask.clearRect(0, 0, canvasWidth, canvasHeight);
  vis_ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  uns_ctx_mask.lineWidth = 1;
  uns_ctx_mask.shadowColor = "black";
  uns_ctx_mask.shadowBlur = 10;
  uns_ctx_mask.beginPath();
  uns_ctx_mask.rect(fromCol, fromRow, toCol - fromCol, toRow - fromRow);
  uns_ctx_mask.strokeStyle = "rgb(1,220,255)";
  uns_ctx_mask.stroke();
}

let arrayAnalysisMedSeg = {};

arrayAnalysisMedSeg.imageValsOfSeg = function(imageData, segData, maskVal) {
  //create and return a typedArray of imageData values where segData==labelVal
  //imageData and segData must be same length

  let typedArrayOfData; //this will be returned

  //first count nr. of relevant segmented voxels
  let length = segData.length;
  let counter = 0;
  for (let p = 0; p < length; p++) {
    if (segData[p] == maskVal) {
      counter++;
    }
  }

  //create the array of images values within the segmentation
  typedArrayOfData = new Float32Array(counter);
  counter = 0;
  for (let p = 0; p < length; p++) {
    if (segData[p] == maskVal) {
      typedArrayOfData[counter] = imageData[p];
      counter++;
    }
  }

  return typedArrayOfData;
};
arrayAnalysisMedSeg.minOfArray = function(array) {
  let min = array[0];
  let total = array.length;
  for (let i = 1; i < total; i++) {
    let v = array[i];
    if (v < min) {
      min = array[i];
    }
  }
  return min;
};
arrayAnalysisMedSeg.maxOfArray = function(array) {
  let max = array[0];
  let total = array.length;
  for (let i = 1; i < total; i++) {
    let v = array[i];
    if (v > max) {
      max = array[i];
    }
  }
  return max;
};
arrayAnalysisMedSeg.medianOfArray = function(array) {
  let newArray = new Float32Array(array);
  newArray.sort();
  let midVal = newArray.length / 2 - 0.5;
  if (midVal % 1 == 0) {
    return newArray[midVal];
  } else {
    return (newArray[midVal - 0.5] + newArray[midVal + 0.5]) / 2;
  }
};
arrayAnalysisMedSeg.stdOfArray = function(array) {
  let n = array.length;
  let mean = array.reduce((a, b) => a + b) / n;
  let s = Math.sqrt(
    array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
  return s;
};

let visualizeMedSeg = {};

visualizeMedSeg.createWindowDiv = function() {
  //returns div that stuff can be added to

  let div;
  let background;

  var checkIfExists = document.getElementById("windowDivMedSeg");
  if (checkIfExists != null) {
    checkIfExists.remove();
  }

  //adding the darkened background which covers whole page
  //will add everyting to the background, it is removed on background click
  background = document.createElement("div");
  background.id = "windowDivMedSeg";
  background.style.position = "fixed";
  background.style.left = "0%";
  background.style.top = "0%";
  background.style.width = "100%";
  background.style.height = "100%";
  background.style.backgroundColor = "rgb(0,0,0,0.4)";
  background.style.zIndex = "100";
  document.body.appendChild(background);
  background.onclick = function() {
    background.remove();
  };

  //adding the centered foreground
  div = document.createElement("div");
  div.style.position = "fixed";
  div.style.left = "8%";
  div.style.top = "8%";
  div.style.width = "80%";
  div.style.height = "80%";
  div.style.padding = "2%";
  div.style.border = "thick double #000000";

  div.style.backgroundColor = "rgb(180,180,180,0.99)";
  background.appendChild(div);
  div.onclick = function(evt) {
    evt.stopPropagation(); //so that it doesn't click away
  };
  div.style.overflow = "auto"; //scrollable
  return div;
};

function histogramCreateFromArray(array, bins, title) {
  //changes the array by sorting

  //returns div

  //TO DO:
  //need a place to put it
  //add selection of min, max and bins

  //defining variables

  let binLimits;
  let hisData;
  let labelsToChart;
  let bgcolorToChart;
  let canvas;

  array.sort();
  let min = array[0];
  let max = array[array.length - 1];
  let diff;

  function createChart() {
    binLimits = [];
    hisData = [];
    labelsToChart = [];
    bgcolorToChart = [];
    diff = max - min;

    //create the limits of the selected nr of bins
    for (let bin = 0; bin < bins; bin++) {
      let diffInBin = diff / bins;
      let minInBin = Math.floor(min + diffInBin * bin);
      let maxInBin = Math.floor(min + diffInBin * (bin + 1));

      binLimits[bin] = [minInBin, maxInBin];

      //this to prepare hisData to have correct nr. of entries
      hisData.push(0);

      //to get a long list of the same color to give to chart.js
      bgcolorToChart.push("blue");
    }

    //fill hisData, which is the summed nr. of HU values in all bins
    //assumes sorted data from 0 and up
    let bin = 0;
    let binMax = binLimits[bin][1];
    let binMin = binLimits[bin][0];

    for (let p = 0; p < array.length; p++) {
      let d = array[p];

      while (d > binMax && bin < bins - 1) {
        bin++;
        binMax = binLimits[bin][1];
        binMin = binLimits[bin][0];
      }
      if (d >= binMin && d <= binMax) {
        hisData[bin] = parseInt(hisData[bin]) + 1;
      }
    }

    //create labels for voxelVal ranges
    for (let bin = 0; bin < bins; bin++) {
      labelsToChart.push(
        String(binLimits[bin][0]) + " - " + String(binLimits[bin][1])
      );
    }

    //creation of hist with Chart.js
    canvas = document.createElement("canvas");
    //document.getElementById("allText").appendChild(canvas)

    new Chart(canvas, {
      type: "bar",
      data: {
        labels: labelsToChart,
        datasets: [
          {
            categoryPercentage: 1.0,
            barPercentage: 1.0,
            label: "Nr. of voxels",
            backgroundColor: bgcolorToChart,
            data: hisData
          }
        ]
      },
      options: {
        legend: { display: false },
        title: {
          display: true,
          text: title
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false
              }
            }
          ]
        }
      }
    });
  }
  createChart();
  //whole = div
  //holder for canvas = chartContainer

  let div = document.createElement("div");
  let chartContainer = document.createElement("div");
  chartContainer.style.width = "70%";

  chartContainer.appendChild(canvas);
  div.appendChild(chartContainer);

  ////////BINS///////
  let binsSpan = document.createElement("span");
  binsSpan.style.fontSize = "15px";
  binsSpan.innerHTML = "Bins:";
  let binsInput = document.createElement("input");
  binsInput.value = 20;
  binsInput.style.width = "25px";

  binsInput.addEventListener("input", function() {
    canvas.remove();
    canvas = document.createElement("canvas");
    bins = parseInt(binsInput.value);
    createChart();
    chartContainer.appendChild(canvas);
  });

  div.appendChild(binsSpan);
  div.appendChild(binsInput);

  let spaceSpan = document.createElement("text");
  spaceSpan.innerHTML = "\xa0\xa0\xa0\xa0\xa0\xa0\xa0";
  div.appendChild(spaceSpan);

  ////////MIN///////
  let minSpan = document.createElement("span");
  minSpan.style.fontSize = "15px";
  minSpan.innerHTML = "Minimum:";
  let minInput = document.createElement("input");
  minInput.value = min;
  minInput.style.width = "35px";

  minInput.addEventListener("input", function() {
    canvas.remove();
    canvas = document.createElement("canvas");
    min = parseInt(minInput.value);
    createChart();
    chartContainer.appendChild(canvas);
  });

  div.appendChild(minSpan);
  div.appendChild(minInput);

  spaceSpan = document.createElement("text");
  spaceSpan.innerHTML = "\xa0\xa0\xa0\xa0\xa0\xa0\xa0";
  div.appendChild(spaceSpan);

  ///////MAX////////

  let maxSpan = document.createElement("span");
  maxSpan.style.fontSize = "15px";
  maxSpan.innerHTML = "Maximum:";
  let maxInput = document.createElement("input");
  maxInput.value = max;
  maxInput.style.width = "35px";

  maxInput.addEventListener("input", function() {
    canvas.remove();
    canvas = document.createElement("canvas");
    max = parseInt(maxInput.value);
    createChart();
    chartContainer.appendChild(canvas);
  });

  div.appendChild(maxSpan);
  div.appendChild(maxInput);

  return div;
}

function histogramCreate(imData, segData, bins, maskVal) {
  //assumes imData as same kind of array as segData
  //returns canvas

  //TO DO:
  //need a place to put it
  //add selection of min, max and bins

  //defining variables
  let binLimits = [];
  let hisData = [];
  let labelsToChart = [];
  let bgcolorToChart = [];

  typedArrayOfData = arrayAnalysisMedSeg.imageValsOfSeg(
    imData,
    segData,
    maskVal
  );
  typedArrayOfData.sort();

  let min = typedArrayOfData[0];
  let max = typedArrayOfData[typedArrayOfData.length - 1];
  let diff = max - min;

  //create the limits of the selected nr of bins
  for (let bin = 0; bin < bins; bin++) {
    let diffInBin = diff / bins;
    let minInBin = Math.floor(min + diffInBin * bin);
    let maxInBin = Math.floor(min + diffInBin * (bin + 1));

    binLimits[bin] = [minInBin, maxInBin];

    //this to prepare hisData to have correct nr. of entries
    hisData.push(0);

    //to get a long list of the same color to give to chart.js
    bgcolorToChart.push("blue");
  }

  //fill hisData, which is the summed nr. of HU values in all bins
  //assumes sorted data from 0 and up
  let bin = 0;
  let binMax = binLimits[bin][1];

  for (let p = 0; p < typedArrayOfData.length; p++) {
    let d = typedArrayOfData[p];

    if (d <= binMax) {
      hisData[bin] = parseInt(hisData[bin]) + 1;
    } else {
      bin++;
      binMax = binLimits[bin][1];
    }
  }

  //create labels for voxelVal ranges
  for (let bin = 0; bin < bins; bin++) {
    labelsToChart.push(
      String(binLimits[bin][0]) + "-" + String(binLimits[bin][1])
    );
  }

  //creation of hist with Chart.js
  let canvas = document.createElement("canvas");
  //document.getElementById("allText").appendChild(canvas)

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: labelsToChart,
      datasets: [
        {
          label: "Nr. of voxels",
          backgroundColor: bgcolorToChart,
          data: hisData
        }
      ]
    },
    options: {
      legend: { display: false },
      title: {
        display: true,
        text: "Histogram of HU values in mask " + String(maskVal)
      }
    }
  });

  return canvas;
}

arrayAnalysisMedSeg.rotateColPlane = function(array, slices, rows, cols) {
  //apparently rotates col plane, I thought it would rotate row plane...

  let total = array.length;
  if (slices * rows * cols != total) {
    console.log("wrong info - slices * rows * cols doesn't match array length");
    return array;
  }

  let newArray = array.slice();

  //rows stays rows
  //cols become slices
  //slices become cols

  let rowsXcols = rows * cols;
  let newRowsXcols = rows * slices;

  let slOffset, rowOffset, newSlOffset, newRowOffset;

  for (let sl = 0; sl < slices; sl++) {
    slOffset = sl * rowsXcols;
    for (let row = 0; row < rows; row++) {
      rowOffset = row * cols;
      for (let col = 0; col < cols; col++) {
        newSlOffset = col * newRowsXcols;
        newRowOffset = row * slices;

        let origPos = slOffset + rowOffset + col;
        let newPos = newSlOffset + newRowOffset + sl;

        newArray[newPos] = array[origPos];
      }
    }
  }
  return newArray;
};

arrayAnalysisMedSeg.rotateRowPlane = function(array, slices, rows, cols) {
  //apparently rotates row plane, I thought it would rotate col plane...

  let total = array.length;
  if (slices * rows * cols != total) {
    console.log("wrong info - slices * rows * cols doesn't match array length");
    return array;
  }

  let newArray = array.slice();

  //cols stays cols
  //rows become slices
  //slices become rows

  let rowsXcols = rows * cols;
  let newRowsXcols = slices * cols;

  let slOffset, rowOffset, newSlOffset, newRowOffset;

  for (let sl = 0; sl < slices; sl++) {
    slOffset = sl * rowsXcols;
    for (let row = 0; row < rows; row++) {
      rowOffset = row * cols;
      for (let col = 0; col < cols; col++) {
        newSlOffset = row * newRowsXcols;
        newRowOffset = sl * cols;

        let origPos = slOffset + rowOffset + col;
        let newPos = newSlOffset + newRowOffset + col;

        newArray[newPos] = array[origPos];
      }
    }
  }
  return newArray;
};

thectx.rotColAxis = function() {
  let slices = parseInt(this.slider.max) + 1;
  let rows = this.rows;
  let cols = this.cols;

  this.typedData = arrayAnalysisMedSeg.rotateColPlane(
    this.typedData,
    slices,
    rows,
    cols
  );
  this.segData = arrayAnalysisMedSeg.rotateColPlane(
    this.segData,
    slices,
    rows,
    cols
  );

  this.cols = slices;
  this.slider.max = cols - 1;
  this.sliceSize = this.cols * this.rows;

  let tempPixDims = this.niftiHeader.pixDims[1];
  this.niftiHeader.pixDims[1] = this.niftiHeader.pixDims[3];
  this.niftiHeader.pixDims[3] = tempPixDims;

  this.slider.value = parseInt(this.slider.max / 2);
};

thectx.rotRowAxis = function() {
  let slices = parseInt(this.slider.max) + 1;
  let rows = this.rows;
  let cols = this.cols;

  this.typedData = arrayAnalysisMedSeg.rotateRowPlane(
    this.typedData,
    slices,
    rows,
    cols
  );
  this.segData = arrayAnalysisMedSeg.rotateRowPlane(
    this.segData,
    slices,
    rows,
    cols
  );

  this.rows = slices;
  this.slider.max = rows - 1;
  this.sliceSize = this.cols * this.rows;

  let tempPixDims = this.niftiHeader.pixDims[2];
  this.niftiHeader.pixDims[2] = this.niftiHeader.pixDims[3];
  this.niftiHeader.pixDims[3] = tempPixDims;

  this.slider.value = parseInt(this.slider.max / 2);
};

thectx.rotRowAxisShow = function(axis, show = true) {
  // 0 = axial/no rotation
  // 1 = row axis/coronal
  // 2 = col axis/sagittal

  //need to make this reset before saving mask

  let rot180Deg = function() {
    rotationCSS += 90;
    if (rotationCSS == 360) {
      rotationCSS = 0;
    }
    rot90CSS();
  };

  //if currenttly rotated and the desired rotation is different
  if (thectx.rotationAxis > 0 && thectx.rotationAxis != axis) {
    //resetting. This will be activated when rotated, but choosing axis==0
    if (thectx.rotationAxis == 1) {
      thectx.rotRowAxis();
      rot180Deg();
      mirrorCSS();
    }
    if (thectx.rotationAxis == 2) {
      thectx.rotColAxis();
      thectx.rotRowAxis();
      rot180Deg();
      mirrorCSS();
    }
  } else if (axis == 0) {
    return;
  }

  if (axis == 1 && thectx.rotationAxis != 1) {
    thectx.rotRowAxis();
    rot180Deg();
    mirrorCSS();
  } else if (axis == 2 && thectx.rotationAxis != 2) {
    thectx.rotRowAxis();
    thectx.rotColAxis();
    rot180Deg();
    mirrorCSS();
  }

  thectx.rotationAxis = axis;
  thectx.memorySeg = new Int8Array(thectx.cols * thectx.rows).fill(0);

  if (show) {
    sizeCanvases();
    fitToScreen();
    requestAnimationFrame(simpleDrawCanvas);
  }
};
