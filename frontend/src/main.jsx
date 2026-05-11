import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/main.scss'

// Entry point for the React app.
// Responsibilities:
// - Import global styles.
// - Mount the top-level `App` component into the DOM.
// If you are unfamiliar with React, `createRoot` is the modern API
// used to render a React tree into a DOM node.
const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App />)
