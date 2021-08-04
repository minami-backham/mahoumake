<template>
  <div id="frame" class="source">
    <div class="videoFrame">
      <video id="srcVideo" class="video" playsinline muted autoplay />
    </div>
    <div class="canvasFrame">
      <canvas id="video_shadow" class="video_shadow"></canvas>
    </div>
    <div id="overlay" class="overLay"></div>
  </div>
</template>

<script>
// import * as facemesh from "@tensorflow-models/facemesh";
import { videoStream } from "../components/video/videoStream.js";
import { facemesh3d } from "../components/tensorflow/Facemesh.js";

export default {
  async mounted() {
    //ここからビデオの映像を取得
    videoStream({
      frameId: "frame",
      videoId: "srcVideo",
      canvasId: "video_shadow",
      detectScale: 1,
      //カメラ起動完了でコール
      readyCallback: async (video_info) => {
        console.log("video_info", video_info);
        //3Dシーンを初期化

        //顔の検出情報を取得
        facemesh3d({
          ref: "srcVideo",
          fps: 20,
          callback: (landmarks) => {
            //手のモデル表示
            //配列で渡してるが実際にはmediapipeは１つだけしか返していない
            for (let i = 0; i < landmarks.length; i++) {
              //検出情報を3Dに渡す
              console.log(landmarks);
            }
          }
        });
      }
    });
  },
  methods: {}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss"></style>
