/* メトロノーム
 * by FClef978
 * TypeScriptは初めてなんで多少のガバは許し亭ゆるして
 */
var Note = (function () {
    function Note(buf, ctx, master) {
        var _this = this;
        this.volume = 1.0;
        this.click = function (time) {
            var source = _this.ctx.createBufferSource();
            source.buffer = _this.buffer;
            source.connect(_this.gain);
            source.start(time);
        };
        this.ctx = ctx;
        this.buffer = buf;
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 1.0;
        this.gain.connect(master);
    }
    Note.prototype.setVolume = function (vol) {
        this.gain.gain.value = vol;
    };
    return Note;
}());
var Metronome = (function () {
    function Metronome() {
        this.bufList = {};
        this.noteList = [];
        this.beatTick = 60 * 1000 / 120 / 12;
        this.counter = 0;
        this.beat = 4;
        this.initAudio();
        this.baseTimeStamp = performance.now() - this.ctx.currentTime * 1000;
        this.lastClickTimeStamp = performance.now();
    }
    Metronome.prototype.initAudio = function () {
        var _this = this;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.getBuffer('https://fclef978.github.io/sample/tick.wav', 'tick');
        this.getBuffer('https://fclef978.github.io/sample/tickL.wav', 'tickL');
        this.getBuffer('https://fclef978.github.io/sample/bell.wav', 'bell');
        setTimeout(function () {
            _this.noteList.push(new Note(_this.bufList['bell'], _this.ctx, _this.masterGain));
            _this.noteList.push(new Note(_this.bufList['tick'], _this.ctx, _this.masterGain));
            _this.noteList.push(new Note(_this.bufList['tickL'], _this.ctx, _this.masterGain));
            _this.noteList.push(new Note(_this.bufList['tickL'], _this.ctx, _this.masterGain));
            _this.noteList.push(new Note(_this.bufList['tickL'], _this.ctx, _this.masterGain));
        }, 1000);
    };
    Metronome.prototype.setMasterVol = function (vol) {
        this.masterGain.gain.value = vol;
    };
    Metronome.prototype.setVolume = function (num, vol) {
        this.noteList[num].setVolume(vol);
    };
    Metronome.prototype.setMetronome = function () {
        var _this = this;
        this.lastClickTimeStamp = performance.now();
        this.counter = 0;
        this.timer = setInterval(function () {
            // DOMHighResTimeStampで考えながらループを回します
            // 未スケジュールのクリックのうち1.5秒後までに発生予定のものを予約
            var now = _this.currentTimeStamp();
            for (var nextClickTimeStamp = _this.lastClickTimeStamp + _this.beatTick; nextClickTimeStamp < now + 300; nextClickTimeStamp += _this.beatTick) {
                // 予約時間をループで使っていたDOMHighResTimeStampからAudioContext向けに変換
                var nextClickTime = _this.timeStampToAudioContextTime(nextClickTimeStamp);
                // 変換した時刻を使ってクリックを予約
                if (_this.counter % 12 * _this.beat == 0) {
                    _this.noteList[0].click(nextClickTime);
                }
                else if (_this.counter % 12 == 0) {
                    _this.noteList[1].click(nextClickTime);
                }
                else if (_this.counter % 6 == 0) {
                    _this.noteList[2].click(nextClickTime);
                }
                else if (_this.counter % 4 == 0) {
                    _this.noteList[3].click(nextClickTime);
                }
                else if (_this.counter % 3 == 0) {
                    _this.noteList[4].click(nextClickTime);
                }
                if (++_this.counter >= 12 * _this.beat)
                    _this.counter = 0;
                // スケジュール済みクリックの時刻を更新
                _this.lastClickTimeStamp = nextClickTimeStamp;
                console.log(_this.counter);
            }
        }, 200);
    };
    Metronome.prototype.getBuffer = function (url, name) {
        var _this = this;
        var req = new XMLHttpRequest();
        // array buffer を指定
        req.responseType = 'arraybuffer';
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                if (req.status === 0 || req.status === 200) {
                    // array buffer を audio buffer に変換
                    _this.ctx.decodeAudioData(req.response, function (buffer) {
                        _this.bufList[name] = buffer;
                    });
                }
            }
        };
        req.open('GET', url, true);
        req.send('');
    };
    Metronome.prototype.setTempo = function (tempo) {
        this.beatTick = 60 * 1000 / tempo / 12;
    };
    Metronome.prototype.currentTimeStamp = function () {
        return this.baseTimeStamp + this.ctx.currentTime * 1000;
    };
    Metronome.prototype.timeStampToAudioContextTime = function (timeStamp) {
        return (timeStamp - this.baseTimeStamp) / 1000;
    };
    Metronome.prototype.start = function () {
        this.setMetronome();
    };
    Metronome.prototype.stop = function () {
        clearInterval(this.timer);
    };
    return Metronome;
}());
var MetronomeController = (function () {
    function MetronomeController() {
        var _this = this;
        this.mn = new Metronome();
        this.startBtn = document.getElementById("start-stop");
        this.volumeBars = document.getElementsByClassName("volume");
        this.tempoBar = document.getElementById("tempo");
        this.running = false;
        this.volumeMax = 20;
        this.initVolumes = [1.0, 1.0, 1.0, 0.5, 0.0, 0.0];
        this.initVolBar = function (item, key) {
            item.value = _this.initVolumes[+key] * _this.volumeMax;
            item.min = 0;
            item.max = _this.volumeMax;
            item.step = 1;
            if (+key == 0) {
                item.oninput = function (e) {
                    var val = +e.target.value / _this.volumeMax;
                    _this.mn.setMasterVol(val);
                };
            }
            else {
                item.oninput = function (e) {
                    var val = +e.target.value / _this.volumeMax;
                    _this.mn.setVolume(+key + 1, +val);
                };
            }
        };
        this.initTempo = function () {
            _this.tempoBar.value = "120";
            _this.tempoBar.min = "40";
            _this.tempoBar.max = "240";
            _this.tempoBar.step = "1";
            _this.tempoBar.oninput = function (e) {
                var val = e.target.value;
                _this.mn.setTempo(+val);
            };
        };
        this.startStop = function () {
            if (_this.running) {
                _this.running = false;
                _this.mn.stop();
            }
            else {
                _this.running = true;
                _this.mn.start();
            }
        };
        this.startBtn.onclick = this.startStop;
        Array.prototype.forEach.call(this.volumeBars, this.initVolBar);
        this.initTempo();
    }
    return MetronomeController;
}());
window.onload = function () {
    new MetronomeController();
};
