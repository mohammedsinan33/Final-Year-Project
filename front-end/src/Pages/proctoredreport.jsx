import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProctoredReport = () => {
    const navigate = useNavigate();
    const [report, setReport] = useState([]);

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('proctorReport') || "[]");
        setReport(data);
    }, []);

    const score = Math.max(0, 100 - (report.length * 10)); // Simple scoring logic

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Proctoring Report</h1>
                <p className="text-gray-500 mb-8">Session ID: #882103</p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                        <h3 className="text-lg font-semibold text-blue-800">Trust Score</h3>
                        <div className={`text-5xl font-bold my-2 ${score > 80 ? 'text-green-600' : 'text-red-500'}`}>
                            {score}%
                        </div>
                    </div>
                     <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <h3 className="text-lg font-semibold text-gray-800">Alerts Triggered</h3>
                        <div className="text-5xl font-bold my-2 text-gray-800">
                            {report.length}
                        </div>
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-4">Detailed Timeline</h2>
                {report.length === 0 ? (
                    <p className="text-green-600 bg-green-50 p-4 rounded">No malpractices detected during the session.</p>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3">Time</th>
                                    <th className="p-3">Violation Type</th>
                                    <th className="p-3">Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.map((item, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-3">{item.time}</td>
                                        <td className="p-3 font-medium text-red-600">{item.issue}</td>
                                        <td className="p-3 text-sm text-gray-500">High</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                <button onClick={() => navigate('/')} className="mt-8 text-blue-600 hover:underline">
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default ProctoredReport;