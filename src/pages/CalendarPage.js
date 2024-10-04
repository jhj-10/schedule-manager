import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";
import { format } from "date-fns";
import "../lib/CalendarPage.css";
import "moment/locale/ko";
import solarlunar from "solarlunar";

const localizer = momentLocalizer(moment);

Modal.setAppElement("#root");

const CustomDateHeader = ({ holidays, viewMonth, date, label }) => {
  const today = new Date(date);
  const t_year = today.getFullYear();
  const t_month = today.getMonth() + 1;
  const t_day = today.getDate();

  const dayOfWeek = today.getDay();

  let ldt;
  try {
    ldt = solarlunar.solar2lunar(t_year, t_month, t_day);
  } catch (error) {
    console.warn(`Invalid lunar date: ${error.message}`);
    ldt = null;
  }

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
            fontWeight: 500,
          }}
          role="cell"
        >
          {label}
        </button>

        {t_month === Number(viewMonth) && ldt && (
          <>
            <span
              style={{
                fontSize: "0.7em",
                color: holidayName ? "red" : "#aaa",
              }}
            >
              {ldt.lDay === 1 || ldt.lDay === 15
                ? `음 ${ldt.lMonth}.${ldt.lDay}`
                : `${ldt.lDay}`}
            </span>
            <p
              style={{
                fontSize: "0.7em",
                color: "red",
              }}
            >
              {holidayName}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

function CalendarPage({ selectedUsers, colorset, endPoint }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const END_POINT = endPoint;

  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [clickedDate, setClickedDate] = useState("");

  const calendarRef = useRef(null);

  const [calendarYear, setCalendarYear] = useState();
  const [calendarMonth, setCalendarMonth] = useState(null);
  const [calendarStatus, setCalendarStatus] = useState(false);

  const CustomEvent = ({ event }) => {
    const startTime = format(event.start, "HH:mm ");
    return (
      <div>
        <span>{startTime}</span>
        {event.title}
      </div>
    );
  };

  const [monthClick, setMonthClick] = useState(true);
  const [weekClick, setWeekClick] = useState(false);
  const [dayClick, setDayClick] = useState(false);

  // 툴바
  const CustomToolbar = (obj) => {
    // console.log("CustomToolbar :", obj);
    const year = new Date(obj.date).getFullYear();
    const month = new Date(obj.date).getMonth() + 1;
    // setCalendarYear(year);
    // setCalendarMonth(month);

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

    const lable = `${year}. ${month}. ${
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

  // 색상으로 본인/타인 일정구분
  const eventPropGetter = (event) => {
    // console.log("eventPropGetter selectedUsers:", selectedUsers);
    // console.log("eventPropGetter event:", event);
    // console.log("eventPropGetter colorset:", colorset);
    let backgroundColor = "";
    if (selectedUsers.length === 0) {
      const attendees = event.attendees || [];
      const isCreator = attendees.includes(user.id);
      const cs = colorset.find((item) => item.colorUserId === user.id);
      backgroundColor = isCreator ? cs.colorCd : "#bfbfc3";
    } else {
      // console.log("eventPropGetter event:", colorset, event);
      const cs = colorset.find((item) => item.colorUserId === event.userId);
      backgroundColor = cs ? cs.colorCd : "#bfbfc3";
    }
    return {
      style: { backgroundColor },
    };
  };

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
    navigate("/schedule/write", { state: { start, end } });
  };

  // 일정 클릭 시 모달창 오픈
  const handleSelectEvent = (event, e) => {
    // console.log("handleSelectEvent!! 모달창오픈!!");
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

      // console.log("e:", e);
      // console.log(
      //   "e.clientX, calendarRect.offsetLeft, calendarRect.offsetWidth: ",
      //   e.clientX,
      //   calendarRect.offsetLeft,
      //   calendarRect.offsetWidth / 7
      // );
      // console.log(
      //   "e.clientY, calendarRect.offsetTop, calendarRect.offsetHeight, (cellCnt / 7): ",
      //   e.clientY,
      //   calendarRect.offsetTop,
      //   calendarRect.offsetHeight / (cellCnt / 7)
      // );
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
        ).getTime() +
          1000 * 60 * 60 * 9
      );
      // console.log(
      //   "calendarFirstDay:",
      //   calendarFirstDay,
      //   firstDayCell,
      //   dayOffset()
      // );

      // 클릭한 위치의 날짜 출력
      let clickedDt = new Date(calendarFirstDay);
      clickedDt = new Date(
        clickedDt.setDate(calendarFirstDay.getDate() + dayOffset())
      )
        .toISOString()
        .split("T")[0];
      setClickedDate(clickedDt);
      // console.log("calendarFirstDay, clickedDt:", calendarFirstDay, clickedDt);
    }

    // console.log("modal event.attendees: ", event.attendees);
    const attendees = event.attendees;

    if (attendees && attendees.length > 0) {
      axios
        .get(`${END_POINT}/api/attendees?scheculeId=${event.projectId}`)
        .then((response) => {
          // console.log("modal response.data: ", event.projectId, response.data);
          const updatedEvent = { ...event, attendees: response.data };
          setSelectedEvent(updatedEvent);
        })
        .catch((error) => {
          console.error("There was an error fetching the attendees!", error);
        });
    } else {
      setSelectedEvent(event);
    }
  };

  // 모달창 닫기
  const closeModal = () => {
    setShowConfirm(false);
    setSelectedEvent(null); // Close the modal
  };

  // 선택한 일정 수정페이지로 이동
  const handleEdit = () => {
    navigate("/schedule/write", { state: selectedEvent });
  };

  // // ++++ 관리자페이지로 이동하는 메뉴로 변경해야 함 +++
  // const handleAddNewUser = () => {
  //   navigate("/admin", {});
  // };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  // 모달창 > 삭제버튼 클릭 > 확인 => 일정, 인력현황 삭제
  const handleConfirm = () => {
    setShowConfirm(false);
    // console.log("delete event:", events, selectedEvent);
    Promise.all([
      axios.delete(`${END_POINT}/api/schedules/${selectedEvent.projectId}`),
      axios.delete(
        `${END_POINT}/api/manpower-status/${selectedEvent.projectId}`
      ),
    ])
      .then(() => {
        setEvents(
          events.filter((event) => event.projectId !== selectedEvent.projectId)
        );
      })
      .catch((error) => {
        console.error("There was an error deleting the schedule!", error);
      });
    closeModal();
  };

  // 모달창 > 삭제버튼 클릭 > 취소 => 모달창 닫기
  const handleCancle = () => {
    setShowConfirm(false);
    closeModal();
  };

  // 모달창 > 클릭한 셀의 날짜 기준으로 참여자 목록 보이기
  const handleUserListVisible = (attendee) => {
    const sdt = new Date(attendee.start_dt).toISOString().split("T")[0];
    const edt = new Date(attendee.end_dt).toISOString().split("T")[0];
    return sdt <= clickedDate && edt >= clickedDate ? "" : "visible";
  };

  // 달력 높이 화면에 맞추기
  // const [pageHeight, setPageHeight] = useState(window.innerHeight - 65);

  // useEffect(() => {
  //   const handleResize = () => {
  //     setPageHeight(window.innerHeight - 65);
  //   };
  //   window.addEventListener("resize", handleResize);

  //   return () => {
  //     window.removeEventListener("resize", handleResize);
  //   };
  // }, []);

  // 화면 너비에 따라 유저인포 창 보이기여부
  // const [userInfovisible, setUserInfoVisible] = useState("");

  // useEffect(() => {
  //   const handleUserInfoVisible = () => {
  //     if (window.innerWidth < 650) {
  //       setUserInfoVisible("visible");
  //     } else {
  //       setUserInfoVisible("");
  //     }
  //   };
  //   window.addEventListener("resize", handleUserInfoVisible);

  //   return () => {
  //     window.removeEventListener("resize", handleUserInfoVisible);
  //   };
  // }, []);

  // 버튼클릭으로 유저인포 창 보이기 여부
  // const handleVisible = () => {
  //   setUserInfoVisible(userInfovisible === "visible" ? "" : "visible");
  // };

  // 일정가져오기
  useEffect(() => {
    // console.log("useEffect selectedUsers:", `${selectedUsers}`);
    axios
      .get(`${END_POINT}/api/schedules?userId=${selectedUsers}`)
      .then((response) => {
        const fetchedEvents = response.data.map((event) => ({
          projectId: event.pid || "",
          userId: event.userId || "",
          title: event.title || "",
          attendees: event.attendees || [],
          start: event.start ? new Date(event.start) : "",
          end: event.end ? new Date(event.end) : "",
          pStartDt: event.pStartDt ? new Date(event.pStartDt) : "",
          pEndDt: event.pEndDt ? new Date(event.pEndDt) : "",
        }));
        setEvents(fetchedEvents);
        // console.log("useEffect selectedUsers response:", response.data);
        // console.log("useEffect selectedUsers events:", events);
      })
      .catch((error) => {
        console.error("There was an error fetching the schedules!", error);
      });
  }, [selectedUsers, END_POINT]);

  // 달력이 바뀔 때 마다 년,월 추출
  useEffect(() => {
    const calendarElement = calendarRef.current;

    if (!calendarElement) {
      console.error("Calendar element not found.");
      return;
    }

    const [labelYear, labelMonth] = calendarElement
      .querySelectorAll(".rbc-toolbar-label")[0]
      .innerText.replaceAll(" ", "")
      .split(".");
    // console.log("labelCell:", labelYear, labelMonth);

    setCalendarYear(labelYear);
    setCalendarMonth(labelMonth);
  }, [calendarRef, calendarStatus]);

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

  // 대체공휴일 지정이 가능한 날짜 확인
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
        let substituteNeeded = false;

        if (holiday.name.includes(",")) substituteNeeded = true;

        if (holiday.substituteYn === "Y") {
          const dayOfWeek = new Date(holiday.dt).getDay();
          if (holiday.substitute.includes(dayOfWeek)) substituteNeeded = true;
        }

        if (substituteNeeded) {
          // const substituteHoliday = calculateSubstituteHoliday(
          //   holiday,
          //   updatedHolidays
          // );
          const substituteHoliday = (holiday, updatedHolidays) => {
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
          if (!checkHoliday(substituteHoliday.dt, updatedHolidays)) {
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
        const response = await axios.get(`${END_POINT}/api/holidays`);
        const holidaysData = response.data;

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
  }, [END_POINT, convertToSolarDate, addSubstituteHolidays]);

  return (
    <>
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
          views={{
            month: true,
            week: true,
            day: true,
          }}
          defaultView={Views.MONTH} // Set default view to 'week' if needed
          components={{
            event: CustomEvent,
            toolbar: CustomToolbar,
            month: {
              dateHeader: (props) => (
                <CustomDateHeader
                  holidays={holidays}
                  viewMonth={calendarMonth}
                  {...props}
                />
              ),
            },
            week: {
              dateHeader: (props) => (
                <CustomDateHeader holidays={holidays} {...props} />
              ),
            },
            day: {
              dateHeader: (props) => (
                <CustomDateHeader holidays={holidays} {...props} />
              ),
            },
          }}
          messages={{
            date: "날짜",
            time: "시간",
            event: "이벤트",
            today: "오늘",
            previous: "이전",
            next: "다음",
            month: "월",
            week: "주",
            day: "일",
            agenda: "일정",
            noEventsInRange: "이 범위 내에서 이벤트가 없습니다.",
            showMore: (total) => `+ ${total} 더 보기`,
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
                  <li key={index} className={handleUserListVisible(attendee)}>
                    {/* {console.log("참여인력 attendee: ", attendee)} */}
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
            {(selectedEvent.attendees.some((attendee) => {
              return attendee.user_id === user.id || user.authority === "admin";
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
                  <p>일정을 삭제하시겠습니까?</p>
                  <button className="modal-btn confirm" onClick={handleConfirm}>
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
    </>
  );
}

export default CalendarPage;
