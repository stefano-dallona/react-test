import React, { Component } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { arc as d3arc, style } from 'd3';


class ProgressSpinner extends Component {

    constructor(props) {
        super(props);

        this.contextMenuRef = props.contextMenuRef || null

        this.state = {
            nodeId: props.nodeId || "",
            currentPercentage: props.percentage || 0,
            x: props.x || 0,
            y: props.y || 0,
            r: props.r || 10
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
    }

    setCurrentPercentage(percentage) {
        this.setState({
            currentPercentage: Math.min(percentage, 100)
        });
    }

    drawMainArc() {
        const outerRadius = this.state.r * 2;
        const thickness = outerRadius / 5;

        const mainArc = d3arc()
            .startAngle(0)
            .endAngle(Math.PI * 2)
            .innerRadius(outerRadius - thickness)
            .outerRadius(outerRadius)

        return mainArc()
    }

    drawProgressArc() {
        const outerRadius = this.state.r * 2;
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
        if (this.contextMenuRef && this.contextMenuRef.current) {
            this.contextMenuRef.current.show(e)
        }
    }

    render() {
        return (
            <g id={`pb-${this.state.nodeId}`}
                style={{cursor: 'pointer'}}
                transform={`translate(${this.state.x}, ${this.state.y})`}
                onContextMenu={(e) => { this.handleContextMenu(e) }}>
                <path fill="red" className="progress-bar-bg" d={this.drawMainArc()} />
                <path fill="blue" className="progress-bar" d={this.drawProgressArc()} />
                <text stroke="white" className="progress-label" transform={`translate(-11, 5)`}>{this.state.currentPercentage}</text>
            </g>
        )
    }
}

export default ProgressSpinner;