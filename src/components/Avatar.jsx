const A = "/assets";

export default function Avatar({ user, size = 32, className = "" }) {
  const inner = Math.round((size * 12) / 32);
  const picture = user?.profile_picture;

  if (picture) {
    return (
      <img
        alt=""
        src={picture}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`bg-[#6366f1] content-stretch flex items-center justify-center rounded-full shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="relative shrink-0" style={{ width: inner, height: inner }}>
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={`${A}/ws-avatar-user.svg`} />
      </div>
    </div>
  );
}
