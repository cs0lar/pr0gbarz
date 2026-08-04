import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App.js'
import '@pr0gbarz/ui/styles.css'
import './styles.css'

const root = document.querySelector<HTMLElement>('#root')

if (!root) {
  throw new Error('Unable to start pr0gbarz: the root element is missing.')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
