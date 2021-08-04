import * as facemesh from "@tensorflow-models/facemesh";
import { fpsWorker } from "../../util/fps";

/**
 * ハンドランドマークを取得
 * @param {*} param0
 */
export const facemesh3d = async ({ ref, fps, callback }) => {
  let model = await facemesh.load();
  const srcTarget = document.getElementById(ref);

  //fpsを設定して取得
  fpsWorker.setCallback(async () => {
    if (model && ref) {
      const predictions = await model.estimateFaces(srcTarget);
      if (predictions.length > 0) {
        callback(predictions);
      }
    }
  }, fps);
};
