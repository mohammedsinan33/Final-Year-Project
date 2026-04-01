import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { submitProjectDetails, fetchJobDetails } from "../Services/database";

const ProjectSubmission = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeExceeded, setTimeExceeded] = useState(false);

  const appId = searchParams.get("app_id");
  const jobId = searchParams.get("job_id");

  const [formData, setFormData] = useState({
    repositoryLink: "",
    hostedLink: "",
    description: "",
  });

  useEffect(() => {
    const checkDeadline = async () => {
      try {
        const jobData = await fetchJobDetails(jobId);
        
        if (jobData.screening_end_date) {
          const now = new Date();
          const deadline = new Date(jobData.screening_end_date);
          
          if (now > deadline) {
            setTimeExceeded(true);
          }
        }
      } catch (err) {
        console.error("Error checking deadline:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      checkDeadline();
    }
  }, [jobId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.repositoryLink.trim()) {
      setError("Repository link is required");
      return;
    }
    if (!formData.hostedLink.trim()) {
      setError("Hosted domain link is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Project description is required");
      return;
    }

    // Validate URLs
    try {
      new URL(formData.repositoryLink);
      new URL(formData.hostedLink);
    } catch {
      setError("Please enter valid URLs");
      return;
    }

    setSubmitting(true);
    try {
      await submitProjectDetails(appId, {
        repositoryLink: formData.repositoryLink,
        hostedLink: formData.hostedLink,
        description: formData.description,
      });

      navigate(`/finalrport?app_id=${appId}&job_id=${jobId}`);
    } catch (err) {
      setError(err.message || "Failed to submit project");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (timeExceeded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12 text-center">
          <div className="text-6xl mb-6">⏰</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Time Exceeded
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sorry, the project submission deadline has passed. Better luck next time!
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-red-700">
              The submission window for this project has closed. If you believe this is an error, please contact the recruiter.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 py-12 px-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Submit Your Project
          </h1>
          <p className="text-lg text-gray-600">
            Share your project details and solution
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Repository Link */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Repository Link *
            </label>
            <input
              type="url"
              name="repositoryLink"
              value={formData.repositoryLink}
              onChange={handleInputChange}
              placeholder="https://github.com/username/project"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium text-gray-700"
            />
            <p className="text-sm text-gray-500 mt-1">
              Link to your GitHub or GitLab repository
            </p>
          </div>

          {/* Hosted Domain Link */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Hosted Domain Link *
            </label>
            <input
              type="url"
              name="hostedLink"
              value={formData.hostedLink}
              onChange={handleInputChange}
              placeholder="https://your-project.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium text-gray-700"
            />
            <p className="text-sm text-gray-500 mt-1">
              Live URL where your project is deployed
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Project Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what you built, the technologies used, key features, challenges overcome, and your approach..."
              rows="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium text-gray-700 resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              Please provide a detailed description (minimum 50 characters)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              {submitting ? "Submitting..." : "Submit Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectSubmission;