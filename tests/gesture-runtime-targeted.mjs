import assert from "node:assert/strict";
import {
  LocalGestureRecognizerRuntime,
  classifyLandmarkPose,
  looksLikeClosedFist,
  looksLikeOpenPalm,
  RECOGNIZER_INFO
} from "../gesture-recognizer-runtime.mjs";

const points = values => values.map(([x, y]) => ({ x, y, z: 0 }));

const openPalm = points([
  [.50,.83],[.42,.72],[.36,.61],[.31,.50],[.27,.39],
  [.44,.55],[.42,.40],[.41,.27],[.40,.15],
  [.51,.53],[.51,.36],[.51,.22],[.51,.10],
  [.58,.56],[.61,.40],[.63,.28],[.64,.18],
  [.64,.62],[.70,.50],[.74,.42],[.77,.35]
]);

const closedFist = points([
  [.50,.84],[.43,.73],[.39,.65],[.43,.58],[.48,.60],
  [.42,.56],[.40,.44],[.45,.50],[.48,.58],
  [.50,.53],[.49,.40],[.52,.48],[.52,.57],
  [.58,.55],[.59,.43],[.57,.50],[.56,.59],
  [.65,.59],[.68,.50],[.64,.55],[.61,.63]
]);

function transformPose(landmarks, { scale = 1, rotation = 0, dx = 0, dy = 0 } = {}) {
  const center = { x: landmarks[9].x, y: landmarks[9].y };
  const cosine = Math.cos(rotation); const sine = Math.sin(rotation);
  return landmarks.map(point => {
    const x = (point.x - center.x) * scale; const y = (point.y - center.y) * scale;
    return { x: center.x + x * cosine - y * sine + dx, y: center.y + x * sine + y * cosine + dy, z: point.z * scale };
  });
}

const ambiguousHand = openPalm.map(point => ({ ...point }));
for (const index of [13, 14, 15, 16, 17, 18, 19, 20]) ambiguousHand[index] = { ...closedFist[index] };
const threeFingerPalm = openPalm.map(point => ({ ...point }));
for (const index of [17, 18, 19, 20]) threeFingerPalm[index] = { ...closedFist[index] };
const collapsedNoise = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

function consumeSequence(sequence) {
  const frames = [];
  const runtime = new LocalGestureRecognizerRuntime();
  runtime.onFrame = frame => frames.push(frame);
  sequence.forEach((frame, index) => {
    runtime.consumeResult({
      landmarks: frame.landmarks ? [frame.landmarks] : [],
      gestures: frame.landmarks ? [[{ categoryName: frame.categoryName, score: frame.score }]] : []
    }, 1000 + index * 80);
  });
  return frames;
}

const openPose = classifyLandmarkPose(openPalm);
const fistPose = classifyLandmarkPose(closedFist);
assert.equal(openPose.label, "Open_Palm");
assert.equal(openPose.extendedCount, 4);
assert.equal(fistPose.label, "Closed_Fist");
assert.equal(fistPose.foldedCount, 4);
assert.equal(classifyLandmarkPose(ambiguousHand).label, "None");
assert.equal(classifyLandmarkPose(threeFingerPalm).label, "Open_Palm");
assert.equal(classifyLandmarkPose(collapsedNoise).label, "None");
assert.equal(looksLikeOpenPalm(openPalm), true);
assert.equal(looksLikeClosedFist(closedFist), true);
for (const rotation of [-Math.PI / 2, Math.PI / 2, Math.PI]) {
  assert.equal(classifyLandmarkPose(transformPose(openPalm, { rotation })).label, "Open_Palm");
  assert.equal(classifyLandmarkPose(transformPose(closedFist, { rotation })).label, "Closed_Fist");
}
for (const scale of [0.25, 0.5, 1.5]) {
  assert.equal(classifyLandmarkPose(transformPose(openPalm, { scale, dx: 0.05, dy: -0.04 })).label, "Open_Palm");
  assert.equal(classifyLandmarkPose(transformPose(closedFist, { scale, dx: -0.04, dy: 0.05 })).label, "Closed_Fist");
}

const palmFallback = consumeSequence(Array.from({ length: 3 }, () => ({ categoryName: "None", score: 0.99, landmarks: openPalm })));
assert.equal(palmFallback.at(-1).label, "Open_Palm");
assert.equal(palmFallback.at(-1).labelSource, "landmarks");
assert.equal(palmFallback.at(-1).stableLabel, "Open_Palm");
assert.equal(palmFallback.at(-1).stableGesture, "Open_Palm");

const fistFallback = consumeSequence(Array.from({ length: 3 }, () => ({ categoryName: "None", score: 0.99, landmarks: closedFist })));
assert.equal(fistFallback.at(-1).label, "Closed_Fist");
assert.equal(fistFallback.at(-1).labelSource, "landmarks");
assert.equal(fistFallback.at(-1).stableLabel, "Closed_Fist");

const conflict = consumeSequence(Array.from({ length: 3 }, () => ({ categoryName: "Closed_Fist", score: 0.99, landmarks: openPalm })));
assert.equal(conflict.at(-1).label, "None");
assert.equal(conflict.at(-1).labelSource, "conflict");
assert.equal(conflict.at(-1).stableLabel, null);

const alternatingNoise = consumeSequence([
  { categoryName: "Open_Palm", score: 0.95, landmarks: ambiguousHand },
  { categoryName: "Closed_Fist", score: 0.95, landmarks: ambiguousHand },
  { categoryName: "Open_Palm", score: 0.95, landmarks: ambiguousHand },
  { categoryName: "Closed_Fist", score: 0.95, landmarks: ambiguousHand },
  { categoryName: "Open_Palm", score: 0.95, landmarks: ambiguousHand }
]);
assert.equal(alternatingNoise.some(frame => frame.stableLabel), false);

const consecutiveAfterNoise = consumeSequence([
  { categoryName: "Open_Palm", score: 0.95, landmarks: ambiguousHand },
  { categoryName: "Closed_Fist", score: 0.95, landmarks: ambiguousHand },
  { categoryName: "Open_Palm", score: 0.95, landmarks: ambiguousHand },
  { categoryName: "Open_Palm", score: 0.95, landmarks: ambiguousHand },
  { categoryName: "Open_Palm", score: 0.95, landmarks: ambiguousHand }
]);
assert.equal(consecutiveAfterNoise.at(-2).stableLabel, null);
assert.equal(consecutiveAfterNoise.at(-1).stableLabel, "Open_Palm");
assert.equal(consecutiveAfterNoise.at(-1).consecutiveFrames, 3);

const runtimeCycleFrames = [];
const runtimeCycle = new LocalGestureRecognizerRuntime();
runtimeCycle.onFrame = frame => runtimeCycleFrames.push(frame);
[
  ...Array.from({ length: 3 }, () => ({ categoryName: "Closed_Fist", score: 0.99, landmarks: closedFist })),
  ...Array.from({ length: 3 }, () => ({ categoryName: "Open_Palm", score: 0.99, landmarks: openPalm })),
  ...Array.from({ length: 3 }, () => ({ categoryName: "Closed_Fist", score: 0.99, landmarks: closedFist }))
].forEach((frame, index) => runtimeCycle.consumeResult({
  landmarks: [frame.landmarks],
  gestures: [[{ categoryName: frame.categoryName, score: frame.score }]]
}, 2000 + index * 80));
assert.deepEqual(runtimeCycleFrames.map(frame => frame.stableGesture).filter(Boolean), ["Closed_Fist", "Open_Palm", "Closed_Fist"]);

const lowConfidenceNoise = consumeSequence(Array.from({ length: 5 }, () => ({ categoryName: "Open_Palm", score: 0.3, landmarks: ambiguousHand })));
assert.equal(lowConfidenceNoise.at(-1).label, "None");
assert.equal(lowConfidenceNoise.at(-1).stableGesture, null);

const noHandSpoof = consumeSequence(Array.from({ length: 3 }, () => ({ categoryName: "Open_Palm", score: 0.99, landmarks: null })));
assert.equal(noHandSpoof.at(-1).handPresent, false);
assert.equal(noHandSpoof.at(-1).label, "None");
assert.equal(noHandSpoof.at(-1).stableLabel, null);

assert.equal(RECOGNIZER_INFO.scoreThresholds.Open_Palm, 0.62);
assert.equal(RECOGNIZER_INFO.scoreThresholds.Closed_Fist, 0.65);
assert.equal(RECOGNIZER_INFO.stableWindow.includes("consecutive"), true);
console.log("PASS palm/fist landmark fusion, conflict override, consecutive-frame stabilization, and noise rejection");
