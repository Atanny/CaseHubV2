// Stand-in for next/dynamic in tests: lazy-load like the real thing, minus Next internals.
import React from 'react'

export default function dynamic(loader, options = {}) {
  const Lazy = React.lazy(() => Promise.resolve(loader()).then((m) => ({ default: m?.default ? m.default : m })))
  return function DynamicWrapper(props) {
    return React.createElement(
      React.Suspense,
      { fallback: options.loading ? React.createElement(options.loading) : null },
      React.createElement(Lazy, props)
    )
  }
}
