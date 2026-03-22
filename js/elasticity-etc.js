/*
    Set up a plot showing an APPROXIMATION of Robin J Brooks' plot from
    https://robinjbrooks.substack.com/p/how-high-will-oil-prices-go
*/

/* jshint esversion: 6 */
/* global Plotly */

// Three.js xforms
// Add one Point

function runPlot() {
    'use strict';

    const stripMaxima = [180.0, 150.0, 128.0, 110.0, 100.0, 90.0];
    let whichStrip = 0;

    let data_x = [];
    let data_y = [];
    let data_z = [];
    let z_row;

    for (let j = 0; j <= 20; j += 2) {

        data_x.push(j);
    }

    for (let i = 0.1; i <= 0.2; i += 0.02) {

        z_row = [];
        let maxThisStrip = stripMaxima[whichStrip];

        for (let j = 0; j <= 20; j += 2) {
            z_row.push(maxThisStrip * (20.0 - j) / 20.0);
        }

        data_y.push(i);
        data_z.push(z_row);
        whichStrip++;
    }

    let data_wrapper = {

        title: {text: 'Effects of Throughput and Elasticity'},

        x: data_x,
        y: data_y,
        z: data_z,

        contours: {x: {show: true}, y: {show: true}},

        type: 'surface'
    };

    let layout = {

        title: {
            text: 'Effects of Throughput and Elasticity'
        },

        scene: {
            xaxis: {title: {text: 'Traffic, mmb/d'}},
            yaxis: {title: {text: 'Demand Price Elasticity'}},
            zaxis: {title: {text: '% Price Increase'}}
        },

        showlegend: false,
        autosize: true
    };

    Plotly.newPlot('myDiv', [data_wrapper], layout, {responsive: true})
        .then(plot => {

            // Unfortunately we get an unhover while dragging, but
            // we can use this to note that we're dragging
            plot.on('plotly_relayouting', function(data){
                window.clearInterval(rotator);
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

function animateCamera() {
    'use strict';

    const radius = 0.6;
    const secondsPerCycle = 3.5;

    let angle = ((Date.now() / 1000.0) * 2.0 * Math.PI) / secondsPerCycle;

    // Keep X constant
    let newX = 3.5;
    let newY = radius * Math.sin(angle) + 1.5;
    let newZ = radius * Math.cos(angle) + 1.2;

    let newEye = {
        x: newX,
        y: newY,
        z: newZ
    };

    // Update the layout with the new camera position
    Plotly.relayout('myDiv', 'scene.camera.eye', newEye);
}

runPlot();
