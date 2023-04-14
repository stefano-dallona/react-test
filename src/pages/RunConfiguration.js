import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { Component, useRef } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { trackPromise } from 'react-promise-tracker';

import Settings from '../components/Settings';


/*
class RunConfiguration extends Component {

    constructor(props) {
        super(props);

        this.state = {
        };
    }

    componentDidMount() {

    }

    render() {
        return (
            <div id="runConfiguration" className="card p-fluid">
                <Settings paged="false"></Settings>
            </div>
        )
    }
}

export default RunConfiguration;
*/

export const RunConfiguration = (props) => {
    let navigate = useNavigate()
    let { runId } = useParams()
    let settings = useRef()

    return (
        <div id="runConfiguration" className="card p-fluid">
            <Settings ref={settings} paged="false"></Settings>
        </div>
    )

}