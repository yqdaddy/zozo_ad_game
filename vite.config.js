import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig(async () => {
  const { viteStaticCopy } = await import('vite-plugin-static-copy')
  
  return {
    plugins: [
      uni(),
      viteStaticCopy({
        targets: [
          {
            src: '8c0ffee5dd33a7cb15aff9776c072256.txt',
            dest: ''
          }
        ]
      })
    ],
    base: '/',
    build: {
      outDir: 'dist/build/h5'
    }
  }
})
