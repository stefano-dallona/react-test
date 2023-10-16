import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React from 'react';

import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast'

import RunList from '../components/RunList';
import { useLocation, useNavigate, } from "react-router-dom";
import { useRef, useEffect } from "react";

import RunAwesomeQueryBuilder from '../components/RunAwesomeQueryBuilder'
import { useContainer } from "../components/ServicesContextProvider"

import '../css/querybuilder.css';

export const RunHistory = (props) => {
    let navigate = useNavigate()
    let location = useLocation()
    let toast = useRef()
    let runList = useRef()
    let servicesContainer = useContainer()

    useEffect(() => {
        if (location.state && location.state.nextPage) {
            if (location.state.nextPage === 'RunExecution' || location.state.nextPage === 'RunAnalysis') {
                showMessage('info', `Please select a run`, '')
            }
        }
    })

    const showMessage = (severity, summary, detail) => {
        toast.current.show({ severity: severity, summary: summary, detail: detail });
    }

    const search = async (queryString) => {
        console.log(`queryString:${queryString}`)
        let projection = { "_id": 1 }
        let pagination = { page: 0, pageSize: 10 }
        runList.current.setQuery(queryString)
        let runs = await servicesContainer.configurationService.findRunsByFilter(queryString, projection, pagination)
        return runs
    }

    const saveFilter = async (filterString, user, filterName) => {
        console.log(`filterString:${filterString}, user:${user}, filterName:${filterName}`)
        let filter = await servicesContainer.configurationService.saveFilter(filterName, filterString)
        return filter
    }

    const loadSavedFilters = async (user) => {
        console.log(`user:${user}`);
    }

    const refresh = () => {
        runList.current.setQuery(null)
        runList.current.loadData()
    }

    const execute = () => {
        if (!runList.current.state.selectedRun) {
            showMessage('info', `Please select a run for execution`, '')
            return
        }

        navigate(`/run/${runList.current.state.selectedRun.run_id}/execution`)
    }

    const loadRun = async () => {
        if (!runList.current.state.selectedRun) {
            return null
        }
        let run = await servicesContainer.configurationService.getRun(runList.current.state.selectedRun.run_id)
        return run
    }

    const analyse = async () => {
        if (!runList.current.state.selectedRun) {
            showMessage('info', `Please select a run for analysis`, '')
            return
        }

        let run = await loadRun()
        if (!run) {
            showMessage('error', `Run not found`, '')
            return
        }
        
        if (run.status !== "COMPLETED") {
            showMessage('error', `Run must be executed successfully before it can be analysed`, '')
            return
        }

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

    const editHandler = (runId) => {
        navigate(`/run/configuration?runId=${runId}`)
    }

    const startContent = (
        <React.Fragment>
            <Button
                rounded
                icon="pi pi-refresh"
                severity='info'
                tooltip="Refresh"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={refresh}
                disabled={false}></Button>
            <Button
                rounded
                /*icon="pi pi-cog"*/
                icon="pi pi-play"
                severity='warning'
                tooltip="Execute"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={execute}
                disabled={false}></Button>
            <Button
                rounded
                icon="pi pi-chart-bar"
                tooltip="Analyse"
                severity="success"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={analyse}
                disabled={false}></Button>

            <i className="pi p-toolbar-separator mr-2" />
        </React.Fragment>
    );

    return (
        <div id="runHistory" className="card p-fluid">
            <Panel header="Search" toggleable collapsed={true} >
                <RunAwesomeQueryBuilder
                    servicesContainer={servicesContainer}
                    searchHandler={search}
                    /*saveFilterHandler={saveFilter}
                    loadSavedFiltersHandler={loadSavedFilters}*/ />
            </Panel>
            <Panel header="Run List">
                <RunList
                    servicesContainer={servicesContainer}
                    ref={runList}
                    query={null}
                    parentChangeHandler={onChange}
                    rowEditHandler={editHandler}></RunList>
            </Panel>
            <Toast ref={toast} />
            {(!location.state || !location.state.nextPage) && (
                <Toolbar start={startContent} />
            )}
        </div>
    )
}
