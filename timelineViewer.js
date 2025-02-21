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

function getFocusDateAsValue(date, scaleType) {
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
      value = date.getFullYear();
      break;
    case "century":
      value = date.getFullYear();
      break;
    case "decade":
      value = date.getFullYear();
      break;
    case "year":
      value = date.getFullYear();
      break;
    case "month":
      value = date.getMonth();
      break;
    case "date":
      value = date.getDate();
      break;
    case "hour":
      value = date.getHours();
      break;
    case "minute":
      value = date.getMinutes();
      break;
    case "second":
      value = date.getSeconds();
      break;
    case "millisecond":
      value = date.getMilliseconds();
      break;
  }
  return value;
}

function incrementDateByScaleType(oldDate, scaleType, increment) {
  let newDate = new Date(oldDate);
  let year;

  switch (scaleType) {
    case "millennium":
      year = newDate.getFullYear() + increment * 1000;
      year = Math.floor(year / 1000) * 1000;
      newDate = new Date(year, 0);
      break;
    case "century":
      year = newDate.getFullYear() + increment * 100;
      year = Math.floor(year / 100) * 100;
      newDate = new Date(year, 0);
      break;
    case "decade":
      year = newDate.getFullYear() + increment * 10;
      year = Math.floor(year / 10) * 10;
      newDate = new Date(year, 0);
      break;
    case "year":
      year = newDate.getFullYear() + increment;
      newDate = new Date(year, 0);
      break;
    case "month":
      newDate.setDate(1);
      newDate.setHours(0);
      newDate.setMinutes(0);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      newDate.setMonth(newDate.getMonth() + increment);
      break;
    case "date":
      newDate.setHours(0);
      newDate.setMinutes(0);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      newDate.setDate(newDate.getDate() + increment);
      break;
    case "hour":
      newDate.setMinutes(0);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      newDate.setHours(newDate.getHours() + increment);
      break;
    case "minute":
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      newDate.setMinutes(newDate.getMinutes() + increment);
      break;
    case "second":
      newDate.setMilliseconds(0);
      newDate.setSeconds(newDate.getSeconds() + increment);
      break;
    case "millisecond":
      newDate.setMilliseconds(newDate.getMilliseconds() + increment);
      break;
  }
  //console.log("new date: " + newDate + " millisecond:" + newDate.getMilliseconds());
  return newDate;
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
      "minute",
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
    // temp code prevents crash if scale width is less than 1
    if (scaleWidth < 1) scaleWidth = 1;

    // clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.setFocusDate(focusDate);
    this.setScaleType(scaleType);
    this.#focusX = focusX;

    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "20px Arial";

    // draw lines above focusPoint (including focus point)
    let pixelDistanceFromFocus = 0;
    let curGridLineX = 0;
    let linesAboveFocus = 0;

    while (curGridLineX < canvas.width) {
      // temp color focus date and grid line
      if (linesAboveFocus == 0 && focusX < canvas.width) ctx.strokeStyle = "red";
      else ctx.strokeStyle = "black";

      curGridLineX = focusX + pixelDistanceFromFocus;

      let curDate = incrementDateByScaleType(this.#focusDate, this.#scaleType, linesAboveFocus);
      let curValue = getFocusDateAsValue(curDate, this.#scaleType);
      // temp
      if (this.#scaleType == "month")
        curValue = curDate.toLocaleString("default", { month: "long" });
      ctx.fillText(curValue, curGridLineX, 80);

      // draw line
      ctx.beginPath();
      ctx.moveTo(curGridLineX, 0);
      ctx.lineTo(curGridLineX, canvas.height);
      ctx.stroke();
      pixelDistanceFromFocus += scaleWidth;
      linesAboveFocus++;
    }

    // draw lines below focus point (does not include focus point)
    pixelDistanceFromFocus = scaleWidth;
    curGridLineX = canvas.width; // arbitrary number rightside of canvas
    let linesBelowFocus = 0;
    while (curGridLineX > 0) {
      linesBelowFocus++;
      curGridLineX = focusX - pixelDistanceFromFocus;

      let curDate = incrementDateByScaleType(this.#focusDate, this.#scaleType, -linesBelowFocus);
      let curValue = getFocusDateAsValue(curDate, this.#scaleType);
      // temp
      if (this.#scaleType == "month")
        curValue = curDate.toLocaleString("default", { month: "long" });
      ctx.fillText(curValue, curGridLineX, 80);

      // draw line
      ctx.beginPath();
      ctx.moveTo(curGridLineX, 0);
      ctx.lineTo(curGridLineX, canvas.height);
      ctx.stroke();

      pixelDistanceFromFocus += scaleWidth;
    }
    console.log("lines above focus (including center): " + linesAboveFocus);
    console.log("lines below focus: " + linesBelowFocus);
  }
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
  let horizontalScrollSpeed = 50;
  let rescaleSpeed = 50;

  const timeline = new Timeline();
  let focusDate = new Date(2005, 11, 28, 23, 58, 57, 999);
  let scaleType = "year";
  let focusX = canvas.width / 2;
  let scaleWidth = 200;
  timeline.draw(ctx, canvas, focusDate, scaleType, focusX, scaleWidth);

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      console.log("arrow right");
      focusX += horizontalScrollSpeed;
      timeline.draw(ctx, canvas, focusDate, scaleType, focusX, scaleWidth);
    } else if (event.key === "ArrowLeft") {
      console.log("arrow left");
      focusX -= horizontalScrollSpeed;
      timeline.draw(ctx, canvas, focusDate, scaleType, focusX, scaleWidth);
    }
  });

  window.addEventListener("wheel", (event) => {
    if (event.shiftKey) {
      if (event.deltaY > 0) {
        // shift + Scroll down
        focusX += horizontalScrollSpeed;
      } else if (event.deltaY < 0) {
        // shift + Scroll up
        focusX -= horizontalScrollSpeed;
      }
    }

    if (event.altKey) {
      if (event.deltaY > 0) {
        // alt + Scroll down
        scaleWidth -= rescaleSpeed;
      } else if (event.deltaY < 0) {
        // alt + Scroll down
        scaleWidth += rescaleSpeed;
      }
    }
    console.log("scaleWidth: " + scaleWidth);
    timeline.draw(ctx, canvas, focusDate, scaleType, focusX, scaleWidth);
  });
}

window.addEventListener("load", setupCanvas);
window.addEventListener("resize", setupCanvas);
