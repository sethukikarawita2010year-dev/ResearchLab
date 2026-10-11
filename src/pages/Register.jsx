import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import Toast from "../components/Toast";
import { strengthBars } from "../lib/passwordStrength";

const imgLogoMark = "/assets/logo-mark.svg";
const imgIconUser = "/assets/icon-user.svg";
const imgIconMail = "/assets/icon-mail.svg";
const imgIconLock = "/assets/icon-lock.svg";
const imgIconEye = "/assets/icon-eye.svg";
const imgIconArrow = "/assets/icon-arrow-right.svg";

const EMAIL_ERROR = "Error : Email is typed incorrect!";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const redirectRef = useRef(null);

  const bars = strengthBars(password);

  useEffect(
    () => () => {
      if (redirectRef.current) clearTimeout(redirectRef.current);
    },
    [],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const required = [
      { value: firstName, ref: firstNameRef, trim: true },
      { value: lastName, ref: lastNameRef, trim: true },
      { value: email, ref: emailRef, trim: true },
      { value: password, ref: passwordRef, trim: false },
    ];
    const empty = required.find((field) =>
      field.trim ? field.value.trim() === "" : field.value === "",
    );
    if (empty) {
      if (empty.ref.current) empty.ref.current.focus();
      return;
    }

    if (!email.trim().toLowerCase().endsWith(".com")) {
      setToast({ message: EMAIL_ERROR, type: "error", duration: 3000 });
      return;
    }

    setSubmitting(true);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      setToast({
        message: "ResearchLab account successfully created!",
        type: "success",
        duration: 2000,
      });
      redirectRef.current = setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (error) {
      let message = "Error : Something went wrong. Please try again.";
      if (error && error.status === 409) {
        message = "Error : Email is already in use!";
      } else if (error && error.status === 422 && /password/i.test(error.message || "")) {
        message = "Error : password must be at least 12 characters long!";
      } else if (error && error.message) {
        message = `Error : ${error.message}`;
      }
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
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLogoMark} />
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0">
              <div className="flex flex-col font-inter justify-center relative shrink-0 text-[#e2e2eb] text-[13px] tracking-[0.65px] uppercase whitespace-nowrap">
                <p className="leading-[18px]">ResearchLab</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="bg-[#0c0e14] content-stretch flex flex-col items-center justify-center p-[32px] relative shrink-0 w-full flex-1">
        <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
          <div className="absolute bg-[rgba(192,193,255,0.1)] blur-[60px] h-[340px] left-[288px] rounded-[9999px] top-[-128px] w-[640px]" />
          <div className="-translate-y-1/2 absolute bg-[rgba(47,58,163,0.15)] blur-[70px] left-[-192px] rounded-[9999px] size-[420px] top-[calc(50%+210px)]" />
          <div className="absolute bg-[rgba(177,117,236,0.1)] blur-[65px] bottom-0 right-[-160px] rounded-[9999px] size-[380px]" />

          <div className="content-stretch flex flex-col items-center max-w-[560px] pb-[12px] relative shrink-0 w-[560px]">
            <div className="content-stretch flex flex-col items-start pb-[20px] relative shrink-0">
              <div className="content-stretch flex flex-col items-center relative shrink-0">
                <div className="flex flex-col font-inter font-semibold justify-center relative shrink-0 text-[#e2e2eb] text-[28px] text-center tracking-[-0.7px] whitespace-nowrap">
                  <p className="leading-[36px]">Create your ResearchLab account</p>
                </div>
                <div className="content-stretch flex flex-col items-start max-w-[430px] pt-[6px] relative shrink-0">
                  <div className="content-stretch flex flex-col items-center max-w-[430px] px-[5.79px] relative shrink-0">
                    <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#c7c4d7] text-[14px] text-center whitespace-nowrap">
                      <p className="leading-[22px] mb-0">
                        Accelerate your literature reviews, citation mapping, and vector
                      </p>
                      <p className="leading-[22px]">synthesis.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1e1f26] content-stretch flex flex-col isolate items-start overflow-clip p-[32px] relative rounded-[12px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] shrink-0 w-full">
              <form onSubmit={handleSubmit} className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full z-[3]">
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex flex-1 flex-col gap-[6px] items-start min-w-px relative">
                    <div className="content-stretch flex items-center relative shrink-0 w-full">
                      <div className="content-stretch flex flex-1 flex-col items-start min-w-px relative">
                        <label
                          htmlFor="signup-first-name"
                          className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#c7c4d7] text-[12px] w-full"
                        >
                          <p className="leading-[18px]">First Name :</p>
                        </label>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-full">
                      <input
                        id="signup-first-name"
                        name="firstName"
                        ref={firstNameRef}
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="bg-[#191b22] flex flex-1 flex-col items-start min-w-px overflow-clip pb-[13px] pl-[40px] pr-[16px] pt-[12px] rounded-[8px] w-full font-inter text-[14px] text-[#e2e2eb] placeholder:text-[#908fa0] outline-none border-0"
                      />
                      <div className="absolute left-[15px] size-[12px] top-[15px] pointer-events-none">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconUser} />
                      </div>
                    </div>
                  </div>

                  <div className="content-stretch flex flex-1 flex-col gap-[6px] items-start min-w-px relative">
                    <div className="content-stretch flex items-center relative shrink-0 w-full">
                      <div className="content-stretch flex flex-1 flex-col items-start min-w-px relative">
                        <label
                          htmlFor="signup-last-name"
                          className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#c7c4d7] text-[12px] w-full"
                        >
                          <p className="leading-[18px]">Last Name :</p>
                        </label>
                      </div>
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 w-full">
                      <input
                        id="signup-last-name"
                        name="lastName"
                        ref={lastNameRef}
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Smith"
                        className="bg-[#191b22] flex flex-1 flex-col items-start min-w-px overflow-clip pb-[13px] pl-[40px] pr-[16px] pt-[12px] rounded-[8px] w-full font-inter text-[14px] text-[#e2e2eb] placeholder:text-[#908fa0] outline-none border-0"
                      />
                      <div className="absolute left-[15px] size-[12px] top-[15px] pointer-events-none">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconUser} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex items-center relative shrink-0 w-full">
                    <div className="content-stretch flex flex-1 flex-col items-start min-w-px relative">
                      <label
                        htmlFor="signup-email"
                        className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#c7c4d7] text-[12px] w-full"
                      >
                        <p className="leading-[18px]">Email :</p>
                      </label>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-full">
                    <input
                      id="signup-email"
                      name="email"
                      ref={emailRef}
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="johnsmith@gmail.com"
                      className="bg-[#191b22] flex flex-1 flex-col items-start min-w-px overflow-clip pb-[13px] pl-[40px] pr-[16px] pt-[12px] rounded-[8px] w-full font-inter text-[14px] text-[#e2e2eb] placeholder:text-[#908fa0] outline-none border-0"
                    />
                    <div className="absolute h-[12px] left-[13.5px] top-[15px] w-[15px] pointer-events-none">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMail} />
                    </div>
                  </div>
                </div>

                <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col items-start relative shrink-0">
                      <label
                        htmlFor="signup-password"
                        className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#c7c4d7] text-[12px] whitespace-nowrap"
                      >
                        <p className="leading-[18px]">Password :</p>
                      </label>
                    </div>
                    <div className="content-stretch flex flex-col items-start relative shrink-0">
                      <div className="flex flex-col font-inter justify-center relative shrink-0 text-[#908fa0] text-[11px] tracking-[0.22px] whitespace-nowrap">
                        <p className="leading-[16px]">Min. 12 characters</p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex items-center relative shrink-0 w-full">
                    <input
                      id="signup-password"
                      name="password"
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-[#191b22] flex flex-1 flex-col items-start min-w-px overflow-clip px-[40px] py-[10px] rounded-[8px] w-full font-inter text-[14px] text-[#e2e2eb] outline-none border-0"
                    />
                    <div className="absolute h-[15.75px] left-[15px] top-[12.75px] w-[12px] pointer-events-none">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconLock} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute z-10 content-stretch flex flex-col items-center justify-center p-[6px] right-[8px] top-[7px] cursor-pointer"
                    >
                      <div className="h-[11.25px] relative shrink-0 w-[16.5px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconEye} />
                      </div>
                    </button>
                  </div>
                  <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0 w-full">
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
                      {[0, 1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className={`flex-1 h-[4px] min-w-px relative rounded-[9999px] ${
                            index < bars ? "bg-[#c0c1ff]" : "bg-[rgba(192,193,255,0.4)]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-[4px] relative shrink-0 w-full" />

                <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0 w-full">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#4f46e5] content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[12px] relative rounded-[8px] shrink-0 w-full cursor-pointer shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.2),0px_4px_6px_-4px_rgba(79,70,229,0.2)] disabled:opacity-70 disabled:cursor-default"
                  >
                    <div className="content-stretch flex flex-col items-center relative shrink-0">
                      <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-white text-[14px] text-center tracking-[0.13px] whitespace-nowrap">
                        <p className="leading-[26px]">Create ResearchLab Account</p>
                      </div>
                    </div>
                    <div className="relative shrink-0 size-[13.333px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrow} />
                    </div>
                  </button>
                </div>
              </form>

              <div className="absolute bg-gradient-to-r from-[rgba(192,193,255,0)] h-[2px] left-0 right-0 to-[rgba(192,193,255,0)] top-0 via-50% via-[rgba(192,193,255,0.5)] z-[2]" />

              <div className="content-stretch flex flex-col items-start pt-[20px] relative shrink-0 w-full z-[1]">
                <div className="content-stretch flex gap-[3.99px] items-center justify-center pt-[12px] relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="flex flex-col font-inter font-normal justify-center relative shrink-0 text-[#c7c4d7] text-[12px] whitespace-nowrap">
                      <p className="leading-[18px]">Already have an active lab profile?</p>
                    </div>
                  </div>
                  <Link to="/login" className="content-stretch flex flex-col items-start relative shrink-0">
                    <div className="flex flex-col font-inter font-medium justify-center relative shrink-0 text-[#c0c1ff] text-[12px] whitespace-nowrap">
                      <p className="leading-[18px] underline decoration-[1px] decoration-solid">Sign In</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
