# WebGL
###<b> Problem 1: Change the basis </b>
- Cannot keep ratio if using with canvas coordinate [here](./sample/sample1.js)
- If image is not in right direction => using rotation not only affect the aspect ratio of image but also all coordinate will rotate same [here](./sample/sample2.js)
<b>Solution</b>
- Divide the width and height, then scale up to near 1 by custom default ratio
- Make a function to create a buffer in center of coordinate respect to the aspect ratio of image.
  [Solution file](./sample/sample3.js)

###<b> Problem 2: Auto rescale </b>

<b>Motivation</b>
- Canvas is changed its width and height. However, the above solution proposal does not update ratio of image
- Select a hyperameter ratio requires conditions:
  + All Images are not overlapped each other
  + All images are bounded in canvas
  + Minimize reduncdant space in canvas (maximize the area of 4 images, minimize distance between images)
  
<b>Proposal</b>
- Scaling: Search a scale factor that does not make all images overlapped (range custom with small step size)
- Translation: Get min between coordinate from nearest boundary 1 and coordinate that is calculated for near corner

[Proposal file](./sample/sample3.js)
