import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FormApi } from '@/FormApi';
import { ObjectComposer, ObjectGroupComposer, ValueOf, objectComposer } from '@/GroupComposer';
import { Field } from '@/Field';
import { FieldGroup } from '@/FieldGroup';
import { NodeError, NodeEvent } from '@/NodeType';
import { TestData, TestAddress, delay, TestError, makeSubscriber } from '@/TestUtils';

describe('Field state management', () => {
	it('change state on focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const field = new Field({ parent: form, field: 'name' });

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);

		field.handleFocus();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), true);
	});

	it('change state on focus and blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const field = new Field({ parent: form, field: 'name' });

		field.handleFocus();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), true);

		field.handleBlur();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), false);
	});

	it('change parent state on field focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('change parent state on field focus and blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);

		field.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('execute form validation on field focus event', () => {
		const history: Array<TestData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validationTrigger: 'focus',
			validate: async data => {
				history.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setValue('Carlos Gomes');
		streetField.handleFocus();

		assert.deepStrictEqual(history, [{ address: { street: 'Carlos Gomes', state: undefined } }]);

		stateField.setValue('Bahia');
		stateField.handleFocus();

		assert.deepStrictEqual(history, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
			{ address: { street: 'Carlos Gomes', state: 'Bahia' } },
		]);
	});

	it('change state on blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const field = new Field({ parent: form, field: 'name' });

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);

		field.handleBlur();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), false);
	});

	it('change parent state on field blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('execute form validation on field blur event', () => {
		const history: Array<TestData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validationTrigger: 'blur',
			validate: async data => {
				history.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setValue('Carlos Gomes');
		streetField.handleBlur();

		assert.deepStrictEqual(history, [{ address: { street: 'Carlos Gomes', state: undefined } }]);

		stateField.setValue('Bahia');
		stateField.handleBlur();

		assert.deepStrictEqual(history, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
			{ address: { street: 'Carlos Gomes', state: 'Bahia' } },
		]);
	});

	it('change modified state on field value mutation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.setValue('Av. San');

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);
		assert.strictEqual(field.isModified(), true);
	});

	it('keep state as modified after reseting the field value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.setValue('Av. San');

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);
		assert.strictEqual(field.isModified(), true);

		field.reset();

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);
		assert.strictEqual(field.isModified(), true);
	});

	it('change parent state after a field value mutation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.setValue('Av. San');

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.strictEqual(addressField.isModified(), true);

		assert.strictEqual(form.isTouched(), false);
		assert.strictEqual(form.isActive(), false);
		assert.strictEqual(form.isModified(), true);
	});

	it('change the field state to dirty after its value has been modified', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		assert.strictEqual(field.isModified(), false);
		assert.strictEqual(field.isDirty(), false);

		field.setValue('Av. S');

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), true);
	});

	it('change the field state to not dirty when its value is equal to the initial', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const addressField = new FieldGroup({
			parent: form,
			composer: objectComposer<TestAddress>(),
			field: 'address',
		});
		const field = new Field<'street', string | null, TestError>({
			parent: addressField as FieldGroup<
				'address',
				TestAddress,
				'street',
				string | null,
				NodeError
			>,
			field: 'street',
			initial: null,
		});

		assert.strictEqual(field.isModified(), false);
		assert.strictEqual(field.isDirty(), false);

		field.setValue('Av. S');

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), true);

		field.setValue(null);

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), false);

		assert.deepStrictEqual(field.getInitialValue(), field.getValue());
	});

	it('change the field state to dirty after modifying the parent value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		assert.strictEqual(field.isModified(), false);
		assert.strictEqual(field.isDirty(), false);

		addressField.setValue({ state: 'Rio Grande do Sul', street: 'R' });

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), true);

		assert.notDeepStrictEqual(field.getInitialValue(), field.getValue());
		assert.deepStrictEqual(field.getValue(), 'R');
	});

	it('execute form validation on field change event', () => {
		const history: Array<TestData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validationTrigger: 'value',
			validate: async data => {
				history.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setValue('L');

		assert.deepStrictEqual(history, [
			{ address: {} },
			{ address: { street: undefined } },
			{ address: { street: undefined, state: undefined } },
			{ address: { street: 'L', state: undefined } },
		]);

		stateField.setValue('R');

		assert.deepStrictEqual(history, [
			{ address: {} },
			{ address: { street: undefined } },
			{ address: { street: undefined, state: undefined } },
			{ address: { street: 'L', state: undefined } },
			{ address: { street: 'L', state: 'R' } },
		]);
	});

	it('change the field state to invalid when an error is present in the field', async () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validationTrigger: 'value',
			validate: async data => {
				const errors = [];
				if (data?.address?.street !== undefined) {
					errors.push({ message: 'Invalid street name', path: 'address.street' });
				}
				return errors;
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setValue('invalid');

		await delay(10);

		assert.strictEqual(streetField.isValid('current'), false);
		assert.strictEqual(streetField.isValid('group'), false);

		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'Invalid street name', path: 'address.street' },
		]);

		assert.strictEqual(stateField.isValid(), true);
		assert.deepStrictEqual(stateField.getErrors(), []);
	});

	it('change the field state to valid when the errors are removed from the field', async () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });

		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.strictEqual(streetField.isValid('current'), false);
		assert.strictEqual(streetField.isValid('group'), false);

		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'address street message', path: 'address.street' },
		]);

		streetField.clearErrors();

		assert.strictEqual(streetField.isValid('current'), true);
		assert.strictEqual(streetField.isValid('group'), true);
	});
});

describe('Field error manipulation', () => {
	it('set new errors in a field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setErrors([
			{ message: 'Test error', path: 'address.street' },
			{ message: 'Invalid street name', path: 'address.street' },
		]);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'Test error', path: 'address.street' },
			{ message: 'Invalid street name', path: 'address.street' },
		]);

		assert.strictEqual(stateField.isValid(), true);
		assert.deepStrictEqual(stateField.getErrors(), []);
	});

	it('replace the errors of a field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setErrors([
			{ message: 'error#1', path: 'address.street' },
			{ message: 'error#2', path: 'address.street' },
		]);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'error#1', path: 'address.street' },
			{ message: 'error#2', path: 'address.street' },
		]);

		assert.strictEqual(stateField.isValid(), true);
		assert.deepStrictEqual(stateField.getErrors(), []);

		streetField.setErrors([{ message: 'error#0', path: 'address.street' }]);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'error#0', path: 'address.street' },
		]);
	});

	it('handle errors from the validation function', async () => {
		async function validationFn(data: TestData): Promise<Array<TestError>> {
			const errors = [];
			if (data.name) {
				errors.push({ path: 'name', message: 'invalid name' });
			}
			return errors;
		}
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validate: validationFn,
			validationTrigger: 'value',
		});
		const nameField = new Field({ parent: form, field: 'name' });

		nameField.setValue('none');

		await delay(10);

		assert.deepStrictEqual(nameField.getErrors(), [{ path: 'name', message: 'invalid name' }]);
	});

	it('return all errors from the field when targeting a "group"', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, field: 'name' });

		form.setErrors([{ path: '.', message: 'form error' }]);
		nameField.setErrors([{ path: 'name', message: 'name error' }]);

		assert.deepStrictEqual(nameField.getErrors(), [{ path: 'name', message: 'name error' }]);
		assert.deepStrictEqual(nameField.getErrors('group'), [{ path: 'name', message: 'name error' }]);
	});

	it('clear errors from the field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, field: 'name' });

		form.setErrors([
			{ path: '.', message: 'form error' },
			{ path: 'name', message: 'name error' },
		]);

		assert.deepStrictEqual(nameField.getErrors(), [{ path: 'name', message: 'name error' }]);

		nameField.clearErrors();

		assert.deepStrictEqual(nameField.getErrors(), []);
		assert.deepStrictEqual(nameField.isValid(), true);
	});

	it('clear errors from the field when targeting a "group"', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, field: 'name' });

		form.setErrors([
			{ path: '.', message: 'form error' },
			{ path: 'name', message: 'name error' },
		]);

		assert.deepStrictEqual(nameField.getErrors(), [{ path: 'name', message: 'name error' }]);

		nameField.clearErrors('group');

		assert.deepStrictEqual(nameField.getErrors(), []);
		assert.deepStrictEqual(nameField.isValid(), true);

		assert.deepStrictEqual(form.getErrors(), [{ path: '.', message: 'form error' }]);
		assert.deepStrictEqual(form.isValid(), false);
	});

	it('append new errors into the field', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const nameField = new Field({ parent: form, field: 'name' });

		nameField.appendErrors([{ path: 'name', message: 'error #1' } as TestError]);

		assert.deepStrictEqual(nameField.getErrors(), [{ path: 'name', message: 'error #1' }]);

		nameField.appendErrors([
			{ path: 'name', message: 'error #2' },
			{ path: 'invalid path', message: 'error #3' },
		] as TestError[]);

		assert.deepStrictEqual(nameField.getErrors(), [
			{ path: 'name', message: 'error #1' },
			{ path: 'name', message: 'error #2' },
		]);
	});
});

describe('Field value mutation', () => {
	it('start the field value to initial on attachment', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: 'test',
		});

		assert.deepStrictEqual(streetField.getInitialValue(), 'test');
		assert.deepStrictEqual(streetField.getValue(), 'test');

		assert.deepStrictEqual(addressField.getValue(), { street: 'test' });
	});

	it('set the field value mutating the parent node', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.deepStrictEqual(addressField.getValue(), { street: null });
		assert.deepStrictEqual(streetField.getInitialValue(), null);

		streetField.setValue('another test');

		assert.deepStrictEqual(streetField.getInitialValue(), null);
		assert.deepStrictEqual(streetField.getValue(), 'another test');

		assert.deepStrictEqual(addressField.getValue(), { street: 'another test' });
	});

	it('reset the field value to initial', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: null,
		});

		streetField.setValue('another test');

		assert.deepStrictEqual(streetField.getInitialValue(), null);
		assert.deepStrictEqual(streetField.getValue(), 'another test');

		streetField.reset();

		assert.deepStrictEqual(streetField.getValue(), null);
		assert.deepStrictEqual(addressField.getValue(), { street: null });
	});
});

describe('Field node composition', () => {
	it('dispose a field detaching itself from the form', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.equal(addressField.getNode('street'), streetField);

		streetField.dispose();

		assert.equal(addressField.getNode('street'), null);
	});

	it('have a path of fields form the root node', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.strictEqual(streetField.path(), 'address.street');
	});
});

describe('Field event subscription', () => {
	it('publish a value event after setting a new value in the field', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.deepStrictEqual(history, []);

		streetField.setValue('first');
		assert.deepStrictEqual(history, [{ type: 'value', value: 'first' }]);

		streetField.setValue('on ty');
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'first' },
			{ type: 'value', value: 'on ty' },
		]);

		streetField.setValue('on typ');
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'first' },
			{ type: 'value', value: 'on ty' },
			{ type: 'value', value: 'on typ' },
		]);

		streetField.setValue('on type');
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'first' },
			{ type: 'value', value: 'on ty' },
			{ type: 'value', value: 'on typ' },
			{ type: 'value', value: 'on type' },
		]);
	});

	it('publish a value event after resetting the field', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.deepStrictEqual(history, []);

		streetField.setValue('else');
		assert.deepStrictEqual(history, [{ type: 'value', value: 'else' }]);

		streetField.reset();
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'else' },
			{ type: 'value', value: null },
		]);

		streetField.reset();
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'else' },
			{ type: 'value', value: null },
			{ type: 'value', value: null },
		]);
	});

	it('publish an error event after setting an error in the field', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.deepStrictEqual(history, []);

		streetField.setErrors([{ path: 'address.street', message: '#1' }]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address.street', message: '#1' }] },
		]);

		streetField.setErrors([{ path: 'address.street', message: 'none' }]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address.street', message: '#1' }] },
			{ type: 'error', errors: [{ path: 'address.street', message: 'none' }] },
		]);
	});

	it('publish an error event after executing the validation error handler', async () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validate: async (data: TestData) => {
				const errors = [];
				if (data?.address?.street) {
					errors.push({ path: 'address.street', message: 'the field is invalid' });
				}
				return errors;
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
		});

		assert.deepStrictEqual(history, []);

		streetField.setValue('invalid');
		await delay(10);

		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'invalid' },
			{ type: 'error', errors: [{ path: 'address.street', message: 'the field is invalid' }] },
		]);
	});

	it('publish a value event after a parent node updated notification', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
		});

		assert.deepStrictEqual(history, []);

		addressField.setValue({ street: 'change', state: '' });

		assert.deepStrictEqual(history, [{ type: 'value', value: 'change' }]);

		streetField.notify({ type: 'parent-node-updated', value: 'change again' });

		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'change' },
			{ type: 'value', value: 'change again' },
		]);
	});

	it('not publish a value event after a child node updated notification', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
		});

		assert.deepStrictEqual(history, []);

		streetField.notify({ type: 'child-node-updated' });

		assert.deepStrictEqual(history, []);
	});

	it('publish an error event when appending new errors into the field', () => {
		const history: Array<NodeEvent<string, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, ValueOf<TestData>, TestError>({
			composer: objectComposer<TestData>(),
		});
		const nameField = new Field({
			parent: form as FormApi<TestData, 'name', string, TestError>,
			field: 'name',
			subscriber: makeSubscriber(history),
		});

		nameField.appendErrors([{ path: 'name', message: 'error #1' } as TestError]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'name', message: 'error #1' }] },
		]);
	});

	it('publish an error event when appending new errors from the parent field', () => {
		const history: Array<NodeEvent<string, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, ValueOf<TestData>, TestError>({
			composer: objectComposer<TestData>(),
		});
		const nameField = new Field({
			parent: form as FormApi<TestData, 'name', string, TestError>,
			field: 'name',
			subscriber: makeSubscriber(history),
		});

		form.appendErrors([{ path: 'name', message: 'error #1' } as TestError]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'name', message: 'error #1' }] },
		]);
		assert.deepStrictEqual(nameField.getErrors(), [{ path: 'name', message: 'error #1' }]);
	});
});

describe('Field update notification', () => {
	it('process a notification from a parent node setting the field as modified', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
		});

		assert.strictEqual(streetField.isModified(), false);

		streetField.notify({ type: 'parent-node-updated', value: 'fake' });

		assert.strictEqual(streetField.isModified(), true);
	});

	it('ignore any notification from a child node', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
		});

		// State assertion
		assert.deepStrictEqual(streetField.isTouched(), false);
		assert.deepStrictEqual(streetField.isActive(), false);
		assert.deepStrictEqual(streetField.isModified(), false);
		assert.deepStrictEqual(streetField.isValid(), true);
		assert.deepStrictEqual(streetField.getErrors(), []);

		streetField.notify({ type: 'child-node-updated' });

		assert.deepStrictEqual(streetField.isTouched(), false);
		assert.deepStrictEqual(streetField.isActive(), false);
		assert.deepStrictEqual(streetField.isModified(), false);
		assert.deepStrictEqual(streetField.isValid(), true);
		assert.deepStrictEqual(streetField.getErrors(), []);
	});
});
