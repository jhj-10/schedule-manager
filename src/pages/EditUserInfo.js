import React, { useContext, useEffect, useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function EditUserInfo() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(user);

  console.log("initialValues:", initialValues);

  const subEmailId = initialValues.email_sub.split("@")[0];

  return (
    <>
      <h2>개인 정보 수정</h2>
      <Formik>
        <Form>
          <div>
            <label>이름</label>
            <span>{initialValues.name}</span>
          </div>
          <div>
            <label htmlFor="name">비밀번호</label>
            <Field
              type="password"
              name="password"
              value={initialValues.password}
            />
            <ErrorMessage name="password" component="div" />
          </div>
          <div>
            <label>직책</label>
            <span>{initialValues.position}</span>
          </div>
          <div>
            <label htmlFor="phone">핸드폰</label>
            <Field type="number" name="phone" value={initialValues.phone} />
            <ErrorMessage name="sub_email" component="div" />
          </div>
          <div>
            <label>이메일</label>
            <span>{initialValues.email}</span>
          </div>
          <div>
            <label htmlFor="subemail">개인이메일</label>
            <Field name="subemail" value={subEmailId} />
            <span>@google.com</span>
            <ErrorMessage name="subemail" component="div" />
          </div>
          <button>확인</button>
          <div>
            <div>변경사항을 저장하시겠습니까?</div>
            <button>저장</button>
            <button>취소</button>
          </div>
        </Form>
      </Formik>
    </>
  );
}

export default EditUserInfo;
