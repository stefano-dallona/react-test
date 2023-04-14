import React, { Component } from 'react';
import { trackPromise } from 'react-promise-tracker';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator'

import { ConfigurationService } from '../services/testbench-configuration-service';


class RunList extends Component {

    constructor(props) {
        super(props);

        this.baseUrl = 'http://localhost:5000'
        this.configurationService = new ConfigurationService(this.baseUrl)

        this.state = {
            data: [],
            selectedRun: null
        };
    }

    setData(data) {
        this.setState({
            data: data
        })
    }

    setSelectedRun(runId) {
        this.setState({
            selectedRun: runId
        })
    }

    componentDidMount() {
        this.loadData()
        /*
        this.setState({
            data: [{
                id: "a9f55783-5245-4422-bddc-d6b688703f8d",
                runId: "a9f55783-5245-4422-bddc-d6b688703f8d"
            },
            {
                id: "bf1a641d-ff68-4715-a897-d4b96dd70150",
                runId: "bf1a641d-ff68-4715-a897-d4b96dd70150"
            }]
        });*/
    }

    async loadData() {
        let data = await trackPromise(this.configurationService.findAllRuns());
        this.setData(data);
    }

    render() {
        return (
            <div id="runList">
                <DataTable stripedRows value={this.state.data} selectionMode="single" selection={this.state.selectedRun} onChange={(e) => this.setSelectedRun(e.id)}>
                    <Column field="run_id" header="Run ID"></Column>
                    <Column field="seed" header="Seed"></Column>
                    <Column field="files" header="Files"></Column>
                    <Column field="createdOn" header="Created On"></Column>
                    <Column field="createdBy" header="Created By"></Column>
                </DataTable>
                <Paginator rows={10} totalRecords={this.state.data.length} onPageChange={null}></Paginator>
            </div>
        )
    }
}



export default RunList;