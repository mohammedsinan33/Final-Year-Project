import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchJobDetails } from "../Services/database";

const ProjectScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const appId = searchParams.get("app_id");
  const jobId = searchParams.get("job_id");

  useEffect(() => {
    const loadProjectDetails = async () => {
      try {
        const jobData = await fetchJobDetails(jobId);
        setProject(jobData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadProjectDetails();
    }
  }, [jobId]);

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleContinue = () => {
    navigate(`/project-submission?app_id=${appId}&job_id=${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl px-8 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-semibold">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl px-8 py-12 text-center max-w-md">
          <p className="text-lg text-red-600 font-semibold">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl px-8 py-12 text-center max-w-md">
          <p className="text-lg text-red-600 font-semibold">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 py-12 px-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Project Assignment
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            Position: <span className="font-semibold text-purple-600">{project.role_title}</span>
          </p>
        </div>

        {/* Project Description Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-purple-600">
            Project Description
          </h2>
          <div className="bg-gray-50 p-6 md:p-8 rounded-lg border border-gray-200">
            <p className="text-gray-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
              {project.project_description}
            </p>
          </div>
        </div>

        {/* Deadline Section */}
        <div className="mb-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <p className="text-gray-700">
              <span className="font-semibold text-lg">📅 Last Date to Submit:</span>
            </p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {formatDate(project.screening_end_date)}
            </p>
            <p className="text-sm text-gray-600 mt-3">
              Please ensure you submit your project before the deadline. Late submissions may not be considered.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">What to Submit:</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">1.</span>
              <span className="text-gray-700"><strong>Repository Link:</strong> GitHub or GitLab link to your project</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">2.</span>
              <span className="text-gray-700"><strong>Hosted Domain:</strong> Live URL where the project is deployed</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">3.</span>
              <span className="text-gray-700"><strong>Description:</strong> Brief explanation of what you built and your approach</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center pt-6">
          <button
            onClick={handleContinue}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-3 px-10 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectScreen;