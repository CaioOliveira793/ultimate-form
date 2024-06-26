import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isDeepStrictEqual } from 'node:util';
import { FormApi } from '@/FormApi';
import { Field } from '@/Field';
import { FieldGroup } from '@/FieldGroup';
import { ObjectComposer, ObjectGroupComposer, ValueOf, objectComposer } from '@/GroupComposer';
import { Node, NodeError, NodeEvent } from '@/NodeType';
import { TestAddress, TestError, TestData, delay, makeSubscriber } from '@/TestUtils';

describe('FormApi state management', () => {
	it('change the form state to drity after the value is different than the initial', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			equalFn: isDeepStrictEqual,
			initial: { name: 'Thomas', address: { state: 'SP' } },
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		form.resetValue();

		assert.strictEqual(form.isDirty(), false);

		nameField.setValue('different');

		assert.strictEqual(form.isDirty(), true);

		form.resetValue();
		addressField.setValue({ street: 'none' } as TestAddress);

		assert.strictEqual(form.isDirty(), true);

		form.resetValue();

		assert.strictEqual(form.isDirty(), false);
	});

	it('change the form state to active when the form handle a focus event', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});

		assert.strictEqual(form.isActive(), false);

		form.handleFocus();

		assert.strictEqual(form.isActive(), true);
	});

	it('change the form state to inactive when the form handle a blur event', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});

		form.handleFocus();

		assert.strictEqual(form.isActive(), true);

		form.handleBlur();

		assert.strictEqual(form.isActive(), false);

		form.handleBlur();

		assert.strictEqual(form.isActive(), false);
	});

	it('change the form state to modified when attaching a node into the form', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});

		assert.strictEqual(form.isModified(), false);

		new Field({ parent: form, key: 'name' });

		assert.strictEqual(form.isModified(), true);
	});

	it('keep the form state as modified when attaching a node into the form with a falsy form value', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			initial: null,
		});

		assert.strictEqual(form.isModified(), false);

		new Field({ parent: form, key: 'name' });

		assert.strictEqual(form.isModified(), false);
	});

	it('change the form state to modified when detaching a node from the form', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});

		assert.strictEqual(form.detachNode('name'), false);

		assert.strictEqual(form.isModified(), true);
	});

	it('change the form state to modified when patching the form value', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});

		form.patchValue('name', 'test');

		assert.strictEqual(form.isModified(), true);
	});

	it('change the form state to modified when setting the form value', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});

		form.setValue({ name: 'test' } as TestData);

		assert.strictEqual(form.isModified(), true);
	});

	it('change the form state to modified when setting the value of a field', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, key: 'name' });

		nameField.setValue('test');

		assert.strictEqual(form.isModified(), true);
	});

	it('change the form state to touched when a form focus event is handled', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});

		assert.strictEqual(form.isTouched(), false);

		form.handleFocus();

		assert.strictEqual(form.isTouched(), true);
	});

	it('change the form state to touched when a form blur event is handled', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});

		assert.strictEqual(form.isTouched(), false);

		form.handleBlur();

		assert.strictEqual(form.isTouched(), true);
	});

	it('change the form state to touched when a field inside the form handle a focus event', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, key: 'name' });

		assert.strictEqual(form.isTouched(), false);

		nameField.handleFocus();

		assert.strictEqual(form.isTouched(), true);
	});

	it('change the form state to touched when a field inside the form handle a blur event', () => {
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, key: 'name' });

		assert.strictEqual(form.isTouched(), false);

		nameField.handleBlur();

		assert.strictEqual(form.isTouched(), true);
	});

	it('change the form field to invalid when an error is prensent in the root field', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		form.setErrors([{ path: '.', message: 'root field message' } as TestError]);

		assert.deepStrictEqual(form.isValid(), false);
		assert.deepStrictEqual(form.getErrors(), [{ path: '.', message: 'root field message' }]);
	});

	it('change the form state to invalid when an error is prensent in any field of the form', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid('group'), false);
		assert.deepStrictEqual(form.getErrors('group'), [
			{ path: 'address.street', message: 'address street message' },
		]);

		form.clearErrors('group');

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid('group'), true);
		assert.deepStrictEqual(form.getErrors('group'), []);

		nameField.setErrors([{ path: 'name', message: 'name message' } as TestError]);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid('group'), false);
		assert.deepStrictEqual(form.getErrors('group'), [{ path: 'name', message: 'name message' }]);
	});

	it('change the form to valid when the all errors are removed', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });

		nameField.setErrors([{ path: 'name', message: 'name message' } as TestError]);
		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid('group'), false);
		assert.deepStrictEqual(form.getErrors('group').length, 2);

		form.clearErrors('group');

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);
	});
});

describe('FormApi form submission', () => {
	it('submit the data in the form', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			submit: function (data: TestData) {
				history.push(structuredClone(data));
			},
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, key: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);
		stateField.setValue('TX');

		{
			const value = form.getValue();
			assert.deepStrictEqual(value, {
				name: 'Carl',
				address: {
					state: 'TX',
					street: 'St. a',
				},
			});
		}

		const state = await form.submitAsync();
		assert.strictEqual(state, 'success');

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: {
					state: 'TX',
					street: 'St. a',
				},
			},
		]);
	});

	it('throw a validation error when submitting the form', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			submit: async function (data: TestData) {
				history.push(structuredClone(data));
			},
			validate: async function (data: TestData) {
				const errors = [];

				if (data?.address?.state !== undefined) {
					errors.push({ path: 'address.state', message: 'address state error' });
				}

				return errors;
			},
			validationTrigger: 'value',
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, key: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);

		{
			const value = form.getValue();
			assert.deepStrictEqual(value, {
				name: 'Carl',
				address: {
					street: 'St. a',
				},
			});

			await delay(10);

			const errors = form.getErrors();
			assert.deepStrictEqual(errors, []);

			const state = await form.submitAsync();
			assert.strictEqual(state, 'success');
		}

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: { street: 'St. a' },
			},
		]);

		stateField.setValue('NY');

		{
			const value = form.getValue();
			assert.deepStrictEqual(value, {
				name: 'Carl',
				address: {
					street: 'St. a',
					state: 'NY',
				},
			});

			await delay(10);

			const errors = stateField.getErrors();
			assert.deepStrictEqual(errors, [{ path: 'address.state', message: 'address state error' }]);
		}

		{
			const state = await form.submitAsync();
			assert.strictEqual(state, 'validation_error');
		}

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: { street: 'St. a' },
			},
		]);
	});

	it('throw a submit error when submitting the form', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			submit: async function (data: TestData) {
				const errors: Array<TestError> = [];

				if (data?.address?.state !== undefined) {
					errors.push({ path: 'address.state', message: 'address state error' });
					return errors;
				}

				history.push(structuredClone(data));
				return errors;
			},
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, key: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);

		{
			const state = await form.submitAsync();
			assert.strictEqual(state, 'success');
		}

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: { street: 'St. a' },
			},
		]);

		stateField.setValue('NY');

		{
			const state = await form.submitAsync();
			assert.strictEqual(state, 'submit_error');
		}

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: { street: 'St. a' },
			},
		]);

		const errors = stateField.getErrors();
		assert.deepStrictEqual(errors, [{ path: 'address.state', message: 'address state error' }]);
	});

	it('execute the asynchronous submit function in the background', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			submit: function (data: TestData) {
				history.push(structuredClone(data));
			},
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, key: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);
		stateField.setValue('TX');

		{
			const value = form.getValue();
			assert.deepStrictEqual(value, {
				name: 'Carl',
				address: {
					state: 'TX',
					street: 'St. a',
				},
			});
		}

		form.submit();

		assert.deepStrictEqual(history, []);

		await delay(10);

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: {
					state: 'TX',
					street: 'St. a',
				},
			},
		]);
	});

	it('catch an error thrown from the submit function', async () => {
		const errorHistory: Array<unknown> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			submit: async function () {
				throw 'should not happen in submit';
			},
			submitRejection: function (err: unknown) {
				errorHistory.push(err);
			},
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, key: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);
		stateField.setValue('NY');

		form.submit();

		await delay(10);

		const errors = stateField.getErrors();
		assert.deepStrictEqual(errors, []);

		assert.deepStrictEqual(errorHistory, ['should not happen in submit']);
	});

	it('catch an error thrown from the validation function', async () => {
		const errorHistory: Array<unknown> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validateRejection: function (err: unknown) {
				errorHistory.push(err);
			},
			validate: async function (data: TestData) {
				const errors: Array<TestError> = [];

				if (data?.address?.state !== undefined) {
					throw 'should not happen in validate';
				}

				return errors;
			},
			validationTrigger: 'value',
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, key: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);
		stateField.setValue('NY');

		await delay(10);

		assert.deepStrictEqual(errorHistory, ['should not happen in validate']);

		form.submit();

		await delay(10);

		const errors = stateField.getErrors();
		assert.deepStrictEqual(errors, []);

		assert.deepStrictEqual(errorHistory, [
			'should not happen in validate',
			'should not happen in validate',
		]);
	});
});

describe('FormApi error manipulation', () => {
	it('set the errors in the form root field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		form.setErrors([
			{ message: 'root form error', path: '.' },
			{ message: 'name error', path: 'name' },
		]);

		assert.strictEqual(form.isValid(), false);
		assert.deepStrictEqual(form.getErrors(), [{ message: 'root form error', path: '.' }]);

		assert.strictEqual(addressField.isValid(), true);
		assert.deepStrictEqual(addressField.getErrors(), []);

		assert.strictEqual(nameField.isValid(), false);
		assert.deepStrictEqual(nameField.getErrors(), [{ message: 'name error', path: 'name' }]);
	});

	it('propagate errors from the form root field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });
		const stateField = new Field({ parent: addressField, key: 'state' });

		form.setErrors([
			{ path: '.', message: 'root form error' },
			{ path: 'address', message: 'address error' },
			{ path: 'address.street', message: 'street error 1' },
			{ path: 'address.street', message: 'street error 2' },
			{ path: 'address.state', message: 'state error' },
		]);

		assert.strictEqual(form.isValid(), false);
		assert.deepStrictEqual(form.getErrors(), [{ path: '.', message: 'root form error' }]);

		assert.strictEqual(nameField.isValid(), true);
		assert.deepStrictEqual(nameField.getErrors(), []);

		assert.strictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address error' },
		]);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ path: 'address.street', message: 'street error 1' },
			{ path: 'address.street', message: 'street error 2' },
		]);

		assert.strictEqual(stateField.isValid(), false);
		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'state error' },
		]);
	});

	it('return all the errors in the form', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });
		const stateField = new Field({ parent: addressField, key: 'state' });

		form.setErrors([{ path: '.', message: 'root error' }]);
		nameField.setErrors([{ path: 'name', message: 'name error' }]);
		addressField.setErrors([{ path: 'address', message: 'address error' }]);
		streetField.setErrors([{ path: 'address.street', message: 'address street error' }]);
		stateField.setErrors([{ path: 'address.state', message: 'address state error' }]);

		{
			const errors = form.getErrors();
			assert.deepStrictEqual(errors, [{ path: '.', message: 'root error' }]);
		}

		const errors = form.getErrors('group');
		assert.deepStrictEqual(errors.length, 5);
	});

	it('clear all the errors in the form', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });
		const stateField = new Field({ parent: addressField, key: 'state' });

		form.setErrors([{ path: '.', message: 'root error' }]);
		nameField.setErrors([{ path: 'name', message: 'name error' }]);
		addressField.setErrors([{ path: 'address', message: 'address error' }]);
		streetField.setErrors([{ path: 'address.street', message: 'address street error' }]);
		stateField.setErrors([{ path: 'address.state', message: 'address state error' }]);

		{
			const errors = form.getErrors('group');
			assert.deepStrictEqual(errors.length, 5);
		}

		form.clearErrors('group');

		assert.deepStrictEqual(form.getErrors('group'), []);
	});

	it('clear all the errors in the form root field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });
		const stateField = new Field({ parent: addressField, key: 'state' });

		form.setErrors([{ path: '.', message: 'root error' }]);
		nameField.setErrors([{ path: 'name', message: 'name error' }]);
		addressField.setErrors([{ path: 'address', message: 'address error' }]);
		streetField.setErrors([{ path: 'address.street', message: 'address street error' }]);
		stateField.setErrors([{ path: 'address.state', message: 'address state error' }]);

		{
			assert.deepStrictEqual(form.getErrors('current').length, 1);
			assert.deepStrictEqual(form.getErrors('group').length, 5);
		}

		form.clearErrors('current');

		assert.deepStrictEqual(form.getErrors('current').length, 0);
		assert.deepStrictEqual(form.getErrors('group').length, 4);
	});

	it('append new errors into the form', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });

		form.appendErrors([{ path: '.', message: 'error #1' } as TestError]);

		assert.deepStrictEqual(form.getErrors(), [{ path: '.', message: 'error #1' }]);

		form.appendErrors([
			{ path: '.', message: 'error #2' },
			{ path: 'invalid path', message: 'error #3' },
		] as TestError[]);

		assert.deepStrictEqual(form.getErrors(), [
			{ path: '.', message: 'error #1' },
			{ path: '.', message: 'error #2' },
		]);
	});

	it('append new errors distributing into fields in the form', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});

		form.setErrors([{ path: '.', message: 'form error' } as TestError]);
		nameField.setErrors([{ path: 'name', message: 'name error' } as TestError]);
		addressField.setErrors([{ path: 'address', message: 'address error' } as TestError]);

		form.appendErrors([
			{ path: '.', message: 'error #1' },
			{ path: 'name', message: 'error #2' },
			{ path: 'address', message: 'error #3' },
			{ path: 'invalid path', message: 'error #4' },
		] as Array<TestError>);

		assert.deepStrictEqual(form.getErrors(), [
			{ path: '.', message: 'form error' },
			{ path: '.', message: 'error #1' },
		]);

		assert.deepStrictEqual(nameField.getErrors(), [
			{ path: 'name', message: 'name error' },
			{ path: 'name', message: 'error #2' },
		]);

		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address error' },
			{ path: 'address', message: 'error #3' },
		]);
	});
});

describe('FormApi node composition', () => {
	it('represent the form root path as a "."', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });

		assert.strictEqual(form.path(), '.');
	});

	it('attach a node into the form when the node is created', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});

		assert.equal(form.getNode('name'), nameField);
		assert.equal(form.getNode('address'), addressField);
	});

	it('detach a node from the form', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		new Field({ parent: form, key: 'name' });
		new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});

		{
			const detached = form.detachNode('name');
			assert.strictEqual(detached, true);
		}
		{
			const detached = form.detachNode('address');
			assert.strictEqual(detached, true);
		}
		{
			const detached = form.detachNode('name');
			assert.strictEqual(detached, false);
		}
		{
			const detached = form.detachNode('address');
			assert.strictEqual(detached, false);
		}
	});

	it('iterate all nodes attached in the form', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});

		const fields: Array<Node<string | TestAddress, NodeError>> = [nameField, addressField];

		let count = 0;
		for (const node of form.iterateNodes()) {
			assert.strictEqual(fields.includes(node), true);
			count += 1;
		}

		assert.strictEqual(count, 2);
	});

	it('iterate all fields from the nodes attached in the form', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		new Field({ parent: form, key: 'name' });
		new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});

		const fields: Array<keyof TestData> = ['name', 'address'];

		let count = 0;
		for (const field of form.iterateFields()) {
			assert.strictEqual(fields.includes(field), true);
			count += 1;
		}

		assert.strictEqual(count, 2);
	});

	it('iterate all the field and node entries attached in the form', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});

		const fields: Array<keyof TestData> = ['name', 'address'];
		const nodes: Array<Node<string | TestAddress, NodeError>> = [nameField, addressField];

		let count = 0;
		for (const [field, node] of form.iterateEntries()) {
			assert.strictEqual(fields.includes(field), true);
			assert.strictEqual(nodes.includes(node), true);
			count += 1;
		}

		assert.strictEqual(count, 2);
	});
});

describe('FormApi value mutation', () => {
	it('start the form with the initial value', () => {
		const form = new FormApi({
			composer: objectComposer<TestData>(),
			initial: { name: 'Test', email: 'test@email.com' } as TestData,
		});

		assert.deepStrictEqual(form.getInitialValue(), { name: 'Test', email: 'test@email.com' });
		assert.deepStrictEqual(form.getValue(), { name: 'Test', email: 'test@email.com' });
	});

	it('start the form with the initial value from the field attached in the form', () => {
		const form = new FormApi({
			composer: objectComposer<TestData>(),
			initial: { name: 'Test', email: 'test@email.com' } as TestData,
		});

		assert.deepStrictEqual(form.getValue(), { name: 'Test', email: 'test@email.com' });

		const nameField = Field.init({ parent: form, key: 'name', initial: 'John' });

		assert.deepStrictEqual(nameField.getValue(), 'John');
		assert.deepStrictEqual(form.getValue(), { name: 'John', email: 'test@email.com' });
	});

	it('reset the form to its initial value', () => {
		const form = new FormApi({
			composer: objectComposer<TestData>(),
			initial: { name: 'Test', email: 'test@email.com' } as TestData,
		});

		assert.deepStrictEqual(form.getInitialValue(), { name: 'Test', email: 'test@email.com' });

		form.setValue({ name: 'John', email: 'john@email.com', address: {} } as TestData);

		assert.deepStrictEqual(form.getValue(), { name: 'John', email: 'john@email.com', address: {} });

		form.resetValue();

		assert.deepStrictEqual(form.getValue(), { name: 'Test', email: 'test@email.com' });
	});

	it('set a form value', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});

		form.setValue({ name: 'Test', address: { state: 'TX' } } as TestData);

		assert.deepStrictEqual(form.getValue(), { name: 'Test', address: { state: 'TX' } });
		assert.deepStrictEqual(nameField.getValue(), 'Test');
		assert.deepStrictEqual(addressField.getValue(), { state: 'TX' });
	});

	it('patch the form value', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});

		form.patchValue('name', 'Test');
		form.patchValue('address', { state: 'TX' } as TestAddress);

		assert.deepStrictEqual(form.getValue(), { name: 'Test', address: { state: 'TX' } });
		assert.deepStrictEqual(nameField.getValue(), 'Test');
		assert.deepStrictEqual(addressField.getValue(), { state: 'TX' });
	});

	it('extract the form value', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });

		form.setValue({ name: 'Test', address: { state: 'TX' } } as TestData);

		assert.deepStrictEqual(form.extractValue('name'), 'Test');
		assert.deepStrictEqual(form.extractValue('email'), undefined);
		assert.deepStrictEqual(form.extractValue('address'), { state: 'TX' });
	});
});

describe('FormApi data validation', () => {
	it('execute the validation with a value trigger when a node is attached in the form', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi({
			composer: objectComposer<TestData>(),
			validationTrigger: 'value',
			validate: async function (data: TestData): Promise<NodeError[]> {
				history.push(structuredClone(data));
				return [];
			},
		});

		assert.deepStrictEqual(history, []);

		new Field({ parent: form, key: 'name' });
		await delay(10);

		assert.deepStrictEqual(history, [{ name: undefined }]);

		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});
		await delay(10);

		assert.deepStrictEqual(history, [{ name: undefined }, { name: undefined, address: {} }]);

		Field.init({
			parent: addressField as FieldGroup<TestAddress, 'state', string | null, NodeError>,
			key: 'state',
			initial: null,
		});
		await delay(10);

		assert.deepStrictEqual(history, [
			{ name: undefined },
			{ name: undefined, address: {} },
			{ name: undefined, address: { state: null } },
		]);
	});

	it('execute the validation with a value trigger when a node is detached from the form', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: objectComposer<TestData>(),
			validationTrigger: 'value',
			validate: async function (data: TestData): Promise<NodeError[]> {
				history.push(structuredClone(data));
				return [];
			},
		});

		new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});
		Field.init({
			parent: addressField as FieldGroup<TestAddress, 'state', string | null, NodeError>,
			key: 'state',
			initial: null,
		});
		await delay(10);

		assert.deepStrictEqual(history, [
			{ name: undefined },
			{ name: undefined, address: {} },
			{ name: undefined, address: { state: null } },
		]);

		assert.strictEqual(addressField.detachNode('state'), true);
		await delay(10);
		assert.deepStrictEqual(history, [
			{ name: undefined },
			{ name: undefined, address: {} },
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: {} },
		]);

		assert.strictEqual(form.detachNode('address'), true);
		await delay(10);
		assert.deepStrictEqual(history, [
			{ name: undefined },
			{ name: undefined, address: {} },
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: {} },
			{ name: undefined },
		]);

		assert.strictEqual(form.detachNode('name'), true);
		await delay(10);
		assert.deepStrictEqual(history, [
			{ name: undefined },
			{ name: undefined, address: {} },
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: {} },
			{ name: undefined },
			{},
		]);
	});

	it('execute the validation with a value trigger when a value is set', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: objectComposer<TestData>(),
			validationTrigger: 'value',
			validate: async function (data: TestData): Promise<NodeError[]> {
				history.push(structuredClone(data));
				return [];
			},
		});

		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});
		const stateField = Field.init({
			parent: addressField as FieldGroup<TestAddress, 'state', string | null, NodeError>,
			key: 'state',
			initial: null,
		});
		await delay(10);

		assert.deepStrictEqual(history, [
			{ name: undefined },
			{ name: undefined, address: {} },
			{ name: undefined, address: { state: null } },
		]);

		stateField.setValue('TX');
		await delay(10);
		assert.deepStrictEqual(history, [
			{ name: undefined },
			{ name: undefined, address: {} },
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: { state: 'TX' } },
		]);

		addressField.setValue({ street: 'a', state: 'b' });
		await delay(10);
		assert.deepStrictEqual(history, [
			{ name: undefined },
			{ name: undefined, address: {} },
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: { state: 'TX' } },
			{ name: undefined, address: { street: 'a', state: 'b' } },
		]);

		nameField.setValue('c');
		await delay(10);
		assert.deepStrictEqual(history, [
			{ name: undefined },
			{ name: undefined, address: {} },
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: { state: 'TX' } },
			{ name: undefined, address: { street: 'a', state: 'b' } },
			{ name: 'c', address: { street: 'a', state: 'b' } },
		]);
	});

	it('execute the validation with a focus trigger when a field inside the form is focused', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: objectComposer<TestData>(),
			validationTrigger: 'focus',
			validate: async function (data: TestData): Promise<NodeError[]> {
				history.push(structuredClone(data));
				return [];
			},
		});

		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});
		const stateField = Field.init({
			parent: addressField as FieldGroup<TestAddress, 'state', string | null, NodeError>,
			key: 'state',
			initial: null,
		});
		await delay(10);

		assert.deepStrictEqual(history, []);

		stateField.handleFocus();
		await delay(10);

		assert.deepStrictEqual(history, [{ name: undefined, address: { state: null } }]);

		stateField.handleBlur();
		addressField.handleFocus();
		await delay(10);

		assert.deepStrictEqual(history, [
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: { state: null } },
		]);

		addressField.handleBlur();
		nameField.handleFocus();
		await delay(10);

		assert.deepStrictEqual(history, [
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: { state: null } },
		]);
	});

	it('execute the validation with a focus trigger when the form is focused', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validationTrigger: 'focus',
			validate: async function (data: TestData): Promise<NodeError[]> {
				history.push(structuredClone(data));
				return [];
			},
		});

		form.setValue({ name: 's', address: {} } as TestData);
		await delay(10);

		assert.deepStrictEqual(history, []);

		form.handleFocus();
		await delay(10);

		assert.deepStrictEqual(history, [{ name: 's', address: {} }]);
	});

	it('execute the validation with a blur trigger when a field inside the form handled a blur event', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: objectComposer<TestData>(),
			validationTrigger: 'blur',
			validate: async function (data: TestData): Promise<NodeError[]> {
				history.push(structuredClone(data));
				return [];
			},
		});

		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			key: 'address',
			composer: objectComposer<TestAddress>(),
		});
		const stateField = Field.init({
			parent: addressField as FieldGroup<TestAddress, 'state', string | null, NodeError>,
			key: 'state',
			initial: null,
		});

		assert.deepStrictEqual(history, []);

		stateField.handleBlur();
		await delay(10);

		assert.deepStrictEqual(history, [{ name: undefined, address: { state: null } }]);

		addressField.handleBlur();
		await delay(10);

		assert.deepStrictEqual(history, [
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: { state: null } },
		]);

		nameField.handleBlur();
		await delay(10);

		assert.deepStrictEqual(history, [
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: { state: null } },
			{ name: undefined, address: { state: null } },
		]);
	});

	it('execute the validation with a blur trigger when the form handle a blur event', async () => {
		const history: Array<TestData> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validationTrigger: 'blur',
			validate: async function (data: TestData): Promise<NodeError[]> {
				history.push(structuredClone(data));
				return [];
			},
		});

		form.setValue({ name: 'b', address: { state: 'state' } } as TestData);
		await delay(10);

		assert.deepStrictEqual(history, []);

		form.handleBlur();
		await delay(10);

		assert.deepStrictEqual(history, [{ name: 'b', address: { state: 'state' } }]);
	});
});

describe('FormApi event subscription', () => {
	it('publish a value event when attaching a new node in the form', () => {
		const history: Array<NodeEvent<TestData, TestError>> = [];

		const form = new FormApi({
			composer: objectComposer<TestData>(),
			subscriber: makeSubscriber(history),
		});

		assert.deepStrictEqual(history, []);

		const addressField = FieldGroup.init({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});

		assert.deepStrictEqual(history, [{ type: 'value', value: { address: {} } }]);

		new Field({ parent: form, key: 'name' });

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { address: {} } },
			{ type: 'value', value: { name: undefined, address: {} } },
		]);

		Field.init<string | null, TestError>({
			parent: addressField as FieldGroup<TestAddress, 'state', string | null, TestError>,
			key: 'state',
			initial: null,
		});

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { address: {} } },
			{ type: 'value', value: { name: undefined, address: {} } },
			{ type: 'value', value: { name: undefined, address: { state: null } } },
		]);
	});

	it('publish a value event when detaching a node from the form', () => {
		const history: Array<NodeEvent<TestData, TestError>> = [];
		const form = new FormApi({
			composer: objectComposer<TestData>(),
			subscriber: makeSubscriber(history),
		});

		new Field({ parent: form, key: 'name' });
		new FieldGroup({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { name: undefined } },
			{ type: 'value', value: { name: undefined, address: {} } },
		]);

		assert.deepStrictEqual(form.detachNode('name'), true);
		assert.deepStrictEqual(form.detachNode('address'), true);
	});

	it('publish a value event when setting a value in the form', () => {
		const history: Array<NodeEvent<TestData, TestError>> = [];
		const form = new FormApi({
			composer: objectComposer<TestData>(),
			subscriber: makeSubscriber(history),
		});

		assert.deepStrictEqual(history, []);

		form.setValue({ name: 'Test' } as TestData);

		assert.deepStrictEqual(history, [{ type: 'value', value: { name: 'Test' } }]);

		form.setValue({ name: 'Other', email: 'other@email.com' } as TestData);

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { name: 'Test' } },
			{ type: 'value', value: { name: 'Other', email: 'other@email.com' } },
		]);
	});

	it('publish a value event when resetting the form data', () => {
		const history: Array<NodeEvent<TestData, TestError>> = [];
		const form = new FormApi({
			composer: objectComposer<TestData>(),
			subscriber: makeSubscriber(history),
			initial: { name: 'None', address: { state: 'undefined' } } as TestData,
		});

		assert.deepStrictEqual(history, []);

		form.setValue({ name: 'Test', email: 'test@email.com' } as TestData);

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { name: 'Test', email: 'test@email.com' } },
		]);

		form.resetValue();

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { name: 'Test', email: 'test@email.com' } },
			{ type: 'value', value: { name: 'None', address: { state: 'undefined' } } },
		]);
	});

	it('publish a value event when setting the value in a field inside the form', () => {
		const history: Array<NodeEvent<TestData, TestError>> = [];
		const form = new FormApi({
			composer: objectComposer<TestData>(),
			subscriber: makeSubscriber(history),
		});

		const addressField = new FieldGroup({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});
		const stateField = new Field({ parent: addressField, key: 'state' });

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { address: {} } },
			{ type: 'value', value: { address: { state: undefined } } },
		]);

		addressField.setValue({ street: 'Unknown' } as TestAddress);

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { address: {} } },
			{ type: 'value', value: { address: { state: undefined } } },
			{ type: 'value', value: { address: { street: 'Unknown' } } },
		]);

		stateField.setValue('NY');

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { address: {} } },
			{ type: 'value', value: { address: { state: undefined } } },
			{ type: 'value', value: { address: { street: 'Unknown' } } },
			{ type: 'value', value: { address: { state: 'NY', street: 'Unknown' } } },
		]);
	});

	it('publish an error event when setting an error in the form', () => {
		const history: Array<NodeEvent<TestData, TestError>> = [];
		const form = new FormApi({
			composer: objectComposer<TestData>(),
			subscriber: makeSubscriber(history),
		});

		form.setErrors([{ path: '.', message: 'form error 1' }]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: '.', message: 'form error 1' }] },
		]);

		form.setErrors([
			{ path: '.', message: 'error #1' },
			{ path: '.', message: 'error #2' },
		]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: '.', message: 'form error 1' }] },
			{
				type: 'error',
				errors: [
					{ path: '.', message: 'error #1' },
					{ path: '.', message: 'error #2' },
				],
			},
		]);
	});

	it('publish an error event when clearing the form errors', () => {
		const history: Array<NodeEvent<TestData, TestError>> = [];
		const form = new FormApi({
			composer: objectComposer<TestData>(),
			subscriber: makeSubscriber(history),
		});

		form.setErrors([
			{ path: '.', message: 'error #1' },
			{ path: '.', message: 'error #2' },
		]);

		assert.deepStrictEqual(history, [
			{
				type: 'error',
				errors: [
					{ path: '.', message: 'error #1' },
					{ path: '.', message: 'error #2' },
				],
			},
		]);

		form.clearErrors();

		assert.deepStrictEqual(history, [
			{
				type: 'error',
				errors: [
					{ path: '.', message: 'error #1' },
					{ path: '.', message: 'error #2' },
				],
			},
			{ type: 'error', errors: [] },
		]);
	});

	it('publish an error event when appending errors into form', () => {
		const history: Array<NodeEvent<TestData, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, ValueOf<TestData>, TestError>({
			composer: objectComposer<TestData>(),
			subscriber: makeSubscriber(history),
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, 'address', TestAddress, TestError>,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});

		form.appendErrors([
			{ path: '.', message: 'error' },
			{ path: 'invalid path', message: 'invalid error' },
			{ path: 'address', message: 'address error' },
		]);

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { address: {} } },
			{ type: 'error', errors: [{ path: '.', message: 'error' }] },
		]);
		assert.deepStrictEqual(form.getErrors(), [{ path: '.', message: 'error' }]);
		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address error' },
		]);
	});
});
