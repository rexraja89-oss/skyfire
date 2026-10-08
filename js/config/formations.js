'use strict';
// ============ FORMATIONS ============
// New formations are made here from data: no engine code needed.
//
// PATHS: waypoints [x, y] where x is a fraction of the screen width (0 = left edge, 1 = right edge; <0 / >1 is
// off-screen) and y is a fraction of the visible screen height (0 = top, 1 = bottom; negative = above the top).
// The path is smoothed through the points. 'then' says what a member does when the path ends:
//   exit (keep flying straight off-screen) | dive | hover | kamikaze
SF.PATHS={
 dropCenter:{pts:[[.5,-.12],[.5,.3]],then:'dive'},
 dropHover: {pts:[[.5,-.12],[.5,.22]],then:'hover'},
 arcLR:     {pts:[[-.12,.06],[.25,.28],[.6,.36],[.9,.22],[1.15,.05]]},
 swoopL:    {pts:[[-.12,.1],[.3,.22],[.5,.42],[.45,.62],[.2,.8],[-.15,.9]]},
 snake:     {pts:[[.2,-.12],[.25,.15],[.75,.25],[.8,.42],[.25,.5],[.2,.68],[.7,.8],[.75,1.15]]},
 diagLR:    {pts:[[-.12,.05],[.5,.35],[1.15,.7]]},
 convergeL: {pts:[[-.12,.25],[.3,.3],[.46,.18],[.5,-.15]]},
 sideStrafe:{pts:[[-.12,.18],[1.15,.24]]},
 loopL:     {pts:[[.15,-.12],[.2,.25],[.45,.45],[.7,.3],[.55,.12],[.35,.25],[.4,.6],[.45,1.15]]},
 fallStraight:{pts:[[.5,-.12],[.5,1.15]]},
};
// SHAPES: slot offsets in units of 'spacing' (x right, y down). Index 0 is the leader slot.
SF.SHAPES={
 v:      [[0,0],[-1,-.8],[1,-.8],[-2,-1.6],[2,-1.6],[-3,-2.4],[3,-2.4]],
 line:   [[0,0],[-1,0],[1,0],[-2,0],[2,0],[-3,0],[3,0]],
 column: [[0,0],[0,-1],[0,-2],[0,-3],[0,-4],[0,-5]],
 stagger:[[0,0],[-1,-.7],[1,-.7],[-2,0],[2,0],[-3,-.7],[3,-.7]],
 wedge:  [[0,0],[-.8,-.8],[.8,-.8],[0,-1.6],[-1.6,-1.6],[1.6,-1.6]],
 box:    [[-.5,0],[.5,0],[-.5,-1],[.5,-1]],
 ring:   [[1,0],[.5,.87],[-.5,.87],[-1,0],[-.5,-.87],[.5,-.87]],
};
// FORMATIONS: one or more groups. Group fields:
//  enemy     enemy type (or set by whoever spawns the formation); enemies:[...] gives one type per slot
//  shape     rigid formation that moves as a block along 'path' (uses SHAPES + spacing)
//  stream    members fly the same path one after another, 'gap' seconds apart
//  count, spacing, speed (px/s), path, mirror (flip left/right), delay (s), x (shift whole path, -0.5..0.5)
//  spin      rigid shapes only: rotation speed (rad/s) around the formation centre
//  hold      seconds to hover when the path ends with 'hover'
// A formation pays a bonus when every member is destroyed (none escaped).
SF.FORMATIONS={
 vDrop:     {name:'V formation',groups:[{shape:'v',count:5,spacing:30,path:'dropCenter',speed:150}]},
 vDropWide: {name:'Wide V',groups:[{shape:'v',count:7,spacing:30,path:'dropCenter',speed:140}]},
 lineHover: {name:'Line',groups:[{shape:'line',count:5,spacing:48,path:'dropHover',speed:160,hold:4}]},
 stagger:   {name:'Staggered wall',groups:[{shape:'stagger',count:7,spacing:44,path:'dropHover',speed:150,hold:3.5}]},
 column:    {name:'Column',groups:[{shape:'column',count:5,spacing:34,path:'fallStraight',speed:200,x:-.25},{shape:'column',count:5,spacing:34,path:'fallStraight',speed:200,x:.25,delay:.6}]},
 snake:     {name:'Snake',groups:[{stream:true,count:7,gap:.22,path:'snake',speed:240}]},
 pincer:    {name:'Pincer',groups:[{stream:true,count:4,gap:.25,path:'arcLR',speed:230},{stream:true,count:4,gap:.25,path:'arcLR',speed:230,mirror:true}]},
 crossing:  {name:'Crossfire',groups:[{stream:true,count:5,gap:.2,path:'diagLR',speed:250},{stream:true,count:5,gap:.2,path:'diagLR',speed:250,mirror:true,delay:.5}]},
 converge:  {name:'Converge',groups:[{stream:true,count:4,gap:.22,path:'convergeL',speed:220},{stream:true,count:4,gap:.22,path:'convergeL',speed:220,mirror:true}]},
 swoop:     {name:'Swoop',groups:[{stream:true,count:6,gap:.2,path:'swoopL',speed:260}]},
 loop:      {name:'Loop',groups:[{stream:true,count:6,gap:.24,path:'loopL',speed:230}]},
 strafeRun: {name:'Strafing run',groups:[{shape:'column',count:4,spacing:40,path:'sideStrafe',speed:150},{shape:'column',count:4,spacing:40,path:'sideStrafe',speed:150,mirror:true,delay:2.2,x:0}]},
 ringSpin:  {name:'Halo',groups:[{shape:'ring',count:6,spacing:52,path:'dropHover',speed:140,spin:1.1,hold:5}]},
 wedgeLeader:{name:'Strike wing',groups:[{shape:'wedge',count:6,spacing:32,path:'dropCenter',speed:140,enemies:['wingleader','dart','dart','dart','dart','dart']}]},
 boxEscort: {name:'Escort box',groups:[{shape:'box',count:4,spacing:56,path:'dropHover',speed:120,hold:6,enemies:['gunboat','gunboat','swift','swift']}]},
 mixedRaid: {name:'Mixed raid',groups:[{shape:'v',count:5,spacing:30,path:'dropCenter',speed:150,enemy:'dart'},{stream:true,count:4,gap:.3,path:'arcLR',speed:230,enemy:'swift',delay:1.2},{stream:true,count:4,gap:.3,path:'arcLR',speed:230,enemy:'swift',mirror:true,delay:1.2}]},
};
