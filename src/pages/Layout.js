import { Outlet, useLocation } from "react-router-dom";
import "../lib/style_main.css";
import Header from "./Header";
import { useEffect, useState } from "react";

function Layout() {
  const [sideMenu, setSideMenu] = useState(true); // 사이드메뉴 on/off
  const location = useLocation();

  // 사이드 메뉴 on/off
  const handleSideMenu = () => {
    setSideMenu(!sideMenu);
  };

  // 화면 크기(가로)에 따라 사이드 메뉴 on/off
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

  // 헤더 부분을 제외한 페이지 높이
  const height = window.innerHeight - 64;

  return (
    <div>
      <Header handleSideMenu={handleSideMenu} />
      <main className="main" style={{ height: `${height}px` }}>
        <Outlet context={{ sideMenu: sideMenu }} />
      </main>
    </div>
  );
}

export default Layout;
