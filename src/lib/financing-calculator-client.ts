import { calculateRevolvingCredit, calculateLease, calculateFactoring, financingAssumptions, getLeaseDefaults, type LeaseAsset, type FactoringMode } from './financing-simulation';
import { formatCurrencyEdit, formatCurrencyInput, parseCurrencyInput } from './currency-input';

type FinancingProduct = 'revolving' | 'finance-lease' | 'lease' | 'factoring';
type BreakdownRow = [label: string, value: number, total?: boolean];
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const list = new Intl.ListFormat('es-MX', { type: 'conjunction' });
const percentage = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
const monthLabel = (month: string) => new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
const dateLabel = (date: string) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
const durationUnit = (value: number, field: string) => field === 'days' ? value === 1 ? 'día' : 'días' : value === 1 ? 'mes' : 'meses';
const duration = (value: number, field: string) => `${value} ${durationUnit(value, field)}`;

/** Whole-peso editing, including deletion across grouping separators. */
function bindCurrency(input: HTMLInputElement, signal: AbortSignal, edited: () => void) {
	let previous = input.value;
	const format = () => {
		const selection = formatCurrencyEdit(input.value, input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length);
		if (!selection) {
			input.value = previous;
			input.setSelectionRange(previous.length, previous.length);
		} else if (selection.text !== input.value) {
			const direction = input.selectionDirection ?? 'none';
			input.value = selection.text;
			input.setSelectionRange(selection.selectionStart, selection.selectionEnd, direction);
		}
		previous = input.value;
		edited();
	};
	input.addEventListener('beforeinput', event => {
		if (event.isComposing) return;
		const start = input.selectionStart ?? 0;
		const end = input.selectionEnd ?? start;
		if (start === 0 && end === 0 && input.value.startsWith('$') && event.inputType === 'insertText' && event.data !== null) {
			event.preventDefault();
			if (formatCurrencyEdit(`$${event.data}${input.value.slice(1)}`)) {
				input.setRangeText(event.data, 1, 1, 'end');
				format();
			}
			return;
		}
		if (event.inputType === 'insertText' && event.data !== null && !formatCurrencyEdit(input.value.slice(0, start) + event.data + input.value.slice(end))) event.preventDefault();
		if (start === end && event.inputType === 'deleteContentBackward' && input.value[start - 1] === ',') {
			event.preventDefault(); input.setRangeText('', start - 2, start, 'end'); format();
		} else if (start === end && event.inputType === 'deleteContentForward' && input.value[start] === ',') {
			event.preventDefault(); input.setRangeText('', start, start + 2, 'start'); format();
		}
	}, { signal });
	input.addEventListener('input', event => { if (!(event instanceof InputEvent) || !event.isComposing) format(); }, { signal });
	input.addEventListener('compositionend', format, { signal });
	input.addEventListener('blur', () => {
		const value = parseCurrencyInput(input.value);
		if (Number.isSafeInteger(value)) input.value = formatCurrencyInput(value);
		else if (input.hasAttribute('data-empty-zero') && (!input.value.trim() || input.value === '$')) input.value = formatCurrencyInput(0);
		previous = input.value;
	}, { signal });
	return () => { previous = input.value; };
}

function renderBreakdown(target: HTMLElement, rows: BreakdownRow[]) {
	target.replaceChildren(...rows.map(([label, value, total]) => {
		const row = document.createElement('div');
		if (total) row.dataset.total = '';
		const term = document.createElement('dt'); term.textContent = label;
		const detail = document.createElement('dd'); detail.textContent = money.format(value);
		row.append(term, detail);
		return row;
	}));
}

class FinancingCalculator extends HTMLElement {
	private controller?: AbortController;
	private form?: HTMLFormElement;
	private initialized = false;
	private product?: FinancingProduct;
	private statusTimer?: ReturnType<typeof setTimeout>;
	private lineEdited = false;
	private currencySync = new Map<string, () => void>();

	connectedCallback() { this.initialize(); }
	disconnectedCallback() {
		this.controller?.abort();
		this.currencySync.clear();
		clearTimeout(this.statusTimer);
		this.initialized = false;
	}

	initialize() {
		if (this.initialized || !this.isConnected) return;
		const product = this.dataset.product;
		if (!['revolving', 'finance-lease', 'lease', 'factoring'].includes(product ?? '')) return;
		this.product = product as FinancingProduct;
		this.form = this.querySelector('form') ?? undefined;
		if (!this.form) return;
		this.initialized = true;
		this.controller?.abort();
		this.controller = new AbortController();
		const { signal } = this.controller;
		this.form.querySelectorAll<HTMLInputElement>('[data-money]').forEach(input => {
			this.currencySync.set(input.name, bindCurrency(input, signal, () => {
				if (input.name === 'line') this.lineEdited = true;
				this.calculate();
			}));
		});
		this.form.addEventListener('input', event => {
			const input = event.target;
			if (!(input instanceof HTMLInputElement) || input.hasAttribute('data-money') || input.name === 'asset') return;
			if (input.dataset.rangeFor) this.control(input.dataset.rangeFor).value = input.value;
			this.calculate();
		}, { signal });
		this.form.addEventListener('change', event => {
			if (!(event.target instanceof HTMLInputElement)) return;
			if (event.target.name === 'asset') {
				const kind = this.product === 'lease' ? 'pure' : 'finance';
				const asset = event.target.value as LeaseAsset;
				this.control('termMonths').max = kind === 'pure' ? '36' : asset === 'machinery' ? '60' : '120';
				this.control('residualPercent').value = String(getLeaseDefaults(kind, asset).residualPercent);
				const finalExtras = kind === 'finance' && asset === 'machinery';
				this.element('[data-adjustment-label="insurance"]').textContent = finalExtras ? 'Seguro mensual, importe final' : 'Seguro mensual antes de IVA';
				this.element('[data-adjustment-label="services"]').textContent = finalExtras ? 'Servicios mensuales, importe final' : 'Servicios mensuales antes de IVA';
			}
			this.calculate(event.target.name === 'asset' ? 'all' : undefined);
		}, { signal });
		this.form.addEventListener('blur', event => {
			if (event.target instanceof HTMLInputElement && event.target.name) this.calculate(event.target.name);
		}, { signal, capture: true });
		this.form.addEventListener('submit', event => { event.preventDefault(); this.calculate('all', true); }, { signal });
		this.form.addEventListener('keydown', event => {
			if (event.key === 'Enter' && event.target instanceof HTMLInputElement && !['radio', 'range'].includes(event.target.type)) {
				event.preventDefault();
				this.calculate('all', true);
			}
		}, { signal });
		this.element<HTMLFieldSetElement>('[data-controls]').disabled = false;
		this.calculate();
	}

	private element<T extends HTMLElement = HTMLElement>(selector: string) { return this.querySelector<T>(selector)!; }
	private control(name: string): HTMLInputElement {
		const control = this.form!.elements.namedItem(name);
		return control instanceof RadioNodeList ? ([...control].find(item => item instanceof HTMLInputElement && item.checked) ?? control[0]) as HTMLInputElement : control as HTMLInputElement;
	}
	private number(name: string) {
		const input = this.control(name);
		if (input.hasAttribute('data-empty-zero') && (!input.value.trim() || input.value === '$')) return 0;
		return input.hasAttribute('data-money') ? parseCurrencyInput(input.value) : Number(input.value);
	}
	private setError(name: string, message: string) {
		const output = this.element(`[data-field-error="${name}"]`);
		output.textContent = message;
		output.hidden = !message;
		this.form!.querySelectorAll<HTMLInputElement>(`[name="${name}"]`).forEach(input => {
			if (message) {
				input.setAttribute('aria-invalid', 'true');
				const details = input.closest('details'); if (details) details.open = true;
			} else input.removeAttribute('aria-invalid');
		});
	}
	private clearResult() {
		clearTimeout(this.statusTimer);
		this.element('[data-result]').hidden = true;
		this.element('[data-result-note]').hidden = true;
		this.element('[data-empty]').hidden = false;
		this.element('[data-status]').textContent = '';
	}
	private syncRanges() {
		this.form!.querySelectorAll<HTMLInputElement>('[data-range-for]').forEach(range => {
			const name = range.dataset.rangeFor!;
			const input = this.control(name);
			range.min = input.min;
			range.max = input.max;
			const value = Number(input.value);
			if (input.value.trim() && Number.isFinite(value) && value >= Number(range.min) && value <= Number(range.max)) range.value = input.value;
			const progress = ((Number(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
			range.style.setProperty('--range-progress', `${progress}%`);
			range.setAttribute('aria-valuetext', duration(Number(range.value), name));
			this.element(`[data-range-bound="${name}"]`).textContent = duration(Number(range.max), name);
		});
	}
	private syncLine() {
		if (this.product !== 'revolving' && this.product !== 'factoring') return;
		const name = this.product === 'revolving' ? 'amount' : 'invoiceAmount';
		const amount = this.number(name);
		if (!this.lineEdited && Number.isSafeInteger(amount) && amount > 0 && amount <= financingAssumptions.maxAmount) {
			this.control('line').value = formatCurrencyInput(amount);
			this.currencySync.get('line')?.();
		}
		this.element('[data-line-note]').textContent = this.lineEdited
			? 'Usamos la línea de referencia que capturaste; ya no cambia al editar el monto. No es un límite autorizado.'
			: this.product === 'revolving' ? 'La línea sigue el monto a disponer hasta que la edites. No es un límite autorizado.' : 'La línea sigue el valor de las facturas hasta que la edites. Sólo determina la apertura cuando la incluyes.';
	}
	private validate(reveal?: string, focus = false) {
		let first: HTMLInputElement | undefined;
		const errors = new Map<string, string>();
		const related = new Set<string>();
		for (const input of this.form!.querySelectorAll<HTMLInputElement>('input[name]')) {
			if (errors.has(input.name)) continue;
			let error = '';
			if (input.type === 'checkbox') {
				// The unchecked state is an explicit scenario, not a missing value.
			} else if (input.type === 'radio') {
				if (!this.form!.querySelector(`input[name="${input.name}"]:checked`)) error = 'Selecciona una opción.';
			} else if (input.type === 'date') {
				if (!input.value) error = 'Indica la fecha estimada de disposición.';
				else if (!input.validity.valid) error = 'Indica una fecha válida entre los años 0001 y 9996.';
			} else if (input.hasAttribute('data-empty-zero') && (!input.value.trim() || input.value === '$')) {
				// Omitted optional currency amounts exclude that concept from the scenario.
			} else if (!input.value.trim() || input.value === '$') error = 'Completa este dato para calcular.';
			else {
				const value = this.number(input.name);
				const decimal = input.step === '0.01';
				if (!Number.isFinite(value) || (!decimal && !Number.isSafeInteger(value))) error = input.hasAttribute('data-money') ? 'Ingresa un monto válido en pesos enteros.' : decimal ? 'Ingresa un porcentaje válido.' : 'Ingresa un número entero.';
				else if (input.min && value < Number(input.min)) error = `El valor mínimo es ${input.hasAttribute('data-money') ? money.format(Number(input.min)) : input.min}.`;
				else if (input.max && value > Number(input.max)) error = `El valor máximo es ${input.hasAttribute('data-money') ? money.format(Number(input.max)) : input.max}.`;
				else if (decimal && input.validity.stepMismatch) error = 'Usa como máximo dos decimales en el porcentaje.';
			}
			errors.set(input.name, error);
			if (error) first ??= input;
		}
		if (!first && this.product === 'revolving' && this.number('amount') > this.number('line')) {
			errors.set('line', 'La línea debe ser igual o mayor que el monto a disponer.');
			related.add('line');
			first = this.control('line');
		}
		if (!first && this.product === 'factoring' && this.control('includeOpening').checked && this.number('line') < 1) {
			errors.set('line', 'Captura una línea de referencia mayor que cero para incluir la apertura.');
			related.add('line');
			first = this.control('line');
		}
		if (!first && this.product === 'finance-lease') {
			const value = this.number('assetValue');
			const advance = this.number('advance');
			if (advance >= value) {
				errors.set('advance', 'El anticipo debe ser menor que el valor del activo.');
				related.add('advance');
				first = this.control('advance');
			} else if (value * this.number('residualPercent') / 100 > value - advance) {
				errors.set('residualPercent', 'El residual no puede superar el principal después del anticipo. Reduce el residual o el anticipo.');
				related.add('residualPercent');
				first = this.control('residualPercent');
			}
		}
		for (const [name, error] of errors) {
			if (!error || reveal === 'all' || reveal === name || (reveal && related.has(name)) || this.control(name).hasAttribute('aria-invalid')) this.setError(name, error);
		}
		if (first && focus) first.focus();
		return !first;
	}
	private announce(message: string) {
		clearTimeout(this.statusTimer);
		this.statusTimer = setTimeout(() => { this.element('[data-status]').textContent = message; }, 350);
	}
	private showResult(label: string, payment: number, context: string, rows: BreakdownRow[], note: string, costs: BreakdownRow[]) {
		this.element('[data-result-label]').textContent = label;
		this.element('[data-payment]').textContent = money.format(payment);
		this.element('[data-context]').textContent = context;
		this.element('[data-result-note]').textContent = note;
		this.element('[data-result-note]').hidden = !note;
		renderBreakdown(this.element('[data-breakdown]'), rows);
		const breakdown = document.createElement('dl'); breakdown.className = 'financing-calculator__breakdown';
		renderBreakdown(breakdown, costs);
		this.element('[data-cost-breakdown]').replaceChildren(breakdown);
		this.element('[data-empty]').hidden = true;
		this.element('[data-result]').hidden = false;
		this.announce(`${label}: ${money.format(payment)}. ${context}`);
	}
	private calculate(reveal?: string, focus = false) {
		this.syncLine();
		this.syncRanges();
		this.querySelectorAll<HTMLElement>('[data-value-unit]').forEach(unit => {
			const name = unit.dataset.valueUnit!;
			unit.textContent = durationUnit(this.number(name), name);
		});
		this.element('[data-form-error]').hidden = true;
		if (!this.validate(reveal, focus)) {
			this.clearResult();
			if (focus) this.element('[data-status]').textContent = 'Revisa los campos señalados para calcular la estimación.';
			return;
		}
		try { this.calculateProduct(); }
		catch (error) {
			this.clearResult();
			const output = this.element('[data-form-error]');
			output.textContent = error instanceof Error ? error.message : 'Revisa los datos para calcular este escenario.';
			output.hidden = false;
		}
	}
	private calculateProduct() {
		if (this.product === 'revolving') {
			const amount = this.number('amount');
			const result = calculateRevolvingCredit({ amount, line: this.number('line'), days: this.number('days'), startDate: this.control('startDate').value, lineMonths: this.number('lineMonths'), annualInsurance: this.number('annualInsurance') });
			const first = result.monthlyPayments[0];
			const final = result.monthlyPayments.find(row => row.principal > 0)!;
			this.showResult('Pago estimado del primer mes', first.total, `${monthLabel(first.month)}. El pago varía según los días de cada periodo.`, [
				['Al inicio · apertura y disposición con IVA', result.initialPayment],
				[`Pago de ${monthLabel(final.month)} · incluye devolución del capital`, final.total],
				['Total del escenario modelado', result.total, true],
			], `Se modela una sola disposición y la devolución de ${money.format(amount)} de capital al vencimiento, el ${dateLabel(result.maturityDate)}. No es una mensualidad fija. ${result.monthlyInsurance > 0 ? `El seguro de ${money.format(result.monthlyInsurance)} al mes continúa durante los ${this.number('lineMonths')} meses de vigencia, incluso después de devolver el capital.` : 'El escenario excluye el seguro porque el importe capturado es cero.'}`, [
				['Intereses totales sin IVA', result.interest], ['IVA de los intereses', result.interestVat],
				['Intereses totales con IVA', result.interest + result.interestVat, true],
				['Apertura con IVA · inicial', result.openingFee], ['Disposición con IVA · inicial', result.drawFee],
				['Seguro mensual · toda la vigencia', result.monthlyInsurance], ['Seguro total · toda la vigencia', result.insurance],
			]);
			return;
		}
		if (this.product === 'finance-lease' || this.product === 'lease') {
			const kind = this.product === 'lease' ? 'pure' : 'finance';
			const asset = this.control('asset').value as LeaseAsset;
			const months = this.number('termMonths');
			const advance = kind === 'finance' ? this.number('advance') : 0;
			const residualPercent = this.number('residualPercent');
			const result = calculateLease({ kind, asset, value: this.number('assetValue'), months, advance, residualPercent, insurance: this.number('insurance'), services: this.number('services') });
			const rows: BreakdownRow[] = [[kind === 'finance' ? 'Pago inicial estimado' : 'Al inicio · apertura con IVA', result.initialPayment]];
			if (kind === 'finance') rows.push(['Compra al terminar · opcional, con IVA', result.terminalPayment]);
			rows.push([kind === 'finance' ? 'Total del escenario modelado sin compra' : 'Total del escenario modelado', result.totalWithoutPurchase, true]);
			if (kind === 'finance') rows.push(['Total del escenario modelado con compra', result.totalWithPurchase, true]);
			const costs: BreakdownRow[] = [['Renta mensual sin IVA', result.baseRent], ['Seguro mensual capturado', result.monthlyInsurance], ['Servicios mensuales capturados', result.monthlyServices], ['IVA mensual', result.monthlyVat], ['Apertura con IVA · inicial', result.openingFee]];
			if (advance > 0) costs.push(['Anticipo · inicial', advance]);
			if (result.administrationTotal > 0) costs.push(['Administración con IVA · todo el plazo', result.administrationTotal]);
			const anniversaries = result.schedule.filter(row => row.month > 0 && row.administration > 0);
			const administration = anniversaries.length ? ` Además de la renta, administración de ${money.format(anniversaries[0].administration)} en ${anniversaries.length === 1 ? 'el mes' : 'los meses'} ${list.format(anniversaries.map(row => String(row.month)))}.` : '';
			this.showResult('Renta mensual estimada con IVA', result.monthlyPayment, `${months} ${months === 1 ? 'renta mensual' : 'rentas mensuales'} de ${asset === 'vehicle' ? 'vehículo' : 'maquinaria o equipo'}.`, rows,
				kind === 'finance' ? `Residual capturado: ${percentage.format(residualPercent)}%. La compra es opcional y se paga por separado.${administration}` : `Residual capturado: ${percentage.format(residualPercent)}%, como supuesto para calcular la renta. El resumen contempla las rentas, los importes de seguro y servicios capturados y la apertura; no incluye depósito ni compra al terminar.`, costs);
			return;
		}
		this.calculateFactoring();
	}
	private calculateFactoring() {
		const amount = this.number('invoiceAmount');
		const days = this.number('days');
		const costs = this.element('[data-cost-breakdown]'); costs.replaceChildren();
		const announcements: string[] = [];
		let reserve: number | undefined;
		for (const mode of ['without-recourse', 'with-recourse'] as FactoringMode[]) {
			const panel = this.element(`[data-modality="${mode}"]`);
			const payment = panel.querySelector<HTMLElement>('[data-payment]')!;
			const currency = panel.querySelector<HTMLElement>('small')!;
			const deduction = panel.querySelector<HTMLElement>('[data-deduction]')!;
			const label = mode === 'without-recourse' ? 'Sin recurso' : 'Con recurso';
			try {
				const result = calculateFactoring({ amount, days, mode, line: this.number('line'), includeOpening: this.control('includeOpening').checked, advancePercent: this.number('advancePercent'), administrationCount: this.number('administrationCount'), expenses: this.number('expenses') });
				reserve = result.reserve;
				payment.textContent = money.format(result.netLiquidity);
				currency.hidden = false;
				deduction.textContent = `${money.format(result.totalDeductions)} de deducciones con IVA.`;
				panel.removeAttribute('data-unavailable');
				const heading = document.createElement('h4'); heading.textContent = label;
				const breakdown = document.createElement('dl'); breakdown.className = 'financing-calculator__breakdown';
				renderBreakdown(breakdown, [
					['Descuento sin IVA', result.discount], ['Apertura sin IVA', result.openingFee], ['Operación sin IVA', result.operationFee],
					['Administración sin IVA', result.administrationFee], ['Gastos externos sin IVA', result.expenses], ['IVA de las deducciones', result.vat],
				]);
				costs.append(heading, breakdown);
				announcements.push(`${label}: ${money.format(result.netLiquidity)}.`);
			} catch (error) {
				if (!(error instanceof RangeError)) throw error;
				payment.textContent = '—';
				currency.hidden = true;
				deduction.textContent = 'Los cargos igualan o superan el anticipo. Ajusta el monto o el plazo.';
				panel.setAttribute('data-unavailable', '');
				announcements.push(`${label}: sin liquidez positiva en este escenario.`);
			}
		}
		const advancePercent = this.number('advancePercent');
		this.element('[data-result-label]').textContent = 'Liquidez inicial estimada';
		this.element('[data-context]').textContent = `Anticipo capturado del ${percentage.format(advancePercent)}%: ${money.format(amount * advancePercent / 100)}. Facturas a ${duration(days, 'days')}.`;
		renderBreakdown(this.element('[data-breakdown]'), reserve === undefined ? [] : [['Reserva al cobrar las facturas · sujeta a contrato', reserve]]);
		this.element('[data-result-note]').textContent = `${this.control('includeOpening').checked ? `La apertura se estima sobre la línea de referencia capturada de ${money.format(this.number('line'))}.` : 'El escenario excluye la apertura de la línea.'} La reserva no se entrega al inicio; su liberación depende del cobro y del contrato. La línea, el anticipo y la modalidad definitivos dependen de la evaluación y la propuesta.`;
		this.element('[data-result-note]').hidden = false;
		this.element('[data-costs]').hidden = reserve === undefined;
		this.element('[data-empty]').hidden = true;
		this.element('[data-result]').hidden = false;
		this.announce(`Liquidez inicial estimada. ${announcements.join(' ')}`);
	}
}

let registered = false;
export function registerFinancingCalculator() {
	if (registered) return;
	registered = true;
	if (!customElements.get('lobo-financing-calculator')) customElements.define('lobo-financing-calculator', FinancingCalculator);
	const initialize = () => document.querySelectorAll<FinancingCalculator>('lobo-financing-calculator').forEach(calculator => calculator.initialize());
	initialize();
	document.addEventListener('astro:page-load', initialize);
}
