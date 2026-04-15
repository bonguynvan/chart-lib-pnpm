import sdk from '@stackblitz/sdk';

const CHART_VERSION = '^0.1.2';

const BODY_CSS = 'body { margin: 0; background: #131722; }';

const BASIC_TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src'],
  },
  null,
  2,
);

// ---------------------------------------------------------------------------
// Vanilla JS
// ---------------------------------------------------------------------------

export function openVanillaSandbox(): void {
  sdk.openProject(
    {
      title: 'TradeCanvas — Vanilla JS',
      template: 'node',
      files: {
        'package.json': JSON.stringify(
          {
            name: 'tc-sandbox-vanilla',
            private: true,
            type: 'module',
            scripts: { dev: 'vite' },
            dependencies: { '@tradecanvas/chart': CHART_VERSION },
            devDependencies: { vite: '^6.0.0', typescript: '~5.7.0' },
          },
          null,
          2,
        ),
        'tsconfig.json': BASIC_TSCONFIG,
        'index.html': [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '  <meta charset="UTF-8" />',
          '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
          '  <title>TradeCanvas — Vanilla JS</title>',
          `  <style>${BODY_CSS}</style>`,
          '</head>',
          '<body>',
          '  <div id="chart" style="width:100%;height:100vh"></div>',
          '  <script type="module" src="/src/main.ts"></script>',
          '</body>',
          '</html>',
        ].join('\n'),
        'src/main.ts': [
          "import { Chart, BinanceAdapter, DARK_THEME } from '@tradecanvas/chart';",
          '',
          "const container = document.getElementById('chart')!;",
          '',
          'const chart = new Chart(container, {',
          "  chartType: 'candlestick',",
          '  theme: DARK_THEME,',
          '  autoScale: true,',
          '  features: { drawings: true, indicators: true, volume: true },',
          '});',
          '',
          'const adapter = new BinanceAdapter();',
          "chart.connect({ adapter, symbol: 'BTCUSDT', timeframe: '5m' });",
          '',
          '// Add an SMA indicator',
          "chart.addIndicator({ type: 'sma', period: 20 });",
        ].join('\n'),
      },
    },
    { openFile: 'src/main.ts', newWindow: true },
  );
}

// ---------------------------------------------------------------------------
// React
// ---------------------------------------------------------------------------

export function openReactSandbox(): void {
  sdk.openProject(
    {
      title: 'TradeCanvas — React',
      template: 'node',
      files: {
        'package.json': JSON.stringify(
          {
            name: 'tc-sandbox-react',
            private: true,
            type: 'module',
            scripts: { dev: 'vite' },
            dependencies: {
              react: '^19.0.0',
              'react-dom': '^19.0.0',
              '@tradecanvas/chart': CHART_VERSION,
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.0.0',
              '@types/react': '^19.0.0',
              '@types/react-dom': '^19.0.0',
              vite: '^6.0.0',
              typescript: '~5.7.0',
            },
          },
          null,
          2,
        ),
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              moduleResolution: 'bundler',
              jsx: 'react-jsx',
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
            },
            include: ['src'],
          },
          null,
          2,
        ),
        'vite.config.ts': [
          "import { defineConfig } from 'vite';",
          "import react from '@vitejs/plugin-react';",
          '',
          'export default defineConfig({',
          '  plugins: [react()],',
          '});',
        ].join('\n'),
        'index.html': [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '  <meta charset="UTF-8" />',
          '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
          '  <title>TradeCanvas — React</title>',
          `  <style>${BODY_CSS}</style>`,
          '</head>',
          '<body>',
          '  <div id="root"></div>',
          '  <script type="module" src="/src/main.tsx"></script>',
          '</body>',
          '</html>',
        ].join('\n'),
        'src/main.tsx': [
          "import { createRoot } from 'react-dom/client';",
          "import { App } from './App';",
          '',
          "createRoot(document.getElementById('root')!).render(<App />);",
        ].join('\n'),
        'src/App.tsx': [
          "import { TradingChart } from './TradingChart';",
          '',
          'export function App() {',
          '  return <TradingChart />;',
          '}',
        ].join('\n'),
        'src/TradingChart.tsx': [
          "import { useRef, useEffect } from 'react';",
          "import { Chart, BinanceAdapter, DARK_THEME } from '@tradecanvas/chart';",
          '',
          'export function TradingChart() {',
          '  const containerRef = useRef<HTMLDivElement>(null);',
          '',
          '  useEffect(() => {',
          '    if (!containerRef.current) return;',
          '',
          '    const chart = new Chart(containerRef.current, {',
          "      chartType: 'candlestick',",
          '      theme: DARK_THEME,',
          '      autoScale: true,',
          '      features: { drawings: true, indicators: true, volume: true },',
          '    });',
          '',
          '    const adapter = new BinanceAdapter();',
          "    chart.connect({ adapter, symbol: 'BTCUSDT', timeframe: '5m' });",
          "    chart.addIndicator({ type: 'sma', period: 20 });",
          '',
          '    return () => chart.destroy();',
          '  }, []);',
          '',
          '  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;',
          '}',
        ].join('\n'),
      },
    },
    { openFile: 'src/TradingChart.tsx', newWindow: true },
  );
}

// ---------------------------------------------------------------------------
// Svelte
// ---------------------------------------------------------------------------

export function openSvelteSandbox(): void {
  sdk.openProject(
    {
      title: 'TradeCanvas — Svelte',
      template: 'node',
      files: {
        'package.json': JSON.stringify(
          {
            name: 'tc-sandbox-svelte',
            private: true,
            type: 'module',
            scripts: { dev: 'vite' },
            dependencies: { '@tradecanvas/chart': CHART_VERSION },
            devDependencies: {
              svelte: '^5.0.0',
              '@sveltejs/vite-plugin-svelte': '^5.0.0',
              vite: '^6.0.0',
              typescript: '~5.7.0',
            },
          },
          null,
          2,
        ),
        'svelte.config.js': [
          "import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';",
          '',
          'export default {',
          '  preprocess: vitePreprocess(),',
          '};',
        ].join('\n'),
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              moduleResolution: 'bundler',
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
            },
            include: ['src'],
          },
          null,
          2,
        ),
        'vite.config.ts': [
          "import { defineConfig } from 'vite';",
          "import { svelte } from '@sveltejs/vite-plugin-svelte';",
          '',
          'export default defineConfig({',
          '  plugins: [svelte()],',
          '});',
        ].join('\n'),
        'index.html': [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '  <meta charset="UTF-8" />',
          '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
          '  <title>TradeCanvas — Svelte</title>',
          `  <style>${BODY_CSS}</style>`,
          '</head>',
          '<body>',
          '  <div id="app"></div>',
          '  <script type="module" src="/src/main.ts"></script>',
          '</body>',
          '</html>',
        ].join('\n'),
        'src/main.ts': [
          "import App from './App.svelte';",
          '',
          "const app = new App({ target: document.getElementById('app')! });",
          '',
          'export default app;',
        ].join('\n'),
        'src/App.svelte': [
          '<script lang="ts">',
          "  import TradingChart from './TradingChart.svelte';",
          '</script>',
          '',
          '<TradingChart />',
        ].join('\n'),
        'src/TradingChart.svelte': [
          '<script lang="ts">',
          "  import { onMount, onDestroy } from 'svelte';",
          "  import { Chart, BinanceAdapter, DARK_THEME } from '@tradecanvas/chart';",
          '',
          '  let container: HTMLDivElement;',
          '  let chart: Chart | null = null;',
          '',
          '  onMount(() => {',
          '    chart = new Chart(container, {',
          "      chartType: 'candlestick',",
          '      theme: DARK_THEME,',
          '      autoScale: true,',
          '      features: { drawings: true, indicators: true, volume: true },',
          '    });',
          '',
          '    const adapter = new BinanceAdapter();',
          "    chart.connect({ adapter, symbol: 'BTCUSDT', timeframe: '5m' });",
          "    chart.addIndicator({ type: 'sma', period: 20 });",
          '  });',
          '',
          '  onDestroy(() => chart?.destroy());',
          '</script>',
          '',
          '<div bind:this={container} style="width: 100%; height: 100vh" />',
        ].join('\n'),
      },
    },
    { openFile: 'src/TradingChart.svelte', newWindow: true },
  );
}

// ---------------------------------------------------------------------------
// Vue
// ---------------------------------------------------------------------------

export function openVueSandbox(): void {
  sdk.openProject(
    {
      title: 'TradeCanvas — Vue',
      template: 'node',
      files: {
        'package.json': JSON.stringify(
          {
            name: 'tc-sandbox-vue',
            private: true,
            type: 'module',
            scripts: { dev: 'vite' },
            dependencies: {
              vue: '^3.5.0',
              '@tradecanvas/chart': CHART_VERSION,
            },
            devDependencies: {
              '@vitejs/plugin-vue': '^5.0.0',
              vite: '^6.0.0',
              typescript: '~5.7.0',
            },
          },
          null,
          2,
        ),
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              moduleResolution: 'bundler',
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
            },
            include: ['src'],
          },
          null,
          2,
        ),
        'vite.config.ts': [
          "import { defineConfig } from 'vite';",
          "import vue from '@vitejs/plugin-vue';",
          '',
          'export default defineConfig({',
          '  plugins: [vue()],',
          '});',
        ].join('\n'),
        'index.html': [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '  <meta charset="UTF-8" />',
          '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
          '  <title>TradeCanvas — Vue</title>',
          `  <style>${BODY_CSS}</style>`,
          '</head>',
          '<body>',
          '  <div id="app"></div>',
          '  <script type="module" src="/src/main.ts"></script>',
          '</body>',
          '</html>',
        ].join('\n'),
        'src/main.ts': [
          "import { createApp } from 'vue';",
          "import App from './App.vue';",
          '',
          "createApp(App).mount('#app');",
        ].join('\n'),
        'src/App.vue': [
          '<template>',
          '  <TradingChart />',
          '</template>',
          '',
          '<script setup lang="ts">',
          "import TradingChart from './TradingChart.vue';",
          '</script>',
        ].join('\n'),
        'src/TradingChart.vue': [
          '<template>',
          '  <div ref="chartContainer" style="width: 100%; height: 100vh" />',
          '</template>',
          '',
          '<script setup lang="ts">',
          "import { ref, onMounted, onUnmounted } from 'vue';",
          "import { Chart, BinanceAdapter, DARK_THEME } from '@tradecanvas/chart';",
          '',
          'const chartContainer = ref<HTMLDivElement>();',
          'let chart: Chart | null = null;',
          '',
          'onMounted(() => {',
          '  if (!chartContainer.value) return;',
          '',
          '  chart = new Chart(chartContainer.value, {',
          "    chartType: 'candlestick',",
          '    theme: DARK_THEME,',
          '    autoScale: true,',
          '    features: { drawings: true, indicators: true, volume: true },',
          '  });',
          '',
          '  const adapter = new BinanceAdapter();',
          "  chart.connect({ adapter, symbol: 'BTCUSDT', timeframe: '5m' });",
          "  chart.addIndicator({ type: 'sma', period: 20 });",
          '});',
          '',
          'onUnmounted(() => chart?.destroy());',
          '</script>',
        ].join('\n'),
      },
    },
    { openFile: 'src/TradingChart.vue', newWindow: true },
  );
}
