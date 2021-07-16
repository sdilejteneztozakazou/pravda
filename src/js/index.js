import { claims, generators } from "./data.js";
import { splitText, pickRandom, getAverageLuminance } from "./helperFunctions.js";

const LOGO_OFFSET_X = 480;
const LOGO_OFFSET_Y = 30;
const LUMINANCE_THRESHOLD = 0.7;

const unrolledGenerators = generators.flatMap(({ url, weight }) => Array(weight).fill(url));

const imageReader = new FileReader();

const logoLight = new Image();
logoLight.src = "public/logo-light.png";


let currentImage = new Image();
let currentText = "Test text";

const rerollImage = async () => {
  const imageData = await fetch(pickRandom(unrolledGenerators));

  return new Promise((resolve) => {
    const image = new Image();

    image.addEventListener("load", () => {
      currentImage = image;
      resolve();
    });

    image.crossOrigin = "anonymous";
    image.src = imageData.url;
  });
};

const rerollText = () => {
  currentText = pickRandom(claims);
};

const grayScale = (context, canvas) => {
  var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
      var pixels  = imgData.data;
      for (var i = 0, n = pixels.length; i < n; i += 4) {
      var grayscale = pixels[i] * .3 + pixels[i+1] * .59 + pixels[i+2] * .11;
      pixels[i  ] = grayscale;        // red
      pixels[i+1] = grayscale;        // green
      pixels[i+2] = grayscale;        // blue
      //pixels[i+3]              is alpha
  }
  //redraw the image in black & white
  context.putImageData(imgData, 0, 0);
}

const canvas = document.getElementById("picture");
const ctx = canvas.getContext("2d");
const font = new FontFace("Bebas Neue", "url(public/BebasNeue-Bold.ttf)");

const initFont = async () => {
  await font.load();
  document.fonts.add(font);
};

const setFile = (file) => {
  if (!file.type.startsWith("image/")) {
    return;
  }

  imageReader.readAsDataURL(file);
};

canvas.addEventListener("dragover", (e) => e.preventDefault());

canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  if (!e.dataTransfer || e.dataTransfer.files.length <= 0) {
    return;
  }

  setFile(e.dataTransfer.files[0]);
});

const repaintImage = async () => {
  // clear to black (for transparent images)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // scale image to always fill the canvas
  const scaleX = canvas.width / currentImage.width;
  const scaleY = canvas.height / currentImage.height;
  const scale = Math.max(scaleX, scaleY);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(currentImage, 0, 0);
  grayScale(ctx,canvas);
  ctx.setTransform(); // reset so that everything else is normal size

  // calculate luminance to decide whether the logo will be light or dark
  const imgd = ctx
    .getImageData(LOGO_OFFSET_X, LOGO_OFFSET_Y, logoLight.width, logoLight.height)
    .data;
  const luminanceAverage = getAverageLuminance(imgd);


    ctx.drawImage(logoLight, LOGO_OFFSET_X, LOGO_OFFSET_Y,logoLight.width/2.5, logoLight.height/2.5);


  const lines = splitText(currentText, 20).reverse();
  const fontSize = lines.length < 5 ? 60 : 40;
  ctx.font = `${fontSize}px 'Bebas Neue'`;
  lines.forEach((line, index) => {
    const x = 30;
    const y = 685;
    const padding = 15;
    const lineHeight = padding + fontSize;
    ctx.fillStyle = "#00ff00";
    ctx
      .fillRect(x, y - (index * lineHeight), ctx.measureText(line).width + 2 * padding, lineHeight);
    ctx.textBaseline = "top";
    ctx.fillStyle = "black";
    ctx.fillText(line, x + padding, y + padding - (index * lineHeight));
  });
};

imageReader.addEventListener("load", (e) => {
  currentImage = new Image();
  currentImage.addEventListener("load", () => repaintImage());
  currentImage.src = e.target.result;
});

const buttonRandom = document.getElementById("randomize");
buttonRandom.addEventListener("click", async () => {
  rerollText();
  await rerollImage();
  repaintImage();
});

const buttonRandomImg = document.getElementById("randomize-img");
buttonRandomImg.addEventListener("click", async () => {
  await rerollImage();
  repaintImage();
});

const buttonRandomText = document.getElementById("randomize-text");
buttonRandomText.addEventListener("click", () => {
  rerollText();
  repaintImage();
});

const inputCustomImg = document.getElementById("customImage");
inputCustomImg.addEventListener("change", (e) => {
  e.preventDefault();
  if (e.target.files.length <= 0) {
    return;
  }
  setFile(e.target.files[0]);
});
const buttonCustomImg = document.getElementById("customImageBtn");
buttonCustomImg.addEventListener("click", () => {
  inputCustomImg.click();
});

const inputCustom = document.getElementById("customText");
const replaceWithCustomText = async (e) => {
  if (e.type === "input" || inputCustom.value) {
    currentText = inputCustom.value;
    repaintImage();
  }
};
inputCustom.addEventListener("click", replaceWithCustomText);
inputCustom.addEventListener("input", replaceWithCustomText);

const downloadLinkReal = document.createElement("a");
downloadLinkReal.setAttribute("download", "PirStanKampan.jpg");
const linkSave = document.getElementById("save");
linkSave.addEventListener("click", (e) => {
  e.preventDefault();
  downloadLinkReal.setAttribute("href", canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream"));
  downloadLinkReal.click();
});

initFont();

rerollText();
rerollImage()
  .then(() => repaintImage());
