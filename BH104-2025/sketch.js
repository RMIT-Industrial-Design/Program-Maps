// v0.11
// responds to Caroline's requests
// All subjects as popup menu
// Semester headings changed
// sets Canvas size based on number of years in table

let courseData;
let majorData;
let courses = [];
let majors = [];
let tableOffsetH = 30;
let tableOffsetV = 35;
let rowHeight = 120; // for multi-selection in popup menu
// let rowHeight = 280; // for multi-selection in table
let rowPadding = 4;
let cellPadding = 4;
let tablePadding = 25;
let textRowHeight = 50;
let numYears;
let tableHeight;
let majorsHeight;

// headings
let topLabel1 = "Semester 1";
let topLabel2 = "Semester 2";

// popup menu
let courseMenu;
let menuVisible = false;

const NOTAVAIL = 0;
const AVAILABLE = 1;
const COMPLETED = 2;
const EQUIVALENT = 3;

function preload() {
    courseData = loadTable("courseData.csv", "csv", "header");
    majorData = loadTable("majorData.csv", "csv", "header");
}

function setup() {
    // get height of table
    numYears = max(courseData.getColumn("year"));
    tableHeight = tableOffsetV + (rowHeight + rowPadding) * numYears;
    // calculate space needed below the table
    let maxCourses = 0;
    for (let i = 0; i < majorData.getRowCount(); i++) {
        let numCore = splitTokens(majorData.getString(i, "core")).length;
        let numOptions = splitTokens(majorData.getString(i, "options")).length;
        let numCourses = numCore + numOptions;
        if (numCourses > maxCourses) maxCourses = numCourses;
    }
    majorsHeight = maxCourses * textRowHeight;
    // make the Canvas
    let canvasHeight = tableHeight + tablePadding + majorsHeight;
    let canvasWidth = 1000; // the Canvas LMS restricts iframe content to 1000
    createCanvas(canvasWidth, canvasHeight);

    // load the data into class arrays
    loadCourseDetails();
    loadMajorDetails();
    // set the available courses based on prerequisite data
    updateAvailableCourses();

    // create a menu object
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
    // draw the majors
    for (let i = 0; i < majors.length; i++) {
        majors[i].show();
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
    let numColumns = max(courseData.getColumn("column"));

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
            numColumns,
        );
    }
    // print(courses);
}

function loadMajorDetails() {
    //get table data
    let numColumns = majorData.getRowCount();

    //load major data
    for (let i = 0; i < majorData.getRowCount(); i++) {
        let name = majorData.getString(i, "name");
        let core = splitTokens(majorData.getString(i, "core"));
        let options = splitTokens(majorData.getString(i, "options"));
        let number = majorData.getString(i, "number");
        // put major data into an object array
        majors[i] = new Major(
            i,
            tableOffsetH,
            tableOffsetV,
            majorsHeight,
            tablePadding,
            cellPadding,
            name,
            core,
            options,
            number,
            numColumns
        );
    }
}

function drawTopLabels(offsetH, offsetV, rPadding, cPadding) {
    // draw semester box
    noStroke();
    fill(220, 220, 220);
    rect(
        offsetH + cPadding,
        rPadding,
        (width - (offsetH + cPadding)) / 2 - cPadding,
        offsetV - cPadding
    );
    rect(
        offsetH + cPadding * 2 + (width - (offsetH + cPadding)) / 2 - cPadding,
        rPadding,
        (width - (offsetH + cPadding)) / 2 - cPadding,
        offsetV - cPadding
    );
    // draw text
    textAlign(CENTER, CENTER);
    textSize(width / 60);
    fill(10, 10, 10);
    noStroke();
    text(topLabel1, offsetH + cPadding + ((width - (offsetH + cPadding)) / 2 - cPadding) / 2, rPadding + 15);
    text(topLabel2, offsetH + cPadding * 2 + (width - (offsetH + cPadding)) / 2 - cPadding + ((width - (offsetH + cPadding)) / 2 - cPadding) / 2, rPadding + 15);
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