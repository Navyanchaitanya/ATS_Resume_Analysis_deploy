// frontend/src/components/ResumeBuilder.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  FaEdit
} from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../App';

const ResumeBuilder = ({ token }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [resumeData, setResumeData] = useState({
    // Personal Information
    personal: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    // Professional Summary
    summary: '',
    // Work Experience
    experience: [],
    // Education
    education: [],
    // Skills
    skills: [],
    // Projects
    projects: [],
    // Certifications
    certifications: [],
    // Languages
    languages: []
  });

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Professional',
      description: 'Clean and professional ATS-friendly template',
      category: 'ATS Optimized',
      preview: 'bg-gradient-to-br from-blue-50 to-cyan-50'
    },
    {
      id: 2,
      name: 'Modern',
      description: 'Contemporary design with visual appeal',
      category: 'Modern',
      preview: 'bg-gradient-to-br from-purple-50 to-pink-50'
    },
    {
      id: 3,
      name: 'Executive',
      description: 'Sophisticated layout for senior roles',
      category: 'Executive',
      preview: 'bg-gradient-to-br from-gray-50 to-blue-50'
    },
    {
      id: 4,
      name: 'Creative',
      description: 'For design and creative roles',
      category: 'Creative',
      preview: 'bg-gradient-to-br from-green-50 to-teal-50'
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [savedResumes, setSavedResumes] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleInputChange = (section, field, value) => {
    setResumeData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayAdd = (section, newItem) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], { id: Date.now(), ...newItem }]
    }));
  };

  const handleArrayUpdate = (section, id, updates) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].map(item => 
        item.id === id ? { ...item, ...updates } : item
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
      const response = await axios.post(`${API_BASE_URL}/api/resumes`, {
        name: resumeName,
        template: selectedTemplate,
        data: resumeData,
        preview: generateResumePreview()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await loadSavedResumes();
      alert('Resume saved successfully!');
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Error saving resume. Please try again.');
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

  const generateResumePreview = () => {
    // Generate a text preview for storage
    return `
      ${resumeData.personal.fullName}
      ${resumeData.personal.email} | ${resumeData.personal.phone}
      ${resumeData.summary?.substring(0, 100)}...
      Experience: ${resumeData.experience.length} positions
      Education: ${resumeData.education.length} entries
      Skills: ${resumeData.skills.length} skills
    `;
  };

  const generateResumeHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resume - ${resumeData.personal.fullName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section-title { border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
          .experience-item, .education-item { margin-bottom: 15px; }
          .skills { display: flex; flex-wrap: wrap; gap: 10px; }
          .skill-tag { background: #f0f0f0; padding: 5px 10px; border-radius: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${resumeData.personal.fullName}</h1>
          <p>${resumeData.personal.email} | ${resumeData.personal.phone} | ${resumeData.personal.location}</p>
          ${resumeData.personal.linkedin ? `<p>LinkedIn: ${resumeData.personal.linkedin}</p>` : ''}
          ${resumeData.personal.github ? `<p>GitHub: ${resumeData.personal.github}</p>` : ''}
        </div>

        ${resumeData.summary ? `
        <div class="section">
          <h2 class="section-title">Professional Summary</h2>
          <p>${resumeData.summary}</p>
        </div>
        ` : ''}

        ${resumeData.experience.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Work Experience</h2>
          ${resumeData.experience.map(exp => `
            <div class="experience-item">
              <h3>${exp.position} - ${exp.company}</h3>
              <p><em>${exp.startDate} - ${exp.endDate || 'Present'} | ${exp.location}</em></p>
              <p>${exp.description}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${resumeData.education.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Education</h2>
          ${resumeData.education.map(edu => `
            <div class="education-item">
              <h3>${edu.degree} - ${edu.institution}</h3>
              <p><em>${edu.startDate} - ${edu.endDate || 'Present'} | ${edu.location}</em></p>
              <p>${edu.description || ''}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${resumeData.skills.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Skills</h2>
          <div class="skills">
            ${resumeData.skills.map(skill => `
              <span class="skill-tag">${skill.name} ${skill.level ? `(${skill.level})` : ''}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${resumeData.projects.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Projects</h2>
          ${resumeData.projects.map(project => `
            <div class="experience-item">
              <h3>${project.name}</h3>
              <p><em>${project.technologies || ''}</em></p>
              <p>${project.description}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </body>
      </html>
    `;
  };

  const FormSection = ({ title, icon, children }) => (
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
  );

  const ArrayInput = ({ section, items, renderItem, emptyMessage, onAdd }) => (
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
  );

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
            Create ATS-optimized resumes with professional templates. Build, preview, and download your perfect resume.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Templates */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Selection */}
            <FormSection title="Templates" icon={<FaEye />}>
              <div className="space-y-3">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-20 rounded mb-2 ${template.preview}`}></div>
                    <h4 className="font-semibold text-gray-800">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <span className="text-xs text-blue-600 font-medium">{template.category}</span>
                  </div>
                ))}
              </div>
            </FormSection>

            {/* Saved Resumes */}
            {savedResumes.length > 0 && (
              <FormSection title="Saved Resumes" icon={<FaSave />}>
                <div className="space-y-2">
                  {savedResumes.map(resume => (
                    <div key={resume.id} className="p-3 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold text-gray-800">{resume.name}</h4>
                      <p className="text-sm text-gray-600 truncate">{resume.preview}</p>
                      <p className="text-xs text-gray-500">
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
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'personal', label: 'Personal', icon: <FaUser /> },
                  { id: 'summary', label: 'Summary', icon: <FaBriefcase /> },
                  { id: 'experience', label: 'Experience', icon: <FaBriefcase /> },
                  { id: 'education', label: 'Education', icon: <FaGraduationCap /> },
                  { id: 'skills', label: 'Skills', icon: <FaTools /> },
                  { id: 'projects', label: 'Projects', icon: <FaAward /> },
                  { id: 'certifications', label: 'Certifications', icon: <FaAward /> },
                  { id: 'languages', label: 'Languages', icon: <FaLanguage /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
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
            <div className="space-y-6">
              {/* Personal Information */}
              {activeTab === 'personal' && (
                <FormSection title="Personal Information" icon={<FaUser />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={resumeData.personal.fullName}
                        onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={resumeData.personal.email}
                        onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={resumeData.personal.phone}
                        onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={resumeData.personal.location}
                        onChange={(e) => handleInputChange('personal', 'location', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="San Francisco, CA"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">LinkedIn</label>
                      <input
                        type="url"
                        value={resumeData.personal.linkedin}
                        onChange={(e) => handleInputChange('personal', 'linkedin', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">GitHub</label>
                      <input
                        type="url"
                        value={resumeData.personal.github}
                        onChange={(e) => handleInputChange('personal', 'github', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                    rows="6"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <input
                            type="text"
                            placeholder="Position *"
                            value={exp.position}
                            onChange={(e) => handleArrayUpdate('experience', exp.id, { position: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                          />
                          <input
                            type="text"
                            placeholder="Company *"
                            value={exp.company}
                            onChange={(e) => handleArrayUpdate('experience', exp.id, { company: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                          />
                          <input
                            type="text"
                            placeholder="Location"
                            value={exp.location}
                            onChange={(e) => handleArrayUpdate('experience', exp.id, { location: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                          />
                          <div className="flex gap-2">
                            <input
                              type="month"
                              placeholder="Start Date"
                              value={exp.startDate}
                              onChange={(e) => handleArrayUpdate('experience', exp.id, { startDate: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-2 flex-1"
                            />
                            <input
                              type="month"
                              placeholder="End Date"
                              value={exp.endDate}
                              onChange={(e) => handleArrayUpdate('experience', exp.id, { endDate: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-2 flex-1"
                              disabled={exp.current}
                            />
                          </div>
                        </div>
                        <textarea
                          placeholder="Description of your responsibilities and achievements..."
                          value={exp.description}
                          onChange={(e) => handleArrayUpdate('experience', exp.id, { description: e.target.value })}
                          rows="3"
                          className="w-full border border-gray-300 rounded px-3 py-2 mb-2 resize-none"
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

              {/* Add similar sections for Education, Skills, Projects, etc. */}
              {/* Education Section */}
              {activeTab === 'education' && (
                <FormSection title="Education" icon={<FaGraduationCap />}>
                  <ArrayInput
                    section="education"
                    items={resumeData.education}
                    emptyMessage="No education history added yet."
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
                      <div key={edu.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <input
                            type="text"
                            placeholder="Degree *"
                            value={edu.degree}
                            onChange={(e) => handleArrayUpdate('education', edu.id, { degree: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                          />
                          <input
                            type="text"
                            placeholder="Institution *"
                            value={edu.institution}
                            onChange={(e) => handleArrayUpdate('education', edu.id, { institution: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                          />
                          <input
                            type="text"
                            placeholder="Location"
                            value={edu.location}
                            onChange={(e) => handleArrayUpdate('education', edu.id, { location: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                          />
                          <div className="flex gap-2">
                            <input
                              type="month"
                              placeholder="Start Date"
                              value={edu.startDate}
                              onChange={(e) => handleArrayUpdate('education', edu.id, { startDate: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-2 flex-1"
                            />
                            <input
                              type="month"
                              placeholder="End Date"
                              value={edu.endDate}
                              onChange={(e) => handleArrayUpdate('education', edu.id, { endDate: e.target.value })}
                              className="border border-gray-300 rounded px-3 py-2 flex-1"
                              disabled={edu.current}
                            />
                          </div>
                        </div>
                        <textarea
                          placeholder="Additional details, honors, or achievements..."
                          value={edu.description}
                          onChange={(e) => handleArrayUpdate('education', edu.id, { description: e.target.value })}
                          rows="2"
                          className="w-full border border-gray-300 rounded px-3 py-2 mb-2 resize-none"
                        />
                        <div className="flex justify-between items-center">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={edu.current}
                              onChange={(e) => handleArrayUpdate('education', edu.id, { 
                                current: e.target.checked,
                                endDate: e.target.checked ? '' : edu.endDate
                              })}
                            />
                            Currently attending
                          </label>
                          <button
                            onClick={() => handleArrayRemove('education', edu.id)}
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

              {/* Skills Section */}
              {activeTab === 'skills' && (
                <FormSection title="Skills" icon={<FaTools />}>
                  <ArrayInput
                    section="skills"
                    items={resumeData.skills}
                    emptyMessage="No skills added yet. Add your technical and professional skills."
                    onAdd={() => handleArrayAdd('skills', {
                      name: '',
                      level: '',
                      category: 'Technical'
                    })}
                    renderItem={(skill, index) => (
                      <div key={skill.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Skill name *"
                          value={skill.name}
                          onChange={(e) => handleArrayUpdate('skills', skill.id, { name: e.target.value })}
                          className="border border-gray-300 rounded px-3 py-2 flex-1"
                        />
                        <select
                          value={skill.level}
                          onChange={(e) => handleArrayUpdate('skills', skill.id, { level: e.target.value })}
                          className="border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="">Select level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                        <button
                          onClick={() => handleArrayRemove('skills', skill.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  />
                </FormSection>
              )}
            </div>
          </div>

          {/* Right Sidebar - Preview & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Preview */}
            <FormSection title="Live Preview" icon={<FaEye />}>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 min-h-[400px]">
                {previewMode ? (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: generateResumeHTML() }}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FaEye className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p>Preview will appear here</p>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
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
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  <FaSave />
                  {loading ? 'Saving...' : 'Save Resume'}
                </button>
                
                <button
                  onClick={downloadResume}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FaDownload />
                  Download HTML
                </button>

                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
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
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FaTrash />
                  Clear All
                </button>
              </div>
            </FormSection>

            {/* ATS Tips */}
            <FormSection title="ATS Optimization Tips" icon={<FaAward />}>
              <div className="space-y-2 text-sm">
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <strong>✅ Use Keywords</strong>
                  <p className="text-green-700">Include keywords from job description</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <strong>✅ Clear Sections</strong>
                  <p className="text-blue-700">Use standard section headings</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <strong>✅ Simple Formatting</strong>
                  <p className="text-yellow-700">Avoid tables, columns, graphics</p>
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <strong>❌ No Headers/Footers</strong>
                  <p className="text-red-700">ATS may not read header/footer content</p>
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