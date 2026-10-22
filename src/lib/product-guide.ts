import { credits } from '../data/credits.ts';
import { financingProducts } from '../data/financing-products.ts';
import {
	guideMaxAmount, guideObjectives, guideProductOrder, guideProducts, guideTermOptions,
	type GuideObjective, type GuideProduct,
} from '../data/product-guide.ts';
import { loanSimulations } from './loan-simulation.ts';
import { parseCurrencyInput } from './currency-input.ts';

export interface ProductGuideInput {
	objective: GuideObjective;
	amount?: number | null;
	termMonths?: number | null;
	operatingHistory?: 'under-24' | '24-or-more' | null;
}

export interface ProductGuideFields {
	objective: string;
	amount: string;
	termMonths: string;
	operatingHistory: string;
}

export type ProductGuideErrors = Partial<Record<keyof ProductGuideFields, string>>;
export type ProductGuideValidation = { valid: true; value: ProductGuideInput } | { valid: false; errors: ProductGuideErrors };

export function validateProductGuide(fields: ProductGuideFields): ProductGuideValidation {
	const errors: ProductGuideErrors = {};
	if (!guideObjectives.some(({ value }) => value === fields.objective)) errors.objective = 'Selecciona qué quieres lograr.';
	const emptyAmount = !fields.amount.trim() || fields.amount.trim() === '$';
	const amount = emptyAmount ? null : parseCurrencyInput(fields.amount);
	if (amount !== null && (!Number.isSafeInteger(amount) || amount < 1 || amount > guideMaxAmount)) {
		errors.amount = 'Captura un monto en pesos enteros de $1 a $999,999,999, o deja el campo vacío.';
	}
	const termMonths = fields.termMonths === '' ? null : Number(fields.termMonths);
	if (termMonths !== null && !guideTermOptions.some((months) => months === termMonths)) errors.termMonths = 'Selecciona uno de los plazos disponibles, o déjalo sin definir.';
	if (fields.operatingHistory && !['under-24', '24-or-more'].includes(fields.operatingHistory)) errors.operatingHistory = 'Selecciona la antigüedad de tu empresa, o déjala sin definir.';
	if (Object.keys(errors).length) return { valid: false, errors };
	return {
		valid: true,
		value: {
			objective: fields.objective as GuideObjective,
			amount,
			termMonths,
			operatingHistory: fields.operatingHistory ? fields.operatingHistory as ProductGuideInput['operatingHistory'] : null,
		},
	};
}

export interface ProductRecommendation {
	id: GuideProduct;
	title: string;
	href: string;
	description: string;
	warnings: { code: 'amount' | 'term' | 'history'; text: string }[];
}

const objectiveProducts: Record<GuideObjective, readonly GuideProduct[]> = {
	project: ['business'], liquidity: ['revolving'], purchase: ['finance-lease'],
	use: ['lease'], invoices: ['factoring'], undecided: guideProductOrder,
};
const pesos = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);

/** Optional answers add context; they never remove the alternative selected by the goal. */
export function getProductRecommendations(input: ProductGuideInput): ProductRecommendation[] {
	const validation = validateProductGuide({
		objective: input.objective,
		amount: input.amount == null ? '' : String(input.amount),
		termMonths: input.termMonths == null ? '' : String(input.termMonths),
		operatingHistory: input.operatingHistory ?? '',
	});
	if (!validation.valid) throw new RangeError(Object.values(validation.errors).join(' '));

	return objectiveProducts[input.objective].map((id) => {
		const warnings: ProductRecommendation['warnings'] = [];
		if (id === 'business') {
			const { amount, term } = loanSimulations.business;
			if (input.amount != null && (input.amount < amount.min || input.amount > amount.max)) {
				warnings.push({ code: 'amount', text: `El rango de referencia es de ${pesos(amount.min)} a ${pesos(amount.max)}. Revisa con un asesor si se ajusta a tu proyecto.` });
			}
			if (input.termMonths != null && (input.termMonths < Math.min(...term.options) || input.termMonths > Math.max(...term.options))) {
				warnings.push({ code: 'term', text: `El plazo de referencia es de ${Math.min(...term.options)} a ${Math.max(...term.options)} meses, sujeto a evaluación.` });
			}
			if (input.operatingHistory === 'under-24') {
				warnings.push({ code: 'history', text: `Este producto requiere al menos ${credits.business.minimumOperatingMonths} meses de operación. Un asesor puede revisar tu situación.` });
			}
		}
		if (id === 'revolving' && input.termMonths != null) {
			const { min, max } = financingProducts.revolving.lineMonths;
			if (input.termMonths < min || input.termMonths > max) warnings.push({ code: 'term', text: `La vigencia de referencia de la línea es de ${min} a ${max} meses; cada disposición tiene su propio plazo.` });
		}
		if (id === 'lease' && input.termMonths != null) {
			const { min, max } = financingProducts.lease.termMonths;
			if (input.termMonths < min || input.termMonths > max) warnings.push({ code: 'term', text: `El plazo de referencia del arrendamiento puro es de ${min} a ${max} meses, sujeto a evaluación.` });
		}
		if (id === 'factoring' && input.operatingHistory === 'under-24') {
			warnings.push({ code: 'history', text: `El cedente de las facturas debe tener al menos ${financingProducts.factoring.minimumOperatingMonths} meses de antigüedad.` });
		}
		return { id, ...guideProducts[id], warnings };
	});
}
