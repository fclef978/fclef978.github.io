var p1 = new Audio('../sample/bell.wav');
var p4 = new Audio('../sample/tick.wav');
var p8 = new Audio('../sample/tickL.wav');
var p12 = new Audio('../sample/tickL.wav');
var p16 = new Audio('../sample/tickL.wav');

function metronome(tempo, beat) {
    var lamp = $('#lamp');

    var i = 0;
    return setInterval(function () {
        if (i % (12 * beat) == 0) p1.play();
        if (i % 12 == 0) p4.play();
        else if (i % 6 == 0) p8.play();
        else if (i % 4 == 0) audioRestart(p12);
        else if (i % 3 == 0) audioRestart(p16);

        if (i % 12 == 0) lamp.fadeIn(100, function () {
            $(this).fadeOut(100)
        });

        i++;
    }, 20 / tempo * 250);
}

function audioStop(audio) {
    audio.pause();
    audio.currentTime = 0;
}

function audioRestart(audio) {
    audioStop(audio);
    audio.play();
}

var timer;
var running = false;

$(function () {
    $('#start-stop').click(function () {
        if (running) {
            clearInterval(timer);
            running = false;
        }
        else {
            timer = metronome($('#knob').val(), 4);
            running = true;
        }
    });
});

var volumes = new Array(6);
volumes.fill(1.0);
var datas = [
    '#main-volume', '#volume1', '#volume4', '#volume8', '#volume12', '#volume16'
];

$(function () {
    $.each(datas, function (key, str) {
        $(str).slider({
            orientation: 'vertical', min: -2, max: 10, value: 10,
            slide: function () {
                volumes[key] = $(str).slider('value') / 10.0;
                setVolume();
            }
        });
    });
    $('#knob').knob({
        min: 40,
        max: 240,
        width: "150",
        cursor: true,
        thickness: .3,
        fgColor: "#222222"
    });
    $('#knob').val(120).trigger('change');
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
