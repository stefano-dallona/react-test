import React, { Component } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { arc as d3arc, style } from 'd3';

import { Tooltip } from 'primereact/tooltip'


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
        return (<table width="100%">
            {
                Object.keys(data).filter((key) => {
                    return key !== 'ETA' || (this.state.currentPercentage > 0 && this.state.currentPercentage < 100)
                }).map((key) => {
                    return (
                        <tr><td><b>{key}:</b></td><td>{data[key]}</td></tr>
                    )
                })
            }
        </table>)
    }

    render() {
        return (
            this.visibilityHandler() === 'visible' ?
                <g id={`pb-${this.state.nodeId}`}
                    style={{ cursor: 'pointer' }}
                    transform={`translate(${this.state.x}, ${this.state.y})`}
                    onContextMenu={(e) => { this.handleContextMenu(e) }}>
                    <Tooltip target={`#pb-${this.state.nodeId}`} updateDelay={1000}>
                        {this.getTooltip()}
                    </Tooltip>
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