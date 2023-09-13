import '../App.css';
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';
import '../css/waveforms.css';

import React, { Component } from 'react';
import { Button } from 'primereact/button';
import { Slider } from "primereact/slider";
import WaveformData from 'waveform-data';

//import { useContainer } from "../components/ServicesContextProvider"

var Peaks = require('peaks.js');

export class WaveformView extends Component {
  constructor(props) {
    super(props);

    this.audioContext = new AudioContext()

    this.state = {
      //waveformDataUrl: "http://localhost:3000/07030039.dat",
      waveformDataUrl: `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084/waveform?offset=441000&num_samples=44100&max_slices=1500&jwt=${localStorage.getItem("jwt_token")}`,
      //waveformDataUrl: `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084/waveform?offset=0&num_samples=3924900&max_slices=1519&jwt=${localStorage.getItem("jwt_token")}`,
      //audioUrl: "http://localhost:3000/07030039.mp3",
      audioUrl: `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084?offset=441000&num_samples=176400&jwt=${localStorage.getItem("jwt_token")}`
      //audioUrl: `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084?offset=0&num_samples=3924900&jwt=${localStorage.getItem("jwt_token")}`
      //audioUrl: `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084?offset=441000&num_samples=44100&jwt=${localStorage.getItem("jwt_token")}`
      //audioUrl: `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084?offset=441000&num_samples=88200&jwt=${localStorage.getItem("jwt_token")}`
      //audioUrl: `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084?offset=441000&num_samples=132300&jwt=${localStorage.getItem("jwt_token")}`
      //audioUrl: `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084?offset=441000&num_samples=176400&jwt=${localStorage.getItem("jwt_token")}`
      //audioUrl: `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084?offset=441000&num_samples=3924900&jwt=${localStorage.getItem("jwt_token")}`
      //audioUrl: "http://localhost:3000/Blues_Bass.wav"
      , playhead: 0,
      cursor: 0
    }
    this.zoomviewWaveformRef = React.createRef();
    this.overviewWaveformRef = React.createRef();
    this.audioElementRef = React.createRef();
    this.peaks = null;
    this.scrollInterval = 3
  }

  setAudioUrl(audioUrl) {
    this.setState({
      audioUrl: audioUrl
    })
  }

  setWaveformDataUrl(waveformDataUrl) {
    this.setState({
      waveformDataUrl: waveformDataUrl
    })
  }

  setPlayhead(playhead) {
    this.setState({
      playhead: playhead
    }, this.loadSegment.bind(this))
  }

  setCursor(cursor) {
    this.setState({
      cursor: cursor
    }, () => this.drawCursor.bind(this)(cursor))
  }

  render() {
    console.log("WaveformView.render, audioUrl:", this.state.audioUrl, 'waveformDataUrl:', this.state.waveformDataUrl);

    return (
      <div>
        <div className="zoomview-container" ref={this.zoomviewWaveformRef}></div>
        <div className="overview-container" ref={this.overviewWaveformRef}></div>
        <div id="canvas" style={{position: "relative"}}>
          <canvas id="waveform" width="1500" height="300" style={{ position: "absolute", left: "0px", top: "0px", zIndex: 0 }}></canvas>
          <canvas id="cursor" width="1500" height="300" style={{ position: "absolute", left: "0px", top: "0px", zIndex: 1 }}></canvas>
        </div>

        <audio ref={this.audioElementRef} src={this.state.audioUrl} controls="controls">
          Your browser does not support the audio element.
        </audio>

        {this.renderButtons()}
      </div>
    );
  }

  renderButtons() {
    return (
      <>
        <Slider value={this.state.playhead} onChange={(e) => { this.setPlayhead(e.value) }} step={this.scrollInterval} max={89} />
      </>
    );
  }

  componentDidMount() {
    console.log("WaveformComponent.componentDidMount");

    this.initPeaks();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log('WaveformComponent.componentDidUpdate');

    if (this.state.audioUrl === prevState.audioUrl) {
      return;
    }

    console.log('state', this.state);
    console.log('prevState', prevState);

    this.initPeaks();
  }

  initPeaks() {
    const options = {
      overview: {
        container: this.overviewWaveformRef.current
      },
      zoomview: {
        container: this.zoomviewWaveformRef.current
      },
      mediaElement: this.audioElementRef.current,
      keyboard: true,
      logger: console.error.bind(console),
      zoomLevels: [4096, 8192]
    };

    if (this.state.waveformDataUrl) {
      options.dataUri = {
        //arraybuffer: this.state.waveformDataUrl
        json: this.state.waveformDataUrl
      };
    }
    else if (this.audioContext) {
      options.webAudio = {
        audioContext: this.audioContext,
        disable_worker: true
      };
    }

    this.audioElementRef.current.src = this.state.audioUrl;

    if (this.peaks) {
      this.peaks.destroy();
      this.peaks = null;
    }

    Peaks.default.init(options, (err, peaks) => {
      this.peaks = peaks;
      this.onPeaksReady();
    });
  }

  componentWillUnmount() {
    console.log('WaveformView.componentWillUnmount');

    if (this.peaks) {
      this.peaks.destroy();
    }
  }

  fetchAudioSegment = (offset, numSamples) => {
    const audioContext = new AudioContext();

    return [1].map(audio_files_id => {
      let url = `https://localhost:5000/analysis/runs/16648725107121961/input-files/71262497152688256/output-files/12656612997524084?offset=${offset}&num_samples=${numSamples}&jwt=${localStorage.getItem("jwt_token")}`
      return fetch(url)
        .then(response => {
          return response.arrayBuffer()
        })
        .then(arrayBuffer => {
          return audioContext.decodeAudioData(arrayBuffer)
        })
        .then(audioBuffer => {
          const options = {
            audio_context: audioContext,
            audio_buffer: audioBuffer,
            scale: 1
          };

          return new Promise((resolve, reject) => {
            WaveformData.createFromAudio(options, (err, waveform) => {
              if (err) {
                reject(err);
              }
              else {
                resolve(waveform);
              }
            });
          });
        })
    })
  }

  drawWaveform = (waveforms) => {
    let colorsList = ["red", "green", "blue", "yellow", "orange"]

    const scaleY = (amplitude, height) => {
      const range = 256;
      const offset = 128;

      return height - ((amplitude + offset) * height) / range;
    }

    const canvas = document.getElementById("waveform")
    const ctx = canvas.getContext('2d');

    waveforms.forEach((waveform, index) => {
      const resampledWaveform = waveform.resample({ width: canvas.width });

      ctx.strokeStyle = colorsList[index];
      ctx.lineWidth = 1
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();

      const channel = resampledWaveform.channel(0);

      // Loop forwards, drawing the upper half of the waveform
      for (let x = 0; x < resampledWaveform.length; x++) {
        const val = channel.max_sample(x);

        ctx.lineTo(x, scaleY(0, canvas.height));
        ctx.lineTo(x + 0.5, scaleY(0, canvas.height));
        ctx.lineTo(x + 0.5, scaleY(val, canvas.height) + 0.5);
      }

      // Loop backwards, drawing the lower half of the waveform
      for (let x = resampledWaveform.length - 1; x >= 0; x--) {
        const val = channel.min_sample(x);

        ctx.lineTo(x, scaleY(0, canvas.height));
        ctx.lineTo(x - 0.5, scaleY(0, canvas.height));
        ctx.lineTo(x - 0.5, scaleY(val, canvas.height) + 0.5);
      }

      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    });
  }

  drawCursor = (x) => {
    const canvas = document.getElementById("cursor")
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = "yellow"
    ctx.lineWidth = 1
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineTo(x % canvas.width, 0);
    ctx.lineTo(x % canvas.width, canvas.height);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }

  loadSegment = async () => {
    let waveforms = await Promise.all(this.fetchAudioSegment(this.state.playhead * 44100, this.scrollInterval * 44100))
    this.drawWaveform(waveforms)
    let interval = setInterval(() => {
      this.setCursor(this.state.cursor + 100)
    }, 100)
  }

  onPeaksReady = () => {
    // Do something when the Peaks instance is ready for use
    console.log("Peaks.js is ready");
    //this.drawCursor(500)
    //let interval = setInterval(() => { if (this.state.playhead > 89 - this.scrollInterval) { clearInterval(interval) } this.setPlayhead(this.state.playhead + this.scrollInterval) }, this.scrollInterval * 1000)
  }
}