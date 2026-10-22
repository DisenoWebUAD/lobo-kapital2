const pendingPricing = {
	annualInterestRate: null,
	openingFeeRate: null,
	insurance: null,
	status: 'Pendiente de confirmación en la propuesta',
} as const;

const revolvingCat = 'CAT informativo de 59.1% sin IVA para crédito en cuenta corriente con garantía hipotecaria. Para fines informativos y de comparación. Referencia: tres disposiciones iguales de $500,000, restituyendo el saldo disponible de la línea, a 120 días por disposición. Vigencia: del 1 de octubre de 2026 al 31 de marzo de 2027.';
const financeLeaseCat = 'CAT informativo de 46.06% anual sin IVA para arrendamiento financiero. Para fines informativos y de comparación. Referencia: valor de adquisición de $1,000,000 a 36 meses. Vigencia: del 1 de octubre de 2026 al 31 de marzo de 2027.';
const factoringCat = {
	withRecourse: 'CAT informativo de 48.61% anual sin IVA para factoraje con recurso. Referencia de $1,000,000, anticipo del 90%, 60 días, descuento del 30%, apertura del 1.5% y operación del 1%, suponiendo el cumplimiento oportuno del derecho de crédito. Para fines informativos y de comparación. Vigencia: ejercicio 2026, hasta el 31 de diciembre de 2026.',
	withoutRecourse: 'CAT informativo de 76.74% anual sin IVA para factoraje sin recurso con cobranza directa. Referencia de $1,000,000, anticipo del 90%, 60 días, descuento del 36%, apertura del 1.5% y operación del 1%, suponiendo el cumplimiento oportuno del derecho de crédito. Para fines informativos y de comparación. Vigencia: ejercicio 2026, hasta el 31 de diciembre de 2026.',
} as const;

export const financingProducts = {
	revolving: {
		lineMonths: { min: 12, max: 36 },
		title: 'Crédito en cuenta corriente',
		href: '/credito-en-cuenta-corriente/',
		summary: 'Una línea revolvente para las necesidades recurrentes de tu operación.',
		heroLead: 'Capital disponible para',
		heroAccent: 'seguir operando.',
		heroDescription: 'Atiende compras, pagos y oportunidades de tu empresa con disposiciones dentro de una línea autorizada. Recupera disponibilidad conforme pagas y a las condiciones de tu contrato.',
		intro: 'Para empresas con necesidades variables de capital de trabajo, temporadas de mayor demanda o diferencias entre sus fechas de cobro y pago.',
		uses: ['Compra de inventario y materias primas.', 'Pagos a proveedores, nómina y gastos de operación.', 'Pedidos extraordinarios y oportunidades de corto plazo.'],
		process: [
			{ title: 'Define tu ciclo de efectivo', description: 'Revisamos tu ciclo de efectivo y necesidades de inventario, proveedores, nómina o pedidos de corto plazo.' },
			{ title: 'Dispón dentro de tu límite', description: 'Una vez autorizada y formalizada, utilizas los recursos conforme a los términos de la línea.' },
			{ title: 'Paga y recupera disponibilidad', description: 'Los pagos y nuevas disposiciones se realizan conforme al contrato y a la vigencia autorizada.' },
		],
		requirements: ['Actividad empresarial formal y un destino de capital de trabajo identificado.', 'Información financiera, fiscal e historial para evaluar el límite y la capacidad de pago.', 'Garantías y documentación de acuerdo con el análisis de la operación.'],
		conditions: [
			'Vigencia renovable de 12 a 36 meses, sujeta a evaluación y al comportamiento de la línea.',
			'El saldo total debe liquidarse al menos una vez cada 12 meses.',
			'Los intereses se calculan sobre el importe y el período efectivamente dispuestos, conforme al contrato.',
		],
		referenceFacts: [{ label: 'Cobertura', value: 'Durango y Ciudad de México.' }],
		contractualPricing: { ...pendingPricing, drawFeeRate: null },
		contractNote: 'La disponibilidad, revolvencia, tasa, comisiones y demás condiciones dependen de evaluación, contrato y políticas internas. Solicita una propuesta con los costos y condiciones completos antes de contratar.',
		cat: '59.1% sin IVA',
		catModality: 'Con garantía hipotecaria',
		catDisclosure: revolvingCat,
	},
	'finance-lease': {
		title: 'Arrendamiento financiero',
		href: '/arrendamiento-financiero/',
		summary: 'Equipo y vehículos con pagos periódicos y una opción terminal contractual.',
		heroLead: 'Equipa tu empresa.',
		heroAccent: 'Proyecta su siguiente paso.',
		heroDescription: 'Incorpora activos productivos mediante rentas periódicas y conserva recursos para tu operación. Al terminar, elige entre las alternativas acordadas en tu contrato.',
		intro: 'Para empresas y personas con actividad empresarial que necesitan maquinaria, equipo o vehículos y buscan distribuir su costo durante el plazo contratado.',
		uses: ['Vehículos y unidades para transporte o reparto.', 'Maquinaria y equipo industrial.', 'Equipo médico, tecnología y otros activos elegibles.'],
		process: [
			{ title: 'Elige el activo', description: 'Identifica el equipo y proveedor que necesita tu negocio. Evaluamos el bien, su destino y tu capacidad de pago.' },
			{ title: 'Úsalo durante el contrato', description: 'Después de la autorización y formalización, Lobo Kapital adquiere el activo y te otorga su uso mediante rentas.' },
			{ title: 'Decide al finalizar', description: 'La compra, prórroga o participación en la venta a un tercero dependerá de las alternativas pactadas.' },
		],
		requirements: ['Identificar el bien productivo y su uso en tu actividad.', 'Información de identidad, fiscal y financiera para analizar la operación.', 'Cotización del activo y documentación que indique el asesor al iniciar el trámite.'],
		conditions: [
			'La propiedad del activo permanece con Lobos Gestión Empresarial durante el contrato.',
			'Al finalizar, se pacta una opción de compra, prórroga o participación en la venta a un tercero, conforme al contrato.',
		],
		referenceFacts: [
			{ label: 'Plazo promedio de referencia', value: '36 meses; el plazo de contratación depende del activo y de la evaluación.' },
			{ label: 'Cobertura', value: 'Durango y Ciudad de México.' },
		],
		contractualPricing: { ...pendingPricing, administrationFee: null, residualRate: null },
		contractNote: 'La autorización, el anticipo, las rentas, el plazo y la opción terminal dependen de la evaluación, el activo y el contrato. Solicita el detalle de seguros y cargos junto con tu propuesta antes de contratar.',
		cat: '46.06% anual sin IVA',
		catModality: 'Arrendamiento financiero',
		catDisclosure: financeLeaseCat,
	},
	lease: {
		termMonths: { min: 18, max: 36 },
		title: 'Arrendamiento puro',
		href: '/arrendamiento/',
		summary: 'Utiliza y renueva los activos de tu negocio mediante rentas.',
		intro: 'Para empresas y personas con actividad empresarial que buscan usar vehículos, maquinaria o equipo sin realizar una compra inmediata.',
		requirements: ['Definir el equipo, maquinaria o vehículos que utilizará tu empresa.', 'Información de identidad, fiscal y financiera conforme a la operación.', 'Documentación del activo y del proveedor que indique tu asesor.'],
		conditions: [
			'Plazo de 18 a 36 meses, sujeto a evaluación.',
			'Rentas mensuales o trimestrales, según el contrato.',
			'La propiedad del activo permanece con Lobos Gestión Empresarial.',
		],
		referenceFacts: [],
		contractualPricing: { ...pendingPricing, deposit: null },
		contractNote: 'La autorización, el depósito, las rentas, el plazo, los servicios y las opciones al vencimiento se definen mediante evaluación y contrato. Solicita una propuesta con los cargos completos y consulta a tu asesor fiscal sobre los efectos aplicables a tu empresa.',
		cat: 'CAT no aplicable',
		catModality: 'Arrendamiento puro',
		catDisclosure: 'CAT no aplicable, al tratarse de una operación de arrendamiento puro. Solicita rentas, cargos, seguros, depósito y calendario completos antes de contratar.',
	},
	factoring: {
		minimumOperatingMonths: 24,
		title: 'Factoraje',
		href: '/factoraje/',
		summary: 'Anticipa cuentas por cobrar elegibles y planea tu liquidez.',
		intro: 'Para empresas proveedoras de clientes corporativos que venden a crédito y requieren anticipar cuentas por cobrar elegibles.',
		requirements: ['Al menos 24 meses de antigüedad como cedente de las facturas.', 'Constancia de situación fiscal e historial sujetos a evaluación.', 'Facturas a cargo de clientes corporativos que puedan evaluarse y notificarse.'],
		conditions: [
			'Se da preferencia a la modalidad sin recurso; también se contempla con recurso, según evaluación.',
			'90 días como plazo promedio de referencia de la operación; no representa un plazo autorizado.',
		],
		referenceFacts: [],
		contractualPricing: { ...pendingPricing, discountRate: null, operationFeeRate: null, administrationFee: null, advanceRate: null },
		contractNote: 'La autorización, el porcentaje de anticipo, el aforo, los costos y la modalidad dependen de la evaluación, la validación documental y el contrato. Solicita una propuesta completa antes de contratar.',
		cat: '48.61% con recurso / 76.74% sin recurso',
		catModality: 'Anual sin IVA · sin recurso con cobranza directa',
		catDisclosures: factoringCat,
		catDisclosure: `${factoringCat.withRecourse} ${factoringCat.withoutRecourse}`,
	},
} as const;

export type FinancingProductId = keyof typeof financingProducts;
