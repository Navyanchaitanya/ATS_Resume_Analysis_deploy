// frontend/src/components/ResumeBuilder.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaLinkedin, 
  FaGithub,
  FaBriefcase,
  FaGraduationCap,
  FaTools,
  FaAward,
  FaLanguage,
  FaDownload,
  FaEye,
  FaSave,
  FaPlus,
  FaTrash,
  FaFilePdf,
  FaPalette,
  FaPrint
} from 'react-icons/fa';

// Debug component to check if components are loading
const DebugInfo = ({ message }) => {
  console.log('Debug:', message);
  return null;
};

// Enhanced input components
const InputField = React.memo(({ label, value, onChange, type = 'text', placeholder, className = '' }) => {
  return (
    <div className={className}>
      <label className="block text-gray-700 mb-2 text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white"
        placeholder={placeholder}
      />
    </div>
  );
});

const TextAreaField = React.memo(({ label, value, onChange, rows = 4, placeholder, className = '' }) => {
  return (
    <div className={className}>
      <label className="block text-gray-700 mb-2 text-sm font-medium">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none transition-all duration-200 bg-white"
        placeholder={placeholder}
      />
    </div>
  );
});

const ResumeBuilder = ({ token }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [resumeData, setResumeData] = useState({
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: []
  });

  const [templates] = useState([
    {
      id: 1,
      name: 'Professional',
      description: 'Clean and professional design',
      style: 'professional',
      preview: 'bg-gradient-to-br from-blue-500 to-blue-700',
      icon: '👔'
    },
    {
      id: 2,
      name: 'Modern',
      description: 'Contemporary layout',
      style: 'modern',
      preview: 'bg-gradient-to-br from-gray-600 to-gray-800',
      icon: '💼'
    },
    {
      id: 3,
      name: 'Minimal',
      description: 'Simple and clean',
      style: 'minimal',
      preview: 'bg-gradient-to-br from-green-500 to-green-700',
      icon: '📄'
    },
    {
      id: 4,
      name: 'Creative',
      description: 'Modern creative design',
      style: 'creative',
      preview: 'bg-gradient-to-br from-purple-500 to-purple-700',
      icon: '🎨'
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastSave, setLastSave] = useState(null);
  const [error, setError] = useState(null);

  // Check for critical errors on mount
  useEffect(() => {
    console.log('ResumeBuilder mounted');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('Templates:', templates);
  }, [token]);

  // Input handlers
  const handleInputChange = useCallback((section, field, value) => {
    setResumeData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  }, []);

  const handleSummaryChange = useCallback((value) => {
    setResumeData(prev => ({ ...prev, summary: value }));
  }, []);

  const handleArrayAdd = useCallback((section, newItem) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], { id: Date.now(), ...newItem }]
    }));
  }, []);

  const handleArrayUpdate = useCallback((section, id, field, value) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  }, []);

  const handleArrayRemove = useCallback((section, id) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  }, []);

  const saveResume = async (resumeName = 'My Resume') => {
    try {
      setLoading(true);
      // For now, just simulate save since we don't have the API
      setTimeout(() => {
        setLastSave(new Date());
        setLoading(false);
        console.log('Resume saved successfully!');
      }, 1000);
    } catch (error) {
      console.error('Error saving resume:', error);
      setError('Error saving resume. Please try again.');
      setLoading(false);
    }
  };

  const downloadResumePDF = () => {
    try {
      const element = document.getElementById('resume-preview');
      if (!element) {
        setError('Preview not available. Please check the preview section.');
        return;
      }
      
      // Simple print for now
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${resumeData.personal.fullName || 'Resume'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
            </style>
          </head>
          <body>
            <h1>${resumeData.personal.fullName || 'Your Name'}</h1>
            <p>This is a basic preview. PDF generation would be implemented here.</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Error generating PDF. Please try again.');
    }
  };

  // Simple resume content generation
  const generateResumeContent = () => {
    const { personal, summary, experience, education, skills } = resumeData;
    
    return `
      <div class="resume-container" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div class="header" style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #2b6cb0;">
          <div class="name" style="font-size: 26px; font-weight: 700; color: #2d3748; margin-bottom: 6px;">
            ${personal.fullName || 'Your Name'}
          </div>
          <div class="contact-info" style="color: #718096; font-size: 14px; line-height: 1.6;">
            ${personal.email ? `${personal.email} • ` : ''}
            ${personal.phone ? `${personal.phone} • ` : ''}
            ${personal.location || ''}
          </div>
        </div>

        ${summary ? `
        <div class="section" style="margin-bottom: 20px;">
          <div class="section-title" style="font-size: 16px; font-weight: 600; color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px;">
            Professional Summary
          </div>
          <p style="color: #4a5568; line-height: 1.5; margin-top: 6px; font-size: 14px;">${summary}</p>
        </div>
        ` : ''}

        ${experience.length > 0 ? `
        <div class="section" style="margin-bottom: 20px;">
          <div class="section-title" style="font-size: 16px; font-weight: 600; color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px;">
            Work Experience
          </div>
          ${experience.map(exp => `
            <div class="experience-item" style="margin-bottom: 16px; padding-left: 15px; border-left: 2px solid #bee3f8;">
              <div class="job-title" style="font-weight: 600; color: #2d3748; font-size: 15px;">
                ${exp.position || 'Position'}
              </div>
              <div class="company" style="color: #4a5568; font-weight: 500;">
                ${exp.company || 'Company'} ${exp.location ? ` • ${exp.location}` : ''}
              </div>
              <div class="date" style="color: #718096; font-size: 13px; margin: 4px 0;">
                ${exp.startDate || 'Start'} - ${exp.current ? 'Present' : (exp.endDate || 'End')}
              </div>
              ${exp.description ? `<p style="color: #4a5568; line-height: 1.5; margin-top: 6px; font-size: 14px;">${exp.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${education.length > 0 ? `
        <div class="section" style="margin-bottom: 20px;">
          <div class="section-title" style="font-size: 16px; font-weight: 600; color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px;">
            Education
          </div>
          ${education.map(edu => `
            <div class="education-item" style="margin-bottom: 16px; padding-left: 15px; border-left: 2px solid #bee3f8;">
              <div class="job-title" style="font-weight: 600; color: #2d3748; font-size: 15px;">
                ${edu.degree || 'Degree'}
              </div>
              <div class="company" style="color: #4a5568; font-weight: 500;">
                ${edu.institution || 'Institution'} ${edu.location ? ` • ${edu.location}` : ''}
              </div>
              <div class="date" style="color: #718096; font-size: 13px; margin: 4px 0;">
                ${edu.startDate || 'Start'} - ${edu.current ? 'Present' : (edu.endDate || 'End')}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${skills.length > 0 ? `
        <div class="section" style="margin-bottom: 20px;">
          <div class="section-title" style="font-size: 16px; font-weight: 600; color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px;">
            Skills
          </div>
          <div class="skills" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            ${skills.map(skill => `
              <span class="skill-tag" style="background: #ebf8ff; color: #2b6cb0; padding: 4px 10px; border-radius: 12px; font-size: 12px;">
                ${skill.name} ${skill.level ? `(${skill.level})` : ''}
              </span>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  };

  // Enhanced Form Section Component
  const FormSection = useCallback(({ title, icon, children }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
          {icon}
        </div>
        {title}
      </h3>
      {children}
    </div>
  ), []);

  // Enhanced Template Selector
  const TemplateSelector = useCallback(({ selected, onSelect }) => (
    <div className="grid grid-cols-2 gap-3">
      {templates.map(template => (
        <div
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`relative rounded-lg cursor-pointer transition-all duration-200 overflow-hidden group ${
            selected === template.id
              ? 'ring-2 ring-blue-500 shadow-md'
              : 'shadow-sm hover:shadow-md'
          }`}
        >
          <div className={`w-full h-16 ${template.preview} flex items-center justify-center relative`}>
            <div className="text-white text-xl">
              {template.icon}
            </div>
          </div>
          <div className="p-3 bg-white">
            <h4 className="font-medium text-gray-800 text-sm">{template.name}</h4>
            <p className="text-gray-600 text-xs mt-1">{template.description}</p>
          </div>
        </div>
      ))}
    </div>
  ), [templates]);

  // Navigation tabs
  const navigationTabs = useMemo(() => [
    { id: 'personal', label: 'Personal', icon: <FaUser size={14} /> },
    { id: 'summary', label: 'Summary', icon: <FaBriefcase size={14} /> },
    { id: 'experience', label: 'Experience', icon: <FaBriefcase size={14} /> },
    { id: 'education', label: 'Education', icon: <FaGraduationCap size={14} /> },
    { id: 'skills', label: 'Skills', icon: <FaTools size={14} /> },
    { id: 'projects', label: 'Projects', icon: <FaAward size={14} /> },
    { id: 'certifications', label: 'Certifications', icon: <FaFilePdf size={14} /> },
    { id: 'languages', label: 'Languages', icon: <FaLanguage size={14} /> }
  ], []);

  // Render functions for all sections
  const renderExperienceItem = useCallback((exp, index) => (
    <div
      key={exp.id}
      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <InputField
          label="Position"
          value={exp.position}
          onChange={(e) => handleArrayUpdate('experience', exp.id, 'position', e.target.value)}
          placeholder="e.g., Senior Software Engineer"
        />
        <InputField
          label="Company"
          value={exp.company}
          onChange={(e) => handleArrayUpdate('experience', exp.id, 'company', e.target.value)}
          placeholder="e.g., Google Inc."
        />
        <InputField
          label="Location"
          value={exp.location}
          onChange={(e) => handleArrayUpdate('experience', exp.id, 'location', e.target.value)}
          placeholder="e.g., Remote, San Francisco, CA"
        />
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label="Start Date"
            type="month"
            value={exp.startDate}
            onChange={(e) => handleArrayUpdate('experience', exp.id, 'startDate', e.target.value)}
          />
          {!exp.current && (
            <InputField
              label="End Date"
              type="month"
              value={exp.endDate}
              onChange={(e) => handleArrayUpdate('experience', exp.id, 'endDate', e.target.value)}
            />
          )}
        </div>
      </div>
      
      <TextAreaField
        label="Description"
        value={exp.description}
        onChange={(e) => handleArrayUpdate('experience', exp.id, 'description', e.target.value)}
        rows={3}
        placeholder="Describe your responsibilities and achievements..."
      />
      
      <div className="flex justify-between items-center mt-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={exp.current}
            onChange={(e) => handleArrayUpdate('experience', exp.id, 'current', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700">I currently work here</span>
        </label>
        <button
          onClick={() => handleArrayRemove('experience', exp.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm transition-colors"
        >
          <FaTrash size={12} />
          Remove
        </button>
      </div>
    </div>
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderEducationItem = useCallback((edu, index) => (
    <div
      key={edu.id}
      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <InputField
          label="Degree"
          value={edu.degree}
          onChange={(e) => handleArrayUpdate('education', edu.id, 'degree', e.target.value)}
          placeholder="e.g., Bachelor of Science in Computer Science"
        />
        <InputField
          label="Institution"
          value={edu.institution}
          onChange={(e) => handleArrayUpdate('education', edu.id, 'institution', e.target.value)}
          placeholder="e.g., Stanford University"
        />
        <InputField
          label="Location"
          value={edu.location}
          onChange={(e) => handleArrayUpdate('education', edu.id, 'location', e.target.value)}
          placeholder="e.g., Stanford, CA"
        />
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label="Start Date"
            type="month"
            value={edu.startDate}
            onChange={(e) => handleArrayUpdate('education', edu.id, 'startDate', e.target.value)}
          />
          {!edu.current && (
            <InputField
              label="End Date"
              type="month"
              value={edu.endDate}
              onChange={(e) => handleArrayUpdate('education', edu.id, 'endDate', e.target.value)}
            />
          )}
        </div>
      </div>
      
      <TextAreaField
        label="Description"
        value={edu.description}
        onChange={(e) => handleArrayUpdate('education', edu.id, 'description', e.target.value)}
        rows={2}
        placeholder="Relevant coursework, achievements, or honors..."
      />
      
      <div className="flex justify-between items-center mt-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={edu.current}
            onChange={(e) => handleArrayUpdate('education', edu.id, 'current', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700">Currently studying here</span>
        </label>
        <button
          onClick={() => handleArrayRemove('education', edu.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm transition-colors"
        >
          <FaTrash size={12} />
          Remove
        </button>
      </div>
    </div>
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderSkillItem = useCallback((skill, index) => (
    <div
      key={skill.id}
      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InputField
          label="Skill Name"
          value={skill.name}
          onChange={(e) => handleArrayUpdate('skills', skill.id, 'name', e.target.value)}
          placeholder="e.g., JavaScript, Project Management"
        />
        <InputField
          label="Proficiency Level"
          value={skill.level}
          onChange={(e) => handleArrayUpdate('skills', skill.id, 'level', e.target.value)}
          placeholder="e.g., Expert, Intermediate, Beginner"
        />
        <InputField
          label="Category"
          value={skill.category}
          onChange={(e) => handleArrayUpdate('skills', skill.id, 'category', e.target.value)}
          placeholder="e.g., Technical, Soft Skills"
        />
      </div>
      <div className="flex justify-end mt-3">
        <button
          onClick={() => handleArrayRemove('skills', skill.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm transition-colors"
        >
          <FaTrash size={12} />
          Remove
        </button>
      </div>
    </div>
  ), [handleArrayUpdate, handleArrayRemove]);

  // If there's a critical error, show it
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <DebugInfo message="Rendering main component" />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl mb-6">
        <div className="px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Create Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Perfect Resume</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Build professional, ATS-friendly resumes that stand out. 
              <span className="text-blue-600 font-medium"> Download instantly as PDF.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Form Input */}
          <div className="space-y-6">
            <DebugInfo message="Rendering left panel" />
            
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex flex-wrap gap-2">
                {navigationTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              <DebugInfo message={`Active tab: ${activeTab}`} />

              {/* Personal Information Section */}
              {activeTab === 'personal' && (
                <FormSection title="Personal Information" icon={<FaUser />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      value={resumeData.personal.fullName}
                      onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
                      placeholder="John Doe"
                    />
                    <InputField
                      label="Email Address"
                      type="email"
                      value={resumeData.personal.email}
                      onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                      placeholder="john@example.com"
                    />
                    <InputField
                      label="Phone Number"
                      type="tel"
                      value={resumeData.personal.phone}
                      onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                    <InputField
                      label="Location"
                      value={resumeData.personal.location}
                      onChange={(e) => handleInputChange('personal', 'location', e.target.value)}
                      placeholder="San Francisco, CA"
                    />
                    <InputField
                      label="LinkedIn URL"
                      value={resumeData.personal.linkedin}
                      onChange={(e) => handleInputChange('personal', 'linkedin', e.target.value)}
                      placeholder="linkedin.com/in/username"
                    />
                    <InputField
                      label="GitHub URL"
                      value={resumeData.personal.github}
                      onChange={(e) => handleInputChange('personal', 'github', e.target.value)}
                      placeholder="github.com/username"
                    />
                  </div>
                </FormSection>
              )}

              {/* Professional Summary */}
              {activeTab === 'summary' && (
                <FormSection title="Professional Summary" icon={<FaBriefcase />}>
                  <TextAreaField
                    label="Summary"
                    value={resumeData.summary}
                    onChange={(e) => handleSummaryChange(e.target.value)}
                    rows={5}
                    placeholder="Describe your professional background, key skills, and career objectives..."
                  />
                </FormSection>
              )}

              {/* Work Experience */}
              {activeTab === 'experience' && (
                <FormSection title="Work Experience" icon={<FaBriefcase />}>
                  <div className="space-y-4">
                    {resumeData.experience.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-3xl mb-2">💼</div>
                        <p className="text-gray-500 text-sm">No work experience added yet.</p>
                      </div>
                    ) : (
                      resumeData.experience.map((exp, index) => renderExperienceItem(exp, index))
                    )}
                    <button
                      type="button"
                      onClick={() => handleArrayAdd('experience', {
                        position: '',
                        company: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        description: '',
                        current: false
                      })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2 bg-white/50 hover:bg-blue-50"
                    >
                      <FaPlus size={14} />
                      <span className="font-medium">Add New Experience</span>
                    </button>
                  </div>
                </FormSection>
              )}

              {/* Education */}
              {activeTab === 'education' && (
                <FormSection title="Education" icon={<FaGraduationCap />}>
                  <div className="space-y-4">
                    {resumeData.education.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-3xl mb-2">🎓</div>
                        <p className="text-gray-500 text-sm">No education history added yet.</p>
                      </div>
                    ) : (
                      resumeData.education.map((edu, index) => renderEducationItem(edu, index))
                    )}
                    <button
                      type="button"
                      onClick={() => handleArrayAdd('education', {
                        degree: '',
                        institution: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        description: '',
                        current: false
                      })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2 bg-white/50 hover:bg-blue-50"
                    >
                      <FaPlus size={14} />
                      <span className="font-medium">Add New Education</span>
                    </button>
                  </div>
                </FormSection>
              )}

              {/* Skills */}
              {activeTab === 'skills' && (
                <FormSection title="Skills" icon={<FaTools />}>
                  <div className="space-y-4">
                    {resumeData.skills.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-3xl mb-2">🛠️</div>
                        <p className="text-gray-500 text-sm">No skills added yet.</p>
                      </div>
                    ) : (
                      resumeData.skills.map((skill, index) => renderSkillItem(skill, index))
                    )}
                    <button
                      type="button"
                      onClick={() => handleArrayAdd('skills', {
                        name: '',
                        level: '',
                        category: ''
                      })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2 bg-white/50 hover:bg-blue-50"
                    >
                      <FaPlus size={14} />
                      <span className="font-medium">Add New Skill</span>
                    </button>
                  </div>
                </FormSection>
              )}
            </div>
          </div>

          {/* Right Panel - Preview & Templates */}
          <div className="space-y-6">
            <DebugInfo message="Rendering right panel" />
            
            {/* Template Selection */}
            <FormSection title="Choose Template" icon={<FaPalette />}>
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </FormSection>

            {/* Live Preview */}
            <FormSection title="Live Preview" icon={<FaEye />}>
              <div className="bg-gray-100 rounded-lg p-2">
                <div className="bg-white rounded-lg min-h-[600px] max-h-[700px] overflow-y-auto shadow-inner p-4">
                  <div 
                    id="resume-preview"
                    dangerouslySetInnerHTML={{ __html: generateResumeContent() }}
                  />
                </div>
              </div>
            </FormSection>

            {/* Quick Actions */}
            <FormSection title="Quick Actions" icon={<FaRocket />}>
              <div className="space-y-3">
                <button
                  onClick={() => saveResume()}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaSave size={14} />
                  {loading ? 'Saving...' : 'Save Resume'}
                </button>
                
                <button
                  onClick={downloadResumePDF}
                  className="w-full bg-green-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaPrint size={14} />
                  Download as PDF
                </button>

                {lastSave && (
                  <div className="text-center text-sm text-green-600 bg-green-50 rounded-lg p-2 border border-green-200">
                    ✅ Last saved: {lastSave.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </FormSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;