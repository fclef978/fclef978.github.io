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

                // スケジュール済みクリックの時刻を更新
                this.lastClickTimeStamp = nextClickTimeStamp;
            }
        }, 200);
    }

    setTempo(tempo: number): void {
        if (tempo == 1) this.tempo++;
        else if (tempo == -1) this.tempo--;
        else this.tempo = tempo;
        this.beatTick = 60 * 1000 / this.tempo / 12;
    }

    setBeat(beat: number): void {
        if (beat == 0) {
            this.beat = 1;
            this.isRing = false;
        } else {
            this.beat = beat;
            this.isRing = true;
        }
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
    tempoBar = <HTMLInputElement>document.getElementById("tempo");
    tempoDisp = <HTMLInputElement>document.getElementById("tempo-disp");
    beatField = <HTMLInputElement>document.getElementById("beat");
    running = false;
    volumeMax = 20;
    initVolumes = [1.0, 1.0, 1.0, 0.5, 0.0, 0.0];

    constructor() {
        this.startBtn.onclick = this.startStop;
        Array.prototype.forEach.call(this.volumeBars, this.initVolBar);
        this.initTempo();
        this.initBeat();
    }

    initVolBar = (item: any, key: string) => {
        item.value = this.initVolumes[+key] * this.volumeMax; item.min = 0; item.max = this.volumeMax; item.step = 1;
        if (+key == 0) {
            this.mn.setMasterVol(this.initVolumes[+key]);
            item.oninput = (e) => {
                const val = +(<HTMLInputElement>e.target).value / this.volumeMax;
                this.mn.setMasterVol(val);
            }
        } else {
            this.mn.setVolume(+key - 1, this.initVolumes[+key]);
            item.oninput = (e) => {
                const val = +(<HTMLInputElement>e.target).value / this.volumeMax;
                this.mn.setVolume(+key - 1, +val);
            }
        }
    };

    initTempo = () => {
        this.tempoBar.value = "120"; this.tempoBar.min = "40"; this.tempoBar.max = "240"; this.tempoBar.step = "1";
        this.tempoDisp.value = this.tempoBar.value; this.tempoDisp.min = "40"; this.tempoDisp.max = "240"; this.tempoDisp.step = "1";
        const up = document.getElementById("tempo-up");
        const down = document.getElementById("tempo-down");
        this.tempoBar.addEventListener("input", this.tempoChange);
        this.tempoDisp.addEventListener("input", this.tempoChange);
        up.addEventListener("click", this.tempoInc);
        down.addEventListener("click", this.tempoDec);
    };

    initBeat = () => {
        this.beatField.value = "4"; this.beatField.min = "0"; this.beatField.max = "16"; this.beatField.step = "1"; 
        this.beatField.addEventListener("input", (e) => {
            let val = +(<HTMLInputElement>e.target).value;
            console.log(val);
            this.mn.setBeat(val);
        });
    }

    tempoInc = (e) => {
        this.tempoChange(e, 1);
    }

    tempoDec = (e) => {
        this.tempoChange(e, -1);
    }

    tempoChange = (e, delta=0) => {
        let val = 0;
        if (delta == 0) val = +(<HTMLInputElement>e.target).value;
        else val = +this.tempoBar.value + delta;
        this.mn.setTempo(val);
        this.tempoDisp.value = val.toString();
        this.tempoBar.value = val.toString();
    };

    startStop = () => {
        if (this.running) {
            this.running = false;
            this.mn.stop();
        }
        else {
            this.running = true;
            this.mn.start();
        }
    }
}

window.onload = () => {
    new MetronomeController();
};
