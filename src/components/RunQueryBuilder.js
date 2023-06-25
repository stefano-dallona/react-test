import React from 'react';
import { useState } from 'react';

import { QueryBuilder, formatQuery } from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.scss';
import '../css/querybuilder.css'

const fields = [
    {
        "name": "runId",
        "label": "Run ID"
    },
    {
        "name": "creator",
        "label": "Creator"
    },
    {
        "name": "createdOn",
        "label": "Created On",
        "inputType": "date"
    },
    {
        "name": "status",
        "label": "Status",
        "valueEditorType": "multiselect",
        "values": [
            { "name": "CREATED", "label": "CREATED" },
            { "name": "RUNNING", "label": "RUNNING" },
            { "name": "COMPLETED", "label": "COMPLETED" },
            { "name": "FAILED", "label": "FAILED" }
        ]
    },
    {
        "name": "inputFiles",
        "label": "Input files",
        "valueEditorType": "multiselect",
        "values": [
            { "name": "Blues_Bass.wav", "label": "Blues_Bass.wav" },
            { "name": "Blues_Guitar.wav", "label": "Blues_Guitar.wav" }
        ]
    },
    {
        "name": "pls_algorithm",
        "label": "PLS algorithm",
        "valueEditorType": "select",
        "values": [
            { "name": "BinomialPLS", "label": "BinomialPLS" },
            { "name": "GilbertElliotPLS", "label": "GilbertElliotPLS" }
        ]
    },
    {
        "name": "BinomialPLS / seed",
        "label": "BinomialPLS / seed",
        "inputType": "number"
    },
    {
        "name": "BinomialPLS / per",
        "label": "BinomialPLS / per",
        "inputType": "number"
    },
    {
        "name": "BinomialPLS / packet_size",
        "label": "BinomialPLS / packet_size",
        "inputType": "number"
    },
    {
        "name": "BinomialPLS / seed",
        "label": "BinomialPLS / seed",
        "inputType": "number"
    },
    {
        "name": "BinomialPLS / packet_size",
        "label": "BinomialPLS / packet_size",
        "inputType": "number"
    },
    {
        "name": "BinomialPLS / p",
        "label": "BinomialPLS / p",
        "inputType": "number"
    },
    {
        "name": "BinomialPLS / r",
        "label": "BinomialPLS / r",
        "inputType": "number"
    },
    {
        "name": "BinomialPLS / h",
        "label": "BinomialPLS / h",
        "inputType": "number"
    },
    {
        "name": "BinomialPLS / k",
        "label": "BinomialPLS / k",
        "inputType": "number"
    },
    {
        "name": "plc_algorithm",
        "label": "PLC algorithm",
        "valueEditorType": "select",
        "values": [
            { "name": "ZerosPLC", "label": "ZerosPLC" },
            { "name": "LastPacketPLC", "label": "LastPacketPLC" },
            { "name": "LowCostPLC", "label": "LowCostPLC" },
            { "name": "DeepLearningPLC", "label": "DeepLearningPLC" }
        ]
    },
    {
        "name": "LowCostPLC / max_frequency",
        "label": "LowCostPLC / max_frequency",
        "inputType": "number"
    },
    {
        "name": "LowCostPLC / f_min",
        "label": "LowCostPLC / f_min",
        "inputType": "number"
    },
    {
        "name": "LowCostPLC / beta",
        "label": "LowCostPLC / beta",
        "inputType": "number"
    },
    {
        "name": "LowCostPLC / n_m",
        "label": "LowCostPLC / n_m",
        "inputType": "number"
    },
    {
        "name": "LowCostPLC / fade_in_length",
        "label": "LowCostPLC / fade_in_length",
        "inputType": "number"
    },
    {
        "name": "LowCostPLC / fade_out_length",
        "label": "LowCostPLC / fade_out_length",
        "inputType": "number"
    },
    {
        "name": "LowCostPLC / extraction_length",
        "label": "LowCostPLC / extraction_length",
        "inputType": "number"
    },
    {
        "name": "DeepLearningPLC / model_path",
        "label": "DeepLearningPLC / model_path",
    },
    {
        "name": "DeepLearningPLC / fs_dl",
        "label": "DeepLearningPLC / fs_dl",
        "inputType": "number"
    },
    {
        "name": "DeepLearningPLC / context_length",
        "label": "DeepLearningPLC / context_length",
        "inputType": "number"
    },
    {
        "name": "DeepLearningPLC / hop_size",
        "label": "DeepLearningPLC / hop_size",
        "inputType": "number"
    },
    {
        "name": "DeepLearningPLC / window_length",
        "label": "DeepLearningPLC / window_length",
        "inputType": "number"
    },
    {
        "name": "DeepLearningPLC / lower_edge_hertz",
        "label": "DeepLearningPLC / lower_edge_hertz",
        "inputType": "number"
    },
    {
        "name": "DeepLearningPLC / upper_edge_hertz",
        "label": "DeepLearningPLC / upper_edge_hertz",
        "inputType": "number"
    },
    {
        "name": "DeepLearningPLC / num_mel_bins",
        "label": "DeepLearningPLC / num_mel_bins",
        "inputType": "number"
    },
    {
        "name": "lostSamplesMasks.reconstructedTracks.outputAnalysis",
        "label": "Output analyser",
        "valueEditorType": "select",
        "values": [
            { "name": "MSECalculator", "label": "MSECalculator" },
            { "name": "PEAQCalculator", "label": "PEAQCalculator" }
        ]
    },
    {
        "name": "MSECalculatorSettings / N",
        "label": "MSECalculatorSettings / N",
        "inputType": "number"
    },
    {
        "name": "MSECalculatorSettings / amp_scale",
        "label": "MSECalculatorSettings / amp_scale",
        "inputType": "number"
    },
    {
        "name": "PEAQCalculatorSettings / peaq_mode",
        "label": "PEAQCalculatorSettings / peaq_mode",
        "valueEditorType": "select",
        "values": [
            { "name": "nb", "label": "nb" }
        ]
    },
];

const initialQuery = {

    combinator: 'and',
    rules: [/*
        { field: 'runId', operator: 'beginsWith', value: 'fc971184-1750-4a70-9621-6fec16a7a9a1' },
        { field: 'creator', operator: 'in', value: 'Stefano Dallona, Luca Vignati' },
    */],

};

export const RunQueryBuilder = (props) => {

    const [query, setQuery] = useState(initialQuery);

    return (
        <React.Fragment>
            <QueryBuilder
                fields={fields}
                query={query}
                onQueryChange={q => setQuery(q)}
                showLockButtons
                controlClassnames={{ queryBuilder: 'queryBuilder-branches' }}
            />
            <pre>{formatQuery(query, "mongodb")}</pre>
        </React.Fragment>
    )
}