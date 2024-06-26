import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isDeepStrictEqual } from 'node:util';
import { FormApi } from '@/FormApi';
import { ObjectComposer, ObjectGroupComposer, ValueOf, objectComposer } from '@/GroupComposer';
import { TestAddress, TestError, TestData, delay, makeSubscriber } from '@/TestUtils';
import { FieldGroup } from '@/FieldGroup';
import { Field } from '@/Field';
import { Node, NodeError, NodeEvent } from '@/NodeType';

describe('FieldGroup state management', () => {
	it('change state on focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), true);
	});

	it('change state on focus within', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.handleFocusWithin();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change state when the node within this group is focused', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		streetField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change state on focus and blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		addressField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), true);

		addressField.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change parent state on field focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		addressField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), true);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('change parent state on field focus and blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		addressField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), true);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);

		addressField.handleBlur();

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
			key: 'address',
		});

		addressField.setValue({ state: 'NY', street: '' });
		addressField.handleFocus();

		assert.deepStrictEqual(history, [{ address: { state: 'NY', street: '' } }]);

		addressField.setValue({ state: 'TX', street: 'A' });
		addressField.handleFocus();

		assert.deepStrictEqual(history, [
			{ address: { state: 'NY', street: '' } },
			{ address: { state: 'TX', street: 'A' } },
		]);
	});

	it('change state on blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change state on blur within', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.handleBlurWithin();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change state when the node within this group is blurred', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		streetField.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change parent state on field blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		addressField.handleBlur();

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
			key: 'address',
		});

		addressField.setValue({ state: 'CA', street: '' });
		addressField.handleBlur();

		assert.deepStrictEqual(history, [{ address: { state: 'CA', street: '' } }]);

		addressField.setValue({ state: 'L', street: '' });
		addressField.setValue({ state: 'LA', street: '' });
		addressField.handleBlur();

		assert.deepStrictEqual(history, [
			{ address: { state: 'CA', street: '' } },
			{ address: { state: 'LA', street: '' } },
		]);
	});

	it('change modified state on field value mutation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		addressField.setValue({ state: 'unknown', street: 'undefined' });

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.strictEqual(addressField.isModified(), true);
	});

	it('keep state as modified after reseting the field value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		addressField.setValue({ state: '', street: '' });

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.strictEqual(addressField.isModified(), true);

		addressField.resetValue();

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.strictEqual(addressField.isModified(), true);
	});

	it('change parent state after a field value mutation', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const addressField = new FieldGroup({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});

		addressField.setValue({ street: 'Av. San' } as TestAddress);

		assert.strictEqual(form.isTouched(), false);
		assert.strictEqual(form.isActive(), false);
		assert.strictEqual(form.isModified(), true);
	});

	it('change the field state to dirty after its value has been modified', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isDirty(), false);

		addressField.setValue({ state: '', street: '' });

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isDirty(), true);
	});

	it('change the field state to not dirty when its value is equal to the initial', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			equalFn: isDeepStrictEqual,
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isDirty(), false);

		addressField.setValue({ state: 'BA', street: 'Av. S' });

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isDirty(), true);

		addressField.setValue({} as TestAddress);

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isDirty(), false);

		assert.deepStrictEqual(addressField.getInitialValue(), addressField.getValue());
	});

	it('change the field state to dirty after modifying the parent value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			equalFn: isDeepStrictEqual,
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isDirty(), false);

		form.setValue({ name: 'User', address: { state: 'Virginia' } } as TestData);

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isDirty(), true);

		assert.notDeepStrictEqual(addressField.getInitialValue(), addressField.getValue());
		assert.deepStrictEqual(addressField.getValue(), { state: 'Virginia' });
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
			key: 'address',
		});

		addressField.setValue({ state: '' } as TestAddress);

		assert.deepStrictEqual(history, [{ address: {} }, { address: { state: '' } }]);

		addressField.setValue({ state: 'V' } as TestAddress);

		assert.deepStrictEqual(history, [
			{ address: {} },
			{ address: { state: '' } },
			{ address: { state: 'V' } },
		]);
	});

	it('change the field state to modified after patching the value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.patchValue('street', 'some');

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('not change the field state to modified after patching a nullish value', () => {
		const form = new FormApi<TestData, keyof TestData, ValueOf<TestData>, TestError>({
			composer: objectComposer<TestData>(),
		});
		const addressField = FieldGroup.init({
			parent: form as FormApi<TestData, keyof TestData, TestAddress | null, TestError>,
			composer: objectComposer<TestAddress>(),
			key: 'address',
			initial: null,
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.patchValue('street', 'some');

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.deepStrictEqual(addressField.getValue(), null);
	});

	it('change the field state to modified after attaching a node into the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		new Field({ parent: addressField, key: 'street' });

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('not change the field state to modified after attaching a node into the group with a nullish value', () => {
		const form = new FormApi<TestData, keyof TestData, ValueOf<TestData>, TestError>({
			composer: objectComposer<TestData>(),
		});
		const addressField = FieldGroup.init({
			parent: form as FormApi<TestData, keyof TestData, TestAddress | null, TestError>,
			composer: objectComposer<TestAddress>(),
			key: 'address',
			initial: null,
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		new Field({ parent: addressField, key: 'street' });

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change the field state to invalid when an error is prensent in the current field', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });

		assert.deepStrictEqual(addressField.isValid(), true);
		assert.deepStrictEqual(addressField.getErrors(), []);

		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.deepStrictEqual(addressField.isValid(), true);
		assert.deepStrictEqual(addressField.getErrors(), []);

		addressField.setErrors([{ path: 'address', message: 'address message' } as TestError]);

		assert.deepStrictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address message' },
		]);
	});

	it('change the field group state to invalid when an error is prensent in the field group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });

		assert.deepStrictEqual(addressField.isValid(), true);
		assert.deepStrictEqual(addressField.getErrors(), []);

		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.deepStrictEqual(addressField.isValid(), true);
		assert.deepStrictEqual(addressField.getErrors(), []);

		assert.deepStrictEqual(addressField.isValid('group'), false);
		assert.deepStrictEqual(addressField.getErrors('group'), [
			{ path: 'address.street', message: 'address street message' },
		]);
	});

	it('change the field state to valid when the errors are removed from the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const streetField = new Field({ parent: addressField, key: 'street' });

		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.deepStrictEqual(addressField.isValid(), true);
		assert.deepStrictEqual(addressField.getErrors(), []);

		assert.deepStrictEqual(addressField.isValid('group'), false);
		assert.deepStrictEqual(addressField.getErrors('group'), [
			{ path: 'address.street', message: 'address street message' },
		]);

		addressField.clearErrors('group');

		assert.deepStrictEqual(addressField.isValid(), true);
		assert.deepStrictEqual(addressField.getErrors(), []);

		assert.deepStrictEqual(addressField.isValid(), true);
		assert.deepStrictEqual(addressField.getErrors(), []);
	});
});

describe('FieldGroup error manipulation', () => {
	it('replace the errors of a field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const nameField = new Field({ parent: form, key: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});

		addressField.setErrors([
			{ message: 'error#1', path: 'address' },
			{ message: 'error#2', path: 'address' },
		]);

		assert.strictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [
			{ message: 'error#1', path: 'address' },
			{ message: 'error#2', path: 'address' },
		]);

		assert.strictEqual(nameField.isValid(), true);
		assert.deepStrictEqual(nameField.getErrors(), []);

		addressField.setErrors([{ message: 'error#0', path: 'address' }]);

		assert.strictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [{ message: 'error#0', path: 'address' }]);
	});

	it('propagate errors from the field', () => {
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

		addressField.setErrors([
			{ path: 'address', message: 'address invalid' },
			{ path: 'address.street', message: 'street invalid' },
			{ path: 'address.street', message: 'street invalid again' },
			{ path: 'address.state', message: 'no state' },
		]);

		assert.strictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.strictEqual(nameField.isValid(), true);
		assert.deepStrictEqual(nameField.getErrors(), []);

		assert.strictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address invalid' },
		]);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ path: 'address.street', message: 'street invalid' },
			{ path: 'address.street', message: 'street invalid again' },
		]);

		assert.strictEqual(stateField.isValid(), false);
		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'no state' },
		]);
	});

	it('handle and distribute errors from the validation function', async () => {
		async function validationFn(data: TestData): Promise<Array<TestError>> {
			const errors = [];
			if (data.address) {
				errors.push({ path: 'address', message: 'invalid address' });
			}
			if (data.address.state) {
				errors.push({ path: 'address.state', message: 'invalid address state' });
			}
			return errors;
		}
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validate: validationFn,
			validationTrigger: 'value',
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const stateField = new Field({ parent: addressField, key: 'state' });

		stateField.setValue('anything');

		await delay(10);

		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'invalid address' },
		]);
		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'invalid address state' },
		]);
	});

	it('return all errors from the field group', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validationTrigger: 'value',
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const stateField = new Field({ parent: addressField, key: 'state' });
		const streetField = new Field({ parent: addressField, key: 'street' });

		addressField.setErrors([
			{ path: 'address', message: 'address message' },
			{ path: 'address.state', message: 'address state message' },
			{ path: 'address.street', message: 'address street message' },
		]);

		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address message' },
		]);
		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'address state message' },
		]);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ path: 'address.street', message: 'address street message' },
		]);

		const errors = addressField.getErrors('group');
		assert.deepStrictEqual(errors.length, 3);

		for (const error of errors) {
			assert.strictEqual(['address', 'address.state', 'address.street'].includes(error.path), true);
		}
	});

	it('clear the errors in a field when targeting the "current" field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validationTrigger: 'value',
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const stateField = new Field({ parent: addressField, key: 'state' });
		const streetField = new Field({ parent: addressField, key: 'street' });

		addressField.setErrors([
			{ path: 'address', message: 'address message' },
			{ path: 'address.state', message: 'address state message' },
			{ path: 'address.street', message: 'address street message' },
		]);

		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address message' },
		]);
		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'address state message' },
		]);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ path: 'address.street', message: 'address street message' },
		]);

		addressField.clearErrors();

		assert.deepStrictEqual(addressField.getErrors(), []);

		const errors = addressField.getErrors('group');

		assert.strictEqual(errors.length, 2);

		for (const error of errors) {
			assert.strictEqual(['address.state', 'address.street'].includes(error.path), true);
		}
	});

	it('clear all the errors in a field group when targeting the "group" nodes', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
			validationTrigger: 'value',
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const stateField = new Field({ parent: addressField, key: 'state' });
		const streetField = new Field({ parent: addressField, key: 'street' });

		addressField.setErrors([
			{ path: 'address', message: 'address message' },
			{ path: 'address.state', message: 'address state message' },
			{ path: 'address.street', message: 'address street message' },
		]);

		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address message' },
		]);
		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'address state message' },
		]);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ path: 'address.street', message: 'address street message' },
		]);

		addressField.clearErrors('group');

		assert.deepStrictEqual(addressField.getErrors(), []);
		assert.deepStrictEqual(addressField.getErrors('group'), []);

		assert.deepStrictEqual(stateField.getErrors(), []);
		assert.deepStrictEqual(streetField.getErrors(), []);
	});

	it('append new errors into the field group', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const addressField = new FieldGroup({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});

		addressField.appendErrors([{ path: 'address', message: 'error #1' } as TestError]);

		assert.deepStrictEqual(addressField.getErrors(), [{ path: 'address', message: 'error #1' }]);

		addressField.appendErrors([
			{ path: 'address', message: 'error #2' },
			{ path: 'invalid path', message: 'error #3' },
		] as TestError[]);

		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'error #1' },
			{ path: 'address', message: 'error #2' },
		]);
	});

	it('append new errors distributing into fields in the group', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const addressField = new FieldGroup({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});
		const stateField = new Field({ parent: addressField, key: 'state' });
		const streetField = new Field({ parent: addressField, key: 'street' });

		addressField.setErrors([{ path: addressField.path(), message: 'address error' } as TestError]);
		stateField.setErrors([{ path: stateField.path(), message: 'state error' } as TestError]);
		streetField.setErrors([{ path: streetField.path(), message: 'street error' } as TestError]);

		addressField.appendErrors([
			{ path: 'address', message: 'error #1' },
			{ path: 'address.street', message: 'error #2' },
			{ path: 'address.state', message: 'error #3' },
			{ path: 'invalid path', message: 'error #4' },
		] as Array<TestError>);

		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address error' },
			{ path: 'address', message: 'error #1' },
		]);

		assert.deepStrictEqual(streetField.getErrors(), [
			{ path: 'address.street', message: 'street error' },
			{ path: 'address.street', message: 'error #2' },
		]);

		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'state error' },
			{ path: 'address.state', message: 'error #3' },
		]);
	});
});

describe('FieldGroup value mutation', () => {
	it('start the field with the initial value from the group', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: objectComposer<TestData>(),
		});
		const addressField = FieldGroup.init({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
			initial: { state: 'Texas' } as TestAddress,
		});

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas' });

		const state = new Field({ parent: addressField, key: 'state' });

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas' });
		assert.deepStrictEqual(state.getValue(), 'Texas');
	});

	it('start the field with the initial value from the attached field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = FieldGroup.init({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			initial: { state: 'Texas' } as TestAddress,
		});

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas' });

		const state = Field.init({ parent: addressField, key: 'state', initial: 'Indiana' });

		assert.deepStrictEqual(addressField.getValue(), { state: 'Indiana' });
		assert.deepStrictEqual(state.getValue(), 'Indiana');
	});

	it('get the initial value from the field', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = FieldGroup.init({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			initial: { state: 'Texas' } as TestAddress,
		});

		assert.deepStrictEqual(addressField.getInitialValue(), { state: 'Texas' });
	});

	it('set the field value', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: objectComposer<TestData>(),
		});
		const addressField = FieldGroup.init({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});
		const state = Field.init({ parent: addressField, key: 'state' });

		addressField.setValue({ state: 'Texas' } as TestAddress);

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas' });
		assert.deepStrictEqual(state.getValue(), 'Texas');
	});

	it('reset the field value to it initial state', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = FieldGroup.init({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			initial: { state: 'Texas' } as TestAddress,
		});
		const stateField = new Field({ parent: addressField, key: 'state' });
		const streetField = new Field({ parent: addressField, key: 'street' });

		addressField.setValue({ state: 'Indiana', street: '334 Hickle Cliffs Suite 649' });

		assert.deepStrictEqual(addressField.getValue(), {
			state: 'Indiana',
			street: '334 Hickle Cliffs Suite 649',
		});
		assert.deepStrictEqual(stateField.getValue(), 'Indiana');
		assert.deepStrictEqual(streetField.getValue(), '334 Hickle Cliffs Suite 649');

		addressField.resetValue();

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas', street: undefined });
		assert.deepStrictEqual(stateField.getValue(), 'Texas');
		assert.deepStrictEqual(streetField.getValue(), undefined);
	});

	it('patch the field value in the group', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const stateField = new Field({ parent: addressField, key: 'state' });
		const streetField = new Field({ parent: addressField, key: 'street' });

		{
			const address = addressField.patchValue('state', 'Indiana');
			assert.deepStrictEqual(address, { state: 'Indiana', street: undefined });
		}

		assert.deepStrictEqual(addressField.getValue(), { state: 'Indiana', street: undefined });
		assert.deepStrictEqual(stateField.getValue(), 'Indiana');
		assert.deepStrictEqual(streetField.getValue(), undefined);

		{
			const address = addressField.patchValue('street', '15970 Spinka Island Suite 086');
			assert.deepStrictEqual(address, {
				state: 'Indiana',
				street: '15970 Spinka Island Suite 086',
			});
		}

		assert.deepStrictEqual(addressField.getValue(), {
			state: 'Indiana',
			street: '15970 Spinka Island Suite 086',
		});
		assert.deepStrictEqual(stateField.getValue(), 'Indiana');
		assert.deepStrictEqual(streetField.getValue(), '15970 Spinka Island Suite 086');
	});

	it('extract the field value from the group', () => {
		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const stateField = new Field({ parent: addressField, key: 'state' });

		stateField.setValue('Montana');

		const state = addressField.extractValue('state');

		assert.strictEqual(state, 'Montana');
		assert.deepStrictEqual(addressField.getValue(), { state: 'Montana' });
	});
});

describe('FieldGroup node composition', () => {
	it('attach a node into the group on the node creation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const stateField = new Field({ key: 'state', parent: addressField });

		const stateNode = addressField.getNode('state');
		assert.equal(stateNode, stateField);

		const streetNode = addressField.getNode('street');
		assert.equal(streetNode, undefined);
	});

	it('detach a node from the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		new Field({ key: 'state', parent: addressField });

		{
			const detached = addressField.detachNode('state');
			assert.strictEqual(detached, true);
		}
		{
			const detached = addressField.detachNode('street');
			assert.strictEqual(detached, false);
		}
		{
			const detached = addressField.detachNode('state');
			assert.strictEqual(detached, false);
		}
	});

	it('iterate all the nodes attached in the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		const stateField = new Field({ key: 'state', parent: addressField });
		const streetField = new Field({ key: 'street', parent: addressField });

		const fields: Array<Node<string, NodeError>> = [stateField, streetField];

		let count = 0;
		for (const node of addressField.iterateNodes()) {
			assert.strictEqual(fields.includes(node), true);
			count += 1;
		}

		assert.strictEqual(count, 2);
	});

	it('iterate all the fields from nodes attached in the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
		});
		new Field({ key: 'state', parent: addressField });
		new Field({ key: 'street', parent: addressField });

		const fields: Array<string> = ['state', 'street'];

		let count = 0;
		for (const field of addressField.iterateFields()) {
			assert.strictEqual(fields.includes(field), true);
			count += 1;
		}

		assert.strictEqual(count, 2);
	});

	it('iterate all the field and node entries attached in the group', () => {
		const form = new FormApi({ composer: objectComposer<TestData>() });
		const addressField = new FieldGroup({
			parent: form,
			composer: objectComposer<TestAddress>(),
			key: 'address',
		});
		const stateField = new Field({ key: 'state', parent: addressField });
		const streetField = new Field({ key: 'street', parent: addressField });

		const fields: Array<string> = ['state', 'street'];
		const nodes: Array<Node<string, NodeError>> = [stateField, streetField];

		let count = 0;
		for (const [field, node] of addressField.iterateEntries()) {
			assert.strictEqual(fields.includes(field), true);
			assert.strictEqual(nodes.includes(node), true);
			count += 1;
		}

		assert.strictEqual(count, 2);
	});
});

describe('FieldGroup event subscription', () => {
	it('publish a value event when setting a new value in the field group', () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, keyof TestData, TestAddress, TestError>,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			subscriber: makeSubscriber(history),
		});
		const stateField = new Field({
			parent: addressField,
			key: 'state',
		});

		assert.deepStrictEqual(history, [{ type: 'value', value: { state: undefined } }]);

		addressField.setValue({ state: undefined, street: '1' } as unknown as TestAddress);

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { state: undefined } },
			{ type: 'value', value: { state: undefined, street: '1' } },
		]);

		stateField.setValue('Tx');

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { state: undefined } },
			{ type: 'value', value: { state: undefined, street: '1' } },
			{ type: 'value', value: { state: 'Tx', street: '1' } },
		]);
	});

	it('publish a value event when resetting the field', () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, keyof TestData, TestAddress, TestError>,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			subscriber: makeSubscriber(history),
		});

		addressField.setValue({ state: 'T', street: '1' } as unknown as TestAddress);

		assert.deepStrictEqual(history, [{ type: 'value', value: { state: 'T', street: '1' } }]);

		addressField.resetValue();

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { state: 'T', street: '1' } },
			{ type: 'value', value: {} },
		]);
	});

	it('publish a value event when setting the value in a node from the group', () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, keyof TestData, TestAddress, TestError>,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			subscriber: makeSubscriber(history),
		});
		const stateField = new Field({
			parent: addressField,
			key: 'state',
		});

		assert.deepStrictEqual(history, [{ type: 'value', value: { state: undefined } }]);

		stateField.setValue('TX');

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { state: undefined } },
			{ type: 'value', value: { state: 'TX' } },
		]);

		stateField.setValue('NY');

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { state: undefined } },
			{ type: 'value', value: { state: 'TX' } },
			{ type: 'value', value: { state: 'NY' } },
		]);
	});

	it('publish a value event when attaching a node in the group', () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, keyof TestData, TestAddress, TestError>,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			subscriber: makeSubscriber(history),
		});

		assert.deepStrictEqual(history, []);

		new Field({ parent: addressField, key: 'state' });

		assert.deepStrictEqual(history, [{ type: 'value', value: { state: undefined } }]);
	});

	it('publish a value event when detaching a node from the group', () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, keyof TestData, TestAddress, TestError>,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			subscriber: makeSubscriber(history),
		});

		const stateField = new Field({ parent: addressField, key: 'state' });
		stateField.setValue('TX');

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { state: undefined } },
			{ type: 'value', value: { state: 'TX' } },
		]);

		assert.strictEqual(addressField.detachNode('state'), true);

		assert.deepStrictEqual(history, [
			{ type: 'value', value: { state: undefined } },
			{ type: 'value', value: { state: 'TX' } },
			{ type: 'value', value: {} },
		]);
	});

	it('publish a value event when setting a value in a parent field group', () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, keyof TestData, TestAddress, TestError>,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			subscriber: makeSubscriber(history),
		});

		assert.deepStrictEqual(history, []);

		form.setValue({ name: '', address: { state: 'NY' } } as TestData);

		assert.deepStrictEqual(history, [{ type: 'value', value: { state: 'NY' } }]);

		assert.deepStrictEqual(addressField.getValue(), { state: 'NY' });
	});

	it('publish an error event when setting an error in the field', () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, keyof TestData, TestAddress, TestError>,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			subscriber: makeSubscriber(history),
		});

		addressField.setErrors([
			{ path: 'address', message: 'address error' },
			{ path: 'address.state', message: 'address state error' },
		]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address', message: 'address error' }] },
		]);

		addressField.setErrors([]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address', message: 'address error' }] },
			{ type: 'error', errors: [] },
		]);
	});

	it('publish an error event when setting an error from the parent field', async () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestData>,
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, keyof TestData, TestAddress, TestError>,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			key: 'address',
			subscriber: makeSubscriber(history),
		});

		form.setErrors([
			{ path: 'name', message: 'name error' },
			{ path: 'address', message: 'address error' },
		]);

		await delay(10);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address', message: 'address error' }] },
		]);

		addressField.setErrors([]);

		await delay(10);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address', message: 'address error' }] },
			{ type: 'error', errors: [] },
		]);
	});

	it('publish an error event when appending errors into the field group', () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, ValueOf<TestData>, TestError>({
			composer: objectComposer<TestData>(),
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, 'address', TestAddress, TestError>,
			composer: objectComposer<TestAddress>(),
			key: 'address',
			subscriber: makeSubscriber(history),
		});

		addressField.appendErrors([
			{ path: 'address', message: 'error' },
			{ path: 'invalid path', message: 'invalid error' },
			{ path: 'address.state', message: 'state error' },
		]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address', message: 'error' }] },
		]);
		assert.deepStrictEqual(addressField.getErrors('group'), [
			{ path: 'address', message: 'error' },
		]);
	});

	it('publish an error event when appending new errors from the parent field', () => {
		const history: Array<NodeEvent<TestAddress, TestError>> = [];

		const form = new FormApi<TestData, keyof TestData, ValueOf<TestData>, TestError>({
			composer: objectComposer<TestData>(),
		});
		const addressField = new FieldGroup({
			parent: form as FormApi<TestData, 'address', TestAddress, TestError>,
			composer: objectComposer<TestAddress>(),
			key: 'address',
			subscriber: makeSubscriber(history),
		});

		form.appendErrors([{ path: 'address', message: 'error #1' } as TestError]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address', message: 'error #1' }] },
		]);
		assert.deepStrictEqual(addressField.getErrors(), [{ path: 'address', message: 'error #1' }]);
	});
});
