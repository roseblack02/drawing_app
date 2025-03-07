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
    let layer_data = [];
    layers.forEach(layer => {
        layer_data.push(layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height));
    })

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
});

//set brush to erase
document.getElementById('erase').addEventListener('click', function () {
    brush.mode = 'erase';
    brushTypeSelection('erase');
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
        saveCanvas(layers[current_layer].ctx);
        history.position--;
    }

    //load previous image data from array if available
    if (history.position > 0) {
        history.position--;

        history.img_data[history.position].context.putImageData(history.img_data[history.position].data, 0, 0);
    } else {
        document.getElementById('undo').style.backgroundColor = '#7a7860';
    }

    document.getElementById('redo').style.backgroundColor = '#f0ecc0';
});

//redo
document.getElementById('redo').addEventListener('click', function () {
    //load next image data from array if available
    if (history.position < history.img_data.length - 1) {
        history.position++;

        history.img_data[history.position].context.putImageData(history.img_data[history.position].data, 0, 0);
    } else {
        document.getElementById('redo').style.backgroundColor = '#7a7860';
    }

    document.getElementById('undo').style.backgroundColor = '#f0ecc0';
});

//clear canvas
document.getElementById('clear').addEventListener('click', function () {
    //save image data before clearing
    saveCanvas(layers[current_layer].ctx);

    layers[current_layer].ctx.clearRect(0, 0, layers[current_layer].canvas.width, layers[current_layer].canvas.height);
});

//save image
document.getElementById('save').addEventListener('click', function () {
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

    //get coordinates of mouse relative to canvas
    const rect = canvas_overlay.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.button = event.button;

    //save current image data to history before next line is drawn
    saveCanvas(layers[current_layer].ctx);

    //stop filling when another action is performed
    clearTimeout(timout_fill);

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

    //update canvas every 10 milliseconds when drawing cursor
    setTimeout(() => {
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
    }, 10);

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

    // Disable font size option
    document.getElementById('fontSize').style.backgroundColor = '#7a7860';
    document.getElementById('fontSize').disabled = true;

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

var timout_fill;
function fill(context, x, y, colour, target_colour, pixels, visited, iteration) {
    target_colour = typeof (target_colour) === 'undefined' ? null : target_colour;
    pixels = typeof (pixels) === 'undefined' ? null : pixels;
    visited = typeof (visited) === 'undefined' ? null : visited;
    iteration = typeof (iteration) === 'undefined' ? null : iteration;

    clearTimeout(timout_fill);

    //colour being targeted
    if (target_colour === null) {
        target_colour = getPixelColour(context, x, y);
    }

    //stack of pixels to check
    if (pixels === null) {
        pixels = [{ x: x, y: y }];
    }

    //used to check if a pixel has alreayd been checked
    if (visited === null) {
        visited = [];
    }

    //keep track of how many times the function has been called
    if (iteration === null) {
        iteration = 0;
    }

    //return if target colour is the same as the fill colour
    if (coloursMatch(target_colour, hexToRGBA(colour))) {
        return;
    }

    //use count to do a set amount of iterations per function call
    let count = 0;
    //loop while there are pixels in the stack
    while (pixels.length > 0) {
        //getlast pixel
        let current_pixel = pixels.pop();
        let current_x = current_pixel.x;
        let current_y = current_pixel.y;

        if (
            !visited.includes([current_x, current_y]) &&
            current_x >= 0 && current_x < context.canvas.width &&
            current_y >= 0 && current_y < context.canvas.height &&
            //!visited.has(`${current_x},${current_y}`) &&
            coloursMatch(getPixelColour(context, current_x, current_y), target_colour)

        ) {
            //change the colour of the current pixel
            setPixelColour(context, current_x, current_y, colour);

            //set pixel to visited
            visited.push([current_x, current_y]);

            //add nearby pixels to stack
            pixels.push({ x: current_x, y: current_y + 2 });
            pixels.push({ x: current_x + 2, y: current_y });
            pixels.push({ x: current_x, y: current_y - 2 });
            pixels.push({ x: current_x - 2, y: current_y });
        }
        count++;
        if (count > 1000) {
            break;
        }
    }

    //continue filling after timeout if there are still pixels to check
    //or if the iterations hasnt hit the limit
    if (pixels.length > 0 && iteration < 1000) {
        //copy stack of pixels and rerun function
        new_pixel = pixels.shift();
        iteration++;
        timout_fill = setTimeout(function () { fill(context, new_pixel.x, new_pixel.y, colour, target_colour, pixels, visited, iteration); }, 60);
    } else {
        //stop filling
        clearTimeout(timout_fill);
    }
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
