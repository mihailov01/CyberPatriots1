(function settingsCreateImage() {
  let image = document.createElement("IMG");
  image.setAttribute("src", "../../static/main/img/settings.png");
  image.setAttribute("title", "Настройки и выбор имени сохранения маски");
  image.style.position = "absolute";
  image.style.right = "61%";
  image.style.top = "75px";
  image.style.width = "45px";
  image.setAttribute("class", "clickableImage");
  image.setAttribute("id", "settingsModalBtn");
  //image.style.margin = "0px 0px -2px 20px"

  let allText = document.getElementById("allText");
  allText.appendChild(image);
})();

(function settingsCreateModal() {
  let checkbox, label, div, text;

  //SETTINGS MODAL + BACKGROUND
  let settingsModal = document.createElement("div");
  settingsModal.setAttribute("class", "modal");
  settingsModal.setAttribute("id", "settingsModal");
  document.body.appendChild(settingsModal);

  let settingsModalContent = document.createElement("div");
  settingsModalContent.setAttribute("class", "modal-content");
  settingsModal.appendChild(settingsModalContent);

  let closeSpan = document.createElement("span");
  closeSpan.setAttribute("class", "close");
  closeSpan.setAttribute("id", "closeSettingsModal");
  closeSpan.innerHTML += "&times";
  settingsModalContent.appendChild(closeSpan);

  let newcontent = document.createElement("div");
  newcontent.innerHTML = "<br>";
  newcontent.innerHTML += "<b>Настройки:</b><br>";
  newcontent.innerHTML += "<br><br>";
  settingsModalContent.appendChild(newcontent);

  //WINDOWING

  div = document.createElement("div");
  text = document.createElement("text");
  text.innerHTML = "Размер окна. Минимум:";
  div.appendChild(text);

  let inputMin = document.createElement("input");
  inputMin.setAttribute("id", "windowingInputMin");
  inputMin.style.width = "40px";
  inputMin.addEventListener("input", function() {
    let min = parseFloat(inputMin.value);
    let max = parseFloat(inputMax.value);
    changeWindowing(min, max, false, false);
  });
  div.appendChild(inputMin);

  text = document.createElement("text");
  text.innerHTML = "Максимум: ";
  div.appendChild(text);

  inputMax = document.createElement("input");
  inputMax.style.width = "40px";
  inputMax.setAttribute("id", "windowingInputMax");
  inputMax.addEventListener("input", function() {
    let min = parseFloat(inputMin.value);
    let max = parseFloat(inputMax.value);
    changeWindowing(min, max, false, false);
  });
  /* inputToVal.addEventListener("click", function(){
        inputToVal.select()
    }) */
  div.appendChild(inputMax);

  text = document.createElement("text");
  text.innerHTML = "<br><br>";
  div.appendChild(text);

  div.setAttribute(
    "title",
    "Ручной ввод минимального и максимального значения для отображения в окне"
  );
  settingsModalContent.appendChild(div);

  //INTERPOLATION RAW IMAGE
  checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.setAttribute("class", "pointerCursor");
  checkbox.setAttribute("id", "interpolChBox");
  checkbox.checked = true;
  checkbox.addEventListener("click", function() {
    interpolActive = document.getElementById("interpolChBox").checked;
    if (interpolActive) {
      bg_canvas.style.imageRendering = "auto";
    } else {
      bg_canvas.style.imageRendering = "pixelated";
    }
    drawCanvas(thectx);
  });
  settingsModalContent.appendChild(checkbox);

  label = document.createElement("label");
  label.setAttribute("for", "interpolChBox");
  label.setAttribute("title", "Интерполяция необработанных данных изображения");
  label.innerHTML = "Интерполяция";
  settingsModalContent.appendChild(label);

  newcontent = document.createElement("div");
  /* newcontent.innerHTML = "<br>" */
  settingsModalContent.appendChild(newcontent);

  //FLUID POINTER
  checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.setAttribute("class", "pointerCursor");
  checkbox.setAttribute("id", "fluidPointChBox");
  checkbox.checked = true;
  checkbox.addEventListener("click", function() {
    fluidPointActive = document.getElementById("fluidPointChBox").checked;
    draw(vis_canvas, posx, posy);
  });
  settingsModalContent.appendChild(checkbox);

  label = document.createElement("label");
  label.setAttribute("for", "fluidPointChBox");
  label.setAttribute("title", '"Текучий"/фиксированного симметричного указателя');
  label.innerHTML = '"Жидкий" указатель';
  settingsModalContent.appendChild(label);

  newcontent = document.createElement("div");
  /*     newcontent.innerHTML = "<br>" */
  settingsModalContent.appendChild(newcontent);

  //HIGHLIGHT MASK BOUNDARIES
  checkboxMskBnd = document.createElement("input");
  checkboxMskBnd.type = "checkbox";
  checkboxMskBnd.setAttribute("class", "pointerCursor");
  checkboxMskBnd.setAttribute("id", "maskBoundariesChBox");
  checkboxMskBnd.checked = false;
  checkboxMskBnd.addEventListener("click", function() {
    highlightMaskBoundaries = checkboxMskBnd.checked;
    requestAnimationFrame(simpleDrawCanvas);
  });
  settingsModalContent.appendChild(checkboxMskBnd);

  labelMskBnd = document.createElement("label");
  labelMskBnd.setAttribute("for", "maskBoundariesChBox");
  labelMskBnd.setAttribute(
    "title",
    "Выделенные участки маскируют границы, уменьшая непрозрачность центральных частей"
  );
  labelMskBnd.innerHTML = "Выделение границы маски";
  settingsModalContent.appendChild(labelMskBnd);

  newcontent = document.createElement("div");
  /*     newcontent.innerHTML = "<br>" */
  settingsModalContent.appendChild(newcontent);

  //SAVE AS NII.GZ
  checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.setAttribute("class", "pointerCursor");
  checkbox.setAttribute("id", "saveAsGZCheckbox");
  checkbox.checked = false;
  checkbox.addEventListener("click", function() {
    saveAsGZ = document.getElementById("saveAsGZCheckbox").checked;
  });
  settingsModalContent.appendChild(checkbox);

  label = document.createElement("label");
  label.setAttribute("for", "saveAsGZCheckbox");
  label.setAttribute(
    "title",
    "Сохраняет как nii.gz вместо .nii. Процесс может занять некоторое время"
  );
  label.innerHTML = "Сохранение маски в архиве Gzip";
  settingsModalContent.appendChild(label);

  div = document.createElement("div");
  div.innerHTML = "<br>";
  settingsModalContent.appendChild(div);

  //SEGMENT ABOVE AND BELOW
  div = document.createElement("div");
  inputAboveBelow = document.createElement("input");
  inputAboveBelow.addEventListener("input", function() {
    segmentAboveBelow = parseInt(inputAboveBelow.value);
  });


  div = document.createElement("div");
  div.innerHTML = "<br>";
  settingsModalContent.appendChild(div);


  //UPLOAD DATA TO MEDSEG SERVER
  div = document.createElement("div");
  div.innerHTML = "<br><br>";
  settingsModalContent.appendChild(div);

  //SAVE MASK CONFIGURATION FILE
  div = document.createElement("div");
  div.innerHTML = "<br>";
  settingsModalContent.appendChild(div);
  let buttonSaveConfig = document.createElement("button");
  buttonSaveConfig.innerText = "Сохранение конфигурационного файла";
  buttonSaveConfig.setAttribute("class", "modalButton");
  buttonSaveConfig.addEventListener("click", function() {
    saveLabels();
  });
  buttonSaveConfig.setAttribute(
    "title",
    "Сохранение конфигурационного файла, который хранит имя маски и цвета."
  );
  settingsModalContent.appendChild(buttonSaveConfig);

  //FILENAME AND SAVE IMAGE FILE AS NII
  div = document.createElement("div");
  div.innerHTML = "<br>";

  text = document.createElement("text");
  text.innerHTML = "Имя файла: ";
  div.appendChild(text);

  let inputFileName = document.createElement("input");
  inputFileName.value = "имя";
  inputFileName.style.width = "80px";
  inputFileName.setAttribute("id", "inputFileName");

  inputFileName.addEventListener("input", function(evt) {
    thectx.fileName = inputFileName.value;
  });
  inputFileName.addEventListener("click", function(){
        inputFileName.select()
    })

  div.appendChild(inputFileName);

  text = document.createElement("text");
  text.innerHTML = " ";
  div.appendChild(text);

  let buttonSaveImage = document.createElement("button");
  buttonSaveImage.innerText = "Сохранение изображения в формате NIfTI";
  buttonSaveImage.setAttribute("class", "modalButton");
  buttonSaveImage.addEventListener("click", function() {
    saveImage();
  });
  buttonSaveImage.setAttribute("title", "Сохранение изображения в формате NIfTI");
  div.appendChild(buttonSaveImage);

  settingsModalContent.appendChild(div);

  //DO NOT SEGMENT ZERO checkbox dontSegmentZero
  //POINTER COLOR
  //ZOOM OF ALLTEXT
})();
//settingsCreateModal();

(function() {
  let segSlFrom = 0;
  let segSlTo = 0;

  let div = document.getElementById("SegmentSelectedSlices");

/*   let text = document.createElement("text");
  text.innerHTML = "<br>Automatically segment from slice nr. ";
  div.appendChild(text); */

  let inputFromSlice = document.createElement("input");
  inputFromSlice.value = 0;
  inputFromSlice.style.width = "25px";
  inputFromSlice.addEventListener("input", function() {
    segSlFrom = parseInt(inputFromSlice.value);
  });
 /*  div.appendChild(inputFromSlice); */

  text = document.createElement("text");
  text.innerHTML = " to slice nr. ";
  div.appendChild(text);

  let inputToSlice = document.createElement("input");
  inputToSlice.value = 0;
  inputToSlice.style.width = "25px";
  inputToSlice.addEventListener("input", function() {
    segSlTo = parseInt(inputToSlice.value);
  });
  div.appendChild(inputToSlice);

  text = document.createElement("text");
  text.innerHTML = " ";
  div.appendChild(text);

  let button = document.createElement("button");
  button.innerText = "Run segmentation";
  button.setAttribute("class", "modalButton");
  button.addEventListener("click", function() {
    if (selectedModel.name == "none") {
      return;
    }

    let modal = document.getElementById("modelsModal");
    modal.style.display = "none";
    modalVisible = false;

    let a;
    for (let i = segSlFrom, p = Promise.resolve(); i <= segSlTo; i += 1) {
      a = segSlTo;
      p = p.then(
        _ =>
          new Promise(resolve =>
            setTimeout(function() {
              thectx.slider.value = a;
              upperLeftInfoBar.innerHTML =
                "Segmenting. " + String(a - segSlFrom) + " slices left";
              tf.tidy(() => {
                predictCurrentSlice(
                  selectedModel,
                  windowedImageDataPredicting,
                  (sync = true)
                );
              });
              drawCanvas(thectx);
              a--;
              if (a - segSlFrom < 0) {
                upperLeftInfoBar.innerHTML = " ";
              }
              resolve();
            }, 0)
          )
      );
      upperLeftInfoBar.innerHTML = " ";
    }
  });
  div.appendChild(button);

  text = document.createElement("text");
  text.innerHTML = "";
  div.appendChild(text);

  //div.style.height="100px"
})();
