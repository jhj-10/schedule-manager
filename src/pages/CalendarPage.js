import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import { UserColors } from "../styles/UserColors";
import {
  createColorset,
  fetchUserList,
  updateColorset,
} from "../services/userService";
import "../styles/UserInfo.css";

function CalendarPage() {
  const { user } = useContext(AuthContext);
  // console.log("CalendarPage user:", user);
  const { sideMenu } = useOutletContext();
  const navigate = useNavigate();
  const COLORS = UserColors;

  const [userList, setUserList] = useState([]); // 사이드메뉴 사용자 리스트
  const [colorset, setColorset] = useState([]); // 사용자 컬러셋 -> CalendarDiv로 전달
  // const [loading, setLoading] = useState(true);
  const [reset, setReset] = useState(false); // 화면 리셋(컬러셋 반영)
  const [visibleMenu, setVisibleMenu] = useState(null); // 사용자 > 상세정보, 컬러셋 창 on/off
  const [selectedUsers, setSelectedUsers] = useState([]); // 선택한 사용자 리스트 -> CalendarDiv로 전달

  // 사용자별 색상 선택/변경
  const handleClickColorBox = async (userId, color) => {
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

    const existingUser = userList.find((element) => element.id === userId);

    try {
      if (existingUser && !existingUser.color_user_id) {
        // 컬러셋 생성
        await createColorset(colorsetData);
      } else {
        // 컬러셋 수정(업데이트)
        await updateColorset(colorsetData);
      }

      setColorset(updatedColorset);
      setReset(!reset); // Trigger any additional state changes
    } catch (error) {
      console.error("There was an error with the colorset operation!", error);
    }
  };

  // 사용자 이름 옆에 화살표 버튼 클릭 시 메뉴 열기/닫기
  const handleMenuToggle = (userId) => {
    if (visibleMenu === userId) {
      setVisibleMenu(null);
    } else {
      setVisibleMenu(userId);
    }
  };

  // 사용자 선택(체크박스)
  const handleCheckboxChange = (e) => {
    const value = Number(e.target.value);

    if (e.target.checked) {
      setSelectedUsers([...selectedUsers, value]);
    } else {
      setSelectedUsers(selectedUsers.filter((user) => user !== value));
    }
  };

  // 개인정보수정
  const handleEditUserInfo = () => {
    navigate("/user/mypage", {});
  };

  // 일정보기
  const handleScheduleView = () => {
    navigate("/", { state: { users: selectedUsers } });
  };

  // 사용자정보보기
  const handleUserInfoView = (userId) => {
    setVisibleMenu(null);
    navigate(`/user/${userId}`, { state: { userid: userId } });
  };

  // 사용자 목록 가져오기 및 컬러셋 저장
  useEffect(() => {
    // console.log("fetchUserList 실행 - user:", user);
    if (!user || !user.id) {
      console.warn("user가 아직 로드되지 않았습니다.");
      return;
    }

    // console.log("localStorage:", localStorage);
    // console.log("fetchUserList user:", user);
    const fetchUserData = async () => {
      try {
        const fetchedUserList = await fetchUserList(user.id); // Use the service to fetch data
        setUserList(fetchedUserList);

        // Initialize colorset without causing a re-render loop
        const initialColorset = fetchedUserList.map((colorUser) => {
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
        // setLoading(false); // Set loading to false once data is fetched
      } catch (error) {
        console.error("There was an error fetching the user list!", error);
        // setLoading(false);
      }
    };

    fetchUserData();
  }, [user, COLORS, reset]);

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

  return (
    <>
      {sideMenu && (
        <div className="sidemenu">
          <div className="ui-user">
            <div className="user-name">{user.name}</div>
            <p>({user.email})</p>
            <button
              className="btn-userInfo spc-button"
              onClick={handleEditUserInfo}
            >
              {/* <Link to={`/user/mypage`}>개인정보수정</Link> */}
              개인정보수정
            </button>
          </div>

          <hr />
          <div
            className="btn-checkReset"
            onClick={() => {
              setSelectedUsers([]);
              handleScheduleView();
            }}
          >
            전체일정보기
            {/* <Link to={`/`}>전체일정보기</Link> */}
          </div>
          <hr />
          <div>
            {userList.map((item) => (
              <div className="sidemenu-list" key={item.id}>
                <div>
                  <label htmlFor={item.id} className="ui-userList-name">
                    <input
                      className="checkbox"
                      type="checkbox"
                      id={item.id}
                      value={item.id}
                      onChange={handleCheckboxChange}
                      style={{
                        backgroundColor: `${item.color_cd}`,
                        accentColor: `${item.color_cd}`,
                        color: `${item.color_cd}`,
                      }}
                      checked={selectedUsers.includes(item.id)}
                    />
                    {item.name}
                  </label>
                </div>
                <button
                  className="btn-arrow"
                  onClick={() => handleMenuToggle(item.id)}
                >
                  ▶
                </button>
                {visibleMenu === item.id && (
                  <div className="user-menu" ref={menuRef}>
                    <div
                      className="btn-userInfo-dt"
                      onClick={() => handleUserInfoView(item.id)}
                    >
                      상세정보보기
                    </div>
                    <hr />
                    <div className="user-colors">
                      {COLORS.map((color) => (
                        <button
                          className="colorbox"
                          key={`cb-${item.id}-${color}`}
                          style={{ backgroundColor: `${color}` }}
                          value={color}
                          onClick={() => handleClickColorBox(item.id, color)}
                        ></button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="contents">
        <Outlet context={{ selectedUsers, colorset }} />
      </div>
    </>
  );
}

export default CalendarPage;
