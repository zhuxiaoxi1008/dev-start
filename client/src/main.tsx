import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserConfigProvider } from './context/UserConfigContext'
import { v4 as uuidv4 } from 'uuid'

const getOrCreateGuestId = () => {
  let guestId = localStorage.getItem('dev_start_guest_id')
  if (!guestId) {
    guestId = uuidv4()
    localStorage.setItem('dev_start_guest_id', guestId)
  }
  return guestId
}

const GUEST_ID = getOrCreateGuestId()

ReactDOM.createRoot(document.getElementById('root')!).render(
  // 去掉 StrictMode 减少多余的渲染
  <UserConfigProvider userId={GUEST_ID}>
    <App />
  </UserConfigProvider>
)