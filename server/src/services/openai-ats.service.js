const fs = require('fs');
const path = require('path');

const OpenAI = require('openai');

const env = require('../config/env');

let client = null;

function getClient() {
  if (!env.openAiAtsEnabled || !env.openAiApiKey) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.openAiApiKey,
    });
  }

  return client;
}

function isOpenAiAtsEnabled() {
  return Boolean(getClient());
}

function extractResponseText(response) {
  if (response?.output_text) {
    return response.output_text;
  }

  return (response?.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => {
      if (typeof content?.text === 'string') {
        return content.text;
      }

      if (typeof content?.value === 'string') {
        return content.value;
      }

      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function safeJsonParse(value) {
  return JSON.parse(String(value || '{}'));
}

function normalizeArray(values = []) {
  return [...new Set(
    values
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )];
}

function toAbsoluteStoragePath(storagePath) {
  if (!storagePath) {
    return null;
  }

  if (path.isAbsolute(storagePath)) {
    return storagePath;
  }

  return path.resolve(storagePath);
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

async function buildResumeFilePart(candidate, documents = []) {
  const primaryDocument = documents[0];

  if (primaryDocument?.storagePath) {
    const absolutePath = toAbsoluteStoragePath(primaryDocument.storagePath);

    if (absolutePath && fs.existsSync(absolutePath)) {
      const uploaded = await getClient().files.create({
        file: fs.createReadStream(absolutePath),
        purpose: 'user_data',
      });

      return {
        input: { type: 'input_file', file_id: uploaded.id },
        sourceLabel: primaryDocument.originalName || primaryDocument.title || path.basename(absolutePath),
      };
    }
  }

  const remoteCandidates = [
    primaryDocument?.publicUrl,
    primaryDocument?.storagePath,
    candidate.resumeUrl,
  ].filter(isRemoteUrl);

  if (remoteCandidates[0]) {
    return {
      input: {
        type: 'input_file',
        file_url: remoteCandidates[0],
      },
      sourceLabel: primaryDocument?.originalName || primaryDocument?.title || candidate.resumeUrl,
    };
  }

  return null;
}

function buildResumeContext(candidate, documents = []) {
  return [
    `Nom: ${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
    candidate.currentHeadline ? `Intitule actuel: ${candidate.currentHeadline}` : null,
    candidate.summary ? `Resume: ${candidate.summary}` : null,
    candidate.email ? `Email: ${candidate.email}` : null,
    candidate.phone ? `Telephone: ${candidate.phone}` : null,
    candidate.city ? `Ville: ${candidate.city}` : null,
    candidate.country ? `Pays: ${candidate.country}` : null,
    candidate.yearsOfExperience !== null && candidate.yearsOfExperience !== undefined
      ? `Annees d'experience deja connues: ${candidate.yearsOfExperience}`
      : null,
    Array.isArray(candidate.tags) && candidate.tags.length
      ? `Tags: ${candidate.tags.join(', ')}`
      : null,
    documents.length
      ? `Documents lies: ${documents.map((document) => document.originalName || document.title || document.publicUrl).filter(Boolean).join(', ')}`
      : null,
  ].filter(Boolean).join('\n');
}

const RESUME_PARSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'currentHeadline',
    'professionalSummary',
    'totalYearsExperience',
    'seniorityLevel',
    'languages',
    'sectors',
    'tools',
    'skills',
    'experiences',
    'educations',
    'certifications',
    'evidenceHighlights',
  ],
  properties: {
    currentHeadline: { type: ['string', 'null'] },
    professionalSummary: { type: 'string' },
    totalYearsExperience: { type: ['number', 'null'] },
    seniorityLevel: { type: ['string', 'null'] },
    languages: { type: 'array', items: { type: 'string' } },
    sectors: { type: 'array', items: { type: 'string' } },
    tools: { type: 'array', items: { type: 'string' } },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'category', 'levelLabel', 'yearsExperience'],
        properties: {
          name: { type: 'string' },
          category: { type: ['string', 'null'] },
          levelLabel: { type: ['string', 'null'] },
          yearsExperience: { type: ['number', 'null'] },
        },
      },
    },
    experiences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['companyName', 'jobTitle', 'summary', 'industry', 'location', 'isCurrent'],
        properties: {
          companyName: { type: ['string', 'null'] },
          jobTitle: { type: ['string', 'null'] },
          summary: { type: ['string', 'null'] },
          industry: { type: ['string', 'null'] },
          location: { type: ['string', 'null'] },
          startDate: { type: ['string', 'null'] },
          endDate: { type: ['string', 'null'] },
          isCurrent: { type: 'boolean' },
        },
      },
    },
    educations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['institution', 'degree', 'fieldOfStudy', 'levelLabel'],
        properties: {
          institution: { type: ['string', 'null'] },
          degree: { type: ['string', 'null'] },
          fieldOfStudy: { type: ['string', 'null'] },
          levelLabel: { type: ['string', 'null'] },
        },
      },
    },
    certifications: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'issuer'],
        properties: {
          name: { type: ['string', 'null'] },
          issuer: { type: ['string', 'null'] },
        },
      },
    },
    evidenceHighlights: { type: 'array', items: { type: 'string' } },
  },
};

const SCREENING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'confidenceScore',
    'strengths',
    'risks',
    'nextAction',
    'summary',
    'items',
  ],
  properties: {
    confidenceScore: { type: 'number' },
    strengths: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    nextAction: { type: 'string' },
    summary: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'criterionCode',
          'criterionLabel',
          'rawScore',
          'rationale',
          'evidenceSnippet',
          'knockoutFailed',
        ],
        properties: {
          criterionCode: { type: 'string' },
          criterionLabel: { type: 'string' },
          rawScore: { type: 'number' },
          rationale: { type: 'string' },
          evidenceSnippet: { type: ['string', 'null'] },
          knockoutFailed: { type: 'boolean' },
        },
      },
    },
  },
};

async function createStructuredResponse({ model, systemText, userText, schema, filePart = null }) {
  const content = [];

  if (filePart?.input) {
    content.push(filePart.input);
  }

  content.push({
    type: 'input_text',
    text: userText,
  });

  const response = await getClient().responses.create({
    model,
    reasoning: { effort: 'medium' },
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: systemText }],
      },
      {
        role: 'user',
        content,
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: schema === RESUME_PARSE_SCHEMA ? 'resume_profile' : 'ats_screening',
        strict: true,
        schema,
      },
    },
  });

  return safeJsonParse(extractResponseText(response));
}

async function parseResumeWithOpenAi({ candidate, documents = [] }) {
  const context = buildResumeContext(candidate, documents);
  const filePart = await buildResumeFilePart(candidate, documents).catch(() => null);

  const systemText = [
    'Tu es un moteur ATS RH expert.',
    'Tu transformes un CV en profil strictement structure.',
    'Tu n inventes pas une information absente.',
    'Si une information est inconnue, retourne null ou un tableau vide.',
    'Tu ignores volontairement l age, le sexe, la photo, la religion, l origine et tout critere sensible.',
  ].join(' ');

  const userText = [
    'Analyse le dossier candidat suivant et retourne uniquement le JSON demande.',
    context,
    'Extrais le profil structure pour un ATS professionnel.',
  ].join('\n\n');

  const parsed = await createStructuredResponse({
    model: env.openAiAtsParseModel,
    systemText,
    userText,
    schema: RESUME_PARSE_SCHEMA,
    filePart,
  });

  return {
    modelName: env.openAiAtsParseModel,
    sourceLabel: filePart?.sourceLabel || 'Contexte textuel candidat',
    profile: {
      currentHeadline: parsed.currentHeadline || null,
      professionalSummary: parsed.professionalSummary || '',
      totalYearsExperience: parsed.totalYearsExperience ?? null,
      seniorityLevel: parsed.seniorityLevel || null,
      languages: normalizeArray(parsed.languages),
      sectors: normalizeArray(parsed.sectors),
      tools: normalizeArray(parsed.tools),
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
      educations: Array.isArray(parsed.educations) ? parsed.educations : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      evidenceHighlights: normalizeArray(parsed.evidenceHighlights),
    },
  };
}

async function scoreApplicationWithOpenAi({ application, resumeProfile, skills = [], experiences = [], scorecard }) {
  const systemText = [
    'Tu es un moteur ATS RH expert pour le recrutement professionnel.',
    'Tu notes chaque critere de 0 a 100 en restant explicable et prudent.',
    'Tu n inventes pas des preuves absentes.',
    'Tu ignores l age, le sexe, la photo, la religion, l origine, l etat civil et tout critere sensible.',
    'Tu renvoies uniquement le JSON demande.',
  ].join(' ');

  const normalizedProfile = {
    currentHeadline: resumeProfile?.currentRole || application.candidate?.currentHeadline || null,
    professionalSummary: resumeProfile?.parsedSummary || application.candidate?.summary || '',
    totalYearsExperience: resumeProfile?.totalYearsExperience ?? application.candidate?.yearsOfExperience ?? null,
    languages: normalizeArray(resumeProfile?.languages || []),
    skills: skills.map((skill) => ({
      name: skill.name,
      category: skill.category,
      level: skill.level,
      yearsExperience: skill.yearsExperience,
    })),
    experiences: experiences.map((experience) => ({
      companyName: experience.companyName,
      jobTitle: experience.jobTitle,
      industry: experience.industry,
      location: experience.location,
      summary: experience.description,
      isCurrent: experience.isCurrent,
    })),
  };

  const userText = JSON.stringify({
    jobPosting: {
      title: application.jobPosting?.title || null,
      departmentName: application.jobPosting?.departmentName || null,
      employmentType: application.jobPosting?.employmentType || null,
      location: application.jobPosting?.location || null,
      description: application.jobPosting?.description || null,
    },
    candidate: {
      fullName: `${application.candidate?.firstName || ''} ${application.candidate?.lastName || ''}`.trim(),
      source: application.candidate?.source || null,
      summary: application.candidate?.summary || null,
      currentHeadline: application.candidate?.currentHeadline || null,
      yearsOfExperience: application.candidate?.yearsOfExperience ?? null,
    },
    normalizedProfile,
    scorecard: {
      name: scorecard.name,
      description: scorecard.description,
      criteria: scorecard.criteria.map((criterion) => ({
        code: criterion.code,
        label: criterion.label,
        description: criterion.description,
        weight: Number(criterion.weight || 0),
        minimumScore: criterion.minimumScore !== null && criterion.minimumScore !== undefined
          ? Number(criterion.minimumScore)
          : null,
        knockout: criterion.knockout,
      })),
    },
    instruction: 'Evalue chaque critere individuellement, retourne des preuves courtes, un niveau de confiance global et la prochaine meilleure action recruteur.',
  }, null, 2);

  const parsed = await createStructuredResponse({
    model: env.openAiAtsScreenModel,
    systemText,
    userText,
    schema: SCREENING_SCHEMA,
  });

  return {
    modelName: env.openAiAtsScreenModel,
    confidenceScore: Math.max(0, Math.min(100, Number(parsed.confidenceScore || 0))),
    strengths: normalizeArray(parsed.strengths),
    risks: normalizeArray(parsed.risks),
    nextAction: parsed.nextAction || 'Declencher une revue humaine',
    summary: parsed.summary || '',
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

module.exports = {
  isOpenAiAtsEnabled,
  parseResumeWithOpenAi,
  scoreApplicationWithOpenAi,
};
