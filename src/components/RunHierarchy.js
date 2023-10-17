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
        this.rightClickedNodeRef = React.createRef(null)

        this.servicesContainer = props.servicesContainer

        this.progressBarRefs = new Map()

        this.onRunLoaded = props.onRunLoaded || (() => { })
        this.onExecutionStarted = props.onExecutionStarted || (() => { })
        this.onExecutionCompleted = props.onExecutionCompleted || this.executionCompletedDefaultHandler

        this.nodes = []
        this.links = []

        this.run = null
        this.currentFileIndex = 0
        this.scaleFactor = null

        this.state = {
            executing: false,
            runId: props.runId,
            filename: props.filename,
            data: null,
            selectedKeys: null,
            runStatus: null
        };
    }

    async componentDidMount() {
        this.loadData()
        this.initZoom()
    }

    async componentDidUpdate() {
        this.zoomToFit()
    }

    componentWillUnmount() {
        this.servicesContainer.configurationService.stopListeningForExecutionEvents()
    }

    checkForRunningTask() {
        let task_id = localStorage.getItem("runExecution:" + this.state.runId)
        if (task_id) {
            if (this.run.status == "RUNNING") {
                if (!this.isExecuting()) {
                    this.startListeningForExecutionEvents(task_id)
                }
            } else {
                localStorage.removeItem("runExecution:" + this.state.runId)
            }
        }
    }

    async loadRun() {
        this.run = await this.servicesContainer.configurationService.getRun(this.state.runId)
        if (this.run) {
            this.setRunStatus(this.run.status)
            this.onRunLoaded(this.run)
        }
    }

    async loadData(currentPercentage = 0) {
        if (this.state.filename == "") {
            this.setCurrentFileIndex(0)
            await this.loadRun()
            this.checkForRunningTask()
        }
        this.hierarchy = await trackPromise(this.servicesContainer.configurationService.getRunHierarchy(this.state.runId, this.state.filename));
        let data = [this.hierarchy]
        let [nodes, links] = this.generateTree(data)
        this.nodes = nodes
        this.links = links
        this.resetProgressBars(currentPercentage, false)
        this.setData(data);
    }

    getCurrentFileIndex() {
        return this.currentFileIndex
    }

    setCurrentFileIndex(currentFileIndex) {
        this.currentFileIndex = currentFileIndex
    }

    isExecuting() {
        return this.state.executing
    }

    setExecuting(executing) {
        this.setState({
            executing: executing
        })
    }

    setRunId(runId) {
        this.setState({
            runId: runId
        })
    }

    setFilename(filename, currentPercentage = 0, callback = () => { }) {
        this.setState({
            filename: filename
        }, async () => {
            await this.loadData(currentPercentage)
            callback()
        })
    }

    setData(data) {
        this.setState({
            data: data
        });
    }

    setRunStatus(runStatus) {
        this.setState({
            runStatus: runStatus
        });
    }

    getScaleFactor() {
        return this.scaleFactor
    }

    //REFERENCE: https://gist.github.com/mootari/64ff2d2b0b68c7e1ae6c6475f1015e1c
    zoomToFit(transform = d3.zoomIdentity) {
        let svg = d3.select('svg').node()
        let hierarchy = d3.select('#hierarchy').node()
        if (!hierarchy || this.getScaleFactor()) {
            return
        }
        let box = hierarchy.getBBox()
        console.log("svg box: " + JSON.stringify(box))

        if (box.width > 0 && box.height > 0) {
            const scale = Math.min((svg.clientWidth) / box.width, svg.clientHeight / 1.5 / box.height);
            // Center [0, 0].
            transform = transform.translate(svg.clientWidth / 2, svg.clientHeight / 1.8);
            // Apply scale.
            transform = transform.scale(scale);
            // Center elements.
            transform = transform.translate(-box.x - box.width / 2, -box.y - box.height / 2);
            
            d3.select('#hierarchy').attr('transform', transform.toString());
            
            this.scaleFactor = scale
        }
    }

    generateTree(data) {
        const tree = d3tree().size([window.innerWidth, window.innerWidth / 3])
            .nodeSize([100, 100])
            .separation((a, b) => 2);

        const rootNode = tree(
            hierarchy(data[0] || [], d => d.children)
        );
        let nodes = rootNode.descendants();
        const links = rootNode.links();

        nodes.forEach((node, i) => {
            node.y = node.depth * 100 + 30//node.depth * 100;

            this.progressBarRefs.set(node.data.uuid, React.createRef())
        });

        links.forEach((link, i) => {
            //console.log(`link.id: ${link.source.data.uuid}`)
            link.uuid = link.target.data.uuid
        });

        return [nodes, links]
    }

    updateProgress(nodeId, progress, eta = 0) {
        let progressBarRef = this.progressBarRefs.get(nodeId)
        if (progressBarRef && progressBarRef.current) {
            progressBarRef.current.setCurrentPercentage(progress)
            progressBarRef.current.setEta(eta)

            if (nodeId === this.state.runId && progress > 0 && progress < 100) {
                let interval = setInterval(() => {
                    if (progressBarRef.current) {
                        progressBarRef.current.setEta(progressBarRef.current.state.eta > 0 ? progressBarRef.current.state.eta - 1 : 0)
                        if (!(progress > 0 && progress < 100)) {
                            clearInterval(interval)
                        }
                    }
                }, 1000)
            }
        }
        //localStorage.setItem(nodeId, progress)
    }

    resetProgressBars(percentage = 0, includeElaborationProgressBar = false) {
        if (includeElaborationProgressBar) {
            let progressBarRef = this.progressBarRefs.get(this.state.runId)
            if (progressBarRef.current) {
                progressBarRef.current.setCurrentPercentage(percentage)
                progressBarRef.current.setEta(0)
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
                progressBarRef.current.setEta(0)
            }
            //localStorage.setItem(node.data.uuid, percentage)
        })
    }

    estimateOverallEta(elapsedTime, currentPercentage) {
        if ((currentPercentage > 0 && currentPercentage < 100)) {
            let overall_eta = elapsedTime * (100 - currentPercentage) / currentPercentage
            return overall_eta
        } else {
            return 0
        }
    }

    startListeningForExecutionEvents(task_id) {
        this.setExecuting(true)
        this.onExecutionStarted()

        let selectedInputFiles = this.run.selected_input_files
        let startTime = null

        let progressCallback = async function (e) {
            if (!startTime) {
                startTime = Math.round(Date.now() / 1000)
            }
            let message = JSON.parse(e.data)

            if (message.task_id != localStorage.getItem("runExecution:" + this.state.runId)) {
                console.log("A spurious event " + message.nodetype + " was received not related to run_id '" + this.state.runId + "'")
                return
            }

            //if (message.nodetype == "DataManager") {
            //    if (message.progress.current_root_index != null && message.progress.current_root_index == this.currentFileIndex) {
            //if (message.nodetype == "OriginalTrackWorker") {
            if (message.progress.current_root_index != null && message.progress.current_root_index > this.getCurrentFileIndex()) {
                let newFileIndex = Math.min(selectedInputFiles.length, message.progress.current_root_index)
                this.setCurrentFileIndex(newFileIndex)
                let newFile = selectedInputFiles[newFileIndex]
                let progress = Math.floor(newFileIndex / selectedInputFiles.length * 100)
                let currentTime = Math.round(Date.now() / 1000)
                let overall_eta = this.estimateOverallEta(currentTime - startTime, progress)
                this.updateProgress(this.state.runId, progress, overall_eta)
                if (this.state.filename != newFile) {
                    this.resetProgressBars(0, false)
                    console.log(`Loading new file: ${newFile}, triggered by message with revision ${message.progress.revision}`)
                    this.setFilename(newFile)
                }
            }
            //}
            /*
            if (!(message.nodetype == "PLCTestbench" || message.nodeid == this.state.runId
                    || this.nodes.filter((node) => node.data.uuid == message.nodeid).length > 0)) {
                console.log("Event " + message.nodetype + " discarded due to node_id '" + message.nodeid + "' not found and not equal to run_id '" + this.state.runId + "'")
                return
            }
            */
            console.log("task_id: " + message.task_id +
                ", nodetype: " + message.nodetype +
                ", nodeid: " + message.nodeid +
                ", currentPercentage: " + message.currentPercentage,
                ", progress: " + message.progress)

            for (const [nodeid, pbRef] of this.progressBarRefs) {
                let progressMap = new Map(Object.entries(message.progress))
                if (!progressMap.get(nodeid) && (nodeid != this.state.runId || message.progress.current_root_index == 0)) {
                    this.updateProgress(nodeid, 0, 0)
                }
            }
            for (const [nodeid, currentPercentage] of Object.entries(message.progress).filter(([key, value]) => {
                return this.progressBarRefs.get(key) != null
            })) {
                this.updateProgress(nodeid, currentPercentage, message.eta)
            }

            //localStorage.setItem(message.nodeid, message.currentPercentage)
            /*
            if (message.nodetype == "RunExecution" && message.nodeid == this.state.runId) {
                this.servicesContainer.configurationService.stopListeningForExecutionEvents();
                this.resetProgressBars(100)
                this.onExecutionCompleted(this.state.runId)
            }
            */
            if (message.nodetype === "RunExecution" && this.isExecuting()) {
                this.loadData()
                this.initZoom()
                this.setExecuting(false)
                this.servicesContainer.configurationService.stopListeningForExecutionEvents();
                let lastFile = selectedInputFiles[selectedInputFiles.length - 1]
                if (this.state.filename !== lastFile) {
                    this.setFilename(lastFile, 100)
                }
                if (message.success !== 'true') {
                    this.setRunStatus('FAILED')
                    this.loadRun()
                } else {
                    this.setRunStatus('COMPLETED')
                }
                this.onExecutionCompleted(this.state.runId, task_id, message.success, message.errorMessage)
            }
        }
        this.servicesContainer.configurationService.startListeningForExecutionEvents(this.state.runId, this.state.runId, progressCallback.bind(this), task_id)
    }

    executionCompletedDefaultHandler() {
    }


    handleZoom() {
        let transform = d3.zoomTransform(this)

        let svg = d3.select('svg').node()
        let hierarchy = d3.select('#hierarchy')
        let box = hierarchy.node().getBBox()
        const scale = Math.min((svg.clientWidth - 80) / box.width, svg.clientHeight / 1.5 / box.height);
        transform = transform.translate(svg.clientWidth / 2, svg.clientHeight / 1.8);
        transform = transform.scale(scale);
        transform = transform.translate(-box.x - box.width / 2, -box.y - box.height / 2);
        //transform.x = window.innerWidth / 2

        hierarchy.attr('transform', transform.toString());
    }

    initZoom() {
        d3.select('#hierarchy').attr('transform')
        let zoom = d3.zoom().on('zoom', this.handleZoom);
        d3.select('svg').call(zoom);
    }

    async deleteNode(run_id, node_id) {
        let deleteResult = await this.servicesContainer.configurationService.deleteRunNode(run_id, node_id)
        if (deleteResult) {
            await this.loadData()
        }
    }

    getMenuItems() {
        return [
            {
                label: 'Delete', icon: 'pi pi-fw pi-trash', severity: 'warning', command: (e) => {
                    if (this.rightClickedNodeRef.current) {
                        let node_id = this.rightClickedNodeRef.current
                        this.deleteNode(this.state.runId, node_id)
                    }
                }
            }
        ]
    }

    handleContextMenu(e) {
        if (this.isExecuting()) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Execution in progress. Context menu is disabled.")
        }
        /*
        alert(e.clientX + "," + e.clientY)
        */
    }

    rightClickHandler(node_id) {
        console.log("Click on node " + node_id)
        this.rightClickedNodeRef.current = node_id
    }

    overallProgressTextHandler(currentPercentage) {
        if (!this.run) {
            return ""
        }
        let currentFileIndex = currentPercentage < 100 ? this.currentFileIndex : this.run.selected_input_files.length
        let totalFiles = this.run.selected_input_files.length
        return `${currentFileIndex} of ${totalFiles}`
    }

    getRunStatusColor() {
        let color = 'yellow'

        if (this.run) {
            switch (this.run.status) {
                case "COMPLETED":
                    color = 'green'
                    break;
                case "FAILED":
                    color = 'red'
                    break;
                case "CREATED":
                    color = 'white'
                    break;
                default:
            }
        }
        return color
    }

    render() {
        return (
            <div className="runHierarchy">
                <svg
                    id="runHierarchy"
                    className="hierarchy"
                    width="100%"
                    height="500"
                    onContextMenu={this.handleContextMenu.bind(this)}>
                    <text visibility={this.isExecuting() ? 'hidden' : 'visible'}
                        textAnchor="middle"
                        stroke={this.getRunStatusColor()}
                        className="hierarchy-title"
                        transform={`translate(${window.innerWidth / 2}, 20)`}>Current status: {this.run ? `${this.run.status}` : ""}</text>
                    <ContextMenu model={this.getMenuItems()} ref={this.contextMenuRef} />
                    <g>
                        {
                            (this.progressBarRefs.has(this.state.runId) || this.progressBarRefs.set(this.state.runId, React.createRef())) &&
                            <ProgressSpinner
                                ref={this.progressBarRefs.get(this.state.runId)}
                                key={`pb-${this.state.runId}`}
                                title="Files processed"
                                visibilityHandler={() => { return !this.isExecuting() ? 'hidden' : 'visible' }}
                                nodeId={this.state.runId}
                                tooltip={this.state.runId}
                                x={150}
                                y={150}
                                r={30}
                                textHandler={this.overallProgressTextHandler.bind(this)}
                                contextMenuRef={this.contextMenuRef}
                                rightClickHandler={(node_id) => { this.rightClickHandler(node_id) }}
                            />
                        }
                    </g>
                    <g filename={this.state.filename} id="hierarchy" transform={`translate(${window.innerWidth / 2}, 50)`}>
                        {this.links.map((link, i) => {
                            return (
                                <Link key={link.uuid} source={link.source} target={link.target} />
                            )
                        })}
                        {this.nodes.map((node, i) => {
                            return (
                                <Node key={node.data.uuid} nodeId={node.data.uuid} label={node.data.name} transform={`translate(${node.x}, ${node.y})`} />
                            )
                        })}
                        {this.nodes.map((node, i) => {
                            return (
                                <ProgressSpinner
                                    ref={this.progressBarRefs.get(node.data.uuid)}
                                    key={`pb-${node.data.uuid}`}
                                    node={node.data}
                                    nodeId={node.data.uuid}
                                    tooltip={node.data.uuid}
                                    x={node.x}
                                    y={node.y}
                                    percentage={localStorage.getItem(node.data.uuid) || 0}
                                    contextMenuRef={this.contextMenuRef}
                                    textHandler={(currentPercentage) => { return currentPercentage > 0 && currentPercentage < 100 ? `${currentPercentage} %` : "" }}
                                    rightClickHandler={(node_id) => { this.rightClickHandler(node_id) }}
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