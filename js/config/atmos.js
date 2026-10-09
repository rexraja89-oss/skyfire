'use strict';
// ============ ATMOSPHERE (per biome) ============
// Drawn on the 2D overlay by js/engine/atmos.js. All optional; leave a layer out to switch it off.
//  grade:  [top colour, bottom colour, strength]  soft-light colour grade over the whole frame (the stage's mood)
//  shadows:{n, a, size}       drifting cloud shadows on the ground (n blobs, darkness a, radius in logic px)
//  over:   {n, a, c, size, flat, speed}  clouds/mist passing OVER the action (screen space, faster than the ground)
//  rays:   {n, c, a}          slow sun shafts from the upper left
//  search: {n, c, a, len}     sweeping searchlight / alarm-light cones from points on the ground
//  aurora: {a}                northern-lights ribbons across the top of the sky
//  glints: {n}                sun glints sparkling on water
SF.ATMOS={
 harbor:{grade:['#ffb27a','#6a5cff',.16],shadows:{n:3,a:.2,size:150},over:{n:2,a:.16,c:'#fff1e4',size:170,flat:.45,speed:1.6},rays:{n:3,c:'#ffd7a0',a:.09},glints:{n:5}},
 farm:{grade:['#ffcf80','#c07a30',.14],shadows:{n:4,a:.26,size:170},over:{n:1,a:.14,c:'#ffffff',size:200,flat:.6,speed:2}},
 desert:{grade:['#ffd9a0','#b85a20',.12],shadows:{n:2,a:.16,size:180}},
 forest:{grade:['#c8ffe8','#18403a',.16],shadows:{n:3,a:.22,size:150},over:{n:3,a:.24,c:'#eef6f2',size:170,flat:.4,speed:1.4},rays:{n:4,c:'#fff2c8',a:.1}},
 port:{grade:['#a8c0d0','#283840',.18],shadows:{n:3,a:.24,size:190},over:{n:2,a:.2,c:'#c8d0d8',size:200,flat:.5,speed:2.2}},
 islands:{grade:['#a0fff0','#1060a0',.12],shadows:{n:3,a:.2,size:150},over:{n:2,a:.16,c:'#ffffff',size:170,flat:.6,speed:1.8},glints:{n:9}},
 canyon:{grade:['#ffb070','#701808',.18],shadows:{n:2,a:.2,size:170},rays:{n:4,c:'#ffcf90',a:.11},over:{n:1,a:.14,c:'#f0c8a0',size:190,flat:.35,speed:1.5}},
 arctic:{grade:['#e0f0ff','#5070c0',.16],shadows:{n:2,a:.14,size:170},over:{n:3,a:.26,c:'#f4f8ff',size:180,flat:.5,speed:2.6},aurora:{a:.3}},
 city:{grade:['#a01890','#005a90',.07],over:{n:2,a:.18,c:'#7080b0',size:190,flat:.5,speed:2},search:{n:4,c:'#cfe8ff',a:.16,len:380}},
 volcano:{grade:['#ff6020','#200000',.2],over:{n:2,a:.22,c:'#3a2622',size:200,flat:.5,speed:1.7},search:{n:3,c:'#ff3a20',a:.14,len:300}},
};
