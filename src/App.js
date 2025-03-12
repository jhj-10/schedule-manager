import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import PrivateRoute from "./context/PrivateRoute";
import AdminRoute from "./context/AdminRoute";
import Layout from "./layouts/Layout";
import CalendarPage from "./pages/CalendarPage";
import EditUserInfo from "./pages/EditUserInfo";
import CalendarDiv from "./pages/CalendarDiv";
import LoginPage from "./pages/LoginPage";
import UserInfoViewPage from "./pages/UserInfoViewPage";
import ScheduleFormPage from "./pages/ScheduleFormPage";
import AdminPage from "./pages/AdminPage";
import AdminUserListPage from "./pages/AdminUserListPage";
import HolidayListPage from "./pages/HolidayListPage";
import AddUser from "./pages/AddUser";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 로그인 페이지 (비로그인 시 접근 가능) */}
          <Route path="/login" element={<LoginPage />} />

          {/* 로그인된 사용자만 접근 가능 */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route element={<CalendarPage />}>
                <Route path="/" element={<CalendarDiv />} />
                <Route path="/schedule/new" element={<ScheduleFormPage />} />
                <Route
                  path="/schedule/edit/:id"
                  element={<ScheduleFormPage />}
                />
                <Route path="/user/mypage" element={<EditUserInfo />} />
                <Route path="/user/:id" element={<UserInfoViewPage />} />
              </Route>
            </Route>
          </Route>

          {/* 관리자만 접근 가능 */}
          <Route element={<AdminRoute />}>
            <Route element={<Layout />}>
              <Route element={<AdminPage />}>
                <Route path="/admin" element={<AdminUserListPage />} />
                <Route path="/admin/user/:id" element={<EditUserInfo />} />
                <Route path="/admin/user/new" element={<AddUser />} />
                <Route path="/admin/holidays" element={<HolidayListPage />} />
              </Route>
            </Route>
          </Route>

          {/* 잘못된 경로 접근 시 리디렉션 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
