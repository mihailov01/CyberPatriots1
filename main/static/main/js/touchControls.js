function touchCreateImage() {
  let image = document.createElement("IMG");
/*   image.setAttribute("src", "./images/touchFinger.png");
 */  image.setAttribute("title", "Touchscreen functions");
  image.style.position = "absolute";
  image.style.right = "10%";
  image.style.top = "155px";
  image.style.width = "45px";
  image.setAttribute("class", "clickableImage");
/*   image.setAttribute("id", "touchModalBtn");
 */  //image.style.margin = "0px 0px -2px 20px"

  let allText = document.getElementById("allText");
  allText.appendChild(image);
}
touchCreateImage();

let touchSetting = "paint";
function touchCreateModal() {
  //TOUCH MODAL + BACKGROUND
  let touchModal = document.createElement("div");
  touchModal.setAttribute("class", "modal");
  touchModal.setAttribute("id", "touchModal");
  document.body.appendChild(touchModal);

  let touchModalContent = document.createElement("div");
  touchModalContent.setAttribute("class", "modal-content");
  touchModal.appendChild(touchModalContent);

  let closeSpan = document.createElement("span");
  closeSpan.setAttribute("class", "close");
  closeSpan.setAttribute("id", "closeTouchModal");
  closeSpan.innerHTML += "&times";
  touchModalContent.appendChild(closeSpan);

  addText("<h1>Touchscreen controls (for tablets, phones etc.)</h1>");
  addText("<br>");
  addText("<b>Touch mode:</b>");

  //BUTTONS
  let buttonPercentSize = "10%";

  ///////////////CREATE BUTTON FUCNTION////////////
  createNewButton = function(text, title, functionToRun) {
    button = document.createElement("button");
    button.innerText = text;
    button.setAttribute("class", "modalButton");
    button.setAttribute("title", title);
    button.style.width = buttonPercentSize;
    button.style.height = buttonPercentSize;
    button.style.padding = "0px";
    button.addEventListener("click", functionToRun);
    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
    touchModalContent.appendChild(button);
  };

  ////////////////PAINT BUTTON/////////////////
  //change size, layout and functions to activate/deactivate
  let paintButton = document.createElement("button");
  paintButton.innerText = "Paint";
  paintButton.setAttribute("class", "modalButton");
  paintButton.setAttribute("title", "Paint");
  paintButton.style.width = buttonPercentSize;
  paintButton.style.height = buttonPercentSize;

  paintButton.addEventListener("click", function(evt) {
    evt.preventDefault();
    touchSetting = "paint";

    //evt. deactivate DG
    if (DGInitialized) {
      deactivateDGTouch();
    }

    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
    mouseUpFunction(evt);
  });

  touchModalContent.appendChild(paintButton);

  /////////////////ERASE BUTTON//////////////////
  let eraseButton = document.createElement("button");
  eraseButton.innerText = "Erase";
  eraseButton.setAttribute("class", "modalButton");
  eraseButton.setAttribute("title", "Erase");
  //eraseButton.style.fontSize = "1000%"
  eraseButton.style.width = buttonPercentSize;
  eraseButton.style.height = buttonPercentSize;

  eraseButton.addEventListener("click", function(evt) {
    evt.preventDefault();
    touchSetting = "erase";

    //evt. deactivate DG
    if (DGInitialized) {
      deactivateDGTouch();
    }

    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
  });
  touchModalContent.appendChild(eraseButton);

  /////////////////DG BUTTON//////////////////
  let DGButton = document.createElement("button");
  DGButton.innerText = "DeepGrow";
  DGButton.setAttribute("class", "modalButton");
  DGButton.setAttribute("title", "Erase");
  DGButton.style.width = buttonPercentSize;
  DGButton.style.height = buttonPercentSize;

  DGButton.addEventListener("click", function(evt) {
    evt.preventDefault();
    if (deepGrowModel.name == "none") {
      alert("You must load a DeepGrow model first");
      return;
    }

    //activate so that it's as if mouse left button is pressed
    touchSetting = "paint";

    //DG stuff
    DGInitialized = true;
    histryPointerSize = sizeOfCircle;
    sizeOfCircle = 5 * (thectx.cols / 512);
    document.getElementById("pointerSizeText").value = sizeOfCircle.toFixed(2);
    draw(vis_canvas, posx, posy);

    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
  });

  touchModalContent.appendChild(DGButton);

  /////////////////WINDOWING BUTTON//////////////////
  let windowingButton = document.createElement("button");
  windowingButton.innerText = "Windowing";
  windowingButton.setAttribute("class", "modalButton");
  windowingButton.setAttribute("title", "Windowing");
  windowingButton.style.width = buttonPercentSize;
  windowingButton.style.height = buttonPercentSize;

  windowingButton.addEventListener("click", function(evt) {
    evt.preventDefault();

    //activate so that it's as if mouse left button is pressed
    touchSetting = "windowing";

    //evt. deactivate DG
    if (DGInitialized) {
      deactivateDGTouch();
    }

    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
  });

  touchModalContent.appendChild(windowingButton);

  /////////////////ZOOM BUTTON//////////////////
  let zoomButton = document.createElement("button");
  zoomButton.innerText = "Zoom";
  zoomButton.setAttribute("class", "modalButton");
  zoomButton.setAttribute("title", "Zoom");
  zoomButton.style.width = buttonPercentSize;
  zoomButton.style.height = buttonPercentSize;

  zoomButton.addEventListener("click", function(evt) {
    evt.preventDefault();

    //activate so that it's as if mouse left button is pressed
    touchSetting = "zoom";

    //evt. deactivate DG
    if (DGInitialized) {
      deactivateDGTouch();
    }
    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
  });

  touchModalContent.appendChild(zoomButton);

  /////////////////MOVE BUTTON//////////////////
  let moveButton = document.createElement("button");
  moveButton.innerText = "Move";
  moveButton.setAttribute("class", "modalButton");
  moveButton.setAttribute("title", "Move");
  moveButton.style.width = buttonPercentSize;
  moveButton.style.height = buttonPercentSize;

  moveButton.addEventListener("click", function(evt) {
    evt.preventDefault();

    //activate so that it's as if mouse left button is pressed
    touchSetting = "move";

    //evt. deactivate DG
    if (DGInitialized) {
      deactivateDGTouch();
    }
    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
  });
  touchModalContent.appendChild(moveButton);

  //////One-time touch controls//////

  addText("<br><br>");
  addText("<b>One-time functions:</b>");

  /////////////////UNDO BUTTON//////////////////
  undoButton = document.createElement("button");
  undoButton.innerText = "Undo";
  undoButton.setAttribute("class", "modalButton");
  undoButton.setAttribute("title", "Undo the last 2d segmentation change");
  undoButton.style.width = buttonPercentSize;
  undoButton.style.height = buttonPercentSize;

  undoButton.addEventListener("click", function(evt) {
    evt.preventDefault();

    let slice = parseInt(thectx.slider.value);
    let sliceSize = thectx.sliceSize;
    let sliceOffset = sliceSize * slice;

    //memorize current segmentation first (to fall back on on 2nd undo)
    let tempMemory = thectx.segData.slice(sliceOffset, sliceOffset + sliceSize);

    for (var p = 0; p < thectx.memorySeg.length; p += 1) {
      thectx.segData[sliceOffset + p] = thectx.memorySeg[p];
    }
    thectx.memorySeg = tempMemory;

    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
    drawCanvas(thectx);
  });
  touchModalContent.appendChild(undoButton);

  /////////////////FILL BUTTON//////////////////
  let fillButton = document.createElement("button");

  fillButton.innerText = "Fill";
  fillButton.setAttribute("class", "modalButton");
  fillButton.setAttribute(
    "title",
    "Fills one time where you click. Uses thresholding. Can be used to change island to new label."
  );
  fillButton.style.width = buttonPercentSize;
  fillButton.style.height = buttonPercentSize;

  fillButton.addEventListener("click", function(evt) {
    evt.preventDefault();

    memoryTouchSetting = touchSetting;
    //activate so that it's as if mouse left button is pressed
    touchSetting = "fill";

    //evt. deactivate DG
    if (DGInitialized) {
      deactivateDGTouch();
    }
    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
  });

  touchModalContent.appendChild(fillButton);

  /////////////////PREDICT BUTTON//////////////////
  predictButton = document.createElement("button");
  predictButton.innerText = "Predict";
  predictButton.setAttribute("class", "modalButton");
  predictButton.setAttribute(
    "title",
    "Predicts the current slice using the loaded 2d DL model"
  );
  predictButton.style.width = buttonPercentSize;
  predictButton.style.height = buttonPercentSize;
  predictButton.style.padding = "0px";

  predictButton.addEventListener("click", function(evt) {
    evt.preventDefault();

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
      alert("You must load a 2d model first");
      return;
    }

    let modal = document.getElementById("touchModal");
    modal.style.display = "none";
    modalVisible = false;
  });
  touchModalContent.appendChild(predictButton);

  /////////////////GOOGLE LOAD/////////////////////
  let loadGoogleDriveFile = function() {
    googleAPILoadType = "load";
    loadPicker();
  };

  createNewButton(
    "DriveLoad",
    "Opens your Google Drive where you can select a nifti file to load",
    loadGoogleDriveFile
  );

  /////////////////GOOGLE SAVE/////////////////////
  let uploadGoogleDriveFile = function() {
    googleAPILoadType = "upload";
    loadPicker();
  };

  createNewButton(
    "DriveSave",
    "Opens your Google Drive where you can have to select a folder. The mask will be saved to that folder.",
    uploadGoogleDriveFile
  );
  //add buttons:
  //Google open + save
  //zoom reset, delete
  //evt. experiment with trace boundaries

  //////////////////EXTRA FUNCTIONS//////////////
  function deactivateDGTouch() {
    sizeOfCircle = parseFloat(histryPointerSize);
    document.getElementById("pointerSizeText").value = sizeOfCircle.toFixed(2);

    setTimeout(function() {
      DGActivated = false;
      DGInitialized = false;
      draw(vis_canvas, posx, posy);
    }, 0);
  }

  //function to create a div to make new line
  //not used as you can use <br> to add lines..leaving for now
  function createNewLine() {
    let div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "5%";
    touchModalContent.appendChild(div);
  }

  //function to add text (in html)
  function addText(text) {
    let div = document.createElement("div");
    div.innerHTML += text;
    touchModalContent.appendChild(div);
  }
}
touchCreateModal();

allText.addEventListener("touchstart", function() {
  mouse_over_canvas = false;
});

createModal("touchModal", "touchModalBtn", "closeTouchModal");
