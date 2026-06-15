class SelectBox {
    constructor(
        ref,
        cHeight,
        cWidth,
        xLoc,
        yLoc,
        code,
        type,
        name,
        year,
        menu,
        prereqs
    ) {
        this.ref = ref;
        this.cellHeight = cHeight;
        this.cellWidth = cWidth;
        this.x = xLoc;
        this.y = yLoc;
        this.code = code;
        this.name = name;
        this.year = year;
        this.menu = menu;
        this.prereqs = prereqs;
        this.type = type;
        this.status = NOTAVAIL;
    }

    update(){

    }

    show() {
        let theText = "";
        if (this.code == null || this.code == "" || this.code == "majorSelect" || this.code == "minorSelect") {
            theText = "Select a";
        } else if (this.type == "major"){
            theText = "Major";
        } else if (this.type == "minor"){
            theText = "Minor";
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
        rect(this.x, this.y, this.cellWidth, this.cellHeight, rectRadius);
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
                    courseMenu.build(clickX, clickY, this.menu, this.type, this.ref);
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
