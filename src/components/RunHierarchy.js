import React, { Component, useState, useEffect } from 'react';
//import { Tree } from 'primereact/tree';
import cloneDeep from 'lodash/cloneDeep';
import { tree as d3tree, hierarchy } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { trackPromise } from 'react-promise-tracker';

import Node from './Node'
import Link from './Link'
import ProgressSpinner from './ProgressSpinner'
import { ConfigurationService } from '../services/testbench-configuration-service';

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

        let baseUrl = "http://localhost:5000"
        this.configurationService = new ConfigurationService(baseUrl)

        this.progressBarRefs = new Map()

        this.onExecutionCompleted = props.onExecutionCompleted || this.executionCompletedDefaultHandler

        this.state = {
            runId: props.runId,
            filename: props.filename,
            data: null,
            selectedKeys: null
        };
    }

    componentDidMount() {
        this.loadData()
        //setTimeout(() => { this.updateProgress(this.hierarchy.uuid, 50) }, 3000)
    }

    async loadData() {
        this.hierarchy = await trackPromise(this.configurationService.getRunHierarchy(this.state.runId, this.state.filename));
        this.setData([this.hierarchy]);
    }

    setRunId(runId) {
        this.setState({
            runId: runId
        })
    }

    setFilename(filename) {
        this.setState({
            filename: filename
        }, this.loadData)
    }

    setData(data) {
        this.setState({
            data: data
        });
    }

    generateTree() {
        if (!this.state.data) return [[], []]
        const tree = d3tree().size([window.innerWidth, window.innerWidth / 3])
            .nodeSize([100, 100])
            .separation((a, b) => 2);

        const rootNode = tree(
            hierarchy(this.state.data[0] || [], d => d.children)
        );
        let nodes = rootNode.descendants();
        const links = rootNode.links();

        nodes.forEach((node, i) => {
            node.y = node.depth * 100 + 30//node.depth * 100;
        });

        return [nodes, links]
    }

    updateProgress(nodeId, progress) {
        let progressBarRef = this.progressBarRefs.get(nodeId)
        if (progressBarRef && progressBarRef.current) {
            progressBarRef.current.setCurrentPercentage(progress)
        }
    }

    resetProgressBars(percentage = 0) {
        this.progressBarRefs.forEach((progressBar, nodeId) => {
            if (progressBar.current) {
                progressBar.current.setCurrentPercentage(percentage)
            }
            localStorage.setItem(nodeId, percentage)
        })
    }

    startListeningForExecutionEvents() {
        let progressCallback = async function (e) {
            let message = JSON.parse(e.data)
            this.updateProgress(message.nodeid, message.currentPercentage)
            localStorage.setItem(message.nodeid, message.currentPercentage)

            if (message.nodetype == "RunExecution" && message.nodeid == this.state.runId) {
                this.resetProgressBars(100)
                this.configurationService.stopListeningForExecutionEvents();
            }
            if (message.nodetype == "ECCTestbench") {
                this.updateProgress(message.nodeid, message.currentPercentage)
                localStorage.setItem(message.nodeid, message.currentPercentage)
                let run = await this.configurationService.getRun(this.state.runId)
                let selectedInputFiles = run.selected_input_files
                let newFileIndex = Math.min(selectedInputFiles.length - 1, Math.ceil(selectedInputFiles.length * (message.currentPercentage / 100.0)))
                if (this.state.filename != selectedInputFiles[newFileIndex]) {
                    this.setFilename(selectedInputFiles[newFileIndex])
                } else {
                    this.resetProgressBars(100)
                }
            }
        }
        this.configurationService.startListeningForExecutionEvents(this.state.runId, this.state.runId, progressCallback.bind(this))
    }

    executionCompletedDefaultHandler() {
    }

    render() {
        let [nodes, links] = this.generateTree()
        nodes.forEach((node, i) => { node.key = "node-" + i })
        links.forEach((link, i) => { link.key = "link-" + i })
        return (
            <div className="runHierarchy">
                <svg
                    className="hierarchy"
                    width="100%"
                    height="500"
                >
                    <g>
                        {
                            (this.progressBarRefs.has(this.state.runId) || this.progressBarRefs.set(this.state.runId, React.createRef())) &&
                            <ProgressSpinner ref={this.progressBarRefs.get(this.state.runId)} key={`pb-${this.state.runId}`} nodeId={this.state.runId} x={150} y={80} r={30} percentage={0} />
                        }
                    </g>
                    <g transform={`translate(${window.innerWidth / 2}, 50)`}>
                        {links.map((link, i) => {
                            return (
                                <Link key={link.key} source={link.source} target={link.target} />
                            )
                        })}
                        {nodes.map((node, i) => {
                            return (
                                <Node key={node.key} nodeId={node.id} label={node.data.name} transform={`translate(${node.x}, ${node.y})`} />
                            )
                        })}
                        {nodes.map((node, i) => {
                            if (!this.progressBarRefs.has(node.data.uuid)) {
                                this.progressBarRefs.set(node.data.uuid, React.createRef())
                            }
                            this.updateProgress(node.data.uuid, 0)
                            return (
                                <ProgressSpinner ref={this.progressBarRefs.get(node.data.uuid)} key={`pb-${node.key}`} nodeId={node.data.uuid} x={node.x} y={node.y} percentage={0} />
                            )
                        })}
                    </g>
                </svg>
            </div>
        )
    }
}

export default RunHierarchy;