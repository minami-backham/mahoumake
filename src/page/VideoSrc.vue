<template>
  <div id="frame" class="source">
    <div class="videoFrame">
      <video id="srcVideo" class="video" width="0" height="0" playsinline muted autoplay />
    </div>
    <div class="canvasFrame">
      <canvas id="video_shadow" class="video_shadow"></canvas>
    </div>
    <div id="overlay" class="overlay"></div>
  </div>
</template>

<script>
// import * as facemesh from "@tensorflow-models/facemesh";
import * as THREE from "three";
import { videoStream } from "../components/video/videoStream.js";
// import { facemesh3d } from "../components/tensorflow/Facemesh.js";

export default {
  data() {
    return {
      scene: null,
      renderer: null,
      camera: null,
      hemiLight: null,
      mesh: null
    };
  },
  created() {
    //sceneに
  },
  async mounted() {
    //ここからビデオの映像を取得
    videoStream({
      frameId: "frame",
      videoId: "srcVideo",
      canvasId: "video_shadow",
      detectScale: 1,
      //カメラ起動完了でコール
      readyCallback: async (video_info) => {
        //3Dシーンを初期化
        this.initThree({
          width: video_info.width,
          height: video_info.height,
          shiftleft: video_info.shiftleft,
          overflowRef: "overlay"
        });

        this.drawSquare();

        this.animate();
      }
    });
  },
  methods: {
    initThree({ width, height, shiftleft, overflowRef }) {
      const scene = new THREE.Scene({ alph: true });
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      document.getElementById(overflowRef).appendChild(renderer.domElement);

      const canvas3d = document.querySelector(`#${overflowRef} canvas`);
      canvas3d.style.position = `absolute`;
      canvas3d.style.left = `${shiftleft}px`;

      const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -100, 100);
      camera.position.set(0, 0, 50);
      camera.lookAt(0, 0, 0);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
      hemiLight.position.set(0, 100, 0);

      const axesHelper = new THREE.AxesHelper(500);

      this.scene = scene;
      this.renderer = renderer;
      this.camera = camera;
      this.hemiLight = hemiLight;

      this.scene.add(this.camera);
      this.scene.add(this.hemiLight);
      this.scene.add(axesHelper);
    },
    drawSquare() {
      const vs = `
        //受け渡し変数の宣言
        varying vec2 vUv;
        void main()	{
          //テクスチャ座標を受け渡す
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `;

      const fs = `
        uniform sampler2D videoTexture;
        uniform sampler2D cheekTexture;
        uniform sampler2D eyeshadowTexture1;
        uniform sampler2D eyeshadowTexture5;
        uniform vec3 col1;
        uniform vec3 col2;
        uniform vec3 col3;

        varying vec2 vUv;
        void main()	{
          vec4 video = texture2D(videoTexture, vUv);
          vec4 t1 = texture2D(cheekTexture, vUv);
          vec4 t2 = texture2D(eyeshadowTexture1, vUv);
          vec4 t3 = texture2D(eyeshadowTexture5, vUv);

          t1 = vec4(col1, t1.a);
          t2 = vec4(col2, t2.a);
          t3 = vec4(col3, t3.a);

          // dst: t2, src: t3 とする

          //通常合成
          vec3 c = t3.rgb * t3.a + t2.a * (1.0 - t3.a) * t2.rgb + video.rgb;
          float a = t2.a * t3.a + t2.a * (1.0 - t3.a) + (1.0 - t2.a) * t3.a;

          //加算 add
          // vec3 c = vec3(
          //   min(1.0, t3.r + t2.r) * t2.a * t3.a + t2.a * (1.0 - t3.a) * t2.r + (1.0 - t2.a) * t3.a * t3.r,
          //   min(1.0, t3.g + t2.g) * t2.a * t3.a + t2.a * (1.0 - t3.a) * t2.g + (1.0 - t2.a) * t3.a * t3.g,
          //   min(1.0, t3.b + t2.b) * t2.a * t3.a + t2.a * (1.0 - t3.a) * t2.b + (1.0 - t2.a) * t3.a * t3.b
          // );
          // float a = t2.a * t3.a + t2.a * (1.0 - t3.a) + (1.0 - t2.a) * t3.a;

          //減算 subtract
          // vec3 c = (t3.rgb - t2.rgb) * t2.a * t3.a + t2.a * (1.0 - t3.a) * t2.rgb + (1.0 - t2.a) * t3.a * t3.rgb;
          // float a = t2.a * t3.a + t2.a * (1.0 - t3.a) + (1.0 - t2.a) * t3.a;

          //乗算 multiply
          // vec3 c = (t3.rgb * t2.rgb) * t2.a * t3.a + t2.a * (1.0 - t3.a) * t2.rgb + (1.0 - t2.a) * t3.a * t3.rgb;
          // float a = t2.a * t3.a + t2.a * (1.0 - t3.a) + (1.0 - t2.a) * t3.a;

          //darken
          // vec3 c = t2.a * (1.0 - t3.a) * t2.rgb + t3.a * (min(t3.rgb, t2.rgb) * t2.a + (1.0 - t2.a) * t3.rgb);
          // float a = t2.a * (1.0 - t3.a) + t3.a;

          //lighten
          // vec3 c = t2.a * (1.0 - t3.a) * t2.rgb + t3.a * (max(t3.rgb, t2.rgb) * t2.a + (1.0 - t2.a) * t3.rgb);
          // float a = t2.a * (1.0 - t3.a) + t3.a;

          //screen
          // vec3 c = t2.a * (1.0 - t3.a) * t2.rgb + t3.a * (((t3.rgb + t2.rgb) - (t3.rgb * t2.rgb)) * t2.a + (1.0 - t2.a) * t3.rgb);
          // float a = t2.a * (1.0 - t3.a) + t3.a;

          //overlay
          // vec3 c = vec3(
          // ((t2.r <= 0.5) ? (2.0 * t3.r * t2.r) : (1.0 - 2.0 * (1.0 - t2.r) * (1.0 - t3.r))) * t2.a + (1.0 - t2.a) * t3.r,
          // ((t2.g <= 0.5) ? (2.0 * t3.g * t2.g) : (1.0 - 2.0 * (1.0 - t2.g) * (1.0 - t3.g))) * t2.a + (1.0 - t2.a) * t3.g,
          // ((t2.b <= 0.5) ? (2.0 * t3.b * t2.b) : (1.0 - 2.0 * (1.0 - t2.b) * (1.0 - t3.b))) * t2.a + (1.0 - t2.a) * t3.b
          // );

          gl_FragColor = vec4(c, a);
          // gl_FragColor = vec4(t3.rgb, t3.a);
        }
        `;

      const geometry = new THREE.BufferGeometry();

      /* eslint-disable */
      // prettier-ignore
      const vertices = new Float32Array([
        -300.0, -300.0, 0.0,
         300.0, -300.0, 0.0,
         300.0,  300.0, 0.0,

         300.0,  300.0,  0.0,
	      -300.0,  300.0,  0.0,
	      -300.0, -300.0,  0.0
      ]);

      //prettier-ignore
      const normals = new Float32Array([
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0]);

      // prettier-ignore
      const uvs = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0]);

      /* eslint-enable */

      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      // const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xff00ff });

      const video = document.getElementById("srcVideo");
      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.generateMipmaps = false;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.maxFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;

      //テクスチャ
      const loader = new THREE.TextureLoader();

      let cheekTexture = loader.load("http://localhost:8080/textures/base-cheeks.png");
      cheekTexture.minFilter = THREE.LinearFilter;
      cheekTexture.magFilter = THREE.LinearFilter;

      let eyeshadowTexture1 = loader.load("http://localhost:8080/textures/base-eyeshadow1.png");
      eyeshadowTexture1.minFilter = THREE.LinearFilter;
      eyeshadowTexture1.magFilter = THREE.LinearFilter;

      let eyeshadowTexture5 = loader.load("http://localhost:8080/textures/base-eyeshadow5.png");
      eyeshadowTexture5.minFilter = THREE.LinearFilter;
      eyeshadowTexture5.magFilter = THREE.LinearFilter;

      //ユニフォーム
      let uniforms = {
        videoTexture: { type: "t", value: videoTexture },
        cheekTexture: { type: "t", value: cheekTexture },
        eyeshadowTexture1: { type: "t", value: eyeshadowTexture1 },
        eyeshadowTexture5: { type: "t", value: eyeshadowTexture5 },
        col1: { type: "c", value: new THREE.Color("rgb(100%, 0%, 0%)") },
        col2: { type: "c", value: new THREE.Color("rgb(0%, 100%, 0%)") },
        col3: { type: "c", value: new THREE.Color("rgb(0%, 0%, 100%)") }
      };

      //マテリアル
      const material = new THREE.ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        blending: THREE.AdditiveBlending,
        uniforms: uniforms,
        depthWrite: true,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide
        // wireframe: true
      });
      const mesh = new THREE.Mesh(geometry, material);

      this.mesh = mesh;

      this.scene.add(mesh);
    },
    updateSquare() {
      // const positions = this.mesh.geometry.attributes.position.array;
      // this.mesh.geometry.attributes.position.needsUpdate = true;
    },
    animate() {
      requestAnimationFrame(this.animate);
      this.renderer.render(this.scene, this.camera);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.source {
  position: relative;
}

// .videoFrame {
//   display: none;
// }

.overlay {
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: lightgrey;
}
</style>
