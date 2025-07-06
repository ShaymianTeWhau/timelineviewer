/**
 * Timeline Viewer Application
 * 
 * This script implements a scalable, scrollable timeline visualization using HTML5 Canvas.
 * 
 * Features:
 * - Interactive zooming and panning through millennia to milliseconds
 * - Visual representation of historical or custom time periods ("swim lanes")
 * - Approximate date rendering with gradient fades
 * - Event information display on hover and click
 * - Configurable rendering options (grid lines, lane borders, etc.)
 * 
 * Key Components:
 * - Timeline: Manages drawing of gridlines, scales, and positioning
 * - SwimLane: Represents a horizontal track containing time periods
 * - TimePeriod: A labeled bar indicating a date range with optional approximation
 * 
 * Entry point: `startApp()` sets up the canvas and attaches event listeners
 * Dependencies: Assumes existence of HTML elements with specific IDs (`timeline-canvas`, `info-panel`, `lane-panel`, etc.)
 * 
 * @file timeline.js
 */


const SHOWTEMPMARKERS = false;
const SHOWGRIDLINES = false;
const SHOWSWIMLANEBORDERS = true;
const PRINTTIMEPERIODS = false;
let canvas, ctx, infoPanel, lanePanel, instructionPanel, zoomInButton, zoomOutButton
let isDragging = false;
let timeline = null;


/**
 * Extracts a specific component of a Date object based on the provided scale type.
 *
 * For large-scale types like "millennium", "century", and "decade", this function returns the full year.
 * For smaller-scale types, it returns the corresponding part of the date (e.g., month, day, hour, etc.).
 *
 * @param {Date} date - The Date object to extract a value from.
 * @param {string} scaleType - The unit of time to extract. Must be one of:
 *   "millennium", "century", "decade", "year", "month", "date", "hour", "minute", "second", "millisecond".
 * @returns {number} The extracted value corresponding to the given scaleType.
 * @throws {Error} If the scaleType is not one of the valid options.
 */
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

/**
 * Returns a new Date object incremented by a specified amount, based on the given scaleType.
 * 
 * The scaleType determines which part of the date to increment (e.g., year, month, day).
 * The function also resets smaller time units to ensure consistency at larger scales.
 * 
 * Examples:
 * - "millennium", "century", "decade": Adjusts year to nearest appropriate boundary (e.g., 2000 for a millennium).
 * - "month": Adds months and resets date to the 1st, time to 00:00:00.000.
 * - "date", "hour", etc.: Increments the respective unit and zeroes out smaller units.
 * 
 * @param {Date} oldDate - The base date to increment from.
 * @param {string} scaleType - The unit of time to increment (e.g., "year", "month", "hour").
 * @param {number} increment - The number of units to add (can be negative).
 * @returns {Date} A new Date object with the increment applied.
 */
function incrementDateByScaleType(oldDate, scaleType, increment) {

  let newDate = new Date(oldDate);
  let year;

  switch (scaleType) {
    case "millennium":
      year = newDate.getFullYear() + increment * 1000;
      year = Math.floor(year / 1000) * 1000;
      newDate.setFullYear(year);
      newDate.setMonth(0);
      break;
    case "century":
      year = newDate.getFullYear() + increment * 100;
      year = Math.floor(year / 100) * 100;
      newDate.setFullYear(year);
      newDate.setMonth(0);
      break;
    case "decade":
      year = newDate.getFullYear() + increment * 10;
      year = Math.floor(year / 10) * 10;
      newDate.setFullYear(year);
      newDate.setMonth(0);
      break;
    case "year":
      year = newDate.getFullYear() + increment;
      newDate.setFullYear(year);
      newDate.setMonth(0);
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
  return newDate;
}

/**
 * Returns the number of days in the month of the given Date.
 *
 * @param {Date} date - A JavaScript Date object representing any day in the target month.
 * @returns {number} The number of days in that month (e.g., 28, 30, or 31).
 */
function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  
  // Set date to the 0th day of the next month, gives last day of current month
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Calculates the difference in calendar days between two dates.
 *
 * Normalizes both dates to midnight to ensure the result reflects full calendar days,
 * regardless of time components.
 *
 * @param {Date} date1 - The starting date.
 * @param {Date} date2 - The ending date.
 * @returns {number} The number of calendar days between date1 and date2.
 *   Positive if date2 is after date1, negative if before.
 */
function getCalendarDayDifference(date1, date2) {
  // Clone and normalize both dates to midnight (00:00:00)
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffInMs = d2 - d1;

  return Math.round(diffInMs / msPerDay);
}

/**
 * Represents a visual timeline with a configurable scale, focus point, and multiple swim lanes.
 * 
 * Manages rendering and positioning of date markers (grid lines) and associated visual elements
 * like swim lanes and time periods. Provides logic for interaction such as zooming, panning,
 * and layout calculation.
 * 
 * @class Timeline
 */
class Timeline {
  #title;
  #canvas;
  #canvasWidth = 0;
  #canvasHeight = 0;
  #focusDate = new Date();
  #scaleType = "year";
  #focusX = 100; // x position of the gridline that the timeline is being built around
  #yOffset = 0;
  #scaleWidth = 100; // in pixels
  #baseLineHeight = 120;
  #linePosArr = []; // currently unordered
  #lineDateArr = []; // currently unordered
  #swimLaneArr = [];
  #baseLineFontColor = "rgb(64, 64, 64)";

  /**
   * Constructs a new Timeline instance with the given configuration.
   *
   * @param {number} scaleWidth - The width in pixels for each unit of the current scale (e.g., a year or month).
   * @param {string} scaleType - The type of scale used on the timeline (e.g., "year", "month", "decade").
   * @param {Date} focusDate - The date to center the timeline around.
   * @param {number} focusX - The X-coordinate (in pixels) at which the focusDate is visually aligned.
   * @param {number} canvasWidth - The width of the canvas in pixels, used for layout calculations.
   */
  constructor(scaleWidth, scaleType, focusDate, focusX, canvasWidth) {
    this.#scaleWidth = scaleWidth;
    this.setScaleType(scaleType);
    this.#focusDate = focusDate;
    this.#focusX = focusX;
    this.#canvasWidth = canvasWidth;
  }

  /**
   * Returns the array of x-coordinate positions (in pixels) of the timeline grid lines.
   *
   * Each position corresponds to a date in the timeline, aligned with `getLineDateArray()`.
   *
   * @returns {number[]} An array of x-coordinates for the timeline grid lines.
   */
  getLinePositionArray(){
    return this.#linePosArr
  }
  
  /**
   * Returns the array of `Date` objects corresponding to each timeline grid line.
   *
   * Each date aligns with the positions returned by `getLinePositionArray()`.
   *
   * @returns {Date[]} An array of `Date` objects for the timeline grid lines.
   */
  getLineDateArray(){
    return this.#lineDateArr
  }

  /**
   * Returns the vertical scroll offset applied to the timeline drawing.
   *
   * This offset shifts all swim lanes and content vertically on the canvas.
   *
   * @returns {number} The vertical offset in pixels.
   */
  getYOffset(){
    return this.#yOffset
  }

  /**
   * Returns the x-coordinate (in pixels) on the canvas where the focus date is centered.
   *
   * This value determines the horizontal reference point for building the timeline grid.
   *
   * @returns {number} The x-position of the focus date.
   */
  getFocusX(){
    return this.#focusX
  }

  /**
   * Returns the focus date at the center of the timeline.
   *
   * The timeline grid is constructed around this date.
   *
   * @returns {Date} The current focus date.
   */
  getFocusDate(){
    return this.#focusDate
  }

  getCanvasWidth(){
    return this.#canvasWidth
  }

  /**
   * Sets the central focus date around which the timeline is built.
   * 
   * This date determines the visual anchor point (aligned with `focusX`)
   * and influences which time units are rendered across the timeline.
   * 
   * @param {Date} focusDate - The date to center the timeline around.
   * 
   * @throws {Error} If the provided value is not an instance of the Date class.
   */
  setFocusDate(focusDate) {
    if (!(focusDate instanceof Date)) {
      throw new Error("focusDate must be an instance of the Date class.");
    }
    this.#focusDate = focusDate;
  }

  /**
   * Sets the granularity of the timeline scale (e.g., "year", "month", "hour").
   * 
   * Validates the input against a list of accepted scale types and throws an error if invalid.
   *
   * @param {string} scaleType - The scale type to apply. Must be one of:
   *  "millennium", "century", "decade", "year", "month", "date", 
   *  "hour", "minute", "second", or "millisecond".
   * 
   * @throws {Error} If the provided scaleType is not in the list of valid types.
   */
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

  /**
   * Returns the current scale type used by the timeline.
   * 
   * The scale type determines the granularity of the timeline and can be one of:
   * "millennium", "century", "decade", "year", "month", "date",
   * "hour", "minute", "second", or "millisecond".
   * 
   * @returns {string} The current scale type.
   */
  getScaleType(){
    return this.#scaleType
  }

  getScaleWidth() {
    return this.#scaleWidth;
  }
  
  /**
   * Generates a label string for a baseline date on the timeline based on the current scale type and visual scale width.
   * 
   * The function selectively suppresses labels based on the `scaleWidth` to avoid clutter.
   * For large units like "millennium", "century", or "decade", labels are omitted unless the year aligns with a significant interval.
   * For smaller units like "date", "hour", or "second", labels are filtered based on thresholds to avoid overplotting.
   *
   * @private
   * @param {Date} date - The date object for which to generate a label.
   * @param {string} scaleType - The type of scale (e.g., "year", "month", "hour", etc.).
   * @param {number} scaleWidth - The number of pixels representing one unit of the current scale.
   * 
   * @returns {string} A string label for the given date, or an empty string if the label should be suppressed.
   */
  #getBaselineLabel(date, scaleType, scaleWidth) {
    
    let label = getFocusDateAsValue(date, scaleType);
    
    // don't display year 0 - applys only to large scaleType's
    if (scaleType == "millennium" || scaleType == "century" || scaleType == "decade") {
      if (date.getFullYear() == 0) label = "";
    }
    
    // suppress certain labels - don't display certain years at certain scale lengths, depending on the scate type
    if(scaleType == "millennium"){
      
      if(scaleWidth < 20){
        if(date.getFullYear() % 10000 != 0) label = "";
      }
      else if(scaleWidth < 50){
        if(date.getFullYear() % 5000 != 0) label = "";
      }
      else if(scaleWidth < 100){
        if(date.getFullYear() % 2000 != 0) label = "";
      }
    }
    
    if(scaleType == "century"){
      
      if(scaleWidth < 20){
        if(date.getFullYear() % 1000 != 0) label = "";
      }
      else if(scaleWidth < 50){
        if(date.getFullYear() % 500 != 0) label = "";
      }
      else if(scaleWidth < 100){
        if(date.getFullYear() % 200 != 0) label = "";
      }
    }
    
    if(scaleType == "decade"){
      
      if(scaleWidth < 20){
        if(date.getFullYear() % 100 != 0) label = "";
      }
      else if(scaleWidth < 50){
        if(date.getFullYear() % 50 != 0) label = "";
      }
      else if(scaleWidth < 100){
        if(date.getFullYear() % 20 != 0) label = "";
      }
    }
    
    if(scaleType == "year"){
      
      if(scaleWidth < 20){
        if(date.getFullYear() % 10 != 0) label = "";
      }
      else if(scaleWidth < 50){
        if(date.getFullYear() % 5 != 0) label = "";
      }
      else if(scaleWidth < 100){
        if(date.getFullYear() % 2 != 0) label = "";
      }
    }
    /*
    if(scaleType == "month"){
      if(scaleWidth < 50){
        if(date.month == 1) label = date.month;
      }
      
    }*/
    
    if (scaleType == "month"){
      //label = date.toLocaleString("default", { month: "long" });
  
    
      if(date.getMonth() != 0) label = "";
      else label = date.getFullYear();
      
    } 

    if(scaleType == "date"){
      if(scaleWidth < 50){
        if(date.getDate() % 5 != 0 && date.getDate() != 1 || date.getDate() == 30) label = "";
      }
    }

    if(scaleType == "hour"){
      if(scaleWidth < 20){
        if(date.getHours() % 6 != 0 && date.getHours() != 0) label = "";
      } else if(scaleWidth < 50){
        if(date.getHours() % 2 != 0 && date.getHours() != 0) label = "";
      }
    }

    if(scaleType == "minute"){
      if(scaleWidth < 20){
        if(date.getMinutes() % 10 != 0 && date.getMinutes() != 0) label = "";
      } else if(scaleWidth < 50){
        if(date.getMinutes() % 5 != 0 && date.getMinutes() != 0) label = "";
      }
    }

    if(scaleType == "second"){
      if(scaleWidth < 20){
        if(date.getSeconds() % 10 != 0 && date.getSeconds() != 0) label = "";
      } else if(scaleWidth < 50){
        if(date.getSeconds() % 5 != 0 && date.getSeconds() != 0) label = "";
      }
    }

    if(scaleType == "millisecond"){
      if(scaleWidth < 20){
        if(date.getMilliseconds() % 10 != 0 && date.getMilliseconds() != 0) label = "";
      } else if(scaleWidth < 50){
        if(date.getMilliseconds() % 5 != 0 && date.getMilliseconds() != 0) label = "";
      }
    }

    

    return label;
  }

  /**
   * Adjusts the zoom level of the timeline by changing the `scaleWidth`, and updates the focus point
   * to the timeline gridline closest to the mouse X position.
   * 
   * A positive `rescaleSpeed` zooms in (increases `scaleWidth`), while a negative value zooms out.
   * After adjusting the scale width, it recalculates the `focusX` (gridline anchor) and updates the
   * `focusDate` to match the gridline closest to the `mouseX` coordinate.
   * 
   * Finally, the function adjusts the scale type if needed based on the new width.
   * 
   * @param {number} rescaleSpeed - The amount to change the scale width by. Positive to zoom in, negative to zoom out.
   * @param {number} mouseX - The x-coordinate of the mouse, used to determine the nearest timeline gridline to focus on.
   */
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


    this.updateScaleTypeByWidth(rescaleSpeed);
  }

  /**
   * Dynamically updates the timeline's `scaleType` based on the current `scaleWidth`.
   * 
   * This method allows the timeline to transition smoothly between different time units
   * (e.g., from "century" to "decade" or from "month" to "date") as the user zooms in or out.
   * It adjusts both the `scaleType` and resets the `scaleWidth` to an appropriate default
   * for the new scale to maintain visual clarity.
   * 
   * The transitions are:
   * - Zoom in (larger `scaleWidth`): moves to more granular units (e.g., year → month → date)
   * - Zoom out (smaller `scaleWidth`): moves to broader units (e.g., decade → century → millennium)
   * 
   * Milliseconds are limited and not implemented beyond a threshold.
   * 
   * @param {number} rescaleSpeed - The amount the user zoomed in or out, used to help compute new width values on transitions.
   */
  updateScaleTypeByWidth(rescaleSpeed){
    // change scale type based on width
    if(this.#scaleType == "millennium"){
      if(this.#scaleWidth > 200){
        this.#scaleType = "century";
        this.#scaleWidth = 20 + rescaleSpeed;
      }else if(this.#scaleWidth < 20){
        this.#scaleWidth = 20;
      }
    }

    if(this.#scaleType == "century"){
      if(this.#scaleWidth > 200){
        this.#scaleType = "decade";
        this.#scaleWidth = 20 + rescaleSpeed;
      }else if(this.#scaleWidth < 20){
        this.#scaleType = "millennium";
        this.#scaleWidth = 200 - rescaleSpeed;
      }
    }

    if(this.#scaleType == "decade"){
      if(this.#scaleWidth > 200){
        this.#scaleType = "year";
        this.#scaleWidth = 20 + rescaleSpeed;
      } else if(this.#scaleWidth < 20){
        this.#scaleType = "century";
        this.#scaleWidth = 200 - rescaleSpeed;
      }
    }

    if(this.#scaleType == "year"){
      if(this.#scaleWidth > 200){
        this.#scaleType = "month";
        this.#scaleWidth = 200/12 + rescaleSpeed;
      } else if(this.#scaleWidth < 20){
        this.#scaleType = "decade";
        this.#scaleWidth = 200 - rescaleSpeed;
      }
    }

    if(this.#scaleType == "month"){
      if(this.#scaleWidth > 200){
        this.#scaleType = "date"
        this.#scaleWidth = 10;
      } else if(this.#scaleWidth < 20){
        this.#scaleType = "year";
        this.#scaleWidth = 200 - rescaleSpeed;
      }
    }

    if(this.#scaleType == "date"){
      if(this.#scaleWidth > 200){
        this.#scaleType = "hour"
        this.#scaleWidth = 10;
      } else if(this.#scaleWidth < 10){
        this.#scaleType = "month";
        this.#scaleWidth = 200
      }
    }

    if(this.#scaleType == "hour"){
      if(this.#scaleWidth > 200){
        this.#scaleType = "minute"
        this.#scaleWidth = 5;
      } else if(this.#scaleWidth < 10){
        this.#scaleType = "date";
        this.#scaleWidth = 200
      }
    }

    if(this.#scaleType == "minute"){
      if(this.#scaleWidth > 200){
        this.#scaleType = "second"
        this.#scaleWidth = 5;
      } else if(this.#scaleWidth < 5){
        this.#scaleType = "hour";
        this.#scaleWidth = 200
      }
    }

    if(this.#scaleType == "second"){
      if(this.#scaleWidth > 200){
        this.#scaleType = "millisecond"
        this.#scaleWidth = 5;
      } else if(this.#scaleWidth < 5){
        this.#scaleType = "minute";
        this.#scaleWidth = 200
      }
    }

    if(this.#scaleType == "millisecond"){
      this.#scaleWidth = 4; // this is here because I don't want to implement milliseconds
      if(this.#scaleWidth < 5){
        this.#scaleType = "second";
        this.#scaleWidth = 200
      }
    }



  }

  /**
   * Moves the timeline horizontally by adjusting the `focusX` position.
   * 
   * This effectively pans the timeline view left or right.
   * 
   * @param {number} horizontalScrollSpeed - The number of pixels to shift the timeline horizontally.
   * Positive values move the view to the right; negative values move it to the left.
   */
  moveHorizontal(horizontalScrollSpeed) {
    this.#focusX += horizontalScrollSpeed;
  }

  /**
   * Moves the timeline vertically by adjusting the vertical offset (`yOffset`).
   * 
   * This affects the vertical scroll of the timeline content (e.g., swim lanes).
   * 
   * @param {number} verticalScrollSpeed - The number of pixels to shift the timeline vertically.
   * Positive values move the content down; negative values move it up.
   */
  moveVertical(verticalScrollSpeed){
    this.#yOffset += verticalScrollSpeed;
  }

  /**
 * Draws the timeline's baseline, including the background gradient, main line,
 * tick marks, and date labels.
 *
 * The baseline visually represents time units (e.g., years, months) and is positioned
 * near the bottom of the canvas. Tick marks and labels are drawn based on the current
 * scale type and spacing defined in `#linePosArr` and `#lineDateArr`.
 *
 * If the current `scaleType` is "month" or more granular (e.g., "date", "hour", etc.),
 * this method also draws additional labels above the baseline for clarity.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element on which to draw the baseline.
 */
  drawBaseline(canvas) {
    const ctx = canvas.getContext("2d");

    // draw backing for baseline
    let baselineColor1 = "rgba(208, 220, 231, 0.9)";
    let baselineColor2 = "rgb(208, 220, 231)";

    const baselineGrad = ctx.createLinearGradient(0,this.#canvasHeight - this.#baseLineHeight,0,this.#canvasHeight)
    baselineGrad.addColorStop(0,baselineColor1)
    baselineGrad.addColorStop(0.6, baselineColor2)
    ctx.fillStyle = baselineGrad;
    ctx.fillRect(0, this.#canvasHeight - this.#baseLineHeight, this.#canvasWidth, this.#baseLineHeight);

    // draw baseline line
    const baselineY = this.#canvasHeight - this.#baseLineHeight + 50;
    ctx.strokeStyle = this.#baseLineFontColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(this.#canvasWidth, baselineY);
    ctx.stroke();

    // draw tick marks and values
    for (let i = 0; i < this.#linePosArr.length; i++) {
      ctx.lineWidth = 2;
      ctx.font = "16px Arial";
      ctx.fillStyle = this.#baseLineFontColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
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

    // call draw labels above baseline for months and smaller
    if(this.#scaleType == "month" || this.#scaleType == "date" || this.#scaleType == "hour"|| this.#scaleType == "minute"|| this.#scaleType == "second" || this.#scaleType == "millisecond") this.#drawLabelsAboveBaseline(ctx, baselineY);
    
  }

  /**
   * Draws curved bracket labels above the baseline to indicate broader time groupings 
   * (e.g. months, days, hours) depending on the current `scaleType`.
   *
   * These labels help contextualize fine-grained tick marks by grouping them visually
   * and are dynamically filtered to avoid clutter at smaller `scaleWidth`s.
   *
   * This method:
   * - Filters `#lineDateArr` and `#linePosArr` based on the granularity of the scale.
   * - Formats a label string depending on the `scaleType`.
   * - Draws a curved bracket and centered label for each valid segment.
   *
   * @private
   * @param {CanvasRenderingContext2D} ctx - The rendering context to draw on.
   * @param {number} baselineY - The Y-coordinate of the baseline used as the anchor for the brackets.
   */
  #drawLabelsAboveBaseline(ctx, baselineY){
    

    let monthPosArr = Array.from(this.#linePosArr);
    let monthDateArr = Array.from(this.#lineDateArr);

    // this will make a date and position array for the top bracket positions
    if(this.#scaleType != "month") {
      let newPosArr = [];
      let newDateArr = [];

      for(let i = 0; i < monthDateArr.length; i++){
        let curDate = monthDateArr[i];
        
        if((this.#scaleType == "date" && curDate.getDate() == 1) || (this.#scaleType == "hour" && curDate.getHours() == 0) || (this.#scaleType == "minute" && curDate.getMinutes() == 0) || (this.#scaleType == "second" && curDate.getSeconds() == 0)|| (this.#scaleType == "milliseconds" && curDate.getMilliseconds() == 0)){
          newDateArr.push(monthDateArr[i]);
          newPosArr.push(monthPosArr[i]);
        }
      }
  
      if(newDateArr.length == 0){ // when zoomed in, this will ensure the date array has at least one date in it
        newDateArr.push(monthDateArr[0]);
      }

      monthPosArr = newPosArr;
      monthDateArr = newDateArr;
    }
    
    // create date, a month/date/hour/minute/second before the first date - for printing the curved line starting off screen
    let earlyDate = new Date(monthDateArr[0]);
    if(this.#scaleType == "month"){
      earlyDate.setMonth(earlyDate.getMonth() - 1);
    }
    else if(this.#scaleType == "date"){
      earlyDate.setDate(earlyDate.getDate() - 1)
    }
    else if(this.#scaleType == "hour"){
      earlyDate.setHours(earlyDate.getHours() - 1)
    }
    else if(this.#scaleType == "minute"){
      earlyDate.setMinutes(earlyDate.getMinutes() - 1)
    }
    else if(this.#scaleType == "second"){
      earlyDate.setSeconds(earlyDate.getSeconds() - 1)
    }
    monthDateArr.unshift(earlyDate);
    monthPosArr.unshift(this.#scaleWidth * -30);
    

    // format and print top lables
    for (let i = 0; i < monthPosArr.length; i++){
  
      let curDate = monthDateArr[i];
      let topLabel = curDate.getFullYear() + " " + curDate.toLocaleString("default", { month: "long" });

      // change topLabel format depending on scale type
      if(this.#scaleType == "hour"){
        topLabel = curDate.getFullYear() + " " + curDate.toLocaleString("default", { month: "long" }) + " " + curDate.getDate();
      }else if(this.#scaleType == "minute"){
        topLabel = curDate.getFullYear() + " " + curDate.toLocaleString("default", { month: "long" }) + " " + curDate.getDate() + " " + curDate.getHours() + ":";
      }else if(this.#scaleType == "second"){
        topLabel = curDate.getFullYear() + " " + curDate.toLocaleString("default", { month: "long" }) + " " + curDate.getDate() + " " + curDate.getHours() + ":" + curDate.getMinutes();
      }else if(this.#scaleType == "millisecond"){
        topLabel = curDate.getFullYear() + " " + curDate.toLocaleString("default", { month: "long" }) + " " + curDate.getDate() + " " + curDate.getHours() + ":" + curDate.getMinutes() + ":" + curDate.getSeconds();
      }

      // don't draw label at certain scale widths
      if(this.#scaleType == "month"){
        topLabel = curDate.toLocaleString("default", { month: "long" });

        if(this.#scaleWidth < 40){
          if(curDate.getMonth() % 6 !=0) topLabel = "";
        } else if(this.#scaleWidth < 80){
          if(curDate.getMonth() % 2 !=0) topLabel = "";
        }
      }

      // draw curve above and between tick marks
      let radius = 10;
      const startX = monthPosArr[i]+5;
      let endX = monthPosArr[i + 1] - 5;
      if (isNaN(endX)) {
        endX = 10000;
      }
      let monthWidth = (endX - startX);
      let labelMiddle = startX + monthWidth/2;
      const y = baselineY - 5;

      // resize radius when month width is too narrow
      if(monthWidth < 2*radius +10){
        radius = (monthWidth-10)/2;
        if(radius < 0) radius = 1; // ensure there is never a negative radius
      }

      
      ctx.lineWidth = 1;
      ctx.font = "15px Arial";
      ctx.beginPath();
      ctx.arc(startX + radius, y, radius, Math.PI, Math.PI * 1.5); // Top left curve
      ctx.lineTo(endX-radius, y - radius);                        // Straight top
      ctx.arc(endX - radius, y, radius, Math.PI * 1.5, 0);          // Top right curve
      ctx.stroke();
      
      // draw month text
      ctx.lineWidth = 2;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      // shift label if off screen left
      let labelWidth = ctx.measureText(topLabel).width
      if(startX < 0){
        labelMiddle = endX/2;
      }
      if(labelMiddle < 0){
        labelMiddle = labelWidth/2;
        
      }
      if(labelWidth>endX){
        labelMiddle = endX - labelWidth/2;
      }

      // shift label if off screen right
      if(endX > this.#canvasWidth){
        labelMiddle = startX + (this.#canvasWidth - startX)/2;
      }
      if((labelMiddle-labelWidth/2)<startX){
        labelMiddle = startX + labelWidth/2;
      }

      if(startX < 0 && endX > this.#canvasWidth){
        labelMiddle = this.#canvasWidth/2;
      }


      ctx.fillText(topLabel, labelMiddle, baselineY - 20)
    }

  }

  /**
   * Renders the entire timeline onto the provided canvas.
   *
   * This includes:
   * - Clearing and preparing the canvas.
   * - Drawing vertical timeline grid lines based on the current `scaleType` and `focusDate`.
   * - Storing the grid line dates and X positions.
   * - Drawing optional temporary markers for debugging (if `SHOWTEMPMARKERS` is true).
   * - Rendering swim lane backgrounds and foregrounds using `SwimLane` class methods.
   * - Drawing optional grid lines and the labeled timeline baseline.
   *
   * The method avoids drawing grid lines or labels for year 0, except for large time scales 
   * (millennium, century, decade).
   *
   * @param {HTMLCanvasElement} canvas - The canvas DOM element to draw the timeline on.
   */
  draw(canvas) {
    this.#canvas = canvas;
    // prevent crash if scale width is less than 1
    if (this.#scaleWidth < 1) this.#scaleWidth = 1;
    
    const ctx = canvas.getContext("2d");

    // apply dpi scaling
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height /dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);  
    ctx.scale(dpr, dpr); 

    this.#canvas = canvas;
    this.#canvasWidth = logicalWidth;
    this.#canvasHeight = logicalHeight;


    // clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);

    // clear line date and position arrays
    this.#lineDateArr = [];
    this.#linePosArr = [];

    // setup for draw
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "18px Arial";

    // draw lines above focusPoint (including focus point)
    let pixelDistanceFromFocus = 0;
    let curGridLineX = 0;
    let linesAboveFocus = 0;
    while (curGridLineX < this.#canvasWidth) {
      // temp color focus date and grid line
      //if (linesAboveFocus == 0 && this.#focusX < canvas.width) ctx.strokeStyle = "red";
      //else ctx.strokeStyle = "rgb(183, 183, 183)";

      curGridLineX = this.#focusX + pixelDistanceFromFocus;

      let curDate = incrementDateByScaleType(this.#focusDate, this.#scaleType, linesAboveFocus);
      // skip year 0
      if (
        !(
          this.#scaleType == "millennium" ||
          this.#scaleType == "century" ||
          this.#scaleType == "decade"
        )
      ) {
        if (curDate.getFullYear() == 0) {
          //curDate = incrementDateByScaleType(curDate, "year", 1);
          //curDate.setFullYear(1);
          //linesAboveFocus++;
          //continue;
        }
      }
      let curValue = getFocusDateAsValue(curDate, this.#scaleType);
      // temp
      ctx.translate(curGridLineX, 80);
      ctx.rotate((90 * Math.PI) / 180);
      if(SHOWTEMPMARKERS) ctx.fillText(curValue + " (" + curDate.toDateString() + ")", 0, 0);
      ctx.rotate((-90 * Math.PI) / 180);
      ctx.translate(-curGridLineX, -80);
      // save line date and x position
      this.#lineDateArr.push(curDate);
      this.#linePosArr.push(curGridLineX);

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
      // skip year 0
      if (
        !(
          this.#scaleType == "millennium" ||
          this.#scaleType == "century" ||
          this.#scaleType == "decade"
        )
      ) {
        if (curDate.getFullYear() == 0) {
          //curDate = incrementDateByScaleType(curDate, "year", -1);
          //curDate.setFullYear(-1);
          //continue;
        }
      }
      let curValue = getFocusDateAsValue(curDate, this.#scaleType);
      // temp
      ctx.translate(curGridLineX, 80);
      ctx.rotate((90 * Math.PI) / 180);
      if(SHOWTEMPMARKERS) ctx.fillText(curValue + " (" + curDate.toDateString() + ")", 0, 0);
      ctx.rotate((-90 * Math.PI) / 180);
      ctx.translate(-curGridLineX, -80);

      // save line date and x position
      this.#lineDateArr.push(curDate);
      this.#linePosArr.push(curGridLineX);

      pixelDistanceFromFocus += this.#scaleWidth;
    }

    // temp: will have to move this sort function somewhere else
    this.#lineDateArr.sort((a, b) => a - b);
    this.#linePosArr.sort((a, b) => a - b);

    // draw swim lane backgrounds
    SwimLane.drawBackgrounds(ctx,this, this.#swimLaneArr, this.#yOffset + this.#canvasHeight - this.#baseLineHeight);
    if(SHOWGRIDLINES) this.#drawGridLines(ctx);
    SwimLane.drawForegrounds(ctx, this.#swimLaneArr);

    this.drawBaseline(canvas);
  }

  #drawGridLines(ctx){
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(183, 183, 183)";

    for(let i = 0;i<this.#linePosArr.length;i++){
      let curGridLineX = this.#linePosArr[i];
      ctx.beginPath();
      ctx.moveTo(curGridLineX, 0);
      ctx.lineTo(curGridLineX,this.#canvasHeight);
      ctx.stroke();
    }
  }

  /**
   * Updates the mouse interaction state for all time periods in all visible swimlanes.
   *
   * Determines whether the mouse is currently hovering over a time period, and updates its
   * visual state (e.g. showing bounding boxes or rendering info to `infoPanel` on click).
   *
   * If the mouse is clicked (`isMouseDown === true`) and no time period is matched, it updates
   * the info panel to indicate that no time period is selected.
   *
   * @param {number} mouseX - The X coordinate of the mouse relative to the canvas.
   * @param {number} mouseY - The Y coordinate of the mouse relative to the canvas.
   * @param {boolean} [isMouseDown=false] - Whether the mouse button is currently pressed.
   * @returns {string} The name of the time period under the cursor, or an empty string if none.
   */
  updateMouseState(mouseX, mouseY, isMouseDown=false){
    // returns name of timeperiod cursor is hovering over

    let hoverSelection = "";
    let matchFound = false;
    // loop swimlanes
    for(let i = 0;i<this.#swimLaneArr.length;i++){
      if(!this.#swimLaneArr[i].getVisibility()) continue; // skip swimlanes that aren't visible

      let curSwimlane = this.#swimLaneArr[i];
      let curTimePeriodArr = curSwimlane.getTimePeriods();
      
      // loop time periods in this swimlane
      for(let j = 0;j<curTimePeriodArr.length;j++){
        // check if cursor is in time period
        if(curTimePeriodArr[j].updateMouseState(mouseX, mouseY, isMouseDown)){
          matchFound = true;
          hoverSelection = curTimePeriodArr[j].getName();
        } 
      }
    }

    if(!matchFound && isMouseDown){
      // click is in empty space
      infoPanel.innerHTML = "Select Time Period";
    }

    return hoverSelection;
  }

  /**
   * Sets up the lane panel UI that allows toggling the visibility of swimlanes.
   *
   * Clears the existing content of the `lanePanel` element and creates a button for each
   * swimlane. Each button toggles the visibility of its associated swimlane when clicked
   * and triggers a redraw of the timeline.
   *
   * Buttons are styled using the `swim-lane-hide-button` CSS class.
   *
   * This method assumes that `lanePanel` is a globally accessible DOM element and
   * that `this.#swimLaneArr` contains initialized swimlane instances.
   *
   * @private
   */
  #setupLanePanel(){
    // setup div for toggling swimlane visibility

    lanePanel.innerHTML = "";
    const lanePanelTitle = document.createElement("b");
    lanePanelTitle.textContent = "Hide/Show";
    lanePanel.appendChild(lanePanelTitle);

    for(let i = 0;i<this.#swimLaneArr.length;i++){
      const newButton = document.createElement("button");
      newButton.classList.add("swim-lane-hide-button");
      newButton.textContent = this.#swimLaneArr[i].getName();

      newButton.addEventListener("click", () =>{
        // hide/show
        this.#swimLaneArr[i].toggleVisibility();
        this.draw(this.#canvas);
      })

      lanePanel.appendChild(newButton);
    }
    
  }

  getTitle(){
    return this.#title;
  }

  /**
   * Parses a custom-formatted date string into a JavaScript `Date` object.
   *
   * The expected format is `"YYYY-MM-DD-HH-MM-SS-MS"` (each component separated by a dash),
   * where time components (hours, minutes, seconds, milliseconds) are optional.
   * 
   * Supports negative years (e.g., `-0044-03-15` for 44 BC). A leading `-` indicates a BC date.
   *
   * @private
   * @param {string} dateStr - The date string to parse. Format: "[-]YYYY-MM-DD[-HH-MM-SS-MS]".
   * @returns {Date} The corresponding `Date` object with the correct year and time fields set.
   */
  #parseDate(dateStr){
    // parse date string to date object
    let yearMultiplier = 1;
    if(dateStr[0] === '-'){
      // is bc
      dateStr = dateStr.slice(1);
      yearMultiplier = -1;
    }

    const [year, month, day, hour, minute, second, ms] = dateStr.split("-").map(Number);
    const date = new Date(0,0,0);
    date.setFullYear(year * yearMultiplier)
    date.setMonth(month)
    date.setDate(day)
    if(hour) date.setHours(hour)
    if(minute) date.setMinutes(minute)
    if(second) date.setSeconds(second)
    if(ms) date.setMilliseconds(ms)
    return date;
  }

  /**
   * Loads timeline data from a JSON object and initializes internal properties.
   *
   * This method sets up the timeline’s title, scale, focus date, and swimlanes
   * including all associated time periods. It parses date strings into `Date` objects
   * and rebuilds the internal state from serialized data (e.g., from a saved file or API).
   *
   * @param {Object} json - The JSON object containing the timeline data.
   * @param {string} json.title - The title of the timeline.
   * @param {number} json.scaleWidth - The pixel width of each timeline unit.
   * @param {string} json.scaleType - The type of time scale (e.g., "year", "month").
   * @param {string} json.focusDate - The focus date in custom string format.
   * @param {number} json.focusX - The x-position of the focus date on the canvas.
   * @param {Array<Object>} json.swimlanes - The array of swimlane objects.
   * @param {string} json.swimlanes[].title - Title of the swimlane.
   * @param {boolean} json.swimlanes[].isHidden - Whether the swimlane is hidden.
   * @param {string} json.swimlanes[].color - Background color of the swimlane.
   * @param {Array<Object>} json.swimlanes[].timePeriods - Array of time period objects.
   * @param {string} json.swimlanes[].timePeriods[].name - Name of the time period.
   * @param {string} json.swimlanes[].timePeriods[].startDate - Start date in custom format.
   * @param {string} json.swimlanes[].timePeriods[].endDate - End date in custom format.
   * @param {boolean} json.swimlanes[].timePeriods[].hasApproxStartDate - Whether the start date is approximate.
   * @param {boolean} json.swimlanes[].timePeriods[].hasApproxEndDate - Whether the end date is approximate.
   * @param {string} json.swimlanes[].timePeriods[].description - Description text.
   * @param {string} json.swimlanes[].timePeriods[].color1 - Primary color for rendering.
   * @param {string} json.swimlanes[].timePeriods[].color2 - Secondary color for rendering.
   */
  load(json){

    // load timeline properties
    this.#title = json.title;
    this.#scaleWidth = json.scaleWidth;
    this.#scaleType = json.scaleType;
    this.#focusDate = this.#parseDate(json.focusDate)
    this.#focusX = json.focusX;

    // load swimlanes
    json.swimlanes.forEach(swimlaneJson => {
      let timePeriodArr = [];

      // load timeperiods
      swimlaneJson.timePeriods.forEach(periodJson => {
        const startDate = this.#parseDate(periodJson.startDate);
        const endDate = this.#parseDate(periodJson.endDate)

        const timePeriod = new TimePeriod(
          periodJson.name,
          startDate,
          endDate,
          periodJson.hasApproxStartDate,
          periodJson.hasApproxEndDate,
          periodJson.description,
          periodJson.color1,
          periodJson.color2
        )
        timePeriodArr.push(timePeriod)
      })

      const swimLane = new SwimLane(
        swimlaneJson.title, 
        swimlaneJson.isHidden,
        this.#canvasWidth,
        timePeriodArr,
        swimlaneJson.color
      )
      this.#swimLaneArr.push(swimLane)
    })

   this.#setupLanePanel();

  }
}

/**
 * Represents a horizontal swim lane that holds a collection of time periods on the timeline.
 *
 * Each swim lane manages its own height, visibility, layout rows, and internal time period data.
 * Swim lanes are used to organize multiple time periods visually within the timeline interface.
 *
 * @class
 */
class SwimLane{
  #name = "";
  #isHidden = false;
  #width = 0;
  #minHeight = 200;
  #height = this.#minHeight; // temp, min height
  #timePeriodArr = [];
  #row = [[]]; // each row is an array of int. Each int represents an index in the timePeriodArr
  #bottomY = 0;
  #margin = 5;
  #rowHeight;
  #color;

  /**
   * Creates a new SwimLane instance to group and display time periods on the timeline.
   *
   * @constructor
   * @param {string} name - The name or label of the swim lane.
   * @param {boolean} isHidden - Whether the swim lane is initially hidden.
   * @param {number} width - The width allocated for the swim lane in pixels.
   * @param {TimePeriod[]} timePeriodArr - An array of TimePeriod instances assigned to this swim lane.
   * @param {string} [color="rgb(234,234,234)"] - Optional background color for the swim lane (CSS color string).
   */
  constructor(name, isHidden, width, timePeriodArr, color="rgb(234,234,234)"){
    this.#name = name;
    this.#isHidden = isHidden;
    this.#width = width;
    this.#timePeriodArr = timePeriodArr;
    this.#color = color;
  }

  /**
   * Draws the background rectangles for a list of visible swim lanes from bottom to top,
   * starting at the specified Y-coordinate.
   * 
   * Each visible swim lane is set up and drawn in reverse order (last in the array appears at the bottom).
   *
   * @static
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context to draw on.
   * @param {Timeline} timeline - The timeline instance used for layout and scaling context.
   * @param {SwimLane[]} swimLaneArr - An array of SwimLane instances to draw.
   * @param {number} y - The starting Y-coordinate from which to begin drawing upward.
   * @returns {void}
   */
  static drawBackgrounds(ctx,timeline, swimLaneArr, y){
    // function to draw backgrounds for an array of SwimLanes (bottom up), beginning at a y coordinate
    
    for(let i = swimLaneArr.length-1;i>=0;i--){
      if(!swimLaneArr[i].getVisibility()) continue;
      swimLaneArr[i].setUpTimePeriods(ctx, timeline);
      y -= swimLaneArr[i].getHeight();
      swimLaneArr[i].drawBackground(ctx, y);
    }
  }

  /**
   * Draws the foreground (time periods) for each visible SwimLane in top-to-bottom order.
   * 
   * Assumes that layout has already been set up and that each SwimLane knows its position.
   *
   * @static
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context used for drawing.
   * @param {SwimLane[]} swimLaneArr - An array of SwimLane instances whose time periods should be drawn.
   * @returns {void}
   */
  static drawForegrounds(ctx, swimLaneArr){
    // function to draw foregrounds for an array of SwimLanes, beginning at y coordinate
    for(let i = 0;i<swimLaneArr.length;i++){
      if(!swimLaneArr[i].getVisibility()) continue;
      swimLaneArr[i].drawTimePeriods(ctx);
    }
  }

  hide = () => this.#isHidden = true;
  show = () => this.#isHidden = false;

  toggleVisibility(){
    this.#isHidden = !this.#isHidden;
  }

  getVisibility(){
    return !this.#isHidden;
  }

  getName(){
    return this.#name;
  }

  getHeight(){
    if(this.#isHidden) return 0;
    return this.#height;
  }

  getTimePeriods(){
    return this.#timePeriodArr;
  }

  /**
   * Draws the background of the swim lane at the specified Y-coordinate.
   * 
   * Fills the swim lane area with its configured color, optionally draws borders and the title,
   * and updates the internal `#bottomY` position for layout tracking.
   * 
   * Skips rendering if the swim lane is marked as hidden.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context used for drawing.
   * @param {number} y - The Y-coordinate of the top of the swim lane.
   * @returns {void}
   */
  drawBackground(ctx, y){
    if(this.#isHidden) return;
    this.#bottomY = y + this.#height;

    ctx.fillStyle = this.#color;
    ctx.fillRect(0, y, this.#width, this.#height);
    if(SHOWSWIMLANEBORDERS) this.#drawBorder(ctx, y);
    this.#drawTitle(ctx, y);
  }

  #drawBorder(ctx, y){
    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.strokeRect(0, y, this.#width, this.#height)
  }

  #drawTitle(ctx, y){
    // setup draw title
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "80px Arial";

      let labelX = 5;
      let labelY = y + this.#height - this.#minHeight/2;
      ctx.fillText(this.#name, labelX, labelY);
  }

  toString(){
    return this.#name + this.#isHidden + this.#width + this.#height;
  }

  /**
   * Draws all time periods in the swim lane, organized by row, from bottom to top.
   * 
   * Each row's Y-coordinate is calculated relative to the bottom of the swim lane (`#bottomY`).
   * The method skips drawing if the swim lane is hidden or contains no time periods.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context used for drawing.
   * @returns {void}
   */
  drawTimePeriods(ctx){
    if(this.#isHidden) return;
    if(this.#timePeriodArr.length==0) return;
    
    // draw time periods in each row
    for(let i = 0;i<this.#row.length;i++){
      let rowNum = i;
      let y = this.#bottomY - this.#margin - rowNum * this.#rowHeight;

      for(let j = 0;j< this.#row[i].length;j++){
        let periodIndex = this.#row[i][j];
        this.#timePeriodArr[periodIndex].draw(ctx, y);
      }
    }
  }

  /**
   * Calculates layout and assigns rows for all time periods in the swim lane.
   * 
   * Each time period is positioned using its `setupCoordinates` method, and assigned to a row 
   * such that time periods in the same row do not visually overlap. The swim lane height is 
   * adjusted based on the number of rows and their required space.
   * 
   * Skips setup if the swim lane is hidden or contains no time periods.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context used to measure text and layout.
   * @param {Timeline} timeline - The timeline instance used to calculate positioning and scaling.
   * @returns {void}
   */
  setUpTimePeriods(ctx, timeline){
    if(this.#isHidden) return;
    if(!this.#timePeriodArr) return;
    if(this.#timePeriodArr.length==0) return;

    // Initialize rows with the first row containing the first time period
    this.#row = [[]];
    this.#row[0].push(0); // add first time period to row 0
    
    // Set up coordinates and measure height using the first time period
    this.#timePeriodArr[0].setupCoordinates(ctx, timeline, this.#bottomY);
    this.#rowHeight = this.#timePeriodArr[0].getBoundingHeight();

    if(PRINTTIMEPERIODS) console.log(this.#timePeriodArr[0].toStringShort());

    // Start placing the rest of the time periods
    for(let i = 1;i<this.#timePeriodArr.length;i++){
      this.#timePeriodArr[i].setupCoordinates(ctx, timeline, this.#bottomY);

      if(PRINTTIMEPERIODS) console.log(this.#timePeriodArr[i].toStringShort());

      let curStartX = this.#timePeriodArr[i].getStartX();
      let curRow = 0;
      
      // Get the end X of the last period in the current row
      let prevPeriodIndexInCurRow = this.#row[curRow][this.#row[curRow].length-1];
      let prevPeriodInCurRow = this.#timePeriodArr[prevPeriodIndexInCurRow];
      let prevEndXInCurRow = prevPeriodInCurRow.getBoundingEndX();

      // Try to place current period into the first row it can fit into without overlap
      while(curStartX < prevEndXInCurRow){
        curRow++;

        // If no more rows exist, add a new row and skip overlap checks
        if(curRow>=this.#row.length){
          this.#row.push([]); // adds a new empty row
          break; // row is empty so don't do following calculations
        }

        // Get the end X of the last period in the current row
        prevPeriodIndexInCurRow = this.#row[curRow][this.#row[curRow].length-1];
        prevEndXInCurRow = this.#timePeriodArr[prevPeriodIndexInCurRow].getBoundingEndX();
      }
      this.#row[curRow].push(i)
    }

    // Adjust total swim lane height to fit all rows with margin
    this.#height = Math.max(this.#minHeight,this.#margin*2+this.#row.length*this.#rowHeight);
  }

}

/**
 * Represents a labeled time period to be displayed on a timeline.
 * 
 * A time period has a name, description, start and end dates.
 * It is rendered as a colored bar with optional gradient fades and a label, and is aware of its own 
 * layout and drawing properties.
 * 
 * Used internally by the `Timeline` and `SwimLane` classes for layout, rendering,
 * and user interaction (e.g., hover and click).
 * 
 * @class
 */
class TimePeriod{
  #name;
  #description;
  #startDate;
  #hasApproxStartDate;
  #endDate;
  #hasApproxEndDate;
  #x;
  #endX;
  #y;
  #barY;
  #width;
  #height = 15;
  #textWidth;
  #boundingWidth;
  #boundingHeight;
  #boundingBoxVisible = false;
  #topMarginSize = 2;
  #sideMarginSize = 2;
  #color1;
  #color2;
  #font = "14px Arial";

  /**
   * Constructs a new TimePeriod instance.
   *
   * @param {string} name - The name of the time period (e.g., "World War II").
   * @param {Date} startDate - The starting date of the period.
   * @param {Date} endDate - The ending date of the period.
   * @param {boolean} hasApproxStartDate - Whether the start date is approximate.
   * @param {boolean} hasApproxEndDate - Whether the end date is approximate.
   * @param {string} description - A short description to display for the time period.
   * @param {string} [color1="black"] - Primary color (fill or gradient start).
   * @param {string} [color2="black"] - Secondary color (stroke or gradient end).
   */
  constructor(name, startDate, endDate, hasApproxStartDate, hasApproxEndDate, description, color1="black", color2="black"){
    this.#name = name;
    this.#description = description;
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#hasApproxStartDate = hasApproxStartDate;
    this.#hasApproxEndDate = hasApproxEndDate;
    this.#color1 = color1;
    this.#color2 = color2;
  }

  /**
   * Formats a `Date` object as a `DD/MM/YYYY` string with AD/BC suffix,
   * and optionally prepends "c." to indicate an approximate date.
   * 
   * Example output:
   * - "03/07/1920 AD"
   * - "c. 44 BC"
   * 
   * @private
   * @method
   * @param {Date} date - The date to format.
   * @param {boolean} [approx=false] - Whether to mark the date as approximate (adds "c.").
   * @returns {string} The formatted date string.
   */
  #formatDateDMY(date, approx = false) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    let yearStr;
    if(year < 0) yearStr = (year * -1) + " BC";
    else yearStr = year + " AD";

    let str = `${day}/${month}/${yearStr}`;
    if(approx) str = `c. ${yearStr}`;
    return str;
  }

  /**
   * Updates the visual and interaction state of the time period based on mouse position.
   * 
   * Determines whether the mouse is currently hovering over the time period's bounding box.
   * If the mouse is down (click), it populates the `infoPanel` with details about the time period.
   * 
   * Also toggles the bounding box visibility for highlighting.
   *
   * @param {number} mouseX - The current X-coordinate of the mouse relative to the canvas.
   * @param {number} mouseY - The current Y-coordinate of the mouse relative to the canvas.
   * @param {boolean} [isMouseDown=false] - Whether the mouse button is currently pressed.
   * @returns {boolean} `true` if the mouse is inside the time period's bounding box, otherwise `false`.
   */
  updateMouseState(mouseX, mouseY, isMouseDown=false){
    let cursorIsInBoundingBox = false;

    let boundingStartX = this.#x;
    let boundingEndX = this.#x + this.#boundingWidth;
    let boundingStartY = this.#y;
    let boundingEndY = this.#y + this.#boundingHeight;
    
    // if mouse is in bounding box
    if(boundingStartX < mouseX && mouseX < boundingEndX && boundingStartY < mouseY && mouseY < boundingEndY){
      this.#boundingBoxVisible = true;
      cursorIsInBoundingBox = true;

      if(isMouseDown){
        let startDate = this.#formatDateDMY(this.#startDate, this.#hasApproxStartDate);
        let endDate = this.#formatDateDMY(this.#endDate, this.#hasApproxEndDate);
        // clear panel
        infoPanel.innerHTML = 
        `
        <div class="info-panel-header">
          <b>${this.#name}</b>
          <p class="info-panel-dates">${startDate} to ${endDate}</p> 
        </div>
        <p>${this.#description}</p>
        `;
        // append name
        // append start and end date
        // append description
      }
    }else{
      this.#boundingBoxVisible = false;
    }

    return cursorIsInBoundingBox;
  }

  /**
   * Returns a detailed string representation of the time period's internal state.
   * 
   * Includes name, description, dates, dimensions, and rendering-related properties,
   * primarily for debugging or logging purposes.
   *
   * @returns {string} A multiline string describing the time period's properties.
   */
  toString() {
    return `Name: ${this.#name}
        Description: ${this.#description}
        Start Date: ${this.#startDate}
        Has Approximate Start Date: ${this.#hasApproxStartDate}
        End Date: ${this.#endDate}
        Has Approximate End Date: ${this.#hasApproxEndDate}
        X: ${this.#x}
        Y: ${this.#y}
        Width: ${this.#width}
        Height: ${this.#height}
        Text Width: ${this.#textWidth}
        Bounding Width: ${this.#boundingWidth}
        Bounding Height: ${this.#boundingHeight}
      Bounding Box Visible: ${this.#boundingBoxVisible}`;
  }

  /**
   * Returns a short string representation of the time period's name and start date.
   * 
   * Format: `"<name> YYYY/MM/DD HH:MM:SS"`
   * 
   * Primarily used for quick logging or debugging output.
   *
   * @returns {string} A single-line summary of the time period's name and precise start time.
   */
  toStringShort(){
    let d = this.#startDate;
    let month = d.getMonth()+1;
    return this.#name + " " + d.getFullYear()+"/"+month+"/"+d.getDate() + " "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
  }

  setDescription(description){
    this.#description = description
  }

  getDescription(){
    return this.#description
  }

  /**
   * Renders the time period on the given canvas context.
   * 
   * Draws the label, bounding box (if hovered), and the time period bar
   * using gradient styling if the start or end dates are approximate.
   * 
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context to draw on.
   * @param {number} y - The bottom Y-coordinate where the time period should be vertically aligned.
   * @returns {void}
   */
  draw(ctx, y){
    this.#y = y - this.#boundingHeight; // boundingBox top left corner y coordinate
    this.#barY = y - this.#height; // time period bar top left corner y coordinate

    // reposition labelX if off left of screen
    let labelX = this.#x + this.#sideMarginSize;
    if(labelX<0){
      labelX = 0 + this.#sideMarginSize;
      if((this.#textWidth+ this.#sideMarginSize)>this.getBoundingEndX()){
        labelX = this.getBoundingEndX() - (this.#textWidth+this.#sideMarginSize)
      }
    }

    // draw
    ctx.textBaseline = "top";
    ctx.fillStyle = this.#color1;
    ctx.strokeStyle = this.#color2;
    ctx.lineWidth = 1;
    ctx.textAlign = "left";
    ctx.font = this.#font;
    ctx.fillText(this.#name, labelX, this.#y+this.#topMarginSize)
    if(this.#boundingBoxVisible) ctx.strokeRect(this.#x, this.#y, this.#boundingWidth, this.#boundingHeight);
    this.#drawBar(ctx, this.#x, this.#barY, this.#width, this.#height)
  }

  /**
   * Extracts the red, green, and blue components from an RGB or RGBA color string.
   * 
   * If the input is the keyword `"black"`, it is normalized to `"rgb(0,0,0)"`.
   * 
   * @private
   * @param {string} colorStr - A CSS color string in `rgb(r,g,b)` or `rgba(r,g,b,a)` format.
   * @returns {{r: number, g: number, b: number}} An object containing the RGB components as integers.
   * @throws {Error} If the input is not a valid RGB(A) color string.
   */
  #extractRGB(colorStr){
    // extract r,g,b values of a color string
    if(colorStr == "black") colorStr = "rgb(0,0,0)";

    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) {
      throw new Error("Invalid color format for " + this.#name + " : " +this.#color1);
    }
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }

  /**
   * Converts an RGB or RGBA color string to a fully transparent RGBA string.
   * 
   * Extracts the RGB components using {@link #extractRGB} and sets the alpha to 0.
   *
   * @private
   * @param {string} colorStr - A color string in `rgb(r,g,b)` or `rgba(r,g,b,a)` format.
   * @returns {string} A CSS `rgba(r,g,b,0)` string representing the transparent version of the color.
   */
  #getTransparent(colorStr){
    // return transparent version of a color
    const rgb = this.#extractRGB(colorStr);
    return "rgba("+ rgb.r + ", " + rgb.g + ", " + rgb.b + ", 0)";
  }

  /**
   * Draws the time period's horizontal bar on the canvas.
   * 
   * The bar's style reflects whether the start and/or end dates are approximate:
   * - If both are approximate, the bar has a fade-in and fade-out gradient.
   * - If only one end is approximate, a one-sided gradient is used.
   * - If neither is approximate, the bar is solid.
   * 
   * If the bar's width is too narrow, a solid rectangle is drawn without gradients.
   * 
   * @private
   * @param {CanvasRenderingContext2D} ctx - The 2D canvas rendering context.
   * @param {number} x - The x-coordinate of the top-left corner of the bar.
   * @param {number} y - The y-coordinate of the top-left corner of the bar.
   * @param {number} width - The width of the bar in pixels.
   * @param {number} height - The height of the bar in pixels.
   * @returns {void}
   */
  #drawBar(ctx, x, y, width, height) {
    if (this.#width <= 1) {
      // Skip gradient rendering if width is too small
      ctx.fillStyle = this.#color1;
      ctx.fillRect(x, y, width, height);
      return;
    }
    const fadeWidthInPixels = 30;
    let gradient;
    let gradientProportionMaximum = 0.2;

    let gradientProportion = Math.min(gradientProportionMaximum, Math.max(0, fadeWidthInPixels / this.#width)); // clamp between 0 and 1

    let transparentColor = this.#getTransparent(this.#color1);

    // Case: both ends are approximate
    if (this.#hasApproxStartDate && this.#hasApproxEndDate) {
      gradient = ctx.createLinearGradient(x, 0, x + width, 0);
      gradient.addColorStop(0.0, transparentColor);
      gradient.addColorStop(gradientProportion, this.#color1);
      gradient.addColorStop(1-gradientProportion, this.#color1);
      gradient.addColorStop(1.0, transparentColor);
    }

    // Case: only start is approximate
    else if (this.#hasApproxStartDate) {
      gradient = ctx.createLinearGradient(x, 0, x + width, 0);
      gradient.addColorStop(0.0, transparentColor);
      gradient.addColorStop(gradientProportion, this.#color1);
      gradient.addColorStop(1.0, this.#color1);
    }

    // Case: only end is approximate
    else if (this.#hasApproxEndDate) {
      gradient = ctx.createLinearGradient(x + width, 0, x, 0);
      gradient.addColorStop(0.0, transparentColor);
      gradient.addColorStop(gradientProportion, this.#color1);
      gradient.addColorStop(1.0, this.#color1);
    }

    // Case: no approximation
    else {
      gradient = this.#color1;
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
  }

  /**
   * Calculates the X-coordinate on the timeline for a given date.
   * 
   * The calculation is based on the timeline's scale type and grid structure.
   * Handles precise positioning for various granularities including:
   * - `"month"`: accounts for year, month, day, and hour
   * - `"date"`: includes days and partial days via hours
   * - `"hour"`: includes minutes
   * - `"minute"`: millisecond-accurate conversion to minutes
   * - `"second"`: millisecond-accurate conversion to seconds
   * - Other types (`"year"`, `"decade"`, `"century"`, etc.): uses interpolated pixel-per-unit ratio
   * 
   * If the date falls outside the timeline grid, positioning may be inaccurate or undefined.
   * 
   * @private
   * @param {Timeline} timeline - The timeline instance used to get scale, grid, and conversion context.
   * @param {Date} dateForConversion - The date to convert into an X-coordinate.
   * @returns {number} The computed X-coordinate for the given date in pixels.
   */
  #calculateX(timeline, dateForConversion){
    let x = -1000;

    // get timeline grid arrays
    let lineDateArr = timeline.getLineDateArray();
    let linePosArr = timeline.getLinePositionArray();

    const timelineStartX = linePosArr[0];
    const timelineStartDate = lineDateArr[0];
    const timelineEndX = linePosArr[linePosArr.length-1];
    const timelineEndDate = lineDateArr[lineDateArr.length-1];

    const gridWidthPixels = timelineEndX - timelineStartX;
    const gridWidthUnits = this.#getGridWidthUnits(timelineStartDate, timelineEndDate, timeline.getScaleType())
    const pixelsPerUnit = gridWidthPixels / gridWidthUnits;

    
    if(timeline.getScaleType() == "month"){
      let deltaYear = dateForConversion.getFullYear() - timelineStartDate.getFullYear();
      let deltaMonth = dateForConversion.getMonth() - timelineStartDate.getMonth();
      x= timelineStartX + (deltaYear*12)*timeline.getScaleWidth() + deltaMonth*timeline.getScaleWidth();
      let daysInMonth = getDaysInMonth(dateForConversion);
      x+= (dateForConversion.getDate()*timeline.getScaleWidth())/daysInMonth + (dateForConversion.getHours()*timeline.getScaleWidth())/24;

    }else if(timeline.getScaleType() == "date"){
      let deltaDays = getCalendarDayDifference(timelineStartDate, dateForConversion)
      x = timelineStartX + deltaDays*timeline.getScaleWidth();
      x += dateForConversion.getHours() * timeline.getScaleWidth()/24;

    }else if(timeline.getScaleType() == "hour"){
      let deltaDays = getCalendarDayDifference(timelineStartDate, dateForConversion)
      let deltaHours = dateForConversion.getHours() - timelineStartDate.getHours();

      x = timelineStartX + deltaDays*24*timeline.getScaleWidth() + deltaHours*timeline.getScaleWidth();
      x += dateForConversion.getMinutes()*timeline.getScaleWidth()/60

    }else if(timeline.getScaleType() == "minute"){
      let deltaDate = dateForConversion - timelineStartDate; // in ms
      let deltaMinutes = deltaDate/1000/60; // minutes

      x = timelineStartX + deltaMinutes*timeline.getScaleWidth();
      
    }else if(timeline.getScaleType() == "second"){
      let deltaDate = dateForConversion - timelineStartDate; // in ms
      let deltaSeconds = deltaDate/1000;

      x = timelineStartX + deltaSeconds*timeline.getScaleWidth();

    }else{
      // if scaleType is a type of year
      x = timelineStartX + (dateForConversion.getFullYear() - timelineStartDate.getFullYear()) * pixelsPerUnit;
      x += (dateForConversion.getMonth() * pixelsPerUnit) /12 + (dateForConversion.getDate()*pixelsPerUnit)/365;
    }

    return x;
  }

  #getGridWidthUnits(startDate, endDate, scaleType){
    let gridWidthUnits;

    if(scaleType == "month"){
      gridWidthUnits = (endDate.getFullYear()*12+ endDate.getMonth()) - (startDate.getFullYear()*12 + startDate.getMonth());
    }else if(scaleType == "date"){
      gridWidthUnits = endDate.getDate() - startDate.getDate();
    }else if(scaleType == "hour"){
      gridWidthUnits = endDate.getHours() - startDate.getHours();
    }else if(scaleType == "minute"){
      gridWidthUnits = endDate.getMinutes() - startDate.getMinutes();
    }else if(scaleType == "second"){
      gridWidthUnits = endDate.getSeconds() - startDate.getSeconds();
    }else{ // if scaleType is any kind of year
      gridWidthUnits = endDate.getFullYear() - startDate.getFullYear();
    }

    return gridWidthUnits;
  }

  setupCoordinates(ctx, timeline, y){
    this.#boundingHeight = this.#height * 2 + this.#topMarginSize *2; // boundingBox height
    this.#y = y - this.#boundingHeight; // boundingBox top left corner y coordinate
    this.#barY = y - this.#height; // time period bar top left corner y coordinate

    // calculate x start, x end and width based on timeline state
    this.#x = this.#calculateX(timeline, this.#startDate);

    // this ensures the time period width is not absurdly large off the left side of screen, 
    // and ensures the endX position stays visually accurate when zoomed in to small scaleTypes
    if(this.#x < -1000) this.#x = -1000; 

    this.#endX = this.#calculateX(timeline, this.#endDate);
    this.#width = this.#endX - this.#x;

    // this ensures the time period width is not absurdly large off the right side of screen,
    // and ensures the approximate date fade still works at small scaleTypes
    let maxEndX = timeline.getCanvasWidth()+1000;
    if(this.#x > 0 && this.#x < timeline.getCanvasWidth() && this.#endX > maxEndX){
      this.#width = timeline.getCanvasWidth() - this.#x + 1000;
    }

    // this ensures the time period is not absurdly large when it spans the entire width of screen
    if(this.#width > (timeline.getCanvasWidth()*2)){
      this.#width = timeline.getCanvasWidth() *2;
    }
  
    // prepare to draw
    ctx.textBaseline = "top";
    ctx.lineWidth = 1;
    ctx.textAlign = "left";
    ctx.font = this.#font;
    this.#textWidth = ctx.measureText(this.#name).width + this.#sideMarginSize*2;
    this.#boundingWidth = Math.max(this.#width, this.#textWidth);
  }

  getName() {
  return this.#name;
  }

  getDescription() {
    return this.#description;
  }

  getStartX() {
    return this.#x;
  }

  getEndX() {
    return this.#endX;
  }

  getY() {
    return this.#y;
  }

  getBoundingWidth() {
    return this.#boundingWidth;
  }

  getBoundingHeight() {
    return this.#boundingHeight;
  }

  getBoundingEndX(){
    return this.#x + this.#boundingWidth;
  }

  getBoundingBoxVisible() {
    return this.#boundingBoxVisible;
  }

}

/**
 * Hide instruction panel.
 * Appends to instructionPanel.
 */
function hideInstructions(){
  instructionPanel.innerHTML = "";
}

/**
 * Show instruction panel.
 * Appends to instructionPanel.
 */
function showInstructions(){
  instructionPanel.innerHTML = 
  `
    <div id="instruction-panel">
      <p>Drag timeline to move view</p>
      <p>Use buttons to zoom, or alt+scroll</p>
      <button id="instruction-hide-button">Hide</button>
    </div>
  `
  const instructionHideButton = document.getElementById("instruction-hide-button");
  instructionHideButton.addEventListener("click", () => hideInstructions())
}

/**
 * Initializes the timeline application by loading timeline data from a JSON file.
 * 
 * Fetches `timeline.json`, parses the response, and passes the data to `setupCanvas()` 
 * to initialize the canvas and event listeners. Logs an error if the fetch fails.
 *
 * @function
 */
function startApp(){
  fetch('timeline.json')
  .then(res => res.json())
  .then(data => {
    setupCanvas(data)
  })
  .catch(err => console.error("Error loading timeline:", err));
}

/**
 * Initializes and validates DOM elements required for the timeline application.
 * 
 * Retrieves key UI elements by their IDs, assigns them to global variables,
 * and sets up the canvas dimensions and rendering context. Logs errors and exits 
 * early if the canvas is missing or invalid.
 * 
 * @function
 * @returns {void}
 */
function initializeDOMElements(){
  canvas = document.getElementById("timeline-canvas");
  infoPanel = document.getElementById("info-panel")
  zoomInButton = document.getElementById("zoom-in");
  zoomOutButton = document.getElementById("zoom-out");
  lanePanel = document.getElementById("lane-panel");
  instructionPanel = document.getElementById("instruction-panel-container");
  
  if (!canvas) {
    console.error("Element with ID 'timeline-canvas' not found!");
    return;
  }
  
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("Element with ID 'timeline-canvas' is not a valid <canvas> element.");
    return;
  }

  // dpi scaling
  const dpr = window.devicePixelRatio || 1;

  // Set CSS display size (what the browser sees)
  canvas.style.width = (window.innerWidth - 10) + "px";
  canvas.style.height = window.innerHeight + "px";

  // Set actual pixel size of canvas
  canvas.width = (window.innerWidth - 10) * dpr;
  canvas.height = window.innerHeight * dpr;

  // Scale drawing context
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

}

/**
 * Creates and initializes a Timeline instance with default parameters.
 * 
 * Sets a default focus date, scale type, and scale width (This will be overridden by timeline.load(json)).
 * The timeline is centered horizontally and loaded with data from the provided JSON.
 * 
 * @function
 * @param {Object} json - The timeline data in JSON format, expected to include title,
 *   focusDate, scaleType, focusX, and an array of swim lanes and time periods.
 * @returns {Timeline} A fully initialized Timeline instance ready for drawing.
 */
function initializeTimeline(json){
  
  let focusDate = new Date(-1, 11, 31, 23, 59, 59, 999);
  focusDate = new Date(1, 0, 1, 0, 0, 0, 0);
  focusDate.setFullYear(2000);
  
  let scaleType = "decade";
  let focusX = canvas.width / 2;
  let scaleWidth = 200;
  const timeline = new Timeline(scaleWidth, scaleType, focusDate, focusX, canvas.width);
  timeline.load(json)
  return timeline;
}

/**
 * Attaches keyboard controls for interacting with the timeline.
 * 
 * - Arrow keys move the timeline horizontally or vertically.
 * - Alt + ArrowUp/ArrowDown zooms in or out on the timeline.
 * 
 * Note: Uses the global `canvas` to determine center for zooming.
 *
 * @function
 * @param {Timeline} timeline - The timeline instance to control.
 * @param {number} verticalScrollSpeed - The amount of vertical movement in pixels per key press.
 * @param {number} horizontalScrollSpeed - The amount of horizontal movement in pixels per key press.
 * @param {number} rescaleSpeed - The amount of zoom applied per zoom action.
 * @returns {void}
 */
function setupKeyboardControls(timeline, verticalScrollSpeed, horizontalScrollSpeed, rescaleSpeed){
  window.addEventListener("keydown", (event) => {
    // rescale
    if (event.altKey){
      if (event.key === "ArrowUp") {
        // scale zoom in
        timeline.rescale(rescaleSpeed, timeline.getCanvasWidth()/2);
      } else if (event.key === "ArrowDown") {
        // scale zoom out
        timeline.rescale(-rescaleSpeed, timeline.getCanvasWidth()/2);
      }
    }
    
    // horizontal movement
    if (event.key === "ArrowRight") {
      timeline.moveHorizontal(-horizontalScrollSpeed);
    } else if (event.key === "ArrowLeft") {
      timeline.moveHorizontal(horizontalScrollSpeed);
    }

    // vertical movement
    if(!event.altKey){
      if (event.key === "ArrowUp") {
        timeline.moveVertical(verticalScrollSpeed);
      } else if (event.key === "ArrowDown") {
        timeline.moveVertical(-verticalScrollSpeed);
      }
    }
    timeline.draw(canvas);
  });
}

/**
 * Sets up mouse interaction events for the timeline canvas.
 * 
 * Handles the following:
 * - Mouse wheel scrolling:
 *   - Shift + scroll = horizontal pan
 *   - Alt + scroll = zoom in/out at mouse position
 *   - Plain scroll = vertical pan
 * - Mouse drag:
 *   - Click and drag to pan both horizontally and vertically
 * - Mouse hover:
 *   - Updates selection and highlights elements under the cursor
 * 
 * Uses global `canvas` and `requestAnimationFrame` for efficient redrawing.
 * 
 * @function
 * @param {Timeline} timeline - The timeline instance to control.
 * @param {number} verticalScrollSpeed - Pixels to scroll vertically per wheel tick.
 * @param {number} horizontalScrollSpeed - Pixels to scroll horizontally per wheel tick.
 * @param {number} rescaleSpeed - Pixels to scale timeline per zoom step.
 * @returns {void}
 */
function setupMouseEvents(timeline, verticalScrollSpeed, horizontalScrollSpeed, rescaleSpeed){
  let mouseX = -1;
  let mouseY = -1;

  // variables for dragging the screen
  isDragging = false;
  let dragStart = { x: 0, y: 0}
  let offset = { x: 0, y: 0 }

  let drawScheduled = false; // for throttling draw() on wheel events, using requestAnimationFrame()
  window.addEventListener("wheel", (event) => {
    let didChange = false;

    // horizontal movement
    if (event.shiftKey) {
      if (event.deltaY > 0) {
        // shift + Scroll down
        //focusX += horizontalScrollSpeed;
        timeline.moveHorizontal(horizontalScrollSpeed);
        didChange = true;
      } else if (event.deltaY < 0) {
        // shift + Scroll up
        //focusX -= horizontalScrollSpeed;
        timeline.moveHorizontal(-horizontalScrollSpeed);
        didChange = true;
      }
    } else if (event.altKey) {// rescale
      if (event.deltaY > 0) {
        // scale zoom out
        // alt + Scroll down
        timeline.rescale(-rescaleSpeed, mouseX);
        didChange = true;
      } else if (event.deltaY < 0) {
        // scale zoom in
        // alt + Scroll down
        timeline.rescale(rescaleSpeed, mouseX);
        didChange = true;
      }
    } else if(!event.shiftKey && !event.altKey){ // vertical movement
      if (event.deltaY > 0) {
        timeline.moveVertical(-verticalScrollSpeed);
        didChange = true;
      }else if (event.deltaY < 0){
        timeline.moveVertical(verticalScrollSpeed);
        didChange = true;
      }
    }

    if(didChange && !drawScheduled){
      drawScheduled = true;
      requestAnimationFrame(() => {
        timeline.draw(canvas);
        drawScheduled = false;
      })
    }

    // prevent the browser's default scroll behavior
    event.preventDefault();
  }, { passive: false });
  
  canvas.addEventListener("mousedown", (e) => {
    // assign drag start for moving the screen
    isDragging = true;
    dragStart.x = mouseX;
    dragStart.y = mouseY;
    timeline.updateMouseState(mouseX, mouseY, true)
  })

  canvas.addEventListener("mouseup", (e) => {
    isDragging = false;
  })

  let lastHover = "";
  canvas.addEventListener("mousemove", function (event) {
    let didChange = false;
    // Get mouse coordinate relative to the canvas
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    let hoverSelection = timeline.updateMouseState(mouseX,mouseY)
    if(lastHover != hoverSelection){
      didChange = true;
      lastHover = hoverSelection;
    }

    if(isDragging){
      offset.x = mouseX - dragStart.x;
      offset.y = mouseY - dragStart.y;
      timeline.moveHorizontal(offset.x);
      timeline.moveVertical(offset.y);
      dragStart.x = mouseX;
      dragStart.y = mouseY;
      didChange = true;
    }

    if(didChange && !drawScheduled){
      drawScheduled = true;
      requestAnimationFrame(() => {
        timeline.draw(canvas);
        drawScheduled = false;
      })
    }
  });

  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
  })

  canvas.addEventListener("contextmenu", (event) => {
    //event.preventDefault();
    isDragging = false;
  });

}

/**
 * Attaches event listeners to zoom-in and zoom-out buttons for continuous zooming.
 * 
 * - On `mousedown`: initiates an immediate zoom and then repeats zooming at intervals after a short delay.
 * - On `mouseup` or `mouseleave`: stops the zooming action.
 * 
 * Uses global `canvas`, `zoomInButton`, and `zoomOutButton` elements.
 * 
 * @function
 * @param {Timeline} timeline - The timeline instance to zoom.
 * @param {number} rescaleSpeed - The amount to zoom in or out per step.
 * @returns {void}
 */
function setupZoomButtons(timeline, rescaleSpeed){
  let zoomInterval = null;
  let zoomTimeout = null;
  const zoomSpeedMs = 75;
  const firstZoomDelay = 250;

  function startZooming(direction) {
    const centerPoint = timeline.getCanvasWidth() /2;

    // prevent multiple intervals
    if (zoomInterval || zoomTimeout) return;

    // initial zoom
    timeline.rescale(direction * rescaleSpeed, centerPoint);
    timeline.draw(canvas);

    // Timeout after first zoom
    zoomTimeout = setTimeout(() => {

      // After first zoom, start regular interval
      zoomInterval = setInterval(() => {
        timeline.rescale(direction * rescaleSpeed, centerPoint);
        timeline.draw(canvas);
      }, zoomSpeedMs);
    }, firstZoomDelay);
  }

  function stopZooming() {
    clearTimeout(zoomTimeout);
    clearInterval(zoomInterval);
    zoomTimeout = null;
    zoomInterval = null;
  }

  zoomInButton.addEventListener("mousedown", () => startZooming(1));
  zoomOutButton.addEventListener("mousedown", () => startZooming(-1));

  zoomInButton.addEventListener("mouseup", stopZooming);
  zoomOutButton.addEventListener("mouseup", stopZooming);

  zoomInButton.addEventListener("mouseleave", stopZooming);
  zoomOutButton.addEventListener("mouseleave", stopZooming);
}

/**
 * Initializes the timeline application and sets up all canvas-related interactions.
 * 
 * Performs the following:
 * - Initializes and validates DOM elements
 * - Creates and loads a Timeline instance from provided JSON
 * - Sets up keyboard and mouse controls for navigation and zooming
 * - Configures zoom button behavior
 * - Draws the initial timeline and displays usage instructions
 * 
 * Relies on global DOM elements (`canvas`, `zoomInButton`, `zoomOutButton`, etc.) initialized in `initializeDOMElements`.
 *
 * @function
 * @param {Object} timeLineJSON - The timeline data in JSON format, including timeline properties and swim lanes.
 * @returns {void}
 */
function setupCanvas(timeLineJSON) {
  initializeDOMElements();

  timeline = initializeTimeline(timeLineJSON);
  timeline.draw(canvas);

  let horizontalScrollSpeed = 50;
  let verticalScrollSpeed = 50;
  let rescaleSpeed = 10;
  
  setupKeyboardControls(timeline, verticalScrollSpeed, horizontalScrollSpeed, rescaleSpeed)
  setupMouseEvents(timeline, verticalScrollSpeed, horizontalScrollSpeed, rescaleSpeed);
  setupZoomButtons(timeline, rescaleSpeed)
  showInstructions();  
}

window.addEventListener("load", startApp);

window.addEventListener("resize", () => {
    // resize canvas and timeline

    // dpi scaling
    const dpr = window.devicePixelRatio || 1;

    // Set CSS display size (what the browser sees)
    canvas.style.width = (window.innerWidth - 10) + "px";
    canvas.style.height = window.innerHeight + "px";

    // Set actual pixel size of canvas
    canvas.width = (window.innerWidth - 10) * dpr;
    canvas.height = window.innerHeight * dpr;

    // Scale drawing context
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    isDragging = false;
    timeline.draw(canvas)
  });