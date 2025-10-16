// frontend/src/components/ResumeBuilder.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  FaEdit,
  FaFilePdf,
  FaPalette,
  FaMagic,
  FaCheck,
  FaGlobe
} from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../App';
import html2pdf from 'html2pdf.js';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

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

  // Debounce the entire resume data
  const debouncedResumeData = useDebounce(resumeData, 1000);

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Professional',
      description: 'Clean and professional ATS-friendly template',
      category: 'ATS Optimized',
      style: 'professional',
      preview: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-blue-500'
    },
    {
      id: 2,
      name: 'Modern',
      description: 'Contemporary design with visual appeal',
      category: 'Modern',
      style: 'modern',
      preview: 'bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500'
    },
    {
      id: 3,
      name: 'Executive',
      description: 'Sophisticated layout for senior roles',
      category: 'Executive',
      style: 'executive',
      preview: 'bg-gradient-to-br from-gray-50 to-blue-50 border-l-4 border-gray-500'
    },
    {
      id: 4,
      name: 'Creative',
      description: 'For design and creative roles',
      category: 'Creative',
      style: 'creative',
      preview: 'bg-gradient-to-br from-green-50 to-teal-50 border-l-4 border-green-500'
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [savedResumes, setSavedResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [lastSave, setLastSave] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && token && debouncedResumeData && !isTyping) {
      saveResume('Auto-saved Resume', debouncedResumeData);
    }
  }, [debouncedResumeData, autoSave, token, isTyping]);

  // Load saved resumes
  useEffect(() => {
    if (token) {
      loadSavedResumes();
    }
  }, [token]);

  const loadSavedResumes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedResumes(response.data);
    } catch (error) {
      console.error('Error loading resumes:', error);
    }
  };

  // Optimized input handlers
  const handleInputChange = useCallback((section, field, value) => {
    setIsTyping(true);
    setResumeData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Reset typing indicator after delay
    setTimeout(() => setIsTyping(false), 1000);
  }, []);

  const handleSummaryChange = useCallback((value) => {
    setIsTyping(true);
    setResumeData(prev => ({ ...prev, summary: value }));
    setTimeout(() => setIsTyping(false), 1000);
  }, []);

  const handleArrayAdd = useCallback((section, newItem) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], { id: Date.now(), ...newItem }]
    }));
  }, []);

  const handleArrayUpdate = useCallback((section, id, updates) => {
    setIsTyping(true);
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
    setTimeout(() => setIsTyping(false), 1000);
  }, []);

  const handleArrayRemove = useCallback((section, id) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  }, []);

  const saveResume = async (resumeName = 'My Resume', dataToSave = null) => {
    try {
      setLoading(true);
      const data = dataToSave || resumeData;
      const response = await axios.post(`${API_BASE_URL}/api/resumes`, {
        name: resumeName,
        template: selectedTemplate,
        data: data,
        preview: generateResumePreview(data)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await loadSavedResumes();
      setLastSave(new Date());
      if (!dataToSave) {
        console.log('Resume saved successfully!');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      if (!dataToSave) {
        alert('Error saving resume. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadResumePDF = () => {
    const element = document.getElementById('resume-preview');
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `${resumeData.personal.fullName || 'resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const generateResumePreview = (data = resumeData) => {
    return `
      ${data.personal.fullName || 'Your Name'}
      ${data.personal.email || 'email@example.com'} | ${data.personal.phone || 'Phone'}
      ${data.summary?.substring(0, 100) || 'Professional summary...'}
      Experience: ${data.experience.length} positions
      Education: ${data.education.length} entries
      Skills: ${data.skills.length} skills
    `;
  };

  const generateResumeHTML = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    return generateTemplateHTML(template.style);
  };

  const generateTemplateHTML = (templateStyle) => {
    const styles = {
      professional: `
        <style>
          body { font-family: 'Arial', sans-serif; margin: 40px; line-height: 1.6; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .name { font-size: 28px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
          .contact-info { color: #6b7280; margin-bottom: 10px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; margin-bottom: 10px; }
          .experience-item, .education-item { margin-bottom: 15px; }
          .job-title { font-weight: bold; color: #374151; }
          .company { color: #6b7280; font-style: italic; }
          .date { color: #9ca3af; font-size: 14px; }
          .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px; }
          .skill-tag { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
        </style>
      `,
      modern: `
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 50px; line-height: 1.7; color: #2d3748; background: #f7fafc; }
          .resume-container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .name { font-size: 32px; font-weight: bold; color: #2d3748; margin-bottom: 10px; }
          .contact-info { color: #718096; font-size: 16px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 20px; font-weight: 600; color: #4a5568; border-left: 4px solid #667eea; padding-left: 10px; margin-bottom: 15px; }
          .experience-item, .education-item { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .job-title { font-weight: 600; color: #2d3748; }
          .company { color: #667eea; font-weight: 500; }
          .date { color: #a0aec0; font-size: 14px; margin-top: 5px; }
          .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
          .skill-tag { background: #667eea; color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; }
        </style>
      `,
      executive: `
        <style>
          body { font-family: 'Georgia', serif; margin: 50px; line-height: 1.8; color: #2d3748; background: #f8f9fa; }
          .resume-container { background: white; padding: 50px; border: 1px solid #e2e8f0; }
          .header { text-align: center; margin-bottom: 40px; }
          .name { font-size: 36px; font-weight: 300; color: #2d3748; margin-bottom: 10px; letter-spacing: 1px; }
          .contact-info { color: #718096; font-size: 16px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: 600; color: #2d3748; border-bottom: 2px solid #cbd5e0; padding-bottom: 8px; margin-bottom: 15px; }
          .experience-item, .education-item { margin-bottom: 25px; }
          .job-title { font-weight: 600; color: #2d3748; }
          .company { color: #718096; font-style: italic; }
          .date { color: #a0aec0; font-size: 14px; margin-top: 5px; }
          .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
          .skill-tag { background: #e2e8f0; color: #4a5568; padding: 4px 12px; border-radius: 3px; font-size: 14px; }
        </style>
      `,
      creative: `
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; line-height: 1.6; color: #2d3748; background: #f7fafc; }
          .resume-container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin-bottom: 40px; }
          .name { font-size: 36px; font-weight: 800; color: #2d3748; margin-bottom: 10px; }
          .contact-info { color: #718096; font-size: 16px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 22px; font-weight: 700; color: #2d3748; margin-bottom: 15px; position: relative; }
          .section-title:after { content: ''; position: absolute; bottom: -5px; left: 0; width: 50px; height: 3px; background: #667eea; }
          .experience-item, .education-item { margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; }
          .job-title { font-weight: 600; color: #2d3748; }
          .company { color: #667eea; font-weight: 500; }
          .date { color: #a0aec0; font-size: 14px; margin-top: 5px; }
          .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
          .skill-tag { background: #667eea; color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; }
        </style>
      `
    };

    const baseHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resume - ${resumeData.personal.fullName}</title>
        <meta charset="UTF-8">
        ${styles[templateStyle] || styles.professional}
      </head>
      <body>
        <div class="resume-container">
          ${generateResumeContent()}
        </div>
      </body>
      </html>
    `;

    return baseHTML;
  };

  const generateResumeContent = () => {
    const { personal, summary, experience, education, skills, projects, certifications, languages } = resumeData;
    
    return `
      <div class="header">
        <div>
          <div class="name">${personal.fullName || 'Your Name'}</div>
          <div class="contact-info">
            ${personal.email ? `${personal.email} • ` : ''}
            ${personal.phone ? `${personal.phone} • ` : ''}
            ${personal.location || ''}
            ${personal.linkedin ? `<br>LinkedIn: ${personal.linkedin}` : ''}
            ${personal.github ? ` • GitHub: ${personal.github}` : ''}
          </div>
        </div>
      </div>

      ${summary ? `
      <div class="section">
        <div class="section-title">Professional Summary</div>
        <p>${summary}</p>
      </div>
      ` : ''}

      ${experience.length > 0 ? `
      <div class="section">
        <div class="section-title">Work Experience</div>
        ${experience.map(exp => `
          <div class="experience-item">
            <div class="job-title">${exp.position || 'Position'}</div>
            <div class="company">${exp.company || 'Company'} ${exp.location ? ` • ${exp.location}` : ''}</div>
            <div class="date">${exp.startDate || 'Start'} - ${exp.current ? 'Present' : (exp.endDate || 'End')}</div>
            ${exp.description ? `<p>${exp.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${education.length > 0 ? `
      <div class="section">
        <div class="section-title">Education</div>
        ${education.map(edu => `
          <div class="education-item">
            <div class="job-title">${edu.degree || 'Degree'}</div>
            <div class="company">${edu.institution || 'Institution'} ${edu.location ? ` • ${edu.location}` : ''}</div>
            <div class="date">${edu.startDate || 'Start'} - ${edu.current ? 'Present' : (edu.endDate || 'End')}</div>
            ${edu.description ? `<p>${edu.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${skills.length > 0 ? `
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills">
          ${skills.map(skill => `
            <span class="skill-tag">${skill.name} ${skill.level ? `(${skill.level})` : ''}</span>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${projects.length > 0 ? `
      <div class="section">
        <div class="section-title">Projects</div>
        ${projects.map(project => `
          <div class="experience-item">
            <div class="job-title">${project.name || 'Project Name'}</div>
            ${project.technologies ? `<div class="company">${project.technologies}</div>` : ''}
            ${project.description ? `<p>${project.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${certifications.length > 0 ? `
      <div class="section">
        <div class="section-title">Certifications</div>
        ${certifications.map(cert => `
          <div class="experience-item">
            <div class="job-title">${cert.name || 'Certification Name'}</div>
            <div class="company">${cert.issuer || 'Issuing Organization'}</div>
            <div class="date">${cert.date || 'Date'} ${cert.expiry ? `- Expires: ${cert.expiry}` : ''}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${languages.length > 0 ? `
      <div class="section">
        <div class="section-title">Languages</div>
        <div class="skills">
          ${languages.map(lang => `
            <span class="skill-tag">${lang.name} ${lang.proficiency ? `(${lang.proficiency})` : ''}</span>
          `).join('')}
        </div>
      </div>
      ` : ''}
    `;
  };

  // Memoized components
  const FormSection = React.memo(({ title, icon, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </motion.div>
  ));

  const ArrayInput = React.memo(({ section, items, renderItem, emptyMessage, onAdd }) => (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
      ) : (
        items.map((item, index) => renderItem(item, index))
      )}
      <button
        type="button"
        onClick={onAdd}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
      >
        <FaPlus />
        Add New
      </button>
    </div>
  ));

  const TemplateSelector = React.memo(({ selected, onSelect }) => (
    <div className="grid grid-cols-2 gap-3">
      {templates.map(template => (
        <motion.div
          key={template.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(template.id)}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            selected === template.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`w-full h-16 rounded mb-2 ${template.preview} flex items-center justify-center`}>
            <FaFilePdf className="text-lg opacity-60" />
          </div>
          <h4 className="font-semibold text-gray-800 text-xs">{template.name}</h4>
          <p className="text-gray-600 text-xs mt-1 line-clamp-2">{template.description}</p>
        </motion.div>
      ))}
    </div>
  ));

  const navigationTabs = useMemo(() => [
    { id: 'personal', label: 'Personal', icon: <FaUser /> },
    { id: 'summary', label: 'Summary', icon: <FaBriefcase /> },
    { id: 'experience', label: 'Experience', icon: <FaBriefcase /> },
    { id: 'education', label: 'Education', icon: <FaGraduationCap /> },
    { id: 'skills', label: 'Skills', icon: <FaTools /> },
    { id: 'projects', label: 'Projects', icon: <FaAward /> },
    { id: 'certifications', label: 'Certifications', icon: <FaAward /> },
    { id: 'languages', label: 'Languages', icon: <FaLanguage /> }
  ], []);

  // Input field component for consistent styling
  const InputField = ({ label, value, onChange, type = 'text', placeholder, className = '' }) => (
    <div className={className}>
      <label className="block text-gray-700 mb-1 text-xs font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
        placeholder={placeholder}
      />
    </div>
  );

  const TextAreaField = ({ label, value, onChange, rows = 4, placeholder, className = '' }) => (
    <div className={className}>
      <label className="block text-gray-700 mb-1 text-xs font-medium">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none transition-all duration-200"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Professional Resume Builder
            </span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Create stunning, professional resumes that stand out. Download as PDF instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar - Templates & Settings */}
          <div className="xl:col-span-1 space-y-6">
            <FormSection title="🎨 Templates" icon={<FaPalette />}>
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </FormSection>

            <FormSection title="⚙️ Settings" icon={<FaMagic />}>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                      autoSave ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      autoSave ? 'transform translate-x-4' : ''
                    }`}></div>
                  </div>
                  <span className="text-gray-700 text-sm font-medium">Auto-save</span>
                </label>
                
                {lastSave && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <FaCheck className="text-xs" />
                    <span>Last saved: {lastSave.toLocaleTimeString()}</span>
                  </div>
                )}

                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span>Typing...</span>
                  </div>
                )}
              </div>
            </FormSection>
          </div>

          {/* Main Content - Form Sections */}
          <div className="xl:col-span-2">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl p-2 shadow-lg mb-6 sticky top-4 z-10">
              <div className="flex flex-wrap gap-1">
                {navigationTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
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
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Personal Information */}
                {activeTab === 'personal' && (
                  <FormSection title="👤 Personal Information" icon={<FaUser />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="Full Name"
                        value={resumeData.personal.fullName}
                        onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
                        placeholder="John Doe"
                      />
                      <InputField
                        label="Email"
                        type="email"
                        value={resumeData.personal.email}
                        onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                        placeholder="john@example.com"
                      />
                      <InputField
                        label="Phone"
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
                        label="LinkedIn"
                        value={resumeData.personal.linkedin}
                        onChange={(e) => handleInputChange('personal', 'linkedin', e.target.value)}
                        placeholder="linkedin.com/in/username"
                      />
                      <InputField
                        label="GitHub"
                        value={resumeData.personal.github}
                        onChange={(e) => handleInputChange('personal', 'github', e.target.value)}
                        placeholder="github.com/username"
                      />
                      <InputField
                        label="Portfolio"
                        value={resumeData.personal.portfolio}
                        onChange={(e) => handleInputChange('personal', 'portfolio', e.target.value)}
                        placeholder="yourportfolio.com"
                        className="md:col-span-2"
                      />
                    </div>
                  </FormSection>
                )}

                {/* Professional Summary */}
                {activeTab === 'summary' && (
                  <FormSection title="📝 Professional Summary" icon={<FaBriefcase />}>
                    <TextAreaField
                      label="Summary"
                      value={resumeData.summary}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      rows={6}
                      placeholder="Describe your professional background, key skills, and career objectives..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {resumeData.summary.length}/500 characters • Write a compelling summary that highlights your expertise
                    </p>
                  </FormSection>
                )}

                {/* Work Experience */}
                {activeTab === 'experience' && (
                  <FormSection title="💼 Work Experience" icon={<FaBriefcase />}>
                    <ArrayInput
                      section="experience"
                      items={resumeData.experience}
                      emptyMessage="No work experience added yet. Start by adding your first job experience."
                      onAdd={() => handleArrayAdd('experience', {
                        position: '',
                        company: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        description: '',
                        current: false
                      })}
                      renderItem={(exp, index) => (
                        <motion.div
                          key={exp.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <InputField
                              label="Position"
                              value={exp.position}
                              onChange={(e) => handleArrayUpdate('experience', exp.id, { position: e.target.value })}
                              placeholder="e.g., Senior Software Engineer"
                            />
                            <InputField
                              label="Company"
                              value={exp.company}
                              onChange={(e) => handleArrayUpdate('experience', exp.id, { company: e.target.value })}
                              placeholder="e.g., Google Inc."
                            />
                            <InputField
                              label="Location"
                              value={exp.location}
                              onChange={(e) => handleArrayUpdate('experience', exp.id, { location: e.target.value })}
                              placeholder="e.g., Remote, San Francisco, CA"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <InputField
                                label="Start Date"
                                type="month"
                                value={exp.startDate}
                                onChange={(e) => handleArrayUpdate('experience', exp.id, { startDate: e.target.value })}
                              />
                              {!exp.current && (
                                <InputField
                                  label="End Date"
                                  type="month"
                                  value={exp.endDate}
                                  onChange={(e) => handleArrayUpdate('experience', exp.id, { endDate: e.target.value })}
                                />
                              )}
                            </div>
                          </div>
                          
                          <TextAreaField
                            label="Description"
                            value={exp.description}
                            onChange={(e) => handleArrayUpdate('experience', exp.id, { description: e.target.value })}
                            rows={3}
                            placeholder="Describe your responsibilities and achievements..."
                          />
                          
                          <div className="flex justify-between items-center mt-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={exp.current}
                                onChange={(e) => handleArrayUpdate('experience', exp.id, { current: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">I currently work here</span>
                            </label>
                            <button
                              onClick={() => handleArrayRemove('experience', exp.id)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
                            >
                              <FaTrash className="text-xs" />
                              Remove
                            </button>
                          </div>
                        </motion.div>
                      )}
                    />
                  </FormSection>
                )}

                {/* Education */}
                {activeTab === 'education' && (
                  <FormSection title="🎓 Education" icon={<FaGraduationCap />}>
                    <ArrayInput
                      section="education"
                      items={resumeData.education}
                      emptyMessage="No education history added yet. Add your educational background."
                      onAdd={() => handleArrayAdd('education', {
                        degree: '',
                        institution: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        description: '',
                        current: false
                      })}
                      renderItem={(edu, index) => (
                        <motion.div
                          key={edu.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <InputField
                              label="Degree"
                              value={edu.degree}
                              onChange={(e) => handleArrayUpdate('education', edu.id, { degree: e.target.value })}
                              placeholder="e.g., Bachelor of Science in Computer Science"
                            />
                            <InputField
                              label="Institution"
                              value={edu.institution}
                              onChange={(e) => handleArrayUpdate('education', edu.id, { institution: e.target.value })}
                              placeholder="e.g., Stanford University"
                            />
                            <InputField
                              label="Location"
                              value={edu.location}
                              onChange={(e) => handleArrayUpdate('education', edu.id, { location: e.target.value })}
                              placeholder="e.g., Stanford, CA"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <InputField
                                label="Start Date"
                                type="month"
                                value={edu.startDate}
                                onChange={(e) => handleArrayUpdate('education', edu.id, { startDate: e.target.value })}
                              />
                              {!edu.current && (
                                <InputField
                                  label="End Date"
                                  type="month"
                                  value={edu.endDate}
                                  onChange={(e) => handleArrayUpdate('education', edu.id, { endDate: e.target.value })}
                                />
                              )}
                            </div>
                          </div>
                          
                          <TextAreaField
                            label="Description"
                            value={edu.description}
                            onChange={(e) => handleArrayUpdate('education', edu.id, { description: e.target.value })}
                            rows={2}
                            placeholder="Relevant coursework, achievements, or honors..."
                          />
                          
                          <div className="flex justify-between items-center mt-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={edu.current}
                                onChange={(e) => handleArrayUpdate('education', edu.id, { current: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">Currently studying here</span>
                            </label>
                            <button
                              onClick={() => handleArrayRemove('education', edu.id)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
                            >
                              <FaTrash className="text-xs" />
                              Remove
                            </button>
                          </div>
                        </motion.div>
                      )}
                    />
                  </FormSection>
                )}

                {/* Skills */}
                {activeTab === 'skills' && (
                  <FormSection title="🛠️ Skills" icon={<FaTools />}>
                    <ArrayInput
                      section="skills"
                      items={resumeData.skills}
                      emptyMessage="No skills added yet. Add your technical and professional skills."
                      onAdd={() => handleArrayAdd('skills', {
                        name: '',
                        level: '',
                        category: ''
                      })}
                      renderItem={(skill, index) => (
                        <motion.div
                          key={skill.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <InputField
                              label="Skill Name"
                              value={skill.name}
                              onChange={(e) => handleArrayUpdate('skills', skill.id, { name: e.target.value })}
                              placeholder="e.g., JavaScript, Project Management"
                            />
                            <InputField
                              label="Proficiency Level"
                              value={skill.level}
                              onChange={(e) => handleArrayUpdate('skills', skill.id, { level: e.target.value })}
                              placeholder="e.g., Expert, Intermediate, Beginner"
                            />
                            <InputField
                              label="Category"
                              value={skill.category}
                              onChange={(e) => handleArrayUpdate('skills', skill.id, { category: e.target.value })}
                              placeholder="e.g., Technical, Soft Skills"
                            />
                          </div>
                          <div className="flex justify-end mt-3">
                            <button
                              onClick={() => handleArrayRemove('skills', skill.id)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
                            >
                              <FaTrash className="text-xs" />
                              Remove
                            </button>
                          </div>
                        </motion.div>
                      )}
                    />
                  </FormSection>
                )}

                {/* Projects */}
                {activeTab === 'projects' && (
                  <FormSection title="🚀 Projects" icon={<FaAward />}>
                    <ArrayInput
                      section="projects"
                      items={resumeData.projects}
                      emptyMessage="No projects added yet. Showcase your personal or professional projects."
                      onAdd={() => handleArrayAdd('projects', {
                        name: '',
                        technologies: '',
                        description: '',
                        url: ''
                      })}
                      renderItem={(project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <InputField
                              label="Project Name"
                              value={project.name}
                              onChange={(e) => handleArrayUpdate('projects', project.id, { name: e.target.value })}
                              placeholder="e.g., E-commerce Website"
                            />
                            <InputField
                              label="Technologies Used"
                              value={project.technologies}
                              onChange={(e) => handleArrayUpdate('projects', project.id, { technologies: e.target.value })}
                              placeholder="e.g., React, Node.js, MongoDB"
                            />
                            <InputField
                              label="Project URL"
                              value={project.url}
                              onChange={(e) => handleArrayUpdate('projects', project.id, { url: e.target.value })}
                              placeholder="e.g., https://github.com/username/project"
                              className="md:col-span-2"
                            />
                          </div>
                          
                          <TextAreaField
                            label="Project Description"
                            value={project.description}
                            onChange={(e) => handleArrayUpdate('projects', project.id, { description: e.target.value })}
                            rows={3}
                            placeholder="Describe the project, your role, and key achievements..."
                          />
                          
                          <div className="flex justify-end mt-3">
                            <button
                              onClick={() => handleArrayRemove('projects', project.id)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
                            >
                              <FaTrash className="text-xs" />
                              Remove
                            </button>
                          </div>
                        </motion.div>
                      )}
                    />
                  </FormSection>
                )}

                {/* Certifications */}
                {activeTab === 'certifications' && (
                  <FormSection title="🏆 Certifications" icon={<FaAward />}>
                    <ArrayInput
                      section="certifications"
                      items={resumeData.certifications}
                      emptyMessage="No certifications added yet. Add your professional certifications."
                      onAdd={() => handleArrayAdd('certifications', {
                        name: '',
                        issuer: '',
                        date: '',
                        expiry: ''
                      })}
                      renderItem={(cert, index) => (
                        <motion.div
                          key={cert.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InputField
                              label="Certification Name"
                              value={cert.name}
                              onChange={(e) => handleArrayUpdate('certifications', cert.id, { name: e.target.value })}
                              placeholder="e.g., AWS Certified Solutions Architect"
                            />
                            <InputField
                              label="Issuing Organization"
                              value={cert.issuer}
                              onChange={(e) => handleArrayUpdate('certifications', cert.id, { issuer: e.target.value })}
                              placeholder="e.g., Amazon Web Services"
                            />
                            <InputField
                              label="Issue Date"
                              type="month"
                              value={cert.date}
                              onChange={(e) => handleArrayUpdate('certifications', cert.id, { date: e.target.value })}
                            />
                            <InputField
                              label="Expiry Date"
                              type="month"
                              value={cert.expiry}
                              onChange={(e) => handleArrayUpdate('certifications', cert.id, { expiry: e.target.value })}
                              placeholder="Leave empty if no expiry"
                            />
                          </div>
                          <div className="flex justify-end mt-3">
                            <button
                              onClick={() => handleArrayRemove('certifications', cert.id)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
                            >
                              <FaTrash className="text-xs" />
                              Remove
                            </button>
                          </div>
                        </motion.div>
                      )}
                    />
                  </FormSection>
                )}

                {/* Languages */}
                {activeTab === 'languages' && (
                  <FormSection title="🌐 Languages" icon={<FaLanguage />}>
                    <ArrayInput
                      section="languages"
                      items={resumeData.languages}
                      emptyMessage="No languages added yet. Add languages you speak."
                      onAdd={() => handleArrayAdd('languages', {
                        name: '',
                        proficiency: ''
                      })}
                      renderItem={(lang, index) => (
                        <motion.div
                          key={lang.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InputField
                              label="Language"
                              value={lang.name}
                              onChange={(e) => handleArrayUpdate('languages', lang.id, { name: e.target.value })}
                              placeholder="e.g., Spanish, French, Mandarin"
                            />
                            <InputField
                              label="Proficiency Level"
                              value={lang.proficiency}
                              onChange={(e) => handleArrayUpdate('languages', lang.id, { proficiency: e.target.value })}
                              placeholder="e.g., Native, Fluent, Intermediate, Basic"
                            />
                          </div>
                          <div className="flex justify-end mt-3">
                            <button
                              onClick={() => handleArrayRemove('languages', lang.id)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
                            >
                              <FaTrash className="text-xs" />
                              Remove
                            </button>
                          </div>
                        </motion.div>
                      )}
                    />
                  </FormSection>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Sidebar - Preview & Actions */}
          <div className="xl:col-span-1 space-y-6">
            <FormSection title="👁️ Preview" icon={<FaEye />}>
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                {previewMode ? (
                  <div 
                    id="resume-preview"
                    className="prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: generateResumeHTML() }}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FaEye className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p className="text-sm mb-2">Preview your resume in real-time</p>
                    <p className="text-xs text-gray-400 mb-4">See how your resume looks with the selected template</p>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition-all duration-200"
                    >
                      Show Preview
                    </button>
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection title="🚀 Actions" icon={<FaDownload />}>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const name = prompt('Enter resume name:', `${resumeData.personal.fullName || 'My'} Resume`);
                    if (name) saveResume(name);
                  }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaSave />
                  {loading ? 'Saving...' : 'Save Resume'}
                </button>
                
                <button
                  onClick={downloadResumePDF}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaFilePdf />
                  Download as PDF
                </button>

                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaEye />
                  {previewMode ? 'Hide Preview' : 'Show Preview'}
                </button>

                {lastSave && (
                  <div className="text-center text-xs text-gray-500 mt-2">
                    Last auto-save: {lastSave.toLocaleTimeString()}
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