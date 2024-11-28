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
