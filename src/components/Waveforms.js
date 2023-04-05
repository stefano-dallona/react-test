import React, { Component, setState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
//import { BufferLoader  } from 'waves-audio';

import { MultiSelect } from 'primereact/multiselect';

import { ConfigurationService } from '../services/testbench-configuration-service';
import { AnalysisService } from '../services/testbench-analysis-service';
import { BufferLoader } from '../audio/bufferloader';
import { trackPromise } from 'react-promise-tracker';

var wavesUI = require('waves-ui');

class Waveforms extends Component {
    constructor(props) {
        super(props);

        this.audioContext = new AudioContext()

        this.audioFiles = props.audioFiles || []
        this.lossSimulationFiles = props.lossSimulationFiles || []
        this.buffersList = []
        this.colors = []
        this.layersMap = new Map()

        let baseUrl = "http://localhost:5000"
        this.configurationService = new ConfigurationService(baseUrl)
        this.analysisService = new AnalysisService(baseUrl)

        this.segmentEventHandler = props.segmentEventHandler

        this.state = {
            runId: props.runId || "",
            filename: props.filename || "",
            selectedAudioFiles: [],
            selectedLossSimulations: [],
            buffersListReady: false,
            lossSimulationsReady: false
        };
    }

    componentDidMount() {
        this.initColorsPalette()
        this.loadHierarchy().then(() => {
            this.loadBuffers();
            this.loadLossSimulation()
        });
    }

    setAudioFiles(audioFiles) {
        this.audioFiles = audioFiles
        this.audioFiles.forEach((file, index) => {
            let parent = this.findParent(this.hierarchy, file)
            file.label = file.name + (parent ? " - " + parent.name : "")
        });
    }

    setLossSimulationFiles(lossSimulationFiles) {
        this.lossSimulationFiles = lossSimulationFiles
        this.setState({
            selectedLossSimulations: this.lossSimulationFiles.map((file, index) => file.uuid),
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

    initColorsPalette() {
        while (this.colors.length < 100) {
            let newColor = null
            do {
                newColor = Math.floor((Math.random() * 1000000) + 1);
            } while (this.colors.indexOf(newColor) >= 0);
            this.colors.push("#" + ("000000" + newColor.toString(16)).slice(-6));
        }
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
                if (this.segmentEventHandler) this.segmentEventHandler.apply(null, [datum])
            }
        }.bind(this)
    }

    renderWaveforms(waveformTrackId) {
        if (!this.state.buffersListReady) return null;

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
        }

        this.timeline.layers.forEach((layer) => this.timeline.removeLayer(layer));

        this.buffersList
            .filter((buffer, index) => this.state.selectedAudioFiles.indexOf(this.audioFiles[index].uuid) != -1)
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

        this.cursorLayer = new wavesUI.helpers.CursorLayer({
            height: height
        });

        this.timeline.addLayer(this.cursorLayer, waveformTrackId);
    }

    renderLossSimulations(waveformTrackId) {
        if (!this.state.lossSimulationsReady) return null;

        this.lossSimulations
            .filter((lossSimulation, index) => this.state.selectedLossSimulations.indexOf(this.lossSimulationFiles[index].uuid) != -1)
            .map((lossSimulation, index) => {
                let lossSimulationLayer = new wavesUI.helpers.SegmentLayer(lossSimulation.lost_intervals, {
                    height: 200,
                    displayHandlers: false,
                });
                return lossSimulationLayer
            }).forEach((lossSimulationLayer, index) => {
                this.timeline.addLayer(lossSimulationLayer, waveformTrackId);
                this.layersMap.set(this.lossSimulationFiles[index], lossSimulationLayer)

                this.timeline.tracks.render(lossSimulationLayer);
                this.timeline.tracks.update(lossSimulationLayer);
            })
    }

    renderAll(waveformTrackId) {
        this.renderWaveforms(waveformTrackId);
        this.renderLossSimulations(waveformTrackId)
    }

    render() {
        let waveformTrackId = 'waveform';
        return (
            <div>
                <div id="runWaveforms"
                    ref={(c) => {
                        this.waveuiEl = c;
                    }}>
                    {this.waveuiEl && this.renderAll(waveformTrackId)}
                    <label>Displayed audio files</label>
                </div>
                <MultiSelect id='displayedLossSimulations' value={this.state.selectedLossSimulations} onChange={(e) => this.setSelectedLossSimulations(e.value)} options={this.lossSimulationFiles} optionLabel="name" optionValue='uuid' display="chip"
                    placeholder="Select loss simulations" maxSelectedLabels={3} className="w-full md:w-20rem" />
                <label>Displayed audio files</label>
                <MultiSelect id='displayedAudioFiles' value={this.state.selectedAudioFiles} onChange={(e) => this.setSelectedAudioFiles(e.value)} options={this.audioFiles} optionLabel="label" optionValue='uuid' display="chip"
                    placeholder="Select audio files" maxSelectedLabels={3} className="w-full md:w-20rem" />
            </div>
        )
    }
}

export default Waveforms;