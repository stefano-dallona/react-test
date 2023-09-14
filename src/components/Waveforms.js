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
import { Dialog } from 'primereact/dialog'
import { Tooltip } from 'primereact/tooltip'

import { BufferLoader } from '../audio/bufferloader';
import { trackPromise } from 'react-promise-tracker';

import AudioSpectrogram from './Spectrogram';
import SamplesVisualizer from './SamplesVisualizer';
import { AudioPlayer } from './AudioPlayerStreaming';
import { MetricsVisualizer } from './MetricsVisualizer';
import { CirclePicker, CompactPicker, SwatchesPicker, TwitterPicker } from 'react-color';

import BrushZoomState from '../audio/brush-zoom'

import ReactH5AudioPlayer, { RHAP_UI } from 'react-h5-audio-player'
import { WaveformCanvas } from './WaveformCanvas';
//import Peaks from 'peaks.js';

var wavesUI = require('waves-ui');
//var Peaks = require('peaks.js');


class Waveforms extends Component {
    constructor(props) {
        super(props);

        this.downsamplingEnabled = true
        this.loadOnlyZoomedSection = true
        this.parallelWaveformLoading = false

        this.samplesVisualizer = React.createRef();
        this.spectrogram = React.createRef();
        this.audioPlayerOnZoomOut = React.createRef();
        this.player = React.createRef()
        this.zoomedRegion = React.createRef()
        this.waveformCanvasRef = React.createRef()

        this.audioContext = new AudioContext()

        this.audioFiles = props.audioFiles || []
        this.lossSimulationFiles = props.lossSimulationFiles || []
        this.buffersList = []
        this.colors = []
        this.layersMap = new Map()
        this.inputFiles = []
        this.waveformTrackId = 'waveform'

        this.servicesContainer = props.servicesContainer

        this.segmentEventHandler = props.segmentEventHandler

        document.addEventListener("keydown", this.onKeyDownHandler.bind(this))

        this.selectedLossSimulation = null
        this.selectedLoss = null

        this.state = {
            runId: props.runId || "",
            filename: props.filename || "",
            //audioFiles: [],
            channels: ["0", "1"],
            selectedAudioFiles: [],
            selectedChannel: "0",
            selectedLossSimulations: [],
            audioFileToPlay: 0,
            buffersListReady: false,
            lossSimulationsReady: false,
            playing: false
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

        let onZoomOutHandler = this.audioPlayerOnZoomOut.current
        if (onZoomOutHandler) onZoomOutHandler(true)
    }

    setSelectedChannel(selectedChannel) {
        this.setState({
            selectedChannel: selectedChannel
        })
    }

    reloadData = async () => {
        this.clearTrack()
        this.initColorsPalette()
        await this.loadHierarchy()
        await this.loadLossSimulation()
        if (this.spectrogram.current) {
            this.spectrogram.current.setFilename(this.state.filename)
        }
    }

    async componentDidMount() {
        await this.loadInputFiles()
        this.setFilename(this.inputFiles[0])

        const options = {
            zoomview: {
                container: document.getElementById('zoomview-container')
            },
            overview: {
                container: document.getElementById('overview-container')
            },
            mediaElement: document.getElementById('audio'),
            webAudio: {
                audioContext: new AudioContext()
            }
        }
        /*
        Peaks.default.init(options, function (err, peaks) {
            if (err) {
                console.error('Failed to initialize Peaks instance: ' + err.message);
                return;
            }

            // Do something when the waveform is displayed and ready
            console.log('Peaks has been initialized successfully.')
        })
        */
    }

    setAudioFiles(audioFiles) {
        this.audioFiles = audioFiles
        this.audioFiles.forEach((file, index) => {
            let parent = this.findParent(this.hierarchy, file)
            file.label = file.name + (parent ? " - " + parent.name : "")
        });
        this.loadBuffers()
        //this.setSelectedAudioFiles(audioFiles)
    }

    setLossSimulationFiles(lossSimulationFiles) {
        this.lossSimulationFiles = lossSimulationFiles
        this.selectedLossSimulation = this.lossSimulationFiles[0].uuid
        this.clearWaveforms()
        this.refreshAudioFiles()
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
        this.selectedLossSimulation = lossSimulations
        this.clearWaveforms()
        this.refreshAudioFiles()
        this.setState({
            selectedLossSimulations: lossSimulations,
            selectedAudioFiles: this.audioFiles.map((x) => x.uuid)
        });
    }

    setAudioFileToPlay(audioFileToPlay) {
        this.setState({
            audioFileToPlay: audioFileToPlay
        });
    }

    getAudioFileToPlay() {
        if (this.audioFiles && this.audioFiles.length > 0) {
            let selectedFile = this.audioFiles[this.state.audioFileToPlay]
            return selectedFile
        }
        return null
    }

    getAudioFileToPlayURL() {
        let selectedFile = this.getAudioFileToPlay()
        if (selectedFile) {
            let baseUrl = this.servicesContainer.configurationService.baseUrl
            return `${baseUrl}/analysis/runs/${this.state.runId}/input-files/${selectedFile.uuid}/output-files/${selectedFile.uuid}?jwt=${localStorage.getItem("jwt_token")}`
        } else {
            return ""
        }
    }

    giveFocusToStopButton() {
        document.getElementById("btn-stop").focus()
    }

    setPlaying(playing) {
        this.setState({
            playing: playing
        })
    }

    playSound(delay, offset, duration) {
        if (!this.playing) {
            this.audioContext = new AudioContext()
            this.startTime = this.audioContext.currentTime
            this.startOffset = 0
            this.playStartTime = null
            this.playEndTime = null
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.buffersList[this.state.audioFileToPlay];
            this.audioSource.connect(this.audioContext.destination);
            this.audioSource.start(delay ? delay : 0, offset ? offset : 0, duration ? duration : this.audioSource.buffer.duration);
            this.playing = true
            console.log("source.buffer.duration:" + this.audioSource.buffer.duration);
            this.updateCursor()()
        } else {
            console.log("Already playing ...")
        }
        this.giveFocusToStopButton()
    }

    stopSound() {
        if (this.playing) {
            this.audioSource.stop()
            this.audioSource.disconnect(this.audioContext.destination)
            this.audioContext.close()
            this.audioContext = new AudioContext()
            this.audioContext.suspend()
        }

        this.startTime = this.audioContext.currentTime
        this.startOffset = 0
        this.playEndTime = null
        this.setCursorPosition(this.startOffset)
        this.playing = false
        this.giveFocusToStopButton()
    }

    pauseSound() {
        if (this.playing) {
            this.audioContext.suspend()
            this.startOffset = this.audioContext.currentTime - this.timeline.timeContext.offset
            this.updateCursor()()
            this.playing = false
        } else {
            if (this.startOffset == 0) return
            this.audioContext.resume()
            this.playing = true
            this.updateCursor()()
        }
        this.giveFocusToStopButton()
    }

    playInterval(start, duration) {
        if (this.playing) return

        console.log(`playInterval: start: ${start}s, duration: ${duration}s)`)
        this.audioContext = new AudioContext()
        this.startTime = this.audioContext.currentTime
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.buffersList[this.state.audioFileToPlay];
        this.audioSource.connect(this.audioContext.destination);
        this.audioSource.start(0, start, duration);
        this.audioSource.addEventListener('ended', this.stopSound.bind(this))
        this.playStartTime = start
        this.playEndTime = start + duration
        this.playing = true
        this.updateCursor()()
    }

    playZoomedInterval() {
        if (!this.timeline || !this.buffersList) return
        let start = Math.floor(-this.timeline.timeContext.offset)
        let duration = Math.ceil(this.timeline.timeContext.visibleDuration)
        if (Math.abs(start) == 0 && duration == Math.ceil(this.buffersList[0].duration)) {
            return
        }
        this.playInterval(start, duration)
        this.giveFocusToStopButton()
    }

    getCursorLayer() {
        return this.cursorLayer
    }

    getTimeline() {
        return this.timeline
    }

    setCursorPosition(position) {
        if (this.cursorLayer) {
            this.cursorLayer.currentPosition = position
            console.log("cursor position: " + position)
            this.cursorLayer.update();
        }
    }

    updateCursor() {
        const _view = this
        // listen for time passing...
        return function loop() {
            if (!_view.playing) return
            let offset = (_view.playStartTime ? -_view.timeline.timeContext.offset : 0) + (_view.audioContext.currentTime - _view.startTime)
            let position = offset < _view.buffersList[0].duration ? offset : 0
            _view.setCursorPosition.bind(_view)(position)
            window.requestAnimationFrame(loop);
        };
    }

    initColorsPalette() {
        if (!localStorage.getItem("colorMap")) {
            /*
            while (this.colors.length < 100) {
                let newColor = null
                do {
                    newColor = Math.floor((Math.random() * 1000000) + 1);
                } while (this.colors.indexOf(newColor) >= 0);
                this.colors.push("#" + ("000000" + newColor.toString(16)).slice(-6));
            }*/
            this.colors = ['#e60049', '#0bb4ff', '#50e991', '#e6d800', '#9b19f5', '#ffa300', '#dc0ab4', '#b3d4ff', '#00bfa0', '#036fb8',
                '#0b3cbd', '#019aa8', '#045e8c', '#00cc4c', '#0cdc96', '#0e6047', '#0f0316', '#009661', '#079236', '#016401',
                '#08b020', '#00a874', '#0557bd', '#079f28', '#0b8465', '#098af0', '#03d21f', '#00ee7c', '#0be801', '#03e974',
                '#0a6b51', '#02112a', '#020271', '#0b13e4', '#01de22', '#06b6e7', '#06e640', '#08fbcb', '#0e4c2b', '#0a9cce',
                '#0f18da', '#05fa53', '#06686d', '#0b75f1', '#089bad', '#0af9ce', '#04ff84', '#051a74', '#0bfd1e', '#01bbe9',
                '#0db055', '#0d0f70', '#04aedf', '#07f8a9', '#06de87', '#03d7a4', '#03d5b7', '#027fd7', '#07cda9', '#0d422a',
                '#087783', '#0579cb', '#0196d3', '#0792f0', '#045e03', '#0dc003', '#04e38e', '#0a119a', '#03a738', '#05862d',
                '#0437fb', '#05253b', '#0db400', '#068d3b', '#0dad26', '#096b15', '#038f81', '#03e814', '#0b00fa', '#03dec4',
                '#08f9da', '#07c501', '#068d7d', '#02a66d', '#069044', '#023fea', '#031455', '#049352', '#019af8', '#025949',
                '#0c07a7', '#02d3b6', '#008b62', '#0414ff', '#06b54f', '#027620', '#00276f', '#03f796', '#002640', '#050009']
            localStorage.setItem("colorMap", JSON.stringify(this.colors))
        } else {
            this.colors = JSON.parse(localStorage.getItem("colorMap"))
        }
    }

    async loadInputFiles() {
        let run = await trackPromise(this.servicesContainer.configurationService.getRun(this.state.runId));
        this.inputFiles = run.selected_input_files
    }

    async loadHierarchy() {
        this.hierarchy = await trackPromise(this.servicesContainer.configurationService.getRunHierarchy(this.state.runId, this.state.filename));
    }

    async loadBuffers(channel = 0, offset = 0, numSamples = -1) {
        if (!this.downsamplingEnabled) {
            let bufferLoader = new BufferLoader(
                this.audioContext,
                this.audioFiles.map((file) => {
                    return `${this.servicesContainer.baseUrl}/analysis/runs/${this.state.runId}/input-files/${file.uuid}/output-files/${file.uuid}`
                }),
                this.setBuffersList.bind(this)
            );
            bufferLoader.load();
        } else {
            let waveforms = await this.fetchWaveforms(channel, offset, numSamples)
            this.setBuffersList(waveforms)
        }

        let $track = this.waveuiEl;
        let width = $track.getBoundingClientRect().width;
        let height = 200;
        let duration = this.buffersList.length > 0 ? this.buffersList[0].duration : 0;
        let pixelsPerSecond = width / duration;

        if (!this.timeline) {
            this.timeline = new wavesUI.core.Timeline(pixelsPerSecond, width);
            //this.timeline.state = new wavesUI.states.BrushZoomState(this.timeline);
            let sampleRate = this.buffersList[0].sampleRate
            this.timeline.state = new BrushZoomState(this.timeline,
                sampleRate,
                this.downsamplingEnabled ? async (channel, offset, numSamples) => {
                    this.zoomedRegion.current = numSamples < 0 ? null : {
                        startTime: offset / sampleRate,
                        endTime: (offset + numSamples) / sampleRate,
                        numSamples: numSamples,
                        sampleRate: sampleRate
                    }
                    let waveformsData = await this.fetchWaveforms.bind(this)(channel, offset, numSamples)
                    this.updateWaveforms(channel, waveformsData)
                    this.setPlayerCurrentTime(offset / sampleRate)
                } : null
            );
            this.timeline.on('event', this.handleSegmentEvent().bind(this));
        }

        if (!this.waveformTrack && this.timeline) {
            this.waveformTrack = this.timeline.createTrack($track, height, this.waveformTrackId);
            this.waveformTrack.render();
        }

        this.lossSimulations
            .filter((lossSimulation, index) => this.layersMap.get(this.lossSimulationFiles[index]) == null)
            .map((lossSimulation, index) => {
                let lossSimulationLayer = new wavesUI.helpers.SegmentLayer(lossSimulation.lost_intervals, {
                    height: 200,
                    displayHandlers: false,
                });
                return lossSimulationLayer
            }).forEach((lossSimulationLayer, index) => {
                this.timeline.addLayer(lossSimulationLayer, this.waveformTrackId);
                this.layersMap.set(this.lossSimulationFiles[index], lossSimulationLayer);
            })

        this.buffersList
            .map((buffer, index) => {
                let waveformLayer = new wavesUI.helpers.WaveformLayer(buffer, {
                    height: 200,
                    color: this.colors[index]
                });
                return waveformLayer
            }).forEach((waveformLayer, index) => {
                if (!this.layersMap.get(this.audioFiles[index])) {
                    this.timeline.addLayer(waveformLayer, this.waveformTrackId);
                    this.layersMap.set(this.audioFiles[index], waveformLayer);
                }
            });


        if (!this.cursorLayer) {
            this.cursorLayer = new wavesUI.helpers.CursorLayer({
                height: height
            });
            this.timeline.addLayer(this.cursorLayer, this.waveformTrackId);
        }
    }

    fetchWaveforms = async (channel, offset, numSamples) => {
        let waveforms = []

        if (this.parallelWaveformLoading) {
            waveforms = await trackPromise(Promise.all(this.audioFiles.filter((file, index) => {
                return true //&& index == 0
            }).map(async (file, index) => {
                let $track = this.waveuiEl;
                let maxSlices = (this.loadOnlyZoomedSection) ? Math.ceil($track.getBoundingClientRect().width) : -1;
                let unitOfMeas = "samples"
                return this.servicesContainer.analysisService.fetchWaveform(this.state.runId, file.uuid, file.uuid, channel, offset, numSamples, unitOfMeas, maxSlices)
            })))
        } else {
            /*
            for (const [index, file] of this.audioFiles.entries()) {
                //if (index != 0) continue
                let $track = this.waveuiEl;
                let maxSlices = (this.loadOnlyZoomedSection) ? Math.ceil($track.getBoundingClientRect().width) : -1;
                let unitOfMeas = "samples"
                let waveform = await trackPromise(this.servicesContainer.analysisService.fetchWaveform(this.state.runId, file.uuid, file.uuid, channel, offset, numSamples, unitOfMeas, maxSlices))
                waveforms.push(waveform)
            }
            */
            let $track = this.waveuiEl;
            let maxSlices = (this.loadOnlyZoomedSection) ? Math.ceil($track.getBoundingClientRect().width) : -1;
            let unitOfMeas = "samples"
            waveforms = await trackPromise(this.servicesContainer.analysisService.fetchWaveforms(this.state.runId, this.audioFiles[0].uuid, channel, offset, numSamples, unitOfMeas, maxSlices))
        }

        return waveforms
    }

    updateWaveforms(channel, waveforms) {
        this.audioFiles.map((file, index) => {
            let waveformLayer = this.layersMap.get(file)
            let waveform = waveforms[index]
            if (waveform) {
                let newData = waveform.getChannelData(channel)
                if (waveformLayer) {
                    waveformLayer.data = newData
                    waveformLayer.render()
                }
            }
        })
        this.waveformTrack.update()
    }

    refreshAudioFiles() {
        const parentIsSelectedLoss = (x) => {
            return !x.parent_id || x.parent_id == this.selectedLossSimulation
        }
        let audioFiles = this.findAudioFiles(this.hierarchy, parentIsSelectedLoss);
        this.setAudioFiles(audioFiles)
    }

    async loadLossSimulation() {
        let lossSimulationFiles = this.findLossFiles(this.hierarchy);
        this.lossSimulations = await trackPromise(Promise.all(lossSimulationFiles.map(async (file) => {
            return await this.servicesContainer.analysisService.fetchLostSamples(this.state.runId,
                this.hierarchy.uuid, file.uuid, "seconds")
        })));
        this.setLossSimulationFiles(lossSimulationFiles);
    }

    findAudioFiles(rootNode, predicate) {
        const isAudioNode = (x) => { return x.type == "OriginalTrackNode" || x.type == "ReconstructedTrackNode" }
        //const isAudioNode = (x) => { return x.type == "OriginalTrackNode" || (x.type == "ReconstructedTrackNode" && x.name == "ZerosPLC") }
        //const isAudioNode = (x) => { return x.type == "OriginalTrackNode" }
        const stopRecursion = (x) => { return x.type == "OutputAnalysisNode" }
        const selectionPredicate = x => {
            return isAudioNode(x) && ((predicate) ? predicate(x) : true)
        }
        const audioFiles = this.mapTreeToList(rootNode, selectionPredicate, x => x, stopRecursion)
        console.log("audioFiles:" + audioFiles + ", length: " + audioFiles.length)
        return audioFiles
    }

    findLossFiles(rootNode, predicate) {
        const isLossNode = (x) => { return x.type == "LostSamplesMaskNode" }
        const lossFiles = this.mapTreeToList(rootNode, predicate ? predicate : isLossNode, x => x)
        console.log("lossFiles:" + lossFiles + ", length: " + lossFiles.length)
        return lossFiles
    }

    findMetrics(rootNode, predicate) {
        const isMetricNode = (x) => { return x.type == "OutputAnalysisNode" }
        const metricNodes = this.mapTreeToList(rootNode, predicate ? predicate : isMetricNode, x => x)
        console.log("metricNodes:" + metricNodes + ", length: " + metricNodes.length)
        return metricNodes
    }

    findParent(rootNode, childNode) {
        const isParentOfNode = (x) => {
            return x.children && x.children.find(c => c.uuid == childNode.uuid)
        }
        const result = this.mapTreeToList(rootNode, isParentOfNode, x => x)
        return result instanceof Array && result.length > 0 ? result[0] : null
    }

    findPath(rootNode, childNode, parents = []) {
        const isParentOfNode = (x) => {
            return x.children && x.children.find(c => c.uuid == childNode.uuid)
        }
        const result = this.mapTreeToList(rootNode, isParentOfNode, x => x)
        let parent = result instanceof Array && result.length > 0 ? result[0] : null
        if (parent) {
            return this.findPath(rootNode, parent, [parent].concat(...parents))
        } else {
            return parents
        }
    }

    getMetrics = () => {
        let metrics = this.hierarchy ? this.findMetrics(this.hierarchy) : []
        metrics.forEach((metricNode) => {
            metricNode.path = this.findPath(this.hierarchy, metricNode)
        })
        return metrics
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

    getPlayableFilesCombo() {
        let playableFiles = this.audioFiles.map((file, i) => {
            return { code: i, name: file.label }
        })
        return (
            <Dropdown value={this.state.audioFileToPlay}
                options={playableFiles}
                optionLabel="name"
                optionValue='code'
                onChange={(e) => this.setAudioFileToPlay(e.value)}
                placeholder="Select a file to play"
                className="mr-2 ml-2 w-full md:w-14rem" />
        );
    }

    getPlayableFilesButtons() {
        return this.audioFiles.map((file, i) => {
            return { label: file.label, icon: (this.state.audioFileToPlay == i) ? "pi pi-check" : "", command: () => { this.setAudioFileToPlay(i) } }
        });
    }

    setPlayerCurrentTime = (time) => {
        if (this.player.current) {
            this.player.current.audio.current.currentTime = time
        }
    }

    handleSegmentEvent() {

        const findSegmentAndLayerByEvent = (e) => {
            let segmentLayers = Array.from(this.layersMap).filter(([name, value]) => value instanceof wavesUI.helpers.SegmentLayer).map(([name, value]) => value)
            let sourceLayer = segmentLayers.find((layer) => layer.getItemFromDOMElement(e.target))
            if (!sourceLayer) return { "segment": null, "sourceLayer": null }
            let segment = sourceLayer.getItemFromDOMElement(e.target);
            return { "segment": segment, "sourceLayer": sourceLayer }
        }

        const highlightSelectedSegment = (selectedLoss) => {
            if (this.selectedLoss && this.selectedLoss.color) {
                delete this.selectedLoss.color
            }
            this.selectedLoss = selectedLoss
            this.selectedLoss.color = "orange !important"
        }

        const handleSegmentOvering = (eventType, selectedLoss, sourceLayer) => {
            if (eventType == 'mouseover' || eventType == 'mouseout') {
                selectedLoss.opacity = eventType === 'mouseover' ? 1 : 0.8;
                sourceLayer.updateShapes();
            }
        }

        const handleSegmentClick = (selectedLoss, sourceLayer) => {
            highlightSelectedSegment(selectedLoss)

            sourceLayer.updateShapes();
            this.samplesVisualizer.current.fetchSamples(this.audioFiles, this.colors, selectedLoss.start_sample, selectedLoss.num_samples);
            if (this.segmentEventHandler) {
                this.segmentEventHandler.apply(null, [selectedLoss])
            }
        }

        return function (e) {
            let eventType = e.type;

            const { segment, sourceLayer } = findSegmentAndLayerByEvent(e);
            if (!segment || !sourceLayer) {
                if (eventType === 'click') {
                    let minTime = this.timeline.timeToPixel.invert(e.x)
                    let startTime = -this.timeline.offset + minTime
                    this.player.current.audio.current.currentTime = startTime
                }
                return;
            }

            let selectedLoss = sourceLayer.getDatumFromItem(segment);
            console.log("selectedLoss: (x:" + selectedLoss.lossstart + ", width:" + selectedLoss.losswidth + ")")

            if (eventType === 'mouseover' || eventType === 'mouseout') {
                handleSegmentOvering(eventType, selectedLoss, sourceLayer)
            } else if (eventType === 'click') {
                handleSegmentClick(selectedLoss, sourceLayer)
            }
        }.bind(this)
    }

    clearTrack() {
        if (this.waveuiEl) {
            let lastChild = this.waveuiEl.lastElementChild
            if (lastChild) {
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

    clearWaveforms() {
        this.layersMap
            .forEach((layer, file, layersMap) => {
                if (this.waveformTrack && this.waveformTrack.layers) {
                    if (this.waveformTrack.layers.indexOf(layer) != -1) {
                        this.waveformTrack.remove(layer)
                    }
                }
            });
        this.layersMap.clear()
    }

    renderWaveforms(waveformTrackId) {
        //if (!this.state.buffersListReady) return null;
        let $track = this.waveuiEl;
        let width = $track.getBoundingClientRect().width;
        let height = 200;

        this.audioFiles
            .forEach((file, index) => {
                if (this.state.selectedAudioFiles.indexOf(file.uuid) != -1) {
                    if (this.waveformTrack.layers.indexOf(this.layersMap.get(file)) == -1) {
                        if (this.layersMap.get(file)) {
                            this.waveformTrack.add(this.layersMap.get(file))
                        }
                    }
                } else {
                    if (this.waveformTrack.layers.indexOf(this.layersMap.get(file)) != -1) {
                        this.waveformTrack.remove(this.layersMap.get(file))
                    }
                }
            });

        this.waveformTrack.render();
        this.waveformTrack.update();
    }

    renderLossSimulations(waveformTrackId) {
        //if (!this.state.lossSimulationsReady) return null;
        this.lossSimulationFiles.forEach((file, index) => {
            if (this.state.selectedLossSimulations == file.uuid) {
                if (this.waveformTrack.layers.indexOf(this.layersMap.get(file)) == -1)
                    if (this.layersMap.get(file)) {
                        this.waveformTrack.add(this.layersMap.get(file))
                    }
            } else {
                if (this.waveformTrack.layers.indexOf(this.layersMap.get(file)) != -1)
                    this.waveformTrack.remove(this.layersMap.get(file))
            }
        })

        this.waveformTrack.render();
        this.waveformTrack.update();
    }

    renderTrack(waveformTrackId) {
        let $track = this.waveuiEl;
        let width = $track.getBoundingClientRect().width;
        let duration = this.buffersList.length > 0 ? this.buffersList[0].duration : 0;
        let pixelsPerSecond = width / duration;
        let height = 200;

        if (!this.timeline) {
            this.timeline = new wavesUI.core.Timeline(pixelsPerSecond, width);
            //this.timeline.state = new wavesUI.states.BrushZoomState(this.timeline);
            this.timeline.state = new BrushZoomState(this.timeline,
                this.buffersList[0].sampleRate,
                this.downsamplingEnabled ? async (channel, offset, numSamples) => {
                    let waveformsData = await this.fetchWaveforms.bind(this)(channel, offset, numSamples)
                    this.updateWaveforms(channel, waveformsData)
                } : null
            );
            this.timeline.on('event', this.handleSegmentEvent().bind(this));
        }

        if (!this.waveformTrack && this.timeline) {
            this.waveformTrack = this.timeline.createTrack($track, height, this.waveformTrackId);
            this.waveformTrack.render();
        }

        this.lossSimulations
            .filter((lossSimulation, index) => this.layersMap.get(this.lossSimulationFiles[index]) == null)
            .map((lossSimulation, index) => {
                let lossSimulationLayer = new wavesUI.helpers.SegmentLayer(lossSimulation.lost_intervals, {
                    height: 200,
                    displayHandlers: false,
                });
                return lossSimulationLayer
            }).forEach((lossSimulationLayer, index) => {
                this.timeline.addLayer(lossSimulationLayer, this.waveformTrackId);
                this.layersMap.set(this.lossSimulationFiles[index], lossSimulationLayer);
            })

        this.buffersList
            .map((buffer, index) => {
                let waveformLayer = new wavesUI.helpers.WaveformLayer(buffer, {
                    height: 200,
                    color: this.colors[index]
                });
                return waveformLayer
            }).forEach((waveformLayer, index) => {
                if (!this.layersMap.get(this.audioFiles[index])) {
                    this.timeline.addLayer(waveformLayer, this.waveformTrackId);
                    this.layersMap.set(this.audioFiles[index], waveformLayer);
                }
            });


        if (!this.cursorLayer) {
            this.cursorLayer = new wavesUI.helpers.CursorLayer({
                height: height
            });
            this.timeline.addLayer(this.cursorLayer, this.waveformTrackId);
        }
    }

    renderAll(waveformTrackId) {
        this.renderWaveforms(waveformTrackId);
        this.renderLossSimulations(waveformTrackId)
    }

    zoomOut() {
        console.log("zoom out")
        this.zoomedRegion.current = null
        this.timeline.state.zoomOut()
        let onZoomOutHandler = this.audioPlayerOnZoomOut.current
        if (onZoomOutHandler) onZoomOutHandler()
    }

    onKeyDownHandler(event) {
        switch (event.keyCode) {
            case 32:    //SPACE
                this.zoomOut()
                break;
            default:
                break;
        }
    }

    getAudioFileColor(fileId) {
        let file = this.audioFiles.find((f) => f.uuid == fileId)
        let index = this.audioFiles.indexOf(file)
        return index >= 0 ? this.colors[index] : null
    }

    getAudioFileTemplate(option) {
        let _this = this
        return (
            <div className="flex align-items-center">
                <button className="mr-2" onClick={(e) => { e.preventDefault(); e.stopPropagation() }} style={{ width: "20px", height: "20px", backgroundColor: _this.getAudioFileColor(option.uuid) }}></button>
                <div>{option.name}</div>
            </div>
        );
    }

    setWaveformRef(c) {
        if (c) {
            this.waveuiEl = c;
        }
    }

    async slideWaveForm() {
        let currentTime = JSON.parse(JSON.stringify(this.player.current.audio.current.currentTime))
        let duration = this.player.current.audio.current.duration
        let channel = 0

        if (this.buffersList && this.buffersList.length > 0) {
            let sampleRate = this.buffersList[0].sampleRate

            if (currentTime >= duration) {
                this.player.current.audio.current.pause()
                this.player.current.audio.current.currentTime = 0
                currentTime = JSON.parse(JSON.stringify(this.player.current.audio.current.currentTime))
                if (this.zoomedRegion.current) {
                    let numSamples = this.zoomedRegion.current.numSamples
                    this.zoomedRegion.current = {
                        startTime: 0,
                        endTime: numSamples / sampleRate,
                        numSamples: numSamples,
                        sampleRate: sampleRate,
                        waveformsDataOffset: 0
                    }
                    let waveformsData = await this.fetchWaveforms.bind(this)(channel, 0, numSamples)
                    this.timeline.timeContext.offset = -this.zoomedRegion.current.startTime
                    this.updateWaveforms(channel, waveformsData)
                }
                this.setCursorPosition(0)
            }

            console.log("audio.currentTime: " + currentTime)
            console.log("player.listenInterval: " + this.player.current.props.listenInterval)

            if (this.zoomedRegion.current) {
                if (!this.zoomedRegion.current.waveformsData) {
                    let offset = Math.floor(this.zoomedRegion.current.endTime * sampleRate)
                    this.zoomedRegion.current.waveformsData = this.fetchWaveforms.bind(this)(channel, offset, this.zoomedRegion.current.numSamples)
                    this.zoomedRegion.current.waveformsDataOffset = offset
                }
                if ((this.zoomedRegion.current.endTime - this.zoomedRegion.current.startTime) >= 5) {
                    if ((currentTime - this.zoomedRegion.current.startTime) < -0.1 || currentTime >= this.zoomedRegion.current.endTime) {
                        let offset = Math.floor(currentTime * sampleRate)
                        let numSamples = this.zoomedRegion.current.numSamples
                        console.log(`fetching samples ${numSamples} starting from ${offset}`)

                        if (offset > this.zoomedRegion.current.waveformsDataOffset + numSamples || (offset - this.zoomedRegion.current.waveformsDataOffset) < 0.1) {
                            this.zoomedRegion.current.waveformsData = this.fetchWaveforms.bind(this)(channel, offset, numSamples)
                            this.zoomedRegion.current.waveformsDataOffset = offset
                        }
                        let waveformsData = await this.zoomedRegion.current.waveformsData

                        let newZoomRegion = JSON.parse(JSON.stringify(this.zoomedRegion.current))
                        newZoomRegion.startTime = newZoomRegion.waveformsDataOffset / sampleRate
                        newZoomRegion.endTime = (newZoomRegion.waveformsDataOffset / sampleRate) + (numSamples * 1.0 / sampleRate)
                        newZoomRegion.waveformsData = null
                        this.zoomedRegion.current = newZoomRegion

                        console.log(this.zoomedRegion.current)

                        //let waveformsData = await this.fetchWaveforms.bind(this)(channel, offset, numSamples)
                        this.timeline.timeContext.offset = -this.zoomedRegion.current.startTime
                        this.setCursorPosition(this.zoomedRegion.current.startTime)
                        this.updateWaveforms(channel, waveformsData)
                        /**/
                        /*
                        if (this.waveformCanvasRef.current) {
                            let offset = this.waveformCanvasRef.current.state.offset
                            if (offset < currentTime * sampleRate) {
                                this.waveformCanvasRef.current.setInterval(offset + 5 * sampleRate, numSamples, sampleRate)
                            }
                        }
                        */
                    }
                } else {
                    if (this.player.current.audio.current.currentTime >= this.zoomedRegion.current.endTime) {
                        this.player.current.audio.current.pause()
                        this.player.current.audio.current.currentTime = this.zoomedRegion.current.startTime
                        currentTime = this.player.current.audio.current.currentTime
                        this.zoomedRegion.current.waveformsData = null
                    }
                }
            }
        }
        this.setCursorPosition(currentTime)
    }

    showColorPicker() {

    }

    executeWithDelay(myFunction, delay) {
        return new Promise(function (resolve, reject) {
            try {
                setTimeout(() => {
                    try {
                        myFunction()
                        resolve()
                    } catch (e) {
                        reject(e)
                    }
                }, delay)
            } catch (e) {
                reject(e)
            }
        })
    }

    refreshSampleVisualizer() {
        this.samplesVisualizer.current.fetchSamples(this.audioFiles, this.colors, this.selectedLoss.start_sample, this.selectedLoss.num_samples)
    }

    // FIXME - Temporary workaround. Find a way to rerender the nested component when the parent is ready
    onAccordionTabStatusChange(status, tabIndex) {
        let delay = 1000
        switch (status) {
            case 'opened':
                if (tabIndex === 0) {
                    setTimeout(this.renderTrack.bind(this), delay)
                }
                else if (tabIndex === 1) {
                    setTimeout(this.refreshSampleVisualizer.bind(this), delay)
                }
                break
            case 'closed':
                if (tabIndex === 0) {
                    this.clearWaveforms.bind(this)()
                    this.clearTrack.bind(this)()
                }
                break
            default:

        }
    }

    render() {
        const startContent = (
            <React.Fragment>
                <div className="card flex">
                    <SplitButton
                        rounded
                        icon="pi pi-play"
                        tooltip="Play"
                        model={this.getPlayableFilesButtons()}
                        onClick={() => this.playSound.bind(this)(0, 0)}
                        className="mr-2"
                        disabled={false}
                        visible={false} ></SplitButton>
                    <Button
                        rounded
                        id="btn-stop"
                        icon="pi pi-stop"
                        tooltip="Stop"
                        onClick={this.stopSound.bind(this)}
                        className="mr-2"
                        disabled={false}
                        visible={false} ></Button>
                    <Button
                        rounded
                        icon="pi pi-pause"
                        tooltip="Pause"
                        onClick={this.pauseSound.bind(this)}
                        className="mr-2"
                        disabled={false}
                        visible={false} ></Button>
                    <Button
                        rounded
                        icon="pi pi-search-plus"
                        tooltip="Zoom In"
                        tooltipOptions={{ position: 'top' }}
                        className="mr-2"
                        disabled={false}
                        visible={true}  ></Button>
                    <Button
                        rounded
                        icon="pi pi-search-minus"
                        tooltip="Zoom Out"
                        tooltipOptions={{ position: 'top' }}
                        className="mr-2"
                        disabled={false}
                        visible={true}  ></Button>
                    <Button
                        rounded
                        icon="pi pi-arrows-h"
                        tooltip="Play Zoomed"
                        tooltipOptions={{ position: 'top' }}
                        onClick={this.playZoomedInterval.bind(this)}
                        className="mr-2"
                        disabled={false}
                        visible={false} ></Button>
                    <Button
                        rounded
                        icon="pi pi-caret-left"
                        tooltip="Move Left"
                        tooltipOptions={{ position: 'top' }}
                        className="mr-2"
                        disabled={false}
                        visible={true}  ></Button>
                    <Button
                        rounded
                        icon="pi pi-caret-right"
                        tooltip="Move Right"
                        tooltipOptions={{ position: 'top' }}
                        className="mr-2"
                        disabled={false}
                        visible={true}  ></Button>
                    <Button
                        rounded
                        icon="pi pi-step-backward"
                        tooltip="Previous Loss"
                        tooltipOptions={{ position: 'top' }}
                        className="mr-2"
                        disabled={false}
                        visible={true}  ></Button>
                    <Button
                        rounded
                        icon="pi pi-step-forward"
                        tooltip="Next Loss"
                        tooltipOptions={{ position: 'top' }}
                        className="mr-2"
                        disabled={false}
                        visible={true}
                        onClick={() => { this.setPlayerCurrentTime(20) }} ></Button>
                </div>
            </React.Fragment>
        );

        const endContent = (
            <React.Fragment>
            </React.Fragment>
        );

        return (
            <Accordion multiple
                activeIndex={[0, 1, 2]}
                onTabClose={(e) => { this.onAccordionTabStatusChange('closed', e.index) }}
                onTabOpen={(e) => { this.onAccordionTabStatusChange('opened', e.index) }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <AccordionTab header="Waveform">
                    <div className="card flex flex-wrap gap-3 p-fluid mb-6">
                        <div id="pnl-selectedAudioFile" className="flex-auto">
                            <label htmlFor='selectedAudioFile' className="font-bold block ml-2 mb-2" style={{ color: 'white' }}>Audio File</label>
                            <Dropdown inputId='selectedAudioFile'
                                id='selectedAudioFile'
                                value={this.state.filename}
                                onClick={(e) => { false && e.stopPropagation() }}
                                onChange={(e) => { this.setFilename(e.value) }}
                                options={this.inputFiles}
                                disabled={this.state.playing}
                                placeholder="Select audio file"
                                className="w-full md:w-20rem" />
                        </div>
                        <div id="pnl-selectedChannel" className="flex-auto">
                            <label htmlFor='selectedChannel' className="font-bold block ml-2 mb-2" style={{ color: 'white' }}>Channel</label>
                            <Dropdown inputId='selectedChannel'
                                id='selectedChannel'
                                value={this.state.selectedChannel}
                                onClick={(e) => { false && e.stopPropagation() }}
                                onChange={(e) => { this.setSelectedChannel(e.value) }}
                                options={this.state.channels}
                                disabled={this.state.playing}
                                placeholder="Select channel"
                                className="w-full md:w-20rem" />
                        </div>
                        <div id="pnl-displayedLossSimulations" className="flex-auto">
                            <label htmlFor='displayedLossSimulations' className="font-bold block ml-2 mb-2" style={{ color: 'white' }}>Displayed loss simulations</label>
                            <Dropdown inputId='displayedLossSimulations'
                                id='displayedLossSimulations'
                                value={this.state.selectedLossSimulations}
                                onClick={(e) => { false && e.stopPropagation() }}
                                onChange={(e) => { this.setSelectedLossSimulations(e.value) }}
                                options={this.lossSimulationFiles}
                                optionLabel="name"
                                optionValue='uuid'
                                display="chip"
                                disabled={this.state.playing}
                                placeholder="Select loss simulations"
                                className="w-full md:w-20rem" />
                        </div>
                        <div id="pnl-displayedAudioFiles" className="flex-auto">
                            <label htmlFor='displayedAudioFiles' className="font-bold block ml-2 mb-2" style={{ color: 'white' }}>Displayed audio files</label>
                            <MultiSelect inputId='displayedAudioFiles'
                                id='displayedAudioFiles'
                                key='uuid'
                                value={this.state.selectedAudioFiles}
                                onClick={(e) => { false && e.stopPropagation() }}
                                onChange={(e) => { this.setSelectedAudioFiles(e.value) }}
                                options={this.audioFiles}
                                optionLabel="label"
                                optionValue='uuid'
                                display="chip"
                                disabled={this.state.playing}
                                placeholder="Select audio files"
                                maxSelectedLabels={3}
                                className="w-full md:w-20rem"
                                itemTemplate={this.getAudioFileTemplate.bind(this)} />
                        </div>
                        {false && (
                            <Dialog header="Pick a color" visible={true} style={{ width: '500px', height: '500px' }} onHide={() => { }}>
                                <CirclePicker width='500' circleSize={40} circleSpacing={20} colors={this.colors} />
                            </Dialog>
                        )}

                    </div>
                    <div id="runWaveforms"
                        ref={this.setWaveformRef.bind(this)}
                        className="waveform block mb-2 mr-4"
                        style={{ height: "250px" }}>
                        {this.waveuiEl && this.state.lossSimulationsReady && this.state.buffersListReady && this.renderAll(this.waveformTrackId)}
                    </div>
                    {false && (<WaveformCanvas
                        ref={this.waveformCanvasRef}
                        runId={this.state.runId}
                        numSamples={this.buffersList && this.buffersList.length > 0 ? 5 * this.buffersList[0].sampleRate : 0}
                        sampleRate={this.buffersList && this.buffersList.length > 0 ? this.buffersList[0].sampleRate : 44100}>
                    </WaveformCanvas>
                    )}
                    {false && (
                        <Toolbar start={startContent} end={endContent} />
                    )}
                    {/*this.state.buffersListReady && (
                        <AudioPlayer
                            servicesContainer={this.servicesContainer}
                            ref={this.audioPlayerOnZoomOut}
                            runId={this.state.runId}
                            audioFiles={this.audioFiles}
                            buffersList={this.buffersList}
                            timeline={this.getTimeline.bind(this)}
                            cursorLayer={this.getCursorLayer.bind(this)} />

                    )*/}
                    <div>
                        <Tooltip target=".pi-search-plus" />
                        {true && (
                            <ReactH5AudioPlayer
                                ref={this.player}
                                autoPlay={false}
                                autoPlayAfterSrcChange={false}
                                customProgressBarSection={[RHAP_UI.PROGRESS_BAR]}
                                customControlsSection={[RHAP_UI.CURRENT_TIME, RHAP_UI.MAIN_CONTROLS, RHAP_UI.ADDITIONAL_CONTROLS, RHAP_UI.VOLUME_CONTROLS, RHAP_UI.DURATION]}
                                customAdditionalControls={[this.getPlayableFilesCombo(),
                                /*<i className="mr-4 pi pi-search-plus"
                                    data-pr-tooltip="Brush on waveform to zoom-in"></i>,*/
                                <Button
                                    rounded
                                    icon="pi pi-search-plus"
                                    tooltip="Brush on waveform to zoom-in"
                                    tooltipOptions={{ position: 'top' }}
                                    className="mr-2"
                                    visible={true} ></Button>,
                                <Button
                                    onClick={(e) => { this.zoomOut() }}
                                    rounded
                                    icon="pi pi-search-minus"
                                    tooltip="Zoom-out"
                                    tooltipOptions={{ position: 'top' }}
                                    className="mr-2"
                                    disabled={false}
                                    visible={true} ></Button>
                                ]}
                                customVolumeControls={[RHAP_UI.VOLUME]}
                                showSkipControls={true}
                                listenInterval={100}
                                onListen={this.slideWaveForm.bind(this)}
                                onPlay={() => {
                                    this.setPlaying(true)
                                    console.log("Play started")
                                    let selectedFile = this.getAudioFileToPlay()
                                    this.setSelectedAudioFiles(selectedFile ? [selectedFile.uuid] : [])
                                }}
                                onPause={() => {
                                    this.setPlaying(false)
                                    console.log("Play paused")
                                    this.setSelectedAudioFiles(this.audioFiles.map((file, index) => file.uuid))
                                }}
                                width="100%"
                                src={this.getAudioFileToPlayURL()}
                                layout='stacked'
                            />
                        )}
                        {/*<div id="zoomview-container"></div>
                        <div id="overview-container"></div>
                        <audio controls autoplay id="audio" src="http://localhost:3000/Blues_Bass.wav"></audio>*/}
                        {/*<audio src='https://localhost:5000/analysis/runs/40914666118008288/input-files/6058707010551074/output-files/6058707010551074' controls autoPlay={false} />*/}
                    </div>

                </AccordionTab>
                <AccordionTab header="Samples">
                    {this.waveuiEl && this.state.lossSimulationsReady && this.state.buffersListReady && (
                        <SamplesVisualizer
                            servicesContainer={this.servicesContainer}
                            ref={this.samplesVisualizer}
                            runId={this.props.runId} />
                    )}
                </AccordionTab>
                <AccordionTab header="Metrics">
                    {this.state.buffersListReady && (
                        <MetricsVisualizer runId={this.props.runId}
                            colors={this.colors}
                            metricsHandler={this.getMetrics.bind(this)}
                            servicesContainer={this.servicesContainer} ></MetricsVisualizer>
                    )}
                </AccordionTab>
                <AccordionTab header="Spectrogram">
                    <AudioSpectrogram
                        servicesContainer={this.servicesContainer}
                        ref={this.spectrogram}
                        runId={this.state.runId}
                        nodeId={this.hierarchy}
                        filename={this.state.filename}></AudioSpectrogram>
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