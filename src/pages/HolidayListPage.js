import { useCallback, useEffect, useRef, useState } from "react";
import "../lib/AdminPage.css";
import axios from "axios";
import solarlunar from "solarlunar";
import { ErrorMessage, Field, Form, Formik } from "formik";

function HolidayListPage({ endPoint }) {
  const END_POINT = endPoint;
  const TEMP_INITIALVALUES = {
    hid: "",
    type: "temp",
    lunarYn: "N",
    substituteYn: "N",
    substitute: "",
    name: "",
    dt: "",
  };

  // const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState("");
  const [initialValues, setInitialValues] = useState(TEMP_INITIALVALUES);
  const [modifyValues, setModifyValues] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [filteredHolidays, setFilteredHolidays] = useState([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showModify, setShowModify] = useState(false);

  const [reload, setReload] = useState(true);

  const pageRef = useRef(null);

  const handleHolidaySearch = () => {
    const holidayListElement = pageRef.current;
    if (!holidayListElement) {
      console.error("holidayList element not found.");
      return;
    }
    const searchValue =
      holidayListElement.querySelectorAll(".admin-search")[0].value;
    console.log("searchValue:", searchValue);
    const filterResult = searchValue
      ? holidays.filter(
          (hday) =>
            hday.name.includes(searchValue) || hday.dt.includes(searchValue)
        )
      : holidays;
    setFilteredHolidays(filterResult);
  };

  const conversionLunarDt = (year, dt) => {
    const [month, day] = dt.split("-");
    const lunarToSolar = solarlunar.lunar2solar(
      Number(year),
      Number(month),
      Number(day)
    );
    const solarDt = `${lunarToSolar.cYear}-${lunarToSolar.cMonth}-${lunarToSolar.cDay}`;
    return solarDt;
  };

  const transHday = useCallback((day) => {
    const year = new Date().getFullYear();
    console.log("transHday day:", day);
    let hday = {};

    const isLunar = day.lunarYn === "Y" || day.lunar_yn === "Y";
    const isSolar = day.lunarYn === "N" || day.lunar_yn === "N";

    if (day.type === "public") {
      if (isLunar) {
        hday = {
          ...day,
          type: "공휴일",
          lunarDt: `음력 ${day.dt}`,
          solarDt: conversionLunarDt(year, day.dt),
        };
      } else if (isSolar) {
        hday = {
          ...day,
          type: "공휴일",
          lunarDt: "",
          solarDt: `${year}-${day.dt}`,
        };
      }
    } else {
      hday = {
        ...day,
        type: day.type === "temp" ? "임시공휴일" : "공휴일",
        lunarDt: "",
        solarDt: day.dt,
      };
    }
    return hday;
  }, []);

  const dateFormat = useCallback((date) => {
    return date.toLocaleString().replaceAll(". ", "-").split("-오전")[0];
  }, []);

  const calHdayPeriod = useCallback(
    (day) => {
      let pd = "";
      if (day.name === "설날" || day.name === "추석") {
        const current = new Date(day.solarDt);
        const start = new Date(current);
        start.setDate(start.getDate() - 1);
        const end = new Date(current);
        end.setDate(end.getDate() + 1);
        const startDt = dateFormat(start);
        const endDt = dateFormat(end);
        pd = `${startDt}~${endDt}`;
      }
      return {
        ...day,
        period: pd ? pd : day.solarDt,
      };
    },
    [dateFormat]
  );

  const handleHolidays = useCallback(
    (list) => {
      const tempHlist = list.filter((day) => !day.name.includes("연휴"));
      const transHlist = tempHlist.map((day) => transHday(day));
      console.log("tempHlist:", tempHlist);

      const result = transHlist.map((day) => calHdayPeriod(day));

      return result.sort((a, b) => {
        const aArr = a.solarDt.split("-");
        const bArr = b.solarDt.split("-");
        if (aArr[0] !== bArr[0]) {
          return Number(Number(bArr[0] - Number(aArr[0])));
        } else if (aArr[1] !== bArr[1]) {
          return Number(aArr[1]) - Number(bArr[1]);
        } else {
          return Number(aArr[2]) - Number(bArr[2]);
        }
      });
    },
    [calHdayPeriod, transHday]
  );

  const handleModify = (holiday, mode) => {
    console.log("handleModify holiday:", holiday);
    setModifyValues(holiday);
    if (mode === "update") {
      setShowModify(true);
    } else if (mode === "delete") {
      setShowDeleteConfirm(true);
    }
  };

  const validate = (values) => {
    const errors = {};

    if (!values.name) {
      errors.name = "공휴일명을 입력하세요.";
    }

    if (!values.dt) {
      errors.dt = "날짜를 입력하세요.";
    } else if (
      values.lunarYn === "Y" &&
      !/^(1[0-2]|[1-9])-(3[01]|[12][0-9]|[1-9])$/.test(values.dt)
    ) {
      errors.dt = "음력 공휴일이 맞는지 확인하세요.";
    } else if (
      values.lunarYn === "N" &&
      !/^(\d{4})-(1[0-2]|[1-9])-(3[01]|[12][0-9]|[1-9])$/.test(values.dt)
    ) {
      errors.dt = "유효하지 않은 날짜형식입니다. 년-월-일 형식으로 입력하세요.";
    }

    // const substitute = values.substitute.replaceAll(" ", "").replace(/[^a-zA-Z0-9, ]+/g, '');
    if (values.substitute && !/^[가-힣, ]+$/.test(values.substitute)) {
      errors.substitute =
        "특수문자는 사용할 수 없습니다. 대체공휴일 지정일이 2개 이상인 경우 콤마(,)로 구분하여 작성하세요.(예> 토,일)";
    }

    return errors;
  };

  const handleAddHoliday = (values) => {
    console.log("handleAddHoliday@!!!", values);
    axios
      .post(`${END_POINT}/api/holiday`, values, { withCredentials: true })
      .then((response) => {
        console.log("Create new holiday result:", response.data);
        setMode("create");
        setShowConfirm(true);
      })
      .catch((error) => {
        console.error("There was an error create the holiday!", error);
      });
  };

  const handleModifyHoliday = (values) => {
    console.log("handleModifyHoliday!!!", values);
    axios
      .put(`${END_POINT}/api/holiday/`, values, { withCredentials: true })
      .then((response) => {
        console.log("Update holiday result:", response.data);
      })
      .catch((error) => {
        console.error("There was an error update the holiday!", error);
      });
    setMode("update");
    setShowConfirm(true);
  };

  const handleDeleteHoliday = () => {
    console.log("handleDeleteHoliday!!!", modifyValues);
    axios
      .delete(`${END_POINT}/api/holiday/${modifyValues.hid}`, {
        withCredentials: true,
      })
      .then((response) => {
        console.log("Delete holiday result:", response.data);
      })
      .catch((error) => {
        console.error("There was an error delete the holiday!", error);
      });
    setMode("delete");
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (mode === "create") {
      setReload(!reload);
      setInitialValues(TEMP_INITIALVALUES);
    } else if (mode === "update") {
      const hday = calHdayPeriod(transHday(modifyValues));
      const idx = filteredHolidays.findIndex((day) => day.hid === hday.hid);
      filteredHolidays[idx] = hday;
      setShowModify(false);
    } else if (mode === "delete") {
      const hlist = filteredHolidays.filter(
        (day) => day.hid !== modifyValues.hid
      );
      setFilteredHolidays(hlist);
      setShowDeleteConfirm(false);
    }
    setShowConfirm(false);
  };

  // const fetchHolidays = useCallback(() => {

  //   // const validate = window.innerWidth < 650 ? false : true;
  //   // setVisible(validate);
  // }, [reload, END_POINT, handleHolidays]);

  useEffect(() => {
    const fetchHolidays = async () => {
      axios
        .get(`${END_POINT}/api/holidays`, { withCredentials: true })
        .then((response) => {
          // console.log("holidayList response:", response);
          const processedHolidays = handleHolidays(response.data);
          setHolidays(processedHolidays);
          setFilteredHolidays(processedHolidays);
          // console.log("filteredHolidays: ", filteredHolidays);
        })
        .catch((error) => {
          console.error("There was an error fetching the holidays!", error);
        });
    };
    fetchHolidays();
  }, [END_POINT, handleHolidays]);

  return (
    <div ref={pageRef} style={{ height: "100%", overflow: "auto" }}>
      <div className="admin-container">
        <h3 className="admin-title">공휴일정보</h3>
        <div className="admin-add-holiday-box">
          <div className="admin-add-holiday-title">공휴일 등록하기</div>
          <Formik
            initialValues={initialValues}
            enableReinitialize={true}
            validate={validate}
            onSubmit={(values, { setSubmitting }) => {
              const holidayData = {
                ...values,
                substituteYn: values.substitute ? "Y" : "N",
              };
              // 유효성 검사가 성공했을 때만 확인 모달을 띄운다.
              console.log("holidayData:", holidayData);
              setInitialValues(holidayData);
              setSubmitting(false); // Submit 완료 후 비동기 작업이 끝났음을 알림
              handleAddHoliday(holidayData);
            }}
          >
            {({ isSubmitting, handleChange }) => (
              <Form
                // className="tr"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  border: "none",
                  // flexWrap: "wrap",
                }}
              >
                <div className="row">
                  <select
                    name="type"
                    className="holiday-input-box"
                    onChange={handleChange}
                  >
                    <option value="temp" label="임시공휴일">
                      임시공휴일
                    </option>
                    <option value="public" label="공휴일">
                      공휴일
                    </option>
                  </select>
                  <Field
                    type="text"
                    name="name"
                    placeholder="공휴일명"
                    className="holiday-input-box"
                  />
                  <select
                    name="lunarYn"
                    className="holiday-input-box"
                    onChange={handleChange}
                  >
                    <option value="N" label="양력">
                      양력
                    </option>
                    <option value="Y" label="음력">
                      음력
                    </option>
                  </select>
                  <Field
                    type="text"
                    name="dt"
                    placeholder="년-월-일 또는 월-일"
                    className="holiday-input-box"
                  />
                  <Field
                    type="text"
                    name="substitute"
                    placeholder="대체공휴일 적용 날"
                    className="holiday-input-box"
                  />
                  <button
                    className="admin-add-button confirm"
                    type="submit"
                    style={{ height: "36px" }}
                    disabled={isSubmitting}
                    // onClick={handleAddHoliday}
                  >
                    {window.innerWidth < 650 ? "등록" : "공휴일등록"}
                  </button>
                </div>
                <ErrorMessage
                  className="error-message"
                  name="name"
                  component="div"
                />
                <ErrorMessage
                  className="error-message"
                  name="dt"
                  component="div"
                />
                <br></br>
                <ErrorMessage
                  className="error-message"
                  name="substitute"
                  component="div"
                />
              </Form>
            )}
          </Formik>
        </div>
        <div className="admin-holiday-list">
          <div>
            <div>
              <input
                className="admin-search"
                name="search"
                placeholder="휴일명 또는 날짜 검색"
              ></input>
              <button
                className="admin-search-button"
                onClick={handleHolidaySearch}
              >
                검색
              </button>
            </div>
          </div>
          <div>
            <div className="th">
              <div className="row dataCell">구분</div>
              <div className="row dataCell">공휴일명</div>
              <div className="row dataCell">날짜</div>
              <div className="row dataCell">기간</div>
              <div className="row dataCell">수정/삭제</div>
            </div>
            <div>
              {filteredHolidays &&
                filteredHolidays.map((holiday) => (
                  <div className="tr" key={holiday.hid}>
                    <div className="row dataCell">{holiday.type}</div>
                    <div className="row dataCell">{holiday.name}</div>
                    <div className="row dataCell">
                      {holiday.lunarDt ? holiday.lunarDt : holiday.dt}
                    </div>
                    <div className="row dataCell">{holiday.period}</div>
                    <div className="row dataCell">
                      <button onClick={() => handleModify(holiday, "update")}>
                        수정
                      </button>
                      <button onClick={() => handleModify(holiday, "delete")}>
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {showModify && (
            <div className="overlay">
              <div
                className="content confirm-dialog"
                style={
                  window.innerWidth < 650
                    ? { maxWidth: "500px" }
                    : { width: "auto", padding: "30px" }
                }
              >
                <div className="admin-add-holiday-title">공휴일 수정</div>
                <Formik
                  initialValues={modifyValues}
                  enableReinitialize={true}
                  validate={validate}
                  onSubmit={(values, { setSubmitting }) => {
                    const holidayData = {
                      ...values,
                      type: values.type === "임시공휴일" ? "temp" : "public",
                      hid: modifyValues.hid,
                      lunarYn: values.lunarYn ? values.lunarYn : "N",
                      substituteYn: values.substitute ? "Y" : "N",
                    };
                    // 유효성 검사가 성공했을 때만 확인 모달을 띄운다.
                    console.log("holidayData:", holidayData);
                    setModifyValues(holidayData);
                    setSubmitting(false); // Submit 완료 후 비동기 작업이 끝났음을 알림
                    handleModifyHoliday(holidayData);
                  }}
                >
                  {({ isSubmitting, handleChange }) => (
                    <Form>
                      <div
                        className="holiday-contents-row"
                        style={{ marginTop: "20px" }}
                      >
                        <div>
                          <label htmlFor="type" className="holiday-input-label">
                            구분
                          </label>
                          <div>
                            <select
                              name="type"
                              className="holiday-input-box"
                              onChange={handleChange}
                            >
                              <option value="temp" label="임시공휴일">
                                임시공휴일
                              </option>
                              <option value="public" label="공휴일">
                                공휴일
                              </option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="name" className="holiday-input-label">
                            공휴일명
                          </label>
                          <div>
                            <Field
                              type="text"
                              name="name"
                              placeholder="공휴일명"
                              className="holiday-input-box"
                            />
                          </div>
                        </div>
                        <div className="holiday-contents-row ">
                          <div>
                            <label className="holiday-input-label">
                              양력/음력
                            </label>
                            <div>
                              <select
                                name="lunarYn"
                                className="holiday-input-box"
                                onChange={handleChange}
                              >
                                <option value="N" label="양력">
                                  양력
                                </option>
                                <option value="Y" label="음력">
                                  음력
                                </option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="holiday-input-label">날짜</label>
                            <div>
                              <Field
                                type="text"
                                name="dt"
                                placeholder="년-월-일 또는 월-일"
                                className="holiday-input-box"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="substitute"
                            className="holiday-input-label"
                          >
                            대체공휴일 적용일
                          </label>
                          <div>
                            <Field
                              type="text"
                              name="substitute"
                              placeholder="대체공휴일 적용일"
                              className="holiday-input-box"
                              key="substitute"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <ErrorMessage
                          className="error-message"
                          name="name"
                          component="div"
                        />
                        <ErrorMessage
                          className="error-message"
                          name="dt"
                          component="div"
                        />
                        <ErrorMessage
                          className="error-message"
                          name="substitute"
                          component="div"
                        />
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          className="modal-btn cancle"
                          style={{ height: "36px" }}
                          onClick={() => {
                            setShowModify(false);
                          }}
                        >
                          취소
                        </button>
                        <button
                          className="modal-btn confirm"
                          type="submit"
                          style={{ height: "36px" }}
                          disabled={isSubmitting}
                        >
                          수정
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          )}
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="overlay">
          <div
            className="content confirm-dialog text-center"
            style={{ width: "auto" }}
          >
            <p className="admin-add-holiday-title">
              공휴일 정보를 삭제하시겠습니까?
            </p>
            <div style={{ marginTop: "20px" }}>
              - 삭제대상 :
              <sapn style={{ color: "red", fontWeight: "600", margin: "20px" }}>
                {modifyValues.dt} {modifyValues.name}
              </sapn>
            </div>
            <button className="modal-btn confirm" onClick={handleDeleteHoliday}>
              확인
            </button>
            <button
              className="modal-btn cancle"
              onClick={() => setShowDeleteConfirm(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
      {showConfirm && (
        <div className="overlay">
          <div className="content confirm-dialog text-center">
            <p>
              공휴일이{" "}
              {mode === "create"
                ? "등록"
                : mode === "update"
                ? "수정"
                : mode === "delete"
                ? "삭제"
                : ""}
              되었습니다.
            </p>
            <button className="modal-btn confirm" onClick={handleConfirm}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HolidayListPage;
