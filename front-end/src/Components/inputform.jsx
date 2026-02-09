import { useState } from "react";

const InputForm = ({ onSubmit }) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [projectType, setProjectType] = useState("");
  const [resume, setResume] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = repoUrl.trim();
    if (!trimmed) return;
    onSubmit?.({ repoUrl: trimmed, projectType, resume });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="repo-url">Repository link</label>
      <input
        id="repo-url"
        type="url"
        name="repoUrl"
        placeholder="https://github.com/user/repo"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        required
      />
      <label htmlFor="project-type">Project type</label>
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