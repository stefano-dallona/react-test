import React, { useRef, useState, useEffect } from "react"

import { SplitButton } from "primereact/splitbutton"
import { Button } from "primereact/button"
import { Toolbar } from "primereact/toolbar"
import { Slider } from "primereact/slider"
import { InputText } from "primereact/inputtext"

import socketClient from 'socket.io-client';
import {
    base64ToArrayBuffer,
    concat,
    appendBuffer,
    withWaveHeader,
    retrieveFileFromLocalStorage,
    storeFileIntoLocalStorage,
} from '../audio/persistence-management'

import WaveformData from "waveform-data"

const crypto = require("crypto-js")
var Peaks = require('peaks.js');
var peaksInstance = null;

export const AudioPlayer = React.forwardRef((props, ref) => {
    let [playing, setPlaying] = useState(false)
    let [audionState, setAudionState] = useState({ startedAt: null, loadingProgress: 0 })
    let [progress, setProgress] = useState(0)
    let [bufferToPlay, setBufferToPlay] = useState((props.audioFiles.length > 0 && props.audioFiles[0].uuid) || "")
    let [volume, setVolume] = useState(0)
    const buffersListRef = useRef(props.buffersList || [])
    const timelineRef = useRef(props.timeline)
    const cursorLayerRef = useRef(props.cursorLayer)
    const audioContextRef = useRef(null)
    const audioSourceRef = useRef(null)
    const audioBufferRef = useRef(null)
    const startTimeRef = useRef(null)
    const durationRef = useRef(0)
    const offsetRef = useRef(0)
    const playWhileLoadingDurationRef = useRef(0)
    const socketRef = useRef(null)
    const updateProgressIntervalRef = useRef(null)
    const loadingMonitorIntervalRef = useRef(null)
    const minBufferInSecs = 0
    const streamIdRef = useRef(null)
    const cursorAnimationRef = useRef(null)
    const playingZoomedSectionRef = useRef(false)
    const secretKey = "1234"
    const wsUrl = props.servicesContainer.baseUrl
    const slidingRef = useRef(false)
    const streamingRef = useRef(false)


    //https://www.kianmusser.com/articles/react-where-put-websocket/
    useEffect(() => {
        socketRef.current = socketClient(wsUrl, {
            transports: ["websocket", "polling"]
            //transports: ["polling", "websocket"]
        });

        return () => {
            socketRef.current.close();
        };
    }, [wsUrl]);

    const getAudioContext = (sampleRate) => {
        if (audioContextRef.current == null) {
            audioContextRef.current = new AudioContext({ sampleRate: sampleRate })
        }
        return audioContextRef.current
    }

    const resetState = () => {
        audioContextRef.current = null
        audioSourceRef.current = null
        audioBufferRef.current = null
        startTimeRef.current = null
        offsetRef.current = 0
        playWhileLoadingDurationRef.current = 0
        streamIdRef.current = null
        playingZoomedSectionRef.current = false
    }

    const handlePlayingEnd = () => {
        console.log('Your audio has finished playing');
        window.cancelAnimationFrame(cursorAnimationRef.current);
        setPlaying(false)
        stopProgressMonitoring()
        setProgress(0)
        playingZoomedSectionRef.current = false

        audioContextRef.current.close()
        audioContextRef.current = null
        audioSourceRef.current.disconnect()
        audioSourceRef.current = null
        audioBufferRef.current = null

        startTimeRef.current = null
        durationRef.current = 0
        offsetRef.current = 0
        playWhileLoadingDurationRef.current = 0
    }

    const giveFocusToStopButton = () => {
        document.getElementById("AudioPlayer:btn-stop").focus()
    }

    const stopProgressMonitoring = () => {
        if (updateProgressIntervalRef.current) {
            clearInterval(updateProgressIntervalRef.current)
            updateProgressIntervalRef.current = null
        }
    }

    const startProgressMonitoring = () => {
        if (!updateProgressIntervalRef.current) {
            updateProgressIntervalRef.current = setInterval(() => {
                const playbackTime = Math.min((Date.now() - startTimeRef.current) / 1000, audioBufferRef.current.duration)
                const progress = playbackTime * 100.0 / durationRef.current
                setProgress(progress)
                if (progress >= 100) {
                    stopProgressMonitoring()
                }
            }, 100)
        }
    }

    const stopLoadingMonitoring = () => {
        if (loadingMonitorIntervalRef.current) {
            clearInterval(loadingMonitorIntervalRef.current)
            loadingMonitorIntervalRef.current = null
        }
    }

    const startLoadingMonitoring = () => {
        if (!loadingMonitorIntervalRef.current) {
            loadingMonitorIntervalRef.current = setInterval(() => {
                if (startTimeRef.current) {
                    const inSec = (Date.now() - startTimeRef.current) / 1000;
                    console.log(`inSec:${inSec}, audioBufferRef.current.duration:${audioBufferRef.current.duration}, playWhileLoadingDuration.current:${playWhileLoadingDurationRef.current}`)
                    if (playWhileLoadingDurationRef.current > 0 && (audioBufferRef.current.duration - playWhileLoadingDurationRef.current) > minBufferInSecs && inSec >= playWhileLoadingDurationRef.current) {
                        playWhileLoading(playWhileLoadingDurationRef.current);
                        playWhileLoadingDurationRef.current = audioBufferRef.current.duration
                    }
                } else {
                    startTimeRef.current = Date.now()
                    playWhileLoadingDurationRef.current = audioBufferRef.current.duration
                    playWhileLoading();
                }
                if (audioBufferRef.current.duration == durationRef.current) {
                    stopLoadingMonitoring()
                }
            }, 100);
        }
    }

    const playWhileLoading = (duration = 0) => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop()
        }
        if (audioContextRef.current == null) {
            audioContextRef.current = getAudioContext()
        }
        audioSourceRef.current = audioContextRef.current.createBufferSource();
        audioSourceRef.current.buffer = audioBufferRef.current;
        audioSourceRef.current.connect(audioContextRef.current.destination);
        audioSourceRef.current.onended = (audioBufferRef.current.duration == durationRef.current) ? handlePlayingEnd : null
        console.log(`playWhileLoading: duration:${duration}`)
        audioSourceRef.current.start(0, duration);
        startProgressMonitoring()
    };

    const play = async (resumeTime = 0, duration = null, buffer, callback = () => { }) => {
        if (audioSourceRef.current) audioSourceRef.current.stop();
        audioSourceRef.current = audioContextRef.current.createBufferSource()

        if (buffer) {
            audioSourceRef.current.buffer = await audioContextRef.current.decodeAudioData(buffer)
            audioBufferRef.current = audioSourceRef.current.buffer
            durationRef.current = audioSourceRef.current.buffer.duration
        } else {
            audioSourceRef.current.buffer = audioBufferRef.current
        }

        audioSourceRef.current.connect(audioContextRef.current.destination);
        audioSourceRef.current.onended = (audioBufferRef.current.duration >= durationRef.current) ? handlePlayingEnd : callback
        startTimeRef.current = (resumeTime == 0) ? Date.now() : startTimeRef.current
        console.log(`play: resumeTime:${resumeTime}`)
        audioSourceRef.current.start(0, resumeTime);
        startProgressMonitoring()
    };

    const startPlaying = () => {
        setProgress(0)
        requestStreaming(bufferToPlay, 0)
        setPlaying(true)
        updateCursor()()
        giveFocusToStopButton()
        console.log("Start completed")
    }

    const onPlayClick = (start = 0, duration) => {
        if (playing) return
        startPlaying()
    }

    const requestStreaming = async (bufferToPlay, progress = 0) => {
        if (streamingRef.current == true) {
            return
        }
        streamingRef.current = true

        console.log("Streaming started")
        let audioAsByte64String = ""
        let cachedFile = null//await retrieveFileFromLocalStorage(bufferToPlay)
        let startTime = buffersListRef.current.find((buffer) => buffer.uuid == bufferToPlay)?.duration * progress / 100.0
        streamingRef.current = true
        if (cachedFile) {
            setAudionState({ loadingProgress: 100 })
            getAudioContext(cachedFile.header.sampleRate)
            let audioBuffer = withWaveHeader(
                base64ToArrayBuffer(cachedFile.data),
                cachedFile.header.channels,
                cachedFile.header.sampleRate,
                cachedFile.header.bitsPerSample
            )
            play(startTime, null, audioBuffer)
        } else {
            socketRef.current.emit('track-play', {
                run_id: props.runId,
                original_file_node_id: bufferToPlay,
                audio_file_node_id: bufferToPlay,
                start_time: startTime,
                stop_time: null,
                authorization: localStorage.getItem("jwt_token")
            });

            // remove listeners to prevent multiple handling of the same event
            socketRef.current.off('track-stream')
            socketRef.current.on('track-stream', async (args) => {

                if (streamIdRef.current == null) {
                    streamIdRef.current = args['stream_id']
                }

                if (streamIdRef.current !== args['stream_id']) {
                    console.log("Received chunk of inactive stream")
                    return
                }

                socketRef.current.emit('track-ack', {
                    chunk_num: args['chunk_num']
                });

                getAudioContext(args['sample_rate'])

                audioAsByte64String += args['chunk']

                let audioBufferChunk = await audioContextRef.current.decodeAudioData(
                    withWaveHeader(
                        base64ToArrayBuffer(args['chunk']),
                        args['channels'],
                        args['sample_rate'],
                        args['bits_per_sample']
                    )
                );

                console.log(`BEFORE APPEND: audioBufferRef.current.duration:${audioBufferRef.current ? audioBufferRef.current.duration : 0}, stream_id: ${args['stream_id']}, chunk: ${args['chunk_num']}, audioBufferChunk.duration: ${audioBufferChunk.duration}`)
                audioBufferRef.current = (audioBufferRef.current)
                    ? appendBuffer(audioBufferRef.current, audioBufferChunk, audioContextRef.current)
                    : audioBufferChunk;
                console.log(`AFTER APPEND: audioBufferRef.current.duration:${audioBufferRef.current.duration}, audioBufferChunk.duration: ${audioBufferChunk.duration}`)

                let loadRate = audioBufferRef.current.length * 100.0 / args['n_frames']
                durationRef.current = args['n_frames'] * 1.0 / args['sample_rate']
                console.log(`loadRate:${loadRate}`)
                setAudionState({ loadingProgress: loadRate })

                startLoadingMonitoring()

                if (args['last_chunk']) {
                    stopLoadingMonitoring()
                    playWhileLoadingDurationRef.current = Math.ceil(audioBufferRef.current.duration)
                    const inSec = (Date.now() - startTimeRef.current) / 1000;
                    play(inSec, null, null, handlePlayingEnd);


                    WaveformData.createFromAudio({
                        audio_buffer: audioBufferRef.current,
                        scale: Math.ceil(args['n_frames'] / 1400),
                        amplitude_scale: 1.0,
                        disable_worker: false
                    }, (err, waveform) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        console.log(`Waveform has ${waveform.channels} channels`);
                        console.log(`Waveform has length ${waveform.length} points`);
                        console.log(`Waveform min_array: ${waveform.channel(0).min_array()}`);
                        console.log(`Waveform max_array: ${waveform.channel(0).max_array()}`);
                        console.log(`Waveform min: ${Math.min(...waveform.channel(0).min_array())}`);
                        console.log(`Waveform max: ${Math.max(...waveform.channel(0).max_array())}`);

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

                        if (peaksInstance) peaksInstance.destroy()
                        Peaks.default.init(options, function (err, peaks) {
                            if (err) {
                                console.error('Failed to initialize Peaks instance: ' + err.message);
                                return;
                            }

                            // Do something when the waveform is displayed and ready
                            peaksInstance = peaks
                            console.log('Peaks has been initialized successfully.')
                        })
                    })
                    /**/
                    //storeFileIntoLocalStorage(bufferToPlay, args, audioAsByte64String)
                }
            });

            // remove listeners to prevent multiple handling of the same event
            socketRef.current.off('track-stream-stopped')
            socketRef.current.on('track-stream-stopped', () => {
                stopLoadingMonitoring()
            })
        }
    }

    const cancelStreaming = () => {
        // disable listener to discard on-flight events
        socketRef.current.off('track-stream')
        setAudionState({ loadingProgress: 0 })
        // stop streaming on server side
        if (streamIdRef.current) {
            console.log(`Streaming ${streamIdRef.current} cancelled`)
            socketRef.current.emit('track-stop', {
                stream_id: streamIdRef.current
            });
            streamIdRef.current = null
        }
        stopLoadingMonitoring()
        streamingRef.current = false
    }

    const pause = () => {
        if (!playing) return
        if (buffersListRef.current == null || buffersListRef.current.length == 0) return

        audioContextRef.current.suspend()
        window.cancelAnimationFrame(cursorAnimationRef.current);
        stopProgressMonitoring()
        setPlaying(false)
        giveFocusToStopButton()
    }

    const onZoomOut = (force) => {
        if (playingZoomedSectionRef.current || force) {
            stop(true)
        }
    }

    ref.current = onZoomOut

    const stop = (force = false) => {
        if (!playing && !force) return
        if (buffersListRef.current == null || buffersListRef.current.length == 0) return

        if (audioSourceRef.current) {
            audioSourceRef.current.stop()
            audioSourceRef.current.disconnect(audioContextRef.current.destination)
            audioSourceRef.current.onended = null
            audioSourceRef.current = null
            audioBufferRef.current = null
            audioContextRef.current.suspend()
        }

        audioContextRef.current = null

        cancelStreaming()
        setCursorPosition(0)
        startTimeRef.current = null
        playWhileLoadingDurationRef.current = null
        playingZoomedSectionRef.current = false
        window.cancelAnimationFrame(cursorAnimationRef.current);
        stopProgressMonitoring()
        setPlaying(false)
        setProgress(0)

        resetState()

        //giveFocusToStopButton()
        console.log("Stop completed")
    }

    const playZoomedInterval = () => {
        if (playing) return
        if (buffersListRef.current == null || buffersListRef.current.length == 0) return

        let timeline = timelineRef.current()
        let start = Math.floor(-timeline.timeContext.offset)
        let duration = Math.ceil(timeline.timeContext.visibleDuration)
        if (Math.abs(start) == 0 && duration == Math.ceil(buffersListRef.current[bufferToPlay].duration)) {
            return
        }

        stop(true)
        play(start, duration)
        giveFocusToStopButton()
    }

    const changeBufferToPlay = (nodeId) => {
        stop(true)
        setBufferToPlay(nodeId)
    }

    const getPlayableFilesButtons = () => {
        return props.audioFiles.map((file, i) => {
            return { label: file.label, icon: (bufferToPlay == file.uuid) ? "pi pi-check" : "", command: () => { changeBufferToPlay(file.uuid) } }
        });
    }

    const setCursorPosition = (position) => {
        let cursorLayer = cursorLayerRef.current()
        if (cursorLayer) {
            cursorLayer.currentPosition = position
            //console.log("cursor position: " + position)
            cursorLayer.update();
        }
    }

    const updateCursor = () => {
        return function loop() {
            if (audioContextRef.current && durationRef.current) {
                const playbackTime = Math.min((Date.now() - startTimeRef.current) / 1000, audioBufferRef.current)
                setCursorPosition(playbackTime)
            }
            cursorAnimationRef.current = window.requestAnimationFrame(loop);
        };
    }

    const sliderMouseDownHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.buttons == 1) {
            console.log("MouseDown, e.buttons:" + e.buttons)

            slidingRef.current = true
            //setTimeout(stop, 0)
            stop()
            /**/
            document.addEventListener('mouseup', sliderMouseUpHandler, { once: true })
        }
    }

    const sliderMouseUpHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.buttons == 0) {
            console.log("MouseUp, e.buttons:" + e.buttons)

            //setTimeout(startPlaying, 0)
            startPlaying()
            slidingRef.current = false
            /**/
        }
    }

    const sliderChangeValueHandler = (e) => {
        if (slidingRef.current) {
            setProgress(e.value)
            console.log("setting progress from slidebar onChange to " + e.value)
        }
    }

    const getStartButtons = () => {
        return (
            <React.Fragment>
                <InputText
                    value={durationRef.current ? (durationRef.current * progress / 100.0).toFixed(2) : ""}
                    className="mr-2"
                    style={{ width: "100px" }}></InputText>
                <SplitButton
                    rounded
                    icon="pi pi-play"
                    tooltip="Play"
                    tooltipOptions={{ position: 'top' }}
                    model={getPlayableFilesButtons()}
                    onClick={onPlayClick}
                    className="mr-2"
                    disabled={playing}
                    style={{ height: "50px", display: playing ? "none" : "" }}></SplitButton>
                <SplitButton
                    rounded
                    icon="pi pi-pause"
                    tooltip="Pause"
                    tooltipOptions={{ position: 'top' }}
                    model={getPlayableFilesButtons()}
                    onClick={pause}
                    className="mr-2"
                    disabled={!playing}
                    style={{ height: "50px", display: playing ? "" : "none" }}></SplitButton>
                <Button
                    rounded
                    icon="pi pi-stop"
                    id="AudioPlayer:btn-stop"
                    tooltip="Stop"
                    tooltipOptions={{ position: 'top' }}
                    onClick={stop}
                    className="mr-2"
                    disabled={!playing}
                    style={{ height: "50px", display: "yes" }}></Button>
                <Button
                    rounded
                    icon="pi pi-arrows-h"
                    tooltip="Play Zoomed"
                    tooltipOptions={{ position: 'top' }}
                    onClick={playZoomedInterval}
                    className="mr-8"
                    disabled={playing}
                    style={{ height: "50px", display: "none" }}></Button>
                <Button
                    rounded
                    tooltip="Volume"
                    tooltipOptions={{ position: 'top' }}
                    style={{ height: "50px", width: "200px" }}>
                    <i className="pi pi-volume-down mr-4" style={{ fontSize: "1.0rem" }}></i>
                    <Slider value={volume} onChange={(e) => setVolume(e.value)} className="" min={0} max={100} style={{ width: "100%" }}></Slider>
                    <i className="pi pi-volume-up ml-4" style={{ fontSize: "1.2rem" }}></i>
                </Button>
            </React.Fragment>
        )
    }

    const getEndButtons = () => {
        return (
            <React.Fragment>
                <InputText
                    value={durationRef.current ? (durationRef.current * (100 - progress) / 100.0).toFixed(2) : ""}
                    className="mr-2"
                    style={{ width: "100px", textAlign: "right" }}></InputText>
            </React.Fragment>
        )
    }

    return (
        <div id="AudioPlayer">
            <Slider value={progress}
                onMouseDown={sliderMouseDownHandler}
                onClick={(e) => console.log("progress:" + progress)}
                onChange={sliderChangeValueHandler}
                className=""
                min={0}
                max={100}
                step={0.01}
                style={{ width: "100%" }}></Slider>
            <div className="p-slider p-component mb-4 mt-4 p-slider-horizontal">
                <span className="p-slider-range" style={{ width: audionState.loadingProgress + "%", backgroundColor: "orange" }}></span>
                <span className="p-slider-range" style={{ width: progress + "%" }}></span>
                <span className="p-slider-handle"
                    tabIndex="0" role="slider"
                    aria-valuemin="0" aria-valuemax="100"
                    aria-orientation="horizontal"
                    onChange={(e) => console.log("position" + e.value)}
                    style={{ left: progress + "%" }}></span>
            </div>
            <Toolbar start={getStartButtons} end={getEndButtons} />
            <div id="zoomview-container"></div>
            <div id="overview-container"></div>
            <audio controls autoplay id="audio" src="http://localhost:3000/Blues_Bass.wav"></audio>
        </div>
    )

})