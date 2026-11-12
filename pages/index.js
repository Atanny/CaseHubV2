import dynamic from 'next/dynamic'
import { CaseHubApp } from '@/core/CaseHubApp'

// The whole app is client-only: it reads localStorage while computing its
// initial state, so rendering it on the server would cause hydration mismatches.
const CaseHubPage = dynamic(() => Promise.resolve(CaseHubApp), { ssr: false })

export default CaseHubPage
