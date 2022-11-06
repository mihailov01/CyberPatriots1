// left to do:
// *
// Shift + *
// Ctrl + <

thectx.keys = {};

thectx.keys.listOfAllKeys = {};

class keyObject {
  constructor(text, activationKey, activationCtrl, youtubeLink, longText) {
    this.text = text;
    this.activationKey = activationKey;
    this.activationCtrl = activationCtrl;
    this.origActKey = activationKey;
    this.origActivCtrl = activationCtrl;
    this.youtubeLink = youtubeLink;
    this.longText = longText;

    thectx.keys.listOfAllKeys[text] = [activationKey, activationCtrl];
  }

  matchesEvent(evt, keyup = false) {
    if (keyup) {
      //doesn't need to be correct control status and accepts lower/upper case
      return (
        evt.key == this.activationKey ||
        evt.key == this.activationKey.toUpperCase() ||
        evt.key == this.activationKey.toLowerCase()
      );
    } else {
      return (
        evt.key == this.activationKey && evt.ctrlKey == this.activationCtrl
      );
    }
  }

  changeActivation(newActKey, newActCtrl) {
    var keys = Object.keys(thectx.keys.listOfAllKeys);

    for (var i = 0; i < keys.length; i++) {
      var val = thectx.keys.listOfAllKeys[keys[i]];
      if (val[0] == newActKey && val[1] == newActCtrl && keys[i] != this.text) {
        document.exitPointerLock();
        alert(
          `Невозможно поменять, функция \n"` +
            keys[i] +
            `"\n уже имеет этот ключ`
        );
        return;
      }
    }

    this.activationKey = newActKey;
    this.activationCtrl = newActCtrl;

    thectx.keys.listOfAllKeys[this.text] = [
      this.activationKey,
      this.activationCtrl
    ];
  }
}

createKeyBindingText = function(text) {
  let textInsert = document.createElement("div");
  textInsert.innerHTML = text;
  textInsert.style.padding = "15px 5px 5px 5px";
  textInsert.style.fontWeight = "bold";
  textInsert.style.fontSize = "30px";
  //textInsert.style.fontFamily = "monospace";

  let target = document.getElementById("controlsModalContent");
  let keybindingsElement = document.getElementById("Keybindings");
  target.insertBefore(textInsert, keybindingsElement);
};

createKeyBindingText("Изменяемые сочетания клавиш");
createKeyBindingText(" ");
createKeyBindingText(" ");

//POINTER
createKeyBindingText("Указатель");

thectx.keys.increasePointerSize = new keyObject(
  (text = "Увеличение размера указателя"),
  (activationKey = "w"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Нажмите и удерживайте кнопку, чтобы увеличить размер указателя")
);
createKeyBinding(thectx.keys.increasePointerSize);

thectx.keys.decreasePointerSize = new keyObject(
  (text = "Уменьшение размера указателя"),
  (activationKey = "s"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Нажмите и удерживайте кнопку, чтобы уменьшить размер указателя")
);
createKeyBinding(thectx.keys.decreasePointerSize);

thectx.keys.increasePointerOpacity = new keyObject(
  (text = "Увеличение непрозрачности указателя"),
  (activationKey = "D"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Нажмите и удерживайте кнопку, чтобы увеличить непрозрачность указателя")
);
createKeyBinding(thectx.keys.increasePointerOpacity);

thectx.keys.decreasePointerOpacity = new keyObject(
  (text = "Уменьшение непрозрачности указателя"),
  (activationKey = "A"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Нажмите и удерживайте кнопку, чтобы уменьшить непрозрачность указателя")
);
createKeyBinding(thectx.keys.decreasePointerOpacity);

thectx.keys.pointerInfo = new keyObject(
  (text = "Pointer info"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "Shows more info about the values/voxels that are within the pointer")
);
/* createKeyBinding(thectx.keys.pointerInfo);
 */
//MASKS
createKeyBindingText("Маска");

thectx.keys.showHideMask = new keyObject(
  (text = "Показать/скрыть маску"),
  (activationKey = "f"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Включает/выключает непрозрачность маски")
);
createKeyBinding(thectx.keys.showHideMask);

thectx.keys.increaseMaskOpacity = new keyObject(
  (text = "Увеличение непрозрачность маски"),
  (activationKey = "d"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Нажмите и удерживайте кнопку, чтобы увеличить непрозрачность маски")
);
createKeyBinding(thectx.keys.increaseMaskOpacity);

thectx.keys.decreaseMaskOpacity = new keyObject(
  (text = "Уменьшение непрозрачность маски"),
  (activationKey = "a"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Нажмите и удерживайте кнопку, чтобы уменьшить непрозрачность маски")
);
createKeyBinding(thectx.keys.decreaseMaskOpacity);

thectx.keys.nextLabelLock = new keyObject(
  (text = "Следующая метка"),
  (activationKey = "e"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "Выбирает следующую метку и блокирует текущую. Если следующая метка отсутствует, она создается.")
);
createKeyBinding(thectx.keys.nextLabelLock);

thectx.keys.previousLabelLock = new keyObject(
  (text = "Предыдущая метка"),
  (activationKey = "q"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Выбирает предыдущую метку и блокирует текущую.")
);
createKeyBinding(thectx.keys.previousLabelLock);

thectx.keys.nextLabelNoLock = new keyObject(
  (text = "Следующая метка без блокировки текущей"),
  (activationKey = "E"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "Выбирает следующую метку без блокировки текущей. Если следующая метка отсутствует, она создается.")
);
createKeyBinding(thectx.keys.nextLabelNoLock);

thectx.keys.previousLabelNoLock = new keyObject(
  (text = "Предыдущая метка без блокировки текущей"),
  (activationKey = "Q"),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText = "Выбирает предыдущую метку без блокировки текущей.")
);
createKeyBinding(thectx.keys.previousLabelNoLock);

//MANUAL SEGMENTATION
createKeyBindingText("Ручная сегментация");

thectx.keys.DeleteSlice = new keyObject(
  (text = "Удаление сегментации на текущем срезе"),
  (activationKey = "Delete"),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText = "Удаляет разблокированную сегментацию(ы) текущего среза.")
);
createKeyBinding(thectx.keys.DeleteSlice);

thectx.keys.Undo = new keyObject(
  (text = "Отмена (2D)"),
  (activationKey = "z"),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText =
    "Отменена последней 2d-сегментацию. Работает только один раз и должен использоваться в том же фрагменте, что и последнее изменение.")
);
createKeyBinding(thectx.keys.Undo);

//THRESHOLDING
//createKeyBindingText("Пороговое значение");

thectx.keys.ThresholdingOnOff = new keyObject(
  (text = "Включение/выключение порогового значения"),
  (activationKey = "t"),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText = "Включает и выключает пороговое значение")
);
createKeyBinding(thectx.keys.ThresholdingOnOff);

thectx.keys.ThresholdingSetMin = new keyObject(
  (text = "Минимум порогового значения = среднее значение указателя"),
  (activationKey = "-"),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText =
    "Среднее значение указателя становится минимальным пороговым значением.")
);
createKeyBinding(thectx.keys.ThresholdingSetMin);

thectx.keys.ThresholdingSetMax = new keyObject(
  (text = "Максимальное значение порогового значения = среднее значение указателя"),
  (activationKey = "+"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "Среднее значение указателя становится максимальным пороговым значением.")
);
createKeyBinding(thectx.keys.ThresholdingSetMax);

thectx.keys.fill2D = new keyObject(
  (text = "2D заливка"),
  (activationKey = "<"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Заполнение 2D-острова, исходящего из центра вашего курсора")
);
createKeyBinding(thectx.keys.fill2D);

thectx.keys.fill3D = new keyObject(
  (text = "3D заливка"),
  (activationKey = ">"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "Заполнение 3D-острова, исходящего из центра вашего курсора.")
);
createKeyBinding(thectx.keys.fill3D);


//AUTOMATIC SEGMENTATION
/* createKeyBindingText("Automatic segmentation");
 */
thectx.keys.predictSlice = new keyObject(
  (text = "Predict slice"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Predict the current slice using a loaded 2D model")
);
/* createKeyBinding(thectx.keys.predictSlice);
 */
thectx.keys.predictAllSlices = new keyObject(
  (text = "Predict all slices"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText =
    "Predict all slices using a loaded 2D model. Note - may take long time and the only way to abort is to shut off MedSeg.")
);
/* createKeyBinding(thectx.keys.predictAllSlices);
 */
thectx.keys.deepGrowOnOff = new keyObject(
  (text = "DeepGrow on/off"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText =
    "Switches between DeepGrow and regular segmentation modes. Place DeepGrow clicks by pressing the left and right mouse buttons. The clicks can be moved while holding the mouse button pressed.")
);
/* createKeyBinding(thectx.keys.deepGrowOnOff);
 */
thectx.keys.predictSliceBelow = new keyObject(
  (text = "Predict slice below"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText = "Switches to and predicts the slice below the current.")
);
/* createKeyBinding(thectx.keys.predictSliceBelow);
 */
thectx.keys.predictSliceAbove = new keyObject(
  (text = "Predict slice above"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText = "Switches to and predicts the slice above the current.")
);
/* createKeyBinding(thectx.keys.predictSliceAbove);
 */
thectx.keys.roiRectangle = new keyObject(
  (text = "ROI rectangle (for ROI models)"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText =
    "Note that the ROI model will not work with rotated or left/right flipped images.")
);
/* createKeyBinding(thectx.keys.roiRectangle);
 */
thectx.keys.errorSegPoint = new keyObject(
  (text = "Point for experimental ErrorSeg"),
  (activationKey = ""),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText =
    "Main model is made for pancreas on CT. Write us to dlinradiology@gmail.com if you want to try it.")
);
/* createKeyBinding(thectx.keys.errorSegPoint);
 */

//WINDOWING
createKeyBindingText("Окно КТ");

thectx.keys.CTMediastinumWindowing = new keyObject(
  (text = "CT mediastinum window"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText = "Window level 60, window width 350")
);
/* createKeyBinding(thectx.keys.CTMediastinumWindowing);
 */
thectx.keys.CTBrainWindowing = new keyObject(
  (text = "CT brain window"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText = "Window level 40, window width 80")
);
/* createKeyBinding(thectx.keys.CTBrainWindowing);
 */
thectx.keys.CTLungsWindowing = new keyObject(
  (text = "CT lungs window"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText = "Window level -450, window width 1500")
);
/* createKeyBinding(thectx.keys.CTLungsWindowing);
 */
thectx.keys.CTSoftTissueWindowing = new keyObject(
  (text = "CT soft tissue window"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText = "Window level 50, window width 450")
);
/* createKeyBinding(thectx.keys.CTSoftTissueWindowing);
 */
thectx.keys.CTBoneWindowing = new keyObject(
  (text = "CT bone window"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText = "Window level 350, window width 2000")
);
/* createKeyBinding(thectx.keys.CTBoneWindowing);
 */
thectx.keys.sliceWindowing = new keyObject(
  (text = "Min/max of current slice window"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText = "Window level and window width set accoring to the current slice")
);
/* createKeyBinding(thectx.keys.sliceWindowing);
 */
thectx.keys.pointerWindowing = new keyObject(
  (text = "Min/max of pointer window"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText = "Window level and window width set accoring to the ROI/pointer")
);
/* createKeyBinding(thectx.keys.pointerWindowing);
 */
thectx.keys.windowingOnOff = new keyObject(
  (text = "Activate/deactivate windowing"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText =
    "This button is an alternative when the user doesn't have the scroll wheel available.")
);
/* createKeyBinding(thectx.keys.windowingOnOff);
 */

thectx.keys.CTLungsWindowing = new keyObject(
  (text = "Окно компьютерной томографии легких"),
  (activationKey = "1"),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText = "Уровень окна -450, ширина окна 1500")
);
createKeyBinding(thectx.keys.CTLungsWindowing);

thectx.keys.sliceWindowing = new keyObject(
  (text = "Мин/макс текущего окна среза"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText = "Уровень окна и ширина окна устанавливаются в соответствии с текущим срезомe")
);
/* createKeyBinding(thectx.keys.sliceWindowing);
 */
thectx.keys.pointerWindowing = new keyObject(
  (text = "Минимальное/максимальное окно указателя"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText = "Уровень окна и ширина окна устанавливаются в соответствии с указателем")
);
/* createKeyBinding(thectx.keys.pointerWindowing);
 */
thectx.keys.windowingOnOff = new keyObject(
  (text = "Активировать/деактивировать яркость/контростность"),
  (activationKey = "2"),
  (activationCtrl = false),
  (youtubeLink = "none"),
  (longText =
    "Для изменения яроксти/контрастности перемещайте компьютерную мышь.")
);
createKeyBinding(thectx.keys.windowingOnOff);

//DATA VIEW
createKeyBindingText("Просмотр данных");

thectx.keys.resetView = new keyObject(
  (text = "Сбросить масштабирование и панорамирование"),
  (activationKey = "r"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "Сбрасывает масштабирование и панорамирование, сохраняет отображение окон, поворот и зеркальное отображение без изменений. Отображение окон может быть сброшено с помощью функции, называемой Мин/Макс текущего окна среза")
);
createKeyBinding(thectx.keys.resetView);

thectx.keys.fullResetView = new keyObject(
  (text = "Сброс полного обзора"),
  (activationKey = "R"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Сбрасывает любое масштабирование, панорамирование, отображение окон, поворот и зеркальное отображение.")
);
createKeyBinding(thectx.keys.fullResetView);

thectx.keys.axialPlane = new keyObject(
  (text = "Оригинальная визуализация"),
  (activationKey = "F9"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Изменения в исходном MPR")
);
createKeyBinding(thectx.keys.axialPlane);

thectx.keys.coronalPlane = new keyObject(
  (text = "Ось 1 визуализации"),
  (activationKey = "F10"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "Изменение в визуализации. Занимает некоторое время, в зависимости от размера загруженного тома.")
);
createKeyBinding(thectx.keys.coronalPlane);

thectx.keys.sagittalPlane = new keyObject(
  (text = "Ось 2 визуализации"),
  (activationKey = "F11"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "Изменение в визуализации. Занимает некоторое время, в зависимости от размера загруженного тома.")
);
createKeyBinding(thectx.keys.sagittalPlane);

thectx.keys.sliceUp = new keyObject(
  (text = "Один кадр вверх"),
  (activationKey = "ArrowUp"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "В качестве альтернативы прокрутке вы можете использовать эту кнопку для перемещения между фрагментами.")
);
createKeyBinding(thectx.keys.sliceUp);

thectx.keys.sliceDown = new keyObject(
  (text = "Один кадр вниз"),
  (activationKey = "ArrowDown"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "В качестве альтернативы прокрутке вы можете использовать эту кнопку для перемещения между фрагментами.")
);
createKeyBinding(thectx.keys.sliceDown);

//OTHER FUNCTIONS
createKeyBindingText("Другие функции");

thectx.keys.f1Info = new keyObject(
  (text = "Info about the volume and view"),
  (activationKey = ""),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText =
    "Shows more info about the loaded volume and the selected display settings. Useful for viewing the slice nr. before starting AI models on selected slices.")
);
/* createKeyBinding(thectx.keys.f1Info);
 */
thectx.keys.ruler = new keyObject(
  (text = "Линейка для измерения расстояния"),
  (activationKey = "3"),
  (activationCtrl = false),
  (youtubeLink = "http:.asdasdfad.com/dgg"),
  (longText = "Активирует/деактивирует линейку в мм.")
);
createKeyBinding(thectx.keys.ruler);

thectx.keys.openGDrive = new keyObject(
  (text = "Open from Google Drive"),
  (activationKey = ""),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText =
    "Opens niftis from Google Drive. The user needs to be registered as this is still under development. Write an email to dlinradiology@gmail.com if you want us to add your google login.")
);
/* createKeyBinding(thectx.keys.openGDrive);
 */
thectx.keys.uploadGDrive = new keyObject(
  (text = "Upload/save to Google Drive"),
  (activationKey = ""),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText =
    "Saves mask to Google Drive. Select the folder that you want to save to. Currently not possible to overwrite files. The user needs to be registered as this is still under development. Write an email to dlinradiology@gmail.com if you want us to add your google login.")
);
/* createKeyBinding(thectx.keys.uploadGDrive);
 */



//NOT SHOWN DUE TO OBSCURITY
thectx.keys.liversplit = new keyObject(
  (text = "Liver mask split to subsegments"),
  (activationKey = "L"),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText = "")
);

thectx.keys.MPRMode = new keyObject(
  (text = "MPR Mode (only partly functioning)"),
  (activationKey = "="),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText =
    "Use by holding Ctrl+left mouse button pressed and moving the mouse")
);

thectx.keys.fillIslands = new keyObject(
  (text = "Fill islands"),
  (activationKey = "<"),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText = "Fills all islands on current slice.")
);

thectx.keys.removeOtherIslands2D = new keyObject(
  (text = "Remove other islands 2D"),
  (activationKey = "*"),
  (activationCtrl = false),
  (youtubeLink = ""),
  (longText = "")
);

thectx.keys.removeOtherIslands3D = new keyObject(
  (text = "Remove other islands 3D"),
  (activationKey = "*"),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText = "")
);

thectx.keys.openFolder = new keyObject(
  (text = "Open series UID prompt"),
  (activationKey = "ø"),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText = "")
);

thectx.keys.dontSegmentZero = new keyObject(
  (text = "Switch don't segment zero on/off"),
  (activationKey = "f"),
  (activationCtrl = true),
  (youtubeLink = ""),
  (longText = "")
);


function createKeyBinding(key) {
  //key is an object in thectx.Keys
  //it has:
  //* text:text to be displayed
  //* activationKey = activation key (f.ex. "a")
  //* activationCtrl = Ctrl status, bool

  // Future development:
  // *youtube link
  // *more info on hover

  //Place the created Keybinding

  let text = key.text;
  let activationKey = key.activationKey;
  let activationCtrl = key.activationCtrl;
  let longText = key.longText;

  let keyBindingDiv = document.createElement("div");

  keyBindingDiv.style.position = "relative";
  //keyBindingDiv.style.backgroundColor = "rgb(0,0,0,0.2)";
  keyBindingDiv.style.padding = "2px";
  keyBindingDiv.style.width = "600px";
  keyBindingDiv.style.height = "20px";
  //keyBindingDiv.style.border = "2px solid rgb(0, 120, 155)";
  keyBindingDiv.style.left = "0px";
  keyBindingDiv.style.margin = "5px";

  let textElement = document.createElement("text");
  textElement.innerHTML = text;
  textElement.setAttribute("title", longText);
  textElement.style.backgroundColor = "rgb(100,184,210,1)";
  //textElement.style.textShadow = "0px 0px 3px black";
  //textElement.style.fontWeight = "bold";
  textElement.style.fontSize = "20px";
  //textElement.style.top = "10px";
  textElement.style.width = "1000px";
  textElement.style.position = "absolute";
  textElement.style.overflow = "hidden";
  textElement.style.textAlign = "right";
  textElement.style.textOverflow = "ellipsis";
  textElement.style.whiteSpace = "nowrap";
  //textElement.setAttribute("class", "clickableImage");

  keyBindingDiv.appendChild(textElement);

  let keyElement = document.createElement("text");
  let keyElementText = "";

  if (activationCtrl) {
    keyElementText += "Ctrl + ";
  }
  if (activationKey == " ") {
    keyElementText += "Space";
  } else {
    keyElementText += activationKey;
  }
  keyElement.innerHTML = keyElementText;

  keyElement.style.backgroundColor = "rgb(100,184,210,1)";
  //textElement.style.textShadow = "0px 0px 3px black";
  //textElement.style.fontWeight = "bold";
  keyElement.style.fontSize = "20px";
  //keyElement.style.top = "10px";
  keyElement.style.right = "-600px";
  keyElement.style.width = "200px";
  keyElement.style.position = "absolute";
  keyElement.style.overflow = "hidden";
  keyElement.style.textAlign = "center";
  keyElement.style.textOverflow = "ellipsis";
  keyElement.style.whiteSpace = "nowrap";
  keyElement.setAttribute("class", "clickableImage");

  keyBindingDiv.appendChild(keyElement);

  keyElement.onclick = function(evt) {
    document.addEventListener("keydown", onKeyHandler);
    vis_canvas.requestPointerLock();

    keyElement.innerHTML = "Press a key";
    keyElement.style.backgroundColor = "rgb(50,134,160,1)";

    function onKeyHandler(e) {
      e.preventDefault();
      e.stopPropagation();

      if (
        e.key != "Shift" &&
        e.key != "Control" &&
        e.key != "Alt" &&
        e.key != "AltGraph"
      ) {
        //need to add possibility for mouse buttons

        newActKey = e.key;
        newCtrlStatus = e.ctrlKey;

        key.changeActivation(newActKey, newCtrlStatus);

        keyElementText = "";
        if (key.activationCtrl) {
          keyElementText += "Ctrl + ";
        }
        if (key.activationKey == " ") {
          keyElementText += "Space";
        } else {
          keyElementText += key.activationKey;
        }
        keyElement.innerHTML = keyElementText;

        document.removeEventListener("keydown", onKeyHandler);
        //document.removeEventListener("mousedown", onKeyHandler);
        document.exitPointerLock();
        keyElement.style.backgroundColor = "rgb(100,184,210,1)";
      }
    }

    //document.exitPointerLock()
  };

  let target = document.getElementById("controlsModalContent");
  let keybindingsElement = document.getElementById("Keybindings");
  target.insertBefore(keyBindingDiv, keybindingsElement);
}
//
