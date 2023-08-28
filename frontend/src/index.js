import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App/App';


import AuthProvider , { AuthInterval } from './App/AuthProvider';

import ThemeProvider from 'react-bootstrap/ThemeProvider';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <ThemeProvider dir="rtl">
        <ToastContainer rtl autoClose={1600} pauseOnFocusLoss={false} />
        <AuthProvider>
            <AuthInterval />
            <App />
        </AuthProvider>
    </ThemeProvider>);

