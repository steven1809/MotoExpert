import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const COLOR_OPTIONS = [
  { hex: '#1a1a2e', label: 'Azul noche' },
  { hex: '#8B0000', label: 'Rojo deportivo' },
  { hex: '#F0F0F0', label: 'Blanco perla' },
  { hex: '#1a1a1a', label: 'Negro mate' },
  { hex: '#003366', label: 'Azul cobalto' },
];

export default function Car3D() {
  const mountRef = useRef(null);
  const rafRef = useRef(0);
  const resizeObserverRef = useRef(null);

  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const angularVelocityRef = useRef(0);

  const targetColorRef = useRef(new THREE.Color('#1a1a2e'));
  const currentColorRef = useRef(new THREE.Color('#1a1a2e'));

  const materialsRef = useRef({
    paint: null,
  });

  const wheelGroupsRef = useRef([]);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);

  const [selectedColor, setSelectedColor] = useState('#1a1a2e');

  const containerStyle = useMemo(
    () => ({
      height: '480px',
      background: 'transparent',
      borderRadius: '1rem',
      overflow: 'hidden',
    }),
    []
  );

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = null;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.borderRadius = '1rem';

    mountEl.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xffffff, 2.8);
    dir1.position.set(8, 12, 8);
    dir1.castShadow = true;
    dir1.shadow.mapSize.width = 1024;
    dir1.shadow.mapSize.height = 1024;
    dir1.shadow.camera.near = 1;
    dir1.shadow.camera.far = 30;
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x4466ff, 1.0);
    dir2.position.set(-6, 8, -4);
    scene.add(dir2);

    const dir3 = new THREE.DirectionalLight(0xffffff, 1.2);
    dir3.position.set(0, 5, 10);
    scene.add(dir3);

    const car = new THREE.Group();
    car.rotation.y = 0.6;
    scene.add(car);

    const paintMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a1a2e'),
      metalness: 0.9,
      roughness: 0.1,
    });
    materialsRef.current.paint = paintMaterial;

    const blackMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#111111'),
      metalness: 0.25,
      roughness: 0.85,
    });
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#888888'),
      metalness: 1,
      roughness: 0,
    });
    const exhaustMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#333333'),
      metalness: 1,
      roughness: 0.25,
    });
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#cccccc'),
      metalness: 1,
      roughness: 0.1,
    });
    const spokeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#aaaaaa'),
      metalness: 0.9,
      roughness: 0.25,
    });
    const ferrariRedMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ff2200'),
      metalness: 0.6,
      roughness: 0.35,
    });

    const baseBody = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.25, 2.1), paintMaterial);
    baseBody.castShadow = true;
    baseBody.receiveShadow = true;
    baseBody.position.y = 0.1;
    car.add(baseBody);

    const skirtLeft = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.15, 0.12), paintMaterial);
    skirtLeft.position.set(0, 0.05, 1.05);
    skirtLeft.castShadow = true;
    skirtLeft.receiveShadow = true;
    car.add(skirtLeft);

    const skirtRight = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.15, 0.12), paintMaterial);
    skirtRight.position.set(0, 0.05, -1.05);
    skirtRight.castShadow = true;
    skirtRight.receiveShadow = true;
    car.add(skirtRight);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 1.95), paintMaterial);
    hood.position.set(-1.3, 0.28, 0);
    hood.rotation.x = 0.08;
    hood.castShadow = true;
    hood.receiveShadow = true;
    car.add(hood);

    const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 1.95), paintMaterial);
    rearDeck.position.set(1.7, 0.32, 0);
    rearDeck.castShadow = true;
    rearDeck.receiveShadow = true;
    car.add(rearDeck);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 1.85), paintMaterial);
    cabin.position.set(0.3, 0.58, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    car.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 1.7), paintMaterial);
    roof.position.set(0.2, 0.82, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    car.add(roof);

    const glassMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#aaddff'),
      opacity: 0.35,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const windshieldFront = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.52), glassMaterial);
    windshieldFront.rotation.x = -1.1;
    windshieldFront.position.set(-0.35, 0.72, 0);
    car.add(windshieldFront);

    const windshieldRear = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), glassMaterial);
    windshieldRear.rotation.x = 1.3;
    windshieldRear.position.set(0.95, 0.68, 0);
    car.add(windshieldRear);

    const windowLeft = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.32), glassMaterial);
    windowLeft.rotation.y = Math.PI / 2;
    windowLeft.position.set(0.25, 0.65, 0.93);
    car.add(windowLeft);

    const windowRight = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.32), glassMaterial);
    windowRight.rotation.y = -Math.PI / 2;
    windowRight.position.set(0.25, 0.65, -0.93);
    car.add(windowRight);

    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 2.0), blackMaterial);
    frontBumper.position.set(-2.45, 0.18, 0);
    frontBumper.castShadow = true;
    frontBumper.receiveShadow = true;
    car.add(frontBumper);

    const intakeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.55), blackMaterial);
    intakeLeft.position.set(-2.3, 0.12, 0.6);
    intakeLeft.castShadow = true;
    intakeLeft.receiveShadow = true;
    car.add(intakeLeft);

    const intakeRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.55), blackMaterial);
    intakeRight.position.set(-2.3, 0.12, -0.6);
    intakeRight.castShadow = true;
    intakeRight.receiveShadow = true;
    car.add(intakeRight);

    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 1.5,
      metalness: 0.4,
      roughness: 0.2,
    });

    const headlightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.55), headlightMaterial);
    headlightLeft.position.set(-2.38, 0.3, 0.72);
    car.add(headlightLeft);
    const headlightLeftLight = new THREE.PointLight(0xffffff, 2, 6);
    headlightLeftLight.position.copy(headlightLeft.position);
    scene.add(headlightLeftLight);

    const headlightRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.55), headlightMaterial);
    headlightRight.position.set(-2.38, 0.3, -0.72);
    car.add(headlightRight);
    const headlightRightLight = new THREE.PointLight(0xffffff, 2, 6);
    headlightRightLight.position.copy(headlightRight.position);
    scene.add(headlightRightLight);

    const grilleChrome = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.6), chromeMaterial);
    grilleChrome.position.set(-2.4, 0.22, 0);
    grilleChrome.castShadow = true;
    grilleChrome.receiveShadow = true;
    car.add(grilleChrome);

    const taillightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ff0000'),
      emissive: new THREE.Color('#ff2200'),
      emissiveIntensity: 1.5,
      metalness: 0.2,
      roughness: 0.35,
    });

    const tailLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.6), taillightMaterial);
    tailLeft.position.set(2.42, 0.3, 0.72);
    car.add(tailLeft);
    const tailLeftLight = new THREE.PointLight(0xff2200, 1, 5);
    tailLeftLight.position.copy(tailLeft.position);
    scene.add(tailLeftLight);

    const tailRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.6), taillightMaterial);
    tailRight.position.set(2.42, 0.3, -0.72);
    car.add(tailRight);
    const tailRightLight = new THREE.PointLight(0xff2200, 1, 5);
    tailRightLight.position.copy(tailRight.position);
    scene.add(tailRightLight);

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 1.8), blackMaterial);
    diffuser.position.set(2.42, 0.1, 0);
    diffuser.castShadow = true;
    diffuser.receiveShadow = true;
    car.add(diffuser);

    const exhaustLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 16), exhaustMaterial);
    exhaustLeft.rotation.z = Math.PI / 2;
    exhaustLeft.position.set(2.35, 0.12, 0.5);
    exhaustLeft.castShadow = true;
    exhaustLeft.receiveShadow = true;
    car.add(exhaustLeft);

    const exhaustRight = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 16), exhaustMaterial);
    exhaustRight.rotation.z = Math.PI / 2;
    exhaustRight.position.set(2.35, 0.12, -0.5);
    exhaustRight.castShadow = true;
    exhaustRight.receiveShadow = true;
    car.add(exhaustRight);

    const spoilerSupportLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), blackMaterial);
    spoilerSupportLeft.position.set(1.95, 0.62, 0.65);
    spoilerSupportLeft.castShadow = true;
    spoilerSupportLeft.receiveShadow = true;
    car.add(spoilerSupportLeft);

    const spoilerSupportRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), blackMaterial);
    spoilerSupportRight.position.set(1.95, 0.62, -0.65);
    spoilerSupportRight.castShadow = true;
    spoilerSupportRight.receiveShadow = true;
    car.add(spoilerSupportRight);

    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 1.6), blackMaterial);
    spoilerWing.position.set(1.95, 0.82, 0);
    spoilerWing.castShadow = true;
    spoilerWing.receiveShadow = true;
    car.add(spoilerWing);

    const mirrorLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.28), new THREE.MeshStandardMaterial({ color: new THREE.Color('#222222'), metalness: 0.4, roughness: 0.6 }));
    mirrorLeft.position.set(-0.6, 0.72, 1.0);
    mirrorLeft.castShadow = true;
    mirrorLeft.receiveShadow = true;
    car.add(mirrorLeft);

    const mirrorRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.28), new THREE.MeshStandardMaterial({ color: new THREE.Color('#222222'), metalness: 0.4, roughness: 0.6 }));
    mirrorRight.position.set(-0.6, 0.72, -1.0);
    mirrorRight.castShadow = true;
    mirrorRight.receiveShadow = true;
    car.add(mirrorRight);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 8), chromeMaterial);
    antenna.position.set(0.5, 0.92, 0.6);
    antenna.castShadow = true;
    antenna.receiveShadow = true;
    car.add(antenna);

    const wheelPositions = [
      [-1.5, 0.0, 1.12, false],
      [-1.5, 0.0, -1.12, false],
      [1.6, 0.0, 1.12, true],
      [1.6, 0.0, -1.12, true],
    ];

    const makeWheel = (isRear) => {
      const g = new THREE.Group();

      const tireRadius = isRear ? 0.44 : 0.42;
      const tireWidth = isRear ? 0.38 : 0.32;

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 32), blackMaterial);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      tire.receiveShadow = true;
      g.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, tireWidth + 0.01, 32), rimMaterial);
      rim.rotation.x = Math.PI / 2;
      rim.castShadow = true;
      rim.receiveShadow = true;
      g.add(rim);

      for (let i = 0; i < 5; i += 1) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.04), spokeMaterial);
        spoke.rotation.z = (i * Math.PI * 2) / 5;
        spoke.castShadow = true;
        spoke.receiveShadow = true;
        g.add(spoke);
      }

      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, tireWidth + 0.02, 16), ferrariRedMaterial);
      center.rotation.x = Math.PI / 2;
      center.castShadow = true;
      center.receiveShadow = true;
      g.add(center);

      return g;
    };

    const wheels = wheelPositions.map((p) => {
      const w = makeWheel(p[3]);
      w.position.set(p[0], p[1], p[2]);
      car.add(w);
      return w;
    });
    wheelGroupsRef.current = wheels;

    const underGlow = new THREE.SpotLight(0xffffff, 0.5, 20, Math.PI / 2.8, 0.6, 1);
    underGlow.position.set(0, -2, 0);
    underGlow.target.position.set(0, 0.3, 0);
    scene.add(underGlow);
    scene.add(underGlow.target);

    const updateSize = () => {
      const width = mountEl.clientWidth || 1;
      const height = mountEl.clientHeight || 480;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    updateSize();

    const ro = new ResizeObserver(() => updateSize());
    resizeObserverRef.current = ro;
    ro.observe(mountEl);

    const onMouseLeave = () => {
      draggingRef.current = false;
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      draggingRef.current = true;
      lastXRef.current = e.clientX;
      angularVelocityRef.current = 0;
    };

    const onMouseMove = (e) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;

      const deltaRot = dx * 0.01;
      car.rotation.y += deltaRot;
      angularVelocityRef.current = deltaRot * 0.35;
    };

    const onMouseUp = () => {
      draggingRef.current = false;
    };

    const el = renderer.domElement;
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const animate = () => {
      const t = Date.now() * 0.001;

      camera.position.set(6, 2.5, 5);
      camera.lookAt(0, 0.3, 0);

      car.position.y = Math.sin(t) * 0.08;

      if (!draggingRef.current) {
        car.rotation.y += angularVelocityRef.current;
        angularVelocityRef.current *= 0.94;
        if (Math.abs(angularVelocityRef.current) < 0.0001) angularVelocityRef.current = 0;
      }

      const target = targetColorRef.current;
      const cur = currentColorRef.current;
      cur.lerp(target, 0.05);

      if (materialsRef.current.paint) materialsRef.current.paint.color.copy(cur);

      renderer.render(scene, camera);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);

      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      try {
        resizeObserverRef.current?.disconnect();
      } catch {}

      try {
        scene.traverse((obj) => {
          if (obj && obj.isMesh) {
            obj.geometry?.dispose?.();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m?.dispose?.());
            } else {
              obj.material?.dispose?.();
            }
          }
        });
      } catch {}

      try {
        renderer.dispose();
      } catch {}

      try {
        mountEl?.removeChild(renderer.domElement);
      } catch {}
    };
  }, []);

  return (
    <div className="w-full">
      <div ref={mountRef} style={containerStyle} />

      <div className="mt-6 flex items-center justify-center gap-4">
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c.hex}
            type="button"
            aria-label={c.label}
            onClick={() => {
              setSelectedColor(c.hex);
              targetColorRef.current.set(c.hex);
            }}
            className={`w-10 h-10 rounded-full border transition-all duration-200 ${
              selectedColor === c.hex ? 'border-blue-400 scale-110' : 'border-white/20 hover:border-white/50'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      <div className="text-gray-500 text-sm text-center mt-2">← Arrastra para girar →</div>
    </div>
  );
}
