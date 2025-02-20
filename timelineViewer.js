function getFocusValue(date, scaleType, increment) {
  let value;
  const validScaleTypes = [
    "millennium",
    "century",
    "decade",
    "year",
    "month",
    "date",
    "hour",
    "minute",
    "second",
    "millisecond",
  ];
  if (!validScaleTypes.includes(scaleType)) {
    throw new Error(
      "Invalid scaleType, scaleType cannot be '" + scaleType + "' must be " + validScaleTypes
    );
  }
  switch (scaleType) {
    case "millennium":
      value = date.getFullYear() + increment * 1000;
      break;
    case "century":
      value = date.getFullYear() + increment * 100;
      break;
    case "decade":
      value = date.getFullYear() + increment * 10;
      break;
    case "year":
      value = date.getFullYear() + increment * 1;
      break;
    case "month":
      value = date.getMonth() + increment * 1;
      break;
    case "date":
      value = date.getDate() + increment * 1;
      break;
    case "hour":
      value = date.getHours() + increment * 1;
      break;
    case "minute":
      value = date.getMinutes() + increment * 1;
      break;
    case "second":
      value = date.getSeconds() + increment * 1;
      break;
    case "millisecond":
      value = date.getMilliseconds() + increment * 1;
      break;
  }
  return value;
}

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
      "date",
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

    let linesAboveCenterValue = [];
    let linesBelowCenterX = [];

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "20px Arial";

    // draw lines above focusPoint (including focus point)
    let pixelDistanceFromFocus = 0;
    let curGridLineX = 0;
    let linesAboveCenter = 0;
    while (curGridLineX < canvas.width) {
      curGridLineX = focusX + pixelDistanceFromFocus;

      let CurValue = getFocusValue(this.#focusDate, this.#scaleType, linesAboveCenter);
      ctx.fillText(CurValue, curGridLineX, 80);

      // draw line
      ctx.beginPath();
      ctx.moveTo(curGridLineX, 0);
      ctx.lineTo(curGridLineX, canvas.height);
      ctx.stroke();
      pixelDistanceFromFocus += scaleWidth;
      linesAboveCenter++;
    }

    // draw lines below focus point (does not include focus point)
    pixelDistanceFromFocus = scaleWidth;
    curGridLineX = canvas.width; // arbitrary number rightside of canvas
    let linesBelowCenter = 0;
    while (curGridLineX > 0) {
      linesBelowCenter++;
      curGridLineX = focusX - pixelDistanceFromFocus;

      let CurValue = getFocusValue(this.#focusDate, this.#scaleType, -linesBelowCenter);
      ctx.fillText(CurValue, curGridLineX, 80);

      // draw line
      ctx.beginPath();
      ctx.moveTo(curGridLineX, 0);
      ctx.lineTo(curGridLineX, canvas.height);
      ctx.stroke();

      pixelDistanceFromFocus += scaleWidth;
    }
    console.log("lines above center (including center): " + linesAboveCenter);
    console.log("lines below center: " + linesBelowCenter);
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
  let focusDate = new Date(2000, 11, 29, 10, 33, 30, 12);
  let scaleType = "date";
  let focusX = canvas.width / 2;
  let scaleWidth = 200;
  timeline.draw(ctx, canvas, focusDate, scaleType, focusX, scaleWidth);

  //drawCenterAxis(ctx, canvas.width, canvas.height, "blue");
}

window.addEventListener("load", setupCanvas);
window.addEventListener("resize", setupCanvas);
