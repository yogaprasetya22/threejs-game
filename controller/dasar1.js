import "../style.css";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import CannonDebugger from "cannon-es-debugger";

class ClassDasar {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this._keyboard = {};
        this._player = { height: 8.8, speed: 0.2, turnSpeed: Math.PI * 0.02 };

        const fov = 45;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 1000;

        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(0, this._player.height, -20);
        this._camera.lookAt(new THREE.Vector3(0, this._player.height, 0));

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

        this._scene = new THREE.Scene();

        this._axiesHelper = new THREE.AxesHelper(8);
        // this._scene.add(this._axiesHelper);

        let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this._scene.add(ambientLight);

        // const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
        // directionalLight.castShadow = true;
        // directionalLight.shadow.mapSize.set(1024, 1024);
        // directionalLight.shadow.camera.far = 15;
        // directionalLight.shadow.normalBias = 0.05;
        // directionalLight.position.set(0.25, 2, 2.25);
        // this._scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8, 18);
        pointLight.position.set(-3, 6, -3);
        pointLight.castShadow = true;
        pointLight.shadow.camera.near = 0.1;
        pointLight.shadow.camera.far = 25;
        this._scene.add(pointLight);

        this._physicWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0),
        });

        this._groundBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            type: CANNON.Body.STATIC,
        });

        this._groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );

        this._physicWorld.addBody(this._groundBody);

        this._cannonDebuger = new CannonDebugger(
            this._scene,
            this._physicWorld,
            {
                color: 0x0000ff,
            }
        );

        // ubin
        this._meshFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20, 10, 10),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color("#572CAB"),
                wireframe: false,
            })
        );
        this._meshFloor.rotation.x -= Math.PI / 2;
        this._meshFloor.receiveShadow = true;
        this._scene.add(this._meshFloor);

        // Bola
        this._radius = 1;
        this._sphereBody = new CANNON.Body({
            mass: 5,
            shape: new CANNON.Sphere(this._radius),
        });
        this._sphereBody.position.set(0, 7, 0);
        this._physicWorld.addBody(this._sphereBody);

        this._sphere = new THREE.Mesh(
            new THREE.SphereGeometry(this._radius, 32, 32),
            new THREE.MeshPhongMaterial({
                color: 0x00fff0,
                // wireframe: true,
            })
        );
        this._sphere.castShadow = true;
        this._sphere.receiveShadow = true;
        this._sphere.add(new THREE.AxesHelper(2));
        this._scene.add(this._sphere);

        //    kotak
        this._boxBody = new CANNON.Body({
            mass: 5,
            shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
        });
        this._boxBody.position.set(1, 17, 0);
        this._physicWorld.addBody(this._boxBody);

        this._box = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshPhongMaterial({
                color: 0x00fff0,
                // wireframe: true,
            })
        );
        this._box.castShadow = true;
        this._box.receiveShadow = true;
        this._box.add(new THREE.AxesHelper(2));
        this._scene.add(this._box);

        // this._colorMesh = new MTLLoader();
        // this._colorMesh.load("../model/barrelOpen.mtl", (materials) => {
        //     materials.preload();
        //     this._objLoader = new OBJLoader();
        //     this._objLoader.setMaterials(materials);
        //     this._objLoader.load("../model/barrelOpen.obj", (object) => {
        //         object.traverse((child) => {
        //             if (child instanceof THREE.Mesh) {
        //                 child.castShadow = true;
        //                 child.receiveShadow = true;
        //             }
        //         });
        //         object.position.set(0, 0.1, 0);
        //         object.scale.set(2.5, 2.5, 2.5);
        //         this._scene.add(object);
        //     });
        // });

        // this._mesh = new THREE.Mesh(
        //     new THREE.SphereGeometry(1, 32, 32),
        //     new THREE.MeshPhongMaterial({
        //         color: new THREE.Color("#5EDCAE"),
        //         wireframe: true,
        //     })
        // );
        // this._mesh.position.y += 1.2;
        // this._mesh.receiveShadow = true;
        // this._mesh.castShadow = true;
        // this._scene.add(this._mesh);

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
    _OnWindowResize() {
        (this._camera.aspect = window.innerWidth / window.innerHeight),
            this._camera.updateProjectionMatrix(),
            this._renderer.setSize(window.innerWidth, window.innerHeight);
    }
    _REF() {
        requestAnimationFrame(() => {
            this._physicWorld.fixedStep();
            // this._cannonDebuger.update();
            this._box.quaternion.copy(this._boxBody.quaternion);
            this._box.position.copy(this._boxBody.position);
            this._sphere.quaternion.copy(this._sphereBody.quaternion);
            this._sphere.position.copy(this._sphereBody.position);
            this._renderer.render(this._scene, this._camera);
            this._controls.update();
            this._REF();
        });
    }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
    _APP = new ClassDasar();
});
