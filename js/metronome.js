var p1 = new Audio('sample/bell.wav');
var p4 = new Audio('sample/tick.wav');
var p8 = new Audio('sample/tickL.wav');
var p12 = new Audio('sample/tickL.wav');
var p16 = new Audio('sample/tickL.wav');

var running = false;
var volumes = [1.0, 1.0, 1.0, 0.5, 0.0, 0.0];
var datas = [
    '#main-volume', '#volume1', '#volume4', '#volume8', '#volume12', '#volume16'
];
var count = 0, tempo = 120, beat = 4;

function audioStop(audio) {
    audio.pause();
    audio.currentTime = 0;
}

function audioRestart(audio) {
    audioStop(audio);
    audio.play();
}

$(function () {
    $('#start-stop').click(function () {
        if (running) {
            running = false;
        }
        else {
            running = true;
            setVolume();
            metronome();
        }
    });
});

$(function () {
    $.each(datas, function (key, val) {
        $(val).attr({value: volumes[key] * 20, min: 0, max: 20, step: 1});
        $(val).on('input', function () {
            volumes[key] = ($(this).val() / 20);
            setVolume();
        })
    });
    var knob = $('#knob');
    knob.knob({
        min: 40, max: 240, width: "150", cursor: true, thickness: .3, fgColor: "#222222",
        change: function (val) {
            tempo = val;
        }
    });
    knob.val(120).trigger('change');
});

function setVolume() {
    p1.volume = zero(volumes[0] * volumes[1]);
    p4.volume = zero(volumes[0] * volumes[2]);
    p8.volume = zero(volumes[0] * volumes[3]);
    p12.volume = zero(volumes[0] * volumes[4]);
    p16.volume = zero(volumes[0] * volumes[5]);
}

function zero(num) {
    if (num < 0) num = 0;
    return num;
}

function metronome() {
    var waitFunc = function () {
        if (!running) return;
        ring(count);
        count++;
        clearTimeout(id);
        id = setTimeout(waitFunc,calcPeriod(tempo));
    };
    var id = setTimeout(waitFunc, calcPeriod(tempo));
}

function ring(i) {
    if (i % (12 * beat) == 0) p1.play();
    if (i % 12 == 0) p4.play();
    else if (i % 6 == 0) p8.play();
    else if (i % 4 == 0) audioRestart(p12);
    else if (i % 3 == 0) audioRestart(p16);

    if (i % 12 == 0) $('#lamp').fadeIn(10, function () {
        $(this).fadeOut(100)
    });
}

function calcPeriod(tempo) {
    return 20 / tempo * 250;
}
