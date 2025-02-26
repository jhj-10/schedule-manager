import axios from "axios";

// 백엔드 엔드포인트 설정(env파일 참고)
const END_POINT = process.env.REACT_APP_BACKEND_URL || "";

// // 사용자 인증 확인
// export const checkAuthStatus = async () => {
//   try {
//     const response = await axios.get(`${END_POINT}/api/protected`, {
//       withCredentials: true,
//     });
//     console.log("checkAuthStatus!!! /api/protected:", response.data);
//     return response.data; // Assuming the backend returns user data (e.g., { username: 'user' })
//   } catch (error) {
//     console.error("Error checking authentication status:", error);
//     throw error;
//   }
// };

/**
 * 로그인 API 요청
 * @param {Object} credentials - 로그인 정보
 * @returns {Promise<Object>} - 성공여부, 로그인한 사용자 정보보
 */
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${END_POINT}/api/login`, credentials, {
      withCredentials: true,
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

/**
 * 비밀번호 찾기 API 요청
 * @param {Object} emails - 이메일 정보 객체
 * @returns {Promise<Object>} - 성공여부, 유저 정보
 */
export const findPassword = async (emails) => {
  try {
    const response = await axios.post(`${END_POINT}/api/password`, emails, {
      withCredentials: true,
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Find Password failed");
    }
  } catch (error) {
    console.error("Error Finding Password:", error);
    throw error;
  }
};

/**
 * 임시비밀번호 발급 API 요청
 * @param {string}} tp - 임시비밀번호
 * @param {Object} emails - 이메일 정보 객체
 * @returns {Promise<Object>} - 성공여부
 */
export const tempPassword = async (tp, emails) => {
  try {
    await axios.put(
      `${END_POINT}/api/tempPassword`,
      {
        password: tp,
        email: emails.altumEmail,
        email_sub: emails.gmailEmail,
      },
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error("Error Update Temporary Password:", error);
    throw error;
  }
};

/**
 * 로그아웃 API 요청
 * @returns {Promise<void>} - 성공 시 아무것도 반환하지 않음
 */
//
export const logoutUser = async () => {
  try {
    await axios.post(`${END_POINT}/api/logout`, {}, { withCredentials: true });
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};
