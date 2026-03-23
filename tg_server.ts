import { z } from 'zod';
import {
    Group,
    Tool,
    ToolGroupConverter,
    ToolConverter,
    ToolgroupMcpServer
} from "./src/toolgroups.js";

const topgroup = new Group("topgroup", null, "Top Title", "Top Description")
const midgroup = new Group("midgroup", topgroup, "Mid Title", "Mid Description")

const server = new ToolgroupMcpServer("myserver", "1.0.0");

server.registerTool(
    'calculate-bmi',
    {
        // The presence of this parent config property is
        // the only difference from the example for McpServer
        parent: midgroup,
        title: 'BMI Calculator',
        description: 'Calculate Body Mass Index',
        inputSchema: z.object({
            weightKg: z.number(),
            heightM: z.number()
        }),
        outputSchema: z.object({ bmi: z.number() })
    },
    async ({ weightKg, heightM }) => {
        const output = { bmi: weightKg / (heightM * heightM) };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }],
            structuredContent: output
        };
    }
);

