// Public surface of the generated API client.
// Everything under ./generated is produced by Orval from the backend's
// openapi.json — never hand-edit it. Re-exported here so app code imports
// from "@odyssey/api-client" only.
export * from "./generated/odyssey.ts";
export * from "./generated/odyssey.schemas.ts";
export { ApiError } from "./fetch-client.ts";
