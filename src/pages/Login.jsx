import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import Toast from "../components/Toast";

const imgLogo = "/assets/login-logo.svg";
const imgMark = "/assets/login-mark.svg";
const imgMail = "/assets/login-icon-mail.svg";
const imgLock = "/assets/login-icon-lock.svg";
const imgEye = "/assets/login-icon-eye.svg";
const imgArrow = "/assets/login-icon-arrow.svg";

const GENERIC_ERROR = "Error : Email or Password is incorrect!";
const EMAIL_ERROR = "Error : Email is typed incorrect!";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      setToast({ message: EMAIL_ERROR, type: "error", duration: 3000 });
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ email, password });
      navigate("/library", { replace: true });
    } catch (error) {
      const message =
        error && error.status === 401
          ? GENERIC_ERROR
          : error && error.message
            ? error.message
            : GENERIC_ERROR;
      setToast({ message, type: "error", duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="content-stretch flex flex-col items-start relative size-full"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(12, 14, 20) 0%, rgb(12, 14, 20) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
      }}
    >
      <div className="backdrop-blur-[12px] bg-[rgba(12,14,20,0.8)] content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="content-stretch flex h-[64px] items-center px-[32px] relative shrink-0 w-full">
          <Link to="/" className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <div className="bg-[#282a30] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[28px]">
              <div className="h-[14.25px] relative shrink-0 w-[10.5px]">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLogo} />
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0">
              <div className="flex flex-col font-serif-lib justify-center relative shrink-0 text-[#e2e2eb] text-[13px] tracking-[0.65px] uppercase whitespace-nowrap">
                <p className="leading-[18px]">ResearchLab</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="bg-[#0c0e14] content-stretch flex flex-col items-center justify-center p-[32px] relative shrink-0 w-full flex-1">
        <div className="content-stretch flex flex-col items-start max-w-[460px] py-[8px] relative shrink-0 w-[460px]">
          <div className="-translate-x-1/2 absolute bg-[rgba(192,193,255,0.1)] blur-[32px] left-1/2 rounded-[9999px] size-[320px] top-[-64px]" />
          <div className="absolute bg-[rgba(177,117,236,0.1)] blur-[32px] bottom-[-40px] right-0 rounded-[9999px] size-[256px]" />

          <div className="bg-[#191b22] content-stretch flex flex-col gap-[12px] items-start p-[32px] relative rounded-[12px] shrink-0 w-full">
            <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] pointer-events-none" />

            <div className="h-[156px] relative shrink-0 w-full">
              <div className="absolute content-stretch flex flex-col items-start left-[133.42px] pb-[4px] top-[56px]">
                <div className="content-stretch flex items-center relative shrink-0">
                  <div className="content-stretch flex flex-col items-center relative shrink-0">
                    <div className="flex flex-col font-geist font-medium justify-center relative shrink-0 text-[#e2e2eb] text-[22px] text-center tracking-[-0.55px] whitespace-nowrap">
                      <p className="leading-[30px]">ResearchLab</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-geist font-semibold justify-center left-1/2 text-[#e2e2eb] text-[18px] text-center top-[103px] tracking-[-0.18px] whitespace-nowrap">
                <p className="leading-[26px]">Welcome back</p>
              </div>

              <div className="absolute content-stretch flex flex-col items-start left-[38px] max-w-[320px] pt-[4px] top-[116px]">
                <div className="content-stretch flex flex-col items-center max-w-[320px] pl-[19.3px] pr-[19.31px] relative shrink-0">
                  <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#c7c4d7] text-[12px] text-center whitespace-nowrap">
                    <p className="leading-[18px] mb-0">
                      Sign in to access your papers, vector corpus, and
                    </p>
                    <p className="leading-[18px]">collaborative workspaces.</p>
                  </div>
                </div>
              </div>

              <div className="absolute content-stretch flex flex-col items-start left-[174px] pb-[8px] top-0">
                <div className="content-stretch flex items-center justify-center relative shrink-0">
                  <div className="bg-[#282a30] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[48px]">
                    <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[rgba(255,255,255,0)] left-1/2 rounded-[12px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] size-[48px] top-1/2" />
                    <div className="h-[22.167px] relative shrink-0 w-[16.333px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMark} />
                    </div>
                  </div>
                  <div className="absolute content-stretch flex items-start right-[-4px] size-[12px] top-[-4px]">
                    <div className="absolute bg-[#c0c1ff] left-0 opacity-75 rounded-[9999px] size-[12px] top-0" />
                    <div className="bg-[#c0c1ff] relative rounded-[9999px] shrink-0 size-[12px]" />
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="content-stretch flex flex-col gap-[12px] items-start pt-[20px] relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex items-center relative shrink-0 w-full">
                  <div className="content-stretch flex flex-1 flex-col items-start min-w-px relative">
                    <label
                      htmlFor="login-email"
                      className="flex flex-col font-serif-lib justify-center relative shrink-0 text-[#e2e2eb] text-[13px] tracking-[0.13px] w-full"
                    >
                      <p className="leading-[18px]">Email :</p>
                    </label>
                  </div>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-full">
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="johnsmith@gmail.com"
                    className="bg-[#1e1f26] flex flex-1 h-[44px] items-start min-w-px overflow-clip pl-[40px] pr-[12px] py-[14.5px] rounded-[8px] w-full font-inter text-[12px] text-[#e2e2eb] placeholder:text-[#908fa0] outline-none border-0"
                  />
                  <div className="absolute h-[12px] left-[13.5px] top-[16px] w-[15px] pointer-events-none">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMail} />
                  </div>
                </div>
              </div>

              <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <label
                      htmlFor="login-password"
                      className="flex flex-col font-serif-lib justify-center relative shrink-0 text-[#e2e2eb] text-[13px] tracking-[0.13px] whitespace-nowrap"
                    >
                      <p className="leading-[18px]">Password :</p>
                    </label>
                  </div>
                  <Link to="/" className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#c0c1ff] text-[12px] whitespace-nowrap">
                      <p className="leading-[18px]">Forgot key?</p>
                    </div>
                  </Link>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-full">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#1e1f26] flex flex-1 h-[44px] items-start min-w-px overflow-clip px-[40px] py-[14.5px] rounded-[8px] w-full font-inter text-[12px] tracking-[1.2px] text-[#e2e2eb] outline-none border-0"
                  />
                  <div className="absolute h-[15.75px] left-[15px] top-[13.75px] w-[12px] pointer-events-none">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLock} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute content-stretch flex items-center justify-center p-[2px] right-[12px] top-[11px] cursor-pointer"
                  >
                    <div className="h-[11.25px] relative shrink-0 w-[16.5px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEye} />
                    </div>
                  </button>
                </div>
              </div>

              <div className="content-stretch flex flex-col h-[48px] items-start pt-[4px] relative shrink-0 w-full">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#8083ff] content-stretch flex gap-[8px] h-[44px] items-center justify-center relative rounded-[8px] shrink-0 w-full cursor-pointer disabled:opacity-70 disabled:cursor-default"
                >
                  <div className="absolute bg-[rgba(255,255,255,0)] h-[44px] left-0 right-0 rounded-[8px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] top-0" />
                  <div className="content-stretch flex flex-col items-center relative shrink-0">
                    <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#0d0096] text-[14px] text-center whitespace-nowrap">
                      <p className="leading-[22px]">Sign In to Workspace</p>
                    </div>
                  </div>
                  <div className="relative shrink-0 size-[12px]">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow} />
                  </div>
                </button>
              </div>
            </form>

            <div className="bg-[#191b22] content-stretch flex flex-col items-start pt-[12px] relative shrink-0 w-full">
              <div className="content-stretch flex gap-[4px] items-start relative shrink-0 w-full">
                <div className="flex flex-col font-inter font-medium h-[32px] justify-center relative shrink-0 text-[13.2px] text-center text-white tracking-[0.22px] w-[373px]">
                  <p className="leading-[21.46px]">
                    {"Don't have an account yet? "}
                    <Link to="/signup" className="font-inter font-bold leading-[21.46px]">
                      Sign Up
                    </Link>
                  </p>
                </div>
                <div className="h-[35.75px] relative shrink-0 w-[358px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0c0e14] h-[40px] relative shrink-0 w-full" />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
