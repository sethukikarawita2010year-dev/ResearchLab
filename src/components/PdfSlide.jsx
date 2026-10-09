import { createContext, useContext, useState } from "react";

const PdfSlideContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function usePdfSlide() {
  return useContext(PdfSlideContext);
}

export function PdfSlideProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PdfSlideContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </PdfSlideContext.Provider>
  );
}
