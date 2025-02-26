import axios from "axios";

// 백엔드 엔드포인트(env 파일 참고)
const END_POINT = process.env.REACT_APP_BACKEND_URL || "";

/**
 * 특정 사용자Id에 대한 일정 가져오기 API 요청
 * @param {string} userId - 사용자ID
 * @returns {Promise} - 일정 정보 리스트
 */
export const fetchSchedules = async (userId) => {
  try {
    const response = await axios.get(
      `${END_POINT}/api/schedules?userId=${userId}`,
      {
        withCredentials: true,
      }
    );

    const fetchedEvents = response.data.map((event) => ({
      type: event.type || "",
      projectId: event.pid || "",
      userId: event.userId || "",
      title: event.title || "",
      attendees: event.attendees || [],
      start: event.start ? new Date(event.start) : "",
      end: event.end ? new Date(event.end) : "",
      pStartDt: event.pStartDt ? new Date(event.pStartDt) : "",
      pEndDt: event.pEndDt ? new Date(event.pEndDt) : "",
      notes: event.notes || "",
    }));

    return fetchedEvents;
  } catch (error) {
    console.error("There was an error fetching the schedules!", error);
    throw error; // 호출한 곳에서 에러를 처리할 수 있도록 던짐
  }
};

/**
 * 특정 사용자ID에 대한 사용자 정보 가져오기 API 요청
 * @param {string} userId - 사용자ID
 * @returns {Promise} - 사용자 리스트
 */ export const fetchUserList = async (userId) => {
  try {
    const response = await axios.get(
      `${END_POINT}/api/users?userId=${userId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("There was an error fetching the user list!", error);
    throw error;
  }
};

/**
 * 검색값을 기준으로 사용자 가져오기 API 요청
 * @param {string} value - 검색값
 * @returns {Promise} - 사용자 리스트
 */
export const searchUsers = async (value) => {
  if (value) {
    try {
      const response = await axios.get(
        `${END_POINT}/api/users?search=${value}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("There was an error fetching users!", error);
      throw error;
    }
  } else {
    try {
      const response = await axios.get(`${END_POINT}/api/users`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("There was an error fetching users!", error);
      throw error;
    }
  }
};

/**
 * admin페이지 - 사용자 전체 목록 가져오기 API 요청
 * @returns {Promise<Array>} - 사용자 전체 리스트
 */
export const fetchUserListAdmin = async () => {
  try {
    const response = await axios.get(`${END_POINT}/api/users?auth=admin`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("사용자 목록 가져오기 실패:", error);
    throw error;
  }
};

/**
 * 사용자 추가(사원등록) API 요청
 * @param {Object} initialValues - 사용자 정보
 * @returns {Promise} - 성공여부
 */
export const createUser = async (initialValues) => {
  try {
    const response = await axios.post(`${END_POINT}/api/user`, initialValues, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("There was an error creating colorset!", error);
    throw error;
  }
};

/**
 * 사용자 정보 수정 API 요청
 * @param {Object} updateUserInfo - 수정된 사용자 정보
 * @returns {Promise} - 성공여부
 */
export const updateUser = async (updateUserInfo) => {
  try {
    const response = await axios.put(`${END_POINT}/api/user`, updateUserInfo, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("There was an error update the userInfo!", error);
    throw error;
  }
};

/**
 * 사용자별 컬러셋 생성 API 요청
 * @param {Object} colorsetData - 컬러셋 데이터
 * @returns {Promise} - 성공여부
 */
export const createColorset = async (colorsetData) => {
  try {
    const response = await axios.post(
      `${END_POINT}/api/users/colorset`,
      colorsetData,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("There was an error creating colorset!", error);
    throw error;
  }
};

/**
 * 컬러셋 수정 API 요청
 * @param {Object} colorsetData - 수정된 컬러셋 정보
 * @returns {Promise} - 성공여부
 */
export const updateColorset = async (colorsetData) => {
  try {
    const response = await axios.put(
      `${END_POINT}/api/users/colorset`,
      colorsetData,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("There was an error updating colorset!", error);
    throw error;
  }
};

/**
 * 사용자 상세정보 가져오기 API 요청
 * @param {string} userId - 사용자ID
 * @returns {Promise} - 사용자정보
 */
export const fetchUserInfo = async (userId, withCredentials = true) => {
  try {
    const response = await axios.get(`${END_POINT}/api/user/${userId}`, {
      withCredentials,
    });
    return response.data[0]; // Assuming the first object contains the user info
  } catch (error) {
    console.error("There was an error fetching the userInfo!", error);
    throw error;
  }
};

/**
 * 일정 생성 API 요청
 * @param {Object} scheduleData - 일정 데이터
 * @returns {Promise<number>} - 생성된 일정의 `projectId` 반환
 */
export const createSchedule = async (scheduleData) => {
  try {
    const response = await axios.post(
      `${END_POINT}/api/schedules`,
      scheduleData,
      {
        withCredentials: true,
      }
    );
    return response.data.insertId; // 생성된 일정의 projectId 반환
  } catch (error) {
    console.error("일정 생성 실패:", error);
    throw error;
  }
};

/**
 * 일정 수정 API 요청
 * @param {number} projectId - 수정할 일정 ID
 * @param {Object} scheduleData - 수정할 일정 데이터
 * @returns {Promise<void>} - 성공 시 아무것도 반환하지 않음
 */
export const updateSchedule = async (projectId, scheduleData) => {
  try {
    await axios.put(`${END_POINT}/api/schedules/${projectId}`, scheduleData, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("일정 수정 실패:", error);
    throw error;
  }
};

/**
 * 일정 삭제 API 요청
 * @param {number} projectId 수정할 일정 ID
 * @returns {Promise<void>} 성공 시 아무것도 반환하지 않음
 */
export const deleteSchedule = async (projectId) => {
  try {
    await axios.delete(`${END_POINT}/api/schedules/${projectId}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("일정 삭제 실패:", error);
    throw error;
  }
};

/**
 * 인력 배치 정보 가져오기 API 요청
 * @param {string} scheduleId - 일정ID
 * @returns {Promise} - 해당일정에 대한 참여인력정보 리스트
 */
export const fetchAttendees = async (scheduleId) => {
  try {
    const response = await axios.get(
      `${END_POINT}/api/attendees?scheculeId=${scheduleId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("There was an error fetching the attendees!", error);
    throw error;
  }
};

/**
 * 인력 배치 정보 추가 API 요청
 * @param {number} projectId - 일정 ID
 * @param {Array} attendees - 참여자 목록
 * @returns {Promise<void>} - 성공 시 아무것도 반환하지 않음
 */
export const addManpowerStatus = async (projectId, attendees) => {
  try {
    await axios.post(
      `${END_POINT}/api/manpower-status`,
      { project_id: projectId, attendees },
      { withCredentials: true }
    );
  } catch (error) {
    console.error("Failed to add staffing information:", error);
    throw error;
  }
};

/**
 * 인력 배치 정보 삭제 API 요청
 * @param {string} projectId - 일정ID
 * @returns {Promise} - 성공여부
 */
export const deleteManpowerStatus = async (projectId) => {
  try {
    await axios.delete(`${END_POINT}/api/manpower-status/${projectId}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Failed to delete staffing information:", error);
    throw error; // Propagate the error for the caller to handle
  }
};

/**
 * 공휴일 정보 가져오기 API 호출
 * @returns {Promise<Array>} 공휴일 목록 데이터 배열
 */
export const fetchHolidaysData = async () => {
  try {
    const response = await axios.get(`${END_POINT}/api/holidays`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("There was an error fetching the holidays!", error);
    throw error;
  }
};

/**
 * 공휴일 추가 API 요청
 * @param {Object} holidayData - 추가할 공휴일 정보
 * @returns {Promise<Object>} - 생성된 공휴일 데이터 반환
 */
export const createHoliday = async (holidayData) => {
  try {
    const response = await axios.post(`${END_POINT}/api/holiday`, holidayData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to add public holidays:", error);
    throw error;
  }
};

/**
 * 공휴일 수정 API 요청
 * @param {Object} holidayData - 수정할 공휴일 정보
 * @returns {Promise<Object>} - 수정된 공휴일 데이터 반환
 */
export const updateHoliday = async (holidayData) => {
  try {
    const response = await axios.put(`${END_POINT}/api/holiday/`, holidayData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to edit public holidays:", error);
    throw error; // 호출한 곳에서 에러를 처리할 수 있도록 던짐
  }
};

/**
 * 공휴일 삭제 API 요청
 * @param {string} holidayId - 삭제할 공휴일 ID
 * @returns {Promise<void>} - 성공 시 아무것도 반환하지 않음
 */
export const deleteHoliday = async (holidayId) => {
  try {
    await axios.delete(`${END_POINT}/api/holiday/${holidayId}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Failed to delete holidays:", error);
    throw error;
  }
};

/**
 * 이메일 발송 API 요청
 * @param {Object} emailData - 이메일 데이터
 * @returns {Promise} - 실행 후 반환데이터
 */
export const sendEmail = async (emailData) => {
  try {
    const response = await axios.post(
      `${END_POINT}/api/send-email`,
      emailData,
      { withCredentials: true }
    );
    console.log("sendEmail:", response);
    return response;
  } catch (error) {
    console.error("There was an error sending the Email!", error);
    throw error;
  }
};
