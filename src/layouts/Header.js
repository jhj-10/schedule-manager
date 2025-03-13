import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import { useContext } from "react";

function Header({ handleSideMenu }) {
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  const handleLogout = async () => {
    console.log(`handleLogout`);
    try {
      await logout(); // Perform logout logic
      // navigate("/login", { state: { sideMenu: true } }); // Redirect to the home page
    } catch (error) {
      console.error("Failed to log out", error); // Handle any logout errors
    }
  };

  return (
    <header className="header">
      <div className="header-btn-group">
        <button
          className="header-btn-user spc-button"
          onClick={() => handleSideMenu()}
        >
          {" "}
          ▒{" "}
        </button>
        <button
          onClick={() => navigate("/", { state: { view: "month" } })}
          className="main_button spc-button"
        >
          <h2 className="header-title">Calendar</h2>
        </button>
      </div>
      <div className="header-btn-group">
        {user.authority === "admin" && (
          <button
            className="header-btn-admin spc-button"
            onClick={() => navigate("/admin")}
          >
            관리자페이지
          </button>
        )}
        <button className="header-btn-logout" onClick={() => handleLogout()}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
