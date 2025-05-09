
import { Widgets, Widget, WidgetList, WidgetError } from "../generated/models/all/widget-service.js";
import { ReadWidget } from "../generated/models/all/typespec.js";
import { CosmosClientManager, buildError } from "../azure/cosmos-client.js";
import { HttpContext } from "../generated/helpers/router.js";
import { Container } from "@azure/cosmos";

export interface WidgetDocument {
    id: string;
    weight: number;
    color: "red" | "blue";
    _ts?: number; // Cosmos DB timestamp
    _etag?: string; // Cosmos DB etag for optimistic concurrency
  }

/**
 * Implementation of the Widgets API using Azure Cosmos DB for storage
 */
export class WidgetsCosmosController implements Widgets<HttpContext>  {
  private readonly databaseId: string;
  private readonly containerId: string;
  private readonly partitionKey: string;
  private readonly endpoint: string;
  private readonly cosmosManager: CosmosClientManager;
  private container: Container | null = null;
  private containerInitialized: boolean = false;

  /**
   * Creates a new instance of WidgetsCosmosController
   * @param databaseId The Cosmos DB database ID
   * @param containerId The Cosmos DB container ID
   */
  constructor(azureCosmosEndpoint: string, databaseId: string, containerId: string, partitionKey: string) {
    console.log(`Db: ${databaseId}, Container: ${containerId}`);

    if (!azureCosmosEndpoint) throw new Error("azureCosmosEndpoint is required");
    if (!databaseId) throw new Error("databaseId is required");
    if (!containerId) throw new Error("containerId is required");
    if (!partitionKey) throw new Error("partitionKey is required");
    
    this.endpoint = azureCosmosEndpoint;
    this.databaseId = databaseId;
    this.containerId = containerId;
    this.partitionKey = partitionKey;
    this.cosmosManager = CosmosClientManager.getInstance();
  
    // Initialize the client in the constructor
    this.cosmosManager.initialize({
      endpoint: azureCosmosEndpoint,
      databaseId: databaseId,
      containerId: containerId,
      partionKey: partitionKey,
    }).then(() => {
    }).catch(err => {
      console.error("Failed to initialize CosmosDB client:", err);
    });
  }

  /**
   * Initialize and get the container reference, with caching
   * @returns The Cosmos container instance
   */
  private async ensureContainer():Promise<Container> {
    try {
      if (!this.containerInitialized || !this.container) {
        const container = await this.cosmosManager.getContainer(
          this.endpoint,
          this.databaseId,
          this.containerId,
          this.partitionKey 
        );
        this.containerInitialized = true;
        this.container = container;
        return this.container;
      }
      return this.container;
    } catch (error) {
      const formattedError = buildError(
        error, 
        `Failed to access container ${this.containerId}`
      );
      console.error("Container initialization error:", formattedError);
      throw formattedError;
    }
  }

  /**
   * Create a new widget
   * @param widget The widget to create
   * @returns The created widget with assigned ID
   */
  async create(ctx: HttpContext,
    id: string,
    weight: number,
    color: "red" | "blue"
  ): Promise<ReadWidget | WidgetError> {
    const operationName = "WidgetsCosmosController.create";
    console.log(`${operationName}: Creating widget`);

    try {
      const container = await this.ensureContainer();
      
      const newWidget: WidgetDocument = { id, weight, color };
      const { resource } = await container.items.create<Widget>(newWidget, { 
        disableAutomaticIdGeneration: true // Ensure we use the provided ID
      });

      if (!resource) {
        return buildError({statusCode:500}, `Failed to create widget ${id}: No resource returned`);
      }

      console.log(`${operationName}: Created widget with ID ${resource.id}`);
      
      return this.documentToWidget(newWidget);
    } catch (error: any) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as any).statusCode === 409) {
            return buildError({statusCode:409}, `Widget with id ${id} already exists`);
          }
          
          console.error(`Error creating widget ${id}:`, error);
          return buildError(error, `Failed to create widget ${id}`);
    }
  }

  /**
   * Delete a widget by ID
   * @param id The ID of the widget to delete
   */
  async delete(ctx: HttpContext, id: string): Promise<void | WidgetError> {
    const operationName = "WidgetsCosmosController.delete";
    console.log(`${operationName}: Deleting widget with ID ${id}`);

    try {
      const container = await this.ensureContainer();
      await container.item(id, id).delete();
      console.log(`${operationName}: Successfully deleted widget ${id}`);
    } catch (error: any) {
        if (error && typeof error === 'object' && 'statusCode' in error && (error as any).statusCode === 404) {
            return buildError({statusCode:404}, `Widget with id ${id} not found`);
          }
          
          console.error(`Error deleting widget ${id}:`, error);
          return buildError(error, `Failed to delete widget ${id}`);
    }
  }

  /**
   * Get a widget by ID
   * @param id The ID of the widget to retrieve
   * @returns The widget if found
   */
  async read(ctx: HttpContext, id: string): Promise<ReadWidget | WidgetError> {
    const operationName = "WidgetsCosmosController.get";
    console.log(`${operationName}: Getting widget with ID ${id}`);

    try {
      const container = await this.ensureContainer();
      const { resource } = await container.item(id, id).read<WidgetDocument>();
      
      if (!resource) {
        return buildError({statusCode:404}, `Widget with id ${id} not found`);
      }
      
      return this.documentToWidget(resource);
    } catch (error: any) {
        console.error(`Error reading widget ${id}:`, error);
        return buildError(error, `Failed to read widget ${id}`);
    }
  }

  /**
   * List all widgets with optional paging
   * @returns List of widgets
   */
  async list(ctx: HttpContext): Promise<WidgetList | WidgetError> {
    const operationName = "WidgetsCosmosController.list";
    
    console.log(`${operationName}: Listing widgets`);

    try {
      const container = await this.ensureContainer();
      
        const { resources } = await container.items
        .query({ query: "SELECT * FROM c" })
        .fetchAll();

        console.log("Fetched widgets:", resources);


        return { widgets: resources.map(this.documentToWidget) };

    } catch (error) {
        console.error("Error listing widgets:", error);
        return buildError(error, "Failed to list widgets");
    }
  }
  /**
   * Convert a Cosmos DB document to a ReadWidget
   */
  private documentToWidget(doc: WidgetDocument): Widget {
    return {
      id: doc.id,
      weight: doc.weight,
      color: doc.color,
    };
  }
}