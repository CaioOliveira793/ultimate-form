import {
	NodeError,
	NodeKey,
	FieldNode,
	GroupComposer,
	GroupNode,
	NodeSubscriber,
	Option,
	NodeNotification,
} from '@/NodeType';
import { EqualFn, defaultEqualFn, distributeErrors } from '@/Helper';

export interface FieldGroupInput<
	F extends NodeKey,
	T,
	K extends NodeKey,
	V,
	P,
	E extends NodeError,
> {
	field: F;
	parent: GroupNode<P, F, T, E>;
	composer: GroupComposer<T, K, V>;
	initial?: T;
	equalFn?: EqualFn<T>;
	subscriber?: NodeSubscriber<T, E> | null;
}

export class FieldGroup<F extends NodeKey, T, K extends NodeKey, V, P, E extends NodeError>
	implements GroupNode<T, K, V, E>
{
	public constructor({
		field,
		parent,
		composer,
		initial = composer.default(),
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FieldGroupInput<F, T, K, V, P, E>) {
		this.field = field;
		this.parent = parent;
		this.nodes = new Map();
		this.composer = composer;
		this.initial = initial;
		this.touched = false;
		this.active = false;
		this.modified = false;
		this.errors = [];
		this.equalFn = equalFn;
		this.subscriber = subscriber;

		this.nodepath = this.parent.attachNode(this.field, this);
	}

	public attachNode(field: K, node: FieldNode<V, E>): string {
		this.nodes.set(field, node);
		const path = this.nodepath + '.' + field;

		const group = this.parent.extractValue(this.field);
		const value = node.getInitialValue();
		if (!group) return path;

		this.modified = true;
		this.composer.patch(group, field, value as V);
		this.subscriber?.({ type: 'value', value: group });
		this.parent.notify({ node: 'child' });

		return path;
	}

	public detachNode(field: K): boolean {
		const deleted = this.nodes.delete(field);

		const group = this.parent.extractValue(this.field);
		if (group) {
			this.modified = true;
			this.composer.delete(group, field);
			this.subscriber?.({ type: 'value', value: group });
			this.parent.notify({ node: 'child' });
		}
		return deleted;
	}

	public listNode(): Array<[K, FieldNode<V, E>]> {
		return Array.from(this.nodes.entries());
	}

	public getNode(field: K): FieldNode<V, E> | null {
		return this.nodes.get(field) ?? null;
	}

	public extractValue(field: K): Option<V> {
		const group = this.parent.extractValue(this.field);
		if (!group) return;
		return this.composer.extract(group, field);
	}

	public patchValue(field: K, value: V): Option<T> {
		const group = this.parent.extractValue(this.field);
		if (!group) return undefined;
		this.modified = true;
		this.composer.patch(group, field, value);
		return group;
	}

	public hasNestedError(): boolean {
		for (const node of this.nodes.values()) {
			if (node.isValid()) return true;
		}
		return false;
	}

	public handleFocusWithin(): void {
		this.touched = true;

		this.parent.handleFocusWithin();
	}

	public handleBlurWithin(): void {
		this.touched = true;

		this.parent.handleBlurWithin();
	}

	public getInitialValue(): Option<T> {
		return this.initial;
	}

	public getValue(): Option<T> {
		return this.parent.extractValue(this.field);
	}

	public setValue(value: T): void {
		this.modified = true;
		this.parent.patchValue(this.field, value);

		for (const [field, node] of this.nodes.entries()) {
			const data = this.composer.extract(value, field);
			node.notify({ node: 'parent', value: data });
		}

		this.subscriber?.({ type: 'value', value });
		this.parent.notify({ node: 'child' });
	}

	public reset(): void {
		this.setValue(this.initial);
	}

	public getErrors(): Array<E> {
		return this.errors;
	}

	public setErrors(errors: Array<E>): void {
		this.errors = errors;

		this.subscriber?.({ type: 'error', errors: this.getErrors() });
	}

	public appendErrors(errors: Array<E>): void {
		this.parent.appendErrors(errors);

		this.subscriber?.({ type: 'error', errors: this.getErrors() });
	}

	public handleValidation(errors: Array<E>): void {
		this.errors = errors;
		this.subscriber?.({ type: 'error', errors: this.errors });

		distributeErrors(this.errors, this.nodes, this.nodepath + '.');
	}

	public path(): string {
		return this.nodepath;
	}

	public handleFocus(): void {
		this.active = true;
		this.touched = true;

		this.parent.handleFocusWithin();
	}

	public handleBlur(): void {
		this.active = false;
		this.touched = true;

		this.parent.handleBlurWithin();
	}

	public isValid(): boolean {
		return this.errors.length === 0;
	}

	public isDirty(): boolean {
		return !this.equalFn(this.initial, this.parent.extractValue(this.field));
	}

	public isActive(): boolean {
		return this.active;
	}

	public isModified(): boolean {
		return this.modified;
	}

	public isTouched(): boolean {
		return this.touched;
	}

	public notify(notification: NodeNotification<T>): void {
		switch (notification.node) {
			case 'child':
				this.modified = true;
				this.subscriber?.({ type: 'value', value: this.getValue() });
				this.parent.notify({ node: 'child' });
				break;

			case 'parent':
				this.modified = true;
				this.subscriber?.({ type: 'value', value: notification.value });

				if (!notification.value) {
					for (const node of this.nodes.values()) {
						node.notify({ node: 'parent', value: undefined });
					}
					break;
				}

				for (const [field, node] of this.nodes.entries()) {
					const data = this.composer.extract(notification.value, field);
					node.notify({ node: 'parent', value: data });
				}
				break;
		}
	}

	public dispose(): void {
		for (const node of this.nodes.values()) {
			node.dispose();
		}
		this.parent.detachNode(this.field);
	}

	private readonly nodepath: string;
	private readonly field: F;
	private readonly parent: GroupNode<P, F, T, E>;
	private readonly nodes: Map<K, FieldNode<V, E>>;
	private readonly composer: GroupComposer<T, K, V>;
	private readonly initial: T;
	private touched: boolean;
	private active: boolean;
	private modified: boolean;
	private errors: Array<E>;

	private readonly equalFn: EqualFn<T>;
	private readonly subscriber: NodeSubscriber<T, E> | null;
}
