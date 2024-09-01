import React, { useContext, useEffect, useRef, useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";
import { format } from "date-fns";
import UserInfo from "./UserInfo";
import "../lib/CalendarPage.css";

const localizer = momentLocalizer(moment);

Modal.setAppElement("#root"); // To avoid accessibility warning

function CalendarPage() {
  const { user, logout } = useContext(AuthContext);
  //   console.log("userid: ", user.id);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [clickedDate, setClickedDate] = useState("");

  const calendarRef = useRef(null);

  const CustomEvent = ({ event }) => {
    const startTime = format(event.start, "HH:mm ");
    return (
      <div>
        <strong>
          <span>{startTime}</span>
          {event.title}
        </strong>
      </div>
    );
  };

  // 툴바
  const CustomToolbar = (obj) => {
    const year = new Date(obj.date).getFullYear();
    const month = new Date(obj.date).getMonth() + 1;

    const [monthClick, setMonthClick] = useState(true);
    const [weekClick, setWeekClick] = useState(false);
    const [dayClick, setDayClick] = useState(false);

    const handleClickToday = () => obj.onNavigate("TODAY");
    const handleClickPrev = () => obj.onNavigate("PREV");
    const handleClickNext = () => obj.onNavigate("NEXT");

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

    return (
      <div className="rbc-toolbar">
        <span className="rbc-toolbar-label left">
          {year}. {month}.
        </span>
        <span className="rbc-btn-group left">
          <button type="button" onClick={handleClickToday}>
            오늘
          </button>
          <button type="button" onClick={handleClickPrev}>
            이전달
          </button>
          <button type="button" onClick={handleClickNext}>
            다음달
          </button>
        </span>
        <span className="rbc-btn-group">
          <button
            type="button"
            className={monthClick ? "rbc-active" : ""}
            onClick={handleClickMonth}
          >
            월별
          </button>
          <button
            type="button"
            className={weekClick ? "rbc-active" : ""}
            onClick={handleClickWeek}
          >
            주별
          </button>
          <button
            type="button"
            className={dayClick ? "rbc-active" : ""}
            onClick={handleClickDay}
          >
            일별
          </button>
        </span>
      </div>
    );
  };

  // 색상으로 본인/타인 일정구분
  const eventPropGetter = (event) => {
    const attendees = event.attendees || [];
    // console.log("eventPropGetter:", event.attendees);
    const isCreator = attendees.includes(user.id);
    const backgroundColor = isCreator ? "#3174ad" : "#ff7f50";
    return {
      style: { backgroundColor },
    };
  };

  //   const handleSelectSlot = ({ start, end }) => {
  //     // Redirect to schedule creation page
  //     window.location.href = "/schedule/new";
  //   };

  // 클릭한 셀 날짜의 일정 작성페이지로 이동
  const handleSelectSlot = (event) => {
    let { start, end } = event;

    const currentTime = new Date().toTimeString();
    start = new Date(start.toDateString() + " " + currentTime);
    end = new Date(
      new Date(end.setDate(end.getDate() - 1)).toDateString() +
        " " +
        currentTime
    );

    console.log(start, end);
    navigate("/schedule/write", { state: { start, end } });
  };

  //   const handleSelectSlot = ({ start, end }) => {
  //     // Navigate to schedule creation page
  //     navigate("/schedule/write", { state: { start, end } });
  //   };

  // 일정 클릭 시 모달창 오픈
  const handleSelectEvent = (event, e) => {
    // 브라우저 화면을 기준으로 클릭한 위치의 날짜 계산
    console.log("calendarRef:", calendarRef);
    // 달력객체
    const calendarElement = calendarRef.current;

    if (!calendarElement) {
      console.error("Calendar element not found.");
      return;
    }

    // 달력의 날짜 셀 객체 배열
    const dateCells = calendarElement.querySelectorAll(".rbc-date-cell");
    const cellCnt = dateCells.length;
    // 현재 화면에 출력된 달의 1일이 달력의 날짜 셀 중 몇번째 셀인지 계산
    let firstDayCell = 0;
    console.log("cellCnt:", cellCnt);
    for (const cell of dateCells) {
      console.log("dataCell:", cell);
      const dateText = cell.textContent || cell.innerText;
      if (dateText === "01") break;
      firstDayCell++;
    }
    console.log("firstDayCell:", firstDayCell);

    // 클릭한 위치의 xy좌표를 구해서 해당 셀이 1일 셀로 부터 얼마나(며칠) 떨어져 있는지 계산
    const calendarRect = calendarElement.querySelectorAll(".rbc-month-view")[0];
    const clickPositionX = e.clientX - calendarRect.offsetLeft;
    const clickPositionY = e.clientY - calendarRect.offsetTop;
    const cellWidth = calendarRect.offsetWidth / 7;
    const cellHeight = calendarRect.offsetHeight / (cellCnt / 7);

    const dayOffset = () => {
      let { x, y } = 0;
      x = Math.floor(clickPositionX / cellWidth);
      y = Math.floor(clickPositionY / cellHeight);
      console.log("x, y:", x, y);

      return 7 * y + x - firstDayCell;
    };

    // Date객체로 변환
    const calendarFirstDay = new Date(
      new Date(
        calendarElement
          .querySelectorAll(".rbc-toolbar-label")[0]
          .outerText.replace(/\./g, "-")
          .replace(/\s/g, "") + "1"
      ).getTime() +
        1000 * 60 * 60 * 9
    );

    // 클릭한 위치의 날짜 출력
    const dt = new Date(calendarFirstDay);
    const clickedDt = new Date(
      dt.setDate(calendarFirstDay.getDate() + dayOffset())
    )
      .toISOString()
      .split("T")[0];
    console.log("dt:", clickedDt);
    setClickedDate(clickedDt);

    const attendees = event.attendees;
    console.log("Attendees:", attendees);

    if (attendees && attendees.length > 0) {
      axios
        .get(`http://localhost:5000/api/attendees?scheculeId=${event.id}`)
        .then((response) => {
          console.log("Response:", response);
          const updatedEvent = { ...event, attendees: response.data };
          setSelectedEvent(updatedEvent);
        })
        .catch((error) => {
          console.error("There was an error fetching the attendees!", error);
        });
    } else {
      setSelectedEvent(event);
    }
    console.log("selectedEvent:", selectedEvent);
  };

  // 모달창 닫기
  const closeModal = () => {
    setShowConfirm(false);
    setSelectedEvent(null); // Close the modal
  };

  // 선택한 일정 수정페이지로 이동
  const handleEdit = () => {
    console.log("selectedEvent:", selectedEvent);
    navigate("/schedule/write", { state: selectedEvent });
  };

  // ++++ 관리자페이지로 이동하는 메뉴로 변경해야 함 +++
  const handleAddNewUser = () => {
    navigate("/admin", {});
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  // 모달창 > 삭제버튼 클릭 > 확인 => 일정 삭제
  const handleConfirm = () => {
    setShowConfirm(false);
    axios
      .delete(`http://localhost:5000/api/schedules/${selectedEvent.id}`)
      .then(() => {
        setEvents(events.filter((event) => event.id !== selectedEvent.id));
      })
      .catch((error) => {
        console.error("There was an error deleting the schedule!", error);
      });
    console.log("일정 삭제");
    closeModal();
  };

  // 모달창 > 삭제버튼 클릭 > 취소 => 모달창 닫기
  const handleCancle = () => {
    setShowConfirm(false);
    closeModal();
  };

  // 모달창 > 클릭한 셀의 날짜 기준으로 참여자 목록 보이기
  const handleVisible = (attendee) => {
    console.log("handleVisible attendee:", attendee);
    const sdt = new Date(attendee.start_dt).toISOString().split("T")[0];
    const edt = new Date(attendee.end_dt).toISOString().split("T")[0];
    console.log("value.start, value.end, clickedDate:", sdt, edt, clickedDate);
    return sdt <= clickedDate && edt >= clickedDate ? "" : "visible";
  };

  // 일정가져오기
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/schedules")
      .then((response) => {
        const fetchedEvents = response.data.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
        setEvents(fetchedEvents);
      })
      .catch((error) => {
        console.error("There was an error fetching the schedules!", error);
      });
  }, []);

  // 브라우저 종료시 자동로그아웃
  useEffect(() => {
    const handleBeforeUnload = () => {
      logout(); // Call the logout function before closing the window
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [logout]);

  return (
    <div>
      <h2>
        <div>Calendar</div>
        <div>
          {user.authority === "admin" ? (
            // <a onClick={handleAddNewUser}>관리자페이지</a>
            <button onClick={handleAddNewUser}>관리자페이지</button>
          ) : (
            ""
          )}
          <button onClick={logout}>Logout</button>
        </div>
      </h2>
      <div className="page-container">
        <UserInfo />
        <div ref={calendarRef} className="calendar-container">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            className="calendar-container"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            views={["month", "week", "day"]} // Ensure these views are enabled
            defaultView={Views.MONTH} // Set default view to 'week' if needed
            components={{
              event: CustomEvent,
              toolbar: CustomToolbar,
            }}
          />
        </div>
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
              {new Date(selectedEvent.start).toLocaleString()}
            </div>
            <div className="modal-attribute">
              <strong>종료일시</strong>{" "}
              {new Date(selectedEvent.end).toLocaleString()}
            </div>
            <div className="modal-attribute">
              <strong className="align-top">참여인력</strong>
              {selectedEvent.attendees ? (
                <div className="attendees-list">
                  {selectedEvent.attendees.map((attendee, index) => (
                    <li key={index} className={handleVisible(attendee)}>
                      {attendee.name} ({attendee.email})
                    </li>
                  ))}
                </div>
              ) : (
                selectedEvent.attendees
              )}
            </div>
            <div className="modal-attribute">
              <strong className="align-top">메모</strong> {selectedEvent.notes}
            </div>

            <div className="button-div">
              {console.log("creator, user: ", selectedEvent, user.id)}
              {selectedEvent.attendees.some((attendee) => {
                console.log("selectedEvent.attendees:", attendee, user.id);
                return (
                  attendee.user_id === user.id || user.authority === "admin"
                );
              }) && (
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
                    <p>일정을 삭제하시겠습니까?</p>
                    <button
                      className="modal-btn confirm"
                      onClick={handleConfirm}
                    >
                      확인
                    </button>
                    <button className="modal-btn cancle" onClick={handleCancle}>
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
