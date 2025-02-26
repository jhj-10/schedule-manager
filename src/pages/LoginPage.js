import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useContext } from "react";
import "../lib/LoginPage.css";
import { AuthContext } from "../context/AuthProvider"; // Import the AuthContextimport "../lib/LoginPage.css";
import { findPassword, tempPassword } from "../services/authService";
import { sendEmail } from "../services/userService";

// 임시비밀번호 생성
const createTempPassword = () => {
  let password = "";
  const chars =
    "1234567890QWERTYUIOPASDFGHJKLZXCVBNM?qwertyuiopasdfghjklzxcvbnm!@#$?-_";

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
};

function LoginPage() {
  const { login } = useContext(AuthContext); // AuthContext 로그인

  const [showFindPassword, setShowFindPassword] = useState(false); // 비밀번호찾기 창 on/off
  const [resutlView, setResutlView] = useState(false); // 결과창 on/off
  const [message, setMessage] = useState(""); // 결과메시지

  // 임시비밀번호 생성 객체
  const [tempAccountValues, setTempAccountValues] = useState({
    name: "",
    email: "",
    email_sub: "",
    password: "",
  });

  // 임시비밀번호 발급 메일 발송
  const handleSendEmail = async (accountValues) => {
    console.log("handleSendEmail!!!");
    const emailData = {
      file: "PasswordEmail",
      toEmail: accountValues.email_sub,
      subject: "Alutmpartners 계정 임시비밀번호 발급 안내",
      fromEmail: "",
      name: accountValues.name,
      email: accountValues.email,
      password: accountValues.password,
    };

    try {
      const result = await sendEmail(emailData);
      // console.log("비밀번호찾기 result:", result.status);
      if (result.status === 200) {
        setMessage("");
        setResutlView(true);
      } else {
        setMessage("* 메일 전송에 실패하였습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      setMessage("* 메일 전송에 실패하였습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="form-body">
      <h2 className="login-title">Login</h2>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={Yup.object({
          email: Yup.string()
            .email("이메일 형식이 아닙니다.")
            .required("이메일을 입력하세요."),
          password: Yup.string().required("비밀번호를 입력하세요."),
        })}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const data = await login(values); // 로그인
            if (data.success) {
              setMessage("반갑습니다. 좋은 하루 되세요!");
              console.log("Login!!");
              // navigate("/"); // 로그인 성공 후 이동
            } else {
              setMessage("* 이메일 또는 비밀번호를 확인하세요.");
            }
          } catch (error) {
            setMessage("* 로그인에 실패했습니다. 다시 시도해주세요.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <div className="login-form">
              <label className="label" htmlFor="email">
                email
              </label>
              <Field
                className="inputBox"
                type="email"
                name="email"
                placeholder="@altumpartners.co.kr 계정 이메일"
              />
              <ErrorMessage
                className="error-message"
                name="email"
                component="div"
              />
            </div>
            <div className="login-form">
              <label className="label" htmlFor="password">
                password
              </label>
              <Field
                className="inputBox"
                type="password"
                name="password"
                placeholder="비밀번호"
              />
              <ErrorMessage
                className="error-message"
                name="password"
                component="div"
              />
            </div>
            {message && <div className="login-form fail">{message}</div>}
            <button
              className="login-button"
              type="submit"
              disabled={isSubmitting}
            >
              로그인
            </button>
          </Form>
        )}
      </Formik>
      <div
        className="forgotten btn"
        onClick={() => {
          setShowFindPassword(true);
        }}
      >
        비밀번호찾기
      </div>

      {showFindPassword && (
        <div className="overlay">
          <div
            className="content confirm-dialog"
            style={window.innerWidth < 650 ? {} : { width: "500px" }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "10px",
              }}
            >
              비밀번호찾기
            </div>
            <p>
              회사 계정 이메일주소와 개인 이메일 주소(지메일)로 비밀번호 찾기를
              진행합니다.
            </p>
            <Formik
              initialValues={{ altumEmail: "", gmailEmail: "" }}
              validationSchema={Yup.object({
                altumEmail: Yup.string()
                  .email("이메일 형식이 아닙니다.")
                  .required("이메일을 입력하세요."),
                gmailEmail: Yup.string()
                  .email("이메일 형식이 아닙니다.")
                  .required("이메일을 입력하세요."),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  const data = await findPassword(values);
                  // console.log("findPassword:", data.account[0]);

                  if (data.success) {
                    const { name, email, email_sub } = data.account[0];
                    const tp = createTempPassword();
                    await tempPassword(tp, values);

                    setTempAccountValues((prevState) => {
                      const newValues = {
                        name: name,
                        email: email,
                        email_sub: email_sub,
                        password: tp,
                      };

                      handleSendEmail(newValues); // 새로운 값이 설정된 후 실행
                      return newValues;
                    });
                  } else {
                    setMessage("* 일치하는 계정이 없습니다.");
                  }
                } catch (error) {
                  console.log("error: ", error);
                  setMessage("* 계정 찾기에 실패했습니다. 다시 시도해주세요.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div style={{ marginTop: "20px" }}>
                    <div className="findPassword-inputBox flex-row">
                      <label htmlFor="altumEmail" style={{ minWidth: "70px" }}>
                        회사계정
                      </label>
                      <div>
                        <Field
                          type="email"
                          name="altumEmail"
                          placeholder="@altumpartners.co.kr계정"
                          style={{ padding: "0px" }}
                        />
                        <ErrorMessage
                          className="error-message"
                          name="altumEmail"
                          component="div"
                        />
                      </div>
                    </div>

                    <div className="findPassword-inputBox flex-row">
                      <label htmlFor="gmailEmail" style={{ minWidth: "70px" }}>
                        개인 이메일
                      </label>
                      <div>
                        <Field
                          type="email"
                          name="gmailEmail"
                          placeholder="@gmail.com계정"
                          style={{ padding: "0px" }}
                        />
                        <ErrorMessage
                          className="error-message"
                          name="gmailEmail"
                          component="div"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="fail">{message}</div>
                  <div style={{ textAlign: "center" }}>
                    <button
                      className="modal-btn confirm"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      메일 보내기
                    </button>
                    <button
                      className="modal-btn cancle"
                      onClick={() => {
                        setMessage("");
                        setShowFindPassword(false);
                      }}
                    >
                      취소
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {resutlView && (
        <div className="overlay">
          <div
            className="content confirm-dialog"
            style={window.innerWidth < 650 ? {} : { width: "350px" }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "10px",
              }}
            >
              임시 비밀번호 전송
            </div>

            <p>임시비밀번호를 개인 이메일 주소(지메일)로 전송하였습니다.</p>

            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                className="modal-btn confirm"
                onClick={() => {
                  setResutlView(false);
                  setShowFindPassword(false);
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
