import React, { Component } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator'
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { SplitButton } from 'primereact/splitbutton';


class RunList extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: [],
            selectedRun: null
        };
    }

    setSelectedRun(runId) {
        this.setState({
            selectedRun: runId
        })
    }

    componentDidMount() {
        this.setState({
            data: [{
                id: "a9f55783-5245-4422-bddc-d6b688703f8d",
                runId: "a9f55783-5245-4422-bddc-d6b688703f8d"
            },
            {
                id: "bf1a641d-ff68-4715-a897-d4b96dd70150",
                runId: "bf1a641d-ff68-4715-a897-d4b96dd70150"
            }]
        });
    }

    render() {
        const startContent = (
            <React.Fragment>
                <Button label="New" icon="pi pi-plus" className="mr-2" />
                <Button label="Upload" icon="pi pi-upload" className="p-button-success" />
                <i className="pi pi-bars p-toolbar-separator mr-2" />
                <SplitButton label="Save" icon="pi pi-check" model={[]} className="p-button-warning"></SplitButton>
            </React.Fragment>
        );
    
        const endContent = (
            <React.Fragment>
                <Button icon="pi pi-search" className="mr-2" />
                <Button icon="pi pi-calendar" className="p-button-success mr-2" />
                <Button icon="pi pi-times" className="p-button-danger" />
            </React.Fragment>
        );

        return (
            <div id="runList">
                <Card title="Runs List">
                    <DataTable stripedRows value={this.state.data} selectionMode="single" selection={this.state.selectedRun} onChange={(e) => this.setSelectedRun(e.id)}>
                        <Column field="runId" header="Run ID"></Column>
                        <Column field="seed" header="Seed"></Column>
                        <Column field="files" header="Files"></Column>
                        <Column field="createdOn" header="Created On"></Column>
                        <Column field="createdBy" header="Created By"></Column>
                    </DataTable>
                    <Paginator rows={10} totalRecords={this.state.data.length} onPageChange={null}></Paginator>
                </Card>
                <div className="card">
                    <Toolbar start={startContent} end={endContent} />
                </div>
            </div>
        )
    }
}



export default RunList;