import { useState } from "react";
import InputForm from "../Components/inputform";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const AnalyzerPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async ({ repoUrl, projectType, resume, projectDesc, jobDesc, skillsNeeded }) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let repoData = null;
      let resumeData = null;

      if (repoUrl) {
          const repoResponse = await fetch(`${API_BASE_URL}/analyze-repo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                repo_url: repoUrl, 
                project_type: projectType,
                project_desc: projectDesc 
            }),
          });
    
          if (!repoResponse.ok) {
            const message = await repoResponse.text();
            throw new Error(message || "Repo analysis failed");
          }
          repoData = await repoResponse.json();
      }

      if (resume) {
          const formData = new FormData();
          formData.append("file", resume);
          if (jobDesc) formData.append("job_desc", jobDesc);
          if (skillsNeeded) formData.append("skills_needed", skillsNeeded);
          
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

  const renderList = (items) => {
    if (!items || items.length === 0) return null;
    return (
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item, index) => {
           if (typeof item === 'object' && item !== null) {
             const title = item.name || item.title || item.role || "";
             const desc = item.description || item.company || item.institution || "";
             return <li key={index}><strong className="font-semibold">{title}</strong>: {desc}</li>;
           }
           return <li key={index}>{item}</li>;
        })}
      </ul>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Repository Analyzer</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <InputForm onSubmit={handleSubmit} />
      </div>

      {loading && <p className="text-center text-blue-600 font-medium my-4">Analyzing...</p>}
      {error && <p className="text-center text-red-500 my-4 bg-red-50 p-3 rounded">{error}</p>}

      {result && (
        <div className="space-y-8 bg-white p-8 rounded-lg shadow-lg">
          {/* 1. Repo Alignment Score */}
          {result.alignment_score > 0 && (
            <div className="border border-blue-200 rounded-lg p-5 bg-blue-50">
                <h2 className="text-xl font-bold text-gray-800 m-0 mb-3">Project Alignment Check</h2>
                <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${result.alignment_score > 70 ? 'text-green-600' : 'text-orange-500'}`}>
                        Score: {result.alignment_score}/100
                    </div>
                    <p className="m-0 text-gray-700">{result.alignment_summary}</p>
                </div>
            </div>
          )}

          {result.description && (
            <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-gray-800">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{result.description}</p>
                </div>
    
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-gray-800">Features</h2>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {result.features?.map((feature, index) => (
                      <li key={index}>{feature}</li>
                      ))}
                  </ul>
                </div>
    
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-gray-800">Tech Stack</h2>
                  <ul className="flex flex-wrap gap-2">
                      {result.tech_stack?.map((tech, index) => (
                      <li key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700 border border-gray-200">{tech}</li>
                      ))}
                  </ul>
                </div>
                
                {result.questions_that_can_be_asked_in_interview && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-2 text-gray-800">Interview Questions</h2>
                        <ul className="list-decimal pl-5 space-y-2 text-gray-700">
                            {result.questions_that_can_be_asked_in_interview.map((q, i) => (
                                <li key={i}>{q}</li>
                            ))}
                        </ul>
                    </div>
                )}
    
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-gray-800">Summary</h2>
                  <p className="text-gray-700 leading-relaxed">{result.summary}</p>
                </div>
            </div>
          )}

          {/* 2. Resume Section */}
          {result.resumeAnalysis && (
              <div className="space-y-6">
                <hr className="border-gray-200" />
                <h2 className="text-2xl font-bold text-gray-900">Resume Analysis</h2>
                
                {/* Job Match Score */}
                {result.resumeAnalysis.match_score > 0 && (
                    <div className="border border-blue-400 rounded-lg p-5 bg-blue-50">
                        <h2 className="text-xl font-bold text-blue-800 m-0 mb-3">Job Fit Analysis</h2>
                        <div className="flex items-center gap-4">
                             <div className="text-4xl font-bold text-blue-700">
                                {result.resumeAnalysis.match_score}%
                             </div>
                             <p className="m-0 text-gray-700 font-medium">{result.resumeAnalysis.match_summary}</p>
                        </div>
                    </div>
                )}
                
                <p className="text-gray-700">{result.resumeAnalysis.description}</p>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Key Skills</h3>
                  {renderList(result.resumeAnalysis.key_skills)}
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Projects</h3>
                  {renderList(result.resumeAnalysis.key_projects)}
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Highlights</h3>
                  {renderList(result.resumeAnalysis.highlights)}
                </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyzerPage;