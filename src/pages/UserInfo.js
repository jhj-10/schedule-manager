import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UserInfo() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [userList, setUserList] = useState([]);

  console.log("user:", user);
  const colors = ["#fff0c9", "#ffd9c9", "#a9e0eb", "#eccafa", "#f5cbeb"];

  const handleEditUserinfo = () => {
    navigate("/user/userinfo");
  };

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/users?id=${user.id}`)
      .then((response) => {
        console.log("userInfo response:", response);
        setUserList(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the userList!", error);
      });
    console.log("userList:", userList);
  }, []);

  return (
    <div style={styles.container}>
      <p>
        <strong>{user.name}</strong>
        <br />({user.email})
      </p>
      <button onClick={handleEditUserinfo}>수정</button>
      <hr />
      {userList.map((user) => (
        <li key={user.id}>
          {user.name} <button>color</button>
        </li>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#f7f7f7",
    borderRight: "1px solid #ccc",
    height: "100vh",
    width: "200px",
    boxSizing: "border-box",
  },
  logoutButton: {
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#3174ad",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};

export default UserInfo;
