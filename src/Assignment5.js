"use strict";

var canvas;
var gl;

var camera;
var mPersp;
var program;

var sphere;

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

        divideTriangleInner(p, a, ab, ac, bNormalize, count);
        divideTriangleInner(p, bc, c, ac, bNormalize, count);
        divideTriangleInner(p, bc, ab, b, bNormalize, count);
        //divideTriangleInner(p, c, ac, bc, bNormalize, count);
        //divideTriangleInner(p, b, bc, ab, bNormalize, count);
        //divideTriangleInner(p, ab, ac, bc, bNormalize, count);
    }
}

function divideTriangle(a, b, c, bNormalize, count) {
    var p = [];
   
    divideTriangleInner(p, a, b, c, bNormalize, count);

    return p;
}

function getTexCoords(points) {
    var texts = [];

    for (var i = 0; i < points.length; ++i) {
        var x = 0.5 + Math.atan2(points[i][2], points[i][0]) / (Math.PI * 2); //atan2 is in y, x order; here we use the z as a y coord.
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

    camera = RefFrame(vec3(0, 0, 2));
    mPersp = perspective(75, canvas.width / canvas.height, 1, 1000);

    sphere = CreateTetrahedronTop(2);
    //sphere = CreateTetrahedronBottom(3);

    requestAnimationFrame(draw);

    hookupControls();
}

function draw(time) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var mFinal = mult(mPersp, camera.getMatrix());
    var u_mMVP = gl.getUniformLocation(program, "mMVP");
    gl.uniformMatrix4fv(u_mMVP, false, flatten(mFinal));

    sphere.render();

    requestAnimationFrame(draw);
}

function render() {



}

window.addEventListener("load", init);