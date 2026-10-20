"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type OrbTone = "live" | "upcoming" | "ended";
const TONES: Record<OrbTone, number> = { live: 0x34d399, upcoming: 0xfbbf24, ended: 0x64748b };

/**
 * A small 3D orb that sits behind the price. It slowly spins, changes colour with the
 * auction state and fires a shockwave ring + particle burst whenever `pulseKey` changes
 * (pass the bid count). Safe to render with no WebGL: it simply shows nothing.
 */
export default function BidOrb({ pulseKey, tone }: { pulseKey: number; tone: OrbTone }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const state = useRef({ pulseAt: -1, tone, lastKey: pulseKey });

  // Keep latest tone available to the render loop and fire a pulse on new bids.
  useEffect(() => { state.current.tone = tone; }, [tone]);
  useEffect(() => {
    if (state.current.lastKey !== pulseKey) {
      state.current.lastKey = pulseKey;
      state.current.pulseAt = performance.now();
    }
  }, [pulseKey]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 2.4);
    dir.position.set(3, 4, 5);
    scene.add(dir);

    const color = new THREE.Color(TONES[tone]);
    const orbMat = new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.25), flatShading: true, metalness: 0.3, roughness: 0.4 });
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), orbMat);
    scene.add(orb);

    const shellMat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.35 });
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 1), shellMat);
    scene.add(shell);

    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 64), ringMat);
    scene.add(ring);

    const N = 70;
    const burstPos = new Float32Array(N * 3);
    const burstVel = new Float32Array(N * 3);
    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute("position", new THREE.BufferAttribute(burstPos, 3));
    const burstMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0, depthWrite: false });
    const burst = new THREE.Points(bGeo, burstMat);
    scene.add(burst);

    let firedFor = -1;
    const fireBurst = () => {
      for (let i = 0; i < N; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.2 + Math.random() * 1.6;
        burstPos.set([0, 0, 0], i * 3);
        burstVel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        burstVel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        burstVel[i * 3 + 2] = Math.cos(phi) * speed;
      }
      bGeo.attributes.position.needsUpdate = true;
    };

    const target = new THREE.Color();
    const render = (t: number) => {
      target.set(TONES[state.current.tone]);
      color.lerp(target, 0.08);
      orbMat.color.copy(color);
      orbMat.emissive.copy(color).multiplyScalar(0.25);
      shellMat.color.copy(color);
      ringMat.color.copy(color);

      const pulseAt = state.current.pulseAt;
      const age = pulseAt < 0 ? 99 : (performance.now() - pulseAt) / 1000;
      if (pulseAt >= 0 && firedFor !== pulseAt) { firedFor = pulseAt; fireBurst(); }

      const kick = Math.exp(-age * 4) * 0.35;
      orb.scale.setScalar(1 + kick + Math.sin(t * 1.6) * 0.03);
      orb.rotation.y = t * 0.5;
      orb.rotation.x = t * 0.25;
      shell.rotation.y = -t * 0.3;
      shell.rotation.z = t * 0.15;

      const ringT = Math.min(age / 1.0, 1);
      ring.scale.setScalar(1 + ringT * 1.6);
      ringMat.opacity = age < 1 ? (1 - ringT) * 0.8 : 0;

      if (age < 1.3) {
        const dt = 1 / 60;
        for (let i = 0; i < N * 3; i++) burstPos[i] += burstVel[i] * dt;
        bGeo.attributes.position.needsUpdate = true;
        burstMat.opacity = Math.max(0, 1 - age / 1.3);
      } else {
        burstMat.opacity = 0;
      }

      renderer.render(scene, camera);
    };

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (reduceMotion) render(1);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(mount);

    const start = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (visible && !document.hidden) render((performance.now() - start) / 1000);
    };
    // Reduced motion: static frame only (pulse effects still render when a bid arrives).
    if (!reduceMotion) loop();
    else {
      const poll = setInterval(() => { if (state.current.pulseAt >= 0) render(1); }, 100);
      raf = poll as unknown as number;
    }

    return () => {
      if (reduceMotion) clearInterval(raf); else cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} aria-hidden className="pointer-events-none h-full w-full" />;
}
