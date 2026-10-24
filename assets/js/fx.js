// Characters above backgrounds: the floating, materialising ghosts and the parallax that moves them over the scene.
// Everything tunable lives in config.json > animation. Nothing here runs when motion is off (see app.js).

const finePointer = () => matchMedia("(hover: hover) and (pointer: fine)").matches;

// Pointer and scroll parallax for a scene. Layers read --mx/--my (-1..1) and --sy (px) from the scene element.
export function initParallax(scene, { pointerStrength = 0, scrollStrength = 0 } = {}) {
  scene.style.setProperty("--ptr", `${pointerStrength}px`);
  let frame = 0;
  let mx = 0, my = 0, sy = 0;
  const apply = () => {
    frame = 0;
    scene.style.setProperty("--mx", mx.toFixed(3));
    scene.style.setProperty("--my", my.toFixed(3));
    scene.style.setProperty("--sy", `${sy.toFixed(1)}px`);
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(apply); };

  if (pointerStrength && finePointer()) {
    scene.addEventListener("pointermove", (e) => {
      const r = scene.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      queue();
    });
    scene.addEventListener("pointerleave", () => { mx = 0; my = 0; queue(); });
  }
  if (scrollStrength) {
    const onScroll = () => {
      const r = scene.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;           // only while the scene is on screen
      sy = -r.top * scrollStrength;
      queue();
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
}

// Start the entrance (the ghosts materialise, then float) once the scene is on screen and its pictures have arrived.
export function startWhenVisible(scene, images) {
  const go = () => scene.classList.add("in");
  const ready = Promise.all(images.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())));
  if (!("IntersectionObserver" in window)) return ready.then(go);
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    ready.then(go);
  }, { threshold: 0.2 });
  io.observe(scene);
}
