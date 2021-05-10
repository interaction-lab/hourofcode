const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");

lastUpdateTime = curTime = null;
function getDeltaTimeMS() {
  if (lastUpdateTime == null) {
    lastUpdateTime = Date.now();
  }
  curTime = Date.now();
  deltaTime = curTime - lastUpdateTime;
  lastUpdateTime = curTime;
  return deltaTime;
}

// Variables to Tweak
timeToHoldPoseMS = 4000;

// Constants
const ARMS = {
  LEFT: "Left", 
  RIGHT: "Right"
}
const ARMSTATES = {
  NONE: "None",
  LOW: "Low",
  MED: "Medium",
  HIGH: "High",
  OUTINFRONT: "Out"
}
const SPHERESIZES = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large"
}
const BLOCKTYPES = {
  CREATESPHERE: "create_sphere",
  PLACESPHERE: "place",
  DANCE: "dance"
}

// States / Globals
cumulativeArmStates = {
  [ARMS.LEFT]: {
    [ARMSTATES.LOW]: 0,
    [ARMSTATES.MED]: 0,
    [ARMSTATES.HIGH]: 0,
    [ARMSTATES.OUTINFRONT]: 0
  },
  [ARMS.RIGHT]: {
    [ARMSTATES.LOW]: 0,
    [ARMSTATES.MED]: 0,
    [ARMSTATES.HIGH]: 0,
    [ARMSTATES.OUTINFRONT]: 0
  }
}
progressBars = {
  [ARMS.LEFT]: {
    [ARMSTATES.LOW]: document.getElementById("leftArmLowBar"),
    [ARMSTATES.MED]: document.getElementById("leftArmMedBar"),
    [ARMSTATES.HIGH]: document.getElementById("leftArmHighBar"),
    [ARMSTATES.OUTINFRONT]: document.getElementById("leftArmOutBar")
  },
  [ARMS.RIGHT]: {
    [ARMSTATES.LOW]: document.getElementById("rightArmLowBar"),
    [ARMSTATES.MED]: document.getElementById("rightArmMedBar"),
    [ARMSTATES.HIGH]: document.getElementById("rightArmHighBar"),
    [ARMSTATES.OUTINFRONT]: document.getElementById("rightArmOutBar")
  }
}
leftProgressheader = document.getElementById("leftProgressHeader");
rightProgressheader = document.getElementById("rightProgressHeader");
text = document.getElementById("instructions");
image = document.getElementById("image");
imageName = document.getElementById("imageName");
var imageIndex = 0;
all_images = ["https://user-images.githubusercontent.com/15292506/112219728-a3171200-8be2-11eb-8fbe-025913384417.PNG", "https://user-images.githubusercontent.com/31269392/113462721-256bb700-93d7-11eb-9b52-6cc50c2b1370.png", "https://user-images.githubusercontent.com/15292506/112219748-a90cf300-8be2-11eb-8d96-ccad8b96b2fa.PNG"];
all_poses = ["Make Small Sphere", "Place Sphere", "Run Code"];
var codeIsRunning = false;

// Main
async function onResults(results) {
  deltaTime = getDeltaTimeMS();
  drawPoseSkeleton(results);
  if (!codeIsRunning &&
    results != null &&
    results.poseLandmarks != null) {
    curArmStates = getStateOfArms(results);
    updateCumulativeArmStates(curArmStates, deltaTime);
    updateProgressBars();
    var bestArmScores = getBestArmScores();
    updateBestArmText(bestArmScores);
    if (attemptPoseDetection(bestArmScores)) {
      resetAllArmScores();
      if(imageIndex == 2) {
        window.location.href = "./poseToCode.html";
      } else {
        imageIndex++;
        image.src = all_images[imageIndex];
        imageName.innerHTML = all_poses[imageIndex];
      }
    }
  }
}

// Update Functions
function decayAllOtherStates(curArmStates, deltaTime) {
  var decayFactor = 0.8 * deltaTime;
  for (let arm in cumulativeArmStates) {
    for (let state in cumulativeArmStates[arm]) {
      if (curArmStates[arm] == state) {
        continue;
      }
      cumulativeArmStates[arm][state] -= decayFactor;
      if (cumulativeArmStates[arm][state] < 0) {
        cumulativeArmStates[arm][state] = 0;
      }
    }
  }
}

function updateCumulativeArmStates(curArmStates, deltaTime) {
  const scaleFactor = 1.2;
  const scaledTimeToHoldPose = timeToHoldPoseMS * scaleFactor;
  cumulativeArmStates[ARMS.LEFT][curArmStates[ARMS.LEFT]] += deltaTime;
  cumulativeArmStates[ARMS.RIGHT][curArmStates[ARMS.RIGHT]] += deltaTime;
  if (cumulativeArmStates[ARMS.LEFT][curArmStates[ARMS.LEFT]] > scaledTimeToHoldPose) {
    cumulativeArmStates[ARMS.LEFT][curArmStates[ARMS.LEFT]] = scaledTimeToHoldPose;
  }
  if (cumulativeArmStates[ARMS.RIGHT][curArmStates[ARMS.RIGHT]] > scaledTimeToHoldPose) {
    cumulativeArmStates[ARMS.RIGHT][curArmStates[ARMS.RIGHT]] = scaledTimeToHoldPose;
  }
  decayAllOtherStates(curArmStates, deltaTime);
}

function getBestArmScores() {
  var bestArmScores = {
    [ARMS.LEFT]: ARMSTATES.NONE,
    [ARMS.RIGHT]: ARMSTATES.NONE
  };
  for (let arm in cumulativeArmStates) {
    var bestArmScore = -1;
    for (let state in cumulativeArmStates[arm]) {
      if (bestArmScore < cumulativeArmStates[arm][state]) {
        bestArmScores[arm] = state;
        bestArmScore = cumulativeArmStates[arm][state];
      }
    }
  }
  return bestArmScores;
}

function updateProgressBars() {
  for (let arm in progressBars) {
    for (let state in progressBars[arm]) {
      percent = cumulativeArmStates[arm][state] / timeToHoldPoseMS * 100;
      if (percent > 100) {
        percent = 100;
      }
      progressBars[arm][state].style.width = percent + "%";
      progressBars[arm][state].innerHTML = state;
    }
  }
}

function updateBestArmText(bestArmScores) {
  leftProgressheader.innerHTML = "Best " + ARMS.LEFT + ": " + bestArmScores[ARMS.LEFT];
  rightProgressheader.innerHTML = "Best " + ARMS.RIGHT + ": " + bestArmScores[ARMS.RIGHT];
  if(imageIndex == 0) {
    //make small sphere (left up, right down)
    if(bestArmScores[ARMS.LEFT] != ARMSTATES.HIGH) {
      text.innerHTML = "Raise your left arm!";
    } else if (bestArmScores[ARMS.RIGHT] != ARMSTATES.LOW) {
      text.innerHTML = "Lower your right arm!";
    } else if (bestArmScores[ARMS.LEFT] == ARMSTATES.HIGH && bestArmScores[ARMS.RIGHT] == ARMSTATES.LOW) {
      text.innerHTML = "Awesome! Hold that pose.";
    }
  }
  else if(imageIndex == 1) {
    //place sphere (both out)
    if(bestArmScores[ARMS.LEFT] != ARMSTATES.OUTINFRONT) {
      text.innerHTML = "Adjust your left arm!";
    } else if (bestArmScores[ARMS.RIGHT] != ARMSTATES.OUTINFRONT) {
      text.innerHTML = "Adjust your right arm!";
    } else if (bestArmScores[ARMS.LEFT] == ARMSTATES.OUTINFRONT && bestArmScores[ARMS.RIGHT] == ARMSTATES.OUTINFRONT) {
      text.innerHTML = "Awesome! Hold that pose.";
    }
  }
  else if(imageIndex == 2) {
    //run code  (right high, left medium)
    if(bestArmScores[ARMS.LEFT] == ARMSTATES.LOW) {
      text.innerHTML = "Raise your left arm!";
    } else if(bestArmScores[ARMS.LEFT] == ARMSTATES.HIGH) {
      text.innerHTML = "Lower your left arm!";
    } else if (bestArmScores[ARMS.RIGHT] != ARMSTATES.HIGH) {
      text.innerHTML = "Raise your right arm!";
    } else if (bestArmScores[ARMS.LEFT] == ARMSTATES.MED && bestArmScores[ARMS.RIGHT] == ARMSTATES.HIGH) {
      text.innerHTML = "Awesome! Hold that pose.";
    }
  }
}

function armScoresOverThreshHold(bestArmScores) {
  return cumulativeArmStates[ARMS.LEFT][bestArmScores[ARMS.LEFT]] >= timeToHoldPoseMS &&
    cumulativeArmStates[ARMS.RIGHT][bestArmScores[ARMS.RIGHT]] >= timeToHoldPoseMS;
}

function attemptPoseDetection(bestArmScores) {
  if (!armScoresOverThreshHold(bestArmScores)) {
    return false;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.MED &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.HIGH) {
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.OUTINFRONT &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.OUTINFRONT) {
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.HIGH &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.LOW) {
    return true;
  }
  return false;
}

function resetAllArmScores() {
  for (let arm in progressBars) {
    for (let state in progressBars[arm]) {
      cumulativeArmStates[arm][state] = 0;
    }
  }
}

// Assumes results.poseLandmarks != null
function getStateOfArms(results) {
  armStates = {
    [ARMS.LEFT]: ARMSTATES.NONE,
    [ARMS.RIGHT]: ARMSTATES.NONE
  }
  if (results.poseLandmarks[19].x < results.poseLandmarks[11].x &&
    results.poseLandmarks[19].y < results.poseLandmarks[13].y &&
    results.poseLandmarks[19].y > results.poseLandmarks[11].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.OUTINFRONT;
  }
  else if (results.poseLandmarks[15].y < results.poseLandmarks[2].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.HIGH;
  }
  else if (results.poseLandmarks[15].y < results.poseLandmarks[23].y &&
    results.poseLandmarks[15].y > results.poseLandmarks[12].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.MED;
  }
  else if (results.poseLandmarks[15].y > results.poseLandmarks[23].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.LOW;
  }

  if (results.poseLandmarks[20].x > results.poseLandmarks[12].x &&
    results.poseLandmarks[20].y < results.poseLandmarks[14].y &&
    results.poseLandmarks[20].y > results.poseLandmarks[12].y) {
    armStates[ARMS.LEFT] = ARMSTATES.OUTINFRONT
  }
  else if (results.poseLandmarks[16].y < results.poseLandmarks[5].y) {
    armStates[ARMS.LEFT] = ARMSTATES.HIGH;
  }
  else if (results.poseLandmarks[16].y < results.poseLandmarks[24].y &&
    results.poseLandmarks[16].y > results.poseLandmarks[11].y) {
    armStates[ARMS.LEFT] = ARMSTATES.MED;
  }
  else if (results.poseLandmarks[16].y > results.poseLandmarks[24].y) {
    armStates[ARMS.LEFT] = ARMSTATES.LOW;
  }
  return armStates;
}

// MediaPipe and DOM events
const userPose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
  },
});

userPose.setOptions({
  selfieMode: true,
  upperBodyOnly: false,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
userPose.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await userPose.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});
camera.start();

function drawPoseSkeleton(results) {
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
    color: "#00FF00",
    lineWidth: 4,
  });
  drawLandmarks(canvasCtx, results.poseLandmarks, {
    color: "#FF0000",
    lineWidth: 2,
  });
}