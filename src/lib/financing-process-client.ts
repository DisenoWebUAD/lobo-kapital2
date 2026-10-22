const clampProgress = (value: number) => Math.max(0, Math.min(1, value));
const desktopSequenceDuration = 4050;

class FinancingProcess extends HTMLElement {
	private controller?: AbortController;
	private resizeObserver?: ResizeObserver;
	private frame?: number;
	private measurePending = false;
	private positions: number[] = [];
	private markers: HTMLElement[] = [];
	private fills: HTMLElement[] = [];
	private lastProgress = Number.NaN;
	private reducedMotion?: MediaQueryList;
	private desktopMode = false;
	private desktopObserver?: IntersectionObserver;
	private observedViewportHeight = 0;
	private desktopTimer?: number;
	private desktopState: 'idle' | 'playing' | 'complete' = 'idle';

	connectedCallback() { this.initialize(); }
	disconnectedCallback() { this.dispose(); }

	initialize() {
		if (this.controller || !this.isConnected) return;
		this.markers = [...this.querySelectorAll<HTMLElement>('[data-process-marker]')];
		this.fills = [...this.querySelectorAll<HTMLElement>('[data-process-fill]')];
		if (this.markers.length < 2 || this.fills.length !== this.markers.length - 1) return;

		this.controller = new AbortController();
		const { signal } = this.controller;
		this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const desktopViewport = window.matchMedia('(min-width: 64em)');
		this.desktopMode = desktopViewport.matches;
		const refresh = () => {
			if (signal.aborted) return;
			if (this.desktopMode !== desktopViewport.matches) {
				if (this.desktopState === 'playing') this.completeDesktopSequence();
				this.resetProgress();
				this.desktopMode = desktopViewport.matches;
			}
			this.observeDesktopEntry();
			this.scheduleUpdate(true);
		};
		window.addEventListener('scroll', () => this.scheduleUpdate(), { passive: true, signal });
		window.addEventListener('resize', refresh, { passive: true, signal });
		desktopViewport.addEventListener('change', refresh, { signal });
		this.reducedMotion.addEventListener('change', () => {
			if (this.desktopState === 'playing') this.completeDesktopSequence();
			this.resetProgress();
			refresh();
		}, { signal });
		const lastMarker = this.markers[this.markers.length - 1];
		lastMarker.addEventListener('transitionend', event => {
			if (event.target === lastMarker && event.propertyName === 'background-color'
				&& this.desktopMode && this.desktopState === 'playing') this.completeDesktopSequence();
		}, { signal });

		if (typeof ResizeObserver !== 'undefined') {
			this.resizeObserver = new ResizeObserver(refresh);
			this.resizeObserver.observe(this);
			this.markers.forEach(marker => {
				if (marker.parentElement) this.resizeObserver?.observe(marker.parentElement);
			});
		}
		document.fonts.ready.then(() => refresh());
		document.fonts.addEventListener('loadingdone', refresh, { signal });
		refresh();
	}

	private observeDesktopEntry() {
		if (!this.desktopMode || this.reducedMotion?.matches || this.desktopState !== 'idle') {
			this.disconnectDesktopObserver();
			return;
		}
		if (typeof IntersectionObserver === 'undefined') return;
		const height = window.innerHeight;
		if (this.desktopObserver && this.observedViewportHeight === height) return;
		this.disconnectDesktopObserver();
		this.observedViewportHeight = height;
		const observer = new IntersectionObserver(entries => {
			if (this.desktopObserver === observer && entries.some(entry => entry.isIntersecting)) {
				this.startDesktopSequence();
			}
		}, {
			threshold: 0,
			rootMargin: `0px 0px -${Math.round(height * .25)}px 0px`,
		});
		this.desktopObserver = observer;
		observer.observe(this);
	}

	private startDesktopSequence() {
		if (!this.controller || !this.isConnected || !this.desktopMode
			|| this.reducedMotion?.matches || this.desktopState !== 'idle') return;
		this.disconnectDesktopObserver();
		this.desktopState = 'playing';
		this.setAttribute('data-desktop-sequence', 'playing');
		// Let the last transition finish on its own frame; the timer is a cleanup fallback.
		this.desktopTimer = window.setTimeout(() => this.completeDesktopSequence(), desktopSequenceDuration + 100);
	}

	private completeDesktopSequence() {
		if (this.desktopTimer !== undefined) window.clearTimeout(this.desktopTimer);
		this.desktopTimer = undefined;
		this.desktopState = 'complete';
		this.setAttribute('data-desktop-sequence', 'complete');
		this.disconnectDesktopObserver();
	}

	private disconnectDesktopObserver() {
		this.desktopObserver?.disconnect();
		this.desktopObserver = undefined;
		this.observedViewportHeight = 0;
	}

	private scheduleUpdate(measure = false) {
		if (!this.controller || this.desktopMode || this.reducedMotion?.matches) return;
		this.measurePending ||= measure;
		if (this.frame !== undefined) return;
		this.frame = requestAnimationFrame(() => {
			this.frame = undefined;
			this.update();
		});
	}

	private update() {
		if (!this.isConnected || !this.controller || this.desktopMode || this.reducedMotion?.matches) return;
		const bounds = this.getBoundingClientRect();
		if (this.measurePending || this.positions.length !== this.markers.length) {
			// Markers stay outside reveal transforms, so only layout changes affect their spacing.
			this.positions = this.markers.map(marker => {
				const rect = marker.getBoundingClientRect();
				return rect.top + rect.height / 2 - bounds.top;
			});
			this.measurePending = false;
			this.lastProgress = Number.NaN;
		}

		const first = this.positions[0];
		const distance = this.positions[this.positions.length - 1] - first;
		if (distance <= 0) return;
		const viewportHeight = window.innerHeight;
		// Match the reference's offsets: first marker at 80%, last marker at 50%.
		const progress = clampProgress((viewportHeight * .8 - bounds.top - first) / (distance + viewportHeight * .3));
		this.renderProgress(progress);
	}

	private renderProgress(progress: number) {
		if (progress === this.lastProgress) return;
		this.lastProgress = progress;
		const first = this.positions[0];
		const distance = this.positions[this.positions.length - 1] - first;
		if (distance <= 0) return;
		const traveled = progress * distance;

		this.fills.forEach((fill, index) => {
			const start = this.positions[index] - first;
			const length = this.positions[index + 1] - this.positions[index];
			const segment = length > 0 ? clampProgress((traveled - start) / length) : 0;
			fill.style.setProperty('--segment-progress', String(segment));
		});
		this.markers.forEach((marker, index) => {
			marker.toggleAttribute('data-reached', progress > 0 && traveled >= this.positions[index] - first);
		});
	}

	private resetProgress() {
		if (this.frame !== undefined) cancelAnimationFrame(this.frame);
		this.frame = undefined;
		this.lastProgress = Number.NaN;
		this.fills.forEach(fill => fill.style.removeProperty('--segment-progress'));
		this.markers.forEach(marker => marker.removeAttribute('data-reached'));
	}

	dispose() {
		// Keep a started sequence complete if this instance returns from navigation or BFCache.
		if (this.desktopState === 'playing') this.completeDesktopSequence();
		this.disconnectDesktopObserver();
		this.controller?.abort();
		this.controller = undefined;
		this.resizeObserver?.disconnect();
		this.resizeObserver = undefined;
		this.reducedMotion = undefined;
		this.resetProgress();
		this.positions = [];
		this.markers = [];
		this.fills = [];
		this.measurePending = false;
	}
}

let registered = false;

export function registerFinancingProcess() {
	if (registered) return;
	registered = true;
	if (!customElements.get('lobo-financing-process')) customElements.define('lobo-financing-process', FinancingProcess);
	const instances = () => document.querySelectorAll<FinancingProcess>('lobo-financing-process');
	const initialize = () => instances().forEach(process => process.initialize());
	const dispose = () => instances().forEach(process => process.dispose());
	document.addEventListener('astro:page-load', initialize);
	document.addEventListener('astro:before-swap', dispose);
	window.addEventListener('pagehide', dispose);
	window.addEventListener('pageshow', event => {
		if (event.persisted) initialize();
	});
	initialize();
}
