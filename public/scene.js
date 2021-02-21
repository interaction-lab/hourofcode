// Global variables
const canvas = document.getElementById('renderCanvas')
const engine = new BABYLON.Engine(canvas, true)
const scene = new BABYLON.Scene(engine)
// Create GUI
const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI')
// Keep track of all GUI elements
let guiElements = []
// Arrays to store robot actions and sizes of snowballs
let animations = []
let sizes = []
const run = createRunTrigger()
const reset = createResetTrigger()

const largeDiameter = 1.2
const mediumDiameter = 0.9
const smallDiameter = 0.6
const startDelay = 500
const makeSphereDelay = 500
const placeSphereDelay = 5000
const danceDelay = 7000

let level = 1
const levelOneDone = false
// Can initialize ahead of time because we know these six actions MUST happen
// in order for a user to pass level one
let levelOneDoneDelay = 3 * makeSphereDelay + 3 * placeSphereDelay - 3000

// functions for code blocks
Blockly.JavaScript.create_sphere = function (block) {
  const dropdown_name = block.getFieldValue('NAME')
  animations.push('make sphere')
  sizes.push(dropdown_name)
  const code = 'console.log("make sphere");\n'
  console.log(animations)
  return code
}

Blockly.JavaScript.place = function (block) {
  animations.push('place')
  const code = 'console.log("place");\n'
  console.log(animations)
  return code
}

Blockly.JavaScript.dance = function (block) {
  animations.push('dance')
  const code = 'console.log("dance");\n'
  return code
}
// Helper functions
function setUpScene (camera, camera1, light, light1) {
  camera.setTarget(BABYLON.Vector3.Zero())
  camera.attachControl(canvas, true)
  light.intensity = 0.7
  light1.intensity = 0.6
  light1.specular = BABYLON.Color3.Black()
  scene.activeCamera = camera1
  scene.activeCamera.attachControl(canvas, true)
  camera1.lowerRadiusLimit = 10
  camera1.upperRadiusLimit = 10
  camera1.wheelDeltaPercentage = 0.1
}
function createResetTrigger () {
  const reset = BABYLON.GUI.Button.CreateSimpleButton('but', 'Reset')
  reset.isVisible = false
  gui.addControl(reset)
  return reset
}
function createRunTrigger () {
  const run = BABYLON.GUI.Button.CreateSimpleButton('but', 'Run')
  run.isVisible = false
  gui.addControl(run)
  return run
}
function moveSphere (translate, currSphere) {
  let j = 0
  const deltaDistance = 0.009
  const dist = translate.length()
  const dir = new BABYLON.Vector3(translate.x, translate.y, translate.z)
  dir.normalize()
  scene.registerAfterRender(function () {
    if ((j++) * deltaDistance <= dist) currSphere.translate(dir, deltaDistance, BABYLON.Space.WORLD)
  })
}
function moveRobotUp (robot, delay) {
  setTimeout(() => {
    robot.position.y += 0.5
  }, delay)
}
function runOnGUI () {
  run.onPointerUpObservable.notifyObservers()
  if (level == 1 && detectLevelOneDone()) {
    setTimeout(() => {
      const audio = new Audio('party_horn-Mike_Koenig-76599891.mp3')
      audio.play()
      document.getElementById('levelUpModal').style.display = 'block'
      document.getElementById('levelUpModal')
        .querySelector('p').innerHTML = 'You passed level 1!'
      level++
    }, levelOneDoneDelay)
  }
}
function resetGUI () {
  for (i = 0; i < guiElements.length; i++) {
    guiElements[i].isVisible = false
  }
  guiElements = []
  animations = []
  sizes = []
  reset.onPointerUpObservable.notifyObservers()
  setTimeout(function () {
    document.activeElement.blur()
  }, 150)
}

// Returns flag for whether the user's programmed sequence of events will
// create a three-tiered snowman. Assumes that to pass this level, there's no
// "side trips" on the way to making this snowman (i.e. no other snowballs are
// created and placed in between the desired sequence). Dance moves are okay. :)
function detectLevelOneDone () {
  // Look for right sequence of animations
  let sequence = ['make sphere', 'place', 'make sphere', 'place', 'make sphere', 'place']
  let spotInSequence = 0
  for (i = 0; i < animations.length; i++) {
    if (spotInSequence == 6) break
    if (animations[i] == 'dance') continue
    if (animations[i] == sequence[spotInSequence]) {
      spotInSequence++
    } else {
      break
    }
  }

  if (spotInSequence != 6) return false

  sequence = ['large', 'medium', 'small']
  spotInSequence = 0
  for (i = 0; i < sizes.length; i++) {
    if (spotInSequence == 3) break
    if (sizes[i] == sequence[i]) {
      spotInSequence++
    } else break
  }

  if (spotInSequence != 3) return false

  return true
}

/** ***** main function ******/
const createScene = function () {
  // Create scene + Set up
  const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, 0), scene)
  const camera1 = new BABYLON.ArcRotateCamera('camera1', Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, -4, 0), scene)
  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene)
  const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene)
  setUpScene(camera, camera1, light, light1)

  // Load robot character from github and play animation
  BABYLON.SceneLoader.ImportMesh('', 'https://raw.githubusercontent.com/nisha-chat/hourofcode/main/public/', 'robot.glb', scene, function (newMeshes, particleSystems, skeletons, animationGroups) {
    const robot = newMeshes[0]
    // Scale the model down
    robot.scaling.scaleInPlace(0.6)
    robot.position.x -= 1.5
    // Lock camera on the character
    camera1.target = robot

    // Get all the animations
    const idleAnim = scene.getAnimationGroupByName('Idle')
    const placeLargeAnim = scene.getAnimationGroupByName('placeLarge')
    const placeMediumAnim = scene.getAnimationGroupByName('placeMedium')
    const placeSmallAnim = scene.getAnimationGroupByName('placeSmall')
    const danceAnim = scene.getAnimationGroupByName('Dance')
    // Start with Idle Animation
    idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false)

    // function for when the "reset" button is clicked
    reset.onPointerUpObservable.add(function () {
      // reset robot position
      robot.position.y = 0
    })

    // function for when the "run" button is clicked
    run.onPointerUpObservable.add(function () {
      let delay = startDelay
      const startX = -1.5
      let startY = 1.3
      const startZ = 1
      const endX = 0.7
      let endY = -1.5
      const endZ = 0.2
      // Index tracker for sizes of snowball
      let sizeIndex = 0
      // Variable to hold the current size of snowball
      let currSize = 'large'
      // Loop through all animations/actions
      for (let i = 0; i < animations.length; i++) {
        if (animations[i] == 'make sphere') {
          setTimeout(() => {
            startY += 0.5
            currSize = sizes[sizeIndex]
            // set default diameter to largest size
            let diam = largeDiameter
            // change diameter of the ball based on selected size
            if (currSize == 'small') {
              diam = smallDiameter
            } else if (currSize == 'medium') {
              diam = mediumDiameter
            } else if (currSize == 'large') {
              diam = largeDiameter
            }
            // create a new snowball at the position of the robot's hands
            currSphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: diam, segments: 32 })
            currSphere.position = new BABYLON.Vector3(startX, startY, startZ)
            guiElements.push(currSphere)
            sizeIndex++
          }, delay)
        } else if (animations[i] == 'dance') {
          idleAnim.stop()
          setTimeout(() => {
            danceAnim.start(false, 1.0, danceAnim.from, danceAnim.to, false)
          }, delay)
          delay += danceDelay
          levelOneDoneDelay += danceDelay
          danceAnim.stop()
          idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false)
        } else if (animations[i] == 'place') {
          idleAnim.stop()
          setTimeout(() => {
            if (currSize == 'small') {
              endY += 0.1
              moveSphere(new BABYLON.Vector3(endX, endY, endZ), currSphere)
              placeSmallAnim.start(false, 1.0, 0, 2.3, false)
            } else if (currSize == 'medium') {
              endY += 0.3
              moveSphere(new BABYLON.Vector3(endX, endY, endZ), currSphere)
              placeMediumAnim.start(false, 1.0, placeMediumAnim.from, placeMediumAnim.to, false)
            } else if (currSize == 'large') {
              endY += 0.5
              moveSphere(new BABYLON.Vector3(endX, endY, endZ), currSphere)
              placeLargeAnim.start(false, 1.0, placeLargeAnim.from, placeLargeAnim.to, false)
            }
          }, delay)
          delay += placeSphereDelay
          idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false)
          moveRobotUp(robot, delay)
        }
      }
    })
  })
  return scene
}

// function to call createScene()
window.addEventListener('DOMContentLoaded', function () {
  const scene = createScene()
  engine.runRenderLoop(function () {
    if (scene) {
      scene.render()
    }
  })
  window.addEventListener('resize', function () {
    engine.resize()
  })
})