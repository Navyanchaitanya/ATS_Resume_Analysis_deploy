// frontend/src/components/ResumeBuilder.jsx
import React, { useState, useRef, useEffect } from 'react';

// Input components with proper focus handling
const InputField = ({ label, value, onChange, type = 'text', placeholder, className = '' }) => {
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
};

const TextAreaField = ({ label, value, onChange, rows = 4, placeholder, className = '' }) => {
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
};

const ResumeBuilder = () => {
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

  // ATS-optimized templates
  const [templates] = useState([
    {
      id: 1,
      name: 'ATS Professional',
      description: 'Optimized for Applicant Tracking Systems',
      style: 'ats-professional',
      preview: 'bg-gradient-to-br from-blue-600 to-blue-800',
      icon: '📄'
    },
    {
      id: 2,
      name: 'Modern Classic',
      description: 'Clean, modern design',
      style: 'modern-classic',
      preview: 'bg-gradient-to-br from-gray-700 to-gray-900',
      icon: '💼'
    },
    {
      id: 3,
      name: 'Executive',
      description: 'Professional executive style',
      style: 'executive',
      preview: 'bg-gradient-to-br from-green-600 to-green-800',
      icon: '👔'
    },
    {
      id: 4,
      name: 'Minimalist',
      description: 'Simple and clean layout',
      style: 'minimalist',
      preview: 'bg-gradient-to-br from-purple-600 to-purple-800',
      icon: '🎯'
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastSave, setLastSave] = useState(null);

  // Use refs to track form sections and prevent re-renders from losing focus
  const formRef = useRef(null);

  // Input handlers - using functional updates to prevent unnecessary re-renders
  const handleInputChange = (section, field, value) => {
    setResumeData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSummaryChange = (value) => {
    setResumeData(prev => ({ ...prev, summary: value }));
  };

  const handleArrayAdd = (section, newItem) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], { id: Date.now(), ...newItem }]
    }));
  };

  const handleArrayUpdate = (section, id, field, value) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleArrayRemove = (section, id) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  const saveResume = async (resumeName = 'My Resume') => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSave(new Date());
      console.log('Resume saved successfully!');
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Error saving resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced PDF generation with ATS optimization
  const downloadResumePDF = () => {
    const element = document.getElementById('resume-preview');
    if (!element) {
      alert('Preview not available. Please check the preview section.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const template = templates.find(t => t.id === selectedTemplate);
    
    // Get template-specific styles
    const getTemplateStyles = () => {
      switch(template.style) {
        case 'ats-professional':
          return `
            body { 
              font-family: 'Arial', 'Helvetica', sans-serif; 
              margin: 0.5in; 
              line-height: 1.4; 
              color: #000000;
              font-size: 11pt;
            }
            .resume-container { max-width: 100%; }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              padding-bottom: 15px; 
              border-bottom: 2px solid #2c5282;
            }
            .name { 
              font-size: 18pt; 
              font-weight: bold; 
              color: #000000; 
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .contact-info { 
              color: #4a5568; 
              font-size: 10pt;
              margin-bottom: 10px;
            }
            .section { 
              margin-bottom: 15px; 
            }
            .section-title { 
              font-size: 12pt; 
              font-weight: bold; 
              color: #2c5282; 
              border-bottom: 1px solid #cbd5e0; 
              padding-bottom: 3px; 
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .experience-item, .education-item { 
              margin-bottom: 10px; 
            }
            .job-title { 
              font-weight: bold; 
              color: #000000; 
              font-size: 11pt;
            }
            .company { 
              color: #4a5568; 
              font-weight: normal;
              font-style: italic;
            }
            .date { 
              color: #718096; 
              font-size: 10pt; 
              margin: 2px 0;
            }
            .skills { 
              display: block; 
              margin-top: 5px; 
            }
            .skill-tag { 
              display: inline-block;
              margin: 2px 4px 2px 0;
              padding: 1px 6px;
              background: #f7fafc;
              border: 1px solid #e2e8f0;
              border-radius: 3px;
              font-size: 9pt;
            }
            .description {
              color: #4a5568;
              line-height: 1.3;
              margin-top: 4px;
              font-size: 10pt;
            }
          `;
        case 'modern-classic':
          return `
            body { 
              font-family: 'Georgia', 'Times New Roman', serif; 
              margin: 0.5in; 
              line-height: 1.5; 
              color: #000000;
              font-size: 11pt;
            }
            .resume-container { max-width: 100%; }
            .header { 
              text-align: left; 
              margin-bottom: 25px; 
            }
            .name { 
              font-size: 16pt; 
              font-weight: bold; 
              color: #000000; 
              margin-bottom: 5px;
            }
            .contact-info { 
              color: #666666; 
              font-size: 10pt;
            }
            .section { 
              margin-bottom: 18px; 
            }
            .section-title { 
              font-size: 12pt; 
              font-weight: bold; 
              color: #000000; 
              border-bottom: 1px solid #000000; 
              padding-bottom: 2px; 
              margin-bottom: 8px;
            }
            .experience-item, .education-item { 
              margin-bottom: 12px; 
            }
            .job-title { 
              font-weight: bold; 
              color: #000000; 
              font-size: 11pt;
            }
            .company { 
              color: #444444; 
              font-weight: normal;
            }
            .date { 
              color: #666666; 
              font-size: 10pt; 
              margin: 2px 0;
            }
            .skills { 
              display: block; 
              margin-top: 5px; 
            }
            .skill-tag { 
              display: inline-block;
              margin: 2px 4px 2px 0;
              padding: 2px 8px;
              background: #f8f8f8;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 9pt;
            }
          `;
        default:
          return `
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0.5in; 
              line-height: 1.4; 
              color: #000000;
              font-size: 11pt;
            }
            .resume-container { max-width: 100%; }
            .header { text-align: center; margin-bottom: 20px; }
            .name { font-size: 18pt; font-weight: bold; margin-bottom: 5px; }
            .contact-info { color: #4a5568; font-size: 10pt; }
            .section { margin-bottom: 15px; }
            .section-title { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #cbd5e0; padding-bottom: 3px; margin-bottom: 8px; }
            .experience-item, .education-item { margin-bottom: 10px; }
            .job-title { font-weight: bold; font-size: 11pt; }
            .company { color: #4a5568; }
            .date { color: #718096; font-size: 10pt; margin: 2px 0; }
            .skills { display: block; margin-top: 5px; }
            .skill-tag { display: inline-block; margin: 2px 4px 2px 0; padding: 1px 6px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 3px; font-size: 9pt; }
          `;
      }
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${resumeData.personal.fullName || 'Resume'} - Professional Resume</title>
        <meta charset="UTF-8">
        <style>
          ${getTemplateStyles()}
          @media print {
            body { margin: 0.4in; }
            .no-print { display: none; }
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
          ${element.innerHTML}
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => {
              window.close();
            }, 100);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ATS-optimized resume content generation
  const generateResumeContent = () => {
    const { personal, summary, experience, education, skills, projects, certifications, languages } = resumeData;
    
    return `
      <div class="resume-container">
        <!-- Header Section -->
        <div class="header">
          <div class="name">${personal.fullName || 'Your Name'}</div>
          <div class="contact-info">
            ${personal.email ? `${personal.email} • ` : ''}
            ${personal.phone ? `${personal.phone} • ` : ''}
            ${personal.location || ''}
            ${personal.linkedin ? ` • LinkedIn: ${personal.linkedin}` : ''}
            ${personal.github ? ` • GitHub: ${personal.github}` : ''}
          </div>
        </div>

        <!-- Professional Summary -->
        ${summary ? `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <p class="description">${summary}</p>
        </div>
        ` : ''}

        <!-- Work Experience -->
        ${experience.length > 0 ? `
        <div class="section">
          <div class="section-title">Professional Experience</div>
          ${experience.map(exp => `
            <div class="experience-item">
              <div class="job-title">${exp.position || 'Position'}</div>
              <div class="company">${exp.company || 'Company'} ${exp.location ? ` | ${exp.location}` : ''}</div>
              <div class="date">${exp.startDate || 'Start'} - ${exp.current ? 'Present' : (exp.endDate || 'End')}</div>
              ${exp.description ? `<div class="description">${exp.description.replace(/\n/g, '<br>')}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Education -->
        ${education.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${education.map(edu => `
            <div class="education-item">
              <div class="job-title">${edu.degree || 'Degree'}</div>
              <div class="company">${edu.institution || 'Institution'} ${edu.location ? ` | ${edu.location}` : ''}</div>
              <div class="date">${edu.startDate || 'Start'} - ${edu.current ? 'Present' : (edu.endDate || 'End')}</div>
              ${edu.description ? `<div class="description">${edu.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Skills -->
        ${skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Technical Skills</div>
          <div class="skills">
            ${skills.map(skill => `
              <span class="skill-tag">${skill.name}${skill.level ? ` (${skill.level})` : ''}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Projects -->
        ${projects.length > 0 ? `
        <div class="section">
          <div class="section-title">Projects</div>
          ${projects.map(project => `
            <div class="experience-item">
              <div class="job-title">${project.name || 'Project Name'}</div>
              ${project.technologies ? `<div class="company">Technologies: ${project.technologies}</div>` : ''}
              ${project.description ? `<div class="description">${project.description}</div>` : ''}
              ${project.url ? `<div class="company">URL: ${project.url}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Certifications -->
        ${certifications.length > 0 ? `
        <div class="section">
          <div class="section-title">Certifications</div>
          ${certifications.map(cert => `
            <div class="experience-item">
              <div class="job-title">${cert.name || 'Certification Name'}</div>
              <div class="company">${cert.issuer || 'Issuing Organization'}</div>
              <div class="date">${cert.date || 'Date Earned'} ${cert.expiry ? `- Expires: ${cert.expiry}` : ''}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Languages -->
        ${languages.length > 0 ? `
        <div class="section">
          <div class="section-title">Languages</div>
          <div class="skills">
            ${languages.map(lang => `
              <span class="skill-tag">${lang.name}${lang.proficiency ? ` (${lang.proficiency})` : ''}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  };

  // Form Section Component
  const FormSection = ({ title, icon, children }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
          {icon}
        </div>
        {title}
      </h3>
      {children}
    </div>
  );

  // Template Selector
  const TemplateSelector = ({ selected, onSelect }) => (
    <div className="grid grid-cols-2 gap-3">
      {templates.map(template => (
        <div
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`relative rounded-lg cursor-pointer transition-all duration-200 overflow-hidden ${
            selected === template.id
              ? 'ring-2 ring-blue-500 shadow-md'
              : 'shadow-sm hover:shadow-md'
          }`}
        >
          <div className={`w-full h-16 ${template.preview} flex items-center justify-center`}>
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
  );

  // Navigation tabs
  const navigationTabs = [
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'summary', label: 'Summary', icon: '📝' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certifications', label: 'Certifications', icon: '🏆' },
    { id: 'languages', label: 'Languages', icon: '🌐' }
  ];

  // Render functions for form sections
  const renderExperienceItem = (exp) => (
    <div key={exp.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <InputField
          label="Job Title *"
          value={exp.position}
          onChange={(e) => handleArrayUpdate('experience', exp.id, 'position', e.target.value)}
          placeholder="e.g., Senior Software Engineer"
        />
        <InputField
          label="Company Name *"
          value={exp.company}
          onChange={(e) => handleArrayUpdate('experience', exp.id, 'company', e.target.value)}
          placeholder="e.g., Google Inc."
        />
        <InputField
          label="Location"
          value={exp.location}
          onChange={(e) => handleArrayUpdate('experience', exp.id, 'location', e.target.value)}
          placeholder="e.g., San Francisco, CA (Remote)"
        />
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label="Start Date *"
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
        label="Responsibilities & Achievements"
        value={exp.description}
        onChange={(e) => handleArrayUpdate('experience', exp.id, 'description', e.target.value)}
        rows={3}
        placeholder="• Developed and maintained web applications using React and Node.js...
• Improved application performance by 40% through optimization...
• Led a team of 3 developers on project delivery..."
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
          🗑️ Remove
        </button>
      </div>
    </div>
  );

  const renderEducationItem = (edu) => (
    <div key={edu.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <InputField
          label="Degree *"
          value={edu.degree}
          onChange={(e) => handleArrayUpdate('education', edu.id, 'degree', e.target.value)}
          placeholder="e.g., Bachelor of Science in Computer Science"
        />
        <InputField
          label="Institution *"
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
        label="Achievements & Relevant Coursework"
        value={edu.description}
        onChange={(e) => handleArrayUpdate('education', edu.id, 'description', e.target.value)}
        rows={2}
        placeholder="GPA: 3.8/4.0, Dean's List, Relevant coursework: Data Structures, Algorithms..."
      />
      
      <div className="flex justify-between items-center mt-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={edu.current}
            onChange={(e) => handleArrayUpdate('education', edu.id, 'current', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700">Currently enrolled</span>
        </label>
        <button
          onClick={() => handleArrayRemove('education', edu.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm transition-colors"
        >
          🗑️ Remove
        </button>
      </div>
    </div>
  );

  const renderSkillItem = (skill) => (
    <div key={skill.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InputField
          label="Skill Name *"
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
          🗑️ Remove
        </button>
      </div>
    </div>
  );

  const renderProjectItem = (project) => (
    <div key={project.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <InputField
          label="Project Name *"
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
        label="Project Description & Achievements"
        value={project.description}
        onChange={(e) => handleArrayUpdate('projects', project.id, 'description', e.target.value)}
        rows={3}
        placeholder="• Developed a full-stack e-commerce platform serving 1000+ users...
• Implemented payment integration and user authentication...
• Reduced page load time by 50% through optimization..."
      />
      
      <div className="flex justify-end mt-3">
        <button
          onClick={() => handleArrayRemove('projects', project.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm transition-colors"
        >
          🗑️ Remove
        </button>
      </div>
    </div>
  );

  const renderCertificationItem = (cert) => (
    <div key={cert.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputField
          label="Certification Name *"
          value={cert.name}
          onChange={(e) => handleArrayUpdate('certifications', cert.id, 'name', e.target.value)}
          placeholder="e.g., AWS Certified Solutions Architect"
        />
        <InputField
          label="Issuing Organization *"
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
      <div className="flex justify-end mt-3">
        <button
          onClick={() => handleArrayRemove('certifications', cert.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm transition-colors"
        >
          🗑️ Remove
        </button>
      </div>
    </div>
  );

  const renderLanguageItem = (lang) => (
    <div key={lang.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputField
          label="Language *"
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
      <div className="flex justify-end mt-3">
        <button
          onClick={() => handleArrayRemove('languages', lang.id)}
          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm transition-colors"
        >
          🗑️ Remove
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl mb-6">
        <div className="px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ATS-Optimized
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Resume Builder</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create professional resumes that pass through Applicant Tracking Systems
              <span className="text-blue-600 font-medium"> with clean PDF export.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Form Input */}
          <div className="space-y-6" ref={formRef}>
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
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              {/* Personal Information Section */}
              {activeTab === 'personal' && (
                <FormSection title="Personal Information" icon="👤">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        label="Full Name *"
                        value={resumeData.personal.fullName}
                        onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
                        placeholder="John Doe"
                      />
                      <InputField
                        label="Email Address *"
                        type="email"
                        value={resumeData.personal.email}
                        onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                        placeholder="john@example.com"
                      />
                      <InputField
                        label="Phone Number *"
                        type="tel"
                        value={resumeData.personal.phone}
                        onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                      <InputField
                        label="Location *"
                        value={resumeData.personal.location}
                        onChange={(e) => handleInputChange('personal', 'location', e.target.value)}
                        placeholder="San Francisco, CA"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </FormSection>
              )}

              {/* Professional Summary */}
              {activeTab === 'summary' && (
                <FormSection title="Professional Summary" icon="📝">
                  <TextAreaField
                    label="Summary"
                    value={resumeData.summary}
                    onChange={(e) => handleSummaryChange(e.target.value)}
                    rows={5}
                    placeholder="Experienced software engineer with 5+ years in full-stack development. Specialized in React, Node.js, and cloud technologies. Proven track record of delivering scalable solutions and leading cross-functional teams..."
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    💡 <strong>ATS Tip:</strong> Include keywords from job descriptions and quantify achievements.
                  </div>
                </FormSection>
              )}

              {/* Work Experience */}
              {activeTab === 'experience' && (
                <FormSection title="Work Experience" icon="💼">
                  <div className="space-y-4">
                    {resumeData.experience.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-3xl mb-2">💼</div>
                        <p className="text-gray-500 text-sm">No work experience added yet.</p>
                      </div>
                    ) : (
                      resumeData.experience.map(renderExperienceItem)
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
                      ➕ Add New Experience
                    </button>
                  </div>
                </FormSection>
              )}

              {/* Education */}
              {activeTab === 'education' && (
                <FormSection title="Education" icon="🎓">
                  <div className="space-y-4">
                    {resumeData.education.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-3xl mb-2">🎓</div>
                        <p className="text-gray-500 text-sm">No education history added yet.</p>
                      </div>
                    ) : (
                      resumeData.education.map(renderEducationItem)
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
                      ➕ Add New Education
                    </button>
                  </div>
                </FormSection>
              )}

              {/* Skills */}
              {activeTab === 'skills' && (
                <FormSection title="Skills" icon="🛠️">
                  <div className="space-y-4">
                    {resumeData.skills.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-3xl mb-2">🛠️</div>
                        <p className="text-gray-500 text-sm">No skills added yet.</p>
                      </div>
                    ) : (
                      resumeData.skills.map(renderSkillItem)
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
                      ➕ Add New Skill
                    </button>
                    <div className="text-xs text-gray-500">
                      💡 <strong>ATS Tip:</strong> Include both technical and soft skills relevant to your target role.
                    </div>
                  </div>
                </FormSection>
              )}

              {/* Projects */}
              {activeTab === 'projects' && (
                <FormSection title="Projects" icon="🚀">
                  <div className="space-y-4">
                    {resumeData.projects.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-3xl mb-2">🚀</div>
                        <p className="text-gray-500 text-sm">No projects added yet.</p>
                      </div>
                    ) : (
                      resumeData.projects.map(renderProjectItem)
                    )}
                    <button
                      type="button"
                      onClick={() => handleArrayAdd('projects', {
                        name: '',
                        technologies: '',
                        description: '',
                        url: ''
                      })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2 bg-white/50 hover:bg-blue-50"
                    >
                      ➕ Add New Project
                    </button>
                  </div>
                </FormSection>
              )}

              {/* Certifications */}
              {activeTab === 'certifications' && (
                <FormSection title="Certifications" icon="🏆">
                  <div className="space-y-4">
                    {resumeData.certifications.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-3xl mb-2">🏆</div>
                        <p className="text-gray-500 text-sm">No certifications added yet.</p>
                      </div>
                    ) : (
                      resumeData.certifications.map(renderCertificationItem)
                    )}
                    <button
                      type="button"
                      onClick={() => handleArrayAdd('certifications', {
                        name: '',
                        issuer: '',
                        date: '',
                        expiry: ''
                      })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2 bg-white/50 hover:bg-blue-50"
                    >
                      ➕ Add New Certification
                    </button>
                  </div>
                </FormSection>
              )}

              {/* Languages */}
              {activeTab === 'languages' && (
                <FormSection title="Languages" icon="🌐">
                  <div className="space-y-4">
                    {resumeData.languages.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-3xl mb-2">🌐</div>
                        <p className="text-gray-500 text-sm">No languages added yet.</p>
                      </div>
                    ) : (
                      resumeData.languages.map(renderLanguageItem)
                    )}
                    <button
                      type="button"
                      onClick={() => handleArrayAdd('languages', {
                        name: '',
                        proficiency: ''
                      })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2 bg-white/50 hover:bg-blue-50"
                    >
                      ➕ Add New Language
                    </button>
                  </div>
                </FormSection>
              )}
            </div>
          </div>

          {/* Right Panel - Preview & Templates */}
          <div className="space-y-6">
            {/* Template Selection */}
            <FormSection title="Choose ATS Template" icon="🎨">
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>ATS-Friendly Features:</strong> Clean formatting, standard fonts, proper section headers, and keyword optimization.
                </p>
              </div>
            </FormSection>

            {/* Live Preview */}
            <FormSection title="Live Preview" icon="👁️">
              <div className="bg-gray-100 rounded-lg p-2">
                <div className="bg-white rounded-lg min-h-[600px] max-h-[700px] overflow-y-auto shadow-inner p-6">
                  <div 
                    id="resume-preview"
                    dangerouslySetInnerHTML={{ __html: generateResumeContent() }}
                  />
                </div>
              </div>
            </FormSection>

            {/* Quick Actions */}
            <FormSection title="Export Resume" icon="🚀">
              <div className="space-y-3">
                <button
                  onClick={() => saveResume()}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  💾 {loading ? 'Saving...' : 'Save Resume'}
                </button>
                
                <button
                  onClick={downloadResumePDF}
                  className="w-full bg-green-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  📄 Download ATS-Optimized PDF
                </button>

                {lastSave && (
                  <div className="text-center text-sm text-green-600 bg-green-50 rounded-lg p-2 border border-green-200">
                    ✅ Last saved: {lastSave.toLocaleTimeString()}
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center">
                PDF export includes only your resume content with professional formatting
              </div>
            </FormSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;