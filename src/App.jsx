import { Routes, Route, Navigate } from "react-router-dom";
import Workspace from "./pages/Workspace";
import Chat from "./pages/Chat";
import Reader from "./pages/Reader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Shell from "./components/Shell";
import { PdfSlideProvider } from "./components/PdfSlide";
import { SidebarProvider } from "./components/sidebarContext";

export default function App() {
  return (
    <PdfSlideProvider>
      <SidebarProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Workspace />} />
            <Route path="/library" element={<Workspace />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/reader" element={<Reader />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SidebarProvider>
    </PdfSlideProvider>
  );
}
