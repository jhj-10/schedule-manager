import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import CalendarPage from "./CalendarPage";
import { UserColors } from "../lib/UserColors";
import UserInfoViewPage from "./UserInfoViewPage";
import EditUserInfo from "./EditUserInfo";
// import "../lib/CalendarPage.css";
import "../lib/UserInfo.css";

function MainPage({ endPoint }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const END_POINT = endPoint || "";

  const [reset, setReset] = useState(false);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(null);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [visibleMenu, setVisibleMenu] = useState(null);
  const [colorset, setColorset] = useState([]);
  const [view, setView] = useState("calendar");
  const [mode, setMode] = useState("");
  const [infoViewUser, setInfoViewUser] = useState({});

  // 사용자별 색상 추출
  const COLORS = UserColors;

  // 관리자페이지로 이동
  const handleAddNewUser = () => {
    navigate("/admin", {});
  };

  // 화면 너비에 따라 유저인포 창 보이기여부
  const [userInfovisible, setUserInfoVisible] = useState("");

  const handleUserInfoVisible = () => {
    console.log("handleUserInfoVisible!!!!");
    if (window.innerWidth < 650) {
      setUserInfoVisible("visible");
    } else {
      setUserInfoVisible("");
    }
  };

  useEffect(() => {
    handleUserInfoVisible();
    window.addEventListener("resize", handleUserInfoVisible);

    return () => {
      window.removeEventListener("resize", handleUserInfoVisible);
    };
  }, []);

  // 버튼클릭으로 유저인포 창 보이기 여부
  const handleVisible = () => {
    setUserInfoVisible(userInfovisible === "visible" ? "" : "visible");
  };

  // 달력 높이 화면에 맞추기
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

  // 브라우저 종료시 자동로그아웃
  useEffect(() => {
    const handleBeforeUnload = () => {
      logout(); // Call the logout function before closing the window
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [logout]);

  // 사용자 선택(체크박스)
  const handleCheckboxChange = (e) => {
    const value = Number(e.target.value);

    if (e.target.checked) {
      setSelectedUsers([...selectedUsers, value]);
    } else {
      setSelectedUsers(selectedUsers.filter((user) => user !== value));
    }
    console.log("selectedUsers: ", `${selectedUsers}`);
  };

  // 사용자 이름 옆에 화살표 버튼 클릭 시 메뉴 열기/닫기
  const handleMenuToggle = (userId) => {
    if (visibleMenu === userId) {
      setVisibleMenu(null); // Close the menu if already open
    } else {
      setVisibleMenu(userId); // Open the menu for the clicked button
    }
  };

  // 상세정보보기
  const hadleUserInfoView = (userId, mode) => {
    // console.log("hadleUserInfoView:", userId);

    const ivu = userList.find((user) => user.id === userId);
    console.log("hadleUserInfoView:", userId, ivu);

    setInfoViewUser(ivu);
    setVisibleMenu(null);
    setView("userInfo");
    setMode(mode);
    UserInfoPageLoad(infoViewUser, mode);
  };

  // 사용자별 색상 선택/변경
  const handleClickColorBox = (userId, color) => {
    const updatedColorset = colorset.map((element) => {
      if (element.colorUserId === userId) {
        return { ...element, colorCd: color };
      }
      return element;
    });

    const colorsetData = {
      userId: user.id,
      colorUserId: userId,
      colorCd: color,
    };

    console.log("handleClickColorBox colorsetData:", colorsetData);

    const existingUser = userList.find((element) => element.id === userId);

    if (existingUser && !existingUser.color_user_id) {
      axios
        .post(`${END_POINT}/api/users/colorset`, colorsetData, {
          withCredentials: true,
        })
        .then((response) => {
          console.log("Create colorset response:", response);
          setColorset(updatedColorset); // Update colorset immutably
          setReset(!reset);
        })
        .catch((error) => {
          console.error("There was an error creating colorset!", error);
        });
    } else {
      axios
        .put(`${END_POINT}/api/users/colorset`, colorsetData, {
          withCredentials: true,
        })
        .then((response) => {
          console.log("Update colorset response:", response);
          setColorset(updatedColorset); // Update colorset immutably
          setReset(!reset);
        })
        .catch((error) => {
          console.error("There was an error updating colorset!", error);
        });
    }
  };

  // 캘린더 로드
  const CalendarPageLoad = useCallback(
    (selectedUsers, colorset) => {
      return (
        <CalendarPage
          selectedUsers={selectedUsers}
          colorset={colorset}
          className="calendar-container"
          endPoint={END_POINT}
        />
      );
    },
    [END_POINT]
  );

  // 유저정보 로드
  const UserInfoPageLoad = (infoViewUser, mode) => {
    console.log("infoViewUser:", infoViewUser);
    if (mode === "view") {
      return (
        <UserInfoViewPage
          infoViewUser={infoViewUser}
          className="calendar-container"
        />
      );
    }
    if (mode === "edit") {
      return (
        <EditUserInfo
          funnels="mainPage"
          infoViewUserId={infoViewUser.id}
          className="calendar-container"
          endPoint={END_POINT}
        />
      );
    }
  };

  // 사용자별 메뉴 Ref
  const menuRef = useRef(null);

  // 메뉴창 외 영역 클릭 시 메뉴창 닫기
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
  }, [menuRef]);

  // 사용자 목록 가져오기 및 컬러셋 저장
  useEffect(() => {
    const fetchUserData = async () => {
      axios
        .get(`${END_POINT}/api/users?userId=${user.id}`, {
          withCredentials: true,
        })
        .then((response) => {
          console.log("userList response:", response);
          setUserList(response.data);

          // Initialize colorset without causing a re-render loop
          const initialColorset = response.data.map((colorUser) => {
            const colorUserId = colorUser.color_user_id || colorUser.id;
            const colorCd =
              colorUser.color_cd || COLORS[(COLORS.length % colorUserId) + 2];
            return {
              userID: user.id,
              colorUserId: colorUserId,
              colorCd: colorCd,
            };
          });

          setColorset(initialColorset);
          setLoading(false); // Set loading to false once data is fetched
        })
        .catch((error) => {
          console.error("There was an error fetching the userList!", error);
          setLoading(false);
        });
    };
    fetchUserData();
  }, [reset, END_POINT, user.id, COLORS]);

  // Separate useEffect to handle CalendarPage loading logic
  useEffect(() => {
    if (!loading) {
      CalendarPageLoad(selectedUsers, colorset); // Only trigger when selectedUsers or colorset changes
    }
  }, [selectedUsers, colorset, CalendarPageLoad, loading]);

  return (
    <div className="main-page" ref={pageRef}>
      {/* 상단 헤더 */}
      <div className="page-header">
        <div>
          <button className="header-btn-user" onClick={handleVisible}>
            {" "}
            ▒{" "}
          </button>
        </div>
        <button
          onClick={() => {
            setSelectedUsers([]);
            setView("calendar");
            navigate("/");
          }}
          className="main_button"
        >
          <h2 className="header-title">Calendar</h2>
        </button>
        <div className="header-btn-group">
          {user.authority === "admin" ? (
            <button
              className="header-btn-admin"
              onClick={handleAddNewUser}
              style={{ cursor: "pointer" }}
            >
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
          {/* 좌측 사이드 유저정보 */}
          <div className="userInfo-container">
            <div className="ui-user">
              <p>
                <strong>{user.name}</strong>
                <br />
                <span>({user.email})</span>
              </p>

              <button
                className="btn-userInfo ui-btn"
                onClick={() => {
                  setUserInfoVisible(window.innerWidth < 650 ? "visible" : "");
                  hadleUserInfoView(user.id, "edit");
                }}
              >
                개인정보수정
              </button>
            </div>

            <hr />
            <div
              className="btn-checkReset ui-btn"
              onClick={() => {
                setSelectedUsers([]);
                setView("calendar");
                setUserInfoVisible(window.innerWidth < 650 ? "visible" : "");
              }}
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
                        style={{
                          backgroundColor: `${user.color_cd}`,
                          accentColor: `${user.color_cd}`,
                          color: `${user.color_cd}`,
                        }}
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
                      <div
                        onClick={() => {
                          setUserInfoVisible(
                            window.innerWidth < 650 ? "visible" : ""
                          );
                          hadleUserInfoView(user.id, "view");
                        }}
                      >
                        상세정보보기
                      </div>
                      <hr />
                      <div className="user-colors">
                        {COLORS.map((color) => (
                          <button
                            className="colorbox"
                            key={`cb-${user.id}-${color}`}
                            style={{ backgroundColor: `${color}` }}
                            value={color}
                            onClick={() => handleClickColorBox(user.id, color)}
                          ></button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* 달력 */}
        {view === "calendar" && !loading && (
          <>
            {console.log("CalendarPage loading!!!")}
            {CalendarPageLoad(selectedUsers, colorset)}
          </>
        )}
        {/* 개인정보보기 */}
        {view === "userInfo" && (
          <>
            {console.log("userInfoPage loading!!!")}
            {UserInfoPageLoad(infoViewUser, mode)}
          </>
        )}
      </div>
    </div>
  );
}

export default MainPage;
