import { estimateRevolvingDraw, estimateLease, estimateFactoringOperation } from './financing-estimates';
import { factoringDefaults, getLeaseDefaults, type LeaseAsset, type FactoringMode } from './financing-simulation';
import { formatCurrencyEdit, formatCurrencyInput, parseCurrencyInput } from './currency-input';

type FinancingProduct = 'revolving' | 'finance-lease' | 'lease' | 'factoring';
type BreakdownRow = [label: string, value: number, total?: boolean];
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const list = new Intl.ListFormat('es-MX', { type: 'conjunction' });
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
		else if (input.name === 'advance' && (!input.value.trim() || input.value === '$')) input.value = formatCurrencyInput(0);
		previous = input.value;
	}, { signal });
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

	connectedCallback() { this.initialize(); }
	disconnectedCallback() {
		this.controller?.abort();
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
		this.form.querySelectorAll<HTMLInputElement>('[data-money]').forEach(input => bindCurrency(input, signal, () => this.calculate()));
		this.form.addEventListener('input', event => {
			const input = event.target;
			if (!(input instanceof HTMLInputElement) || input.hasAttribute('data-money') || input.name === 'asset') return;
			if (input.dataset.rangeFor) this.control(input.dataset.rangeFor).value = input.value;
			this.calculate();
		}, { signal });
		this.form.addEventListener('change', event => {
			if (!(event.target instanceof HTMLInputElement)) return;
			if (event.target.name === 'asset') this.control('termMonths').max = event.target.value === 'machinery' ? '60' : '120';
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
		if (name === 'advance' && (!input.value.trim() || input.value === '$')) return 0;
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
	private validate(reveal?: string, focus = false) {
		let first: HTMLInputElement | undefined;
		const errors = new Map<string, string>();
		for (const input of this.form!.querySelectorAll<HTMLInputElement>('input[name]')) {
			if (errors.has(input.name)) continue;
			let error = '';
			if (input.type === 'radio') {
				if (!this.form!.querySelector(`input[name="${input.name}"]:checked`)) error = 'Selecciona una opción.';
			} else if (input.name === 'advance' && (!input.value.trim() || input.value === '$')) {
				// An omitted optional advance means the explicitly disclosed zero-advance scenario.
			} else if (!input.value.trim() || input.value === '$') error = 'Completa este dato para calcular.';
			else {
				const value = this.number(input.name);
				if (!Number.isSafeInteger(value)) error = input.hasAttribute('data-money') ? 'Ingresa un monto válido en pesos enteros.' : 'Ingresa un número entero.';
				else if (input.min && value < Number(input.min)) error = `El valor mínimo es ${input.hasAttribute('data-money') ? money.format(Number(input.min)) : input.min}.`;
				else if (input.max && value > Number(input.max)) error = `El valor máximo es ${input.hasAttribute('data-money') ? money.format(Number(input.max)) : input.max}.`;
			}
			errors.set(input.name, error);
			if (error) first ??= input;
		}
		if (!first && this.product === 'finance-lease') {
			const value = this.number('assetValue');
			const residualPercent = getLeaseDefaults('finance', this.control('asset').value as LeaseAsset).residualPercent;
			const maxAdvance = value - value * residualPercent / 100;
			if (this.number('advance') > maxAdvance) {
				errors.set('advance', `Con este activo, el anticipo no puede superar ${money.format(maxAdvance)} para conservar el residual de referencia.`);
				first = this.control('advance');
			}
		}
		for (const [name, error] of errors) {
			if (!error || reveal === 'all' || reveal === name || (reveal && name === 'advance')) this.setError(name, error);
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
			output.hidden = !reveal;
		}
	}
	private calculateProduct() {
		if (this.product === 'revolving') {
			const result = estimateRevolvingDraw({ amount: this.number('amount'), days: this.number('days') });
			this.showResult('Pago mensual estimado con IVA', result.monthlyPayment, `${result.regularPaymentCount} ${result.regularPaymentCount === 1 ? 'pago de referencia' : 'pagos de referencia'} de ${result.paymentPeriodDays} días y un pago final al día ${result.days}.`, [
				['Al inicio · apertura y disposición con IVA', result.initialCharges],
				['Pago final · capital e intereses con IVA', result.finalPayment],
				['Total del escenario modelado', result.total, true],
			], `El pago final incluye ${money.format(result.amount)} de capital y ${result.finalPeriodDays} ${result.finalPeriodDays === 1 ? 'día' : 'días'} de intereses. Los pagos reales dependen de las fechas y de los movimientos de la línea.`, [
				['Intereses totales sin IVA', result.interest], ['IVA de los intereses', result.interestVat],
				['Intereses totales con IVA', result.interestWithVat, true],
				['Apertura con IVA · inicial', result.openingFee], ['Disposición con IVA · inicial', result.drawFee],
			]);
			return;
		}
		if (this.product === 'finance-lease' || this.product === 'lease') {
			const kind = this.product === 'lease' ? 'pure' : 'finance';
			const asset = kind === 'finance' ? this.control('asset').value as LeaseAsset : 'vehicle';
			const months = this.number('termMonths');
			const advance = kind === 'finance' ? this.number('advance') : 0;
			const result = estimateLease({ kind, asset, value: this.number('assetValue'), months, advance });
			const rows: BreakdownRow[] = [[kind === 'finance' ? 'Pago inicial estimado' : 'Al inicio · apertura con IVA', result.initialPayment]];
			if (kind === 'finance') rows.push(['Compra al terminar · opcional, con IVA', result.terminalPayment]);
			rows.push([kind === 'finance' ? 'Total del escenario modelado sin compra' : 'Total del escenario modelado', result.totalWithoutPurchase, true]);
			if (kind === 'finance') rows.push(['Total del escenario modelado con compra', result.totalWithPurchase, true]);
			const costs: BreakdownRow[] = [['Renta mensual sin IVA', result.baseRent], ['IVA mensual', result.monthlyVat], ['Apertura con IVA · inicial', result.openingFee]];
			if (advance > 0) costs.push(['Anticipo · inicial', advance]);
			if (result.administrationTotal > 0) costs.push(['Administración con IVA · todo el plazo', result.administrationTotal]);
			const anniversaries = result.schedule.filter(row => row.month > 0 && row.administration > 0);
			const administration = anniversaries.length ? ` Además de la renta, administración de ${money.format(anniversaries[0].administration)} en ${anniversaries.length === 1 ? 'el mes' : 'los meses'} ${list.format(anniversaries.map(row => String(row.month)))}.` : '';
			const residual = getLeaseDefaults(kind, asset).residualPercent;
			this.showResult('Renta mensual estimada con IVA', result.monthlyPayment, `${months} ${months === 1 ? 'renta mensual' : 'rentas mensuales'}${kind === 'finance' ? ` de ${asset === 'vehicle' ? 'vehículo' : 'maquinaria o equipo'}` : ''}.`, rows,
				kind === 'finance' ? `Residual de referencia: ${residual}%. La compra es opcional y se paga por separado.${administration}` : 'El resumen contempla las rentas y la apertura. No se incluye una compra al terminar.', costs);
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
				const result = estimateFactoringOperation({ amount, days, mode });
				reserve = result.reserve;
				payment.textContent = money.format(result.netLiquidity);
				currency.hidden = false;
				deduction.textContent = `${money.format(result.totalDeductions)} de deducciones con IVA.`;
				panel.removeAttribute('data-unavailable');
				const heading = document.createElement('h4'); heading.textContent = label;
				const breakdown = document.createElement('dl'); breakdown.className = 'financing-calculator__breakdown';
				renderBreakdown(breakdown, [
					['Descuento sin IVA', result.discount], ['Apertura sin IVA', result.openingFee], ['Operación sin IVA', result.operationFee],
					['Administración sin IVA', result.administrationFee], ['IVA de las deducciones', result.vat],
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
		const advancePercent = factoringDefaults.advancePercent;
		this.element('[data-result-label]').textContent = 'Liquidez inicial estimada';
		this.element('[data-context]').textContent = `Anticipo ilustrativo del ${advancePercent}%: ${money.format(amount * advancePercent / 100)}. Facturas a ${duration(days, 'days')}.`;
		renderBreakdown(this.element('[data-breakdown]'), reserve === undefined ? [] : [['Reserva al cobrar las facturas · sujeta a contrato', reserve]]);
		this.element('[data-result-note]').textContent = 'La apertura se estima sobre una nueva línea igual al valor de las facturas. La línea, el anticipo y la modalidad definitivos dependen de la evaluación y la propuesta.';
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
