// Pruebas de integracion Frontend (8080) -> Backend (8081) -> PostgreSQL usando el Chrome instalado.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
	testDir: './src/test/e2e',
	timeout: 30000,
	workers: 1,
	reporter: [['list'], ['html', { open: 'never', outputFolder: 'target/playwright-report' }]],
	outputDir: 'target/playwright-results',
	use: {
		baseURL: 'http://localhost:8080',
		channel: 'chrome',
		headless: true,
		viewport: { width: 1280, height: 800 },
		screenshot: 'only-on-failure'
	}
});
