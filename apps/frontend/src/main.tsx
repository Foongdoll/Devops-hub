import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { NotifyProvider } from './context/GlobalNotifyContext.tsx'
import { GlobalUIProvider } from './context/GlobalUIContext.tsx'

createRoot(document.getElementById('root')!).render(
  <NotifyProvider>
    <GlobalUIProvider>
      <App />
    </GlobalUIProvider>
  </NotifyProvider>
)