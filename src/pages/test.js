const start = new Date("2024-08-14 00:00:00");
const end = new Date();

const currentTime = new Date().toTimeString();
const startDt = new Date(start.toDateString() + " " + currentTime);
const endDt = new Date(
  new Date(end.setDate(end.getDate() - 1)).toDateString() + " " + currentTime
);
// const endDt = new Date(end.getDate() - 1 + " " + time);

console.log(currentTime);
console.log(startDt);
console.log(endDt);

const str = "str".repeat(3);

console.log(str);

let arr1 = [1, 2, 3];

arr1 = [...arr1, 1, 2, 3];
console.log(arr1);

console.log(arr1.includes(1));
