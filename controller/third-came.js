import "../style.css";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
class ClassDasar {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this._keyboard = {
            w: false,
            a: false,
            s: false,
            d: false,
            // space: false,
            shiftleft: false,
        };
        this._player = { height: 2.8, speed: 0.08, turnSpeed: Math.PI * 0.02 };

        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: document.getElementById("app"),
            alpha: true,
        });

        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.BasicShadowMap;

        this._renderer.setSize(window.innerWidth, window.innerHeight);

        window.addEventListener(
            "resize",
            () => {
                this._OnWindowResize();
            },
            false
        );
        
        const fov = 75;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.01;
        const far = 1000;
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        this._camera.position.set(0, this._player.height, 0);
        this._camera.lookAt(this._scene.position);

        let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this._scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8, 18);
        pointLight.position.set(-3, 6, -3);
        pointLight.castShadow = true;
        pointLight.shadow.camera.near = 0.1;
        pointLight.shadow.camera.far = 25;
        this._scene.add(pointLight);

        this._mesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color("#5EDCAE"),
                wireframe: true,
                roughness: 0.7,
                metalness: 0.0,
            })
        );
        this._mesh.receiveShadow = true;
        this._mesh.castShadow = true;
        this._mesh.position.y += 1;

        this._meshFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20, 10, 10),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color("#572CAB"),
                wireframe: false,
            })
        );
        this._meshFloor.receiveShadow = true;
        this._meshFloor.rotation.x -= Math.PI / 2;
        this._scene.add(this._meshFloor);

        this._goal = new THREE.Object3D();
        this._follow = new THREE.Object3D();
        this._follow.position.z = -this._player.height;

        this._mesh.add(this._follow);
        this._goal.add(this._camera);
        this._scene.add(this._mesh);

        this._gridHelper = new THREE.GridHelper(20, 20);
        this._scene.add(this._gridHelper);

        // this._controls = new OrbitControls(
        //     this._camera,
        //     this._renderer.domElement
        // );
        // this._controls.dampingFactor = 0.05;
        // this._controls.screenSpacePanning = false;
        // this._controls.minDistance = 1;
        // this._controls.maxDistance = 500;
        // this._controls.zoomOnMouseWheel = true;
        // this._controls.maxPolarAngle = Math.PI / 2;

        document.addEventListener("keydown", (event) => {
            const key = event.code.replace("Key", "").toLowerCase();
            if (this._keyboard[key] !== undefined) {
                this._keyboard[key] = true;
            }
        });

        document.addEventListener("keyup", (event) => {
            const key = event.code.replace("Key", "").toLowerCase();
            if (this._keyboard[key] !== undefined) {
                this._keyboard[key] = false;
            }
        });

        this._REF();
    }
    _OnWindowResize() {
        (this._camera.aspect = window.innerWidth / window.innerHeight),
            this._camera.updateProjectionMatrix(),
            this._renderer.setSize(window.innerWidth, window.innerHeight);
    }
    _REF() {
        requestAnimationFrame(() => {
            let speed = 0.0;
            let velocity = 0.0;

            if (this._keyboard.w) {
                speed = this._player.speed;
                if (this._keyboard.shiftleft) {
                    speed = this._player.speed * 2;
                }
            } else if (this._keyboard.s) {
                speed = -this._player.speed;
                if (this._keyboard.shiftleft) {
                    speed = -this._player.speed * 2;
                }
            }

            velocity += (speed - velocity) * 0.7;
            this._mesh.translateZ(velocity);

            if (this._keyboard.a) {
                this._mesh.rotateY(this._player.turnSpeed);
            }
            if (this._keyboard.d) {
                this._mesh.rotateY(-this._player.turnSpeed);
            }

            let a = new THREE.Vector3().lerp(this._mesh.position, 0.4);
            let b = new THREE.Vector3().copy(this._goal.position);
            let temp = new THREE.Vector3();

            const dir = new THREE.Vector3().copy(a).sub(b).normalize();
            const dis = a.distanceTo(b) - this._player.height;
            console.log("dis: ", dis, "\ndir: ", dir);
            this._goal.position.addScaledVector(dir, dis);
            this._goal.position.lerp(temp, 0.02);
            temp.setFromMatrixPosition(this._follow.matrixWorld);
            this._camera.lookAt(this._mesh.position);

            this._renderer.render(this._scene, this._camera);
            this._REF();
        });
    }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
    _APP = new ClassDasar();
});
