import "../style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

class ClassDasar {
    constructor() {
        this._Initialize();
        this._BOTAI();
    }

    _Initialize() {
        this._camera = undefined;
        this._scene = undefined;
        this._renderer = undefined;
        this._mesh = undefined;
        this._goal = undefined;
        this._follow = undefined;
        this._temp = new THREE.Vector3();
        this._dir = new THREE.Vector3();
        this._a = new THREE.Vector3();
        this._b = new THREE.Vector3();
        this._velocity = 0.0;
        this._speed = 0.0;
        this._keyboard = {
            a: false,
            s: false,
            d: false,
            w: false,
            shiftleft: false,
        };
        this._player = {
            top: 1.2,
            height: 3.8,
            speed: 0.1,
            turnSpeed: Math.PI * 0.02,
        };

        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: document.getElementById("app"),
            alpha: true,
        });

        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.BasicShadowMap;
        this._renderer.setSize(window.innerWidth, window.innerHeight);

        const fov = 70;
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
                wireframe: false,
            })
        );
        this._mesh.receiveShadow = true;
        this._mesh.castShadow = true;
        this._mesh.position.set(0, this._player.top - 1, 0);
        this._mesh.add(new THREE.AxesHelper(2));

        this._goal = new THREE.Object3D();
        this._follow = new THREE.Object3D();
        this._follow.position.z = -this._player.height;

        this._mesh.add(this._follow);
        this._goal.add(this._camera);
        this._scene.add(this._mesh);

        // const GridHelper = new THREE.GridHelper(40, 40);
        // this._scene.add(GridHelper);

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

        this._meshFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20, 10, 10),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color("#572CAB"),
                wireframe: false,
            })
        );
        this._meshFloor.receiveShadow = true;
        this._meshFloor.rotation.x -= Math.PI / 2;
        this._meshFloor.position.y -= 0.5;
        this._scene.add(this._meshFloor);

        window.addEventListener(
            "resize",
            () => {
                this._OnWindowResize();
            },
            false
        );

        this._REF();
    }

    _BOTAI() {
        this._aigoal = undefined;
        this._aiMesh = undefined;
        this.time = 0;
        this.newPosition = new THREE.Vector3();
        this.matrix = new THREE.Matrix4();

        this.stop = 1;
        this.dagratod = 0.01745327;
        this.temp = new THREE.Vector3();

        // const target = new THREE.Vector3();
        const AiboxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const AiboxMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this._aiMesh = new THREE.Mesh(AiboxGeometry, AiboxMaterial);
        this._aiMesh.castShadow = true;
        this._aiMesh.receiveShadow = true;
        this._aiMesh.add(new THREE.AxesHelper(1.2));

        this._aigoal = new THREE.Object3D();

        this._aiMesh.add(this._aigoal);
        this._scene.add(this._aiMesh);

        this._aigoal.position.set(0, 2, -2);
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
            } else if (this._keyboard.s) speed = -this._player.speed;

            velocity += (speed - velocity) * 0.7;
            this._mesh.translateZ(velocity);

            if (this._keyboard.a) this._mesh.rotateY(this._player.turnSpeed);
            if (this._keyboard.d) this._mesh.rotateY(-this._player.turnSpeed);

            this._a.lerp(this._mesh.position, 0.4);
            this._b.copy(this._goal.position);

            this._dir.copy(this._a).sub(this._b).normalize();
            const dis = this._a.distanceTo(this._b) - this._player.height;
            this._goal.position.addScaledVector(this._dir, dis);
            this._goal.position.lerp(this._temp, 0.04);
            this._temp.setFromMatrixPosition(this._follow.matrixWorld);

            this._camera.lookAt(this._mesh.position);

            // BOT AI
            this.time += 0.01;

            if (this.time > this.stop) {
                this._aiMesh.rotateY(Math.random() * 360 * this.dagratod);
                this.stop = this.time + Math.random() * 2;
            }
            this._aiMesh.translateZ(0.05);

            this._renderer.render(this._scene, this._camera);
            this._REF();
        });
    }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
    _APP = new ClassDasar();
});
