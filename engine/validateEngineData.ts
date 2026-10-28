import { engineDataIssues } from "./marketInputIntegrity";

export function validateEngineData(data: any): boolean {
  return engineDataIssues(data).length === 0;
}
