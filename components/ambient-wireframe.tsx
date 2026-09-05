"use client";

import { useEffect, useRef } from "react";
import type * as Three from "three";

// One switch makes the delight easy to disable or remove while the rest of the UI stays untouched.
export const AMBIENT_WIREFRAME_ENABLED = true;

export default function AmbientWireframe() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!AMBIENT_WIREFRAME_ENABLED) return;

    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: Three.WebGLRenderer | null = null;
    let scene: Three.Scene | null = null;
    let camera: Three.PerspectiveCamera | null = null;
    let rig: Three.Group | null = null;
    let model: Three.Group | null = null;

    const cleanup = () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      model?.traverse((object) => {
        if (!(object instanceof Object)) return;
        const mesh = object as Three.Mesh;
        if (mesh.geometry?.dispose) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else if (material?.dispose) material.dispose();
      });
      renderer?.dispose();
      renderer?.domElement.remove();
    };

    const setup = async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        if (disposed) return;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        camera.position.z = 7;
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        host.appendChild(renderer.domElement);

        rig = new THREE.Group();
        const accentColor = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c6ff19");
        model = (await new GLTFLoader().loadAsync("/ambient/dumbbell/scene.gltf")).scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const largestDimension = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(3.5 / largestDimension);
        model.position.set(-center.x, -center.y, -center.z);
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
          const lines = new THREE.LineSegments(
            new THREE.WireframeGeometry(object.geometry),
            new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.26, depthWrite: false }),
          );
          object.add(lines);
        });
        model.rotation.set(Math.PI * 0.16, Math.PI * 0.22, Math.PI * 0.08);
        rig.add(model);
        scene.add(rig);

        const resize = () => {
          if (!renderer || !camera) return;
          const width = host.clientWidth || window.innerWidth;
          const height = host.clientHeight || window.innerHeight;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };

        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const render = (time: number) => {
          if (!renderer || !scene || !camera || !rig || disposed) return;
          const seconds = time * 0.001;
          rig.rotation.x = seconds * 0.08;
          rig.rotation.y = seconds * 0.14;
          rig.position.y = Math.sin(seconds * 0.7) * 0.12;
          renderer.render(scene, camera);
          if (!reducedMotion) animationFrame = window.requestAnimationFrame(render);
        };

        render(0);
      } catch {
        // The background is optional; a missing WebGL context should never affect the app.
      }
    };

    void setup();
    return cleanup;
  }, []);

  if (!AMBIENT_WIREFRAME_ENABLED) return null;
  return <div ref={hostRef} className="ambient-wireframe" aria-hidden="true" />;
}
