metadata description = 'Bicep template for deploying a GitHub App using Azure Container Apps and Azure Container Registry.'

targetScope = 'resourceGroup'
param serviceName string = 'api'
var databaseName = 'WidgetDb'
var containerName = 'Widgets'
var partitionKey = '/id'

@minLength(1)
@maxLength(64)
@description('Name of the environment that can be used as part of naming resource convention')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

@description('Id of the principal to assign database and application roles.')
param deploymentUserPrincipalId string = ''

var resourceToken = toLower(uniqueString(resourceGroup().id, environmentName, location))

var tags = {
  'azd-env-name': environmentName
  repo: 'https://github.com/typespec'
}

module managedIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.4.1' = {
  name: 'user-assigned-identity'
  params: {
    name: 'identity-${resourceToken}'
    location: location
    tags: tags
  }
}

module cosmosDb 'br/public:avm/res/document-db/database-account:0.8.1' = {
  name: 'cosmos-db-account'
  params: {
    name: 'cosmos-db-nosql-${resourceToken}'
    location: location
    locations: [
      {
        failoverPriority: 0
        locationName: location
        isZoneRedundant: false
      }
    ]
    tags: tags
    disableKeyBasedMetadataWriteAccess: true
    disableLocalAuth: true
    networkRestrictions: {
      publicNetworkAccess: 'Enabled'
      ipRules: []
      virtualNetworkRules: []
    }
    capabilitiesToAdd: [
      'EnableServerless'
    ]
    sqlRoleDefinitions: [
      {
        name: 'nosql-data-plane-contributor'
        dataAction: [
          'Microsoft.DocumentDB/databaseAccounts/readMetadata'
          'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/*'
          'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/*'
        ]
      }
    ]
    sqlRoleAssignmentsPrincipalIds: union(
      [
        managedIdentity.outputs.principalId
      ],
      !empty(deploymentUserPrincipalId) ? [deploymentUserPrincipalId] : []
    )
    sqlDatabases: [
      {
        name: databaseName
        containers: [
          {
            name: containerName
            paths: [
              partitionKey
            ]
          }
        ]
      }
    ]
  }
}

module containerRegistry 'br/public:avm/res/container-registry/registry:0.5.1' = {
  name: 'container-registry'
  params: {
    name: 'containerreg${resourceToken}'
    location: location
    tags: tags
    acrAdminUserEnabled: false
    anonymousPullEnabled: true
    publicNetworkAccess: 'Enabled'
    acrSku: 'Standard'
  }
}

var containerRegistryRole = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '8311e382-0749-4cb8-b61a-304f252e45ec'
) 

module registryUserAssignment 'br/public:avm/ptn/authorization/resource-role-assignment:0.1.1' = if (!empty(deploymentUserPrincipalId)) {
  name: 'container-registry-role-assignment-push-user'
  params: {
    principalId: deploymentUserPrincipalId
    resourceId: containerRegistry.outputs.resourceId
    roleDefinitionId: containerRegistryRole
  }
}

module logAnalyticsWorkspace 'br/public:avm/res/operational-insights/workspace:0.7.0' = {
  name: 'log-analytics-workspace'
  params: {
    name: 'log-analytics-${resourceToken}'
    location: location
    tags: tags
  }
}

module containerAppsEnvironment 'br/public:avm/res/app/managed-environment:0.8.0' = {
  name: 'container-apps-env'
  params: {
    name: 'container-env-${resourceToken}'
    location: location
    tags: tags
    logAnalyticsWorkspaceResourceId: logAnalyticsWorkspace.outputs.resourceId
    zoneRedundant: false
  }
}

module containerAppsApp 'br/public:avm/res/app/container-app:0.9.0' = {
  name: 'container-apps-app'
  params: {
    name: 'container-app-${resourceToken}'
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': serviceName })
    ingressTargetPort: 3000
    ingressExternal: true
    ingressTransport: 'auto'
    stickySessionsAffinity: 'sticky'
    scaleMaxReplicas: 1
    scaleMinReplicas: 1
    corsPolicy: {
      allowCredentials: true
      allowedOrigins: [
        '*'
      ]
    }
    managedIdentities: {
      systemAssigned: false
      userAssignedResourceIds: [
        managedIdentity.outputs.resourceId
      ]
    }
    secrets: {
      secureList: [
        {
          name: 'azure-cosmos-db-nosql-endpoint'
          value: cosmosDb.outputs.endpoint
        }
        {
          name: 'user-assigned-managed-identity-client-id'
          value: managedIdentity.outputs.clientId
        }
      ]
    }
    containers: [
      {
        image: 'mcr.microsoft.com/devcontainers/typescript-node'
        name: serviceName
        resources: {
          cpu: '0.25'
          memory: '.5Gi'
        }
        env: [
          {
            name: 'AZURE_COSMOS_ENDPOINT'
            secretRef: 'azure-cosmos-db-nosql-endpoint'
          }
          {
            name: 'AZURE_COSMOS_DATABASE'
            value: databaseName
          }
          {
            name: 'AZURE_COSMOS_CONTAINER'
            value: containerName
          }
          {
            name: 'AZURE_CLIENT_ID'
            secretRef: 'user-assigned-managed-identity-client-id'
          }
        ]
      }
    ]
  }
}

output AZURE_COSMOS_ENDPOINT string = cosmosDb.outputs.endpoint
output AZURE_COSMOS_DATABASE string = databaseName
output AZURE_COSMOS_CONTAINER string = containerName
output AZURE_COSMOS_PARTITION_KEY string = partitionKey

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_CONTAINER_REGISTRY_USERNAME string = containerRegistry.outputs.location
