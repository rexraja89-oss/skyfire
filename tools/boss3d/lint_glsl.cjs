// GLSL lint for the boss shaders: smoothstep(edge0, edge1, x) is undefined in GLSL when edge0 >= edge1, so reject any
// call whose edges are numeric literals, or the same expression plus/minus literals, in the wrong order.
// Run: node lint_glsl.cjs [files...]   (exit 1 on any violation)
'use strict';
const fs=require('fs');
const files=process.argv.slice(2).length?process.argv.slice(2):['viewer/megaboss_fx.js','viewer/index.html','lab/lab.html'];
const lit=s=>{s=s.trim().replace(/^\(|\)$/g,'');const v=Number(s.replace(/(\d)\.(?!\d)/g,'$1.0').replace(/^\./,'0.').replace(/^-\./,'-0.'));return Number.isFinite(v)&&/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s.trim())?v:null;};
const split=s=>{const m=s.trim().match(/^(.*?)([+-])\s*(\d*\.?\d+)\s*$/);return m&&/\w/.test(m[1])?{base:m[1].trim(),k:(m[2]==='-'?-1:1)*Number(m[3])}:{base:s.trim(),k:0};};
let bad=0,count=0;
for(const f of files){const src=fs.readFileSync(f,'utf8');const re=/smoothstep\s*\(([^,()]+(?:\([^()]*\))?[^,()]*),([^,()]+(?:\([^()]*\))?[^,()]*),/g;let m;
  while((m=re.exec(src))){count++;const a=m[1],b=m[2];let wrong=false;const la=lit(a),lb=lit(b);
    if(la!==null&&lb!==null)wrong=la>=lb;else{const A=split(a),B=split(b);if(A.base===B.base)wrong=A.k>=B.k;}
    if(wrong){bad++;const line=src.slice(0,m.index).split('\n').length;console.log(`FAIL ${f}:${line} smoothstep(${a.trim()},${b.trim()},…) has edge0 >= edge1`);}}}
console.log(`lint_glsl: ${count} smoothstep calls checked, ${bad} reversed`);process.exit(bad?1:0);
