export default function JobSearchBar({ roleQuery, setRoleQuery }) {
  return (
    <div className="mt-3 grid grid-cols-1">
      <input
        className="w-full max-w-full min-w-0 rounded-xl px-3 py-3 border border-white/15 bg-black/20 text-inherit outline-none focus:border-indigo-400/85 focus:ring-2 focus:ring-indigo-500/20"
        value={roleQuery}
        onChange={(e) => setRoleQuery(e.target.value)}
        type="text"
        placeholder="Search job role…"
        aria-label="Search by job role"
      />
    </div>
  );
}
