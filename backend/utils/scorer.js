const natural = require('natural');
const cosineSimilarity = require('cosine-similarity');

const REQUIRED_SECTIONS = ["education", "experience", "skills", "projects", "certifications", "summary"];

// Similarity Score using TF-IDF and cosine similarity
const tfidfSimilarityScore = (resumeText, jdText) => {
  try {
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(resumeText.toLowerCase());
    tfidf.addDocument(jdText.toLowerCase());
    
    const resumeVector = [];
    const jdVector = [];
    
    tfidf.listTerms(0).forEach(item => {
      resumeVector[item.term] = item.tfidf;
    });
    
    tfidf.listTerms(1).forEach(item => {
      jdVector[item.term] = item.tfidf;
    });
    
    // Get all unique terms
    const allTerms = new Set([...Object.keys(resumeVector), ...Object.keys(jdVector)]);
    
    // Create vectors with the same term order
    const resumeVecArray = [];
    const jdVecArray = [];
    
    allTerms.forEach(term => {
      resumeVecArray.push(resumeVector[term] || 0);
      jdVecArray.push(jdVector[term] || 0);
    });
    
    const score = cosineSimilarity(resumeVecArray, jdVecArray);
    return Math.max(0, Math.round(score * 100 * 100) / 100);
  } catch (error) {
    console.error('Similarity calculation error:', error);
    return 0.0;
  }
};

// Formatting Score
const formattingScore = (resumeText) => {
  // More sophisticated formatting score
  const lines = resumeText.split('\n');
  const hasBulletPoints = lines.some(line => line.trim().match(/^[•\-*]\s/));
  const hasHeadings = lines.some(line => line.trim().match(/^[A-Z][A-Z\s]+:$/));
  const hasDates = resumeText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b|\b\d{4}\s*[-–]\s*\d{4}\b/);
  
  let score = 60; // Base score
  
  if (hasBulletPoints) score += 10;
  if (hasHeadings) score += 10;
  if (hasDates) score += 10;
  if (resumeText.length > 300) score += 10;
  
  return Math.min(100, score);
};

// Readability Score
const readabilityScore = (resumeText) => {
  const sentences = resumeText.split(/[.!?]/).filter(s => s.trim().length > 0);
  const words = resumeText.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0) return 50;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length;
  const sentenceRatio = (longSentences / sentences.length) * 100;
  
  let score = Math.max(30, Math.min(100, 100 - Math.abs(avgWordsPerSentence - 18) * 3));
  
  // Penalize for too many long sentences
  if (sentenceRatio > 30) {
    score -= 15;
  }
  
  return Math.round(score);
};

// Completeness Score
const completenessScore = (resumeText) => {
  const lowerText = resumeText.toLowerCase();
  const found = REQUIRED_SECTIONS.filter(section => {
    // More flexible matching for sections
    const regex = new RegExp(`\\b${section}\\b|${section}s?\\s*:`, 'i');
    return regex.test(lowerText);
  });
  
  return Math.round((found.length / REQUIRED_SECTIONS.length) * 100 * 100) / 100;
};

// Keyword Extraction
const extractKeywords = (text, topN = 25) => {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  // Enhanced stop words list
  const stopWords = new Set([
    'the', 'and', 'is', 'in', 'to', 'of', 'for', 'with', 'on', 'at', 'by', 
    'this', 'that', 'are', 'as', 'be', 'from', 'or', 'but', 'not', 'what', 
    'all', 'were', 'when', 'we', 'there', 'been', 'if', 'more', 'an', 'which', 
    'you', 'has', 'their', 'who', 'its', 'had', 'will', 'would', 'should', 
    'can', 'could', 'may', 'might', 'must', 'shall', 'about', 'also', 'have',
    'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'get', 'got', 'getting'
  ]);
  
  const freq = {};
  tokens.forEach(token => {
    // Clean the token
    const cleanToken = token.replace(/[^\w]/g, '');
    if (cleanToken.length >= 4 && !stopWords.has(cleanToken) && !/\d/.test(cleanToken)) {
      freq[cleanToken] = (freq[cleanToken] || 0) + 1;
    }
  });
  
  // Sort by frequency and get top N
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(entry => entry[0]);
};

// Enhanced Grammar Score with context and location
const grammarScore = (resumeText) => {
  try {
    const issues = [];
    let errorCount = 0;

    // Split into lines for better context
    const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
    
    // Common error patterns with better detection
    const errorPatterns = [
      {
        pattern: /\bi\s+is\b/gi,
        message: "Use 'I am' instead of 'I is'",
        type: "grammar",
        severity: "high"
      },
      {
        pattern: /\b(your\s+you're|you're\s+your)\b/gi,
        message: "Confusion between 'your' and 'you're'",
        type: "grammar",
        severity: "medium"
      },
      {
        pattern: /\b(there\s+their|their\s+there|they're\s+their)\b/gi,
        message: "Confusion between 'there', 'their', and 'they're'",
        type: "grammar",
        severity: "medium"
      },
      {
        pattern: /\b(it's\s+its|its\s+it's)\b/gi,
        message: "Confusion between 'its' (possessive) and 'it's' (it is)",
        type: "grammar",
        severity: "medium"
      },
      {
        pattern: /\b(a|an)\s+[aeiou]/gi,
        message: "Use 'an' before vowel sounds, 'a' before consonant sounds",
        type: "grammar",
        severity: "low"
      },
      {
        pattern: /\b\w+ly\b/gi,
        message: "Avoid excessive use of adverbs",
        type: "style",
        severity: "low"
      },
      {
        pattern: /\b(very|really|quite|extremely)\b/gi,
        message: "Avoid weak modifiers - use stronger adjectives",
        type: "style",
        severity: "low"
      }
    ];

    // Check each line for errors
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Check line capitalization (skip bullet points)
      if (trimmedLine && !trimmedLine.match(/^[•\-*]\s/) && !/^[A-Z]/.test(trimmedLine)) {
        errorCount++;
        issues.push({
          message: "Sentence should start with a capital letter",
          type: "punctuation",
          severity: "medium",
          context: trimmedLine.substring(0, 60) + (trimmedLine.length > 60 ? "..." : ""),
          location: `Line ${lineIndex + 1}`,
          example: trimmedLine.substring(0, 30)
        });
      }

      // Check for error patterns
      errorPatterns.forEach(pattern => {
        const matches = trimmedLine.match(pattern.pattern);
        if (matches) {
          matches.forEach(match => {
            errorCount++;
            if (issues.length < 15) { // Limit issues to avoid overload
              issues.push({
                message: pattern.message,
                type: pattern.type,
                severity: pattern.severity,
                context: trimmedLine.substring(0, 80) + (trimmedLine.length > 80 ? "..." : ""),
                location: `Line ${lineIndex + 1}`,
                example: match
              });
            }
          });
        }
      });

      // Check for repetitive words in the same line
      const words = trimmedLine.toLowerCase().split(/\s+/);
      const wordCount = {};
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length > 3) {
          wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        }
      });

      Object.entries(wordCount).forEach(([word, count]) => {
        if (count > 2) {
          errorCount++;
          if (issues.length < 15) {
            issues.push({
              message: `Word "${word}" is repeated too many times in the same sentence`,
              type: "style",
              severity: "low",
              context: trimmedLine.substring(0, 60) + (trimmedLine.length > 60 ? "..." : ""),
              location: `Line ${lineIndex + 1}`,
              example: word
            });
          }
        }
      });
    });

    // Check for section headings
    const hasSectionHeadings = lines.some(line => 
      line.trim().match(/^(EDUCATION|EXPERIENCE|SKILLS|PROJECTS|CERTIFICATIONS|SUMMARY):?$/i)
    );

    if (!hasSectionHeadings) {
      issues.push({
        message: "Missing clear section headings (Education, Experience, Skills, etc.)",
        type: "formatting",
        severity: "medium",
        context: "Consider adding clear section headings",
        location: "Overall structure",
        example: "EDUCATION, EXPERIENCE, SKILLS"
      });
      errorCount += 2;
    }

    // Calculate score (more nuanced penalty system)
    let score = 100;
    issues.forEach(issue => {
      if (issue.severity === "high") score -= 3;
      else if (issue.severity === "medium") score -= 2;
      else score -= 1;
    });

    score = Math.max(0, Math.round(score));

    return { 
      score: Math.round(score * 100) / 100, 
      issues: issues.slice(0, 15) // Limit to 15 most important issues
    };
  } catch (error) {
    console.error("Grammar check error:", error);
    return { 
      score: 85, 
      issues: [{ 
        message: "Grammar check encountered an error", 
        type: "system", 
        severity: "low",
        context: "Please try again or check your resume format",
        location: "Unknown",
        example: ""
      }] 
    };
  }
};

// Enhanced Overall Scoring Function
const overallScore = async (resumeText, jdText) => {
  const sim = tfidfSimilarityScore(resumeText, jdText);
  const read = readabilityScore(resumeText);
  const comp = completenessScore(resumeText);
  const fmt = formattingScore(resumeText);
  const { score: gram, issues: grammar_issues } = grammarScore(resumeText);

  // Weighted scoring with adjustments
  const total = Math.round((
    sim * 0.35 + // Increased weight for relevance
    read * 0.15 + 
    comp * 0.15 + // Reduced weight for completeness
    fmt * 0.10 + // Reduced weight for formatting
    gram * 0.25   // Increased weight for grammar
  ) * 100) / 100;

  // Enhanced keyword extraction
  const keywordsFromJd = extractKeywords(jdText, 30);
  const resumeKeywords = extractKeywords(resumeText, 50);
  
  const keywordsInResume = keywordsFromJd.filter(kw => 
    resumeKeywords.includes(kw) || resumeText.toLowerCase().includes(kw)
  );
  
  const missingKeywords = keywordsFromJd.filter(kw => 
    !keywordsInResume.includes(kw)
  );

  return {
    total: Math.min(100, total), // Cap at 100
    similarity: sim,
    readability: read,
    completeness: comp,
    formatting: fmt,
    grammar_score: gram,
    grammar_issues,
    matched_keywords: keywordsInResume.slice(0, 20), // Limit to top 20
    missing_keywords: missingKeywords.slice(0, 15),  // Limit to top 15
    keyword_match_percentage: Math.round((keywordsInResume.length / Math.max(1, keywordsFromJd.length)) * 100)
  };
};

module.exports = {
  overallScore
};