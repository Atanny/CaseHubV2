import { useContext } from 'react'
import { FngContext } from './FngContext'

// Reads the File Name Generator page state/actions provided by FileNameGeneratorPage.
export function useFng() {
  return useContext(FngContext)
}
