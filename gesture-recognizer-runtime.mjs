import {
  FilesetResolver,
  GestureRecognizer
} from "./node_modules/@mediapipe/tasks-vision/vision_bundle.mjs";

const TARGET_GESTURES = new Set(["Open_Palm", "Closed_Fist"]);
const SCORE_THRESHOLDS = Object.freeze({ Open_Palm: 0.62, Closed_Fist: 0.65 });
const STABLE_MATCHES = Object.freeze({ Open_Palm: 3, Closed_Fist: 3 });
const FINGER_CHAINS = Object.freeze([
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20]
]);

function distance(a, b) {
  return Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0), (a?.z || 0) - (b?.z || 0));
}

function angleAt(a, pivot, c) {
  const ax = (a?.x || 0) - (pivot?.x || 0);
  const ay = (a?.y || 0) - (pivot?.y || 0);
  const az = (a?.z || 0) - (pivot?.z || 0);
  const cx = (c?.x || 0) - (pivot?.x || 0);
  const cy = (c?.y || 0) - (pivot?.y || 0);
  const cz = (c?.z || 0) - (pivot?.z || 0);
  const magnitude = Math.hypot(ax, ay, az) * Math.hypot(cx, cy, cz);
  if (magnitude < 1e-6) return 0;
  const cosine = Math.max(-1, Math.min(1, (ax * cx + ay * cy + az * cz) / magnitude));
  return Math.acos(cosine) * 180 / Math.PI;
}

function averagePoint(points) {
  const count = Math.max(1, points.length);
  return points.reduce((total, point) => ({
    x: total.x + (point?.x || 0) / count,
    y: total.y + (point?.y || 0) / count,
    z: total.z + (point?.z || 0) / count
  }), { x: 0, y: 0, z: 0 });
}

export function classifyLandmarkPose(landmarks = []) {
  if (landmarks.length < 21) return { label: "None", confidence: 0, extendedCount: 0, foldedCount: 0 };
  const wrist = landmarks[0];
  const palmPoints = [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
  const palmCenter = averagePoint(palmPoints);
  const palmScale = Math.max(distance(wrist, landmarks[9]), distance(landmarks[5], landmarks[17]));
  if (palmScale < 0.035) return { label: "None", confidence: 0, extendedCount: 0, foldedCount: 0 };

  const fingers = FINGER_CHAINS.map(([mcpIndex, pipIndex, dipIndex, tipIndex]) => {
    const mcp = landmarks[mcpIndex];
    const pip = landmarks[pipIndex];
    const dip = landmarks[dipIndex];
    const tip = landmarks[tipIndex];
    const pipAngle = angleAt(mcp, pip, tip);
    const dipAngle = angleAt(pip, dip, tip);
    const tipToWrist = distance(tip, wrist);
    const pipToWrist = distance(pip, wrist);
    const tipToMcp = distance(tip, mcp);
    const pipToMcp = distance(pip, mcp);
    const tipToPalm = distance(tip, palmCenter);
    const extended = pipAngle >= 145 && dipAngle >= 140 && tipToWrist >= pipToWrist * 1.05 && tipToMcp >= pipToMcp * 1.12;
    const folded = (pipAngle <= 132 || dipAngle <= 128 || tipToWrist <= pipToWrist * 0.98)
      && tipToPalm <= palmScale * 1.45;
    return { extended, folded, pipAngle, dipAngle };
  });

  const extendedCount = fingers.filter(finger => finger.extended).length;
  const foldedCount = fingers.filter(finger => finger.folded).length;
  if (extendedCount >= 3 && foldedCount <= 1) {
    return { label: "Open_Palm", confidence: Math.min(1, 0.55 + extendedCount * 0.11), extendedCount, foldedCount };
  }
  if (foldedCount >= 3 && extendedCount <= 1) {
    return { label: "Closed_Fist", confidence: Math.min(1, 0.55 + foldedCount * 0.11), extendedCount, foldedCount };
  }
  return { label: "None", confidence: 0, extendedCount, foldedCount };
}

export function looksLikeOpenPalm(landmarks = []) {
  return classifyLandmarkPose(landmarks).label === "Open_Palm";
}

export function looksLikeClosedFist(landmarks = []) {
  return classifyLandmarkPose(landmarks).label === "Closed_Fist";
}

export class LocalGestureRecognizerRuntime {
  constructor({
    scoreThreshold = 0.65,
    sampleIntervalMs = 80,
    stableWindowMatches = 3
  } = {}) {
    this.scoreThreshold = scoreThreshold;
    this.sampleIntervalMs = sampleIntervalMs;
    this.stableWindowMatches = stableWindowMatches;
    this.recognizer = null;
    this.video = null;
    this.onFrame = null;
    this.running = false;
    this.rafId = 0;
    this.lastInferenceAt = 0;
    this.lastVideoTime = -1;
    this.poseRunLabel = "None";
    this.poseRunCount = 0;
    this.confirmedLabel = "None";
  }

  async load() {
    if (this.recognizer) return;
    const wasmRoot = new URL("./node_modules/@mediapipe/tasks-vision/wasm", import.meta.url).href;
    const modelPath = new URL("./assets/models/gesture_recognizer.task", import.meta.url).href;
    const vision = await FilesetResolver.forVisionTasks(wasmRoot);
    this.recognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: { modelAssetPath: modelPath },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      cannedGesturesClassifierOptions: {
        scoreThreshold: 0.35,
        categoryAllowlist: ["None", "Open_Palm", "Closed_Fist"]
      }
    });
  }

  start(video, onFrame) {
    if (!this.recognizer) throw new Error("gesture_recognizer_not_loaded");
    this.stop();
    this.video = video;
    this.onFrame = onFrame;
    this.running = true;
    this.lastInferenceAt = 0;
    this.lastVideoTime = -1;
    this.resetStabilizer();
    this.rafId = requestAnimationFrame(now => this.loop(now));
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.video = null;
    this.onFrame = null;
    this.resetStabilizer();
  }

  close() {
    this.stop();
    this.recognizer?.close?.();
    this.recognizer = null;
  }

  resetStabilizer() {
    this.poseRunLabel = "None";
    this.poseRunCount = 0;
    this.confirmedLabel = "None";
  }

  loop(now) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(next => this.loop(next));
    const video = this.video;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (now - this.lastInferenceAt < this.sampleIntervalMs || video.currentTime === this.lastVideoTime) return;
    this.lastInferenceAt = now;
    this.lastVideoTime = video.currentTime;

    try {
      const result = this.recognizer.recognizeForVideo(video, now);
      this.consumeResult(result, now);
    } catch (error) {
      this.onFrame?.({ type: "error", error, handPresent: false });
    }
  }

  consumeResult(result, now) {
    const handPresent = Boolean(result?.landmarks?.length);
    const landmarks = result?.landmarks?.[0] || [];
    const top = result?.gestures?.[0]?.[0];
    const score = Number(top?.score || 0);
    const rawLabel = String(top?.categoryName || "None");
    const modelThreshold = SCORE_THRESHOLDS[rawLabel] ?? this.scoreThreshold;
    const modelLabel = handPresent && score >= modelThreshold && TARGET_GESTURES.has(rawLabel) ? rawLabel : "None";
    const landmarkPose = handPresent ? classifyLandmarkPose(landmarks) : { label: "None", confidence: 0 };
    let label = "None";
    let labelSource = "none";
    if (landmarkPose.label !== "None" && modelLabel !== "None" && landmarkPose.label !== modelLabel) {
      label = "None";
      labelSource = "conflict";
    } else if (landmarkPose.label !== "None") {
      label = landmarkPose.label;
      labelSource = modelLabel === landmarkPose.label ? "model+landmarks" : "landmarks";
    } else if (modelLabel !== "None") {
      label = modelLabel;
      labelSource = "model";
    }

    if (label === "None") {
      this.poseRunLabel = "None";
      this.poseRunCount = 0;
    } else if (label === this.poseRunLabel) {
      this.poseRunCount += 1;
    } else {
      this.poseRunLabel = label;
      this.poseRunCount = 1;
    }
    const requiredMatches = STABLE_MATCHES[label] ?? this.stableWindowMatches;
    const stableLabel = label !== "None" && this.poseRunCount >= requiredMatches ? label : null;
    let stableGesture = null;
    if (stableLabel && stableLabel !== this.confirmedLabel) {
      stableGesture = label;
      this.confirmedLabel = stableLabel;
    } else if (label === "None" && this.confirmedLabel !== "None") {
      this.confirmedLabel = "None";
    }

    this.onFrame?.({
      type: "result",
      handPresent,
      rawLabel,
      label,
      labelSource,
      score,
      poseConfidence: landmarkPose.confidence,
      consecutiveFrames: this.poseRunCount,
      stableLabel,
      stableGesture,
      landmarks
    });
  }
}

export const RECOGNIZER_INFO = Object.freeze({
  name: "mediapipe_gesture_recognizer",
  version: "1.1.0",
  model: "gesture_recognizer.task",
  scoreThresholds: SCORE_THRESHOLDS,
  stableWindow: "Open_Palm 3 consecutive · Closed_Fist 3 consecutive"
});
