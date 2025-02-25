import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const timeoutRef = useRef(null); // timeoutId를 useRef로 변경

  // 새로고침 시 로그인 상태 유지
  useEffect(() => {
    const savedUser = localStorage.getItem("loginUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // console.log("로그인 정보 로드 완료:", parsedUser);
        resetInactivityTimeout(); // 로그인 정보가 있으면 자동 로그아웃 타이머 시작
      } catch (error) {
        console.error("localStorage 데이터 파싱 오류:", error);
        setUser(null);
      }
    } else {
      console.warn("localStorage에 loginUser 없음");
      setUser(null);
    }
    setLoading(false);
  }, []);

  // 로그인 함수
  const login = async (credentials) => {
    try {
      const userData = await loginUser(credentials);
      if (userData && userData.user) {
        // console.log("로그인 성공:", userData.user);
        setUser(userData.user);
        localStorage.setItem("loginUser", JSON.stringify(userData.user)); // userData.user 저장
        resetInactivityTimeout(); // 로그인 시 자동 로그아웃 타이머 시작
        navigate("/");
        return { success: true, user: userData.user };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      return { success: false };
    }
  };

  // 로그아웃 함수 (자동 로그아웃 시 localStorage 유지)
  const logout = useCallback(
    (isAutoLogout = false) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current); // 기존 타이머 정리
        timeoutRef.current = null; // 타이머 참조 제거
      }
      setUser(null);

      if (!isAutoLogout) {
        localStorage.removeItem("loginUser"); // 수동 로그아웃일 때만 localStorage 삭제
      }

      navigate("/login");
    },
    [navigate]
  );

  // 1시간 동안 활동 없으면 자동 로그아웃 (이벤트 리스너 추가)
  const resetInactivityTimeout = useCallback(() => {
    if (timeoutRef.current) {
      // console.log("기존 타이머 초기화:", timeoutRef.current);
      clearTimeout(timeoutRef.current); // 기존 타이머 초기화
    }
    timeoutRef.current = setTimeout(() => {
      // console.log("1시간 동안 활동이 없어 자동 로그아웃됨");
      logout(true); // 자동 로그아웃 (localStorage 유지)
    }, 5 * 60 * 1000); // 1시간(60분) 후 자동 로그아웃
  }, [logout]);

  // 사용자 활동 감지하여 자동 로그아웃 타이머 리셋
  useEffect(() => {
    const handleActivity = () => resetInactivityTimeout();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [resetInactivityTimeout]);

  // 브라우저 창 닫힐 때 자동 로그아웃
  useEffect(() => {
    const handleLogoutOnClose = () => logout(true); // localStorage 유지

    window.addEventListener("beforeunload", handleLogoutOnClose);
    return () => {
      window.removeEventListener("beforeunload", handleLogoutOnClose);
    };
  }, [logout]);

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
