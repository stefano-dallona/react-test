import React, { Component, useState, useEffect } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { tree as d3tree, hierarchy } from 'd3-hierarchy';
import { linkHorizontal, linkVertical } from 'd3-shape';
import { select } from 'd3-selection';

class Link extends Component {

    drawStraightPath(linkData, orientation) {
        const { source, target } = linkData;
        return orientation === 'horizontal'
            ? `M${source.y},${source.x}L${target.y},${target.x}`
            : `M${source.x},${source.y}L${target.x},${target.y}`;
    }

    drawDiagonalPath(linkData, orientation) {
        const { source, target } = linkData;
        return orientation === 'horizontal'
            ? linkHorizontal()({
                source: [source.y, source.x],
                target: [target.y, target.x],
            })
            : linkVertical()({
                source: [source.x, source.y],
                target: [target.x, target.y],
            });
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