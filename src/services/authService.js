import axios from "axios";

// Set the backend endpoint, ensuring it's correctly configured
const END_POINT = process.env.REACT_APP_BACKEND_URL || "";

// Function to check if the user is authenticated
export const checkAuthStatus = async () => {
  try {
    const response = await axios.get(`${END_POINT}/api/protected`, {
      withCredentials: true,
    });
    console.log("checkAuthStatus!!! /api/protected:", response.data);
    return response.data; // Assuming the backend returns user data (e.g., { username: 'user' })
  } catch (error) {
    console.error("Error checking authentication status:", error);
    throw error;
  }
};

// Function to handle user login
export const loginUser = async (credentials) => {
  try {
    // Ensure that credentials are correctly passed as an object
    const response = await axios.post(`${END_POINT}/api/login`, credentials, {
      withCredentials: true, // Ensures cookies are sent and received
    });

    if (response.status === 200) {
      return response.data; // Return the backend response if login is successful
    } else {
      throw new Error("Login failed: Unexpected response status");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

// 비밀번호 찾기
export const findPassword = async (emails) => {
  console.log("emails:", emails);
  try {
    const response = await axios.post(`${END_POINT}/api/password`, emails, {
      withCredentials: true,
    });

    if (response.status === 200) {
      return response.data; // Return the backend response if login is successful
    } else {
      throw new Error("Find Password failed: Unexpected response status");
    }
  } catch (error) {
    console.error("Error Finding Password:", error);
    throw error;
  }
};

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

// Function to handle user logout
export const logoutUser = async () => {
  try {
    await axios.post(`${END_POINT}/api/logout`, {}, { withCredentials: true });
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};
