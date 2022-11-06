//make it possible to save names of labels + colors

var button = document.createElement("BUTTON");

button.style.padding = "1px 10px";
button.style.left = "-5px";
button.style.top = "549px";
button.style.margin = "15px";
button.style.position = "absolute";
button.id = "mainButtonToAddSegValues";
//button.style.color = "blue"
button.style.fontSize = "16px";
button.innerHTML = "Нажмите, чтобы создать новую маску";

document.getElementById("allText").appendChild(button);
button.onclick = buttonpress;

var checkBoxValueCounter = 1;
var checkBoxOldNumber = 1;

function buttonpress(
  notNeeded = 0,
  makeValue = checkBoxValueCounter,
  hexVal = "random"
) {
  var divElement = document.createElement("div");
  document.getElementById("allText").appendChild(divElement);
  divElement.style.position = "relative";
  divElement.style.padding = "5px";
  divElement.style.width = "90%";
  divElement.style.height = "36px";
  divElement.style.border = "2px solid rgb(0, 120, 155)";
  divElement.style.left = "0px";
  divElement.style.margin = "5px";
  divElement.id = "div" + String(makeValue);

  //this is to make hover possible...I think
  var siblingToMakePointer = document.createElement("div");
  siblingToMakePointer.style.position = "absolute";
  siblingToMakePointer.style.left = "0px";
  siblingToMakePointer.style.top = "0px";
  siblingToMakePointer.style.width = "100%";
  siblingToMakePointer.style.height = "100%";
  siblingToMakePointer.id = "divSibling" + String(makeValue);
  siblingToMakePointer.setAttribute("class", "clickable");
  divElement.appendChild(siblingToMakePointer);

  divElement.onclick = function() {
    lockLabel(thectx.labels.currentLabel);
    activateOtherLabelDiv(makeValue);
    unlockLabel(thectx.labels.currentLabel);
    if (typeof thectx.DG.full !== "undefined") {
      thectx.DG.full.fill(0);
    }

    draw(vis_canvas, posx, posy);
  };

  //creating checkbox
  var checkbox = document.createElement("div");
  checkbox.value = parseInt(makeValue);
  checkbox.innerHTML = parseInt(makeValue);
  checkbox.style.color = "rgb(255,255,255,0.65)";
  checkbox.style.textShadow = "0px 0px 3px black";
  checkBoxValueCounter += 1;
  checkbox.style.fontWeight = "bold";
  checkbox.style.position = "relative";
  checkbox.style.width = "20px";
  checkbox.classList.add("noselect");
  //checkbox.style.display = "table-cell"
  //checkbox.style.margin = "auto"
  //checkbox.style.height = "100%"

  //checkbox.style.verticalAlign = "middle"
  if (checkbox.value < 10) {
    checkbox.style.left = "4%";
    checkbox.style.top = "15%";
    checkbox.style.fontSize = "30px";
  } else if (checkbox.value < 100) {
    checkbox.style.top = "25%";
    checkbox.style.left = "3%";
    checkbox.style.fontSize = "22px";
  } else {
    checkbox.style.top = "30%";
    checkbox.style.left = "1%";
    checkbox.style.fontSize = "18px";
  }

  //checkbox.readOnly = true
  checkbox.id = "checkbox" + String(makeValue);
  //checkbox.setAttribute("class", "pointerCursor")
  checkbox.setAttribute("title", "Mask value");
  siblingToMakePointer.appendChild(checkbox);

  //hiding colorpicker, creating my own color
  var colorpicker = document.createElement("input");
  colorpicker.type = "color";
  /* colorpicker.style.position = "absolute" */
  colorpicker.style.width = "0.1px";
  colorpicker.style.height = "0.1px";
  colorpicker.style.opacity = "0";
  colorpicker.id = "colorpicker" + String(makeValue);
  divElement.appendChild(colorpicker);

  /*   var labelForColorpicker = document.createElement("label")
  labelForColorpicker.setAttribute("for", colorpicker.id)
  labelForColorpicker.style.position="absolute"
  labelForColorpicker.style.right = "52%"
  labelForColorpicker.setAttribute("class", "clickableImage")
  labelForColorpicker.style.top = "30%"
  divElement.appendChild(labelForColorpicker)

  var labelImage = document.createElement("IMG")
  labelForColorpicker.style.position="absolute"
  labelImage.style.height = "20px"
  
  labelImage.setAttribute("src", "./images/edit.png")
  labelImage.setAttribute("title", "Edit color")
  labelImage.onclick = function(evt){
    evt.stopPropagation()
  }
  labelForColorpicker.appendChild(labelImage) */

  if (makeValue == 3) {
    hexVal = "#006a44";
  }
  if (makeValue == 4) {
    hexVal = "#c1272d";
  }
  if (makeValue == 5) {
    hexVal = "#00adbe";
  }
  if (makeValue == 6) {
    hexVal = "#a600b0";
  }
  if (makeValue == 7) {
    hexVal = "#cc6800";
  }

  if (hexVal == "random") {
    colorpicker.value =
      "#" +
      Math.floor(16 ** 5 + Math.random() * (16 ** 6 - 16 ** 5)).toString(16);
  } else {
    colorpicker.value = hexVal;
  }

  var divColor = document.createElement("label");
  divColor.setAttribute("for", colorpicker.id);
  divColor.style.position = "absolute";
  divColor.style.right = "70%";
  divColor.style.top = "20%";
  divColor.style.height = "50%";
  divColor.style.width = "12%";
  divColor.style.border = "3px solid rgb(0, 0, 0)";
  divColor.style.backgroundColor = colorpicker.value;
  divColor.id = "divColor" + String(makeValue);
  divElement.appendChild(divColor);
  divColor.onclick = function(evt) {
    evt.stopPropagation();
  };

  colorpicker.addEventListener("click", function(evt) {
    //evt.preventDefault()
    evt.stopPropagation();
  });

  var changingColor = false;
  colorpicker.oninput = function() {
    if (!changingColor) {
      changingColor = true;
      var rgb = hexToRgb(colorpicker.value);
      thectx.labels[makeValue].colormap = [rgb["r"], rgb["g"], rgb["b"]];
      divColor.style.backgroundColor = colorpicker.value;
      visualizeMaskData();
      draw(vis_canvas, posx, posy);
      setTimeout(function() {
        changingColor = false;
      }, 0);
    }
  };

  var radioButton = document.createElement("IMG");
  radioButton.setAttribute("src", "../../static/main/img/radioUnchecked.png");
  radioButton.setAttribute("title", "Выбор маски");
  siblingToMakePointer.appendChild(radioButton);
  radioButton.style.position = "absolute";
  radioButton.style.right = "3%";
  radioButton.style.top = "24%";
  radioButton.style.width = "25px";
  radioButton.style.margin = "0px 0px -2px 20px";
  radioButton.id = "radioButton" + String(makeValue);
  radioButton.setAttribute("class", "undraggable");

  var nameDiv = document.createElement("text");
  //nameDiv.value = parseInt(nameDiv)
  nameDiv.innerHTML = "Без имени";
  nameDiv.setAttribute("title", nameDiv.innerHTML + ".  Нажмите, чтобы переименовать ");
  nameDiv.style.color = "rgb(255,255,255,0.75)";
  nameDiv.style.textShadow = "0px 0px 3px black";
  nameDiv.style.fontWeight = "bold";
  nameDiv.style.width = "96px";
  nameDiv.style.position = "absolute";
  nameDiv.style.overflow = "hidden";
  nameDiv.style.textAlign = "center";
  nameDiv.style.textOverflow = "ellipsis";
  nameDiv.style.whiteSpace = "nowrap";
  nameDiv.setAttribute("class", "clickableImage");

  //nameDiv.style.height = "100%"
  nameDiv.style.right = "15%";
  nameDiv.style.top = "36%";
  nameDiv.id = "nameDiv" + String(makeValue);
  //checkbox.setAttribute("class", "pointerCursor")

  divElement.appendChild(nameDiv);
  //radioButton.setAttribute("class", "clickableImage")
  nameDiv.onclick = function(evt) {
    evt.stopPropagation();

    var nameOfMask = prompt(
      "Name of segmentation with mask value " + String(makeValue) + ":",
      nameDiv.innerHTML
    );
    if (nameOfMask == "") {
      nameOfMask = "Без имени";
    }
    //if not cancel was pressed:
    if (nameOfMask != null) {
      nameDiv.innerHTML = nameOfMask;
      nameDiv.setAttribute("title", nameDiv.innerHTML + ".  Нажмите,чтобы переименовать.");
    }
  };

  var lockImage = document.createElement("IMG");
  lockImage.setAttribute("src", "../../static/main/img/unlocked.png");
  lockImage.setAttribute(
    "title",
    "Статус блокировки. Нажмите, чтобы изменить."
  );
  divElement.appendChild(lockImage);
  lockImage.style.position = "absolute";
  lockImage.style.right = "55%";
  lockImage.style.top = "1%";
  lockImage.style.width = "25px";
  lockImage.style.margin = "0px 0px -2px 20px";
  lockImage.style.padding = "10px 2px";
  lockImage.id = "lockImage" + String(makeValue);
  lockImage.setAttribute("class", "clickableImage");

  lockImage.onclick = function(evt) {
    evt.stopPropagation();
    var lockStatus = thectx.labels[checkbox.value].locked;
    if (lockStatus) {
      thectx.labels[checkbox.value].locked = false;
      lockImage.setAttribute("src", "../../static/main/img/unlocked.png");
    } else {
      thectx.labels[checkbox.value].locked = true;
      lockImage.setAttribute("src", "../../static/main/img/locked.png");
    }
  };

  var rgb = hexToRgb(colorpicker.value);
  thectx.labels[checkbox.value] = {
    opacity: 255,
    locked: false,
    colormap: [rgb["r"], rgb["g"], rgb["b"]]
  };

  lockLabel(thectx.labels.currentLabel);
  activateOtherLabelDiv(checkBoxValueCounter - 1);
}

function lockLabel(labelNr) {
  thectx.labels[labelNr].locked = true;
  document
    .getElementById("lockImage" + String(labelNr))
    .setAttribute("src", "../../static/main/img/locked.png");
}
function unlockLabel(labelNr) {
  thectx.labels[labelNr].locked = false;
  document
    .getElementById("lockImage" + String(labelNr))
    .setAttribute("src", "../../static/main/img/unlocked.png");
}

function activateOtherLabelDiv(checkBoxCurrentNumber) {
  let theDiv = document.getElementById("div" + String(checkBoxCurrentNumber));
  let theCheckbox = document.getElementById(
    "checkbox" + String(checkBoxCurrentNumber)
  );
  let theColorpicker = document.getElementById(
    "colorpicker" + String(checkBoxCurrentNumber)
  );
  let theRadioButton = document.getElementById(
    "radioButton" + String(checkBoxCurrentNumber)
  );
  theRadioButton.setAttribute("src", "../../static/main/img/radioСhecked.png");

  var theDivSibling = document.getElementById(
    "divSibling" + String(checkBoxCurrentNumber)
  );
  theDivSibling.setAttribute("class", "none");

  //background of multilabels
  theDiv.style.backgroundColor = "rgb(50, 85, 85)";
  if (checkBoxOldNumber != checkBoxCurrentNumber) {
    var oldDivSibling = document.getElementById(
      "divSibling" + String(checkBoxOldNumber)
    );
    oldDivSibling.setAttribute("class", "clickable");

    let oldDiv = document.getElementById("div" + String(checkBoxOldNumber));
    oldDiv.style.removeProperty("background-color");

    let oldRadioButton = document.getElementById(
      "radioButton" + String(checkBoxOldNumber)
    );
    oldRadioButton.setAttribute("src", "../../static/main/img/radioUnchecked.png");

    checkBoxOldNumber = checkBoxCurrentNumber;
  }

  let rgb = hexToRgb(theColorpicker.value);
  thectx.labels.currentLabel = parseInt(theCheckbox.value);
  thectx.labels[theCheckbox.value].colormap = [rgb["r"], rgb["g"], rgb["b"]];

  //Optionally change thresholding value:
  if (thectx.labels[theCheckbox.value].hasOwnProperty("threshold")) {
    let threshold = thectx.labels[theCheckbox.value].threshold;
    let checked = document.getElementById("threshChBox").checked;
    if (String(checked) != threshold.activated) {
      document.getElementById("threshChBox").click();
    }
    //document.getElementById("threshChBox").checked = threshold.activated

    document.getElementById("minThrText").value = threshold.min;
    document.getElementById("maxThrText").value = threshold.max;
    changeThresh();
  }

  try {
    visualizeMaskData();
    draw(vis_canvas, posx, posy);
  } catch {}
}

buttonpress(0, 1, (hexVal = "#004B87"));
buttonpress(0, 2, (hexVal = "#FFCD00"));
unlockLabel(1);

//activateOtherLabelDiv(2)
activateOtherLabelDiv(1);

function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}
//
