import { createContext, useContext, useState } from "react";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toggleSettings = () => setSettingsOpen((v) => !v);
  const closeSettings = () => setSettingsOpen(false);
  return (
    <SettingsContext.Provider value={{ settingsOpen, setSettingsOpen, toggleSettings, closeSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
