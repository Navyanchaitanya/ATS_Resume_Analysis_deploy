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
  FaEdit,
  FaFilePdf,
  FaPalette,
  FaMagic,
  FaCheck
} from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../App';
import { debounce } from 'lodash';

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
    },
    {
      id: 5,
      name: 'Minimal',
      description: 'Clean and minimal design',
      category: 'Minimal',
      style: 'minimal',
      preview: 'bg-gradient-to-br from-orange-50 to-red-50 border-l-4 border-orange-500'
    },
    {
      id: 6,
      name: 'Technical',
      description: 'Optimized for technical roles',
      category: 'Technical',
      style: 'technical',
      preview: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-l-4 border-indigo-500'
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [savedResumes, setSavedResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [lastSave, setLastSave] = useState(null);

  // Debounced input handlers for better performance
  const debouncedSave = useCallback(
    debounce((data) => {
      if (autoSave) {
        saveResume('Auto-saved Resume', data);
      }
    }, 2000),
    [autoSave]
  );

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

  // Optimized input handlers with debouncing
  const handleInputChange = useCallback((section, field, value) => {
    setResumeData(prev => {
      const newData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  const handleSummaryChange = useCallback((value) => {
    setResumeData(prev => {
      const newData = { ...prev, summary: value };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  const handleArrayAdd = useCallback((section, newItem) => {
    setResumeData(prev => {
      const newData = {
        ...prev,
        [section]: [...prev[section], { id: Date.now(), ...newItem }]
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  const handleArrayUpdate = useCallback((section, id, updates) => {
    setResumeData(prev => {
      const newData = {
        ...prev,
        [section]: prev[section].map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  const handleArrayRemove = useCallback((section, id) => {
    setResumeData(prev => {
      const newData = {
        ...prev,
        [section]: prev[section].filter(item => item.id !== id)
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

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
        alert('Resume saved successfully!');
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

  const downloadResume = () => {
    const resumeContent = generateResumeHTML();
    const blob = new Blob([resumeContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeData.personal.fullName || 'resume'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 50px; line-height: 1.7; color: #2d3748; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .resume-container { background: white; padding: 50px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #667eea; }
          .name { font-size: 32px; font-weight: 800; color: #2d3748; margin-bottom: 5px; }
          .contact-info { color: #718096; font-size: 16px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 20px; font-weight: 700; color: #667eea; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
          .experience-item, .education-item { margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #cbd5e0; }
          .job-title { font-weight: 600; color: #2d3748; font-size: 18px; }
          .company { color: #667eea; font-weight: 500; }
          .date { color: #a0aec0; font-size: 14px; margin-top: 5px; }
          .skills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
          .skill-tag { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 6px 15px; border-radius: 25px; font-size: 14px; font-weight: 500; }
        </style>
      `,
      executive: `
        <style>
          body { font-family: 'Georgia', serif; margin: 60px; line-height: 1.8; color: #2d3748; background: #f8f9fa; }
          .resume-container { background: white; padding: 60px; border: 1px solid #e2e8f0; }
          .header { text-align: center; margin-bottom: 50px; }
          .name { font-size: 36px; font-weight: 300; color: #2d3748; letter-spacing: 2px; margin-bottom: 10px; }
          .contact-info { color: #718096; font-size: 16px; letter-spacing: 0.5px; }
          .section { margin-bottom: 35px; }
          .section-title { font-size: 18px; font-weight: 600; color: #2d3748; border-bottom: 2px solid #cbd5e0; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
          .experience-item, .education-item { margin-bottom: 25px; }
          .job-title { font-weight: 600; color: #2d3748; font-size: 18px; }
          .company { color: #718096; font-style: italic; }
          .date { color: #a0aec0; font-size: 14px; margin-top: 5px; }
          .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
          .skill-tag { background: #e2e8f0; color: #4a5568; padding: 4px 12px; border-radius: 3px; font-size: 14px; }
        </style>
      `,
      creative: `
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; line-height: 1.6; color: #2d3748; background: #f7fafc; }
          .resume-container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin-bottom: 40px; }
          .name { font-size: 42px; font-weight: 900; color: #2d3748; margin-bottom: 10px; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .contact-info { color: #718096; font-size: 16px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 24px; font-weight: 800; color: #2d3748; margin-bottom: 15px; position: relative; }
          .section-title:after { content: ''; position: absolute; bottom: -5px; left: 0; width: 50px; height: 3px; background: linear-gradient(135deg, #667eea, #764ba2); }
          .experience-item, .education-item { margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; }
          .job-title { font-weight: 700; color: #2d3748; font-size: 18px; }
          .company { color: #667eea; font-weight: 600; }
          .date { color: #a0aec0; font-size: 14px; margin-top: 5px; }
          .skills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
          .skill-tag { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        </style>
      `,
      minimal: `
        <style>
          body { font-family: 'Inter', sans-serif; margin: 50px; line-height: 1.6; color: #374151; background: #f9fafb; }
          .resume-container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; }
          .name { font-size: 32px; font-weight: 300; color: #111827; margin-bottom: 8px; letter-spacing: -0.5px; }
          .contact-info { color: #6b7280; font-size: 16px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
          .experience-item, .education-item { margin-bottom: 20px; }
          .job-title { font-weight: 500; color: #111827; }
          .company { color: #6b7280; }
          .date { color: #9ca3af; font-size: 14px; margin-top: 2px; }
          .skills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
          .skill-tag { background: #f3f4f6; color: #374151; padding: 4px 10px; border-radius: 6px; font-size: 13px; }
        </style>
      `,
      technical: `
        <style>
          body { font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; margin: 40px; line-height: 1.5; color: #24292e; background: #0d1117; color: #c9d1d9; }
          .resume-container { background: #161b22; padding: 40px; border: 1px solid #30363d; border-radius: 6px; }
          .header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #30363d; }
          .name { font-size: 24px; font-weight: 600; color: #58a6ff; margin-bottom: 5px; }
          .contact-info { color: #8b949e; font-size: 14px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: 600; color: #58a6ff; margin-bottom: 10px; }
          .experience-item, .education-item { margin-bottom: 15px; padding: 15px; background: #0d1117; border: 1px solid #21262d; border-radius: 6px; }
          .job-title { font-weight: 600; color: #c9d1d9; }
          .company { color: #8b949e; }
          .date { color: #484f58; font-size: 12px; margin-top: 5px; }
          .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
          .skill-tag { background: #21262d; color: #58a6ff; padding: 4px 12px; border-radius: 20px; font-size: 12px; border: 1px solid #30363d; }
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
          ${generateResumeContent(templateStyle)}
        </div>
      </body>
      </html>
    `;

    return baseHTML;
  };

  const generateResumeContent = (templateStyle) => {
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
    `;
  };

  // Memoized components for better performance
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
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(template => (
        <motion.div
          key={template.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(template.id)}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            selected === template.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`w-full h-24 rounded-lg mb-3 ${template.preview} flex items-center justify-center`}>
            <FaFilePdf className="text-2xl opacity-60" />
          </div>
          <h4 className="font-semibold text-gray-800 text-sm">{template.name}</h4>
          <p className="text-gray-600 text-xs mt-1">{template.description}</p>
          <span className="text-blue-600 text-xs font-medium">{template.category}</span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Resume Builder
            </span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create professional, ATS-optimized resumes with multiple templates. Real-time preview and auto-save included.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Templates & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Selection */}
            <FormSection title="Templates" icon={<FaPalette />}>
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </FormSection>

            {/* Auto-save Settings */}
            <FormSection title="Settings" icon={<FaMagic />}>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Enable Auto-save</span>
                </label>
                {lastSave && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <FaCheck />
                    Last saved: {lastSave.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </FormSection>

            {/* Saved Resumes */}
            {savedResumes.length > 0 && (
              <FormSection title="Saved Resumes" icon={<FaSave />}>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {savedResumes.map(resume => (
                    <div key={resume.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <h4 className="font-semibold text-gray-800 text-sm">{resume.name}</h4>
                      <p className="text-gray-600 text-xs truncate">{resume.preview}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </FormSection>
            )}
          </div>

          {/* Main Content - Form Builder */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl p-2 shadow-lg mb-6">
              <div className="flex flex-wrap gap-1">
                {navigationTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
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
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Personal Information */}
                {activeTab === 'personal' && (
                  <FormSection title="Personal Information" icon={<FaUser />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm">Full Name *</label>
                        <input
                          type="text"
                          value={resumeData.personal.fullName}
                          onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm">Email *</label>
                        <input
                          type="email"
                          value={resumeData.personal.email}
                          onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm">Phone</label>
                        <input
                          type="tel"
                          value={resumeData.personal.phone}
                          onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm">Location</label>
                        <input
                          type="text"
                          value={resumeData.personal.location}
                          onChange={(e) => handleInputChange('personal', 'location', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="San Francisco, CA"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm">LinkedIn</label>
                        <input
                          type="url"
                          value={resumeData.personal.linkedin}
                          onChange={(e) => handleInputChange('personal', 'linkedin', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm">GitHub</label>
                        <input
                          type="url"
                          value={resumeData.personal.github}
                          onChange={(e) => handleInputChange('personal', 'github', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="https://github.com/username"
                        />
                      </div>
                    </div>
                  </FormSection>
                )}

                {/* Professional Summary */}
                {activeTab === 'summary' && (
                  <FormSection title="Professional Summary" icon={<FaBriefcase />}>
                    <textarea
                      value={resumeData.summary}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      rows="6"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      placeholder="Experienced professional with 5+ years in the industry. Skilled in leadership, project management, and strategic planning. Proven track record of delivering successful projects and driving business growth."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {resumeData.summary.length}/500 characters
                    </p>
                  </FormSection>
                )}

                {/* Work Experience */}
                {activeTab === 'experience' && (
                  <FormSection title="Work Experience" icon={<FaBriefcase />}>
                    <ArrayInput
                      section="experience"
                      items={resumeData.experience}
                      emptyMessage="No work experience added yet. Add your first position."
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
                        <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                              type="text"
                              placeholder="Position *"
                              value={exp.position}
                              onChange={(e) => handleArrayUpdate('experience', exp.id, { position: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Company *"
                              value={exp.company}
                              onChange={(e) => handleArrayUpdate('experience', exp.id, { company: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Location"
                              value={exp.location}
                              onChange={(e) => handleArrayUpdate('experience', exp.id, { location: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2">
                              <input
                                type="month"
                                placeholder="Start Date"
                                value={exp.startDate}
                                onChange={(e) => handleArrayUpdate('experience', exp.id, { startDate: e.target.value })}
                                className="border border-gray-300 rounded px-3 py-2 flex-1 text-sm"
                              />
                              <input
                                type="month"
                                placeholder="End Date"
                                value={exp.endDate}
                                onChange={(e) => handleArrayUpdate('experience', exp.id, { endDate: e.target.value })}
                                className="border border-gray-300 rounded px-3 py-2 flex-1 text-sm"
                                disabled={exp.current}
                              />
                            </div>
                          </div>
                          <textarea
                            placeholder="Description of your responsibilities and achievements..."
                            value={exp.description}
                            onChange={(e) => handleArrayUpdate('experience', exp.id, { description: e.target.value })}
                            rows="3"
                            className="w-full border border-gray-300 rounded px-3 py-2 mb-2 resize-none text-sm"
                          />
                          <div className="flex justify-between items-center">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={exp.current}
                                onChange={(e) => handleArrayUpdate('experience', exp.id, { 
                                  current: e.target.checked,
                                  endDate: e.target.checked ? '' : exp.endDate
                                })}
                              />
                              I currently work here
                            </label>
                            <button
                              onClick={() => handleArrayRemove('experience', exp.id)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                            >
                              <FaTrash />
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    />
                  </FormSection>
                )}

                {/* Add similar optimized sections for other tabs */}
                {/* Education, Skills, Projects, etc. would follow the same pattern */}
                
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Sidebar - Preview & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Preview */}
            <FormSection title="Live Preview" icon={<FaEye />}>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                {previewMode ? (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: generateResumeHTML() }}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FaEye className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p className="mb-2">Preview will appear here</p>
                    <p className="text-sm text-gray-400 mb-4">Select a template and start building</p>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      Show Preview
                    </button>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Action Buttons */}
            <FormSection title="Actions" icon={<FaDownload />}>
              <div className="space-y-3">
                <button
                  onClick={() => saveResume(prompt('Enter resume name:') || 'My Resume')}
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FaSave />
                  {loading ? 'Saving...' : 'Save Resume'}
                </button>
                
                <button
                  onClick={downloadResume}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FaDownload />
                  Download HTML
                </button>

                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FaEye />
                  {previewMode ? 'Hide Preview' : 'Show Preview'}
                </button>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all data?')) {
                      setResumeData({
                        personal: { fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
                        summary: '',
                        experience: [],
                        education: [],
                        skills: [],
                        projects: [],
                        certifications: [],
                        languages: []
                      });
                    }
                  }}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FaTrash />
                  Clear All
                </button>
              </div>
            </FormSection>

            {/* Template Preview */}
            <FormSection title="Template Preview" icon={<FaPalette />}>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Selected:</span>
                  <span className="font-semibold text-blue-600">
                    {templates.find(t => t.id === selectedTemplate)?.name}
                  </span>
                </div>
                <div className={`p-3 rounded-lg ${templates.find(t => t.id === selectedTemplate)?.preview}`}>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">Template Preview</div>
                    <div className="text-xs text-gray-600 mt-1">Live styling applied</div>
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;