<template>
  <div id="app">
    <VideoSrc />
  </div>
</template>

<script>
import VideoSrc from "./page/VideoSrc.vue";

export default {
  name: "App",
  components: {
    VideoSrc
  }
};
</script>

<style lang="scss">
@import "../node_modules/ress/dist/ress.min.css";

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
