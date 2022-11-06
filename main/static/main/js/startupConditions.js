//next add so that you can write ww=350,wl=50,sl=30 in address bar for example

let inputQuery = document.location.search;
let hasLoadedNifti = false;

var quizMode = false;
var quizInitialized = false;
var quizNextNr, quizQuestionsRemaining, quizScore;
var quizStartTime;

function quizAbort() {
  resetPointerSize();
  quizMode = false;
  quizInitialized = false;

  for (let v = 1; v < checkBoxValueCounter; v++) {
    thectx.labels[v].opacity = 255;
  }
  upperLeftInfoBar.innerHTML = "";
  requestAnimationFrame(simpleDrawCanvas);
}

function quizQuestion() {
  if (quizQuestionsRemaining.length > 0) {
    quizNextNr = quizQuestionsRemaining.pop();
    let nameDiv = document.getElementById("nameDiv" + String(quizNextNr));
    upperLeftInfoBar.innerHTML += "Click on " + nameDiv.innerHTML;
  } else {
    totalTime = Date.now() - quizStartTime;
    upperLeftInfoBar.innerHTML +=
      "Your total time is " +
      String(Math.round(totalTime / 100) / 10) +
      " seconds. <br>";
    upperLeftInfoBar.innerHTML += "Thanks for playing! :) <br>";
    upperLeftInfoBar.innerHTML += "Click anywhere to start over.";
    quizInitialized = false;
  }
}

function quizGuess(posx, posy) {
  if (!quizInitialized) {
    quizInit();
    return;
  }

  let x = Math.floor(posx / scaleValue - translationX);
  let y = Math.floor(posy / scaleValue - translationY);

  let slice = thectx.slider.value;
  let sliceSize = thectx.cols * thectx.rows;
  let sliceOffset = sliceSize * slice;

  let maskValue = thectx.segData[sliceOffset + y * thectx.cols + x];

  let totalQuestions = checkBoxValueCounter - 1;
  let nrOfGuesses = totalQuestions - quizQuestionsRemaining.length;

  if (maskValue == quizNextNr) {
    quizScore += 1;
    let percentageCorrect = Math.round((quizScore / nrOfGuesses) * 100);
    upperLeftInfoBar.innerHTML =
      "Yes! You are " +
      String(percentageCorrect) +
      "% correct with " +
      String(quizQuestionsRemaining.length) +
      " questions remaining.<br>";
    thectx.labels[quizNextNr].opacity = 255;
    requestAnimationFrame(simpleDrawCanvas);
  } else {
    let percentageCorrect = Math.round((quizScore / nrOfGuesses) * 100);
    upperLeftInfoBar.innerHTML =
      "No! You are " +
      String(percentageCorrect) +
      "% correct with " +
      String(quizQuestionsRemaining.length) +
      " questions remaining.<br>";
    thectx.labels[quizNextNr].opacity = 255;
    requestAnimationFrame(simpleDrawCanvas);
  }
  quizQuestion();
}

function quizInit() {
  quizInitialized = true;
  let pixelValChBox = document.getElementById("pixelValChBox");
  pixelValChBox.checked = false;
  pixelValShowAct = false;
  upperLeftInfoBar.innerHTML = "";
  sizeOfCircle = 0.0000011111111;
  document.getElementById("pointerSizeText").value = sizeOfCircle;
  //for each mask, make opacity = 0

  quizQuestionsRemaining = [];
  quizScore = 0;

  for (let p = 1; p < checkBoxValueCounter; p++) {
    quizQuestionsRemaining.push(p);
    thectx.labels[p].opacity = 0;
  }
  requestAnimationFrame(simpleDrawCanvas);

  function shuffle(array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  shuffle(quizQuestionsRemaining);

  alert("Press Ok to start");
  quizStartTime = Date.now();
  quizQuestion();
}

function educationalLoad(imgP, mskP, nameP, sliceNr = false) {
  //first look for more commands such as window width, level and sliceNr
  let splitQuery = inputQuery.split(";");
  let windowWidth, windowLevel;
  for (let index = 0; index < splitQuery.length; index++) {
    if (splitQuery[index].slice(0, 2) == "ww") {
      windowWidth = splitQuery[index].split("=")[1];
    }
    if (splitQuery[index].slice(0, 2) == "wl") {
      windowLevel = splitQuery[index].split("=")[1];
    }
    if (splitQuery[index].slice(0, 2) == "sl") {
      sliceNr = splitQuery[index].split("=")[1];
    }
    if (splitQuery[index].slice(0, 6) == "mirror") {
      startUpConditions.mirror = true;
    }
    if (splitQuery[index].slice(0, 6) == "rot180") {
      startUpConditions.rot180 = true;
    }
    if (splitQuery[index].slice(0, 4) == "quiz") {
      quizMode = true;
    }
  }
  if (windowWidth && windowLevel) {
    startUpConditions.intensBaseline = windowLevel - windowWidth / 2;
    startUpConditions.intensDiv = windowWidth / 255;
  }

  let pixelValChBox = document.getElementById("pixelValChBox");
  pixelValChBox.checked = true;
  pixelValShowAct = true;

  upperLeftInfoBar.style.fontSize = "20px";

  loadDemo(imgP);
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
    if (sliceNr) {
      thectx.slider.value = sliceNr;
    }
    loadDemo(mskP, (knownMask = true));
    fetch(nameP).then(function(response) {
      response.blob().then(function(data) {
        readNameFile(data);
      });
    });
  });
}

if (inputQuery.slice(0, 14) == "?liversegments") {
  let imagePath = "./demoVolumes/educational/liverSegments/img.nii.gz";
  let maskPath = "./demoVolumes/educational/liverSegments/msk.nii.gz";
  let namesPath = "./demoVolumes/educational/liverSegments/conf.txt";
  let sliceNr = 62;

  var windowWidth = 450;
  var windowLevel = 50;
  startUpConditions.intensBaseline = windowLevel - windowWidth / 2;
  startUpConditions.intensDiv = windowWidth / 255;

  educationalLoad(imagePath, maskPath, namesPath, sliceNr);
} else if (inputQuery.slice(0, 15) == "?deepneckspaces") {
  let imagePath = "./demoVolumes/educational/deepNeckSpaces/img.nii.gz";
  let maskPath = "./demoVolumes/educational/deepNeckSpaces/msk.nii.gz";
  let namesPath = "./demoVolumes/educational/deepNeckSpaces/conf.txt";
  let sliceNr = 50;

  var windowWidth = 350;
  var windowLevel = 60;
  startUpConditions.intensBaseline = windowLevel - windowWidth / 2;
  startUpConditions.intensDiv = windowWidth / 255;

  educationalLoad(imagePath, maskPath, namesPath, sliceNr);
} else if (inputQuery.slice(0, 12) == "?neckvessels") {
  let imagePath = "./demoVolumes/educational/neckVessels/img.nii.gz";
  let maskPath = "./demoVolumes/educational/neckVessels/msk.nii.gz";
  let namesPath = "./demoVolumes/educational/neckVessels/conf.txt";
  let sliceNr = 30;

  var windowWidth = 350;
  var windowLevel = 60;
  startUpConditions.intensBaseline = windowLevel - windowWidth / 2;
  startUpConditions.intensDiv = windowWidth / 255;

  educationalLoad(imagePath, maskPath, namesPath, sliceNr);
} else if (inputQuery.slice(0, 11) == "?peritoneum") {
  let imagePath = "./demoVolumes/educational/peritoneum/img.nii.gz";
  let maskPath = "./demoVolumes/educational/peritoneum/msk.nii.gz";
  let namesPath = "./demoVolumes/educational/peritoneum/conf.txt";
  let sliceNr = 35;
  rot90CSS();
  rot90CSS();
  var windowWidth = 450;
  var windowLevel = 50;
  startUpConditions.intensBaseline = windowLevel - windowWidth / 2;
  startUpConditions.intensDiv = windowWidth / 255;
  educationalLoad(imagePath, maskPath, namesPath, sliceNr);
} else if (inputQuery.slice(0, 14) == "?urinarysystem") {
  let imagePath = "./demoVolumes/educational/urinarySystem/img.nii.gz";
  let maskPath = "./demoVolumes/educational/urinarySystem/msk.nii.gz";
  let namesPath = "./demoVolumes/educational/urinarySystem/conf.txt";
  let sliceNr = 210;

  var windowWidth = 450;
  var windowLevel = 50;
  startUpConditions.intensBaseline = windowLevel - windowWidth / 2;
  startUpConditions.intensDiv = windowWidth / 255;

  educationalLoad(imagePath, maskPath, namesPath, sliceNr);
} else if (inputQuery.slice(0, 21) == "?necklymphnoderegions") {
  let imagePath = "./demoVolumes/educational/neckLymphNodeRegions/img.nii.gz";
  let maskPath = "./demoVolumes/educational/neckLymphNodeRegions/msk.nii.gz";
  let namesPath = "./demoVolumes/educational/neckLymphNodeRegions/conf.txt";
  let sliceNr = 40;

  var windowWidth = 350;
  var windowLevel = 60;
  startUpConditions.intensBaseline = windowLevel - windowWidth / 2;
  startUpConditions.intensDiv = windowWidth / 255;

  educationalLoad(imagePath, maskPath, namesPath, sliceNr);
} else if (inputQuery.slice(0, 9) == "?kneedeep") {
  /* else if (inputQuery.slice(0,6)=="?touch"){

    //FILL BUTTON
    let buttonFillColor = document.createElement("button")
    buttonFillColor.innerText="Activate fill"
    buttonFillColor.setAttribute("id", "buttonFillColor")
    buttonFillColor.style.position="absolute"
    buttonFillColor.style.top = "220px"
    buttonFillColor.addEventListener("click", function(){
        buttonFillColor.innerText="Fill activated"
    })
    document.getElementById("buttonsForTouch").appendChild(buttonFillColor)
    
    //SMALL POINTERSIZE
    document.getElementById("pointerSizeText").value = 0.1
    sizeOfCircle = document.getElementById("pointerSizeText").value
    
    //DG button
    let buttonDG = document.createElement("button")
    buttonDG.innerText="Activate DeepGrow"
    buttonDG.style.position="absolute"
    buttonDG.style.top = "220px"
    buttonDG.style.left = "100px"
    buttonDG.addEventListener("click", function(){
        DGInitialized = !DGInitialized
        
        if (DGInitialized){
            buttonDG.innerText="DeepGrow active"
        }
        else{
            buttonDG.innerText="DeepGrow inactive"
        }

    })
    document.getElementById("buttonsForTouch").appendChild(buttonDG)
    
    //2d predict button
    //predict slice below/above


} */
  let div = document.getElementById("kneeDeepDiv");
  div.style.display = "";
  buttonpress();
  buttonpress();
  buttonpress();

  //selectKneeDeepModel()
  selectKneeDeepModelv5();
  //selectKneeDeepGrade3Model()
} else if (inputQuery.slice(0, 10) == "?bodysegai") {
  buttonpress();
  buttonpress();

  document.getElementById("nameDiv1").innerHTML = "Muscle";
  document.getElementById("nameDiv2").innerHTML = "IMAT";
  document.getElementById("nameDiv3").innerHTML = "VAT";
  document.getElementById("nameDiv4").innerHTML = "SAT";

  document.getElementById("divColor1").style.backgroundColor = "rgb(255,14,14)";
  document.getElementById("divColor2").style.backgroundColor = "rgb(0,255,64)";
  document.getElementById("divColor3").style.backgroundColor = "rgb(244,227,1)";
  document.getElementById("divColor4").style.backgroundColor =
    "rgb(15,239,255)";

  document.getElementById("colorpicker1").value = "#ff0e0e";
  document.getElementById("colorpicker2").value = "#00ff40";
  document.getElementById("colorpicker3").value = "#f4e301";
  document.getElementById("colorpicker4").value = "#0fefff";

  thectx.labels[1].colormap = [255, 14, 14];
  thectx.labels[2].colormap = [0, 255, 64];
  thectx.labels[3].colormap = [244, 227, 1];
  thectx.labels[4].colormap = [15, 239, 255];

  selectBodySegAIModel();
} else if (inputQuery.slice(0, 4) == "?psd") {
  document.getElementById("nameDiv1").innerHTML = "PSD";

  selectPSDModel();
} else if (inputQuery.length > 1) {
  let foldername = inputQuery.split(";")[0].slice(1);

  let imagePath = "./demoVolumes/educational/" + foldername + "/img.nii.gz";
  let maskPath = "./demoVolumes/educational/" + foldername + "/msk.nii.gz";
  let namesPath = "./demoVolumes/educational/" + foldername + "/conf.txt";

  educationalLoad(imagePath, maskPath, namesPath, 0);
}

var lymphNodeStartupActivate = false;
startUpConditions.loadDeepGrow = false;

if (lymphNodeStartupActivate) {
  startUpConditions.hideAllText = true;
  startUpConditions.activateDG = true;
  startUpConditions.activateModel = "DGV2LymphNodeModel";
  startUpConditions.openCT = true;
  startUpConditions.demoText = true;
}

function isCanvasSupported() {
  var elem = document.createElement("canvas");
  return !!(elem.getContext && elem.getContext("2d"));
}
if (!isCanvasSupported()) {
  let span = document.createElement("span");
  span.style.fontSize = "200%";
  span.style.backgroundColor = "rgb(255,255,255)";
  let text = document.createTextNode(
    "Your browser seems to not support Canvas. MedSeg works best with Chrome."
  );
  span.appendChild(text);
  document.body.appendChild(span);
}

if (startUpConditions.activateModel) {
  if (startUpConditions.activateModel == "DGV2LymphNodeModel") {
    selectDGV2LymphNodes();
  }
} else {
  if (startUpConditions.loadDeepGrow) {
    selectDeepGrow();
  }
}

if (startUpConditions.hideAllText) {
  document.getElementById("allText").style.visibility = "hidden";
}

if (startUpConditions.activateDG) {
  DGInitialized = true;
  histryPointerSize = 20;

  thectx.labels.dgPos.opacity = parseInt(0.5 * 255);
  thectx.labels.dgNeg.opacity = parseInt(0.5 * 255);
  sizeOfCircle = 5;
  document.getElementById("pointerSizeText").value = 5;
}

if (startUpConditions.openCT) {
  loadDemo("./demoCT.nii.gz");

  startUpConditions.intensBaseline = -185;
  startUpConditions.intensDiv = 1.85;
}

if (startUpConditions.demoText) {
  let text = document.createTextNode(
    "Requires Google Chrome to work and works best on computers with dedicated GPUs."
  );
  document.body.appendChild(text);
  text = document.createElement("br");
  document.body.appendChild(text);

  text = document.createTextNode(
    "More information will be added and a more suitable CT abdomen chosen."
  );
  document.body.appendChild(text);
  text = document.createElement("br");
  document.body.appendChild(text);
  text = document.createTextNode(
    "In short: move mouse over interesting structure (resembling a lymph node), press the left mouse button and hold it pressed until segmentation in blue appears. While holding the mouse pressed, you can move around the mouse or press and hold buttons 'w' or 's' to make the point larger or smaller. Wheel scroll changes slices and 'Delete' removes segmentation on current slice."
  );
  document.body.appendChild(text);

  text = document.createElement("br");
  document.body.appendChild(text);
  text = document.createTextNode(
    "If you have any questions, I would be happy to respond through email (sakinis.tomas@gmail.com). Thanks for visiting and sorry about the current premature status."
  );
  document.body.appendChild(text);
}

//to add warning before leaving below. Not sure how to check if person has been
//segmenting

/* window.addEventListener("beforeunload", function (e) {
    var confirmationMessage = 'It looks like you have been editing something. '
                            + 'If you leave before saving, your changes will be lost.';

    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
}); */
