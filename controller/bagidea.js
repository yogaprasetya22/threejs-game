import "../style.css";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let pitchObject = new THREE.Object3D();
let yawObject = new THREE.Object3D();

let element;
let pointerLock = false;

let isSupport =
    "pointerLockElement" in document ||
    "mozPointerLockElement" in document ||
    "webkitPointerLockElement" in document;

let contactNormal = new CANNON.Vec3();
let upAxis = new CANNON.Vec3(0, 1, 0);
let bodyTemp;
let canJump = false;
let cannonDebugRenderer;

class Player {
    constructor() {
        this.inputVelocity = new THREE.Vector3();
        this.euler = new THREE.Euler();
        this.quat = new THREE.Quaternion();

        this.isCannon = true;
        this.name = "Player";

        this.shape = new CANNON.Sphere(0.2);
        this.body = new CANNON.Body({ shape: this.shape, mass: 2 });
        this.body.linearDamping = 0.99;
        bodyTemp = this.body;

        this.geometry = new THREE.SphereGeometry(this.shape.radius);
        this.material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.reciveShadow = true;

        //Header
        this.boxGeometry = new THREE.BoxGeometry(0.02, 0.1, 0.02);
        this.boxMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        this.boxMesh = new THREE.Mesh(this.boxGeometry, this.boxMaterial);
        this.boxMesh.position.set(0, 0.23, 0);
        this.boxMesh.castShadow = true;
        this.boxMesh.reciveShadow = true;

        //Constraint
        this.shapeConstraint = new CANNON.Sphere(0.04);
        this.bodyConstraint = new CANNON.Body({
            shape: this.shapeConstraint,
            mass: 0,
        });

        this.constraintGeometry = new THREE.SphereGeometry(0.04);
        this.constraintMaterial = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
        });
        this.constraintMesh = new THREE.Mesh(
            this.constraintGeometry,
            this.constraintMaterial
        );
        this.constraintMesh.castShadow = true;
        this.constraintMesh.reciveShadow = true;

        bodyTemp.addEventListener("collide", function (e) {
            let contact = e.contact;

            if (contact.bi.id == bodyTemp.id) contact.ni.negate(contactNormal);
            else contactNormal.copy(contact.ni);

            if (contactNormal.dot(upAxis) > 0.5) canJump = true;
        });
    }

    Update() {
        this.inputVelocity.set(0, 0, 0);

        if (moveForward) {
            this.inputVelocity.z = -0.2;
        }
        if (moveBackward) {
            this.inputVelocity.z = 0.2;
        }
        if (moveLeft) {
            this.inputVelocity.x = -0.2;
        }
        if (moveRight) {
            this.inputVelocity.x = 0.2;
        }

        this.euler.y = yawObject.rotation.y;
        this.euler.order = "XYZ";
        this.quat.setFromEuler(this.euler);
        this.inputVelocity.applyQuaternion(this.quat);

        this.body.velocity.z += this.inputVelocity.z;
        this.body.velocity.x += this.inputVelocity.x;

        yawObject.position.x = this.body.position.x;
        yawObject.position.z = this.body.position.z;
        yawObject.position.y +=
            (this.body.position.y - yawObject.position.y) / 4;
        //yawObject.position.copy(this.body.position);
    }
}

function OnKeyDown(e) {
    //console.log(e.keyCode);
    switch (e.keyCode) {
        case 87: //w
        case 38: //up
            moveForward = true;
            break;
        case 83: //s
        case 40: //down
            moveBackward = true;
            break;
        case 65: //a
        case 37: //left
            moveLeft = true;
            break;
        case 68: //d
        case 39: //right
            moveRight = true;
            break;
        case 32: //space
            if (canJump) {
                bodyTemp.velocity.y = 10;
                canJump = false;
            }
            break;
        case 27:
            if (pointerLock) {
                document.exitPointerLock();
            }
            break;
    }
}

function OnKeyUp(e) {
    //console.log(e.keyCode);
    switch (e.keyCode) {
        case 87: //w
        case 38: //up
            moveForward = false;
            break;
        case 83: //s
        case 40: //down
            moveBackward = false;
            break;
        case 65: //a
        case 37: //left
            moveLeft = false;
            break;
        case 68: //d
        case 39: //right
            moveRight = false;
            break;
    }
}

function OnMouseMove(e) {
    if (pointerLock) {
        let movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        let movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;
        pitchObject.rotation.x = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 8, pitchObject.rotation.x)
        );
    }
}

function OnMouseClick(e) {
    if (!pointerLock) {
        element.requestPointerLock();
    }
}

function LockChangeAlert() {
    if (!pointerLock) {
        pointerLock = true;
    } else if (pointerLock) {
        document.exitPointerLock();
        pointerLock = false;
    }
}

document.addEventListener("keydown", OnKeyDown, false);
document.addEventListener("keyup", OnKeyUp, false);
document.addEventListener("mousemove", OnMouseMove, false);
document.addEventListener("click", OnMouseClick, false);
document.addEventListener("pointerlockchange", LockChangeAlert, false);
document.addEventListener("mozpointerlockchange", LockChangeAlert, false);

class Box {
    constructor(_color = 0xffffff, _mass = 0.1, _size = 0.5) {
        this.isCannon = true;

        this.color = _color;
        this.mass = _mass;
        this.size = _size;
        this.size_2 = this.size / 2;

        this.shape = new CANNON.Box(
            new CANNON.Vec3(this.size_2, this.size_2, this.size_2)
        );
        this.body = new CANNON.Body({ shape: this.shape, mass: this.mass });

        this.geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        this.material = new THREE.MeshPhongMaterial({
            color: this.color,
            depthWrite: true,
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        console.log("Create Box.");
    }
}

class Sphere {
    constructor(_color = 0xffffff, _mass = 0.1, _size = 0.5) {
        this.isCannon = true;

        this.color = _color;
        this.mass = _mass;
        this.size = _size;

        this.shape = new CANNON.Sphere(this.size);
        this.body = new CANNON.Body({ shape: this.shape, mass: this.mass });

        this.geometry = new THREE.SphereGeometry(this.size);
        this.material = new THREE.MeshPhongMaterial({
            color: this.color,
            depthWrite: true,
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        console.log("Create Sphere.");
    }
}

class Game {
    constructor() {
        this.cannonList = [];
        this.isStart = false;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);
        this.scene.fog = new THREE.Fog(0x222222, 0, 8);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.01,
            1000.0
        );

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        //Cannon.js Init
        this.dt = 1 / 60;
        this.world = new CANNON.World();
        this.world.gravity.set(0, -10, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.tolerance = 0.001;
        this.world.solver.iterations = 20;
        this.world.quatNormalizeFast = false;
        this.world.quatNormalizeSkip = 0;

        this.CannonDebugger = new CannonDebugger(this.scene, this.world, {
            color: 0x0000ff,
        });

        cannonDebugRenderer = this.CannonDebugger;

        this.plane = new CANNON.Plane();
        this.groundBody = new CANNON.Body({ shape: this.plane, mass: 0 });
        this.groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        this.world.addBody(this.groundBody);

        element = this.renderer.domElement;
        if (isSupport) {
            element.requestPointerLock =
                element.requestPointerLock ||
                element.mozRequestPointerLock ||
                element.webkitRequestPointerLock;
            element.exitPointerLock =
                document.exitPointerLock ||
                document.mozExitPointerLock ||
                document.webkitExitPointerLock;
        }

        document.body.appendChild(element);
        window.addEventListener("resize", UpdateResize, false);

        console.log("Game Create.");
    }

    Start() {
        this.light = new THREE.DirectionalLight(0xffffff, 0.7);
        this.light.position.set(2, 100, 2);
        this.light.castShadow = true;
        this.light.shadow.bias = -0.00001;
        this.light.shadow.mapSize.width = 1024 * 4;
        this.light.shadow.mapSize.height = 1024 * 4;
        this.light.shadow.camera.near = 0.01;
        this.light.shadow.camera.far = 1000;
        this.light.shadow.camera.left = -100;
        this.light.shadow.camera.right = 100;
        this.light.shadow.camera.top = 100;
        this.light.shadow.camera.bottom = -100;
        this.scene.add(this.light);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.2));

        this.floorGeometry = new THREE.PlaneBufferGeometry(300, 300, 50, 50);
        this.floorMaterial = new THREE.MeshPhongMaterial({
            color: 0xf0f0f0,
            depthWrite: false,
        });
        this.floor = new THREE.Mesh(this.floorGeometry, this.floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        this.grid = new THREE.GridHelper(15, 20, 0x00aa00, 0x442222);
        this.grid.position.y = -0.01;
        this.scene.add(this.grid);

        this.isStart = true;

        console.log("Game Start.");
    }

    Add(obj) {
        if (obj.isCannon) {
            this.world.addBody(obj.body);
            obj.mesh.position.copy(obj.body.position);
            obj.mesh.quaternion.copy(obj.body.quaternion);
            this.cannonList.push(obj);

            if (obj.name == "Player") {
                obj.boxMesh.position.copy(obj.mesh.position);
                obj.boxMesh.position.y += 0.25;
                obj.boxMesh.rotation.y = yawObject.rotation.y;
                this.scene.add(obj.boxMesh);

                //Constraint
                this.world.addBody(obj.bodyConstraint);
                obj.lastBody = obj.bodyConstraint;
                obj.bodyConstraint.position.copy(obj.boxMesh.position);
                obj.bodyConstraint.quaternion.copy(obj.boxMesh.quaternion);
                obj.constraintMesh.position.copy(obj.bodyConstraint.position);
                obj.constraintMesh.quaternion.copy(
                    obj.bodyConstraint.quaternion
                );
                this.scene.add(obj.constraintMesh);

                obj.ballList = [];

                for (let i = 0; i < 20; i++) {
                    let ballShape = new CANNON.Sphere(0.03);
                    let ballBody = new CANNON.Body({
                        shape: ballShape,
                        mass: 0.05,
                    });
                    ballBody.position.copy(obj.lastBody.position);
                    ballBody.position.y += 0.065;
                    this.world.addBody(ballBody);

                    this.world.addConstraint(
                        new CANNON.DistanceConstraint(
                            ballBody,
                            obj.lastBody,
                            0.065
                        )
                    );
                    obj.lastBody = ballBody;

                    let ballGeomatry = new THREE.SphereGeometry(0.03);
                    let ballMesh = new THREE.Mesh(
                        ballGeomatry,
                        obj.constraintMaterial
                    );
                    ballMesh.position.copy(ballBody.position);
                    this.scene.add(ballMesh);

                    obj.ballList.push({ body: ballBody, mesh: ballMesh });
                }
            }
        }
        this.scene.add(obj.mesh);
    }

    Update() {
        if (this.isStart) {
            this.world.step(this.dt);

            for (let i = 0; i < this.cannonList.length; i++) {
                this.cannonList[i].mesh.position.copy(
                    this.cannonList[i].body.position
                );
                this.cannonList[i].mesh.quaternion.copy(
                    this.cannonList[i].body.quaternion
                );

                if (this.cannonList[i].name == "Player") {
                    this.cannonList[i].boxMesh.position.copy(
                        this.cannonList[i].mesh.position
                    );
                    this.cannonList[i].boxMesh.position.y += 0.25;
                    this.cannonList[i].boxMesh.rotation.y =
                        yawObject.rotation.y;
                    this.cannonList[i].bodyConstraint.position.copy(
                        this.cannonList[i].boxMesh.position
                    );
                    this.cannonList[i].bodyConstraint.quaternion.copy(
                        this.cannonList[i].boxMesh.quaternion
                    );
                    this.cannonList[i].constraintMesh.position.copy(
                        this.cannonList[i].bodyConstraint.position
                    );
                    this.cannonList[i].constraintMesh.quaternion.copy(
                        this.cannonList[i].bodyConstraint.quaternion
                    );

                    for (
                        let a = 0;
                        a < this.cannonList[i].ballList.length;
                        a++
                    ) {
                        this.cannonList[i].ballList[a].mesh.position.copy(
                            this.cannonList[i].ballList[a].body.position
                        );
                    }
                }
            }

            this.renderer.render(this.scene, this.camera);
        }
    }
}

let game = new Game();
game.Start();

let player = new Player(game.camera);
player.body.position.set(0, 1, 0);
game.Add(player);
pitchObject.add(game.camera);
game.camera.position.set(0, 0.3, 1);
yawObject.add(pitchObject);
game.scene.add(yawObject);

/*let box = new Box();
box.body.position.set(0,5,0);
game.Add(box);*/

/*let sphere = new Sphere();
sphere.body.position.set(0,5,0);
game.Add(sphere);*/

let randBox = [
    { color: 0xffffff, mass: 0.1 },
    { color: 0x00ff00, mass: 2 },
    { color: 0x0000ff, mass: 3 },
    { color: 0x000000, mass: 10 },
];

for (let i = 0; i < 200; i++) {
    let _rand = randBox[Math.floor(Math.random() * randBox.length)];

    if (Math.random() < 0.5) {
        let box = new Box(_rand.color, _rand.mass, Math.random() + 0.1);
        box.body.position.set(
            Math.random() * 18 - 9,
            Math.random() * 10 - 5 + 5,
            Math.random() * 18 - 9
        );
        game.Add(box);
    } else {
        let sphere = new Sphere(
            _rand.color,
            _rand.mass,
            (Math.random() + 0.2) / 2
        );
        sphere.body.position.set(
            Math.random() * 18 - 9,
            Math.random() * 10 - 5 + 5,
            Math.random() * 18 - 9
        );
        game.Add(sphere);
    }
}

function animate() {
    requestAnimationFrame(animate);
    cannonDebugRenderer.update();
    player.Update();
    game.Update();
}

function UpdateResize() {
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();
