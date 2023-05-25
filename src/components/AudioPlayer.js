import React, { useRef, useState } from "react"

import { SplitButton } from "primereact/splitbutton"
import { Button } from "primereact/button"
import { Toolbar } from "primereact/toolbar"

export const AudioPlayer = React.forwardRef((props, ref) => {
    let [playing, setPlaying] = useState(false)
    let [bufferToPlay, setBufferToPlay]  = useState(0)
    const audioFilesRef = useRef(props.audioFiles || [])
    const buffersListRef = useRef(props.buffersList || [])
    const timelineRef = useRef(props.timeline)
    const cursorLayerRef = useRef(props.cursorLayer)
    const audioContextRef = useRef(new AudioContext())
    const audioSourceRef = useRef(null)
    const startTimeRef = useRef(0)
    const cursorAnimationRef = useRef(null)
    const playingZoomedSectionRef = useRef(false)

    const handlePlayingEnd = () => {
        audioSourceRef.current = null
        window.cancelAnimationFrame(cursorAnimationRef.current);
        setPlaying(false)
        playingZoomedSectionRef.current = false
    }

    const giveFocusToStopButton = () => {
        document.getElementById("AudioPlayer:btn-stop").focus()
    }

    const play = (start, duration) => {
        if (playing) return
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
        updateCursor()()
        giveFocusToStopButton()
    }

    const pause = () => {
        if (!playing) return
        if (buffersListRef.current == null || buffersListRef.current.length == 0) return

        audioContextRef.current.suspend()
        window.cancelAnimationFrame(cursorAnimationRef.current);
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

        setCursorPosition(0)
        playingZoomedSectionRef.current = false
        window.cancelAnimationFrame(cursorAnimationRef.current);
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

    const changeBufferToPlay = (index) => {
        stop(true)
        setBufferToPlay(index)
    }

    const getPlayableFilesButtons = () => {
        return audioFilesRef.current.map((file, i) => {
            return { label: file.label, icon: (bufferToPlay == i) ? "pi pi-check" : "", command: () => { changeBufferToPlay(i) } }
        });
    }

    const setCursorPosition = (position) => {
        let cursorLayer = cursorLayerRef.current()
        if (cursorLayer) {
            cursorLayer.currentPosition = position
            console.log("cursor position: " + position)
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
                    rounded
                    icon="pi pi-play"
                    tooltip="Play"
                    model={getPlayableFilesButtons()}
                    onClick={ () => { play() }}
                    className="mr-2"
                    disabled={playing}
                    style={{height: "50px"}}></SplitButton>
                <Button
                    rounded
                    icon="pi pi-pause"
                    tooltip="Pause"
                    onClick={pause}
                    className="mr-2"
                    disabled={!playing}
                    style={{height: "50px"}}></Button>
                <Button
                    rounded
                    icon="pi pi-stop"
                    id="AudioPlayer:btn-stop"
                    tooltip="Stop"
                    onClick={stop}
                    className="mr-2"
                    disabled={!playing}
                    style={{height: "50px"}}></Button>
                <Button
                    rounded
                    icon="pi pi-arrows-h"
                    tooltip="Play Zoomed"
                    onClick={playZoomedInterval}
                    className="mr-2"
                    disabled={playing}
                    style={{height: "50px"}}></Button>
            </React.Fragment>
        )
    }

    return (
        <div id="AudioPlayer">
            <Toolbar start={getButtons} />
        </div>
    )

})