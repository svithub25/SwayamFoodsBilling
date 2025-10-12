import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.jsx'; 
import './index.css';

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <HashRouter>
    <ToastContainer position="top-right" autoClose={3000} />
    <App />
  </HashRouter>
  // </StrictMode>
);
 