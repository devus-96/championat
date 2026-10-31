// main.jsx : point d'entrée, styles globaux puis application
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/base.css'
import './styles/layout.css'
import './styles/composants.css'
import './styles/pages.css'
import App from './App.jsx'
import { FournisseurToast } from './components/Toast.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FournisseurToast>
        <App />
      </FournisseurToast>
    </BrowserRouter>
  </React.StrictMode>,
)
