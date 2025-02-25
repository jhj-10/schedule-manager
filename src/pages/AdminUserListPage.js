import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../lib/AdminPage.css";

import EditUserInfo from "./EditUserInfo";
import AddUser from "./AddUser";
import { fetchUserListAdmin } from "../services/userService";

function AdminUserListPage() {
  const navigate = useNavigate();

  const [userList, setUserList] = useState([]);
  const [filteredUserList, setFilteredUsers] = useState([]);
  const [view, setView] = useState("userList");
  const [infoViewUserId, setInfoViewUserId] = useState(null);
  const [visible, setVisible] = useState(true);
  const pageRef = useRef(null);

  // console.log("AdminUserListPage view:", view);

  const handleUserSearch = () => {
    const userListElement = pageRef.current;
    if (!userListElement) {
      console.error("userList element not found.");
      return;
    }

    const searchValue =
      userListElement.querySelectorAll(".admin-search")[0].value;
    // console.log("searchValue:", searchValue);

    const filterResult = searchValue
      ? userList.filter(
          (user) =>
            user.name.includes(searchValue.toLowerCase()) ||
            user.email.includes(searchValue.toLowerCase())
        )
      : userList;

    setFilteredUsers(filterResult);
  };

  const handlePageView = (view, userId) => {
    setView(view);
    setInfoViewUserId(userId);
  };

  // 유저 정보 페이지로 이동
  const handleUserInfoClick = (userId) => {
    navigate(`/admin/user/${userId}`);
  };

  // 유저 등록 페이지로 이동
  const handleUserAddClick = () => {
    navigate(`/admin/user/new`);
  };

  const handleCancle = () => {
    setView("userList");
  };

  const loadPage = (view) => {
    if (view === "userInfo")
      return (
        <EditUserInfo funnels={"adminPage"} infoViewUserId={infoViewUserId} />
      );
    if (view === "addUser")
      return <AddUser onCancle={handleCancle} userList={userList} />;
  };

  // // 창 크기 변경 핸들러
  // const handleResize = () => {
  //   setVisible(window.innerWidth >= 650);
  // };

  // 사용자 목록 가져오기
  const getUsers = async () => {
    try {
      const users = await fetchUserListAdmin();
      setUserList(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error("사용자 목록 불러오기 실패:", error);
    }
  };

  // useEffect에서 API 호출 및 이벤트 리스너 등록
  useEffect(() => {
    getUsers(); // API 호출 실행
    // window.addEventListener("resize", handleResize);

    // return () => {
    //   window.removeEventListener("resize", handleResize);
    // };
  }, []);

  return (
    <div ref={pageRef} style={{ height: "100%", overflow: "auto" }}>
      {view === "userList" && (
        <div className="admin-container">
          <h3 className="admin-title">사원정보</h3>
          <div className="flex-row admin-search-add-bar">
            <div>
              <input
                className="admin-search"
                name="search"
                placeholder="이름 또는 이메일 검색"
              ></input>
              <button className="admin-search" onClick={handleUserSearch}>
                검색
              </button>

              <p className="admin-search-result ">{`(${filteredUserList.length} / ${userList.length} 건)`}</p>
            </div>
            <button
              className="admin-add-button confirm"
              onClick={() => handleUserAddClick()}
            >
              {window.innerWidth < 650 ? "등록" : "사원등록"}
            </button>
            {/* <button className="user-search-result cursor-point">상세검색</button> */}
          </div>
          <div className="data-table">
            <div className="th">
              <div className="dataCell">이름</div>
              <div className="email">이메일</div>
              <div className="dataCell">부서</div>
              <div className="dataCell">직급</div>
              {visible && <div className="dataCell">재직상태</div>}
            </div>
            <div>
              {filteredUserList &&
                filteredUserList.map((user) => (
                  <div
                    className="tr"
                    key={user.id}
                    onClick={() => handleUserInfoClick(user.id)}
                  >
                    <div className="dataCell">{user.name}</div>
                    <div className="email">{user.email}</div>
                    <div className="dataCell">{user.department}</div>
                    <div className="dataCell">{user.position}</div>
                    {visible && <div className="dataCell">{user.status}</div>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {loadPage(view)}
    </div>
  );
}

export default AdminUserListPage;
