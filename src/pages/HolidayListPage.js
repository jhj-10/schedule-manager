import { useCallback, useEffect, useRef, useState } from "react";
import "../styles/AdminPage.css";
import solarlunar from "solarlunar";
import { ErrorMessage, Field, Form, Formik } from "formik";
import {
  createHoliday,
  deleteHoliday,
  fetchHolidaysData,
  updateHoliday,
} from "../services/userService";
import { validateDate, validateSubstituteHoliday } from "../utils/validate";

function HolidayListPage() {
  // 공휴일 객체
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
  const [mode, setMode] = useState(""); // 작업 모드 공휴일 생성/수정/삭제
  const [initialValues, setInitialValues] = useState(TEMP_INITIALVALUES); // 공휴일 객체
  const [modifyValues, setModifyValues] = useState({}); // 데이터 수정 객체
  const [holidays, setHolidays] = useState([]); // 공휴일 리스트
  const [filteredHolidays, setFilteredHolidays] = useState([]); // 검색조건에 맞는, 필터링된 공휴일 리스트

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 공휴일 삭제 대상 확인 창 on/off
  const [showConfirm, setShowConfirm] = useState(false); // 확인창 on/off
  const [showModify, setShowModify] = useState(false); // 공휴일 수정 입력창 on/off

  const [reload, setReload] = useState(true); // 공휴일 리스트 새로고침

  const pageRef = useRef(null);

  // 공휴일 검색
  const handleHolidaySearch = () => {
    const holidayListElement = pageRef.current;
    if (!holidayListElement) {
      console.error("holidayList element not found.");
      return;
    }
    const searchValue =
      holidayListElement.querySelectorAll(".admin-search")[0].value;
    // console.log("searchValue:", searchValue);
    const filterResult = searchValue
      ? holidays.filter(
          (hday) =>
            hday.name.includes(searchValue) || hday.dt.includes(searchValue)
        )
      : holidays;
    setFilteredHolidays(filterResult);
  };

  // 음력날짜 => 양력날짜로 변경
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

  // 공휴일 표기(음력, 양력, 임시 등..)
  const transHday = useCallback((day) => {
    const year = new Date().getFullYear();
    // console.log("transHday day:", day);
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

  // 날짜 형식 수정. yyy-m-dd
  const dateFormat = useCallback((date) => {
    return date.toLocaleString().replaceAll(". ", "-").split("-오전")[0];
  }, []);

  // 공휴일 기간 계산
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

  // 공휴일데이터 리스트로 작성하기
  const handleHolidays = useCallback(
    (list) => {
      const tempHlist = list.filter((day) => !day.name.includes("연휴"));
      const transHlist = tempHlist.map((day) => transHday(day));
      // console.log("tempHlist:", tempHlist);

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

  // 공휴일 데이터 수정/삭제
  const handleModify = (holiday, mode) => {
    // console.log("handleModify holiday:", holiday);
    setModifyValues(holiday);
    if (mode === "update") {
      setShowModify(true);
    } else if (mode === "delete") {
      setShowDeleteConfirm(true);
    }
  };

  // 공휴일 객체 유효성 체크
  const validate = (values) => {
    const errors = {};
    let err = "";

    if (!values.name) {
      errors.name = "공휴일명을 입력하세요."; // 공휴일명 검증
    }

    err = validateDate(values.dt, values.lunarYn); // 날짜 형식 검증
    if (err) errors.dt = err;

    err = validateSubstituteHoliday(values.substitute); //대체공휴일 지정 검증
    if (err) errors.substitute = err;

    return errors;
  };

  // 공휴일 추가
  const handleAddHoliday = async (values) => {
    // console.log("handleAddHoliday:", values);
    try {
      const result = await createHoliday(values); // API 호출
      if (result) {
        setMode("create");
        setShowConfirm(true);
      } else {
        console.log("Error occurred while adding holidays");
      }
    } catch (error) {
      console.error("Error occurred while adding holidays:", error);
    }
  };

  // 공휴일 데이터 수정
  const handleModifyHoliday = async (values) => {
    try {
      const result = await updateHoliday(values);
      if (result) {
        setMode("update");
        setShowConfirm(true);
      } else {
        console.log("Error occurred while editing holidays");
      }
    } catch (error) {
      console.error("Error occurred while editing holidays:", error);
    }
  };

  // 공휴일 데이터 삭제
  const handleDeleteHoliday = async () => {
    try {
      await deleteHoliday(modifyValues.hid);
      setMode("delete");
      setShowConfirm(true);
    } catch (error) {
      console.error("Error occurred while deleting holidays:", error);
    }
  };

  // 공휴일 등록/수정/삭제 실행
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

  // 공휴일 데이터 가져오기
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const holidayData = await fetchHolidaysData(); // API 호출
        const processedHolidays = handleHolidays(holidayData);
        setHolidays(processedHolidays);
        setFilteredHolidays(processedHolidays);
      } catch (error) {
        console.error("공휴일 목록 불러오기 실패:", error);
      }
    };
    fetchHolidays();
  }, [handleHolidays, reload]);

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
            onSubmit={async (values, { setSubmitting }) => {
              const holidayData = {
                ...values,
                substituteYn: values.substitute ? "Y" : "N",
              };
              // 유효성 검사가 성공했을 때만 확인 모달을 띄운다.
              // console.log("holidayData:", holidayData);
              setInitialValues(holidayData);
              await handleAddHoliday(holidayData);
              setSubmitting(false); // Submit 완료 후 비동기 작업이 끝났음을 알림
            }}
          >
            {({ isSubmitting, handleChange }) => (
              <Form>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    border: "none",
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
            <div className="admin-search-add-bar">
              <input
                className="admin-search"
                name="search"
                placeholder="휴일명 또는 날짜 검색"
              ></input>
              <button className="admin-search" onClick={handleHolidaySearch}>
                검색
              </button>
            </div>
          </div>
          <div className="data-table">
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
                      <button
                        className="btn-modify"
                        onClick={() => handleModify(holiday, "update")}
                      >
                        수정
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleModify(holiday, "delete")}
                      >
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
                    // console.log("holidayData:", holidayData);
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
                              value={modifyValues.type}
                              className="holiday-input-box"
                              onChange={handleChange}
                            >
                              <option value="임시공휴일" label="임시공휴일">
                                임시공휴일
                              </option>
                              <option value="공휴일" label="공휴일">
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
            <div className="admin-add-holiday-title">
              공휴일 정보를 삭제하시겠습니까?
            </div>
            <div style={{ marginTop: "20px" }}>
              - 삭제대상 :
              <span style={{ color: "red", fontWeight: "600", margin: "20px" }}>
                {modifyValues.dt} {modifyValues.name}
              </span>
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
            <div>
              공휴일이{" "}
              {mode === "create"
                ? "등록"
                : mode === "update"
                ? "수정"
                : mode === "delete"
                ? "삭제"
                : ""}
              되었습니다.
            </div>
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
