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
        runHierarchy.current.setFilename("")
        runHierarchy.current.resetProgressBars(0, true)
        runHierarchy.current.startListeningForExecutionEvents()
        servicesContainer.configurationService.launchRunExecution(runId)
    }

    const showMessage = (severity, summary, detail) => {
        toast.current.show({ severity: severity, summary: summary, detail: detail });
    }

    const onExecutionCompleted = (runId) => {
        setExecutionInProgress(false)
        runHierarchy.current.resetProgressBars(100, true)
        showMessage('info', `Elaboration of run ${runId} completed successfully`, '')
    }

    const startContent = (
        <React.Fragment>
            <Button
                rounded
                icon="pi pi-cog"
                tooltip="Execute"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={execute}
                disabled={executionInProgress}></Button>
            <Button
                rounded
                icon="pi pi-chart-bar"
                tooltip="Analyse"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={analyse}
                disabled={executionInProgress}></Button>

            <i className="pi p-toolbar-separator mr-2" />
        </React.Fragment>
    );

    return (
        runId ? (
            <div id="runAnalysis" className="card p-fluid">
                <Toast ref={toast}/>
                <Panel header="Run Hierarchy">
                    <RunHierarchy servicesContainer={servicesContainer} ref={runHierarchy} runId={runId} filename={""} onExecutionCompleted={onExecutionCompleted}/>
                </Panel>
                <Toolbar start={startContent} />
            </div>
        ) : <Navigate to={`/run/history`} state={{nextPage: "RunExecution"}} />
    )

}
