const path = require("path");
const os = require("os");
const fs = require("fs");
const fileFormats = require("./file-formats");

///////////////////////////////////////////////////////////////////////////////
// HELPERS ////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

exports.moveFile = function (oldPath, newPath) {
  try {
    fs.renameSync(oldPath, newPath);
  } catch (error) {
    if (error.code === "EXDEV") {
      // EXDEV = cross-device link not permitted.
      fs.copyFileSync(oldPath, newPath);
      fs.unlinkSync(oldPath);
    } else {
      throw error;
    }
  }
};

exports.compare = function (a, b) {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

///////////////////////////////////////////////////////////////////////////////
// GET IMAGES /////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const getImageFilesInFolderRecursive = function (folderPath) {
  let filesArray = [];
  let dirs = [];

  if (fs.existsSync(folderPath)) {
    let nodes = fs.readdirSync(folderPath);
    nodes.forEach((node) => {
      const nodePath = path.join(folderPath, node);
      if (fs.lstatSync(nodePath).isDirectory()) {
        dirs.push(nodePath); // check later so this folder's imgs come first
      } else {
        if (fileFormats.hasImageExtension(nodePath)) {
          filesArray.push(nodePath);
        }
      }
    });
    // now check inner folders
    dirs.forEach((dir) => {
      filesArray = filesArray.concat(getImageFilesInFolderRecursive(dir));
    });
  }
  return filesArray;
};
exports.getImageFilesInFolderRecursive = getImageFilesInFolderRecursive;

function getImageFilesInFolder(folderPath) {
  if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
    let filesInFolder = fs.readdirSync(folderPath);
    if (filesInFolder.length === 0) {
      return [];
    } else {
      return filesInFolder.filter(fileFormats.hasImageExtension);
    }
  } else {
    return [];
  }
}
exports.getImageFilesInFolder = getImageFilesInFolder;

///////////////////////////////////////////////////////////////////////////////
// GET COMIC INFO FILE ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const getComicInfoFileInFolderRecursive = function (folderPath) {
  let filesArray = [];
  let dirs = [];

  if (fs.existsSync(folderPath)) {
    let nodes = fs.readdirSync(folderPath);
    nodes.forEach((node) => {
      const nodePath = path.join(folderPath, node);
      if (fs.lstatSync(nodePath).isDirectory()) {
        dirs.push(nodePath); // check later so this folder's imgs come first
      } else {
        let fileName = path.basename(nodePath);
        if (fileName.toLowerCase() === "comicinfo.xml") {
          filesArray.push(nodePath);
        }
      }
    });
    // now check inner folders
    dirs.forEach((dir) => {
      filesArray = filesArray.concat(getComicInfoFileInFolderRecursive(dir));
    });
  }

  // NOTE: could there be more than one? I'll just return the first one for now, if any
  if (filesArray.length > 0) return filesArray[0];
  else return undefined;
};
exports.getComicInfoFileInFolderRecursive = getComicInfoFileInFolderRecursive;

///////////////////////////////////////////////////////////////////////////////
// TEMP FOLDER ////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

g_tempFolderPath = undefined;

function getTempFolderPath() {
  return g_tempFolderPath;
}
exports.getTempFolderPath = getTempFolderPath;

function createTempFolder(baseFolderPath) {
  if (baseFolderPath) {
    let folderPath;
    try {
      folderPath = path.resolve(baseFolderPath);
      if (fs.existsSync(folderPath)) {
        try {
          let stats = fs.statSync(folderPath);
          if (!stats.isDirectory()) {
            throw "The path didn't correspond to a folder";
          }
        } catch (error) {
          // shouldn't be able to reach here
          throw "The folder didn't exist";
        }
      } else {
        throw "Invalid path";
      }
    } catch (error) {
      folderPath = os.tmpdir();
    }
    g_tempFolderPath = fs.mkdtempSync(path.join(folderPath, "acbt-"));
  } else {
    g_tempFolderPath = fs.mkdtempSync(path.join(os.tmpdir(), "acbt-"));
  }
  console.log("\ttemp folder created: " + g_tempFolderPath);
  return g_tempFolderPath;
}
exports.createTempFolder = createTempFolder;

function cleanUpTempFolder() {
  if (g_tempFolderPath === undefined) return;
  deleteTempFolderRecursive(g_tempFolderPath);
  g_tempFolderPath = undefined;
}
exports.cleanUpTempFolder = cleanUpTempFolder;

const deleteTempFolderRecursive = function (folderPath) {
  if (fs.existsSync(folderPath)) {
    let folderName = path.basename(folderPath);
    if (!folderName.startsWith("acbt-")) {
      // safety check
      return;
    }
    let files = fs.readdirSync(folderPath);
    files.forEach((file) => {
      const entryPath = path.join(folderPath, file);
      if (fs.lstatSync(entryPath).isDirectory()) {
        deleteTempFolderRecursive(entryPath);
      } else {
        fs.unlinkSync(entryPath); // delete the file
      }
    });
    fs.rmdirSync(folderPath);
    console.log("\ttemp folder deleted: " + folderPath);
  }
};
