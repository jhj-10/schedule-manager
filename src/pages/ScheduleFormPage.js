import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../lib/ScheduleFormPage.css";

function ScheduleFormPage({ endPoint }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const END_POINT = endPoint || "";

  const [initialValues, setInitialValues] = useState({
    title: "",
    start: "",
    end: "",
    attendees: [],
    notes: "",
  });

  const [filteredUsers, setFilteredUsers] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showConfirm, setShowConfirm] = useState(false);
  // const [disabled, setDisabled] = useState(true);

  // 한국시간으로 변환환
  const dateToKST = (date) => {
    const startDate = new Date(date);
    const newDate = new Date(startDate.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, -8);
    return newDate;
  };

  useEffect(() => {
    if (location.state) {
      const { title, start, end, notes } = location.state;

      const startKST = dateToKST(start);
      const endKST = dateToKST(end);

      const baseAttendees = {
        user_id: user.id,
        name: user.name,
        email: user.email,
        start_dt: dateToKST(start),
        end_dt: dateToKST(end),
      };

      // 참여자 각각의 날짜 변경
      const attendeesChangeDt = (attendees) => {
        let attendeesArr = [];
        for (const att of attendees) {
          const temp = {
            project_id: att.project_id,
            user_id: att.user_id,
            name: att.name,
            email: att.email,
            start_dt: dateToKST(att.start_dt),
            end_dt: dateToKST(att.end_dt),
          };
          attendeesArr.push(temp);
        }
        // console.log("attendeesArr:", attendeesArr);
        return attendeesArr;
      };

      // console.log("baseAttendees:", baseAttendees);

      const attendees =
        location.state.attendees !== undefined
          ? attendeesChangeDt(location.state.attendees)
          : [baseAttendees];

      setInitialValues({
        title: title || "",
        start: startKST || "",
        end: endKST || "",
        attendees: attendees || [],
        notes: notes || "",
      });

      // console.log("initialValues:", initialValues);
      // console.log("attendees:", attendees);
      setRecipients(attendees);
    }
  }, [location.state, user.id, user.name, user.email]);

  // 사용자 검색, 상하키를 이용하여 사용자 고르기
  const handleSearch = (value) => {
    if (!value) {
      setFilteredUsers([]);
      setFocusedIndex(-1);
      return;
    }

    axios
      .get(`${END_POINT}/api/users?search=${value}`, { withCredentials: true })
      .then((response) => {
        setFilteredUsers(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching users!", error);
      });
  };

  // 참여자 추가하기
  const addRecipient = (user) => {
    if (!recipients.some((recipient) => recipient.email === user.email)) {
      const recipientInfo = {
        user_id: user.id,
        name: user.name,
        email: user.email,
        start_dt: initialValues.start,
        end_dt: initialValues.end,
      };
      setRecipients([...recipients, recipientInfo]);
    }

    // console.log("addrecipients: ", recipients);
    setFilteredUsers([]);
  };

  // 사용자 검색결과에서 상하키를 이용하여 사용자 고르고 tab, enter 키로 추가
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setFocusedIndex((prevIndex) =>
        prevIndex < filteredUsers.length - 1 ? prevIndex + 1 : 0
      );
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setFocusedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : filteredUsers.length - 1
      );
      e.preventDefault();
    } else if ((e.key === "Tab" || e.key === "Enter") && focusedIndex >= 0) {
      e.preventDefault();
      addRecipient(filteredUsers[focusedIndex]);
      setFilteredUsers([]);
    }
  };

  // 참여자 삭제
  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < filteredUsers.length) {
      const element = document.getElementById(`user-${focusedIndex}`);
      if (element) {
        element.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex, filteredUsers, setRecipients]);

  return (
    <div className="form-container">
      <h2>{location.state.id ? "일정 수정" : "일정 등록"}</h2>
      <hr />
      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={Yup.object({
          title: Yup.string().required("Required"),
          start: Yup.date().required("Required"),
          end: Yup.date().required("Required"),
          notes: Yup.string(),
        })}
        onSubmit={(values, { setSubmitting }) => {
          // const attendees = recipients.map((recipient, index) => ({
          //   ...recipient,
          //   start_dt: values.attendees[index]?.start_dt || initialValues.start,
          //   end_dt: values.attendees[index]?.end_dt || initialValues.end,
          // }));

          const scheduleData = {
            ...values,
            attendees: recipients.map((recipient, index) => {
              const attendee = values.attendees[index] || {};
              return {
                ...recipient,
                start_dt: attendee.start_dt || initialValues.start,
                end_dt: attendee.end_dt || initialValues.end,
              };
            }),
            creator_id: user.id,
          };
          // console.log("scheduleData:", scheduleData);

          // location.state.id 존재 시 기존 일정 수정, 없으면 새로운 일정 생성
          // console.log("location.state: ", location.state);
          const request = location.state.projectId
            ? Promise.all([
                // Update schedule
                axios.put(
                  `${END_POINT}/api/schedules/${location.state.projectId}`,
                  scheduleData,
                  { withCredentials: true }
                ),
                // Delete manpower_status
                axios.delete(
                  `${END_POINT}/api/manpower-status/${location.state.projectId}`,
                  { withCredentials: true }
                ),
                // Insert manpower_status
                axios.post(
                  `${END_POINT}/api/manpower-status`,
                  {
                    project_id: location.state.projectId,
                    attendees: scheduleData.attendees,
                  },
                  { withCredentials: true }
                ),
              ])
            : axios
                .post(`${END_POINT}/api/schedules`, scheduleData, {
                  withCredentials: true,
                }) // Create new schedule
                .then((response) => {
                  // response 로 받은 project_id를 이용하여 Create new manpower_status
                  // console.log("response:", response);
                  const projectId = response.data.insertId;
                  // console.log("Create new schedule projectId:", projectId);
                  return axios.post(
                    `${END_POINT}/api/manpower-status`,
                    {
                      project_id: projectId,
                      attendees: scheduleData.attendees,
                    },
                    { withCredentials: true }
                  );
                });

          request
            .then(() => {
              navigate("/");
            })
            .catch((error) => {
              console.error(
                "There was an error saving the schedule!",
                error.message
              );
              setSubmitting(false);
            });
        }}
      >
        {({ values, isSubmitting, handleSubmit, errors, touched, isValid }) => (
          <Form className="form-contents" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title" className="attributes">
                일정명
              </label>
              <Field type="text" name="title" className="form-field" />
              <ErrorMessage
                name="title"
                component="div"
                className="form-errormessage"
              />
            </div>

            <div>
              <label htmlFor="start" className="attributes">
                시작일시
              </label>
              <Field
                type="datetime-local"
                name="start"
                className="form-field"
              />
              <ErrorMessage
                name="start"
                component="div"
                className="form-errormessage"
              />
            </div>

            <div>
              <label htmlFor="end" className="attributes">
                종료일시
              </label>
              <Field type="datetime-local" name="end" className="form-field" />
              <ErrorMessage
                name="end"
                component="div"
                className="form-errormessage"
              />
            </div>

            <div>
              <label htmlFor="attendees" className="attributes">
                참여인력
              </label>
              <input
                type="text"
                placeholder="이름 또는 이메일 검색"
                onKeyUp={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                className="form-field"
              />
              <div className="user-select">
                <ul>
                  {filteredUsers.map((user, index) => (
                    <li
                      className="search_users"
                      key={index}
                      id={`user-${index}`}
                      onClick={() => addRecipient(user)}
                      style={{
                        backgroundColor:
                          focusedIndex === index ? "#d3d3d3" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      {user.name} ({user.email})
                    </li>
                  ))}
                </ul>
              </div>
              {recipients.map((recipient, index) => (
                <li className="recipients" key={index}>
                  {recipient.name} ({recipient.email})
                  <Field
                    type="datetime-local"
                    name={`attendees[${index}].start_dt`}
                    className="date-box"
                    value={
                      values.attendees[index]?.start_dt || initialValues.start
                    }
                  />
                  <ErrorMessage
                    name={`attendees[${index}].start_dt`}
                    component="div"
                  />
                  ~
                  <Field
                    type="datetime-local"
                    name={`attendees[${index}].end_dt`}
                    className="date-box"
                    value={values.attendees[index]?.end_dt || initialValues.end}
                  />
                  <ErrorMessage
                    name={`attendees[${index}].end_dt`}
                    component="div"
                  />
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="close-btn"
                  >
                    ×
                  </button>
                </li>
              ))}
            </div>

            <div>
              <label htmlFor="notes" className="attributes">
                메모
              </label>
              <Field as="textarea" name="notes" className="form-textarea" />
            </div>
            <div className="button-div">
              <button
                className="modal-btn confirm"
                disabled={
                  !isValid || !Object.keys(touched).length || isSubmitting
                }
                onClick={(e) => {
                  e.preventDefault();
                  setShowConfirm(true);
                }}
              >
                저장
              </button>
              <button
                type="button"
                className="modal-btn cancle"
                onClick={() => navigate("/")}
              >
                취소
              </button>

              {showConfirm && (
                <div className="overlay">
                  <div className="content confirm-dialog">
                    <p>일정을 저장하시겠습니까?</p>

                    <button
                      type="submit"
                      className="modal-btn confirm"
                      disabled={isSubmitting}
                    >
                      확인
                    </button>
                    <button
                      className="modal-btn cancle"
                      onClick={() => setShowConfirm(false)}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default ScheduleFormPage;
