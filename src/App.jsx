import { Routes, Route, Navigate } from "react-router-dom";
import Workspace from "./pages/Workspace";
import Chat from "./pages/Chat";
import Reader from "./pages/Reader";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Workspace />} />
      <Route path="/library" element={<Workspace />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/reader" element={<Reader />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
