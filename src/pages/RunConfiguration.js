import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';
import '../css/picklist.css';

import React, { Component, useRef } from 'react';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { trackPromise } from 'react-promise-tracker';

import Settings from '../components/Settings';

import { useContainer } from "../components/ServicesContextProvider";


export const RunConfiguration = (props) => {
    let navigate = useNavigate()
    let location = useLocation()
    let { runId } = useParams()
    let settings = useRef()
    let servicesContainer = useContainer()

    const getRunId = () => {
        let query = new URLSearchParams(location.search);
        return query.get("runId")
    }

    const execute = (runId) => {
        navigate(`/run/${runId}/execution`)
    }

    return (
        <div id="runConfiguration" className="card p-fluid">
            <Settings
                runId={getRunId()}
                servicesContainer={servicesContainer}
                ref={settings}
                execute={execute}
                paged="false"></Settings>
        </div>
    )

}