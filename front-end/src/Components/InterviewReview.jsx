import { Star, Home } from "lucide-react";
import { useState } from "react";

export default function InterviewReview({ onSkip, onSubmit, isSubmitting }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    onSubmit({ rating, feedback });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center p-4 z-50">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Interview Complete! 🎉</h2>
          <p className="text-gray-600">Please rate your interview experience</p>
        </div>

        {/* Rating Section */}
        <div className="bg-emerald-50 rounded-xl p-6 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4 text-center">How would you rate this interview?</p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform duration-200 hover:scale-125"
              >
                <Star
                  size={40}
                  className={`cursor-pointer transition-all ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-3 text-sm font-semibold text-emerald-600">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Feedback Section */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Feedback (Optional)
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 text-gray-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 resize-none"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts about the interview experience..."
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:border-gray-400 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}