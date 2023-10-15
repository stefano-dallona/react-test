import React, { Component, useState, useEffect } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { tree as d3tree, hierarchy } from 'd3-hierarchy';
import { select } from 'd3-selection';

class Node extends Component {
    constructor(props) {
        super(props)

        this.nodeId = props.nodeId
    }
    /*
    state = {
        label: this.props.label,
        transform: this.props.transform
    }
    */
    render() {
        return (
            <>
                <g
                    transform={this.props.transform}
                >
                    <circle
                        id={`n-${this.nodeId}`}
                        r="26"
                        fill="black"
                        onClick={() => { }}
                        onMouseOver={() => { }}
                        onMouseOut={() => { }}
                    ></circle>
                    <g className="rd3t-label">
                        <text textAnchor="middle" y={-40} fill={"#ffffff"} className="rd3t-label__title">
                            {this.props.label}
                        </text>
                    </g>
                </g>

            </>
        )
    }
}

export default Node;