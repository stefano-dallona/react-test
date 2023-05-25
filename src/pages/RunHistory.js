import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { Component } from 'react';

import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';

import RunList from '../components/RunList';
import withNavigation from "../components/withNavigation";
import { useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";

import { RunQueryBuilder } from '../components/RunQueryBuilder'
import RunAwesomeQueryBuilder from '../components/RunAwesomeQueryBuilder'

export const RunHistory = (props) => {
    let navigate = useNavigate()
    let location = useLocation()
    let runList = useRef()

    const execute = () => {
        navigate(`/run/${runList.current.state.selectedRun.run_id}/execution`)
    }

    const analyse = () => {
        navigate(`/run/${runList.current.state.selectedRun.run_id}/analysis`)
    }

    const onChange = () => {
        if (location.state) {
            switch (location.state.nextPage) {
                case "RunExecution":
                    execute()
                    break
                case "RunAnalysis":
                    analyse()
                    break
                default:
            }
        }
    }

    const startContent = (
        <React.Fragment>
            <Button
                rounded
                icon="pi pi-cog"
                tooltip="Execute"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={execute}></Button>
            <Button
                rounded
                icon="pi pi-chart-bar"
                tooltip="Analyse"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={analyse}></Button>

            <i className="pi p-toolbar-separator mr-2" />
        </React.Fragment>
    );

    return (
        <div id="runHistory" className="card p-fluid">
            <Panel header="Search" toggleable collapsed={true}>
                <RunAwesomeQueryBuilder />
            </Panel>
            <Panel header="Run List">
                <RunList ref={runList} parentChangeHandler={onChange}></RunList>
            </Panel>
            {(!location.state || !location.state.nextPage) && (
                <Toolbar start={startContent} />
            )}
        </div>
    )
}
