import React from "react";
import { motion } from "framer-motion";

const ScoreMeter = ({ score }) => {
  const rawTotal = score?.total;
  const total = typeof rawTotal === "number" && !isNaN(rawTotal)
    ? Math.min(rawTotal, 100)
    : 0;

  const radius = 70;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (total / 100) * circumference;

  // Color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getStrokeColor = (score) => {
    if (score >= 80) return "#16a34a";
    if (score >= 60) return "#2563eb";
    if (score >= 40) return "#ca8a04";
    return "#dc2626";
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative w-40 h-40">
        <svg height="140" width="140" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="70"
            cy="70"
          />
          {/* Progress circle */}
          <motion.circle
            stroke={getStrokeColor(total)}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            r={normalizedRadius}
            cx="70"
            cy="70"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className={`text-3xl font-bold ${getScoreColor(total)}`}
          >
            {total}%
          </motion.div>
          <div className="text-sm font-medium text-gray-600 mt-1">ATS Score</div>
          
          {/* Score rating */}
          <div className="text-xs font-semibold mt-2">
            {total >= 80 ? "Excellent! 🎉" :
             total >= 60 ? "Good 👍" :
             total >= 40 ? "Fair 👌" :
             "Needs improvement 📝"}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ScoreMeter;