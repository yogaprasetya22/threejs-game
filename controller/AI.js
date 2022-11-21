import "../style.css";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import CannonDebugger from "cannon-es-debugger";

var camera, scene, renderer, mesh, goal;

var time = 0;
var newPosition = new THREE.Vector3();
var matrix = new THREE.Matrix4();

var stop = 1;
var DEGTORAD = 0.01745327;
var temp = new THREE.Vector3();

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        10
    );
    camera.position.set(0, 2, -2);

    scene = new THREE.Scene();
    camera.lookAt(scene.position);

    var geometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2);
    var material = new THREE.MeshNormalMaterial();

    mesh = new THREE.Mesh(geometry, material);

    goal = new THREE.Object3D();

    mesh.add(goal);
    scene.add(mesh);

    goal.position.set(0, 2, -2);

    var gridHelper = new THREE.GridHelper(4, 10);
    scene.add(gridHelper);

    scene.add(new THREE.AxesHelper());

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function animate() {
    requestAnimationFrame(animate);

    time += 0.01;

    if (time > stop) {
        mesh.rotateY(Math.random() * 360 * DEGTORAD);

        stop = time + Math.random() * 1;
    }
    mesh.translateZ(0.01);

    temp.setFromMatrixPosition(goal.matrixWorld);

    camera.position.lerp(temp, 0.2);
    camera.lookAt(mesh.position);

    renderer.render(scene, camera);
}
