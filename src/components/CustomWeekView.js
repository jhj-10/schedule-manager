import React, { useEffect, useState } from "react";
import { startOfWeek, addDays, addWeeks, format, isSameDay } from "date-fns";

const CustomWeekView = ({
  date,
  events,
  localizer,
  startAccessor,
  endAccessor,
}) => {
  const [currentWeek, setCurrentWeek] = useState([]);

  useEffect(() => {
    // Calculate the start of the current week
    const start = startOfWeek(date, { weekStartsOn: localizer.startOfWeek() });

    // Generate an array of dates representing the current week
    const weekDays = Array.from({ length: 7 }).map((_, index) =>
      addDays(start, index)
    );

    setCurrentWeek(weekDays);
  }, [date, localizer]);

  // Filter events to those that occur during the current week
  const eventsForDay = (day) =>
    events.filter((event) => isSameDay(day, new Date(event[startAccessor])));

  // CustomTimeGridHeader Component to display day labels
  const CustomTimeGridHeader = () => {
    return (
      <div className="rbc-row">
        {currentWeek.map((day) => (
          <div
            key={day}
            className="rbc-header"
            style={{ flexBasis: "14.2857%" }}
          >
            <strong>{format(day, "EEEE, MMM d")}</strong>
          </div>
        ))}
      </div>
    );
  };

  // Event Row Component to render events for each day
  const CustomEventRow = () => {
    return (
      <div className="rbc-row rbc-time-content">
        {currentWeek.map((day) => (
          <div
            key={day}
            className="rbc-day-slot"
            style={{ flexBasis: "14.2857%" }}
          >
            {eventsForDay(day).map((event, index) => (
              <div key={index} className="rbc-event">
                <div className="rbc-event-content">{event.title}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rbc-time-view">
      {/* TimeGridHeader rendering */}
      <div className="rbc-time-header">
        <div className="rbc-row rbc-time-header-content">
          <CustomTimeGridHeader />
        </div>
      </div>
      {/* Render the events below the date headers */}
      <div className="rbc-time-content">
        <CustomEventRow />
      </div>
    </div>
  );
};

// Implement the required navigate method
CustomWeekView.navigate = (date, action) => {
  switch (action) {
    case "PREV":
      return addWeeks(date, -1);
    case "NEXT":
      return addWeeks(date, 1);
    default:
      return date;
  }
};

// Implement the title method (optional)
CustomWeekView.title = (date) => {
  return `Week of ${format(startOfWeek(date), "MMMM d, yyyy")}`;
};

export default CustomWeekView;
