import { Icon, ToolAnnotations, Tool as OTool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { BaseMetadataSchema } from '@modelcontextprotocol/sdk/types.js';

export const EXTENSION_ID = "org.openmcptools/groups" as const;

/**
 * Zod schema for a Group.
 * Uses `z.lazy` for the recursive `parent` reference.
 */
export const GroupSchema: z.ZodType = z.lazy(() =>
  BaseMetadataSchema.extend({
    description: z.string().optional(),
    parent: GroupSchema.optional(),
    _meta: z.record(z.string(), z.unknown()).optional(),
  }),
);

export type GroupType = z.infer<typeof GroupSchema>;

class DefaultMetadata {
	
}
export abstract class AbstractBase {
  static readonly DEFAULT_SEPARATOR = ".";

  protected readonly _name: string;
  protected _title: string | null = null;
  protected _description: string | null = null;
  protected _icons: Icon[] | null = null;
  protected _meta: Record<string, any> | null = null;
  protected _name_separator: string = AbstractBase.DEFAULT_SEPARATOR;

  constructor(
      name: string,
      title: string | null = null,
      description: string | null = null,
      icons: Icon[] | null = null,
      meta: Record<string, any> | null = null,
	  name_separator: string = null,
  ) {
      // Validation for name parameter
      if (!name || name.trim().length === 0) {
          throw new Error("name must not be null, empty, or blank");
      }
      this._name = name;
      if (name_separator !== null) {
          this._name_separator = name_separator;
      }
      this._title = title;
      this._description = description;
      this._icons = icons;
      this._meta = meta;
  }

  get name_separator(): string {
      return this._name_separator;
  }

  get name(): string {
      return this._name;
  }

  get title(): string | null {
      return this._title;
  }

  set title(title: string | null) {
      this._title = title;
  }

  get description(): string | null {
      return this._description;
  }

  set description(description: string | null) {
      this._description = description;
  }

  get icons(): Icon[] | null {
      return this._icons;
  }

  set icons(icons: Icon[] | null) {
      this._icons = icons;
  }

  get meta(): Record<string, any> | null {
      return this._meta;
  }

  set meta(meta: Record<string, any> | null) {
      this._meta = meta;
  }

  protected _add<T>(child: T, list: T[], fn: (() => void) | null): boolean {
      if (!list.includes(child)) {
          list.push(child);
          if (fn) {
              fn();
          }
          return true;
      }
      return false;
  }

  protected _remove<T>(child: T, list: T[], fn: (() => void) | null): boolean {
      const index = list.indexOf(child);
      if (index !== -1) {
          list.splice(index, 1);
          if (fn) {
              fn();
          }
          return true;
      }
      return false;
  }

  public abstract get fqname(): string;
}

export class Group extends AbstractBase {
    protected _child_groups: Group[] = [];
    protected _child_tools: Tool[] = [];
    protected _parent: Group | null = null;

    constructor(
        name: string,
        parent: Group | null = null,
        title: string | null = null,
        description: string | null = null,
        icons: Icon[] | null = null,
        meta: Record<string, any> | null = null,
		name_separator: string | null = null
    ) {
        super(name, title, description, icons, meta, name_separator);
        if (parent) {
            parent.add_child_group(this);
        }
    }

    get parent(): Group | null {
        return this._parent;
    }

    public _set_parent(parent_group: Group | null): void {
        this._parent = parent_group;
    }

    public is_root(): boolean {
        return this._parent === null;
    }

    public get_root(): Group {
        if (this._parent === null) {
            return this;
        } else {
            return this._parent.get_root();
        }
    }

    public add_child_group(child_group: Group): boolean {
        return this._add(child_group, this._child_groups, () => child_group._set_parent(this));
    }

    public remove_child_group(child_group: Group): boolean {
        return this._remove(child_group, this._child_groups, () => child_group._set_parent(null));
    }

    public get_child_groups(): Group[] {
        return this._child_groups;
    }

    public add_child_tool(child_tool: Tool): boolean {
        return this._add(child_tool, this._child_tools, () => child_tool.add_parent_group(this));
    }

    public remove_child_tool(child_tool: Tool): boolean {
        return this._remove(child_tool, this._child_tools, () => child_tool.remove_parent_group(this));
    }

    public get_child_tools(): Tool[] {
        return this._child_tools;
    }

    private _get_fq_name(tg: Group): string {
        const parent = tg.parent;
        if (parent !== null) {
            const parent_name = this._get_fq_name(parent);
            return parent_name + this.name_separator + tg.name;
        }
        return tg.name;
    }

    public get fqname(): string {
        return this._get_fq_name(this);
    }

    public toString(): string {
        return `Group(name=${this.name} fqname=${this.fqname} parent=${this.parent} title=${this.title} description=${this.description} meta=${JSON.stringify(this.meta)})`;
    }
}

export abstract class AbstractLeaf extends AbstractBase {
    protected _parent_groups: Group[] = [];

    public add_parent_group(parent_group: Group): boolean {
        return this._add(parent_group, this._parent_groups, null);
    }

    public remove_parent_group(parent_group: Group): boolean {
        return this._remove(parent_group, this._parent_groups, null);
    }

    public get_parent_groups(): Group[] {
        return this._parent_groups;
    }

    protected _get_primary_parent_name(): string | null {
        return this._parent_groups.length > 0 ? this._parent_groups[0].fqname : null;
    }

    public get fqname(): string {
        const first_parent_name = this._get_primary_parent_name();
        return first_parent_name === null ? this.name : first_parent_name + this.name_separator + this.name;
    }
}

export class Tool extends AbstractLeaf {
	
    protected _annotations: ToolAnnotations | null = null;
    protected _input_schema: Record<string, any> | null = null;
    protected _output_schema: Record<string, any> | null = null;

    constructor(
        name: string,
        parent: Group | null = null,
        title: string | null = null,
        description: string | null = null,
        icons: Icon[] | null = null,
        meta: Record<string, any> | null = null,
		annotations: ToolAnnotations | null = null,
		input_schema: Record<string, any> = {},
		output_schema: Record<string, any> | null = null,
		name_separator: string | null = null
    ) {
        super(name, title, description, icons, meta, name_separator);
        this._annotations = annotations;
        this._input_schema = input_schema;
        this._output_schema = output_schema;
        if (parent !== null) {
            parent.add_child_tool(this);
        }
    }

    public get_roots(): Group[] {
        return Array.from(new Set(this.get_parent_groups()));
    }

    get annotations(): ToolAnnotations | null {
        return this._annotations;
    }

    set annotations(value: ToolAnnotations | null) {
        this._annotations = value;
    }

    get input_schema(): Record<string, any> | null {
        return this._input_schema;
    }

    set input_schema(value: Record<string, any> | null) {
        this._input_schema = value;
    }

    get output_schema(): Record<string, any> | null {
        return this._output_schema;
    }

    set output_schema(value: Record<string, any> | null) {
        this._output_schema = value;
    }

    public toString(): string {
        return `Tool(name=${this.name} fqname=${this.fqname} title=${this.title} description=${this.description} input_schema=${JSON.stringify(this.input_schema)} output_schema=${JSON.stringify(this.output_schema)} icons=${JSON.stringify(this.icons)} annotations=ToolAnnotations(${JSON.stringify(this.annotations)}) meta=${JSON.stringify(this.meta)} parent_groups=${this.get_parent_groups()})`;
    }
}

export class ToolGroupConverter {
    private _group_cache: Map<string, Group>;

    constructor() {
        this._group_cache = new Map<string, Group>();
    }

    public convert_to(source: any): Group {
        let name: string;
        let parent: any;
        let title: string | null;
        let description: string | null;
        let meta: Record<string, any> | null;

        // pydantic provides dict when deserializing
        if (typeof source === 'object' && source !== null && !('name' in source)) {
            // Mapping for plain object/dict
            name = source.name;
            parent = source.parent || null;
            title = source.title || null;
            description = source.description || null;
            meta = source.meta || null;
        } else {
            name = source.name;
            parent = source.parent;
            title = source.title;
            description = source.description;
            meta = source.meta;
        }

        /** get from cache if present */
        let g = this._group_cache.get(name);
        if (!g) {
            g = new Group(
                name,
                parent ? this.convert_to(parent) : null,
                null,
                title,
                description,
                null,
                meta
            );
            /** place in cache by name */
            this._group_cache.set(name, g);
        }
        return g;
    }

    public convert_from(target: Group): GroupType {
        return { 
            name: target.name,
            parent: target.parent ? this.convert_from(target.parent) : undefined,
            title: target.title || undefined,
            description: target.description || undefined,
            _meta: target.meta || undefined
        };
    }

    public convert_to_list(sources: GroupType[] | null): Group[] | null {
        if (!sources) {
            return null;
        }
        return sources.map(s => this.convert_to(s));
    }

    public convert_from_list(targets: Group[] | null): GroupType[] | null {
        if (!targets) {
            return null;
        }
        return targets.map(s => this.convert_from(s));
    }
}

export class ToolConverter {
    private _group_converter: ToolGroupConverter;

    constructor() {
        this._group_converter = new ToolGroupConverter();
    }

    private _convert_from_groupex(t_name: string, t_meta: Record<string, any> | null): [string, Group | null, Record<string, any> | null, Group[] | null] {
        /** converts name and meta to a tuple with 4 elements:
         * 0=tool_name, 1=parent, 2=tool meta, 3=extra parent groups */
        let name = String(t_name);
        let meta = t_meta ? { ...t_meta } : null;
        let parent: Group | null = null;
        let extra: Group[] | null = null;

        if (meta) {
            const extensionData = meta[EXTENSION_ID];
            if (extensionData) {
                delete meta[EXTENSION_ID];
                const gex = this._group_converter.convert_to_list(extensionData);
                if (gex && gex.length > 0) {
                    /** parent is assumed to be first in list */
                    parent = gex[0];
                    /** modify the tool name by removing the parent fully qualified name */
                    name = name.substring(parent.fqname.length + parent.name_separator.length);
                    /** remove parent element and leave any remaining groups */
                    extra = gex.slice(1);
                }
            }
        }

        return [
            name,
            parent,
            (meta && Object.keys(meta).length > 0) ? meta : null,
            (extra && extra.length > 0) ? extra : null
        ];
    }

    private _convert_to_groupex(parent_groups: Group[], t_meta: Record<string, any> | null): Record<string, any> | null {
        const groups = this._group_converter.convert_from_list(parent_groups);
        const meta = t_meta ? { ...t_meta } : {};
        if (groups && groups.length > 0) {
            meta[EXTENSION_ID] = groups;
        }
        return Object.keys(meta).length > 0 ? meta : null;
    }

    public convert_to(s: OTool): Tool {
        /** first convert from groupex */
        const ext = this._convert_from_groupex(s.name, s._meta || null);
        /** tuple result: 0=tool_name, 1=parent group, 2=meta */
        const t = new Tool(
            ext[0],
            ext[1],
            s.title,
            s.description,
            s.icons,
			ext[2],
            s.annotations,
            s.inputSchema,
            s.outputSchema,
			AbstractBase.DEFAULT_SEPARATOR
        );
        /** tuple result 3=list of additional parents */
        if (ext[3]) {
            for (const g of ext[3]) {
                g.add_child_tool(t);
            }
        }
        return t;
    }

    public convert_to_list(tools: OTool[]): Tool[] {
        return tools.map(t => this.convert_to(t));
    }

	public convert_from(t: Tool): OTool {
	        /** first convert to groupex */
	        const meta = this._convert_to_groupex(t.get_parent_groups(), t.meta);
	        /** tuple result: 0=parent, 1=meta */
	        return {
	            name: t.fqname,
	            title: t.title || undefined,
	            description: t.description || undefined,
	            icons: t.icons || undefined,
				inputSchema:  { type: "object"},
	            annotations: t.annotations || undefined,
	            _meta: meta || undefined,
	        };
	}

	    public convert_from_list(tools: Tool[]): OTool[] {
	        return tools.map(t => this.convert_from(t));
	    }
	}
