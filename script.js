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

var current_layer = 0;

//set size of every canvas
layers.forEach(layer => {
    layer.canvas.width = window.innerWidth;
    layer.canvas.height = window.innerHeight;
})

//get canvas for overlay for the cursor and set size
const canvas_overlay = /** @type {HTMLCanvasElement} */ document.getElementById('canvasOverlay');
const ctx_overlay = canvas_overlay.getContext('2d');
canvas_overlay.width = window.innerWidth;
canvas_overlay.height = window.innerHeight;

//resize canvas with window resize
window.addEventListener('resize', function () {
    //save layers to prevent it from being erased when resizing
    let layer_data = layers.map(layer => layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height));
    layers.forEach((layer, i) => {
        layer.canvas.width = window.innerWidth;
        layer.canvas.height = window.innerHeight;
        layer.ctx.putImageData(layer_data[i], 0, 0);
    });


    //resize
    layers.forEach(layer => {
        layer.canvas.width = window.innerWidth;
        layer.canvas.height = window.innerHeight;
    })

    canvas_overlay.width = window.innerWidth;
    canvas_overlay.height = window.innerHeight;

    //put image data back onto the layers
    let i = 0;
    layers.forEach(layer => {
        layer_data.push(layer.ctx.putImageData(layer_data[i], 0, 0));
        i++;
    })
})

//undo and redo image data
const history = {
    img_data: [],
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
const size_max = 100;
const size_min = 5;
const size_inc = 5;

const brush = {
    mode: 'draw',
    size: 10,
    colour: document.getElementById('colorPicker').value,
    bg_colour: document.getElementById('bgColorPicker').value,
    cursor_colour: 'black',
    font: document.getElementById('font').value,
    font_size: document.getElementById('fontSize').value,
    type: 'round',
    isFilling: false,
    increaseSize: function () {
        if (this.size <= size_max - size_inc) {
            this.size += size_inc;
            document.getElementById('decrease').style.backgroundColor = '#f0ecc0';
        } else {
            document.getElementById('increase').style.backgroundColor = '#7a7860';
        }
        //clear the overlay canvas
        ctx_overlay.clearRect(0, 0, canvas_overlay.width, canvas_overlay.height);
    },
    decreaseSize: function () {
        if (this.size >= size_min + size_inc) {
            this.size -= size_inc;
            document.getElementById('increase').style.backgroundColor = '#f0ecc0';
        } else {
            document.getElementById('decrease').style.backgroundColor = '#7a7860';
        }
        //clear the overlay canvas
        ctx_overlay.clearRect(0, 0, canvas_overlay.width, canvas_overlay.height);
    },
}

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
});

//chnage brush colour with toolbar
document.getElementById('colorPicker').addEventListener('change', function () {
    //get the selected color from the color picker
    brush.colour = document.getElementById('colorPicker').value;
});

document.getElementById('bgColorPicker').addEventListener('change', function () {
    //get the selected color from the color picker
    brush.bg_colour = document.getElementById('bgColorPicker').value;
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
    ctx_overlay.clearRect(0, 0, canvas_overlay.width, canvas_overlay.height);
});

//change font size
document.getElementById('fontSize').addEventListener('change', function () {
    brush.font_size = document.getElementById('fontSize').value;
    //clear the overlay canvas
    ctx_overlay.clearRect(0, 0, canvas_overlay.width, canvas_overlay.height);
});

//swap layers
document.getElementById('layers').addEventListener('change', function () {
    current_layer = Number(document.getElementById('layers').value);
});

//undo
document.getElementById('undo').addEventListener('click', function () {
    if (history.position == history.img_data.length) {
        //reset filling
        brush.isFilling = false;

        saveCanvas(layers[current_layer].ctx);
        history.position--;
    }

    //load previous image data from array if available
    if (history.position > 0) {
        history.position--;

        history.img_data[history.position].context.putImageData(history.img_data[history.position].data, 0, 0);
        document.getElementById('redo').style.backgroundColor = '#f0ecc0';
    } else {
        document.getElementById('undo').style.backgroundColor = '#7a7860';
    }
});

//redo
document.getElementById('redo').addEventListener('click', function () {
    //load next image data from array if available
    if (history.position < history.img_data.length - 1) {
        //reset filling
        brush.isFilling = false;

        history.position++;

        history.img_data[history.position].context.putImageData(history.img_data[history.position].data, 0, 0);
        document.getElementById('undo').style.backgroundColor = '#f0ecc0';
    } else {
        document.getElementById('redo').style.backgroundColor = '#7a7860';
    }
});

//clear canvas
document.getElementById('clear').addEventListener('click', function () {
    //reset filling
    brush.isFilling = false;

    //save image data before clearing
    saveCanvas(layers[current_layer].ctx);

    layers[current_layer].ctx.clearRect(0, 0, layers[current_layer].canvas.width, layers[current_layer].canvas.height);
});

//save image
document.getElementById('save').addEventListener('click', function () {
    //reset filling
    brush.isFilling = false;

    //clear the overlay canvas
    ctx_overlay.clearRect(0, 0, canvas_overlay.width, canvas_overlay.height);

    //loop through all layers and get image data
    layers.forEach(layer => {
        ctx_overlay.globalCompositeOperation = 'source-over';
        ctx_overlay.drawImage(layer.canvas, 0, 0);
    })

    //get url of canvas image and open it in a new tab
    window.open(canvas_overlay.toDataURL());

    //clear the overlay canvas again
    ctx_overlay.clearRect(0, 0, canvas_overlay.width, canvas_overlay.height);
});

canvas_overlay.addEventListener('mousedown', function (event) {
    //set mouse down to true (drag event doesnt work for me >.<)
    mouse.down = true;

    //reset filling
    brush.isFilling = false;

    //get coordinates of mouse relative to canvas
    const rect = canvas_overlay.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.button = event.button;

    //save current image data to history before next line is drawn
    saveCanvas(layers[current_layer].ctx);

    //draw
    if (brush.mode === 'draw' && mouse.button === 0) {
        drawLine(mouse.prev_x, mouse.prev_y, mouse.x, mouse.y, brush.colour, layers[current_layer].ctx);
    } else if (brush.mode === 'text' && mouse.button === 0) {
        let text = prompt('Enter your text:', '...');
        if (text === null) {
            text = '';
        }

        writeText(mouse.x, mouse.y, text, brush.font_size + ' ' + brush.font, brush.colour, layers[current_layer].ctx);
    } else if (brush.mode === 'fill' && mouse.button === 0) {
        //floodfill function
        fill(layers[current_layer].ctx, mouse.x, mouse.y, brush.colour);

    } else if (brush.mode === 'fill' && mouse.button === 2) {
        //floodfill function for seconday colour
        fill(layers[current_layer].ctx, mouse.x, mouse.y, brush.bg_colour);

    } else if (brush.mode === 'draw' && mouse.button === 2) {
        drawLine(mouse.prev_x, mouse.prev_y, mouse.x, mouse.y, brush.bg_colour, layers[current_layer].ctx);
    } else if (brush.mode === 'erase') {
        //use destination out to erase the layer
        layers[current_layer].ctx.globalCompositeOperation = 'destination-out';
        drawLine(mouse.prev_x, mouse.prev_y, mouse.x, mouse.y, brush.bg_colour, layers[current_layer].ctx);
    }

    mouse.prev_x = mouse.x;
    mouse.prev_y = mouse.y;
});

canvas_overlay.addEventListener('mouseup', function (event) {
    //rest mouse.down when user lets go of mouse button
    mouse.down = false;
    //reset layer to souce over for drawing
    layers[current_layer].ctx.globalCompositeOperation = 'source-over';
});

canvas_overlay.addEventListener('mousemove', function (event) {
    //get coordinates of mouse relative to canvas
    const rect = canvas_overlay.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;

    //set cursor colour based on what colour the mouse is hovering over
    brush.cursor_colour = 'black';

    //check throuh each layer
    layers.forEach(layer => {
        //get colour the mouse is hovering over
        let colours = getPixelColour(layer.ctx, mouse.x, mouse.y);
        let colour_combined = colours[0] + colours[1] + colours[2] + colours[3];

        //check if the colour is dark and change the colour
        if (colour_combined < 400 && colour_combined > 0) {
            brush.cursor_colour = 'white';
        }
    });

    //update mouse cursor in the overlay layer
    requestAnimationFrame(() => {
        //clear the overlay canvas
        ctx_overlay.clearRect(0, 0, canvas_overlay.width, canvas_overlay.height);

        //draw the cursor
        if (brush.mode === 'text') {
            writeText(mouse.x, mouse.y, 'I', brush.font_size + ' courier new', brush.cursor_colour, ctx_overlay);
        } else if (brush.mode === 'fill') {
            circ(mouse.x, mouse.y, 3, brush.cursor_colour, ctx_overlay);
        } else {
            circ(mouse.x, mouse.y, brush.size / 2, brush.cursor_colour, ctx_overlay);
        }
    });

    //update canvas when drawing
    //check if the user is holding down the mouse button (drag event didnt work >.<)
    if (mouse.down) {
        //draw
        if (brush.mode === 'draw' && mouse.button === 0) {
            drawLine(mouse.prev_x, mouse.prev_y, mouse.x, mouse.y, brush.colour, layers[current_layer].ctx);
        } else if (brush.mode === 'draw' && mouse.button === 2) {
            drawLine(mouse.prev_x, mouse.prev_y, mouse.x, mouse.y, brush.bg_colour, layers[current_layer].ctx);
        } else if (brush.mode === 'erase') {
            //use destination out to erase the layer
            layers[current_layer].ctx.globalCompositeOperation = 'destination-out';
            drawLine(mouse.prev_x, mouse.prev_y, mouse.x, mouse.y, brush.bg_colour, layers[current_layer].ctx);
        }

        mouse.prev_x = mouse.x;
        mouse.prev_y = mouse.y;
    } else {
        mouse.prev_x = mouse.x;
        mouse.prev_y = mouse.y;
    }
});

// Function used to grey out selected brush type button
function brushTypeSelection(type) {
    // Set all to default colour
    document.getElementById('fill').style.backgroundColor = '#f0ecc0';
    document.getElementById('pen').style.backgroundColor = '#f0ecc0';
    document.getElementById('erase').style.backgroundColor = '#f0ecc0';
    document.getElementById('text').style.backgroundColor = '#f0ecc0';

    // Disable font size and type options
    document.getElementById('fontSize').style.backgroundColor = '#7a7860';
    document.getElementById('fontSize').disabled = true;

    document.getElementById('font').style.backgroundColor = '#7a7860';
    document.getElementById('font').disabled = true;

    // Disable increase and decrease
    document.getElementById('increase').style.backgroundColor = '#7a7860';
    document.getElementById('increase').disabled = true;

    document.getElementById('decrease').style.backgroundColor = '#7a7860';
    document.getElementById('decrease').disabled = true;

    // Grey out selected brush
    document.getElementById(type).style.backgroundColor = '#7a7860';
}

//get colour  of current pixel
function getPixelColour(context, x, y) {
    //get image data
    let img_data = context.getImageData(x, y, 1, 1).data;
    //return as rgba array
    return [img_data[0], img_data[1], img_data[2], img_data[3]];
}

//set colour at a specified pixel
function setPixelColour(context, x, y, colour) {
    context.fillStyle = colour;
    context.fillRect(x, y, 4, 4);
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

// Phil Function based on one from William Malone
function fill(context, x, y, colour) {
    //get target colour selected
    let targetColour = getPixelColour(context, x, y);

    //return early if the target is the same as the fill colour or if already filling
    if (coloursMatch(targetColour, hexToRGBA(colour)) || brush.isFilling) {
        brush.isFilling = false; c
        return;
    }

    brush.isFilling = true;

    let step = 4;
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
    history.img_data.length = history.position;
    //increment position and save image data
    history.position++;
    //saving both the context and the image data for using mutliple layers
    history.img_data.push({ context: context, data: context.getImageData(0, 0, canvas_overlay.width, canvas_overlay.height) });

    document.getElementById('undo').style.backgroundColor = '#f0ecc0';
    document.getElementById('redo').style.backgroundColor = '#7a7860';
}

//draw line
function drawLine(start_x, start_y, end_x, end_y, colour, context) {
    //line properties
    context.strokeStyle = colour;
    context.lineWidth = brush.size;
    context.lineCap = brush.type;

    //draw line
    context.beginPath();
    context.moveTo(start_x, start_y);
    context.lineTo(end_x, end_y);
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
