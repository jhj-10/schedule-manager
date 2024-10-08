import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AdminUserListPage from "./AdminUserListPage";
import HolidayListPage from "./HolidayListPage";

function AdminPage({ endPoint }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const END_POINT = endPoint || "";

  const [view, setView] = useState("userList");
  const [reloadKey, setReloadKey] = useState(0); // Add a key to trigger re-render of AdminUserListPage

  // 달력 높이 화면에 맞추기
  const [pageHeight, setPageHeight] = useState(window.innerHeight - 65);

  useEffect(() => {
    handleAdminPage();
    const handleResize = () => {
      setPageHeight(window.innerHeight - 65);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (location.state && location.state.triggerFunction) {
      handleAdminPage();
    }
  }, [location]);

  // 관리자페이지로 이동
  const handleAdminPage = () => {
    setView("userList");
    setReloadKey((prevKey) => prevKey + 1); // Update the key to force AdminUserListPage to reload
  };

  // 화면 너비에 따라 유저인포 창 보이기여부
  const [userInfovisible, setUserInfoVisible] = useState("");

  const handleVisible = () => {
    setUserInfoVisible(userInfovisible === "visible" ? "" : "visible");
  };

  const handleUserListClick = () => {
    setView("userList");
    setReloadKey((prevKey) => prevKey + 1); // Update the key to force AdminUserListPage to reload
    handleUserInfoVisible();
  };

  const handleHolidayListClick = () => {
    setView("holidayList");
    handleUserInfoVisible();
  };

  const handleUserInfoVisible = () => {
    if (window.innerWidth < 650) {
      setUserInfoVisible("visible");
    } else {
      setUserInfoVisible("");
    }
  };

  useEffect(() => {
    handleAdminPage();
    handleUserInfoVisible();
    window.addEventListener("resize", handleUserInfoVisible);

    return () => {
      window.removeEventListener("resize", handleUserInfoVisible);
    };
  }, []);

  return (
    <div className="main-page">
      {/* 상단 헤더 */}
      <div className="page-header">
        <div>
          <button className="header-btn-user" onClick={handleVisible}>
            {" "}
            ▒{" "}
          </button>
        </div>
        <button onClick={() => navigate("/")} className="main_button">
          <h2 className="header-title">Calendar</h2>
        </button>
        <div className="header-btn-group">
          {user.authority === "admin" ? (
            <button className="header-btn-admin" onClick={handleAdminPage}>
              관리자페이지
            </button>
          ) : (
            ""
          )}
          <button className="header-btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
      <div className="page-container" style={{ height: `${pageHeight}px` }}>
        <div
          className={userInfovisible}
          style={
            window.innerWidth < 650
              ? {
                  position: "absolute",
                  zIndex: "10",
                  height: `${pageHeight}px`,
                }
              : {}
          }
        >
          {/* 좌측 사이드 메뉴 */}
          <div className="userInfo-container">
            <div
              className="btn-checkReset ui-btn"
              onClick={handleUserListClick} // Handle user list click
            >
              사원정보
            </div>

            <div
              className="btn-checkReset ui-btn"
              onClick={handleHolidayListClick}
            >
              공휴일정보
            </div>
          </div>
        </div>
        <div className="calendar-container">
          {view === "userList" && (
            <AdminUserListPage key={reloadKey} endPoint={END_POINT} />
          )}
          {view === "holidayList" && (
            <HolidayListPage key={reloadKey} endPoint={END_POINT} />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
