import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserConfigProvider } from '@/context/UserConfigContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserConfigProvider>
      <App />
    </UserConfigProvider>
  </React.StrictMode>,
)
