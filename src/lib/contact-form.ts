import { contactEmail, contactProducts, type ContactProduct } from '../data/contact.ts';

function normalizeProduct(value: string): string {
	return value.trim().normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es-MX').replace(/\s+/g, ' ');
}

export function resolveContactProduct(value: string | null | undefined): ContactProduct | undefined {
	if (!value) return undefined;
	const normalized = normalizeProduct(value);
	return contactProducts.find((product) => [product.id, product.value, product.label]
		.some((alias) => normalizeProduct(alias) === normalized))?.id;
}

export function validateContactField(name: string, value: string | boolean): string {
	const text = typeof value === 'string' ? value.trim() : '';
	switch (name) {
		case 'name':
			return text.length < 2 || text.length > 100
				? 'Escribe tu nombre, de 2 a 100 caracteres.' : '';
		case 'email': {
			if (!text) return 'Escribe tu correo electrónico.';
			if (text.length > 254) return 'El correo debe tener como máximo 254 caracteres.';
			// Mirrors the syntax accepted by an HTML email input; native validation also runs in the form.
			const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
			return emailPattern.test(text) ? '' : 'Escribe un correo electrónico válido';
		}
		case 'product':
		case 'need':
			return resolveContactProduct(text) ? '' : 'Selecciona un producto de interés.';
		case 'company':
			return text.length > 120 ? 'Usa como máximo 120 caracteres para tu empresa o actividad.' : '';
		case 'phone':
			if (!text) return '';
			return /^[+\d\s().-]{7,40}$/.test(text) && /^\d{7,15}$/.test(text.replace(/\D/g, ''))
				? '' : 'Revisa el teléfono o deja este campo opcional vacío.';
		case 'amount':
			if (!text) return '';
			return /^\d{1,9}(?:\.\d{1,2})?$/.test(text) && Number(text) >= 1 && Number(text) <= 999999999.99
				? '' : 'Indica un monto de $1 a $999,999,999.99, sin separadores y con hasta dos decimales.';
		case 'message':
			return text.length > 800 ? 'Usa como máximo 800 caracteres para tu consulta.' : '';
		case 'privacy':
			return value === true ? '' : 'Acepta el tratamiento de tus datos para responder a tu consulta.';
		default:
			return '';
	}
}

export type ContactDraft = {
	name: string;
	email: string;
	product: string;
	company: string;
	phone: string;
	amount: string;
	message: string;
};

export function buildContactMailto(draft: ContactDraft): string {
	const productId = resolveContactProduct(draft.product);
	const product = contactProducts.find((option) => option.id === productId);
	if (!product) throw new RangeError('El producto de la consulta no es válido.');

	const fields: [string, string][] = [
		['Nombre', draft.name],
		['Correo para recibir respuesta', draft.email],
		['Producto de interés', product.label],
		['Empresa o actividad', draft.company],
		['Teléfono', draft.phone],
		['Monto estimado (MXN)', draft.amount],
	];
	const body = fields.filter(([, value]) => value.trim())
		.map(([label, value]) => `${label}: ${value.trim()}`).join('\n')
		+ (draft.message.trim() ? `\n\nConsulta:\n${draft.message.trim()}` : '')
		+ '\n\nHe leído el aviso de privacidad y acepto el tratamiento de mis datos para responder y dar seguimiento a esta consulta.';

	return `mailto:${contactEmail}?subject=${encodeURIComponent(`Consulta: ${product.label}`)}&body=${encodeURIComponent(body)}`;
}
