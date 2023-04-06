import React, { Component, useState, useEffect } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import * as d3 from 'd3'

class Link extends Component {

    drawStraightPath(linkData, orientation) {
        const { source, target } = linkData;
        return orientation === 'horizontal'
            ? `M${source.y},${source.x}L${target.y},${target.x}`
            : `M${source.x},${source.y}L${target.x},${target.y}`;
    }

    diagonal(s, d) {
        let path = `M ${s.y} ${s.x}
    C ${(s.y + d.y) / 2} ${s.x},
      ${(s.y + d.y) / 2} ${d.x},
      ${d.y} ${d.x}`

        return path
    }
    /*
    drawDiagonalPath(linkData, orientation) {
        const { source, target } = linkData;
        return orientation === 'horizontal'
            ? d3.linkHorizontal()({
                source: [source.y, source.x],
                target: [target.y, target.x],
            })
            : d3.linkVertical()({
                source: [source.x, source.y],
                target: [target.x, target.y],
            });
    }
    */
    drawDiagonalPath(linkData, orientation) {
        const { source, target } = linkData;
        var s = (orientation == 'vertical') ? { x: source.y, y: source.x } : { x: source.x, y: source.y }
        var d = (orientation == 'vertical') ? { x: target.y, y: target.x } : { x: target.x, y: target.y }
        return this.diagonal(s, d)
    }

    render() {
        return (
            <path
                stroke="white"
                fill="none"
                d={this.drawDiagonalPath(this.props, 'vertical')}
            />
        );
    }
}

export default Link;