const { Command, Option } = require("commander");
const convert = require("./convert");
const extract = require("./extract");

const program = new Command();
program.name("acbt").version(require("../package.json").version);
// CONVERT //////////////////////////////////////////////////////////////
program
  .command("convert")
  .description("Convert and/or resize comic book files")
  .argument(
    "<input_file...>",
    "input file/s; supported formats: cbz, cbr, cb7, epub (images only) & pdf"
  )
  // files
  .option(
    "-o, --output-folder <path>",
    "write the output file to this folder",
    "."
  )
  .addOption(
    new Option(
      "-co, --create-output-folder <bool>",
      "create the output folder if the provided path doesn't exist"
    )
      .default("false")
      .choices(["true", "false"])
  )
  .addOption(
    new Option(
      "-f, --format <format>",
      "convert the input file to this comic book format"
    )
      .default("cbz")
      .choices(["cbz", "cb7", "pdf", "epub"])
  )
  .option(
    "-s, --scale <integer>",
    "scale the input file's pages by this percentage; must be an integer value between 1 and 100",
    "100"
  )
  .option(
    "-tp, --temp-path <path>",
    "use this folder to write/read temporary files; the operating system's default directory for temporary files will be used if none is provided"
  )
  // images
  .addOption(
    new Option(
      "-if, --image-format <format>",
      "convert the input file's pages to this image format"
    )
      .default("original")
      .choices(["original", "jpg", "png", "avif", "webp"])
  )
  .option(
    "-iq, --image-quality <integer>",
    "use this quality value when converting images; must be an integer value between 1 and 100",
    "90"
  )
  // pdf
  .addOption(
    new Option(
      "--pdf-creation-method <method>",
      "use this method to set the dpi when creating pdf files"
    )
      .default("metadata")
      .choices(["metadata", "300dpi", "72dpi"])
  )
  .addOption(
    new Option(
      "--pdf-extraction-method <method>",
      "use this rendering method to set the dpi when extracting pdf image files"
    )
      .default("embedded")
      .choices(["embedded", "render300", "render72"])
  )
  // action
  .action(function (input_file, options, command) {
    //console.log(options);
    convert.start(input_file, options, command);
  })
  // help: example calls
  .addHelpText(
    "after",
    `
  
  Example calls:
    $ acbt convert comicbook.cb7
    $ acbt convert -f cbz -o ./outputFolder comicbook.cb7
    $ acbt convert --format pdf comicbook_1.cbz ./comicbook_2.pdf
    $ acbt convert --output-folder ./outputFolder -f cb7 --scale 50 -if webp *.*`
  );
// EXTRACT //////////////////////////////////////////////////////////////
program
  .command("extract")
  .description("Extract comic book files' pages")
  .argument(
    "<input_file...>",
    "input file/s; supported formats: cbz, cbr, cb7, epub (images only) & pdf"
  )
  // files
  .option(
    "-o, --output-folder <path>",
    "write the output to this folder; a new subfolder inside it, with a unique name based on the file's one, will be created and the extracted images will be stored there",
    "."
  )
  .addOption(
    new Option(
      "-co, --create-output-folder <bool>",
      "create the output folder if the provided path doesn't exist"
    )
      .default("false")
      .choices(["true", "false"])
  )
  .option(
    "-s, --scale <integer>",
    "scale the input file's pages by this percentage; must be an integer value between 1 and 100",
    "100"
  )
  .option(
    "-tp, --temp-path <path>",
    "use this folder to write/read temporary files; the operating system's default directory for temporary files will be used if none is provided"
  )
  // images
  .addOption(
    new Option(
      "-if, --image-format <format>",
      "convert the input file's pages to this image format"
    )
      .default("original")
      .choices(["original", "jpg", "png", "avif", "webp"])
  )
  .option(
    "-iq, --image-quality <integer>",
    "use this quality value when converting images; must be an integer value between 1 and 100",
    "90"
  )
  // pdf
  .addOption(
    new Option(
      "--pdf-extraction-method <method>",
      "use this rendering method to set the dpi when extracting pdf image files"
    )
      .default("embedded")
      .choices(["embedded", "render300", "render72"])
  )
  // action
  .action(function (input_file, options, command) {
    //console.log(options);
    extract.start(input_file, options, command);
  })
  // help: example calls
  .addHelpText(
    "after",
    `
  
  Example calls:
    $ acbt extract comicbook.cb7
    $ acbt extract -o ./outputFolder comicbook.cb7
    $ acbt extract --output-folder ./outputFolder --scale 50 -if webp *.*`
  );
//////////////////////////////////////////////////////////////////////////////
program.parse();

// NOTE: to call from npm start add two dashes, ej: npm start convert -- --input ./al.cbz other.cbr -o something
// npm start convert -- --path ./outputFolder -f cb7 --scale 50 -if webp *.*
// npm start convert -- -f cbz example.cbz
