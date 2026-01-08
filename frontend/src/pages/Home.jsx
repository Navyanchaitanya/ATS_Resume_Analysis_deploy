import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { 
  FaRocket, 
  FaChartLine, 
  FaCheckCircle, 
  FaUserTie, 
  FaLightbulb,
  FaShieldAlt,
  FaClock,
  FaSearch,
  FaFileAlt,
  FaAward,
  FaUsers,
  FaStar
} from 'react-icons/fa';

// Floating elements component
const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-10"
          style={{
            width: `${20 + i * 10}px`,
            height: `${20 + i * 10}px`,
            background: `radial-gradient(circle, ${i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#ec4899'} 0%, transparent 70%)`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.random() * 40 - 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

// Animated background component
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10"
        animate={{
          x: [0, 70, 0],
          y: [0, -70, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
    </div>
  );
};

// Animated typing text component
const TypingText = ({ text, duration = 2 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, duration * 1000 / text.length);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, duration]);

  return <span>{displayText}</span>;
};

// Particle effect component
const Particles = ({ count = 20 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-70"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, -200],
            x: [0, Math.random() * 100 - 50, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
};

// Animated card component
const AnimatedCard = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 group relative overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        y: -10,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={{ scale: 0.8 }}
        whileHover={{ scale: 1 }}
      />
      
      <motion.div 
        className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-6 relative z-10 mx-auto"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-2xl text-white">
          {icon}
        </div>
      </motion.div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-4 text-center relative z-10">
        {title}
      </h3>
      
      <p className="text-gray-700 leading-relaxed text-center relative z-10">
        {description}
      </p>
    </motion.div>
  );
};

const Home = () => {
  const [hovered, setHovered] = useState(false);
  
  const features = [
    {
      icon: <FaChartLine />,
      title: "ATS Score Analysis",
      description: "Get instant feedback on how well your resume matches job descriptions with our advanced AI scoring system."
    },
    {
      icon: <FaCheckCircle />,
      title: "Keyword Optimization",
      description: "Identify missing keywords and improve your resume's relevance to specific job postings."
    },
    {
      icon: <FaUserTie />,
      title: "Professional Feedback",
      description: "Receive detailed suggestions on formatting, grammar, and content to stand out to recruiters."
    },
    {
      icon: <FaLightbulb />,
      title: "Smart Suggestions",
      description: "Get AI-powered recommendations to enhance your resume's impact and readability."
    },
    {
      icon: <FaShieldAlt />,
      title: "Privacy First",
      description: "Your data is secure and never shared with third parties. Analyze resumes with confidence."
    },
    {
      icon: <FaClock />,
      title: "Instant Results",
      description: "Get comprehensive analysis in seconds, not hours. Perfect for last-minute applications."
    }
  ];

  const stats = [
    { number: "98%", label: "Accuracy Rate", icon: <FaAward /> },
    { number: "50K+", label: "Resumes Analyzed", icon: <FaFileAlt /> },
    { number: "4.8/5", label: "User Rating", icon: <FaStar /> },
    { number: "30s", label: "Average Analysis Time", icon: <FaClock /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden relative">
      <AnimatedBackground />
      <FloatingShapes />
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 backdrop-blur-md rounded-full mb-8 border border-white/20"
            >
              <span className="text-sm font-semibold">AI-Powered Resume Analysis</span>
            </motion.div>
            
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transform Your
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                <TypingText text="Job Search" duration={1.5} />
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Beat Applicant Tracking Systems with our AI-powered resume analyzer. 
              Get instant scores, keyword matching, and professional feedback to land more interviews.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 relative overflow-hidden group"
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                >
                  <motion.div
                    animate={{ rotate: hovered ? 360 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FaRocket />
                  </motion.div>
                  Start Free Analysis
                  <Particles count={10} />
                </Link>
              </motion.div>
              
              <Link
                to="/login"
                className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:border-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <motion.div 
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.2 }}
                >
                  <div className="text-2xl text-cyan-400">
                    {stat.icon}
                  </div>
                </motion.div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              Why Choose <span className="text-cyan-400">ResumeCheck</span>?
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <AnimatedCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={1.2 + index * 0.1}
                />
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="text-center mt-20 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl p-12 border border-white/10 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-grid-white/5 bg-[size:40px_40px]"></div>
            
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-6 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9 }}
            >
              Ready to Transform Your Job Search?
            </motion.h2>
            
            <motion.p 
              className="text-xl mb-8 opacity-90 max-w-2xl mx-auto relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0 }}
            >
              Join thousands of professionals who have improved their interview rates with our AI-powered resume analysis.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1 }}
            >
              <Link
                to="/register"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 relative overflow-hidden group"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                />
                <FaRocket />
                Get Started for Free
              </Link>
              
              <p className="text-sm opacity-80 mt-4">
                No credit card required • Analyze 3 resumes free
              </p>
            </motion.div>
          </motion.div>

          {/* How it Works */}
          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.6 }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.3 }}
            >
              How It <span className="text-cyan-400">Works</span>
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Upload & Analyze",
                  description: "Upload your resume and job description for instant AI analysis",
                  icon: <FaFileAlt />
                },
                {
                  step: "2",
                  title: "Get Insights",
                  description: "Receive detailed scores and improvement suggestions",
                  icon: <FaSearch />
                },
                {
                  step: "3",
                  title: "Land Interviews",
                  description: "Optimize your resume and get more interview calls",
                  icon: <FaUsers />
                }
              ].map((item, index) => (
                <motion.div 
                  key={index} 
                  className="text-center bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300 group relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.4 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <motion.div 
                    className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 relative z-10"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {item.icon}
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold mb-4 relative z-10">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-300 relative z-10">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;