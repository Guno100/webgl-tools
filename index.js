import createWebgl from './tools/core/webgl';
import Program from './tools/core/program';
import Debug from './tools/utils/Debug';
import ArrayBuffer from './tools/core/ArrayBuffer';
import IndexBuffer from './tools/core/IndexBuffer';
import PerspectiveCamera from './tools/camera/PerspectiveCamera';
import Object3D from './tools/core/Object3D';
import Loader from './tools/Loader';
import ArrayUtils from './tools/utils/ArrayUtils';
import raf from 'raf';
import glm from 'gl-matrix';
import Sphere from 'primitive-sphere';
import gsap from 'gsap/TweenLite';
import OrbitalCameraControl from 'orbital-camera-control';
const glslify = require('glslify');
import gradients from './gradients';

Debug.verbose = true;
window.addEventListener('resize', onResize)

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : null;
}

const webgl = new createWebgl({
  width: window.innerWidth,
  height: window.innerHeight,
  contextOptions:  {
    premultipliedAlpha: false,
  }
});

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const controls = new OrbitalCameraControl(camera.view, 5, window)

const gl = window.gl = webgl.context;

webgl.append();

const program = new Program({
  context: gl,
  vertexShader: glslify('./shader/basic.vert'),
  fragmentShader: glslify('./shader/basic.frag'),
  name: 'Basic',
});

const sphere = new Object3D();

const primitive = new Sphere(1, {
  segments: 48
});

const uvs = new ArrayBuffer({
  context: gl,
  data: ArrayUtils.flatten(primitive.uvs),
});
uvs.attribPointer(program.attributes.aUv);

const normals = new ArrayBuffer({
  context: gl,
  data: ArrayUtils.flatten(primitive.normals),
});
normals.attribPointer(program.attributes.aNormal);


const positions = new ArrayBuffer({
  context: gl,
  data: ArrayUtils.flatten(primitive.positions),
});
positions.attribPointer(program.attributes.aPosition);
let colors = [];
let _sheme =  gradients[Math.floor(Math.random() * gradients.length)];
for (var i = 0; i < primitive.positions.length; i++) {
  if(i%2 === 0) {
    // _sheme =  gradients[Math.floor(Math.random() * gradients.length)];

    colors.push(hexToRgb(_sheme.colors[0]));

  } else {
    colors.push(hexToRgb(_sheme.colors[1]));

  }
  // console.log(primitive.positions[i]);
  // let sheme = gradients[Math.floor(Math.random() * gradients.length)];
  // colors.push(hexToRgb(_sheme.colors[1]));
}


const colorsA = new ArrayBuffer({
  context: gl,
  data: ArrayUtils.flatten(colors),
});
colorsA.attribPointer(program.attributes.aColor);

const indices = new IndexBuffer({
  context: gl,
  data:  ArrayUtils.flatten(primitive.cells),
});

let p = document.createElement('p');
document.body.appendChild(p);
indices.bind();
program.bind();
let sheme = gradients[Math.floor(Math.random() * gradients.length)];
p.innerHTML = sheme.name;
p.style.color = sheme.colors[1];
p.style.background = `-webkit-linear-gradient(${sheme.colors[1]},${sheme.colors[0]})`;
p.style.webkitBackgroundClip = 'text';

let color0 = hexToRgb(sheme.colors[0]);
webgl.clearColor(color0[0]+0.01,color0[1]+0.01,color0[2]+0.01,1)
program.uniforms.color0 = color0;
program.uniforms.color1 = hexToRgb(sheme.colors[1]);

let time = 0;
render();

function render() {
  raf(render);
  controls.update();
  gl.enable(gl.DEPTH_TEST);
  webgl.clear();
  program.bind();
  sphere.ry += 0.001;
  time += 0.0025;

  program.uniforms.time = time;
  program.uniforms.viewMatrix = camera.view;
  program.uniforms.projectionMatrix = camera.projection;
  program.uniforms.worldMatrix = sphere.matrix;
  indices.draw(gl.TRIANGLES);
}

function onResize() {
  webgl.resize();
  camera.aspect = window.innerWidth/ window.innerHeight;
  program.uniforms.projectionMatrix = camera.projection;

}
