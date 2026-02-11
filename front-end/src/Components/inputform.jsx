import { useState } from "react";

const InputForm = ({ onSubmit }) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [projectType, setProjectType] = useState("");
  const [resume, setResume] = useState(null);
  
  const [projectDesc, setProjectDesc] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [skillsNeeded, setSkillsNeeded] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = repoUrl.trim();
    if (!trimmed) return;
    
    onSubmit?.({ 
        repoUrl: trimmed, 
        projectType, 
        resume,
        projectDesc, 
        jobDesc, 
        skillsNeeded 
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Project & Interview Details</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Repository Link */}
          <div>
            <label htmlFor="repo-url" className="block text-sm font-semibold text-gray-700 mb-1">
              Repository Link <span className="text-red-500">*</span>
            </label>
            <input
              id="repo-url"
              type="url"
              name="repoUrl"
              placeholder="https://github.com/user/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Project Type */}
          <div>
            <label htmlFor="project-type" className="block text-sm font-semibold text-gray-700 mb-1">
              Project Type <span className="text-red-500">*</span>
            </label>
            <select
              id="project-type"
              name="projectType"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select a project type</option>
              <option value="React/Next">React/Next</option>
              <option value="MERN">MERN</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Java">Java</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Project Description (Optional) */}
          <div>
            <label htmlFor="project-desc" className="block text-sm font-semibold text-gray-700 mb-1">
              Project Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="project-desc"
              name="projectDesc"
              placeholder="Briefly describe what your project does..."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Job Description (Optional) */}
            <div>
              <label htmlFor="job-desc" className="block text-sm font-semibold text-gray-700 mb-1">
                Job Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="job-desc"
                name="jobDesc"
                placeholder="Paste the job description here..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Skills & Resume Group */}
            <div className="space-y-5">
              {/* Skills Needed */}
              <div>
                <label htmlFor="skills-needed" className="block text-sm font-semibold text-gray-700 mb-1">
                  Skills Needed <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="skills-needed"
                  type="text"
                  name="skillsNeeded"
                  placeholder="e.g., Python, AWS, React"
                  value={skillsNeeded}
                  onChange={(e) => setSkillsNeeded(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Resume Upload */}
              <div>
                <label htmlFor="resume-upload" className="block text-sm font-semibold text-gray-700 mb-1">
                  Resume <span className="text-gray-400 font-normal">(PDF/Text)</span>
                </label>
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => setResume(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-4 py-1.5 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all text-sm text-gray-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5 duration-200 mt-4 cursor-pointer"
          >
            Start Analysis
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputForm;