/* メトロノーム
 * by FClef978
 * TypeScriptは初めてなんで多少のガバは許し亭ゆるして
 */
var Note = /** @class */ (function () {
    function Note(url, ctx, master, num) {
        var _this = this;
        this.volume = 1.0;
        this.click = function (time) {
            var source = _this.ctx.createBufferSource();
            source.buffer = _this.buf;
            source.connect(_this.gain);
            source.start(time);
        };
        this.ctx = ctx;
        this.num = num;
        this.getBuffer(url);
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 1.0;
        this.gain.connect(master);
    }
    Note.prototype.setVolume = function (vol) {
        this.gain.gain.value = vol;
    };
    Note.prototype.getBuffer = function (url) {
        var _this = this;
        var req = new XMLHttpRequest();
        // array buffer を指定
        req.responseType = 'arraybuffer';
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                if (req.status === 0 || req.status === 200) {
                    // array buffer を audio buffer に変換
                    _this.ctx.decodeAudioData(req.response, function (buffer) {
                        _this.buf = buffer;
                        var selector = 'volume' + _this.num.toString();
                        var bar = document.getElementById(selector);
                        bar.classList.remove('hidden');
                    });
                }
            }
        };
        req.open('GET', url, true);
        req.send('');
    };
    return Note;
}());
var UpDownValController = /** @class */ (function () {
    function UpDownValController(id, getter, setter) {
        var _this = this;
        this.optInputs = [];
        this.addOptionalInput = function (input) {
            input.min = _this.dispVal.min;
            input.max = _this.dispVal.max;
            input.step = _this.dispVal.step;
            input.value = _this.dispVal.value;
            input.addEventListener("input", _this.change);
            _this.optInputs.push(input);
        };
        this.getBase = function () { return "0"; };
        this.setBase = function (num) { };
        this.increase = function (e) {
            _this.change(e, 1);
        };
        this.decrease = function (e) {
            _this.change(e, -1);
        };
        this.change = function (e, delta) {
            if (delta === void 0) { delta = 0; }
            var val = 0;
            if (delta == 0)
                val = +e.target.value;
            else
                val = +_this.getBase() + delta;
            _this.dispVal.value = val.toString();
            _this.setBase(val);
            for (var i = 0; i < _this.optInputs.length; i++) {
                _this.optInputs[i].value = val.toString();
            }
        };
        var lis = document.getElementById(id).children;
        this.getBase = getter;
        this.setBase = setter;
        for (var i = 0; i < lis.length; i++) {
            var li = lis[i];
            switch (i) {
                case 0:
                    this.btnUp = li.children[0];
                    break;
                case 1:
                    this.dispVal = li.children[0];
                    break;
                case 2:
                    this.btnDown = li.children[0];
                    break;
            }
        }
        this.btnUp.addEventListener("click", this.increase);
        this.btnDown.addEventListener("click", this.decrease);
        this.dispVal.addEventListener("input", this.change);
    }
    UpDownValController.prototype.setParam = function (min, max, step) {
        this.dispVal.min = min;
        this.dispVal.max = max;
        this.dispVal.step = step;
        this.dispVal.value = this.getBase();
    };
    return UpDownValController;
}());
var Metronome = /** @class */ (function () {
    function Metronome() {
        var _this = this;
        this.bufList = {};
        this.noteList = [];
        this.beatTick = 60 * 1000 / 120 / 12;
        this.counter = 0;
        this.tempo = 120;
        this.beat = 4;
        this.isRing = true;
        this.reserveClick = function (nextClickTimeStamp) {
            // 予約時間をループで使っていたDOMHighResTimeStampからAudioContext向けに変換
            var nextClickTime = _this.timeStampToAudioContextTime(nextClickTimeStamp);
            // 変換した時刻を使ってクリックを予約
            if (_this.counter == 0 && _this.isRing) {
                _this.noteList[0].click(nextClickTime);
            }
            if (_this.counter % 12 == 0) {
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
            return nextClickTimeStamp;
        };
        this.setTempo = function (tempo) {
            _this.tempo = tempo;
            _this.beatTick = 60 * 1000 / _this.tempo / 12;
        };
        this.getTempo = function () {
            return _this.tempo;
        };
        this.setBeat = function (beat) {
            if (beat == 0) {
                _this.beat = 1;
                _this.isRing = false;
            }
            else {
                _this.beat = beat;
                _this.isRing = true;
            }
        };
        this.getBeat = function () {
            return _this.beat;
        };
        this.initAudio();
        this.baseTimeStamp = performance.now() - this.ctx.currentTime * 1000;
        this.lastClickTimeStamp = performance.now();
    }
    Metronome.prototype.initAudio = function () {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.noteList.push(new Note('https://fclef978.github.io/sample/bell.wav', this.ctx, this.masterGain, 1));
        this.noteList.push(new Note('https://fclef978.github.io/sample/tick.wav', this.ctx, this.masterGain, 4));
        this.noteList.push(new Note('https://fclef978.github.io/sample/tickL.wav', this.ctx, this.masterGain, 8));
        this.noteList.push(new Note('https://fclef978.github.io/sample/tickL.wav', this.ctx, this.masterGain, 12));
        this.noteList.push(new Note('https://fclef978.github.io/sample/tickL.wav', this.ctx, this.masterGain, 16));
    };
    Metronome.prototype.setMasterVol = function (vol) {
        this.masterGain.gain.value = vol;
    };
    Metronome.prototype.setVolume = function (num, vol) {
        this.noteList[num].setVolume(vol);
    };
    Metronome.prototype.setVolBulkily = function (num, vol) {
        if (num == 0)
            this.setMasterVol(vol);
        else
            this.setVolume(num - 1, vol);
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
                switch (_this.counter) {
                    case 0:
                        _this.event0();
                    case 24:
                        _this.event12();
                }
                _this.lastClickTimeStamp = _this.reserveClick(nextClickTimeStamp);
            }
        }, 200);
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
var MetronomeController = /** @class */ (function () {
    function MetronomeController() {
        var _this = this;
        this.mn = new Metronome();
        this.startBtn = document.getElementById("start-stop");
        this.volumeBars = document.getElementsByClassName("volume");
        this.tempoDisp = document.getElementById("tempo-disp");
        this.lamp = document.getElementById("lamp");
        this.running = false;
        this.volumeMax = 20;
        this.initVolumes = [1.0, 1.0, 1.0, 0.5, 0.0, 0.0];
        this.initTempo = function () {
            var udvc = new UpDownValController("tempo-ui", _this.mn.getTempo, _this.mn.setTempo);
            udvc.setParam(40, 240, 1);
            udvc.addOptionalInput(document.getElementById("tempo"));
        };
        this.initBeat = function () {
            var udvc = new UpDownValController("beat-ui", _this.mn.getBeat, _this.mn.setBeat);
            udvc.setParam(0, 16, 1);
        };
        this.startStop = function () {
            _this.mn.ctx.resume();
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
        Array.prototype.forEach.call(this.volumeBars, function (item, key) {
            item.value = _this.initVolumes[+key] * _this.volumeMax;
            item.min = 0;
            item.max = _this.volumeMax;
            item.step = 1;
            _this.mn.setVolBulkily(+key, _this.initVolumes[+key]);
            item.oninput = function (e) {
                var val = +e.target.value / _this.volumeMax;
                _this.mn.setVolBulkily(+key, +val);
            };
        });
        this.initTempo();
        this.initBeat();
        this.mn.event0 = function () {
            _this.lamp.classList.remove("hidden");
        };
        this.mn.event12 = function () {
            _this.lamp.classList.add("hidden");
        };
    }
    return MetronomeController;
}());
window.onload = function () {
    new MetronomeController();
};
