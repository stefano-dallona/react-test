import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { useRef, useState } from 'react';

import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';

import RunHierarchy from '../components/RunHierarchy';
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { Toast } from 'primereact/toast'

import { useContainer } from "../components/ServicesContextProvider"

export const RunExecution = (props) => {
    let navigate = useNavigate()
    let { runId } = useParams()
    let runHierarchy = useRef()
    let toast = useRef()
    let [executionInProgress, setExecutionInProgress] = useState(false)
    let servicesContainer = useContainer()

    const analyse = () => {
        navigate(`/run/${runId}/analysis`)
    }

    const execute = () => {
        setExecutionInProgress(true)
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

    const onExecutionCompleted = (runId, task_id) => {
        setExecutionInProgress(false)
        runHierarchy.current.resetProgressBars(100, true)
        localStorage.removeItem("runExecution:" + runId)
        showMessage('info', `Execution completed successfully`, '')
    }

    const startContent = (
        <React.Fragment>
            <Button
                rounded
                icon="pi pi-cog"
                tooltip="Execute"
                severity='warning'
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
                disabled={executionInProgress}></Button>
            <Button
                rounded
                icon="pi pi-search"
                tooltip="Use mouse wheel on the tree\nto zoom in/out"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"></Button>
            <Button
                rounded
                icon="pi pi-arrows-v"
                tooltip="Drag on the tree to pan (only vertical allowed)"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"></Button>
            <Button
                rounded
                icon="pi pi-info"
                tooltip="Place the mouse pointer over a node to get more info"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"></Button>
            <Button
                rounded
                icon="pi pi-delete-left"
                severity='error'
                tooltip="Right click on node and select 'Delete' item from the context menu"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"></Button>

            <i className="pi p-toolbar-separator mr-2" />
        </React.Fragment>
    );

    return (
        runId ? (
            <div id="runExecution" className="card p-fluid">
                <Toast ref={toast}/>
                <Panel header="Run Hierarchy">
                    <RunHierarchy servicesContainer={servicesContainer} ref={runHierarchy} runId={runId} filename={""} onExecutionStarted={() => {setExecutionInProgress(true)}} onExecutionCompleted={onExecutionCompleted}/>
                </Panel>
                <Toolbar start={startContent} />
            </div>
        ) : <Navigate to={`/run/history`} state={{nextPage: "RunExecution"}} />
    )

}
