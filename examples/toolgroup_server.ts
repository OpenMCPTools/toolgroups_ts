import { z } from 'zod';
import { Group, ToolgroupMcpServer } from "../src/toolgroups.js";

// Create a top group
const topgroup = new Group("topgroup", { title: "Top Title", description: "Top Description" })
console.log("created topgroup=" + topgroup)
// Create a mid group (with topgroup as parent)
const midgroup = new Group("midgroup", { title: "Mid Title", description: "Mid Description" }, topgroup);
console.log("created midgroup=" + midgroup)
// Create a toolgroup server
const server = new ToolgroupMcpServer("myserver", "1.0.0");
// Register a name, config, callback fn, and parent (midgroup)
// This example uses the example 'calculate-bmi' tool from the
// McpServer.registerTool method documentation.  The only difference
// below is the inclusion of the midgroup Group as a 4th argument.
const r_tool = server.registerTool(
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

console.log("registered tool with ToolgroupsServer="+JSON.stringify(r_tool));
