import { Outlet, useNavigate, useOutletContext } from "react-router-dom";

function AdminPage() {
  const sideMenu = useOutletContext();
  const navigate = useNavigate();

  // 관리자페이지로 이동(사원리스트)
  const handleUserListClick = () => {
    navigate("/admin");
  };

  // 공휴일 리스트
  const handleHolidayListClick = () => {
    navigate("/admin/holidays", {});
  };

  return (
    <>
      {sideMenu && (
        <div className="sidemenu">
          <div
            className="sidemenu-list btn"
            onClick={handleUserListClick} // Handle user list click
          >
            사원정보
          </div>

          <div className="sidemenu-list btn" onClick={handleHolidayListClick}>
            공휴일정보
          </div>
        </div>
      )}
      <div className="contents">
        <Outlet />
      </div>
    </>
  );
}

export default AdminPage;
