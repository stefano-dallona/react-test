import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';
import '../css/picklist.css';

import React, { Component, useRef } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { trackPromise } from 'react-promise-tracker';

import Settings from '../components/Settings';

import { useContainer } from "../components/ServicesContextProvider";


export const RunConfiguration = (props) => {
    let navigate = useNavigate()
    let { runId } = useParams()
    let settings = useRef()
    let servicesContainer = useContainer()

    const execute = (runId) => {
        navigate(`/run/${runId}/execution`)
    }

    return (
        <div id="runConfiguration" className="card p-fluid">
            <Settings servicesContainer={servicesContainer} ref={settings} execute={execute} paged="false"></Settings>
        </div>
    )

}