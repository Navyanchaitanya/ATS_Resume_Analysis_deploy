import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaSpinner, FaUpload, FaFilePdf, FaTimes } from 'react-icons/fa';

const UploadForm = ({ onScoreReceived, onAnalysisStart, token }) => {
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      setResume(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resume || !jd.trim()) {
      alert("Please provide both resume and job description.");
      return;
    }

    if (resume.type !== 'application/pdf') {
      alert("Please upload a PDF file only.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("job_description", jd);

    try {
      setLoading(true);
      if (onAnalysisStart) onAnalysisStart();
      
      const res = await axios.post("/api/analyze", formData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onScoreReceived(res.data.score);
      
    } catch (err) {
      console.error("Upload error:", err);
      
      if (err.response?.status === 401) {
        alert("Please login again. Your session may have expired.");
      } else if (err.response?.status === 400) {
        alert(err.response.data.error || "Invalid request. Please check your inputs.");
      } else if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        alert("Cannot connect to the server. Make sure the backend is running on port 5000.");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setResume(null);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* File Upload with Drag & Drop */}
      <div>
        <label className="block font-semibold text-gray-700 mb-3">Upload Resume (PDF)</label>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-indigo-400'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !loading && document.getElementById('resume-upload').click()}
        >
          <input
            id="resume-upload"
            type="file"
            accept=".pdf"
            onChange={(e) => setResume(e.target.files[0])}
            className="hidden"
            disabled={loading}
            required
          />
          
          <div className="flex flex-col items-center justify-center space-y-3">
            <FaFilePdf className="text-4xl text-red-500" />
            {resume ? (
              <>
                <p className="text-green-600 font-medium">{resume.name}</p>
                <p className="text-sm text-gray-500">{(resume.size / 1024).toFixed(1)} KB</p>
                {!loading && (
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-sm text-red-500 hover:text-red-700 mt-2 flex items-center"
                  >
                    <FaTimes className="mr-1" /> Remove file
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-gray-600">Drag & drop your PDF resume here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <label className="block font-semibold text-gray-700 mb-3">Job Description</label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows="8"
          className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition-all"
          placeholder="Paste the job description here...&#10;&#10;• Required skills&#10;• Qualifications&#10;• Job responsibilities&#10;• Company information"
          disabled={loading}
          required
        />
        <p className="text-sm text-gray-500 mt-1">{jd.length} characters</p>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={!loading && { scale: 1.02 }}
        whileTap={!loading && { scale: 0.98 }}
        type="submit"
        disabled={loading || !resume || !jd.trim()}
        className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
          loading || !resume || !jd.trim()
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
        }`}
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <FaUpload />
            <span>Analyze Resume</span>
          </>
        )}
      </motion.button>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Tips for better results:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use a well-formatted PDF resume</li>
          <li>• Include complete job description with requirements</li>
          <li>• Ensure your resume includes relevant keywords from the job description</li>
          <li>• Keep job description under 2000 characters for best performance</li>
        </ul>
      </div>
    </motion.form>
  );
};

export default UploadForm;