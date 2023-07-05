import React, { Component } from 'react';

// >>>
//import { Utils as QbUtils, Query, Builder, BasicConfig } from 'react-awesome-query-builder';
import { Utils as QbUtils, Query, Builder, MuiConfig } from '@react-awesome-query-builder/mui';
import '@react-awesome-query-builder/mui/css/styles.css';
import loadedInitValue from '../assets/query-builder-init-values'
import loadedInitLogic from '../assets/query-builder-init-logic'

import moment from "moment";

import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tooltip } from 'primereact/tooltip';

const { elasticSearchFormat, queryBuilderFormat, jsonLogicFormat, queryString, _mongodbFormat, _sqlFormat, _spelFormat, getTree, checkTree, loadTree, uuid, loadFromJsonLogic, loadFromSpel, isValidTree } = QbUtils;
const emptyInitValue = { "id": QbUtils.uuid(), "type": "group" };
let initValue = loadedInitValue && Object.keys(loadedInitValue).length > 0 ? loadedInitValue : emptyInitValue;

const path = "C:\\Data\\personale\\Università\\2022-2023\\original_tracks\\6cf51cbb-6a0f-4e49-985e-6b55c1aa1f7d\\"
// You can load query value from your backend storage (for saving see `Query.onChange()`)
initValue = {
    "type": "group",
    "id": "9a99988a-0123-4456-b89a-b1607f326fd8",
    "children1": [
        {
            "type": "rule",
            "id": "b9bbab8b-0123-4456-b89a-b188529aabe0",
            "properties": {
                "field": "filename",
                "operator": "multiselect_contains",
                "value": [
                    [
                        "Blues_Bass.wav",
                        "Blues_Guitar.wav"
                    ]
                ],
                "valueSrc": [
                    "value"
                ],
                "valueType": [
                    "multiselect"
                ],
                "asyncListValues": [
                    {
                        "title": "Blues_Bass.wav",
                        "value": path + "Blues_Bass.wav"
                    },
                    {
                        "title": "Blues_Guitar.wav",
                        "value": path + "Blues_Guitar.wav"
                    }
                ]
            }
        }
    ],
    "properties": {
        "conjunction": "AND",
        "not": false
    }
}
//``


// You need to provide your own config. See below 'Config format'

const demoListValues = [
    { title: "Luca Vignati", value: "luca.vignati@unitn.it" },
    { title: "Stefano Dallona", value: "stefano.dallona@studenti.unitn.it" }
];
const { simulateAsyncFetch } = QbUtils.Autocomplete;
const simulatedAsyncFetch = simulateAsyncFetch(demoListValues, 3);
/*
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
*/

// Postprocessing of query (replace "_" with ".", replace *** \{"([^"_]+)_Settings\.([^"]+)" *** with *** {"worker":"\1","\2" ***)
// {"lostSamplesMasks_reconstructedTracks":{"$elemMatch":{"LowCostPLC_Settings.max_frequency":1}}} =>
// {"lostSamplesMasks.reconstructedTracks":{"$elemMatch":{"worker":"LowCostPLC", "max_frequency":4800}}}
const fields = {
    runId: {
        label: "ID",
        type: "text",
    },
    description: {
        label: "Description",
        type: "text",
    },
    filename: {
        label: "Input files",
        type: "multiselect",
        fieldSettings: {
            showSearch: true,
            listValues: [
                { value: "Blues_Bass.wav", title: "Blues_Bass.wav" },
                { value: "Blues_Guitar.wav", title: "Blues_Guitar.wav" }
            ],
            allowCustomValues: false
        }
    },
    status: {
        label: "Status",
        type: "select",
        fieldSettings: {
            listValues: ["CREATED", "RUNNING", "COMPLETED", "FAILED"],
        },
        valueSources: ["value"],
    },
    createdOn: {
        label: "Created on",
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
    createdBy: {
        label: "Created by",
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
    lostSamplesMasks: {
        label: "PLS Algorithm",
        type: "!group",
        subfields: {
            worker: {
                type: "select",
                fieldSettings: {
                    listValues: ["BinomialPLS", "GilbertElliotPLS"],
                },
                valueSources: ["value"],
            },
            BinomialPLS_Settings: {
                label: "BinomialPLS",
                tooltip: "Group of fields",
                type: "!struct",
                subfields: {
                    seed: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    packet_size: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    per: {
                        type: "number",
                        valueSources: ["value"],
                    }
                }
            },
            GilbertElliotPLS_Settings: {
                label: "GilbertElliotPLS",
                tooltip: "Group of fields",
                type: "!struct",
                subfields: {
                    seed: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    packet_size: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    p: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    r: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    h: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    k: {
                        type: "number",
                        valueSources: ["value"],
                    },
                }
            }
        }
    },
    "lostSamplesMasks|reconstructedTracks": {
        label: "PLC Algorithm",
        type: "!group",
        subfields: {
            worker: {
                type: "select",
                fieldSettings: {
                    listValues: ["ZerosPLC", "LastPacketPLC", "LowCostPLC", "DeepLearningPLC"],
                },
                valueSources: ["value"],
            },
            LowCostPLC_Settings: {
                label: "LowCostPLC",
                tooltip: "Group of fields",
                type: "!struct",
                subfields: {
                    max_frequency: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    f_min: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    beta: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    n_m: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    fade_in_length: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    fade_out_length: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    extraction_length: {
                        type: "number",
                        valueSources: ["value"],
                    }
                }
            },
            'DeepLearningPLC_Settings': {
                label: "DeepLearningPLC",
                tooltip: "Group of fields",
                type: "!struct",
                subfields: {
                    fs_dl: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    context_length: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    hop_size: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    window_length: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    lower_edge_hertz: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    upper_edge_hertz: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    num_mel_bins: {
                        type: "number",
                        valueSources: ["value"],
                    }
                }
            }
        }
    },
    "lostSamplesMasks|reconstructedTracks|outputAnalysis": {
        label: "Output Analyser",
        type: "!group",
        subfields: {
            worker: {
                type: "select",
                fieldSettings: {
                    listValues: ["MSECalculator", "PEAQCalculator"],
                },
                valueSources: ["value"],
            },
            MSECalculator_Settings: {
                label: "MSECalculator",
                tooltip: "Group of fields",
                type: "!struct",
                subfields: {
                    N: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    hop: {
                        type: "number",
                        valueSources: ["value"],
                    },
                    amp_scale: {
                        type: "number",
                        valueSources: ["value"],
                    }
                }
            },
            PEAQCalculator_Settings: {
                label: "PEAQCalculator",
                tooltip: "Group of fields",
                type: "!struct",
                subfields: {
                    peaq_mode: {
                        type: "select",
                        fieldSettings: {
                            listValues: ["nb", "basic"],
                        },
                        valueSources: ["value"],
                    }
                }
            }
        }
    }
};

const initLogic = loadedInitLogic && Object.keys(loadedInitLogic).length > 0 ? loadedInitLogic : undefined;
const InitialConfig = MuiConfig;

const config = {
    ...InitialConfig,
    fields: fields
};

let initTree = checkTree(loadTree(initValue), config);
//let initTree = checkTree(loadFromJsonLogic(initLogic, config), config);
// <<<


class RunAwesomeQueryBuilder extends Component {

    constructor(props) {
        super(props)
        this.searchHandler = props.searchHandler
        this.saveFilterHandler = props.saveFilterHandler
        this.loadSavedFiltersHandler = props.loadSavedFiltersHandler

        this.state = {
            tree: initTree,
            config: config
        };
    }

    onChange = (immutableTree, config) => {
        // Tip: for better performance you can apply `throttle` - see `examples/demo`
        this.setState({ tree: immutableTree, config: config });

        const jsonTree = QbUtils.getTree(immutableTree);
        console.log(jsonTree);
        // `jsonTree` can be saved to backend, and later loaded to `queryValue`
    }

    toolbarStartContent = (props) => (
        <React.Fragment>
            <Button
                rounded
                icon="pi pi-search"
                tooltip="Search"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={() => { this.searchHandler(this.getMongoDbQuery(this.state.tree)) }}></Button>
            <Button
                rounded
                icon="pi pi-bookmark"
                tooltip="Save Filter"
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                onClick={() => { this.saveFilterHandler(JSON.stringify(this.state.tree), "", "") }}></Button>
            <Dropdown
                value={this.loadSavedFiltersHandler("")}
                onChange={(e) => { if (e.value) this.setState({ tree: e.value }) }}
                options={[]}
                optionLabel="name"
                placeholder="Select a saved filter"
                className="w-full md:w-14rem" />
            <i className="pi p-toolbar-separator mr-2" />
        </React.Fragment>
    )

    renderBuilder = (props) => (
        <div className="query-builder-container" style={{ padding: '10px' }}>
            <div className="query-builder qb-lite">
                <Builder {...props} />
            </div>
        </div>
    )

    getMongoDbQuery = (tree) => {
        return this.queryPostProcessing(JSON.stringify(QbUtils.mongodbFormat(tree, config)))
    }

    queryPostProcessing = (queryString) => {
        let modifiedQueryString = queryString ? queryString
            .replace(/\{"([^"_]+)_Settings\.([^"]+)"/gm, "{\"worker\":\"$1\",\"$2\"")
            .replace(/\|/gm, ".") : queryString
        // \{"([^"_]+)_Settings\.([^"]+)"  => {"worker":"\1","\2"
        return modifiedQueryString
    }

    renderResult = ({ tree: immutableTree, config }) => (
        //false && (
            <div className="query-builder-result">
                <div>MongoDb query: <pre>{this.getMongoDbQuery(immutableTree)}</pre></div>
                <div>Tree: <pre>{JSON.stringify(QbUtils.getTree(immutableTree))}</pre></div>
            </div>
        //)
    )

    render = () => (
        <div>
            <Query
                {...config}
                value={this.state.tree}
                onChange={this.onChange}
                renderBuilder={this.renderBuilder}
            />
            {this.renderResult(this.state)}
            <Toolbar start={this.toolbarStartContent} />
        </div>
    )
}
export default RunAwesomeQueryBuilder;