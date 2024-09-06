// src/components/CustomDateContentRow.js
import React from "react";
import { startOfWeek, addDays, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";

const CustomDateContentRow = ({ events, date, users, dayPropGetter }) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const getEventsForDay = (day, user) =>
    events.filter(
      (event) => isSameDay(event.start, day) && event.userId === user.id
    );

  return (
    <div className="rbc-time-content">
      {users.map((user) => (
        <div key={user.id} className="rbc-time-row">
          {days.map((day, i) => (
            <div
              key={i}
              className="rbc-day-slot"
              style={{ position: "relative" }}
              {...(dayPropGetter ? dayPropGetter(day) : {})}
            >
              {getEventsForDay(day, user).map((event) => (
                <div
                  key={event.id}
                  className="rbc-event"
                  style={{
                    position: "absolute",
                    top: `${
                      ((event.start.getHours() * 60 +
                        event.start.getMinutes()) /
                        1440) *
                      100
                    }%`,
                    height: `${
                      ((event.end - event.start) / 1000 / 60 / 1440) * 100
                    }%`,
                    width: "100%",
                    backgroundColor: event.color || "#3174ad",
                    color: "#fff",
                  }}
                >
                  {event.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CustomDateContentRow;
