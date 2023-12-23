import React from 'react'
import {
  createBrowserRouter,
  Link,
  NavLink,
  Outlet,
  RouterProvider,
} from "react-router-dom";

import { Button, Collapse, Container, Nav, Navbar } from 'react-bootstrap';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthProvider, { AuthContext, AuthorizeView, Authorized, NotAuthorized } from './core/AuthProvider.jsx'

import HomePage, { AboutPage, NotFoundPage } from './pages/Home.jsx';
import LoginPage from './pages/Login.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import SettingsPage from './pages/Settings.jsx';
import UsersPage from './pages/Users.jsx';
import BusinessesPage from './pages/Businesses.jsx';
import WarehousesPage from './pages/Warehouses.jsx';
import KonimboPage from './pages/models/Konimbo.jsx';


const router = createBrowserRouter([
  {
    path: "/",
    element: <AnonymousLayout />,
    children: [
      {
        path: "",
        element: <HomePage />
      },
      {
        path: "/about",
        element: <AboutPage />
      },
      {
        path: "/login",
        element: <LoginPage />
      }
    ]
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "",
        element: <DashboardPage />
      },
      {
        path: "dashboard",
        element: <DashboardPage />
      },
      {
        path: "settings",
        element: <SettingsPage />
      },
      {
        path: "users",
        element: <UsersPage />
      },
      {
        path: "businesses",
        element: <BusinessesPage />
      },
      {
        path: "warehouses",
        element: <WarehousesPage />
      },
    ]
  },
  {
    path: "/models",
    element: <AuthLayout />,
    children: [
      {
        path: "konimbo",
        element: <KonimboPage />
      }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);

function AuthLayout({ children }) {
  const { logout } = React.useContext(AuthContext);
  const [modelsCollapse, setModelsCollapse] = React.useState(true);

  return (<div id='wrapper'>
    <div id="sidebar">
      <Navbar bg="light" data-bs-theme="light" className='h-100 p-0' >
        <Container className='d-flex flex-column p-3 bg-dark h-100'>
          <Navbar.Brand>
            <NavLink className="nav-link text-white" to="/">
              BNext - M
            </NavLink>
          </Navbar.Brand>
          <div className='w-100 border border-top-0 mb-2 bg-white'></div>
          <Nav className="pt-2 nav nav-pills flex-column mb-auto w-100">
            <Authorized>
              <NavLink className="nav-link text-white mb-2" to="/auth/dashboard">
                שולחו עבודה
              </NavLink>
              <b className='text-white border-white mb-1' style={{fontSize:"14px"}}>
                מודלים:
              </b>
              <NavLink className="nav-link text-white mb-2 mx-3" to="/models/konimbo">
                    קונימבו
              </NavLink>
              <NavLink className="nav-link text-white mb-2" to="/auth/settings">
                הגדרות
              </NavLink>
            </Authorized>
          </Nav>
          <Nav className="pt-2 nav nav-pills flex-column w-100">
            <Authorized>
              <NavLink className="nav-link text-white mb-2" to="/auth/businesses">
                עסקים
              </NavLink>
              <NavLink className="nav-link text-white mb-2" to="/auth/warehouses">
               מחסנים
              </NavLink>
              <NavLink className="nav-link text-white mb-2" to="/auth/users">
               משתמשים
              </NavLink>
            </Authorized>
          </Nav>
          <div className='w-100 border border-top-0 mb-2 bg-white'></div>
          <Nav>
            <AuthorizeView>
              <Authorized>
                <NavLink className="nav-link text-white" onClick={logout}>
                  יציאה
                </NavLink>
              </Authorized>
            </AuthorizeView>
          </Nav>
        </Container>
      </Navbar>
  </div>
  <div className='px-4 py-2' id="content">
    <Outlet />{children}
  </div>
  </div> )
}

function AnonymousLayout({ children }) {
  const { logout } = React.useContext(AuthContext);

  return (
    <>
      <Navbar bg="light" data-bs-theme="light">
        <Container>
          <Navbar.Brand>
            <NavLink className="nav-link" to="/">
              BNext - M
            </NavLink>
          </Navbar.Brand>
          <Nav className="me-auto">
            <NavLink className="nav-link" to="/">
              בית
            </NavLink>
            <Authorized>
              <NavLink className="nav-link" to="/auth/dashboard">
                שולחו עבודה
              </NavLink>
            </Authorized>
            <NavLink className="nav-link" to="/about">
              אודות
            </NavLink>
          </Nav>
          <Nav>
            <AuthorizeView>
              <Authorized>
                <NavLink className="nav-link" onClick={logout}>
                  יציאה
                </NavLink>
              </Authorized>
              <NotAuthorized>
                <NavLink className="nav-link" to="/login">
                  כניסה
                </NavLink>
              </NotAuthorized>
            </AuthorizeView>
          </Nav>
        </Container>
      </Navbar>
      <Container>
        <Outlet />{children}
      </Container>
    </>
  )

}
function App() {

  function Connect() {
    JSPrintManager.auto_reconnect = true;
    JSPrintManager.start();
  }
  function Status() {
    if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Open)
      return true;
    else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Closed) {
      toast.error('JSPrintManager (JSPM) is not installed or not running! Download JSPM Client App v6.0.3');
      return false;
    }
    else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Blocked) {
      toast.warning('JSPM has blocked this website!');
      return false;
    }
  }


  return (<>

    <ToastContainer rtl="true" autoClose={1600} pauseOnFocusLoss={false} />

    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </>)
}

export default App
