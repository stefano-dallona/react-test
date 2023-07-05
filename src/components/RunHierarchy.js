import React, { Component, useState, useEffect } from 'react';
//import { Tree } from 'primereact/tree';
import cloneDeep from 'lodash/cloneDeep';
import { tree as d3tree, hierarchy } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { trackPromise } from 'react-promise-tracker';

import { ContextMenu } from 'primereact/contextmenu';

import Node from './Node'
import Link from './Link'
import ProgressSpinner from './ProgressSpinner'
import { ConfigurationService } from '../services/testbench-configuration-service';

var d3 = require("d3")

/*
const RunHierarchy = () => {
    const [nodes, setNodes] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState(null);
    
    useEffect(() => {
        HierarchyService.getTreeNodes().then((data) => setNodes(data));
    }, []);

    return (
        <div className="card flex justify-content-center">
            {JSON.stringify(nodes)}
        </div>
    )
}
*/

class RunHierarchy extends Component {
    constructor(props) {
        super(props);

        this.contextMenuRef = React.createRef(null)

        this.servicesContainer = props.servicesContainer

        this.progressBarRefs = new Map()

        this.onExecutionCompleted = props.onExecutionCompleted || this.executionCompletedDefaultHandler

        this.nodes = []
        this.links = []

        this.currentFileIndex = 0

        this.state = {
            runId: props.runId,
            filename: props.filename,
            data: null,
            selectedKeys: null
        };
    }

    componentDidMount() {
        this.loadData()
        this.initZoom()
        //setTimeout(() => { this.updateProgress(this.hierarchy.uuid, 50) }, 3000)
    }

    componentWillUnmount() {
        this.servicesContainer.configurationService.stopListeningForExecutionEvents()
    }

    async loadData(currentPercentage = 0) {
        this.hierarchy = await trackPromise(this.servicesContainer.configurationService.getRunHierarchy(this.state.runId, this.state.filename));
        let data = [this.hierarchy]
        //this.currentFileIndex = 0
        let [nodes, links] = this.generateTree(data)
        this.nodes = nodes
        this.links = links
        this.resetProgressBars(currentPercentage, false)
        this.setData(data);
    }

    setRunId(runId) {
        this.setState({
            runId: runId
        })
    }

    setFilename(filename, currentPercentage = 0, callback = () => {}) {
        this.setState({
            filename: filename
        }, async (currentPercentage) => {
            await this.loadData(currentPercentage)
            callback()
        })
    }

    setData(data) {
        this.setState({
            data: data
        });
    }

    generateTree(data) {
        const tree = d3tree().size([window.innerWidth, window.innerWidth / 3])
            .nodeSize([100, 100])
            .separation((a, b) => 2);

        const rootNode = tree(
            hierarchy(data[this.currentFileIndex] || [], d => d.children)
        );
        let nodes = rootNode.descendants();
        const links = rootNode.links();

        nodes.forEach((node, i) => {
            node.y = node.depth * 100 + 30//node.depth * 100;

            this.progressBarRefs.set(node.data.uuid, React.createRef())
        });
        
        return [nodes, links]
    }

    updateProgress(nodeId, progress) {
        let progressBarRef = this.progressBarRefs.get(nodeId)
        if (progressBarRef && progressBarRef.current) {
            progressBarRef.current.setCurrentPercentage(progress)
        }
        //localStorage.setItem(nodeId, progress)
    }

    resetProgressBars(percentage = 0, includeElaborationProgressBar = false) {
        if (includeElaborationProgressBar) {
            let progressBarRef = this.progressBarRefs.get(this.state.runId)
            if (progressBarRef.current) {
                progressBarRef.current.setCurrentPercentage(percentage)
            }
            //localStorage.setItem(this.state.runId, percentage)
        }
        /*
        this.progressBarRefs.forEach((progressBarRef) => {
            if (progressBarRef.current) {
                progressBarRef.current.setCurrentPercentage(percentage)
            }
        })
        */
        this.nodes.forEach((node) => {
            let progressBarRef = this.progressBarRefs.get(node.data.uuid)
            if (progressBarRef.current) {
                progressBarRef.current.setCurrentPercentage(percentage)
            }
            //localStorage.setItem(node.data.uuid, percentage)
        })
    }

    startListeningForExecutionEvents() {

        let progressCallback = async function (e) {
            let message = JSON.parse(e.data)

            if (!(message.nodeid == this.state.runId
                    || this.nodes.filter((node) => node.data.uuid == message.nodeid).length > 0)) {
                console.log("Event " + message.nodetype + " discarded due to node_id '" + message.nodeid + "' not found and not equal to run_id '" + this.state.runId + "'")
                return
            }

            console.log("nodetype: " + message.nodetype +
                ", nodeid: " + message.nodeid +
                ", currentPercentage: " + message.currentPercentage)

            this.updateProgress(message.nodeid, message.currentPercentage)
            //localStorage.setItem(message.nodeid, message.currentPercentage)
            /*
            if (message.nodetype == "RunExecution" && message.nodeid == this.state.runId) {
                this.servicesContainer.configurationService.stopListeningForExecutionEvents();
                this.resetProgressBars(100)
                this.onExecutionCompleted(this.state.runId)
            }
            */
            if (message.nodetype == "PLCTestbench") {
                if (message.currentPercentage < 100) {
                    let run = await this.servicesContainer.configurationService.getRun(this.state.runId)
                    let selectedInputFiles = run.selected_input_files
                    let currentFileIndex = Math.min(selectedInputFiles.length - 1, Math.ceil(selectedInputFiles.length * (message.currentPercentage / 100.0)))
                    //this.currentFileIndex = currentFileIndex
                    if (this.state.filename != selectedInputFiles[currentFileIndex]) {
                        this.resetProgressBars(0, false)
                        this.setFilename(selectedInputFiles[currentFileIndex])
                    }
                }
                 else {
                    this.servicesContainer.configurationService.stopListeningForExecutionEvents();
                    let run = await this.servicesContainer.configurationService.getRun(this.state.runId)
                    let selectedInputFiles = run.selected_input_files
                    this.setFilename(selectedInputFiles[selectedInputFiles.length - 1], 100)
                    this.onExecutionCompleted(this.state.runId)
                }
            }
        }
        this.servicesContainer.configurationService.startListeningForExecutionEvents(this.state.runId, this.state.runId, progressCallback.bind(this))
    }

    executionCompletedDefaultHandler() {
    }


    handleZoom() {
        let transform = d3.zoomTransform(this)
        transform.x = window.innerWidth / 2
        d3.select('#hierarchy').attr('transform', transform.toString());
    }

    initZoom() {
        let zoom = d3.zoom().on('zoom', this.handleZoom);
        d3.select('svg').call(zoom);
    }

    getMenuItems() {
        return [
            { label: 'Delete', icon: 'pi pi-fw pi-trash', severity: 'warning', command: () => { alert("Delete !") } }
        ]
    }

    render() {
        this.nodes.forEach((node, i) => { node.key = "node-" + i })
        this.links.forEach((link, i) => { link.key = "link-" + i })
        return (
            <div className="runHierarchy">
                <ContextMenu model={this.getMenuItems()} ref={this.contextMenuRef} />
                <svg
                    className="hierarchy"
                    width="100%"
                    height="500"
                >
                    <g>
                        {
                            (this.progressBarRefs.has(this.state.runId) || this.progressBarRefs.set(this.state.runId, React.createRef())) &&
                            <ProgressSpinner
                                ref={this.progressBarRefs.get(this.state.runId)}
                                key={`pb-${this.state.runId}`}
                                nodeId={this.state.runId}
                                x={150}
                                y={80}
                                r={30}
                                contextMenuRef={this.contextMenuRef}
                            />
                        }
                    </g>
                    <g id="hierarchy" transform={`translate(${window.innerWidth / 2}, 50)`}>
                        {this.links.map((link, i) => {
                            return (
                                <Link key={link.key} source={link.source} target={link.target} />
                            )
                        })}
                        {this.nodes.map((node, i) => {
                            return (
                                <Node key={node.key} nodeId={node.id} label={node.data.name} transform={`translate(${node.x}, ${node.y})`} />
                            )
                        })}
                        {this.nodes.map((node, i) => {
                            return (
                                <ProgressSpinner
                                    ref={this.progressBarRefs.get(node.data.uuid)}
                                    key={`pb-${node.key}`}
                                    nodeId={node.data.uuid}
                                    x={node.x}
                                    y={node.y}
                                    percentage={localStorage.getItem(node.data.uuid) || 0}
                                    contextMenuRef={this.contextMenuRef}
                                />
                            )
                        })}
                    </g>
                </svg>
            </div>
        )
    }
}

export default RunHierarchy;