/*
    Set up a plot showing an APPROXIMATION of Robin J Brooks' plot from
    https://robinjbrooks.substack.com/p/how-high-will-oil-prices-go
*/

/* jshint esversion: 6 */
/* global Plotly */

/**
 * Actually set up the Brooks plot, including camera animation driver.
 */
function runPlot() {
    'use strict';

    // Populate the Z data, strip by strip, starting with max value per strip
    const stripMaxima = [180.0, 150.0, 128.0, 110.0, 100.0, 90.0];
    let whichStrip = 0;

    let data_x = [];
    let data_y = [];
    let data_z = [];
    let z_row;

    // Iterate over Y axis
    for (let i = 0.1; i <= 0.2; i += 0.02) {

        z_row = [];
        let maxThisStrip = stripMaxima[whichStrip];

        // Iterate over X axis
        for (let j = 0; j <= 20; j += 2) {
            z_row.push(maxThisStrip * (20.0 - j) / 20.0);
        }

        // Add this strip to 2D Z data
        data_z.push(z_row);

        // Let Y axis know its values
        data_y.push(i);

        // Advance strip index so we get correct next max
        whichStrip++;
    }

    // Let X axis know its values
    for (let j = 0; j <= 20; j += 2) {
        data_x.push(j);
    }

    // Build wrappers for input to Plotly, and actually create plot
    let surfaceDataWrapper = {

        x: data_x,
        y: data_y,
        z: data_z,

        contours: {x: {show: true}, y: {show: true}},

        showscale: false,

        type: 'surface'
    };

    let pointDataWrapper = {
        x: [10], // The x-coordinate of the point
        y: [0.15], // The y-coordinate of the point
        z: [65], // The z-coordinate of the point
        mode: 'markers',
        type: 'scatter3d',
        marker: {
            color: 'red',
            size: 8,
            symbol: 'circle'
        },
        name: 'Highlighted Point' // Name appears in the legend and hover
    };

    let layout = {

        // title: {
        //     text: 'Effects of Throughput and Elasticity'
        // },

        uniformtext: {
            mode: 'show',
            minsize: 10
        },

        width: 600,
        height: 500,

        margin: {
            l: 5, // left margin
            r: 5, // right margin
            b: 10, // bottom margin
            t: 10, // top margin
            pad: 4 // padding between the plotting area and the axis lines
        },

        scene: {
            xaxis: {title: {text: 'Traffic, mmb/d'}},
            yaxis: {title: {text: 'Demand Price Elasticity'}},
            zaxis: {title: {text: '% Price Increase'}},

            annotations: [{
                showarrow: false,
                x: 10,
                y: 0.15,
                z: 65,
                text: "60-70%",
                font: {
                    color: "black",
                    size: 14
                },
                xanchor: "left",
                xshift: 12,
                opacity: 0.7
            }]
        },

        showlegend: false,
        autosize: true,
    };

    // Set up callbacks, to do our best to start/stop camera animation
    Plotly.newPlot('myDiv', [surfaceDataWrapper, pointDataWrapper], layout, {displayModeBar: false, responsive: true})
        .then(plot => {

            // Unfortunately we get an unhover while dragging, but
            // we can use this to note that we're dragging
            plot.on('plotly_relayouting', function(data){
                window.clearInterval(rotator);
                window.console.log(data["scene.camera"].eye.x + ", " +
                    data["scene.camera"].eye.y + ", " + data["scene.camera"].eye.z);
            });

            plot.on('plotly_hover', function(data){
                window.clearInterval(rotator);
            });

            plot.on('plotly_click', function(data){
                window.clearInterval(rotator);
            });

            plot.on('plotly_unhover', function(data){
                rotator = window.setInterval(animateCamera, 16);
            });
        });

    // Run camera at 60 Hz
    let rotator = window.setInterval(animateCamera, 16);
}

/**
 * Normalize 3D vector.
 * @param vecIn vector to normalize
 * @returns {number[]} normalized form.
 */
function normalize(vecIn) {

    const baseVectorScale = Math.sqrt(
        vecIn[0] * vecIn[0] +
        vecIn[1] * vecIn[1] +
        vecIn[2] * vecIn[2]);

    // Now we're equipped to determine normalized baseVector
    return [vecIn[0] / baseVectorScale,
        vecIn[1] / baseVectorScale, vecIn[2] / baseVectorScale];
}

let prevEye;
let prevTime;
let prevAngle;

/**
 * Drive circular camera animation.
 * Rotate around basePoint, in plane defined by that point and vector to origin.
 */
function animateCamera() {
    'use strict';

    // Top-level params
    const radius = 1.0;
    const secondsPerCycle = 7;
    const basePoint = [2, 1.2, 1.2];
    const up = [0, 0, 1.0]

    // Base vector is origin->basePoint, normalized
    // So first determine scale (of unnormalized vector)
    const baseVector = normalize(basePoint);

    // Cross base and up to get right
    const right = normalize([baseVector[1] * up[2] - baseVector[2] * up[1],
        baseVector[2] * up[0] - baseVector[0] * up[2],
        baseVector[0] * up[1] - baseVector[1] * up[0]]);

    // Derive newUp, perpendicular to both base and right
    const newUp = normalize([baseVector[1] * right[2] - baseVector[2] * right[1],
        baseVector[2] * right[0] - baseVector[0] * right[2],
        baseVector[0] * right[1] - baseVector[1] * right[0]]);

    // Okay!  Derive angle and thence position based on time and params
    let currentTime = Date.now();
    let angle = ((currentTime / 1000.0) * 2.0 * Math.PI) / secondsPerCycle;
    angle %= 2.0 * Math.PI;

    let thisSin = Math.sin(angle);
    let thisCos = Math.cos(angle);

    let newEye = {
        x: basePoint[0] + radius * (thisSin * newUp[0] + thisCos * right[0]),
        y: basePoint[1] + radius * (thisSin * newUp[1] + thisCos * right[1]),
        z: basePoint[2] + radius * (thisSin * newUp[2] + thisCos * right[2])
    };

    // Update the layout with the new camera position
    Plotly.relayout('myDiv', 'scene.camera.eye', newEye);
}

// Let 'er rip!
runPlot();
