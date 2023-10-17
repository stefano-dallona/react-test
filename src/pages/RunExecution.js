import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { useEffect, useRef, useState } from 'react';

import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';

import RunHierarchy from '../components/RunHierarchy';
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { Toast } from 'primereact/toast'

import { useContainer } from "../components/ServicesContextProvider"
import { Tooltip } from "primereact/tooltip";

import brain_icon from "../assets/icons/brain-electricity.svg"

export const RunExecution = (props) => {
    let navigate = useNavigate()
    let { runId } = useParams()
    let runHierarchy = useRef()
    let toast = useRef()
    let [executionInProgress, setExecutionInProgress] = useState(false)
    let servicesContainer = useContainer()
    let [currentFileIndex, setCurrentFileIndex] = useState(0)
    let [runStatus, setRunStatus] = useState(0)

    useEffect(() => {
    }, [])

    const analyse = () => {
        navigate(`/run/${runId}/analysis`)
    }

    const addToPendingElaborations = (runId) => {
        let pendingElaborations = localStorage.getItem("pendingElaborations") ? JSON.parse(localStorage.getItem("pendingElaborations")) : []
        pendingElaborations.push(runId)
        localStorage.setItem("pendingElaborations", JSON.stringify(pendingElaborations))
    }

    const execute = () => {
        setExecutionInProgress(true)
        addToPendingElaborations(runId)
        runHierarchy.current.setFilename("", 0, () => {
            let task_id = servicesContainer.configurationService.create_UUID()
            localStorage.setItem("runExecution:" + runId, task_id)
            runHierarchy.current.startListeningForExecutionEvents(task_id)
            servicesContainer.configurationService.launchRunExecution(runId, task_id)
        })
    }

    const showMessage = (severity, summary, detail) => {
        toast.current.show({ severity: severity, summary: summary, detail: detail });
    }

    const onRunLoaded = (run) => {
        setRunStatus(run.status)
    }

    const onExecutionCompleted = async (runId, task_id, success, errorMessage) => {
        setExecutionInProgress(false)
        runHierarchy.current.resetProgressBars(100, true)
        localStorage.removeItem("runExecution:" + runId)
        setRunStatus(success ? 'COMPLETED' : "FAILED")
        let ok = success === 'true'
        showMessage(ok ? 'info' : 'error', ok ? `Execution completed successfully` : `Execution failed! ${errorMessage}`, '')
    }

    const previousTrack = () => {
        console.log("previousTrack")
        if (runHierarchy.current) {
            let inputFiles = runHierarchy.current.run.selected_input_files
            let previousIndex = Math.max(0, currentFileIndex - 1)
            if (previousIndex !== currentFileIndex) {
                let newFilename = inputFiles[previousIndex]
                setCurrentFileIndex(previousIndex)
                let percentage = runHierarchy.current.state.data[0].status === "COMPLETED" ? 100 : 0
                runHierarchy.current.setFilename(newFilename, percentage)
            }
        }
    }

    const nextTrack = () => {
        console.log("nextTrack")
        if (runHierarchy.current) {
            let inputFiles = runHierarchy.current.run.selected_input_files
            let nextIndex = Math.min(inputFiles.length - 1, currentFileIndex + 1)
            if (nextIndex !== currentFileIndex) {
                let newFilename = inputFiles[nextIndex]
                setCurrentFileIndex(nextIndex)
                let percentage = runHierarchy.current.state.data[0].status === "COMPLETED" ? 100 : 0
                runHierarchy.current.setFilename(newFilename, percentage)
            }
        }
    }

    const startContent = (
        <React.Fragment>
            <Button
                rounded
                icon={runStatus === 'COMPLETED' ? "pi pi-play" : "pi pi-play"}
                tooltip={runStatus === 'COMPLETED' ? "Re-execute" : "Execute"}
                severity={runStatus === 'COMPLETED' ? 'danger' : 'warning'}
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={execute}
                disabled={executionInProgress}></Button>
            <Button
                rounded
                icon="pi pi-chart-bar"
                tooltip="Analyse"
                severity="success"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={analyse}
                disabled={executionInProgress || runStatus !== 'COMPLETED'}></Button>
            <Button
                rounded
                icon="pi pi-step-backward"
                tooltip="Previous Audio File"
                severity="info"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={previousTrack}
                disabled={executionInProgress}></Button>
            <Button
                rounded
                icon="pi pi-step-forward"
                tooltip="Next Audio File"
                severity="info"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={nextTrack}
                disabled={executionInProgress}></Button>
        </React.Fragment>
    )


    const middleContent = (
        <React.Fragment>
        </React.Fragment>
    )

    const endContent = (
        <React.Fragment>
            <Button
                rounded
                text
                icon="pi pi-search"
                tooltip="Use mouse wheel on the tree to zoom in/out"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={() => {
                    runHierarchy.current.scaleFactor = null
                    runHierarchy.current.zoomToFit()
                }}></Button>
            <Button
                rounded
                text
                icon="pi pi-arrows-alt"
                tooltip="Drag on the tree to pan"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"></Button>
            <Button
                rounded
                text
                icon="pi pi-list"
                tooltip="Place the mouse pointer over a node to get more info"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"></Button>
            <Button
                rounded
                text
                icon="pi pi-delete-left"
                severity='error'
                tooltip="Right click on node and select 'Delete' item from the context menu"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"></Button>
        </React.Fragment>
    )

    const headerTemplate = (options) => {
        return (
            <React.Fragment>
                <div className={options.className}>
                    <span className={options.titleClassName}>Run Execution</span>
                    <span>
                        <Button
                            rounded
                            size="large"
                            text
                            icon="pi pi-info-circle"
                            iconPos="right"
                            severity='info'
                            tooltip="Inspect the structure of the elaboration, run it and monitor progress"
                            tooltipOptions={{ position: 'top' }}
                            className={options.titleClassName + ' mr-2'}></Button>
                        {endContent}
                    </span>
                </div>
            </React.Fragment>
        )
    }

    return (
        runId ? (
            <div id="runExecution" className="card p-fluid">
                <Toast ref={toast} />
                <Panel id="panel" headerTemplate={headerTemplate}>
                    <RunHierarchy
                        servicesContainer={servicesContainer}
                        ref={runHierarchy}
                        runId={runId}
                        filename={""}
                        onRunLoaded={onRunLoaded}
                        onExecutionStarted={() => { setExecutionInProgress(true) }}
                        onExecutionCompleted={onExecutionCompleted} />
                </Panel>
                <Toolbar start={startContent} center={middleContent} />
            </div>
        ) : <Navigate to={`/run/history`} state={{ nextPage: "RunExecution" }} />
    )

}
