export interface CriticalSpringState {
	position: number;
	velocity: number;
}

/** Exact critically damped integration: retargeting keeps the presented position and velocity. */
export function advanceCriticalSpring(
	state: CriticalSpringState,
	target: number,
	elapsedSeconds: number,
	response = 0.35,
): CriticalSpringState {
	if (!(response > 0) || !Number.isFinite(response)) throw new RangeError('Spring response must be positive and finite.');
	if (!(elapsedSeconds >= 0) || !Number.isFinite(elapsedSeconds)) throw new RangeError('Elapsed time must be finite and non-negative.');
	if (![state.position, state.velocity, target].every(Number.isFinite)) throw new RangeError('Spring coordinates must be finite.');
	if (elapsedSeconds === 0) return { ...state };
	const frequency = (2 * Math.PI) / response;
	const displacement = state.position - target;
	const coefficient = state.velocity + frequency * displacement;
	const decay = Math.exp(-frequency * elapsedSeconds);
	if (decay === 0) return { position: target, velocity: 0 };
	return {
		position: target + (displacement + coefficient * elapsedSeconds) * decay,
		velocity: (state.velocity - frequency * coefficient * elapsedSeconds) * decay,
	};
}

interface HeightMotion {
	wrapper: HTMLElement;
	inner: HTMLElement;
	expanded: boolean;
	position: number;
	velocity: number;
	target: number;
	moving: boolean;
	originalOverflow: string;
}

interface FadeMotion {
	element: HTMLElement;
	visible: boolean;
	animation?: Animation;
	onHidden?: () => void;
	originalOpacity: string;
	originalTransform: string;
}

/** Local, interruptible geometry coordinator. Observe content, never the animated wrapper. */
export class GuideMotion {
	private heights = new Map<HTMLElement, HeightMotion>();
	private fades = new Map<HTMLElement, FadeMotion>();
	private observer: ResizeObserver;
	private frame = 0;
	private lastTime = 0;
	private destroyed = false;

	constructor() {
		this.observer = new ResizeObserver((entries) => {
			for (const observed of entries) {
				for (const motion of this.heights.values()) {
					if (motion.inner === observed.target && motion.expanded) this.measure(motion.wrapper);
				}
			}
		});
	}

	height(wrapper: HTMLElement, inner: HTMLElement, expanded: boolean): void {
		if (this.destroyed) return;
		let motion = this.heights.get(wrapper);
		if (!motion) {
			const position = wrapper.hidden ? 0 : wrapper.getBoundingClientRect().height;
			motion = {
				wrapper, inner, expanded, position, velocity: 0, target: position, moving: false,
				originalOverflow: wrapper.style.overflow,
			};
			this.heights.set(wrapper, motion);
			this.observer.observe(inner);
		} else if (motion.inner !== inner) {
			this.observer.unobserve(motion.inner);
			motion.inner = inner;
			this.observer.observe(inner);
		}
		motion.expanded = expanded;
		wrapper.inert = !expanded;
		if (expanded) wrapper.removeAttribute('aria-hidden');
		else wrapper.setAttribute('aria-hidden', 'true');
		// Unhide before measurement, but retain the last presented height through a reversal.
		wrapper.hidden = false;
		motion.target = expanded ? this.contentHeight(motion) : 0;
		this.redirect(motion);
	}

	measure(wrapper: HTMLElement): void {
		const motion = this.heights.get(wrapper);
		if (!motion || !motion.expanded || this.destroyed) return;
		const target = this.contentHeight(motion);
		if (Math.abs(target - motion.target) < 0.1) return;
		motion.target = target;
		this.redirect(motion);
	}

	/** A focused control must never remain behind an expanding clipping edge. */
	finish(wrapper: HTMLElement): void {
		const motion = this.heights.get(wrapper);
		if (motion) this.finishHeight(motion);
		const fade = this.fades.get(wrapper);
		if (fade) this.finishFade(fade);
	}

	fade(element: HTMLElement, visible: boolean, onHidden?: () => void): void {
		if (this.destroyed) return;
		let motion = this.fades.get(element);
		if (motion?.visible === visible) {
			if (onHidden) motion.onHidden = onHidden;
			return;
		}
		const firstEntrance = !motion && visible;
		const wasHidden = element.hidden;
		const presented = getComputedStyle(element);
		const opacity = firstEntrance || wasHidden ? 0 : Number.parseFloat(presented.opacity);
		const transform = firstEntrance || wasHidden ? 'translateY(6px)' : presented.transform;
		if (!motion) {
			motion = {
				element, visible, originalOpacity: element.style.opacity,
				originalTransform: element.style.transform,
			};
			this.fades.set(element, motion);
		}
		motion.animation?.cancel();
		motion.visible = visible;
		motion.onHidden = onHidden;
		element.hidden = false;
		element.inert = !visible;
		if (visible) element.removeAttribute('aria-hidden');
		else element.setAttribute('aria-hidden', 'true');
		const animation = element.animate([
			{ opacity: Number.isFinite(opacity) ? opacity : 1, transform },
			{ opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 6}px)` },
		], {
			duration: visible ? 220 : 140,
			easing: visible ? 'cubic-bezier(.2,.7,.2,1)' : 'ease-out',
			fill: 'both',
		});
		motion.animation = animation;
		animation.onfinish = () => {
			if (motion?.animation === animation) this.finishFade(motion);
		};
	}

	/** Snap geometry and remove transient animation resources during cleanup. */
	settle(): void {
		// Discard queued measurements before observing afresh.
		this.observer.disconnect();
		if (this.frame) cancelAnimationFrame(this.frame);
		this.frame = 0;
		this.lastTime = 0;
		for (const motion of this.heights.values()) this.finishHeight(motion);
		for (const motion of this.fades.values()) this.finishFade(motion);
		if (!this.destroyed) for (const motion of this.heights.values()) this.observer.observe(motion.inner);
	}

	destroy(): void {
		this.destroyed = true;
		this.settle();
		this.observer.disconnect();
		this.heights.clear();
		this.fades.clear();
	}

	private contentHeight(motion: HeightMotion): number {
		return motion.inner.getBoundingClientRect().height;
	}

	private redirect(motion: HeightMotion): void {
		if (Math.abs(motion.position - motion.target) < 0.1 && Math.abs(motion.velocity) < 0.5) {
			this.finishHeight(motion);
			return;
		}
		motion.moving = true;
		motion.wrapper.style.height = `${Math.max(0, motion.position)}px`;
		motion.wrapper.style.overflow = 'clip';
		if (!this.frame) {
			this.lastTime = performance.now();
			this.frame = requestAnimationFrame(this.tick);
		}
	}

	private tick = (time: number): void => {
		this.frame = 0;
		const elapsed = Math.max(0, (time - this.lastTime) / 1000);
		this.lastTime = time;
		let pending = false;
		for (const motion of this.heights.values()) {
			if (!motion.moving) continue;
			const next = advanceCriticalSpring(motion, motion.target, elapsed);
			motion.position = Math.max(0, next.position);
			motion.velocity = next.position < 0 ? 0 : next.velocity;
			if (Math.abs(motion.position - motion.target) < 0.1 && Math.abs(motion.velocity) < 0.5) {
				this.finishHeight(motion);
			} else {
				motion.wrapper.style.height = `${motion.position}px`;
				pending = true;
			}
		}
		if (pending && !this.destroyed) this.frame = requestAnimationFrame(this.tick);
	};

	private finishHeight(motion: HeightMotion): void {
		motion.position = motion.target;
		motion.velocity = 0;
		motion.moving = false;
		motion.wrapper.style.height = motion.expanded ? 'auto' : '0px';
		motion.wrapper.style.overflow = motion.originalOverflow;
		motion.wrapper.hidden = !motion.expanded;
	}

	private finishFade(motion: FadeMotion): void {
		motion.animation?.cancel();
		motion.animation = undefined;
		motion.element.style.opacity = motion.originalOpacity;
		motion.element.style.transform = motion.originalTransform;
		motion.element.hidden = !motion.visible;
		const callback = motion.onHidden;
		motion.onHidden = undefined;
		if (!motion.visible) callback?.();
	}
}
