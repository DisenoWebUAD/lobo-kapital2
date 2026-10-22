import { credits } from './credits.ts';
import { financingProducts } from './financing-products.ts';

export const guideObjectives = [
	{ value: 'project', label: 'Invertir en un proyecto o expansión' },
	{ value: 'liquidity', label: 'Cubrir necesidades recurrentes de liquidez' },
	{ value: 'purchase', label: 'Usar equipo con opción de compra' },
	{ value: 'use', label: 'Utilizar activos sin comprarlos' },
	{ value: 'invoices', label: 'Anticipar facturas por cobrar' },
	{ value: 'undecided', label: 'Aún no lo tengo definido' },
] as const;

export type GuideObjective = typeof guideObjectives[number]['value'];
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
export const guideTermOptions = [3, 6, 12, 18, 24, 36, 48, 60] as const;
export const guideHistoryOptions = [
	{ value: 'under-24', label: 'Menos de 24 meses' },
	{ value: '24-or-more', label: '24 meses o más' },
] as const;
export const guideMaxAmount = 999_999_999;
