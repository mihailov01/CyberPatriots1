import nibabel
import numpy as np
import pydicom
import pydicom as dicom
from matplotlib import pyplot
import cv2
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
from ast import arg



def perevod(arr):
    """
    'режем на слои'
    [arr] - один фрагмент массива numpy
    [file_dir] - путь куда сохранять
    [index] - индекс среза для указания имени
    """
    # т.к. .nii файл содержит недостаточно информации, необходимо ввосполнить её из уже готового .dcm файла
    #arr.save_as(os.path.join('dcm', 'slice1.dcm'))
    dicom_file = pydicom.dcmread('example/dcmimage.dcm')
    arr = arr.astype('uint16')
    dicom_file.Rows = arr.shape[0]
    dicom_file.Columns = arr.shape[1]
    dicom_file.PhotometricInterpretation = "MONOCHROME2"
    dicom_file.SamplesPerPixel = 1
    dicom_file.BitsStored = 16
    dicom_file.BitsAllocated = 16
    dicom_file.HighBit = 15
    dicom_file.PixelRepresentation = 1
    dicom_file.PixelData = arr.tobytes()
    
    return dicom_file


def nii_to_dcm(file):
    """
    Перевод одного .nii файла в серию файлов .dcm
    [nifti_dir] - путь до одного .nii файла
    """
    nifti_file = nibabel.load(file)
    nifti_array = nifti_file.get_fdata()
    number_slices = nifti_array.shape[2]
    arr_dcm = []
    for slice_ in range(number_slices):
        arr_dcm.append(perevod(nifti_array[:,:,slice_]))
    
    return arr_dcm
        

def create_png(file):
    k=0
    for i in file:
        dc = i
        file_name = f'/home/service/Рабочий стол/ии/CyberPatriots/media/documents/png1/slice{k}.png'
        pyplot.imsave(file_name, dc.pixel_array, cmap=pyplot.cm.bone)
        
        image = Image.open(file_name) # открываем пнг файл
        ysil_con = ImageEnhance.Contrast(image)
        new = ysil_con.enhance(5)
        new = new.convert("L")
        new.save(f'/home/service/Рабочий стол/ии/CyberPatriots/media/documents/png2/slice{k}.png')
        contr = contours_search(k)
        k += 1



def contours_search(slice_numbed):
    '''
    Поис контуров лёгких на .png изображении для повышения качества работы нейронки

    [slice_numbed] - int - номер слоя (slice{slice_numbed}.png)
    [path] - str - путь до папки с изображениями слоев (/home/files/exaple1) *без последнего слеша
    [show] - bool - True: отобразит результат; False:  не отобразит результат.
    [option] - int - 0: ничего; 1: возвращает контур в классическом виде; 2: возвращает Х и У координаты точек контура
    '''
  # прочитать изображение
    image = cv2.imread(f'/home/service/Рабочий стол/ии/CyberPatriots/media/documents/png2/slice{slice_numbed}.png')
    
  # преобразовать изображение в формат оттенков серого
    img_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

  # apply binary thresholding
    if int(slice_numbed) < 5:
        index = 10
    elif (5 <= int(slice_numbed) < 15):
        index = 150
    elif (15 <= int(slice_numbed) < 34):
        index = 254
    elif (int(slice_numbed) >= 34):
        index = 150
    ret, thresh = cv2.threshold(img_gray, index, 255, cv2.THRESH_BINARY)

  # обнаруживаем контуры на двоичном изображении с помощью cv2.CHAIN_APPROX_NONE
    contours, hierarchy = cv2.findContours(image=thresh, mode=cv2.RETR_TREE, method=cv2.CHAIN_APPROX_SIMPLE)
                                  
  # рисуем контуры на исходном изображении
    image_copy = cv2.imread(f'/home/service/Рабочий стол/ии/CyberPatriots/media/documents/png1/slice{slice_numbed}.png')          

    for item_hierarchy in hierarchy: # перебор элементов дерева
        contr_with_children = [] # список всех родительских контуров
        for mas_with_items in item_hierarchy: # перебор элементов дерева
            if (mas_with_items[3] not in contr_with_children and mas_with_items[3] != -1): # отсекам уже имеющиеся и -1
                contr_with_children.append(mas_with_items[3]) # добавляем номер контура

    contr_mas = [] # массив с массивами [[[номер контура], [все x], [все y]], ... , []] #   Это можно было 
    for item_ in contr_with_children: # перебор всех родительских контуров              #      сделать
        contr_mas.append([[item_], [], []]) # шаблон для массива с номерами контуров      #        выше

    contr_position_in_mass = 0 # позиция контура в массиве а.к.а. счетчик
    for number_contr in contr_with_children: # перебор номеров
        for item_contr in contours[number_contr]: # без каментариев
            _x = item_contr[0][0] # выбор х
            _y = item_contr[0][1] # выбор у
            contr_mas[contr_position_in_mass][1].append(int(_x)) # добавляем х
            contr_mas[contr_position_in_mass][2].append(int(_y)) # добавляем у
        contr_position_in_mass += 1 #

    if len(contr_mas) == 3: #
        maxxx = [] #
        for kk in contr_mas: #
            maxxx.append([kk[0][0], max(kk[1])]) #
        if maxxx[0][1] > maxxx[1][1] and maxxx[0][1] > maxxx[2][1]: #
            maxxx.pop(0) #
        elif maxxx[1][1] > maxxx[0][1] and maxxx[0][1] > maxxx[2][1]: #
            maxxx.pop(1) #
        elif maxxx[2][1] > maxxx[1][1] and maxxx[2][1] > maxxx[1][1]: #
            maxxx.pop(2) #
  
    elif len(contr_mas) == 2: #
        maxxx = [[0, 5000]] #
        for i in contr_mas: #
            if max(i[1]) < maxxx[0][1]: #
                maxxx = [[i[0][0], max(i[1])]]
    else:
        maxxx = []
 #
    contrs_ = []
    for i in maxxx: #
        contrs_.append(contours[i[0]])
        image_copy = cv2.drawContours(image=image_copy, contours=contours, contourIdx=i[0], color=(0, 255, 0), thickness=3, lineType=cv2.LINE_AA) #
    cv2.imwrite(f'/home/service/Рабочий стол/ии/CyberPatriots/media/documents/png2/slice{slice_numbed}.png', image_copy)
        #cv2.FILLED - закрашивает контур
        # \/ тоже закрашивает контур
        #cv2.fillPoly(image_copy, pts =[contours[5]], color=(0,255,0, 100))
   


    
