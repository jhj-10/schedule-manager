import React, { useContext, useEffect, useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import {
  validateChangePassword,
  validateGmail,
  validatePassword,
  validatePhone,
} from "../services/validate";
import { fetchUserInfo, updateUser } from "../services/userService";
import { AuthContext } from "../context/AuthProvider";
import "../lib/FormPage.css";
import { useParams } from "react-router-dom";

function EditUserInfo() {
  const { user } = useContext(AuthContext);
  const currentURL = window.location.href; // url경로
  const { id } = useParams();

  const [initialValues, setInitialValues] = useState({
    // form 입력값 객체
    name: "",
    phone: "",
    checkPassword: "",
    changePassword: "",
    subemail: "",
    position: "",
    department: "",
    joinDt: "",
    quitDt: "",
    status: "",
  });
  const [isPwChange, setIsPwChange] = useState(false); // 변화여부
  const [showConfirm, setShowConfirm] = useState(false); // 확인창 on/off
  const [showFinConfirm, setShowFinConfirm] = useState(false); // 결과창 on/off
  const [showPassword, setShowPassword] = useState(false); // 비밀번호 보기
  const [updateUserInfo, setUpdateUserInfo] = useState(null); // 사용자 정보 객체
  // const [reload, setReload] = useState(false);
  const [status, setStatus] = useState("");
  // const [quitDt, setQuitDt] = useState(null);

  const isAdmin = currentURL.includes("/admin") ? true : false; // 관리자 페이지 여부 확인
  const userId = isAdmin ? id : ""; // 열람한 정보의 대상 사용자ID
  // const user_Id = isAdmin ? currentURL.split("/")[5] : ""; // 열람한 정보의 대상 사용자ID

  // 비밀번호 변경
  const handleEditPassword = (e) => {
    e.preventDefault();
    setIsPwChange(!isPwChange);
  };

  // 비밀번호 보기
  const handleVisiblePassword = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  // 입력값 유효성 체크
  function validate(values) {
    const errors = {};
    let err = "";
    // console.log("values:", values);
    // 핸드폰 번호 유효성 검사
    err = validatePhone(values.phone);
    if (err) errors.phone = err;

    // 비밀번호 유효성 검사
    err = validatePassword(values.password, values.checkPassword);
    if (err) errors.checkPassword = err;
    if (isPwChange) {
      err = validateChangePassword(values.changePassword);
      if (err) errors.changePassword = err;
    }

    // Gmail 아이디 검증
    err = validateGmail(values.subemail);
    if (err) errors.subemail = err;

    if (values.status === "퇴사") {
      setStatus("퇴사");
    } else {
      setStatus(values.status);
      values.quitDt = null;
    }

    return errors;
  }

  // 사용자 정보 수정
  const handleConfirm = async () => {
    // console.log("updateUserInfo:", updateUserInfo);
    try {
      await updateUser(updateUserInfo);
      setIsPwChange(false);
      setShowConfirm(false);
      setShowPassword(false);
      setInitialValues(() => ({
        ...updateUserInfo,
        checkPassword: "", // 특정 필드만 초기화
      }));
      setIsPwChange(false);
      setUpdateUserInfo(null);
      setShowFinConfirm(true);
    } catch (error) {
      console.error("There was an error update the userInfo!", error);
    }
  };

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfo = await fetchUserInfo(isAdmin ? userId : user.id); // Use the service function
        setStatus(userInfo.status);
        setInitialValues({
          ...userInfo,
          checkPassword: isAdmin ? userInfo.password : "",
          subemail: userInfo.email_sub ? userInfo.email_sub.split("@")[0] : "",
          joinDt: userInfo.join_dt || "",
          quitDt: userInfo.quit_dt || "",
        });
      } catch (error) {
        console.error("There was an error fetching the userInfo!", error);
      }
    };

    fetchData(); // Call the function to fetch data when the effect runs
  }, [userId, user.id, isAdmin]);

  // 모달창 > 삭제버튼 클릭 > 취소 => 모달창 닫기
  const handleCancle = (confirm) => {
    // e.preventDefault();
    if (confirm === "confirm") {
      setShowFinConfirm(false);
    }
    setShowConfirm(false);
  };

  // const hadleSaveData = (e) => {
  //   e.preventDefault();
  //   setShowConfirm("none");
  // };

  return (
    <div className="form-container">
      <div className="form-title">+ 개인 정보 수정</div>
      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validate={validate}
        onSubmit={(values, { setSubmitting }) => {
          const userInfoData = {
            ...values,
            password:
              isPwChange && values.changePassword
                ? values.changePassword
                : values.checkPassword,
            email_sub: values.subemail + "@gmail.com",
          };

          // 유효성 검사가 성공했을 때만 확인 모달을 띄운다.
          setUpdateUserInfo(userInfoData);
          setShowConfirm(true); // 모달 먼저 띄우기

          setTimeout(() => {
            // console.log("제출 완료!");
            setSubmitting(false); // Formik 상태를 나중에 리셋
          }, 2000);
        }}
      >
        {({
          handleSubmit,
          isSubmitting,
          errors,
          touched,
          values,
          handleChange,
        }) => (
          <Form className="form-contents" onSubmit={handleSubmit}>
            <div className="flex-row">
              <label htmlFor="name" className="attributes">
                이름
              </label>

              {isAdmin ? (
                <div className="form-item">
                  <Field
                    className="form-field"
                    type="text"
                    name="name"
                    value={values.name || ""}
                    onChange={handleChange}
                    // style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  />
                  <ErrorMessage
                    className="error-message"
                    name="name"
                    component="div"
                  />
                </div>
              ) : (
                <div className="form-item">{initialValues.name}</div>
              )}
            </div>
            {!isAdmin && (
              <div className="flex-row">
                <label htmlFor="checkPassword" className="attributes">
                  비밀번호
                </label>
                <div className="form-item">
                  <div className="flex-row" style={{ justifyContent: "left" }}>
                    <div style={{ marginRight: "10px" }}>
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="checkPassword"
                        className="form-field"
                        placeholder="비밀번호를 입력하세요."
                        // style={
                        //   window.innerWidth < 650
                        //     ? { marginRight: "10px" }
                        //     : { width: "230px" }
                        // }
                      />
                      <br />
                      <ErrorMessage
                        className="error-message"
                        name="checkPassword"
                        component="div"
                      />
                    </div>
                    {isPwChange && (
                      <div className="" disabled={!isPwChange}>
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="changePassword"
                          className="form-field"
                          placeholder="변경 할 비밀번호를 입력하세요."
                          // style={
                          //   window.innerWidth < 650 ? {} : { width: "230px" }
                          // }
                        />
                        <br />
                        <ErrorMessage
                          className="error-message"
                          name="changePassword"
                          component="div"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      className="btn-change-password"
                      onClick={handleVisiblePassword}
                      style={{
                        marginTop: "5px",
                        marginRight: "5px",
                        width: "55px",
                      }}
                    >
                      {showPassword ? "감추기" : "보기"}
                    </button>

                    <button
                      className="btn-change-password"
                      onClick={handleEditPassword}
                      style={{ marginTop: "5px", marginRight: "5px" }}
                    >
                      {isPwChange ? "비밀번호변경취소" : "비밀번호변경"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex-row">
              <label htmlFor="position" className="attributes">
                직책
              </label>
              {isAdmin ? (
                <div className="form-item">
                  <select
                    name="position"
                    value={values.position}
                    onChange={handleChange}
                    className="form-field"
                    // style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  >
                    <option value="" label="직책을 선택하세요.">
                      직책을 선택하세요
                    </option>
                    <option value="대표이사" label="대표이사">
                      대표이사
                    </option>
                    <option value="이사" label="이사">
                      이사
                    </option>
                    <option value="차장" label="차장">
                      수석
                    </option>
                    <option value="책임" label="책임">
                      책임
                    </option>
                    <option value="선임" label="선임">
                      선임
                    </option>
                  </select>
                </div>
              ) : (
                <div className="form-item">{initialValues.position}</div>
              )}
            </div>
            <div className="flex-row">
              <label htmlFor="department" className="attributes">
                부서
              </label>
              {isAdmin ? (
                <div className="form-item">
                  <select
                    name="department"
                    value={values.department}
                    onChange={handleChange}
                    className="form-field"
                    // style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  >
                    <option value="" label="부서를 선택하세요.">
                      부서를 선택하세요
                    </option>
                    <option value="컨설팅" label="컨설팅">
                      컨설팅
                    </option>
                    <option value="개발" label="개발">
                      개발
                    </option>
                  </select>
                </div>
              ) : (
                <div className="form-item">{initialValues.department}</div>
              )}
            </div>
            <div className="flex-row">
              <label htmlFor="phone" className="attributes">
                핸드폰
              </label>
              <div className="form-item">
                <Field
                  className="form-field"
                  type="text"
                  name="phone"
                  // style={window.innerWidth < 650 ? {} : { width: "230px" }}
                />
                <ErrorMessage
                  className="error-message"
                  name="phone"
                  component="div"
                />
              </div>
            </div>
            <div className="flex-row">
              <label className="attributes">이메일</label>
              <div className="form-item" style={{ verticalAlign: "middle" }}>
                {initialValues.email}
              </div>
            </div>
            <div className="flex-row">
              <label htmlFor="subemail" className="attributes">
                개인이메일
              </label>
              <div className="form-item">
                <div
                  className="form-field flex-row"
                  style={{ alignItems: "center" }}
                >
                  <Field
                    name="subemail"
                    style={{
                      marginRight: "10px",
                      border: "none",
                      padding: "0",
                    }}
                    // style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  />
                  <div
                    style={{
                      textAlign: "right",
                      verticalAlign: "middle",
                      color: "#7d7d7d",
                    }}
                  >
                    @gmail.com
                  </div>
                </div>
                <ErrorMessage
                  className="error-message"
                  name="subemail"
                  component="div"
                />
              </div>
            </div>
            {isAdmin && (
              <div className="flex-row">
                <label htmlFor="authority" className="attributes">
                  권한
                </label>
                <div className="form-item">
                  <select
                    name="authority"
                    value={values.authority} // Formik values에서 상태값을 가져옴
                    onChange={handleChange} // Formik의 handleChange 함수 연결
                    className="form-field"
                    // style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  >
                    <option value="" label="― 권한을 선택하세요."></option>
                    <option value="guest" label="guest">
                      guest
                    </option>
                    <option value="admin" label="admin">
                      admin
                    </option>
                  </select>
                </div>
              </div>
            )}
            {isAdmin && (
              <div className="flex-row">
                <label htmlFor="status" className="attributes">
                  재직상태
                </label>
                <div className="form-item">
                  <select
                    name="status"
                    value={values.status} // Formik values에서 상태값을 가져옴
                    onChange={handleChange} // Formik의 handleChange 함수 연결
                    className="form-field"
                    // style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  >
                    <option value="" label="― 재직상태를 선택하세요."></option>
                    <option value="재직" label="재직">
                      재직
                    </option>
                    <option value="휴직" label="휴직">
                      휴직
                    </option>
                    <option value="퇴사" label="퇴사">
                      퇴사
                    </option>
                  </select>
                </div>
              </div>
            )}
            <div className="flex-row">
              <label htmlFor="joinDt" className="attributes">
                입사일
              </label>
              {isAdmin ? (
                <div className="form-item">
                  <Field
                    className="form-field"
                    name="joinDt"
                    type="date"
                    // style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  />
                  <ErrorMessage
                    className="error-message"
                    name="joinDt"
                    component="div"
                  />
                </div>
              ) : (
                <span className="userinfo-values">{initialValues.joinDt}</span>
              )}
            </div>
            {status === "퇴사" && (
              <div className="flex-row">
                <label htmlFor="quitDt" className="attributes">
                  퇴사일
                </label>
                {isAdmin ? (
                  <div className="form-item">
                    <Field
                      className="form-field"
                      name="quitDt"
                      type="date"
                      // style={window.innerWidth < 650 ? {} : { width: "230px" }}
                    />
                    <ErrorMessage
                      className="error-message"
                      name="quitDt"
                      component="div"
                    />
                  </div>
                ) : (
                  <span className="userinfo-values">
                    {initialValues.quitDt}
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              className="modal-btn confirm"
              disabled={isSubmitting} // Disable if submitting or errors exist
            >
              저장
            </button>
            {showConfirm && (
              <div className="overlay">
                <div className="content confirm-dialog text-center">
                  <div>수정사항을 저장하시겠습니까?</div>
                  <button
                    type="button"
                    className="modal-btn confirm"
                    onClick={handleConfirm}
                  >
                    확인
                  </button>
                  <button
                    className="modal-btn cancle"
                    onClick={() => handleCancle("cancle")}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {showFinConfirm && (
              <div className="overlay">
                <div className="content confirm-dialog text-center">
                  <div>저장되었습니다.</div>
                  <button
                    className="modal-btn confirm"
                    onClick={() => handleCancle("confirm")}
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default EditUserInfo;
