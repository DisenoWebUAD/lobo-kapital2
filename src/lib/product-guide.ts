import {
	guideMaxAmount, guideNeeds, guideCapitalUses, guideEquipmentUses,
	guideProductOrder, guideProducts,
	type GuideNeed, type GuideCapitalUse, type GuideEquipmentUse, type GuideProduct,
} from '../data/product-guide.ts';
import { loanSimulations } from './loan-simulation.ts';
import { parseCurrencyInput } from './currency-input.ts';

export interface ProductGuideInput {
	need: GuideNeed;
	capitalUse?: GuideCapitalUse | null;
	equipmentUse?: GuideEquipmentUse | null;
	amount?: number | null;
}

export interface ProductGuideFields {
	need: string;
	capitalUse: string;
	equipmentUse: string;
	amount: string;
}

export type GuideOptionalField = 'amount';
export interface ProductGuideContext {
	products: readonly GuideProduct[];
	optionalFields: readonly GuideOptionalField[];
}

/** Routing by expressed need, never by a score or inferred approval criteria. */
export function getProductGuideContext(input: { need: string; capitalUse?: string; equipmentUse?: string }): ProductGuideContext {
	let products: readonly GuideProduct[];
	if (input.need === 'capital') {
		products = input.capitalUse === 'one-time' ? ['business'] : input.capitalUse === 'recurring' ? ['revolving'] : ['business', 'revolving'];
	} else if (input.need === 'equipment') {
		products = input.equipmentUse === 'buy-now' ? ['business'] : input.equipmentUse === 'lease-buy' ? ['finance-lease'] : input.equipmentUse === 'use-only' ? ['lease'] : ['business', 'finance-lease', 'lease'];
	} else if (input.need === 'invoices') {
		products = ['factoring'];
	} else if (input.need === 'undecided') {
		products = guideProductOrder;
	} else {
		return { products: [], optionalFields: [] };
	}
	const only = products.length === 1 ? products[0] : undefined;
	const optionalFields: readonly GuideOptionalField[] = only === 'business'
		? ['amount']
		: [];
	return { products, optionalFields };
}

export type ProductGuideErrors = Partial<Record<keyof ProductGuideFields, string>>;
export type ProductGuideValidation = { valid: true; value: ProductGuideInput } | { valid: false; errors: ProductGuideErrors };

/** Only active answers are validated; hidden answers cannot affect another branch. */
export function validateProductGuide(fields: ProductGuideFields): ProductGuideValidation {
	const errors: ProductGuideErrors = {};
	if (!guideNeeds.some(({ value }) => value === fields.need)) errors.need = 'Selecciona qué necesita tu negocio.';
	const capitalUse = fields.need === 'capital' && fields.capitalUse ? fields.capitalUse : null;
	const equipmentUse = fields.need === 'equipment' && fields.equipmentUse ? fields.equipmentUse : null;
	if (capitalUse !== null && !guideCapitalUses.some(({ value }) => value === capitalUse)) errors.capitalUse = 'Selecciona cómo utilizarías el capital, o déjalo sin definir.';
	if (equipmentUse !== null && !guideEquipmentUses.some(({ value }) => value === equipmentUse)) errors.equipmentUse = 'Selecciona cómo quieres incorporar el activo, o déjalo sin definir.';
	const { optionalFields } = getProductGuideContext({ need: fields.need, capitalUse: capitalUse ?? '', equipmentUse: equipmentUse ?? '' });
	let amount: number | null = null;
	if (optionalFields.includes('amount')) {
		const empty = !fields.amount.trim() || fields.amount.trim() === '$';
		amount = empty ? null : parseCurrencyInput(fields.amount);
		if (amount !== null && (!Number.isSafeInteger(amount) || amount < 1 || amount > guideMaxAmount)) {
			errors.amount = `Captura un monto en pesos enteros de $1 a $${new Intl.NumberFormat('es-MX').format(guideMaxAmount)}, o deja el campo vacío.`;
		}
	}
	if (Object.keys(errors).length) return { valid: false, errors };
	return {
		valid: true,
		value: {
			need: fields.need as GuideNeed,
			capitalUse: capitalUse as GuideCapitalUse | null,
			equipmentUse: equipmentUse as GuideEquipmentUse | null,
			amount,
		},
	};
}

export interface ProductRecommendation {
	id: GuideProduct;
	title: string;
	href: string;
	description: string;
	reasons: string[];
	amountMatch: string | null;
	status: 'explore' | 'review';
	warnings: { code: 'amount'; text: string }[];
}

const pesos = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);

function needReason(id: GuideProduct, input: ProductGuideInput): string {
	if (input.need === 'capital') {
		if (id === 'business') return input.capitalUse === 'one-time' ? 'Buscas capital para una inversión o necesidad puntual.' : 'Puede servir para una inversión específica con monto y plazo definidos.';
		return input.capitalUse === 'recurring' ? 'Buscas liquidez recurrente para la operación de tu negocio.' : 'Una línea revolvente puede atender necesidades recurrentes de capital de trabajo.';
	}
	if (input.need === 'equipment') {
		if (id === 'business') return input.equipmentUse === 'buy-now' ? 'Buscas comprar el activo desde el inicio mediante un crédito.' : 'Un crédito simple puede destinarse a adquirir maquinaria o equipo.';
		if (id === 'finance-lease') return input.equipmentUse === 'lease-buy' ? 'Buscas utilizar el activo con opción de compra al terminar.' : 'Permite incorporar equipo mediante rentas y una opción terminal contractual.';
		return input.equipmentUse === 'use-only' ? 'Buscas utilizar el activo sin comprarlo.' : 'Permite usar activos mediante rentas y planear su renovación.';
	}
	if (input.need === 'invoices') return 'Buscas anticipar el cobro de facturas de tus clientes.';
	const exploratory: Record<GuideProduct, string> = {
		business: 'Una alternativa si necesitas capital para una inversión específica.',
		revolving: 'Una alternativa si tu operación necesita liquidez de forma recurrente.',
		'finance-lease': 'Una alternativa para usar equipo con opción de compra al terminar.',
		lease: 'Una alternativa para utilizar activos mediante rentas sin una compra automática.',
		factoring: 'Una alternativa si tienes facturas por cobrar elegibles para anticiparlas.',
	};
	return exploratory[id];
}

/** Contextual matches and known discrepancies explain the route; neither changes its products or order. */
export function getProductRecommendations(input: ProductGuideInput): ProductRecommendation[] {
	const validation = validateProductGuide({
		need: input.need,
		capitalUse: input.capitalUse ?? '', equipmentUse: input.equipmentUse ?? '',
		amount: input.amount == null ? '' : String(input.amount),
	});
	if (!validation.valid) throw new RangeError(Object.values(validation.errors).join(' '));
	const normalized = validation.value;
	const { products } = getProductGuideContext({ need: normalized.need, capitalUse: normalized.capitalUse ?? '', equipmentUse: normalized.equipmentUse ?? '' });
	return products.map((id) => {
		const warnings: ProductRecommendation['warnings'] = [];
		const reasons = [needReason(id, normalized)];
		let amountMatch: string | null = null;
		if (id === 'business') {
			const { amount } = loanSimulations.business;
			if (normalized.amount != null) {
				if (normalized.amount < amount.min || normalized.amount > amount.max) warnings.push({ code: 'amount', text: `El rango de referencia es de ${pesos(amount.min)} a ${pesos(amount.max)}. Revisa con un asesor si se ajusta a tu proyecto.` });
				else amountMatch = `Tu monto está en el rango publicado: ${pesos(amount.min)} a ${pesos(amount.max)}.`;
			}
		}
		return { id, ...guideProducts[id], reasons, amountMatch, status: warnings.length ? 'review' : 'explore', warnings };
	});
}
