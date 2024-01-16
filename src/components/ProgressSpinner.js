import React, { Component } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { arc as d3arc, style } from 'd3';

import { Tooltip } from 'primereact/tooltip';
import { JsonTable } from 'react-json-to-html'
import { JSONToHTMLTable } from '@kevincobain2000/json-to-html-table';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Dialog } from 'primereact/dialog';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';


class ProgressSpinner extends Component {

    constructor(props) {
        super(props);

        this.visibilityHandler = props.visibilityHandler || (() => { return 'visible' })
        this.title = props.title || ""
        this.node = props.node || null
        this.contextMenuRef = props.contextMenuRef || null
        this.textHandler = props.textHandler || ((progress) => { return `${progress}` })
        this.rightClickHandler = props.rightClickHandler || ((node_id) => { })

        this.state = {
            nodeId: props.nodeId || "",
            currentPercentage: props.percentage || 0,
            eta: 0,
            x: props.x || 0,
            y: props.y || 0,
            r: props.r || 10,

            showSettings: false
        };
    }

    componentDidMount() {
        /*
        async function simulateProgress() {
            while(this.state.currentPercentage < 100) {
                setTimeout(() => {this.setCurretPercentage(this.state.currentPercentage + 1)}, 50)
                await new Promise(r => setTimeout(r, 60))
            }
        }

        simulateProgress.bind(this)()
        */
        /*
        setInterval(() => {
            this.setEta(this.state.eta + 1)
        }, 1000)
        */
    }

    setCurrentPercentage(percentage) {
        this.setState({
            currentPercentage: Math.min(percentage, 100)
        });
    }

    setEta(eta) {
        this.setState({
            eta: eta
        });
    }

    setShowSettings(showSettings) {
        this.setState({
            showSettings: showSettings
        });
    }

    drawMainArc() {
        const outerRadius = this.state.r * 3.2;
        const thickness = outerRadius / 5;

        const mainArc = d3arc()
            .startAngle(0)
            .endAngle(Math.PI * 2)
            .innerRadius(outerRadius - thickness)
            .outerRadius(outerRadius)

        return mainArc()
    }

    drawProgressArc() {
        const outerRadius = this.state.r * 3.2;
        const thickness = outerRadius / 5;

        const progressArc = d3arc()
            .startAngle(0)
            .endAngle(Math.PI * 2 * this.state.currentPercentage / 100)
            .innerRadius(outerRadius - thickness)
            .outerRadius(outerRadius)

        return progressArc()
    }

    handleContextMenu(e) {
        e.preventDefault()
        e.stopPropagation()
        let node_id = e.currentTarget.id.replace("pb-", "")
        if (this.contextMenuRef && this.contextMenuRef.current) {
            this.rightClickHandler(node_id)
            this.contextMenuRef.current.show(e)
        }
    }

    formatTime(timeInSeconds) {
        let hours = Math.floor(timeInSeconds / (60 * 60))
        let minutes = Math.floor(timeInSeconds / 60)
        let seconds = Math.floor(timeInSeconds % 60)
        let formattedTime = `${hours > 0 ? hours + "h" : ""} ${minutes > 0 ? minutes + "m" : ""} ${seconds > 0 ? seconds + "s" : ""}`
        return (formattedTime !== "") ? formattedTime : "0s"
    }

    getTooltip() {
        let data = {
            "node id": this.state.nodeId,
            "ETA": this.state.eta > 0 ? `${this.formatTime(this.state.eta)}` : "",
            ...(this.node ? this.node.worker_settings : [])
        }
        const cssAsJs = {
            rootElement: {
                padding: '0px',
                borderSpacing: '0px',
                fontSize: '8px',
                backgroundColor: '#80bfff'
            },
            subElement: {
                padding: '0px',
                borderSpacing: '0px',
                fontSize: '8px',
                backgroundColor: '#b3d9ff'
            },
            dataCell: {
                padding: '0px',
                borderSpacing: '0px',
                fontSize: '8px',
                backgroundColor: '#e6f2ff'
            }
        }
        /*
        return (<table width="100%">
            {
                Object.keys(data).filter((key) => {
                    return key !== 'ETA' || (this.state.currentPercentage > 0 && this.state.currentPercentage < 100)
                }).map((key) => {
                    return (
                        <tr><td><b>{key}:</b></td><td>{JSON.stringify(data[key])}</td></tr>
                    )
                })
            }
        </table>)
        */
        return (<JsonTable json={data} css={cssAsJs} indent={8} />)
        //return (<JSONToHTMLTable data={data} style={{verticalAlign: 'top'}}/>)
    }

    render() {
        return (
            this.visibilityHandler() === 'visible' ?
                <g id={`pb-${this.state.nodeId}`}
                    style={{ cursor: 'pointer' }}
                    transform={`translate(${this.state.x}, ${this.state.y})`}
                    onContextMenu={(e) => { this.handleContextMenu(e) }}
                    onMouseEnter={(e) => { this.setShowSettings(true) }}>

                    {false && (
                        <Tooltip target={`#pb-${this.state.nodeId}`} updateDelay={1000}>
                            <ScrollPanel style={{ width: '100%', height: '200px' }}>
                                {this.getTooltip()}
                            </ScrollPanel>
                        </Tooltip>
                    )}

                    <Dialog header="Settings"
                        visible={this.state.showSettings}
                        style={{ width: '50vw' }}
                        onHide={(e) => {
                            this.setShowSettings(false)
                        }}>
                        <TreeTable
                            scrollable scrollHeight="200px"
                            //value={this.node.worker_settings}
                            value={[
                                {
                                    "key": "0",
                                    "data": {
                                        "property": "property-0",
                                        "value": "value-0"
                                    },
                                    "children": [
                                        {
                                            "key": "0-0",
                                            "data": {
                                                "property": "property-0-0",
                                                "value": "value-0-0"
                                            },
                                            "children": []
                                        },
                                        {
                                            "key": "0-1",
                                            "data": {
                                                "property": "property-0-1",
                                                "value": "value-0-1"
                                            },
                                            "children": []
                                        }
                                    ]
                                },
                                {
                                    "key": "1",
                                    "data": {
                                        "property": "property-1",
                                        "value": "value-1"
                                    },
                                    "children": [
                                        {
                                            "key": "1-0",
                                            "data": {
                                                "property": "property-1-0",
                                                "value": "value-1-0"
                                            },
                                            "children": []
                                        },
                                        {
                                            "key": "1-1",
                                            "data": {
                                                "property": "property-1-1",
                                                "value": "value-1-1"
                                            },
                                            "children": []
                                        }
                                    ]
                                },
                                {
                                    "key": "2",
                                    "data": {
                                        "property": "property-2",
                                        "value": "value-2"
                                    },
                                    "children": [
                                        {
                                            "key": "2-0",
                                            "data": {
                                                "property": "property-2-0",
                                                "value": "value-2-0"
                                            },
                                            "children": []
                                        },
                                        {
                                            "key": "2-1",
                                            "data": {
                                                "property": "property-2-1",
                                                "value": "value-2-1"
                                            },
                                            "children": []
                                        }
                                    ]
                                }
                            ]}
                            expandedKeys={[]}
                            tableStyle={{ minWidth: "30rem" }}>
                            <Column
                                field="property"
                                header="Property"
                                expander
                                style={{ height: "3.5rem" }}
                            ></Column>
                            <Column
                                field="value"
                                header="Value"
                                style={{ height: "3.5rem" }}
                            ></Column>
                        </TreeTable>
                    </Dialog>

                    <text textAnchor="middle" stroke="white" className="progress-title" transform={`translate(0, -120)`}>{this.title}</text>
                    <path fill="white" className="progress-bar-bg" d={this.drawMainArc()} />
                    <path fill={this.state.currentPercentage < 100 ? "orange" : "green"} className="progress-bar" d={this.drawProgressArc()} />
                    <text textAnchor="middle" stroke="white" className="progress-label" transform={`translate(0, 5)`}>{this.textHandler(this.state.currentPercentage ? this.state.currentPercentage : 0)}</text>
                </g>
                : ""
        )
    }
}

export default ProgressSpinner;