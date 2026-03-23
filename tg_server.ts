import { 
	Group, 
	Tool, 
	ToolGroupConverter, 
	ToolConverter } from "./src/toolgroups.js";

const topgroup = new Group("topgroup", null, "Top Title", "Top Description")
const midgroup = new Group("midgroup", topgroup, "Mid Title", "Mid Description")
console.log("midgroup="+midgroup)
