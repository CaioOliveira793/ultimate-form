import { NodeKey, GroupComposer } from '@/NodeType';

export type ArrayComposer<T> = GroupComposer<Array<T>, number, T>;

export const ArrayGroupComposer = Object.freeze({
	default() {
		return [];
	},
	assemble(attributes: Array<[number, unknown]>): Array<unknown> {
		const group = [];
		for (const [key, val] of attributes) {
			group[key] = val;
		}
		return group;
	},
	patch(group: Array<unknown>, key: number, value: unknown): void {
		group[key] = value;
	},
	delete(group: Array<unknown>, key: number) {
		delete group[key];
	},
	extract(group: Array<unknown>, key: number): unknown {
		return group[key];
	},
}) as Readonly<ArrayComposer<unknown>>;

export type ObjectComposer<O extends object> = keyof O extends NodeKey
	? GroupComposer<O, keyof O, O[keyof O]>
	: GroupComposer<O, Extract<keyof O, NodeKey>, O[keyof O]>;

export const ObjectGroupComposer = Object.freeze({
	default() {
		return {};
	},
	assemble(attributes: Array<[string, unknown]>): Record<string, unknown> {
		return Object.fromEntries(attributes);
	},
	patch(group: Record<string, unknown>, key: string, value: unknown): void {
		group[key] = value;
	},
	delete(group: Record<string, unknown>, key: string) {
		delete group[key];
	},
	extract(group: Record<string, unknown>, key: string): unknown {
		return group[key];
	},
}) as ObjectComposer<object>;
