import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputForm from "./inputform";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const AnalyzerPage = () => {
  const navigate = useNavigate();
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

      // 1. Analyze Repo
      if (repoUrl) {
          // FIXED: Removed '/analyze' prefix
          const repoResponse = await fetch(`${API_BASE_URL}/analyze-repo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                repo_url: repoUrl, 
                project_desc: projectDesc 
            }),
          });
    
          if (!repoResponse.ok) {
            const message = await repoResponse.text();
            throw new Error(message || "Repo analysis failed");
          }
          repoData = await repoResponse.json();
      }

      // 2. Analyze Resume
      if (resume) {
          const formData = new FormData();
          formData.append("file", resume);
          if (jobDesc) formData.append("job_desc", jobDesc);
          if (skillsNeeded) formData.append("skills_needed", skillsNeeded);
          
          // FIXED: Removed '/analyze' prefix
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

      const combinedResult = { ...repoData, resumeAnalysis: resumeData };
      setResult(combinedResult);

      // Save to localStorage for Interview Page to use
      localStorage.setItem('interviewContext', JSON.stringify({
          repo_analysis: repoData,
          resume_analysis: resumeData
      }));
      
    } catch (err) {
      setError(err?.message || "Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startInterview = () => {
      // You might want to navigate to the system check page first in a real app
      // navigate('/interview-tester'); 
      navigate('/tester'); 
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
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Repository & Resume Analyzer</h1>
      
      {!result && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <InputForm onSubmit={handleSubmit} />
        </div>
      )}

      {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-blue-600 font-medium">Analyzing your code and profile...</p>
          </div>
      )}

      {error && <p className="text-center text-red-500 my-4 bg-red-50 p-3 rounded">{error}</p>}

      {result && (
        <div className="space-y-8 bg-white p-8 rounded-lg shadow-lg animate-fade-in">
          
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>
              <button 
                onClick={startInterview}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-lg transform hover:scale-105 transition-all shadow-lg ring-2 ring-green-300"
              >
                Start AI Interview →
              </button>
          </div>

          {/* 1. Repo Alignment Score */}
          {result.alignment_score > 0 && (
            <div className="border border-blue-200 rounded-lg p-5 bg-blue-50">
                <h3 className="text-xl font-bold text-gray-800 m-0 mb-3">Project Alignment Check</h3>
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
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Project Description</h3>
                  <p className="text-gray-700 leading-relaxed">{result.description}</p>
                </div>
    
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Features</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {result.features?.map((feature, index) => (
                      <li key={index}>{feature}</li>
                      ))}
                  </ul>
                </div>
    
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Tech Stack</h3>
                  <ul className="flex flex-wrap gap-2">
                      {result.tech_stack?.map((tech, index) => (
                      <li key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700 border border-gray-200">{tech}</li>
                      ))}
                  </ul>
                </div>
                
                {result.questions_that_can_be_asked_in_interview && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h3 className="text-xl font-semibold mb-2 text-gray-800">Generated Interview Questions</h3>
                        <ul className="list-decimal pl-5 space-y-2 text-gray-700">
                            {result.questions_that_can_be_asked_in_interview.map((q, i) => (
                                <li key={i}>{q}</li>
                            ))}
                        </ul>
                    </div>
                )}
    
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Summary</h3>
                  <p className="text-gray-700 leading-relaxed">{result.summary}</p>
                </div>
            </div>
          )}

          {/* 2. Resume Section */}
          {result.resumeAnalysis && (
              <div className="space-y-6">
                <hr className="border-gray-200 my-8" />
                <h2 className="text-2xl font-bold text-gray-900">Resume Analysis</h2>
                
                {/* Job Match Score */}
                {result.resumeAnalysis.match_score > 0 && (
                    <div className="border border-purple-200 rounded-lg p-5 bg-purple-50">
                        <h3 className="text-xl font-bold text-purple-800 m-0 mb-3">Job Fit Analysis</h3>
                        <div className="flex items-center gap-4">
                             <div className="text-4xl font-bold text-purple-700">
                                {result.resumeAnalysis.match_score}%
                             </div>
                             <p className="m-0 text-gray-700 font-medium">{result.resumeAnalysis.match_summary}</p>
                        </div>
                    </div>
                )}
                
                <p className="text-gray-700">{result.resumeAnalysis.description}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-800">Key Skills</h3>
                        {renderList(result.resumeAnalysis.key_skills)}
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-800">Highlights</h3>
                        {renderList(result.resumeAnalysis.highlights)}
                    </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Experience</h3>
                  {renderList(result.resumeAnalysis.experience)}
                </div>
              </div>
          )}
          
          <div className="mt-8 flex justify-center">
             <button 
                onClick={startInterview}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-lg text-xl transform hover:scale-105 transition-all shadow-lg ring-4 ring-green-200 bg-gradient-to-r from-green-600 to-green-500"
              >
                Proceed to Video Interview
              </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default AnalyzerPage;