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
    <form onSubmit={handleSubmit}>
      <label htmlFor="repo-url">Repository link (Required)</label>
      <input
        id="repo-url"
        type="url"
        name="repoUrl"
        placeholder="https://github.com/user/repo"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        required
      />

      <label htmlFor="project-type">Project type (Required)</label>
      <select
        id="project-type"
        name="projectType"
        value={projectType}
        onChange={(e) => setProjectType(e.target.value)}
        required
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

      <label htmlFor="project-desc">Project Description (Optional)</label>
      <textarea
        id="project-desc"
        name="projectDesc"
        placeholder="Describe what your project does..."
        value={projectDesc}
        onChange={(e) => setProjectDesc(e.target.value)}
        rows={3}
      />

      <label htmlFor="job-desc">Job Description (Optional)</label>
      <textarea
        id="job-desc"
        name="jobDesc"
        placeholder="Paste the job description you are applying for..."
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
        rows={4}
      />

      <label htmlFor="skills-needed">Skills Needed (Optional)</label>
      <input
        id="skills-needed"
        type="text"
        name="skillsNeeded"
        placeholder="e.g., Python, AWS, React (comma separated)"
        value={skillsNeeded}
        onChange={(e) => setSkillsNeeded(e.target.value)}
      />

      <label htmlFor="resume-upload">Resume (PDF/Text)</label>
      <input
        id="resume-upload"
        type="file"
        accept=".pdf,.txt,.doc,.docx"
        onChange={(e) => setResume(e.target.files ? e.target.files[0] : null)}
      />

      <button type="submit">Submit</button>
    </form>
  );
};

export default InputForm;