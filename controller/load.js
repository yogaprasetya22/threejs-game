import "../style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { LoadingManager } from "three";

class ClassDasar {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        const fov = 45;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 1000;

        this._loadingScreen = {
            scene: new THREE.Scene(),
            camera: new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            ),
            box: new THREE.Mesh(
                new THREE.SphereGeometry(1, 32, 32),
                new THREE.MeshBasicMaterial({
                    color: 0x4444ff,
                    wireframe: true,
                })
            ),
        };

        this._models = {
            tenda: {
                obj: "../model/tentClosed.obj",
                mtl: "../model/tentClosed.mtl",
                mesh: null,
            },
            tong: {
                obj: "../model/barrelOpen.obj",
                mtl: "../model/barrelOpen.mtl",
                mesh: null,
            },
            jemuran: {
                obj: "../model/structureCloth.obj",
                mtl: "../model/structureCloth.mtl",
                mesh: null,
            },
        };
        this.loadingManager = null;
        this.resouceLoaded = false;
        let meshes = {};
        this._keyboard = {};
        this._player = { height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02 };

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

        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(0, this._player.height, -5);
        this._camera.lookAt(new THREE.Vector3(0, this._player.height, 0));

        this._scene = new THREE.Scene();

        // loaded
        this._loadingScreen.box.position.set(0, 0, 5);
        this._loadingScreen.camera.lookAt(this._loadingScreen.box.position);
        this._loadingScreen.scene.add(this._loadingScreen.box);

        const loadingManager = new LoadingManager();
        loadingManager.onProgress = (item, loaded, total) => {
            console.log(item, loaded, total);
        };
        loadingManager.onLoad = () => {
            console.log("Loading Complete");
            setTimeout(() => {
                this.resouceLoaded = true;
            }, 2000);
        };

        this._character = new OBJLoader(loadingManager).load(
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
                object.position.set(0, 1.4 - 1.3, 0);
                object.add(new THREE.AxesHelper(2));
                this._scene.add(object);
            }
        );

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
            })
        );
        this._mesh.receiveShadow = true;
        this._mesh.castShadow = true;
        this._mesh.position.y += 1;
        this._scene.add(this._mesh);

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

        const models = this._models;
        for (let _model in models)
            this._controls = new OrbitControls(
                this._camera,
                this._renderer.domElement
            );
        this._controls.dampingFactor = 0.05;
        this._controls.screenSpacePanning = false;
        this._controls.minDistance = 1;
        this._controls.maxDistance = 500;
        this._controls.zoomOnMouseWheel = true;
        this._controls.maxPolarAngle = Math.PI / 2;

        this._REF();
    }

    onResourcesLoaded() {}

    _OnWindowResize() {
        (this._camera.aspect = window.innerWidth / window.innerHeight),
            this._camera.updateProjectionMatrix(),
            this._renderer.setSize(window.innerWidth, window.innerHeight);
    }
    _REF() {
        const loading = this.resouceLoaded;
        requestAnimationFrame(() => {
            this._mesh.rotation.y += 0.01;
            this._renderer.render(this._scene, this._camera);
            this._REF();
        });
        if (loading == false) {
            requestAnimationFrame(() => {
                this._loadingScreen.box.rotation.y += 0.05;
                this._renderer.render(
                    this._loadingScreen.scene,
                    this._loadingScreen.camera
                );
                return;
            });
        }
    }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
    _APP = new ClassDasar();
});
