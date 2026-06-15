/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				brand: {
					50: '#f5f7ff',
					100: '#ebf0ff',
					200: '#d6e0ff',
					300: '#b3c7ff',
					400: '#85a3ff',
					500: '#5275ff',
					600: '#2b47fc',
					700: '#1d2ee4',
					800: '#1825b9',
					900: '#1a2793',
				}
			}
		},
	},
	plugins: [],
}
