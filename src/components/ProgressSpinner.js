import React, { Component } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { arc as d3arc } from 'd3';

/*

        function radialProgress(selector) {
            const parent = d3.select(selector)
    
            if (!parent._groups[0][0]) return

            var x = parent._groups[0][0].childNodes[0].cx.baseVal.value
            var y = parent._groups[0][0].childNodes[0].cy.baseVal.value
            var r = parent._groups[0][0].childNodes[0].r.baseVal.value
    
            const size = { "x": x, "y": y, "width": r * 2, "height": r * 2 }
            console.log(`x:${size.x},y:${size.y}`)
    
            const outerRadius = size.height;
            const thickness = size.height / 5;
            let value = 0;
    
            let group = parent.append("g")
                .attr("id", "pbg-" + selector.replaceAll("#pb-", ""));

            const mainArc = d3.arc()
                .startAngle(0)
                .endAngle(Math.PI * 2)
                .innerRadius(outerRadius - thickness)
                .outerRadius(outerRadius)
    
            group.append("path")
                .attr('class', 'progress-bar-bg')
                .attr('transform', `translate(${size.x},${size.y})`)
                .attr('d', mainArc())
    
            const mainArcPath = group.append("path")
                .attr('class', 'progress-bar')
                .attr('transform', `translate(${size.x},${size.y})`)
    
            let percentLabel = group.append("text")
                .attr('class', 'progress-label')
                .attr('transform', `translate(${size.x},${size.y})`)
                .text('0')
            
            let id = selector
    
            return {
                update: function (progressPercent) {
                    const lid = id
                    const startValue = value
                    const startAngle = Math.PI * startValue / 50
                    const angleDiff = Math.PI * progressPercent / 50 - startAngle;
                    const startAngleDeg = startAngle / Math.PI * 180
                    const angleDiffDeg = angleDiff / Math.PI * 180
                    const transitionDuration = 0
    
                    mainArcPath.transition().duration(transitionDuration).attrTween('d', function () {
                        return function (t) {
                            mainArc.endAngle(startAngle + angleDiff * t)
                            return mainArc();
                        }
                    })
    
                    percentLabel.transition().duration(transitionDuration).tween('bla', function () {
                        return function (t) {
                            percentLabel.text(Math.round(startValue + (progressPercent - startValue) * t));
                        }
                    })
    
                    value = progressPercent
                }
            }
        }

*/

class ProgressSpinner extends Component {

    constructor(props) {
        super(props);

        this.state = {
            nodeId: props.runId || "",
            currentPercentage: props.percentage || 0,
            x: props.x || 0,
            y: props.y || 0,
            r: props.r || 10
        };
    }

    componentDidMount() {
        async function simulateProgress() {
            while(this.state.currentPercentage < 100) {
                setTimeout(() => {this.updateProgress(this.state.currentPercentage + 1)}, 50)
                await new Promise(r => setTimeout(r, 60))
            }
        }

        simulateProgress.bind(this)()
    }

    updateProgress(percentage) {
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

    render() {
        return (
            <g id={`pb-${this.state.nodeId}`} transform={`translate(${this.state.x}, ${this.state.y})`}>
                <path fill="red" className="progress-bar-bg" d={this.drawMainArc()} />
                <path fill="blue" className="progress-bar" d={this.drawProgressArc()} />
                <text stroke="white" className="progress-label" transform={`translate(-11, 5)`}>{this.state.currentPercentage}</text>
            </g>
        )
    }
}

export default ProgressSpinner;