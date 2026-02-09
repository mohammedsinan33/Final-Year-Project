import { useState } from "react";
import InputForm from "./Components/inputform";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async ({ repoUrl, projectType, resume }) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let repoData = null;
      let resumeData = null;

      // 1. Analyze Repo
      if (repoUrl) {
          const repoResponse = await fetch(`${API_BASE_URL}/analyze-repo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo_url: repoUrl, project_type: projectType }),
          });
    
          if (!repoResponse.ok) {
            const message = await repoResponse.text();
            throw new Error(message || "Repo analysis failed");
          }
          repoData = await repoResponse.json();
      }

      // 2. Analyze Resume if provided
      if (resume) {
          const formData = new FormData();
          formData.append("file", resume);
          
          const resumeResponse = await fetch(`${API_BASE_URL}/analyze-resume`, {
              method: "POST",
              body: formData,
          });

          if (!resumeResponse.ok) {
              const message = await resumeResponse.text();
              throw new Error(message || "Resume analysis failed");
          }
          resumeData = await resumeResponse.json();
      }

      setResult({ ...repoData, resumeAnalysis: resumeData });
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Repository Analyzer</h1>
      <InputForm onSubmit={handleSubmit} />

      {loading && <p>Analyzing...</p>}
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          {/* Repo Results */}
          {result.description && (
            <>
                <h2>Description</h2>
                <p>{result.description}</p>
    
                <h2>Features</h2>
                <ul>
                    {result.features?.map((feature, index) => (
                    <li key={index}>{feature}</li>
                    ))}
                </ul>
    
                <h2>Tech Stack</h2>
                <ul>
                    {result.tech_stack?.map((tech, index) => (
                    <li key={index}>{tech}</li>
                    ))}
                </ul>
    
                <h2>Summary</h2>
                <p>{result.summary}</p>
            </>
          )}

          {/* Resume Results */}
          {result.resumeAnalysis && (
              <>
                <hr />
                <h2>Resume Analysis</h2>
                <p>{result.resumeAnalysis.description}</p>
                
                <h3>Key Skills</h3>
                <ul>
                    {result.resumeAnalysis.key_skills?.map((skill, index) => (
                        <li key={index}>{skill}</li>
                    ))}
                </ul>

                <h3>Highlights</h3>
                <ul>
                    {result.resumeAnalysis.highlights?.map((highlight, index) => (
                        <li key={index}>{highlight}</li>
                    ))}
                </ul>
              </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;