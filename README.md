# MCP Toolgroups Server Extension

[MCP servers](https://modelcontextprotocol.io/docs/learn/server-concepts) frequently have a large number of mcp tools to expose. This is especially true
for enterprise servers and gateways, that need to aggregate and expose multiple tools to clients.

This project provides an extension for the [MCP typescript sdk](https://github.com/modelcontextprotocol/typescript-sdk) to support the use of
server toolgroups.

Toolgroups represent collections of MCP tools. Groups may be hierarchical or flat, as defined by the developer. These groupings may or may not be communicated to MCP clients as this decision can be made at request time, and so may be based upon arbitrary server criteria (e.g. current security boundaries, user role/authorization, organizational governance, and administration, etc).

Toolgroups also provide a way to prevent or reduce the inefficiencies in 
context exchange between clients and servers with many tools (e.g. gateways). [See here for a clear description of this context bloat and aggregation problem](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/2204?sort=new#discussioncomment-15994902).

Groups may also have their own metadata (e.g. title, description, etc) defined by the server. This metadata can be used to define
domain-appropriate abstractions for use by clients. 

## Example: Toolgroups McpServer

Part of the toolgroups API is a [toolgroups server class](https://github.com/OpenMCPTools/toolgroups_ts/blob/main/src/toolgroups.ts#L466) that extends the [typescript sdk's McpServer class](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/src/server/mcp.ts#L61) to allow the registration of tools organized into hierarchical groups.  

The following is the [toolgroups_server.ts example](https://github.com/OpenMCPTools/toolgroups_ts/blob/main/examples/toolgroup_server.ts)

First create the group hierarchy with group-specifica meta-data

```typescript
const topgroup = new Group("topgroup", { title: "Top Title", description: "Top Description" })
// topgroup is parent to midgroup
const midgroup = new Group("midgroup", { title: "Mid Title", description: "Mid Description" }, topgroup);

```
Create toolgroup server instance
```typescript
const server = new ToolgroupMcpServer("myserver", "1.0.0");
```
Register the tool with its parent group as the last argument

```typescript
// Register a name, config, callback fn, and parent (midgroup)
// This example uses the example 'calculate-bmi' tool from the
// McpServer.registerTool method documentation.  The only difference
// below is the inclusion of the midgroup Group as a 4th argument.
server.registerTool(
    // From McpServer.registerTool docs
    'calculate-bmi',
    // From McpServer.registerTool docs
    {
        title: 'BMI Calculator',
        description: 'Calculate Body Mass Index',
        inputSchema: z.object({
            weightKg: z.number(),
            heightM: z.number()
        }),
        outputSchema: z.object({ bmi: z.number() })
    },
    // From McpServer.registerTool docs
    async ({ weightKg, heightM }) => {
        const output = { bmi: weightKg / (heightM * heightM) };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }],
            structuredContent: output
        };
    },
    // Include parent Group
    midgroup
);
```
## Running this Example
```
To run this example from project directory
```console
npx tsx .\examples\toolgroup_server.ts
```
## Runing API Unit Tests
```text
npm run test
```
## Reference
The following group schema definition is implemented [here](https://github.com/OpenMCPTools/toolgroups_ts/blob/main/src/toolgroups.ts#L14).  The same schema (and EXTENSION_ID constant) are used for the [python version of toolgroups](https://github.com/OpenMCPTools/toolgroups), and the [java version of toolgroups support](https://github.com/OpenMCPTools/mcp_common_java).  This allows client-server interoperability across these languages.

## Group Schema
```json
        "Group": {
            "properties": {
                "name": {
                    "type": "string"
                },
                "parent": {
                    "$ref": "#/definitions/Group",
                },
                "description": {
                    "type": "string"
                },
                "title": {
                    "type": "string"
                },
                "_meta": {
                    "additionalProperties": {},
                    "type": "object"
                }
            },
            "required": [
                "name"
            ],
            "type": "object"
        }
```

