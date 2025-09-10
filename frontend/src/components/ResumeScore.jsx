import React, { useState } from 'react';
import ScoreMeter from './ScoreMeter';
import ResultsList from './ResultsList';
import UploadForm from './UploadForm';
import { motion } from 'framer-motion';

const ResumeScore = ({ token }) => {
  const [score, setScore] = useState(null);

  const handleScoreReceived = (scoreData) => {
    setScore(scoreData);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* LEFT: Input Panel */}
        <motion.div
          className="flex-1 bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">📊 Resume Analysis</h2>
            <p className="text-gray-600">Upload your resume and job description for ATS optimization</p>
          </div>
          
          <UploadForm 
            onScoreReceived={handleScoreReceived}
            token={token}
          />
        </motion.div>

        {/* RIGHT: Results Panel */}
        <div className="flex-1">
          {score ? (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
            >
              <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">Analysis Complete</h3>
              
              <div className="flex justify-center mb-6">
                <ScoreMeter score={score} />
              </div>

              <ResultsList score={score} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 h-full flex items-center justify-center"
            >
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                <p>Upload your resume and job description to get started</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeScore;