import assert from 'node:assert/strict';
import test from 'node:test';
import { contactProducts } from '../src/data/contact.ts';
import { buildContactMailto, resolveContactProduct, validateContactField } from '../src/lib/contact-form.ts';

test('resolves the public product names, existing link aliases and ids', () => {
	for (const product of contactProducts) {
		for (const value of [product.id, product.value, product.label]) {
			assert.equal(resolveContactProduct(value), product.id, value);
		}
	}
	assert.equal(resolveContactProduct('  prestamos   PERSONALES '), 'personal');
	assert.equal(resolveContactProduct('credito empresarial'), 'business');
	for (const value of ['', null, undefined, 'Crédito inventado']) {
		assert.equal(resolveContactProduct(value), undefined);
	}
});

test('requires name, email, an allowed product and explicit privacy consent', () => {
	for (const [name, value] of [['name', ''], ['name', ' A '], ['email', ''], ['product', ''], ['product', 'Otro'], ['privacy', false], ['privacy', 'on']]) {
		assert.notEqual(validateContactField(name, value), '', name);
	}
	for (const [name, value] of [['name', ' Ana '], ['email', 'ana+consulta@example.com'], ['product', 'Crédito personal'], ['privacy', true]]) {
		assert.equal(validateContactField(name, value), '', name);
	}
	for (const name of ['company', 'phone', 'amount', 'message']) {
		assert.equal(validateContactField(name, ''), '', name);
	}
});

test('distinguishes the new business products and preserves pure-lease aliases', () => {
	for (const alias of ['lease', 'Arrendamiento', 'Arrendamiento puro']) {
		assert.equal(resolveContactProduct(alias), 'lease');
	}
	for (const alias of ['revolving', 'Crédito Revolvente PyME', 'credito en cuenta corriente']) {
		assert.equal(resolveContactProduct(alias), 'revolving');
	}
	for (const alias of ['finance-lease', 'arrendamiento financiero']) {
		assert.equal(resolveContactProduct(alias), 'finance-lease');
	}
	for (const [product, label] of [
		['revolving', 'Crédito en cuenta corriente'],
		['finance-lease', 'Arrendamiento financiero'],
		['lease', 'Arrendamiento puro'],
	]) {
		const link = new URL(buildContactMailto({
			name: 'Ana Pérez', email: 'ana@example.com', product,
			company: '', phone: '', amount: '', message: '',
		}));
		assert.equal(link.searchParams.get('subject'), `Consulta: ${label}`);
		assert.ok(link.searchParams.get('body').includes(`Producto de interés: ${label}`));
	}
});

test('enforces the field length limits without requiring optional fields', () => {
	for (const [name, limit] of [['name', 100], ['company', 120], ['message', 800]]) {
		assert.equal(validateContactField(name, 'a'.repeat(limit)), '', name);
		assert.notEqual(validateContactField(name, 'a'.repeat(limit + 1)), '', name);
	}
	assert.notEqual(validateContactField('email', 'a'.repeat(245) + '@example.com'), '');
	for (const value of ['sin-correo', 'ana@@example.com', 'ana b@example.com', 'ana@-example.com', 'ana@example..com']) {
		assert.notEqual(validateContactField('email', value), '', value);
	}
});

test('accepts phone formatting while enforcing a usable number of digits', () => {
	for (const value of ['1234567', '+52 (618) 129-6093', '+123456789012345']) {
		assert.equal(validateContactField('phone', value), '', value);
	}
	for (const value of ['123456', '+1234567890123456', '618ABC6093', '(       )', '1'.repeat(41)]) {
		assert.notEqual(validateContactField('phone', value), '', value);
	}
});

test('accepts only plain monetary values within the technical contact limits', () => {
	for (const value of ['1', '1.01', '30000', '200000.50', '999999999.99']) {
		assert.equal(validateContactField('amount', value), '', value);
	}
	for (const value of ['0', '-1', '0.99', '1000000000', '1.001', '1.', '1e5', 'NaN', 'Infinity', '$200,000', '200,000', '200 000']) {
		assert.notEqual(validateContactField('amount', value), '', value);
	}
});

const draft = {
	name: ' Ana Pérez ',
	email: 'ana+consulta@example.com',
	product: 'Préstamos Personales',
	company: 'Diseño & servicios',
	phone: '+52 (618) 129-6093',
	amount: '125000.50',
	message: 'Mejoras al hogar\n¿Cuáles son los requisitos?',
};

test('builds an encoded draft email using the public product label and all supplied fields', () => {
	const link = new URL(buildContactMailto(draft));
	assert.equal(link.protocol, 'mailto:');
	assert.equal(link.pathname, 'contacto@lobokapital.mx');
	assert.equal(link.searchParams.get('subject'), 'Consulta: Crédito personal');
	const body = link.searchParams.get('body');
	for (const text of ['Nombre: Ana Pérez', 'Correo para recibir respuesta: ana+consulta@example.com', 'Producto de interés: Crédito personal', 'Negocio o actividad: Diseño & servicios', 'Teléfono: +52 (618) 129-6093', 'Monto estimado (MXN): 125000.50', draft.message, 'He leído el aviso de privacidad']) {
		assert.ok(body.includes(text), text);
	}
	assert.ok(!body.includes('Préstamos Personales'));
	assert.ok(!body.includes('Crédito al consumo'));
});

test('omits empty optional fields and refuses an unrecognized product in a draft', () => {
	const body = new URL(buildContactMailto({ ...draft, company: '', phone: '', amount: '', message: '  ' })).searchParams.get('body');
	for (const label of ['Negocio o actividad:', 'Teléfono:', 'Monto estimado', 'Consulta:']) {
		assert.ok(!body.includes(label), label);
	}
	assert.throws(() => buildContactMailto({ ...draft, product: 'Producto no permitido' }), RangeError);
});
