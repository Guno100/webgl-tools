import Debug from '../utils/Debug';
import Texture from './Texture';
export default class FBO {
  constructor(gl, width, height, options = {}) {
    Debug.info(`FBO created width: ${width} height: ${height}`);

    this.gl = gl;
    this.width = width;
    this.height = height;
    this.fbo = gl.createFramebuffer();

    this.colors = new Texture(gl);
    this.colors.format = gl.RGBA;
    this.colors.minFilter = gl.NEAREST;
    this.colors.magFilter = gl.NEAREST;
    this.colors.wrapT = gl.CLAMP_TO_EDGE;
    this.colors.wrapS = gl.CLAMP_TO_EDGE;
    var ext = this.gl.getExtension("OES_texture_float");
    this.colors.type = this.gl.FLOAT;
    this.colors.uploadData(null, width, height);

    if(options.depth) {
      Debug.info('Use depth texture');

      var depthTextureExt = this.gl.getExtension("WEBGL_depth_texture");

      //
      // this.renderBuffer = gl.createRenderbuffer();
      this.depth = new Texture(gl, width, height, gl.UNSIGNED_SHORT,gl.DEPTH_COMPONENT);
      this.depth.minFilter = gl.NEAREST;
      this.depth.magFilter = gl.NEAREST;
      this.depth.wrapT = gl.CLAMP_TO_EDGE;
      this.depth.wrapS = gl.CLAMP_TO_EDGE;
      this.depth.type = gl.UNSIGNED_SHORT;
      this.depth.format = gl.DEPTH_COMPONENT;


      this.depth.uploadData(null, width, height,true);


    }


    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.colors.id, 0);
    if(options.depth)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.depth.id, 0);

    this.setSize(width, height);


    this.unbind();

  }
  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.viewport(0, 0, this.width, this.height );

  }
  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


  }
  unbind() {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height );
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    this.colors.unbind();


  }
  setSize(width, height) {
    this.bind();
    this.fbo.width = width;
    this.fbo.height = height;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}
