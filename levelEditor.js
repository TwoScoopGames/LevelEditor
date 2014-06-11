"use strict";
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;

/*
   ------------------------------------------
      tile handling
   -------------------------------------------
*/
var tiles = [];
var imageLoaded = false;
var imageLoader = document.getElementById("imageLoader");
imageLoader.addEventListener("change", handleImage, false);

function handleImage(e) {
	var reader = new FileReader();
	reader.onload = function(event) {
		var img = new Image();
		img.onload = function() {
			tiles.push(img);
			imageLoaded = true;
			img.xPos = img.x;
			img.yPos = img.y;
			img.initWidth = img.width;
			img.initHeight = img.height;
			img.initX = img.x;
			img.initY = img.y;
			img.angle = 0;
			reloadTileNav();
		};
		img.src = event.target.result;
	};
	reader.readAsDataURL(e.target.files[0]);
}



/*
------------------------------------------
 Tile Navigation
 ------------------------------------------
 */
var tileNav = document.getElementById("tileNav");

var currentSelection = 0;

function reloadTileNav() {
	console.log(tiles.length);
	$("#tileNav").empty();

	for (var i = 0; i < tiles.length; i++) {
		$("#tileNav").append($("<option></option>").val(i).html(i));
		console.log("add tileItem");
	}

	currentSelection = $("#tileNav option:selected").val();
	refreshTileStats();


}

/*
   ------------------------------------------
      "pointer" events    touch or mouse
   -------------------------------------------
*/

var pointerOn = false;
var pointerMoving = false;
var mouseDown = false;
var mouseMoving = false;
var mouse = {
	x: 0,
	y: 0
};

var touches = [];
var fingerSize = 24;

var initAngle = 0;
var currentAngle = 0;
var angleChange = 0;

var initLength = 0;
var lineLength = 0;
var fingerLine = 0;
var lineChange = 0;


canvas.addEventListener("mousedown", function(event) {
	mouseDown = true;
	pointerStart(event);
});
var mouseEvent;
canvas.addEventListener("mousemove", function(event) {
	mouseMoving = true;
	mouseEvent = event;
	mouse.x = event.clientX || event.pageX;
	mouse.y = event.clientY || event.pageY;
	pointerStart(event);
});


canvas.addEventListener("mouseup", function() {
	mouseMoving = false;
	mouseDown = false;
	pointerEnd();
});

canvas.addEventListener("touchstart", function(event) {
	pointerStart(event);
});

canvas.addEventListener("touchmove", function(event) {
	pointerMove(event);
});

canvas.addEventListener("touchend", function() {
	pointerEnd();
});

function pointerStart(event) {
	pointerOn = true;
	if (event.touches !== undefined && event.touches.length > 1) {
		initAngle = slopeAngle(makeRelative(event.touches[0]).x, makeRelative(event.touches[0]).y, makeRelative(event.touches[1]).x, makeRelative(event.touches[1]).y);
		initLength = pythagorean(makeRelative(event.touches[0]).x, makeRelative(event.touches[0]).y, makeRelative(event.touches[1]).x, makeRelative(event.touches[1]).y);
		initialWidth = img.width;
		initialHeight = img.height;
	}
}

function pointerMove(event) {
	pointerMoving = true;
	event.preventDefault();
	touches = event.touches;
}

function pointerEnd() {
	pointerMoving = false;
	pointerOn = false;
}

setInterval(update, 60);
var lastImageRotation = 0;
var lastImagePos = {
	x: 0,
	y: 0
};

// var nw = window.innerWidth;
// var nh = window.innerHeight;

// if ((w !== nw) || (h !== nh)) {
// 	w = nw;
// 	h = nh;
// 	canvas.style.width = w + "px";
// 	canvas.style.height = h + "px";
// 	canvas.width = w;
// 	canvas.height = h;
// }


function isInside(container, x, y) {
	return x >= container.x &&
		x < container.x + container.width &&
		y >= container.y &&
		y < container.y + container.height;
}

function update() {
	var tileOutlines = $("#tileOutlines").is(":checked")

	context.clearRect(0, 0, w, h);
	context.fillStyle = "#0d0d0d";
	context.fillRect(0, 0, w, h);
	//get current selection
	if ($("#tileNav option").length > 0) {



		for (var i = 0; i < tiles.length; i++) {
			drawRotatedImage(tiles[i]);
			if (tileOutlines) {
				if (i !== currentSelection) {
					context.strokeStyle = "white";
				} else {
					context.strokeStyle = "green";
				}
				context.strokeRect(tiles[i].xPos, tiles[i].yPos, tiles[i].width, tiles[i].height);
			}
		}
		if (pointerOn) {

			var touch1 = touches[0];
			var touch2 = touches[1];


			if (mouseDown) {
				makeCircle("rgba(0,0,100,.7)", fingerSize, "rgba(0,0,100,.9)", 2, makeRelative(mouse).x, makeRelative(mouse).y);
				tiles[currentSelection].xPos = makeRelative(mouse).x - tiles[currentSelection].width / 2;
				tiles[currentSelection].yPos = makeRelative(mouse).y - tiles[currentSelection].height / 2;
			}

			if (touches.length === 1) {
				makeCircle("rgba(0,0,100,.7)", fingerSize, "rgba(0,0,100,.9)", 2, makeRelative(touch1).x, makeRelative(touch1).y);
				tiles[currentSelection].xPos = makeRelative(touch1).x;
				tiles[currentSelection].yPos = makeRelative(touch1).y;
			}

			if (touches.length > 1) {
				lineLength = Math.floor(pythagorean(makeRelative(touch1).x, makeRelative(touch1).y, makeRelative(touch2).x, makeRelative(touch2).y));
				fingerLine = lineLength - (fingerSize * 2);
				currentAngle = slopeAngle(makeRelative(touch1).x, makeRelative(touch1).y, makeRelative(touch2).x, makeRelative(touch2).y);
				angleChange = getPercentChange(currentAngle, initAngle);
				tiles[currentSelection].rotation = initAngle * -angleChange;

				var mid = midpoint(makeRelative(touch1).x, makeRelative(touch1).y, makeRelative(touch2).x, makeRelative(touch2).y);
				tiles[currentSelection].xPos = tiles[currentSelection].initX + mid.x;
				tiles[currentSelection].yPos = tiles[currentSelection].initY + mid.y;

				lineChange = lineLength - initLength;
				var newWidth = tiles[currentSelection].initWidth + lineChange;
				tiles[currentSelection].width = newWidth;
				tiles[currentSelection].height = (tiles[currentSelection].initHeight / tiles[currentSelection].initWidth) * newWidth;

				makeCircle("rgba(255,255,255,.7)", fingerSize, "rgba(255,255,255,.9)", 2, makeRelative(touch1).x, makeRelative(touch1).y);
				makeCircle("rgba(255,255,255,.7)", fingerSize, "rgba(255,255,255,.9)", 2, makeRelative(touch2).x, makeRelative(touch2).y);
				makeLine(makeRelative(touch1).x, makeRelative(touch1).y, makeRelative(touch2).x, makeRelative(touch2).y);
				makeCircle("rgba(255,255,255,.7)", fingerSize, "rgba(255,255,255,.9)", 2, mid.x, mid.y);
			}

		} //pointer on

	}

	// context.fillText("lastImagePos x: " + lastImagePos.x + ", y: " + lastImagePos.y, 10, 10);
	// context.fillText("initial width: " + initialWidth + ", height: " + initialHeight, 10, 30);
	// context.fillText("initialAngle: " + initAngle, 10, 50);
	// context.fillText("currentAngle: " + currentAngle, 10, 70);
	// context.fillText("Angle Change: " + angleChange + "%", 10, 90);
	// context.fillText("fingerLine: " + fingerLine, 10, 110);
	// context.fillText("line length: " + lineLength, 10, 130);
	// context.fillText("img.width: " + img.width, 10, 150);
	// context.fillText("img.height: " + img.height, 10, 170);
	// context.fillText("initLength: " + initLength, 10, 190);
	// context.fillText("lineChange: " + lineChange, 10, 210);


}


// desktop controls

function adjustPosition(modifier) {
	if (modifier === "left") {
		tiles[currentSelection].xPos -= 1;
	}
	if (modifier === "right") {
		tiles[currentSelection].xPos += 1;
	}
	if (modifier === "up") {
		tiles[currentSelection].yPos -= 1;
	}
	if (modifier === "down") {
		tiles[currentSelection].yPos += 1;
	}
}

function adjustSize(modifier) {
	if (modifier === "add") {
		tiles[currentSelection].width += 10;
		tiles[currentSelection].height += 10;
	}
	if (modifier === "subtract") {
		tiles[currentSelection].width -= 10;
		tiles[currentSelection].height -= 10;
	}
}

function adjustAngle(modifier) {
	if (modifier === "right") {
		tiles[currentSelection].angle += 0.05;
	}
	if (modifier === "left") {
		tiles[currentSelection].angle -= 0.05;
	}
}
document.getElementById("moveLeft").addEventListener("click", function(event) {
	adjustPosition("left");
	refreshTileStats();
}, false);

document.getElementById("moveRight").addEventListener("click", function(event) {
	adjustPosition("right");
	refreshTileStats();
}, false);
document.getElementById("moveUp").addEventListener("click", function(event) {
	adjustPosition("up");
	refreshTileStats();
}, false);

document.getElementById("moveDown").addEventListener("click", function(event) {
	adjustPosition("down");
	refreshTileStats();
}, false);

document.getElementById("scaleUp").addEventListener("click", function(event) {
	adjustSize("add");
	refreshTileStats();
}, false);

document.getElementById("scaleDown").addEventListener("click", function(event) {
	adjustSize("subtract");
	refreshTileStats();
}, false);

document.getElementById("rotateLeft").addEventListener("click", function(event) {
	adjustAngle("left");
	refreshTileStats();
}, false);

document.getElementById("rotateRight").addEventListener("click", function(event) {
	adjustAngle("right");
	refreshTileStats();
}, false);


function refreshTileStats() {
	$("#currentTilePosX").text(tiles[currentSelection].xPos);
	$("#currentTilePosY").text(tiles[currentSelection].yPos);
	$("#currentTileSize").text("w: " + tiles[currentSelection].width + ", h: " + tiles[currentSelection].height);
	$("#currentTileAngle").text(tiles[currentSelection].angle);
}
// function drawImage(image) {
// 	if (image.x !== 0 && image.y !== 0) {
// 		drawRotatedImage(image, image.x, image.y, image.rotation);
// 	} else {
// 		drawRotatedImage(image, image.x, image.y, image.rotation);
// 	}
// }



function makeRelative(object) {
	var relativeCoords;
	//touch
	if (typeof object.clientX !== "undefined") {
		relativeCoords = {
			x: object.clientX - canvas.getBoundingClientRect().left,
			y: object.clientY - canvas.getBoundingClientRect().top
		};
		// mouse
	} else {
		relativeCoords = {
			x: object.x - canvas.getBoundingClientRect().left,
			y: object.y - canvas.getBoundingClientRect().top
		};
	}
	return relativeCoords;
}

function drawRotatedImage(image) {
	context.save();
	context.translate(image.xPos, image.yPos);
	context.rotate(image.angle);
	context.translate(-image.xPos, -image.yPos);
	context.drawImage(image, image.xPos, image.yPos, image.width, image.height);
	context.restore();
}

function getPercentChange(newVal, oldVal) {
	return (newVal - oldVal) / oldVal;
}

function makeLine(startX, startY, endX, endY) {
	context.beginPath();
	context.moveTo(startX, startY);
	context.lineTo(endX, endY);
	context.stroke();
}

function makeCircle(color, radius, strokeColor, strokeSize, x, y) {
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI, false);
	context.fillStyle = color;
	context.fill();
	context.lineWidth = strokeSize;
	context.strokeStyle = strokeColor;
	context.stroke();
}

function pythagorean(startX, startY, endX, endY) {
	var a = endX - startX;
	var b = endY - startY;
	var csq = (a * a) + (b * b);
	return Math.sqrt(csq);
}

function midpoint(startX, startY, endX, endY) {
	return {
		x: (startX + endX) / 2,
		y: (startY + endY) / 2
	};
}

function slopeAngle(startX, startY, endX, endY) {
	var run = endX - startX;
	var rise = endY - startY;
	return Math.atan2(run, rise);
}