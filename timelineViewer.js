class Timeline {
  constructor() {}
}

function setupCanvas() {
  const canvas = document.getElementById("timeline-canvas");

  if (!canvas) {
    console.error("Element with ID 'timeline-canvas' not found!");
    return;
  }

  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("Element with ID 'timeline-canvas' is not a valid <canvas> element.");
    return;
  }

  const ctx = canvas.getContext("2d");
  const timeline = new Timeline();

  canvas.width = window.innerWidth;
  canvas.height = 1000;
}

window.addEventListener("load", setupCanvas);
window.addEventListener("resize", setupCanvas);
