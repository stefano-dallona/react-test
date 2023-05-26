import { AnalysisService } from "./testbench-analysis-service";
import { ConfigurationService } from "./testbench-configuration-service";


let baseUrl = "http://localhost:5000"

export const container = {
  baseUrl: baseUrl,
  configurationService: new ConfigurationService(baseUrl),
  analysisService: new AnalysisService(baseUrl)
};

export type ServiceContainer = typeof container;