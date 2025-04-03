# Jigsaw Puzzle Solver using Edge Contour Profiles - project for the Image Processing and Computer Vision course

## Description

This project is designed to **solve jigsaw puzzles by analyzing the contours of individual pieces**. The algorithm identifies and extracts edges, classifies piece shapes, and matches them to reconstruct the puzzle, similar to how humans solve puzzles by focusing on piece contours rather than colors or patterns.

The project includes:
- A **Jupyter Notebook** that implements the main algorithm using computer vision techniques through OpenCV2.
- **Python scripts** for batch processing and modifying the image database.
- An **image database** containing over 400 puzzle pieces, representing about half of an actual full puzzle.
- **P5.js files** to visually represent the reconstructed puzzle using the data extracted from Python and the Jupyter Notebook.

The main of the code runs in the Notebook, and also includes a complete explanation of the entire project, including an analysis of the reconstruction made in P5JS.

## Installation

Download or clone the repository

## Usage

### Setting up a VEnv or Conda Env (recommended)

In order to run the Notebook, you need to have jupyter installed, it is recommended to create a conda or venv environment with Python3, in which you should install cv2, matplotlib, numpy, os, random, re

### Running the Notebook
open a terminal (preferably a Conda or VEnv) and `cd ` to the _Notebook\_Jigsaw_ folder (where `.ipynb` file is located), then run
`jupyter notebook`
a browser window should pop-up, listing all the folder's files, you should then click on the `.ipynb` file

### Running P5JS sketch
open a terminal in the _P5JS\_Jigsaw_ folder (where `index.html` is located) and run
`python -m http.server 8000`
or any other port number, to open a localhost (necessary for JS to load JSON files due to CORS policies),
then open a browser tab and type
`localhost:8000`
if something went wrong you could debug any error message in the browser developer tab (`ctrl+shift+I` on Windows)

## License

This project is licensed under the **GPL-3.0 License**. You can freely modify, distribute, and use this code, provided that you adhere to the terms of the GPL-3.0 License, which requires that any modified versions also be open-source and distributed under the same license.
