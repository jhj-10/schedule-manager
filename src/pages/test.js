// const today = new Date();

import { solarlunar } from "solarlunar";

// console.log(today);

// const firstDay = new Date("2024-1-1");
// console.log(new Date(new Date("2024-1-1").setDate(firstDay.getDate() + 253)));

// // console.log((today - firstDay) / (1000 * 60 * 60 * 24));
// // const lunarMonth = [[1,]]

// function lunarDate(date) {
//   const dt = new Date(date);
//   const lunarYear = [
//     { year: 2023, startDate: "2023-1-22", endDate: "2024-2-9" },
//     { year: 2024, startDate: "2024-2-10", endDate: "2025-1-28" },
//     { year: 2025, startDate: "2025-1-29", endDate: "2026-2-16" },
//   ];
//   for (const ly of lunarYear) {
//     if (dt > new Date(ly.startDate) && dt < new Date(ly.endDate))
//       return ly.year;
//     return "";
//   }
// }

// console.log(lunarDate(new Date("2024-1-1")));

const lunar = solarlunar.solar2lunar(2024, 2, 10);
const solar = solarlunar.lunar2solar(2024, 1, 1);

// console.log(solar);
