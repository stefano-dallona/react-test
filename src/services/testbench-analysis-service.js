export class AnalysisService {

    constructor(baseUrl, axiosClient) {
        this.baseUrl = baseUrl;
        this.axiosClient = axiosClient
    }

    async fetchLostSamples(run_id, original_file_node_id, loss_simulation_node_id, unit_of_meas) {
        let requestUrl = `${this.baseUrl}/analysis/runs/${run_id}/input-files/${original_file_node_id}/loss-simulations/${loss_simulation_node_id}?unit_of_meas=${unit_of_meas}`
        /*
        const response = await fetch(requestUrl);
        const lostPacketsJson = await response.json();
        */
        let response = await this.axiosClient.get(requestUrl)
        let lostPacketsJson = response.data
        return lostPacketsJson;
    }

    async fetchWaveform(run_id, original_file_node_id, audio_file_node_id, channel, offset, num_samples, unit_of_meas, max_slices) {
        let requestUrl = `${this.baseUrl}/analysis/runs/${run_id}/input-files/${original_file_node_id}/output-files/${audio_file_node_id}/waveform?channel=${channel}&offset=${offset}&num_samples=${num_samples}&unit_of_meas=${unit_of_meas}&max_slices=${max_slices}`
        /*
        const response = await fetch(requestUrl);
        const waveform = await response.json();
        */
        let response = await this.axiosClient.get(requestUrl)
        let waveform = response.data
        return {
            uuid: waveform.uuid,
            duration: waveform.duration,
            sampleRate: waveform.sampleRate,
            originalSampleRate: waveform.originalSampleRate,
            getChannelData: (channel) => {
                let data = Array(waveform.numSamples).fill(0)
                let indexes = Object.keys(waveform.data)
                indexes.forEach((index) => {
                    data[index] = waveform.data[index]
                })
                return Float32Array.from(data)
            }
        };
    }

    async fetchWaveforms(run_id, original_file_node_id, channel, offset, num_samples, unit_of_meas, max_slices, loss_model_node_id) {
        //let requestUrl = `${this.baseUrl}/analysis/runs/${run_id}/input-files/${original_file_node_id}/waveforms?jwt=${localStorage.getItem("jwt_token")}&channel=${channel}&offset=${offset}&num_samples=${num_samples}&unit_of_meas=${unit_of_meas}&max_slices=${max_slices}&loss_model_node_id=${loss_model_node_id}`
        let requestUrl = `${this.baseUrl}/analysis/runs/${run_id}/input-files/${original_file_node_id}/waveforms?channel=${channel}&offset=${offset}&num_samples=${num_samples}&unit_of_meas=${unit_of_meas}&max_slices=${max_slices}&loss_model_node_id=${loss_model_node_id}`
        let response = await this.axiosClient.get(requestUrl)
        let waveforms = response.data
        return waveforms.map((waveform) => {
            return {
                uuid: waveform.uuid,
                duration: waveform.duration,
                sampleRate: waveform.sampleRate,
                originalSampleRate: waveform.originalSampleRate,
                getChannelData: (channel) => {
                    let data = Array(offset + waveform.numSamples).fill(0)
                    let indexes = Object.keys(waveform.data)
                    indexes.forEach((index) => {
                        data[Number.parseInt(offset) + Number.parseInt(index)] = waveform.data[index]
                    })
                    return Float32Array.from(data)
                }
            }
        })
    };

    async fetchSamplesFromFile(run_id, original_file_node_id, audio_file_node_id, channel, offset, num_samples, unit_of_meas) {
        let requestUrl = `${this.baseUrl}/analysis/runs/${run_id}/input-files/${original_file_node_id}/output-files/${audio_file_node_id}/samples?channel=${channel}&offset=${offset}&num_samples=${num_samples}&unit_of_meas=${unit_of_meas}`
        /*
        const samplesResponse = await fetch(requestUrl);
        const samplesJson = await samplesResponse.json();
        */
        let response = await this.axiosClient.get(requestUrl)
        let samplesJson = response.data
        return samplesJson;
    }

    async fetchMetricsFromFile(run_id, original_file_node_id, audio_file_node_id, metric_node_id, category, channel, offset, num_samples, loss_simulation, unit_of_meas) {
        let requestUrl = `${this.baseUrl}/analysis/runs/${run_id}/input-files/${original_file_node_id}/output-files/${audio_file_node_id}/metrics/${metric_node_id}?channel=${channel}&offset=${offset}&num_samples=${num_samples}&unit_of_meas=${unit_of_meas}&category=${category}`
        /*
        const metricsResponse = await fetch(requestUrl)
        const metricsJson = await metricsResponse.json();
        */
        let response = await this.axiosClient.get(requestUrl)
        let metricsJson = response.data
        return metricsJson;
    }

    async retrieveAudioFile(run_id, original_file_node_id, audio_file_node_id, offset = 0, num_samples = -1) {
        let requestUrl = `${this.baseUrl}/analysis/runs/${run_id}/input-files/${original_file_node_id}/output-files/${audio_file_node_id}?offset=${offset}&num_samples=${num_samples}`
        let response = await fetch(requestUrl, {
            headers: { "Authorization": localStorage.getItem("jwt_token") }
        })
        let audioFileArrayBuffer = await response.arrayBuffer()
        return audioFileArrayBuffer;
    }

}