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

        this.state = {
            runId: props.runId,
            filename: props.filename,
            data: null,
            selectedKeys: null
        };
    }

    componentDidMount() {
        this.loadData()
    }

    async loadData() {
        //let data = await HierarchyService.getTreeNodes();
        this.hierarchy = await trackPromise(this.configurationService.getRunHierarchy(this.state.runId, this.state.filename));
        this.setTreeData([this.hierarchy]);
    }

    setTreeData(data) {
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

    handleButtonClick() {
        let data = cloneDeep(this.state.data)
        data[0].label = "Document Root"
        data[0].children = data[0].children.slice(1)
        this.setState({
            data: data
        });
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
                    <g transform={`translate(${window.innerWidth / 2}, 50)`}>
                        {links.map((link, i) => {
                            return (
                                <Link key={link.key} source={link.source} target={link.target} />
                            )
                        })}
                        {nodes.map((node, i) => {
                            return (
                                <Node key={node.key} label={node.data.name} transform={`translate(${node.x}, ${node.y})`} />
                            )
                        })}
                        {nodes.map((node, i) => {
                            return (
                                <ProgressSpinner key={`pb-${node.key}`} x={node.x} y={node.y} percentage={0} />
                            )
                        })}
                    </g>
                </svg>
            </div>
        )
    }
}

export default RunHierarchy;