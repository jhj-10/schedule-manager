import React, { useEffect, useState } from "react";
// import { AuthContext } from "../context/AuthContext";
import "../lib/UserInfoView.css";

function UserInfoViewPage({ infoViewUser }) {
  // const { user } = useContext(AuthContext);
  const [initialValues, setInitialValues] = useState(infoViewUser);

  // console.log("initialValues:", initialValues);

  // const userVerification = user.id === initialValues.id ? true : false;

  useEffect(() => {
    setInitialValues(infoViewUser);
  }, [infoViewUser]);

  return (
    <div className="userInfoView-container">
      <div className="userinfo-title">+ 개인 정보 보기</div>
      <div className="userinfo-contents">
        <div className="userinfo-contents-row row-margin">
          <div className="userinfo-attribute">이름</div>
          <div className="userinfo-values">{initialValues.name}</div>
        </div>
        <div className="userinfo-contents-row row-margin">
          <div className="userinfo-attribute">부서</div>
          <div className="userinfo-values">{initialValues.department}</div>
        </div>
        <div className="userinfo-contents-row row-margin">
          <div className="userinfo-attribute">직책</div>
          <div className="userinfo-values">{initialValues.position}</div>
        </div>
        <div className="userinfo-contents-row row-margin">
          <div className="userinfo-attribute">핸드폰</div>
          <div className="userinfo-values">{initialValues.phone}</div>
        </div>
        <div className="userinfo-contents-row row-margin">
          <div className="userinfo-attribute">이메일</div>
          <div className="userinfo-values">{initialValues.email}</div>
        </div>
        <div className="userinfo-contents-row row-margin">
          <div className="userinfo-attribute">개인이메일</div>
          <div className="userinfo-values">{initialValues.email_sub}</div>
        </div>
      </div>
    </div>
  );
}

export default UserInfoViewPage;
