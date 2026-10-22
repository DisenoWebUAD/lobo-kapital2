import {
	getProductGuideContext, getProductRecommendations, validateProductGuide,
	type ProductGuideFields, type ProductRecommendation,
} from './product-guide';
import { formatCurrencyEdit } from './currency-input';
import { GuideMotion } from './guide-motion';

type FieldKey = keyof ProductGuideFields;
type ContextKey = Exclude<FieldKey, 'need'>;
const fieldKeys: FieldKey[] = ['need', 'capitalUse', 'equipmentUse', 'amount'];
const contextKeys: ContextKey[] = ['capitalUse', 'equipmentUse', 'amount'];

interface ProductCard {
	item: HTMLLIElement;
	content: HTMLDivElement;
	reason: HTMLParagraphElement;
	notes: HTMLDivElement;
	match: HTMLParagraphElement;
	review: HTMLParagraphElement;
	warnings: HTMLUListElement;
	contact: HTMLAnchorElement;
	active: boolean;
	notesActive: boolean;
}

export function registerProductGuide() {
	if (customElements.get('lobo-product-guide')) return;

	class LoboProductGuide extends HTMLElement {
		private controller?: AbortController;
		private updateTimer?: number;
		private announcementTimer?: number;

		private cancelTimers() {
			window.clearTimeout(this.updateTimer);
			window.clearTimeout(this.announcementTimer);
			this.updateTimer = this.announcementTimer = undefined;
		}

		initialize() {
			this.controller?.abort();
			this.controller = new AbortController();
			const { signal } = this.controller;
			const form = this.querySelector<HTMLFormElement>('[data-guide-form]');
			const fieldset = this.querySelector<HTMLFieldSetElement>('[data-guide-fields]');
			const output = this.querySelector<HTMLElement>('[data-guide-output]');
			const outputInner = this.querySelector<HTMLElement>('[data-guide-output-inner]');
			const empty = this.querySelector<HTMLElement>('[data-guide-empty]');
			const emptyMessage = this.querySelector<HTMLElement>('[data-guide-empty-message]');
			const results = this.querySelector<HTMLElement>('[data-guide-results]');
			const heading = this.querySelector<HTMLElement>('#guide-results-title');
			const list = this.querySelector<HTMLElement>('[data-guide-recommendations]');
			const status = this.querySelector<HTMLElement>('[data-guide-status]');
			if (!form || !fieldset || !output || !outputInner || !empty || !emptyMessage || !results || !heading || !list || !status) return;
			const fields = Object.fromEntries(fieldKeys.map((key) => [key, [...form.querySelectorAll<HTMLInputElement>(`input[name="${key}"]`)]])) as Record<FieldKey, HTMLInputElement[]>;
			const wrappers = Object.fromEntries(fieldKeys.map((key) => [key, this.querySelector<HTMLElement>(`[data-guide-field="${key}"]`)]));
			const errors = Object.fromEntries(fieldKeys.map((key) => [key, this.querySelector<HTMLElement>(`[data-guide-error="${key}"]`)]));
			const slots = Object.fromEntries(contextKeys.map((key) => [key, this.querySelector<HTMLElement>(`[data-guide-slot="${key}"]`)]));
			if (fieldKeys.some((key) => !fields[key].length || !wrappers[key] || !errors[key]) || contextKeys.some((key) => !slots[key]?.querySelector('[data-guide-inner]'))) return;
			const amount = fields.amount[0]!;
			const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
			const motion = new GuideMotion(() => reducedMotion.matches);
			const positions = new Map<HTMLElement, Animation>();
			const cards = new Map<string, ProductCard>();
			const slotStates = new Map<ContextKey, boolean>();
			let showingResults = false;
			let lastAnnouncement = '';
			const value = (key: FieldKey) => key === 'amount' ? amount.value : fields[key].find((radio) => radio.checked)?.value ?? '';
			const read = () => Object.fromEntries(fieldKeys.map((key) => [key, value(key)])) as unknown as ProductGuideFields;
			const observed = new Map(fieldKeys.map((key) => [key, value(key)]));
			const stopPositions = () => {
				positions.forEach((animation) => animation.cancel());
				positions.clear();
			};
			signal.addEventListener('abort', () => { this.cancelTimers(); stopPositions(); motion.destroy(); }, { once: true });
			document.addEventListener('astro:before-swap', () => this.controller?.abort(), { signal, once: true });
			const clearError = (key: FieldKey) => {
				fields[key].forEach((field) => field.removeAttribute('aria-invalid'));
				wrappers[key]!.removeAttribute('aria-invalid');
				errors[key]!.textContent = '';
			};
			const announce = (message: string) => {
				window.clearTimeout(this.announcementTimer);
				this.announcementTimer = undefined;
				if (message === lastAnnouncement) return;
				this.announcementTimer = window.setTimeout(() => {
					status.textContent = lastAnnouncement = message;
					this.announcementTimer = undefined;
				}, 400);
			};
			const reset = (key: ContextKey) => {
				if (key === 'amount') amount.value = '';
				else fields[key].forEach((radio) => { radio.checked = false; });
				observed.set(key, '');
				clearError(key);
			};
			const syncFields = () => {
				const values = read();
				const context = getProductGuideContext(values);
				for (const key of contextKeys) {
					const active = (key === 'capitalUse' && values.need === 'capital') ||
						(key === 'equipmentUse' && values.need === 'equipment') || context.optionalFields.some((field) => field === key);
					fields[key].forEach((field) => { field.disabled = !active; });
					const slot = slots[key]!;
					const inner = slot.querySelector<HTMLElement>('[data-guide-inner]')!;
					if (slotStates.get(key) !== active) {
						// Geometry and paint use distinct nodes; a fade cannot end the spring early.
						if (active) motion.fade(inner, true);
						motion.height(slot, inner, active);
						if (!active && slotStates.get(key)) motion.fade(inner, false);
						slotStates.set(key, active);
					}
				}
			};
			const clearLayerPosition = (element: HTMLElement) => {
				element.style.position = element.style.top = element.style.left = element.style.width = '';
				element.removeAttribute('data-guide-layer-exit');
			};
			const leaveLayer = (element: HTMLElement, parent: HTMLElement) => {
				if (element.hidden || element.inert) return;
				const rect = element.getBoundingClientRect();
				// A cached card may be re-entering with its parent still hidden. Its old notes
				// have no painted exit; measuring them would create a zero-width ghost layer.
				if (rect.width < 1 || rect.height < 1) {
					motion.fade(element, false, () => clearLayerPosition(element));
					motion.finish(element);
					return;
				}
				const parentRect = parent.getBoundingClientRect();
				const transform = getComputedStyle(element).transform;
				const offset = transform === 'none' ? { m41: 0, m42: 0 } : new DOMMatrixReadOnly(transform);
				element.style.position = 'absolute';
				element.style.top = `${rect.top - parentRect.top - offset.m42}px`;
				element.style.left = `${rect.left - parentRect.left - offset.m41}px`;
				element.style.width = `${rect.width}px`;
				element.setAttribute('data-guide-layer-exit', '');
				motion.fade(element, false, () => clearLayerPosition(element));
			};
			const showContent = (show: boolean) => {
				if (showingResults !== show) {
					const entering = show ? results : empty;
					leaveLayer(show ? empty : results, outputInner);
					clearLayerPosition(entering);
					motion.fade(entering, true);
					showingResults = show;
				}
				output.removeAttribute('aria-busy');
				// One height owner covers the panel, its notes and all result rows (no nested springs).
				motion.measure(output);
			};
			const suspendResults = (message: string) => {
				emptyMessage.textContent = message;
				showContent(false);
			};
			const makeCard = (recommendation: ProductRecommendation): ProductCard => {
				const item = document.createElement('li');
				item.dataset.guideProduct = recommendation.id;
				const content = document.createElement('div');
				content.className = 'product-guide__card-content';
				content.hidden = true;
				const link = document.createElement('a');
				link.className = 'product-guide__product-link';
				link.href = recommendation.href;
				const titleRow = document.createElement('div');
				titleRow.className = 'product-guide__product-title';
				const title = document.createElement('h4');
				title.textContent = recommendation.title;
				const arrow = document.createElement('span');
				arrow.className = 'product-guide__arrow';
				arrow.textContent = '→';
				arrow.setAttribute('aria-hidden', 'true');
				titleRow.append(title, arrow);
				const reason = document.createElement('p');
				reason.dataset.guideReason = '';
				const action = document.createElement('span');
				action.className = 'product-guide__action';
				action.textContent = 'Conocer el producto';
				link.append(titleRow, reason, action);
				const notes = document.createElement('div');
				notes.className = 'product-guide__notes';
				notes.hidden = true;
				const notesInner = document.createElement('div');
				notesInner.dataset.guideNotesInner = '';
				const match = document.createElement('p');
				match.className = 'product-guide__amount-match';
				const review = document.createElement('p');
				review.className = 'product-guide__review';
				review.textContent = 'Requiere revisar tu caso';
				const warnings = document.createElement('ul');
				warnings.className = 'product-guide__warnings';
				const contact = document.createElement('a');
				contact.className = 'product-guide__contact';
				contact.href = '#contacto';
				contact.append(document.createTextNode('Habla con un asesor'), arrow.cloneNode(true));
				notesInner.append(match, review, warnings, contact);
				notes.append(notesInner);
				content.append(link, notes);
				item.append(content);
				return { item, content, reason, notes, match, review, warnings, contact, active: false, notesActive: false };
			};
			const updateCard = (card: ProductCard, recommendation: ProductRecommendation) => {
				card.item.dataset.guideState = recommendation.status;
				card.reason.textContent = recommendation.reasons[0] ?? recommendation.description;
				const hasNotes = !!recommendation.amountMatch || recommendation.status === 'review';
				if (hasNotes) {
					card.match.textContent = recommendation.amountMatch ?? '';
					card.match.hidden = !recommendation.amountMatch;
					card.review.hidden = recommendation.status !== 'review';
					card.contact.hidden = recommendation.status !== 'review';
					card.warnings.replaceChildren(...recommendation.warnings.map(({ code, text }) => {
						const row = document.createElement('li'); row.dataset.guideWarning = code; row.textContent = text; return row;
					}));
					card.warnings.hidden = recommendation.warnings.length === 0;
					clearLayerPosition(card.notes);
					if (!card.notesActive) motion.fade(card.notes, true);
				} else if (card.notesActive) leaveLayer(card.notes, card.content);
				card.notesActive = hasNotes;
			};
			const render = (recommendations: ProductRecommendation[]) => {
				// Read presented positions before changing layout; keys preserve controls and product nodes.
				const before = new Map([...cards.values()].filter(({ item }) => !item.hidden && !results.hidden).map(({ item }) => [item, item.getBoundingClientRect()]));
				stopPositions();
				const ids = new Set(recommendations.map(({ id }) => id));
				for (const [id, card] of cards) {
					if (!card.active || ids.has(id as ProductRecommendation['id'])) continue;
					card.active = false;
					card.item.inert = true;
					card.item.setAttribute('aria-hidden', 'true');
					const rect = before.get(card.item);
					if (!rect) { card.item.hidden = true; continue; }
					const listRect = list.getBoundingClientRect();
					Object.assign(card.item.style, { position: 'absolute', top: `${rect.top - listRect.top}px`, left: '0px', width: `${rect.width}px` });
					card.item.dataset.guideExiting = '';
					motion.fade(card.content, false, () => {
						if (!card.active) { card.item.hidden = true; clearLayerPosition(card.item); card.item.removeAttribute('data-guide-exiting'); }
					});
				}
				heading.textContent = recommendations.length === 1 ? 'Una opción para explorar' : 'Opciones para explorar';
				results.dataset.count = String(recommendations.length);
				recommendations.forEach((recommendation, index) => {
					let card = cards.get(recommendation.id);
					if (!card) { card = makeCard(recommendation); cards.set(recommendation.id, card); }
					const entering = !card.active;
					card.active = true;
					card.item.hidden = card.item.inert = false;
					card.item.removeAttribute('aria-hidden');
					card.item.removeAttribute('data-guide-exiting');
					clearLayerPosition(card.item);
					const atIndex = [...list.children].filter((child) => !(child as HTMLElement).hidden && !(child as HTMLElement).hasAttribute('data-guide-exiting'))[index];
					if (atIndex !== card.item) list.insertBefore(card.item, atIndex ?? null);
					updateCard(card, recommendation);
					if (entering) motion.fade(card.content, true);
				});
				showContent(true);
				if (!reducedMotion.matches) for (const { item, active } of cards.values()) {
					const previous = before.get(item);
					if (!active || !previous) continue;
					const delta = previous.top - item.getBoundingClientRect().top;
					if (Math.abs(delta) < 0.5) continue;
					const animation = item.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
					positions.set(item, animation);
					animation.finished.then(() => { if (positions.get(item) === animation) positions.delete(item); }, () => {});
				}
				const first = recommendations[0]!;
				const detail = first.status === 'review' ? 'Requiere revisar tu caso por el monto.' : first.amountMatch ? 'El monto está dentro del rango de referencia.' : 'Una opción por tu objetivo.';
				announce(recommendations.length > 1 ? `${recommendations.length} opciones para explorar.` : `${first.title}. ${detail}`);
			};
			const update = (submitted = false) => {
				window.clearTimeout(this.updateTimer);
				this.updateTimer = undefined;
				fieldKeys.forEach(clearError);
				const values = read();
				if (!values.need && !submitted) {
					suspendResults('Elige qué necesita tu negocio. Las opciones se actualizarán conforme respondas.');
					status.textContent = lastAnnouncement = '';
					return;
				}
				const validation = validateProductGuide(values);
				if (!validation.valid) {
					for (const key of fieldKeys) {
						if (!validation.errors[key]) continue;
						fields[key].forEach((field) => field.setAttribute('aria-invalid', 'true'));
						wrappers[key]!.setAttribute('aria-invalid', 'true');
						errors[key]!.textContent = validation.errors[key]!;
					}
					suspendResults('Revisa los campos señalados para volver a ver tus opciones.');
					announce('Revisa los campos señalados para ver tus opciones.');
					return;
				}
				render(getProductRecommendations(validation.value));
			};
			const formatAmount = () => {
				const edit = formatCurrencyEdit(amount.value, amount.selectionStart ?? amount.value.length, amount.selectionEnd ?? amount.value.length);
				if (!edit) return;
				const direction = amount.selectionDirection ?? 'none';
				amount.value = edit.text;
				amount.setSelectionRange(edit.selectionStart, edit.selectionEnd, direction);
			};
			const edited = (key: FieldKey) => {
				if (fields[key][0]!.disabled || observed.get(key) === value(key)) return;
				this.cancelTimers();
				clearError(key);
				observed.set(key, value(key));
				if (key === 'need') contextKeys.forEach(reset);
				else if (key !== 'amount') reset('amount');
				syncFields();
				if (key !== 'amount' || !validateProductGuide(read()).valid) { update(); return; }
				output.setAttribute('aria-busy', 'true');
				this.updateTimer = window.setTimeout(() => update(), 200);
			};
			const onEdit = (event: Event) => {
				const field = event.target;
				if (!(field instanceof HTMLInputElement) || !fieldKeys.includes(field.name as FieldKey)) return;
				if (field === amount) {
					if (event instanceof InputEvent && event.isComposing) {
						this.cancelTimers(); suspendResults('Termina de capturar el monto para ver tus opciones.'); return;
					}
					formatAmount();
				}
				edited(field.name as FieldKey);
			};
			form.addEventListener('input', onEdit, { signal });
			form.addEventListener('change', onEdit, { signal });
			this.addEventListener('focusin', (event) => {
				const slot = (event.target as HTMLElement).closest<HTMLElement>('[data-guide-slot]');
				if (slot && !slot.inert) motion.finish(slot);
				if (output.contains(event.target as Node)) motion.finish(output);
			}, { signal });
			amount.addEventListener('compositionend', () => { formatAmount(); edited('amount'); if (this.updateTimer === undefined) update(); }, { signal });
			amount.addEventListener('beforeinput', (event) => {
				if (event.isComposing) return;
				const start = amount.selectionStart ?? 0;
				const end = amount.selectionEnd ?? start;
				const commit = () => { formatAmount(); edited('amount'); };
				if (start === 0 && end === 0 && amount.value.startsWith('$') && event.inputType === 'insertText' && event.data !== null) {
					event.preventDefault();
					if (formatCurrencyEdit(`$${event.data}${amount.value.slice(1)}`)) { amount.setRangeText(event.data, 1, 1, 'end'); commit(); }
					return;
				}
				if (event.inputType === 'insertText' && event.data !== null && !formatCurrencyEdit(amount.value.slice(0, start) + event.data + amount.value.slice(end))) event.preventDefault();
				if (start === end && event.inputType === 'deleteContentBackward' && amount.value[start - 1] === ',') {
					event.preventDefault(); amount.setRangeText('', start - 2, start, 'end'); commit();
				} else if (start === end && event.inputType === 'deleteContentForward' && amount.value[start] === ',') {
					event.preventDefault(); amount.setRangeText('', start, start + 2, 'start'); commit();
				}
			}, { signal });
			amount.addEventListener('focus', () => { if (!amount.value) amount.value = '$'; }, { signal });
			amount.addEventListener('blur', () => { if (amount.value === '$') amount.value = ''; edited('amount'); if (this.updateTimer !== undefined) update(); }, { signal });
			form.addEventListener('submit', (event) => { event.preventDefault(); update(true); }, { signal });
			form.addEventListener('keydown', (event) => {
				if (event.key === 'Enter' && event.target === amount && !event.isComposing) { event.preventDefault(); update(true); }
			}, { signal });
			reducedMotion.addEventListener('change', () => { stopPositions(); motion.settle(); }, { signal });
			// A repeated Astro page-load initializes cleanly without duplicate nodes or event handlers.
			list.replaceChildren();
			results.hidden = true;
			empty.hidden = false;
			clearLayerPosition(results);
			clearLayerPosition(empty);
			form.hidden = fieldset.disabled = output.hidden = false;
			motion.height(output, outputInner, true);
			syncFields();
			update();
			motion.settle();
		}

		disconnectedCallback() { this.controller?.abort(); }
	}

	customElements.define('lobo-product-guide', LoboProductGuide);
	document.addEventListener('astro:page-load', () => {
		document.querySelectorAll<LoboProductGuide>('lobo-product-guide').forEach((guide) => guide.initialize());
	});
}
