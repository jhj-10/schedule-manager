import React, { useEffect, useState } from "react";
import "../lib/UserInfoView.css";
import { useLocation } from "react-router-dom";
import { fetchUserInfo } from "../services/userService";

function UserInfoViewPage() {
  const location = useLocation();
  const userId = location.state.userid;
  const [initialValues, setInitialValues] = useState({
    // form 입력값 객체
    name: "",
    department: "",
    position: "",
    phone: "",
    email: "",
    email_sub: "",
    joinDt: "",
    status: "",
  });

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfo = await fetchUserInfo(userId);
        setInitialValues({
          name: userInfo.name || "",
          department: userInfo.department || "",
          position: userInfo.position || "",
          phone: userInfo.phone || "",
          email: userInfo.email || "",
          email_sub: userInfo.email_sub || "",
          joinDt: userInfo.joinDt || "",
          status: userInfo.status || "",
        });
      } catch (error) {
        console.error("There was an error fetching the userInfo!", error);
      }
    };

    fetchData();
  }, [userId, location]);

  return (
    <div className="form-container">
      <div className="form-title">+ 개인 정보 보기</div>
      <div className="form-contents">
        <div className="flex-row">
          <div className="attributes">이름</div>
          <div className="form-item underline">{initialValues.name}</div>
        </div>
        <div className="flex-row">
          <div className="attributes">부서</div>
          <div className="form-item underline">{initialValues.department}</div>
        </div>
        <div className="flex-row">
          <div className="attributes">직책</div>
          <div className="form-item underline">{initialValues.position}</div>
        </div>
        <div className="flex-row">
          <div className="attributes">핸드폰</div>
          <div className="form-item underline">{initialValues.phone}</div>
        </div>
        <div className="flex-row">
          <div className="attributes">이메일</div>
          <div className="form-item underline">{initialValues.email}</div>
        </div>
        <div className="flex-row">
          <div className="attributes">개인이메일</div>
          <div className="form-item underline">{initialValues.email_sub}</div>
        </div>
        <div className="flex-row">
          <div className="attributes">입사일</div>
          <div className="form-item underline">{initialValues.joinDt}</div>
        </div>
        <div className="flex-row">
          <div className="attributes">재직상태</div>
          <div className="form-item underline">{initialValues.status}</div>
        </div>
      </div>
    </div>
  );
}

export default UserInfoViewPage;
