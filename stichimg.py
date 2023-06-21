import cv2
import os
import numpy as np

imagepath = 'img/front.png'
img = cv2.imread(imagepath)

# Ratio 8m width to 6m height (4:3)
width = 1280
height = 800

#Input points are read from the corners drawn in the reduced size screenshot provided
inputpts = np.float32([[100, 15], [1000, 520], [629, 798], [420, 715]])
outputpts = np.float32([[0,0], [width-1, 0], [width-1, height-1], [0, height-1]])

m = cv2.getPerspectiveTransform(inputpts, outputpts)
outimg = cv2.warpPerspective(img, m, (width, height), cv2.INTER_LINEAR)

cv2.imshow('Result', outimg)
k = cv2.waitKey(0)
cv2.destroyAllWindows()