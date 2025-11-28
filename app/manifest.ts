import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Partiet Sentrum Medlem',
    short_name: 'Sentrum',
    description: 'Medlemsportal for Partiet Sentrum og Unge Sentrum',
    start_url: '/minside', // Når man åpner appen, start her
    display: 'standalone', // Skjul nettleserens adressebar
    background_color: '#fffcf1', // Vår kremhvite bakgrunn
    theme_color: '#c93960', // Vår røde farge for statusbar
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}