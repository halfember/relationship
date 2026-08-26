import { defineConfig, loadEnv } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

const dcloudShadowPreloadPattern =
  /!function\(\)\{if\([^{}]*wx\.preloadAssets\)[\s\S]*?shadow-grey\.png[\s\S]*?\}\}\(\),/;

function removeDcloudShadowPreload() {
  return {
    name: 'remove-dcloud-shadow-preload',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk' || !output.code.includes('shadow-grey.png')) {
          continue;
        }

        const code = output.code.replace(dcloudShadowPreloadPattern, '');
        if (code === output.code || code.includes('shadow-grey.png')) {
          this.error(`Unable to remove DCloud shadow preload from ${output.fileName}`);
        }
        output.code = code;
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  // The uni-console runtime opens a separate WebSocket for HBuilderX log echo
  // during mp-weixin development. It is not used by the app and can fail on
  // real-device debugging when a proxy negotiates per-message compression.
  if (process.env.UNI_PLATFORM === 'mp-weixin') {
    process.env.UNI_SOCKET_HOSTS = '';
    process.env.UNI_SOCKET_PORT = '';
    process.env.UNI_SOCKET_ID = '';
  }
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiBaseUrl = env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || '';
  if (mode === 'production' && !/^https:\/\/[^/]+(?:\/.*)?$/.test(apiBaseUrl)) {
    throw new Error('Production build requires an HTTPS VITE_API_BASE_URL');
  }
  return {
    plugins: [uni(), removeDcloudShadowPreload()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    define: {
      __USE_MOCK_LOGIN__: JSON.stringify(
        mode !== 'production' && env.VITE_USE_MOCK_LOGIN === 'true',
      ),
    },
    build: {
      sourcemap: false,
    },
    css: {
      devSourcemap: false,
    },
  };
});
