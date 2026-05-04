import { useState, useMemo } from "react";
import { Search, Check, X, Clock } from "lucide-react";

export default function CandidatesList({
  candidates,
  onSelectCandidate,
  loading,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Sort by overall_score and filter
  const filteredCandidates = useMemo(() => {
    let filtered = candidates.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = showSelectedOnly ? c.selected === true : true;
      
      return matchesSearch && matchesFilter;
    });

    // Sort by overall_score descending (highest first)
    return filtered.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
  }, [candidates, searchTerm, showSelectedOnly]);

  const getStatusIcon = (selected) => {
    if (selected === true) {
      return <Check className="text-green-600" size={20} />;
    } else if (selected === false) {
      return <X className="text-red-600" size={20} />;
    }
    return <Clock className="text-yellow-600" size={20} />;
  };

  const getStatusColor = (selected) => {
    if (selected === true) return "bg-green-100 text-green-800";
    if (selected === false) return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (selected) => {
    if (selected === true) return "Selected";
    if (selected === false) return "Rejected";
    return "Pending";
  };

  return (
    <div className="space-y-4 mt-6">
      {/* Search and Filter */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowSelectedOnly(!showSelectedOnly)}
          className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
            showSelectedOnly
              ? "bg-emerald-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {showSelectedOnly ? "✓ Selected Only" : "All Candidates"}
        </button>
      </div>

      {/* Candidates Count */}
      <p className="text-sm text-gray-600 font-medium">
        Showing {filteredCandidates.length} of {candidates.length} candidates
      </p>

      {/* Candidates List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading candidates...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No candidates found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.application_id || candidate.id}
              onClick={() => onSelectCandidate(candidate)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition hover:shadow-md ${
                candidate.selected === true
                  ? "border-green-400 bg-green-50 hover:border-green-600"
                  : candidate.selected === false
                  ? "border-red-400 bg-red-50 hover:border-red-600"
                  : "border-gray-300 bg-white hover:border-emerald-600"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(candidate.selected)}
                    <p className="font-bold text-gray-900 truncate">{candidate.name}</p>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{candidate.email}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600 flex-wrap">
                    {candidate.match_score && <span>📄 Resume: {candidate.match_score}%</span>}
                    {candidate.overall_score && <span>🎯 Interview: {candidate.overall_score}/100</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(candidate.selected)}`}>
                    {getStatusText(candidate.selected)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}