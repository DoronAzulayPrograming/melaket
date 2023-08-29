import React, { useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useLocation, Navigate } from 'react-router-dom'
import { Navbar, Container, Nav } from 'react-bootstrap';


import LoginPage from './Pages/LoginPage';
import Dashboard from './Pages/Dashboard';
import UsersPage from './Pages/UsersPage';
import BusinessesPage from './Pages/BusinessesPage';

import { AuthContext, AuthorizeView, Authorized, NotAuthorized } from './AuthProvider';
import { secureLocalStorage } from './SecureStorage';



function App() {
  return (
    <>

      <Router>
        <Routes>
          <Route exact path="/" element={<Layout> <Home /> </Layout>} />
          <Route exact path="/login" element={<LoginPage />} />
          <Route exact path="/dashboard" element={<DashboardLayout> <Dashboard /></DashboardLayout>} />
          <Route exact path="/dashboard-users" element={<DashboardLayout> <UsersPage /></DashboardLayout>} />
          <Route exact path="/dashboard-business" element={<DashboardLayout> <BusinessesPage /></DashboardLayout>} />
        </Routes>
      </Router>
    </>
  )
}

function Layout({ children }) {
  return (
    <>
      <NavBar />
      <main className="container-md pt-3">
        {children}
      </main>
    </>
  )
}

function DashboardLayout({ children }) {
  return (
    <AuthorizeView>
      <Authorized>
        <div className='row h-100 m-0'>
          <div className='col-md-3 d-none d-md-block bg-info shadow' style={{ maxWidth: "180px" }}>
            <div>
              <DashboardNavBar />
            </div>
          </div>
          <div className='col-md-3 d-md-none bg-info shadow'>
            <DashboardNavBar />
          </div>
          <div className='col p-0'>
            <main className="p-3">
              {children}
            </main>
          </div>
        </div>
      </Authorized>
      <NotAuthorized>
        <Navigate to="/login" />
      </NotAuthorized>
    </AuthorizeView>
  )
}

function DashboardNavBar() {
  const { isLoggedIn, setIsLoggedIn, roles, setRoles, user } = useContext(AuthContext);
  function logout(e) {
    e.preventDefault();
    secureLocalStorage.removeItem('u');
    setRoles([]);
    setIsLoggedIn(false);
  }

  return (
    <>
      <div className='row m-0 text-center'>
        <div className='col-12 p-4'>
          <h2 className='m-0'>Logo</h2>
        </div>
        <div className='col-12'>
          <div className='p-4 pb-2' style={{ maxWidth: "10rem" }}>
            <img className='img-fluid rounded-circle shadow bg-white' src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/User-avatar.svg/2048px-User-avatar.svg.png" />
          </div>
        </div>
        <div className='col'>
          <h4><b>{user.name}</b></h4>
        </div>
      </div>

      <ul className="navbar-nav">
        <Authorized roles={["admin"]}>
          <NavLink
            className="nav-link"
            activeclassname="active"
            to="/dashboard"
          >
            <b>ראשי</b>
          </NavLink>
          <NavLink
            className="nav-link"
            activeclassname="active"
            to="/dashboard-business"
          >
            <b>עסקים</b>
          </NavLink>
          <NavLink
            className="nav-link"
            activeclassname="active"
            to="/dashboard-users"
          >
            <b>משתמשים</b>
          </NavLink>
        </Authorized>
      </ul>

      <div className='text-center mt-2'>
        <button className='btn btn-primary' onClick={logout}>
          התנתקות
        </button>
      </div>
    </>
  )

}

function NavBar() {
  const { isLoggedIn, setIsLoggedIn, roles, setRoles } = useContext(AuthContext);

  function logout(e) {
    e.preventDefault();
    secureLocalStorage.removeItem('u');
    setRoles([]);
    setIsLoggedIn(false);
  }

  return (
    <>
      <Navbar expand="lg" bg='secondary' >
        <Container>
          <Navbar.Brand >
            <NavLink className="nav-link" to="/">
              Melaket
            </NavLink>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <NavLink className="nav-link" to="/">
                בית
              </NavLink>
              <Authorized>
                <NavLink className="nav-link" to="/dashboard">
                  שולחן עבודה
                </NavLink>
              </Authorized>
            </Nav>
            <Nav>
              <AuthorizeView>
                <Authorized>
                  <NavLink className="nav-link" onClick={logout}>
                    התנתקות
                  </NavLink>
                </Authorized>
                <NotAuthorized>
                  <NavLink className="nav-link" to="/login">
                    התחברות
                  </NavLink>
                </NotAuthorized>
              </AuthorizeView>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

    </>

  )
}

function Home() {
  return <h1>Home Welcome</h1>;
}

export default App;