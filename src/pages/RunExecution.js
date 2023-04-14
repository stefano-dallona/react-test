import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { Component } from 'react';

import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';

import RunHierarchy from '../components/RunHierarchy';
import withNavigation from "../components/withNavigation";


class RunExecution extends Component {

    constructor(props) {
        super(props);

        this.state = {
        };
    }

    componentDidMount() {

    }

    analyse(e) {
        e.preventDefault();
        this.props.navigate({
            pathname: '/run/analysis',
            state: {
                runId: "1234",
                filename: ""
            }
        });
    }

    render() {
        const startContent = (
            <React.Fragment>
                <Button icon="pi" className="mr-2">Execute</Button>
                <Button icon="pi" className="mr-2" onClick={this.analyse.bind(this)}>Analyse</Button>

                <i className="pi p-toolbar-separator mr-2" />
            </React.Fragment>
        );

        return (
            <div id="runAnalysis" className="card p-fluid">
                <Panel header="Run Hierarchy">
                    <RunHierarchy runId={"1be59452-a242-4e4e-bd83-4bd051bca2bb"} filename={"Blues_Bass.wav"} />
                </Panel>
                <Toolbar start={startContent} />
            </div>
        )
    }
}

export default withNavigation(RunExecution);

