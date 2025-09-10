import React from 'react';
import { motion } from 'framer-motion';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpellCheck,
  FaList,
  FaChartPie,
  FaBookOpen,
  FaAlignLeft,
  FaLightbulb,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaSearch,
} from 'react-icons/fa';

const ResultsList = ({ score }) => {
  if (!score) return null;

  const {
    similarity,
    readability,
    completeness,
    formatting,
    grammar_score,
    grammar_issues,
    matched_keywords,
    missing_keywords,
  } = score;

  const metricBlock = (icon, title, value, description) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="rounded-xl p-5 bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm"
    >
      <div className="flex items-center space-x-3 mb-2">
        <div className="text-xl text-indigo-600">{icon}</div>
        <div className="flex-1">
          <span className="font-semibold text-gray-800">{title}</span>
          <span className="block text-2xl font-bold text-gray-900">{value}%</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
    </motion.div>
  );

  const tag = (text, type) => (
    <span
      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
        type === 'matched'
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}
    >
      {type === 'matched' ? '✓ ' : '✗ '}{text}
    </span>
  );

  // Function to categorize and format grammar issues
  const categorizeGrammarIssues = (issues) => {
    const categories = {
      spelling: [],
      grammar: [],
      punctuation: [],
      style: [],
      other: []
    };

    issues.forEach(issue => {
      if (typeof issue === 'object' && issue.message) {
        // Handle object format with detailed info
        const category = issue.type || 'other';
        if (categories[category]) {
          categories[category].push(issue);
        } else {
          categories.other.push(issue);
        }
      } else if (typeof issue === 'string') {
        // Handle string format (backward compatibility)
        const lowerIssue = issue.toLowerCase();
        if (lowerIssue.includes('spell') || lowerIssue.includes('misspell')) {
          categories.spelling.push({ message: issue, type: 'spelling' });
        } else if (lowerIssue.includes('grammar') || lowerIssue.includes('tense') || 
                   lowerIssue.includes('verb') || lowerIssue.includes('subject')) {
          categories.grammar.push({ message: issue, type: 'grammar' });
        } else if (lowerIssue.includes('punctuation') || lowerIssue.includes('comma') || 
                   lowerIssue.includes('period') || lowerIssue.includes('capitalization')) {
          categories.punctuation.push({ message: issue, type: 'punctuation' });
        } else if (lowerIssue.includes('style') || lowerIssue.includes('wordy') || 
                   lowerIssue.includes('repetitive') || lowerIssue.includes('clarity')) {
          categories.style.push({ message: issue, type: 'style' });
        } else {
          categories.other.push({ message: issue, type: 'other' });
        }
      }
    });

    return categories;
  };

  const grammarCategories = categorizeGrammarIssues(grammar_issues || []);

  // Get icon and color for issue type
  const getIssueStyle = (type) => {
    switch (type) {
      case 'spelling':
        return { icon: '✗', color: 'red', bg: 'bg-red-50', border: 'border-red-200' };
      case 'grammar':
        return { icon: '⚠️', color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'punctuation':
        return { icon: '▪️', color: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'style':
        return { icon: '💡', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200' };
      default:
        return { icon: '❓', color: 'gray', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  return (
    <motion.div
      className="mt-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricBlock(
          <FaChartPie />, 
          'Relevance', 
          similarity.toFixed(1),
          'How well your resume matches the job description'
        )}
        {metricBlock(
          <FaBookOpen />, 
          'Readability', 
          readability.toFixed(1),
          'Ease of reading and understanding your resume'
        )}
        {metricBlock(
          <FaCheckCircle />, 
          'Completeness', 
          completeness.toFixed(1),
          'Presence of all essential resume sections'
        )}
        {metricBlock(
          <FaAlignLeft />, 
          'Formatting', 
          formatting.toFixed(1),
          'Professional layout and structure'
        )}
        {metricBlock(
          <FaSpellCheck />, 
          'Grammar', 
          grammar_score.toFixed(1),
          'Spelling and grammatical accuracy'
        )}
      </div>

      {/* Keywords Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Keywords */}
        <motion.div 
          className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-lg">
            <FaCheckCircle className="text-green-500" /> Matched Keywords ({matched_keywords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {matched_keywords.map((kw, i) => tag(kw, 'matched'))}
          </div>
        </motion.div>

        {/* Missing Keywords */}
        <motion.div 
          className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-lg">
            <FaTimesCircle className="text-red-500" /> Missing Keywords ({missing_keywords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {missing_keywords.map((kw, i) => tag(kw, 'missing'))}
          </div>
        </motion.div>
      </div>

      {/* Grammar Issues - Enhanced Section */}
      <motion.div 
        className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-lg">
          <FaSpellCheck className="text-blue-500" /> Detailed Grammar & Spelling Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Grammar Score Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Overall Grammar Score</h4>
            <div className="text-3xl font-bold text-blue-600">{grammar_score.toFixed(1)}%</div>
            <p className="text-sm text-blue-700 mt-1">
              {grammar_score >= 90 ? 'Excellent - Minimal issues found' :
               grammar_score >= 75 ? 'Good - Few minor issues' :
               grammar_score >= 60 ? 'Fair - Some issues need attention' :
               'Needs improvement - Significant issues detected'}
            </p>
          </div>

          {/* Issues Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Issues Summary</h4>
            <div className="space-y-1 text-sm">
              {grammarCategories.spelling.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-600">Spelling Errors:</span>
                  <span className="font-semibold">{grammarCategories.spelling.length}</span>
                </div>
              )}
              {grammarCategories.grammar.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-orange-600">Grammar Issues:</span>
                  <span className="font-semibold">{grammarCategories.grammar.length}</span>
                </div>
              )}
              {grammarCategories.punctuation.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-yellow-600">Punctuation Errors:</span>
                  <span className="font-semibold">{grammarCategories.punctuation.length}</span>
                </div>
              )}
              {grammarCategories.style.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-600">Style Suggestions:</span>
                  <span className="font-semibold">{grammarCategories.style.length}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between font-semibold">
                  <span>Total Issues Found:</span>
                  <span className="text-red-600">{grammar_issues.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Issues by Category */}
        {grammar_issues.length > 0 ? (
          <div className="space-y-6">
            {/* Spelling Errors */}
            {grammarCategories.spelling.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-500" />
                  Spelling Errors ({grammarCategories.spelling.length})
                </h4>
                <div className="space-y-3">
                  {grammarCategories.spelling.slice(0, 10).map((issue, i) => {
                    const style = getIssueStyle(issue.type);
                    return (
                      <div key={i} className={`${style.bg} ${style.border} p-4 rounded-lg`}>
                        <div className="flex items-start gap-3">
                          <span className="text-red-500 text-lg mt-0.5">{style.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-red-800">{issue.message}</p>
                            {issue.context && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <FaSearch className="text-xs" /> Found in: 
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                    "{issue.context}"
                                  </span>
                                </p>
                              </div>
                            )}
                            {issue.location && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <FaMapMarkerAlt /> Location: {issue.location}
                              </p>
                            )}
                            {issue.example && (
                              <p className="text-xs text-gray-500 mt-1">
                                Example: "<span className="font-bold">{issue.example}</span>"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grammar Issues */}
            {grammarCategories.grammar.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                  <FaExclamationTriangle className="text-orange-500" />
                  Grammar Issues ({grammarCategories.grammar.length})
                </h4>
                <div className="space-y-3">
                  {grammarCategories.grammar.slice(0, 10).map((issue, i) => {
                    const style = getIssueStyle(issue.type);
                    return (
                      <div key={i} className={`${style.bg} ${style.border} p-4 rounded-lg`}>
                        <div className="flex items-start gap-3">
                          <span className="text-orange-500 text-lg mt-0.5">{style.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-orange-800">{issue.message}</p>
                            {issue.context && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <FaSearch className="text-xs" /> Context: 
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                    "{issue.context}"
                                  </span>
                                </p>
                              </div>
                            )}
                            {issue.location && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <FaMapMarkerAlt /> Section: {issue.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show message if there are more issues */}
            {grammar_issues.length > 20 && (
              <div className="bg-yellow-100 p-4 rounded-lg text-center">
                <p className="text-sm text-yellow-800">
                  <FaExclamationTriangle className="inline mr-2" />
                  {grammar_issues.length - 20} more issues detected. Please review your resume carefully.
                </p>
              </div>
            )}

            {/* Action Steps */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <FaCheckCircle /> Recommended Actions
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Review each highlighted issue in your resume</li>
                <li>• Pay special attention to spelling errors marked in red</li>
                <li>• Check grammar suggestions in the context provided</li>
                <li>• Consider using grammar tools like Grammarly for additional review</li>
                <li>• Ask a friend or colleague to proofread your resume</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
            <div className="text-green-500 text-4xl mb-3">✅</div>
            <p className="text-green-700 font-semibold">Excellent! No grammar or spelling issues found</p>
            <p className="text-green-600 text-sm mt-1">Your resume demonstrates strong writing skills and attention to detail</p>
          </div>
        )}
      </motion.div>

      {/* Improvement Suggestions */}
      <motion.div 
        className="bg-blue-50 border border-blue-200 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-lg">
          <FaLightbulb className="text-blue-500" /> Pro Tips for Resume Perfection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-semibold mb-2">📝 Writing Tips</h4>
            <ul className="space-y-1">
              <li>• Use action verbs (Managed, Developed, Created)</li>
              <li>• Quantify achievements with numbers</li>
              <li>• Keep sentences concise and clear</li>
              <li>• Use consistent verb tenses</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🔍 Proofreading</h4>
            <ul className="space-y-1">
              <li>• Read your resume aloud to catch errors</li>
              <li>• Review backward to focus on spelling</li>
              <li>• Take breaks between reviews</li>
              <li>• Use multiple proofreading methods</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultsList;