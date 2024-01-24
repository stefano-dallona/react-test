import React, { Component } from 'react';

import { Panel } from 'primereact/panel';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { ListBox } from 'primereact/listbox';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { ScrollPanel } from 'primereact/scrollpanel';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { Chips } from 'primereact/chips';
import { InputSwitch } from 'primereact/inputswitch';


import cloneDeep from 'lodash/cloneDeep';
import startCase from 'lodash/startCase';
import create_UUID from '../utils/Uuid';

var parse = require('html-react-parser');

/*

//https://stackoverflow.com/questions/14829708/most-pythonic-way-to-provide-function-metadata-at-compile-time
//https://docs.python-cerberus.org/validation-rules.html
//https://towardsdatascience.com/6-approaches-to-validate-class-attributes-in-python-b51cffb8c4ea
//https://docs.pydantic.dev/latest/concepts/validators/
//https://docs.pydantic.dev/1.10/usage/validators/
//Useful ideas to manage validation

// https://primereact.org/message/
#Form for displaying messages

Validation REST endpoint
//https://stackoverflow.com/questions/11676550/how-to-expose-a-validation-api-in-a-restful-way

*/

class WorkersSettings extends Component {

    constructor(props) {
        super(props);

        this.toast = props.toast
        this.servicesContainer = props.servicesContainer
        this.workerType = props.workerType
        this.defaultSettings = props.defaultSettings || {}

        this.header = props.header || this.workerType + " Settings"
        this.toggleable = props.toggleable || true

        this.state = {
            currentWorker: null,
            currentWorkerSettings: null,
            selectedWorkers: props.selectedWorkers || [],
            confirmationMessage: null,
            currentNodes: null
        };
    }

    componentDidMount() {
        this.setAvailableWorkers(this.getWorkers())
        if (this.defaultSettings.length == 1) {
            this.setCurrentWorker(this.defaultSettings[0].name)
        }
    }

    setCurrentWorker(currentWorker) {
        this.setState({
            currentWorker: currentWorker
        })
        if (currentWorker) {
            let workersSettings = this.defaultSettings.find((worker) => worker.name == currentWorker)
            if (workersSettings) {
                workersSettings.uuid = create_UUID()
            }
            this.setCurrentWorkerSettings(cloneDeep(workersSettings))

            let currentNodes = this.servicesContainer.configurationService.getSettingsAsTreetableNodes(this.defaultSettings.find((item) => {
                return item.name === currentWorker
            })?.settings)
            this.setCurrentNodes(cloneDeep(currentNodes))
        } else {
            this.setCurrentWorkerSettings(null)
        }
    }

    setAvailableWorkers(availableWorkers) {
        this.setState({
            availableWorkers: availableWorkers
        })
    }

    setCurrentWorkerSettings(currentWorkerSettings) {
        this.setState({
            currentWorkerSettings: currentWorkerSettings
        })
    }

    setCurrentNodes(currentNodes) {
        this.setState({
            currentNodes: currentNodes
        })
    }

    setSelectedWorkers(selectedWorkers) {
        this.setState({
            selectedWorkers: selectedWorkers
        }, () => {
            this.setAvailableWorkers(this.getWorkers())
        })
    }

    setPropertyValue = (setting, value) => {
        let currentWorkerSettings = cloneDeep(this.state.currentWorkerSettings)
        currentWorkerSettings.settings.map((originalSetting) => {
            if (originalSetting.property === setting.property) {
                originalSetting.value = value
                return originalSetting
            } else {
                return originalSetting
            }
        })
        this.setState({ currentWorkerSettings: currentWorkerSettings })
    };

    setConfirmationMessage(confirmationMessage) {
        this.setState({
            confirmationMessage: confirmationMessage
        })
    }

    getWorkers = () => {
        let workers = this.defaultSettings.filter((worker) => {
            //return worker.name !== 'ZerosPLC'
            return !this.isDuplicatedWorker(worker) || worker.settings.length > 0
        }).map((worker) => {
            return { "label": startCase(worker.name), "value": worker.name }
        })
        return workers
    }

    saveWorker = () => {
        if (!this.state.currentWorker) {
            return
        }

        if (this.isDuplicatedWorker(this.state.currentWorkerSettings)) {
            this.showMessage('error', `Duplicated configuration !`)
            return
        }

        let clonedSelectedWorkers = cloneDeep(this.state.selectedWorkers)
        let currentWorker = cloneDeep(this.state.currentWorkerSettings)

        let clonedCurrentNodes = cloneDeep(this.state.currentNodes)
        currentWorker.settings = clonedCurrentNodes

        let existingWorker = this.state.selectedWorkers.find(oa => oa.uuid == currentWorker.uuid)
        if (existingWorker) {
            clonedSelectedWorkers = clonedSelectedWorkers.map(oa => (oa.uuid == currentWorker.uuid) ? currentWorker : oa)
        } else {
            clonedSelectedWorkers.push(currentWorker)
        }
        this.setSelectedWorkers(clonedSelectedWorkers)

        if (this.defaultSettings.length > 1) {
            this.setCurrentWorker(null)
        }

        //this.showMessage('info', `Settings saved !`, JSON.stringify(this.state.selectedOutputAnalysers))
    }

    showMessage = (severity, summary, detail) => {
        if (this.toast && this.toast.current) {
            this.toast.current.show({ severity: severity, summary: summary, detail: detail });
        }
    }

    deleteWorker = () => {
        if (!this.state.currentWorker) {
            return;
        }
        if (this.state.currentWorker === 'ZerosPLC') {
            //throw new Error("Cannot delete Zeros PLC instance !")
        }
        let currentWorkerSettings = this.state.currentWorkerSettings
        if (this.state.selectedWorkers) {
            let clonedSelectedWorkers = cloneDeep(this.state.selectedWorkers)
            this.setSelectedWorkers(clonedSelectedWorkers.filter((oa) => {
                return oa.uuid !== currentWorkerSettings.uuid
            }))
        }
        this.setCurrentWorker(null)
    }

    handleDelete = () => {
        try {
            this.deleteWorker()
        } catch (err) {
            this.showMessage('error', err.message)
        }
    }

    handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            this.saveWorker()
        }
    }

    isNewWorker = (workerSettings) => {
        return !this.state.selectedWorkers.find((ws) => workerSettings && ws.uuid === workerSettings.uuid)
    }

    // REFERENCE: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
    orderedJsonStringify = (key) =>
        JSON.stringify(key, (_, v) =>
            v.constructor === Object ? Object.entries(v).sort() : v
        );

    isDuplicatedWorker = (workerSettings) => {
        let sameWorker = this.state.selectedWorkers.filter((ws) => {
            let sameWorker = this.orderedJsonStringify({ "name": ws.name, "settings": ws.settings }) === this.orderedJsonStringify({ "name": workerSettings.name, "settings": workerSettings.settings })
            return sameWorker
        })
        return sameWorker.length > 0 //&& sameWorker[0].uuid !== workerSettings.uuid
    }

    loadSelectedWorker = (value) => {
        let currentWorkerSettings = this.state.selectedWorkers.find((oa) => oa.uuid === value)
        if (currentWorkerSettings) {
            this.setCurrentWorker(currentWorkerSettings.name)
            this.setCurrentWorkerSettings(currentWorkerSettings)
        } else {
            this.setCurrentWorker(null)
        }

        let currentNodes = currentWorkerSettings.settings
        this.setCurrentNodes(currentNodes)
    }


    cellEditor = (setting) => {
        let editor = null
        switch (setting.type) {
            case "int":
                editor = this.numberEditor(setting)
                break;
            case "float":
                editor = this.numberEditor(setting, true)
                break;
            case "select":
                editor = this.singleSelectEditor(setting)
                break;
            case "multiselect":
                editor = this.multipleSelectEditor(setting)
                break;
            default:
                editor = this.textEditor(setting)
        }
        return editor;
    };

    numberEditor = (setting, decimal = false) => {
        return <InputNumber key={setting.property}
            value={setting.value}
            useGrouping={false}
            minFractionDigits={decimal ? 5 : 0}
            maxFractionDigits={decimal ? 5 : 0}
            onChange={(e) => this.setPropertyValue(setting, e.value)} />;
    };

    textEditor = (setting) => {
        return <InputText key={setting.property}
            type="text" value={setting.value}
            onChange={(e) => this.setPropertyValue(setting, e.target.value)} />;
    };

    multipleSelectEditor = (setting) => {
        return <MultiSelect key={setting.property}
            value={setting.value}
            options={setting.options}
            optionGroupChildren="items"
            display="chip"
            style={{ textAlign: "left" }}
            onChange={(e) => this.setPropertyValue(setting, e.value)} />
    }

    singleSelectEditor = (setting) => {
        return <Dropdown key={setting.property}
            value={setting.value}
            options={setting.options}
            style={{ textAlign: "left" }}
            onChange={(e) => this.setPropertyValue(setting, e.value)} />
    }

    getSettingsAsHtmlTable(settings, level = 0) {
        return (
            <table style={{ width: "140%", tableLayout: "fixed" }}>
                {
                    settings.map((setting) => {
                        let property = setting.data.property
                        let settingChildren = (level > 0) ? [
                            {
                                data: {
                                    property: "algorithm",
                                    value: String(setting.data.value).replace(/(S|s)ettings/g, "")
                                }
                            } 
                        ].concat(setting.children) : setting.children
                        let value = setting?.children?.length > 0 ? this.getSettingsAsHtmlTable(settingChildren, level + 1) : setting.data.value
                        //value = JSON.stringify(value).replaceAll(/^"/gi, "").replaceAll(/"$/gi, "")
                        return (<tr>
                            <td style={{ width: "20%", verticalAlign: "top", paddingTop: level === 0 ? "40px" : "0px" }}><b>{property}:</b></td>
                            <td style={{ width: "80%", verticalAlign: "top", paddingTop: level === 0 ? "40px" : "0px" }}>{value}</td>
                        </tr>)
                    })
                }
            </table>
        )
    }

    inputTextEditor = (options) => {
        return (
            <InputText
                type="text"
                disabled={!options.rowData["editable"]}
                value={options.rowData[options.field]}
                onChange={(e) => this.onEditorValueChange(options, e.target.value)}
            />
        );
    };

    booleanEditor = (options) => {
        return (
            <InputSwitch
                disabled={!options.rowData["editable"]}
                checked={options.rowData[options.field] === "true"}
                onChange={(e) => this.onEditorValueChange(options, e.target.value)}
            />
        );
    };

    getSafeListValue = (value) => {
        let safeValue = value?.toString().trim() === '' ? [] : value
        safeValue = Array.isArray(safeValue) ? safeValue : safeValue.split(",")
        return safeValue
    }

    editableListEditor = (options) => {
        return (
            <Chips
                value={this.getSafeListValue(options.rowData[options.field])}
                onChange={(e) => this.onEditorValueChange(options, e.target.value)}
                separator=","
                keyfilter="int"
            />
        );
    };

    singleSelectEditor = (options) => {
        return (
            <Dropdown
                disabled={!options.rowData["editable"]}
                value={options.rowData[options.field]}
                options={options.rowData["options"]}
                optionLabel="name"
                optionValue="name"
                onChange={(e) => this.onEditorValueChange(options, e.target.value)}
            />
        );
    };

    findNodeByKey = (nodes, key) => {
        let path = key.split("-");
        let node;

        while (path.length) {
            let list = node ? node.children : nodes;

            node = list[parseInt(path[0], 10)];
            path.shift();
        }

        return node;
    };

    handleBandsChange = (nodes, editedNode, editedField, newValue, oldValue) => {
        editedNode.data[editedField] = newValue?.trim().length === 0 ? [] : newValue

        let oldBands = this.getSafeListValue(oldValue);
        let newBands = this.getSafeListValue(newValue);

        if (cloneDeep(newBands).sort().join(',') !== newBands.join(',')) {
            return
        }

        let parentNodeKey = editedNode.key.split("-").slice(0, -1).join("-")
        let parentNode = this.findNodeByKey(nodes, parentNodeKey)
        let addedBands = newBands.filter(band => !oldBands.includes(band));
        let removedBands = oldBands.filter(band => !newBands.includes(band));
        console.log(`oldBands: ${oldBands}, newBands: ${newBands}, addedBands: ${addedBands}, removedBands: ${removedBands}`)
        let crossfade = (parentNode ? parentNode.children : nodes).find((node) => node.data.property === 'crossfade')
        let allCrossfadePossibleSettings = crossfade.children[0].data.options
        let defaultCrossfadeSettings = "NoCrossfadeSettings"
        let crossfadeSettings = allCrossfadePossibleSettings.find((option) => {
            return option.name = defaultCrossfadeSettings
        })?.settings
        let crossfadeSettingsPath = crossfade.children[0].key.split("-")

        function range(start, end) {
            return new Array(end - start).fill().map((d, i) => i + start);
        }

        let newChildrenIndexes = range(crossfade.children.length, crossfade.children.length + addedBands.length)
        crossfade.children = crossfade.children.concat(newChildrenIndexes.map((index) => {
            let newChildKey = crossfadeSettingsPath.map((_, idx) => (idx < crossfadeSettingsPath.length - 1) ? idx : index).join("-")
            return {
                key: newChildKey,
                data: {
                    "property": `band-${index}`,
                    "value": defaultCrossfadeSettings,
                    "options": allCrossfadePossibleSettings,
                    "valueType": "select",
                    "editable": "false"
                },
                children: crossfadeSettings
            }
        }))

        let childsToRemoveIndexes = oldBands.map((band, index) => {
            return [band, index]
        }).filter(x => {
            return removedBands.includes(x[0])
        }).map(x => {
            return x[1]
        })

        if (removedBands.length > 0) {
            crossfade.children = crossfade.children
                .filter((_, index) => {
                    return !childsToRemoveIndexes.includes(index)
                })
                .map((child, index) => {
                    let currentKeyIndexes = child.key.split("-")
                    let newChildKey = currentKeyIndexes.map((_, idx) => (idx < currentKeyIndexes.length - 1) ? idx : index).join("-")
                    child.key = newChildKey
                    child.data.property = `band-${index}`
                    return child
                })
                
        }
    }

    onEditorValueChange = (options, value) => {
        let newNodes = JSON.parse(JSON.stringify(this.state.currentNodes));
        let editedNode = this.findNodeByKey(newNodes, options.node.key);
        let newValue = editedNode.data["valueType"] === "list" ? value.join(",") : value?.toString();
        let oldValue = editedNode.data[options.field]
        editedNode.data[options.field] = newValue

        switch (editedNode.data["property"]) {
            case 'frequencies':
               
                break;
            case 'crossfade_frequencies':
                this.handleBandsChange(newNodes, editedNode, options.field, newValue, oldValue)
                /*
                editedNode.data[options.field] = newValue?.trim().length === 0 ? [] : newValue

                oldBands = this.getSafeListValue(oldValue);
                newBands = this.getSafeListValue(newValue);

                if (cloneDeep(newBands).sort().join(',') !== newBands.join(',')) {
                    return
                }

                let parentNodeKey = options.node.key.split("-").slice(0, -1).join("-")
                let parentNode = this.findNodeByKey(newNodes, parentNodeKey)
                let addedBands = newBands.filter(band => !oldBands.includes(band));
                let removedBands = oldBands.filter(band => !newBands.includes(band));
                console.log(`oldBands: ${oldBands}, newBands: ${newBands}, addedBands: ${addedBands}, removedBands: ${removedBands}`)
                let crossfade = parentNode.children.find((node) => node.data.property === 'crossfade')
                let allCrossfadePossibleSettings = crossfade.children[0].data.options
                let defaultCrossfadeSettings = "NoCrossfadeSettings"
                let crossfadeSettings = allCrossfadePossibleSettings.find((option) => {
                    return option.name = defaultCrossfadeSettings
                })?.settings
                let crossfadeSettingsPath = crossfade.children[0].key.split("-")

                function range(start, end) {
                    return new Array(end - start).fill().map((d, i) => i + start);
                }

                let newChildrenIndexes = range(crossfade.children.length, crossfade.children.length + addedBands.length)
                crossfade.children = crossfade.children.concat(newChildrenIndexes.map((index) => {
                    let newChildKey = crossfadeSettingsPath.map((_, idx) => (idx < crossfadeSettingsPath.length - 1) ? idx : index).join("-")
                    return {
                        key: newChildKey,
                        data: {
                            "property": `band-${index}`,
                            "value": defaultCrossfadeSettings,
                            "options": allCrossfadePossibleSettings,
                            "valueType": "select",
                            "editable": "false"
                        },
                        children: crossfadeSettings
                    }
                }))

                let childsToRemoveIndexes = oldBands.map((band, index) => {
                    return [band, index]
                }).filter(x => {
                    return removedBands.includes(x[0])
                }).map(x => {
                    return x[1]
                })

                if (removedBands.length > 0) {
                    crossfade.children = crossfade.children
                        .filter((_, index) => {
                            return !childsToRemoveIndexes.includes(index)
                        })
                        .map((child, index) => {
                            let currentKeyIndexes = child.key.split("-")
                            let newChildKey = currentKeyIndexes.map((_, idx) => (idx < currentKeyIndexes.length - 1) ? idx : index).join("-")
                            child.key = newChildKey
                            child.data.property = `band-${index}`
                            return child
                        })
                        
                }
                */
                break;
            default:
        };

        if (editedNode.data["valueType"] === 'select' && editedNode.data.options.length > 0 && editedNode.data.options[0].settings) {
            let selectedItemSettings = editedNode.data.options.find((option) => {
                return option.name === newValue
            })
            console.log(`selectedItemSettings.settings: ${selectedItemSettings?.settings}`)
            editedNode.children = selectedItemSettings.settings
        }

        this.setCurrentNodes(newNodes);
    };

    valueEditor = (options) => {
        switch (options.rowData["valueType"]) {
            case "bool":
                console.log("valueType:" + options.rowData["valueType"]);
                return this.booleanEditor(options)
            case "select":
                console.log("valueType:" + options.rowData["valueType"]);
                return this.singleSelectEditor(options);
            case "list":
                console.log("valueType:" + options.rowData["valueType"]);
                return this.editableListEditor(options);
            case "enum":
                console.log("valueType:" + options.rowData["valueType"]);
                return this.singleSelectEditor(options);
            default:
                return this.inputTextEditor(options);
        }
    };

    getWorkerInfo(worker) {
        return worker ? this.defaultSettings.filter((workerSettings) => {
            return workerSettings.name === worker
        }).map((workerSettings) => {
            return workerSettings.doc
        })[0] : ""
    }

    configurationItem = (option) => {
        return (
            <div className="p-inputgroup" style={{ display: "flex", flexWrap: "wrap", overflowX: "scroll" }}>
                <span className="justify-content-left" style={{ width: "20%" }}>{startCase(option.name)}</span>
                <span className="justify-content-left" style={{ width: "65%" }}>{this.getSettingsAsHtmlTable(option.settings)}</span>
                <span className="justify-content-left" style={{ width: "15%" }}>
                    <ConfirmDialog
                        visible={this.state.confirmationMessage}
                        onHide={() => this.setConfirmationMessage(null)}
                        message="Are you sure you want to proceed?" icon="pi pi-exclamation-triangle"
                        accept={this.handleDelete} />
                    <Button
                        rounded
                        icon="pi pi-pencil"
                        severity='info'
                        tooltip="Modify settings"
                        tooltipOptions={{ position: 'top' }}
                        className="mr-2"></Button>
                    <Button
                        rounded
                        icon="pi pi-trash"
                        severity='danger'
                        tooltip="Delete"
                        tooltipOptions={{ position: 'top' }}
                        className="mr-2"
                        onClick={(e) => this.setConfirmationMessage("Are you sure ?")}
                        disabled={!this.state.currentWorker || this.isNewWorker(this.state.currentWorkerSettings) || option.uuid != this.state.currentWorkerSettings.uuid}></Button>
                </span>
            </div>
        )
    }

    render() {
        return (
            <div className="card p-fluid" onKeyDown={this.handleKeyDown}>
                <Splitter style={{ height: '30rem' }}>
                    <SplitterPanel size={39} className="flex align-items-center justify-content-center">
                        <Panel /*header={this.header} toggleable={this.toggleable}*/ style={{ position: "relative", width: "100%", height: '30rem', border: 'none' }}>
                            {this.defaultSettings.length > 1 && (
                                <div className="p-inputgroup" style={{ width: '100%', height: '50px', border: "none" }}>
                                    <label className="mt-2" style={{ textAlign: 'left', color: 'white', width: '20%' }}>Algorithm</label>
                                    <Dropdown value={this.state.currentWorker}
                                        onChange={(e) => this.setCurrentWorker(e.target.value)}
                                        options={this.state.availableWorkers}
                                        optionLabel='label'
                                        optionValue='value'
                                        placeholder={startCase(this.workerType)}
                                        className="w-full md:w-14rem"
                                        selectedWorkers={this.state.selectedWorkers}
                                        style={{ height: "2.1rem" }} />
                                    <Button
                                        rounded
                                        icon="pi pi-info-circle"
                                        severity="info"
                                        tooltip={this.getWorkerInfo(this.state.currentWorker)}
                                        tooltipOptions={{ position: 'top' }}
                                        className="ml-4 mr-2 mb-2"
                                        disabled={!this.state.currentWorkerSettings}></Button>
                                    <Button
                                        rounded
                                        icon={this.isNewWorker(this.state.currentWorkerSettings) ? "pi pi-plus" : "pi pi-save"}
                                        severity="success"
                                        tooltip={this.isNewWorker(this.state.currentWorkerSettings) ? "Add" : "Save"}
                                        tooltipOptions={{ position: 'top' }}
                                        className="mr-2 mb-2"
                                        onClick={(e) => this.saveWorker()}></Button>
                                </div>
                            )}
                            <Panel header={"Parameters"} className="mt-4"
                                style={{ position: "relative", width: "100%", height: '370px', border: 'none' }}>
                                <ScrollPanel style={{ width: '100%', height: '290px' }}>
                                    <TreeTable
                                        value={this.state.currentNodes}
                                        expandedKeys={this.state.expandedKeys}
                                        tableStyle={{ minWidth: "30rem" }}
                                    /*scrollable
                                    scrollHeight='85%'*/
                                    >
                                        <Column
                                            field="property"
                                            header="Property"
                                            expander
                                            style={{ height: "3.5rem" }}
                                        ></Column>
                                        <Column
                                            field="value"
                                            header="Value"
                                            editor={this.valueEditor}
                                            cellEditValidator={this.requiredValidator}
                                            style={{ height: "3.5rem" }}
                                        ></Column>
                                    </TreeTable>
                                </ScrollPanel>
                            </Panel>
                        </Panel>
                    </SplitterPanel>
                    <SplitterPanel size={61} className="flex align-items-center justify-content-center">
                        {this.defaultSettings.length > 1 && (
                            <Panel header={"Selected algorithms"}
                                /*toggleable={this.toggleable}*/
                                style={{ position: "relative", width: "100%", height: "100%" }}>
                                <ListBox value={this.state.selectedWorkers}
                                    onChange={(e) => this.loadSelectedWorker(e.value)}
                                    options={this.state.selectedWorkers}
                                    optionValue="uuid"
                                    optionLabel="name"
                                    className="mt-4"
                                    itemTemplate={this.configurationItem}
                                    listStyle={{ height: '370px' }}
                                    emptyMessage="No algoritms"
                                /*style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    textAlign: "left"
                                }}*/
                                />
                            </Panel>
                        )}
                    </SplitterPanel>
                </Splitter>


            </div >
        )
    }
}

export default WorkersSettings;