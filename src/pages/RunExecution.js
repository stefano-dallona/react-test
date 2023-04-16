import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { Component, useRef } from 'react';

import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';

import RunHierarchy from '../components/RunHierarchy';
import withNavigation from "../components/withNavigation";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { ConfigurationService } from "../services/testbench-configuration-service";

export const RunExecution = (props) => {
    let navigate = useNavigate()
    let { runId } = useParams()
    let runHierarchy = useRef()

    const analyse = () => {
        navigate(`/run/${runId}/analysis`)
    }

    const execute = () => {
        let baseUrl = "http://localhost:5000"
        let configurationService = new ConfigurationService(baseUrl)
        configurationService.launchRunExecution(runId)
        runHierarchy.current.startListeningForExecutionEvents()
    }

    const startContent = (
        <React.Fragment>
            <Button icon="pi" className="mr-2" onClick={execute}>Execute</Button>
            <Button icon="pi" className="mr-2" onClick={analyse}>Analyse</Button>

            <i className="pi p-toolbar-separator mr-2" />
        </React.Fragment>
    );

    return (
        runId ? (
            <div id="runAnalysis" className="card p-fluid">
                <Panel header="Run Hierarchy">
                    <RunHierarchy ref={runHierarchy} runId={runId} filename={""} />
                </Panel>
                <Toolbar start={startContent} />
            </div>
        ) : <Navigate to={`/run/history`} state={{nextPage: "RunExecution"}} />
    )

}
