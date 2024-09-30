import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../lib/LoginPage.css";

function LoginPage() {
  const { login } = useContext(AuthContext);
  const END_POINT = "http://localhost:5000";

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
        onSubmit={(values, { setSubmitting }) => {
          axios
            .post(`${END_POINT}/api/login`, values)
            .then((response) => {
              if (response.data.success) {
                login(response.data.user); // Call the login function from AuthContext
              } else {
                alert("이메일 또는 비밀번호를 확인하세요.");
              }
              setSubmitting(false);
            })
            .catch((error) => {
              console.error("There was an error!", error);
              setSubmitting(false);
            });
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <div className="login-form">
              <label className="label" htmlFor="email">
                Email
              </label>
              <Field className="inputBox" type="email" name="email" />
              <ErrorMessage
                className="error-message"
                name="email"
                component="div"
              />
            </div>
            <div className="login-form">
              <label className="label" htmlFor="password">
                Password
              </label>
              <Field className="inputBox" type="password" name="password" />
              <ErrorMessage
                className="error-message"
                name="password"
                component="div"
              />
            </div>
            <button
              className="login-button"
              type="submit"
              disabled={isSubmitting}
            >
              Login
            </button>
          </Form>
        )}
      </Formik>
      <div className="forgotten">비밀번호찾기</div>
    </div>
  );
}

export default LoginPage;
