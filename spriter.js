let hexToRgb = hex => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    255
  ]
}

let pixelEqual = (a1,a2) => JSON.stringify(a1) == JSON.stringify(a2)

let getPixel = (i, imgData) => Array.from(imgData.data.slice(i * 4, i * 4 + 4))

let pixelEqualArray = (pixel, pArray) => {
  let out = false
  for (let i = 0; i < pArray.length; i++) {
    if (pixelEqual(pixel, pArray[i])) {
      out = true
      break 
    }
  }
  return out
}

// Vars

const inCanvas = document.getElementById("ogimg")
const inCtx = inCanvas.getContext("2d")
const outCanvas = document.getElementById("spriteSheet")
const outCtx = outCanvas.getContext("2d")

// Get sheet cols

let opt = {
  bgCol: "#8a5a9d",
  spriteCol: "#c386ff",
  wordCol: "#ffffff",
  targetCol: "#ffaaee",

  spriteSizeX: 64,
  spriteSizeY: 64,

  layout: "compact",
  positionX: "middle",
  positionY: "middle",

  compactLayout: 4,

  minSpriteSizeX: 10,
  minSpriteSizeY: 10,

  findSColOnly: true
}

let getOptions = () => {
  
  for (const [key, value] of Object.entries(opt)) {
    opt[key] = document.getElementById(key) ? document.getElementById(key).value : opt[key]
  }

}

// Preview Uploaded Image

document.getElementById("uploader").onchange = evt => {
  const [file] = document.getElementById("uploader").files
  if (file) {
    document.getElementById("input").src = URL.createObjectURL(file)
  }
}

// Draw Sprite sheet

let getSprites = () => {

  // Get options
  getOptions()
  console.log(opt)

  const ignoreCols = [hexToRgb(opt.bgCol), hexToRgb(opt.wordCol), hexToRgb(opt.targetCol)]

  // Get Els
  const input = document.getElementById("input")

  // Set Canvas Size
  inCanvas.height = input.clientHeight 
  inCanvas.width = input.clientWidth

  // Get Image data
  inCtx.drawImage(input, 0, 0)
  let imgData = inCtx.getImageData(0, 0, inCanvas.width, inCanvas.height);

  // STEP ONE: Get every sprite
  // For each pixel
  let spriteCoords = []

  let xindex = -1
  let yindex = -1
  let currentY = 0
  let sheetSize = [0, 0]

  for (let i = 0; i < imgData.data.length / 4; i++) {
    const pixel = getPixel(i, imgData)
    const [x, y] = [i % inCanvas.width, Math.floor(i / inCanvas.width)]

    // Find top left corner
    // If pixel isn't array, word, or transparent
    if (opt.findSColOnly ? !pixelEqualArray(pixel, ignoreCols) : pixelEqual(pixel, hexToRgb(opt.spriteCol))) {

      // Find sprite width
      let spriteWidth = 0
      while ( !pixelEqual(getPixel(i + spriteWidth, imgData), hexToRgb(opt.bgCol)) && i + spriteWidth < imgData.data.length / 4 ) spriteWidth++

      // Find sprite height
      let spriteHeight = 0
      while ( !pixelEqual(getPixel(i + (spriteHeight * inCanvas.width), imgData), hexToRgb(opt.bgCol)) && i + (spriteHeight * inCanvas.width) < imgData.data.length / 4 ) spriteHeight++

      // Fill sprite with Red
      inCtx.clearRect(x, y, spriteWidth, spriteHeight)
      inCtx.fillStyle = opt.targetCol
      inCtx.fillRect(x, y, spriteWidth, spriteHeight)

      // Refresh image data
      imgData = inCtx.getImageData(0, 0, inCanvas.width, inCanvas.height);

      // Add sprite coords to array if it's bigger then min
      if (opt.minSpriteSizeX < spriteWidth && opt.minSpriteSizeY < spriteHeight) {
        spriteCoords.push({
          x: x,
          y: y,
          w: spriteWidth,
          h: spriteHeight
        })

        xindex += 1
        if (sheetSize[0] < xindex) sheetSize[0] = xindex
        if (y != currentY) {
          xindex = 0
          sheetSize[1] += 1
          currentY = y
        }
      }

    }
    
  }

  // Get Image data
  inCtx.drawImage(input, 0, 0)
  imgData = inCtx.getImageData(0, 0, inCanvas.width, inCanvas.height);

  console.log(spriteCoords, sheetSize)

  // if (minSpriteSize[0] < opt.spriteSizeX) opt.spriteSizeX = minSpriteSize[0]
  // if (minSpriteSize[1] < opt.spriteSizeY) opt.spriteSizeY = minSpriteSize[1]

  // STEP 2: Copy each sprite onto sprite sheet
  switch (opt.layout) {
    case "sheet":
        
      outCanvas.width = sheetSize[0] * opt.spriteSizeX
      outCanvas.height = sheetSize[1] * opt.spriteSizeY

      break;
    case "compact":

      outCanvas.width = opt.compactLayout * opt.spriteSizeX
      outCanvas.height = Math.ceil(spriteCoords.length / opt.compactLayout) * opt.spriteSizeY

      break;
      
    default:
      break;
  }

  xindex = -1
  yindex = 0
  currentY = spriteCoords[0].y

  // Fill backgorund with sprite col
  outCtx.fillStyle = opt.spriteCol
  outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height)

  // For each sprite
  for (let i = 0; i < spriteCoords.length; i++) {
    const sprite = spriteCoords[i]
    let indexCoords = [0, 0]

    // Set Sprite Sheet layout
    switch (opt.layout) {
      case "sheet":
        
        xindex += 1
        if (sprite.y != currentY) {
          xindex = 0
          yindex += 1
          currentY = sprite.y
        }
        indexCoords = [ xindex, yindex ]

        break;
      case "compact":

        indexCoords = [ i % opt.compactLayout, Math.floor(i / opt.compactLayout) ]

        break;
        
      default:
        break;
    }

    // Set sprite position X
    switch (opt.positionX) {
      case "left":
        indexCoords[0] = indexCoords[0] * opt.spriteSizeX
        break;
      case "middle":
        indexCoords[0] = (indexCoords[0] + 0.5) * opt.spriteSizeX - Math.floor(sprite.w / 2)
        break;
      case "right":
        indexCoords[0] = (indexCoords[0] + 1) * opt.spriteSizeX - sprite.w
        break;
    
      default:
        break;
    }

    // Set sprite position Y
    switch (opt.positionY) {
      case "top":
        indexCoords[1] = indexCoords[1] * opt.spriteSizeY
        break;
      case "middle":
        indexCoords[1] = (indexCoords[1] + 0.5) * opt.spriteSizeY - Math.floor(sprite.h / 2)
        break;
      case "bottom":
        indexCoords[1] = (indexCoords[1] + 1) * opt.spriteSizeY - sprite.h
        break;
    
      default:
        break;
    }
    
    // Draw sprite
    outCtx.drawImage(
      inCanvas, 
      sprite.x, 
      sprite.y, 
      sprite.w, 
      sprite.h, 
      indexCoords[0], 
      indexCoords[1], 
      sprite.w, 
      sprite.h
    )

  }

  // Clear sprite of background pixels
  let outImgdata = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height)
  for (let i = 0; i < outImgdata.data.length / 4; i++) {
    const pixel = getPixel(i, outImgdata)
    const [x, y] = [i % outCanvas.width, Math.floor(i / outCanvas.width)]
    if (pixelEqual(pixel, hexToRgb(opt.spriteCol))) outCtx.clearRect(x, y, 1, 1)
  }

}

