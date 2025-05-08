export declare const openApiDocument: {
    openapi: string;
    info: {
        title: string;
        version: string;
    };
    tags: {
        name: string;
    }[];
    paths: {
        "/widgets": {
            get: {
                operationId: string;
                parameters: never[];
                responses: {
                    "200": {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    type: string;
                                    items: {
                                        $ref: string;
                                    };
                                };
                            };
                        };
                    };
                    default: {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
                tags: string[];
            };
            post: {
                operationId: string;
                parameters: never[];
                responses: {
                    "200": {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    default: {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        "application/json": {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
            };
        };
        "/widgets/{id}": {
            get: {
                operationId: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    "200": {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    default: {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
                tags: string[];
            };
            delete: {
                operationId: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    "204": {
                        description: string;
                    };
                    default: {
                        description: string;
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
                tags: string[];
            };
        };
    };
    components: {
        schemas: {
            ReadWidgetItem: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                    };
                    weight: {
                        type: string;
                        format: string;
                    };
                    color: {
                        type: string;
                        enum: string[];
                    };
                };
                description: string;
            };
            Error: {
                type: string;
                required: string[];
                properties: {
                    code: {
                        type: string;
                        format: string;
                    };
                    message: {
                        type: string;
                    };
                };
            };
            ReadWidget: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                    };
                    weight: {
                        type: string;
                        format: string;
                    };
                    color: {
                        type: string;
                        enum: string[];
                    };
                };
                description: string;
            };
            CreateWidget: {
                type: string;
                required: string[];
                properties: {
                    id: {
                        type: string;
                    };
                    weight: {
                        type: string;
                        format: string;
                    };
                    color: {
                        type: string;
                        enum: string[];
                    };
                };
                description: string;
            };
        };
    };
};
