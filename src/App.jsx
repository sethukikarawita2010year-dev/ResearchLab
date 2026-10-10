import { Routes, Route, Navigate } from "react-router-dom";
import Workspace from "./pages/Workspace";
import Chat from "./pages/Chat";
import Reader from "./pages/Reader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Shell from "./components/Shell";
import { PdfSlideProvider } from "./components/PdfSlide";
import { SidebarProvider } from "./components/sidebarContext";
import { AuthProvider } from "./components/AuthProvider";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <AuthProvider>
      <PdfSlideProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Register />} />

            <Route element={<RequireAuth />}>
              <Route element={<Shell />}>
                <Route path="/library" element={<Workspace />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/reader" element={<Reader />} />
              </Route>
            </Route>

            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/signup" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SidebarProvider>
      </PdfSlideProvider>
    </AuthProvider>
  );
}
