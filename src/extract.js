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
  let filePaths = [];
  inputFilePaths.forEach((inputFilePath) => {
    if (fs.existsSync(inputFilePath)) {
      try {
        let stats = fs.statSync(inputFilePath);
        if (stats.isFile()) {
          if (fileFormats.hasBookExtension(inputFilePath)) {
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
    console.log("No comic book files found");
    return;
  }
  // options
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
  let pdfExtractionMethod = options.pdfExtractionMethod;
  /////////////////////////////////
  // extracting files
  /////////////////////////////////
  console.log(`\Extracting ${filePaths.length} file/s`);
  let summaryTotal = filePaths.length;
  let summarySuccesses = 0;
  let summaryErrors = 0;
  for (let index = 0; index < filePaths.length; index++) {
    const filePath = filePaths[index];
    let fileName = path.basename(filePath, path.extname(filePath));
    let outputSubFolderPath = path.join(outputFolderPath, fileName);
    let i = 1;
    while (fs.existsSync(outputSubFolderPath)) {
      i++;
      outputSubFolderPath = path.join(
        outputFolderPath,
        fileName + "(" + i + ")"
      );
    }
    console.log("");
    console.log("Extracting " + filePath);
    try {
      /////////////////////////////////
      // get file type
      /////////////////////////////////
      let fileType;
      let fileExtension = path.extname(filePath).toLowerCase();
      let _fileType = await FileType.fromFile(filePath);
      if (_fileType !== undefined) {
        fileExtension = "." + _fileType.ext;
      }
      if (fileExtension === "." + FileExtension.PDF) {
        fileType = FileDataType.PDF;
      } else if (fileExtension === "." + FileExtension.EPUB) {
        fileType = FileDataType.EPUB;
      } else {
        if (
          fileExtension === "." + FileExtension.RAR ||
          fileExtension === "." + FileExtension.CBR
        ) {
          fileType = FileDataType.RAR;
        } else if (
          fileExtension === "." + FileExtension.ZIP ||
          fileExtension === "." + FileExtension.CBZ
        ) {
          fileType = FileDataType.ZIP;
        } else if (
          fileExtension === "." + FileExtension.SEVENZIP ||
          fileExtension === "." + FileExtension.CB7
        ) {
          fileType = FileDataType.SEVENZIP;
        } else {
          throw "The file is not of a valid of type";
        }
      }
      /////////////////////////////////
      // extract content
      /////////////////////////////////
      let tempFolderPath = fileUtils.createTempFolder(options.tempPath);
      console.log("\textracting images...");
      try {
        switch (fileType) {
          case FileDataType.RAR:
            await fileFormats.extractRar(filePath, tempFolderPath);
            break;
          case FileDataType.ZIP:
            fileFormats.extractZip(filePath, tempFolderPath);
            break;
          case FileDataType.SEVENZIP:
            await fileFormats.extract7Zip(filePath, tempFolderPath);
            break;
          case FileDataType.EPUB:
            await fileFormats.extractEpub(filePath, tempFolderPath);
            break;
          case FileDataType.PDF:
            await fileFormats.extractPdf(
              filePath,
              tempFolderPath,
              pdfExtractionMethod
            );
            break;
        }
      } catch (error) {
        throw "Couldn't extract the pages > " + error;
      }
      /////////////////////////////////
      // modify content
      /////////////////////////////////
      let comicInfoFilePath =
        fileUtils.getComicInfoFileInFolderRecursive(tempFolderPath);
      let imgFilePaths =
        fileUtils.getImageFilesInFolderRecursive(tempFolderPath);
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
      let didChangeFormat = false;
      if (imageOutputFormat !== FileExtension.NOT_SET) {
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
      try {
        console.log("\textracting to " + outputSubFolderPath);
        if (comicInfoFilePath) imgFilePaths.push(comicInfoFilePath);
        // create subFolderPath
        if (!fs.existsSync(outputSubFolderPath)) {
          fs.mkdirSync(outputSubFolderPath);
          for (let index = 0; index < imgFilePaths.length; index++) {
            let oldPath = imgFilePaths[index];
            let newPath = path.join(
              outputSubFolderPath,
              path.basename(oldPath)
            );
            fileUtils.moveFile(oldPath, newPath);
          }
        } else {
          throw "The output subfolder shouldn't exist " + outputSubFolderPath;
        }
      } catch (error) {
        throw "Couldn't extract the file " + filePath + " > " + error;
      }
    } catch (error) {
      fileUtils.cleanUpTempFolder();
      console.log(
        "ERROR: Couldn't extract the file to " +
          outputSubFolderPath +
          " > " +
          error
      );
      summaryErrors++;
      continue;
    }
    /////////////////////////////////
    // clean up
    /////////////////////////////////
    summarySuccesses++;
    fileUtils.cleanUpTempFolder();
    console.log("Successfully extracted the file to " + outputSubFolderPath);
  }
  console.log("Extraction Finished:");
  console.log("\ttotal files: " + summaryTotal);
  console.log("\tfiles extracted: " + summarySuccesses);
  console.log("\terrors: " + summaryErrors);
}
exports.start = start;
