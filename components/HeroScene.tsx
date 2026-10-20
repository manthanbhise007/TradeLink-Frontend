"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Decorative 3D background for the home hero: a glossy torus knot inside a wireframe
 * shell, orbiting gold "coins" and a drifting particle field. Reacts to the pointer.
 * Pauses off-screen and renders a single static frame for prefers-reduced-motion.
 */
export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // No WebGL: the gradient hero still looks fine.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xc7d2fe, 2.6);
    key.position.set(4, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xfbbf24, 1.6);
    rim.position.set(-5, -3, 3);
    scene.add(rim);

    const hero = new THREE.Group();
    scene.add(hero);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.0, 0.32, 180, 24),
      new THREE.MeshStandardMaterial({ color: 0x818cf8, metalness: 0.35, roughness: 0.3 })
    );
    hero.add(knot);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.3, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.22 })
    );
    hero.add(shell);

    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.09, 40);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.55, roughness: 0.3 });
    const coins = Array.from({ length: 6 }, (_, i) => {
      const mesh = new THREE.Mesh(coinGeo, coinMat);
      hero.add(mesh);
      return { mesh, radius: 2.7 + (i % 3) * 0.35, speed: 0.25 + (i % 3) * 0.08, phase: (i / 6) * Math.PI * 2, y: (i - 2.5) * 0.45 };
    });

    const COUNT = 500;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.55, depthWrite: false })
    );
    scene.add(particles);

    const pointer = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const render = (t: number) => {
      smooth.x += (pointer.x - smooth.x) * 0.05;
      smooth.y += (pointer.y - smooth.y) * 0.05;

      knot.rotation.x = t * 0.25;
      knot.rotation.y = t * 0.35;
      shell.rotation.y = -t * 0.12;
      shell.rotation.x = t * 0.07;
      hero.rotation.y = smooth.x * 0.5;
      hero.rotation.x = smooth.y * 0.3;
      hero.position.y = Math.sin(t * 0.8) * 0.12;
      particles.rotation.y = t * 0.012;

      coins.forEach((c) => {
        const a = t * c.speed + c.phase;
        c.mesh.position.set(Math.cos(a) * c.radius, c.y + Math.sin(t + c.phase) * 0.15, Math.sin(a) * c.radius);
        c.mesh.rotation.x = t * 0.9 + c.phase;
        c.mesh.rotation.z = t * 0.6;
      });

      renderer.render(scene, camera);
    };

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const wide = camera.aspect > 1.3;
      hero.position.x = wide ? 3.0 : 0;
      hero.scale.setScalar(wide ? 1 : 0.7);
      mount.style.opacity = wide ? "1" : "0.35"; // keep hero text legible on narrow screens
      if (reduceMotion) render(2);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(mount);

    if (!reduceMotion) {
      const start = performance.now();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (visible && !document.hidden) render((performance.now() - start) / 1000);
      };
      loop();
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, []);

  return <div ref={mountRef} aria-hidden className="pointer-events-none absolute inset-0 transition-opacity" />;
}
