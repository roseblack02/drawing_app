//get all drawing canvases and set size
layers = [
    {
        canvas: /** @type {HTMLCanvasElement} */ document.getElementById('canvas'),
        ctx: document.getElementById('canvas').getContext('2d'),
    },
    {
        canvas: /** @type {HTMLCanvasElement} */ document.getElementById('canvas1'),
        ctx: document.getElementById('canvas1').getContext('2d'),
    },
    {
        canvas: /** @type {HTMLCanvasElement} */ document.getElementById('canvas2'),
        ctx: document.getElementById('canvas2').getContext('2d'),
    }
]

var curLayer = 0;

//set size of every canvas
layers.forEach(layer => {
    layer.canvas.width = window.innerWidth;
    layer.canvas.height = window.innerHeight;
})

//get canvas for overlay for the cursor and set size
const canvasOverlay = /** @type {HTMLCanvasElement} */ document.getElementById('canvasOverlay');
const ctxOverlay = canvasOverlay.getContext('2d');
canvasOverlay.width = window.innerWidth;
canvasOverlay.height = window.innerHeight;

//resize canvas with window resize
window.addEventListener('resize', function () {
    //save layers to prevent it from being erased when resizing
    let layerData = layers.map(layer => layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height));
    layers.forEach((layer, i) => {
        layer.canvas.width = window.innerWidth;
        layer.canvas.height = window.innerHeight;
        layer.ctx.putImageData(layerData[i], 0, 0);
    });


    //resize
    layers.forEach(layer => {
        layer.canvas.width = window.innerWidth;
        layer.canvas.height = window.innerHeight;
    })

    canvasOverlay.width = window.innerWidth;
    canvasOverlay.height = window.innerHeight;

    //put image data back onto the layers
    let i = 0;
    layers.forEach(layer => {
        layerData.push(layer.ctx.putImageData(layerData[i], 0, 0));
        i++;
    })
})

//undo and redo image data
const history = {
    imgData: [],
    position: 0,
}

//mouse attributes
const mouse = {
    x: null,
    y: null,
    down: false,
    button: null,
}

//brush attributes
const sizeMax = 100;
const sizeMin = 1;
const sizeInc = 2;

const brush = {
    mode: 'draw',
    size: 10,
    colour: document.getElementById('colorPicker').value,
    bgColour: document.getElementById('bgColorPicker').value,
    cursorColour: 'black',
    font: document.getElementById('font').value,
    fontSize: document.getElementById('fontSize').value,
    style: 'round',
    img: new Image(),
    pattern: null,
    fgPattern: null,
    bgPattern: null,
    isFilling: false,
    increaseSize: function () {
        if (this.size <= sizeMax - sizeInc) {
            this.size += sizeInc;
            document.getElementById('decrease').style.backgroundColor = '#f0ecc0';
        } else {
            document.getElementById('increase').style.backgroundColor = '#7a7860';
        }
        //clear the overlay canvas
        ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
    },
    decreaseSize: function () {
        if (this.size >= sizeMin + sizeInc) {
            this.size -= sizeInc;
            document.getElementById('increase').style.backgroundColor = '#f0ecc0';
        } else {
            document.getElementById('decrease').style.backgroundColor = '#7a7860';
        }
        //clear the overlay canvas
        ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
    },
}

//toolbar attributes
var pin = true;

//change brush attributes with keyboard
document.addEventListener('keydown', function (event) {
    //check the key pressed
    var keyPressed = event.key;

    //increase brush size
    if (keyPressed === '=' || keyPressed === '+') {
        brush.increaseSize();
    }

    //decrease brush size
    if (keyPressed === '-' || keyPressed === '_') {
        brush.decreaseSize();
    }

    //undo
    if (keyPressed === 'z' && event.ctrlKey) {
        undo();
    }

    //redo
    if (keyPressed === 'y' && event.ctrlKey) {
        redo();
    }
});

//chnage brush colour with toolbar
document.getElementById('colorPicker').addEventListener('change', function () {
    //get the selected color from the color picker
    brush.colour = document.getElementById('colorPicker').value;

    //change pattern colour too if there is a pattern
    if (brush.pattern != null) {
        brush.fgPattern = createPattern(brush.img, brush.colour);
    }
});

document.getElementById('bgColorPicker').addEventListener('change', function () {
    //get the selected color from the color picker
    brush.bgColour = document.getElementById('bgColorPicker').value;

    //change pattern colour too if there is a pattern
    if (brush.pattern != null) {
        brush.bgPattern = createPattern(brush.img, brush.bgColour);
    }
});

//set brush to fill
document.getElementById('fill').addEventListener('click', function () {
    brush.mode = 'fill';
    brushTypeSelection('fill');
});

//set brush to draw
document.getElementById('pen').addEventListener('click', function () {
    brush.mode = 'draw';
    brushTypeSelection('pen');

    // Enable increase and decrease
    document.getElementById('increase').style.backgroundColor = '#f0ecc0';
    document.getElementById('increase').disabled = false;

    document.getElementById('decrease').style.backgroundColor = '#f0ecc0';
    document.getElementById('decrease').disabled = false;

    //enable brush style
    document.getElementById('style').style.backgroundColor = '#f0ecc0';
    document.getElementById('style').disabled = false;
});

//change pen style
document.getElementById('style').addEventListener('change', function () {
    brush.style = document.getElementById('style').value;

    //check if style is a path to a pattern img
    if (brush.style.includes('patterns/')) {
        brush.img.src = brush.style;
        brush.img.onload = function () {
            brush.fgPattern = createPattern(brush.img, brush.colour);
            brush.bgPattern = createPattern(brush.img, brush.bgColour);
        };
    } else {
        brush.fgPattern = null;
        brush.bgPattern = null;
        brush.pattern = null;
    }

    //clear the overlay canvas
    ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
});

//set brush to erase
document.getElementById('erase').addEventListener('click', function () {
    brush.mode = 'erase';
    brushTypeSelection('erase');

    // Enable increase and decrease
    document.getElementById('increase').style.backgroundColor = '#f0ecc0';
    document.getElementById('increase').disabled = false;

    document.getElementById('decrease').style.backgroundColor = '#f0ecc0';
    document.getElementById('decrease').disabled = false;
});

//change brush size with toolbar
document.getElementById('increase').addEventListener('click', function () {
    brush.increaseSize();
});

document.getElementById('decrease').addEventListener('click', function () {
    brush.decreaseSize();
});

//set brush to text
document.getElementById('text').addEventListener('click', function () {
    brush.mode = 'text';
    brushTypeSelection('text');

    // Make font size option available
    document.getElementById('fontSize').style.backgroundColor = '#f0ecc0';
    document.getElementById('fontSize').disabled = false;

    document.getElementById('font').style.backgroundColor = '#f0ecc0';
    document.getElementById('font').disabled = false;
});

//change font
document.getElementById('font').addEventListener('change', function () {
    brush.font = document.getElementById('font').value;
    //clear the overlay canvas
    ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
});

//change font size
document.getElementById('fontSize').addEventListener('change', function () {
    brush.fontSize = document.getElementById('fontSize').value;
    //clear the overlay canvas
    ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
});

//swap layers
document.getElementById('layers').addEventListener('change', function () {
    curLayer = Number(document.getElementById('layers').value);
});

//undo
document.getElementById('undo').addEventListener('click', function () {
    undo();
});

//redo
document.getElementById('redo').addEventListener('click', function () {
    redo();
});

//clear canvas
document.getElementById('clear').addEventListener('click', function () {
    //reset filling
    brush.isFilling = false;

    //save image data before clearing
    saveCanvas(layers[curLayer].ctx);

    layers[curLayer].ctx.clearRect(0, 0, layers[curLayer].canvas.width, layers[curLayer].canvas.height);
});

//save image
document.getElementById('save').addEventListener('click', function () {
    //reset filling
    brush.isFilling = false;

    //clear the overlay canvas
    ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);

    //loop through all layers and get image data
    for (let i = layers.length - 1; i >= 0; i--) {
        ctxOverlay.globalCompositeOperation = 'source-over';
        ctxOverlay.drawImage(layers[i].canvas, 0, 0);
    }

    //get url of canvas image and open it in a new tab
    window.open(canvasOverlay.toDataURL());

    //clear the overlay canvas again
    ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
});

//pin and unpin toolbar
document.getElementById('pin').addEventListener('click', function () {
    if (pin) {
        pin = false;

        //send upwards and change text if unpinned
        document.getElementById('toolbar').classList.add('hidden');
        document.getElementById('pin').innerText = 'Pin';
    } else {
        pin = true;

        //keep the toolbar down and change text if pinned
        document.getElementById('toolbar').classList.remove('hidden');
        document.getElementById('pin').innerText = 'Unpin';
    }
});

canvasOverlay.addEventListener('mousedown', function (event) {
    //set mouse down to true (drag event doesnt work for me >.<)
    mouse.down = true;

    //reset filling
    brush.isFilling = false;

    //get coordinates of mouse relative to canvas
    const rect = canvasOverlay.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.button = event.button;

    //save current image data to history before next line is drawn
    saveCanvas(layers[curLayer].ctx);

    //draw
    if (brush.mode === 'draw' && mouse.button === 0) {
        //set appropriate coloured pattern
        if (brush.fgPattern != null) {
            brush.pattern = brush.fgPattern;
        }

        drawLine(mouse.prevX, mouse.prevY, mouse.x, mouse.y, brush.colour, layers[curLayer].ctx);
    } else if (brush.mode === 'text' && mouse.button === 0) {
        let text = prompt('Enter your text:', '...');
        if (text === null) {
            text = '';
        }
        writeText(mouse.x, mouse.y, text, brush.fontSize + ' ' + brush.font, brush.colour, layers[curLayer].ctx);
    } else if (brush.mode === 'fill' && mouse.button === 0) {
        //floodfill function
        fill(layers[curLayer].ctx, mouse.x, mouse.y, brush.colour);

    } else if (brush.mode === 'fill' && mouse.button === 2) {
        //floodfill function for seconday colour
        fill(layers[curLayer].ctx, mouse.x, mouse.y, brush.bgColour);

    } else if (brush.mode === 'draw' && mouse.button === 2) {
        //set appropriate coloured pattern
        if (brush.bgPattern != null) {
            brush.pattern = brush.bgPattern;
        }

        drawLine(mouse.prevX, mouse.prevY, mouse.x, mouse.y, brush.bgColour, layers[curLayer].ctx);
    } else if (brush.mode === 'erase') {
        //use destination out to erase the layer
        layers[curLayer].ctx.globalCompositeOperation = 'destination-out';
        drawLine(mouse.prevX, mouse.prevY, mouse.x, mouse.y, brush.bgColour, layers[curLayer].ctx);
    }

    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
});

canvasOverlay.addEventListener('mouseup', function (event) {
    //rest mouse.down when user lets go of mouse button
    mouse.down = false;
    //reset layer to souce over for drawing
    layers[curLayer].ctx.globalCompositeOperation = 'source-over';
});

canvasOverlay.addEventListener('mousemove', function (event) {
    //get coordinates of mouse relative to canvas
    const rect = canvasOverlay.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;

    //set cursor colour based on what colour the mouse is hovering over
    brush.cursorColour = 'black';

    //check throuh each layer
    layers.forEach(layer => {
        //get colour the mouse is hovering over
        let colours = getPixelColour(layer.ctx, mouse.x, mouse.y);
        let colourCombined = colours[0] + colours[1] + colours[2] + colours[3];

        //check if the colour is dark and change the colour
        if (colourCombined < 400 && colourCombined > 0) {
            brush.cursorColour = 'white';
        }
    });

    //update mouse cursor in the overlay layer
    requestAnimationFrame(() => {
        //clear the overlay canvas
        ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);

        //draw the cursor
        if (brush.mode === 'text') {
            writeText(mouse.x, mouse.y, 'I', brush.fontSize + ' courier new', brush.cursorColour, ctxOverlay);
        } else if (brush.mode === 'fill') {
            circ(mouse.x, mouse.y, 3, brush.cursorColour, ctxOverlay);
        } else {
            circ(mouse.x, mouse.y, brush.size / 2, brush.cursorColour, ctxOverlay);
        }
    });

    //update canvas when drawing
    //check if the user is holding down the mouse button (drag event didnt work >.<)
    if (mouse.down) {
        //draw
        if (brush.mode === 'draw' && mouse.button === 0) {
            drawLine(mouse.prevX, mouse.prevY, mouse.x, mouse.y, brush.colour, layers[curLayer].ctx);
        } else if (brush.mode === 'draw' && mouse.button === 2) {
            drawLine(mouse.prevX, mouse.prevY, mouse.x, mouse.y, brush.bgColour, layers[curLayer].ctx);
        } else if (brush.mode === 'erase') {
            //use destination out to erase the layer
            layers[curLayer].ctx.globalCompositeOperation = 'destination-out';
            drawLine(mouse.prevX, mouse.prevY, mouse.x, mouse.y, brush.bgColour, layers[curLayer].ctx);
        }

        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
    } else {
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
    }

    //pull toolbar down when mouse hover at top
    if (!pin) {
        if (mouse.y < 15 && !mouse.down) {
            document.getElementById('toolbar').classList.remove('hidden');
        } else {
            //reset bar state
            document.getElementById('toolbar').classList.add('hidden');
        }
    }
});

function undo() {
    if (history.position == history.imgData.length) {
        //reset filling
        brush.isFilling = false;

        saveCanvas(layers[curLayer].ctx);
        history.position--;
    }

    //load previous image data from array if available
    if (history.position > 0) {
        history.position--;

        history.imgData[history.position].context.putImageData(history.imgData[history.position].data, 0, 0);
        document.getElementById('redo').style.backgroundColor = '#f0ecc0';
    } else {
        document.getElementById('undo').style.backgroundColor = '#7a7860';
    }
}

function redo() {
    //load next image data from array if available
    if (history.position < history.imgData.length - 1) {
        //reset filling
        brush.isFilling = false;

        history.position++;

        history.imgData[history.position].context.putImageData(history.imgData[history.position].data, 0, 0);
        document.getElementById('undo').style.backgroundColor = '#f0ecc0';
    } else {
        document.getElementById('redo').style.backgroundColor = '#7a7860';
    }
}

//function used to grey out selected brush type button
function brushTypeSelection(type) {
    //set all to default colour
    document.getElementById('fill').style.backgroundColor = '#f0ecc0';
    document.getElementById('pen').style.backgroundColor = '#f0ecc0';
    document.getElementById('erase').style.backgroundColor = '#f0ecc0';
    document.getElementById('text').style.backgroundColor = '#f0ecc0';

    //disable font size and type options
    document.getElementById('fontSize').style.backgroundColor = '#7a7860';
    document.getElementById('fontSize').disabled = true;

    document.getElementById('font').style.backgroundColor = '#7a7860';
    document.getElementById('font').disabled = true;

    //disable increase and decrease
    document.getElementById('increase').style.backgroundColor = '#7a7860';
    document.getElementById('increase').disabled = true;

    document.getElementById('decrease').style.backgroundColor = '#7a7860';
    document.getElementById('decrease').disabled = true;

    //disable brush style
    document.getElementById('style').style.backgroundColor = '#7a7860';
    document.getElementById('style').disabled = true;

    //grey out selected brush
    document.getElementById(type).style.backgroundColor = '#7a7860';
}

//get colour  of current pixel
function getPixelColour(context, x, y) {
    //get image data
    let imgData = context.getImageData(x, y, 1, 1).data;
    //return as rgba array
    return [imgData[0], imgData[1], imgData[2], imgData[3]];
}

//set colour at a specified pixel
function setPixelColour(context, x, y, colour) {
    context.fillStyle = colour;
    context.fillRect(x, y, 2, 2);
}

//check if colours match
function coloursMatch(a, b) {
    return a[0] == b[0] && a[1] == b[1] && a[2] == b[2] && a[3] == b[3];
}

//convert hex to rbga
function hexToRGBA(colour) {
    colour = colour.replace('#', '');
    var bigint = parseInt(colour, 16);
    var r = (bigint >> 16) & 225;
    var g = (bigint >> 8) & 225;
    var b = bigint & 255;

    return [r, g, b, 255];
}

//creates pattern and changes the colour of it
function createPattern(img, colour) {
    let canvasPattern = document.createElement('canvas');
    let ctxPattern = canvasPattern.getContext('2d');

    //set size to match the image
    canvasPattern.width = img.width;
    canvasPattern.height = img.height;

    //sraw the image
    ctxPattern.drawImage(img, 0, 0);

    //apply colour overlay
    ctxPattern.globalCompositeOperation = 'source-atop';
    ctxPattern.fillStyle = colour;
    ctxPattern.fillRect(0, 0, img.width, img.height);

    return ctxPattern.createPattern(canvasPattern, 'repeat');
}

// Phil Function based on one from William Malone
function fill(context, x, y, colour) {
    //get target colour selected
    let targetColour = getPixelColour(context, x, y);

    //return early if the target is the same as the fill colour or if already filling
    if (coloursMatch(targetColour, hexToRGBA(colour)) || brush.isFilling) {
        brush.isFilling = false;
        return;
    }

    brush.isFilling = true;

    let step = 2;
    let pixelStack = [[x, y]];

    //split the filling process into smaller chunks to avoid timeout
    function floodFillStep() {
        if (pixelStack.length === 0 || !brush.isFilling) {
            brush.isFilling = false;
            return;
        }

        let pos = pixelStack.pop();
        x = pos[0];
        y = pos[1];

        while (y > step && coloursMatch(targetColour, getPixelColour(context, x, y - step))) {
            y -= step;
        }

        let reachLeft = false;
        let reachRight = false;

        while (y < context.canvas.height - step && coloursMatch(targetColour, getPixelColour(context, x, y + step))) {
            setPixelColour(context, x, y, colour);
            y += step;

            if (x > step) {
                if (coloursMatch(targetColour, getPixelColour(context, x - step, y))) {
                    if (!reachLeft) {
                        pixelStack.push([x - step, y]);
                        reachLeft = true;
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }

            if (x < context.canvas.width - 1) {
                if (coloursMatch(targetColour, getPixelColour(context, x + step, y))) {
                    if (!reachRight) {
                        pixelStack.push([x + step, y]);
                        reachRight = true;
                    }
                } else {
                    reachRight = false;
                }
            }
        }

        //call the next chunk of flood fill after the current chunk completes
        requestAnimationFrame(floodFillStep);
    }

    //start the filling process
    floodFillStep();
}


//save to history
function saveCanvas(context) {
    //reset length
    history.imgData.length = history.position;
    //increment position and save image data
    history.position++;
    //saving both the context and the image data for using mutliple layers
    history.imgData.push({ context: context, data: context.getImageData(0, 0, canvasOverlay.width, canvasOverlay.height) });

    document.getElementById('undo').style.backgroundColor = '#f0ecc0';
    document.getElementById('redo').style.backgroundColor = '#7a7860';
}

//draw line
function drawLine(startX, startY, endX, endY, colour, context) {
    //line properties
    //choose colour or pattern
    if (brush.pattern !== null) {
        context.strokeStyle = brush.pattern;
        context.lineCap = 'round';
    } else {
        context.strokeStyle = colour;
        context.lineCap = brush.style;
    }

    context.lineWidth = brush.size;

    //draw line
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
}

//draw circle (outline)
function circ(x, y, radius, colour, context) {
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.strokeStyle = colour;
    context.stroke();
}

//write text
function writeText(x, y, text, font, colour, context) {
    context.font = font;
    context.fillStyle = colour;
    context.fillText(text, x, y);
}
