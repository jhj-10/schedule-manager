import axios from "axios";

const API_KEY = process.env.REACT_APP_API_KEY || "";

const apiClient = axios.create({
  withCredentials: true, // 쿠키 포함
  headers: {
    Authorization: `Bearer ${API_KEY}`, // API 키 자동 추가
    "Content-Type": "application/json", // JSON 요청 처리
  },
});

export default apiClient;
