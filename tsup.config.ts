import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/cli.ts', 'src/client.ts', 'src/test.ts'],
	format: 'esm',
	splitting: true,
	minify: false,
	sourcemap: true,
	clean: true,
	dts: { entry: ['src/index.ts', 'src/cli.ts', 'src/client.ts'] },
});
