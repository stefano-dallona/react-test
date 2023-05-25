import React, { useRef, useState, useEffect } from "react"

import { SplitButton } from "primereact/splitbutton"
import { Button } from "primereact/button"
import { Toolbar } from "primereact/toolbar"
import { Slider } from "primereact/slider"

import socketClient from 'socket.io-client';

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


    //https://www.kianmusser.com/articles/react-where-put-websocket/
    useEffect(() => {
        socketRef.current = socketClient(props.wsUrl || "http://localhost:5000", {
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

    function detectBrowser() {

        let userAgent = navigator.userAgent;
        let browserName;

        if (userAgent.match(/chrome|chromium|crios/i)) {
            browserName = "chrome";
        } else if (userAgent.match(/firefox|fxios/i)) {
            browserName = "firefox";
        } else if (userAgent.match(/safari/i)) {
            browserName = "safari";
        } else if (userAgent.match(/opr\//i)) {
            browserName = "opera";
        } else if (userAgent.match(/edg/i)) {
            browserName = "edge";
        } else {
            browserName = "No browser detection";
        }
        return browserName
    }

    const retrieveFileFromLocalStorage = (uuid) => {
        return new Promise(function (resolve, reject) {
            let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
            let open = indexedDB.open("PlC_TestBench_UI_" + detectBrowser());

            open.onsuccess = function () {
                // Start a new transaction
                let db = open.result;
                if (!db.objectStoreNames.contains("audio_files")) {
                    resolve(null);
                    return
                }
                let tx = db.transaction("audio_files", "readwrite");
                let store = tx.objectStore("audio_files");

                let persistedAudioFile = store.get(uuid);

                persistedAudioFile.onsuccess = function () {
                    resolve(persistedAudioFile.result);
                };

                tx.oncomplete = function () {
                    db.close();
                };
            }
        })
    }

    const storeFileIntoLocalStorage = (uuid, header, buffer) => {
        let audioFile = {
            uuid: uuid,
            header: {
                channels: header['channels'],
                sampleRate: header['sample_rate'],
                bitsPerSample: header['bits_per_sample']
            },
            data: buffer
        }

        let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
        let request1 = indexedDB.open("PlC_TestBench_UI_" + detectBrowser());
        let version = 1
        request1.onsuccess = function (e) {
            let db = e.target.result;
            version = db.version;
            db.close();
        }
        let request2 = indexedDB.open("PlC_TestBench_UI_" + detectBrowser(), ++version);
        request2.onerror = function () { console.log("error"); };
        request2.onblocked = function () { console.log("blocked"); };
        request2.onupgradeneeded = function (e) {
            let db = e.target.result;
            if (!db.objectStoreNames.contains("audio_files")) {
                let store = db.createObjectStore("audio_files", { keyPath: "uuid" });
            }
        };
        request2.onsuccess = function (e) {
            // Start a new transaction
            let db = e.target.result;
            let tx = db.transaction("audio_files", "readwrite");
            let store = tx.objectStore("audio_files");
            store.put(audioFile);

            tx.oncomplete = function () {
                db.close();
            };
        };
    }

    const requestStreaming = async (track) => {

        let audioAsByte64String = ""

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
                stop_time: null
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
            <div className="p-slider p-component mb-4 p-slider-horizontal">
                <span className="p-slider-range" style={{ width: audionState.loadingProgress + "%", backgroundColor: "orange" }}></span>
                <span className="p-slider-range" style={{ width: progress + "%" }}></span>
                <span className="p-slider-handle" tabIndex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-orientation="horizontal" style={{ left: progress + "%" }}></span>
            </div>
            <Toolbar start={getButtons} />
        </div>
    )

})