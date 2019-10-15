function chordGen(root, kind) {
    var ret = [];
    ret["notes"] = [];
    var pos = root;
    numToInterval(kind).forEach(function (interval) {
        pos += interval;
        ret["notes"].push(numToNoteDe(pos))
    });
    ret["name"] = numToNoteEn(root) + numToKind(kind);
    return ret
}

var i = 0;
var score = 0;
var chord;
var noteNode = $("#note");
var chordNameNode = $("#chordName");
var scoreNode = $("#score");
var statusNode = $("#status");

function gameStart() {
    // i = 0;
    update()
}

function inputChordName() {
    if (chord["name"] === chordNameNode.val()) {
        statusNode.text("正解!!!");
        score++;
        scoreNode.text(score)
    } else {
        statusNode.text("不正解...　正答は" + chord["name"]);
    }
    chordNameNode.val("");
    update()
}

function rand(max) {
    return Math.floor(Math.random() * max);
}

function update() {
    chord = chordGen(rand(100), rand(100));
    noteNode.text(chord["notes"].reduce(function (acc, x) {
        return acc + " " + x
    }));
    i++;
}

var kindList = ["", "m", "dim", "aug", "sus4", "7", "m7", "M7", "mM7", "dim7", "m7-5", "7sus4", "M7sus4", "6", "m6"];

function numToKind(num) {
    return kindList[num % kindList.length]
}

var intervalList = [
    [0, 4, 3],
    [0, 3, 4],
    [0, 3, 3],
    [0, 4, 4],
    [0, 5, 2],
    [0, 4, 3, 3],
    [0, 3, 4, 3],
    [0, 4, 3, 4],
    [0, 3, 4, 4],
    [0, 3, 3, 3],
    [0, 3, 3, 4],
    [0, 5, 2, 3],
    [0, 5, 2, 4],
    [0, 4, 3, 2],
    [0, 3, 4, 2]
];

function numToInterval(num) {
    return intervalList[num % intervalList.length]
}

var noteListDe = ["C", "Cis", "D", "Dis", "E", "F", "Fis", "G", "Gis", "A", "B", "H"];

function numToNoteDe(num) {
    return noteListDe[num % 12];
}

var noteListEn = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function numToNoteEn(num) {
    return noteListEn[num % 12];
}