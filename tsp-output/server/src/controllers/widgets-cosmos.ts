// Cosmos DB implementation of the Widgets interface
import { Widgets, WidgetError } from "../generated/models/all/widget-service.js";
import { ReadWidget } from "../generated/models/all/typespec.js";
import { HttpContext } from "../generated/helpers/router.js";
import { CosmosClientManager, WidgetDocument, buildError } from "../azure/cosmos-client.js";
import type { Container } from "@azure/cosmos";

/**
 * Implementation of the Widgets interface using Azure Cosmos DB
 * Uses DefaultAzureCredential for authentication and follows Azure best practices
 */
export class WidgetsCosmosImpl implements Widgets<HttpContext> {
  private cosmosClientManager: CosmosClientManager;
  private container: Container | null = null;
  private databaseName: string = "WidgetsDb";
  private containerName: string = "Widgets";
  private initialized: boolean = false;

  constructor(cosmosEndpoint: string, databaseName?: string, containerName?: string) {
    this.databaseName = databaseName || this.databaseName;
    this.containerName = containerName || this.containerName;
    this.cosmosClientManager = CosmosClientManager.getInstance();
    this.cosmosClientManager.initialize(cosmosEndpoint);
    // We'll initialize the container lazily using the init() method
  }
/**
 * Private async method to initialize and get the container
 * @returns A promise resolving to the initialized container
 * @throws Error if initialization fails
 */
private async getContainer(): Promise<Container> {
    // Initialize the container if not already done
    if (!this.container) {
      try {
        this.container = await this.cosmosClientManager.getContainer(
          this.databaseName,
          this.containerName
        );
        this.initialized = true;
      } catch (error) {
        console.error("Failed to initialize Cosmos container:", error);
        throw error;
      }
    }
    
    return this.container;
  }
  /**
   * Convert a Cosmos DB document to a ReadWidget
   */
  private documentToWidget(doc: WidgetDocument): ReadWidget {
    return {
      id: doc.id,
      weight: doc.weight,
      color: doc.color,
    };
  }

  /**
   * List all widgets
   */
  async list(ctx: HttpContext): Promise<ReadWidget[] | WidgetError> {
    
    try{
        const container = await this.getContainer();
        const { resources } = await container.items
        .query({ query: "SELECT * FROM c" })
        .fetchAll();

        console.log("Fetched widgets:", resources);
      
        const mappedResources = resources.map((doc: WidgetDocument) => this.documentToWidget(doc));
        console.log("Mapped widgets:", mappedResources);
      
      return mappedResources;

    } catch (error) {
        console.error("Error listing widgets:", error);
        return buildError(error, "Failed to list widgets");
    }
  }

  /**
   * Read a specific widget by ID
   */
  async read(ctx: HttpContext, id: string): Promise<ReadWidget | WidgetError> {
    try {
      const container = await this.getContainer();
      const { resource } = await container.item(id, id).read<WidgetDocument>();
      
      // Fix: Check if resource exists before converting to Widget
      if (!resource) {
        return buildError({statusCode:404}, `Widget with id ${id} not found`);
      }
      
      return this.documentToWidget(resource);
    } catch (error) {
      console.error(`Error reading widget ${id}:`, error);
      return buildError(error, `Failed to read widget ${id}`);
    }
  }

  /**
   * Create a new widget
   */
  async create(
    ctx: HttpContext,
    id: string,
    weight: number,
    color: "red" | "blue"
  ): Promise<ReadWidget | WidgetError> {
    try {
      const container = await this.getContainer();
      const newWidget: WidgetDocument = { id, weight, color };
      
      // Azure best practice: Directly create the item and handle conflict errors
      // This is more efficient than checking existence first
      const { resource } = await container.items.create<WidgetDocument>(newWidget, { 
        disableAutomaticIdGeneration: true // Ensure we use the provided ID
      });
      
      // Fix: Check if resource exists before converting to Widget
      if (!resource) {
        return buildError({statusCode:500}, `Failed to create widget ${id}: No resource returned`);
      }
      
      return this.documentToWidget(resource);
    } catch (error) {
      // If error is a conflict (409), it means the item already exists
      if (error && typeof error === 'object' && 'statusCode' in error && (error as any).statusCode === 409) {
        return buildError({statusCode:409}, `Widget with id ${id} already exists`);
      }
      
      console.error(`Error creating widget ${id}:`, error);
      return buildError(error, `Failed to create widget ${id}`);
    }
  }

  /**
   * Delete a widget by ID
   */
  async delete(ctx: HttpContext, id: string): Promise<void | WidgetError> {
    try {
      const container = await this.getContainer();
      
      // Directly attempt to delete the item without checking first
      await container.item(id, id).delete();
      
      return;
    } catch (error) {
      // Check if the error is a "Not Found" error from Cosmos DB
      if (error && typeof error === 'object' && 'statusCode' in error && (error as any).statusCode === 404) {
        return buildError({statusCode:404}, `Widget with id ${id} not found`);
      }
      
      console.error(`Error deleting widget ${id}:`, error);
      return buildError(error, `Failed to delete widget ${id}`);
    }
  }
}