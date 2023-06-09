# ACBT - Comic Book Tools

ACBT - Command-line conversion and creation tools for comic book files (Windows & Linux).

This project is still in early development, lacking some of the functionality and testing required for a first stable release, and aims to be a stand-alone, command-line version of some of the tools available in ["ACBR - Comic Book Reader"](https://github.com/binarynonsense/comic-book-reader).

## Contents:

- [Features](#features)
- [Usage](#usage)
- [Known Issues](#known-issues)
- [Downloads](#downloads)
- [License](#license)

## Features:

- Windows & GNU/Linux versions.
- Tools:
  - Convert/Resize:
    - comic books (cbr, cbz, cb7, epub (images only) or pdf to cbz, cb7, epub or pdf).
  - Create:
    - a comic book (cbz, cb7, pdf or epub) from a list of image files.
  - Extract:
    - comic book pages to image files (jpg, png, avif or webp).

## Usage:

- Convert/Resize:
  - print a list of the available arguments and options:
    - `acbt convert -h`
  - example: convert the file 'test.cbz' in the current folder to pdf
    - `acbt convert -f pdf test.cbz`
  - example: convert the file 'test.cbz' in the current folder and all the files in the 'input' subfolder to epub
    - `acbt convert -f epub text.cbz input/*.*`
  - example: convert the file 'test.cbr' in the 'input' subfolder to cb7, scaling the images to a 60% of their original size, converting them to png and storing the output file in the 'output' subfolder
    - `acbt convert -f cb7 -o output -s 60 -if png input/test.cbr`
- Create:
  - print a list of the available arguments and options:
    - `acbt create -h`
  - example: create a cbz file from all the jpg images in the 'input' subfolder and store it in the current folder using the default name
    - `acbt create -f cbz input/*.jpg`
  - example: same as before but scaling the images to a 60%, converting them to webp, using 'my comic book' as the base for the created file's name and storing it in the 'output' subfolder
    - `acbt create -f cbz -s 60 -if webp -o temp/ -n "my comic book" input/*.jpg`
- Extract:
  - print a list of the available arguments and options:
    - `acbt extract -h`
  - example: extract the file 'test.cbz' in the current folder to that same folder (a new subfolder inside it, with a unique name based on the file's one, will be created and the extracted images will be stored there)
    - `acbt extract test.cbz`
  - example: same as before but will also extract all the files inside the 'input' subfolder
    - `acbt extract text.cbz input/*.*`
  - example: extract the file 'test.cbr' in the 'input' subfolder to the 'output' subfolder (a new subfolder inside it, with a unique name based on the file's one, will be created and the extracted images will be stored there), scaling the images to a 60% of their original size and converting them to png
    - `acbt extract -o output -s 60 -if png input/test.cbr`

## Known Issues:

On Windows, extracting a pdf or converting a pdf to any other format fails with an error due to a conflict between two of the libraries I use (node-canvas and sharp) that I haven't been able to fix so far.

## Downloads:

The project is still in beta, check the [Releases](https://github.com/binarynonsense/comic-book-tools/releases) section to download the latest build if you want to help test it.

## License:

ACBT's code is released under the BSD 2-Clause [license](./LICENSE). To check the licenses of the node modules and other libraries used in the project go to the [licenses](./licenses/) folder.
