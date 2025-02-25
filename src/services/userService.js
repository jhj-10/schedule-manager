import axios from "axios";

// Define your END_POINT here
const END_POINT = process.env.REACT_APP_BACKEND_URL || "";

/**
 * Fetch schedules for a given userId
 * @param {string} userId - The ID of the user
 * @returns {Promise} - Promise resolving with the fetched events
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
    }));

    return fetchedEvents;
  } catch (error) {
    console.error("There was an error fetching the schedules!", error);
    throw error; // Propagate the error so that the calling function can handle it
  }
};

/**
 * Fetch users for a given userId
 * @param {string} userId - The ID of the user making the request
 * @returns {Promise} - Promise resolving with the fetched user list
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
    throw error; // Propagate the error so the calling function can handle it
  }
};

/**
 * Fetch users based on the search value
 * @param {string} value - The search query
 * @returns {Promise} - Promise resolving with the users data
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
      throw error; // Propagate the error for the caller to handle
    }
  } else {
    try {
      const response = await axios.get(`${END_POINT}/api/users`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("There was an error fetching users!", error);
      throw error; // Propagate the error for the caller to handle
    }
  }
};

/**
 * 관리자 권한으로 사용자 목록 가져오기
 * @returns {Promise<Array>} 사용자 목록 데이터 배열
 */
export const fetchUserListAdmin = async () => {
  try {
    const response = await axios.get(`${END_POINT}/api/users?auth=admin`, {
      withCredentials: true,
    });
    return response.data; // 사용자 데이터 반환
  } catch (error) {
    console.error("사용자 목록 가져오기 실패:", error);
    throw error; // 에러를 호출한 곳에서 처리할 수 있도록 던짐
  }
};

/**
 * Create a new colorset for a user
 * @param {object} initialValues - Data containing userId, colorUserId, and colorCd
 * @returns {Promise} - Promise resolving with the API response
 */
export const createUser = async (initialValues) => {
  try {
    const response = await axios.post(`${END_POINT}/api/user`, initialValues, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("There was an error creating colorset!", error);
    throw error; // Propagate the error
  }
};

/**
 * Create a new colorset for a user
 * @param {object} updateUserInfo - Data containing userId, colorUserId, and colorCd
 * @returns {Promise} - Promise resolving with the API response
 */
export const updateUser = async (updateUserInfo) => {
  try {
    const response = await axios.put(`${END_POINT}/api/user`, updateUserInfo, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("There was an error update the userInfo!", error);
    throw error; // Propagate the error
  }
};

/**
 * Create a new colorset for a user
 * @param {object} colorsetData - Data containing userId, colorUserId, and colorCd
 * @returns {Promise} - Promise resolving with the API response
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
    throw error; // Propagate the error
  }
};

/**
 * Update an existing colorset for a user
 * @param {object} colorsetData - Data containing userId, colorUserId, and colorCd
 * @returns {Promise} - Promise resolving with the API response
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
    throw error; // Propagate the error
  }
};

/**
 * Fetch user information by userId
 * @param {string} userId - The ID of the user to fetch information for
 * @param {boolean} withCredentials - Whether or not to include credentials
 * @returns {Promise} - Promise resolving with the user information
 */
export const fetchUserInfo = async (userId, withCredentials = true) => {
  try {
    const response = await axios.get(`${END_POINT}/api/user/${userId}`, {
      withCredentials,
    });
    return response.data[0]; // Assuming the first object contains the user info
  } catch (error) {
    console.error("There was an error fetching the userInfo!", error);
    throw error; // Propagate the error
  }
};

/**
 * Fetch attendees for a given schedule (event) ID
 * @param {string} scheduleId - The ID of the schedule (event)
 * @returns {Promise} - Promise resolving with the attendees data
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
    throw error; // Propagate the error so it can be handled in the calling function
  }
};

/**
 * 일정 생성 API 요청
 * @param {Object} scheduleData 일정 데이터
 * @returns {Promise<number>} 생성된 일정의 `projectId` 반환
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
    throw error; // 호출한 곳에서 에러를 처리할 수 있도록 던짐
  }
};

/**
 * 일정 수정 API 요청
 * @param {number} projectId 수정할 일정 ID
 * @param {Object} scheduleData 수정할 일정 데이터
 * @returns {Promise<void>} 성공 시 아무것도 반환하지 않음
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
 * 인력 배치 정보 추가 API 요청
 * @param {number} projectId 일정 ID
 * @param {Array} attendees 참여자 목록
 * @returns {Promise<void>} 성공 시 아무것도 반환하지 않음
 */
export const addManpowerStatus = async (projectId, attendees) => {
  try {
    await axios.post(
      `${END_POINT}/api/manpower-status`,
      { project_id: projectId, attendees },
      { withCredentials: true }
    );
  } catch (error) {
    console.error("인력 배치 정보 추가 실패:", error);
    throw error;
  }
};

/**
 * 인력 배치 정보 삭제 API 요청
 * @param {string} projectId - The ID of the manpower status to delete
 * @returns {Promise} - Promise resolving when the manpower status is deleted
 */
export const deleteManpowerStatus = async (projectId) => {
  try {
    await axios.delete(`${END_POINT}/api/manpower-status/${projectId}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("인력 배치 정보 삭제 실패:", error);
    throw error; // Propagate the error for the caller to handle
  }
};

/**
 * Fetch holidays from the API
 * @returns {Promise} - Promise resolving with the holidays data
 */
export const fetchHolidaysData = async () => {
  try {
    const response = await axios.get(`${END_POINT}/api/holidays`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("There was an error fetching the holidays!", error);
    throw error; // Propagate the error for the caller to handle
  }
};

/**
 * Send account creation notification email
 * @param {Object} emailData - The ID of the manpower status to delete
 * @returns {Promise} - Promise resolving when the manpower status is deleted
 */
export const sendEmail = async (emailData) => {
  console.log("emailData:", emailData);
  try {
    const response = await axios.post(
      `${END_POINT}/api/send-email`,
      emailData,
      { withCredentials: true }
    );
    console.log("sendEmail:", response.status);
    return response;
  } catch (error) {
    console.error("There was an error sending the Email!", error);
    throw error; // Propagate the error for the caller to handle
  }
};

/**
 * 공휴일 추가 API 요청
 * @param {Object} holidayData 추가할 공휴일 정보
 * @returns {Promise<Object>} 생성된 공휴일 데이터 반환
 */
export const createHoliday = async (holidayData) => {
  try {
    const response = await axios.post(`${END_POINT}/api/holiday`, holidayData, {
      withCredentials: true,
    });
    return response.data; // 생성된 공휴일 데이터 반환
  } catch (error) {
    console.error("공휴일 추가 실패:", error);
    throw error; // 호출한 곳에서 에러를 처리할 수 있도록 던짐
  }
};

/**
 * 공휴일 수정 API 요청
 * @param {Object} holidayData 수정할 공휴일 정보
 * @returns {Promise<Object>} 수정된 공휴일 데이터 반환
 */
export const updateHoliday = async (holidayData) => {
  try {
    const response = await axios.put(`${END_POINT}/api/holiday/`, holidayData, {
      withCredentials: true,
    });
    return response.data; // 수정된 공휴일 데이터 반환
  } catch (error) {
    console.error("공휴일 수정 실패:", error);
    throw error; // 호출한 곳에서 에러를 처리할 수 있도록 던짐
  }
};

/**
 * 공휴일 삭제 API 요청
 * @param {string} holidayId 삭제할 공휴일 ID
 * @returns {Promise<void>} 성공 시 아무것도 반환하지 않음
 */
export const deleteHoliday = async (holidayId) => {
  try {
    await axios.delete(`${END_POINT}/api/holiday/${holidayId}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("공휴일 삭제 실패:", error);
    throw error; // 호출한 곳에서 에러를 처리할 수 있도록 던짐
  }
};

/**
 * 공휴일 목록 가져오기 API 요청
 * @returns {Promise<Array>} 공휴일 목록 데이터 배열
 */
export const fetchHolidays = async (END_POINT) => {
  try {
    const response = await axios.get(`${END_POINT}/api/holidays`, {
      withCredentials: true,
    });
    return response.data; // 공휴일 목록 데이터 반환
  } catch (error) {
    console.error("공휴일 목록 가져오기 실패:", error);
    throw error; // 호출한 곳에서 에러를 처리할 수 있도록 던짐
  }
};
