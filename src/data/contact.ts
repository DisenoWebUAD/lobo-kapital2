import { legalLinks } from './legal.ts';

export type ContactProduct = 'personal' | 'business' | 'cards' | 'lease' | 'factoring';

interface ContactCopy {
	title: string;
	description: string;
	activityLabel: string;
	activityPlaceholder: string;
	messageLabel: string;
	messagePlaceholder: string;
	showAmount: boolean;
}

interface ContactProductOption extends ContactCopy {
	id: ContactProduct;
	value: string;
	label: string;
}

export const contactProducts: readonly ContactProductOption[] = [
	{
		id: 'personal',
		value: 'Préstamos Personales',
		label: 'Crédito personal',
		title: 'Hablemos de tu crédito personal',
		description: 'Cuéntanos qué necesitas financiar para orientarte sobre los requisitos y los siguientes pasos.',
		activityLabel: 'Tu actividad (opcional)',
		activityPlaceholder: 'Por ejemplo: profesionista o asalariado',
		messageLabel: '¿Qué necesitas financiar? (opcional)',
		messagePlaceholder: 'Por ejemplo: mejorar mi casa o continuar mis estudios.',
		showAmount: true,
	},
	{
		id: 'business',
		value: 'Créditos PyMEs',
		label: 'Crédito empresarial',
		title: 'Hablemos de tu crédito empresarial',
		description: 'Cuéntanos qué necesita tu empresa para orientarte sobre los requisitos y los siguientes pasos.',
		activityLabel: 'Empresa o actividad (opcional)',
		activityPlaceholder: 'Nombre de tu negocio o actividad',
		messageLabel: '¿Qué necesitas financiar? (opcional)',
		messagePlaceholder: 'Por ejemplo: comprar inventario para atender un nuevo pedido.',
		showAmount: true,
	},
	{
		id: 'cards',
		value: 'Tarjeta de Crédito',
		label: 'Tarjetas de crédito',
		title: 'Hablemos de las tarjetas',
		description: 'Cuéntanos qué te gustaría conocer sobre la propuesta de tarjetas de Lobo Kapital.',
		activityLabel: 'Tu actividad (opcional)',
		activityPlaceholder: 'Por ejemplo: profesionista o empresario',
		messageLabel: 'Tu consulta (opcional)',
		messagePlaceholder: '¿Qué te gustaría saber sobre las tarjetas?',
		showAmount: false,
	},
	{
		id: 'lease',
		value: 'Arrendamiento',
		label: 'Arrendamiento',
		title: 'Hablemos de arrendamiento',
		description: 'Cuéntanos qué equipo o activo necesita tu negocio.',
		activityLabel: 'Empresa o actividad (opcional)',
		activityPlaceholder: 'Nombre de tu negocio o actividad',
		messageLabel: '¿Qué necesitas arrendar? (opcional)',
		messagePlaceholder: 'Por ejemplo: equipo o vehículos para mi negocio.',
		showAmount: true,
	},
	{
		id: 'factoring',
		value: 'Factoraje',
		label: 'Factoraje',
		title: 'Hablemos de factoraje',
		description: 'Cuéntanos sobre las necesidades de liquidez de tu empresa.',
		activityLabel: 'Empresa o actividad (opcional)',
		activityPlaceholder: 'Nombre de tu negocio o actividad',
		messageLabel: 'Tu consulta (opcional)',
		messagePlaceholder: 'Cuéntanos qué necesita tu empresa.',
		showAmount: true,
	},
];

export const defaultContactCopy: ContactCopy = {
	title: 'Hablemos de tus planes',
	description: 'Elige un producto y cuéntanos qué necesitas para orientarte sobre los siguientes pasos.',
	activityLabel: 'Empresa o actividad (opcional)',
	activityPlaceholder: 'Por ejemplo: profesionista o nombre de tu negocio',
	messageLabel: 'Tu consulta (opcional)',
	messagePlaceholder: '¿En qué podemos orientarte?',
	showAmount: true,
};

export const privacyUrl = legalLinks.privacy;
export const contactEmail = 'contacto@lobokapital.mx';
