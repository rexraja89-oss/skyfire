'use strict';
// ============ MEGA-BOSS FLIGHT MOTION (prototype, not loaded by the game) ============
// Makes the boss read as a 3D ship from the top-down camera: instead of sliding flat, it banks into every sideways
// move (shows the white sides and the depth of the wings), yaws a little toward where it is going, dips its nose,
// hovers, and every `turn.every` seconds swings through a slow wide banking turn that shows its profile.
// pose(t) returns an offset from the boss's home position plus rotations (radians); apply(obj, t, home) sets them.
// Game frame: +X screen right, +Z nose / screen down, +Y up. Rotation order YXZ = yaw, then pitch, then roll about
// the ship's own nose axis. Roll < 0 dips the +X wing (screen right).
// Logic stays 2D: the game would still steer the boss's x; only the 3D model's angles come from here.
const BOSS_MOTION={
 strafe:{amp:6,speed:.32},          // side-to-side sweep (world units, cycles per ~20 s)
 bank:{k:.11,max:.5,lag:.35},       // roll per unit/s of sideways speed, max roll (~29 deg), smoothing (s)
 yaw:{k:.035,max:.16},              // turn toward the movement
 pitch:{amp:.06,speed:.21},         // slow nose dip toward the player
 hover:{amp:.35,speed:.5},
 turn:{every:11,len:3.2,roll:.62,yaw:.42,swing:3},  // showcase banking turn: duration, extra roll/yaw, sideways swing
 limit:{roll:.75,yaw:.5}            // never more than ~43 deg roll / ~29 deg yaw in total
};
const MegaBossMotion=(()=>{
 const sm=x=>x*x*(3-2*x),clamp=(x,a)=>Math.max(-a,Math.min(a,x));
 // sideways position: two slow sines, so the path never looks mechanical
 const xOf=(t,M)=>M.strafe.amp*(.75*Math.sin(t*M.strafe.speed*2)+.25*Math.sin(t*M.strafe.speed*4.7+1.3));
 // showcase turn: 0..1..0 bell over turn.len, alternating sides each time
 function turnOf(t,M){const T=M.turn,k=Math.floor(t/T.every),u=(t-k*T.every)/T.len;if(u<0||u>1)return {w:0,side:0};const w=Math.sin(Math.PI*sm(u));return {w,side:k%2?-1:1};}
 function pose(t,cfg){const M=cfg||BOSS_MOTION;
  // sideways speed averaged over the bank lag (a smoothed derivative) -> bank and yaw
  const vx=(xOf(t,M)-xOf(t-M.bank.lag,M))/M.bank.lag,tr=turnOf(t,M);
  const x=xOf(t,M)+tr.side*tr.w*M.turn.swing;
  const roll=clamp(-vx*M.bank.k,M.bank.max)-tr.side*tr.w*M.turn.roll;
  const yaw=clamp(vx*M.yaw.k,M.yaw.max)+tr.side*tr.w*M.turn.yaw;
  const pitch=M.pitch.amp*Math.sin(t*M.pitch.speed*6.2832)+.05*tr.w;
  const y=M.hover.amp*Math.sin(t*M.hover.speed*6.2832);
  return {x,y,z:0,yaw:clamp(yaw,M.limit.yaw),pitch,roll:clamp(roll,M.limit.roll)};}
 function apply(o,t,home={x:0,y:0,z:0},cfg){const p=pose(t,cfg);o.position.set(home.x+p.x,home.y+p.y,home.z+p.z);o.rotation.order='YXZ';o.rotation.set(p.pitch,p.yaw,p.roll);return p;}
 return {pose,apply,CFG:BOSS_MOTION};})();
