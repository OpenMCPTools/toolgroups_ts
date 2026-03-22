import { describe, it, expect } from "vitest";
import { 
    Group, Tool, ToolGroupConverter, ToolConverter 
} from '../src/Common.js';
import { EXTENSION_ID, GroupType } from "../src/GroupSchema.js";
import { Icon } from '@modelcontextprotocol/sdk/types.js';

describe('Toolgroups Tests', () => {

    it('test_group_initialization_and_validation', () => {
        // Test valid initialization
        const g = new Group("root", null, null, "Root Group", "Desc");
        expect(g.name).toBe("root");
        expect(g.title).toBe("Root Group");
        expect(g.description).toBe("Desc");
        expect(g.is_root()).toBe(true);

        // Test name validation
        expect(() => {
            new Group("");
        }).toThrow("name must not be null, empty, or blank");
        
        expect(() => {
            new Group("   ");
        }).toThrow("name must not be null, empty, or blank");
    });

    it('test_group_hierarchy', () => {
        const root = new Group("root");
        const child = new Group("child", root);
        const grandchild = new Group("grandchild");
        
        expect(child.parent).toBe(root);
        expect(root.get_child_groups()).toContain(child);
        expect(child.fqname).toBe("root.child");
        
        child.add_child_group(grandchild);
        expect(grandchild.parent).toBe(child);
        expect(grandchild.fqname).toBe("root.child.grandchild");
        expect(grandchild.get_root()).toBe(root);
        
        // Test removal
        root.remove_child_group(child);
        expect(child.parent).toBeNull();
        expect(child.is_root()).toBe(true);
        expect(child.fqname).toBe("child");
    });

    it('test_tool_and_group_association', () => {
        const root = new Group("math");
        const tool = new Tool("add", ".", root, null, "Add numbers");
        
        expect(tool.name).toBe("add");
        expect(tool.fqname).toBe("math.add");
        expect(tool.get_parent_groups()).toContain(root);
        expect(root.get_child_tools()).toContain(tool);
        
        // Test multi-parent
        const otherGroup = new Group("utils");
        tool.add_parent_group(otherGroup);
        expect(tool.get_parent_groups()).toContain(otherGroup);
        expect(tool.get_parent_groups().length).toBe(2);
    });

    it('test_fqname_custom_separator', () => {
        const root = new Group("a", null, "/");
        const child = new Group("b", root, "/");
        const tool = new Tool("c", "/", child);
        
        expect(child.fqname).toBe("a/b");
        expect(tool.fqname).toBe("a/b/c");
    });

    it('test_tool_group_converter', () => {
        const converter = new ToolGroupConverter();
        
        // Test convert_from (Group -> GroupSchema/POJO)
        const g = new Group("test_group", null, null, "Title", null, null, { "key": "value" });
        var s = converter.convert_from(g);
        // In TS, converter.convert_from returns a GroupType (POJO)
//        expect((s as GroupType).name.toBe("test_group");
//        expect((s as GroupType).title.toBe("Title");
//        expect(s as GroupType)._meta.toEqual({ "key": "value" });
        
        // Test convert_to (GroupSchema/dict -> Group)
        // Using dict (as pydantic might)
        const sourceDict = { "name": "cached_group", "title": "Cached" };
        const gConverted = converter.convert_to(sourceDict);
        expect(gConverted.name).toBe("cached_group");
        
        // Test caching
        const gCached = converter.convert_to({ "name": "cached_group" });
        expect(gConverted).toBe(gCached);
    });

    it('test_tool_converter', () => {
        const tc = new ToolConverter();
        
        // Test convert_from (Internal Tool -> mcpt.Tool)
        const g = new Group("grp");
        const t = new Tool("mytool", ".", g, null, "desc");
        const mcpTool = tc.convert_from(t);
        
        expect(mcpTool.name).toBe("grp.mytool");
        expect(mcpTool._meta).toHaveProperty(EXTENSION_ID);
        // The first element in meta[EXTENSION_ID] should represent the parent group
        const groupMeta = (mcpTool._meta as any)[EXTENSION_ID][0];
        expect(groupMeta.name).toBe("grp");

        // Test convert_to (mcpt.Tool -> Internal Tool)
        // Re-using the converted mcpTool
        const tBack = tc.convert_to(mcpTool);
        expect(tBack.name).toBe("mytool");
        expect(tBack.fqname).toBe("grp.mytool");
        expect(tBack.get_parent_groups()[0].name).toBe("grp");
    });


    it('test_abstract_base_properties', () => {
        // Group is a concrete impl of AbstractBase
        class Concrete extends Group {}
        
        const obj = new Concrete("test");
        obj.title = "New Title";
        obj.description = "New Desc";
        const icons: Icon[] = [{ src: "uri", mimeType: "image/png" }];
        obj.icons = icons;
        const meta = { "foo": "bar" };
        obj.meta = meta;
        
        expect(obj.title).toBe("New Title");
        expect(obj.description).toBe("New Desc");
        expect(obj.icons).toEqual(icons);
        expect(obj.meta).toEqual(meta);
    });

});
