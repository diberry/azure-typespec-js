// Cosmos DB implementation of the Widgets interface
import { Widgets, Error } from "../generated/models/all/demo-service.js";
import { HttpContext } from "../generated/helpers/router.js";
import { ReadWidget } from "../generated/models/all/typespec.js";
import { CosmosClientManager, WidgetDocument } from "../azure/cosmos-client.js";
import { Container } from "@azure/cosmos";
import { Result, ok, err } from "neverthrow";

// Define an interface for Azure Cosmos DB errors to make type guard more specific
interface CosmosError {
  code?: number;
  statusCode?: number;
  message?: string;
  name?: string;
}

/**
 * Type guard to check if the error is a Cosmos DB error with a numeric code
 */
function isCosmosError(error: unknown): error is CosmosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (typeof (error as CosmosError).code === 'number' ||
     typeof (error as CosmosError).statusCode === 'number')
  );
}

/**
 * Implementation of the Widgets interface using Azure Cosmos DB
 * Uses DefaultAzureCredential for authentication and follows Azure best practices
 */
export class WidgetsCosmosImpl implements Widgets<HttpContext> {
  private cosmosClientManager: CosmosClientManager;
  private container: Container | null = null;
  private readonly databaseName: string = "WidgetsDb";
  private readonly containerName: string = "Widgets";
  private initialized: boolean = false;

  constructor(cosmosEndpoint: string) {
    this.cosmosClientManager = CosmosClientManager.getInstance();
    this.cosmosClientManager.initialize(cosmosEndpoint);
  }

  /**
   * Create a standard error response
   */
  private createError(code: number, message: string): Error {
    return { code, message };
  }

  /**
   * Get or initialize the Cosmos DB container
   */
  private async getContainer(): Promise<Result<Container, Error>> {
    if (this.initialized && this.container) {
      return ok(this.container);
    }

    try {
      const container = await this.cosmosClientManager.getContainer(
        this.databaseName,
        this.containerName
      );
      this.container = container;
      this.initialized = true;
      return ok(container);
    } catch (error) {
      console.error("Failed to initialize Cosmos DB resources:", error);
  
      // Use type guard to safely extract status code or default to 500
      const statusCode = isCosmosError(error) 
        ? error.code || error.statusCode || 500 
        : 500;
      
      return err(this.createError(statusCode, "Failed to initialize Cosmos DB resources"));
    }
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
  async list(ctx: HttpContext): Promise<Result<ReadWidget[], Error>> {
    const containerResult = await this.getContainer();
    if (containerResult.isErr()) {
      return containerResult;
    }

    const container = containerResult.value;
    
    try {
      const { resources } = await container.items
        .query({ query: "SELECT * FROM c" })
        .fetchAll();
      
      return ok(resources.map(doc => this.documentToWidget(doc)));
    } catch (error) {
      console.error("Error listing widgets:", error);
      // Use type guard to safely extract status code or default to 500
      const statusCode = isCosmosError(error) 
        ? error.code || error.statusCode || 500 
        : 500;
      return err(this.createError(statusCode, "Failed to list widgets"));
    }
  }

  /**
   * Read a specific widget by ID
   */
  async read(ctx: HttpContext, id: string): Promise<Result<ReadWidget, Error>> {
    const containerResult = await this.getContainer();
    if (containerResult.isErr()) {
      return containerResult;
    }

    const container = containerResult.value;
    
    try {
      const { resource } = await container.item(id, id).read<WidgetDocument>();
      
      if (!resource) {
        return err(this.createError(404, `Widget with id ${id} not found`));
      }
      
      return ok(this.documentToWidget(resource));
    } catch (error) {
      console.error(`Error reading widget ${id}:`, error);
      // Use type guard to safely extract status code or default to 500
      const statusCode = isCosmosError(error)
        ? error.code || error.statusCode || 500
        : 500;
      return err(this.createError(statusCode, `Failed to read widget ${id}`));
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
  ): Promise<Result<ReadWidget, Error>> {
    const containerResult = await this.getContainer();
    if (containerResult.isErr()) {
      return containerResult;
    }

    const container = containerResult.value;
    
    try {
      // Check if the widget already exists
      const { resource: existingWidget } = await container.item(id, id).read<WidgetDocument>();
      
      if (existingWidget) {
        return err(this.createError(409, `Widget with id ${id} already exists`));
      }

      const newWidget: WidgetDocument = { id, weight, color };
      
      // Azure best practice: Using point operations with strong consistency for writes
      const { resource } = await container.items.create<WidgetDocument>(newWidget);
      
      return ok(this.documentToWidget(resource));
    } catch (error) {
      console.error(`Error creating widget ${id}:`, error);
      // Use type guard to safely extract status code or default to 500
      const statusCode = isCosmosError(error)
        ? error.code || error.statusCode || 500
        : 500;
      return err(this.createError(statusCode, `Failed to create widget ${id}`));
    }
  }

  /**
   * Delete a widget by ID
   */
  async delete(ctx: HttpContext, id: string): Promise<Result<void, Error>> {
    const containerResult = await this.getContainer();
    if (containerResult.isErr()) {
      return containerResult;
    }

    const container = containerResult.value;
    
    try {
      // Check if the widget exists first
      const { resource: existingWidget } = await container.item(id, id).read<WidgetDocument>();
      
      if (!existingWidget) {
        return err(this.createError(404, `Widget with id ${id} not found`));
      }

      await container.item(id, id).delete();
      
      return ok(undefined);
    } catch (error) {
      console.error(`Error deleting widget ${id}:`, error);
      // Use type guard to safely extract status code or default to 500
      const statusCode = isCosmosError(error)
        ? error.code || error.statusCode || 500
        : 500;
      return err(this.createError(statusCode, `Failed to delete widget ${id}`));
    }
  }
}