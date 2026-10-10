import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useSettings } from "./settingsContext";
import {
  changePassword,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  verifyPassword,
} from "../lib/authApi";
import Avatar from "./Avatar";
import Toast from "./Toast";

const A = "/assets";
const EYE = `${A}/login-icon-eye.svg`;
const MASK = "\u2022".repeat(14);

function PencilIcon({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function EyeButton({ shown, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={shown}
      className={`content-stretch flex items-center justify-center p-[2px] shrink-0 cursor-pointer transition-opacity ${
        shown ? "opacity-100" : "opacity-55 hover:opacity-100"
      }`}
    >
      <div className="h-[11.25px] relative shrink-0 w-[16.5px]">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={EYE} />
      </div>
    </button>
  );
}

function PasswordInput({ value, onChange, type, onEnter, autoFocus, placeholder }) {
  return (
    <div className="relative content-stretch flex items-center w-full">
      <input
        autoFocus={autoFocus}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}
        placeholder={placeholder}
        className="bg-[#1e1f26] content-stretch flex flex-1 h-[44px] items-center min-w-px overflow-clip px-[14px] pr-[42px] py-[14.5px] rounded-[8px] w-full font-inter text-[13px] text-[#e2e2eb] placeholder:text-[#908fa0] outline-none border-0"
      />
    </div>
  );
}

const rowLabel = "font-inter text-[#e2e2eb] text-[13px] tracking-[0.13px] whitespace-nowrap shrink-0";

export default function SettingsPopup() {
  const { user, updateUser, signOut, deleteAccount } = useAuth();
  const { settingsOpen, toggleSettings } = useSettings();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [showHash, setShowHash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const pictureRef = useRef(null);
  const committingRef = useRef(false);

  const [pwStep, setPwStep] = useState(null);
  const [currentPw, setCurrentPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [confirmPw, setConfirmPw] = useState("");
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const notify = (message, type = "error", duration = 3000) =>
    setToast({ message, type, duration, id: Date.now() });

  useEffect(() => {
    if (!settingsOpen) {
      setEditing(null);
      setPwStep(null);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setShowCurrentPw(false);
      setShowNewPw(false);
      setShowConfirmPw(false);
      setShowHash(false);
      return undefined;
    }
    let active = true;
    getProfile()
      .then((data) => {
        if (active) setProfile(data.user);
      })
      .catch(() => {
        if (active && user) setProfile((prev) => prev || { ...user, password: "" });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen]);

  if (!settingsOpen) return null;

  const view = profile || user || {};

  const clearLocalData = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("researchlab."))
        .forEach((k) => localStorage.removeItem(k));
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("researchlab."))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
  };

  const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
      navigate("/");
    }
  };

  const handleDeleteAccount = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteAccount();
      clearLocalData();
      setConfirmDelete(false);
      window.location.replace("/");
    } catch {
      setBusy(false);
      setConfirmDelete(false);
      notify("Error : Could not delete your account. Please try again.");
    }
  };

  const startEdit = (field) => {
    setEditing(field);
    setDraft(view[field] || "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };

  const commitEdit = async () => {
    if (!editing || committingRef.current) return;
    committingRef.current = true;
    const value = draft.trim();
    const field = editing;
    setEditing(null);
    if ((view[field] || "") === value) {
      committingRef.current = false;
      return;
    }
    setBusy(true);
    try {
      const data = await updateProfile({ [field]: value });
      setProfile((prev) => ({ ...(prev || {}), ...data.user }));
      updateUser(data.user);
    } catch (err) {
      notify(err?.message || "Error : Could not save your name!", "error", 3000);
    } finally {
      setBusy(false);
      committingRef.current = false;
    }
  };

  const onPickPicture = async (event) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    if (picked.type !== "image/png") {
      notify("Error : Profile picture must be a PNG!", "error", 3000);
      return;
    }
    setBusy(true);
    try {
      const data = await uploadProfilePicture(picked);
      setProfile((prev) => ({ ...(prev || {}), ...data.user }));
      updateUser(data.user);
      notify("Profile picture updated!", "success", 2000);
    } catch (err) {
      notify(err?.message || "Error : Could not update the profile picture!", "error", 3000);
    } finally {
      setBusy(false);
    }
  };

  const toggleDefaultWebSearch = async () => {
    const next = !view.default_web_search;
    setProfile((prev) => ({ ...(prev || {}), default_web_search: next }));
    updateUser({ default_web_search: next });
    try {
      const data = await updateProfile({ default_web_search: next });
      setProfile((prev) => ({ ...(prev || {}), ...data.user }));
      updateUser(data.user);
    } catch {
      const revert = !next;
      setProfile((prev) => ({ ...(prev || {}), default_web_search: revert }));
      updateUser({ default_web_search: revert });
      notify("Error : Could not update the web search default!", "error", 3000);
    }
  };

  const openPasswordChange = () => {
    setCurrentPw("");
    setShowCurrentPw(false);
    setPwStep("current");
  };

  const submitCurrentPw = async () => {
    if (!currentPw) return;
    setBusy(true);
    try {
      await verifyPassword(currentPw);
      setNewPw("");
      setConfirmPw("");
      setShowNewPw(false);
      setShowConfirmPw(false);
      setPwStep("new");
    } catch {
      notify("Error : Password is incorrect!", "error", 3000);
    } finally {
      setBusy(false);
    }
  };

  const submitNewPw = async () => {
    if (newPw !== confirmPw) {
      notify("Error : Confirmation password is incorrect!", "error", 3000);
      return;
    }
    setBusy(true);
    try {
      await changePassword({
        current_password: currentPw,
        new_password: newPw,
        confirm_password: confirmPw,
      });
      setPwStep(null);
      notify("Password successfully updated!", "success", 2000);
    } catch (err) {
      const detail = err?.message || "";
      if (/confirm/i.test(detail)) {
        notify("Error : Confirmation password is incorrect!", "error", 3000);
      } else {
        notify(detail ? `Error : ${detail}` : "Error : Could not update the password!", "error", 3000);
      }
    } finally {
      setBusy(false);
    }
  };

  const valueRow = (field, value) => {
    const isEditing = editing === field;
    return (
      <div className="group content-stretch flex items-center justify-between gap-[16px] min-h-[52px] py-[10px] w-full">
        <span className={rowLabel}>{field === "first_name" ? "First name :" : "Last name :"}</span>
        <div className="content-stretch flex items-center justify-end gap-[8px] min-w-0 flex-1">
          {isEditing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              onBlur={commitEdit}
              maxLength={100}
              className="bg-[#1e1f26] border border-[#2a3044] border-solid flex-1 min-w-0 h-[36px] px-[10px] rounded-[8px] font-inter text-[13px] text-[#f8fafc] outline-none focus:border-[#6366f1]"
            />
          ) : (
            <span className="font-inter text-[14px] text-[#f8fafc] truncate text-right min-w-0">
              {value || "\u2014"}
            </span>
          )}
          {!isEditing && (
            <button
              type="button"
              onClick={() => startEdit(field)}
              aria-label={`Edit ${field === "first_name" ? "first name" : "last name"}`}
              title="Edit"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[#94a3b8] hover:text-[#e2e8f0] cursor-pointer shrink-0 p-[2px]"
            >
              <PencilIcon />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="absolute inset-y-0 right-0 left-[260px] z-[120] flex items-center justify-center bg-black/60 p-[24px]">
        <div className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col items-center overflow-y-auto no-scrollbar rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.6)] max-h-[calc(100vh-48px)] w-[540px] max-w-full px-[32px] py-[28px]">
          <div className="group relative shrink-0">
            <button
              type="button"
              onClick={() => pictureRef.current?.click()}
              aria-label="Change profile picture"
              title="Change profile picture"
              className="group/pfp relative block rounded-full cursor-pointer"
            >
              <Avatar user={view} size={96} />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <PencilIcon size={22} />
              </span>
            </button>
            <input
              ref={pictureRef}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={onPickPicture}
            />
          </div>

          <div className="content-stretch flex flex-col items-center pt-[12px] pb-[20px] shrink-0">
            <div className="font-inter font-semibold text-[18px] text-[#f8fafc] tracking-[-0.18px] leading-[26px]">
              Profile Settings
            </div>
            <div className="font-inter text-[12px] text-[#94a3b8] leading-[18px] pt-[2px]">
              Manage your account details and preferences.
            </div>
          </div>

          <div className="bg-[#1e2230] h-px w-full shrink-0" />

          <div className="content-stretch flex flex-col items-start w-full">
            <div className="content-stretch flex items-center justify-between gap-[16px] min-h-[52px] py-[10px] w-full">
              <span className={rowLabel}>Email :</span>
              <span className="font-inter text-[14px] text-[#f8fafc] truncate text-right min-w-0">
                {view.email || "\u2014"}
              </span>
            </div>

            <div className="bg-[#1e2230] h-px w-full shrink-0" />
            {valueRow("first_name", view.first_name)}
            <div className="bg-[#1e2230] h-px w-full shrink-0" />
            {valueRow("last_name", view.last_name)}
            <div className="bg-[#1e2230] h-px w-full shrink-0" />

            <div className="group content-stretch flex items-center justify-between gap-[16px] min-h-[52px] py-[10px] w-full">
              <span className={rowLabel}>Password :</span>
              <div className="content-stretch flex items-center justify-end gap-[8px] min-w-0 flex-1">
                <span
                  className={`font-inter text-[13px] text-[#f8fafc] text-right min-w-0 break-all ${
                    showHash ? "" : "tracking-[1.5px]"
                  }`}
                >
                  {showHash ? view.password || "\u2014" : MASK}
                </span>
                <EyeButton
                  shown={showHash}
                  onToggle={() => setShowHash((v) => !v)}
                  label={showHash ? "Hide password" : "Show password"}
                />
                <button
                  type="button"
                  onClick={openPasswordChange}
                  aria-label="Change password"
                  title="Change password"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#94a3b8] hover:text-[#e2e8f0] cursor-pointer shrink-0 p-[2px]"
                >
                  <PencilIcon />
                </button>
              </div>
            </div>

            <div className="bg-[#1e2230] h-px w-full shrink-0" />

            <div className="content-stretch flex items-center justify-between gap-[16px] min-h-[52px] py-[10px] w-full">
              <span className={rowLabel}>Default web search</span>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(view.default_web_search)}
                onClick={toggleDefaultWebSearch}
                className={`h-[24px] relative rounded-full shrink-0 w-[44px] cursor-pointer transition-colors duration-200 ${
                  view.default_web_search ? "bg-[#22c55e]" : "bg-[#2a3044]"
                }`}
              >
                <div
                  className={`absolute bg-white rounded-full size-[20px] top-[2px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] transition-transform duration-200 ${
                    view.default_web_search ? "translate-x-[22px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
            </div>

            <div className="bg-[#1e2230] h-px w-full shrink-0" />

            <div className="content-stretch flex flex-col gap-[10px] items-center w-full pt-[4px] mt-[7px]">
              <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
                className="w-[60%] rounded-[8px] py-[10px] font-inter font-medium text-[14px] text-white bg-[#dc2626] border border-[#dc2626] border-solid cursor-pointer hover:bg-[#b91c1c] hover:border-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                Log out
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                className="w-[60%] rounded-[8px] py-[10px] font-inter font-medium text-[14px] text-[#fecaca] bg-[rgba(127,29,29,0.28)] border border-[#7f1d1d] border-solid cursor-pointer hover:bg-[rgba(127,29,29,0.5)] transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>

      {pwStep === "current" && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-[24px]">
          <div className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[16px] items-start rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.6)] w-[400px] max-w-full p-[24px]">
            <div className="content-stretch flex flex-col items-start">
              <div className="font-inter font-semibold text-[16px] text-white tracking-[-0.16px] leading-[24px]">
                Confirm your password
              </div>
              <div className="font-inter text-[13px] text-[#94a3b8] leading-[20px] pt-[2px]">
                Enter your current password to continue.
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[6px] items-start w-full">
              <span className={rowLabel}>Current password :</span>
              <div className="relative w-full">
                <PasswordInput
                  autoFocus
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPw}
                  onChange={setCurrentPw}
                  onEnter={submitCurrentPw}
                  placeholder="Enter current password"
                />
                <div className="absolute content-stretch flex items-center justify-center right-[12px] top-[11px]">
                  <EyeButton
                    shown={showCurrentPw}
                    onToggle={() => setShowCurrentPw((v) => !v)}
                    label={showCurrentPw ? "Hide password" : "Show password"}
                  />
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[8px] w-full">
              <button
                type="button"
                onClick={() => setPwStep(null)}
                className="bg-[#1a1e2b] border border-[#2a3044] border-solid rounded-[8px] flex-1 py-[9px] font-inter font-medium text-[13px] text-[#cbd5e1] cursor-pointer hover:bg-[#20263a] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCurrentPw}
                disabled={busy || !currentPw}
                className="bg-[#4f46e5] border border-[#4f46e5] border-solid rounded-[8px] flex-1 py-[9px] font-inter font-medium text-[13px] text-white cursor-pointer disabled:opacity-50 disabled:cursor-default hover:bg-[#4338ca] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {pwStep === "new" && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-[24px]">
          <div className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[16px] items-start rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.6)] w-[400px] max-w-full p-[24px]">
            <div className="content-stretch flex flex-col items-start">
              <div className="font-inter font-semibold text-[16px] text-white tracking-[-0.16px] leading-[24px]">
                Set a new password
              </div>
              <div className="font-inter text-[13px] text-[#94a3b8] leading-[20px] pt-[2px]">
                Choose a new password for your account.
              </div>
            </div>

            <div className="content-stretch flex flex-col gap-[6px] items-start w-full">
              <span className={rowLabel}>New Password :</span>
              <div className="relative w-full">
                <PasswordInput
                  autoFocus
                  type={showNewPw ? "text" : "password"}
                  value={newPw}
                  onChange={setNewPw}
                  onEnter={submitNewPw}
                  placeholder="Enter new password"
                />
                <div className="absolute content-stretch flex items-center justify-center right-[12px] top-[11px]">
                  <EyeButton
                    shown={showNewPw}
                    onToggle={() => setShowNewPw((v) => !v)}
                    label={showNewPw ? "Hide password" : "Show password"}
                  />
                </div>
              </div>
            </div>

            <div className="content-stretch flex flex-col gap-[6px] items-start w-full">
              <span className={rowLabel}>Confirm Password :</span>
              <div className="relative w-full">
                <PasswordInput
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={setConfirmPw}
                  onEnter={submitNewPw}
                  placeholder="Re-enter new password"
                />
                <div className="absolute content-stretch flex items-center justify-center right-[12px] top-[11px]">
                  <EyeButton
                    shown={showConfirmPw}
                    onToggle={() => setShowConfirmPw((v) => !v)}
                    label={showConfirmPw ? "Hide password" : "Show password"}
                  />
                </div>
              </div>
            </div>

            <div className="content-stretch flex gap-[8px] w-full">
              <button
                type="button"
                onClick={() => setPwStep(null)}
                className="bg-[#1a1e2b] border border-[#2a3044] border-solid rounded-[8px] flex-1 py-[9px] font-inter font-medium text-[13px] text-[#cbd5e1] cursor-pointer hover:bg-[#20263a] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNewPw}
                disabled={busy || !newPw || !confirmPw}
                className="bg-[#4f46e5] border border-[#4f46e5] border-solid rounded-[8px] flex-1 py-[9px] font-inter font-medium text-[13px] text-white cursor-pointer disabled:opacity-50 disabled:cursor-default hover:bg-[#4338ca] transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-[24px]">
          <div className="bg-[#161922] border border-[#2a3044] border-solid content-stretch flex flex-col gap-[16px] items-start rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.6)] w-[420px] max-w-full p-[24px]">
            <div className="content-stretch flex flex-col items-start">
              <div className="font-inter font-semibold text-[16px] text-white tracking-[-0.16px] leading-[24px]">
                Delete account?
              </div>
              <div className="font-inter text-[13px] text-[#94a3b8] leading-[20px] pt-[4px]">
                This permanently deletes your account and everything tied to it: your profile,
                name, email, password, chats, folders and research history. This cannot be undone.
              </div>
            </div>
            <div className="content-stretch flex gap-[8px] w-full">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
                className="bg-[#1a1e2b] border border-[#2a3044] border-solid rounded-[8px] flex-1 py-[9px] font-inter font-medium text-[13px] text-[#cbd5e1] cursor-pointer hover:bg-[#20263a] transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={busy}
                className="bg-[#dc2626] border border-[#dc2626] border-solid rounded-[8px] flex-1 py-[9px] font-inter font-medium text-[13px] text-white cursor-pointer hover:bg-[#b91c1c] hover:border-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        key={toast?.id}
        message={toast?.message}
        type={toast?.type}
        duration={toast?.duration}
        onClose={() => setToast(null)}
      />
    </>
  );
}
