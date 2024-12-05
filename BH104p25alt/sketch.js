// v0.11
// responds to Caroline's requests
// All subjects as popup menu
// Semester headings changed
// sets Canvas size based on number of years in table

let programStructure;
let courseData;
let majorData;
let courseInterface = [];
let tableOffsetH = 30;
let tableOffsetV = 45;
let rowHeight = 120;
let rowPadding = 4;
let cellPadding = 6;
let tablePadding = 25;
let textRowHeight = 50;
let rectRadius = 6;
let numYears;
let tableHeight;
let columnWidth;
let numberMajors;
let majorsHeight;
let canvasWidth = 1000; // the Canvas LMS restricts iframe content to 1000

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
    programStructure = loadTable("structure.csv", "csv", "header");
    courseData = loadTable("courses.csv", "csv", "header");
    majorData = loadTable("majors.csv", "csv", "header");
}

function setup() {
    // get dimensions of table
    numYears = max(programStructure.getColumn("year"));
    let numColumns = max(programStructure.getColumn("column"));
    columnWidth = (canvasWidth - cellPadding - tableOffsetH) / numColumns;
    // load course data into the interface
    tableHeight = loadInterface();
    // calculate space needed below the table
    let maxCourses = 0;
    numberMajors = 0;
    for (let i = 0; i < majorData.getRowCount(); i++) {
        if (majorData.getString(i, "code").substring(0, 5) == "MAJOR") {
            let numCore = splitTokens(majorData.getString(i, "core")).length;
            let numOptions = splitTokens(majorData.getString(i, "options")).length;
            let numCourses = numCore + numOptions;
            if (numCourses > maxCourses) maxCourses = numCourses;
            numberMajors++;
        }
    }
    majorsHeight = maxCourses * textRowHeight;
    // make the Canvas
    let canvasHeight = tableHeight + tablePadding + majorsHeight;
    createCanvas(canvasWidth, canvasHeight);

    // set the available courses based on prerequisite data
    updateAvailableCourses();

    // create a menu object
    courseMenu = new Menu();
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
    for (let i = 0; i < courseInterface.length; i++) {
        courseInterface[i].show();
    }
    // draw the majors
    drawMajors();
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
        for (let i = 0; i < courseInterface.length; i++) {
            courseChange = courseInterface[i].clicked(mouseX, mouseY);
            if (courseChange) {
                break;
            }
        }
    }
    if (courseChange) {
        updateAvailableCourses();
        // do it twice to account for cascading changes
        updateAvailableCourses();
    }
}

function loadInterface() {
    // make vertical offsets to account for major and minor selection
    let yOffset = [];
    for (let a = 0; a <= numYears; a++) {
        yOffset[a] = 0;
    }
    let maxYloc = 0;
    //load course data
    for (let i = 0; i < programStructure.getRowCount(); i++) {
        let code = programStructure.getString(i, "code");
        let name = programStructure.getString(i, "name");
        let prereqs = splitTokens(programStructure.getString(i, "prerequisits"));
        // get course details
        if (code != null || code != "") {
            for (let j = 0; j < courseData.getRowCount(); j++) {
                if (code == courseData.getString(j, "code")) {
                    // names in the structure override course names
                    if (name == null || name == "") {
                        name = courseData.getString(j, "name");
                    }
                    if (prereqs == null || prereqs.length == 0) {
                        prereqs = splitTokens(courseData.getString(j, "prerequisits"));
                    }
                    break;
                }
            }
        }
        let year = programStructure.getString(i, "year");
        let column = programStructure.getString(i, "column");
        let numColumns = programStructure.getString(i, "width");
        let cellWidth = columnWidth * numColumns - cellPadding;
        let cellHeight = rowHeight;
        // make a button row half height
        if (code == "majorSelect" || code == "minorSelect") {
            cellHeight /= 2;
            yOffset[year] = cellHeight;
        }
        cellHeight -= cellPadding;
        // calculate location
        let xLoc = cellPadding + columnWidth * (column - 1) + tableOffsetH;
        let yLoc =
            tableOffsetV +
            rowPadding +
            (rowHeight + rowPadding) * (year - 1);
        // add the offset to all previous years for button rows
        for (let a = 0; a < year; a++) {
            yLoc += yOffset[a];
        }
        // bump a button row to the next row
        if (code == "majorSelect" || code == "minorSelect") {
            yLoc += rowHeight + (rowPadding / 2);
        }
        // get the type of interaction
        let type = "course";
        if (code == "majorSelect") {
            type = "major";
        } else if (code == "minorSelect") {
            type = "minor";
        }
        // record the maximum vertical location
        if (yLoc > maxYloc) maxYloc = yLoc;
        let menu = splitTokens(programStructure.getString(i, "menu"));
        // put course data into an object array
        courseInterface[i] = new SelectBox(
            i,
            cellHeight,
            cellWidth,
            xLoc,
            yLoc,
            code,
            type,
            name,
            year,
            menu,
            prereqs
        );
    }
    return maxYloc + rowHeight;
}

function drawTopLabels(offsetH, offsetV, rPadding, cPadding) {
    // draw semester box
    noStroke();
    fill(220, 220, 220);
    rect(
        offsetH + cPadding,
        rPadding,
        (width - (offsetH + cPadding)) / 2 - cPadding,
        offsetV - cPadding, rectRadius
    );
    rect(
        offsetH + cPadding * 2 + (width - (offsetH + cPadding)) / 2 - cPadding,
        rPadding,
        (width - (offsetH + cPadding)) / 2 - cPadding,
        offsetV - cPadding, rectRadius
    );
    // draw text
    textAlign(CENTER, CENTER);
    textSize(width / 60);
    fill(10, 10, 10);
    noStroke();
    text(topLabel1, offsetH + cPadding + ((canvasWidth - (offsetH + cPadding)) / 2 - cPadding) / 2, offsetV/2);
    text(topLabel2, offsetH + cPadding * 2 + (canvasWidth - (offsetH + cPadding)) / 2 - cPadding + ((width - (offsetH + cPadding)) / 2 - cPadding) / 2, offsetV/2);
}

function drawYearLabels(offsetH, offsetV, years, rHeight, rPadding, cPadding) {
    let lastYearNum = 0;
    for (let course of courseInterface) {
        // if it's not a button choice row
        if (course.code != "majorSelect" && course.code != "minorSelect") {
            // get year
            let theYear = course.year;
            if (theYear > lastYearNum) {
                // draw box
                noStroke();
                fill(255, 10, 10);
                rect(
                    cPadding,
                    course.y,
                    offsetH - cPadding,
                    course.cellHeight, rectRadius/2
                );
                // draw text
                push();
                translate(
                    offsetH / 1.6,
                    course.y + (course.cellHeight / 2)
                );
                rotate(radians(-90));
                textAlign(CENTER, CENTER);
                textSize(width / 60);
                fill(255, 255, 255);
                text("Year " + theYear, 0, 0);
                pop();
                lastYearNum = theYear;
            }
        }
    }
}

function drawMajors() {
    let columnWidth = (canvasWidth - cellPadding - tableOffsetH) / numberMajors;
    let textPadding = 8;
    let majorCount = 0;
    for (let i = 0; i < majorData.getRowCount(); i++) {
        if (majorData.getString(i, "code").substring(0, 5) == "MAJOR") {
            let xLoc = cellPadding + (columnWidth * i) + tableOffsetH;
            let yLoc = tableHeight + tablePadding;
            // display major name
            textAlign(LEFT, TOP);
            textSize(width / 60);
            fill(255, 10, 10);
            text(
                majorData.getString(i, "name"),
                xLoc + textPadding,
                yLoc + textPadding,
                columnWidth - (2 * textPadding),
                50
            );
            // display core courses
            textAlign(LEFT);
            textSize(width / 80);
            fill(255, 10, 10);
            let yShift = 60;
            text(
                "Core Courses (complete all courses)",
                xLoc + textPadding,
                yLoc + yShift,
                columnWidth - 2 * textPadding,
                50
            );
            let coreCodes = splitTokens(majorData.getString(i, "core"));
            yShift += 25;
            for (let code of coreCodes) {
                let theText = code;
                fill(130, 160, 255);
                // find course name in course data
                for (let j = 0; j < courseData.getRowCount(); j++) {
                    if (courseData.getString(j, "code") == code) {
                        theText += ' ' + courseData.getString(j, "name");
                        break;
                    }
                }
                // find course status in interface data
                for (let course of courseInterface) {
                    if (course.code == code) {
                        if (course.status == COMPLETED) fill(0, 200, 0);
                        break;
                    }
                }
                text(
                    theText,
                    xLoc + textPadding,
                    yLoc + yShift,
                    columnWidth - 2 * textPadding,
                    50
                );
                yShift += 40;
            }
            // display the option courses
            let optionCodes = splitTokens(majorData.getString(i, "options"));
            let numOptions = majorData.getString(i, "number");
            fill(255, 10, 10);
            yShift += 10;
            text(
                "Option Courses (complete " + numOptions + ")",
                xLoc + textPadding,
                yLoc + yShift,
                columnWidth - 2 * textPadding,
                50
            );
            yShift += 25;
            for (let option of optionCodes) {
                let theText = option;
                fill(130, 160, 255);
                // find course name
                for (let j = 0; j < courseData.getRowCount(); j++) {
                    if (courseData.getString(j, "code") == option) {
                        theText += ' ' + courseData.getString(j, "name");
                        break;
                    }
                }
                // find course status in interface data
                for (let course of courseInterface) {
                    if (course.code == option) {
                        if (course.status == COMPLETED) fill(0, 200, 0);
                        break;
                    }
                }
                text(
                    theText,
                    xLoc + textPadding,
                    yLoc + yShift,
                    columnWidth - 2 * textPadding,
                    50
                );
                yShift += 40;
            }
            majorCount++;
        }
    }
}

function updateAvailableCourses() {
    // check each course
    for (let i = 0; i < courseInterface.length; i++) {
        let avail = false;
        let equiv = false;
        // get the prereqs from the interface
        // prereqs are loaded into the interface at startup
        let thePrereqs = courseInterface[i].prereqs;
        // check the prerequisits
        if (thePrereqs == null || thePrereqs.length == 0) {
            // no prereqs so if not available make it available
            avail = true;
        } else {
            // check each of the prereqs
            let numCompleted = 0;
            for (let j = 0; j < thePrereqs.length; j++) {
                let prereqCourse = thePrereqs[j];
                let foundPrereq = false;
                // split up the OR prerequisits
                let multiplePrereq = split(prereqCourse, "||");
                for (let m = 0; m < multiplePrereq.length; m++) {
                    let theCourse = multiplePrereq[m];
                    // look for the prereq in completed courses
                    for (let k = 0; k < courseInterface.length; k++) {
                        if (
                            courseInterface[k].code == theCourse &&
                            (courseInterface[k].status == COMPLETED ||
                                courseInterface[k].status == EQUIVALENT)
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
        let theCourse = courseInterface.code;
        let theEquivalents;
        // check course data for equivalents
        for (let j = 0; j < courseData.getRowCount(); j++) {
            if (courseData.getString(j, "code") == theCourse) {
                theEquivalents = split(courseData.getString(j, "equivalents"));
                break;
            }
        }
        if (theEquivalents != null) {
            // check each of the equivalents
            for (let j = 0; j < theEquivalents.length; j++) {
                let equivalentCourse = theEquivalents[j];
                let foundEquivalent = false;
                // look for the equivalent in complete courses
                for (let k = 0; k < courseInterface.length; k++) {
                    if (
                        courseInterface[k].code == equivalentCourse &&
                        courseInterface[k].status == COMPLETED
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
            courseInterface[i].status = NOTAVAIL;
            // reset the interface element if its not a single course
            let code = programStructure.getString(i, "code");
            courseInterface[i].code = code;
            if (code == null || code == "") {
                courseInterface[i].name = programStructure.getString(i, "name");
                courseInterface[i].prereqs = splitTokens(programStructure.getString(i, "prerequisits"));
                courseInterface[i].menu = splitTokens(programStructure.getString(i, "menu"));
            }
        } else {
            if (courseInterface[i].status != COMPLETED) {
                if (avail && equiv) {
                    courseInterface[i].status = EQUIVALENT;
                } else if (avail) {
                    courseInterface[i].status = AVAILABLE;
                }
            }
        }
    }
}