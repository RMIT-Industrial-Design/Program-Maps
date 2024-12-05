class Major {
    constructor(
        ref,
        offsetH,
        offsetV,
        majorsHeight,
        tablePadding,
        cPadding,
        name,
        core,
        options,
        number,
        columns
    ) {
        this.ref = ref;
        this.name = name;
        this.core = core;
        this.options = options;
        this.number = number;
        this.columnWidth = (width - cPadding - offsetH) / numColumns;
        this.columnHeight = majorsHeight;
        this.x = cPadding + (this.columnWidth * ref) + offsetH;
        this.y = tableHeight + tablePadding;
        this.status = AVAILABLE;
    }

    show() {
        let textPadding = 8;
        if (this.status == AVAILABLE) {
            fill(130, 160, 255);
        } else if (this.status == COMPLETED) {
            fill(0, 200, 0);
        } else {
            fill(170, 170, 170);
        }
        // draw box
        // noStroke();
        // rect(this.x, this.y, this.cellWidth, this.cellHeight);

        // display major name
        textAlign(LEFT, TOP);
        textSize(width / 70);
        fill(255, 10, 10);
        text(
            this.name,
            this.x + textPadding,
            this.y + textPadding,
            this.columnWidth - (2 * textPadding),
            50
        );
        // display core courses
        textAlign(LEFT);
        textSize(width / 80);
        fill(255, 10, 10);
        let yShift = 60;
        text(
            "Core Courses (complete all courses)",
            this.x + textPadding,
            this.y + yShift,
            this.columnWidth - 2 * textPadding,
            50
        );
        yShift += 25;
        for (let coreCode of this.core) {
            let theText = coreCode;
            fill(130, 160, 255);
            // find course name
            for (let course of courses){
                if (course.code == coreCode){
                    theText += ' ' + course.name;
                    if (course.status == COMPLETED) {
                        fill(0, 200, 0);
                    }
                    break;
                }
            }
            text(
                theText,
                this.x + textPadding,
                this.y + yShift,
                this.columnWidth - 2 * textPadding,
                50
            );
            yShift += 40;
        }
        // display the option courses
        fill(255, 10, 10);
        yShift += 10;
        text(
            "Option Courses (complete " + this.number + ")",
            this.x + textPadding,
            this.y + yShift,
            this.columnWidth - 2 * textPadding,
            50
        );
        yShift += 25;
        for (let optionCode of this.options) {
            let theText = optionCode;
            fill(130, 160, 255);
            // find course name
            for (let course of courses){
                if (course.code == optionCode){
                    theText += ' ' + course.name;
                    if (course.status == COMPLETED) {
                        fill(0, 200, 0);
                    }
                    break;
                }
            }
            text(
                theText,
                this.x + textPadding,
                this.y + yShift,
                this.columnWidth - 2 * textPadding,
                50
            );
            yShift += 40;
        }
    }

    // clicked(clickX, clickY) {
    //     if (
    //         clickX > this.x &&
    //         clickX < this.x + this.cellWidth &&
    //         clickY > this.y &&
    //         clickY < this.y + this.cellHeight
    //     ) {
    //         if (this.menu.length > 0) {
    //             if (this.status == AVAILABLE || this.status == COMPLETED) {
    //                 courseMenu.update(clickX, clickY, this.menu, this.ref);
    //                 menuVisible = true;
    //             }
    //         } else if (this.status == AVAILABLE || this.status == EQUIVALENT) {
    //             this.status = COMPLETED;
    //         } else if (this.status == COMPLETED) {
    //             this.status = AVAILABLE;
    //         }
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }
}
