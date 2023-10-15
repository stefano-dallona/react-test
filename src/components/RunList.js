import React, { Component } from 'react';
import { trackPromise } from 'react-promise-tracker';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator'
import { Tooltip } from 'primereact/tooltip';
import { Button } from 'primereact/button';

import { ConfigurationService } from '../services/testbench-configuration-service';


class RunList extends Component {

    constructor(props) {
        super(props);

        this.servicesContainer = props.servicesContainer
        this.rowEditHandler = props.editHandler || ((runId) => {})

        this.state = {
            query: null,
            data: [],
            page: 0,
            pageSize: 5,
            totalRecords: 0,
            selectedRun: null
        };
    }

    setQuery(query) {
        this.setState({
            query: query
        }, this.loadData)
    }

    setData(data, page, totalRecords) {
        this.setState({
            data: data,
            page: page,
            totalRecords: totalRecords
        })
    }

    setPageSize(page, pageSize, callback) {
        this.setState({
            page: page,
            pageSize: pageSize
        }, callback)
    }

    setSelectedRun(runId) {
        this.setState({
            selectedRun: runId
        }, this.props.parentChangeHandler)
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

    async loadData(page = 0) {
        let pagination = { page: page, pageSize: this.state.pageSize }
        let result = await trackPromise(this.state.query ? this.servicesContainer.configurationService.findRunsByFilter(this.state.query, {}, pagination) : this.servicesContainer.configurationService.findAllRuns(pagination));
        result.data.forEach((row) => { row.input_files = row.selected_input_files.join(",") })
        this.setData(result.data, page, result.totalRecords);
    }

    async modifyRun(runId) {
        let runConfiguration = await trackPromise(this.servicesContainer.configurationService.getRunConfiguration(runId));
        let key = "plc-testbench-ui.configuration"
        localStorage.setItem(key, runConfiguration)
        this.editHandler(runId)
    }

    onPageChange = (event) => {
        let page = event.page
        this.setPageSize(event.page, event.rows, () => this.loadData(page));
    };

    getStatusIcon = (status) => {
        switch (status) {
            case 'CREATED':
                return (
                    <i className="pi pi-minus status" data-pr-tooltip={status} style={{ fontSize: '1rem' }}></i>
                );

            case 'RUNNING':
                return (
                    <i className="pi pi-spin pi-spinner status" data-pr-tooltip={status} style={{ fontSize: '1rem' }}></i>
                );

            case 'COMPLETED':
                return (
                    <i className="pi pi-check status" data-pr-tooltip={status} style={{ color: 'white', fontSize: '1rem' }}></i>
                );

            case 'FAILED':
                return (
                    <i className="pi pi-times" data-pr-tooltip={status} style={{ color: 'red', fontSize: '1rem' }}></i>
                );

            default:
                return null;
        }
    };

    statusBodyTemplate = (rowData) => {
        return (
            <div className="flex align-items-center gap-2">
                <Tooltip target=".status" />
                {this.getStatusIcon(rowData.status)}
            </div>
        );
    }

    actionsBodyTemplate = (rowData) => {
        return (
            <div className="flex align-items-center gap-2">
                <Button
                    rounded
                    icon="pi pi-pencil"
                    tooltip="Modify"
                    severity='warning'
                    tooltipOptions={{ position: 'top' }}
                    className="mr-2"
                    onClick={() => {this.modifyRun(rowData["run_id"])}}></Button>
            </div>
        );
    }

    selectedInputFilesBodyTemplate = (run) => {
        return (
            <ul>
                {run.selected_input_files.map((file) => <li key={file}>{file}</li>)}
            </ul>
        )
    }

    paginatorTemplate = {
        layout: 'RowsPerPageDropdown PrevPageLink PageLinks NextPageLink CurrentPageReport',
        CurrentPageReport: (options) => {
            return (
                <span style={{ color: 'var(--text-color)', userSelect: 'none', width: '120px', textAlign: 'center' }}>
                    {options.first} - {options.last} of {options.totalRecords}
                </span>
            );
        }
    }

    render() {
        return (
            <div id="runList">
                <DataTable lazy
                    stripedRows
                    value={this.state.data}
                    selectionMode="single"
                    selection={this.state.selectedRun}
                    onSelectionChange={(e) => this.setSelectedRun(e.value)}>
                    <Column field="run_id" header="Run ID"></Column>
                    <Column field="selected_input_files" header="Files" body={this.selectedInputFilesBodyTemplate}></Column>
                    <Column field="created_on" header="Created On"></Column>
                    <Column field="creator" header="Creator"></Column>
                    <Column field="status" header="Status" body={this.statusBodyTemplate}></Column>
                    <Column header="Actions" body={this.actionsBodyTemplate}></Column>
                </DataTable>
                <Paginator
                    template={this.paginatorTemplate}
                    first={this.state.page * this.state.pageSize}
                    rows={this.state.pageSize}
                    totalRecords={this.state.totalRecords}
                    rowsPerPageOptions={[3, 5]}
                    onPageChange={this.onPageChange}></Paginator>
            </div>
        )
    }
}



export default RunList;