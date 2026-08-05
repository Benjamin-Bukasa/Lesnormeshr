import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ToastProvider } from './components/ui'
import routes from './routes/routes.jsx'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './theme/theme-provider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={routes}/>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
)
