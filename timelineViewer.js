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
  #baseLineHeight = 150;
  #linePosArr = []; // currently unordered
  #lineDateArr = []; // currently unordered
  constructor(scaleWidth, scaleType) {
    this.#scaleWidth = scaleWidth;
    this.setScaleType(scaleType);
  }
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
  getScaleWidth() {
    return this.#scaleWidth;
  }
  #getBaselineLabel(date, scaleType, scaleWidth) {
    let label = getFocusDateAsValue(date, scaleType);
    if (scaleType == "month") label = date.toLocaleString("default", { month: "long" });
    return label;
  }
  rescale(rescaleSpeed, mouseX) {
    // -rescaleSpeed to scale zoom out, +rescaleSpeed to scale zoom in
    this.#scaleWidth += rescaleSpeed;

    // set focusX to the line position x closest to mouseX
    let closestIndex = 0;
    let diff = Math.abs(this.#linePosArr[0] - mouseX);
    for (let i = 0; i < this.#linePosArr.length; i++) {
      let curDiff = Math.abs(this.#linePosArr[i] - mouseX);
      if (curDiff < diff) {
        diff = curDiff;
        closestIndex = i;
      }
    }
    this.#focusX = this.#linePosArr[closestIndex];

    // set focusDate to equal index as chosen line position
    this.#focusDate = this.#lineDateArr[closestIndex];
    console.log("closest line: " + closestIndex + " value: " + this.#lineDateArr[closestIndex]);
  }

  drawBaseline(ctx, canvas) {
    // draw backing for baseline
    ctx.fillStyle = "rgb(197, 197, 197)";
    ctx.fillRect(0, canvas.height - this.#baseLineHeight, canvas.width, this.#baseLineHeight);

    // draw baseline line
    const baselineY = canvas.height - this.#baseLineHeight + 50;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(canvas.width, baselineY);
    ctx.stroke();

    // draw tick marks and values
    ctx.lineWidth = 2;
    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < this.#linePosArr.length; i++) {
      // tick mark
      ctx.beginPath();
      ctx.moveTo(this.#linePosArr[i], baselineY - 5);
      ctx.lineTo(this.#linePosArr[i], baselineY + 5);
      ctx.stroke();

      // text
      let curDate = this.#lineDateArr[i];
      let baselineLabel = this.#getBaselineLabel(curDate, this.#scaleType, this.#scaleWidth);
      ctx.fillText(baselineLabel, this.#linePosArr[i], baselineY + 10);
    }
  }
  draw(ctx, canvas, focusDate, focusX) {
    // temp code prevents crash if scale width is less than 1
    if (this.#scaleWidth < 1) this.#scaleWidth = 1;

    // clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // clear line date and position arrays
    this.#lineDateArr = [];
    this.#linePosArr = [];

    this.setFocusDate(focusDate);
    this.#focusX = focusX;

    if (this.#scaleWidth <= 10) {
      // increment scale type?
      this.#scaleType = "decade";
      this.#scaleWidth = 180;
      this.#focusX -= 180 / 2;
    }

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
      if (linesAboveFocus == 0 && this.#focusX < canvas.width) ctx.strokeStyle = "red";
      else ctx.strokeStyle = "rgb(183, 183, 183)";

      curGridLineX = this.#focusX + pixelDistanceFromFocus;

      let curDate = incrementDateByScaleType(this.#focusDate, this.#scaleType, linesAboveFocus);
      let curValue = getFocusDateAsValue(curDate, this.#scaleType);
      // temp
      ctx.fillText(curValue, curGridLineX, 80);

      // save line date and x position
      this.#lineDateArr.push(curDate);
      this.#linePosArr.push(curGridLineX);

      // draw line
      ctx.beginPath();
      ctx.moveTo(curGridLineX, 0);
      ctx.lineTo(curGridLineX, canvas.height);
      ctx.stroke();
      pixelDistanceFromFocus += this.#scaleWidth;
      linesAboveFocus++;
    }

    // draw lines below focus point (does not include focus point)
    pixelDistanceFromFocus = this.#scaleWidth;
    curGridLineX = canvas.width; // arbitrary number rightside of canvas
    let linesBelowFocus = 0;
    while (curGridLineX > 0) {
      linesBelowFocus++;
      curGridLineX = this.#focusX - pixelDistanceFromFocus;

      let curDate = incrementDateByScaleType(this.#focusDate, this.#scaleType, -linesBelowFocus);
      let curValue = getFocusDateAsValue(curDate, this.#scaleType);
      // temp
      ctx.fillText(curValue, curGridLineX, 80);

      // save line date and x position
      this.#lineDateArr.push(curDate);
      this.#linePosArr.push(curGridLineX);

      // draw line
      ctx.beginPath();
      ctx.moveTo(curGridLineX, 0);
      ctx.lineTo(curGridLineX, canvas.height);
      ctx.stroke();

      pixelDistanceFromFocus += this.#scaleWidth;
    }
    //console.log("lines above focus (including center): " + linesAboveFocus);
    //console.log("lines below focus: " + linesBelowFocus);
    this.drawBaseline(ctx, canvas);
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
  let mouseX = -1;
  let mouseY = -1;
  let horizontalScrollSpeed = 50;
  let rescaleSpeed = 10;

  let focusDate = new Date(2005, 11, 28, 23, 58, 57, 999);
  let scaleType = "millennium";
  let focusX = canvas.width / 2;
  let scaleWidth = 200;
  const timeline = new Timeline(scaleWidth, scaleType);
  timeline.draw(ctx, canvas, focusDate, focusX);

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      focusX += horizontalScrollSpeed;
      timeline.draw(ctx, canvas, focusDate, focusX);
    } else if (event.key === "ArrowLeft") {
      focusX -= horizontalScrollSpeed;
      timeline.draw(ctx, canvas, focusDate, focusX);
    }
  });

  window.addEventListener("wheel", (event) => {
    // horizontal movement
    if (event.shiftKey) {
      if (event.deltaY > 0) {
        // shift + Scroll down
        focusX += horizontalScrollSpeed;
      } else if (event.deltaY < 0) {
        // shift + Scroll up
        focusX -= horizontalScrollSpeed;
      }
    }

    // rescale
    if (event.altKey) {
      if (event.deltaY > 0) {
        // scale zoom out
        // alt + Scroll down
        timeline.rescale(-rescaleSpeed, mouseX);
      } else if (event.deltaY < 0) {
        // scale zoom in
        // alt + Scroll down
        timeline.rescale(rescaleSpeed, mouseX);
      }
    }
    console.log("scaleWidth: " + timeline.getScaleWidth());
    timeline.draw(ctx, canvas, focusDate, focusX);
  });

  canvas.addEventListener("mousemove", function (event) {
    // Get mouse coordinate relative to the canvas
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;

    //console.log("mouse xy: " + mouseX + "," + mouseY);
  });
}

window.addEventListener("load", setupCanvas);
window.addEventListener("resize", setupCanvas);
