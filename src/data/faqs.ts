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
			'La cuenta corriente cubre capital de trabajo empresarial; los arrendamientos se dirigen a empresas y personas con actividad empresarial, y el factoraje a proveedores con cuentas por cobrar elegibles. Consulta los requisitos específicos de cada producto.',
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
			'Para el crédito empresarial se requieren al menos 24 meses de operación, estados financieros y constancia de situación fiscal. La evaluación considera también el historial crediticio, la capacidad de pago y las garantías aplicables. Los demás productos empresariales tienen sus propios requisitos.',
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
			'Cada simulador muestra lo que corresponde al producto: mensualidad de crédito, primer pago mensual de cuenta corriente según la fecha de disposición, rentas de arrendamiento o liquidez de factoraje. Los resúmenes separan los cargos iniciales y los pagos posteriores cuando corresponden. Utilizan supuestos de referencia; las tasas, comisiones y demás cargos definitivos deberán confirmarse en una propuesta antes de contratar.',
			'Los seguros y servicios comienzan en cero y quedan excluidos mientras no captures un importe en los ajustes; esto no significa que sean gratuitos. Puedes modificar los supuestos disponibles y revisar su efecto en el resumen. Los resultados no son una cotización ni confirman aprobación.',
		],
		links: [
			{ label: 'Simular crédito personal', href: '/credito-personal/#simulador' },
			{ label: 'Simular crédito empresarial', href: '/creditos-pymes/#simulador' },
			{ label: 'Simular cuenta corriente', href: '/credito-en-cuenta-corriente/#simulador' },
			{ label: 'Simular arrendamiento financiero', href: '/arrendamiento-financiero/#simulador' },
			{ label: 'Simular arrendamiento puro', href: '/arrendamiento/#simulador' },
			{ label: 'Simular factoraje', href: '/factoraje/#simulador' },
		],
	},
	{
		id: 'cuenta-corriente',
		question: '¿Cómo funciona el crédito en cuenta corriente?',
		paragraphs: [
			'Es una línea revolvente para necesidades recurrentes de capital de trabajo de una empresa. Las disposiciones y pagos se realizan dentro del límite autorizado y conforme al contrato; los intereses dependen del monto y del tiempo efectivamente utilizados.',
			'La vigencia renovable publicada es de 12 a 36 meses, sujeta a evaluación y al comportamiento de la línea. Debe liquidarse el saldo total al menos una vez cada 12 meses.',
			'El simulador representa una sola disposición. Con la fecha inicial calcula el primer pago mensual y el pago que devuelve el capital al vencimiento; las comisiones iniciales aparecen aparte. En los ajustes puedes cambiar la línea de referencia, su vigencia y el seguro anual. La línea comienza igual al monto dispuesto y lo sigue hasta que la edites. El seguro capturado continúa durante toda la vigencia, incluso después de devolver el capital. No representa una mensualidad fija ni contempla nuevas disposiciones.',
		],
		links: [{ label: 'Conocer la cuenta corriente', href: '/credito-en-cuenta-corriente/' }],
	},
	{
		id: 'tipos-arrendamiento',
		question: '¿Qué diferencia hay entre arrendamiento puro y financiero?',
		paragraphs: [
			'El puro se enfoca en el uso de activos mediante rentas. El financiero contempla alternativas al término del contrato, incluida una opción de compra conforme a las condiciones pactadas. Durante ambos contratos, la propiedad permanece con Lobos Gestión Empresarial.',
			'La compra no es automática. El simulador financiero muestra las rentas y la compra opcional por separado; el puro no añade un pago de compra al término. Depósitos, efectos fiscales y condiciones definitivas deben revisarse en tu propuesta.',
		],
		links: [
			{ label: 'Conocer arrendamiento puro', href: '/arrendamiento/' },
			{ label: 'Conocer arrendamiento financiero', href: '/arrendamiento-financiero/' },
		],
	},
	{
		id: 'factoraje-liquidez',
		question: '¿El simulador de factoraje confirma cuánto recibiré?',
		paragraphs: [
			'No. Con el valor y el vencimiento de tus facturas, compara la liquidez inicial con y sin recurso mediante supuestos ilustrativos. Los ajustes permiten cambiar la línea de referencia, incluir o excluir la apertura y modificar el anticipo, los cargos de administración y los gastos externos. La línea se utiliza para estimar la apertura; no equivale a una autorización. El anticipo autorizado, las comisiones y las facturas elegibles se definen en la evaluación y el contrato. La reserva no anticipada depende del cobro y de las condiciones de la operación.',
		],
		links: [{ label: 'Explorar el factoraje', href: '/factoraje/#simulador' }],
	},
	{
		id: 'elegir-financiamiento',
		question: '¿Cómo elijo el financiamiento para mi empresa?',
		paragraphs: [
			'La guía del inicio muestra alternativas según tu objetivo. El monto, el plazo y la antigüedad son opcionales y sólo agregan observaciones sobre las referencias de cada producto; no descartan opciones ni evalúan tu crédito. Tus respuestas se procesan en el navegador y no se envían ni se guardan.',
		],
		links: [{ label: 'Elegir una alternativa para mi objetivo', href: '/#elige-tu-financiamiento' }],
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
