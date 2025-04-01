// Andrea Gemmani 
// 2025-02-27 start Jigsaw Puzzle Edges Visualizer
// 2025-03-03 iteration UI match
// 2025-04-01 GitHub upload



// PER OGNI PUNTO DELLA CURVA DUE CERCO IL CLOSEST POINT ALLA CURVA 1
// E POI POSSO EITHER SOMMARE LE DISTANZE O FARE ANALISI STATISTICA
// 

// .			TL ----------UP---------- TR
// .			|                         |
// .			|                         |
// .			|                         |
// .			L                         R
// .			E                         I
// .			F                         G
// .			T                         TH
// .			|                         |
// .			|                         |
// .			|                         |
// .			BL ---------DOWN--------- BR


// TODO:
// - ruotare batch pezzi attorno ad un punto
// - rotazione singolo pezzo più granulare
// - switchare prossimo pezzo da mettere in automatico in base ad edge match
// - trovare centro di ogni pezzo (?)
// 		- salvare ogni centro calcolato
// 		- trovare posizione di ogni corner rispetto al centro (come se centro fosse in (0,0))
// - funzione che calcola la posizione del centro e la rotazione del pezzo, dati due corners 

// - creare un grafo in cui, dato un certo threshold di maxDistOK,
//   due punti (pieces) del grafo sono collegati se la loro distanza nel matching è minore di quel threshold

// - usare due palette diverse per primo (E1) e secondo (E2) pezzo in mode allineati 
// - colorare batches in base al loro numero

// DONE:
// - spostare batch (ma non tutti) pezzi
// - calcolare tutti i quadratini 2x2 e controllare quali matchano
// 


let allEdgesDataJSON;
let actPieceIndex = 0;
let dyText = 20;
let baseyText = 10;

let textSize_HUD_UI = 12;
let textSize_PieceNumber = 20;
let textSize_EdgeName = 16;

let textHUD_centerEdges_x = 0;
let textHUD_centerEdges_y = 0;

let ackw = 20;	

let flag_loop = true;
let flag_showCommandsList = true;
let flag_refreshBackground = true;
let flag_autoUpdateSwitchPiece = false;
let flag_showHUD = true;
let flag_showText = true;

let autoUpdateFreq = 5;

let flag_modeSwitcher = false; 

let arrEdgesColour = [];
let arrCornersColour = [];



const enumEdges = {
	LEFT : 0,
	DOWN : 1,
	RIGHT : 2,
	UP : 3
}

let arrAlignedEdges = [];
let arrShowinPiecesEdge = []; // array di coppie [pezzo,edge]
let indArrShowinPiece = 0;


filePathEdges = "edgesCurves_JSON_V19.json";

var arrFaultyPieces = [];





function rotateEdgeAlign(arrEdgeToRot, C1, C2) {
	// Calcola il vettore direzione tra C1 e C2
	let dx = C2[0] - C1[0];
	let dy = C2[1] - C1[1];
	
	// Calcola l'angolo di rotazione necessario per allineare C1-C2 sull'asse y
	// let angle = -Math.atan2(dx, dy);
	let angle = -Math.atan2(dy, dx);
	
	// Funzione di rotazione di un punto attorno all'origine
	function rotatePoint(point, angle) {
		let x = point[0] * Math.cos(angle) - point[1] * Math.sin(angle);
		let y = point[0] * Math.sin(angle) + point[1] * Math.cos(angle);
		return [x, y];
	}
	
	// Trasla tutti i punti per portare C1 in (0,0) e poi ruota
	let transformedPoints = arrEdgeToRot.map(point => {
		let translated = [point[0] - C1[0], point[1] - C1[1]];
		return rotatePoint(translated, angle);
	});
	
	// Trasforma C1 e C2
	let newC1 = [0, 0];
	let newC2 = rotatePoint([C2[0] - C1[0], C2[1] - C1[1]], angle);
	// newC2 = [ newC2[0] - C2[0], newC2[1] - C2[1] ] 
	
	return [ transformedPoints, newC1, newC2 ];
}



function mirrorPixels(pixels, c1, c2) {
	let midX = (c1[0] + c2[0]) / 2;
	let midY = (c1[1] + c2[1]) / 2;
	// console.log(c1 + " , " + c2 + " ; " + midX + "," + midY);
	
	return pixels.map(point => {
		let mirroredX = 2 * midX - point[0];
		let mirroredY = 2 * midY - point[1];
		return [mirroredX, mirroredY];
	});
}

function shiftDownPixels(pixels, amt = 10) {
	return pixels.map(point => {
		let shiftedY = point[1] + amt;
		return [point[0], shiftedY];
	});
}



function transformEdgeAlignAnchors(pieceNumber, edgeDir, mirror = false, shiftDownAlign = true) {
	if (!allEdgesDataJSON || !allEdgesDataJSON.arrPieces) return;
	// let piece = allEdgesDataJSON.arrPieces[pieceNumber];
	let pieceToTransformEdge = allEdgesDataJSON.arrPieces.find(p => p.pieceNumber === pieceNumber);
	// console.log(piece);
	if (!pieceToTransformEdge) return;
	
	let edgeToTransform = pieceToTransformEdge.edges[edgeDir];
	if (!edgeToTransform) return;
	
	let edgeToRealign = edgeToTransform.pixelsCanny;
	let corners = pieceToTransformEdge.corners;

	let c1, c2;
	switch (edgeDir) {
		case 'LEFT': c1 = corners.BL; c2 = corners.TL; break;
		case 'DOWN': c1 = corners.BR; c2 = corners.BL; break;
		case 'RIGHT': c1 = corners.TR; c2 = corners.BR; break;
		case 'UP': c1 = corners.TL; c2 = corners.TR; break;
	}
	

	let transformedData = rotateEdgeAlign(edgeToRealign, c1, c2);
	let transformedPixels = transformedData[0];
	c1 = transformedData[1];
	c2 = transformedData[2];

	// shifting in y coord to align edges to their control points
	// that are shifted as a result of blurring in the corner detection phase
	// the amount should be around (exactly) 10 pixels for the parameters used
	if( shiftDownAlign ) transformedPixels = shiftDownPixels(transformedPixels,10);

	if (mirror) {
		transformedPixels = mirrorPixels(transformedPixels, c1, c2);
	}


	// return [ transformedPixels;
	return [ transformedPixels, c1, c2 ];

}




function showEdgePiece(pieceNumber, edgeDir, mirror = false) {	

	let transformedData = transformEdgeAlignAnchors(pieceNumber, edgeDir, mirror);
	let transformedPixels = transformedData[0];
	c1 = transformedData[1];
	c2 = transformedData[2];
	
	for (let i = 0; i < transformedPixels.length; i++) {
		noFill();
		stroke(arrEdgesColour[enumEdges[edgeDir]]);
		strokeWeight(renderPointStrokeWeight);
		point(transformedPixels[i][0], transformedPixels[i][1]);

		if (i === Math.round(transformedPixels.length / 2) && flag_showText) {
			noStroke();
			fill(arrEdgesColour[enumEdges[edgeDir]]);
			textSize(textSize_EdgeName);
			testo = pieceNumber + " - " + edgeDir;
			text(testo, transformedPixels[i][0], transformedPixels[i][1]);
		}
	}
}

function showAllEdges(pieceNumber, mirror = false) {
	for (let edge in enumEdges) {
		showEdgePiece(pieceNumber, edge, mirror);
	}
}



function drawWholePiece(pieceToDrawNumber = 0, posX = 0, posY = 0, rotZ = 0, scaleFac = 1, batchIndexToShow = -1, modeAlign = "CENTER") {
		allPieces = allEdgesDataJSON.arrPieces;
		let flag_drawingFaultPiece = false;

		let targetPieceToDraw = allPieces.find(p => p.pieceNumber === pieceToDrawNumber);
		if (!targetPieceToDraw) {
			console.log(`Can't draw piece ${pieceToDrawNumber} because is not in allEdgesDataJSON.arrPieces`);
			return;
		}
		if (arrFaultyPieces.includes(targetPieceToDraw) ) {
			console.log(`The target piece ${targetPieceToDraw} is faulty!`);
			flag_drawingFaultPiece = true;
			// return;
		}

		redDot = targetPieceToDraw.corners.TL;
		greenDot = targetPieceToDraw.corners.TR;
		blueDot = targetPieceToDraw.corners.BR;
		whiteDot = targetPieceToDraw.corners.BL;

	push();

		translate(posX, posY);
		textAlign(CENTER,CENTER);
		textSize(textSize_PieceNumber);
		text("#" + pieceToDrawNumber + "-" + batchIndexToShow, 0, 0);

		rotate(rotZ);
		// translate(-80,-80);
		scale(scaleFac);
		// issue: non sto capendo perché con i valori grossi translate dovrebbe stare dopo lo scale
		// e anche perché non dovrebbe invece stare prima
		translate(-800,-800);


		textSize(textSize_EdgeName);
		textAlign(LEFT,TOP);
		noFill();
		stroke(0, 255, 0);
		strokeWeight(renderPointStrokeWeight);
		// strokeWeight(2);
		for (let edge in targetPieceToDraw.edges) {
			indexEdge = enumEdges[edge];
			// console.log("Edge: " + edge + ", index: " + indexEdge);
			stroke(arrEdgesColour[indexEdge]);
			let pixels = targetPieceToDraw.edges[edge].pixelsCanny;
			for (let i = 0; i < pixels.length; i++) {
				point(pixels[i][0], pixels[i][1]);
				if(i == round(pixels.length / 2)) {
					if ( flag_showText ) {
						text(edge + " - " + indexEdge,pixels[i][0], pixels[i][1]);
					}
				}
			}
		}

		// stroke(255, 0, 0);

		strokeWeight(10);
		stroke(arrCornersColour[0]); // TL
		point(redDot[0], redDot[1]);

		stroke(arrCornersColour[1]); // TR
		point(greenDot[0], greenDot[1]);

		stroke(arrCornersColour[2]); // BR
		point(blueDot[0], blueDot[1]);

		stroke(arrCornersColour[3]); // BL
		point(whiteDot[0], whiteDot[1]);

		if ( flag_showText ) {
			strokeWeight(2);
			stroke(arrCornersColour[0]);
			text("TL",redDot[0] - ackw, redDot[1] - ackw);
			stroke(arrCornersColour[1]);
			text("TR",greenDot[0] + ackw, greenDot[1] - ackw);
			stroke(arrCornersColour[2]);
			text("BR",blueDot[0] + ackw, blueDot[1] + ackw);
			stroke(arrCornersColour[3]);
			text("BL",whiteDot[0] - ackw, whiteDot[1] + ackw);
		}

	pop();
}





function calculateEdgeDistance(edge1, edge2) {
	let minDistances = edge1.map(point1 => {
		let minDist = Infinity;
		for (let point2 of edge2) {
			let dist = Math.hypot(point1[0] - point2[0], point1[1] - point2[1]);
			if (dist < minDist) minDist = dist;
		}
		return minDist;
	});
	return minDistances.reduce((sum, d) => sum + d, 0);
}






function findBestMatches(targetPieceNum, targetEdgeDir) {
	allPieces = allEdgesDataJSON.arrPieces;
	if (arrFaultyPieces.includes(targetPieceNum) ) {
		console.log("The target piece is faulty!");
		return [];
	}
	let bestMatches = [];
	let targetPiece = allPieces.find(p => p.pieceNumber === targetPieceNum);
	if (!targetPiece) return [];
	// let targetEdgePixels = targetPiece.edges[targetEdgeDir]?.pixelsCanny;
	// if (!targetEdgePixels) return [];

	let transformedFirstEdge = transformEdgeAlignAnchors(targetPieceNum,targetEdgeDir);
	let targetEdgePixels = transformedFirstEdge[0];

	// console.log("Checking best match for " + targetPieceNum + "-" + targetEdgeDir + ":");
	
	for (let secondPiece of allPieces) {
		secondPieceNumber = secondPiece.pieceNumber;
		if (! arrFaultyPieces.includes(secondPieceNumber) ) {
			for (let secondPieceEdgeDir in secondPiece.edges) {

				let transformedSecondEdge = transformEdgeAlignAnchors(secondPieceNumber, secondPieceEdgeDir, true);
				let transformedSecondEdgePixels = transformedSecondEdge[0];


				// Calcola la distanza per l'edge originale e per il mirrorato
				let distanceMirrored = calculateEdgeDistance(targetEdgePixels, transformedSecondEdgePixels);
				
				
				bestMatches.push({ 
					pieceNumber: secondPieceNumber, 
					edge: secondPieceEdgeDir, 
					distance: distanceMirrored
				});
			}
		}
	}
	
	bestMatches.sort((a, b) => a.distance - b.distance);
	return bestMatches.slice(0, 10);
}


function generateMatchesJSON() {
	let arrMatches = [];
	let totalPieces = allEdgesDataJSON.arrPieces.length;
	let processedPieces = 0;
	let startTime = Date.now();
	
	allEdgesDataJSON.arrPieces.forEach(piece => {
		let targetPieceNum = piece.pieceNumber;
		let edges = ["LEFT", "RIGHT", "UP", "DOWN"];
		
		edges.forEach(targetEdgeDir => {
			if (!arrFaultyPieces.includes(targetPieceNum)) {
				let bestMatches = findBestMatches(targetPieceNum, targetEdgeDir);
				
				let matchEntry = arrMatches.find(entry => entry.pieceNumber === targetPieceNum);
				if (!matchEntry) {
					matchEntry = { pieceNumber: targetPieceNum, edgesMatches: {} };
					arrMatches.push(matchEntry);
				}
				
				if (!matchEntry.edgesMatches[targetEdgeDir]) {
					matchEntry.edgesMatches[targetEdgeDir] = [];
				}
				
				bestMatches.forEach(match => {
					matchEntry.edgesMatches[targetEdgeDir].push({
						pieceNumberMatch: match.pieceNumber,
						pieceEdgeMatch: match.edge,
						distance: match.distance
					});
				});
			}
			
		});

		processedPieces++;
		let elapsedTime = (Date.now() - startTime) / 1000; // Tempo trascorso in secondi
		let completion = ((processedPieces / totalPieces) * 100).toFixed(2);
		let estimatedTotalTime = (elapsedTime / processedPieces) * totalPieces;
		let remainingTime = estimatedTotalTime - elapsedTime;
		
		console.log(`Processing piece ${targetPieceNum}: ${completion}% completed | Elapsed Time: ${elapsedTime.toFixed(2)}s | Estimated Total Time: ${estimatedTotalTime.toFixed(2)}s | Remaining Time: ${remainingTime.toFixed(2)}s`);
	});
	
	let resultJSON = JSON.stringify({ arrMatches }, null, 4);
	console.log("JSON generation complete!");
	return resultJSON;
}





function addCurrentPieceToShowingArr() {
	let dataToPush = {
		pieceNumber : actPieceToMoveNumber,
		pieceCenter : [800,800],
		posX : actPosX,
		posY : actPosY,
		rotZ : actRotZ,
		scaleFac : actScaleFac,
		batchIndex : actBatchInd
	}
	console.log("Adding to arrAllShowingPieces: ");
	console.log(dataToPush);
	arrAllShowingPieces.push(dataToPush);
}


function batchMoveAllShowing(valX = 0, valY = 0, batchIndexToMove = actBatchInd) {
	if(batchIndexToMove < 0) {
		for(let indShowin in arrAllShowingPieces) {
			pzm = arrAllShowingPieces[indShowin];
			// console.log("moving " + pzm);
			pzm.posX += valX;
			pzm.posY += valY;
		}
	} else {
		for(let indShowin in arrAllShowingPieces) {
			pzm = arrAllShowingPieces[indShowin];
			if(pzm.batchIndex == batchIndexToMove) {
				// console.log("moving " + pzm);
				pzm.posX += valX;
				pzm.posY += valY;
			}
		}
	}
	// console.log(arrAllShowingPieces);
}


function savePositionedPiecesJSON(version = "V01") {  
	let positionedPiecedJSON = JSON.stringify({ arrAllShowingPieces }, null, 4);  
	saveJSON(JSON.parse(positionedPiecedJSON), 'positionedPiecedJSON_' + version + '.json');  
}
function saveGraphMatches(version = "V01") { 
	let graphMatchesJSON = JSON.stringify({ graphMatches }, null, 4);  
	saveJSON(JSON.parse(graphMatchesJSON), 'graphMatchesJSON_' + version + '.json');  
}


function getNextEdgeName(fromEdge = "UP", dirCW = true) {
	// in this case the dirCW is the direction to search the next edge,
	// however, at a macroscopic level it appears as our sequence rotates in the opposite direction!
	if (dirCW) {
		switch(fromEdge) {
		case "UP": return "RIGHT";
		case "RIGHT": return "DOWN";
		case "DOWN": return "LEFT";
		case "LEFT": return "UP";
		}
	} else {
		switch(fromEdge) {
		case "UP": return "LEFT";
		case "LEFT": return "DOWN";
		case "DOWN": return "RIGHT";
		case "RIGHT": return "UP";
		}
	}
}

// function iterate_getNextEdge(thisPiece, thisEdge, iterationP = 0, dirCW = true, maxDistOK = 1600, maxIter = 4) {
//     if (iterationP >= maxIter) {
//         return []; // Raggiunto il numero massimo di iterazioni, restituisce la sequenza
//     }

//     let nextEdgesSequence = [];
	
//     // Trova i migliori match per questo pezzo e bordo
//     let bestMatches = findBestMatches(thisPiece, thisEdge);
	
//     if (bestMatches.length === 0 || bestMatches[0].distance > maxDistOK) {
//     	console.log("match non trovato per edge " + thisPiece + " - " + thisEdge);
//         return nextEdgesSequence; // Nessun match valido
//     }

//     let bestMatch = bestMatches[0]; // Prendi il miglior match disponibile
//     let matchedPiece = bestMatch.pieceNumber;
//     let matchedEdge = bestMatch.edge;
	
//     nextEdgesSequence.push({ piece: matchedPiece, edge: matchedEdge, distance: bestMatch.distance });

//     let nextEdge = getNextEdgeName(matchedEdge, dirCW); // Ottieni il prossimo bordo nella direzione richiesta

//     let furtherEdges = iterate_getNextEdge(matchedPiece, nextEdge, iterationP + 1, dirCW, maxDistOK, maxIter);
//     return nextEdgesSequence.concat(furtherEdges);
// }

// function iterate_getNextEdge(thisPiece, thisEdge, iterationP = 0, dirCW = true, maxDistOK = 1600, maxIter = 4, sequence = []) {
// 	if (iterationP >= maxIter) {
// 		// Controlla se l'ultimo pezzo nella sequenza coincide con il primo
// 		if (sequence.length > 0 && sequence[sequence.length - 1].piece === thisPiece) {
// 			console.log("EVVIVA! Si è chiuso il loop con il pezzo:", thisPiece);
// 		}
// 		return sequence;
// 	}

// 	// todo: modificare per usare bestMatches già calcolati invece che calcolarli da zero ogni volta
// 	let bestMatches = findBestMatches(thisPiece, thisEdge);
	
// 	if (bestMatches.length === 0 || bestMatches[0].distance > maxDistOK) {
//     	console.log("match non trovato per edge " + thisPiece + " - " + thisEdge);
// 		return sequence;
// 	}

// 	let bestMatch = bestMatches[0];
// 	let matchedPiece = bestMatch.pieceNumber;
// 	let matchedEdge = bestMatch.edge;
	
// 	sequence.push({ piece: matchedPiece, edge: matchedEdge, distance: bestMatch.distance });

// 	let nextEdge = getNextEdgeName(matchedEdge, dirCW);

// 	return iterate_getNextEdge(matchedPiece, nextEdge, iterationP + 1, dirCW, maxDistOK, maxIter, sequence);
// }


function iterate_getNextEdge(thisPiece, thisEdge, iterationP = 0, dirCW = true, maxDistOK = 1600, maxIter = 4, sequence = [], verboseLog = false) {
	if (iterationP >= maxIter) {
		// Controlla se l'ultimo pezzo nella sequenza coincide con il primo
		if (sequence.length > 0 && sequence[sequence.length - 1].piece === thisPiece) {
			if(verboseLog) console.log("Last piece of the loop is:", thisPiece);
		}
		return sequence;
	}

	// Trova il pezzo nei match pre-calcolati
	let pieceMatches = allMatchesJSON.arrMatches.find(p => p.pieceNumber === thisPiece);
	if (!pieceMatches || !pieceMatches.edgesMatches[thisEdge]) {
		if(verboseLog) console.log(`No match registered for ${thisPiece} - ${thisEdge}`);
		return sequence;
	}

	let bestMatches = pieceMatches.edgesMatches[thisEdge];

	// Verifica se esiste un match valido
	let bestMatch = bestMatches.find(match => match.distance <= maxDistOK);
	if (!bestMatch) {
		if(verboseLog) console.log(`No valid match for ${thisPiece} - ${thisEdge} with dist < ${maxDistOK}`);
		// console.log(`Nessun match valido per ${thisPiece} - ${thisEdge}, dist: ${match.distance}`);
		return sequence;
	}

	let matchedPiece = bestMatch.pieceNumberMatch;
	let matchedEdge = bestMatch.pieceEdgeMatch;
	
	sequence.push({ piece: matchedPiece, edge: matchedEdge, distance: bestMatch.distance });

	let nextEdge = getNextEdgeName(matchedEdge, dirCW);

	return iterate_getNextEdge(matchedPiece, nextEdge, iterationP + 1, dirCW, maxDistOK, maxIter, sequence);
}

function checkAllEdgeForSquares(maxDistOK = 1000) {
	console.log("Checkingall edges to find 2x2 squares...");

	let detectedSquares = [];

	// Scansiona tutti i pezzi registrati in allMatchesJSON
	for (let pieceData of allMatchesJSON.arrMatches) {
		let pieceNumber = pieceData.pieceNumber;
		if(arrFaultyPieces.includes(pieceNumber)) continue;

		// Controlla tutti i quattro bordi del pezzo
		for (let edge of ["UP", "RIGHT", "DOWN", "LEFT"]) {
			let square;
			// let square = iterate_getNextEdge(pieceNumber, edge, 0, true, maxDistOK, verboseLog = false);
			square = iterate_getNextEdge(pieceNumber, edge, 0, true, maxDistOK);

			// Se la sequenza è lunga esattamente 4 e torna al pezzo iniziale -> è un quadrato
			if (square.length === 4 && square[3].piece === pieceNumber) {
				console.log("Square (2x2) found starting from:", pieceNumber, "-", edge, " rotating CW");
				detectedSquares.push(square);
			}

			// other direction
			// // let square = iterate_getNextEdge(pieceNumber, edge, 0, false, maxDistOK, verboseLog = false);
			// square = iterate_getNextEdge(pieceNumber, edge, 0, false, maxDistOK);

			// // Se la sequenza è lunga esattamente 4 e torna al pezzo iniziale -> è un quadrato
			// if (square.length === 4 && square[3].piece === pieceNumber) {
			// 	console.log("✅ Quadrato trovato partendo da:", pieceNumber, "-", edge, " rotazione CCW");
			// 	detectedSquares.push(square);
			// }
		}
	}

	console.log("Squares (2x2) found for max dist", maxDistOK, ":", detectedSquares.length);
	return detectedSquares;
}


function buildgraphMatches(maxDistOK = 1600) {
    graphMatches = {}; // Oggetto che rappresenta il grafo

    for (let pieceData of allMatchesJSON.arrMatches) {
        let pieceNumber = pieceData.pieceNumber;
        if (!graphMatches[pieceNumber]) graphMatches[pieceNumber] = []; // Inizializza il nodo

        for (let edge in pieceData.edgesMatches) {
            let matches = pieceData.edgesMatches[edge];

            for (let match of matches) {
                if (match.distance < maxDistOK) {
                    let matchedPiece = match.pieceNumberMatch;

                    // Inizializza il nodo per il pezzo matched se non esiste
                    if (!graphMatches[matchedPiece]) graphMatches[matchedPiece] = [];

                    // Aggiungi connessione bidirezionale (grafo non orientato)
                    if (!graphMatches[pieceNumber].includes(matchedPiece)) {
                        graphMatches[pieceNumber].push(matchedPiece);
                    }
                    if (!graphMatches[matchedPiece].includes(pieceNumber)) {
                        graphMatches[matchedPiece].push(pieceNumber);
                    }
                }
            }
        }
    }

    return graphMatches;
}




























let graphMatches = {};

let actBatchInd = -1;

let renderPointStrokeWeight = 4;

let filePathMatches = "allEdgesMatches_JSON_V01.json";
let filePathPositionedPieces = "positionedPieces/positionedPiecedJSON_V15.json";

let pieceToMatch = 239;
let dirToMatch = "LEFT";
let actMatchedEdgeIndex = 0;

let flag_recalculateAllMatches = false;
let flag_loadMatchesFromJSON = true;
let allMatchesJSON = {};

let arrAllShowingPieces = [];

let actPosX, actPosY, actRotZ = 0;
let actScaleFac = 0.5;

let flag_rotationEnabled = false;

// 391 tot, 57 faulty, 330 good circa, 28 positioned, 10%
let actPieceToMoveNumber = 0;


let arrQuartets = [];

let listOfHelpStrings = "List of commands (case sensitive):\n" + 
	"\n" +
	"h \ttoggle show HUD\n" +
	"H \ttoggle list of commands\n" +
	"t \ttoggle show text\n" +
	"B \ttoggle (not yet toggle) bigger texts\n" +
	"l \ttoggle loop (draw calls)\n" +
	"b \ttoggle refresh background\n" +
	"a \ttoggle autoscroll next piece\n" +
	"f \tfaster refresh frequency (new pieces per frame)\n" +
	"g \tfaster refresh frequency (new pieces per frame)\n" +
	"v \tmax refresh frequency (one per frame)\n" +
	"\n" +
	"e \tswitch mode\n" +
	"\n" +
	"k \tnext piece edge E1\n" +
	"K \tnext 10th piece edge E1\n" +
	"j \tprev piece edge E1\n" +
	"J \tprev 10th piece edge E1\n" +
	"0 \tback to first piece E1\n" + 
	"1 \tedge direction UP\n" + 
	"2 \tedge direction RIGHT\n" + 
	"3 \tedge direction DOWN\n" + 
	"4 \tedge direction LEFT\n" + 
	"u \tnext matching edge E2\n" +
	"y \tprev matching edge E2\n" +
	"i \tnext batchIndex for groups\n" +
	"o \tnext batchIndex for groups\n" +
	"r \ttoggle rotate or move piece(s) mode\n" +
	"arrow(s) \tmove all selected pieces (having current batchIndex) in selected direction (30 pixels)\n" +
	"\n" +
	"m \tsave current piece in place and rotation (adds to arrShowinPiecesEdge)\n" +
	"z \tempty arrShowinPiecesEdge\n" +
	"\n" +
	"s \tsave JSON with place pieces (from arrShowinPiecesEdge)\n" +
	"S \tsave screen of the canvas\n";




function preload() {
	// allEdgesDataJSON = loadJSON("edgesCurves_JSON_V05_complete.json");
	allEdgesDataJSON = loadJSON(filePathEdges);
	allMatchesJSON = loadJSON(filePathMatches);
	allShowingPiecesJSON = loadJSON(filePathPositionedPieces);
}

function setup() {
	// createCanvas(1600, 1600);
	createCanvas(3200, 3200);

	console.log(listOfHelpStrings);

	textHUD_centerEdges_x = width / 8;
	textHUD_centerEdges_y = height / 4;

	arrEdgesColour = [
		color(72, 210, 139),
		color(255, 78, 179),
		color(0, 206, 209),
		color(255, 112, 0)
		];
	arrCornersColour = [
		color(255, 0, 0),
		color(0, 255, 0),
		color(0, 0, 255),
		color(255, 255, 255)
		];

	// added piece #2 because is the same as piece 377 arrgghh
	// arrFaultyPieces = [21, 23, 25, 56, 59, 61, 65, 67, 68, 71, 73, 74, 75, 77, 79, 87, 91, 93, 97, 100, 103, 110, 123, 128, 131, 132, 133, 134, 135, 140, 141, 143, 146, 149, 153, 154, 162, 175, 181, 189, 191, 238, 242, 261, 274, 293, 309, 310, 359, 360, 373, 375, 376, 379, 400, 401, 405, 408];
	arrFaultyPieces = [2, 21, 23, 25, 56, 59, 61, 65, 67, 68, 71, 73, 74, 75, 77, 79, 87, 91, 93, 97, 100, 103, 110, 123, 128, 131, 132, 133, 134, 135, 140, 141, 143, 146, 149, 153, 154, 162, 175, 181, 189, 191, 238, 242, 261, 274, 293, 309, 310, 359, 360, 373, 375, 376, 379, 400, 401, 405, 408];
	
	console.log("Loaded " + filePathEdges);
	console.log(allEdgesDataJSON);

	console.log("Loaded " + filePathMatches);
	console.log(allMatchesJSON);

	console.log("Loaded " + filePathPositionedPieces);
	console.log(allShowingPiecesJSON);
	arrAllShowingPieces = allShowingPiecesJSON.arrAllShowingPieces;


	// calculatedBestMatches = findBestMatches(pieceToMatch, dirToMatch);
	// console.log(calculatedBestMatches);

	if (flag_recalculateAllMatches) {
		allMatchesJSON = generateMatchesJSON();
		console.log(allMatchesJSON);
		saveJSON(JSON.parse(allMatchesJSON), 'matches.json');
	}

	frameRate(15);
	// noLoop();
}

function draw() {

	// WON'T WORK BECAUSE IF ! ISLOOPING(), THEN THIS PART WON'T BE EXECUTED
	// TO CHECK THE FLAG!!! 
	// if( flag_loop ) loop();
	// else noLoop();

	// if (! isLooping()) loop();
	// else noLoop();
	// loop();
	// frameRate(5);


	if ( flag_refreshBackground ) background(0);

	if (!allEdgesDataJSON || !allEdgesDataJSON.arrPieces) return;

	
	// let piece = allEdgesDataJSON.arrPieces[actPieceIndex];
	// if (!piece) return;


	if( flag_modeSwitcher ) {
		push();
		translate(width/4, height/4);

		// // debugging shift in y coord to align edges to their control points
		// // there are moved because of blurring in the corner detection phase
		// push();
		// 	// strokeWeight(20);
		// 	// stroke(255);
		// 	noStroke();
		// 	fill(255);
		// 	rectMode(CENTER);
		// 	rect(40,-1,80,20);
		// 	// rect(50,0,1,1);
		// pop();



		// 389-390-391
		// showEdgePiece(389,"LEFT");
		// showEdgePiece(390,"RIGHT",true);

		// showEdgePiece(390,"UP");
		// showEdgePiece(391,"DOWN",true);
		
		// showEdgePiece(392,"RIGHT");
		// showEdgePiece(393,"LEFT",true);


		// showEdgePiece(395,"LEFT");
		// showEdgePiece(394,"DOWN",true);

		// showAllEdges(76);
		// showEdgePiece(389,"LEFT");
		// showEdgePiece(348,"LEFT",true);
		// showAllEdges(actPieceIndex, true);
		// actPieceNumber = allEdgesDataJSON.arrPieces[actPieceIndex].pieceNumber;
		// showEdgePiece(actPieceNumber,"RIGHT",true);


		// showEdgePiece(pieceToMatch, dirToMatch);

		// actMatchToShowIndex = pieceToMatch;
		actMatchToShowIndex = actPieceIndex;
		pieceToFind = allEdgesDataJSON.arrPieces[actPieceIndex];
		pieceNumberToFind = pieceToFind.pieceNumber;
		// console.log(pieceNumberToFind)
		actChosenPiece = allMatchesJSON.arrMatches.find(p => p.pieceNumber === pieceNumberToFind);
		if (actChosenPiece) {
			// console.log(actChosenPiece)
			actChosenPieceNumber = actChosenPiece.pieceNumber;
			actChosenPieceEdge = dirToMatch;

			showEdgePiece(actChosenPieceNumber, actChosenPieceEdge);

			// for(let m = 0; m < )
			actMatchingPiece = actChosenPiece.edgesMatches[actChosenPieceEdge][actMatchedEdgeIndex];
			actMatchingPieceNumber = actMatchingPiece.pieceNumberMatch;
			actMatchingPieceEdge = actMatchingPiece.pieceEdgeMatch;
			actMatchingPieceDist = actMatchingPiece.distance;
			showEdgePiece(actMatchingPieceNumber, actMatchingPieceEdge, true);

			if ( flag_showHUD ) {
				push();
					translate(textHUD_centerEdges_x, - textHUD_centerEdges_y);
					// fill(255, 255, 0);
					noStroke();
					textSize(textSize_HUD_UI);
					textAlign(LEFT, TOP);
					fill( arrEdgesColour[enumEdges[actChosenPieceEdge]] );
					// text(`Base curve edge (index): ${actMatchToShowIndex} - ${actChosenPieceEdge}`, 0, baseyText);
					text(`Base curve edge \t(index): ${actMatchToShowIndex} \t(piece): ${actChosenPieceNumber} - ${actChosenPieceEdge}`, 0, baseyText);

					fill( arrEdgesColour[enumEdges[actMatchingPieceEdge]] );
					text(`Match curve edge \t(indBest): ${actMatchedEdgeIndex} \t(piece): ${actMatchingPieceNumber} - ${actMatchingPieceEdge}`, 0, baseyText + dyText);
					// text(`Piece Number: ${piece.pieceNumber}`, 0, baseyText + dyText);
					// if(actMatchingPieceDist < 1000) fill(0, 255, 0);
					// else if(actMatchingPieceDist < 1300) fill(255, 255, 0);
					// else fill(255, 0, 0);
					let col1 = color(0,255,0);
					let col2 = color(255,0,0);
					let t = constrain(map(actMatchingPieceDist, 800, 1600, 0, 1), 0, 1);
					fill(lerpColor(col1, col2, t));
					text(`Distance: ${actMatchingPieceDist}`, 0, baseyText + dyText * 2);
				pop();
			}
		}
		pop();
	} else {


	let pieceToMove = allEdgesDataJSON.arrPieces[actPieceIndex];
	actPieceToMoveNumber = pieceToMove.pieceNumber;
	if (!actPieceToMoveNumber) return;

		if ( flag_showHUD ) {
			fill(0);
			// stroke(255);
			noStroke();
			rect(0,0,200,300);
			
			// Scrivi il nome e numero del pezzo in alto in giallo
			fill(255, 255, 0);
			noStroke();
			textSize(textSize_HUD_UI);
			textAlign(LEFT, TOP);
			text(`arr index: ${actPieceIndex}`, 10, baseyText);
			text(`Piece Number: ${pieceToMove.pieceNumber}`, 10, baseyText + dyText);
			// text(`Piece string: ${piece.pieceString}`, 10, baseyText + dyText * 2);
			// text(`Piece Type: ${piece.pieceType}`, 10, baseyText + dyText * 3);
			// text(`Classification: ${piece.classification}`, 10, baseyText + dyText * 4);
			// text(`Sheet Folder: ${piece.sheetFolder}`, 10, baseyText + dyText * 5);

			text(`Refresh background: ${flag_refreshBackground}`, 10, baseyText + dyText * 11);
			text(`Autoplay: ${flag_autoUpdateSwitchPiece}`, 10, baseyText + dyText * 12);
			text(`Update Frequency: ${autoUpdateFreq}`, 10, baseyText + dyText * 13);
			text(`Framerate Frequency: ${frameRate().toFixed(0)}`, 10, baseyText + dyText * 14);

			if(flag_showCommandsList) text(listOfHelpStrings, 10, baseyText + dyText * 18);
		}


		if(flag_rotationEnabled) {
			actRotZ = mouseX / 100;
		}
		else {
			actPosX = mouseX;
			actPosY = mouseY;
		}
		if( flag_showHUD ) drawWholePiece(actPieceToMoveNumber, actPosX, actPosY, actRotZ, actScaleFac, actBatchInd);

		for(let p = 0; p < arrAllShowingPieces.length; p++) {
			let pz = arrAllShowingPieces[p];
			drawWholePiece(pz.pieceNumber, pz.posX, pz.posY, pz.rotZ, pz.scaleFac, pz.batchIndex ?? -1);
		}

	}



	if (flag_autoUpdateSwitchPiece && frameCount % autoUpdateFreq === 0) {
		actPieceIndex = (actPieceIndex + 1) % allEdgesDataJSON.arrPieces.length;
	}
		




}






function keyPressed() {
	// switch(keyCode) {
	// 	case 
	// }
	switch (key) {
	// switch (key.toLowerCase()) {


		case 'h':
			flag_showHUD = !flag_showHUD;
			redraw();
			break;
		case 'H':
			flag_showCommandsList = !flag_showCommandsList;
			redraw();
			break;
		case 't':
			flag_showText = !flag_showText;
			redraw();
			break;

		case 'e':
			flag_modeSwitcher = !flag_modeSwitcher;
			redraw();
			break;
		case 'k':
			actPieceIndex = (actPieceIndex + 1) % allEdgesDataJSON.arrPieces.length;
			actMatchedEdgeIndex = 0;
			redraw();
			break;
		case 'K':
			actPieceIndex = (actPieceIndex + 10) % allEdgesDataJSON.arrPieces.length;
			actMatchedEdgeIndex = 0;
			redraw();
			break;
		case 'j':
			actPieceIndex = (actPieceIndex - 1 + allEdgesDataJSON.arrPieces.length) % allEdgesDataJSON.arrPieces.length;
			actMatchedEdgeIndex = 0;
			redraw();
			break;
		case 'J':
			actPieceIndex = (actPieceIndex - 10 + allEdgesDataJSON.arrPieces.length) % allEdgesDataJSON.arrPieces.length;
			actMatchedEdgeIndex = 0;
			redraw();
			break;

		case '0':
			actPieceIndex = 0;
			redraw();
			break;

		case 'u': // todo change % 10 to % len of act arr matches
			actMatchedEdgeIndex = (actMatchedEdgeIndex + 1) % 10;
			redraw();
			break;
		case 'y': // todo change % 10 to % len of act arr matches
			actMatchedEdgeIndex = (actMatchedEdgeIndex - 1 + 10) % 10;
			redraw();
			break;

		case '1':
			dirToMatch = "UP";
			redraw();
			break;
		case '2':
			dirToMatch = "RIGHT";
			redraw();
			break;
		case '3':
			dirToMatch = "DOWN";
			redraw();
			break;
		case '4':
			dirToMatch = "LEFT";
			redraw();
			break;

		case 'i':
			actBatchInd = max(-1, actBatchInd - 1);
			break;
		case 'o':
			actBatchInd = actBatchInd + 1;
			break;

		case 'f':
			autoUpdateFreq = max(0, autoUpdateFreq - 1);
			break;
		case 'g':
			autoUpdateFreq = autoUpdateFreq + 1;
			break;
		case 'v':
			autoUpdateFreq = 0;
			break;


		case 'b':
			flag_refreshBackground = !flag_refreshBackground;
			redraw();
			break;
		case 'B':
			// todo should be switching
			textSize_HUD_UI = 26;
			textSize_EdgeName = 26;
			textSize_PieceNumber = 26;
			dyText = 30
			redraw();
			break;
		case 'a':
			flag_autoUpdateSwitchPiece = !flag_autoUpdateSwitchPiece;
			if (flag_autoUpdateSwitchPiece) loop();
			else noLoop();
			break;
		case 'l':
			flag_loop = ! flag_loop;
			if( flag_loop ) {
				loop();
				console.log("Now looping");
			}
			else {
				noLoop();
				console.log("Stopped looping");
			}
			break;

		case 'r':
			flag_rotationEnabled = !flag_rotationEnabled;
			break;

		case 'm':
			addCurrentPieceToShowingArr();
			redraw();
			break;
		case 's':
			savePositionedPiecesJSON();
			break;
		case 'S':
			saveCanvas('piecesAssembly_V13', 'png');
			break;

		case 'z':
			arrAllShowingPieces = [];
			redraw();
			break;

		case 'ArrowLeft':
			batchMoveAllShowing(-30,0);
			redraw();
			break;
		case 'ArrowRight':
			batchMoveAllShowing(30,0);
			redraw();
			break;
		case 'ArrowUp':
			batchMoveAllShowing(0,-30);
			redraw();
			break;
		case 'ArrowDown':
			batchMoveAllShowing(0,30);
			redraw();
			break;

		default:
			// console.log(key);
			break;
	}
}
