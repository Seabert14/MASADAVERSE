function DeleteConfirmModal({
  isOpen,
  title = "Delete Item?",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  onCancel,
  onConfirm
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-[modalIn_0.2s_ease-out] rounded-2xl border border-white/10 bg-[#0b1925] p-6 text-white shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10 text-xl text-red-400">
          !
        </div>

        <h2 className="mt-5 text-xl font-black">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-red-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;