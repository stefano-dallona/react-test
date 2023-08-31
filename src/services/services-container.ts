import { Axios } from 'axios'
import axios from 'axios'

import { useGoogleLogin } from '@react-oauth/google';

import { AnalysisService } from "./testbench-analysis-service";
import { ConfigurationService } from "./testbench-configuration-service";

import { trackPromise } from 'react-promise-tracker';


//https://dev.to/mihaiandrei97/jwt-authentication-using-axios-interceptors-55be
//let baseUrl = `${process.env.REACT_APP_HTTPS && process.env.REACT_APP_HTTPS == "true" ? "https" : "http"}://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}`
//let baseUrl = `${env.HTTPS_ENABLED && env.HTTPS_ENABLED == "true" ? "https" : "http"}://${env.APP_HOST}:${env.APP_PORT}`
let baseUrl = window.location.protocol + "//" + window.location.host
//let baseUrl = "https://127.0.0.1:5000"

class AxiosClient {
  client: Axios

  constructor(options = {}) {
    this.client = axios.create(options)

    this.client.interceptors.request.use(
      (config) => {
        let jwt_token = localStorage.getItem("jwt_token")
        if (jwt_token) {
          config.headers.Authorization = jwt_token;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        // Any status code that lie within the range of 2xx cause this function to trigger
        // Do something with response data
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          let jwt_token = localStorage.getItem("jwt_token")
          window["globalToast"].current.show({ severity: "info", summary: "Please authenticate", detail: "" });
          if (jwt_token) {
            localStorage.removeItem('user')
            localStorage.removeItem('jwt_token');
            // try to refresh the token
          }
          // or redirect to the landing page
          if (window.location.pathname != "/") {
            setTimeout(() => {
              window.location.assign(window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/")
            }, 3000)
          }
        } else {
          if (window["globalToast"]) {
            window["globalToast"].current.show({ severity: "error", summary: error.message, detail: "" });
          }
        }
      }
    )
  }

  get = (url, config) => {
    return trackPromise(this.client.get(url, config))
  }

  post = (url, data, config) => {
    return trackPromise(this.client.post(url, data, config))
  }

  put = (url, data, config) => {
    return trackPromise(this.client.put(url, data, config))
  }

  delete = (url, config) => {
    return trackPromise(this.client.delete(url, config))
  }

}

const createAxiosClient = (options = {}) => {
  return new AxiosClient(options);
}
export const container = {
  baseUrl: baseUrl,
  testConnectivity: async () => {
    let axiosClient = axios.create()
    let response = axiosClient.get(baseUrl, {
      headers: { "Authorization": localStorage.getItem("jwt_token") }
    })
    return response
  },
  configurationService: new ConfigurationService(baseUrl, createAxiosClient()),
  analysisService: new AnalysisService(baseUrl, createAxiosClient())
};

export type ServiceContainer = typeof container;