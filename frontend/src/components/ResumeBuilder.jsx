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
  FaPrint,
  FaMagic,
  FaStar,
  FaRocket,
  FaGlobe,
  FaCertificate,
  FaPaintBrush,
  FaCrown,
  FaLaptop,
  FaBusinessTime
} from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../App';

// Enhanced PDF generation utility
const generatePDF = (element, filename) => {
  if (!element) {
    alert('Please enable preview first to generate PDF');
    return;
  }

  const printWindow = window.open('', '_blank');
  const resumeContent = element.innerHTML;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: 'Inter', 'Segoe UI', sans-serif; 
          margin: 0.5in; 
          line-height: 1.6; 
          color: #1a202c;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .resume-container { 
          max-width: 100%;
        }
        .header { 
          text-align: center; 
          margin-bottom: 25px; 
          padding-bottom: 20px; 
          border-bottom: 3px solid #2b6cb0;
        }
        .name { 
          font-size: 28px; 
          font-weight: 700; 
          color: #2d3748; 
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .contact-info { 
          color: #718096; 
          margin-bottom: 12px;
          font-size: 14px;
          line-height: 1.8;
        }
        .section { 
          margin-bottom: 22px; 
        }
        .section-title { 
          font-size: 18px; 
          font-weight: 700; 
          color: #2b6cb0; 
          border-bottom: 2px solid #e2e8f0; 
          padding-bottom: 6px; 
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .experience-item, .education-item { 
          margin-bottom: 16px; 
          padding-left: 15px;
          border-left: 3px solid #bee3f8;
        }
        .job-title { 
          font-weight: 600; 
          color: #2d3748; 
          font-size: 16px;
        }
        .company { 
          color: #4a5568; 
          font-weight: 500;
          font-style: normal;
        }
        .date { 
          color: #718096; 
          font-size: 14px; 
          margin: 4px 0;
        }
        .skills { 
          display: flex; 
          flex-wrap: wrap; 
          gap: 8px; 
          margin-top: 8px; 
        }
        .skill-tag { 
          background: #ebf8ff; 
          color: #2b6cb0; 
          padding: 6px 12px; 
          border-radius: 20px; 
          font-size: 13px;
          font-weight: 500;
          border: 1px solid #bee3f8;
        }
        .description {
          color: #4a5568;
          line-height: 1.6;
          margin-top: 8px;
        }
        @media print {
          body { margin: 0.4in; }
          .page-break { page-break-before: always; }
        }
        @page {
          margin: 0.5in;
          size: letter;
        }
      </style>
    </head>
    <body>
      <div class="resume-container">
        ${resumeContent}
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => {
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
};

// Enhanced input components
const InputField = React.memo(({ label, value, onChange, type = 'text', placeholder, className = '' }) => {
  return (
    <div className={className}>
      <label className="block text-gray-700 mb-3 text-sm font-semibold uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-300 bg-white shadow-sm hover:shadow-md focus:shadow-lg"
        placeholder={placeholder}
      />
    </div>
  );
});

const TextAreaField = React.memo(({ label, value, onChange, rows = 4, placeholder, className = '' }) => {
  return (
    <div className={className}>
      <label className="block text-gray-700 mb-3 text-sm font-semibold uppercase tracking-wide">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none transition-all duration-300 bg-white shadow-sm hover:shadow-md focus:shadow-lg"
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
      name: 'Modern Pro',
      description: 'Clean, modern and professional design',
      category: 'Professional',
      style: 'modern',
      preview: 'bg-gradient-to-br from-blue-600 to-cyan-500',
      icon: <FaBusinessTime className="text-white" />,
      premium: false
    },
    {
      id: 2,
      name: 'Executive',
      description: 'Sophisticated layout for senior roles',
      category: 'Executive',
      style: 'executive',
      preview: 'bg-gradient-to-br from-gray-700 to-blue-600',
      icon: <FaCrown className="text-white" />,
      premium: true
    },
    {
      id: 3,
      name: 'Creative',
      description: 'Modern design for creative professionals',
      category: 'Creative',
      style: 'creative',
      preview: 'bg-gradient-to-br from-purple-600 to-pink-500',
      icon: <FaPaintBrush className="text-white" />,
      premium: false
    },
    {
      id: 4,
      name: 'Tech Pro',
      description: 'Designed for tech professionals',
      category: 'Technical',
      style: 'tech',
      preview: 'bg-gradient-to-br from-green-600 to-teal-500',
      icon: <FaLaptop className="text-white" />,
      premium: true
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastSave, setLastSave] = useState(null);

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
      const response = await axios.post(`${API_BASE_URL}/api/resumes`, {
        name: resumeName,
        template: selectedTemplate,
        data: resumeData,
        preview: generateResumePreview()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLastSave(new Date());
      console.log('Resume saved successfully!');
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Error saving resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResumePDF = () => {
    const element = document.getElementById('resume-preview');
    generatePDF(element, `${resumeData.personal.fullName || 'resume'}`);
  };

  // Enhanced resume content generation
  const generateResumeContent = () => {
    const { personal, summary, experience, education, skills, projects, certifications, languages } = resumeData;
    const template = templates.find(t => t.id === selectedTemplate);
    
    const getTemplateStyle = () => {
      switch(template.style) {
        case 'modern':
          return `
            .resume-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2b6cb0; }
            .name { font-size: 32px; font-weight: 700; color: #2d3748; margin-bottom: 8px; }
            .contact-info { color: #718096; font-size: 15px; line-height: 1.8; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: 700; color: #2b6cb0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 15px; text-transform: uppercase; }
            .experience-item, .education-item { margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #bee3f8; }
            .job-title { font-weight: 600; color: #2d3748; font-size: 16px; }
            .company { color: #4a5568; font-weight: 500; }
            .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .skill-tag { background: #ebf8ff; color: #2b6cb0; padding: 6px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #bee3f8; }
          `;
        case 'executive':
          return `
            .resume-container { max-width: 800px; margin: 0 auto; font-family: 'Georgia', serif; }
            .header { text-align: center; margin-bottom: 40px; padding-bottom: 25px; border-bottom: 2px solid #2d3748; }
            .name { font-size: 36px; font-weight: 300; color: #2d3748; margin-bottom: 10px; letter-spacing: 1px; }
            .contact-info { color: #718096; font-size: 16px; letter-spacing: 0.5px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 20px; font-weight: 600; color: #2d3748; border-bottom: 1px solid #cbd5e0; padding-bottom: 8px; margin-bottom: 18px; }
            .experience-item, .education-item { margin-bottom: 25px; }
            .job-title { font-weight: 600; color: #2d3748; font-style: italic; }
            .company { color: #718096; font-weight: 500; }
            .skills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
            .skill-tag { background: #f7fafc; color: #4a5568; padding: 4px 10px; border-radius: 3px; font-size: 12px; border: 1px solid #e2e8f0; }
          `;
        case 'creative':
          return `
            .resume-container { max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; }
            .header { text-align: center; margin-bottom: 30px; color: white; }
            .name { font-size: 34px; font-weight: 800; color: white; margin-bottom: 10px; }
            .contact-info { color: rgba(255,255,255,0.8); font-size: 15px; }
            .section { margin-bottom: 25px; background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .section-title { font-size: 20px; font-weight: 700; color: #667eea; margin-bottom: 15px; }
            .experience-item, .education-item { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }
            .job-title { font-weight: 600; color: #2d3748; font-size: 16px; }
            .company { color: #667eea; font-weight: 500; }
            .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .skill-tag { background: #667eea; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; }
          `;
        case 'tech':
          return `
            .resume-container { max-width: 800px; margin: 0 auto; background: #1a202c; color: white; padding: 40px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #38b2ac; padding-bottom: 20px; }
            .name { font-size: 32px; font-weight: 700; color: white; margin-bottom: 8px; }
            .contact-info { color: #a0aec0; font-size: 15px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: 700; color: #38b2ac; border-bottom: 1px solid #2d3748; padding-bottom: 6px; margin-bottom: 15px; text-transform: uppercase; }
            .experience-item, .education-item { margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #38b2ac; }
            .job-title { font-weight: 600; color: white; font-size: 16px; }
            .company { color: #38b2ac; font-weight: 500; }
            .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .skill-tag { background: #2d3748; color: #38b2ac; padding: 6px 12px; border-radius: 5px; font-size: 13px; border: 1px solid #38b2ac; font-family: 'Courier New', monospace; }
          `;
        default:
          return `
            .resume-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .name { font-size: 32px; font-weight: 700; color: #2d3748; }
            .contact-info { color: #718096; font-size: 15px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: 700; color: #2b6cb0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 15px; }
          `;
      }
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resume - ${personal.fullName}</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            color: #1a202c;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          ${getTemplateStyle()}
          .description {
            color: #4a5568;
            line-height: 1.6;
            margin-top: 8px;
          }
          @media print {
            body { margin: 0.4in; }
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        </style>
      </head>
      <body>
        <div class="resume-container">
          <div class="header">
            <div class="name">${personal.fullName || 'Your Name'}</div>
            <div class="contact-info">
              ${personal.email ? `${personal.email} • ` : ''}
              ${personal.phone ? `${personal.phone} • ` : ''}
              ${personal.location || ''}
              ${personal.linkedin ? `<br>LinkedIn: ${personal.linkedin}` : ''}
              ${personal.github ? ` • GitHub: ${personal.github}` : ''}
              ${personal.portfolio ? ` • Portfolio: ${personal.portfolio}` : ''}
            </div>
          </div>

          ${summary ? `
          <div class="section">
            <div class="section-title">Professional Summary</div>
            <p class="description">${summary}</p>
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
                ${exp.description ? `<p class="description">${exp.description}</p>` : ''}
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
                ${edu.description ? `<p class="description">${edu.description}</p>` : ''}
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
                ${project.technologies ? `<div class="company">Technologies: ${project.technologies}</div>` : ''}
                ${project.description ? `<p class="description">${project.description}</p>` : ''}
                ${project.url ? `<div class="company">URL: ${project.url}</div>` : ''}
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
        </div>
      </body>
      </html>
    `;
  };

  const generateResumePreview = () => {
    return `
      ${resumeData.personal.fullName || 'Your Name'}
      ${resumeData.personal.email || 'email@example.com'} | ${resumeData.personal.phone || 'Phone'}
      ${resumeData.summary?.substring(0, 100) || 'Professional summary...'}
    `;
  };

  // Enhanced Form Section Component
  const FormSection = useCallback(({ title, icon, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100"
    >
      <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
          {icon}
        </div>
        {title}
      </h3>
      {children}
    </motion.div>
  ), []);

  // Enhanced Template Selector
  const TemplateSelector = useCallback(({ selected, onSelect }) => (
    <div className="grid grid-cols-2 gap-4">
      {templates.map(template => (
        <motion.div
          key={template.id}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(template.id)}
          className={`relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
            selected === template.id
              ? 'ring-4 ring-blue-500 shadow-2xl'
              : 'shadow-xl hover:shadow-2xl'
          }`}
        >
          <div className={`w-full h-24 ${template.preview} flex items-center justify-center relative`}>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
            <div className="text-white text-2xl z-10">
              {template.icon}
            </div>
            {template.premium && (
              <div className="absolute top-3 right-3 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                PRO
              </div>
            )}
          </div>
          <div className="p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-800 text-sm">{template.name}</h4>
              {selected === template.id && (
                <FaStar className="text-yellow-400 text-sm" />
              )}
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">{template.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  ), [templates]);

  // Navigation tabs
  const navigationTabs = useMemo(() => [
    { id: 'personal', label: 'Personal', icon: <FaUser /> },
    { id: 'summary', label: 'Summary', icon: <FaBriefcase /> },
    { id: 'experience', label: 'Experience', icon: <FaBriefcase /> },
    { id: 'education', label: 'Education', icon: <FaGraduationCap /> },
    { id: 'skills', label: 'Skills', icon: <FaTools /> },
    { id: 'projects', label: 'Projects', icon: <FaAward /> },
    { id: 'certifications', label: 'Certifications', icon: <FaCertificate /> },
    { id: 'languages', label: 'Languages', icon: <FaLanguage /> }
  ], []);

  // Render functions for all sections
  const renderExperienceItem = useCallback((exp, index) => (
    <motion.div
      key={exp.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        <div className="grid grid-cols-2 gap-3">
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
      
      <div className="flex justify-between items-center mt-4">
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={exp.current}
            onChange={(e) => handleArrayUpdate('experience', exp.id, 'current', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700 font-medium">I currently work here</span>
        </label>
        <button
          onClick={() => handleArrayRemove('experience', exp.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors bg-red-50 px-4 py-2 rounded-xl"
        >
          <FaTrash className="text-sm" />
          Remove
        </button>
      </div>
    </motion.div>
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderEducationItem = useCallback((edu, index) => (
    <motion.div
      key={edu.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        <div className="grid grid-cols-2 gap-3">
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
      
      <div className="flex justify-between items-center mt-4">
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={edu.current}
            onChange={(e) => handleArrayUpdate('education', edu.id, 'current', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700 font-medium">Currently studying here</span>
        </label>
        <button
          onClick={() => handleArrayRemove('education', edu.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors bg-red-50 px-4 py-2 rounded-xl"
        >
          <FaTrash className="text-sm" />
          Remove
        </button>
      </div>
    </motion.div>
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderSkillItem = useCallback((skill, index) => (
    <motion.div
      key={skill.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <div className="flex justify-end mt-4">
        <button
          onClick={() => handleArrayRemove('skills', skill.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors bg-red-50 px-4 py-2 rounded-xl"
        >
          <FaTrash className="text-sm" />
          Remove
        </button>
      </div>
    </motion.div>
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderProjectItem = useCallback((project, index) => (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <InputField
          label="Project Name"
          value={project.name}
          onChange={(e) => handleArrayUpdate('projects', project.id, 'name', e.target.value)}
          placeholder="e.g., E-commerce Website"
        />
        <InputField
          label="Technologies Used"
          value={project.technologies}
          onChange={(e) => handleArrayUpdate('projects', project.id, 'technologies', e.target.value)}
          placeholder="e.g., React, Node.js, MongoDB"
        />
        <InputField
          label="Project URL"
          value={project.url}
          onChange={(e) => handleArrayUpdate('projects', project.id, 'url', e.target.value)}
          placeholder="e.g., https://github.com/username/project"
          className="md:col-span-2"
        />
      </div>
      
      <TextAreaField
        label="Project Description"
        value={project.description}
        onChange={(e) => handleArrayUpdate('projects', project.id, 'description', e.target.value)}
        rows={3}
        placeholder="Describe the project, your role, and key achievements..."
      />
      
      <div className="flex justify-end mt-4">
        <button
          onClick={() => handleArrayRemove('projects', project.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors bg-red-50 px-4 py-2 rounded-xl"
        >
          <FaTrash className="text-sm" />
          Remove
        </button>
      </div>
    </motion.div>
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderCertificationItem = useCallback((cert, index) => (
    <motion.div
      key={cert.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Certification Name"
          value={cert.name}
          onChange={(e) => handleArrayUpdate('certifications', cert.id, 'name', e.target.value)}
          placeholder="e.g., AWS Certified Solutions Architect"
        />
        <InputField
          label="Issuing Organization"
          value={cert.issuer}
          onChange={(e) => handleArrayUpdate('certifications', cert.id, 'issuer', e.target.value)}
          placeholder="e.g., Amazon Web Services"
        />
        <InputField
          label="Issue Date"
          type="month"
          value={cert.date}
          onChange={(e) => handleArrayUpdate('certifications', cert.id, 'date', e.target.value)}
        />
        <InputField
          label="Expiry Date"
          type="month"
          value={cert.expiry}
          onChange={(e) => handleArrayUpdate('certifications', cert.id, 'expiry', e.target.value)}
          placeholder="Leave empty if no expiry"
        />
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={() => handleArrayRemove('certifications', cert.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors bg-red-50 px-4 py-2 rounded-xl"
        >
          <FaTrash className="text-sm" />
          Remove
        </button>
      </div>
    </motion.div>
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderLanguageItem = useCallback((lang, index) => (
    <motion.div
      key={lang.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Language"
          value={lang.name}
          onChange={(e) => handleArrayUpdate('languages', lang.id, 'name', e.target.value)}
          placeholder="e.g., Spanish, French, Mandarin"
        />
        <InputField
          label="Proficiency Level"
          value={lang.proficiency}
          onChange={(e) => handleArrayUpdate('languages', lang.id, 'proficiency', e.target.value)}
          placeholder="e.g., Native, Fluent, Intermediate, Basic"
        />
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={() => handleArrayRemove('languages', lang.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors bg-red-50 px-4 py-2 rounded-xl"
        >
          <FaTrash className="text-sm" />
          Remove
        </button>
      </div>
    </motion.div>
  ), [handleArrayUpdate, handleArrayRemove]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200"
      >
        <div className="max-w-8xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg">
              <FaRocket className="text-xl" />
              <span className="text-sm font-semibold">PROFESSIONAL RESUME BUILDER</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Create Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Perfect Resume</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Build professional, ATS-friendly resumes that stand out. 
              <span className="text-blue-600 font-semibold"> Download instantly as PDF.</span>
            </p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-8xl mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Panel - Form Input */}
          <div className="xl:col-span-2 space-y-8">
            {/* Enhanced Navigation Tabs */}
            <motion.div 
              className="bg-white rounded-2xl p-4 shadow-2xl border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-wrap gap-2">
                {navigationTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 text-sm font-semibold ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Form Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Personal Information Section */}
                {activeTab === 'personal' && (
                  <FormSection title="Personal Information" icon={<FaUser />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <InputField
                        label="Portfolio URL"
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
                  <FormSection title="Professional Summary" icon={<FaBriefcase />}>
                    <TextAreaField
                      label="Summary"
                      value={resumeData.summary}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      rows={6}
                      placeholder="Describe your professional background, key skills, and career objectives..."
                    />
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-xs text-gray-500">
                        {resumeData.summary.length}/500 characters
                      </p>
                      <p className="text-xs text-blue-500 font-semibold">
                        Write a compelling summary that highlights your expertise
                      </p>
                    </div>
                  </FormSection>
                )}

                {/* Work Experience */}
                {activeTab === 'experience' && (
                  <FormSection title="Work Experience" icon={<FaBriefcase />}>
                    <div className="space-y-4">
                      {resumeData.experience.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-3">💼</div>
                          <p className="text-gray-500 text-sm">No work experience added yet. Start by adding your first job experience.</p>
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
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-300 flex items-center justify-center gap-3 bg-white/50 hover:bg-blue-50"
                      >
                        <FaPlus className="text-lg" />
                        <span className="font-semibold">Add New Experience</span>
                      </button>
                    </div>
                  </FormSection>
                )}

                {/* Education */}
                {activeTab === 'education' && (
                  <FormSection title="Education" icon={<FaGraduationCap />}>
                    <div className="space-y-4">
                      {resumeData.education.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-3">🎓</div>
                          <p className="text-gray-500 text-sm">No education history added yet. Add your educational background.</p>
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
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-300 flex items-center justify-center gap-3 bg-white/50 hover:bg-blue-50"
                      >
                        <FaPlus className="text-lg" />
                        <span className="font-semibold">Add New Education</span>
                      </button>
                    </div>
                  </FormSection>
                )}

                {/* Skills */}
                {activeTab === 'skills' && (
                  <FormSection title="Skills" icon={<FaTools />}>
                    <div className="space-y-4">
                      {resumeData.skills.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-3">🛠️</div>
                          <p className="text-gray-500 text-sm">No skills added yet. Add your technical and professional skills.</p>
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
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-300 flex items-center justify-center gap-3 bg-white/50 hover:bg-blue-50"
                      >
                        <FaPlus className="text-lg" />
                        <span className="font-semibold">Add New Skill</span>
                      </button>
                    </div>
                  </FormSection>
                )}

                {/* Projects */}
                {activeTab === 'projects' && (
                  <FormSection title="Projects" icon={<FaAward />}>
                    <div className="space-y-4">
                      {resumeData.projects.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-3">🚀</div>
                          <p className="text-gray-500 text-sm">No projects added yet. Showcase your personal or professional projects.</p>
                        </div>
                      ) : (
                        resumeData.projects.map((project, index) => renderProjectItem(project, index))
                      )}
                      <button
                        type="button"
                        onClick={() => handleArrayAdd('projects', {
                          name: '',
                          technologies: '',
                          description: '',
                          url: ''
                        })}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-300 flex items-center justify-center gap-3 bg-white/50 hover:bg-blue-50"
                      >
                        <FaPlus className="text-lg" />
                        <span className="font-semibold">Add New Project</span>
                      </button>
                    </div>
                  </FormSection>
                )}

                {/* Certifications */}
                {activeTab === 'certifications' && (
                  <FormSection title="Certifications" icon={<FaCertificate />}>
                    <div className="space-y-4">
                      {resumeData.certifications.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-3">🏆</div>
                          <p className="text-gray-500 text-sm">No certifications added yet. Add your professional certifications.</p>
                        </div>
                      ) : (
                        resumeData.certifications.map((cert, index) => renderCertificationItem(cert, index))
                      )}
                      <button
                        type="button"
                        onClick={() => handleArrayAdd('certifications', {
                          name: '',
                          issuer: '',
                          date: '',
                          expiry: ''
                        })}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-300 flex items-center justify-center gap-3 bg-white/50 hover:bg-blue-50"
                      >
                        <FaPlus className="text-lg" />
                        <span className="font-semibold">Add New Certification</span>
                      </button>
                    </div>
                  </FormSection>
                )}

                {/* Languages */}
                {activeTab === 'languages' && (
                  <FormSection title="Languages" icon={<FaLanguage />}>
                    <div className="space-y-4">
                      {resumeData.languages.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-3">🌐</div>
                          <p className="text-gray-500 text-sm">No languages added yet. Add languages you speak.</p>
                        </div>
                      ) : (
                        resumeData.languages.map((lang, index) => renderLanguageItem(lang, index))
                      )}
                      <button
                        type="button"
                        onClick={() => handleArrayAdd('languages', {
                          name: '',
                          proficiency: ''
                        })}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-300 flex items-center justify-center gap-3 bg-white/50 hover:bg-blue-50"
                      >
                        <FaPlus className="text-lg" />
                        <span className="font-semibold">Add New Language</span>
                      </button>
                    </div>
                  </FormSection>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Panel - Preview & Templates */}
          <div className="xl:col-span-1 space-y-8">
            {/* Template Selection */}
            <FormSection title="Choose Template" icon={<FaPalette />}>
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </FormSection>

            {/* Enhanced Live Preview */}
            <FormSection title="Live Preview" icon={<FaEye />}>
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-1 shadow-2xl">
                <div className="bg-white rounded-xl min-h-[600px] max-h-[700px] overflow-y-auto shadow-inner">
                  <div 
                    id="resume-preview"
                    className="p-6"
                    dangerouslySetInnerHTML={{ __html: generateResumeContent() }}
                  />
                </div>
              </div>
            </FormSection>

            {/* Enhanced Quick Actions */}
            <FormSection title="Quick Actions" icon={<FaRocket />}>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    const name = prompt('Enter resume name:', `${resumeData.personal.fullName || 'My'} Resume`);
                    if (name) saveResume(name);
                  }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl text-sm font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
                >
                  <FaSave className="text-lg" />
                  {loading ? 'Saving...' : 'Save Resume'}
                </button>
                
                <button
                  onClick={downloadResumePDF}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl text-sm font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
                >
                  <FaPrint className="text-lg" />
                  Download as PDF
                </button>

                {lastSave && (
                  <div className="text-center text-sm text-green-600 bg-green-50 rounded-xl p-3 border border-green-200">
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