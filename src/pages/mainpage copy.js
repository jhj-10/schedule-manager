import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import CalendarPage from "./CalendarPage"; // Assuming correct path here
import { UserColors } from "../lib/UserColors"; // Assuming correct path here

function MainPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [reset, setReset] = useState(false);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true); // For loading the userList
  const [selectedUsers, setSelectedUsers] = useState([]); // For storing selected users
  const [visibleMenu, setVisibleMenu] = useState(null); // For controlling visible menus
  const [colorset, setColorset] = useState([]); // For managing user color sets
  const pageRef = useRef(null);

  const [userInfovisible, setUserInfoVisible] = useState("");

  const COLORS = UserColors;

  // Fetch user list and set colorset
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/users?userId=${user.id}`)
      .then((response) => {
        setUserList(response.data);
        setLoading(false); // Set loading to false once data is fetched

        // Initialize colorset
        const initialColorset = response.data.map((user) => {
          const colorUserId = user.color_user_id || user.id;
          const colorCd =
            user.color_cd || COLORS[(COLORS.length % colorUserId) + 2];
          return {
            userID: user.id,
            colorUserId: colorUserId,
            colorCd: colorCd,
          };
        });
        setColorset(initialColorset);
      })
      .catch((error) => {
        console.error("There was an error fetching the userList!", error);
        setLoading(false);
      });
  }, [reset]);

  // Handle checkbox changes (selecting users)
  const handleCheckboxChange = (e) => {
    const value = Number(e.target.value);

    if (e.target.checked) {
      setSelectedUsers((prevSelected) => [...prevSelected, value]);
    } else {
      setSelectedUsers((prevSelected) =>
        prevSelected.filter((user) => user !== value)
      );
    }
  };

  // Handle opening/closing the user menu
  const handleMenuToggle = (userId) => {
    if (visibleMenu === userId) {
      setVisibleMenu(null); // Close the menu if already open
    } else {
      setVisibleMenu(userId); // Open the menu for the clicked button
    }
  };

  // Handle color selection for a user
  const handleClickColorBox = (userId, color) => {
    const updatedColorset = colorset.map((element) =>
      element.colorUserId === userId ? { ...element, colorCd: color } : element
    );
    setColorset(updatedColorset); // Update colorset in state

    const colorsetData = {
      userId: user.id,
      colorUserId: userId,
      colorCd: color,
    };

    const user = userList.find((user) => user.id === userId);
    if (user) {
      const request = user.color_user_id
        ? axios.put(`http://localhost:5000/api/users/colorset`, colorsetData)
        : axios.post(`http://localhost:5000/api/users/colorset`, colorsetData);

      request
        .then((response) => {
          console.log("Color set update response:", response);
          setReset(!reset); // Trigger re-fetching of data
        })
        .catch((error) => {
          console.error("There was an error updating colorset!", error);
        });
    }
  };

  // Menu closing logic on clicking outside
  const menuRef = useRef(null);
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setVisibleMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Adjust the page height dynamically
  const [pageHeight, setPageHeight] = useState(window.innerHeight - 65);
  useEffect(() => {
    const handleResize = () => {
      setPageHeight(window.innerHeight - 65);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Toggle visibility of user info based on window width
  useEffect(() => {
    const handleUserInfoVisible = () => {
      if (window.innerWidth < 650) {
        setUserInfoVisible("visible");
      } else {
        setUserInfoVisible("");
      }
    };
    window.addEventListener("resize", handleUserInfoVisible);

    return () => {
      window.removeEventListener("resize", handleUserInfoVisible);
    };
  }, []);

  return (
    <div className="main-page" ref={pageRef}>
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            className="header-btn-user"
            onClick={() =>
              setUserInfoVisible(userInfovisible === "visible" ? "" : "visible")
            }
          >
            ▒
          </button>
        </div>
        <h2 className="header-title">Calendar</h2>
        <div className="header-btn-group">
          {user.authority === "admin" && (
            <button
              className="header-btn-admin"
              onClick={() => navigate("/admin")}
            >
              관리자페이지
            </button>
          )}
          <button className="header-btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="page-container" style={{ height: `${pageHeight}px` }}>
        <div className={userInfovisible}>
          {/* User Info Sidebar */}
          <div className="userInfo-container">
            <div className="ui-user">
              <p>
                <strong>{user.name}</strong>
                <br />
                <span>({user.email})</span>
              </p>
              <button
                className="btn-userInfo ui-btn"
                onClick={() => navigate("/user/userinfo")}
              >
                개인정보수정
              </button>
            </div>
            <hr />
            <div
              className="btn-checkReset ui-btn"
              onClick={() => setSelectedUsers([])}
            >
              전체일정보기
            </div>
            <hr />
            <div>
              {userList.map((user) => (
                <div className="ui-userList" key={user.id}>
                  <div>
                    <label htmlFor={user.id} className="ui-userList-name">
                      <input
                        className="checkbox"
                        type="checkbox"
                        id={user.id}
                        value={user.id}
                        onChange={handleCheckboxChange}
                        checked={selectedUsers.includes(user.id)}
                      />
                      {user.name}
                    </label>
                  </div>
                  <button
                    className="ui-btn btn-arrow"
                    onClick={() => handleMenuToggle(user.id)}
                  >
                    ▶
                  </button>
                  {visibleMenu === user.id && (
                    <div className="user-menu" ref={menuRef}>
                      <div>상세정보보기</div>
                      <hr />
                      <div className="user-colors">
                        {COLORS.map((color) => (
                          <button
                            className="colorbox"
                            key={`cb-${user.id}-${color}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleClickColorBox(user.id, color)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <CalendarPage selectedUsers={selectedUsers} colorset={colorset} />
        )}
      </div>
    </div>
  );
}

export default MainPage;
