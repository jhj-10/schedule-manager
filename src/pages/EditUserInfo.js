import React, { useEffect, useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import axios from "axios";

function EditUserInfo({ funnels, infoViewUserId, endPoint }) {
  const END_POINT = endPoint;

  const [initialValues, setInitialValues] = useState({});
  const [isPwChange, setIsPwChange] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [updateUserInfo, setUpdateUserInfo] = useState(null);
  const [reload, setReload] = useState(false);
  const [status, setStatus] = useState("");
  // const [quitDt, setQuitDt] = useState(null);

  const isAdmin = funnels === "adminPage" ? true : false;

  const handleEditPassword = (e) => {
    e.preventDefault();
    setIsPwChange(true);
  };

  const handleVisiblePassword = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  function validate(values) {
    const errors = {};

    // console.log("values:", values);
    // 핸드폰 번호 유효성 검사
    if (!values.phone) {
      errors.phone = "핸드폰 번호를 입력하세요.";
    } else if (!/^01([0|1|6|7|8|9])([0-9]{7,8})$/.test(values.phone)) {
      errors.phone = "유효하지 않은 핸드폰 번호입니다. 숫자만 입력하세요.";
    }

    // 비밀번호 유효성 검사
    if (!values.checkPassword) {
      errors.checkPassword = "비밀번호를 입력하세요.";
    } else if (values.checkPassword !== values.password) {
      errors.checkPassword = "비밀번호가 틀립니다.";
    }

    if (isPwChange) {
      if (!values.changePassword) {
        errors.changePassword = "변경 할 비밀번호를 입력하세요.";
      } else if (
        !/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[\W_]).{8,}$/.test(
          values.changePassword
        )
      ) {
        errors.changePassword = `숫자, 특수문자, 영문을 조합하여 
          8자 이상 입력하세요.`;
      }
    }

    // Gmail 아이디 검증
    if (!values.subemail) {
      errors.subemail = "지메일 아이디를 입력하세요.";
    } else if (!/^[a-zA-Z0-9](\.?[a-zA-Z0-9_-]){5,29}$/.test(values.subemail)) {
      errors.subemail = "유효하지 않은 지메일 아이디입니다.";
    }

    if (values.status === "퇴사") {
      setStatus("퇴사");
    } else {
      setStatus(values.status);
      values.quitDt = null;
    }

    return errors;
  }

  const handleConfirm = () => {
    console.log("updateUserInfo:", updateUserInfo);
    axios
      .put(`${END_POINT}/api/user`, updateUserInfo, { withCredentials: true })
      .then(() => {
        setIsPwChange(false);
        setShowConfirm(false);
        setShowPassword(false);
        setReload(!reload);
        setUpdateUserInfo(null);
      })
      .catch((error) => {
        console.error("There was an error update the userInfo!", error);
      });
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(
          `${END_POINT}/api/user/${infoViewUserId}`,
          { withCredentials: true }
        );
        console.log("infoViewUserId:", infoViewUserId);
        const userInfo = response.data[0];
        console.log("userInfo:", userInfo);

        // Set user status and initial values
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

    fetchUserInfo();
  }, [END_POINT, infoViewUserId, isAdmin, reload]);

  // useEffect(() => {
  //   axios
  //     .get(`${END_POINT}/api/user/${infoViewUserId}`)
  //     .then((response) => {
  //       console.log("infoViewUserId:", infoViewUserId);
  //       const userInfo = response.data[0];
  //       console.log("userInfo:", userInfo);
  //       setStatus(userInfo.status);
  //       // setQuitDt(userInfo.quit_dt);
  //       setInitialValues({
  //         ...userInfo,
  //         checkPassword: isAdmin ? userInfo.password : "",
  //         subemail: userInfo.email_sub ? userInfo.email_sub.split("@")[0] : "",
  //         joinDt: userInfo.join_dt ? userInfo.join_dt : "",
  //         quitDt: userInfo.quit_dt ? userInfo.quit_dt : "",
  //       });
  //     })
  //     .catch((error) => {
  //       console.error("There was an error fetching the userInfo!", error);
  //     });
  //   console.log("initialValues:", initialValues);
  // }, [reload]);

  // 모달창 > 삭제버튼 클릭 > 취소 => 모달창 닫기
  const handleCancle = (e) => {
    e.preventDefault();
    setShowConfirm(false);
  };

  // const hadleSaveData = (e) => {
  //   e.preventDefault();
  //   setShowConfirm("none");
  // };

  return (
    <div className="userInfoView-container">
      <div className="userinfo-title">+ 개인 정보 수정</div>
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
          setShowConfirm(true);
          setUpdateUserInfo(userInfoData);
          setSubmitting(false); // Submit 완료 후 비동기 작업이 끝났음을 알림
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
          <Form className="userinfo-contents" onSubmit={handleSubmit}>
            <div className="userinfo-contents-row">
              <label htmlFor="name" className="userinfo-attribute">
                이름
              </label>
              {isAdmin ? (
                <div className="userinfo-values">
                  <Field
                    className="edit-userinfo-box"
                    type="text" // It's better to use "text" and apply validation for numbers
                    name="name"
                    style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  />
                  <ErrorMessage
                    className="error-message"
                    name="name"
                    component="div"
                  />
                </div>
              ) : (
                <span className="userinfo-values">{initialValues.name}</span>
              )}
            </div>
            {!isAdmin && (
              <div className="userinfo-contents-row">
                <label htmlFor="checkPassword" className="userinfo-attribute">
                  비밀번호
                </label>
                <div className="userinfo-values">
                  <Field
                    type={showPassword ? "text" : "password"}
                    name="checkPassword"
                    className="edit-userinfo-box"
                    placeholder="비밀번호를 입력하세요."
                    style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  />
                  <br />
                  <ErrorMessage
                    className="error-message"
                    name="checkPassword"
                    component="div"
                  />
                  {isPwChange && (
                    <div className="userinfo-values" disabled={!isPwChange}>
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="changePassword"
                        className="edit-userinfo-box"
                        placeholder="변경 할 비밀번호를 입력하세요."
                        style={
                          window.innerWidth < 650 ? {} : { width: "230px" }
                        }
                      />
                      <ErrorMessage
                        className="error-message"
                        name="changePassword"
                        component="div"
                        style={{ width: "160px" }}
                      />
                    </div>
                  )}
                  <div>
                    <button
                      className="btn-change-password"
                      onClick={handleVisiblePassword}
                      style={{ marginTop: "5px", marginRight: "5px" }}
                    >
                      보기
                    </button>

                    <button
                      className="btn-change-password"
                      onClick={handleEditPassword}
                      style={{ marginTop: "5px", marginRight: "5px" }}
                    >
                      비밀번호변경
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="userinfo-contents-row">
              <label htmlFor="position" className="userinfo-attribute">
                직책
              </label>
              {isAdmin ? (
                <div className="userinfo-values">
                  <select
                    name="position"
                    value={values.position}
                    onChange={handleChange}
                    className="edit-userinfo-box"
                    style={window.innerWidth < 650 ? {} : { width: "230px" }}
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
                <span className="userinfo-values">
                  {initialValues.position}
                </span>
              )}
            </div>
            <div className="userinfo-contents-row">
              <label htmlFor="department" className="userinfo-attribute">
                부서
              </label>
              {isAdmin ? (
                <div className="userinfo-values">
                  <select
                    name="department"
                    value={values.department}
                    onChange={handleChange}
                    className="edit-userinfo-box"
                    style={window.innerWidth < 650 ? {} : { width: "230px" }}
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
                <span className="userinfo-values">
                  {initialValues.department}
                </span>
              )}
            </div>
            <div className="userinfo-contents-row">
              <label htmlFor="phone" className="userinfo-attribute">
                핸드폰
              </label>
              <div className="userinfo-values">
                <Field
                  className="edit-userinfo-box"
                  type="text"
                  name="phone"
                  style={window.innerWidth < 650 ? {} : { width: "230px" }}
                />
                <ErrorMessage
                  className="error-message"
                  name="phone"
                  component="div"
                />
              </div>
            </div>
            <div className="userinfo-contents-row">
              <label className="userinfo-attribute">이메일</label>
              <span className="userinfo-values">{initialValues.email}</span>
            </div>
            <div className="userinfo-contents-row">
              <label htmlFor="subemail" className="userinfo-attribute">
                개인이메일
              </label>
              <div className="userinfo-values">
                <Field
                  className="userinfo-values edit-userinfo-box"
                  name="subemail"
                  style={window.innerWidth < 650 ? {} : { width: "230px" }}
                />
                <span>@gmail.com</span>
                <ErrorMessage
                  className="error-message"
                  name="subemail"
                  component="div"
                />
              </div>
            </div>
            {isAdmin && (
              <div className="userinfo-contents-row">
                <label htmlFor="status" className="userinfo-attribute">
                  재직상태
                </label>
                <div className="userinfo-values">
                  <select
                    name="status"
                    value={values.status} // Formik values에서 상태값을 가져옴
                    onChange={handleChange} // Formik의 handleChange 함수 연결
                    className="edit-userinfo-box"
                    style={window.innerWidth < 650 ? {} : { width: "230px" }}
                  >
                    <option value="" label="재직상태를 선택하세요.">
                      재직상태를 선택하세요.
                    </option>
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
            <div className="userinfo-contents-row">
              <label htmlFor="subemail" className="userinfo-attribute">
                입사일
              </label>
              {isAdmin ? (
                <div className="userinfo-values">
                  <Field
                    className="edit-userinfo-box"
                    name="joinDt"
                    type="date"
                    style={window.innerWidth < 650 ? {} : { width: "230px" }}
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
              <div className="userinfo-contents-row">
                <label htmlFor="subemail" className="userinfo-attribute">
                  퇴사일
                </label>
                {isAdmin ? (
                  <div className="userinfo-values">
                    <Field
                      className="edit-userinfo-box"
                      name="quitDt"
                      type="date"
                      style={window.innerWidth < 650 ? {} : { width: "230px" }}
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
                  <p>수정사항을 저장하시겠습니까?</p>
                  <button
                    type="button"
                    className="modal-btn confirm"
                    onClick={handleConfirm}
                  >
                    확인
                  </button>
                  <button className="modal-btn cancle" onClick={handleCancle}>
                    취소
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
