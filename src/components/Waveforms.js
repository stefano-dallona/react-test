import { primeflex } from '../../node_modules/primeflex/primeflex.css'
import 'primeicons/primeicons.css';

import React, { Component, setState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
//import { BufferLoader  } from 'waves-audio';

import { MultiSelect } from 'primereact/multiselect';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { SplitButton } from 'primereact/splitbutton';
import { Dropdown } from 'primereact/dropdown';

import { ConfigurationService } from '../services/testbench-configuration-service';
import { AnalysisService } from '../services/testbench-analysis-service';
import { BufferLoader } from '../audio/bufferloader';
import { trackPromise } from 'react-promise-tracker';

import Spectrogram from './Spectrogram';
import SamplesVisualizer from './SamplesVisualizer';

var wavesUI = require('waves-ui');

class Waveforms extends Component {
    constructor(props) {
        super(props);

        this.samplesVisualizer = React.createRef();
        this.spectrogram = React.createRef();

        this.audioContext = new AudioContext()

        this.audioFiles = props.audioFiles || []
        this.lossSimulationFiles = props.lossSimulationFiles || []
        this.buffersList = []
        this.colors = []
        this.layersMap = new Map()
        this.inputFiles = []

        let baseUrl = "http://localhost:5000"
        this.configurationService = new ConfigurationService(baseUrl)
        this.analysisService = new AnalysisService(baseUrl)

        this.segmentEventHandler = props.segmentEventHandler

        this.state = {
            runId: props.runId || "",
            filename: props.filename || "",
            audioFiles: [],
            channels: ["0", "1"],
            selectedAudioFiles: [],
            selectedChannel: "0",
            selectedLossSimulations: [],
            audioFileToPlay: 0,
            buffersListReady: false,
            lossSimulationsReady: false
        };
    }

    setRunId(runId) {
        this.setState({
            runId: runId
        })
    }

    async setFilename(filename) {
        this.setState({
            selectedAudioFiles: [],
            selectedChannel: "0",
            selectedLossSimulations: [],
            audioFileToPlay: 0,
            buffersListReady: false,
            lossSimulationsReady: false
        }, this.reloadData.bind(this))
        
        this.setState({
            filename: filename
        })
    }

    setSelectedChannel(selectedChannel) {
        this.setState({
            selectedChannel: selectedChannel
        })
    }

    reloadData = async () => {
        this.clearWaveforms()
        this.initColorsPalette()
        await this.loadHierarchy()
        this.loadBuffers()
        await this.loadLossSimulation()
        if (this.spectrogram.current) {
            this.spectrogram.current.setFilename(this.state.filename)
        }
    }

    async componentDidMount() {
        await this.loadInputFiles()
        this.setFilename(this.inputFiles[0])
    }

    setAudioFiles(audioFiles) {
        this.audioFiles = audioFiles
        this.audioFiles.forEach((file, index) => {
            let parent = this.findParent(this.hierarchy, file)
            file.label = file.name + (parent ? " - " + parent.name : "")
        });
        //this.setSelectedAudioFiles(audioFiles)
    }

    setLossSimulationFiles(lossSimulationFiles) {
        this.lossSimulationFiles = lossSimulationFiles
        this.setState({
            selectedLossSimulations: this.lossSimulationFiles[0].uuid,
            lossSimulationsReady: true
        });
    }

    setBuffersList(buffersList) {
        this.buffersList = buffersList
        this.setState({
            selectedAudioFiles: this.audioFiles.map((file, index) => file.uuid),
            buffersListReady: true
        });
    }

    setSelectedAudioFiles(audioFiles) {
        this.setState({
            selectedAudioFiles: audioFiles
        });
    }

    setSelectedLossSimulations(lossSimulations) {
        this.setState({
            selectedLossSimulations: lossSimulations
        });
    }

    setAudioFileToPlay(audioFileToPlay) {
        this.setState({
            audioFileToPlay: audioFileToPlay
        });
    }

    playSound(delay, offset, duration) {
        this.startTime = this.audioContext.currentTime
        this.startOffset = 0
        if (!this.playing) {
            this.audioContext.resume()
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.buffersList[this.state.audioFileToPlay];
            this.audioSource.connect(this.audioContext.destination);
            this.audioSource.start(delay ? delay : 0, offset ? offset : 0, duration ? duration : this.audioSource.buffer.duration);
            this.playing = true
            console.log("source.buffer.duration:" + this.audioSource.buffer.duration);
        } else {
            console.log("Already playing ...")
        }
        this.updateCursor()()
    }

    pauseSound() {
        if (this.playing) {
            this.audioSource.stop()
            this.audioSource.disconnect(this.audioContext.destination)
            this.audioContext.suspend()
            this.startOffset = this.audioContext.currentTime
            this.playing = false
        } else {
            this.audioContext.resume()
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.buffersList[this.state.audioFileToPlay];
            this.audioSource.connect(this.audioContext.destination);
            this.audioSource.start(0, this.startOffset);
            this.playing = true
        }

        this.updateCursor()()
    }

    playInterval(start, duration) {
        this.audioContext.resume()
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.buffersList[this.state.audioFileToPlay];
        this.audioSource.connect(this.audioContext.destination);
        this.audioSource.start(0, start, duration);
        this.playing = true
    }

    playZoomedInterval() {
        this.playInterval(Math.floor(-this.timeline.timeContext.offset), Math.ceil(this.timeline.timeContext.visibleDuration))
    }

    updateCursor() {
        const _view = this
        // listen for time passing...
        return function loop() {
          if (_view.cursorLayer) {
            let offset = _view.audioContext.currentTime - _view.startTime
            let position = offset < _view.buffersList[0].duration ? offset : 0
            _view.cursorLayer.currentPosition = position
            _view.cursorLayer.update();
          }
          window.requestAnimationFrame(loop);
        };
      }

    initColorsPalette() {
        while (this.colors.length < 100) {
            let newColor = null
            do {
                newColor = Math.floor((Math.random() * 1000000) + 1);
            } while (this.colors.indexOf(newColor) >= 0);
            this.colors.push("#" + ("000000" + newColor.toString(16)).slice(-6));
        }
    }

    async loadInputFiles() {
        let run = await trackPromise(this.configurationService.getRun(this.state.runId));
        this.inputFiles = run.selected_input_files
    }

    async loadHierarchy() {
        this.hierarchy = await trackPromise(this.configurationService.getRunHierarchy(this.state.runId, this.state.filename));
    }

    loadBuffers() {
        let audioFiles = this.findAudioFiles(this.hierarchy);
        let bufferLoader = new BufferLoader(
            this.audioContext,
            audioFiles.map((file) => {
                return `${this.configurationService.baseUrl}/analysis/runs/${this.state.runId}/input-files/${file.uuid}/output-files/${file.uuid}`
            }),
            this.setBuffersList.bind(this)
        );
        this.setAudioFiles(audioFiles)
        bufferLoader.load();
    }

    async loadLossSimulation() {
        let lossSimulationFiles = this.findLossFiles(this.hierarchy);
        this.lossSimulations = await trackPromise(Promise.all(lossSimulationFiles.map(async (file) => {
            return await this.analysisService.fetchLostSamples(this.state.runId,
                this.hierarchy.uuid, file.uuid, "seconds")
        })));
        this.setLossSimulationFiles(lossSimulationFiles);
    }

    findAudioFiles(rootNode, predicate) {
        const isAudioNode = (x) => { return x.type == "OriginalTrackNode" || x.type == "ECCTrackNode" }
        const stopRecursion = (x) => { return x.type == "OutputAnalysisNode" }
        const audioFiles = this.mapTreeToList(rootNode, predicate ? predicate : isAudioNode, x => x, stopRecursion)
        console.log("audioFiles:" + audioFiles + ", length: " + audioFiles.length)
        return audioFiles
    }

    findLossFiles(rootNode, predicate) {
        const isLossNode = (x) => { return x.type == "LostSamplesMaskNode" }
        const lossFiles = this.mapTreeToList(rootNode, predicate ? predicate : isLossNode, x => x)
        console.log("lossFiles:" + lossFiles + ", length: " + lossFiles.length)
        return lossFiles
    }

    findParent(rootNode, childNode) {
        const isParentOfNode = (x) => {
            return x.children && x.children.find(c => c.uuid == childNode.uuid)
        }
        const result = this.mapTreeToList(rootNode, isParentOfNode, x => x)
        return result instanceof Array && result.length > 0 ? result[0] : null
    }

    mapTreeToList(root, predicate = (x) => true, mapper = (x) => x, stopRecursion = (x) => false) {
        function _treeToList(root) {
            let accumulator = []
            if (predicate(root)) {
                accumulator.push(mapper(root))
            }
            if (root.children) {
                root.children.filter(x => !stopRecursion(x)).forEach((child) => {
                    accumulator = accumulator.concat(_treeToList(child))
                })
            }
            return accumulator
        }

        return _treeToList(root)
    }

    getPlayableFilesButtons() {
        return this.audioFiles.map((file, i) => {
            return { label: file.label, icon: (this.state.audioFileToPlay == i) ? "pi pi-check" : "", command: () => { this.setAudioFileToPlay(i) } }
        });
    }

    handleSegmentEvent() {
        return function (e) {
            let eventType = e.type;

            let segmentLayers = Array.from(this.layersMap).filter(([name, value]) => value instanceof wavesUI.helpers.SegmentLayer).map(([name, value]) => value)
            let sourceLayer = segmentLayers.find((layer) => layer.getItemFromDOMElement(e.target))
            if (!sourceLayer) return;
            let segment = sourceLayer.getItemFromDOMElement(e.target);
            if (!segment) return;

            let datum = sourceLayer.getDatumFromItem(segment);
            console.log("datum: (x:" + datum.lossstart + ", width:" + datum.losswidth + ")")

            if (eventType == 'mouseover' || eventType == 'mouseout') {
                datum.opacity = eventType === 'mouseover' ? 1 : 0.8;
                sourceLayer.updateShapes();
            }
            if (eventType == 'click') {
                sourceLayer.updateShapes();
                this.samplesVisualizer.current.fetchSamples(this.audioFiles, this.colors, datum.start_sample, datum.num_samples);
                if (this.segmentEventHandler) this.segmentEventHandler.apply(null, [datum])
            }
        }.bind(this)
    }

    clearWaveforms() {
        if (this.waveuiEl) {
            let lastChild = this.waveuiEl.lastElementChild
            if (lastChild.id != "pnl-displayedAudioFiles") {
                lastChild.remove()
            }
            this.audioContext = new AudioContext()
            this.timeline = null
            this.waveformTrack = null
            this.cursorLayer = null
        }
        if (this.spectrogram.current) {
            //this.spectrogram.current
        }
    }

    renderWaveforms(waveformTrackId) {
        //if (!this.state.buffersListReady) return null;

        let $track = this.waveuiEl;
        let width = $track.getBoundingClientRect().width;
        let height = 200;
        let duration = this.buffersList.length > 0 ? this.buffersList[0].duration : 0;
        let pixelsPerSecond = width / duration;

        if (!this.timeline) {
            this.timeline = new wavesUI.core.Timeline(pixelsPerSecond, width);
            this.timeline.state = new wavesUI.states.BrushZoomState(this.timeline);
            this.timeline.on('event', this.handleSegmentEvent().bind(this));
        }
        if (!this.waveformTrack) {
            this.waveformTrack = this.timeline.createTrack($track, height, waveformTrackId);

            this.buffersList
                .map((buffer, index) => {
                    let waveformLayer = new wavesUI.helpers.WaveformLayer(buffer, {
                        height: 200,
                        color: this.colors[index]
                    });
                    return waveformLayer
                }).forEach((waveformLayer, index) => {
                    this.timeline.addLayer(waveformLayer, waveformTrackId);
                    this.layersMap.set(this.audioFiles[index], waveformLayer);
                });
        } else {
            this.audioFiles
                .forEach((file, index) => {
                    if (this.state.selectedAudioFiles.indexOf(file.uuid) != -1) {
                        if (this.waveformTrack.layers.indexOf(this.layersMap.get(file)) == -1)
                            this.waveformTrack.add(this.layersMap.get(file))
                    } else {
                        if (this.waveformTrack.layers.indexOf(this.layersMap.get(file)) != -1)
                            this.waveformTrack.remove(this.layersMap.get(file))
                    }
                });
        }

        this.waveformTrack.render();
        this.waveformTrack.update();

        if (!this.cursorLayer) {
            this.cursorLayer = new wavesUI.helpers.CursorLayer({
                height: height
            });
            this.timeline.addLayer(this.cursorLayer, waveformTrackId);
        }
    }

    renderLossSimulations(waveformTrackId) {
        //if (!this.state.lossSimulationsReady) return null;

        this.lossSimulations
            .filter((lossSimulation, index) => this.layersMap.get(this.lossSimulationFiles[index]) == null)
            .map((lossSimulation, index) => {
                let lossSimulationLayer = new wavesUI.helpers.SegmentLayer(lossSimulation.lost_intervals, {
                    height: 200,
                    displayHandlers: false,
                });
                return lossSimulationLayer
            }).forEach((lossSimulationLayer, index) => {
                this.timeline.addLayer(lossSimulationLayer, waveformTrackId);
                this.layersMap.set(this.lossSimulationFiles[index], lossSimulationLayer);
            })

        this.lossSimulationFiles.forEach((file, index) => {
            if (this.state.selectedLossSimulations == file.uuid) {
                if (this.waveformTrack.layers.indexOf(this.layersMap.get(file)) == -1)
                    this.waveformTrack.add(this.layersMap.get(file))
            } else {
                if (this.waveformTrack.layers.indexOf(this.layersMap.get(file)) != -1)
                    this.waveformTrack.remove(this.layersMap.get(file))
            }
        })

        this.waveformTrack.render();
        this.waveformTrack.update();
    }

    renderAll(waveformTrackId) {
        this.renderWaveforms(waveformTrackId);
        this.renderLossSimulations(waveformTrackId)
    }

    render() {
        const startContent = (
            <React.Fragment>
                <div className="card flex">
                    <SplitButton label="Play" icon="pi pi-play" model={this.getPlayableFilesButtons()} onClick={() => this.playSound.bind(this)(0, 0)} className="mr-2"></SplitButton>
                    <Button icon="pi pi-pause" onClick={this.pauseSound.bind(this)} className="mr-2">Pause</Button>
                    <Button icon="pi pi-step-backward" className="mr-2">Previous Loss</Button>
                    <Button icon="pi pi-step-forward" className="mr-2">Next Loss</Button>
                    <Button icon="pi pi-arrows-h" onClick={this.playZoomedInterval.bind(this)} className="mr-2">Play Zoomed</Button>
                </div>
            </React.Fragment>
        );

        const endContent = (
            <React.Fragment>
            </React.Fragment>
        );

        let waveformTrackId = 'waveform';
        return (
            <Accordion multiple activeIndex={[0, 1, 2]}>
                <AccordionTab header="Waveform">
                    <div id="runWaveforms" className="card flex flex-wrap gap-3 p-fluid"
                        ref={(c) => {
                            this.waveuiEl = c;
                        }}>
                        <div id="pnl-selectedAudioFile" className="flex-auto">
                            <label htmlFor='selectedAudioFile' style={{ color: 'white' }}>Audio File</label>
                            <Dropdown inputId='selectedAudioFile'
                                id='selectedAudioFile'
                                value={this.state.filename}
                                onClick={(e) => { false && e.stopPropagation() }}
                                onChange={(e) => { this.setFilename(e.value) }}
                                options={this.inputFiles}
                                placeholder="Select audio file"
                                className="w-full md:w-20rem" />
                        </div>
                        <div id="pnl-selectedChannel" className="flex-auto">
                            <label htmlFor='selectedChannel' style={{ color: 'white' }}>Channel</label>
                            <Dropdown inputId='selectedChannel'
                                id='selectedChannel'
                                value={this.state.selectedChannel}
                                onClick={(e) => { false && e.stopPropagation() }}
                                onChange={(e) => { this.setSelectedChannel(e.value) }}
                                options={this.state.channels}
                                placeholder="Select channel"
                                className="w-full md:w-20rem" />
                        </div>
                        <div id="pnl-displayedLossSimulations" className="flex-auto">
                            <label htmlFor='displayedLossSimulations' style={{ color: 'white' }}>Displayed loss simulations</label>
                            <Dropdown inputId='displayedLossSimulations'
                                id='displayedLossSimulations'
                                value={this.state.selectedLossSimulations}
                                onClick={(e) => { false && e.stopPropagation() }}
                                onChange={(e) => { this.setSelectedLossSimulations(e.value) }}
                                options={this.lossSimulationFiles}
                                optionLabel="name"
                                optionValue='uuid'
                                display="chip"
                                placeholder="Select loss simulations"
                                className="w-full md:w-20rem" />
                        </div>
                        <div id="pnl-displayedAudioFiles" className="flex-auto">
                            <label htmlFor='displayedAudioFiles' style={{ color: 'white' }}>Displayed audio files</label>
                            <MultiSelect inputId='displayedAudioFiles'
                                id='displayedAudioFiles'
                                value={this.state.selectedAudioFiles}
                                onClick={(e) => { false && e.stopPropagation() }}
                                onChange={(e) => { this.setSelectedAudioFiles(e.value) }}
                                options={this.audioFiles}
                                optionLabel="label"
                                optionValue='uuid'
                                display="chip"
                                placeholder="Select audio files"
                                maxSelectedLabels={3}
                                className="w-full md:w-20rem" />
                        </div>
                        {this.waveuiEl && this.state.lossSimulationsReady && this.state.buffersListReady && this.renderAll(waveformTrackId)}
                    </div>
                    <div className="card">
                        <Toolbar start={startContent} end={endContent} />
                    </div>
                </AccordionTab>
                <AccordionTab header="Samples">
                    {this.waveuiEl && this.state.lossSimulationsReady && this.state.buffersListReady && (
                        <SamplesVisualizer ref={this.samplesVisualizer} runId={this.props.runId} />
                    )}
                </AccordionTab>
                <AccordionTab header="Spectrogram">
                    <Spectrogram ref={this.spectrogram} runId={this.state.runId} filename={this.state.filename}></Spectrogram>
                </AccordionTab>
            </Accordion>
        )
    }
}

export default Waveforms;

/*

zoom spectrogram

waveSurfer.zoom(zoom);
waveSurfer.spectrogram.init();
$("spectrogram > canvas").css("width", `${waveSurfer.drawer.width / waveSurfer.params.pixelRatio}px`);

*/