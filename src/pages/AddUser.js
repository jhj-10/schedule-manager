import React, { useContext, useEffect, useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import { createUser, searchUsers, sendEmail } from "../services/userService";
import {
  validateAltumAccount,
  validateChangePassword,
  validateGmail,
  validatePhone,
  validateName,
} from "../services/validate";

// YYYY-MM-DD 형태의 문자열로 표기
const today = () => {
  let [year, month, day] = new Date().toLocaleString().split(". ");
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
};

function AddUser() {
  // 로그인 객체
  const { user } = useContext(AuthContext);
  // 페이지 이동
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false); // 확인창 on/off
  const [showCompletion, setShowCompletion] = useState(false); // 사용자등록완료 창 on/off
  const [emailSendResult, setEmailSendResult] = useState(0); // 이메일 전송결과
  const [completionEmail, setCompletionEmail] = useState(""); // 이메일 전송할 주소
  const [userList, setUserList] = useState([]); // 사용자 리스트

  // 사용자정보 객체
  const [initialValues, setInitialValues] = useState({
    name: "",
    password: "",
    phone: "",
    email_sub: "",
    email: "",
    emailId: "",
    position: "",
    department: "",
    authority: "guest",
    status: "재직",
    subemail: "",
    joinDt: today(),
  });

  // 사용자 정보 입력값 검증
  function validate(values) {
    const errors = {};
    let err = "";

    err = validatePhone(values.phone); // 핸드폰 번호 유효성 검사
    if (err) errors.phone = err;

    err = validateChangePassword(values.password); // 비밀번호 유효성 검사
    if (err) errors.password = err;

    err = validateGmail(values.subemail); // Gmail 아이디 검증
    if (err) errors.subemail = err;

    err = validateAltumAccount(values.emailId, userList); // emailId 검증
    if (err) errors.emailId = err;

    err = validateName(values.name); // 이름 검증
    if (err) errors.name = err;

    if (!values.position) {
      errors.position = "직책을 선택하세요."; // 직책 입력 검증
    }
    if (!values.department) {
      errors.department = "부서를 선택하세요."; // 부서 입력 검증
    }

    return errors;
  }

  // 사용자 추가 실행
  const handleConfirm = () => {
    // console.log("initialValues:", initialValues);
    try {
      const data = createUser(initialValues);
      if (data) {
        setShowConfirm(false);
        setShowCompletion(true);
      } else {
        console.log("There was an error create the user!");
      }
    } catch (error) {
      console.error("There was an error create the user!", error);
    }

    setShowConfirm(false);
    setShowCompletion(true);
    setCompletionEmail(initialValues.email_sub);
  };

  // 모달창 > 삭제버튼 클릭 > 취소 => 모달창 닫기
  const handleCancle = (e) => {
    // console.log("handleCancle event:", e);
    const { innerText } = e.target;
    e.preventDefault();
    setShowConfirm(false);
    setShowCompletion(false);
    setEmailSendResult(0);
    if (innerText === "추가등록") {
      setInitialValues({
        name: "",
        password: "",
        phone: "",
        email_sub: "",
        email: "",
        emailId: "",
        position: "",
        department: "",
        authority: "guest",
        status: "재직",
        subemail: "",
        joinDt: today(),
      });
    }
    if (innerText === "확인") {
      navigate("/admin");
      // navigate("/admin", { state: { triggerFunction: true } });
    }
  };

  const handleInputChange = (event) => {
    setCompletionEmail(event.target.value);
  };

  const checkSpecialChar = (str) => {
    if (str.includes("@") || str.includes(".")) {
      return str.replaceAll("@", "@&#8203;").replaceAll(".", ".&#8203;");
    }
    return str;
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    // console.log("handleEmailSubmit completionEmail: ", completionEmail);
    // Validate email (basic check)
    if (!completionEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    // console.log("user.email:", user.email);
    const emailData = {
      file: "WelcomeEmail",
      toEmail: completionEmail,
      subject: "Alutmpartners 계정 생성 안내",
      fromEmail: user.email,
      name: initialValues.name,
      email: checkSpecialChar(initialValues.email),
      password: checkSpecialChar(initialValues.password),
    };

    // console.log("handleEmailSubmit emailData: ", emailData);

    try {
      const result = await sendEmail(emailData);
      // console.log("result:", result.status);
      if (result.status === 200) {
        // alert("Welcome email sent successfully!");
        setEmailSendResult(1);
      } else {
        alert("An error occurred while sending the email.");
        setEmailSendResult(2);
      }
    } catch (error) {
      alert("An error occurred while sending the email.");
      setEmailSendResult(2);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // setLoading(true); // Set loading true at start of fetch
      try {
        const accountEmails = await searchUsers();
        setUserList(accountEmails);
      } catch (error) {
        console.error("Error fetching Accounts:", error);
      }
    };

    fetchData(); // Run fetchData on every `selectedUsers` change
  }, []);

  return (
    <div className="form-container">
      <div className="form-title">+ 사원 등록</div>
      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validate={validate}
        onSubmit={(values, { setSubmitting }) => {
          const userInfoData = {
            ...values,
            email: values.emailId + "@altumpartners.co.kr",
            email_sub: values.subemail + "@gmail.com",
          };
          // 유효성 검사가 성공했을 때만 확인 모달을 띄운다.
          // console.log("values:", values);
          setShowConfirm(true);
          setInitialValues(userInfoData);
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
          <Form className="form-contents" onSubmit={handleSubmit}>
            <div className="flex-row">
              <label htmlFor="name" className="attributes">
                이름
              </label>
              <div className="form-item">
                <Field
                  className="form-field"
                  type="text" // It's better to use "text" and apply validation for numbers
                  name="name"
                  placeholder="이름을 입력하세요.(한글 또는 영문)"
                  // style={window.innerWidth < 650 ? {} : { width: "250px" }}
                />
                <ErrorMessage
                  className="error-message"
                  name="name"
                  component="div"
                />
              </div>
            </div>
            <div className="flex-row">
              <label htmlFor="password" className="attributes">
                비밀번호
              </label>
              <div className="form-item">
                <Field
                  name="password"
                  className="form-field"
                  placeholder="비밀번호를 입력하세요."
                  // style={window.innerWidth < 650 ? {} : { width: "250px" }}
                />
                <br />
                <ErrorMessage
                  className="error-message"
                  name="password"
                  component="div"
                />
              </div>
            </div>
            <div className="flex-row">
              <label htmlFor="position" className="attributes">
                직책
              </label>
              <div className="form-item">
                <select
                  name="position"
                  value={values.position}
                  onChange={handleChange}
                  className="form-field"
                  // style={window.innerWidth < 650 ? {} : { width: "250px" }}
                >
                  <option value="" label="― 직책을 선택하세요."></option>
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
                <ErrorMessage
                  className="error-message"
                  name="position"
                  component="div"
                />
              </div>
            </div>
            <div className="flex-row">
              <label htmlFor="department" className="attributes">
                부서
              </label>
              <div className="form-item">
                <select
                  name="department"
                  value={values.department}
                  onChange={handleChange}
                  className="form-field"
                  // style={window.innerWidth < 650 ? {} : { width: "250px" }}
                >
                  <option value="" label="― 부서를 선택하세요."></option>
                  <option value="컨설팅" label="컨설팅">
                    컨설팅
                  </option>
                  <option value="개발" label="개발">
                    개발
                  </option>
                </select>
                <ErrorMessage
                  className="error-message"
                  name="department"
                  component="div"
                />
              </div>
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
                  // style={window.innerWidth < 650 ? {} : { width: "250px" }}
                />
                <ErrorMessage
                  className="error-message"
                  name="phone"
                  component="div"
                />
              </div>
            </div>
            <div className="flex-row">
              <label htmlFor="emailId" className="attributes">
                이메일
              </label>
              <div className="form-item ">
                <div className="form-field flex-row">
                  <Field
                    name="emailId"
                    style={{
                      border: "none",
                      padding: "0",
                    }}
                    // style={window.innerWidth < 650 ? {} : { width: "250px" }}
                  />
                  <div
                    style={{
                      textAlign: "right",
                      verticalAlign: "middle",
                      color: "#7d7d7d",
                    }}
                  >
                    @altumpartners.co.kr
                  </div>
                </div>
                <ErrorMessage
                  className="error-message"
                  name="emailId"
                  component="div"
                />
              </div>
            </div>
            <div className="flex-row">
              <label htmlFor="subemail" className="attributes">
                개인이메일
              </label>
              <div className="form-item">
                <div className="form-field flex-row">
                  <Field
                    name="subemail"
                    style={{
                      marginRight: "10px",
                      border: "none",
                      padding: "0",
                    }}
                    // style={window.innerWidth < 650 ? {} : { width: "250px" }}
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

            <div className="flex-row">
              <label htmlFor="a" className="attributes">
                권한
              </label>
              <div className="form-item">
                <select
                  name="authority"
                  value={values.authority} // Formik values에서 상태값을 가져옴
                  onChange={handleChange} // Formik의 handleChange 함수 연결
                  className="form-field"
                  // style={window.innerWidth < 650 ? {} : { width: "250px" }}
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
            <div className="flex-row">
              <label htmlFor="joinDt" className="attributes">
                입사일
              </label>
              <div className="form-item">
                <Field
                  name="joinDt"
                  type="date"
                  value={values.joinDt}
                  className="form-field"
                  // style={window.innerWidth < 650 ? {} : { width: "250px" }}
                />
                <ErrorMessage
                  className="error-message"
                  name="joinDt"
                  component="div"
                />
              </div>
            </div>
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
                  <div>사원 정보를 저장하시겠습니까?</div>
                  <button className="modal-btn cancle" onClick={handleCancle}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="modal-btn confirm"
                    onClick={handleConfirm}
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
            {showCompletion && (
              <div className="overlay">
                <div
                  className="content confirm-dialog"
                  style={
                    window.innerWidth < 650
                      ? { maxWidth: "500px" }
                      : { width: "500px" }
                  }
                >
                  <h3>사용자 등록 완료</h3>
                  <div className="add-userInfo-box">
                    <div className="add-userInfo-row">
                      <span className="add-userinfo-attribute">이름</span>
                      <span className="add-userinfo-values">
                        {initialValues.name}
                      </span>
                    </div>
                    <div className="add-userInfo-row">
                      <span className="add-userinfo-attribute">이메일</span>
                      <span className="add-userinfo-values">
                        {initialValues.email}
                      </span>
                    </div>
                    <div className="add-userInfo-row">
                      <span className="add-userinfo-attribute">비밀번호</span>
                      <span className="add-userinfo-values">
                        {initialValues.password}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p>계정 생성 안내 메일 발송</p>
                    <div className="addUser-email-form">
                      <input
                        value={completionEmail}
                        onChange={handleInputChange}
                        type="email"
                        placeholder="사원 정보에 등록한 지메일 주소를 입력하세요."
                        className="addUser-email-inputBox"
                      />
                      <button
                        type="submit"
                        className="addUser-email-submit-btn confirm"
                        onClick={handleEmailSubmit}
                      >
                        보내기
                      </button>
                    </div>
                    <div className="addUser-email-result">
                      {}
                      {emailSendResult === 1 && (
                        <div className="success">
                          * 메일이 정상적으로 전송되었습니다.
                        </div>
                      )}
                      {emailSendResult === 2 && (
                        <div className="fail">
                          * 메일 전송이 정상적으로 실행되지 않았습니다. 메일
                          주소를 확인해주세요.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <button className="modal-btn cancle" onClick={handleCancle}>
                      확인
                    </button>
                    <button
                      className="modal-btn confirm"
                      onClick={handleCancle}
                    >
                      추가등록
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default AddUser;
