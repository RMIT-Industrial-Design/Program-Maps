// v0.12
// Layout rewrite: years run horizontally across the canvas.
// Group regions (Foundation, Core, Studio, Major, Minor, Capstone) are
// hardcoded coloured backgrounds. Year labels are red pills at the bottom,
// with dashed red vertical separators between years.
// majorSelect / minorSelect buttons live in a thin top bar.
// The majors info panel below the grid is preserved (to be revisited).

let programStructure;
let courseData;
let majorData;
let programData;
let courseInterface = [];

let canvasWidth = 1000; // Canvas LMS restricts iframe content to 1000
let canvasMargin = 12;
let topGap = 60; // room above the grid for Capstone top tab
let cellPadding = 5;
let gridCellPadding = 10; // inset between course box and its region edge
let rectRadius = 8;
let groupPadding = 2;
let tabHeight = 50;
let tabWidthMax = 170;
let selectorTabHeight = 50;
let selectorTabWidthMax = 240;
let yearLabelHeight = 36;
let yearLabelGap = 60; // clear the bottom tabs above the year pills
let tablePadding = 25;

let numYears = 4;
let rowsPerYear = 4;
let rowHeight = 105;

let yearColumnWidth;
let subColumnWidth;
let gridTop;
let gridBottom;
let yearLabelTop;
let yearLabelBottom;
let tableHeight;
let numberMajors;
let majorsHeight;

let courseMenu;
let menuVisible = false;

const NOTAVAIL = 0;
const AVAILABLE = 1;
const COMPLETED = 2;
const EQUIVALENT = 3;

const colFoundation = [208, 212, 232];
const colCore = [252, 232, 130];
const colStudio = [252, 232, 130];
const colMajor = [208, 212, 232];
const colMinor = [220, 220, 220];
const colCapstone = [225, 30, 30];
const colYearPill = [225, 30, 30];
const colYearPillText = [255, 255, 255];
const colSeparator = [225, 30, 30];

// Group regions span year ranges (yearStart..yearEnd). Each region is one
// rectangle; the L-shaped Major region is composed of two adjacent rects whose
// shared edges have corner = 0. `corners` is [tl, tr, br, bl] flags — 1
// rounded, 0 square. A rect with a label has its tab-side corner squared so
// the tab joins flush with the region.
const groupRegions = [
    // Foundation (Y1 col 1) — br squared because the tab fills the full bottom edge
    { yearStart: 1, yearEnd: 1, rowStart: 1, rowEnd: 4, colStart: 1, colEnd: 1,
      color: colFoundation, corners: [1, 1, 0, 0],
      label: "Foundation", labelPos: "bottom", labelColor: [40, 50, 110] },
    // Core (Y1 col 2) — bleeds right to join Studio; br squared (full-width tab)
    { yearStart: 1, yearEnd: 1, rowStart: 1, rowEnd: 4, colStart: 2, colEnd: 2,
      color: colCore, corners: [1, 0, 0, 0], bleedRight: true,
      label: "Core", labelPos: "bottom", labelColor: [120, 100, 30] },
    // Studio (Y2-Y3 rows 1-2) — bleeds left to meet Core
    { yearStart: 2, yearEnd: 3, rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2,
      color: colStudio, corners: [0, 1, 1, 0], bleedLeft: true },
    // Major part 1: row-3 strip across Y2-Y4 (top of L)
    { yearStart: 2, yearEnd: 4, rowStart: 3, rowEnd: 3, colStart: 1, colEnd: 2,
      color: colMajor, corners: [1, 1, 0, 1] },
    // Major part 2: Y4 rows 3-4 column (foot of L), carries the label
    // br squared because the selector tab fills the full bottom edge
    { yearStart: 4, yearEnd: 4, rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2,
      color: colMajor, corners: [0, 1, 0, 0],
      label: "Major", labelPos: "bottom", labelColor: [40, 50, 110],
      tabSelectorCode: "majorSelect" },
    // Minor (Y2-Y3 row 4)
    { yearStart: 2, yearEnd: 3, rowStart: 4, rowEnd: 4, colStart: 1, colEnd: 2,
      color: colMinor, corners: [1, 1, 1, 0],
      label: "Minor", labelPos: "bottom", labelColor: [80, 80, 80],
      tabSelectorCode: "minorSelect" },
    // Capstone (Y4 rows 1-2) — top tab
    { yearStart: 4, yearEnd: 4, rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2,
      color: colCapstone, corners: [0, 1, 1, 1],
      label: "Capstone", labelPos: "top", labelColor: [255, 255, 255] },
];

function preload() {
    // CSV cache buster — without it, browsers cache the CSVs and edits don't show up
    let cb = "?t=" + Date.now();
    programStructure = loadTable("structure.csv" + cb, "csv", "header");
    courseData = loadTable("courses.csv" + cb, "csv", "header");
    majorData = loadTable("majors.csv" + cb, "csv", "header");
    programData = loadTable("program.csv" + cb, "csv", "header");
}

function setup() {
    yearColumnWidth = (canvasWidth - 2 * canvasMargin) / numYears;
    subColumnWidth = yearColumnWidth / 2;
    gridTop = canvasMargin + topGap;
    gridBottom = gridTop + rowsPerYear * rowHeight;
    yearLabelTop = gridBottom + yearLabelGap;
    yearLabelBottom = yearLabelTop + yearLabelHeight;
    tableHeight = yearLabelBottom + tablePadding;

    loadInterface();

    // Inject the program title above the canvas. Appending to <main> before
    // createCanvas() runs puts the title earlier in the DOM than the canvas.
    insertProgramTitle();

    let canvasHeight = tableHeight;
    createCanvas(canvasWidth, canvasHeight);

    updateAvailableCourses();
    courseMenu = new Menu();

    buildMajorsPanel();
    updateMajorsPanelHighlights();
}

function draw() {
    background(255);
    drawGroupBackgrounds();
    for (let i = 0; i < courseInterface.length; i++) {
        courseInterface[i].show();
    }
    drawGroupLabels();
    drawYearSeparators();
    drawYearLabels();
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
            if (courseChange) break;
        }
    }
    if (courseChange) {
        updateAvailableCourses();
        // a second pass catches cascading changes
        updateAvailableCourses();
        updateMajorsPanelHighlights();
    }
}

function yearColumnLeft(year) {
    return canvasMargin + (year - 1) * yearColumnWidth;
}

function subColumnLeft(year, col) {
    return yearColumnLeft(year) + (col - 1) * subColumnWidth;
}

function loadInterface() {
    courseInterface = [];
    for (let i = 0; i < programStructure.getRowCount(); i++) {
        let code = programStructure.getString(i, "code");
        let name = programStructure.getString(i, "name");
        let year = int(programStructure.getString(i, "year"));
        let row = int(programStructure.getString(i, "row"));
        let column = int(programStructure.getString(i, "column"));
        let widthSpan = int(programStructure.getString(i, "width") || "1");
        let heightSpan = int(programStructure.getString(i, "height") || "1");
        let menu = splitTokens(programStructure.getString(i, "menu"));
        let prereqs = splitTokens(programStructure.getString(i, "prerequisits"));

        // resolve name and prereqs from courseData when the structure row leaves them blank
        if ((name == null || name == "") && code != null && code != "") {
            for (let j = 0; j < courseData.getRowCount(); j++) {
                if (code == courseData.getString(j, "code")) {
                    name = courseData.getString(j, "name");
                    if (prereqs == null || prereqs.length == 0) {
                        prereqs = splitTokens(courseData.getString(j, "prerequisits"));
                    }
                    break;
                }
            }
        }

        let x, y, w, h, type;

        if (year === -1) {
            // tab-mounted selector: position taken from the matching region's tab
            let region = groupRegions.find(g => g.tabSelectorCode === code);
            type = (code === "majorSelect") ? "major" : "minor";
            if (region) {
                let t = groupTab(region);
                x = t.x;
                y = t.y;
                w = t.w;
                h = t.h;
            } else {
                x = -1000; y = -1000; w = 0; h = 0;
            }
        } else {
            x = subColumnLeft(year, column) + gridCellPadding;
            y = gridTop + (row - 1) * rowHeight + gridCellPadding;
            w = subColumnWidth * widthSpan - 2 * gridCellPadding;
            h = rowHeight * heightSpan - 2 * gridCellPadding;
            type = "course";
            if (code == "majorSelect") type = "major";
            else if (code == "minorSelect") type = "minor";
        }

        courseInterface[i] = new SelectBox(
            i, h, w, x, y, code, type, name, year, menu, prereqs
        );
    }
}

function groupRect(g) {
    let xLeft = subColumnLeft(g.yearStart, g.colStart);
    let xRight = subColumnLeft(g.yearEnd, g.colEnd) + subColumnWidth;
    let yTop = gridTop + (g.rowStart - 1) * rowHeight;
    let yBottom = gridTop + g.rowEnd * rowHeight;
    let x = xLeft + (g.bleedLeft ? 0 : groupPadding);
    let xR = xRight - (g.bleedRight ? 0 : groupPadding);
    let y = yTop + (g.bleedTop ? 0 : groupPadding);
    let yB = yBottom - (g.bleedBottom ? 0 : groupPadding);
    return { x, y, w: xR - x, h: yB - y };
}

function groupTab(g) {
    let r = groupRect(g);
    let radius = rectRadius * 1.5;
    let isSelector = !!g.tabSelectorCode;
    let h = isSelector ? selectorTabHeight : tabHeight;
    let w;
    if (isSelector) {
        // both selector tabs share a single width (capped by region width)
        w = selectorTabWidthMax;
    } else if (r.w < 140) {
        // narrow column-width regions: tab spans the full region
        w = r.w;
    } else {
        w = min(tabWidthMax, max(r.w * 0.55, 90));
    }
    w = min(w, r.w);
    let x = r.x;
    let y, tl, tr, br, bl;
    if (g.labelPos == "top") {
        y = r.y - h;
        tl = radius;
        tr = radius;
        br = 0;
        bl = 0;
    } else {
        y = r.y + r.h;
        tl = 0;
        tr = 0;
        br = radius;
        bl = radius;
    }
    return { x, y, w, h, tl, tr, br, bl };
}

function drawGroupBackgrounds() {
    noStroke();
    let radius = rectRadius * 1.5;
    for (let g of groupRegions) {
        let r = groupRect(g);
        let c = g.corners || [1, 1, 1, 1];
        fill(g.color[0], g.color[1], g.color[2]);
        rect(r.x, r.y, r.w, r.h, c[0] * radius, c[1] * radius, c[2] * radius, c[3] * radius);
        if (g.label && g.label.length > 0) {
            let t = groupTab(g);
            rect(t.x, t.y, t.w, t.h, t.tl, t.tr, t.br, t.bl);
        }
    }
}

function getTabSelectorBox(code) {
    for (let i = 0; i < courseInterface.length; i++) {
        if (programStructure.getString(i, "code") === code) {
            return courseInterface[i];
        }
    }
    return null;
}

function selectorTabText(box) {
    if (!box) return "";
    let prefix;
    if (box.code == null || box.code == "" ||
        box.code == "majorSelect" || box.code == "minorSelect") {
        prefix = "Select a";
    } else if (box.type == "major") {
        prefix = "Major";
    } else if (box.type == "minor") {
        prefix = "Minor";
    } else {
        prefix = box.code;
    }
    return prefix + "\n" + box.name;
}

function drawGroupLabels() {
    noStroke();
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    for (let g of groupRegions) {
        if (!g.label || g.label.length == 0) continue;
        let t = groupTab(g);
        fill(g.labelColor[0], g.labelColor[1], g.labelColor[2]);

        let labelText = g.label;
        let isSelector = false;
        if (g.tabSelectorCode) {
            let box = getTabSelectorBox(g.tabSelectorCode);
            if (box) {
                labelText = selectorTabText(box);
                isSelector = true;
            }
        }

        if (isSelector) {
            textSize(width / 80);
            textAlign(CENTER, TOP);
            let pad = 3;
            text(labelText, t.x + pad, t.y + pad, t.w - 2 * pad, t.h - 2 * pad);
        } else {
            textSize(width / 65);
            textAlign(CENTER, CENTER);
            text(labelText, t.x + t.w / 2, t.y + t.h / 2);
        }
    }
    textStyle(NORMAL);
}

function drawYearSeparators() {
    push();
    stroke(colSeparator[0], colSeparator[1], colSeparator[2]);
    strokeWeight(1.5);
    drawingContext.setLineDash([6, 5]);
    for (let v = 0; v <= numYears; v++) {
        let x = canvasMargin + v * yearColumnWidth;
        line(x, gridTop - 4, x, yearLabelBottom + 4);
    }
    drawingContext.setLineDash([]);
    pop();
}

function drawYearLabels() {
    noStroke();
    for (let v = 1; v <= numYears; v++) {
        let x = yearColumnLeft(v) + 8;
        let y = yearLabelTop;
        let w = yearColumnWidth - 16;
        let h = yearLabelHeight;
        fill(colYearPill[0], colYearPill[1], colYearPill[2]);
        rect(x, y, w, h, h / 2);
        fill(colYearPillText[0], colYearPillText[1], colYearPillText[2]);
        textAlign(CENTER, CENTER);
        textSize(width / 55);
        textStyle(BOLD);
        text("year " + v, x + w / 2, y + h / 2);
        textStyle(NORMAL);
    }
}

function insertProgramTitle() {
    if (!programData || programData.getRowCount() === 0) return;
    let code = programData.getString(0, "code");
    let name = programData.getString(0, "name");
    // "Program Map" is appended in HTML so the CSV can stay program-agnostic
    let titleText = [code, name, "Program Map"].filter(s => s && s.length).join(" ");
    if (!titleText) return;
    let container = document.querySelector("main") || document.body;
    let h1 = document.getElementById("program-title");
    if (!h1) {
        h1 = document.createElement("h1");
        h1.id = "program-title";
        container.appendChild(h1);
    }
    h1.textContent = titleText;
}

function courseNameByCode(code) {
    for (let j = 0; j < courseData.getRowCount(); j++) {
        if (courseData.getString(j, "code") === code) {
            return courseData.getString(j, "name");
        }
    }
    return "";
}

function makeCourseLi(code) {
    let li = document.createElement("li");
    li.className = "course";
    li.dataset.code = code;
    let codeSpan = document.createElement("span");
    codeSpan.className = "code";
    codeSpan.textContent = code;
    let nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = courseNameByCode(code);
    li.appendChild(codeSpan);
    li.appendChild(nameSpan);
    return li;
}

function findMajorDataIdx(code) {
    for (let j = 0; j < majorData.getRowCount(); j++) {
        if (majorData.getString(j, "code") === code) return j;
    }
    return -1;
}

function buildMajorsPanel() {
    // If a minor shares a name with one of the majors, that column substitutes
    // the minor's content. (MINOR5 / OPEN2 / UNIELECTIVES don't match any
    // major name and so are not shown in the panel.)
    let minorBox = (typeof getTabSelectorBox === "function") ? getTabSelectorBox("minorSelect") : null;
    let selectedMinorCode = (minorBox && minorBox.code && minorBox.code !== "minorSelect") ? minorBox.code : null;
    let selectedMinorName = "";
    if (selectedMinorCode) {
        let idx = findMajorDataIdx(selectedMinorCode);
        if (idx >= 0) selectedMinorName = majorData.getString(idx, "name");
    }

    let container = document.querySelector("main") || document.body;
    let panel = document.getElementById("majors-panel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "majors-panel";
        container.appendChild(panel);
    }
    panel.innerHTML = "";

    for (let i = 0; i < majorData.getRowCount(); i++) {
        let majorCode = majorData.getString(i, "code");
        if (majorCode.substring(0, 5) !== "MAJOR") continue;
        let majorName = majorData.getString(i, "name");

        // Decide whose content this column should render
        let displayIdx = i;
        let isMinor = false;
        if (selectedMinorName && majorName === selectedMinorName) {
            let minorIdx = findMajorDataIdx(selectedMinorCode);
            if (minorIdx >= 0) { displayIdx = minorIdx; isMinor = true; }
        }
        let displayCode = majorData.getString(displayIdx, "code");

        let col = document.createElement("div");
        col.className = "major-column" + (isMinor ? " as-minor" : "");
        col.dataset.code = displayCode;

        let nameEl = document.createElement("h3");
        nameEl.className = "major-name";
        nameEl.textContent = majorData.getString(displayIdx, "name");
        col.appendChild(nameEl);

        let coreCodes = splitTokens(majorData.getString(displayIdx, "core"));
        let coreHeader = document.createElement("p");
        coreHeader.className = "section-header";
        coreHeader.textContent = isMinor
            ? "Minor Courses (complete any 4)"
            : "Major Core Courses (complete all courses)";
        col.appendChild(coreHeader);

        let coreList = document.createElement("ul");
        coreList.className = "course-list";
        for (let c of coreCodes) coreList.appendChild(makeCourseLi(c));
        col.appendChild(coreList);

        let optionCodes = splitTokens(majorData.getString(displayIdx, "options"));
        if (optionCodes.length > 0) {
            let optHeader = document.createElement("p");
            optHeader.className = "section-header";
            optHeader.textContent =
                "Major Optional Courses (complete any " +
                majorData.getString(displayIdx, "number") + ")";
            col.appendChild(optHeader);

            let optList = document.createElement("ul");
            optList.className = "course-list";
            for (let c of optionCodes) optList.appendChild(makeCourseLi(c));
            col.appendChild(optList);
        }

        panel.appendChild(col);
    }
}

let panelLastMajorCode = null;
let panelLastMinorCode = null;

function updateMajorsPanelHighlights() {
    let majorBox = (typeof getTabSelectorBox === "function") ? getTabSelectorBox("majorSelect") : null;
    let minorBox = (typeof getTabSelectorBox === "function") ? getTabSelectorBox("minorSelect") : null;
    let selectedMajor = (majorBox && majorBox.code && majorBox.code !== "majorSelect") ? majorBox.code : null;
    let selectedMinor = (minorBox && minorBox.code && minorBox.code !== "minorSelect") ? minorBox.code : null;

    // Rebuild the panel only when the major/minor selection has changed
    if (selectedMajor !== panelLastMajorCode || selectedMinor !== panelLastMinorCode) {
        panelLastMajorCode = selectedMajor;
        panelLastMinorCode = selectedMinor;
        buildMajorsPanel();
    }

    let panel = document.getElementById("majors-panel");
    if (!panel) return;

    // Split completions by where they were taken: courses completed via a
    // Major slot (menu MAJOR or MAJOR-OPT in structure.csv) count toward the
    // major; courses completed via a Minor slot (menu MINOR) count toward the
    // minor. A course can't double-count toward both.
    let majorCompleted = new Set();
    let minorCompleted = new Set();
    for (let i = 0; i < courseInterface.length; i++) {
        let c = courseInterface[i];
        if (!c || c.status !== COMPLETED || !c.code) continue;
        let menuTag = programStructure.getString(i, "menu");
        if (menuTag === "MAJOR" || menuTag === "MAJOR-OPT") {
            majorCompleted.add(c.code);
        } else if (menuTag === "MINOR") {
            minorCompleted.add(c.code);
        }
    }

    // OPEN escapes the per-column scoping: the chosen major/minor doesn't
    // pin highlights to a specific column, so paint major-bucket courses
    // across every column where they appear (and likewise for minors).
    let majorIsOpen = selectedMajor === "OPEN1";
    let minorIsOpen = selectedMinor === "OPEN2";

    panel.querySelectorAll(".course[data-code]").forEach(el => {
        let col = el.closest(".major-column");
        let isMinorColumn = col.classList.contains("as-minor");
        let colCode = col.dataset.code;
        let code = el.dataset.code;

        let highlight = false;
        if (majorCompleted.has(code)) {
            if (majorIsOpen) highlight = true;
            else if (!isMinorColumn && colCode === selectedMajor) highlight = true;
        }
        if (minorCompleted.has(code)) {
            if (minorIsOpen) highlight = true;
            else if (isMinorColumn && colCode === selectedMinor) highlight = true;
        }
        el.classList.toggle("completed", highlight);
    });

    // A column matches whichever code it's currently showing — major code by
    // default, minor code when substituted.
    panel.querySelectorAll(".major-column").forEach(col => {
        let code = col.dataset.code;
        let selected = (selectedMajor && code === selectedMajor) ||
                       (selectedMinor && code === selectedMinor);
        col.classList.toggle("selected", selected);
    });
}

function updateAvailableCourses() {
    for (let i = 0; i < courseInterface.length; i++) {
        let avail = false;
        let equiv = false;
        let thePrereqs = courseInterface[i].prereqs;
        if (thePrereqs == null || thePrereqs.length == 0) {
            avail = true;
        } else {
            let numCompleted = 0;
            for (let j = 0; j < thePrereqs.length; j++) {
                let prereqCourse = thePrereqs[j];
                let foundPrereq = false;
                let multiplePrereq = split(prereqCourse, "||");
                for (let m = 0; m < multiplePrereq.length; m++) {
                    let theCourse = multiplePrereq[m];
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
                if (foundPrereq) numCompleted++;
            }
            avail = (numCompleted == thePrereqs.length);
        }

        let theCourse = courseInterface[i].code;
        let theEquivalents;
        for (let j = 0; j < courseData.getRowCount(); j++) {
            if (courseData.getString(j, "code") == theCourse) {
                let equivStr = courseData.getString(j, "equivalents");
                if (equivStr != null && equivStr.length > 0) {
                    theEquivalents = splitTokens(equivStr);
                }
                break;
            }
        }
        if (theEquivalents != null) {
            for (let j = 0; j < theEquivalents.length; j++) {
                let equivalentCourse = theEquivalents[j];
                let foundEquivalent = false;
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
