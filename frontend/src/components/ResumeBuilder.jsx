// frontend/src/components/ResumeBuilder.jsx
import React, { useState, useCallback } from 'react';

// Stable input components that don't re-render unnecessarily
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

const ResumeBuilder = () => {
  const [activeTab, setActiveTab] = useState('personal');
  
  // Single state object to prevent multiple re-renders
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

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastSave, setLastSave] = useState(null);

  // Stable templates array
  const templates = React.useMemo(() => [
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
  ], []);

  // Stable navigation tabs
  const navigationTabs = React.useMemo(() => [
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'summary', label: 'Summary', icon: '📝' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certifications', label: 'Certifications', icon: '🏆' },
    { id: 'languages', label: 'Languages', icon: '🌐' }
  ], []);

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

  // Stable form section component
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

  // Stable template selector
  const TemplateSelector = useCallback(({ selected, onSelect }) => (
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
  ), [templates]);

  // Stable render functions for array items
  const renderExperienceItem = useCallback((exp) => (
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
        placeholder="• Developed and maintained web applications using React and Node.js..."
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
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderEducationItem = useCallback((edu) => (
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
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderSkillItem = useCallback((skill) => (
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
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderProjectItem = useCallback((project) => (
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
        placeholder="• Developed a full-stack e-commerce platform serving 1000+ users..."
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
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderCertificationItem = useCallback((cert) => (
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
  ), [handleArrayUpdate, handleArrayRemove]);

  const renderLanguageItem = useCallback((lang) => (
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
  ), [handleArrayUpdate, handleArrayRemove]);

  // Simple save function
  const saveResume = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSave(new Date());
    } catch (error) {
      console.error('Error saving resume:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple PDF download
  const downloadResumePDF = () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Resume</title></head>
        <body>${element.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Simple resume content
  const generateResumeContent = () => {
    const { personal, summary, experience, education, skills, projects, certifications, languages } = resumeData;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${personal.fullName || 'Your Name'}</h1>
          <p style="color: #666;">
            ${personal.email ? `${personal.email} • ` : ''}
            ${personal.phone ? `${personal.phone} • ` : ''}
            ${personal.location || ''}
          </p>
        </div>

        ${summary ? `<div><h2>Professional Summary</h2><p>${summary}</p></div>` : ''}

        ${experience.length > 0 ? `
          <div><h2>Experience</h2>
          ${experience.map(exp => `
            <div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold; margin: 0;">${exp.position}</h3>
              <p style="margin: 2px 0; color: #666;">${exp.company} • ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</p>
              <p>${exp.description || ''}</p>
            </div>
          `).join('')}</div>
        ` : ''}

        ${education.length > 0 ? `
          <div><h2>Education</h2>
          ${education.map(edu => `
            <div style="margin-bottom: 15px;">
              <h3 style="font-weight: bold; margin: 0;">${edu.degree}</h3>
              <p style="margin: 2px 0; color: #666;">${edu.institution} • ${edu.startDate} - ${edu.current ? 'Present' : edu.endDate}</p>
            </div>
          `).join('')}</div>
        ` : ''}

        ${skills.length > 0 ? `
          <div><h2>Skills</h2>
          <p>${skills.map(skill => skill.name).join(', ')}</p></div>
        ` : ''}
      </div>
    `;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl mb-6">
        <div className="px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ATS-Optimized Resume Builder
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Form Input */}
          <div className="space-y-6">
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
              {/* Personal Information */}
              {activeTab === 'personal' && (
                <FormSection title="Personal Information" icon="👤">
                  <div className="space-y-4">
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
                    </div>
                  </div>
                </FormSection>
              )}

              {/* Other sections with the same pattern */}
              {activeTab === 'summary' && (
                <FormSection title="Professional Summary" icon="📝">
                  <TextAreaField
                    label="Summary"
                    value={resumeData.summary}
                    onChange={(e) => handleSummaryChange(e.target.value)}
                    rows={5}
                    placeholder="Experienced professional with..."
                  />
                </FormSection>
              )}

              {activeTab === 'experience' && (
                <FormSection title="Work Experience" icon="💼">
                  <div className="space-y-4">
                    {resumeData.experience.map(renderExperienceItem)}
                    <button
                      onClick={() => handleArrayAdd('experience', {
                        position: '', company: '', location: '', startDate: '', endDate: '', description: '', current: false
                      })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      ➕ Add Experience
                    </button>
                  </div>
                </FormSection>
              )}

              {activeTab === 'education' && (
                <FormSection title="Education" icon="🎓">
                  <div className="space-y-4">
                    {resumeData.education.map(renderEducationItem)}
                    <button
                      onClick={() => handleArrayAdd('education', {
                        degree: '', institution: '', location: '', startDate: '', endDate: '', description: '', current: false
                      })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      ➕ Add Education
                    </button>
                  </div>
                </FormSection>
              )}

              {activeTab === 'skills' && (
                <FormSection title="Skills" icon="🛠️">
                  <div className="space-y-4">
                    {resumeData.skills.map(renderSkillItem)}
                    <button
                      onClick={() => handleArrayAdd('skills', { name: '', level: '', category: '' })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      ➕ Add Skill
                    </button>
                  </div>
                </FormSection>
              )}

              {activeTab === 'projects' && (
                <FormSection title="Projects" icon="🚀">
                  <div className="space-y-4">
                    {resumeData.projects.map(renderProjectItem)}
                    <button
                      onClick={() => handleArrayAdd('projects', { name: '', technologies: '', description: '', url: '' })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      ➕ Add Project
                    </button>
                  </div>
                </FormSection>
              )}

              {activeTab === 'certifications' && (
                <FormSection title="Certifications" icon="🏆">
                  <div className="space-y-4">
                    {resumeData.certifications.map(renderCertificationItem)}
                    <button
                      onClick={() => handleArrayAdd('certifications', { name: '', issuer: '', date: '', expiry: '' })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      ➕ Add Certification
                    </button>
                  </div>
                </FormSection>
              )}

              {activeTab === 'languages' && (
                <FormSection title="Languages" icon="🌐">
                  <div className="space-y-4">
                    {resumeData.languages.map(renderLanguageItem)}
                    <button
                      onClick={() => handleArrayAdd('languages', { name: '', proficiency: '' })}
                      className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      ➕ Add Language
                    </button>
                  </div>
                </FormSection>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <FormSection title="Choose Template" icon="🎨">
              <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </FormSection>

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

            <FormSection title="Export" icon="🚀">
              <div className="space-y-3">
                <button
                  onClick={saveResume}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  💾 {loading ? 'Saving...' : 'Save Resume'}
                </button>
                
                <button
                  onClick={downloadResumePDF}
                  className="w-full bg-green-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-600"
                >
                  📄 Download PDF
                </button>
              </div>
            </FormSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;