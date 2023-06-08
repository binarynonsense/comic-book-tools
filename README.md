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
  - print a list of the available arguments:
    - acbt convert -h
  - example: convert the file 'test.cbz' to pdf
    - acbt convert -f pdf test.cbz
  - example: convert the file 'test.cb7' stored in the 'input' subfolder to cbz and store it in the 'output' subfolder
    - acbt convert -f pdf -o output input/test.cbz
- Create:
  - not yet available.
- Extract:
  - not yet available.

## Known Issues:

On Windows, conversion from pdf to any other format fails with an error due to a conflict between two of the libraries I use (node-canvas and sharp) that I haven't been able to fix so far.

## Downloads:

Not yet available.

## License:

ACBR's code is released under the BSD 2-Clause [license](./LICENSE).
