// Order matters: globals first, then the app stylesheet (which overrides it).
import '@/styles/globals.css'
import '@/styles/index.css'

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}
