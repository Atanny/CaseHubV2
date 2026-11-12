import { Html, Head, Main, NextScript } from 'next/document'
import { FONT_STYLESHEET_URL } from '@/config/fonts'

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_STYLESHEET_URL} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
