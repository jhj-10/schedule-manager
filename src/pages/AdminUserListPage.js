import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchUserListAdmin } from "../services/userService";
import "../lib/AdminPage.css";

function AdminUserListPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userList, setUserList] = useState([]); // 사용자 리스트
  const [filteredUserList, setFilteredUsers] = useState([]); // 검색 조건에 맞춰 필터링된 사용자 리스트
  const [visible, setVisible] = useState(true); // 화면크기에 따른 항목 on/off
  const pageRef = useRef(null);

  // 사용자 검색
  const handleUserSearch = () => {
    const userListElement = pageRef.current;
    if (!userListElement) {
      console.error("userList element not found.");
      return;
    }

    const searchValue =
      userListElement.querySelectorAll(".admin-search")[0].value;

    const filterResult = searchValue
      ? userList.filter(
          (user) =>
            user.name.includes(searchValue.toLowerCase()) ||
            user.email.includes(searchValue.toLowerCase())
        )
      : userList;

    setFilteredUsers(filterResult);
  };

  // 화면 크기(가로)에 따라 항목 on/off
  useEffect(() => {
    const checkWindowWidth = () => {
      const windowWidth = window.innerWidth < 650;
      if (!windowWidth) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    checkWindowWidth();
    // `resize` 이벤트 리스너
    window.addEventListener("resize", checkWindowWidth);
    return () => {
      // 컴포넌트 언마운트 시 리스너 제거
      window.removeEventListener("resize", checkWindowWidth);
    };
  }, [location]);

  // 사용자 정보 페이지로 이동
  const handleUserInfoClick = (userId) => {
    navigate(`/admin/user/${userId}`);
  };

  // 사용자 등록 페이지로 이동
  const handleUserAddClick = () => {
    navigate(`/admin/user/new`);
  };

  // 사용자 목록 가져오기
  useEffect(() => {
    const getUsers = async () => {
      try {
        const users = await fetchUserListAdmin();
        setUserList(users);
        setFilteredUsers(users);
      } catch (error) {
        console.error("사용자 목록 불러오기 실패:", error);
      }
    };
    getUsers(); // API 호출 실행
  }, []);

  return (
    <div ref={pageRef} style={{ height: "100%", overflow: "auto" }}>
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
            {visible && (
              <p className="admin-search-result ">{`(${filteredUserList.length} / ${userList.length} 건)`}</p>
            )}
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
            <div className="email">계정아이디</div>
            <div className="dataCell">부서</div>
            <div className="dataCell">직급</div>
            <div className="dataCell">재직상태</div>
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
                  <div className="email">
                    {visible ? user.email : user.email.split("@")[0]}
                  </div>
                  <div className="dataCell">{user.department}</div>
                  <div className="dataCell">{user.position}</div>
                  <div className="dataCell">{user.status}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserListPage;
