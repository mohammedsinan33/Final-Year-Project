export default function JobHeader({ displayName, onLogout }) {
  return (
    <div className="border border-white/10 bg-white/5 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-lg font-bold">Find jobs</h1>
          <p className="mt-1 mb-0 opacity-80 text-[13px]">Welcome {displayName}</p>
        </div>
        <button
          type="button"
          className="rounded-xl px-3 py-2.5 border border-white/10 bg-white/5 text-inherit cursor-pointer hover:bg-white/10"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
