import { useEffect, useRef, useState } from "react";
import "../lib/AdminPage.css";
import axios from "axios";
import EditUserInfo from "./EditUserInfo";
import AddUser from "./AddUser";

function AdminUserListPage({ endPoint }) {
  const END_POINT = endPoint || "";

  const [userList, setUserList] = useState([]);
  const [filteredUserList, setFilteredUsers] = useState([]);
  const [view, setView] = useState("userList");
  const [infoViewUserId, setInfoViewUserId] = useState(null);
  const [visible, setVisible] = useState(true);
  const pageRef = useRef(null);

  console.log("AdminUserListPage view:", view);

  const handleUserSearch = () => {
    const userListElement = pageRef.current;
    if (!userListElement) {
      console.error("userList element not found.");
      return;
    }

    const searchValue =
      userListElement.querySelectorAll(".admin-search")[0].value;
    console.log("searchValue:", searchValue);

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

  const handleCancle = () => {
    setView("userList");
  };

  const loadPage = (view) => {
    if (view === "userInfo")
      return (
        <EditUserInfo
          funnels={"adminPage"}
          infoViewUserId={infoViewUserId}
          endPoint={END_POINT}
        />
      );
    if (view === "addUser")
      return (
        <AddUser
          onCancle={handleCancle}
          userList={userList}
          endPoint={END_POINT}
        />
      );
  };

  useEffect(() => {
    const handleResize = () => {
      const validate = window.innerWidth < 650 ? false : true;
      setVisible(validate);
    };

    axios
      .get(`${END_POINT}/api/users?auth=admin`, { withCredentials: true })
      .then((response) => {
        console.log("userList response:", response);
        setUserList(response.data);
        setFilteredUsers(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the userList!", error);
      });

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [END_POINT]); // Include END_POINT as a dependency

  // useEffect(() => {
  //   axios
  //     .get(`${END_POINT}/api/users?auth=admin`)
  //     .then((response) => {
  //       console.log("userList response:", response);
  //       setUserList(response.data);
  //       setFilteredUsers(response.data);
  //       console.log("userList:", userList);
  //     })
  //     .catch((error) => {
  //       console.error("There was an error fetching the userList!", error);
  //     });

  //   const validate = window.innerWidth < 650 ? false : true;
  //   setVisible(validate);
  // }, [window.innerWidth]);

  return (
    <div ref={pageRef} style={{ height: "100%", overflow: "auto" }}>
      {view === "userList" && (
        <div className="admin-container">
          <h3 className="admin-title">사원정보</h3>
          <div className="admin-search-add-bar">
            <div>
              <input
                className="admin-search"
                name="search"
                placeholder="이름 또는 이메일 검색"
              ></input>
              <button
                className="admin-search-button"
                onClick={handleUserSearch}
              >
                검색
              </button>

              <p className="admin-search-result ">{`(${filteredUserList.length} / ${userList.length} 건)`}</p>
            </div>
            <button
              className="admin-add-button confirm"
              onClick={() => handlePageView("addUser", 0)}
            >
              {window.innerWidth < 650 ? "등록" : "사원등록"}
            </button>
            {/* <button className="user-search-result cursor-point">상세검색</button> */}
          </div>
          <div>
            <div className="th">
              <div className="row dataCell">이름</div>
              <div className="row email">이메일</div>
              <div className="row dataCell">부서</div>
              <div className="row dataCell">직급</div>
              {visible && <div className="row dataCell">재직상태</div>}
            </div>
            <div>
              {filteredUserList &&
                filteredUserList.map((user) => (
                  <div
                    className="tr"
                    key={user.id}
                    onClick={() => handlePageView("userInfo", user.id)}
                  >
                    <div className="row dataCell">{user.name}</div>
                    <div className="row email">{user.email}</div>
                    <div className="row dataCell">{user.department}</div>
                    <div className="row dataCell">{user.position}</div>
                    {visible && (
                      <div className="row dataCell">{user.status}</div>
                    )}
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
