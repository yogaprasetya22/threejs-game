import "../style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

class ClassDasar {
    constructor() {
        this._Initialize();
        this._BOTAI();
        this._LINGKUNGAN();
        this._link();
    }

    _Initialize() {
        const fov = 70;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.01;
        const far = 1000;

        this._models = {
            tenda: {
                obj: "./model/tentClosed.obj",
                mtl: "./model/tentClosed.mtl",
                x: -4.5,
                y: -0.5,
                z: 1.5,
                mesh: null,
            },
            tong: {
                obj: "./model/barrelOpen.obj",
                mtl: "./model/barrelOpen.mtl",
                x: 6.5,
                y: -0.5,
                z: -3.5,
                mesh: null,
            },
            jemuran: {
                obj: "./model/structureCloth.obj",
                mtl: "./model/structureCloth.mtl",
                x: 3.5,
                y: -0.5,
                z: 6.5,
                mesh: null,
            },
        };
        this._loadingScreen = {
            scene: new THREE.Scene(),
            camera: new THREE.PerspectiveCamera(fov, aspect, near, far),
            box: new THREE.Mesh(
                new THREE.SphereGeometry(1, 32, 32),
                new THREE.MeshBasicMaterial({
                    color: 0x4444ff,
                    wireframe: true,
                })
            ),
        };
        this._camera = undefined;
        this._scene = undefined;
        this._renderer = undefined;
        this._mesh = undefined;
        this._character = undefined;
        this._goal = undefined;
        this._follow = undefined;
        this._meshes = {};
        this._loading = null;
        this._resource_load = false;
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
            space: false,
        };
        this._player = {
            top: 1.2,
            height: 3.8,
            speed: 0.1,
            turnSpeed: Math.PI * 0.02,
        };

        // muali

        this._scene = new THREE.Scene();

        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(0, this._player.height, 0);
        this._camera.lookAt(this._scene.position);

        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: document.getElementById("app"),
            alpha: true,
        });

        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.BasicShadowMap;
        this._renderer.setSize(window.innerWidth, window.innerHeight);

        this._loadingScreen.box.position.set(0, 0, 5);
        this._loadingScreen.camera.lookAt(this._loadingScreen.box.position);
        this._loadingScreen.scene.add(this._loadingScreen.box);

        this._loading = new THREE.LoadingManager();
        this._loading.onProgress = (item, loaded, total) => {
            console.log(item, loaded, total);
        };
        this._loading.onLoad = () => {
            console.log("Loading Complete");
            this._resource_load = true;
            this._onLoadLingkungan();
        };

        let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this._scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.6, 328);
        pointLight.position.set(-3, 30, -3);
        pointLight.castShadow = true;
        pointLight.shadow.camera.near = 0.3;
        pointLight.shadow.camera.far = 552;
        pointLight.shadow.mapSize.width = 1024;
        pointLight.shadow.mapSize.height = 1024;
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
        this._mesh.scale.set(0.6, 0.6, 0.6);
        this._mesh.position.set(0, this._player.top - 1, 0);
        this._mesh.add(new THREE.AxesHelper(2));

        this._character = new OBJLoader().load(
            "./model/conz.obj",
            (object) => {
                object.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                object.receiveShadow = true;
                object.castShadow = true;
                object.scale.set(0.6, 0.6, 0.6);
                object.position.set(0, this._player.top - 1.3, 0);
                object.add(new THREE.AxesHelper(2));
                this._scene.add(object);
            }
        );

        this._goal = new THREE.Object3D();
        this._follow = new THREE.Object3D();
        this._follow.position.z = -this._player.height;

        this._mesh.add(this._follow);
        this._goal.add(this._camera);
        this._scene.add(this._mesh);

        this._meshFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 10, 10),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color("#572CAB"),
                wireframe: false,
            })
        );
        this._meshFloor.receiveShadow = true;
        this._meshFloor.rotation.x -= Math.PI / 2;
        this._meshFloor.position.y -= 0.5;
        this._meshFloor.add(
            new THREE.GridHelper(100, 100, "#ef00ff", "#ef00ff").rotateX(
                -Math.PI / 2
            )
        );
        this._scene.add(this._meshFloor);

        window.addEventListener(
            "resize",
            () => {
                this._OnWindowResize();
            },
            false
        );
        document.addEventListener("keydown", (event) => {
            const key = event.code.replace("Key", "").toLowerCase();
            // console.log(key);
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

        console.log(this._meshes);

        this._REF();
    }

    _BOTAI() {
        this._aigoal = undefined;
        this._aiMesh = undefined;
        this._jumlahBot = {};
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
        const random = Math.round(Math.random())
            ? -Math.floor(Math.random() * 6 + 1)
            : Math.floor(Math.random() * 6 + 1);
        this._aiMesh.position.set(random, 0, random);
        this._aiMesh.add(new THREE.AxesHelper(1.2));

        this._aigoal = new THREE.Object3D();

        this._aiMesh.add(this._aigoal);
        this._scene.add(this._aiMesh);

        // this._aigoal.position.set(25, 2, -2);
    }

    _LINGKUNGAN() {
        const scene = this._scene;
        const models = this._models;
        for (let _model in models) {
            (function (key) {
                new MTLLoader().load(models[key].mtl, (materials) => {
                    materials.preload();
                    const objLoader = new OBJLoader();
                    objLoader.setMaterials(materials);
                    objLoader.load(models[key].obj, (object) => {
                        object.traverse((child) => {
                            if (child instanceof THREE.Mesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        object.position.set(
                            models[key].x,
                            models[key].y,
                            models[key].z
                        );
                        object.scale.set(3.5, 3.5, 3.5);
                        scene.add(object);
                        models[key].mesh = object;
                    });
                });
            })(_model);
        }
    }

    _onLoadLingkungan() {
        this._meshes["tenda"] = this._models.tenda.mesh.clone();
        this._meshes["tong"] = this._models.tong.mesh.clone();
        this._meshes["tong1"] = this._models.tong.mesh.clone();
        this._meshes["tong2"] = this._models.tong.mesh.clone();
        this._meshes["jemuran"] = this._models.jemuran.mesh.clone();

        this._meshes["tenda"].position.set(3, 0, -2);
        this._meshes["tenda"].scale.set(5, 5, 5);
        this._meshes["tenda"].rotation.y = Math.PI / 4;
        this._scene.add(this._meshes["tenda"]);
        this._meshes["tong"].position.set(5, 0, -4);
        this._meshes["tong"].scale.set(5, 5, 5);
        this._meshes["tong"].rotation.y = -Math.PI / 4;
        this._scene.add(this._meshes["tong"]);
        this._meshes["tong1"].position.set(-5, 0, -4);
        this._meshes["tong1"].scale.set(5, 5, 5);
        this._meshes["tong1"].rotation.y = -Math.PI / 4;
        this._scene.add(this._meshes["tong1"]);
        this._meshes["tong2"].position.set(-2, 0, -4);
        this._meshes["tong2"].scale.set(5, 5, 5);
        this._meshes["tong2"].rotation.y = -Math.PI / 4;
        this._scene.add(this._meshes["tong2"]);

        this._meshes["jemuran"].position.set(-3, 0, -5);
        this._meshes["jemuran"].scale.set(5, 5, 5);
        this._meshes["jemuran"].rotation.y = -Math.PI / 4;
        this._scene.add(this._meshes["jemuran"]);
    }

    _link() {
        document.getElementById("add").innerHTML = `
         <div class="container">
    <div class="github">
      <a href="https://github.com/yogaprasetya22/threejs-game" target="_blank">
        <img src="./assets/github.png" alt="github"> Github
      </a>
    </div>
  </div> 
        `;
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
            if (this._keyboard.space) this._mesh.position.y += 0.1;

            this._a.lerp(this._mesh.position, 0.4);
            this._b.copy(this._goal.position);

            this._dir.copy(this._a).sub(this._b).normalize();
            const dis = this._a.distanceTo(this._b) - this._player.height;
            this._goal.position.addScaledVector(this._dir, dis);
            this._goal.position.lerp(this._temp, 0.064);
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

        // loadlingkungan
        if (this._resource_load == false) {
            requestAnimationFrame(() => {
                this._loadingScreen.box.position.z -= Math.PI / 80;
                this._loadingScreen.box.rotation.y = Math.sin(
                    this._loadingScreen.box.position.z / 2
                );
                this._renderer.render(this._scene, this._camera);
                // this._REF();
                return;
            });
        }
    }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
    _APP = new ClassDasar();
});
