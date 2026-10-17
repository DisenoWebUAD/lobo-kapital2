import { legalEntity, legalLinks } from './legal';

interface Faq {
	id: string;
	question: string;
	paragraphs: string[];
	links?: { label: string; href: string }[];
}

export const faqs: Faq[] = [
	{
		id: 'lobo-kapital',
		question: '¿Qué es Lobo Kapital?',
		paragraphs: [
			`Lobo Kapital es la marca comercial de ${legalEntity.name} No es un banco ni capta depósitos del público. Su actividad se enfoca en otorgar crédito, arrendamiento y factoraje.`,
		],
	},
	{
		id: 'supervision',
		question: '¿Están regulados y supervisados?',
		paragraphs: [
			'La entidad es una Sociedad Financiera de Objeto Múltiple, Entidad No Regulada (SOFOM, E.N.R.). Está sujeta a la supervisión de la CNBV únicamente para los efectos previstos en el artículo 95 Bis de la Ley General de Organizaciones y Actividades Auxiliares del Crédito.',
		],
		links: [{ label: 'Consultar información institucional', href: legalLinks.institution }],
	},
	{
		id: 'quien-puede-solicitar',
		question: '¿Quiénes pueden solicitar financiamiento?',
		paragraphs: [
			'El crédito personal está dirigido a personas asalariadas, profesionistas o con ingresos comprobables en Durango. El empresarial se dirige a empresas con operación formal y flujo comprobable en Durango y Ciudad de México. Cada solicitud está sujeta a evaluación.',
		],
	},
	{
		id: 'primer-contacto',
		question: '¿Qué información necesito para iniciar?',
		paragraphs: [
			'Para pedir información basta con tu nombre, un correo para responderte y lo que necesitas financiar. No adjuntes identificaciones, estados de cuenta ni datos bancarios en este primer contacto.',
		],
		links: [{ label: 'Pedir información', href: '/#contacto' }],
	},
	{
		id: 'requisitos-personal',
		question: '¿Qué necesito para solicitar un crédito personal?',
		paragraphs: [
			'Se solicita identificación oficial INE y comprobante de ingresos. También se evalúan tu historial crediticio y capacidad de pago. No necesitas tener una empresa. Si decides iniciar el trámite, un asesor te indicará el canal para enviar tus documentos.',
		],
		links: [{ label: 'Ver requisitos del crédito personal', href: '/credito-personal/#requisitos' }],
	},
	{
		id: 'requisitos-empresarial',
		question: '¿Qué requisitos debe cumplir mi empresa?',
		paragraphs: [
			'Se requieren al menos 24 meses de operación, estados financieros y constancia de situación fiscal. La evaluación considera también el historial crediticio, la capacidad de pago y las garantías aplicables.',
			'Según el monto y el perfil de la operación, pueden solicitarse garantías hipotecarias, prendarias, fiduciarias u obligado solidario. El asesor te indicará cuáles corresponden a tu caso.',
		],
		links: [{ label: 'Ver requisitos del crédito empresarial', href: '/creditos-pymes/#requisitos' }],
	},
	{
		id: 'buro-de-credito',
		question: '¿Pedir información implica consultar mi Buró de Crédito?',
		paragraphs: [
			'No. El primer contacto no autoriza una consulta de historial. Si inicias una solicitud formal, el asesor te explicará las autorizaciones necesarias.',
			'Para el crédito personal, el requisito publicado es un puntaje de al menos 600, además del análisis de capacidad de pago. Cumplir ese puntaje no garantiza la aprobación.',
		],
	},
	{
		id: 'cuanto-pagaria',
		question: '¿Cómo sé cuánto pagaría?',
		paragraphs: [
			'Los simuladores muestran una mensualidad estimada con supuestos de referencia. La tasa y la comisión definitivas siguen pendientes de publicación. Tu propuesta deberá detallar monto, plazo, tasa, CAT, comisiones y calendario de pagos antes de contratar.',
		],
		links: [
			{ label: 'Simular crédito personal', href: '/credito-personal/#simulador' },
			{ label: 'Simular crédito empresarial', href: '/creditos-pymes/#simulador' },
		],
	},
	{
		id: 'montos-y-plazos',
		question: '¿Los montos y plazos publicados aplican a cualquier solicitud?',
		paragraphs: [
			'No de forma automática. Monto y plazo dependen del producto, de tu perfil y de la evaluación. Los rangos publicados orientan la consulta; las condiciones aplicables se definen en tu propuesta.',
		],
	},
	{
		id: 'aprobacion',
		question: '¿Cuánto tiempo tarda el proceso de aprobación?',
		paragraphs: [
			'Solicita al asesor el tiempo estimado y el canal de seguimiento para tu caso. La operación está sujeta a revisión de identidad, historial, capacidad de pago y análisis de riesgo. Enviar una consulta o cumplir los requisitos no garantiza la autorización.',
		],
	},
	{
		id: 'tramite',
		question: '¿El crédito se tramita por completo en esta página?',
		paragraphs: [
			'No. El sitio permite pedir información por correo. Si decides avanzar con una solicitud formal, un asesor te indicará la documentación, los canales y los siguientes pasos del trámite. Pedir información no te obliga a contratar.',
		],
	},
];
