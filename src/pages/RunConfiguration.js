import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { Component } from 'react';
import Settings from '../components/Settings';


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