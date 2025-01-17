import React, { useEffect, useState } from "react";
import Logged from "../components/Navbar/Logged";
import NotLogged from "../components/Navbar/NotLogged";
import { Outlet } from "react-router-dom";
import { useUser } from "../components/auth/UserContext";
import Loading from "../components/Loading/Loading";
import InviteUI from "../components/InviteUI/InviteUI";



const MainLayout = () => {
  const { isAuthenticated } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <header>
        {isAuthenticated ? <Logged /> : <NotLogged />}
      </header>
      <main>
        <InviteUI/>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;


// export default MainLayout
