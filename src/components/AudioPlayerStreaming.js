import React, { useRef, useState, useEffect } from "react"

import { SplitButton } from "primereact/splitbutton"
import { Button } from "primereact/button"
import { Toolbar } from "primereact/toolbar"
import { Slider } from "primereact/slider"

import socketClient from 'socket.io-client';
import { base64ToArrayBuffer,
         concat,
         appendBuffer,
         withWaveHeader,
         retrieveFileFromLocalStorage,
         storeFileIntoLocalStorage,
         } from '../audio/persistence-management'

const crypto = require("crypto-js")

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


    //https://www.kianmusser.com/articles/react-where-put-websocket/
    useEffect(() => {
        socketRef.current = socketClient(wsUrl, {
            transports: ["websocket", "polling"]
            //transports: ["polling", "websocket"]
        });

        return () => {
            socketRef.current.close();
        };
    }, []);

    const getAudioContext = (sampleRate) => {
        if (audioContextRef.current == null) {
            audioContextRef.current = new AudioContext({ sampleRate: sampleRate })
        }
        return audioContextRef.current
    }

    const handlePlayingEnd = () => {
        console.log('Your audio has finished playing');
        window.cancelAnimationFrame(cursorAnimationRef.current);
        setPlaying(false)
        stopProgressMonitoring()
        playingZoomedSectionRef.current = false

        audioContextRef.current.close()
        audioContextRef.current = null
        audioSourceRef.current.disconnect()
        audioSourceRef.current = null
        audioBufferRef.current = null
        startTimeRef.current = null
        durationRef.current = 0
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
        if (audioSourceRef.current) audioSourceRef.current.stop()
        audioSourceRef.current = audioContextRef.current.createBufferSource();
        audioSourceRef.current.buffer = audioBufferRef.current;
        audioSourceRef.current.connect(audioContextRef.current.destination);
        audioSourceRef.current.onended = (audioBufferRef.current.duration == durationRef.current) ? handlePlayingEnd : null
        audioSourceRef.current.start(0, duration);
        startProgressMonitoring()
    };

    const play = async (resumeTime = 0, duration = null, buffer) => {
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
        audioSourceRef.current.onended = (audioBufferRef.current.duration == durationRef.current) ? handlePlayingEnd : null
        startTimeRef.current = (resumeTime == 0) ? Date.now() : startTimeRef.current
        audioSourceRef.current.start(0, resumeTime);
        startProgressMonitoring()
    };

    const onPlayClick = (start, duration) => {
        if (playing) return
        requestStreaming()
        setPlaying(true)
        setProgress(0)
        updateCursor()()
        giveFocusToStopButton()
    }

    const requestStreaming = async (track) => {

        let audioAsByte64String = ""
        let cachedFile = await retrieveFileFromLocalStorage(bufferToPlay)

        if (cachedFile) {
            setAudionState({ loadingProgress: 100 })
            getAudioContext(cachedFile.header.sampleRate)
            let audioBuffer = withWaveHeader(
                base64ToArrayBuffer(cachedFile.data),
                cachedFile.header.channels,
                cachedFile.header.sampleRate,
                cachedFile.header.bitsPerSample
            )
            play(0, null, audioBuffer)
        } else {
            socketRef.current.emit('track-play', {
                run_id: props.runId,
                original_file_node_id: bufferToPlay,
                audio_file_node_id: bufferToPlay,
                start_time: 0,
                stop_time: null,
                authorization: localStorage.getItem("jwt_token")
            });

            socketRef.current.on('track-stream', async (args) => {

                streamIdRef.current = args['stream_id']

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

                audioBufferRef.current = (audioBufferRef.current)
                    ? appendBuffer(audioBufferRef.current, audioBufferChunk, audioContextRef.current)
                    : audioBufferChunk;

                let loadRate = audioBufferRef.current.length * 100.0 / args['n_frames']
                durationRef.current = args['n_frames'] * 1.0 / args['sample_rate']
                console.log(`loadRate:${loadRate}`)
                setAudionState({ loadingProgress: loadRate })

                startLoadingMonitoring()

                if (args['last_chunk']) {
                    stopLoadingMonitoring()
                    playWhileLoadingDurationRef.current = Math.ceil(audioBufferRef.current.duration)
                    const inSec = (Date.now() - startTimeRef.current) / 1000;
                    play(inSec);

                    storeFileIntoLocalStorage(bufferToPlay, args, audioAsByte64String)
                }
            });

            socketRef.current.on('track-stream-stopped', () => {
                stopLoadingMonitoring()
            })
        }
    }

    const cancelStreaming = () => {
        if (streamIdRef.current) {
            socketRef.current.emit('track-stop', {
                stream_id: streamIdRef.current
            });
        }
        stopLoadingMonitoring()
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
            audioContextRef.current.suspend()
        }

        cancelStreaming()
        setCursorPosition(0)
        playingZoomedSectionRef.current = false
        window.cancelAnimationFrame(cursorAnimationRef.current);
        stopProgressMonitoring()
        setPlaying(false)
        giveFocusToStopButton()
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
                const playbackTime = Math.min((Date.now() - startTimeRef.current) / 1000, audioBufferRef.current.duration)
                setCursorPosition(playbackTime)
            }
            cursorAnimationRef.current = window.requestAnimationFrame(loop);
        };
    }

    const getButtons = () => {
        return (
            <React.Fragment>
                <SplitButton
                    rounded
                    icon="pi pi-play"
                    tooltip="Play"
                    tooltipOptions={{ position: 'top' }}
                    model={getPlayableFilesButtons()}
                    onClick={onPlayClick}
                    className="mr-2"
                    disabled={playing}
                    style={{ height: "50px" }}></SplitButton>
                <Button
                    rounded
                    icon="pi pi-pause"
                    tooltip="Pause"
                    tooltipOptions={{ position: 'top' }}
                    onClick={pause}
                    className="mr-2"
                    disabled={!playing}
                    style={{ height: "50px", display: "none" }}></Button>
                <Button
                    rounded
                    icon="pi pi-stop"
                    id="AudioPlayer:btn-stop"
                    tooltip="Stop"
                    tooltipOptions={{ position: 'top' }}
                    onClick={stop}
                    className="mr-2"
                    disabled={!playing}
                    style={{ height: "50px", display: "none" }}></Button>
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
                    style={{ height: "50px", width: "200px"}}>
                    <i className="pi pi-volume-down mr-4" style={{ fontSize: "1.0rem" }}></i>
                    <Slider value={volume} onChange={(e) => setVolume(e.value)} className="" min={0} max={100} style={{ width: "100%" }}></Slider>
                    <i className="pi pi-volume-up ml-4" style={{ fontSize: "1.2rem" }}></i>
                </Button>

            </React.Fragment>
        )
    }

    return (
        <div id="AudioPlayer">
            <div className="p-slider p-component mb-4 mt-4 p-slider-horizontal">
                <span className="p-slider-range" style={{ width: audionState.loadingProgress + "%", backgroundColor: "orange" }}></span>
                <span className="p-slider-range" style={{ width: progress + "%" }}></span>
                <span className="p-slider-handle" tabIndex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-orientation="horizontal" style={{ left: progress + "%" }}></span>
            </div>
            <Toolbar start={getButtons} />
        </div>
    )

})