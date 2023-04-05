import React, { Component, useState, useEffect } from 'react';
//import { Tree } from 'primereact/tree';
import cloneDeep from 'lodash/cloneDeep';
import { tree as d3tree, hierarchy } from 'd3-hierarchy';
import { select } from 'd3-selection';
import Node from './Node'
import Link from './Link'
import ProgressSpinner from './ProgressSpinner'
import { HierarchyService } from '../services/HierarchyService'

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

        this.state = {
            runId: props.runId,
            data: null,
            selectedKeys: null
        };
    }

    componentDidMount() {
        this.loadData()
    }

    async loadData() {
        let data = await HierarchyService.getTreeNodes();
        this.setTreeData(data);
    }

    setTreeData(data) {
        this.setState({
            data: data
        });
    }

    generateTree() {
        if (!this.state.data) return [[], []]
        const tree = d3tree().size([1000, 1000])
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
                    <g transform={`translate(500, 50)`}>
                        {links.map((link, i) => {
                            return (
                                <Link key={link.key} source={link.source} target={link.target} />
                            )
                        })}
                        {nodes.map((node, i) => {
                            return (
                                <Node key={node.key} label={node.data.label} transform={`translate(${node.x}, ${node.y})`} />
                            )
                        })}
                        <ProgressSpinner x={0} y={30} percentage={0}/>
                    </g>
                </svg>
                <button onClick={this.handleButtonClick.bind(this)} />
            </div>
        )
    }
}

export default RunHierarchy;