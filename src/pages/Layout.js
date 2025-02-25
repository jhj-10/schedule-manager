import { Outlet, useLocation } from "react-router-dom";
import "../lib/style_main.css";
import Header from "./Header";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthProvider";

function Layout() {
  const [sideMenu, setSideMenu] = useState(true);
  const { user } = useContext(AuthContext);

  const location = useLocation();

  const handleSideMenu = () => {
    console.log(`handleSideMenu`);
    setSideMenu(!sideMenu);
  };

  useEffect(() => {
    const checkWindowWidth = () => {
      const windowWidth = window.innerWidth < 650;
      if (!windowWidth) {
        setSideMenu(true);
      } else {
        setSideMenu(false);
      }
    };
    checkWindowWidth();
    window.addEventListener("resize", checkWindowWidth);
    return () => {
      window.removeEventListener("resize", checkWindowWidth);
    };
  }, [location]);

  const height = window.innerHeight - 64;
  return (
    <div>
      <Header handleSideMenu={handleSideMenu} />
      {/* {console.log("layout user:", user)} */}
      <main className="main" style={{ height: `${height}px` }}>
        <Outlet context={{ sideMenu: sideMenu, user: user }} />
      </main>
    </div>
  );
}

export default Layout;
