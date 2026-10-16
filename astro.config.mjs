// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	redirects: {
		'/privacidad': '/legal/',
	},
	devToolbar: {
		enabled: false,
	},
});
