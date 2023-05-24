import React, { Component } from 'react';

// >>>
//import { Utils as QbUtils, Query, Builder, BasicConfig } from 'react-awesome-query-builder';
import { Utils as QbUtils, Query, Builder, MuiConfig } from '@react-awesome-query-builder/mui';
import '@react-awesome-query-builder/mui/css/styles.css';
import loadedInitValue from '../assets/query-builder-init-values'
import loadedInitLogic from '../assets/query-builder-init-logic'

import moment from "moment";

const { elasticSearchFormat, queryBuilderFormat, jsonLogicFormat, queryString, _mongodbFormat, _sqlFormat, _spelFormat, getTree, checkTree, loadTree, uuid, loadFromJsonLogic, loadFromSpel, isValidTree } = QbUtils;
const emptyInitValue = { "id": QbUtils.uuid(), "type": "group" };
let initValue = loadedInitValue && Object.keys(loadedInitValue).length > 0 ? loadedInitValue : emptyInitValue;
const initLogic = loadedInitLogic && Object.keys(loadedInitLogic).length > 0 ? loadedInitLogic : undefined;
const InitialConfig = MuiConfig;
let initTree = checkTree(loadTree(initValue), InitialConfig);
//let initTree = checkTree(loadFromJsonLogic(initLogic, InitialConfig), InitialConfig);
// <<<


// You need to provide your own config. See below 'Config format'

const demoListValues = [
    { title: "A", value: "a" },
    { title: "AA", value: "aa" },
    { title: "AAA1", value: "aaa1" },
    { title: "AAA2", value: "aaa2" },
    { title: "B", value: "b" },
    { title: "C", value: "c" },
    { title: "D", value: "d" },
    { title: "E", value: "e" },
    { title: "F", value: "f" },
    { title: "G", value: "g" },
    { title: "H", value: "h" },
    { title: "I", value: "i" },
    { title: "J", value: "j" },
];
const { simulateAsyncFetch } = QbUtils.Autocomplete;
const simulatedAsyncFetch = simulateAsyncFetch(demoListValues, 3);

const fields = {
    user: {
        label: "User",
        tooltip: "Group of fields",
        type: "!struct",
        subfields: {
            firstName: {
                label2: "Username", //only for menu's toggler
                type: "text",
                fieldSettings: {
                    validateValue: (val, fieldSettings) => {
                        return (val.length < 10);
                    },
                },
                mainWidgetProps: {
                    valueLabel: "Name",
                    valuePlaceholder: "Enter name",
                },
            },
            login: {
                type: "text",
                tableName: "t1", // legacy: PR #18, PR #20
                fieldSettings: {
                    validateValue: (val, fieldSettings) => {
                        return (val.length < 10 && (val === "" || val.match(/^[A-Za-z0-9_-]+$/) !== null));
                    },
                },
                mainWidgetProps: {
                    valueLabel: "Login",
                    valuePlaceholder: "Enter login",
                },
            }
        }
    },
    bio: {
        label: "Bio",
        type: "text",
        preferWidgets: ["textarea"],
        fieldSettings: {
            maxLength: 1000,
        }
    },
    results: {
        label: "Results",
        type: "!group",
        subfields: {
            product: {
                type: "select",
                fieldSettings: {
                    listValues: ["abc", "def", "xyz"],
                },
                valueSources: ["value"],
            },
            score: {
                type: "number",
                fieldSettings: {
                    min: 0,
                    max: 100,
                },
                valueSources: ["value"],
            }
        }
    },
    cars: {
        label: "Cars",
        type: "!group",
        mode: "array",
        conjunctions: ["AND", "OR"],
        showNot: true,
        operators: [
            // w/ operand - count
            "equal",
            "not_equal",
            "less",
            "less_or_equal",
            "greater",
            "greater_or_equal",
            "between",
            "not_between",

            // w/o operand
            "some",
            "all",
            "none",
        ],
        defaultOperator: "some",
        initialEmptyWhere: true, // if default operator is not in config.settings.groupOperators, true - to set no children, false - to add 1 empty

        subfields: {
            vendor: {
                type: "select",
                fieldSettings: {
                    listValues: ["Ford", "Toyota", "Tesla"],
                },
                valueSources: ["value"],
            },
            year: {
                type: "number",
                fieldSettings: {
                    min: 1990,
                    max: 2021,
                },
                valueSources: ["value"],
            }
        }
    },
    prox1: {
        label: "prox",
        tooltip: "Proximity search",
        type: "text",
        operators: ["proximity"],
    },
    num: {
        label: "Number",
        type: "number",
        preferWidgets: ["number"],
        fieldSettings: {
            min: -1,
            max: 5
        },
        funcs: ["LINEAR_REGRESSION"],
    },
    slider: {
        label: "Slider",
        type: "number",
        preferWidgets: ["slider", "rangeslider"],
        valueSources: ["value", "field"],
        fieldSettings: {
            min: 0,
            max: 100,
            step: 1,
            marks: {
                0: <strong>0%</strong>,
                100: <strong>100%</strong>
            },
            validateValue: (val, fieldSettings) => {
                return (val < 50 ? null : "Invalid slider value, see validateValue()");
            },
        },
        //overrides
        widgets: {
            slider: {
                widgetProps: {
                    valuePlaceholder: "..Slider",
                }
            },
            rangeslider: {
                widgetProps: {
                    valueLabels: [
                        { label: "Number from", placeholder: "from" },
                        { label: "Number to", placeholder: "to" },
                    ],
                }
            },
        },
    },
    date: {
        label: "Date",
        type: "date",
        valueSources: ["value"],
        fieldSettings: {
            dateFormat: "DD-MM-YYYY",
            validateValue: (val, fieldSettings) => {
                // example of date validation
                const dateVal = moment(val, fieldSettings.valueFormat);
                return dateVal.year() != (new Date().getFullYear()) ? "Please use current year" : null;
            },
        },
    },
    time: {
        label: "Time",
        type: "time",
        valueSources: ["value"],
        defaultOperator: "between",
    },
    datetime: {
        label: "DateTime",
        type: "datetime",
        valueSources: ["value", "func"]
    },
    datetime2: {
        label: "DateTime2",
        type: "datetime",
        valueSources: ["field"]
    },
    color: {
        label: "Color",
        type: "select",
        valueSources: ["value"],
        fieldSettings: {
            showSearch: true,
            // * old format:
            // listValues: {
            //     yellow: 'Yellow',
            //     green: 'Green',
            //     orange: 'Orange'
            // },
            // * new format:
            listValues: [
                { value: "yellow", title: "Yellow" },
                { value: "green", title: "Green" },
                { value: "orange", title: "Orange" }
            ],
        },
    },
    color2: {
        label: "Color2",
        type: "select",
        fieldSettings: {
            listValues: {
                yellow: "Yellow",
                green: "Green",
                orange: "Orange",
                purple: "Purple"
            },
        }
    },
    multicolor: {
        label: "Colors",
        type: "multiselect",
        fieldSettings: {
            showSearch: true,
            listValues: {
                yellow: "Yellow",
                green: "Green",
                orange: "Orange"
            },
            allowCustomValues: true,
        }
    },
    selecttree: {
        label: "Color (tree)",
        type: "treeselect",
        fieldSettings: {
            treeExpandAll: true,
            // * deep format (will be auto converted to flat format):
            // treeValues: [
            //     { value: "1", title: "Warm colors", children: [
            //         { value: "2", title: "Red" },
            //         { value: "3", title: "Orange" }
            //     ] },
            //     { value: "4", title: "Cool colors", children: [
            //         { value: "5", title: "Green" },
            //         { value: "6", title: "Blue", children: [
            //             { value: "7", title: "Sub blue", children: [
            //                 { value: "8", title: "Sub sub blue and a long text" }
            //             ] }
            //         ] }
            //     ] }
            // ],
            // * flat format:
            treeValues: [
                { value: "1", title: "Warm colors" },
                { value: "2", title: "Red", parent: "1" },
                { value: "3", title: "Orange", parent: "1" },
                { value: "4", title: "Cool colors" },
                { value: "5", title: "Green", parent: "4" },
                { value: "6", title: "Blue", parent: "4" },
                { value: "7", title: "Sub blue", parent: "6" },
                { value: "8", title: "Sub sub blue and a long text", parent: "7" },
            ],
        }
    },
    multiselecttree: {
        label: "Colors (tree)",
        type: "treemultiselect",
        fieldSettings: {
            treeExpandAll: true,
            treeValues: [
                {
                    value: "1", title: "Warm colors", children: [
                        { value: "2", title: "Red" },
                        { value: "3", title: "Orange" }
                    ]
                },
                {
                    value: "4", title: "Cool colors", children: [
                        { value: "5", title: "Green" },
                        {
                            value: "6", title: "Blue", children: [
                                {
                                    value: "7", title: "Sub blue", children: [
                                        { value: "8", title: "Sub sub blue and a long text" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    autocomplete: {
        label: "Autocomplete",
        type: "select",
        valueSources: ["value"],
        fieldSettings: {
            asyncFetch: simulatedAsyncFetch,
            useAsyncSearch: true,
            useLoadMore: true,
            forceAsyncSearch: false,
            allowCustomValues: false
        },
    },
    autocompleteMultiple: {
        label: "AutocompleteMultiple",
        type: "multiselect",
        valueSources: ["value"],
        fieldSettings: {
            asyncFetch: simulatedAsyncFetch,
            useAsyncSearch: true,
            useLoadMore: true,
            forceAsyncSearch: false,
            allowCustomValues: false
        },
    },
    stock: {
        label: "In stock",
        type: "boolean",
        defaultValue: true,
        mainWidgetProps: {
            labelYes: "+",
            labelNo: "-"
        }
    },
};

const config = {
    ...InitialConfig,
    fields: fields
};

// You can load query value from your backend storage (for saving see `Query.onChange()`)
const queryValue = emptyInitValue


class RunAwesomeQueryBuilder extends Component {
    state = {
        tree: initTree,
        config: config
    };

    render = () => (
        <div>
            <Query
                {...config}
                value={this.state.tree}
                onChange={this.onChange}
                renderBuilder={this.renderBuilder}
            />
            {this.renderResult(this.state)}
        </div>
    )

    renderBuilder = (props) => (
        <div className="query-builder-container" style={{ padding: '10px' }}>
            <div className="query-builder qb-lite">
                <Builder {...props} />
            </div>
        </div>
    )

    renderResult = ({ tree: immutableTree, config }) => (
        <div className="query-builder-result">
            <div>MongoDb query: <pre>{JSON.stringify(QbUtils.mongodbFormat(immutableTree, config))}</pre></div>
        </div>
    )

    onChange = (immutableTree, config) => {
        // Tip: for better performance you can apply `throttle` - see `examples/demo`
        this.setState({ tree: immutableTree, config: config });

        const jsonTree = QbUtils.getTree(immutableTree);
        console.log(jsonTree);
        // `jsonTree` can be saved to backend, and later loaded to `queryValue`
    }
}
export default RunAwesomeQueryBuilder;