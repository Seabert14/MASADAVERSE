function Notification({
  type = "success",
  message,
  onClose
}) {
  if (!message) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <div className="fixed right-4 top-20 z-[110] w-[calc(100%-2rem)] max-w-sm animate-[modalIn_0.2s_ease-out]">
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-sm ${
          isSuccess
            ? "border-lime-400/20 bg-[#0b1925] text-lime-400"
            : "border-red-400/20 bg-[#0b1925] text-red-400"
        }`}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-black">
          {isSuccess ? "✓" : "!"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {isSuccess ? "Success" : "Error"}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-slate-600 transition hover:text-white"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default Notification;