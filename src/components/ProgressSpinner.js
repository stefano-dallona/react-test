import React, { Component } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { arc as d3arc, style } from 'd3';

import { Tooltip } from 'primereact/tooltip'


class ProgressSpinner extends Component {

    constructor(props) {
        super(props);

        this.contextMenuRef = props.contextMenuRef || null

        this.state = {
            nodeId: props.nodeId || "",
            currentPercentage: props.percentage || 0,
            eta: 0,
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

    formatTime(timeInSeconds) {
        let hours = Math.floor(timeInSeconds / (60 * 60))
        let minutes = Math.floor(timeInSeconds / 60)
        let seconds = Math.floor(timeInSeconds % 60)
        let formattedTime = `${hours > 0 ? hours + "h" : ""} ${minutes > 0 ? minutes + "m" : ""} ${seconds > 0 ? seconds + "s" : ""}`
        return (formattedTime !== "") ? formattedTime : "0s"
    }

    render() {
        return (
            <g id={`pb-${this.state.nodeId}`}
                style={{cursor: 'pointer'}}
                transform={`translate(${this.state.x}, ${this.state.y})`}
                onContextMenu={(e) => { this.handleContextMenu(e) }}>
                <Tooltip target={`#pb-${this.state.nodeId}`} updateDelay={1000}>
                    <span>node id: {this.state.nodeId}</span><br/>
                    <span
                        hidden={(this.state.currentPercentage === 0 || this.state.currentPercentage === 100)}>
                            {this.state.eta > 0 ? `ETA: ${ this.formatTime(this.state.eta) }` : ""}</span><br/>
                </Tooltip>
                <path fill="white" className="progress-bar-bg" d={this.drawMainArc()} />
                <path fill="green" className="progress-bar" d={this.drawProgressArc()} />
                <text textAnchor="middle" stroke="white" className="progress-label" transform={`translate(0, 5)`}>{this.state.currentPercentage}</text>
            </g>
        )
    }
}

export default ProgressSpinner;