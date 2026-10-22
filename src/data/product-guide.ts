import { credits } from './credits.ts';
import { financingProducts } from './financing-products.ts';

export const guideNeeds = [
	{ value: 'capital', label: 'Operar o invertir' },
	{ value: 'equipment', label: 'Equipo o vehículos' },
	{ value: 'invoices', label: 'Anticipar facturas' },
	{ value: 'undecided', label: 'Aún no lo sé' },
] as const;

export const guideCapitalUses = [
	{ value: 'one-time', label: 'Una inversión o necesidad puntual' },
	{ value: 'recurring', label: 'Necesidades recurrentes de liquidez' },
	{ value: 'undecided', label: 'Aún no lo sé' },
] as const;

export const guideEquipmentUses = [
	{ value: 'buy-now', label: 'Comprar el activo desde el inicio' },
	{ value: 'lease-buy', label: 'Usarlo con opción de compra al terminar' },
	{ value: 'use-only', label: 'Utilizarlo sin comprarlo' },
	{ value: 'undecided', label: 'Aún no lo sé' },
] as const;

export type GuideNeed = typeof guideNeeds[number]['value'];
export type GuideCapitalUse = typeof guideCapitalUses[number]['value'];
export type GuideEquipmentUse = typeof guideEquipmentUses[number]['value'];
export type GuideProduct = 'business' | 'revolving' | 'finance-lease' | 'lease' | 'factoring';

export const guideProducts = {
	business: {
		title: 'Crédito simple',
		href: credits.business.href,
		description: 'Para una inversión o proyecto específico, con un monto y un plazo definidos.',
	},
	revolving: {
		title: financingProducts.revolving.title,
		href: financingProducts.revolving.href,
		description: 'Para necesidades recurrentes de capital de trabajo, dentro de una línea autorizada.',
	},
	'finance-lease': {
		title: financingProducts['finance-lease'].title,
		href: financingProducts['finance-lease'].href,
		description: 'Para incorporar equipo o vehículos mediante rentas y una opción terminal contractual.',
	},
	lease: {
		title: financingProducts.lease.title,
		href: financingProducts.lease.href,
		description: 'Para utilizar activos productivos mediante rentas y planear su renovación.',
	},
	factoring: {
		title: financingProducts.factoring.title,
		href: financingProducts.factoring.href,
		description: 'Para anticipar el cobro de facturas elegibles a cargo de tus clientes.',
	},
} as const;

export const guideProductOrder: readonly GuideProduct[] = ['business', 'revolving', 'finance-lease', 'lease', 'factoring'];
export const guideMaxAmount = 999_999_999;
