let courses = [];
let tableOffset = 30;
let rowHeight = 130;
let rowPadding = 4;
let cellPadding = 4;
let numYears;

function preload() {
  courseData = loadTable("courseData.csv", "csv", "header");
  print(courseData);
}

function setup() {
  createCanvas(1000, 800);
  
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
