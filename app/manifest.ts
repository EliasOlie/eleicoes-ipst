import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Eleição de Oficiais 2026 — IPB Serra Talhada',
    short_name: 'Eleição IPST',
    description: 'Assembleia Geral Extraordinária - Eleição de Diáconos e Presbíteros da Igreja Presbiteriana de Serra Talhada',
    start_url: '/',
    display: 'standalone',
    background_color: '#073D24',
    theme_color: '#0A5C36',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon.png',
        sizes: '64x64',
        type: 'image/png',
      },
    ],
  };
}
