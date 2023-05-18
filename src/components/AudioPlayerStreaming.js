import React, { useRef, useState, useEffect } from "react"

import { SplitButton } from "primereact/splitbutton"
import { Button } from "primereact/button"
import { Toolbar } from "primereact/toolbar"
import { Slider } from "primereact/slider"

import socketClient from 'socket.io-client';

export const AudioPlayer = React.forwardRef((props, ref) => {
    let [playing, setPlaying] = useState(false)
    let [audionState, setAudionState] = useState({ startedAt: null, loadingProgress: 0 })
    let [progress, setProgress] = useState(0)
    let [bufferToPlay, setBufferToPlay] = useState(props.audioFiles && props.audioFiles[0].uuid || "")
    const audioFilesRef = useRef(props.audioFiles || [])
    const buffersListRef = useRef(props.buffersList || [])
    const timelineRef = useRef(props.timeline)
    const cursorLayerRef = useRef(props.cursorLayer)
    const audioContextRef = useRef(null)
    const audioSourceRef = useRef(null)
    const audioBufferRef = useRef(null)
    const startTimeRef = useRef(0)
    const durationRef = useRef(0)
    const playWhileLoadingDurationRef = useRef(0)
    const socketRef = useRef(null)
    const updateProgressIntervalRef = useRef(null)
    const loadingMonitorIntervalRef = useRef(null)
    const minBufferInSecs = 5
    const streamIdRef = useRef(null)
    const cursorAnimationRef = useRef(null)
    const playingZoomedSectionRef = useRef(false)


    //https://www.kianmusser.com/articles/react-where-put-websocket/
    useEffect(() => {
        socketRef.current = socketClient(props.wsUrl || "http://localhost:5000", {
            transports: ["websocket"]//, "polling"]
        });

        return () => {
            socketRef.current.close();
        };
    }, []);

    const handlePlayingEnd = () => {
        console.log('Your audio has finished playing');
        audioSourceRef.current = null
        window.cancelAnimationFrame(cursorAnimationRef.current);
        setPlaying(false)
        playingZoomedSectionRef.current = false
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
                const playbackTime = (Date.now() - startTimeRef.current) / 1000;
                const progress = playbackTime * 100.0 / durationRef.current;
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
                    const loadRate = audionState.loadingProgress
                    console.log(`loadRate:${loadRate}, inSec:${inSec}, audioBufferRef.current.duration:${audioBufferRef.current.duration}, playWhileLoadingDuration.current:${playWhileLoadingDurationRef.current}`)
                    if (playWhileLoadingDurationRef.current && (audioBufferRef.current.duration - playWhileLoadingDurationRef.current) > minBufferInSecs.current && inSec >= playWhileLoadingDurationRef.current) {
                        playWhileLoading(playWhileLoadingDurationRef.current);
                    }
                } else {
                    startTimeRef.current = Date.now()
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
        audioSourceRef.current.onended = (audioBufferRef.current.duration == duration) ? handlePlayingEnd : null
        playWhileLoadingDurationRef.current = audioBufferRef.current.duration
        audioSourceRef.current.start(0, duration);
        startProgressMonitoring()
    };

    const play = (resumeTime = 0) => {
        if (audioSourceRef.current) audioSourceRef.current.stop();
        audioSourceRef.current = audioContextRef.current.createBufferSource();
        audioSourceRef.current.buffer = audioBufferRef.current;
        audioSourceRef.current.connect(audioContextRef.current.destination);
        audioSourceRef.current.onended = (audioBufferRef.current.duration == durationRef.current) ? handlePlayingEnd : null
        startTimeRef.current = (resumeTime == 0) ? Date.now() : startTimeRef.current
        audioSourceRef.current.start(0, resumeTime);
        startProgressMonitoring()
    };

    const onPlayClick = (start, duration) => {
        if (playing) return
        /*
        if (buffersListRef.current == null || buffersListRef.current.length == 0) return

        audioContextRef.current.resume()

        if (audioSourceRef.current == null) {
            audioSourceRef.current = audioContextRef.current.createBufferSource()
            audioSourceRef.current.buffer = buffersListRef.current[bufferToPlay];
            audioSourceRef.current.connect(audioContextRef.current.destination);
            audioSourceRef.current.onended = handlePlayingEnd
            audioSourceRef.current.start(0, start ? start : 0, duration ? duration : buffersListRef.current[bufferToPlay].duration)
            startTimeRef.current = audioContextRef.current.currentTime
            playingZoomedSectionRef.current = start ? true : false
        }

        setPlaying(true)
        giveFocusToStopButton()
        */
        if (audioSourceRef.current && audioSourceRef.current.buffer) {
            play()
        } else {
            requestStreaming()
        }
        setPlaying(true)
        setProgress(0)
        //updateCursor()()
        giveFocusToStopButton()
    }

    const requestStreaming = (track) => {

        function base64ToArrayBuffer(base64) {
            //var binary_string = window.atob(base64.replace("b'", "").replace("'", ""));
            var binary_string = window.atob(base64);
            var len = binary_string.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        }

        const concat = (buffer1, buffer2) => {
            const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

            tmp.set(new Uint8Array(buffer1), 0);
            tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

            return tmp.buffer;
        };

        const appendBuffer = (buffer1, buffer2, context) => {
            const numberOfChannels = Math.min(buffer1.numberOfChannels, buffer2.numberOfChannels);
            const tmp = context.createBuffer(numberOfChannels, (buffer1.length + buffer2.length), buffer1.sampleRate);
            for (let i = 0; i < numberOfChannels; i++) {
                const channel = tmp.getChannelData(i);
                channel.set(buffer1.getChannelData(i), 0);
                channel.set(buffer2.getChannelData(i), buffer1.length);
            }
            return tmp;
        };

        const withWaveHeader = (data, numberOfChannels, sampleRate, bitsPerSample = 16) => {
            const header = new ArrayBuffer(44);

            const d = new DataView(header);

            d.setUint8(0, "R".charCodeAt(0));
            d.setUint8(1, "I".charCodeAt(0));
            d.setUint8(2, "F".charCodeAt(0));
            d.setUint8(3, "F".charCodeAt(0));

            d.setUint32(4, data.byteLength / 2 + 44, true);

            d.setUint8(8, "W".charCodeAt(0));
            d.setUint8(9, "A".charCodeAt(0));
            d.setUint8(10, "V".charCodeAt(0));
            d.setUint8(11, "E".charCodeAt(0));
            d.setUint8(12, "f".charCodeAt(0));
            d.setUint8(13, "m".charCodeAt(0));
            d.setUint8(14, "t".charCodeAt(0));
            d.setUint8(15, " ".charCodeAt(0));

            d.setUint32(16, 16, true);
            d.setUint16(20, 1, true);
            d.setUint16(22, numberOfChannels, true);
            d.setUint32(24, sampleRate, true);
            d.setUint32(28, sampleRate * numberOfChannels * (bitsPerSample / 8));
            d.setUint16(32, numberOfChannels * (bitsPerSample / 8));
            d.setUint16(34, bitsPerSample, true);

            d.setUint8(36, "d".charCodeAt(0));
            d.setUint8(37, "a".charCodeAt(0));
            d.setUint8(38, "t".charCodeAt(0));
            d.setUint8(39, "a".charCodeAt(0));
            d.setUint32(40, data.byteLength, true);

            return concat(header, data);
        };

        socketRef.current.emit('track-play', {
            run_id: props.runId,
            original_file_node_id: bufferToPlay,
            audio_file_node_id: bufferToPlay,
            start_time: 0,
            stop_time: null
        });

        socketRef.current.on('track-stream', async (args) => {

            streamIdRef.current = args['stream_id']

            socketRef.current.emit('track-ack', {
                chunk_num: args['chunk_num']
            });

            if (audioContextRef.current == null) {
                audioContextRef.current = new AudioContext({ sampleRate: args['sample_rate'] })
            }

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
            }
        });

        socketRef.current.on('track-stream-stopped', () => {
            stopLoadingMonitoring()
        })
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
        return audioFilesRef.current.map((file, i) => {
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
            let timeline = timelineRef.current()
            let offset = (playingZoomedSectionRef.current ? -timeline.timeContext.offset : 0) + (audioContextRef.current.currentTime - startTimeRef.current)
            let position = offset < buffersListRef.current[bufferToPlay].duration ? offset : 0
            setCursorPosition(position)
            cursorAnimationRef.current = window.requestAnimationFrame(loop);
        };
    }

    const getButtons = () => {
        return (
            <React.Fragment>
                <SplitButton
                    icon="pi pi-play"
                    label="Play"
                    model={getPlayableFilesButtons()}
                    onClick={onPlayClick}
                    className="mr-2"
                    disabled={playing}
                    style={{ height: "50px" }}></SplitButton>
                <Button
                    icon="pi pi-pause"
                    label="Pause"
                    onClick={pause}
                    className="mr-2"
                    disabled={!playing}
                    style={{ height: "50px" }}></Button>
                <Button
                    icon="pi pi-stop"
                    id="AudioPlayer:btn-stop"
                    label="Stop"
                    onClick={stop}
                    className="mr-2"
                    disabled={!playing}
                    style={{ height: "50px" }}></Button>
                <Button
                    icon="pi pi-arrows-h"
                    label="Play Zoomed"
                    onClick={playZoomedInterval}
                    className="mr-2"
                    disabled={playing}
                    style={{ height: "50px" }}></Button>
            </React.Fragment>
        )
    }

    return (
        <div id="AudioPlayer">
            <div class="p-slider p-component mb-4 p-slider-horizontal">
                <span class="p-slider-range" style={{width: audionState.loadingProgress + "%", backgroundColor: "orange"}}></span>
                <span class="p-slider-range" style={{width: progress + "%"}}></span>
                <span class="p-slider-handle" tabIndex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-orientation="horizontal" style={{left: progress + "%"}}></span>
            </div>
            <Toolbar start={getButtons} />
        </div>
    )

})