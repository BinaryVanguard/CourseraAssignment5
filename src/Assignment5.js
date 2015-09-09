"use strict";

var canvas;
var gl;

var camera;
var mPersp;
var program;
var tex2dProgram;

var sphere;
var sTop;
var sBottom;

var textureIds;
var currentTextureId = 0;

//is it possible to hide this as an inner fuction inside the calling function ?
function divideTriangleInner(p, a, b, c, bNormalize, count) {  //hide this function using same name, it will always call the inner

    // check for end of recursion

    if (count === 0) {
        if (bNormalize) {
            a = normalize(a);
            b = normalize(b);
            c = normalize(c); 
        }
        p.push(a, b, c);
    }
    else {

        //bisect the sides

        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        --count;

        // three new triangles
        //divideTriangleInner(p, ac, bc, c, bNormalize, count);
        //if (count < 2)
            divideTriangleInner(p, a, ab, ac, bNormalize, count);
        //if (count < 2)
            divideTriangleInner(p, b, bc, ab, bNormalize, count);
        //if (count < 2)
            divideTriangleInner(p, ac, bc, c, bNormalize, count);

        
        //divideTriangleInner(p, c, ac, bc, bNormalize, count);
        //divideTriangleInner(p, b, bc, ab, bNormalize, count);

        divideTriangleInner(p, ab, ac, bc, bNormalize, count);
    }
}

function divideTriangle(a, b, c, bNormalize, count) {
    var p = [];
   
    divideTriangleInner(p, a, b, c, bNormalize, count);

    return p;
}

function getTexCoords(points, flip_x) {
    var texts = [];

    for (var i = 0; i < points.length; ++i) {
        var x = 0.5 - Math.atan2(points[i][2], points[i][0]) / (Math.PI * 2); //atan2 is in y, x order; here we use the z as a y coord.
        var y = 0.5 - Math.asin(points[i][1]) / Math.PI;
        texts.push(vec2(x, y));
    }

    return texts;
}

function CreateTetrahedronTop(subdivisions) {
    if (!Number.isInteger(subdivisions) || subdivisions < 0)
        subdivisions = 0;

    var points = [];

    var root12 = Math.sqrt(1 / 12);
    var root23 = Math.sqrt(2 / 3);
    var root13 = Math.sqrt(1 / 3);

    points.push([.5, 0, root12]);
    points.push([-.5, 0, root12]);
    points.push([0, root23, 0]);

    points.push([0, 0, -root13]);
    points.push([.5, 0, root12]);
    points.push([0, root23, 0]);

    points.push([-.5, 0, root12]);
    points.push([0, 0, -root13]);
    points.push([0, root23, 0]);

    var final_points = [];
    for (var i = 0; i < points.length; i += 3)
        [].push.apply(final_points, divideTriangle(points[i], points[i + 1], points[i + 2], true, subdivisions));

    var colors = [];

    for (var i = 0; i < 3; ++i)
        colors.push([1, 0, 0, 1]);
    for (var i = 0; i < 3; ++i)
        colors.push([0, 1, 0, 1]);
    for (var i = 0; i < 3; ++i)
        colors.push([0, 0, 1, 1]);

    var final_colors = [];
    for (var i = 0; i < colors.length; i += 3)
        [].push.apply(final_colors, divideTriangle(colors[i], colors[i + 1], colors[i + 2], false, subdivisions));

    var pointsBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(final_points), gl.STATIC_DRAW);

    var colorsBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(final_colors), gl.STATIC_DRAW);

    render = function () {
        var vPosition = gl.getAttribLocation(program, "vPosition");
        var vColor = gl.getAttribLocation(program, "vColor");

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBufferId);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vColor);

        var u_mL2W = gl.getUniformLocation(program, "mL2W");
        gl.uniformMatrix4fv(u_mL2W, false, flatten(mat4()));

        gl.drawArrays(gl.TRIANGLES, 0, final_points.length);
    };

    return {
        points: final_points,
        colors: final_colors,
        render: render
    };
}

function CreateTetrahedronBottom(subdivisions) {
    if (!Number.isInteger(subdivisions) || subdivisions < 0)
        subdivisions = 0;

    var points = [];

    var root12 = Math.sqrt(1 / 12);
    var root23 = Math.sqrt(2/3);
    var root13 = Math.sqrt(1/3);

    points.push([.5, 0, root12]);
    points.push([-.5, 0, root12]);
    points.push([0, -root23, 0]);
    
    points.push([0, 0, -root13]);
    points.push([.5, 0, root12]);
    points.push([0, -root23, 0]);
    
    points.push([-.5, 0, root12]);
    points.push([0, 0, -root13]);
    points.push([0, -root23, 0]);

    var final_points = [];
    for (var i = 0; i < points.length; i+=3)
        [].push.apply(final_points, divideTriangle(points[i], points[i + 1], points[i + 2], true, subdivisions));

    var colors = [];

    for (var i = 0; i < 3; ++i)
        colors.push([1, 0, 0, 1]);
    for (var i = 0; i < 3; ++i)
        colors.push([0, 1, 0, 1]);
    for (var i = 0; i < 3; ++i)
        colors.push([0, 0, 1, 1]);

    var final_colors = [];
    for (var i = 0; i < colors.length; i += 3)
        [].push.apply(final_colors, divideTriangle(colors[i], colors[i + 1], colors[i + 2], false, subdivisions));

    var pointsBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(final_points), gl.STATIC_DRAW);

    var colorsBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(final_colors), gl.STATIC_DRAW);

    render = function () {
        var vPosition = gl.getAttribLocation(program, "vPosition");
        var vColor = gl.getAttribLocation(program, "vColor");

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBufferId);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vColor);

        var u_mL2W = gl.getUniformLocation(program, "mL2W");
        gl.uniformMatrix4fv(u_mL2W, false, flatten(mat4()));

        gl.drawArrays(gl.TRIANGLES, 0, final_points.length);
    };

    return {
        points: final_points,
        colors: final_colors,
        render: render
    };
}

function CreateTetraTexTop(subdivisions) {
    if (!Number.isInteger(subdivisions) || subdivisions < 0)
        subdivisions = 0;

    var points = [];

    var root12 = Math.sqrt(1 / 12);
    var root23 = Math.sqrt(2 / 3);
    var root13 = Math.sqrt(1 / 3);

    points.push([.5, 0, root12]);
    points.push([-.5, 0, root12]);
    points.push([0, root23, 0]);

    points.push([0, 0, -root13]);
    points.push([.5, 0, root12]);
    points.push([0, root23, 0]);

    points.push([-.5, 0, root12]);
    points.push([0, 0, -root13]);
    points.push([0, root23, 0]);

    var final_points = [];
    for (var i = 0; i < points.length; i += 3)
        [].push.apply(final_points, divideTriangle(points[i], points[i + 1], points[i + 2], true, subdivisions));

    var tex_coords = getTexCoords(final_points);

    gl.useProgram(tex2dProgram);

    var pointsBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(final_points), gl.STATIC_DRAW);

    var tex2dBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tex2dBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coords), gl.STATIC_DRAW);

    render = function () {

        gl.useProgram(tex2dProgram);

        var vPosition = gl.getAttribLocation(tex2dProgram, "vPosition");
        var vTex = gl.getAttribLocation(tex2dProgram, "vTex");

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, tex2dBufferId);
        gl.vertexAttribPointer(vTex, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vTex);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureIds[currentTextureId]);

        var u_mL2W = gl.getUniformLocation(tex2dProgram, "mL2W");
        gl.uniformMatrix4fv(u_mL2W, false, flatten(mat4()));

        var u_uSampler = gl.getUniformLocation(tex2dProgram, "uSampler");
        gl.uniform1i(u_uSampler, 0);

        gl.drawArrays(gl.TRIANGLES, 0, final_points.length);
    };

    return {
        points: final_points,
        tex2d_coords: tex_coords,
        render: render
    };
}

function CreateTetraTexBottom(subdivisions) {
    if (!Number.isInteger(subdivisions) || subdivisions < 0)
        subdivisions = 0;

    var points = [];

    var root12 = Math.sqrt(1 / 12);
    var root23 = Math.sqrt(2 / 3);
    var root13 = Math.sqrt(1 / 3);

    points.push([.5, 0, root12]);
    points.push([-.5, 0, root12]);
    points.push([0, -root23, 0]);

    points.push([0, 0, -root13]);
    points.push([.5, 0, root12]);
    points.push([0, -root23, 0]);

    points.push([-.5, 0, root12]);
    points.push([0, 0, -root13]);
    points.push([0, -root23, 0]);

    var final_points = [];
    for (var i = 0; i < points.length; i += 3)
        [].push.apply(final_points, divideTriangle(points[i], points[i + 1], points[i + 2], true, subdivisions));
    
    var tex_coords = getTexCoords(final_points);

    gl.useProgram(tex2dProgram);

    var pointsBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(final_points), gl.STATIC_DRAW);

    var tex2dBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tex2dBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coords), gl.STATIC_DRAW);

    render = function () {

        gl.useProgram(tex2dProgram);

        var vPosition = gl.getAttribLocation(tex2dProgram, "vPosition");
        var vTex = gl.getAttribLocation(tex2dProgram, "vTex");

        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBufferId);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, tex2dBufferId);
        gl.vertexAttribPointer(vTex, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(vPosition);
        gl.enableVertexAttribArray(vTex);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureIds[currentTextureId]);
        
        var u_mL2W = gl.getUniformLocation(tex2dProgram, "mL2W");
        gl.uniformMatrix4fv(u_mL2W, false, flatten(mat4()));

        var u_uSampler = gl.getUniformLocation(tex2dProgram, "uSampler");
        gl.uniform1i(u_uSampler, 0);

        gl.drawArrays(gl.TRIANGLES, 0, final_points.length);
    };

    return {
        points: final_points,
        tex2d_coords: tex_coords,
        render: render
    };
}

function genCheckerBoardText(texSize, numChecks) {
    var image = new Uint8Array(4 * texSize * texSize);

    for (var i = 0; i < texSize; i++) {
        for (var j = 0; j < texSize; j++) {
            var patchx = Math.floor(i / (texSize / numChecks));
            var patchy = Math.floor(j / (texSize / numChecks));
            var c = (patchx % 2 ^ patchy % 2) ? 255: 0;
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image[4 * i * texSize + 4 * j] = c;
            image[4 * i * texSize + 4 * j + 1] = c;
            image[4 * i * texSize + 4 * j + 2] = c;
            image[4 * i * texSize + 4 * j + 3] = 255;
        }
    }

    return image;
}

function handleGenTextureLoaded(image, textureId, texSize) {
    //THIS IS THE ORIGINAL WAY YOU IMPLEMENTED IT... but you tried some stuff to get rid of the seam at x-1... how do you do that?
    //tex.onload = function () {
    //    gl.bindTexture(gl.TEXTURE_2D, textureId);
    //    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
    //    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    //    gl.generateMipmap(gl.TEXTURE_2D);
    //    gl.bindTexture(gl.TEXTURE_2D, null);
    //};

    gl.bindTexture(gl.TEXTURE_2D, textureId);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function handleTextureLoaded(image, textureId) {
    //THIS IS THE ORIGINAL WAY YOU IMPLEMENTED IT... but you tried some stuff to get rid of the seam at x-1... how do you do that?
    //tex.onload = function () {
    //    gl.bindTexture(gl.TEXTURE_2D, textureId);
    //    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
    //    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    //    gl.generateMipmap(gl.TEXTURE_2D);
    //    gl.bindTexture(gl.TEXTURE_2D, null);
    //};
    
    gl.bindTexture(gl.TEXTURE_2D, textureId);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTextures() {
    //texture
    var ids = []

    var textureId = gl.createTexture();
    var tex = genCheckerBoardText(256, 8);
    handleGenTextureLoaded(tex, textureId, 256);
    ids.push(textureId);

    var textureId2 = gl.createTexture();
    var tex2 = new Image();
    tex2.onload = function () { handleTextureLoaded(tex2, textureId2); };
    //tex.crossOrigin = '';
    tex2.src = "PathfinderMap.jpg";
    ids.push(textureId2);
    
    return ids;
}

function hookupControls() {

    let moveCamera = false;
    let point = {};
    canvas.addEventListener("mousedown", function (e) {
        moveCamera = true;
        point.x = e.pageX;
        point.y = e.pageY
    });

    canvas.addEventListener("mousemove", function (e) {
        if (moveCamera) {
            var delta_x = e.pageX - point.x;
            var delta_y = e.pageY - point.y;

            var len = 10/45 * length(vec2(delta_x, delta_y));   //length of vector determins amount of rotation.

            //swap and negate x
            var vect = vec3(-delta_y, delta_x);
            camera.orbit(len, vect);

            point.x = e.pageX;
            point.y = e.pageY;
        }
    });

    canvas.addEventListener("mouseup", function () {
        moveCamera = false;
        point = {};
    });

    canvas.addEventListener("mouseleave", function () {
        moveCamera = false;
        point = {};
    });


    for (var i = 0; i < textureIds.length; ++i) {
        var input = document.createElement('div');
        input.innerHTML = '<input type="radio" name = "texture" value="' + i + '" '
            + (i === 0 ? 'checked' : '')
            + '> Texture #' + i;
        document.getElementById("input-container").appendChild(input); // put it into the DOM
        input.children[0].addEventListener("change", function () { currentTextureId = this.value; });
    }
}

function init() {
    canvas = document.getElementById("gl-canvas");
    if (!canvas) {
        alert("Canvas not found");
        return;
    }

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    tex2dProgram = initShaders(gl, "vertex-tex2d-shader", "fragment-tex2d-shader");

    camera = RefFrame(vec3(0, 0, 2));
    mPersp = perspective(75, canvas.width / canvas.height, 1, 1000);

    //sphere = CreateTetrahedronTop(2);
    //sphere = CreateTetrahedronBottom(3);

    sTop = CreateTetraTexTop(6);
    sBottom = CreateTetraTexBottom(6);
    
    textureIds = initTextures();

    hookupControls();

    requestAnimationFrame(draw);
}

function draw(time) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var mFinal = mult(mPersp, camera.getMatrix());
    var u_mMVP = gl.getUniformLocation(tex2dProgram, "mMVP");
    gl.uniformMatrix4fv(u_mMVP, false, flatten(mFinal));

    //sphere.render();
    sTop.render();
    sBottom.render();

    requestAnimationFrame(draw);
}

function render() {



}

window.addEventListener("load", init);
