/* メトロノーム
 * by FClef978
 * TypeScriptは初めてなんで多少のガバは許し亭ゆるして
 */

class Note {
    ctx: AudioContext;
    buf: AudioBuffer;
    gain: GainNode;
    num: number;
    volume = 1.0;

    constructor(url: string, ctx: AudioContext, master: GainNode, num: number) {
        this.ctx = ctx;
        this.num = num;
        this.getBuffer(url);
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 1.0;
        this.gain.connect(master);
    }

    click = (time: number) => {
        const source = this.ctx.createBufferSource();
        source.buffer = this.buf;
        source.connect(this.gain);
        source.start(time);
    };

    setVolume(vol: number) {
        this.gain.gain.value = vol;
    }

    getBuffer(url: string) {
        const req = new XMLHttpRequest();
        // array buffer を指定
        req.responseType = 'arraybuffer';

        req.onreadystatechange = () => {
            if (req.readyState === 4) {
                if (req.status === 0 || req.status === 200) {
                    // array buffer を audio buffer に変換
                    this.ctx.decodeAudioData(req.response, (buffer: AudioBuffer) => {
                        this.buf = buffer;
                        const selector = 'volume' + this.num.toString();
                        const bar = document.getElementById(selector);
                        bar.classList.remove('hidden');
                    });
                }
            }
        };
        req.open('GET', url, true);
        req.send('');
    }
}

class UpDownValController {
    btnUp: HTMLInputElement;
    btnDown: HTMLInputElement;
    dispVal: HTMLInputElement;
    optInputs: Array<HTMLInputElement> = [];

    constructor(id: string, getter, setter) {
        const lis = document.getElementById(id).children;
        this.getBase = getter; this.setBase = setter;
        for (let i = 0; i < lis.length; i++) {
            const li = lis[i];
            switch (i) {
                case 0:
                this.btnUp = <HTMLInputElement>li.children[0];
                break;
                case 1:
                this.dispVal = <HTMLInputElement>li.children[0];
                break;
                case 2:
                this.btnDown = <HTMLInputElement>li.children[0];
                break;
            }
        }
        this.btnUp.addEventListener("click", this.increase);
        this.btnDown.addEventListener("click", this.decrease);
        this.dispVal.addEventListener("input", this.change);
    }

    setParam(min, max, step) {
        this.dispVal.min = min;
        this.dispVal.max = max;
        this.dispVal.step = step;
        this.dispVal.value = this.getBase();
    }

    addOptionalInput = (input) => {
        input.min = this.dispVal.min;
        input.max = this.dispVal.max;
        input.step = this.dispVal.step;
        input.value = this.dispVal.value;
        input.addEventListener("input", this.change);
        this.optInputs.push(input);
    }

    
    getBase = (): string => { return "0"; };

    setBase = (num: number) => {};
    
    increase = (e) => {
        this.change(e, 1);
    }

    decrease = (e) => {
        this.change(e, -1);
    }

    change = (e, delta=0) => {
        let val = 0;
        if (delta == 0) val = +(<HTMLInputElement>e.target).value;
        else val = +this.getBase() + delta;
        this.dispVal.value = val.toString();
        this.setBase(val);
        for (let i = 0; i < this.optInputs.length; i++) {
            this.optInputs[i].value = val.toString();
        }
    };
}

class Metronome {
    ctx: AudioContext; // コンテクスト
    masterGain: GainNode;
    bufList = {};
    noteList: Array<Note> = [];
    baseTimeStamp: number; // 基準タイムスタンプ
    lastClickTimeStamp: number; // 最終クリック時刻
    beatTick = 60 * 1000 / 120 / 12;
    counter = 0;
    tempo = 120;
    beat = 4;
    timer: number;
    isRing = true;
    event0;
    event12;

    constructor() {
        this.initAudio();
        this.baseTimeStamp = performance.now() - this.ctx.currentTime * 1000;
        this.lastClickTimeStamp = performance.now();
    }

    initAudio(): void {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.noteList.push(new Note('https://fclef978.github.io/sample/bell.wav', this.ctx, this.masterGain, 1));
        this.noteList.push(new Note('https://fclef978.github.io/sample/tick.wav', this.ctx, this.masterGain, 4));
        this.noteList.push(new Note('https://fclef978.github.io/sample/tickL.wav', this.ctx, this.masterGain, 8));
        this.noteList.push(new Note('https://fclef978.github.io/sample/tickL.wav', this.ctx, this.masterGain, 12));
        this.noteList.push(new Note('https://fclef978.github.io/sample/tickL.wav', this.ctx, this.masterGain, 16));
    }

    setMasterVol(vol: number) {
        this.masterGain.gain.value = vol;
    }

    setVolume(num: number, vol: number) {
        this.noteList[num].setVolume(vol);
    }

    setVolBulkily(num: number, vol: number) {
        if (num == 0) this.setMasterVol(vol);
        else this.setVolume(num - 1, vol);
    }

    setMetronome(): void {
        this.lastClickTimeStamp = performance.now();
        this.counter = 0;
        this.timer = setInterval(() => {
            // DOMHighResTimeStampで考えながらループを回します
            // 未スケジュールのクリックのうち1.5秒後までに発生予定のものを予約
            const now: number = this.currentTimeStamp();
            for (let nextClickTimeStamp = this.lastClickTimeStamp + this.beatTick;
                 nextClickTimeStamp < now + 300;
                 nextClickTimeStamp += this.beatTick) {
                switch (this.counter) {
                    case 0:
                    this.event0();
                    case 24:
                    this.event12();
                }

                this.lastClickTimeStamp = this.reserveClick(nextClickTimeStamp);
            }
        }, 200);
    }

    reserveClick = (nextClickTimeStamp: number) => {
        // 予約時間をループで使っていたDOMHighResTimeStampからAudioContext向けに変換
        const nextClickTime: number = this.timeStampToAudioContextTime(nextClickTimeStamp);

        // 変換した時刻を使ってクリックを予約
        if (this.counter == 0 && this.isRing) {
            this.noteList[0].click(nextClickTime);
        }
        if (this.counter % 12 == 0) {
            this.noteList[1].click(nextClickTime);
        }
        else if (this.counter % 6 == 0) {
            this.noteList[2].click(nextClickTime);
        }
        else if (this.counter % 4 == 0) {
            this.noteList[3].click(nextClickTime);
        }
        else if (this.counter % 3 == 0) {
            this.noteList[4].click(nextClickTime);
        }
        if (++this.counter >= 12 * this.beat) this.counter = 0;

        return nextClickTimeStamp;
    }

    setTempo = (tempo: number) => {
        this.tempo = tempo;
        this.beatTick = 60 * 1000 / this.tempo / 12;
    }

    getTempo = () => {
        return this.tempo;
    }

    setBeat = (beat: number) => {
        if (beat == 0) {
            this.beat = 1;
            this.isRing = false;
        } else {
            this.beat = beat;
            this.isRing = true;
        }
    }

    getBeat = () => {
        return this.beat;
    }

    currentTimeStamp(): number {
        return this.baseTimeStamp + this.ctx.currentTime * 1000;
    }

    timeStampToAudioContextTime(timeStamp: number): number {
        return (timeStamp - this.baseTimeStamp) / 1000;
    }

    start(): void {
        this.setMetronome();
    }

    stop(): void {
        clearInterval(this.timer);
    }
}

class MetronomeController {
    mn = new Metronome();
    startBtn = document.getElementById("start-stop");
    volumeBars = document.getElementsByClassName("volume");
    tempoDisp = <HTMLInputElement>document.getElementById("tempo-disp");
    lamp = document.getElementById("lamp");
    running = false;
    volumeMax = 20;
    initVolumes = [1.0, 1.0, 1.0, 0.5, 0.0, 0.0];

    constructor() {
        this.startBtn.onclick = this.startStop;
        Array.prototype.forEach.call(this.volumeBars, (item: any, key: string) => {
            item.value = this.initVolumes[+key] * this.volumeMax; item.min = 0; item.max = this.volumeMax; item.step = 1;
            this.mn.setVolBulkily(+key, this.initVolumes[+key]);
            item.oninput = (e) => {
                const val = +(<HTMLInputElement>e.target).value / this.volumeMax;
                this.mn.setVolBulkily(+key, +val);
            }
        });
        this.initTempo();
        this.initBeat();
        this.mn.event0 = () => {
            this.lamp.classList.remove("hidden");
        }
        this.mn.event12 = () => {
            this.lamp.classList.add("hidden");
        }
    }

    initTempo = () => {
        const udvc = new UpDownValController("tempo-ui", this.mn.getTempo, this.mn.setTempo);
        udvc.setParam(40, 240, 1);
        udvc.addOptionalInput(document.getElementById("tempo"));
    };

    initBeat = () => {
        const udvc = new UpDownValController("beat-ui", this.mn.getBeat, this.mn.setBeat);
        udvc.setParam(0, 16, 1);
    };

    startStop = () => {
        this.mn.ctx.resume();
        if (this.running) {
            this.running = false;
            this.mn.stop();
        }
        else {
            this.running = true;
            this.mn.start();
        }
    };
}

window.onload = () => {
    new MetronomeController();
};
