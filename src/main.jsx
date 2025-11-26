import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Telegram Mini App SDK
import WebApp from '@twa-dev/sdk'

// Telegram WebApp ishga tayyor bo'lganda
WebApp.ready()

// Fonni va header rangini oq qilish
WebApp.setBackgroundColor("#ffffff")
WebApp.setHeaderColor("#ffffff")

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
