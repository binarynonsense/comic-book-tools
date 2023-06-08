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
    - not yet available.
  - Extract:
    - not yet available.

## Usage:

- Convert/Resize:
  - print a list of the available arguments and options:
    - `acbt convert -h`
  - example: convert the file 'test.cbz' in the current folder to pdf
    - `acbt convert -f pdf test.cbz`
  - example: convert the file 'test.cbz' in the current folder and all the files in the 'input' subfolder to epub
    - `acbt convert -f epub text.cbz input/*.*`
  - example: convert the file 'test.cbr' in the 'input' subfolder to cb7 and store it in the 'output' subfolder
    - `acbt convert -f cb7 -o output input/test.cbr`
  - example: same as before but scaling the images to a 60% of their original size
    - `acbt convert -f cb7 -o output -s 60 input/test.cbr`
  - example: same as before but converting the images to png
    - `acbt convert -f cb7 -o output -s 60 -if png input/test.cbr`
- Create:
  - not yet available.
- Extract:
  - not yet available.

## Known Issues:

On Windows, conversion from pdf to any other format fails with an error due to a conflict between two of the libraries I use (node-canvas and sharp) that I haven't been able to fix so far.

## Downloads:

Not yet available.

## License:

ACBT's code is released under the BSD 2-Clause [license](./LICENSE).
