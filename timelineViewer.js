class Timeline {
  #focusDate = new Date();
  #scaleType = "year";
  #focusX = 100;
  #scaleWidth = 100; // in pixels
  constructor() {}
  setFocusDate(focusDate) {
    if (!(focusDate instanceof Date)) {
      throw new Error("focusDate must be an instance of the Date class.");
    }
    this.#focusDate = focusDate;
  }
  setScaleType(scaleType) {
    const validScaleTypes = [
      "millennium",
      "century",
      "decade",
      "year",
      "month",
      "day",
      "hour",
      "second",
      "millisecond",
    ];
    if (!validScaleTypes.includes(scaleType)) {
      throw new Error(
        "Invalid scaleType, scaleType cannot be '" + scaleType + "' must be " + validScaleTypes
      );
    }
    this.#scaleType = scaleType;
  }

  draw(ctx, canvas, focusDate, scaleType, focusX, scaleWidth) {
    this.setFocusDate(focusDate);
    this.setScaleType(scaleType);
    this.#focusX = focusX;
  }
}

function drawCenterAxis(ctx, maxX, maxY, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(maxX / 2, 0);
  ctx.lineTo(maxX / 2, maxY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, maxY / 2);
  ctx.lineTo(maxX, maxY / 2);
  ctx.stroke();
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

  canvas.width = window.innerWidth - 10;
  canvas.height = 1000;

  const timeline = new Timeline();
  let focusDate = new Date(2018, 11, 24, 10, 33, 30, 12);
  let scaleType = "year";
  let focusX = canvas.width / 2;
  let scaleWidth = 100;
  timeline.draw(ctx, canvas, focusDate, scaleType, focusX, scaleWidth);

  drawCenterAxis(ctx, canvas.width, canvas.height, "blue");
}

window.addEventListener("load", setupCanvas);
window.addEventListener("resize", setupCanvas);
