import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		watch: {
			ignored: ['**/.thumbnails/**']
		}
	},
	optimizeDeps: {
		entries: ['./src/routes/+layout.svelte', './src/routes/**/+page.svelte'],
		exclude: ['pdfjs-dist'],
	},
});
