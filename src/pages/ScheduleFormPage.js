import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../context/AuthProvider";
import "../lib/FormPage.css";
import {
  addManpowerStatus,
  createSchedule,
  deleteManpowerStatus,
  searchUsers,
  updateSchedule,
} from "../services/userService";

function ScheduleFormPage({ endPoint }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState({
    type: "",
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
  const [scheduleData, setScheduleData] = useState({});
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
      const { type, title, start, end, notes } = location.state;

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
        type: type || "project",
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
  const handleSearch = async (value) => {
    if (!value) {
      setFilteredUsers([]);
      setFocusedIndex(-1);
      return;
    }

    try {
      const response = await searchUsers(value);
      console.log("handleSearch response:", response);
      setFilteredUsers(response);
    } catch (error) {
      console.error("There was an error fetching users!", error);
    }
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

  // 데이터 전송
  const handleConfirm = async () => {
    console.log("scheduleData:", scheduleData);

    try {
      const projectId = location.state?.projectId;

      if (projectId) {
        // 일정 수정
        await updateSchedule(projectId, scheduleData);

        // 기존 인력 배치 정보 삭제 후 다시 추가
        await deleteManpowerStatus(projectId);
        await addManpowerStatus(projectId, scheduleData.attendees);
      } else {
        // 새 일정 생성
        const newProjectId = await createSchedule(scheduleData);
        await addManpowerStatus(newProjectId, scheduleData.attendees);
      }
    } catch (error) {
      console.error("일정 저장 중 오류 발생:", error);
    }
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
      {/* {console.log("location.state:", location.state)} */}
      <div className="form-title">
        + {location.state.projectId ? "일정 수정" : "일정 등록"}
      </div>
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
          console.log("onSubmit 실행:", values);

          const sData = {
            ...values,
            attendees: recipients.map((recipient, index) => {
              const attendee = values.attendees?.[index] || {};
              return {
                ...recipient,
                start_dt: attendee.start_dt || initialValues.start,
                end_dt: attendee.end_dt || initialValues.end,
              };
            }),
            creator_id: user.id,
          };
          setScheduleData(sData);
          setShowConfirm(true);

          setTimeout(() => {
            console.log("제출 완료!");
            setSubmitting(false); // Formik 상태를 나중에 리셋
            navigate("/"); // Redirect to home after success
          }, 2000);
        }}
      >
        {({
          values,
          isSubmitting,
          handleSubmit,
          errors,
          touched,
          isValid,
          handleChange,
        }) => (
          <Form className="form-contents" onSubmit={handleSubmit}>
            <div className="flex-row">
              <label htmlFor="type" className="attributes">
                일정구분
              </label>
              <div className="form-item">
                <select
                  name="type"
                  value={values.type}
                  onChange={handleChange}
                  className="form-field"
                >
                  <option value="project" label="[P] Project">
                    [P]Project
                  </option>
                  <option value="meeting" label="[M] Meeting">
                    [M]Meeting
                  </option>
                  <option value="altum" label="[A] Altum">
                    [A]Altum
                  </option>
                </select>
              </div>
            </div>

            <div className="flex-row">
              <label htmlFor="title" className="attributes">
                일정명
              </label>
              <div className="form-item">
                <Field type="text" name="title" className="form-field" />
                <ErrorMessage
                  name="title"
                  component="div"
                  className="form-errormessage"
                />
              </div>
            </div>

            <div className="flex-row">
              <label htmlFor="start" className="attributes">
                시작일시
              </label>
              <div className="form-item">
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
            </div>

            <div className="flex-row">
              <label htmlFor="end" className="attributes">
                종료일시
              </label>
              <div className="form-item">
                <Field
                  type="datetime-local"
                  name="end"
                  className="form-field"
                />
                <ErrorMessage
                  name="end"
                  component="div"
                  className="form-errormessage"
                />
              </div>
            </div>

            <div className="flex-row">
              <label htmlFor="attendees" className="attributes">
                참여인력
              </label>
              <div className="form-item">
                <div className="flex-row">
                  <div
                    style={{
                      flex: 1,
                      marginRight: "20px",
                    }}
                  >
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
                        {/* {console.log("filteredUsers:", filteredUsers)} */}
                        {filteredUsers &&
                          filteredUsers.map((user, index) => (
                            <li
                              className="search_users"
                              key={index}
                              id={`user-${index}`}
                              onClick={() => addRecipient(user)}
                              style={{
                                backgroundColor:
                                  focusedIndex === index
                                    ? "#f8f6e2"
                                    : "transparent",
                                // focusedIndex === index ? "#F0EAD6" : "transparent",
                                cursor: "pointer",
                              }}
                            >
                              {user.name} ({user.email})
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>

                  <div className="recipients-box">
                    {recipients.map((recipient, index) => (
                      <li className="recipients" key={index}>
                        <div
                          className="recipients-name"
                          title={`${recipient.name} (${recipient.email})`}
                        >
                          {recipient.name} ({recipient.email})
                        </div>
                        <div className="recipients-date">
                          <Field
                            type="datetime-local"
                            name={`attendees[${index}].start_dt`}
                            className="date-box"
                            value={
                              values.attendees[index]?.start_dt ||
                              initialValues.start
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
                            value={
                              values.attendees[index]?.end_dt ||
                              initialValues.end
                            }
                          />
                          <ErrorMessage
                            name={`attendees[${index}].end_dt`}
                            component="div"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRecipient(index)}
                          className="close-btn confirm"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-row">
              <div className="attributes">
                <label htmlFor="notes">메모</label>
              </div>
              <div className="form-item">
                <Field
                  as="textarea"
                  name="notes"
                  className="form-textarea"
                  placeholder="일정 관련 내용 작성"
                />
              </div>
            </div>
            <div className="button-div">
              <button
                type="submit"
                className="modal-btn confirm"
                disabled={
                  !isValid || isSubmitting
                  // !isValid || !Object.keys(touched).length || isSubmitting
                }
                // onClick={(e) => {
                //   e.preventDefault();
                //   setShowConfirm(true);
                // }}
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
                    <div>일정을 저장하시겠습니까?</div>
                    <button
                      type="button"
                      className="modal-btn confirm"
                      onClick={handleConfirm}
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
