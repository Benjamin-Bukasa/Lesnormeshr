const {
  AiRecommendationStatus,
  AiRecommendationType,
  AiRunStatus,
  AiRunType,
  ApplicationStage,
  AssessmentStatus,
  AtsDecisionStatus,
  CandidateResumeStatus,
  CandidateSkillLevel,
  ScoreEvidenceSource,
  TalentDocumentCategory,
  TalentDocumentOwnerType,
} = require('@prisma/client');

const prisma = require('../lib/prisma');
const {
  isOpenAiAtsEnabled,
  parseResumeWithOpenAi,
  scoreApplicationWithOpenAi,
} = require('./openai-ats.service');
const AppError = require('../utils/app-error');
const { buildPagination, parsePagination } = require('../utils/pagination');

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function parseOptionalDecimal(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = Number(value);

  if (Number.isNaN(normalized)) {
    throw new AppError(400, `Valeur numerique invalide pour ${fieldName}.`);
  }

  return normalized;
}

function parseDate(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, `Date invalide pour ${fieldName}.`);
  }

  return parsed;
}

function scoreToDecision(score) {
  if (score >= 85) return { type: AiRecommendationType.SHORTLIST, decision: AtsDecisionStatus.SHORTLISTED, title: 'Shortlist prioritaire' };
  if (score >= 72) return { type: AiRecommendationType.INTERVIEW, decision: AtsDecisionStatus.INTERVIEW_RECOMMENDED, title: 'Entretien recommande' };
  if (score >= 60) return { type: AiRecommendationType.TEST, decision: AtsDecisionStatus.TO_REVIEW, title: 'Test recommande' };
  if (score >= 45) return { type: AiRecommendationType.REVIEW, decision: AtsDecisionStatus.HOLD, title: 'Revue humaine requise' };
  return { type: AiRecommendationType.REJECT, decision: AtsDecisionStatus.REJECTED, title: 'A ecarter' };
}

const SKILL_CATALOG = [
  { name: 'Recrutement', category: 'Talent', keywords: ['recrutement', 'recruitment', 'talent acquisition', 'sourcing'] },
  { name: 'Paie', category: 'Payroll', keywords: ['paie', 'payroll', 'salary processing'] },
  { name: 'SIRH', category: 'HRIS', keywords: ['sirh', 'hris', 'sage rh', 'workday', 'sap successfactors'] },
  { name: 'Droit social RDC', category: 'Compliance', keywords: ['droit social', 'code du travail', 'rdc', 'convention collective'] },
  { name: 'Excel', category: 'Tools', keywords: ['excel', 'spreadsheet'] },
  { name: 'Anglais professionnel', category: 'Languages', keywords: ['anglais', 'english'] },
  { name: 'Français professionnel', category: 'Languages', keywords: ['francais', 'français', 'french'] },
  { name: 'Communication écrite', category: 'Soft Skills', keywords: ['communication', 'redaction', 'rédaction', 'reporting'] },
  { name: 'Finance', category: 'Sector', keywords: ['finance', 'banque', 'banking', 'financial'] },
  { name: 'Administration RH', category: 'HR Operations', keywords: ['administration rh', 'gestion du personnel', 'employee administration'] },
];

function buildSourceText(candidate, documents = []) {
  return [
    candidate.firstName,
    candidate.lastName,
    candidate.currentHeadline,
    candidate.summary,
    candidate.resumeUrl,
    candidate.linkedinUrl,
    candidate.portfolioUrl,
    ...(candidate.tags || []),
    ...documents.flatMap((document) => [document.title, document.originalName, document.publicUrl]),
  ].filter(Boolean).join(' \n ');
}

function findSkillsFromText(text) {
  const normalized = normalize(text);
  return SKILL_CATALOG.filter((item) => item.keywords.some((keyword) => normalized.includes(normalize(keyword))))
    .map((item) => ({
      name: item.name,
      category: item.category,
      level: CandidateSkillLevel.INTERMEDIATE,
      yearsExperience: undefined,
      sourceLabel: 'Profil CV parse',
      isAiExtracted: true,
    }));
}

function inferLanguages(text) {
  const normalized = normalize(text);
  const languages = [];
  if (normalized.includes('anglais') || normalized.includes('english')) languages.push('Anglais');
  if (normalized.includes('francais') || normalized.includes('français') || normalized.includes('french')) languages.push('Français');
  return uniqueStrings(languages);
}

function inferYearsExperience(candidate, text) {
  if (candidate.yearsOfExperience !== null && candidate.yearsOfExperience !== undefined) {
    return Number(candidate.yearsOfExperience);
  }

  const normalized = normalize(text);
  const regexes = [
    /(\d+)\s*\+?\s*ans?/,
    /(\d+)\s*\+?\s*years?/,
  ];

  for (const regex of regexes) {
    const match = normalized.match(regex);
    if (match) {
      return Number(match[1]);
    }
  }

  return 0;
}

function inferCurrentRole(text) {
  const normalized = normalize(text);
  if (normalized.includes('charge rh') || normalized.includes('chargé rh') || normalized.includes('human resources officer')) return 'Chargé RH';
  if (normalized.includes('recruit') || normalized.includes('talent acquisition')) return 'Recruteur';
  if (normalized.includes('payroll')) return 'Gestionnaire paie';
  if (normalized.includes('accountant') || normalized.includes('comptable')) return 'Comptable';
  if (normalized.includes('developer') || normalized.includes('developpeur') || normalized.includes('développeur')) return 'Développeur';
  return null;
}

function inferEducation(text) {
  const normalized = normalize(text);
  const items = [];

  if (normalized.includes('master') || normalized.includes('mba')) {
    items.push({ institution: 'Non précisée', degree: 'Master', fieldOfStudy: 'À confirmer', levelLabel: 'MASTER' });
  } else if (normalized.includes('licence') || normalized.includes('bachelor')) {
    items.push({ institution: 'Non précisée', degree: 'Licence', fieldOfStudy: 'À confirmer', levelLabel: 'LICENCE' });
  }

  return items;
}

function inferExperienceEntries(candidate, text, years) {
  const currentRole = inferCurrentRole(text);

  if (!currentRole && years <= 0) {
    return [];
  }

  return [{
    companyName: 'À confirmer',
    jobTitle: currentRole || 'Expérience professionnelle',
    isCurrent: true,
    durationMonths: years > 0 ? years * 12 : null,
    description: candidate.summary || 'Expérience reconstruite depuis le CV.',
    industry: normalize(text).includes('banque') ? 'Banque' : null,
    location: candidate.city || candidate.country || null,
  }];
}

function inferCertifications(text) {
  const normalized = normalize(text);
  const certifications = [];
  if (normalized.includes('scrum')) {
    certifications.push({ name: 'Scrum', issuer: 'À confirmer' });
  }
  if (normalized.includes('cipd')) {
    certifications.push({ name: 'CIPD', issuer: 'CIPD' });
  }
  return certifications;
}

function buildHeuristicResumeExtraction(candidate, documents = []) {
  const sourceText = buildSourceText(candidate, documents);
  const skills = findSkillsFromText(sourceText);
  const yearsExperience = inferYearsExperience(candidate, sourceText);
  const currentRole = inferCurrentRole(sourceText);
  const languages = inferLanguages(sourceText);
  const educations = inferEducation(sourceText);
  const experiences = inferExperienceEntries(candidate, sourceText, yearsExperience);
  const certifications = inferCertifications(sourceText);
  const profileSummary = candidate.summary?.trim()
    || `Profil structure pour ${candidate.firstName} ${candidate.lastName}.`;

  return {
    modelName: 'heuristic-v1',
    sourceText,
    sourceLabel: documents[0]?.originalName || documents[0]?.title || 'Contexte textuel candidat',
    currentRole,
    yearsExperience,
    languages,
    profileSummary,
    skills,
    educations,
    experiences,
    certifications,
    evidenceHighlights: [sourceText.slice(0, 220)].filter(Boolean),
  };
}

async function ensureJobPosting(jobPostingId, tenantId) {
  const jobPosting = await prisma.jobPosting.findFirst({
    where: { id: jobPostingId, tenantId },
  });

  if (!jobPosting) {
    throw new AppError(404, 'Offre de recrutement introuvable.');
  }

  return jobPosting;
}

async function ensureCandidate(candidateId, tenantId) {
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, tenantId },
  });

  if (!candidate) {
    throw new AppError(404, 'Candidat introuvable.');
  }

  return candidate;
}

async function ensureApplication(applicationId, tenantId) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, tenantId },
    include: {
      candidate: true,
      jobPosting: true,
      interviews: true,
      offer: true,
      screening: {
        include: {
          items: true,
          scorecard: {
            include: {
              criteria: true,
            },
          },
        },
      },
      recommendations: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!application) {
    throw new AppError(404, 'Candidature introuvable.');
  }

  return application;
}

async function ensureDefaultScorecard(jobPostingId, tenantId) {
  const existing = await prisma.jobScorecard.findFirst({
    where: { tenantId, jobPostingId, isDefault: true },
    include: { criteria: { orderBy: { orderIndex: 'asc' } } },
  });

  if (existing) {
    return existing;
  }

  const jobPosting = await ensureJobPosting(jobPostingId, tenantId);
  const description = normalize(`${jobPosting.title} ${jobPosting.description} ${jobPosting.departmentName}`);

  const criteria = [
    { code: 'EXPERIENCE', label: 'Expérience métier', description: 'Nombre d années et proximité de parcours avec le besoin.', weight: 25, minimumScore: 50, knockout: false },
    { code: 'KEY_SKILLS', label: 'Compétences clés', description: 'Compétences explicitement attendues dans le poste.', weight: 20, minimumScore: 50, knockout: false },
    { code: 'SECTOR_FIT', label: 'Adéquation secteur', description: 'Expérience dans le secteur ou environnement proche.', weight: 10, minimumScore: 40, knockout: false },
    { code: 'COMMUNICATION', label: 'Communication écrite', description: 'Capacité à synthétiser et produire des livrables écrits.', weight: 10, minimumScore: 40, knockout: false },
    { code: 'LANGUAGE', label: description.includes('anglais') ? 'Anglais professionnel' : 'Français professionnel', description: 'Langue de travail attendue.', weight: 10, minimumScore: 50, knockout: description.includes('anglais') || description.includes('francais') || description.includes('français') },
    { code: 'STABILITY', label: 'Stabilité de parcours', description: 'Continuité et cohérence du parcours récent.', weight: 10, minimumScore: 40, knockout: false },
    { code: 'ROLE_MATCH', label: 'Adéquation métier', description: 'Correspondance entre le profil structuré et la description de poste.', weight: 15, minimumScore: 50, knockout: false },
  ];

  const minimumExperienceMatch = description.match(/(\d+)\s*\+?\s*ans?/);
  if (minimumExperienceMatch) {
    criteria.unshift({
      code: 'MIN_EXPERIENCE',
      label: `Minimum ${minimumExperienceMatch[1]} ans d expérience`,
      description: 'Règle dure de présélection.',
      weight: 0,
      minimumScore: 100,
      knockout: true,
    });
  }

  const scorecard = await prisma.jobScorecard.create({
    data: {
      tenantId,
      jobPostingId,
      code: 'DEFAULT',
      name: `Scorecard ATS - ${jobPosting.title}`,
      description: 'Scorecard initiale générée automatiquement à partir du poste.',
      isDefault: true,
      criteria: {
        create: criteria.map((criterion, index) => ({
          tenantId,
          ...criterion,
          orderIndex: index,
        })),
      },
    },
    include: {
      criteria: { orderBy: { orderIndex: 'asc' } },
    },
  });

  return scorecard;
}

function evaluateCriterion(criterion, context) {
  const criterionText = normalize(`${criterion.label} ${criterion.description || ''}`);
  const sourceText = normalize(context.sourceText);
  const skills = context.skills.map((skill) => normalize(skill.name));
  const languages = context.languages.map((language) => normalize(language));
  const years = context.yearsExperience;

  let rawScore = 45;
  let rationale = 'Le dossier demande une validation humaine complementaire.';
  let evidenceSnippet = context.profileSummary || context.candidateSummary || context.sourcePreview || '';

  const keywordMatches = uniqueStrings(
    SKILL_CATALOG
      .filter((item) => criterionText.includes(normalize(item.name)) || item.keywords.some((keyword) => criterionText.includes(normalize(keyword))))
      .flatMap((item) => item.keywords.filter((keyword) => sourceText.includes(normalize(keyword)))),
  );

  if (criterionText.includes('experience') || criterionText.includes('expérience')) {
    const minExpMatch = criterionText.match(/(\d+)\s*ans?/);
    const minExp = minExpMatch ? Number(minExpMatch[1]) : 3;
    rawScore = years <= 0 ? 20 : Math.min(100, Math.round((years / minExp) * 100));
    rationale = years > 0
      ? `${years} an(s) d experience inferes a partir du profil structure.`
      : 'Aucune duree d experience fiable n a ete detectee dans le dossier.';
    evidenceSnippet = context.profileSummary || context.candidateSummary || evidenceSnippet;
  } else if (criterionText.includes('anglais')) {
    rawScore = languages.includes('anglais professionnel') || languages.includes('anglais') ? 90 : 25;
    rationale = rawScore >= 80 ? 'Le dossier mentionne une pratique de l anglais.' : 'La maitrise de l anglais n est pas clairement visible.';
  } else if (criterionText.includes('francais') || criterionText.includes('français')) {
    rawScore = languages.includes('français professionnel') || languages.includes('francais professionnel') || languages.includes('français') || languages.includes('francais') ? 90 : 35;
    rationale = rawScore >= 80 ? 'Le dossier mentionne une pratique du français.' : 'Le niveau de français n est pas explicitement visible.';
  } else if (criterionText.includes('communication')) {
    rawScore = Math.min(95, 45 + Math.min(40, Math.round((context.profileSummary.length || 0) / 8)));
    rationale = 'Le résumé professionnel et les éléments de profil servent de proxy de qualité rédactionnelle.';
  } else if (criterionText.includes('stabilite') || criterionText.includes('stabilité')) {
    rawScore = context.experiencesCount >= 1 ? Math.min(85, 55 + (context.experiencesCount * 5)) : 40;
    rationale = context.experiencesCount >= 1 ? 'Le profil contient au moins une expérience exploitable.' : 'Le parcours reste encore peu documenté.';
  } else if (criterionText.includes('secteur') || criterionText.includes('finance') || criterionText.includes('banque') || criterionText.includes('bank')) {
    const hasSector = sourceText.includes('banque') || sourceText.includes('bank') || sourceText.includes('finance') || sourceText.includes(normalize(context.departmentName));
    rawScore = hasSector ? 85 : 45;
    rationale = hasSector ? 'Le parcours semble contenir une exposition sectorielle pertinente.' : 'Le secteur visé n est pas encore fortement confirmé par le profil.';
  } else if (criterionText.includes('sirrh') || criterionText.includes('sirh') || criterionText.includes('payroll') || criterionText.includes('paie') || criterionText.includes('droit social') || criterionText.includes('recrutement')) {
    rawScore = keywordMatches.length ? Math.min(100, 55 + (keywordMatches.length * 15)) : 30;
    rationale = keywordMatches.length
      ? `Des mots-cles pertinents ont ete detectes: ${keywordMatches.join(', ')}.`
      : 'Les mots-cles attendus ne ressortent pas clairement du profil.';
    evidenceSnippet = keywordMatches.join(', ') || evidenceSnippet;
  } else if (criterionText.includes('adequation') || criterionText.includes('adéquation') || criterionText.includes('metier') || criterionText.includes('métier')) {
    const titleMatch = sourceText.includes(normalize(context.jobTitle)) || (context.currentRole && normalize(context.jobTitle).includes(normalize(context.currentRole)));
    rawScore = titleMatch ? 82 : 52;
    rationale = titleMatch ? 'Le role actuel ou resume ressemble au metier cible.' : 'La proximite metier reste plausible mais doit etre confirmee.';
    evidenceSnippet = context.currentRole || evidenceSnippet;
  }

  if (criterion.knockout) {
    const threshold = criterion.minimumScore !== null && criterion.minimumScore !== undefined
      ? Number(criterion.minimumScore)
      : 60;
    if (rawScore < threshold) {
      rationale = `${rationale} Critere eliminatoire non atteint.`;
    }
  }

  return {
    rawScore: Math.max(0, Math.min(100, rawScore)),
    rationale,
    evidenceSnippet: evidenceSnippet?.slice(0, 220) || null,
  };
}

function buildHeuristicScreeningEvaluation(scorecard, context) {
  const items = scorecard.criteria.map((criterion) => {
    const evaluation = evaluateCriterion(criterion, context);
    return {
      criterionCode: criterion.code,
      criterionLabel: criterion.label,
      rawScore: evaluation.rawScore,
      rationale: evaluation.rationale,
      evidenceSnippet: evaluation.evidenceSnippet,
      knockoutFailed: Boolean(
        criterion.knockout
        && evaluation.rawScore < (
          criterion.minimumScore !== null && criterion.minimumScore !== undefined
            ? Number(criterion.minimumScore)
            : 60
        )
      ),
    };
  });

  return {
    modelName: 'heuristic-v1',
    confidenceScore: Math.min(95, 35 + (context.skills.length * 8) + ((context.languages || []).length * 8) + (context.experiencesCount * 10)),
    strengths: items
      .filter((item) => item.rawScore >= 70)
      .slice(0, 3)
      .map((item) => `${item.criterionLabel}: ${item.rationale}`),
    risks: items
      .filter((item) => item.rawScore < 60)
      .slice(0, 3)
      .map((item) => `${item.criterionLabel}: ${item.rationale}`),
    nextAction: 'Declencher une revue humaine',
    summary: 'Scoring ATS calcule avec le moteur heuristique de secours.',
    items,
  };
}

async function listJobScorecards(params, tenantId) {
  const { page, limit, skip, take } = parsePagination(params);
  const where = { tenantId };

  if (params.jobPostingId) {
    where.jobPostingId = params.jobPostingId;
  }

  const [totalItems, items] = await Promise.all([
    prisma.jobScorecard.count({ where }),
    prisma.jobScorecard.findMany({
      where,
      skip,
      take,
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            departmentName: true,
          },
        },
        criteria: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, totalItems }),
  };
}

async function saveJobScorecard(jobPostingId, payload, tenantId) {
  await ensureJobPosting(jobPostingId, tenantId);

  const criteriaInput = Array.isArray(payload.criteria) ? payload.criteria : [];
  const normalizedCriteria = criteriaInput
    .map((criterion, index) => ({
      code: String(criterion.code || `CRIT_${index + 1}`).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      label: String(criterion.label || '').trim(),
      description: criterion.description?.trim() || null,
      weight: parseOptionalDecimal(criterion.weight, 'weight') ?? 0,
      minimumScore: parseOptionalDecimal(criterion.minimumScore, 'minimumScore'),
      knockout: Boolean(criterion.knockout),
      evidenceSource: Object.values(ScoreEvidenceSource).includes(String(criterion.evidenceSource || '').toUpperCase())
        ? String(criterion.evidenceSource).toUpperCase()
        : ScoreEvidenceSource.CV,
      orderIndex: index,
    }))
    .filter((criterion) => criterion.label);

  if (normalizedCriteria.length === 0) {
    throw new AppError(400, 'Au moins un critere de scorecard est requis.');
  }

  const existing = payload.scorecardId
    ? await prisma.jobScorecard.findFirst({
      where: {
        id: payload.scorecardId,
        tenantId,
        jobPostingId,
      },
    })
    : await prisma.jobScorecard.findFirst({
      where: {
        tenantId,
        jobPostingId,
        isDefault: true,
      },
    });

  const data = {
    name: payload.name?.trim() || 'Scorecard ATS',
    description: payload.description?.trim() || null,
    isDefault: payload.isDefault !== undefined ? Boolean(payload.isDefault) : true,
  };

  const scorecard = existing
    ? await prisma.$transaction(async (tx) => {
      const updated = await tx.jobScorecard.update({
        where: { id: existing.id },
        data,
      });
      await tx.jobScorecardCriterion.deleteMany({
        where: { scorecardId: existing.id },
      });
      await tx.jobScorecardCriterion.createMany({
        data: normalizedCriteria.map((criterion) => ({
          tenantId,
          scorecardId: existing.id,
          ...criterion,
        })),
      });
      return tx.jobScorecard.findUnique({
        where: { id: updated.id },
        include: {
          criteria: { orderBy: { orderIndex: 'asc' } },
        },
      });
    })
    : prisma.jobScorecard.create({
      data: {
        tenantId,
        jobPostingId,
        code: payload.code?.trim()?.toUpperCase() || 'DEFAULT',
        ...data,
        criteria: {
          create: normalizedCriteria.map((criterion) => ({
            tenantId,
            ...criterion,
          })),
        },
      },
      include: {
        criteria: { orderBy: { orderIndex: 'asc' } },
      },
    });

  return scorecard;
}

async function parseCandidateResume(candidateId, tenantId) {
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, tenantId },
    include: {
      documents: {
        where: { category: TalentDocumentCategory.CV },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!candidate) {
    throw new AppError(404, 'Candidat introuvable.');
  }

  const heuristicExtraction = buildHeuristicResumeExtraction(candidate, candidate.documents);

  let extraction = heuristicExtraction;
  let parseMode = heuristicExtraction.modelName;

  if (isOpenAiAtsEnabled()) {
    try {
      const aiExtraction = await parseResumeWithOpenAi({ candidate, documents: candidate.documents });
      extraction = {
        modelName: aiExtraction.modelName,
        sourceText: heuristicExtraction.sourceText,
        sourceLabel: aiExtraction.sourceLabel || heuristicExtraction.sourceLabel,
        currentRole: aiExtraction.profile.currentHeadline || heuristicExtraction.currentRole,
        yearsExperience: aiExtraction.profile.totalYearsExperience ?? heuristicExtraction.yearsExperience,
        languages: aiExtraction.profile.languages?.length ? aiExtraction.profile.languages : heuristicExtraction.languages,
        profileSummary: aiExtraction.profile.professionalSummary || heuristicExtraction.profileSummary,
        skills: (aiExtraction.profile.skills || []).map((skill) => ({
          name: skill.name,
          category: skill.category || null,
          level: CandidateSkillLevel.INTERMEDIATE,
          yearsExperience: skill.yearsExperience ?? undefined,
          sourceLabel: aiExtraction.sourceLabel || 'OpenAI resume parsing',
          isAiExtracted: true,
        })),
        educations: (aiExtraction.profile.educations || []).map((education) => ({
          institution: education.institution || 'Non precisee',
          degree: education.degree || null,
          fieldOfStudy: education.fieldOfStudy || null,
          levelLabel: education.levelLabel || null,
        })),
        experiences: (aiExtraction.profile.experiences || []).map((experience) => ({
          companyName: experience.companyName || 'A confirmer',
          jobTitle: experience.jobTitle || 'Experience professionnelle',
          isCurrent: Boolean(experience.isCurrent),
          durationMonths: null,
          description: experience.summary || null,
          industry: experience.industry || null,
          location: experience.location || null,
          startDate: parseDate(experience.startDate, 'experience.startDate'),
          endDate: parseDate(experience.endDate, 'experience.endDate'),
        })),
        certifications: (aiExtraction.profile.certifications || []).map((certification) => ({
          name: certification.name || 'Certification',
          issuer: certification.issuer || null,
        })),
        evidenceHighlights: aiExtraction.profile.evidenceHighlights || heuristicExtraction.evidenceHighlights,
      };

      if (!extraction.skills.length) {
        extraction.skills = heuristicExtraction.skills;
      }
      if (!extraction.experiences.length) {
        extraction.experiences = heuristicExtraction.experiences;
      }
      if (!extraction.educations.length) {
        extraction.educations = heuristicExtraction.educations;
      }
      if (!extraction.certifications.length) {
        extraction.certifications = heuristicExtraction.certifications;
      }

      parseMode = aiExtraction.modelName;
    } catch (error) {
      extraction = heuristicExtraction;
      parseMode = `${heuristicExtraction.modelName} (fallback)`;
    }
  }

  const run = await prisma.aiEvaluationRun.create({
    data: {
      tenantId,
      candidateId,
      runType: AiRunType.CV_PARSE,
      status: AiRunStatus.RUNNING,
      modelName: parseMode,
      promptVersion: 'ats-cv-parse-v1',
      inputSummary: extraction.sourceText.slice(0, 1000),
      startedAt: new Date(),
    },
  });

  const parsedProfile = await prisma.$transaction(async (tx) => {
    await tx.candidateSkill.deleteMany({ where: { tenantId, candidateId } });
    await tx.candidateExperience.deleteMany({ where: { tenantId, candidateId } });
    await tx.candidateEducation.deleteMany({ where: { tenantId, candidateId } });
    await tx.candidateCertification.deleteMany({ where: { tenantId, candidateId } });
    await tx.candidateResumeProfile.deleteMany({ where: { tenantId, candidateId } });

    const profile = await tx.candidateResumeProfile.create({
      data: {
        tenantId,
        candidateId,
        documentId: candidate.documents[0]?.id || null,
        status: CandidateResumeStatus.PARSED,
        parsedFullName: `${candidate.firstName} ${candidate.lastName}`.trim(),
        parsedEmail: candidate.email,
        parsedPhone: candidate.phone,
        parsedSummary: extraction.profileSummary,
        totalYearsExperience: extraction.yearsExperience || null,
        currentRole: extraction.currentRole,
        currentEmployer: null,
        languages: extraction.languages,
        rawExtractionJson: {
          sourcePreview: extraction.sourceText.slice(0, 1500),
          evidenceHighlights: extraction.evidenceHighlights,
          parseMode,
        },
        normalizedProfileJson: {
          skills: extraction.skills.map((skill) => skill.name),
          languages: extraction.languages,
          educations: extraction.educations,
          certifications: extraction.certifications,
        },
        extractedAt: new Date(),
      },
    });

    if (extraction.skills.length) {
      await tx.candidateSkill.createMany({
        data: extraction.skills.map((skill) => ({
          tenantId,
          candidateId,
          ...skill,
        })),
      });
    }

    if (extraction.experiences.length) {
      await tx.candidateExperience.createMany({
        data: extraction.experiences.map((experience) => ({
          tenantId,
          candidateId,
          ...experience,
        })),
      });
    }

    if (extraction.educations.length) {
      await tx.candidateEducation.createMany({
        data: extraction.educations.map((education) => ({
          tenantId,
          candidateId,
          ...education,
        })),
      });
    }

    if (extraction.certifications.length) {
      await tx.candidateCertification.createMany({
        data: extraction.certifications.map((certification) => ({
          tenantId,
          candidateId,
          ...certification,
        })),
      });
    }

    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        currentHeadline: extraction.currentRole || candidate.currentHeadline,
        yearsOfExperience: extraction.yearsExperience || candidate.yearsOfExperience,
      },
    });

    return tx.candidateResumeProfile.findUnique({
      where: { id: profile.id },
      include: {
        candidate: true,
      },
    });
  });

  await prisma.aiEvaluationRun.update({
    where: { id: run.id },
    data: {
      status: AiRunStatus.COMPLETED,
      completedAt: new Date(),
      modelName: parseMode,
      outputJson: {
        currentRole: extraction.currentRole,
        yearsExperience: extraction.yearsExperience,
        languages: extraction.languages,
        skills: extraction.skills.map((skill) => skill.name),
        parseMode,
      },
    },
  });

  if (candidate.documents[0]) {
    await prisma.aiEvaluationEvidence.create({
      data: {
        tenantId,
        runId: run.id,
        sourceType: ScoreEvidenceSource.CV,
        sourceLabel: extraction.sourceLabel || candidate.documents[0].title,
        sourceDocumentId: candidate.documents[0].id,
        snippet: extraction.evidenceHighlights?.[0] || extraction.sourceText.slice(0, 280),
      },
    });
  }

  return {
    profile: parsedProfile,
    skills: extraction.skills,
    experiences: extraction.experiences,
    educations: extraction.educations,
    certifications: extraction.certifications,
    runId: run.id,
  };
}

async function getCandidateResumeProfile(candidateId, tenantId) {
  await ensureCandidate(candidateId, tenantId);

  const profile = await prisma.candidateResumeProfile.findFirst({
    where: { tenantId, candidateId },
    orderBy: { createdAt: 'desc' },
  });

  const [skills, experiences, educations, certifications] = await Promise.all([
    prisma.candidateSkill.findMany({ where: { tenantId, candidateId }, orderBy: { createdAt: 'asc' } }),
    prisma.candidateExperience.findMany({ where: { tenantId, candidateId }, orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }] }),
    prisma.candidateEducation.findMany({ where: { tenantId, candidateId }, orderBy: { createdAt: 'asc' } }),
    prisma.candidateCertification.findMany({ where: { tenantId, candidateId }, orderBy: { createdAt: 'asc' } }),
  ]);

  return {
    profile,
    skills,
    experiences,
    educations,
    certifications,
  };
}

async function runApplicationScreening(applicationId, tenantId) {
  const application = await ensureApplication(applicationId, tenantId);

  let profile = await prisma.candidateResumeProfile.findFirst({
    where: { tenantId, candidateId: application.candidateId },
    orderBy: { createdAt: 'desc' },
  });

  if (!profile) {
    await parseCandidateResume(application.candidateId, tenantId);
    profile = await prisma.candidateResumeProfile.findFirst({
      where: { tenantId, candidateId: application.candidateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  const [skills, experiences, scorecard] = await Promise.all([
    prisma.candidateSkill.findMany({ where: { tenantId, candidateId: application.candidateId } }),
    prisma.candidateExperience.findMany({ where: { tenantId, candidateId: application.candidateId } }),
    ensureDefaultScorecard(application.jobPostingId, tenantId),
  ]);

  const sourceText = buildSourceText(application.candidate, []);
  const context = {
    sourceText,
    skills,
    languages: profile?.languages || [],
    yearsExperience: Number(profile?.totalYearsExperience || application.candidate.yearsOfExperience || 0),
    profileSummary: profile?.parsedSummary || '',
    candidateSummary: application.candidate.summary || '',
    sourcePreview: sourceText.slice(0, 220),
    experiencesCount: experiences.length,
    departmentName: application.jobPosting.departmentName || '',
    jobTitle: application.jobPosting.title || '',
    currentRole: profile?.currentRole || null,
  };

  let screeningEvaluation = buildHeuristicScreeningEvaluation(scorecard, context);
  let screeningMode = screeningEvaluation.modelName;

  if (isOpenAiAtsEnabled()) {
    try {
      screeningEvaluation = await scoreApplicationWithOpenAi({
        application,
        resumeProfile: profile,
        skills,
        experiences,
        scorecard,
      });
      screeningMode = screeningEvaluation.modelName;
    } catch (error) {
      screeningEvaluation = buildHeuristicScreeningEvaluation(scorecard, context);
      screeningMode = `${screeningEvaluation.modelName} (fallback)`;
    }
  }

  const screeningItems = scorecard.criteria.map((criterion) => {
    const evaluation = (screeningEvaluation.items || []).find((item) => item.criterionCode === criterion.code) || {
      rawScore: 45,
      rationale: 'Le dossier demande une validation humaine complementaire.',
      evidenceSnippet: context.sourcePreview,
    };
    const rawScore = Math.max(0, Math.min(100, Number(evaluation.rawScore || 0)));

    return {
      criterionId: criterion.id,
      label: criterion.label,
      weight: Number(criterion.weight || 0),
      rawScore,
      weightedScore: Number(criterion.weight || 0) > 0 ? Number(((rawScore * Number(criterion.weight || 0)) / 100).toFixed(2)) : null,
      rationale: evaluation.rationale,
      evidenceSource: criterion.evidenceSource,
      evidenceSnippet: evaluation.evidenceSnippet,
      knockout: criterion.knockout,
      minimumScore: criterion.minimumScore !== null && criterion.minimumScore !== undefined ? Number(criterion.minimumScore) : null,
    };
  });

  const knockoutItem = screeningItems.find((item) => item.knockout && item.rawScore < (item.minimumScore ?? 60));
  const totalWeight = screeningItems.reduce((sum, item) => sum + (item.weight || 0), 0);
  const scoreSum = screeningItems.reduce((sum, item) => sum + (item.weightedScore || 0), 0);
  const overallScore = totalWeight > 0 ? Number(((scoreSum / totalWeight) * 100).toFixed(2)) : 0;
  const confidenceScore = Math.max(0, Math.min(100, Number(screeningEvaluation.confidenceScore || 0)));
  const recommendationBase = knockoutItem ? { type: AiRecommendationType.REJECT, decision: AtsDecisionStatus.REJECTED, title: 'A ecarter' } : scoreToDecision(overallScore);

  const run = await prisma.aiEvaluationRun.create({
    data: {
      tenantId,
      candidateId: application.candidateId,
      applicationId,
      runType: AiRunType.ATS_SCREENING,
      status: AiRunStatus.RUNNING,
      modelName: screeningMode,
      promptVersion: 'ats-screening-v1',
      inputSummary: `${application.jobPosting.title} | ${application.candidate.firstName} ${application.candidate.lastName}`,
      startedAt: new Date(),
    },
  });

  const screening = await prisma.$transaction(async (tx) => {
    const current = await tx.applicationScreening.findUnique({
      where: { applicationId },
    });

    const screeningRecord = current
      ? await tx.applicationScreening.update({
        where: { applicationId },
        data: {
          scorecardId: scorecard.id,
          eligibilityPassed: !knockoutItem,
          knockoutReason: knockoutItem ? knockoutItem.label : null,
          overallScore,
          confidenceScore,
          finalDecision: recommendationBase.decision,
          notes: knockoutItem ? `Critere KO: ${knockoutItem.label}` : (screeningEvaluation.summary || 'Screening recalcule.'),
        },
      })
      : await tx.applicationScreening.create({
        data: {
          tenantId,
          applicationId,
          scorecardId: scorecard.id,
          eligibilityPassed: !knockoutItem,
          knockoutReason: knockoutItem ? knockoutItem.label : null,
          overallScore,
          confidenceScore,
          finalDecision: recommendationBase.decision,
          notes: knockoutItem ? `Critere KO: ${knockoutItem.label}` : (screeningEvaluation.summary || 'Screening initial genere.'),
        },
      });

    await tx.applicationScreeningItem.deleteMany({
      where: { screeningId: screeningRecord.id },
    });

    await tx.applicationScreeningItem.createMany({
      data: screeningItems.map((item) => ({
        tenantId,
        screeningId: screeningRecord.id,
        criterionId: item.criterionId,
        label: item.label,
        weight: item.weight,
        rawScore: item.rawScore,
        weightedScore: item.weightedScore,
        rationale: item.rationale,
        evidenceSource: item.evidenceSource,
        evidenceSnippet: item.evidenceSnippet,
      })),
    });

    await tx.aiRecommendation.updateMany({
      where: {
        tenantId,
        applicationId,
        status: AiRecommendationStatus.PROPOSED,
      },
      data: {
        status: AiRecommendationStatus.EXPIRED,
      },
    });

    await tx.aiRecommendation.create({
      data: {
        tenantId,
        runId: run.id,
        applicationId,
        type: recommendationBase.type,
        status: AiRecommendationStatus.PROPOSED,
        score: overallScore,
        title: recommendationBase.title,
        explanation: knockoutItem
          ? `Le dossier ne passe pas le critere eliminatoire: ${knockoutItem.label}.`
          : (screeningEvaluation.summary || `Le score global de ${overallScore} conduit a la recommandation: ${recommendationBase.title}.`),
        decisionRationale: [
          screeningEvaluation.nextAction,
          ...screeningItems.slice(0, 3).map((item) => `${item.label}: ${item.rawScore}/100`),
        ].filter(Boolean).join(' | '),
      },
    });

    await tx.application.update({
      where: { id: applicationId },
      data: {
        atsStatus: recommendationBase.decision,
        atsScore: overallScore,
        cvScore: overallScore,
        finalScore: overallScore,
        scoreCalculatedAt: new Date(),
      },
    });

    return tx.applicationScreening.findUnique({
      where: { id: screeningRecord.id },
      include: {
        scorecard: {
          include: {
            criteria: { orderBy: { orderIndex: 'asc' } },
          },
        },
        items: true,
        application: {
          include: {
            candidate: true,
            jobPosting: true,
            interviews: true,
            offer: true,
          },
        },
      },
    });
  });

  await prisma.aiEvaluationRun.update({
    where: { id: run.id },
    data: {
      status: AiRunStatus.COMPLETED,
      completedAt: new Date(),
      modelName: screeningMode,
      outputJson: {
        overallScore,
        confidenceScore,
        decision: recommendationBase.decision,
        nextAction: screeningEvaluation.nextAction,
        strengths: screeningEvaluation.strengths,
        risks: screeningEvaluation.risks,
        screeningMode,
        items: screeningItems.map((item) => ({
          label: item.label,
          rawScore: item.rawScore,
          weightedScore: item.weightedScore,
        })),
      },
    },
  });

  return screening;
}

async function listApplicationScreenings(params, tenantId) {
  const { page, limit, skip, take } = parsePagination(params);
  const where = { tenantId };

  if (params.applicationId) {
    where.applicationId = params.applicationId;
  }

  const [totalItems, items] = await Promise.all([
    prisma.applicationScreening.count({ where }),
    prisma.applicationScreening.findMany({
      where,
      skip,
      take,
      include: {
        application: {
          include: {
            candidate: true,
            jobPosting: true,
            interviews: true,
            offer: true,
          },
        },
        scorecard: {
          include: {
            criteria: { orderBy: { orderIndex: 'asc' } },
          },
        },
        items: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, totalItems }),
  };
}

async function getApplicationScreeningDetail(applicationId, tenantId) {
  await ensureApplication(applicationId, tenantId);

  return prisma.applicationScreening.findUnique({
    where: { applicationId },
    include: {
      application: {
        include: {
          candidate: true,
          jobPosting: true,
          interviews: true,
          offer: true,
        },
      },
      scorecard: {
        include: {
          criteria: { orderBy: { orderIndex: 'asc' } },
        },
      },
      items: true,
    },
  });
}

async function updateApplicationAtsDecision(applicationId, payload, actorId, tenantId) {
  const application = await ensureApplication(applicationId, tenantId);

  const screening = await prisma.applicationScreening.findUnique({
    where: { applicationId },
  });

  if (!screening) {
    throw new AppError(404, 'Aucun screening ATS n existe encore pour cette candidature.');
  }

  const decisionMap = {
    shortlist: AtsDecisionStatus.SHORTLISTED,
    shortliste: AtsDecisionStatus.SHORTLISTED,
    shortlisted: AtsDecisionStatus.SHORTLISTED,
    reject: AtsDecisionStatus.REJECTED,
    rejected: AtsDecisionStatus.REJECTED,
    review: AtsDecisionStatus.TO_REVIEW,
    hold: AtsDecisionStatus.HOLD,
    test: AtsDecisionStatus.TO_REVIEW,
    interview: AtsDecisionStatus.INTERVIEW_RECOMMENDED,
    offer: AtsDecisionStatus.OFFER_RECOMMENDED,
  };

  const normalizedDecision = decisionMap[normalize(payload.decision)];

  if (!normalizedDecision) {
    throw new AppError(400, 'Decision ATS humaine invalide.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.applicationScreening.update({
      where: { applicationId },
      data: {
        humanDecision: normalizedDecision,
        humanDecisionAt: new Date(),
      },
    });

    await tx.aiRecommendation.updateMany({
      where: {
        tenantId,
        applicationId,
        status: AiRecommendationStatus.PROPOSED,
      },
      data: {
        status: normalizedDecision === screening.finalDecision
          ? AiRecommendationStatus.ACCEPTED
          : AiRecommendationStatus.REJECTED,
        acceptedById: actorId,
        acceptedAt: new Date(),
      },
    });

    await tx.application.update({
      where: { id: applicationId },
      data: {
        atsStatus: normalizedDecision,
      },
    });

    return tx.applicationScreening.findUnique({
      where: { applicationId },
      include: {
        application: {
          include: {
            candidate: true,
            jobPosting: true,
            interviews: true,
            offer: true,
          },
        },
        items: true,
        scorecard: {
          include: {
            criteria: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });
  });

  return updated;
}

async function createAtsApplicationIntake(payload, actorId, tenantId, uploadedFile = null) {
  if (!payload.jobPostingId) {
    throw new AppError(400, 'jobPostingId est obligatoire.');
  }

  await ensureJobPosting(payload.jobPostingId, tenantId);

  if (!payload.firstName || !payload.lastName) {
    throw new AppError(400, 'firstName et lastName sont obligatoires.');
  }

  const normalizedTags = Array.isArray(payload.tags)
    ? uniqueStrings(payload.tags)
    : typeof payload.tags === 'string'
      ? uniqueStrings(payload.tags.split(','))
      : [];

  const candidate = await prisma.candidate.create({
    data: {
      tenantId,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email?.trim()?.toLowerCase() || null,
      phone: payload.phone?.trim() || null,
      source: payload.source || 'OTHER',
      resumeUrl: uploadedFile ? `/uploads/talent/${uploadedFile.filename}` : payload.resumeUrl?.trim() || null,
      summary: payload.summary?.trim() || null,
      tags: normalizedTags,
      currentHeadline: payload.currentHeadline?.trim() || null,
      city: payload.city?.trim() || null,
      country: payload.country?.trim() || null,
      yearsOfExperience: parseOptionalDecimal(payload.yearsOfExperience, 'yearsOfExperience'),
    },
  });

  let document = null;

  if (uploadedFile) {
    document = await prisma.talentDocument.create({
      data: {
        tenantId,
        ownerType: TalentDocumentOwnerType.CANDIDATE,
        category: TalentDocumentCategory.CV,
        candidateId: candidate.id,
        uploadedById: actorId,
        title: 'CV candidat',
        originalName: uploadedFile.originalname,
        storedName: uploadedFile.filename,
        mimeType: uploadedFile.mimetype || null,
        sizeBytes: uploadedFile.size,
        storagePath: uploadedFile.path,
        publicUrl: `/uploads/talent/${uploadedFile.filename}`,
      },
    });
  } else if (payload.resumeUrl) {
    document = await prisma.talentDocument.create({
      data: {
        tenantId,
        ownerType: TalentDocumentOwnerType.CANDIDATE,
        category: TalentDocumentCategory.CV,
        candidateId: candidate.id,
        uploadedById: actorId,
        title: 'CV candidat',
        originalName: payload.resumeOriginalName?.trim() || 'cv-importe',
        storedName: payload.resumeOriginalName?.trim() || 'cv-importe',
        mimeType: payload.resumeMimeType?.trim() || null,
        sizeBytes: Number(payload.resumeSizeBytes || 0),
        storagePath: payload.resumeUrl.trim(),
        publicUrl: payload.resumeUrl.trim(),
      },
    });
  }

  const application = await prisma.application.create({
    data: {
      tenantId,
      jobPostingId: payload.jobPostingId,
      candidateId: candidate.id,
      stage: ApplicationStage.APPLIED,
      status: payload.status || undefined,
      notes: payload.notes?.trim() || null,
    },
  });

  const profile = await parseCandidateResume(candidate.id, tenantId);
  const screening = await runApplicationScreening(application.id, tenantId);

  return {
    candidate,
    application,
    document,
    profile,
    screening,
  };
}

module.exports = {
  createAtsApplicationIntake,
  getCandidateResumeProfile,
  getApplicationScreeningDetail,
  listApplicationScreenings,
  listJobScorecards,
  parseCandidateResume,
  runApplicationScreening,
  saveJobScorecard,
  updateApplicationAtsDecision,
};
