function multMV(mat, vec) {
    var out = [];
    var retLength = vec.length;

    //less than ideal
    //while (vec.length < 4)
    //    vec.push(0);
    vec = vec4(vec);    ////less than ideal, how to make javascript copy?
                        // is there away to pass by copy so we don't have to do this manually? 
    mat = transpose(mat);
    out[0] = dot(mat[0], vec);
    out[1] = dot(mat[1], vec);
    out[2] = dot(mat[2], vec);
    out[3] = dot(mat[3], vec);

    return out.slice(0, retLength);
}

function RefFrame(pos, look, up) {
    var ref = {};

    ref.pos = (pos !== undefined) ? pos : vec3();
    ref.look = (look !== undefined) ? look : vec3(0, 0, -1);
    ref.up = (up !== undefined) ? up : vec3(0, 1, 0);

    ref.getMatrix = function () {
        return lookAt(this.pos, add(this.pos, this.look), this.up);
    }

    //todo - move always happens in world coordinates, never in local coordinates
    //it should be in local coordinates
    //that is to say if the vector is forward, the camera should move the direction it is facing, etc.
    // not down the z-axis ( assuming z is forward)
    ref.move = function (vec) {
        if (vec === undefined)
            return;

        this.pos = add(this.pos, vec);
    }

    //todo - will need to update the up vector as well......
    ref.rotate = function (angle, axis) {
        if (angle === undefined || axis === undefined)
            return;

        var rot = rotate(angle, axis);
        this.look = multMV(rot, this.look);
    }

    //todo - will need to update the up vector as well......
    //this function is actually foobar, but I don't have time to fix it
    // IT SHOULD orbit the position AROUND the current point we're looking at
    // but it is NOT working correctly
    //current implementation is just a stop gap
    ref.orbit = function (angle, axis) {
        if (angle === undefined || axis === undefined)
            return;

        axis = normalize(axis);
        var rot = rotate(angle, axis);

        var p = subtract(this.pos, this.look);
        //var l = length(p);
        //var p = normalize(p);

        var p = multMV(rot, p);
        //p = add(scale(l, p), this.look);
        p = add(p, this.look);
        p = normalize(p);
        p = scale(2, p);
        this.pos = p;
        this.look = normalize(subtract(vec3(), this.pos));//normalize(multMV(rot, this.look));

        //var right = normalize(cross(this.look, this.up));

        //this.up = normalize(cross(right, this.look));
    }
    
    return ref;
}