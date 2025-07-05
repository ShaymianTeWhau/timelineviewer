const SHOWTEMPMARKERS = false;
const SHOWGRIDLINES = false;
const SHOWSWIMLANEBORDERS = true;
const PRINTTIMEPERIODS = false;
let infoPanel, lanePanel;
let instructionPanel;


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

function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based (0 = Jan, 11 = Dec)
  
  // Set date to the 0th day of the next month → gives last day of current month
  return new Date(year, month + 1, 0).getDate();
}

function getCalendarDayDifference(date1, date2) {
  // Clone and normalize both dates to midnight (00:00:00)
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffInMs = d2 - d1;

  return Math.round(diffInMs / msPerDay);
}


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

  constructor(scaleWidth, scaleType, focusDate, focusX, canvasWidth) {
    this.#scaleWidth = scaleWidth;
    this.setScaleType(scaleType);
    this.#focusDate = focusDate;
    this.#focusX = focusX;
    this.#canvasWidth = canvasWidth;
  }
  
  getLinePositionArray(){
    return this.#linePosArr
  }
  
  getLineDateArray(){
    return this.#lineDateArr
  }

  getYOffset(){
    return this.#yOffset
  }

  getFocusX(){
    return this.#focusX
  }

  getFocusDate(){
    return this.#focusDate
  }

  getCanvasWidth(){
    return this.#canvasWidth
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

  getScaleType(){
    return this.#scaleType
  }

  getScaleWidth() {
    return this.#scaleWidth;
  }
  
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

  moveHorizontal(horizontalScrollSpeed) {
    this.#focusX += horizontalScrollSpeed;
  }

  moveVertical(verticalScrollSpeed){
    this.#yOffset += verticalScrollSpeed;
  }

  drawBaseline(canvas) {
    const ctx = canvas.getContext("2d");

    // draw backing for baseline
    let baselineColor1 = "rgba(208, 220, 231, 0.9)";
    let baselineColor2 = "rgb(208, 220, 231)";

    const baselineGrad = ctx.createLinearGradient(0,canvas.height - this.#baseLineHeight,0,canvas.height)
    baselineGrad.addColorStop(0,baselineColor1)
    baselineGrad.addColorStop(0.6, baselineColor2)
    ctx.fillStyle = baselineGrad;
    ctx.fillRect(0, canvas.height - this.#baseLineHeight, canvas.width, this.#baseLineHeight);

    // draw baseline line
    const baselineY = canvas.height - this.#baseLineHeight + 50;
    ctx.strokeStyle = this.#baseLineFontColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(canvas.width, baselineY);
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

  draw(canvas) {
    this.#canvas = canvas;
    // temp code prevents crash if scale width is less than 1
    if (this.#scaleWidth < 1) this.#scaleWidth = 1;

    // clear canvas
    const ctx = canvas.getContext("2d");
    this.#canvasWidth = canvas.width;
    this.#canvasHeight = canvas.height;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    

    // clear line date and position arrays
    this.#lineDateArr = [];
    this.#linePosArr = [];

    /*if (this.#scaleWidth <= 10) {
      // increment scale type?
      this.#scaleType = "decade";
      this.#scaleWidth = 180;
      this.#focusX -= 180 / 2;
    }*/

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
    while (curGridLineX < canvas.width) {
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
    SwimLane.drawForegrounds(ctx, this.#swimLaneArr, this.#yOffset, this);

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

    /*
    this.#title = "Example Timeline";
    // temp implementation
    let tempTimePeriodArr = [];

    let start1 = new Date(1914, 6, 28); // July is month 6 (0-indexed)
    let end1 = new Date(1918, 10, 11);  // November is month 10
    tempTimePeriodArr.push(
      new TimePeriod("World War I", start1, end1, false, false, "A global war centered in Europe that lasted from 28 July 1914 to 11 November 1918.","rgb(255, 3, 3)", "rgb(255, 0, 0)")
    );

    let start2 = new Date(1939, 8, 1);  // September 1, 1939
    let end2 = new Date(1945, 8, 2);    // September 2, 1945
    tempTimePeriodArr.push(
      new TimePeriod("World War II", start2, end2, false, false, "A global war that lasted from 1 September 1939 to 2 September 1945.")
    );
    
    // Russian Revolution (1917)
    let russianRevStart = new Date(1917, 2); // March 1917
    let russianRevEnd = new Date(1917, 10);  // November 1917
    tempTimePeriodArr.push(
      new TimePeriod("Russian Revolution", russianRevStart, russianRevEnd, false, false, "Political revolution in Russia leading to the fall of the Tsar and rise of the Soviet Union.")
    );

    // approx start example
    let start0 = new Date(1925, 1, 2,3,4,5);
    let end0 = new Date(1930, 1, 2,3,4,5);
    tempTimePeriodArr.push(
      new TimePeriod("approxStartExample", start0, end0, true, false, "An example time period", "rgb(77, 255, 53)", "rgb(64, 255, 0)")
    );

    // approx end example
    tempTimePeriodArr.push(
      new TimePeriod("approxEndExample", start0, end0, false, true, "An example time period", "rgb(77, 255, 53)", "rgb(255, 0, 0)")
    );

    // approx start and end example
    tempTimePeriodArr.push(
      new TimePeriod("approxStartAndEndExample", start0, end0, true, true, "An example time period", "rgb(77, 255, 53)", "rgb(255, 0, 0)")
    );
    
    // Armenian Genocide (1915–1917)
    let armenianGenocideStart = new Date(1915, 3); // April 1915
    let armenianGenocideEnd = new Date(1917, 11);  // December 1917
    tempTimePeriodArr.push(
      new TimePeriod("Armenian Genocide", armenianGenocideStart, armenianGenocideEnd, false, false, "Mass killing and deportation of Armenians by the Ottoman Empire during WWI.")
    );

    // Holocaust (c. 1941–1945)
    let holocaustStart = new Date(1941, 5); // June 1941
    let holocaustEnd = new Date(1945, 4);   // May 1945
    tempTimePeriodArr.push(
      new TimePeriod("The Holocaust", holocaustStart, holocaustEnd, true, false, "Systematic genocide of six million Jews and millions of others by Nazi Germany.")
    );
    
    // Second Sino-Japanese War (1937–1945)
    let sinoJapWarStart = new Date(1937, 6, 7); // July 7, 1937
    let sinoJapWarEnd = new Date(1945, 8, 9);   // September 9, 1945
    tempTimePeriodArr.push(
      new TimePeriod("Second Sino-Japanese War", sinoJapWarStart, sinoJapWarEnd, false, false, "Conflict between China and Japan that became part of WWII.")
    );
    
    // Manhattan Project (1942–1946)
    let manhattanProjectStart = new Date(1942, 0); // January 1942
    let manhattanProjectEnd = new Date(1946, 11);  // December 1946
    tempTimePeriodArr.push(
      new TimePeriod("Manhattan Project", manhattanProjectStart, manhattanProjectEnd, false, false, "U.S.-led research to develop nuclear weapons during WWII.")
    );
    
    this.#swimLaneArr.push(new SwimLane("lane1", false, this.#canvasWidth, [0,1,3].map(i=>tempTimePeriodArr[i]), "rgb(255, 211, 211)"));
    this.#swimLaneArr.push(new SwimLane("lane2", false, this.#canvasWidth, [2,4,5,9].map(i=>tempTimePeriodArr[i]), "rgb(255, 250, 211)"));
    this.#swimLaneArr.push(new SwimLane("lane3", false, this.#canvasWidth, [6,7,8].map(i=>tempTimePeriodArr[i]), "rgb(211, 255, 250)"));
    */
   this.#setupLanePanel();
  }

}

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

  constructor(name, isHidden, width, timePeriodArr, color="rgb(234,234,234)"){
    this.#name = name;
    this.#isHidden = isHidden;
    this.#width = width;
    this.#timePeriodArr = timePeriodArr;
    this.#color = color;
  }

  static drawBackgrounds(ctx,timeline, swimLaneArr, y){
    // function to draw backgrounds for an array of SwimLanes (bottom up), beginning at a y coordinate
    
    for(let i = swimLaneArr.length-1;i>=0;i--){
      if(!swimLaneArr[i].getVisibility()) continue;
      swimLaneArr[i].setUpTimePeriods(ctx, timeline);
      y -= swimLaneArr[i].getHeight();
      swimLaneArr[i].drawBackground(ctx,timeline, y);
    }
  }

  static drawForegrounds(ctx, swimLaneArr, y, timeline){
    // function to draw foregrounds for an array of SwimLanes, beginning at y coordinate
    for(let i = 0;i<swimLaneArr.length;i++){
      if(!swimLaneArr[i].getVisibility()) continue;
      swimLaneArr[i].drawTimePeriods(ctx, timeline);
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

  drawBackground(ctx,timeline, y){
    if(this.#isHidden) return;
    this.#bottomY = y + this.#height;

    //this.setUpTimePeriods(ctx,timeline);

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

  drawTimePeriods(ctx, timeline){
    if(this.#isHidden) return;
    if(this.#timePeriodArr.length==0) return;
    //this.#setUpTimePeriods(ctx, timeline);
    
    // draw time periods in each row
    for(let i = 0;i<this.#row.length;i++){
      let rowNum = i;
      let y = this.#bottomY - this.#margin - rowNum * this.#rowHeight;

      for(let j = 0;j< this.#row[i].length;j++){
        let periodIndex = this.#row[i][j];
        this.#timePeriodArr[periodIndex].draw(ctx, timeline,y);
      }
    }
  }

  setUpTimePeriods(ctx, timeline){
    if(this.#isHidden) return;
    if(!this.#timePeriodArr) return;
    if(this.#timePeriodArr.length==0) return;

    
    this.#row = [[]];
    this.#row[0].push(0); // add first time period to row 0
    
    this.#timePeriodArr[0].setupCoordinates(ctx, timeline, this.#bottomY); // setup coords for each period
    this.#rowHeight = this.#timePeriodArr[0].getBoundingHeight();

    if(PRINTTIMEPERIODS) console.log(this.#timePeriodArr[0].toStringShort());

    for(let i = 1;i<this.#timePeriodArr.length;i++){
      this.#timePeriodArr[i].setupCoordinates(ctx, timeline, this.#bottomY); // setup coords for each period

      if(PRINTTIMEPERIODS) console.log(this.#timePeriodArr[i].toStringShort());

      let curStartX = this.#timePeriodArr[i].getStartX();
      let curRow = 0;
      
      let prevPeriodIndexInCurRow = this.#row[curRow][this.#row[curRow].length-1];
      let prevPeriodInCurRow = this.#timePeriodArr[prevPeriodIndexInCurRow];
      let prevEndXInCurRow = prevPeriodInCurRow.getBoundingEndX();

      while(curStartX < prevEndXInCurRow){
        curRow++;

        if(curRow>=this.#row.length){
          this.#row.push([]); // adds a new empty row
          break; // row is empty so don't do following calculations
        }
        prevPeriodIndexInCurRow = this.#row[curRow][this.#row[curRow].length-1];
        prevEndXInCurRow = this.#timePeriodArr[prevPeriodIndexInCurRow].getBoundingEndX();
      }
      this.#row[curRow].push(i)
    }
    this.#height = Math.max(this.#minHeight,this.#margin*2+this.#row.length*this.#rowHeight);
  }

}

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

  draw(ctx, timeline, y){
    this.#y = y - this.#boundingHeight; // boundingBox top left corner y coordinate
    this.#barY = y - this.#height; // time period bar top left corner y coordinate
    
    //this.setupCoordinates(ctx, timeline, y)

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
    //ctx.fillRect(this.#x, this.#barY, this.#width, this.#height)
  }

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

  #getTransparent(colorStr){
    // return transparent version of a color
    const rgb = this.#extractRGB(colorStr);
    return "rgba("+ rgb.r + ", " + rgb.g + ", " + rgb.b + ", 0)";
  }

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

  #calculateX(timeline, dateForConversion){
    let x = -1000;

    // get timeline grid arrays
    let lineDateArr = timeline.getLineDateArray();
    let linePosArr = timeline.getLinePositionArray();

    // if date is not in grid -don't print
    // ???

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


//    gridWidthUnits = endDate.getFullYear() - startDate.getFullYear();
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

function hideInstructions(){
  instructionPanel.innerHTML = "";
}
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

function startApp(){
  fetch('timeline.json')
  .then(res => res.json())
  .then(data => {
    setupCanvas(data)
  })
  .catch(err => console.error("Error loading timeline:", err));
}

function setupCanvas(timeLineJSON) {
  const canvas = document.getElementById("timeline-canvas");
  infoPanel = document.getElementById("info-panel")
  const zoomInButton = document.getElementById("zoom-in");
  const zoomOutButton = document.getElementById("zoom-out");
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

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight;
  let mouseX = -1;
  let mouseY = -1;
  let horizontalScrollSpeed = 50;
  let verticalScrollSpeed = 50;
  let rescaleSpeed = 10;

  let focusDate = new Date(-1, 11, 31, 23, 59, 59, 999);
  focusDate = new Date(1, 0, 1, 0, 0, 0, 0);
  focusDate.setFullYear(1920);

  let scaleType = "decade";
  let focusX = canvas.width / 2;
  let scaleWidth = 200;
  const timeline = new Timeline(scaleWidth, scaleType, focusDate, focusX, canvas.width);
  timeline.load(timeLineJSON)
  timeline.draw(canvas);
  
  // variables for dragging the screen
  let isDragging = false;
  let dragStart = { x: 0, y: 0}
  let offset = { x: 0, y: 0 }

  window.addEventListener("keydown", (event) => {
    // rescale
    if (event.altKey){
      if (event.key === "ArrowUp") {
        // scale zoom in
        timeline.rescale(rescaleSpeed, canvas.width/2);
      } else if (event.key === "ArrowDown") {
        // scale zoom out
        timeline.rescale(-rescaleSpeed, canvas.width/2);
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


  let zoomInterval = null;
  let zoomTimeout = null;
  const zoomSpeedMs = 75;
  const firstZoomDelay = 250;

  function startZooming(direction) {
    // prevent multiple intervals
    if (zoomInterval || zoomTimeout) return;

    // initial zoom
    timeline.rescale(direction * rescaleSpeed, canvas.width / 2);
    timeline.draw(canvas);

    // Timeout after first zoom
    zoomTimeout = setTimeout(() => {

      // After first zoom, start regular interval
      zoomInterval = setInterval(() => {
        timeline.rescale(direction * rescaleSpeed, canvas.width / 2);
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

  showInstructions();
}

window.addEventListener("load", startApp);
window.addEventListener("resize", startApp);
