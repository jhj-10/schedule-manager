import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import Modal from "react-modal";
import solarlunar from "solarlunar";
import { Lunar } from "lunar-javascript";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../lib/CalendarPage.css";
import "moment/locale/ko";
import { AuthContext } from "../context/AuthProvider";
import {
  deleteManpowerStatus,
  deleteSchedule,
  fetchAttendees,
  fetchHolidaysData,
  fetchSchedules,
} from "../services/userService";

const localizer = momentLocalizer(moment);

Modal.setAppElement("#root");

// 날짜 옆에 음력일자 추가
const CustomDateHeader = ({ label, date, viewMonth, holidays }) => {
  // console.log("holidays:", holidays);
  const today = new Date(date);
  const t_month = today.getMonth() + 1;
  const lunarDate = Lunar.fromDate(new Date(date));

  const dayOfWeek = today.getDay();

  const tday = today.toLocaleString().replaceAll(". ", "-").split("-오전")[0];
  const holiday = holidays.find((hd) => hd.dt === tday);
  const holidayName = holiday && holiday.name;

  return (
    <div>
      <div className="rbc-date-cell" role="cell">
        <button
          type="button"
          className="rbc-button-link"
          style={{
            color:
              t_month === Number(viewMonth) && (holidayName || dayOfWeek === 0)
                ? "red"
                : "",
            marginRight: "4px",
            fontSize: "0.8em",
            fontWeight: 500,
          }}
          role="cell"
        >
          {label}
        </button>

        {t_month === Number(viewMonth) && lunarDate && (
          <>
            <span
              style={{
                fontSize: "0.7em",
                color: holidayName ? "red" : "#aaa",
              }}
            >
              {lunarDate.getDay() === 1 || lunarDate.getDay() === 15
                ? `음 ${lunarDate.getMonth()}.${lunarDate.getDay()}`
                : `${lunarDate.getDay()}`}
            </span>
            <p
              style={{
                fontSize: "0.7em",
                color: "red",
              }}
            >
              {holidayName}
            </p>
            {/* <span>음력날짜</span> */}
          </>
        )}
      </div>
    </div>
  );
};

function CalendarDiv() {
  const { selectedUsers = [], colorset = [] } = useOutletContext(); // 사이드메뉴에서 선택한 사용자 리스트, 해당 사용자의 컬러셋 리스트
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]); // 일정 리스트
  const [holidays, setHolidays] = useState([]); // 공휴일 리스트
  const [selectedEvent, setSelectedEvent] = useState(null); // 선택한 일정
  const [clickedDate, setClickedDate] = useState(""); // 선택한 날짜
  const [showConfirm, setShowConfirm] = useState(false); // 확인창 on/off

  const [monthClick, setMonthClick] = useState(true); // 월간
  const [weekClick, setWeekClick] = useState(false); // 주간
  const [dayClick, setDayClick] = useState(false); // 일간

  const [calendarYear, setCalendarYear] = useState(""); // 현재 달력의 년도
  const [calendarMonth, setCalendarMonth] = useState(""); // 현재 달력의 월
  const [calendarStatus, setCalendarStatus] = useState(false); // 현재 달력의 상태(오늘, 이전, 다음)
  const [loading, setLoading] = useState(true); // 화면 로딩 상태 체크

  // 색상으로 일정구분
  const eventPropGetter = (event) => {
    let backgroundColor = "";
    if (selectedUsers.length === 0) {
      // const attendees = event.attendees || [];

      // 알툼일정, 미팅, 프로젝트 구분
      if (event.type === "altum") {
        backgroundColor = "#8B8000";
      } else if (event.type === "meeting") {
        backgroundColor = "#e68a29";
      } else {
        backgroundColor = "#6082B6";
      }
      // const isCreator = attendees.includes(user.id);
      // const cs = colorset.find((item) => item.colorUserId === user.id);
      // console.log("colorset:", cs);
      // backgroundColor = isCreator ? cs.colorCd : "#bfbfc3";
    } else {
      // 사람별 일정 구분
      const cs = colorset.find((item) => item.colorUserId === event.userId);
      backgroundColor = cs ? cs.colorCd : "#bfbfc3";
    }

    return {
      style: { backgroundColor },
    };
  };

  // 일정표기 포맷
  const CustomEvent = ({ event }) => {
    const eventType = event.type.substr(0, 1).toUpperCase();
    return (
      <div>
        <span>[{eventType}] </span>
        {event.title}
      </div>
    );
  };

  // 툴바
  const CustomToolbar = (obj) => {
    // console.log("CustomToolbar :", obj);
    useEffect(() => {
      const year = new Date(obj.date).getFullYear();
      const month = new Date(obj.date).getMonth() + 1;

      setCalendarYear(year);
      setCalendarMonth(month);
    }, [obj.date]); // obj.date가 변경될 때만 실행됨

    const handleClickToday = () => {
      setCalendarStatus(!calendarStatus);
      obj.onNavigate("TODAY");
    };
    const handleClickPrev = () => {
      setCalendarStatus(!calendarStatus);
      obj.onNavigate("PREV");
    };
    const handleClickNext = () => {
      setCalendarStatus(!calendarStatus);
      obj.onNavigate("NEXT");
    };

    const handleClickMonth = () => {
      setMonthClick(true);
      setWeekClick(false);
      setDayClick(false);
      obj.onView("month");
    };
    const handleClickWeek = () => {
      setMonthClick(false);
      setWeekClick(true);
      setDayClick(false);
      obj.onView("week");
    };
    const handleClickDay = () => {
      setMonthClick(false);
      setWeekClick(false);
      setDayClick(true);
      obj.onView("day");
    };

    const lable = `${calendarYear}. ${calendarMonth}. ${
      obj.view === "day" ? obj.label[0] : ""
    }`;

    return (
      <div
        className="rbc-toolbar"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div className="rbc-toolbar-label left">{lable}</div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <div className="rbc-btn-group left">
            <button type="button" onClick={handleClickToday}>
              오늘
            </button>
            <button type="button" onClick={handleClickPrev}>
              이전
            </button>
            <button type="button" onClick={handleClickNext}>
              다음
            </button>
          </div>
          <div className="rbc-btn-group">
            <button
              type="button"
              className={monthClick ? "rbc-active" : ""}
              onClick={handleClickMonth}
            >
              월간
            </button>
            <button
              type="button"
              className={weekClick ? "rbc-active" : ""}
              onClick={handleClickWeek}
            >
              주간
            </button>
            <button
              type="button"
              className={dayClick ? "rbc-active" : ""}
              onClick={handleClickDay}
            >
              일간
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 일정 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedEvents = await fetchSchedules("userId", selectedUsers);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedUsers, user.id]);

  // 선택한 날짜 정보 전달
  const handleSelectSlot = (event) => {
    let { start, end } = event;
    const currentTime = new Date().toTimeString();
    start = new Date(start.toDateString() + " " + currentTime);
    end = new Date(
      new Date(end.setDate(end.getDate() - 1)).toDateString() +
        " " +
        currentTime
    );
    console.log("start,end:", start, end);
    navigate("/schedule/new", { state: { start, end } });
  };

  // 일정 클릭 시 모달창 오픈
  const handleSelectEvent = (event, e) => {
    // console.log("handleSelectEvent!! 모달창오픈!!");
    // console.log("event:", event);
    // 브라우저 화면을 기준으로 클릭한 위치의 날짜 계산
    // 달력객체
    const calendarElement = calendarRef.current;

    if (!calendarElement) {
      console.error("Calendar element not found.");
      return;
    }

    // 달력의 날짜 셀 객체 배열
    const dateCells = calendarElement.querySelectorAll(".rbc-button-link");
    const cellCnt = dateCells.length;
    // console.log("cellCnt:", cellCnt);

    // 현재 화면에 출력된 달의 1일이 달력의 날짜 셀 중 몇번째 셀인지 계산
    let firstDayCell = 0;
    for (const cell of dateCells) {
      firstDayCell++;
      const dateText = cell.textContent || cell.innerText;
      if (dateText.substr(0, 2) === "01") break;
    }

    // console.log("firstDayCell:", firstDayCell);

    if (monthClick) {
      // 클릭한 위치의 xy좌표를 구해서 해당 셀이 1일 셀로 부터 얼마나(며칠) 떨어져 있는지 계산
      const calendarRect =
        calendarElement.querySelectorAll(".rbc-month-view")[0];

      const clickPositionX = e.clientX - calendarRect.offsetLeft;
      const clickPositionY = e.clientY - calendarRect.offsetTop - 20;
      const cellWidth = calendarRect.offsetWidth / 7;
      const cellHeight = calendarRect.offsetHeight / (cellCnt / 7);

      // console.log("firstDayCell:", firstDayCell);
      const dayOffset = () => {
        let { x, y } = 0;
        x = Math.floor(clickPositionX / cellWidth);
        y = Math.floor(clickPositionY / cellHeight);
        // console.log("x, y : ", x, y);
        return 7 * y + x - firstDayCell + 1;
      };

      // Date객체로 변환
      const calendarFirstDay = new Date(
        new Date(
          calendarElement
            .querySelectorAll(".rbc-toolbar-label")[0]
            .outerText.replace(/\./g, "-")
            .replace(/\s/g, "") + "1"
        )
      );

      // const calendarFirstDay = new Date(
      //   new Date(
      //     calendarElement
      //       .querySelectorAll(".rbc-toolbar-label")[0]
      //       .outerText.replace(/\./g, "-")
      //       .replace(/\s/g, "") + "1"
      //   ).getTime() +
      //     1000 * 60 * 60 * 9
      // );

      // 클릭한 위치의 날짜 출력
      let clickedDt = new Date(calendarFirstDay);
      clickedDt = new Date(
        clickedDt.setDate(calendarFirstDay.getDate() + dayOffset())
      );

      const year = clickedDt.getFullYear();
      const month = String(clickedDt.getMonth() + 1).padStart(2, "0");
      const day = String(clickedDt.getDate()).padStart(2, "0");

      setClickedDate(`${year}-${month}-${day}`);
      // console.log("calendarFirstDay, clickedDt:", calendarFirstDay, clickedDt);
    }

    // console.log("modal event.attendees: ", event.attendees);
    const attendees = event.attendees;

    const handleEvent = async (event) => {
      if (attendees && attendees.length > 0) {
        try {
          const attendeesData = await fetchAttendees(event.projectId); // Use the service function
          const updatedEvent = { ...event, attendees: attendeesData };
          setSelectedEvent(updatedEvent);
        } catch (error) {
          console.error("There was an error fetching the attendees!", error);
        }
      } else {
        setSelectedEvent(event);
      }
    };

    handleEvent(event);
  };

  // 모달창 닫기
  const closeModal = () => {
    setShowConfirm(false);
    setSelectedEvent(null); // Close the modal
  };

  // 모달창 > 클릭한 셀의 날짜 기준으로 참여자 목록 보이기
  const handleUserListVisible = (attendee) => {
    const sdt = new Date(attendee.start_dt).toISOString().split("T")[0];
    const edt = new Date(attendee.end_dt).toISOString().split("T")[0];
    return sdt <= clickedDate && edt >= clickedDate ? "" : "visible";
  };

  // 선택한 일정 수정페이지로 이동
  const handleEdit = () => {
    navigate(`/schedule/edit/${selectedEvent.projectId}`, {
      // state: selectedEvent,
    });
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  // 모달창 > 삭제버튼 클릭 > 확인 => 일정, 인력현황 삭제
  const handleConfirm = async () => {
    setShowConfirm(false);

    try {
      // Promise.all을 이용하여 일정과 인력현황을 동시에 삭제
      await Promise.all([
        deleteSchedule(selectedEvent.projectId), // 일정 삭제
        deleteManpowerStatus(selectedEvent.projectId), // 인력 현황 삭제
      ]);

      // 삭제 성공 후 이벤트 상태 업데이트
      setEvents(
        events.filter((event) => event.projectId !== selectedEvent.projectId)
      );
    } catch (error) {
      console.error("There was an error deleting the schedule!", error);
    }

    closeModal();
  };

  // 모달창 > 삭제버튼 클릭 > 취소 => 모달창 닫기
  const handleCancle = () => {
    setShowConfirm(false);
    closeModal();
  };

  // 음력공휴일 양력일자로 변환
  const convertToSolarDate = useCallback(
    (day) => {
      const data = { dt: "", name: "", substituteYn: "", substitute: [] };
      if (day.lunar_yn === "Y") {
        const [month, dayOfMonth] = day.dt.split("-");
        const solarDate = solarlunar.lunar2solar(
          Number(calendarYear),
          Number(month),
          Number(dayOfMonth)
        );
        data.dt = `${solarDate.cYear}-${solarDate.cMonth}-${solarDate.cDay}`;
      } else {
        const dateParts = day.dt.split("-");
        const year = dateParts.length > 2 ? dateParts[0] : calendarYear;
        const [month, dayOfMonth] = dateParts.slice(-2);
        data.dt = `${year}-${month}-${dayOfMonth}`;
      }

      if (day.substitute_yn === "Y") {
        data.substitute = day.substitute
          .split(",")
          .map((sub) => (sub === "토" ? 6 : sub === "일" ? 0 : sub));
      }

      data.name = day.name;
      data.substituteYn = day.substitute_yn;

      return data;
    },
    [calendarYear] // This ensures that the function only changes if calendarYear changes
  );

  // 지난해 말일 설날 연휴로 추가
  const addLunarNewYearEve = (holidaysList) => {
    const lunarNewYear = { ...holidaysList.find((day) => day.name === "설날") };
    if (lunarNewYear) {
      let newYearEveDate = new Date(lunarNewYear.dt);
      newYearEveDate.setDate(newYearEveDate.getDate() - 1);
      lunarNewYear.dt = `${newYearEveDate.getFullYear()}-${
        newYearEveDate.getMonth() + 1
      }-${newYearEveDate.getDate()}`;
      lunarNewYear.name = "설날연휴";
      holidaysList.splice(
        holidaysList.findIndex((day) => day.name === "설날"),
        0,
        lunarNewYear
      );
    }
  };

  // 중복된 공휴일 날짜 합치기
  const mergeHolidays = (holidaysList) => {
    const mergedHolidays = [];

    holidaysList.forEach((holiday) => {
      const existingHolidayIndex = mergedHolidays.findIndex(
        (el) => el.dt === holiday.dt
      );

      if (existingHolidayIndex === -1) {
        mergedHolidays.push(holiday);
      } else {
        const existingHoliday = mergedHolidays[existingHolidayIndex];
        existingHoliday.name = `${existingHoliday.name}, ${holiday.name}`;
        existingHoliday.substitute = [
          ...new Set([...existingHoliday.substitute, ...holiday.substitute]),
        ];
      }
    });

    return mergedHolidays;
  };

  // // 대체공휴일 지정이 가능한 날짜 확인
  // const calculateSubstituteHoliday = (holiday, holidaysList) => {
  //   let newDate = new Date(holiday.dt);

  //   while (true) {
  //     newDate.setDate(newDate.getDate() + 1);
  //     const newDateString = formatDate(newDate);
  //     const newDayOfWeek = newDate.getDay();

  //     if (
  //       !holiday.substitute.includes(newDayOfWeek) &&
  //       !checkHoliday(newDateString, holidaysList)
  //     ) {
  //       return { dt: newDateString, name: "대체공휴일" };
  //     }
  //   }
  // };

  // 공휴일 확인
  const checkHoliday = (day, list) => {
    return list.some((el) => el.dt === day);
  };

  // 날짜포멧
  const formatDate = (date) => {
    return date.toLocaleString().replaceAll(". ", "-").split("-오전")[0];
  };

  // 대체공휴일 추가
  const addSubstituteHolidays = useCallback(
    (holidaysList) => {
      const updatedHolidays = [...holidaysList];

      holidaysList.forEach((holiday) => {
        // console.log("holidaysList-holiday:", holiday);
        let substituteNeeded = false;

        if (holiday.name.includes(",")) substituteNeeded = true;

        if (holiday.substituteYn === "Y") {
          const dayOfWeek = new Date(holiday.dt).getDay();
          if (holiday.substitute.includes(dayOfWeek)) substituteNeeded = true;
        }

        if (substituteNeeded) {
          const calculateSubstituteHoliday = (holiday) => {
            let newDate = new Date(holiday.dt);
            while (true) {
              newDate.setDate(newDate.getDate() + 1);
              const newDateString = formatDate(newDate);
              const newDayOfWeek = newDate.getDay();

              if (
                !holiday.substitute.includes(newDayOfWeek) &&
                !checkHoliday(newDateString, holidaysList)
              ) {
                return { dt: newDateString, name: "대체공휴일" };
              }
            }
          };

          // 함수를 실행하여 결과 값을 얻어야 함!
          const substituteHoliday = calculateSubstituteHoliday(holiday);

          // 결과 값이 `null` 또는 `undefined`가 아니면 추가
          if (
            substituteHoliday &&
            !checkHoliday(substituteHoliday.dt, updatedHolidays)
          ) {
            updatedHolidays.push(substituteHoliday);
          }
        }
      });
      return updatedHolidays;
    },
    [] // No dependencies for this function
  );

  // 공휴일데이터 가져오기
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const holidaysData = await fetchHolidaysData();
        // const holidaysData = response.data;

        const holidaysList = holidaysData.map((day) => convertToSolarDate(day));

        // 지난해 말일 설날연휴 추가
        addLunarNewYearEve(holidaysList);

        // 중복된 공휴일 날짜 합치기
        const mergedHolidays = mergeHolidays(holidaysList);

        // 대체공휴일 추가
        const finalHolidays = addSubstituteHolidays(mergedHolidays);

        setHolidays(finalHolidays);
      } catch (error) {
        console.error("There was an error fetching the holidays!", error);
      }
    };

    // Call the fetch function
    fetchHolidays();
  }, [convertToSolarDate, addSubstituteHolidays]);

  return (
    <div ref={calendarRef} className="calendar-container">
      {loading ? (
        <div>Loading...</div> // Display loading message while fetching
      ) : (
        <>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            defaultView={Views.MONTH}
            components={{
              event: CustomEvent,
              toolbar: CustomToolbar,
              dateHeader: (props) => (
                <CustomDateHeader
                  holidays={holidays}
                  viewMonth={calendarMonth}
                  {...props}
                />
              ),
            }}
            messages={{
              showMore: (total) => `+ ${total} 더 보기`,
            }}
          />
          {selectedEvent && (
            <Modal
              isOpen={!!selectedEvent}
              onRequestClose={closeModal}
              contentLabel="Event Details"
              className="content modal-content"
              overlayClassName="overlay"
            >
              <h2 className="modal-title">{selectedEvent.title}</h2>
              <hr />
              <div className="modal-attribute">
                <strong>시작일시</strong>{" "}
                {selectedEvent.pStartDt.length > 0
                  ? new Date(selectedEvent.pStartDt).toLocaleString()
                  : new Date(selectedEvent.start).toLocaleString()}
              </div>
              <div className="modal-attribute">
                <strong>종료일시</strong>{" "}
                {selectedEvent.pEndDt.length > 0
                  ? new Date(selectedEvent.pEndDt).toLocaleString()
                  : new Date(selectedEvent.end).toLocaleString()}
              </div>
              <div className="modal-attribute">
                <strong className="align-top">참여인력</strong>
                {selectedEvent.attendees ? (
                  <div className="attendees-list">
                    {selectedEvent.attendees.map((attendee, index) => (
                      <li
                        key={index}
                        className={handleUserListVisible(attendee)}
                      >
                        {attendee.name} ({attendee.email})
                      </li>
                    ))}
                  </div>
                ) : (
                  selectedEvent.attendees
                )}
              </div>
              <div className="modal-attribute">
                <strong className="align-top">메모</strong>{" "}
                {selectedEvent.notes}
              </div>

              <div className="button-div">
                {(selectedEvent.attendees.some((attendee) => {
                  return (
                    attendee.user_id === user.id || user.authority === "admin"
                  );
                }) ||
                  selectedEvent.userId === user.id) && (
                  <>
                    <button className="modal-btn modify" onClick={handleEdit}>
                      수정
                    </button>
                    <button className="modal-btn cancle" onClick={handleDelete}>
                      삭제
                    </button>
                  </>
                )}

                <button className="modal-btn confirm" onClick={closeModal}>
                  확인
                </button>
                {showConfirm && (
                  <div className="overlay">
                    <div className="content confirm-dialog">
                      <div>일정을 삭제하시겠습니까?</div>
                      <button
                        className="modal-btn confirm"
                        onClick={handleConfirm}
                      >
                        확인
                      </button>
                      <button
                        className="modal-btn cancle"
                        onClick={handleCancle}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}

export default CalendarDiv;
