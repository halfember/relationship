import { defineConfig, loadEnv } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

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
    plugins: [uni()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      sourcemap: false,
    },
    css: {
      devSourcemap: false,
    },
  };
});
