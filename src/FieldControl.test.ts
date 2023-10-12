import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FormApi } from '@/FormApi';
import { ObjectComposer, ObjectGroupComposer } from '@/GroupComposer';
import { FieldControl } from '@/FieldControl';
import { FieldGroupControl } from './FieldGroupControl';

interface TestAddress {
	state: string;
	street: string;
}

interface TestFormData {
	name: string;
	email: string;
	address: TestAddress;
}

describe('FieldControl state management', () => {
	it('change state on focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const field = new FieldControl({ parent: form, field: 'name' });

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);

		field.handleFocus();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), true);
	});

	it('change state on focus and blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const field = new FieldControl({ parent: form, field: 'name' });

		field.handleFocus();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), true);

		field.handleBlur();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), false);
	});

	it('change parent state on field focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new FieldControl({ parent: addressField, field: 'street' });

		field.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('change parent state on field focus and blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new FieldControl({ parent: addressField, field: 'street' });

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
		const validationHistory: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'focus',
			validate: async data => {
				validationHistory.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new FieldControl({ parent: addressField, field: 'street' });
		const stateField = new FieldControl({ parent: addressField, field: 'state' });

		streetField.setValue('Carlos Gomes');
		streetField.handleFocus();

		assert.deepStrictEqual(validationHistory, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
		]);

		stateField.setValue('Bahia');
		stateField.handleFocus();

		assert.deepStrictEqual(validationHistory, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
			{ address: { street: 'Carlos Gomes', state: 'Bahia' } },
		]);
	});

	it('change state on blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const field = new FieldControl({ parent: form, field: 'name' });

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);

		field.handleBlur();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), false);
	});

	it('change parent state on field blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new FieldControl({ parent: addressField, field: 'street' });

		field.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('execute form validation on field blur event', () => {
		const validationHistory: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'blur',
			validate: async data => {
				validationHistory.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new FieldControl({ parent: addressField, field: 'street' });
		const stateField = new FieldControl({ parent: addressField, field: 'state' });

		streetField.setValue('Carlos Gomes');
		streetField.handleBlur();

		assert.deepStrictEqual(validationHistory, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
		]);

		stateField.setValue('Bahia');
		stateField.handleBlur();

		assert.deepStrictEqual(validationHistory, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
			{ address: { street: 'Carlos Gomes', state: 'Bahia' } },
		]);
	});

	it('change modified state on field value mutation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new FieldControl({ parent: addressField, field: 'street' });

		field.setValue('Av. San');

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);
		assert.strictEqual(field.isModified(), true);
	});

	it('keep state as modified after reseting the field value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new FieldControl({ parent: addressField, field: 'street' });

		field.setValue('Av. San');

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);
		assert.strictEqual(field.isModified(), true);

		field.reset();

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);
		assert.strictEqual(field.isModified(), true);
	});

	it('change parent modified state on field value mutation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new FieldControl({ parent: addressField, field: 'street' });

		field.setValue('Av. San');

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.strictEqual(addressField.isModified(), true);

		assert.strictEqual(form.isTouched(), false);
		assert.strictEqual(form.isActive(), false);
		assert.strictEqual(form.isModified(), true);
	});

	it('change the field state to dirty after its value has been modified', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new FieldControl({ parent: addressField, field: 'street' });

		assert.strictEqual(field.isModified(), false);
		assert.strictEqual(field.isDirty(), false);

		field.setValue('Av. S');

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), true);
	});

	it('change the field state to not dirty when its value is equal to the initial', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new FieldControl({ parent: addressField, field: 'street', initial: null });

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
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new FieldControl({ parent: addressField, field: 'street' });

		assert.strictEqual(field.isModified(), false);
		assert.strictEqual(field.isDirty(), false);

		addressField.setValue({ state: 'Rio Grande do Sul', street: 'R' });

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), true);

		assert.notDeepStrictEqual(field.getInitialValue(), field.getValue());
		assert.deepStrictEqual(field.getValue(), 'R');
	});

	it('execute form validation on field change event', () => {
		const validationHistory: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'value',
			validate: async data => {
				validationHistory.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new FieldControl({ parent: addressField, field: 'street' });
		const stateField = new FieldControl({ parent: addressField, field: 'state' });

		streetField.setValue('L');

		assert.deepStrictEqual(validationHistory, [
			{ address: {} },
			{ address: { street: undefined } },
			{ address: { street: undefined, state: undefined } },
			{ address: { street: 'L', state: undefined } },
		]);

		stateField.setValue('R');

		assert.deepStrictEqual(validationHistory, [
			{ address: {} },
			{ address: { street: undefined } },
			{ address: { street: undefined, state: undefined } },
			{ address: { street: 'L', state: undefined } },
			{ address: { street: 'L', state: 'R' } },
		]);
	});

	it('change the field state to invalid when an error is present in the field', async () => {
		const validationHistory: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'value',
			validate: async data => {
				validationHistory.push(structuredClone(data));

				if (!data.address) return [];
				if (!data.address.street) return [];
				return [{ message: 'Invalid street name', path: 'address.street' }];
			},
		});
		const addressField = new FieldGroupControl({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new FieldControl({ parent: addressField, field: 'street' });
		const stateField = new FieldControl({ parent: addressField, field: 'state' });

		streetField.setValue('invalid');

		await delay(5);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'Invalid street name', path: 'address.street' },
		]);

		assert.strictEqual(stateField.isValid(), true);
		assert.deepStrictEqual(stateField.getErrors(), []);
	});
});

function delay(time: number): Promise<void> {
	return new Promise(resolver => setTimeout(resolver, time));
}