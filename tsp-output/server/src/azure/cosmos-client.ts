// Azure Cosmos DB client helper with connection pooling and error handling
import { CosmosClient, Container, Database } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { WidgetError } from "../generated/models/all/widget-service.js";

// Define our Cosmos DB document structure
export interface WidgetDocument {
  id: string;
  weight: number;
  color: "red" | "blue";
  _ts?: number; // Cosmos DB timestamp
  _etag?: string; // Cosmos DB etag for optimistic concurrency
}

/**
 * A singleton class for managing Cosmos DB connections
 * Uses DefaultAzureCredential for authentication
 */
export class CosmosClientManager {
  private static instance: CosmosClientManager;
  private client: CosmosClient | null = null;
  private databases: Map<string, Database> = new Map();
  private containers: Map<string, Container> = new Map();

  private constructor() {}

  public static getInstance(): CosmosClientManager {
    if (!CosmosClientManager.instance) {
      CosmosClientManager.instance = new CosmosClientManager();
    }
    return CosmosClientManager.instance;
  }

  /**
   * Initialize the Cosmos DB client
   * @param endpoint The Cosmos DB endpoint
   */
  public initialize(endpoint: string): void {
    try {
      const credential = new DefaultAzureCredential();
      this.client = new CosmosClient({
        endpoint,
        aadCredentials: credential,
      });
    } catch (error) {
      console.error("Failed to initialize Cosmos DB client:", error);
      throw new Error("Failed to initialize Cosmos DB client");
    }
  }

  /**
   * Get a database instance with caching
   * @param databaseId The database ID
   * @returns A Database instance
   */
  public async getDatabase(databaseId: string): Promise<Database> {
    if (!this.client) {
      throw new Error("Cosmos client not initialized");
    }

    if (!this.databases.has(databaseId)) {
      try {
        const { database } = await this.client.databases.createIfNotExists({ id: databaseId });
        this.databases.set(databaseId, database);
      } catch (error) {
        console.error(`Error getting database ${databaseId}:`, error);
        throw new Error(`Failed to get database ${databaseId}`);
      }
    }

    return this.databases.get(databaseId)!;
  }

  /**
   * Get a container instance with caching
   * @param databaseId The database ID
   * @param containerId The container ID
   * @returns A Container instance
   */
  public async getContainer(databaseId: string, containerId: string): Promise<Container> {
    const cacheKey = `${databaseId}-${containerId}`;

    if (!this.containers.has(cacheKey)) {
      try {
        const database = await this.getDatabase(databaseId);
        const { container } = await database.containers.createIfNotExists({ id: containerId });
        this.containers.set(cacheKey, container);
      } catch (error) {
        console.error(`Error getting container ${containerId} in database ${databaseId}:`, error);
        throw new Error(`Failed to get container ${containerId}`);
      }
    }

    return this.containers.get(cacheKey)!;
  }
}

/**
 * Helper function to build Error objects as defined in demo-service.ts
 * This replaces the previous approach of checking for error properties
 */
export function buildError(error: unknown, defaultMessage?: string): WidgetError {
  // Start with default error code 500 (Internal Server Error)
  let code = 500;
  let message = defaultMessage || 'An unknown error occurred';

  // Extract error information if possible
  if (typeof error === 'object' && error !== null) {
    // Cast to any to access potential Cosmos DB error properties
    const cosmosError = error as any;
    
    // Check for Cosmos DB specific error properties
    if (typeof cosmosError.statusCode === 'number') {
      // Use statusCode from the Cosmos DB SDK error
      code = cosmosError.statusCode;
      
      // Build a detailed message including statusCode and subStatusCode if available
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
    // Fallback to checking WidgetError properties
    else if (typeof cosmosError.code === 'number') {
      code = cosmosError.code;
      
      if (typeof cosmosError.message === 'string' && cosmosError.message.trim() !== '') {
        message = cosmosError.message;
      }
    }
    
    // Map common Cosmos DB error codes to HTTP status codes if needed
    if (code === 404 || code === 408 || code === 409 || code === 412 || code === 429) {
      // These codes are already HTTP status codes, keep them as is
    } else if (code === 1001) { // Resource not found
      code = 404;
    } else if (code === 1008) { // Request timeout
      code = 408;
    } else if (code === 1009) { // Conflict
      code = 409;
    } else if (code === 1029) { // Too many requests
      code = 429;
    }
  }
  
  return { code, message };
}