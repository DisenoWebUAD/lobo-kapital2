const revealProgress = .3;
const concealProgress = .27;

class BackToTop extends HTMLElement {
	private controller?: AbortController;
	private observer?: ResizeObserver;
	private frame?: number;
	private visible = false;
	private button?: HTMLButtonElement;

	connectedCallback() { this.initialize(); }
	disconnectedCallback() { this.dispose(); }

	initialize() {
		if (this.controller || !this.isConnected) return;
		this.button = this.querySelector<HTMLButtonElement>('button') ?? undefined;
		if (!this.button) return;
		this.controller = new AbortController();
		const { signal } = this.controller;
		window.addEventListener('scroll', this.scheduleUpdate, { passive: true, signal });
		window.addEventListener('resize', this.scheduleUpdate, { passive: true, signal });
		const resetLabel = () => this.removeAttribute('data-label-dismissed');
		this.addEventListener('pointerenter', resetLabel, { signal });
		this.addEventListener('focusin', resetLabel, { signal });
		this.addEventListener('focusout', this.scheduleUpdate, { signal });
		this.button.addEventListener('keydown', event => {
			if (event.key === 'Escape') this.setAttribute('data-label-dismissed', '');
		}, { signal });
		this.button.addEventListener('click', () => {
			const destination = document.querySelector<HTMLElement>('.site-header__brand, #main-content');
			destination?.focus({ preventScroll: true });
			window.scrollTo({
				top: 0,
				behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
			});
		}, { signal });
		this.observer = new ResizeObserver(this.scheduleUpdate);
		this.observer.observe(document.body);
		this.observer.observe(document.documentElement);
		this.scheduleUpdate();
	}

	private scheduleUpdate = () => {
		if (!this.controller || this.frame !== undefined) return;
		this.frame = requestAnimationFrame(() => {
			this.frame = undefined;
			const distance = document.documentElement.scrollHeight - window.innerHeight;
			const progress = distance > 0 ? Math.max(0, window.scrollY) / distance : 0;
			// Hysteresis prevents flicker at the threshold; never hide a focused control.
			this.setVisible(distance > 0 && (progress >= (this.visible ? concealProgress : revealProgress)
				|| this.contains(document.activeElement)));
		});
	};

	private setVisible(visible: boolean) {
		if (visible === this.visible) return;
		this.visible = visible;
		this.toggleAttribute('data-visible', visible);
		this.inert = !visible;
		this.setAttribute('aria-hidden', String(!visible));
		if (this.button) this.button.disabled = !visible;
	}

	dispose() {
		this.controller?.abort();
		this.controller = undefined;
		this.observer?.disconnect();
		this.observer = undefined;
		if (this.frame !== undefined) cancelAnimationFrame(this.frame);
		this.frame = undefined;
		this.setVisible(false);
		this.removeAttribute('data-label-dismissed');
		this.button = undefined;
	}
}

let registered = false;

export function registerBackToTop() {
	if (registered) return;
	registered = true;
	if (!customElements.get('lobo-back-to-top')) customElements.define('lobo-back-to-top', BackToTop);
	const instances = () => document.querySelectorAll<BackToTop>('lobo-back-to-top');
	const initialize = () => instances().forEach(button => button.initialize());
	const dispose = () => instances().forEach(button => button.dispose());
	document.addEventListener('astro:page-load', initialize);
	document.addEventListener('astro:before-swap', dispose);
	window.addEventListener('pagehide', dispose);
	window.addEventListener('pageshow', initialize);
}
