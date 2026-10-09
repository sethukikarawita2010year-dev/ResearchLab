import { Outlet } from "react-router-dom";
import { usePdfSlide } from "./PdfSlide";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import PDFConverter from "../pages/PDFConverter";

export default function Shell() {
  const { isOpen } = usePdfSlide();

  return (
    <div className="bg-[#0c0e14] h-screen w-full overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`flex h-full w-[200%] transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
            isOpen ? "-translate-x-1/2" : "translate-x-0"
          }`}
        >
          <div className="relative h-full w-1/2 shrink-0 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </div>
          <div className="relative h-full w-1/2 shrink-0 overflow-hidden">
            <PDFConverter />
          </div>
        </div>
      </div>

      <TopNav />
      <Sidebar />
    </div>
  );
}
