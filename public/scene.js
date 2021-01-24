// Global variables
var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);
var scene = new BABYLON.Scene(engine);
// Create GUI
var gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
// Keep track of all GUI elements
var guiElements = [];
// Arrays to store robot actions and sizes of snowballs
var animations = [];
var sizes = [];
var run = createRunTrigger();
var reset = createResetTrigger();

var largeDiameter = 1.2;
var mediumDiameter = 0.9;
var smallDiameter = 0.6;
var startDelay = 500;
var makeSphereDelay = 500;
var placeSphereDelay = 5000;
var danceDelay = 7000;

var level = 1;
var levelOneDone = false; 
// Can initialize ahead of time because we know these six actions MUST happen
// in order for a user to pass level one
var levelOneDoneDelay = 3*makeSphereDelay + 3*placeSphereDelay - 3000;

// functions for code blocks
Blockly.JavaScript['create_sphere'] = function(block) {
    var dropdown_name = block.getFieldValue('NAME');
    animations.push("make sphere");
    sizes.push(dropdown_name);
    var code = 'console.log("make sphere");\n';
    console.log(animations);
    return code;
}; 

Blockly.JavaScript['place'] = function(block) {
    animations.push("place");
    var code = 'console.log("place");\n';
    console.log(animations);
    return code;
};

Blockly.JavaScript['dance'] = function(block) {
    animations.push("dance");
    var code = 'console.log("dance");\n';
    return code;
};
// Helper functions
function setUpScene(camera, camera1, light, light1) {
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    light.intensity = 0.7;
    light1.intensity = 0.6;
    light1.specular = BABYLON.Color3.Black();
    scene.activeCamera = camera1;
    scene.activeCamera.attachControl(canvas, true);
    camera1.lowerRadiusLimit = 10;
    camera1.upperRadiusLimit = 10;
    camera1.wheelDeltaPercentage = 0.1;
}
function createResetTrigger() {
    var reset = BABYLON.GUI.Button.CreateSimpleButton("but", "Reset");
    reset.isVisible = false;
    gui.addControl(reset);
    return reset;
}
function createRunTrigger() {
    var run = BABYLON.GUI.Button.CreateSimpleButton("but", "Run");
    run.isVisible = false;
    gui.addControl(run);
    return run;
}
function moveSphere(translate, currSphere) {
    var j = 0;
    var deltaDistance = 0.009;
    var dist = translate.length();
    var dir = new BABYLON.Vector3(translate.x, translate.y, translate.z);
    dir.normalize();
    scene.registerAfterRender(function () { 
        if((j++) * deltaDistance <= dist) currSphere.translate(dir, deltaDistance, BABYLON.Space.WORLD);
    });
}
function moveRobotUp(robot, delay) {
    setTimeout(() => {
        robot.position.y += 0.5                 
    }, delay);
}
function runOnGUI() {
    run.onPointerUpObservable.notifyObservers();
    if (level == 1 && detectLevelOneDone()) {
        setTimeout(() => {
            var audio = new Audio('party_horn-Mike_Koenig-76599891.mp3');
            audio.play();
            document.getElementById("levelUpModal").style.display = "block";
            document.getElementById("levelUpModal")
                .querySelector("p").innerHTML = "You passed level 1!"
            level++;
        }, levelOneDoneDelay);
    }
}
function resetGUI() {
    for (i = 0; i < guiElements.length; i++) {
        guiElements[i].isVisible = false;
    }
    guiElements = [];
    animations = [];
    sizes = [];
    reset.onPointerUpObservable.notifyObservers();
    setTimeout(function() { 
        document.activeElement.blur();
    }, 150);
}

// Returns flag for whether the user's programmed sequence of events will
// create a three-tiered snowman. Assumes that to pass this level, there's no 
// "side trips" on the way to making this snowman (i.e. no other snowballs are
// created and placed in between the desired sequence). Dance moves are okay. :)
function detectLevelOneDone() {
    // Look for right sequence of animations
    var sequence = ["make sphere", "place", "make sphere", "place", "make sphere", "place"];
    var spotInSequence = 0;
    for (i = 0; i < animations.length; i++) {
        if (spotInSequence == 6) break;
        if (animations[i] == "dance") continue;
        if (animations[i] == sequence[spotInSequence]) {
            spotInSequence++;
        } else {
            break;
        }
    }

    if (spotInSequence != 6) return false;

    sequence = ["large", "medium", "small"];
    spotInSequence = 0;
    for (i = 0; i < sizes.length; i++) {
        if (spotInSequence == 3) break;
        if (sizes[i] == sequence[i]) {
            spotInSequence++;
        } else break;
    }

    if (spotInSequence != 3) return false;

    return true;
}

/******* main function ******/
var createScene = function () {
    // Create scene + Set up
    var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, 0), scene);
    var camera1 = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, -4, 0), scene);
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    setUpScene(camera, camera1, light, light1);

    // Load robot character from github and play animation
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/nisha-chat/hourofcode/main/public/", "robot.glb", scene, function (newMeshes, particleSystems, skeletons, animationGroups) {
        var robot = newMeshes[0];
        // Scale the model down        
        robot.scaling.scaleInPlace(0.6);
        robot.position.x -= 1.5;
        // Lock camera on the character 
        camera1.target = robot;

        // Get all the animations
        const idleAnim = scene.getAnimationGroupByName("Idle");
        const placeLargeAnim = scene.getAnimationGroupByName("placeLarge");
        const placeMediumAnim = scene.getAnimationGroupByName("placeMedium");
        const placeSmallAnim = scene.getAnimationGroupByName("placeSmall");
        const danceAnim = scene.getAnimationGroupByName("Dance");
        // Start with Idle Animation
        idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);

        //function for when the "reset" button is clicked
        reset.onPointerUpObservable.add(function() {
            //reset robot position
            robot.position.y = 0;
        });

        //function for when the "run" button is clicked
        run.onPointerUpObservable.add(function() {
            var delay = startDelay;
            var startX = -1.5;
            var startY = 1.3;
            var startZ = 1;
            var endX = 0.7;
            var endY = -1.5;
            var endZ = 0.2;
            // Index tracker for sizes of snowball
            var sizeIndex = 0;
            // Variable to hold the current size of snowball
            var currSize = "large";
            // Loop through all animations/actions
            for(var i = 0; i < animations.length; i++) {
                if(animations[i] == "make sphere") {
                    setTimeout(() => {
                        startY += 0.5;
                        currSize = sizes[sizeIndex];
                        //set default diameter to largest size
                        var diam = largeDiameter;
                        //change diameter of the ball based on selected size
                        if(currSize == "small") {
                            diam = smallDiameter;
                        }
                        else if(currSize == "medium") {
                            diam = mediumDiameter;
                        }
                        else if(currSize == "large") {
                            diam = largeDiameter;
                        }
                        //create a new snowball at the position of the robot's hands
                        currSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: diam, segments: 32});
                        currSphere.position = new BABYLON.Vector3(startX,startY,startZ);
                        guiElements.push(currSphere);
                        sizeIndex++;
                    }, delay);
                }
                else if(animations[i] == "dance") {
                    idleAnim.stop();
                    setTimeout(() => {
                        danceAnim.start(false, 1.0, danceAnim.from, danceAnim.to, false);
                    }, delay);
                    delay += danceDelay;
                    levelOneDoneDelay += danceDelay;
                    danceAnim.stop();
                    idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
                }
                else if(animations[i] == "place") {
                    idleAnim.stop();
                    setTimeout(() => {
                        if(currSize == "small") {
                            endY += 0.1;
                            moveSphere(new BABYLON.Vector3(endX, endY, endZ), currSphere);
                            placeSmallAnim.start(false, 1.0, 0, 2.3, false);   
                        } 
                        else if(currSize == "medium") {
                            endY += 0.3;
                            moveSphere(new BABYLON.Vector3(endX, endY, endZ), currSphere);
                            placeMediumAnim.start(false, 1.0, placeMediumAnim.from, placeMediumAnim.to, false);  
                        }   
                        else if(currSize == "large"){
                            endY += 0.5;
                            moveSphere(new BABYLON.Vector3(endX, endY, endZ), currSphere);
                            placeLargeAnim.start(false, 1.0, placeLargeAnim.from, placeLargeAnim.to, false);  
                        }   
                    }, delay);
                    delay += placeSphereDelay;
                    idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
                    moveRobotUp(robot, delay);
                }
            }
        });   
    });
    return scene;
};

// function to call createScene()
window.addEventListener('DOMContentLoaded', function() {
    var scene = createScene();
    engine.runRenderLoop(function () {
        if (scene) {
            scene.render();
        }
    });
    window.addEventListener("resize", function () {
            engine.resize();
    });
});