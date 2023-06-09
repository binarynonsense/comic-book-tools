const path = require("path");
const fs = require("fs");

const { FileExtension, FileDataType } = require("./constants");

///////////////////////////////////////////////////////////////////////////////
// HELPERS ////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function getMimeType(filePath) {
  let mimeType = path.extname(filePath).substring(1);
  return mimeType;
}
exports.getMimeType = getMimeType;

function hasImageExtension(filePath) {
  const allowedFileExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".bmp",
    ".avif",
  ];
  let fileExtension = path.extname(filePath).toLowerCase();
  for (i = 0; i < allowedFileExtensions.length; i++) {
    if (fileExtension === allowedFileExtensions[i]) {
      return true;
    }
  }
  return false;
}
exports.hasImageExtension = hasImageExtension;

exports.hasBookExtension = function (filePath) {
  const allowedFileExtensions = [".cbz", ".cbr", ".pdf", ".epub", ".cb7"];
  let fileExtension = path.extname(filePath).toLowerCase();
  for (i = 0; i < allowedFileExtensions.length; i++) {
    if (fileExtension === allowedFileExtensions[i]) {
      return true;
    }
  }
  return false;
};

exports.hasComicBookExtension = function (filePath) {
  const allowedFileExtensions = [".cbz", ".cbr", ".pdf", ".epub", ".cb7"];
  let fileExtension = path.extname(filePath).toLowerCase();
  for (i = 0; i < allowedFileExtensions.length; i++) {
    if (fileExtension === allowedFileExtensions[i]) {
      return true;
    }
  }
  return false;
};

exports.hasEpubExtension = function (filePath) {
  let fileExtension = path.extname(filePath).toLowerCase();
  if (fileExtension === ".epub") {
    return true;
  }
  return false;
};

exports.hasPdfKitCompatibleImageExtension = function (filePath) {
  const allowedFileExtensions = [".jpg", ".jpeg", ".png"];
  let fileExtension = path.extname(filePath).toLowerCase();
  for (i = 0; i < allowedFileExtensions.length; i++) {
    if (fileExtension === allowedFileExtensions[i]) {
      return true;
    }
  }
  return false;
};

///////////////////////////////////////////////////////////////////////////////
// RAR ////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function extractRar(filePath, outputFolderPath, password) {
  try {
    const unrar = require("node-unrar-js");
    //ref: https://github.com/YuJianrong/node-unrar.js
    let extractor = await unrar.createExtractorFromFile({
      filepath: filePath,
      targetPath: outputFolderPath,
      password: password,
    });
    const { files } = extractor.extract();
    [...files]; // lazy initialization? the files are not extracted if I don't do this
  } catch (error) {
    throw error;
  }
}
exports.extractRar = extractRar;

///////////////////////////////////////////////////////////////////////////////
// ZIP ////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function extractZip(filePath, outputFolderPath, password) {
  try {
    const AdmZip = require("adm-zip");
    let zip = new AdmZip(filePath);
    zip.extractAllTo(outputFolderPath, true, false, password);
  } catch (error) {
    throw error;
  }
}
exports.extractZip = extractZip;

function createZip(filePathsList, outputFilePath) {
  try {
    const AdmZip = require("adm-zip");
    let zip = new AdmZip();
    filePathsList.forEach((element) => {
      zip.addLocalFile(element);
    });
    zip.writeZip(outputFilePath);
  } catch (error) {
    throw error;
  }
}
exports.createZip = createZip;

///////////////////////////////////////////////////////////////////////////////
// 7ZIP ///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

let g_pathTo7zipBin;
function checkPathTo7ZipBin() {
  const sevenBin = require("7zip-bin");
  if (g_pathTo7zipBin === undefined) {
    if (process.pkg) {
      if (process.platform === "win32")
        g_pathTo7zipBin = path.join(
          path.dirname(process.execPath),
          "bin/7za.exe"
        );
      else g_pathTo7zipBin = "./bin/7za";
    } else {
      g_pathTo7zipBin = sevenBin.path7za;
    }
  }
  return g_pathTo7zipBin;
}

async function extract7Zip(filePath, outputFolderPath, password) {
  try {
    if (password === undefined || password === "") {
      // to help trigger the right error
      password = "_";
    }
    checkPathTo7ZipBin();

    const Seven = require("node-7z");
    const seven = Seven.extractFull(filePath, outputFolderPath, {
      $bin: g_pathTo7zipBin,
      charset: "UTF-8", // always used just in case?
      password: password,
    });

    let promise = await new Promise((resolve) => {
      seven.on("error", (error) => {
        resolve({ success: false, data: error });
      });
      seven.on("end", () => {
        return resolve({
          success: true,
          data: "",
        });
      });
    });

    if (promise.success === true) {
      return;
    } else if (promise.success === false) {
      throw promise.data;
    }
    throw "Error: unknown error extracting 7z file";
  } catch (error) {
    throw error;
  }
}
exports.extract7Zip = extract7Zip;

async function create7Zip(filePathsList, outputFilePath) {
  try {
    checkPathTo7ZipBin();

    const Seven = require("node-7z");
    const seven = Seven.add(outputFilePath, filePathsList, {
      $bin: g_pathTo7zipBin,
      charset: "UTF-8", // always used just in case?
    });
    // TODO: test archiveType, maybe to support cbt files?
    // not sure, but possible values may be: 7z, xz, split, zip, gzip, bzip2, tar,

    let promise = await new Promise((resolve) => {
      seven.on("error", (error) => {
        resolve({ success: false, data: error });
      });
      seven.on("end", () => {
        return resolve({
          success: true,
        });
      });
    });

    if (promise.success === true) {
      return;
    } else if (promise.success === false) {
      throw promise.data;
    }
  } catch (error) {
    throw error;
  }
}
exports.create7Zip = create7Zip;

///////////////////////////////////////////////////////////////////////////////
// EPUB ///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function extractEpub(filePath, outputFolderPath) {
  // TODO catch errors
  const EPub = require("epub");

  try {
    const epub = new EPub(filePath);
    // parse epub
    await new Promise((resolve, reject) => {
      epub.parse();
      epub.on("error", reject);
      epub.on("end", (err) => {
        if (err) {
          return reject({
            error: true,
            message: err,
          });
        }
        return resolve({
          success: true,
        });
      });
    });

    // get list of image IDs
    let imageIDs = [];
    for (let index = 0; index < epub.spine.contents.length; index++) {
      const element = epub.spine.contents[index];
      await new Promise((resolve, reject) => {
        epub.getChapter(element.id, function (err, data) {
          if (err) {
            return reject({
              error: true,
              message: err,
            });
          } else {
            const rex = /<img[^>]+src="([^">]+)/g;
            while ((m = rex.exec(data))) {
              // e.g. /images/img-0139/OPS/images/0139.jpeg
              let id = m[1].split("/")[2];
              imageIDs.push(id);
            }
            return resolve({
              success: true,
            });
          }
        });
      });
    }

    // extract and save images
    for (let index = 0; index < imageIDs.length; index++) {
      const imageID = imageIDs[index];
      await new Promise((resolve, reject) => {
        epub.getImage(imageID, function (err, data, mimeType) {
          if (err) {
            return reject({
              error: true,
              message: err,
            });
          } else {
            let extension = mimeType.split("/")[1];
            let filePath = path.join(outputFolderPath, index + "." + extension);
            fs.writeFileSync(filePath, Buffer.from(data), "binary");
            return resolve({
              success: true,
            });
          }
        });
      });
    }
  } catch (error) {
    throw "Epub extraction error > " + error;
  }
}
exports.extractEpub = extractEpub;

async function createEpub(imgPathsList, outputFilePath, tempFolderPath) {
  // ref: https://www.npmjs.com/package/epub-gen
  // ref: https://github.com/cyrilis/epub-gen/issues/25
  const Epub = require("epub-gen");
  try {
    let content = [];
    for (let index = 0; index < imgPathsList.length; index++) {
      const imgPath = imgPathsList[index];
      const html =
        "<p class='img-container'><img src='file://" + imgPath + "'/></p>";
      let pageID = "000000000" + index;
      pageID = pageID.substr(
        pageID.length - imgPathsList.length.toString().length
      );
      content.push({
        //title: "page_ " + pageID, //(index + 1).padStart(5, "0"),
        data: html,
        filename: "page_ " + pageID,
      });
    }
    const option = {
      //verbose: true,
      tempDir: tempFolderPath,
      title: path.basename(outputFilePath, path.extname(outputFilePath)),
      author: "", // required
      //publisher: "",
      cover: imgPathsList[0],
      //tocTitle: "",
      customOpfTemplatePath: path.join(
        __dirname,
        "assets/libs/epub/templates/content.opf.ejs"
      ),
      css: "body { margin: 0; padding:0; }\n .img-container{text-align:center; text-indent:0; margin-top: 0; margin-bottom: 0;} img { text-align: center; text-indent:0; }",
      content: content,
    };

    let err = await new Epub(option, outputFilePath).promise;
    if (err !== undefined) throw err;
  } catch (error) {
    throw "Epub creation error > " + error;
  }
}
exports.createEpub = createEpub;

///////////////////////////////////////////////////////////////////////////////
// PDF ////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function createPdf(imgPathsList, outputFilePath, method) {
  try {
    const PDFDocument = require("pdfkit");
    const sharp = require("sharp");
    const pdf = new PDFDocument({
      autoFirstPage: false,
    });
    pdf.pipe(fs.createWriteStream(outputFilePath));
    for (let index = 0; index < imgPathsList.length; index++) {
      const imgPath = imgPathsList[index];
      const img = pdf.openImage(imgPath);
      if (method === "300dpi") {
        let imgDpi = 300;
        pdf.addPage({
          margin: 0,
          size: [(72 * img.width) / imgDpi, (72 * img.height) / imgDpi],
        });
        pdf.image(img, 0, 0, { scale: 72.0 / imgDpi });
      } else if (method === "72dpi") {
        pdf.addPage({
          margin: 0,
          size: [img.width, img.height],
        });
        pdf.image(img, 0, 0);
      } else {
        // use metadata
        let imgData = await sharp(imgPath).metadata();
        let imgDpi = imgData.density;
        if (imgDpi === undefined || imgDpi < 72) imgDpi = 300;
        pdf.addPage({
          margin: 0,
          size: [(72 * img.width) / imgDpi, (72 * img.height) / imgDpi],
        });
        pdf.image(img, 0, 0, { scale: 72.0 / imgDpi });
      }
    }
    pdf.end();
  } catch (error) {
    throw error;
  }
}
exports.createPdf = createPdf;

async function extractPdf(filePath, outputFolderPath, method) {
  const Canvas = require("canvas");
  // ref: https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.js
  const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
  const CMAP_URL = "../node_modules/pdfjs-dist/cmaps/";
  const CMAP_PACKED = true;
  const STANDARD_FONT_DATA_URL = "../node_modules/pdfjs-dist/standard_fonts/";

  const pdf = await pdfjsLib.getDocument({
    url: filePath,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    let page = await pdf.getPage(pageNum);
    let pageWidth = page.view[2]; // [left, top, width, height]
    let pageHeight = page.view[3];
    let userUnit = page.userUnit; // 1 unit = 1/72 inch
    let dpi = 300; // use userUnit some day (if > 1) to set dpi?
    let iPerUnit = 1 / 72;
    let scaleFactor = dpi * iPerUnit; // default: output a 300dpi image instead of 72dpi, which is the pdf default?
    if (method === "render72") {
      scaleFactor = 1;
      dpi = 72;
    }
    // resize if too big?
    let bigSide = pageHeight;
    if (pageHeight < pageWidth) bigSide = pageWidth;
    let scaledSide = bigSide * scaleFactor;
    if (scaledSide > 5000) {
      console.log("\treducing PDF scale factor, img too big");
      scaleFactor = 5000 / bigSide;
      dpi = parseInt(scaleFactor / iPerUnit);
    }
    // RENDER
    let viewport = page.getViewport({
      scale: scaleFactor,
    });
    let canvas = Canvas.createCanvas(viewport.width, viewport.height);
    let context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    ////////////////////////////
    if (method === "embedded") {
      const operatorList = await page.getOperatorList();
      const validTypes = [
        pdfjsLib.OPS.paintImageXObject,
        //pdfjsLib.OPS.paintJpegXObject,
      ];
      let images = [];
      operatorList.fnArray.forEach((element, index) => {
        if (validTypes.includes(element)) {
          images.push(operatorList.argsArray[index][0]);
        }
      });
      if (images.length === 1) {
        const imageName = images[0];
        let image;
        try {
          image = await page.objs.get(imageName);
        } catch (error) {
          console.log(
            `\tcouldn't extract embedded size info for page ${pageNum}, using 300dpi`
          );
          image = undefined;
        }
        if (image !== undefined && image !== null) {
          const imageWidth = image.width;
          const imageHeight = image.height;
          if (imageWidth >= pageWidth && imageHeight >= pageHeight) {
            scaleFactor = imageWidth / pageWidth;
            dpi = parseInt(scaleFactor / iPerUnit);
            viewport = page.getViewport({
              scale: scaleFactor,
            });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;
          }
        }
      }
    }
    //////////////////////////////
    let dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const { changeDpiDataUrl } = require("changedpi");
    let img = changeDpiDataUrl(dataUrl, dpi);
    let data = img.replace(/^data:image\/\w+;base64,/, "");
    let buf = Buffer.from(data, "base64");

    let filePath = path.join(
      outputFolderPath,
      pageNum + "." + FileExtension.JPG
    );
    fs.writeFileSync(filePath, buf, "binary");
    console.log("\textracting pdf page: " + pageNum + " / " + pdf.numPages);

    page.cleanup();
    canvas.height = 0;
    canvas.width = 0;
    canvas = null;
    context = null;
  }
  pdf.cleanup();
  pdf.destroy();
  return;
}
exports.extractPdf = extractPdf;
