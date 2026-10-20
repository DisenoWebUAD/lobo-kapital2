// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	fonts: [{
		provider: fontProviders.local(),
		name: 'Figtree Variable',
		cssVariable: '--font-figtree',
		fallbacks: ['sans-serif'],
		optimizedFallbacks: true,
		display: 'swap',
		options: {
			variants: [{
				src: ['@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2'],
				weight: '300 900',
				style: 'normal',
			}],
		},
	}],
	redirects: {
		'/privacidad': '/legal/',
	},
	devToolbar: {
		enabled: false,
	},
});
