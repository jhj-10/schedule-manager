import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../lib/UserInfo.css";
import axios from "axios";
import { UserColors } from "../lib/UserColors";

function UserInfo({ users, endPoint }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const END_POINT = endPoint;

  const [userList, setUserList] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [visibleMenu, setVisibleMenu] = useState(null);
  const [colorset, setColorset] = useState([]);

  console.log("user:", user);
  console.log("userinfo userList:", users);
  const COLORS = UserColors;

  const handleEditUserinfo = () => {
    navigate("/user/userinfo");
  };

  const handleCheckboxChange = (e) => {
    const value = e.target.value;

    console.log("handleCheckboxChange.e: ", e.target.value);
    if (e.target.checked) {
      setSelectedUsers([...selectedUsers, value]);
    } else {
      setSelectedUsers(selectedUsers.filter((user) => user !== value));
    }
  };
  console.log("selectedUsers:", selectedUsers);

  const handleMenuToggle = (userId) => {
    console.log("handleMenuToggle:", visibleMenu, userId);
    if (visibleMenu === userId) {
      setVisibleMenu(null); // Close the menu if already open
    } else {
      setVisibleMenu(userId); // Open the menu for the clicked button
    }
    console.log("handleMenuToggle:", visibleMenu, userId);
  };

  const handleClickColorBox = (userId, color) => {
    console.log("colorset before:", colorset);
    console.log("handleClickColorBox: ", userId, color);
    for (const element of colorset) {
      if (element.colorUserId === userId) element.colorCd = color;
    }
    setColorset(colorset);

    const colorsetData = {
      userId: user.id,
      colorUserId: userId,
      colorCd: color,
    };
    for (const element of userList) {
      if (element.id === userId) {
        if (!element.color_user_id) {
          axios
            .post(`${END_POINT}api/users/colorset`, colorsetData)
            .then((response) => {
              console.log("Create colorset response:", response);
              setColorset(response.data);
            })
            .catch((error) => {
              console.error("There was an error create colorset!", error);
            });
        } else {
          axios
            .put(`${END_POINT}api/users/colorset`, colorsetData)
            .then((response) => {
              console.log("update colorset response:", response);
              setColorset(response.data);
            })
            .catch((error) => {
              console.error("There was an error update colorset!", error);
            });
        }
      }
      setUserList(userList);
    }

    console.log("colorset after:", colorset);
  };

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
  }, [menuRef]);

  const usersColor = userList.map((user) => {
    const colorUserId = user.color_user_id ? user.color_user_id : user.id;
    const colorCd = user.color_cd
      ? user.color_cd
      : COLORS[(COLORS.length % colorUserId) + 2];
    return {
      colorUserId: colorUserId,
      colorCd: colorCd,
    };
  });

  useEffect(() => {
    setUserList(users);
    setColorset(usersColor);
  }, [users]);

  // useEffect(() => {
  //   axios
  //     .post(`http://localhost:5000/api/users/colorset?userId=${user.id}`)
  //     .then((response) => {
  //       console.log("users colorset response:", response);
  //       setColorset(response.data);
  //     })
  //     .catch((error) => {
  //       console.error("There was an error fetching the users colorset!", error);
  //     });
  //   console.log("colorset:", colorset);
  // }, []);

  return (
    <div className="userInfo-container visible">
      <div className="ui-user">
        <p>
          <strong>{user.name}</strong>
          <br />
          <span>({user.email})</span>
        </p>

        <button className="btn-userInfo ui-btn" onClick={handleEditUserinfo}>
          개인정보수정
        </button>
      </div>

      <hr />
      <div
        className="btn-checkReset ui-btn"
        onClick={() => {
          setSelectedUsers();
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
                  style={{ accentColor: `${user.color_cd}` }}
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
  );
}

export default UserInfo;
