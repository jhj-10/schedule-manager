import React, { useContext, useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const today = () => {
  let [year, month, day] = new Date().toLocaleString().split(". ");
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
};

function AddUser({ onCancle, userList, endPoint }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const END_POINT = endPoint || "";

  const [showConfirm, setShowConfirm] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionEmail, setCompletionEmail] = useState("");

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

  function validate(values) {
    const errors = {};

    // console.log("values:", values);
    // 핸드폰 번호 유효성 검사
    if (!values.phone) {
      errors.phone = "'-' 를 제외한 핸드폰 번호를 입력하세요.";
    } else if (!/^01([0|1|6|7|8|9])([0-9]{7,8})$/.test(values.phone)) {
      errors.phone = "유효하지 않은 핸드폰 번호입니다. 숫자만 입력하세요.";
    }

    // 비밀번호 유효성 검사
    if (!values.password) {
      errors.password = "비밀번호를 입력하세요.";
    } else if (
      !/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[\W_]).{8,}$/.test(values.password)
    ) {
      errors.password = `숫자, 특수문자, 영문을 조합하여 
          8자 이상 입력하세요.`;
    }

    // Gmail 아이디 검증
    if (!values.subemail) {
      errors.subemail = "지메일 아이디를 입력하세요.";
    } else if (!/^[a-zA-Z0-9](\.?[a-zA-Z0-9_-]){5,29}$/.test(values.subemail)) {
      errors.subemail = "유효하지 않은 지메일 아이디입니다.";
    }

    // emailId 검증
    if (!values.emailId) {
      errors.emailId = "회사계정 이메일 아이디를 입력하세요.";
    } else {
      const checkEmailId = userList.find(
        (el) => el.email === `${values.emailId}@altumpartners.co.kr`
      );
      if (!/^[a-zA-Z0-9]{5,}$/.test(values.emailId)) {
        errors.emailId = "유효하지 않은 아이디입니다.";
      } else if (checkEmailId) {
        errors.emailId = "존재하는 이메일 아이디입니다.";
      }
    }

    // 이름 검증
    if (!values.name) {
      errors.name = "이름을 입력하세요.";
    } else if (!/^(?:[가-힣]{2,}|[a-zA-Z]{2,})$/.test(values.name)) {
      errors.name = "이름을 확인하세요.";
    }

    if (!values.position) {
      errors.position = "직책을 선택하세요.";
    }
    if (!values.department) {
      errors.department = "부서를 선택하세요.";
    }

    return errors;
  }

  const handleConfirm = () => {
    console.log("initialValues:", initialValues);
    axios
      .post(`${END_POINT}/api/user`, initialValues, { withCredentials: true })
      .then((response) => {
        const userId = response.data.insertId;
        console.log("Create new User id:", userId);
        setShowConfirm(false);
        setShowCompletion(true);
      })
      .catch((error) => {
        console.error("There was an error create the user!", error);
      });
    setShowConfirm(false);
    setShowCompletion(true);
    setCompletionEmail(initialValues.email_sub);
  };

  // 모달창 > 삭제버튼 클릭 > 취소 => 모달창 닫기
  const handleCancle = (e) => {
    console.log("handleCancle event:", e);
    const innerText = e.target.innerText;
    e.preventDefault();
    setShowConfirm(false);
    setShowCompletion(false);
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
      navigate("/admin", {});
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
    console.log("handleEmailSubmit completionEmail: ", completionEmail);
    // Validate email (basic check)
    if (!completionEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    // Prepare the data to send
    const emailData = {
      toEmail: completionEmail,
      subject: "Welcome to the Company!",
      fromEmail: user.email,
      name: initialValues.name,
      email: checkSpecialChar(initialValues.email),
      password: checkSpecialChar(initialValues.password),
    };

    console.log("handleEmailSubmit emailData: ", emailData);

    axios
      .post(`${END_POINT}/api/send-email`, emailData, { withCredentials: true })
      .then((response) => {
        alert("Welcome email sent successfully!");
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        alert("An error occurred while sending the email.");
      });
  };

  return (
    <div className="userInfoView-container">
      <div className="userinfo-title">+ 사원 등록</div>
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
          console.log("values:", values);
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
          <Form className="userinfo-contents" onSubmit={handleSubmit}>
            <div className="userinfo-contents-row">
              <label htmlFor="name" className="userinfo-attribute">
                이름
              </label>
              <div className="userinfo-values">
                <Field
                  className="edit-userinfo-box"
                  type="text" // It's better to use "text" and apply validation for numbers
                  name="name"
                  placeholder="이름을 입력하세요.(한글 또는 영문)"
                  style={window.innerWidth < 650 ? {} : { width: "250px" }}
                />
                <ErrorMessage
                  className="error-message"
                  name="name"
                  component="div"
                />
              </div>
            </div>
            <div className="userinfo-contents-row">
              <label htmlFor="password" className="userinfo-attribute">
                비밀번호
              </label>
              <div className="userinfo-values">
                <Field
                  name="password"
                  className="edit-userinfo-box"
                  placeholder="비밀번호를 입력하세요."
                  style={window.innerWidth < 650 ? {} : { width: "250px" }}
                />
                <br />
                <ErrorMessage
                  className="error-message"
                  name="password"
                  component="div"
                />
              </div>
            </div>
            <div className="userinfo-contents-row">
              <label htmlFor="position" className="userinfo-attribute">
                직책
              </label>
              <div className="userinfo-values">
                <select
                  name="position"
                  value={values.position}
                  onChange={handleChange}
                  className="edit-userinfo-box"
                  style={window.innerWidth < 650 ? {} : { width: "250px" }}
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
                <ErrorMessage
                  className="error-message"
                  name="position"
                  component="div"
                />
              </div>
            </div>
            <div className="userinfo-contents-row">
              <label htmlFor="department" className="userinfo-attribute">
                부서
              </label>
              <div className="userinfo-values">
                <select
                  name="department"
                  value={values.department}
                  onChange={handleChange}
                  className="edit-userinfo-box"
                  style={window.innerWidth < 650 ? {} : { width: "250px" }}
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
                <ErrorMessage
                  className="error-message"
                  name="department"
                  component="div"
                />
              </div>
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
                  style={window.innerWidth < 650 ? {} : { width: "250px" }}
                />
                <ErrorMessage
                  className="error-message"
                  name="phone"
                  component="div"
                />
              </div>
            </div>
            <div className="userinfo-contents-row">
              <label htmlFor="emailId" className="userinfo-attribute">
                이메일
              </label>
              <div className="userinfo-values">
                <Field
                  className="edit-userinfo-box"
                  name="emailId"
                  style={window.innerWidth < 650 ? {} : { width: "250px" }}
                />
                <span>@altumpartners.co.kr</span>
                <ErrorMessage
                  className="error-message"
                  name="emailId"
                  component="div"
                />
              </div>
            </div>
            <div className="userinfo-contents-row">
              <label htmlFor="subemail" className="userinfo-attribute">
                개인이메일
              </label>
              <div className="userinfo-values">
                <Field
                  className="edit-userinfo-box"
                  name="subemail"
                  style={window.innerWidth < 650 ? {} : { width: "250px" }}
                />
                <span>@gmail.com</span>
                <ErrorMessage
                  className="error-message"
                  name="subemail"
                  component="div"
                />
              </div>
            </div>

            <div className="userinfo-contents-row">
              <label htmlFor="a" className="userinfo-attribute">
                권한
              </label>
              <div className="userinfo-values">
                <select
                  name="authority"
                  value={values.authority} // Formik values에서 상태값을 가져옴
                  onChange={handleChange} // Formik의 handleChange 함수 연결
                  className="edit-userinfo-box"
                  style={window.innerWidth < 650 ? {} : { width: "250px" }}
                >
                  <option value="" label="재직상태를 선택하세요.">
                    권한을 선택하세요.
                  </option>
                  <option value="guest" label="guest">
                    guest
                  </option>
                  <option value="admin" label="admin">
                    admin
                  </option>
                </select>
              </div>
            </div>
            <div className="userinfo-contents-row">
              <label htmlFor="joinDt" className="userinfo-attribute">
                입사일
              </label>
              <div className="userinfo-values">
                <Field
                  name="joinDt"
                  type="date"
                  value={values.joinDt}
                  className="edit-userinfo-box"
                  style={window.innerWidth < 650 ? {} : { width: "250px" }}
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
                  <p>사원 정보를 저장하시겠습니까?</p>
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
                  </div>
                  <div className="text-center">
                    <button className="modal-btn cancle" onClick={onCancle}>
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
