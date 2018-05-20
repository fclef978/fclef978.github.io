/* メトロノーム
 * by FClef978
 * TypeScriptは初めてなんで多少のガバは許し亭ゆるして
 */

class Note {
  ctx: AudioContext;
  buffer: AudioBuffer;
  gain: GainNode;
  volume = 1.0;

  constructor(url: string, ctx: AudioContext, master: GainNode) {
    this.ctx = ctx;
    this.getBuffer(url);
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(master);
  }

  click = (time: number) => {
    // source を作成
    var source = this.ctx.createBufferSource();
    // buffer をセット
    source.buffer = this.buffer;
    // context に connect
    source.connect(this.gain);
    // 再生
    source.start(time);
  };

  getBuffer(url: string) {
    var req = new XMLHttpRequest();
    // array buffer を指定
    req.responseType = 'arraybuffer';

    req.onreadystatechange = () => {
      if (req.readyState === 4) {
        if (req.status === 0 || req.status === 200) {
          // array buffer を audio buffer に変換
          this.ctx.decodeAudioData(req.response, (buffer: AudioBuffer) => {
            this.buffer = buffer;
          });
        }
      }
    };

    req.open('GET', url, true);
    req.send('');
  }
}

class Metronome {
  context: AudioContext; // コンテクスト
  masterGain: GainNode;
  noteList: Array<Note> = [];
  baseTimeStamp: number; // 基準タイムスタンプ
  lastClickTimeStamp: number; // 最終クリック時刻
  beatTick = 60 * 1000 / 120 / 12;
  counter = 0;
  beat = 4;
  timer: number;

  constructor() {
    this.initAudio();
    this.baseTimeStamp = performance.now() - this.context.currentTime * 1000;
    this.lastClickTimeStamp = performance.now();
  }

  initAudio(): void {
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    for (let i = 0; i < 5; i++) {
      this.noteList.push(new Note('./sample/tick.wav', this.context, this.masterGain));
    }
  }

  setMasterVol(vol: number) {
    this.masterGain.gain.value = vol;
  }

  setVolume(num: number, vol: number) {
    this.noteList[num].volume = vol;
  }

  setMetronome(): void {
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
        if (this.counter % 12 == 0) this.noteList[0].click(nextClickTime);
        else if (this.counter % 6 == 0) this.noteList[1].click(nextClickTime);
        else if (this.counter % 4 == 0) this.noteList[2].click(nextClickTime);
        else if (this.counter % 3 == 0) this.noteList[3].click(nextClickTime);
        if (this.counter++ == 12 * this.beat) this.counter = 0;

        // スケジュール済みクリックの時刻を更新
        this.lastClickTimeStamp = nextClickTimeStamp;
      }
    }, 200);
  }

  setTempo(tempo: number): void {
    this.beatTick = 60 * 1000 / tempo / 12;
  }

  currentTimeStamp(): number {
    return this.baseTimeStamp + this.context.currentTime * 1000;
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
  running = false;
  volumeMax = 20;
  initVolumes = [1.0, 1.0, 1.0, 0.5, 0.0, 0.0];

  constructor() {
    this.startBtn.onclick = this.startStop;
    Array.prototype.forEach.call(this.volumeBars, this.initVolBar);
    this.initTempo();
  }

  initVolBar = (item: any, key: string) => {
    item.value = this.initVolumes[+key] * this.volumeMax; item.min = 0; item.max = this.volumeMax; item.step = 1;
    if (+key == 0) {
      item.oninput = (e) => {
        const val = +(<HTMLInputElement>e.target).value / this.volumeMax;
        this.mn.setMasterVol(val);
      }
    } else {
      item.oninput = (e) => {
        const val = +(<HTMLInputElement>e.target).value / this.volumeMax;
        this.mn.setVolume(+key, +val);
      }
    }
  };

  initTempo = () => {
    this.tempoBar.value = "120";
    this.tempoBar.min = "40";
    this.tempoBar.max = "240";
    this.tempoBar.step = "1";
    var tempo = 0;
    this.tempoBar.oninput = (e) => {
      const val = (<HTMLInputElement>e.target).value;
      this.mn.setTempo(+val);
    };
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
