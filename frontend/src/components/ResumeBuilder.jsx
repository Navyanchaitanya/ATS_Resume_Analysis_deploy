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
  FaCertificate
} from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../App';

// PDF generation utility using print
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
          font-family: 'Arial', sans-serif; 
          margin: 0.5in; 
          line-height: 1.6; 
          color: #333;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .resume-container { 
          max-width: 100%;
        }
        .header { 
          text-align: center; 
          margin-bottom: 20px; 
          border-bottom: 2px solid #2563eb; 
          padding-bottom: 15px; 
        }
        .name { 
          font-size: 24px; 
          font-weight: bold; 
          color: #1e40af; 
          margin-bottom: 5px; 
        }
        .contact-info { 
          color: #6b7280; 
          margin-bottom: 10px;
          font-size: 14px;
        }
        .section { 
          margin-bottom: 20px; 
        }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          color: #1e40af; 
          border-bottom: 1px solid #d1d5db; 
          padding-bottom: 5px; 
          margin-bottom: 10px; 
        }
        .experience-item, .education-item { 
          margin-bottom: 15px; 
        }
        .job-title { 
          font-weight: bold; 
          color: #374151; 
        }
        .company { 
          color: #6b7280; 
          font-style: italic; 
        }
        .date { 
          color: #9ca3af; 
          font-size: 12px; 
        }
        .skills { 
          display: flex; 
          flex-wrap: wrap; 
          gap: 6px; 
          margin-top: 5px; 
        }
        .skill-tag { 
          background: #dbeafe; 
          color: #1e40af; 
          padding: 3px 8px; 
          border-radius: 12px; 
          font-size: 12px; 
        }
        @media print {
          body { margin: 0.3in; }
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

// Optimized input components with proper memoization
const InputField = React.memo(({ label, value, onChange, type = 'text', placeholder, className = '' }) => {
  return (
    <div className={className}>
      <label className="block text-gray-700 mb-2 text-sm font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 bg-white shadow-sm"
        placeholder={placeholder}
      />
    </div>
  );
});

const TextAreaField = React.memo(({ label, value, onChange, rows = 4, placeholder, className = '' }) => {
  return (
    <div className={className}>
      <label className="block text-gray-700 mb-2 text-sm font-semibold">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none transition-all duration-200 bg-white shadow-sm"
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
      description: 'Clean and professional ATS-friendly template',
      category: 'ATS Optimized',
      style: 'professional',
      preview: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      name: 'Modern',
      description: 'Contemporary design with visual appeal',
      category: 'Modern',
      style: 'modern',
      preview: 'bg-gradient-to-br from-purple-500 to-pink-500',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 3,
      name: 'Executive',
      description: 'Sophisticated layout for senior roles',
      category: 'Executive',
      style: 'executive',
      preview: 'bg-gradient-to-br from-gray-600 to-blue-600',
      color: 'from-gray-600 to-blue-600'
    },
    {
      id: 4,
      name: 'Creative',
      description: 'For design and creative roles',
      category: 'Creative',
      style: 'creative',
      preview: 'bg-gradient-to-br from-green-500 to-teal-500',
      color: 'from-green-500 to-teal-500'
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastSave, setLastSave] = useState(null);

  // Stable input handlers with useCallback
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

  const downloadResumeHTML = () => {
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

  const generateResumePreview = () => {
    return `
      ${resumeData.personal.fullName || 'Your Name'}
      ${resumeData.personal.email || 'email@example.com'} | ${resumeData.personal.phone || 'Phone'}
      ${resumeData.summary?.substring(0, 100) || 'Professional summary...'}
      Experience: ${resumeData.experience.length} positions
      Education: ${resumeData.education.length} entries
      Skills: ${resumeData.skills.length} skills
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
            ${project.technologies ? `<div class="company">Technologies: ${project.technologies}</div>` : ''}
            ${project.description ? `<p>${project.description}</p>` : ''}
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
    `;
  };

  // Memoized form section component
  const FormSection = useCallback(({ title, icon, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          {icon}
        </div>
        {title}
      </h3>
      {children}
    </motion.div>
  ), []);

  // Memoized template selector
  const TemplateSelector = useCallback(({ selected, onSelect }) => (
    <div className="grid grid-cols-2 gap-3">
      {templates.map(template => (
        <motion.div
          key={template.id}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(template.id)}
          className={`relative rounded-xl border-2 cursor-pointer transition-all duration-300 overflow-hidden group ${
            selected === template.id
              ? 'border-blue-500 shadow-2xl shadow-blue-500/30'
              : 'border-gray-200 hover:border-gray-300 shadow-lg'
          }`}
        >
          <div className={`w-full h-16 ${template.preview} flex items-center justify-center relative`}>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
            <FaFilePdf className="text-white text-xl z-10" />
          </div>
          <div className="p-3 bg-white">
            <h4 className="font-bold text-gray-800 text-sm mb-1">{template.name}</h4>
            <p className="text-gray-600 text-xs">{template.description}</p>
          </div>
          {selected === template.id && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <FaStar className="text-white text-xs" />
            </div>
          )}
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
      className="border border-gray-200 rounded-xl p-6 bg-white/80 backdrop-blur-sm"
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
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
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
      className="border border-gray-200 rounded-xl p-6 bg-white/80 backdrop-blur-sm"
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
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
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
      className="border border-gray-200 rounded-xl p-6 bg-white/80 backdrop-blur-sm"
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
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
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
      className="border border-gray-200 rounded-xl p-6 bg-white/80 backdrop-blur-sm"
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
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
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
      className="border border-gray-200 rounded-xl p-6 bg-white/80 backdrop-blur-sm"
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
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
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
      className="border border-gray-200 rounded-xl p-6 bg-white/80 backdrop-blur-sm"
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
          className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <FaTrash className="text-sm" />
          Remove
        </button>
      </div>
    </motion.div>
  ), [handleArrayUpdate, handleArrayRemove]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
      </div>

      <div className="max-w-8xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center gap-3 mb-4 bg-white/10 backdrop-blur-lg rounded-full px-6 py-3 border border-white/20">
            <FaRocket className="text-yellow-400 text-xl" />
            <span className="text-white text-sm font-semibold">AI-Powered Resume Builder</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Create Your Perfect
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Resume</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Build professional, ATS-friendly resumes that land interviews
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
          {/* Left Panel - Form Input */}
          <div className="xl:col-span-2 space-y-6">
            {/* Navigation Tabs */}
            <motion.div 
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 border border-white/20 shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-wrap gap-1">
                {navigationTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
                className="space-y-6"
              >
                {/* Personal Information */}
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
          <div className="xl:col-span-1 space-y-6">
            {/* Template Selection */}
            <FormSection title="Templates" icon={<FaPalette />}>
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </FormSection>

            {/* Live Preview */}
            <FormSection title="Live Preview" icon={<FaEye />}>
              <div className="bg-white border-2 border-white/20 rounded-2xl p-6 min-h-[600px] max-h-[700px] overflow-y-auto shadow-2xl">
                <div 
                  id="resume-preview"
                  className="prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: generateResumeHTML() }}
                />
              </div>
            </FormSection>

            {/* Quick Actions */}
            <FormSection title="Quick Actions" icon={<FaRocket />}>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const name = prompt('Enter resume name:', `${resumeData.personal.fullName || 'My'} Resume`);
                    if (name) saveResume(name);
                  }}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <FaSave className="text-lg" />
                  {loading ? 'Saving...' : 'Save Resume'}
                </button>
                
                <button
                  onClick={downloadResumePDF}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <FaPrint className="text-lg" />
                  Print as PDF
                </button>

                <button
                  onClick={downloadResumeHTML}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <FaDownload className="text-lg" />
                  Download as HTML
                </button>

                {lastSave && (
                  <div className="text-center text-xs text-gray-300 mt-2 bg-white/10 rounded-lg p-2">
                    📍 Last saved: {lastSave.toLocaleTimeString()}
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