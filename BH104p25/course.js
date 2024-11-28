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
        numColumns
    ) {
        this.ref = ref;
        let columnWidth = (width - cPadding - offsetH) / numColumns;
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
