# ACBT - Comic Book Tools

ACBT - Command-line conversion and creation tools for comic book files (Windows & Linux).

This is a stand-alone, command-line version of some of the tools available in ["ACBR - Comic Book Reader"](https://github.com/binarynonsense/comic-book-reader).

## Contents:

- [Features](#features)
- [Usage](#usage)
- [Downloads](#downloads)
- [License](#license)

## Features:

- Windows & GNU/Linux versions.
- Tools:
  - Convert/Resize:
    - comic books (CBR, CBZ, CB7, EPUB (images only) or PDF to CBZ, CB7, EPUB or PDF).
  - Create:
    - a comic book (CBZ, CB7, PDF or EPUB) from a list of image files.
  - Extract:
    - comic book pages to image files (JPG, PNG, AVIF or WebP).

## Usage:

- Convert/Resize:
  - print a list of the available arguments and options:
    - `acbt convert -h`
  - example: convert the file 'test.cbz' in the current folder to PDF
    - `acbt convert -f pdf test.cbz`
  - example: convert the file 'test.cbz' in the current folder and all the files in the 'input' subfolder to EPUB
    - `acbt convert -f epub text.cbz input/*.*`
  - example: convert the file 'test.cbr' in the 'input' subfolder to CB7, scaling the images to a 60% of their original size, converting them to png and storing the output file in the 'output' subfolder
    - `acbt convert -f cb7 -o output -s 60 -if png input/test.cbr`
- Create:
  - print a list of the available arguments and options:
    - `acbt create -h`
  - example: create a CBZ file from all the JPG images in the 'input' subfolder and store it in the current folder using the default name
    - `acbt create -f cbz input/*.jpg`
  - example: same as before but scaling the images to a 60%, converting them to WebP, using 'my comic book' as the base for the created file's name and storing it in the 'output' subfolder
    - `acbt create -f cbz -s 60 -if webp -o temp/ -n "my comic book" input/*.jpg`
- Extract:
  - print a list of the available arguments and options:
    - `acbt extract -h`
  - example: extract the file 'test.cbz' in the current folder to that same folder (a new subfolder inside it, with a unique name based on the file's one, will be created and the extracted images will be stored there)
    - `acbt extract test.cbz`
  - example: same as before but will also extract all the files inside the 'input' subfolder
    - `acbt extract text.cbz input/*.*`
  - example: extract the file 'test.cbr' in the 'input' subfolder to the 'output' subfolder (a new subfolder inside it, with a unique name based on the file's one, will be created and the extracted images will be stored there), scaling the images to a 60% of their original size and converting them to PNG
    - `acbt extract -o output -s 60 -if png input/test.cbr`

## Downloads:

<a href="https://github.com/binarynonsense/comic-book-tools/releases/latest"><img src="https://shields.io/github/v/release/binarynonsense/comic-book-tools?display_name=tag&label=version" title="version"></a>

- [Windows](https://github.com/binarynonsense/comic-book-tools/releases/latest/download/ACBT_Windows.zip)
- [Linux](https://github.com/binarynonsense/comic-book-tools/releases/latest/download/ACBT_Linux.zip)

## License:

ACBT's code is released under the BSD 2-Clause [license](./LICENSE). To check the licenses of the node modules and other libraries used in the project go to the [licenses](./licenses/) folder.
