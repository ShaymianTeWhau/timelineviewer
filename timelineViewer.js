function setupCanvas() {
  const canvas = document.getElementById("timeline-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = document.body.clientWidth;
  canvas.height = 1000;
}

window.addEventListener("load", setupCanvas);
window.addEventListener("resize", setupCanvas);
