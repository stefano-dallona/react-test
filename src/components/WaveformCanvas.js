import '../App.css';
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';
import '../css/waveforms.css';

import React, { Component } from 'react';
import WaveformData from 'waveform-data';

//import { useContainer } from "../components/ServicesContextProvider"

export class WaveformCanvas extends Component {
  constructor(props) {
    super(props);

    this.state = {
        runId: props.runId || "",
        original_file_id: props.original_file_id || "",
        audio_file_id: props.audio_file_id || "",
        sampleRate: props.sampleRate || 44100,
        offset: props.offset || 0,
        numSamples: props.numSamples || 5 * (props.sampleRate || 44100),
        cursor: props.cursor || 0
    }
  }

  setInterval(offset, numSamples, sampleRate) {
    this.setState({
        offset: offset,
        numSamples: numSamples,
        sampleRate: sampleRate
    }, this.refreshWaveform.bind(this))
  }

  setCursor(cursor) {
    this.setState({
      cursor: cursor
    }, () => this.drawCursor.bind(this)(cursor))
  }

  render() {
    console.log("WaveformView.render, audioUrl:", this.state.audioUrl, 'waveformDataUrl:', this.state.waveformDataUrl);

    return (
        <div id="canvas" style={{position: "relative", display: 'flex'}}>
          <canvas id="waveform" width="1500" height="200" style={{ position: "absolute", left: "0px", top: "0px", zIndex: 0 }}></canvas>
          <canvas id="cursor" width="1500" height="200" style={{ position: "absolute", left: "0px", top: "0px", zIndex: 1 }}></canvas>
        </div>
    );
  }

  componentDidMount() {
    console.log("WaveformComponent.componentDidMount");
    this.refreshWaveform()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log('WaveformComponent.componentDidUpdate');
  }

  componentWillUnmount() {
    console.log('WaveformView.componentWillUnmount');
  }

  fetchAudioSegment = (offset, numSamples) => {
    const audioContext = new AudioContext();

    return [1].map(audio_files_id => {
      let url = `https://localhost:5000/analysis/runs/14517878531968720/input-files/71262497152688256/output-files/55975043578285557?offset=${offset}&num_samples=${numSamples}&jwt=${localStorage.getItem("jwt_token")}`
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

  refreshWaveform = async () => {
    let waveforms = await Promise.all(this.fetchAudioSegment(this.state.offset, this.state.numSamples))
    this.drawWaveform(waveforms)
    //this.drawCursor(this.state.cursor)
  }

}