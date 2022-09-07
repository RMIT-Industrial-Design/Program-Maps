// v0.10
// responds to Caroline's requests
// Program electives as popup menu
// Semester headings
// sets Canvas size based on number of years in table

let courseData;
let courses = [];
let tableOffsetH = 30;
let tableOffsetV = 35;
let rowHeight = 120; // for multi-selection in popup menu
// let rowHeight = 280; // for multi-selection in table
let rowPadding = 4;
let cellPadding = 4;
let numYears;

// headings
let topLabel = "Semester 1 or 2";

// popup menu
let courseMenu;
let menuVisible = false;

const NOTAVAIL = 0;
const AVAILABLE = 1;
const COMPLETED = 2;
const EQUIVALENT = 3;

function preload() {
  courseData = loadTable("courseDataBH104.csv", "csv", "header");
}

function setup() {
  // get height of table
  numYears = max(courseData.getColumn("year"));
  let canvasHeight = tableOffsetV + (rowHeight + rowPadding) * numYears;
  let canvasWidth = 1000; // the Canvas LMS restricts iframe content to 1000

  createCanvas(canvasWidth, canvasHeight);

  loadCourseDetails();

  updateAvailableCourses();

  courseMenu = new Menu();

  // print(courseData);
  // print(courses);
}

function draw() {
  background(255);
  // draw top labels
  drawTopLabels(tableOffsetH, tableOffsetV, rowPadding, cellPadding);
  // draw year labels
  drawYearLabels(
    tableOffsetH,
    tableOffsetV,
    numYears,
    rowHeight,
    rowPadding,
    cellPadding
  );
  // draw courses
  for (let i = 0; i < courses.length; i++) {
    courses[i].show();
  }
  // draw popup menu
  if (menuVisible) {
    courseMenu.show();
  }
}

function mousePressed() {
  let courseChange = false;
  if (menuVisible) {
    courseChange = courseMenu.clicked(mouseX, mouseY);
  } else {
    for (let i = 0; i < courses.length; i++) {
      courseChange = courses[i].clicked(mouseX, mouseY);
      if (courseChange) {
        break;
      }
    }
  }
  if (courseChange) {
    updateAvailableCourses();
    // do it twice to fix a refresh bug
    updateAvailableCourses();
  }
}

function loadCourseDetails() {
  //get table data
  let tableWidth = max(courseData.getColumn("column"));

  //load course data
  for (let i = 0; i < courseData.getRowCount(); i++) {
    let code = courseData.getString(i, "code");
    let name = courseData.getString(i, "name");
    let year = courseData.getString(i, "year");
    let column = courseData.getString(i, "column");
    let points = courseData.getString(i, "points");
    let option = courseData.getString(i, "option");
    let number = courseData.getString(i, "number");
    let prerequisits = splitTokens(courseData.getString(i, "prerequisits"));
    let equivalents = splitTokens(courseData.getString(i, "equivalents"));
    let menu = splitTokens(courseData.getString(i, "menu"));
    // put course data into an object array
    courses[i] = new Course(
      i,
      tableOffsetH,
      tableOffsetV,
      rowHeight,
      rowPadding,
      cellPadding,
      code,
      name,
      year,
      column,
      points,
      option,
      number,
      prerequisits,
      equivalents,
      menu,
      tableWidth
    );
  }
  // print(courses);
}

function drawTopLabels(offsetH, offsetV, rPadding, cPadding) {
  // draw semester box
  noStroke();
  fill(220, 220, 220);
  rect(
    offsetH + cPadding,
    rPadding,
    (width - (offsetH + cPadding))/2 - cPadding,
    offsetV - cPadding
  );
  rect(
    offsetH + cPadding * 2 + (width - (offsetH + cPadding))/2 - cPadding,
    rPadding,
    (width - (offsetH + cPadding))/2 - cPadding,
    offsetV - cPadding
  );
  // draw text
  textAlign(CENTER, CENTER);
  textSize(width / 60);
  fill(10, 10, 10);
  noStroke();
  text(topLabel, offsetH + cPadding + ((width - (offsetH + cPadding))/2 - cPadding)/2, rPadding + 15);
  text(topLabel, offsetH + cPadding * 2 + (width - (offsetH + cPadding))/2 - cPadding + ((width - (offsetH + cPadding))/2 - cPadding)/2, rPadding + 15);
}

function drawYearLabels(offsetH, offsetV, years, rHeight, rPadding, cPadding) {
  for (let i = 1; i <= years; i++) {
    // draw box
    noStroke();
    fill(255, 10, 10);
    rect(
      cPadding,
      offsetV + rPadding + (rPadding + rHeight) * (i - 1),
      offsetH - cPadding,
      rHeight - cPadding
    );
    // draw text
    push();
    translate(
      offsetH / 1.6,
      offsetH + (rHeight + rPadding) / 2 + (rHeight + rPadding) * (i - 1)
    );
    rotate(radians(-90));
    textAlign(CENTER, CENTER);
    textSize(width / 60);
    fill(255, 255, 255);
    text("Year " + i, 0, 0);
    pop();
  }
}

function updateAvailableCourses() {
  // check each course
  for (let i = 0; i < courses.length; i++) {
    let avail = false;
    let equiv = false;

    // check the prerequisits
    if (courses[i].prereqs == null) {
      // no perreqs so if not available make it available
      avail = true;
    } else {
      // check each of the prerequs
      let thePrereqs = courses[i].prereqs;
      let numCompleted = 0;
      for (let j = 0; j < thePrereqs.length; j++) {
        let prereqCourse = thePrereqs[j];
        let foundPrereq = false;
        // split up the OR prerequisits
        let multiplePrereq = split(prereqCourse, "||");
        for (let m = 0; m < multiplePrereq.length; m++) {
          let theCourse = multiplePrereq[m];
          // look for the prereq in completed courses
          for (let k = 0; k < courses.length; k++) {
            if (
              courses[k].code == theCourse &&
              (courses[k].status == COMPLETED ||
                courses[k].status == EQUIVALENT)
            ) {
              foundPrereq = true;
              break;
            }
          }
        }
        if (foundPrereq) {
          numCompleted++;
        }
      }
      if (numCompleted == thePrereqs.length) {
        avail = true;
      } else {
        avail = false;
      }
    }

    // check to see if equivalent course has been completed
    if (courses[i].equivalents != null) {
      // check each of the equivalents
      let theEquivalents = courses[i].equivalents;
      for (let j = 0; j < theEquivalents.length; j++) {
        let equivalentCourse = theEquivalents[j];
        let foundEquivalent = false;
        // look for the equivalent in complete courses
        for (let k = 0; k < courses.length; k++) {
          if (
            courses[k].code == equivalentCourse &&
            courses[k].status == COMPLETED
          ) {
            foundEquivalent = true;
            break;
          }
        }
        if (foundEquivalent) {
          equiv = true;
          break;
        }
      }
    }
    if (!avail) {
      courses[i].status = NOTAVAIL;
      //reset the display
      courses[i].code = courseData.getString(i, "code");
      courses[i].name = courseData.getString(i, "name");
    } else {
      if (courses[i].status != COMPLETED) {
        if (avail && equiv) {
          courses[i].status = EQUIVALENT;
        } else if (avail) {
          courses[i].status = AVAILABLE;
        }
      }
    }
  }
}

class Menu {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.cellWidth = 300;
    this.cellHeight = 20;
    this.codes = [];
    this.names = [];
    this.avail = [];
    this.ref = -1;
  }

  update(x, y, codes, ref) {
    this.x = x;
    this.y = y;
    // empty arrays
    this.codes = [];
    this.names = [];
    this.avail = [];
    // deep copy the codes
    for (let i = 0; i < codes.length; i++) {
      this.codes[i] = codes[i];
    }
    this.ref = ref;
    // collect the menu item names
    let longestName = 0;
    for (let i = 0; i < codes.length; i++) {
      // collect the menu item names
      for (let j = 0; j < courseData.getRowCount(); j++) {
        if (courseData.getString(j, "code") == this.codes[i]) {
          let theName = courseData.getString(j, "name");
          longestName = max(longestName, theName.length);
          this.names[i] = theName;
          break;
        }
      }
      if (this.codes[i] == "University") {
        this.avail[i] = true;
      } else {
        // check the menu item availability
        for (let j = 0; j < courses.length; j++) {
          if (courses[j].code == this.codes[i]) {
            if (courses[j].status == COMPLETED) {
              this.avail[i] = false;
            } else {
              this.avail[i] = true;
            }
            break;
          }
        }
      }
    }
    // add a 'none' option
    this.codes.push("none");
    this.names.push("");
    this.avail.push(true);
    // adjust menu width to suit text
    this.cellWidth = longestName * 6 + 80;
  }

  show() {
    noStroke();
    // draw grey over canvas
    fill(10, 10, 10, 100);
    rect(0, 0, width, height);
    // check menu is on screen
    this.x = min(this.x, width - this.cellWidth);
    this.y = min(this.y, height - this.cellHeight * this.codes.length);
    // draw menu boxes
    for (let i = 0; i < this.codes.length; i++) {
      // draw menu boxes
      if (this.avail[i]) {
        fill(0, 200, 0);
      } else {
        fill(170, 170, 170);
      }
      stroke(100, 100, 100);
      rect(
        this.x,
        this.y + this.cellHeight * i,
        this.cellWidth,
        this.cellHeight
      );
      // write menu text
      noStroke();
      let textPadding = 5;
      textAlign(LEFT, CENTER);
      textSize(width / 80);
      fill(50);
      text(
        this.codes[i] + " " + this.names[i],
        this.x + textPadding,
        this.y + this.cellHeight * i,
        this.cellWidth,
        this.cellHeight
      );
    }
  }

  clicked(clickX, clickY) {
    let menuHeight = this.cellHeight * this.codes.length;
    let theCode;
    let theName;
    let theAvail;
    if (
      clickX > this.x &&
      clickX < this.x + this.cellWidth &&
      clickY > this.y &&
      clickY < this.y + menuHeight
    ) {
      // check each row for menu selection
      for (let i = 0; i < this.codes.length; i++) {
        if (
          clickY > this.y + this.cellHeight * i &&
          clickY < this.y + this.cellHeight * (i + 1)
        ) {
          theCode = this.codes[i];
          theName = this.names[i];
          theAvail = this.avail[i];
          break;
        }
      }
      if (theAvail) {
        // action menu selection
        if (theCode == "none") {
          courses[this.ref].code = courseData.getString(this.ref, "code");
          courses[this.ref].name = courseData.getString(this.ref, "name");
          courses[this.ref].status = NOTAVAIL;
        } else {
          courses[this.ref].code = theCode;
          courses[this.ref].name = theName;
          courses[this.ref].status = COMPLETED;
        }
        // hide menu
        menuVisible = false;
        return true;
      }
    } else {
      // hide menu
      menuVisible = false;
    }
  }
}

class Course {
  constructor(
    ref,
    offsetH,
    offsetV,
    rHeight,
    rPadding,
    cPadding,
    code,
    name,
    year,
    column,
    points,
    option,
    number,
    prereqs,
    equivalents,
    menu,
    tableWidth
  ) {
    this.ref = ref;
    let columnWidth = (width - cPadding - offsetH) / tableWidth;
    this.cellHeight = rHeight / number - cPadding;
    this.code = code;
    this.name = name;
    this.year = year;
    this.points = points;
    this.prereqs = prereqs;
    this.equivalents = equivalents;
    this.menu = menu;
    this.x = cPadding + columnWidth * (column - 1) + offsetH;
    this.y =
      offsetV +
      rPadding +
      (rowHeight + rPadding) * (year - 1) +
      (this.cellHeight + cPadding) * (option - 1);
    if (points == 12) {
      this.cellWidth = columnWidth - cPadding;
    } else {
      this.cellWidth = columnWidth * 2 - cPadding;
    }
    this.status = NOTAVAIL;
  }

  show() {
    let theText;
    if (this.code == null || this.code == "") {
      theText = "Select a";
    } else {
      theText = this.code;
    }
    let textPadding = 8;
    if (this.status == EQUIVALENT) {
      fill(150, 200, 150);
    } else if (this.status == COMPLETED) {
      fill(0, 200, 0);
    } else if (this.status == AVAILABLE) {
      fill(130, 160, 255);
    } else {
      fill(170, 170, 170);
    }
    // draw box
    noStroke();
    rect(this.x, this.y, this.cellWidth, this.cellHeight);
    // display course details
    textAlign(CENTER, CENTER);
    textSize(width / 80);
    fill(50);
    text(
      theText + "\n" + this.name,
      this.x + textPadding,
      this.y + textPadding,
      this.cellWidth - 2 * textPadding,
      this.cellHeight - 2 * textPadding
    );
  }

  clicked(clickX, clickY) {
    if (
      clickX > this.x &&
      clickX < this.x + this.cellWidth &&
      clickY > this.y &&
      clickY < this.y + this.cellHeight
    ) {
      if (this.menu.length > 0) {
        if (this.status == AVAILABLE || this.status == COMPLETED) {
          courseMenu.update(clickX, clickY, this.menu, this.ref);
          menuVisible = true;
        }
      } else if (this.status == AVAILABLE || this.status == EQUIVALENT) {
        this.status = COMPLETED;
      } else if (this.status == COMPLETED) {
        this.status = AVAILABLE;
      }
      return true;
    } else {
      return false;
    }
  }
}
