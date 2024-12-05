import React from 'react'
import Logged from '../components/Navbar/Logged'
import NotLogged from '../components/Navbar/NotLogged'
import { Outlet } from 'react-router-dom'

const MainLayout = ({loggedIn = true}) => {
  return (
    <div>
      <header>
        {loggedIn ? <Logged /> : <NotLogged />}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
