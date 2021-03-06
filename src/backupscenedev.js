import G from './gl';
const glslify = require('glslify');
import deviceType from 'ua-device-type';
window.ddevice = deviceType(navigator.userAgent);

import OrbitalCameraControl from 'orbital-camera-control';
import Query from './dev/Query';
import SuperConfig from './dev/SuperConfig';

import Screenshot from './dev/Screenshot';
import PingPong from './gl/utils/PingPong';
import { mat4, mat3 } from 'gl-matrix';


if(Query.verbose) {
  G.debug.verbose = true;
}

export default class Scene {
  constructor() {
    window.scene = this;
    this.webgl = new G.Webgl();
    this.time = 0
    this.bgC = '#000000';
    this.webgl.clearColor(this.bgC, 1);
    this.webgl.append();
    this.mouse = {
      x:0,
      y:0,
    }
    window.addEventListener('mousemove', (e)=> {
      this.mouse.x = ((e.clientX/ window.innerWidth) - 0.5 )* 2;
      this.mouse.y = -((e.clientY/ window.innerWidth) - 0.5 )* 2;
      this.mouse.x *=10;
      // this.mouse.y *=10;

    });

    const t = new G.Texture(gl);

    this.camera = new G.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.camera.lookAt([0,0,100],[0,0,0])

    this.controls = new OrbitalCameraControl(this.camera.view, 10, window);



    if(Query.debug) {
      this.screenshot = new Screenshot(this);

    }
    // this.composer = new G.Composer(this.webgl, window.innerWidth, window.innerHeight);
    this.composer = new G.Composer(this.webgl, window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
    this.pass = new G.Pass(
      `
      precision mediump float;

      uniform sampler2D uTexture;
      varying vec2 vUv;

      void main() {
        vec4 base = texture2D(uTexture,vUv);
        gl_FragColor = vec4(base.rgb, 1.0);
        gl_FragColor.rgb = 1.0 - gl_FragColor.rgb;
      }
      `
    );
    this.pass2 = new G.Pass(
      `
      precision mediump float;

      uniform sampler2D uTexture;
      varying vec2 vUv;

      void main() {
        vec4 base = texture2D(uTexture,vUv);
        gl_FragColor = vec4(base.rgb, 1.0);
        gl_FragColor.rgb = gl_FragColor.rgb;
      }
      `
    );
    this.composer.add(this.pass);
    // this.composer.add(this.pass2);

    const primitive = G.Primitive.sphere();
    // console.log(primitive);

    // const width = 24;
    // const height = 24;
    // const offsets = new Float32Array(width * height * 4)
    // let count = 0;
    // for (var i = 0; i < width * height * 4; i+=4) {
    //   offsets[i] = Math.cos(r) *( Math.random() * (4 + 4) - 4)
    //   offsets[i + 1] = Math.sin(r) * (Math.random() * (4 + 4) - 4)
    //   offsets[i + 2] = Math.random() * (4 + 4) - 4
    //   offsets[i + 3] = Math.random();
    //   count ++;
    // }

    // const primitive = G.Primitive.cube(Query.config.size,Query.config.size,Query.config.size);
    const geo = new G.Geometry(primitive);
    const mat = new G.Shader(
    glslify('./shaders/base.vert'),
    glslify('./shaders/base.frag'),
    {})
    this.mesh = new G.Mesh(geo, mat);
    this.mesh2 = new G.Mesh(geo, mat);
    this.mesh2.scale.set(0.8)
    this.mesh3 = new G.Mesh(geo, mat);
    this.mesh3.scale.set(0.7)
    this.mesh4 = new G.Mesh(geo, mat);
    this.mesh4.scale.set(0.6)

    this.points = [];
    this.sticks = [];
    this.points.push({
      x:0,
      y:0,
      oldx:0,
      oldy:0,
      pinned:true
    })
    this.points.push({
      x:-1,
      y:0,
      oldx:-1,
      oldy:0,
    });
    this.points.push({
      x:-1,
      y:-1,
      oldx:-1,
      oldy:-1,
    })
    this.points.push({
      x:-1.5,
      y:-1.5,
      oldx:-1.5,
      oldy:-1.5,
    })
    this.sticks.push({
      p0: this.points[0],
      p1: this.points[1],
      length: this.distance(this.points[0], this.points[1])
    })
    this.sticks.push({
      p0: this.points[1],
      p1: this.points[2],
      length: this.distance(this.points[1], this.points[2])
    })
    this.sticks.push({
      p0: this.points[2],
      p1: this.points[3],
      length: this.distance(this.points[2], this.points[3])
    })
  }
  distance(a, b) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  updatePoints() {
    const friction = 0.999
    for (var i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if(!p.pinned) {
        let vx = (p.x - p.oldx) * friction;
        let vy = (p.y - p.oldy) * friction - 0.008;
        p.oldx = p.x;
        p.oldy = p.y;
        p.x+= vx;
        p.y+= vy;
      }

    }
  }
  updateStiks() {
    for (var i = 0; i < this.sticks.length; i++) {
      const s = this.sticks[i];
      let dx = s.p1.x - s.p0.x;
      let dy = s.p1.y - s.p0.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      let diff = s.length - distance;
      let percent = diff / distance /2;

      let offsetX = dx* percent;
      let offsetY = dy* percent;
      if(!s.p0.pinned) {
        s.p0.x -=offsetX;
        s.p0.y -=offsetY;

      }
      if(!s.p1.pinned) {
        s.p1.x +=offsetX;
        s.p1.y +=offsetY;
      }
    }
  }
  render() {
    this.time += 0.05;
    this.frame++;
    this.controls.update();
    this.updatePoints();
    this.updateStiks();
    this.webgl.clear();
    G.State.enable(gl.DEPTH_TEST);
    if(Query.config.postPro) {
      this.composer.render(this.mesh, this.camera);
      this.composer.toScreen();

    } else {
      this.webgl.render(this.mesh, this.camera);
    }
    // this.webgl.render(this.mesh, this.camera);
    // this.webgl.render(this.mesh2, this.camera);
    // this.webgl.render(this.mesh3, this.camera);
    // this.webgl.render(this.mesh4, this.camera);
//
    // this.points[0].x = Math.cos(this.time)
      // this.points[0].x = Math.cos(this.time) + this.mouse.x


      // this.points[0].y = Math.sin(this.time) - this.mouse.y
    // }
    this.mesh.position.x = this.points[0].x;
    this.mesh.position.y = this.points[0].y;

    this.mesh2.position.x = this.points[1].x;
    this.mesh2.position.y = this.points[1].y;

    this.mesh3.position.x = this.points[2].x;
    this.mesh3.position.y = this.points[2].y;

    this.mesh4.position.x = this.points[3].x;
    this.mesh4.position.y = this.points[3].y;
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.webgl.resize();
  }
}
