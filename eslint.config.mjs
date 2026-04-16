import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextCoreWebVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'cloudflare-worker/worker.js',
    ],
  },
];

export default config;
