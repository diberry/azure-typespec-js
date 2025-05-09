import { CosmosClient, Database, Container } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { WidgetError } from "../generated/models/all/widget-service.js";
/**
 * Interface for CosmosDB configuration settings
 */
export interface CosmosConfig {
  endpoint: string;
  databaseId: string;
  containerId: string;
  partionKey: string;
}

/**
 * Singleton class for managing CosmosDB connections
 */
export class CosmosClientManager {
  private static instance: CosmosClientManager | null = null;
  private client: CosmosClient | null = null;
  private databaseCache: Map<string, Database> = new Map();
  private containerCache: Map<string, Container> = new Map();
  private isInitializing = false;
  private config: CosmosConfig | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of CosmosClientManager
   */
  public static getInstance(): CosmosClientManager {
    if (!CosmosClientManager.instance) {
      CosmosClientManager.instance = new CosmosClientManager();
    }
    return CosmosClientManager.instance;
  }

  /**
   * Initialize the CosmosDB client with configuration
   * @param config CosmosDB configuration
   */
  public async initialize(config: CosmosConfig): Promise<void> {
    if (this.client) {
      console.log("CosmosDB client is already initialized");
      return;
    }

    if (this.isInitializing) {
      console.log("CosmosDB client initialization is in progress");
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    try {
      this.isInitializing = true;
      this.validateConfig(config);
      this.config = config;

      const credential = new DefaultAzureCredential();

      this.client = new CosmosClient({
        endpoint: config.endpoint,
        aadCredentials: credential,
        connectionPolicy: {
          requestTimeout: 30000 // 30 second timeout
        }
      });

      console.log("CosmosDB client initialized successfully");
    } catch (error) {
      const formattedError = buildError(error, "Failed to initialize CosmosDB client");
      console.error("CosmosDB initialization error:", formattedError);
      throw formattedError;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Validate the provided configuration
   * @param config CosmosDB configuration to validate
   */
  private validateConfig(config: CosmosConfig): void {
    if (!config.endpoint) throw new Error("CosmosDB endpoint is required");
    if (!config.databaseId) throw new Error("CosmosDB databaseId is required");
    if (!config.containerId) throw new Error("CosmosDB containerId is required");
  }

  /**
   * Get a database instance, creating it if it doesn't exist
   * @param databaseId Database ID to retrieve or create
   * @returns Database instance
   */
  public async getDatabase(databaseId?: string): Promise<Database> {

    console.log("DatabaseId:", databaseId);

    if (!this.client) {
      throw new Error("CosmosDB client is not initialized. Call initialize() first");
    }

    const dbId = databaseId || this.config?.databaseId;
    if (!dbId) {
      throw new Error("Database ID is required");
    }

    // Check cache first
    if (this.databaseCache.has(dbId)) {
      return this.databaseCache.get(dbId)!;
    }

    try {
      const { database } = await this.client.databases.createIfNotExists({ id: dbId });
      this.databaseCache.set(dbId, database);
      return database;
    } catch (error) {
      throw buildError(error, `Failed to get or create database ${dbId}`);
    }
  }

  /**
   * Get a container instance, creating it if it doesn't exist
   * @param containerId Container ID to retrieve or create
   * @param databaseId Optional database ID (uses default if not specified)
   * @param partitionKey Optional partition key path
   * @returns Container instance
   */
  public async getContainer(
    endpoint: string,
    databaseId: string,
    containerId: string,
    partitionKey: string
  ): Promise<Container> {

    console.log("getContainer Endpoint:", endpoint);
    console.log("getContainer ContainerId:", containerId);
    console.log("getContainer DatabaseId:", databaseId);
    console.log("getContainer PartitionKey:", partitionKey);

    if (!databaseId) {
      throw new Error("databaseId is required");
    }

    if (!containerId) {
      throw new Error("containerId is required");
    }

    const cacheKey = `${databaseId || this.config?.databaseId}-${containerId}`;
    console.log("getContainer CacheKey:", cacheKey);

    // Check cache first
    if (this.containerCache.has(cacheKey)) {
      console.log("getContainer Container found in cache");
      return this.containerCache.get(cacheKey)!;
    }

    try {
      const database = await this.getDatabase(databaseId);
      console.log("getContainer Database found:", database.id);

      const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey: { paths: [partitionKey] }
      });
      console.log("getContainer Container created:", container.id);

      this.containerCache.set(cacheKey, container);
      console.log("getContainer Container cached:", container.id);
      return container;
    } catch (error) {
      console.error("getContainer Error getting or creating container:", error);
      throw buildError(error, `getContainer Failed to get or create container ${containerId}`);
    }
  }

  /**
   * Clean up resources and close connections
   */
  public async dispose(): Promise<void> {
    if (this.client) {
      try {
        // Clear caches
        this.databaseCache.clear();
        this.containerCache.clear();

        // Cosmos SDK client doesn't have a formal close/dispose method,
        // but we can set it to null to allow garbage collection
        this.client = null;
        console.log("CosmosDB client resources released");
      } catch (error) {
        console.error("Error disposing CosmosDB client:", error);
      }
    }
  }

}
/**
 * Helper function to build Error objects as defined in demo-service.ts
 * This replaces the previous approach of checking for error properties
 */
export function buildError(error: unknown, defaultMessage: string = 'An unknown error occurred'): WidgetError {
  // Start with default error code 500 (Internal Server Error)
  let code = 500;
  let message = defaultMessage;

  // Error type mapping based on common Cosmos error patterns
  const errorMap = new Map([
    [403, "Forbidden: Insufficient permissions to access CosmosDB resource"],
    [404, "Not found: The requested resource doesn't exist"],
    [409, "Conflict: Resource already exists or version conflict"],
    [412, "Precondition failed: Operation cannot be performed due to current state"],
    [429, "Too many requests: Rate limit exceeded"],
    [503, "Service unavailable: CosmosDB is currently unavailable"]
  ]);

  // Handle null/undefined errors
  if (!error) {
    return { code, message };
  }

  const err = error as any;

  // Handle structured Cosmos errors
  if (err.code && err.statusCode) {
    code = err.statusCode as number;
    message = errorMap.get(code) || err.message || defaultMessage;
    return { code, message };
  }

  // Handle network errors
  if (err.name === "AbortError" || err.name === "TimeoutError") {
    return {
      code: 504,
      message: "Gateway timeout: CosmosDB operation timed out"
    };
  }

  // Extract error information if possible
  if (typeof error === 'object' && error !== null) {
    // Cast to any to access potential Cosmos DB error properties
    const cosmosError = error as any;

    // Check for Cosmos DB specific error properties
    if (typeof cosmosError.statusCode === 'number') {
      // Use statusCode from the Cosmos DB SDK error
      code = cosmosError.statusCode;

      // Use the errorMap first if a mapped message exists
      message = errorMap.get(code) || message;

      // Then build a detailed message if needed
      if (!errorMap.has(code)) {
        let detailedMessage = `Cosmos DB error: statusCode=${cosmosError.statusCode}`;

        if (typeof cosmosError.subStatusCode === 'number') {
          detailedMessage += `, subStatusCode=${cosmosError.subStatusCode}`;
        }

        // Include the original error message if available
        if (typeof cosmosError.message === 'string' && cosmosError.message.trim() !== '') {
          detailedMessage += ` - ${cosmosError.message}`;
        }

        message = detailedMessage;
      }
    }
    // Fallback to checking WidgetError properties
    else if (typeof cosmosError.code === 'number') {
      // Map custom error codes to HTTP status codes if needed
      if (cosmosError.code === 1001) { // Resource not found
        code = 404;
      } else if (cosmosError.code === 1008) { // Request timeout
        code = 408;
      } else if (cosmosError.code === 1009) { // Conflict
        code = 409;
      } else if (cosmosError.code === 1029) { // Too many requests
        code = 429;
      } else {
        code = cosmosError.code;
      }

      // Use the message from the error or default to errorMap
      message = cosmosError.message || errorMap.get(code) || defaultMessage;
    }
  }

  return { code, message };
}