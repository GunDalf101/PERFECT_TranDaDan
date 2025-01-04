import React from 'react'
import Logged from '../components/Navbar/Logged'
import NotLogged from '../components/Navbar/NotLogged'
import { Outlet } from 'react-router-dom'
import { useUser } from "../components/auth/UserContext";


const MainLayout = () => {
  const { user, isAuthenticated } = useUser();
  console.log('isAuthenticated updated:', isAuthenticated);
  return (
    <div>
      <header>
        {isAuthenticated ? <Logged user={user} /> : <NotLogged />}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout
