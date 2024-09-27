import React, { useEffect, useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const CustomWeekView = () => {
  const users = [1, 2, 3];
  return (
    <>
      <div
        className="rbc-time-header rbc-overflowing"
        style={{ marginRight: "18px" }}
      >
        <div
          className="rbc-label rbc-time-header-gutter"
          style={{
            width: "78.1806px",
            minWidth: "78.1806px",
            maxWidth: "78.1806px",
          }}
        ></div>
        <div className="rbc-time-header-content">
          <div className="rbc-row rbc-time-header-cell">
            <div className="rbc-header">01</div>
            <div className="rbc-header rbc-today">02</div>
            <div className="rbc-header">03</div>
            <div className="rbc-header">04</div>
            <div className="rbc-header">05</div>
            <div className="rbc-header">06</div>
            <div className="rbc-header">07</div>
          </div>
        </div>
      </div>
      <div
        className="rbc-time-header rbc-overflowing"
        style={{ marginRight: "18px" }}
      >
        <div
          className="rbc-label rbc-time-header-gutter"
          style={{
            width: "78.1806px",
            minWidth: "78.1806px",
            maxWidth: "78.1806px",
          }}
        ></div>
        <div className="rbc-time-header-content">
          <div className="rbc-row rbc-time-header-cell">
            <div className="rbc-header">01</div>
            <div className="rbc-header rbc-today">02</div>
            <div className="rbc-header">03</div>
            <div className="rbc-header">04</div>
            <div className="rbc-header">05</div>
            <div className="rbc-header">06</div>
            <div className="rbc-header">07</div>
          </div>
        </div>
      </div>
    </>
  );
};

// Implement the title method (optional)
CustomWeekView.title = () => {
  return `Week of`;
};

export default CustomWeekView;
