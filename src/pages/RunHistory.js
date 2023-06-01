import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React from 'react';

import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';

import RunList from '../components/RunList';
import { useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";

import RunAwesomeQueryBuilder from '../components/RunAwesomeQueryBuilder'
import { useContainer } from "../components/ServicesContextProvider"

import '../css/querybuilder.css';

export const RunHistory = (props) => {
    let navigate = useNavigate()
    let location = useLocation()
    let runList = useRef()
    let servicesContainer = useContainer()

    const search = async (queryString) => {
        console.log(`queryString:${queryString}`)
        let projection = { "_id": 1 }
        let pagination = {page: 0, pageSize: 10}
        let runs = await servicesContainer.configurationService.findRunsByFilter(queryString, projection, pagination)
        return runs
    }

    const saveFilter = async (filterString, user, filterName) => {
        console.log(`filterString:${filterString}, user:${user}, filterName:${filterName}`)
    }

    const loadSavedFilters = async (user) => {
        console.log(`user:${user}`);
    }

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
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={analyse}
                disabled={false}></Button>

            <i className="pi p-toolbar-separator mr-2" />
        </React.Fragment>
    );

    return (
        <div id="runHistory" className="card p-fluid">
            <Panel header="Search" toggleable collapsed={true}>
                <RunAwesomeQueryBuilder
                    searchHandler={search}
                    saveFilterHandler={saveFilter}
                    loadSavedFiltersHandler={loadSavedFilters}/>
            </Panel>
            <Panel header="Run List">
                <RunList servicesContainer={servicesContainer} ref={runList} parentChangeHandler={onChange}></RunList>
            </Panel>
            {(!location.state || !location.state.nextPage) && (
                <Toolbar start={startContent} />
            )}
        </div>
    )
}
