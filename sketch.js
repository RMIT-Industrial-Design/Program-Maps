let courseData;
let courses = [];
let tableOffset = 30;
let rowHeight = 130;
let rowPadding = 4;
let cellPadding = 4;
let numYears;

function preload() {
  courseData = loadTable("courseData.csv", "csv", "header");
}

function setup() {
  createCanvas(1000, 550);
  
  loadCourseDetails();
  
  updateAvailableCourses();
}

function draw() {
  background(255);
  // draw year labels
  drawYearLabels(numYears, rowHeight, tableOffset, rowPadding, cellPadding);
  // draw courses
  for (let i = 0; i < courses.length; i++) {
    courses[i].show();
  }
}

function mousePressed() {
  let courseChange = false;
  for (let i = 0; i < courses.length; i++) {
    courseChange = courses[i].clicked(mouseX, mouseY);
    if (courseChange) {
      updateAvailableCourses();
      // do it twice to fix a refresh bug
      updateAvailableCourses();
      break;
    }
  }
}

function loadCourseDetails() {
  //get table data
  let tableWidth = max(courseData.getColumn('column'));
  numYears = max(courseData.getColumn('year'));
  
  //load course data
  for (let i = 0; i < courseData.getRowCount(); i++) {
    let code = courseData.getString(i,'code');
    let name = courseData.getString(i,'name');
    let year = courseData.getNum(i,'year');
    let column = courseData.getNum(i,'column');
    let points = courseData.getNum(i,'points');
    let option = courseData.getNum(i,'option');
    let number = courseData.getNum(i,'number');
    let prerequisits = splitTokens(courseData.getString(i,'prerequisits'));
    let equivalents = splitTokens(courseData.getString(i,'equivalents'));
    // put course data into an object array
    courses[i] = new Course(tableOffset, rowHeight, rowPadding, cellPadding, code, name, year, column, points, option, number, prerequisits, equivalents, tableWidth);
  }
  print(courses);
}

function drawYearLabels(years, rHeight, tOffset, rPadding, cPadding) {
  for (let i = 1; i <= years; i++){
    // draw box
    noStroke();
    fill(255, 10, 10);
    rect(cPadding, rPadding + ((rPadding + rHeight) * (i-1)), tOffset-cPadding, rHeight-cPadding);
    // draw text
    push();
    translate(tOffset/1.6, (rHeight + rPadding)/2 + (rHeight + rPadding) * (i - 1));
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
    // check if the course has prerequs
    if (courses[i].prereqs == null) {
      // no perreqs so make available
      courses[i].available = true;
    } else {
      // check each of the prerequs
      let thePrereqs = courses[i].prereqs;
      let numCompleted = 0;
      for (let j = 0; j < thePrereqs.length; j++) {
        let prereqCourse = thePrereqs[j];
        let foundPrereq = false;
        // look for the prereq in complete courses
        for (let k = 0; k < courses.length; k++) {
          if (courses[k].code == prereqCourse && (courses[k].completed || courses[k].equivalent)) {
            foundPrereq = true;
            break;
          }
        }
        if (foundPrereq) {
          numCompleted++;
        }
      }
      if (numCompleted == thePrereqs.length) {
        courses[i].available = true;
      } else {
        courses[i].available = false;
        courses[i].completed = false;        
        courses[i].equivalent = false;        
      }
      
      // check to see if equivalent course has been completed
      if (courses[i].equivalents == null || courses[i].completed) {
        // no equivalents so make available
        courses[i].equivalent = false;
      } else {
        // check each of the equivalents
        let theEquivalents = courses[i].equivalents;
        for (let j = 0; j < theEquivalents.length; j++) {
          let equivalentCourse = theEquivalents[j];
          let foundEquivalent = false;
          // look for the equivalent in complete courses
          for (let k = 0; k < courses.length; k++) {
            if (courses[k].code == equivalentCourse && courses[k].completed) {
              foundEquivalent = true;
              break;
            }
          }
          if (foundEquivalent) {
            courses[i].equivalent = true;
            break;
          } else {
            courses[i].equivalent = false;
          }
        }
      }
    }
  }
}

class Course {
  constructor(offset, rHeight, rPadding, cPadding, code, name, year, column, points, option, number, prereqs, equivalents, tableWidth) {
    let columnWidth = (width - cPadding - offset) / tableWidth;
    this.cellHeight = (rHeight / number) - cPadding;
    this.code = code;
    this.name = name;
    this.year = year;
    this.points = points;
    this.prereqs = prereqs;
    this.equivalents = equivalents;    
    this.x = cPadding + columnWidth * (column - 1) + offset;
    this.y = rPadding + (rowHeight + rPadding) * (year - 1) + ((this.cellHeight + cPadding) * (option - 1));
    if (points == 12) {
      this.cellWidth = columnWidth - cPadding;
    } else {
      this.cellWidth = columnWidth * 2 - cPadding;
    }
    this.completed = false;
    this.available = false;
    this.equivalent = false;
  }

  show() {
    let textPadding = 8;
    if (this.equivalent) {
      fill(150, 200, 150);
    } else if (this.completed) {
      fill(0, 200, 0);
    } else if (this.available) {
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
      this.code + "\n" + this.name,
      this.x + textPadding,
      this.y + textPadding,
      this.cellWidth - (2*textPadding),
      this.cellHeight - (2*textPadding)
    );
  }

  clicked(clickX, clickY) {
    if (
      clickX > this.x &&
      clickX < this.x + this.cellWidth &&
      clickY > this.y &&
      clickY < this.y + this.cellHeight
    ) {
      if (this.available) {
        this.completed = !this.completed;
        if (this.completed){
          this.equivalent = false;
        }
        return true;
      }
    } else {
      return false;
    }
  }
}
