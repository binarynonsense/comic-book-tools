const fs = require("fs");
const path = require("path");
const FileType = require("file-type");
const sharp = require("sharp");

const fileFormats = require("./file-formats");
const fileUtils = require("./file-utils");
const { FileExtension, FileDataType } = require("./constants");

async function start(inputFilePaths, options, command) {
  /////////////////////////////////
  // validate input
  /////////////////////////////////
  // arguments
  inputFilePaths = fileUtils.expandCLIFilePaths(inputFilePaths);
  let filePaths = [];
  inputFilePaths.forEach((inputFilePath) => {
    if (fs.existsSync(inputFilePath)) {
      try {
        let stats = fs.statSync(inputFilePath);
        if (stats.isFile()) {
          if (fileFormats.hasImageExtension(inputFilePath)) {
            // make absolute
            inputFilePath = path.resolve(inputFilePath);
            // avoid duplicate paths
            if (filePaths.indexOf(inputFilePath) === -1)
              filePaths.push(inputFilePath);
          }
        } else if (stats.isDirectory()) {
          // TODO: get files from dir? recursive??
          // Ignore for now
        }
      } catch (error) {}
    }
  });
  if (filePaths.length <= 0) {
    console.log("No image files found");
    return;
  }
  // options
  let outputFileName = options.outputName;
  let outputFolderPath;
  try {
    outputFolderPath = path.resolve(options.outputFolder);
    if (fs.existsSync(outputFolderPath)) {
      try {
        let stats = fs.statSync(outputFolderPath);
        if (!stats.isDirectory()) {
          throw "The path didn't correspond to a folder";
        }
      } catch (error) {
        // shouldn't be able to reach here
        throw "The folder didn't exist";
      }
    } else {
      if (options.createOutputFolder === "true") {
        fs.mkdirSync(outputFolderPath, { recursive: true });
        console.log("Output folder created: " + outputFolderPath);
      } else {
        throw "The folder didn't exist and --create-output-folder was set to false";
      }
    }
  } catch (error) {
    console.log("Error: the output folder's path is invalid > " + error);
    return;
  }
  let outputFormat = options.format;
  let outputScale = parseInt(options.scale);
  if (!Number.isInteger(outputScale) || outputScale <= 0 || outputScale > 100) {
    outputScale = 100;
  }
  let imageOutputFormat = options.imageFormat;
  if (imageOutputFormat === "original")
    imageOutputFormat = FileExtension.NOT_SET;
  let imageOutputQuality = parseInt(options.imageQuality);
  if (
    !Number.isInteger(imageOutputQuality) ||
    imageOutputQuality <= 0 ||
    imageOutputQuality > 100
  ) {
    imageOutputQuality = 90;
  }
  let pdfCreationMethod = options.pdfCreationMethod;

  let summaryTotal = filePaths.length;
  let summarySuccesses = 0;
  let summaryErrors = 0;
  let outputFilePath = path.join(
    outputFolderPath,
    outputFileName + "." + outputFormat
  );
  let i = 1;
  while (fs.existsSync(outputFilePath)) {
    i++;
    outputFilePath = path.join(
      outputFolderPath,
      outputFileName + "(" + i + ")." + outputFormat
    );
  }
  try {
    console.log(`\tCreating file ` + outputFilePath);
    /////////////////////////////////
    // copy images to temp
    /////////////////////////////////
    let tempFolderPath = fileUtils.createTempFolder(options.tempPath);
    let imgFilePaths = [];
    for (let index = 0; index < filePaths.length; index++) {
      const inPath = filePaths[index];
      let outName = path.basename(inPath);
      // if (g_outputPageOrder === "byPosition") {
      //   const extension = path.extname(inPath);
      //   outName = index + extension;
      // }
      const outPath = path.join(tempFolderPath, outName);
      fs.copyFileSync(inPath, outPath, fs.constants.COPYFILE_EXCL);
      imgFilePaths.push(outPath);
    }
    /////////////////////////////////
    // modify images
    /////////////////////////////////
    if (imgFilePaths === undefined || imgFilePaths.length === 0) {
      throw "No images could be found";
    }
    imgFilePaths.sort(fileUtils.compare);
    // resize ////////////////////////
    let didResize = false;
    if (outputScale < 100) {
      try {
        didResize = true;
        console.log("\tresizing images...");
        sharp.cache(false);
        for (let index = 0; index < imgFilePaths.length; index++) {
          console.log(
            "\tresizing image " +
              ": " +
              (index + 1) +
              " / " +
              imgFilePaths.length
          );
          let imgFilePath = imgFilePaths[index];
          let imgFileFolderPath = path.dirname(imgFilePath);
          let imgFileName = path.basename(
            imgFilePath,
            path.extname(imgFilePath)
          );
          let tmpImgFilePath = path.join(
            imgFileFolderPath,
            imgFileName + "." + FileExtension.TMP
          );
          let data = await sharp(imgFilePath).metadata();
          await sharp(imgFilePath)
            .withMetadata()
            .resize(Math.round(data.width * (outputScale / 100)))
            .toFile(tmpImgFilePath);

          fs.unlinkSync(imgFilePath);
          fileUtils.moveFile(tmpImgFilePath, imgFilePath);
        }
      } catch (error) {
        throw "Couldnt resize the images > " + error;
      }
    }
    // reformat /////////////////////
    // change image format if requested
    // or pdfkit incompatible (not jpg or png)
    let didChangeFormat = false;
    if (
      outputFormat === FileExtension.PDF ||
      imageOutputFormat !== FileExtension.NOT_SET
    ) {
      console.log("\tconverting images...");
      try {
        sharp.cache(false); // avoid EBUSY error on windows
        for (let index = 0; index < imgFilePaths.length; index++) {
          let imgFilePath = imgFilePaths[index];
          let imgFileFolderPath = path.dirname(imgFilePath);
          let imgFileName = path.basename(
            imgFilePath,
            path.extname(imgFilePath)
          );
          if (outputFormat === FileExtension.PDF) {
            // change to a format compatible with pdfkit if needed
            if (
              imageOutputFormat === FileExtension.WEBP ||
              imageOutputFormat === FileExtension.AVIF ||
              (imageOutputFormat === FileExtension.NOT_SET &&
                !fileFormats.hasPdfKitCompatibleImageExtension(imgFilePath))
            ) {
              imageOutputFormat = FileExtension.JPG;
            }
          }
          if (imageOutputFormat != FileExtension.NOT_SET) {
            didChangeFormat = true;
            console.log(
              "\tconverting image " +
                ": " +
                (index + 1) +
                " / " +
                imgFilePaths.length
            );
            let imgTmpFilePath = path.join(
              imgFileFolderPath,
              imgFileName + "." + FileExtension.TMP
            );
            if (imageOutputFormat === FileExtension.JPG) {
              await sharp(imgFilePath)
                .withMetadata()
                .jpeg({
                  quality: imageOutputQuality,
                })
                .toFile(imgTmpFilePath);
            } else if (imageOutputFormat === FileExtension.PNG) {
              if (imageOutputQuality < 100) {
                await sharp(imgFilePath)
                  .withMetadata()
                  .png({
                    quality: imageOutputQuality,
                  })
                  .toFile(imgTmpFilePath);
              } else {
                await sharp(imgFilePath)
                  .withMetadata()
                  .png()
                  .toFile(imgTmpFilePath);
              }
            } else if (imageOutputFormat === FileExtension.WEBP) {
              await sharp(imgFilePath)
                .withMetadata()
                .webp({
                  quality: imageOutputQuality,
                })
                .toFile(imgTmpFilePath);
            } else if (imageOutputFormat === FileExtension.AVIF) {
              await sharp(imgFilePath)
                .withMetadata()
                .avif({
                  quality: imageOutputQuality,
                })
                .toFile(imgTmpFilePath);
            }
            let newImgFilePath = path.join(
              imgFileFolderPath,
              imgFileName + "." + imageOutputFormat
            );
            fs.unlinkSync(imgFilePath);
            fileUtils.moveFile(imgTmpFilePath, newImgFilePath);
            imgFilePaths[index] = newImgFilePath;
          }
        }
      } catch (error) {
        throw "Couldn't convert the images > " + error;
      }
    }
    /////////////////////////////////
    // bundle content
    /////////////////////////////////
    console.log("\tcreating " + outputFilePath);
    try {
      if (outputFormat === FileExtension.PDF) {
        await fileFormats.createPdf(
          imgFilePaths,
          outputFilePath,
          pdfCreationMethod
        );
      } else if (outputFormat === FileExtension.EPUB) {
        await fileFormats.createEpub(
          imgFilePaths,
          outputFilePath,
          fileUtils.getTempFolderPath()
        );
      } else if (outputFormat === FileExtension.CB7) {
        await fileFormats.create7Zip(imgFilePaths, outputFilePath);
      } else {
        //cbz
        fileFormats.createZip(imgFilePaths, outputFilePath);
      }
    } catch (error) {
      throw "Couldn't create file " + outputFilePath + " > " + error;
    }
    /////////////////////////////////
    // clean up
    /////////////////////////////////
    summarySuccesses++;
    fileUtils.cleanUpTempFolder();
    console.log("Successfully created " + outputFilePath);
  } catch (error) {
    fileUtils.cleanUpTempFolder();
    console.log("ERROR: Couldn't create " + outputFilePath + " > " + error);
    summaryErrors++;
  }

  console.log("Creation Finished:");
  //console.log("\ttotal files: " + summaryTotal);
  console.log("\tfiles created: " + summarySuccesses);
  console.log("\terrors: " + summaryErrors);
}
exports.start = start;
