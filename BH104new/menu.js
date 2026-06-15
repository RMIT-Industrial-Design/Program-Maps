class Menu {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.cellWidth = 300;
        this.cellHeight = 20;
        this.codes = [];
        this.names = [];
        this.avail = [];
        this.ref = [];
        this.major = [];
    }

    build(x, y, codes, type, ref) {
        this.x = x;
        this.y = y;
        // empty arrays
        this.codes = [];
        this.clickType = type;
        this.names = [];
        this.avail = [];
        this.type = [];
        this.ref = ref;
        // collect the menu item names
        let longestName = 0;
        // for majors and minors
        if (this.clickType == "major" || this.clickType == "minor") {
            for (let i = 0; i < codes.length; i++) {
                this.codes[i] = codes[i];
                this.type[i] = type;
                this.names[i] = "";
                // look for names in majors list
                for (let j = 0; j < majorData.getRowCount(); j++) {
                    if (majorData.getString(j, "code") == codes[i]) {
                        let theName = majorData.getString(j, "name");
                        longestName = max(longestName, theName.length);
                        this.names[i] = theName;
                        break;
                    }
                }
                if (this.names[i] == "") this.avail[i] = false;
                else this.avail[i] = true;
            }
        } else {
            // for regular courses
            for (let i = 0; i < codes.length; i++) {
                // collect the menu item codes
                this.codes[i] = codes[i];
                this.type[i] = type;
                let avail = false;
                // collect the menu item names
                for (let j = 0; j < courseData.getRowCount(); j++) {
                    if (courseData.getString(j, "code") == codes[i]) {
                        let theName = courseData.getString(j, "name");
                        longestName = max(longestName, theName.length);
                        this.names[i] = theName;
                        // check prerequisits of course
                        let thePrereqs = courseData.getString(j, "prerequisits");
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
                                    for (let course of courseInterface) {
                                        if (
                                            course.code == theCourse &&
                                            (course.status == COMPLETED ||
                                                course.status == EQUIVALENT)
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
                        break;
                    }
                }
                // check the course status
                for (let course of courseInterface) {
                    if (course.code == codes[i]) {
                        if (course.status == COMPLETED) {
                            avail = false;
                        }
                        break;
                    }
                }
                this.avail[i] = avail;
                if (codes[i] == "University") {
                    this.avail[i] = true;
                }
            }
        }
        // add a 'none' option
        this.codes.push("none");
        this.names.push("");
        this.avail.push(true);
        this.type.push("course");
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
            noStroke();
            let textPadding = 5;
            textAlign(LEFT, CENTER);
            textSize(width / 80);
            fill(50);
            let theText = "";
            if (this.type[i] == "major" || this.type[i] == "minor") theText = this.names[i];
            else theText = this.codes[i] + " " + this.names[i];
            text(
                theText,
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
        let theType;
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
                    theType = this.type[i];
                    break;
                }
            }
            if (theAvail) {
                // action menu selection
                if (theCode == "none") {
                    courseInterface[this.ref].code = programStructure.getString(this.ref, "code");
                    courseInterface[this.ref].name = programStructure.getString(this.ref, "name");
                    courseInterface[this.ref].status = NOTAVAIL;
                } else {
                    // if the course has changed
                    if (courseInterface[this.ref].code != theCode){
                        courseInterface[this.ref].code = theCode;
                        courseInterface[this.ref].name = theName;
                        courseInterface[this.ref].status = COMPLETED;
                        // populate major and minor options
                        if (theType == "major" || theType == "minor") {
                            // get the core course list
                            let newMenu = [];
                            for (let j = 0; j < majorData.getRowCount(); j++) {
                                if (majorData.getString(j, "code") == theCode) {
                                    newMenu = splitTokens(majorData.getString(j, "core"));
                                    break;
                                }
                            }
                            if (theType == "major") {
                                // search the course data for MAJOR menu references and update with the major selection
                                for (let j = 0; j < programStructure.getRowCount(); j++) {
                                    if (programStructure.getString(j, "menu") == "MAJOR") {
                                        courseInterface[j].menu = newMenu;
                                        // reset interface item
                                        courseInterface[j].code = programStructure.getString(j, "code");
                                        courseInterface[j].name = programStructure.getString(j, "name");
                                        courseInterface[j].status = AVAILABLE;
                                    }
                                }
                            } else if (theType == "minor") {
                                // search the course interface for MINOR menu references and update with the minor selection
                                for (let j = 0; j < programStructure.getRowCount(); j++) {
                                    if (programStructure.getString(j, "menu") == "MINOR") {
                                        courseInterface[j].menu = newMenu;
                                        courseInterface[j].code = programStructure.getString(j, "code");
                                        courseInterface[j].name = programStructure.getString(j, "name");
                                        courseInterface[j].status = AVAILABLE;
                                    }
                                }
                            }
                        }
                    }
                }

            }
            // hide menu
            menuVisible = false;
            return true;
        } else {
            // hide menu
            menuVisible = false;
            return false;
        }
    }
}
