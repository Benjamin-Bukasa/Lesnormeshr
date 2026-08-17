import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  ClipboardList,
  EllipsisVertical,
  LayoutGrid,
  List,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users2,
} from 'lucide-react';
import {
  Button,
  Card,
  ConfirmModal,
  DataTable,
  DropdownSelect,
  Input,
  Sheet,
  StatusBadge,
  useToast,
} from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import { listAdminUsers } from '../services/adminApi';
import {
  createApplication,
  createAtsApplicationIntake,
  createCandidate,
  createOffer,
  deleteCandidate,
  getAtsScreeningDetail,
  getCandidateResumeProfile,
  listApplications,
  listAtsScreenings,
  listCandidates,
  listInterviews,
  listJobPostings,
  listJobScorecards,
  listOffers,
  moveApplicationKanbanPosition,
  parseCandidateResumeProfile,
  runAtsScreening,
  saveDefaultJobScorecard,
  scheduleInterview,
  talentStatusTone,
  updateApplicationStage,
  updateAtsDecision,
  updateCandidate,
  updateInterview,
  updateOfferStatus,
} from '../services/talentAcquisitionApi';

const TABS = [
  { id: 'candidates', label: 'Candidats' },
  { id: 'applications', label: 'Candidatures' },
  { id: 'ats', label: 'ATS & IA' },
  { id: 'interviews', label: 'Entretiens' },
  { id: 'offers', label: "Offres d'embauche" },
];

const SOURCE_OPTIONS = [
  { value: 'CAREER_SITE', label: 'Career site' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'AGENCY', label: 'Agency' },
  { value: 'JOB_BOARD', label: 'Job board' },
  { value: 'SOCIAL_MEDIA', label: 'Social media' },
  { value: 'OTHER', label: 'Autre' },
];

const STAGE_OPTIONS = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'TEST', label: 'Test' },
  { value: 'HR_INTERVIEW', label: 'Entretien RH' },
  { value: 'TECHNICAL_INTERVIEW', label: 'Entretien technique' },
  { value: 'MANAGER_INTERVIEW', label: 'Entretien manager' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'REJECTED', label: 'Rejected' },
];

const APPLICATION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

const INTERVIEW_TYPE_OPTIONS = [
  { value: 'HR', label: 'RH' },
  { value: 'TECHNICAL', label: 'Technique' },
  { value: 'MANAGERIAL', label: 'Managerial' },
  { value: 'FINAL', label: 'Final' },
];

const INTERVIEW_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Planifié' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' },
  { value: 'NO_SHOW', label: 'No show' },
];

const OFFER_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SENT', label: 'Envoyée' },
  { value: 'ACCEPTED', label: 'Acceptée' },
  { value: 'REJECTED', label: 'Rejetée' },
  { value: 'EXPIRED', label: 'Expirée' },
];

const DECISION_OPTIONS = [
  { value: 'shortlist', label: 'Shortlist prioritaire' },
  { value: 'review', label: 'Revue humaine requise' },
  { value: 'test', label: 'Envoyer au test' },
  { value: 'interview', label: 'Programmer entretien' },
  { value: 'reject', label: 'À écarter' },
];

const DEFAULT_SCORECARD_CRITERIA = [
  { code: 'EXPERIENCE', label: 'Expérience métier', weight: 25, minimumScore: 50, knockout: false, description: 'Années d expérience et proximité du parcours.' },
  { code: 'KEY_SKILLS', label: 'Compétences clés', weight: 20, minimumScore: 50, knockout: false, description: 'Compétences attendues par le poste.' },
  { code: 'SECTOR_FIT', label: 'Adéquation secteur', weight: 10, minimumScore: 40, knockout: false, description: 'Connaissance du secteur ou environnement similaire.' },
  { code: 'COMMUNICATION', label: 'Communication écrite', weight: 10, minimumScore: 40, knockout: false, description: 'Capacité à synthétiser et rédiger.' },
  { code: 'LANGUAGE', label: 'Langue de travail', weight: 10, minimumScore: 50, knockout: false, description: 'Niveau de langue requis pour le poste.' },
  { code: 'STABILITY', label: 'Stabilité de parcours', weight: 10, minimumScore: 40, knockout: false, description: 'Cohérence et continuité du parcours.' },
  { code: 'ROLE_MATCH', label: 'Adéquation métier', weight: 15, minimumScore: 50, knockout: false, description: 'Correspondance entre le profil et la mission.' },
];

const EMPTY_CANDIDATE_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  source: 'OTHER',
  resumeUrl: '',
  summary: '',
  tags: '',
};

const EMPTY_APPLICATION_FORM = {
  jobPostingId: '',
  candidateId: '',
  stage: 'APPLIED',
  status: 'ACTIVE',
  score: '',
  notes: '',
};

const EMPTY_INTERVIEW_FORM = {
  applicationId: '',
  interviewerId: '',
  type: 'HR',
  status: 'SCHEDULED',
  scheduledAt: '',
  location: '',
  meetingLink: '',
  feedback: '',
  score: '',
};

const EMPTY_OFFER_FORM = {
  applicationId: '',
  salaryAmount: '',
  currency: 'USD',
  proposedStartDate: '',
  status: 'DRAFT',
  notes: '',
};

const EMPTY_ATS_INTAKE_FORM = {
  jobPostingId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  source: 'CAREER_SITE',
  resumeUrl: '',
  resumeOriginalName: '',
  summary: '',
  tags: '',
  currentHeadline: '',
  city: '',
  country: 'RDC',
  yearsOfExperience: '',
  status: 'ACTIVE',
  notes: '',
};

function TextAreaField({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function roundScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Math.round(Number(value));
}

function getRecommendationTone(value) {
  switch (value) {
    case 'Shortlist prioritaire':
    case 'Offre recommandée':
      return 'success';
    case 'Entretien recommandé':
    case 'Test recommandé':
      return 'info';
    case 'Revue humaine requise':
    case 'En attente':
      return 'warning';
    case 'À écarter':
      return 'danger';
    default:
      return 'neutral';
  }
}

function getDecisionLabel(value) {
  switch (value) {
    case 'SHORTLISTED':
      return 'Shortlist prioritaire';
    case 'INTERVIEW_RECOMMENDED':
      return 'Entretien recommandé';
    case 'OFFER_RECOMMENDED':
      return 'Offre recommandée';
    case 'REJECTED':
      return 'À écarter';
    case 'HOLD':
      return 'En attente';
    case 'TO_REVIEW':
    default:
      return 'Revue humaine requise';
  }
}

function buildStrengthsFromItems(items = []) {
  return items
    .filter((item) => Number(item.rawScore || 0) >= 70)
    .sort((left, right) => Number(right.rawScore || 0) - Number(left.rawScore || 0))
    .slice(0, 3)
    .map((item) => `${item.label} : ${item.rationale || 'Critère favorable.'}`);
}

function buildRisksFromItems(items = []) {
  return items
    .filter((item) => Number(item.rawScore || 0) < 60)
    .sort((left, right) => Number(left.rawScore || 0) - Number(right.rawScore || 0))
    .slice(0, 3)
    .map((item) => `${item.label} : ${item.rationale || 'Point de vigilance à confirmer.'}`);
}

function deriveAtsRow(application, interviews, offers, screening = null) {
  const candidateName = `${application.candidate?.firstName || ''} ${application.candidate?.lastName || ''}`.trim() || 'Candidat';
  const relatedInterviews = interviews.filter((item) => item.applicationId === application.id);
  const completedInterviews = relatedInterviews.filter((item) => item.status === 'COMPLETED' && item.score !== null && item.score !== undefined);
  const linkedOffer = offers.find((item) => item.applicationId === application.id) || application.offer || null;
  const hasScreening = Boolean(screening);
  const cvParsed = hasScreening || Boolean(application.candidate?.resumeUrl);

  const cvStatus = hasScreening ? 'Profil CV structuré' : (cvParsed ? 'CV disponible' : 'CV à analyser');
  const cvScore = roundScore(screening?.application?.cvScore ?? application.cvScore ?? application.score ?? (cvParsed ? 70 : 45));
  const testScore = roundScore(
    screening?.application?.testScore
      ?? application.testScore
      ?? (['TEST', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'MANAGER_INTERVIEW', 'OFFER', 'HIRED'].includes(application.stage) ? Math.min(95, (cvScore || 0) + 6) : null),
  );
  const interviewScore = roundScore(
    screening?.application?.interviewScore
      ?? application.interviewScore
      ?? (completedInterviews.length
        ? completedInterviews.reduce((sum, item) => sum + Number(item.score || 0), 0) / completedInterviews.length
        : null),
  );

  const finalScore = roundScore(
    screening?.overallScore
      ?? application.finalScore
      ?? ((cvScore || 0) * 0.35) + ((testScore || 0) * 0.25) + ((interviewScore || 0) * 0.4),
  );

  const recommendation = hasScreening
    ? getDecisionLabel(screening.humanDecision || screening.finalDecision)
    : (
      application.stage === 'REJECTED' || application.status === 'REJECTED'
        ? 'À écarter'
        : linkedOffer?.status === 'ACCEPTED'
          ? 'Offre recommandée'
          : !cvParsed
            ? 'Revue humaine requise'
            : (finalScore || 0) >= 80
              ? 'Shortlist prioritaire'
              : (finalScore || 0) >= 68
                ? 'Entretien recommandé'
                : (testScore || 0) === 0 || testScore === null
                  ? 'Test recommandé'
                  : 'Revue humaine requise'
    );

  const strengths = hasScreening
    ? (buildStrengthsFromItems(screening.items || []).length
      ? buildStrengthsFromItems(screening.items || [])
      : ['Le screening ATS existe déjà, mais les forces doivent encore être confirmées par un recruteur.'])
    : [
      cvParsed ? 'Le dossier contient déjà un CV exploitable.' : 'Le dossier est créé mais le CV n a pas encore été analysé.',
      application.jobPosting?.departmentName ? `Le poste vise le périmètre ${application.jobPosting.departmentName}.` : 'Le périmètre métier doit encore être précisé.',
      completedInterviews.length ? 'Des retours d entretien existent déjà.' : 'Le dossier peut encore être enrichi par un test ou un entretien.',
    ];

  const risks = hasScreening
    ? (buildRisksFromItems(screening.items || []).length
      ? buildRisksFromItems(screening.items || [])
      : ['La recommandation doit encore être validée humainement avant toute décision finale.'])
    : [
      !cvParsed ? 'Le CV doit être analysé avant toute présélection fiable.' : 'La fraicheur et la qualité des expériences doivent encore être confirmées.',
      testScore === null ? 'Aucun résultat de test n est disponible à ce stade.' : 'La cohérence entre test et parcours doit être relue.',
      interviewScore === null ? 'Aucune évaluation d entretien structurée n est encore disponible.' : 'Les retours d entretien doivent être comparés si plusieurs intervieweurs sont impliqués.',
    ];

  const nextAction = hasScreening
    ? (
      screening.humanDecision
        ? `Décision recruteur enregistrée : ${getDecisionLabel(screening.humanDecision)}`
        : recommendation === 'Shortlist prioritaire'
          ? 'Programmer un entretien final'
          : recommendation === 'Entretien recommandé'
            ? 'Passer en entretien ciblé'
            : recommendation === 'Test recommandé'
              ? 'Assigner le test de présélection'
              : recommendation === 'À écarter'
                ? 'Confirmer le rejet avec motif tracé'
                : 'Déclencher une revue humaine'
    )
    : 'Analyser le CV puis lancer le screening ATS';

  return {
    id: application.id,
    application,
    screening,
    candidateId: application.candidateId || application.candidate?.id || '',
    jobPostingId: application.jobPostingId || application.jobPosting?.id || '',
    candidateName,
    jobTitle: application.jobPosting?.title || 'Poste non renseigné',
    stage: application.stage,
    cvStatus,
    cvScore,
    testScore,
    interviewScore,
    finalScore,
    recommendation,
    nextAction,
    strengths,
    risks,
    confidenceScore: screening?.confidenceScore ?? null,
    linkedOffer,
  };
}

function buildScorecardForm(currentScorecard, jobTitle) {
  if (currentScorecard) {
    return {
      name: currentScorecard.name || 'Scorecard ATS',
      description: currentScorecard.description || '',
      criteria: (currentScorecard.criteria || []).map((criterion, index) => ({
        code: criterion.code || `CRIT_${index + 1}`,
        label: criterion.label || '',
        weight: criterion.weight ?? 0,
        minimumScore: criterion.minimumScore ?? '',
        knockout: Boolean(criterion.knockout),
        description: criterion.description || '',
      })),
    };
  }

  return {
    name: `Scorecard ATS - ${jobTitle}`,
    description: 'Scorecard paramétrée par le recruteur pour la présélection ATS.',
    criteria: DEFAULT_SCORECARD_CRITERIA,
  };
}

function formatStageLabel(stage) {
  return STAGE_OPTIONS.find((option) => option.value === stage)?.label || stage || 'Sans etape';
}

const STAGE_SLA_DAYS = {
  APPLIED: 2,
  SCREENING: 3,
  TEST: 4,
  HR_INTERVIEW: 3,
  TECHNICAL_INTERVIEW: 4,
  MANAGER_INTERVIEW: 3,
  OFFER: 5,
  HIRED: 7,
  REJECTED: 2,
};

function moveItem(array, fromIndex, toIndex) {
  const next = [...array];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function sortApplicationsByOrder(applications, orderedIds) {
  const indexMap = new Map(orderedIds.map((id, index) => [id, index]));
  return [...applications].sort((left, right) => {
    const leftIndex = indexMap.has(left.id) ? indexMap.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightIndex = indexMap.has(right.id) ? indexMap.get(right.id) : Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
  });
}

function getStageSlaSnapshot(application) {
  const stage = application.stage || 'APPLIED';
  const slaDays = STAGE_SLA_DAYS[stage] || 3;
  const baseDate = new Date(application.updatedAt || application.createdAt || Date.now());
  const ageDays = Math.max(0, Math.floor((Date.now() - baseDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    slaDays,
    ageDays,
    overdue: ageDays > slaDays,
  };
}

function RecruitmentSelectionInterviews() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('candidates');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [atsDetailLoading, setAtsDetailLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidateDeleteTarget, setCandidateDeleteTarget] = useState(null);
  const [deletingCandidate, setDeletingCandidate] = useState(false);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [atsScreenings, setAtsScreenings] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [sheetState, setSheetState] = useState({ open: false, type: '', record: null });
  const [atsDetail, setAtsDetail] = useState(null);
  const [scorecardState, setScorecardState] = useState({ open: false, jobPostingId: '', scorecardId: '', jobTitle: '' });
  const [scorecardForm, setScorecardForm] = useState({
    name: 'Scorecard ATS',
    description: '',
    criteria: DEFAULT_SCORECARD_CRITERIA,
  });
  const [candidateForm, setCandidateForm] = useState(EMPTY_CANDIDATE_FORM);
  const [applicationForm, setApplicationForm] = useState(EMPTY_APPLICATION_FORM);
  const [interviewForm, setInterviewForm] = useState(EMPTY_INTERVIEW_FORM);
  const [offerForm, setOfferForm] = useState(EMPTY_OFFER_FORM);
  const [atsIntakeForm, setAtsIntakeForm] = useState(EMPTY_ATS_INTAKE_FORM);
  const [atsResumeFile, setAtsResumeFile] = useState(null);
  const [atsDropActive, setAtsDropActive] = useState(false);
  const [applicationsViewMode, setApplicationsViewMode] = useState('list');
  const [draggedApplicationId, setDraggedApplicationId] = useState('');
  const [kanbanDropStage, setKanbanDropStage] = useState('');
  const [kanbanUpdatingId, setKanbanUpdatingId] = useState('');
  const [orderedApplicationIds, setOrderedApplicationIds] = useState([]);
  const [draggedOverApplicationId, setDraggedOverApplicationId] = useState('');

  const candidateOptions = useMemo(
    () => candidates.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName}`.trim() })),
    [candidates],
  );

  const applicationOptions = useMemo(
    () => applications.map((item) => ({
      value: item.id,
      label: `${item.candidate?.firstName || ''} ${item.candidate?.lastName || ''} - ${item.jobPosting?.title || ''}`.trim(),
    })),
    [applications],
  );

  const postingOptions = useMemo(
    () => jobPostings.map((item) => ({ value: item.id, label: `${item.title} - ${item.departmentName}` })),
    [jobPostings],
  );

  const screeningsByApplicationId = useMemo(
    () => new Map(atsScreenings.map((item) => [item.applicationId, item])),
    [atsScreenings],
  );

  const atsRows = useMemo(
    () => applications.map((application) => deriveAtsRow(application, interviews, offers, screeningsByApplicationId.get(application.id) || null)),
    [applications, interviews, offers, screeningsByApplicationId],
  );

  const orderedApplications = useMemo(
    () => sortApplicationsByOrder(applications, orderedApplicationIds),
    [applications, orderedApplicationIds],
  );

  const applicationsKanban = useMemo(
    () => STAGE_OPTIONS.map((stage) => {
      const items = orderedApplications.filter((application) => application.stage === stage.value);
      const scores = items.map((item) => Number(item.score || item.atsScore || 0)).filter((value) => value > 0);
      const overdueCount = items.filter((item) => getStageSlaSnapshot(item).overdue).length;

      return {
        ...stage,
        items,
        count: items.length,
        avgScore: scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null,
        overdueCount,
        slaDays: STAGE_SLA_DAYS[stage.value] || 3,
      };
    }),
    [orderedApplications],
  );

  const refreshAll = async () => {
    const [
      candidatesPayload,
      applicationsPayload,
      interviewsPayload,
      offersPayload,
      postingsPayload,
      usersPayload,
      atsPayload,
    ] = await Promise.all([
      listCandidates(),
      listApplications(),
      listInterviews(),
      listOffers(),
      listJobPostings(),
      listAdminUsers({ page: 1, limit: 100 }).catch(() => ({ users: [] })),
      listAtsScreenings().catch(() => ({ items: [] })),
    ]);

    setCandidates(candidatesPayload.items || []);
    setApplications(applicationsPayload.items || []);
    setInterviews(interviewsPayload.items || []);
    setOffers(offersPayload.items || []);
    setJobPostings(postingsPayload.items || []);
    setAtsScreenings(atsPayload.items || []);
    setUserOptions((usersPayload.users || []).map((user) => ({
      value: user.id,
      label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || user.phone || 'Utilisateur',
    })));
  };

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        await refreshAll();
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Impossible de charger la sélection recrutement.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOrderedApplicationIds((current) => {
      const existingIds = applications.map((item) => item.id);
      const preserved = current.filter((id) => existingIds.includes(id));
      const missing = existingIds.filter((id) => !preserved.includes(id));
      return [...preserved, ...missing];
    });
  }, [applications]);

  const closeSheet = () => {
    if (!saving) {
      setSheetState({ open: false, type: '', record: null });
    }
  };

  const openCreateSheet = (type) => {
    setSheetState({ open: true, type, record: null });
    if (type === 'candidate') setCandidateForm(EMPTY_CANDIDATE_FORM);
    if (type === 'application') setApplicationForm(EMPTY_APPLICATION_FORM);
    if (type === 'interview') setInterviewForm(EMPTY_INTERVIEW_FORM);
    if (type === 'offer') setOfferForm(EMPTY_OFFER_FORM);
    if (type === 'ats-intake') {
      setAtsIntakeForm(EMPTY_ATS_INTAKE_FORM);
      setAtsResumeFile(null);
    }
  };

  const openEditSheet = (type, record) => {
    setSheetState({ open: true, type, record });
    if (type === 'candidate') {
      setCandidateForm({
        firstName: record.firstName || '',
        lastName: record.lastName || '',
        email: record.email || '',
        phone: record.phone || '',
        source: record.source || 'OTHER',
        resumeUrl: record.resumeUrl || '',
        summary: record.summary || '',
        tags: Array.isArray(record.tags) ? record.tags.join(', ') : '',
      });
    }
    if (type === 'application') {
      setApplicationForm({
        jobPostingId: record.jobPostingId || record.jobPosting?.id || '',
        candidateId: record.candidateId || record.candidate?.id || '',
        stage: record.stage || 'APPLIED',
        status: record.status || 'ACTIVE',
        score: record.score ?? '',
        notes: record.notes || '',
      });
    }
    if (type === 'interview') {
      setInterviewForm({
        applicationId: record.applicationId || record.application?.id || '',
        interviewerId: record.interviewerId || record.interviewer?.id || '',
        type: record.type || 'HR',
        status: record.status || 'SCHEDULED',
        scheduledAt: record.scheduledAt ? new Date(record.scheduledAt).toISOString().slice(0, 16) : '',
        location: record.location || '',
        meetingLink: record.meetingLink || '',
        feedback: record.feedback || '',
        score: record.score ?? '',
      });
    }
    if (type === 'offer') {
      setOfferForm({
        applicationId: record.applicationId || record.application?.id || '',
        salaryAmount: record.salaryAmount ?? '',
        currency: record.currency || 'USD',
        proposedStartDate: record.proposedStartDate ? new Date(record.proposedStartDate).toISOString().slice(0, 10) : '',
        status: record.status || 'DRAFT',
        notes: record.notes || '',
      });
    }
  };

  const handleSaveCandidate = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...candidateForm,
        tags: candidateForm.tags.split(',').map((item) => item.trim()).filter(Boolean),
      };
      await (sheetState.record ? updateCandidate(sheetState.record.id, payload) : createCandidate(payload));
      await refreshAll();
      toast.success(sheetState.record ? 'Candidat mis à jour.' : 'Candidat créé.');
      closeSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible d enregistrer le candidat.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!candidateDeleteTarget) return;

    try {
      setDeletingCandidate(true);
      await deleteCandidate(candidateDeleteTarget.id);
      await refreshAll();
      toast.success('Candidat supprime.');
      setCandidateDeleteTarget(null);
    } catch (error) {
      toast.error(error.message || 'Impossible de supprimer le candidat.');
    } finally {
      setDeletingCandidate(false);
    }
  };

  const handleSaveApplication = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = { ...applicationForm, score: applicationForm.score === '' ? undefined : Number(applicationForm.score) };
      await (sheetState.record ? updateApplicationStage(sheetState.record.id, payload) : createApplication(payload));
      await refreshAll();
      toast.success(sheetState.record ? 'Candidature mise à jour.' : 'Candidature créée.');
      closeSheet();
    } catch (error) {
      toast.error(error.message || "Impossible d'enregistrer la candidature.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInterview = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...interviewForm,
        interviewerId: interviewForm.interviewerId || undefined,
        score: interviewForm.score === '' ? undefined : Number(interviewForm.score),
      };
      await (sheetState.record ? updateInterview(sheetState.record.id, payload) : scheduleInterview(payload));
      await refreshAll();
      toast.success(sheetState.record ? 'Entretien mis à jour.' : 'Entretien planifié.');
      closeSheet();
    } catch (error) {
      toast.error(error.message || "Impossible d'enregistrer l'entretien.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOffer = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...offerForm,
        salaryAmount: offerForm.salaryAmount === '' ? undefined : Number(offerForm.salaryAmount),
      };
      await (sheetState.record ? updateOfferStatus(sheetState.record.id, payload) : createOffer(payload));
      await refreshAll();
      toast.success(sheetState.record ? "Offre d'embauche mise à jour." : "Offre d'embauche créée.");
      closeSheet();
    } catch (error) {
      toast.error(error.message || "Impossible d'enregistrer l'offre.");
    } finally {
      setSaving(false);
    }
  };

  const handleAtsResumeFileSelect = (file) => {
    if (!file) {
      setAtsResumeFile(null);
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
    ];

    const hasAllowedMime = allowedTypes.includes(file.type);
    const hasAllowedExtension = /\.(pdf|doc|docx|rtf|txt)$/i.test(file.name || '');

    if (!hasAllowedMime && !hasAllowedExtension) {
      toast.error('Format de CV non pris en charge. Utilise PDF, DOC, DOCX, RTF ou TXT.');
      return;
    }

    setAtsResumeFile(file);
    setAtsIntakeForm((current) => ({
      ...current,
      resumeOriginalName: file.name,
      resumeUrl: '',
    }));
  };

  const handleApplicationDragStart = (applicationId) => {
    setDraggedApplicationId(applicationId);
  };

  const handleApplicationDragEnd = () => {
    setDraggedApplicationId('');
    setKanbanDropStage('');
    setDraggedOverApplicationId('');
  };

  const handleApplicationCardDrop = async (targetApplicationId) => {
    if (!draggedApplicationId || draggedApplicationId === targetApplicationId) {
      setDraggedOverApplicationId('');
      return;
    }

    const sourceApplication = applications.find((item) => item.id === draggedApplicationId);
    const targetApplication = applications.find((item) => item.id === targetApplicationId);

    if (!sourceApplication || !targetApplication) {
      setDraggedOverApplicationId('');
      setDraggedApplicationId('');
      return;
    }

    const sourceIndex = orderedApplicationIds.indexOf(draggedApplicationId);
    const targetIndex = orderedApplicationIds.indexOf(targetApplicationId);

    if (sourceIndex >= 0 && targetIndex >= 0) {
      setOrderedApplicationIds((current) => moveItem(current, current.indexOf(draggedApplicationId), current.indexOf(targetApplicationId)));
    }

    try {
      setKanbanUpdatingId(draggedApplicationId);
      await moveApplicationKanbanPosition(draggedApplicationId, {
        stage: targetApplication.stage,
        beforeApplicationId: targetApplicationId,
      });
      await refreshAll();
      toast.success(`La candidature a été déplacée vers ${formatStageLabel(targetApplication.stage)}.`, {
        title: 'Kanban mis à jour',
      });
    } catch (error) {
      toast.error(error.message || "Impossible de déplacer cette candidature.");
    }

    setDraggedOverApplicationId('');
    setDraggedApplicationId('');
    setKanbanDropStage('');
    setKanbanUpdatingId('');
  };

  const handleApplicationDrop = async (targetStage) => {
    if (!draggedApplicationId) {
      setKanbanDropStage('');
      return;
    }

    const draggedApplication = applications.find((item) => item.id === draggedApplicationId);

    if (!draggedApplication) {
      setDraggedApplicationId('');
      setKanbanDropStage('');
      return;
    }

    if (draggedApplication.stage === targetStage) {
      setDraggedApplicationId('');
      setKanbanDropStage('');
      return;
    }

    try {
      setKanbanUpdatingId(draggedApplicationId);
      const targetStageIds = orderedApplications.filter((item) => item.stage === targetStage).map((item) => item.id);
      setOrderedApplicationIds((current) => {
        const withoutDragged = current.filter((id) => id !== draggedApplicationId);
        if (!targetStageIds.length) {
          return [...withoutDragged, draggedApplicationId];
        }
        const lastTargetId = targetStageIds[targetStageIds.length - 1];
        const insertIndex = withoutDragged.indexOf(lastTargetId);
        if (insertIndex === -1) {
          return [...withoutDragged, draggedApplicationId];
        }
        const next = [...withoutDragged];
        next.splice(insertIndex + 1, 0, draggedApplicationId);
        return next;
      });
      await moveApplicationKanbanPosition(draggedApplicationId, {
        stage: targetStage,
        beforeApplicationId: null,
      });
      await refreshAll();
      toast.success(`La candidature de ${`${draggedApplication.candidate?.firstName || ''} ${draggedApplication.candidate?.lastName || ''}`.trim() || 'ce candidat'} est passée à l'étape ${formatStageLabel(targetStage)}.`, {
        title: 'Étape mise à jour',
      });
    } catch (error) {
      toast.error(error.message || "Impossible de déplacer cette candidature.");
    } finally {
      setDraggedApplicationId('');
      setKanbanDropStage('');
      setKanbanUpdatingId('');
    }
  };

  const handleSaveAtsIntake = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = new FormData();
      Object.entries({
        ...atsIntakeForm,
        resumeOriginalName: atsResumeFile ? atsResumeFile.name : (atsIntakeForm.resumeOriginalName || ''),
      }).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }
        payload.append(key, String(value));
      });

      if (atsResumeFile) {
        payload.append('file', atsResumeFile);
      }

      const created = await createAtsApplicationIntake(payload);
      await refreshAll();
      closeSheet();

      const screeningDetail = created?.application?.id
        ? await getAtsScreeningDetail(created.application.id).catch(() => null)
        : null;
      const profileDetail = created?.candidate?.id
        ? await getCandidateResumeProfile(created.candidate.id).catch(() => null)
        : null;

      if (screeningDetail?.application) {
        setAtsDetail({
          ...deriveAtsRow(screeningDetail.application, interviews, offers, screeningDetail),
          profile: profileDetail,
        });
      }

      setActiveTab('ats');
      toast.success(`Le dossier ATS de ${atsIntakeForm.firstName} ${atsIntakeForm.lastName} a ete cree, parse puis evalue.`, {
        title: 'Intake ATS termine',
      });
    } catch (error) {
      toast.error(error.message || "Impossible d'enregistrer ce dossier ATS.");
    } finally {
      setSaving(false);
    }
  };

  const refreshAtsScreenings = async () => {
    const payload = await listAtsScreenings().catch(() => ({ items: [] }));
    setAtsScreenings(payload.items || []);
  };

  const rerunAtsScreening = async (row) => {
    try {
      await runAtsScreening(row.id);
      await refreshAll();
      toast.success(`Le screening ATS de ${row.candidateName} a été recalculé.`, {
        title: 'Screening mis à jour',
      });
    } catch (error) {
      toast.error(error.message || 'Impossible de recalculer le screening ATS.');
    }
  };

  const handleParseResume = async (row) => {
    try {
      await parseCandidateResumeProfile(row.candidateId);
      await rerunAtsScreening(row);
      toast.success(`Le CV de ${row.candidateName} a été analysé puis évalué.`, {
        title: 'Profil CV structuré',
      });
    } catch (error) {
      toast.error(error.message || 'Impossible de parser le CV de ce candidat.');
    }
  };

  const openAtsDetail = async (row) => {
    try {
      setAtsDetailLoading(true);
      setAtsDetail(row);
      const [screening, profile] = await Promise.all([
        getAtsScreeningDetail(row.id).catch(() => null),
        getCandidateResumeProfile(row.candidateId).catch(() => null),
      ]);

      if (screening) {
        setAtsDetail({
          ...deriveAtsRow(screening.application, interviews, offers, screening),
          profile,
        });
      } else {
        setAtsDetail({
          ...row,
          profile,
        });
      }
    } catch (error) {
      toast.error(error.message || 'Impossible de charger le rapport ATS.');
    } finally {
      setAtsDetailLoading(false);
    }
  };

  const applyRecruiterDecision = async (row, decision) => {
    try {
      await updateAtsDecision(row.id, { decision });

      if (decision === 'test') {
        await updateApplicationStage(row.id, { stage: 'TEST', status: 'ACTIVE' });
      } else if (decision === 'interview') {
        await updateApplicationStage(row.id, { stage: 'HR_INTERVIEW', status: 'ACTIVE' });
      } else if (decision === 'reject') {
        await updateApplicationStage(row.id, { stage: 'REJECTED', status: 'REJECTED' });
      }

      await refreshAll();
      const detail = await getAtsScreeningDetail(row.id).catch(() => null);
      if (detail) {
        setAtsDetail(deriveAtsRow(detail.application, interviews, offers, detail));
      }

      toast.success(`La décision recruteur a été enregistrée pour ${row.candidateName}.`, {
        title: 'Feedback ATS mémorisé',
      });
    } catch (error) {
      toast.error(error.message || 'Impossible d enregistrer la décision recruteur.');
    }
  };

  const openScorecardEditor = async (row) => {
    try {
      const payload = await listJobScorecards(row.jobPostingId);
      const currentScorecard = payload.items?.[0] || null;
      setScorecardForm(buildScorecardForm(currentScorecard, row.jobTitle));
      setScorecardState({
        open: true,
        jobPostingId: row.jobPostingId,
        scorecardId: currentScorecard?.id || '',
        jobTitle: row.jobTitle,
      });
    } catch (error) {
      toast.error(error.message || 'Impossible de charger la scorecard ATS.');
    }
  };

  const updateScorecardCriterion = (index, key, value) => {
    setScorecardForm((current) => ({
      ...current,
      criteria: current.criteria.map((criterion, criterionIndex) =>
        criterionIndex === index ? { ...criterion, [key]: value } : criterion),
    }));
  };

  const addScorecardCriterion = () => {
    setScorecardForm((current) => ({
      ...current,
      criteria: [
        ...current.criteria,
        {
          code: `CRIT_${current.criteria.length + 1}`,
          label: '',
          weight: 10,
          minimumScore: 40,
          knockout: false,
          description: '',
        },
      ],
    }));
  };

  const removeScorecardCriterion = (index) => {
    setScorecardForm((current) => ({
      ...current,
      criteria: current.criteria.filter((_, criterionIndex) => criterionIndex !== index),
    }));
  };

  const handleSaveScorecard = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await saveDefaultJobScorecard(scorecardState.jobPostingId, {
        scorecardId: scorecardState.scorecardId || undefined,
        name: scorecardForm.name,
        description: scorecardForm.description,
        criteria: scorecardForm.criteria.map((criterion) => ({
          ...criterion,
          weight: Number(criterion.weight || 0),
          minimumScore: criterion.minimumScore === '' ? undefined : Number(criterion.minimumScore),
        })),
      });
      setScorecardState({ open: false, jobPostingId: '', scorecardId: '', jobTitle: '' });
      toast.success(`La scorecard ATS du poste ${scorecardState.jobTitle} a été enregistrée.`, {
        title: 'Scorecard mise à jour',
      });
      await refreshAtsScreenings();
    } catch (error) {
      toast.error(error.message || 'Impossible d enregistrer la scorecard ATS.');
    } finally {
      setSaving(false);
    }
  };

  const candidateColumns = [
    {
      header: 'Candidat',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{`${row.firstName} ${row.lastName}`}</p>
          <p className="text-xs text-muted">{row.email || row.phone || '-'}</p>
        </div>
      ),
    },
    { header: 'Source', accessor: 'source' },
    { header: 'Tags', render: (row) => (Array.isArray(row.tags) && row.tags.length ? row.tags.join(', ') : '-') },
    { header: 'Candidatures', render: (row) => row._count?.applications || 0 },
  ];

  const applicationColumns = [
    { header: 'Candidat', render: (row) => `${row.candidate?.firstName || ''} ${row.candidate?.lastName || ''}`.trim() || '-' },
    { header: 'Offre', render: (row) => row.jobPosting?.title || '-' },
    { header: 'Étape', accessor: 'stage' },
    { header: 'Statut', render: (row) => <StatusBadge status={row.status} label={row.status} tone={talentStatusTone(row.status)} /> },
    { header: 'Score', render: (row) => row.score ?? '-' },
  ];

  const interviewColumns = [
    { header: 'Candidat', render: (row) => `${row.application?.candidate?.firstName || ''} ${row.application?.candidate?.lastName || ''}`.trim() || '-' },
    { header: 'Type', accessor: 'type' },
    { header: 'Interviewer', render: (row) => `${row.interviewer?.firstName || ''} ${row.interviewer?.lastName || ''}`.trim() || '-' },
    { header: 'Quand', render: (row) => formatDateTime(row.scheduledAt) },
    { header: 'Statut', render: (row) => <StatusBadge status={row.status} label={row.status} tone={talentStatusTone(row.status)} /> },
  ];

  const offerColumns = [
    { header: 'Candidat', render: (row) => `${row.application?.candidate?.firstName || ''} ${row.application?.candidate?.lastName || ''}`.trim() || '-' },
    { header: 'Poste', render: (row) => row.application?.jobPosting?.title || '-' },
    { header: 'Salaire', render: (row) => row.salaryAmount ? `${row.salaryAmount} ${row.currency || ''}` : '-' },
    { header: 'Démarrage', render: (row) => formatDateTime(row.proposedStartDate) },
    { header: 'Statut', render: (row) => <StatusBadge status={row.status} label={row.status} tone={talentStatusTone(row.status)} /> },
  ];

  const atsColumns = [
    {
      header: 'Candidat',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{row.candidateName}</p>
          <p className="text-xs text-muted">{row.jobTitle}</p>
        </div>
      ),
    },
    { header: 'CV', render: (row) => <StatusBadge status={row.cvStatus} label={row.cvStatus} tone={row.cvStatus.includes('analyser') ? 'warning' : 'info'} showDot={false} /> },
    { header: 'CV score', render: (row) => row.cvScore ?? '-' },
    { header: 'Test', render: (row) => row.testScore ?? '-' },
    { header: 'Entretien', render: (row) => row.interviewScore ?? '-' },
    { header: 'Final', render: (row) => row.finalScore ?? '-' },
    {
      header: 'Recommandation',
      render: (row) => (
        <StatusBadge
          status={row.recommendation}
          label={row.recommendation}
          tone={getRecommendationTone(row.recommendation)}
          showDot={false}
        />
      ),
    },
  ];

  const renderTabContent = () => {
    if (activeTab === 'candidates') {
      return (
        <DataTable
          title="Candidats"
          description={loading ? 'Chargement...' : 'Base candidats et provenance des profils.'}
          columns={candidateColumns}
          data={candidates}
          emptyMessage="Aucun candidat"
          renderActions={(row) => (
            <DropdownAction
              label={<EllipsisVertical size={18} strokeWidth={1.5} />}
              buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
              items={[
                { id: `edit-${row.id}`, label: 'Modifier', onClick: () => openEditSheet('candidate', row) },
                { id: `delete-${row.id}`, label: 'Supprimer', icon: Trash2, variant: 'danger', onClick: () => setCandidateDeleteTarget(row) },
              ]}
            />
          )}
        />
      );
    }

    if (activeTab === 'applications') {
      if (applicationsViewMode === 'kanban') {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
              <div>
                <h3 className="text-base font-semibold text-text">Candidatures</h3>
                <p className="text-sm text-muted">Pipeline visuel par étape pour piloter le recrutement en mode kanban.</p>
              </div>
              <div className="inline-flex rounded-lg border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setApplicationsViewMode('list')}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition hover:bg-secondary"
                >
                  <List size={16} />
                  Liste
                </button>
                <button
                  type="button"
                  onClick={() => setApplicationsViewMode('kanban')}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-on-primary"
                >
                  <LayoutGrid size={16} />
                  Kanban
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-4 2xl:grid-cols-5">
              {applicationsKanban.map((column) => (
                <div
                  key={column.value}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setKanbanDropStage(column.value);
                  }}
                  onDragLeave={() => {
                    if (kanbanDropStage === column.value) {
                      setKanbanDropStage('');
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleApplicationDrop(column.value);
                  }}
                  className={[
                    'rounded-2xl border bg-surface p-3 transition',
                    kanbanDropStage === column.value ? 'border-primary ring-2 ring-primary/20' : 'border-border',
                  ].join(' ')}
                >
                  <div className="mb-3 space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-text">{column.label}</p>
                      <p className="text-xs text-muted">{column.count} dossier(s)</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded-lg border border-border bg-background/70 px-2 py-2 text-center">
                        <p className="text-muted">Score</p>
                        <p className="mt-1 font-semibold text-text">{column.avgScore ?? '-'}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-background/70 px-2 py-2 text-center">
                        <p className="text-muted">SLA</p>
                        <p className="mt-1 font-semibold text-text">{column.slaDays} j</p>
                      </div>
                      <div className={[
                        'rounded-lg border px-2 py-2 text-center',
                        column.overdueCount ? 'border-amber-300 bg-amber-500/10 text-amber-700' : 'border-border bg-background/70 text-text',
                      ].join(' ')}>
                        <p className="text-muted">Retard</p>
                        <p className="mt-1 font-semibold">{column.overdueCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {column.items.length ? column.items.map((row) => (
                      <div
                        key={row.id}
                        draggable
                        onDragStart={() => handleApplicationDragStart(row.id)}
                        onDragEnd={handleApplicationDragEnd}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDraggedOverApplicationId(row.id);
                          setKanbanDropStage(column.value);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleApplicationCardDrop(row.id);
                        }}
                        className={[
                          'rounded-xl border border-border bg-background p-3 shadow-sm transition',
                          draggedApplicationId === row.id ? 'cursor-grabbing opacity-60 ring-2 ring-primary/20' : 'cursor-grab',
                          draggedOverApplicationId === row.id ? 'border-primary ring-2 ring-primary/15' : '',
                          kanbanUpdatingId === row.id ? 'pointer-events-none opacity-50' : '',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-text">{`${row.candidate?.firstName || ''} ${row.candidate?.lastName || ''}`.trim() || 'Candidat'}</p>
                            <p className="mt-1 text-xs text-muted">{row.jobPosting?.title || '-'}</p>
                          </div>
                          <DropdownAction
                            label={<EllipsisVertical size={16} strokeWidth={1.5} />}
                            buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
                            items={[{ id: `edit-${row.id}`, label: 'Mettre à jour étape', onClick: () => openEditSheet('application', row) }]}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <StatusBadge status={row.status} label={row.status} tone={talentStatusTone(row.status)} />
                          <span className="text-xs text-muted">{row.score ?? '-'} / 100</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
                          <span>SLA : {getStageSlaSnapshot(row).slaDays} j</span>
                          <span className={getStageSlaSnapshot(row).overdue ? 'font-medium text-amber-700' : ''}>
                            {getStageSlaSnapshot(row).ageDays} j en cours
                          </span>
                        </div>
                        <p className="mt-3 text-[11px] uppercase tracking-wide text-muted">
                          Glisse cette carte vers une autre étape
                        </p>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-dashed border-border bg-background/60 p-4 text-center text-sm text-muted">
                        Aucune candidature dans cette étape.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <DataTable
          title="Candidatures"
          description="Pipeline de sélection du dépôt à la décision."
          columns={applicationColumns}
          data={applications}
          emptyMessage="Aucune candidature"
          renderActions={(row) => (
            <DropdownAction
              label={<EllipsisVertical size={18} strokeWidth={1.5} />}
              buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
              items={[{ id: `edit-${row.id}`, label: 'Mettre à jour étape', onClick: () => openEditSheet('application', row) }]}
            />
          )}
        />
      );
    }

    if (activeTab === 'ats') {
      const shortlistCount = atsRows.filter((row) => row.recommendation === 'Shortlist prioritaire').length;
      const reviewCount = atsRows.filter((row) => row.recommendation === 'Revue humaine requise').length;
      const interviewReadyCount = atsRows.filter((row) => ['Shortlist prioritaire', 'Entretien recommandé'].includes(row.recommendation)).length;
      const cvToParseCount = atsRows.filter((row) => row.cvStatus === 'CV à analyser').length;
      const screenedCount = atsRows.filter((row) => screeningsByApplicationId.has(row.id)).length;
      const confidenceRows = atsRows.filter((row) => Number(row.confidenceScore || 0) > 0);
      const avgConfidence = confidenceRows.length
        ? Math.round(confidenceRows.reduce((sum, row) => sum + Number(row.confidenceScore || 0), 0) / confidenceRows.length)
        : 0;
      const avgFinalScore = atsRows.length
        ? Math.round(atsRows.reduce((sum, row) => sum + Number(row.finalScore || 0), 0) / atsRows.length)
        : 0;

      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card contentClassName="p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles size={22} />
                </div>
                <div>
                  <p className="text-sm text-muted">Dossiers ATS</p>
                  <p className="text-2xl font-semibold text-text">{atsRows.length}</p>
                </div>
              </div>
            </Card>
            <Card contentClassName="p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted">Shortlist prioritaire</p>
                <p className="text-2xl font-semibold text-text">{shortlistCount}</p>
              </div>
            </Card>
            <Card contentClassName="p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted">Revue humaine</p>
                <p className="text-2xl font-semibold text-text">{reviewCount}</p>
              </div>
            </Card>
            <Card contentClassName="p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted">Score final moyen</p>
                <p className="text-2xl font-semibold text-text">{avgFinalScore}</p>
              </div>
            </Card>
          </div>

          <Card
            title="Bloc ATS et aide IA"
            subtitle="Le score ATS, les preuves et la décision recruteur sont maintenant pilotés par les endpoints backend du module."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Étape 1 et 2</p>
                <p className="mt-2 text-sm text-text">Le parsing CV alimente le profil structuré candidat dès qu un CV est disponible.</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Étape 3 à 5</p>
                <p className="mt-2 text-sm text-text">Le screening compare le profil à une scorecard pondérée et produit une recommandation assistée.</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Étape 6 et 7</p>
                <p className="mt-2 text-sm text-text">Le recruteur garde la main et renvoie son feedback pour enrichir les prochains classements.</p>
              </div>
            </div>
          </Card>

          <Card
            title="Lecture rapide du pipeline ATS"
            subtitle="Ce résumé permet de prioriser les CV à parser, les dossiers à relire et les candidats déjà prêts pour l’étape suivante."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Dossiers scorés</p>
                <p className="mt-2 text-2xl font-semibold text-text">{screenedCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">CV à parser</p>
                <p className="mt-2 text-2xl font-semibold text-text">{cvToParseCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Prêts pour entretien</p>
                <p className="mt-2 text-2xl font-semibold text-text">{interviewReadyCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Confiance moyenne</p>
                <p className="mt-2 text-2xl font-semibold text-text">{avgConfidence || '-'}</p>
              </div>
            </div>
          </Card>

          <DataTable
            title="Workbench ATS"
            description="Analyse les candidatures, relance le parsing, recalcule le screening et ouvre le rapport détaillé par dossier."
            columns={atsColumns}
            data={atsRows}
            emptyMessage="Aucune candidature disponible pour l analyse ATS."
            renderActions={(row) => (
              <DropdownAction
                label={<EllipsisVertical size={18} strokeWidth={1.5} />}
                buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
                items={[
                  { id: `ats-view-${row.id}`, label: 'Voir rapport ATS', onClick: () => openAtsDetail(row) },
                  { id: `ats-parse-${row.id}`, label: 'Parser le CV', onClick: () => handleParseResume(row) },
                  { id: `ats-run-${row.id}`, label: 'Relancer screening', onClick: () => rerunAtsScreening(row) },
                  { id: `ats-scorecard-${row.id}`, label: 'Configurer la scorecard', onClick: () => openScorecardEditor(row) },
                ]}
              />
            )}
          />
        </div>
      );
    }

    if (activeTab === 'interviews') {
      return (
        <DataTable
          title="Entretiens"
          description="Planification, compte rendu et statut des entretiens."
          columns={interviewColumns}
          data={interviews}
          emptyMessage="Aucun entretien"
          renderActions={(row) => (
            <DropdownAction
              label={<EllipsisVertical size={18} strokeWidth={1.5} />}
              buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
              items={[{ id: `edit-${row.id}`, label: 'Modifier', onClick: () => openEditSheet('interview', row) }]}
            />
          )}
        />
      );
    }

    return (
      <DataTable
        title="Offres d'embauche"
        description="Propositions envoyées aux candidats en fin de parcours."
        columns={offerColumns}
        data={offers}
        emptyMessage="Aucune offre d'embauche"
        renderActions={(row) => (
          <DropdownAction
            label={<EllipsisVertical size={18} strokeWidth={1.5} />}
            buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
            items={[{ id: `edit-${row.id}`, label: 'Mettre à jour statut', onClick: () => openEditSheet('offer', row) }]}
          />
        )}
      />
    );
  };

  const sheetMeta = {
    candidate: { title: sheetState.record ? 'Modifier le candidat' : 'Nouveau candidat', description: 'Renseigne les informations principales du profil.' },
    application: { title: sheetState.record ? 'Mettre à jour la candidature' : 'Nouvelle candidature', description: 'Associe un candidat à une offre et initialise le pipeline.' },
    interview: { title: sheetState.record ? "Mettre à jour l'entretien" : 'Planifier un entretien', description: 'Planifie la rencontre et stocke les retours.' },
    offer: { title: sheetState.record ? "Mettre à jour l'offre" : "Nouvelle offre d'embauche", description: 'Prépare la proposition envoyée au candidat retenu.' },
    'ats-intake': { title: 'Nouveau dossier ATS', description: 'Crée la candidature, stocke le CV, lance le parsing IA et génère le screening initial.' },
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card contentClassName="p-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users2 size={22} />
            </div>
            <div>
              <p className="text-sm text-muted">Candidats</p>
              <p className="text-2xl font-semibold text-text">{candidates.length}</p>
            </div>
          </div>
        </Card>
        <Card contentClassName="p-5">
          <div className="space-y-1">
            <p className="text-sm text-muted">Candidatures actives</p>
            <p className="text-2xl font-semibold text-text">{applications.filter((item) => item.status === 'ACTIVE').length}</p>
          </div>
        </Card>
        <Card contentClassName="p-5">
          <div className="space-y-1">
            <p className="text-sm text-muted">Entretiens planifiés</p>
            <p className="text-2xl font-semibold text-text">{interviews.filter((item) => item.status === 'SCHEDULED').length}</p>
          </div>
        </Card>
        <Card contentClassName="p-5">
          <div className="space-y-1">
            <p className="text-sm text-muted">Offres envoyées</p>
            <p className="text-2xl font-semibold text-text">{offers.filter((item) => item.status === 'SENT').length}</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'rounded-md px-3 py-2 text-sm font-medium transition',
                activeTab === tab.id ? 'bg-primary text-on-primary' : 'bg-surface text-text hover:bg-secondary',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {activeTab === 'candidates' ? <Button type="button" onClick={() => openCreateSheet('candidate')}><Plus size={16} />Nouveau candidat</Button> : null}
          {activeTab === 'applications' ? (
            <div className="flex gap-2">
              <div className="inline-flex rounded-lg border border-border bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setApplicationsViewMode('list')}
                  className={[
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition',
                    applicationsViewMode === 'list' ? 'bg-primary text-on-primary' : 'text-muted hover:bg-secondary',
                  ].join(' ')}
                >
                  <List size={16} />
                  Liste
                </button>
                <button
                  type="button"
                  onClick={() => setApplicationsViewMode('kanban')}
                  className={[
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition',
                    applicationsViewMode === 'kanban' ? 'bg-primary text-on-primary' : 'text-muted hover:bg-secondary',
                  ].join(' ')}
                >
                  <LayoutGrid size={16} />
                  Kanban
                </button>
              </div>
              <Button type="button" onClick={() => openCreateSheet('application')}><Plus size={16} />Nouvelle candidature</Button>
            </div>
          ) : null}
          {activeTab === 'ats' ? <Button type="button" onClick={() => openCreateSheet('ats-intake')}><Plus size={16} />Nouveau dossier ATS</Button> : null}
          {activeTab === 'ats' ? <Button type="button" variant="secondary" onClick={refreshAtsScreenings}><Sparkles size={16} />Rafraîchir l ATS</Button> : null}
          {activeTab === 'interviews' ? <Button type="button" onClick={() => openCreateSheet('interview')}><CalendarClock size={16} />Planifier</Button> : null}
          {activeTab === 'offers' ? <Button type="button" onClick={() => openCreateSheet('offer')}><Plus size={16} />Nouvelle offre</Button> : null}
        </div>
      </div>

      {renderTabContent()}

      <Sheet
        open={sheetState.open}
        onClose={closeSheet}
        title={sheetMeta[sheetState.type]?.title || 'Recrutement'}
        description={sheetMeta[sheetState.type]?.description || ''}
        size="lg"
      >
        {sheetState.type === 'ats-intake' ? (
          <form className="space-y-4" onSubmit={handleSaveAtsIntake}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Offre cible</label>
                <DropdownSelect
                  value={atsIntakeForm.jobPostingId}
                  onChange={(value) => setAtsIntakeForm((current) => ({ ...current, jobPostingId: String(value) }))}
                  options={postingOptions}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Source</label>
                <DropdownSelect
                  value={atsIntakeForm.source}
                  onChange={(value) => setAtsIntakeForm((current) => ({ ...current, source: String(value) }))}
                  options={SOURCE_OPTIONS}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Prénom" value={atsIntakeForm.firstName} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, firstName: event.target.value }))} />
              <Input label="Nom" value={atsIntakeForm.lastName} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, lastName: event.target.value }))} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Email" type="email" value={atsIntakeForm.email} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, email: event.target.value }))} />
              <Input label="Téléphone" value={atsIntakeForm.phone} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Intitulé actuel" value={atsIntakeForm.currentHeadline} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, currentHeadline: event.target.value }))} placeholder="Ex. Chargé RH, Recruteur, Comptable..." />
              <Input label="Années d'expérience" type="number" min="0" value={atsIntakeForm.yearsOfExperience} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, yearsOfExperience: event.target.value }))} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Ville" value={atsIntakeForm.city} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, city: event.target.value }))} />
              <Input label="Pays" value={atsIntakeForm.country} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, country: event.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text">CV à téléverser</label>
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setAtsDropActive(true);
                }}
                onDragLeave={() => setAtsDropActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setAtsDropActive(false);
                  handleAtsResumeFileSelect(event.dataTransfer.files?.[0] || null);
                }}
                className={[
                  'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-5 py-8 text-center transition',
                  atsDropActive ? 'border-primary bg-primary/5' : 'border-border bg-background/70 hover:border-primary/50 hover:bg-background',
                ].join(' ')}
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Plus size={22} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-text">
                    {atsResumeFile ? atsResumeFile.name : 'Glisse-dépose ton CV ici'}
                  </p>
                  <p className="text-xs text-muted">
                    ou clique pour sélectionner un fichier PDF, DOC, DOCX, RTF ou TXT.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.rtf,.txt"
                  onChange={(event) => handleAtsResumeFileSelect(event.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <div className="flex items-center justify-between gap-3 text-xs text-muted">
                <p>{atsResumeFile ? 'Le CV local sera prioritaire sur le lien externe.' : 'Option recommandée pour un vrai parsing IA du CV.'}</p>
                {atsResumeFile ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAtsResumeFile(null);
                      setAtsIntakeForm((current) => ({ ...current, resumeOriginalName: '' }));
                    }}
                    className="font-medium text-primary transition hover:opacity-80"
                  >
                    Retirer le fichier
                  </button>
                ) : null}
              </div>
            </div>
            <Input label="Lien CV (optionnel)" value={atsIntakeForm.resumeUrl} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, resumeUrl: event.target.value }))} placeholder="https://.../cv.pdf" />
            <Input label="Nom du fichier CV (si lien)" value={atsIntakeForm.resumeOriginalName} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, resumeOriginalName: event.target.value }))} placeholder="cv-benjamin-kanku.pdf" />
            <Input label="Tags" value={atsIntakeForm.tags} onChange={(event) => setAtsIntakeForm((current) => ({ ...current, tags: event.target.value }))} placeholder="finance, anglais, sourcing, paie" />
            <TextAreaField label="Résumé professionnel" value={atsIntakeForm.summary} onChange={(value) => setAtsIntakeForm((current) => ({ ...current, summary: value }))} placeholder="Missions, compétences, attentes, disponibilité..." />
            <TextAreaField label="Notes recruteur" value={atsIntakeForm.notes} onChange={(value) => setAtsIntakeForm((current) => ({ ...current, notes: value }))} placeholder="Consignes, observations ou contexte d'arrivée du candidat." rows={3} />

            <div className="rounded-xl border border-border bg-background/70 p-4 text-sm text-muted">
              Ce formulaire déclenche les 5 premières étapes du flux ATS :
              création du candidat, création de la candidature, stockage du CV, parsing du profil structuré et screening initial par scorecard.
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeSheet} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Traitement ATS...' : 'Créer et analyser le dossier'}</Button>
            </div>
          </form>
        ) : null}

        {sheetState.type === 'candidate' ? (
          <form className="space-y-4" onSubmit={handleSaveCandidate}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Prénom" value={candidateForm.firstName} onChange={(event) => setCandidateForm((current) => ({ ...current, firstName: event.target.value }))} />
              <Input label="Nom" value={candidateForm.lastName} onChange={(event) => setCandidateForm((current) => ({ ...current, lastName: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Email" type="email" value={candidateForm.email} onChange={(event) => setCandidateForm((current) => ({ ...current, email: event.target.value }))} />
              <Input label="Téléphone" value={candidateForm.phone} onChange={(event) => setCandidateForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">Source</label>
              <DropdownSelect value={candidateForm.source} onChange={(value) => setCandidateForm((current) => ({ ...current, source: String(value) }))} options={SOURCE_OPTIONS} />
            </div>
            <Input label="Lien CV" value={candidateForm.resumeUrl} onChange={(event) => setCandidateForm((current) => ({ ...current, resumeUrl: event.target.value }))} />
            <Input label="Tags" value={candidateForm.tags} onChange={(event) => setCandidateForm((current) => ({ ...current, tags: event.target.value }))} placeholder="finance, senior, referral" />
            <TextAreaField label="Résumé" value={candidateForm.summary} onChange={(value) => setCandidateForm((current) => ({ ...current, summary: value }))} placeholder="Profil, expérience, attentes..." />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeSheet} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : sheetState.record ? 'Mettre à jour' : 'Créer le candidat'}</Button>
            </div>
          </form>
        ) : null}

        {sheetState.type === 'application' ? (
          <form className="space-y-4" onSubmit={handleSaveApplication}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Candidat</label>
                <DropdownSelect value={applicationForm.candidateId} onChange={(value) => setApplicationForm((current) => ({ ...current, candidateId: String(value) }))} options={candidateOptions} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Offre</label>
                <DropdownSelect value={applicationForm.jobPostingId} onChange={(value) => setApplicationForm((current) => ({ ...current, jobPostingId: String(value) }))} options={postingOptions} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Étape</label>
                <DropdownSelect value={applicationForm.stage} onChange={(value) => setApplicationForm((current) => ({ ...current, stage: String(value) }))} options={STAGE_OPTIONS} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Statut</label>
                <DropdownSelect value={applicationForm.status} onChange={(value) => setApplicationForm((current) => ({ ...current, status: String(value) }))} options={APPLICATION_STATUS_OPTIONS} />
              </div>
              <Input label="Score" type="number" min="0" max="100" value={applicationForm.score} onChange={(event) => setApplicationForm((current) => ({ ...current, score: event.target.value }))} />
            </div>
            <TextAreaField label="Notes" value={applicationForm.notes} onChange={(value) => setApplicationForm((current) => ({ ...current, notes: value }))} placeholder="Commentaires de screening, synthèse..." />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeSheet} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : sheetState.record ? 'Mettre à jour' : 'Créer la candidature'}</Button>
            </div>
          </form>
        ) : null}

        {sheetState.type === 'interview' ? (
          <form className="space-y-4" onSubmit={handleSaveInterview}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Candidature</label>
                <DropdownSelect value={interviewForm.applicationId} onChange={(value) => setInterviewForm((current) => ({ ...current, applicationId: String(value) }))} options={applicationOptions} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Interviewer</label>
                <DropdownSelect value={interviewForm.interviewerId} onChange={(value) => setInterviewForm((current) => ({ ...current, interviewerId: String(value) }))} options={[{ value: '', label: 'Non assigné' }, ...userOptions]} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Type</label>
                <DropdownSelect value={interviewForm.type} onChange={(value) => setInterviewForm((current) => ({ ...current, type: String(value) }))} options={INTERVIEW_TYPE_OPTIONS} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Statut</label>
                <DropdownSelect value={interviewForm.status} onChange={(value) => setInterviewForm((current) => ({ ...current, status: String(value) }))} options={INTERVIEW_STATUS_OPTIONS} />
              </div>
              <Input label="Score" type="number" min="0" max="100" value={interviewForm.score} onChange={(event) => setInterviewForm((current) => ({ ...current, score: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Date et heure" type="datetime-local" value={interviewForm.scheduledAt} onChange={(event) => setInterviewForm((current) => ({ ...current, scheduledAt: event.target.value }))} />
              <Input label="Lieu" value={interviewForm.location} onChange={(event) => setInterviewForm((current) => ({ ...current, location: event.target.value }))} />
            </div>
            <Input label="Lien meeting" value={interviewForm.meetingLink} onChange={(event) => setInterviewForm((current) => ({ ...current, meetingLink: event.target.value }))} />
            <TextAreaField label="Feedback" value={interviewForm.feedback} onChange={(value) => setInterviewForm((current) => ({ ...current, feedback: value }))} placeholder="Compte rendu de l entretien." />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeSheet} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : sheetState.record ? 'Mettre à jour' : "Planifier l'entretien"}</Button>
            </div>
          </form>
        ) : null}

        {sheetState.type === 'offer' ? (
          <form className="space-y-4" onSubmit={handleSaveOffer}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Candidature</label>
                <DropdownSelect value={offerForm.applicationId} onChange={(value) => setOfferForm((current) => ({ ...current, applicationId: String(value) }))} options={applicationOptions} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Statut</label>
                <DropdownSelect value={offerForm.status} onChange={(value) => setOfferForm((current) => ({ ...current, status: String(value) }))} options={OFFER_STATUS_OPTIONS} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Salaire" type="number" min="0" value={offerForm.salaryAmount} onChange={(event) => setOfferForm((current) => ({ ...current, salaryAmount: event.target.value }))} />
              <Input label="Devise" value={offerForm.currency} onChange={(event) => setOfferForm((current) => ({ ...current, currency: event.target.value }))} />
              <Input label="Démarrage proposé" type="date" value={offerForm.proposedStartDate} onChange={(event) => setOfferForm((current) => ({ ...current, proposedStartDate: event.target.value }))} />
            </div>
            <TextAreaField label="Notes" value={offerForm.notes} onChange={(value) => setOfferForm((current) => ({ ...current, notes: value }))} placeholder="Commentaire de l offre, conditions et remarques." />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeSheet} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : sheetState.record ? 'Mettre à jour' : "Créer l'offre"}</Button>
            </div>
          </form>
        ) : null}
      </Sheet>

      <Sheet
        open={Boolean(atsDetail)}
        onClose={() => setAtsDetail(null)}
        title={atsDetail ? `Rapport ATS - ${atsDetail.candidateName}` : 'Rapport ATS'}
        description="Analyse structurée du CV, du screening et de la décision recruteur."
        size="lg"
        footer={(
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {atsDetail ? DECISION_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={option.value === 'reject' ? 'danger' : 'secondary'}
                  onClick={() => applyRecruiterDecision(atsDetail, option.value)}
                >
                  {option.label}
                </Button>
              )) : null}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setAtsDetail(null)}>Fermer</Button>
              {atsDetail ? <Button onClick={() => rerunAtsScreening(atsDetail)}><Sparkles size={16} />Relancer le screening</Button> : null}
            </div>
          </div>
        )}
      >
        {atsDetailLoading ? (
          <div className="py-10 text-sm text-muted">Chargement du rapport ATS...</div>
        ) : atsDetail ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">CV</p>
                <p className="mt-2 font-medium text-text">{atsDetail.cvStatus}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Score final</p>
                <p className="mt-2 text-2xl font-semibold text-text">{atsDetail.finalScore ?? '-'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Confiance</p>
                <p className="mt-2 text-2xl font-semibold text-text">{atsDetail.confidenceScore ?? '-'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Recommandation</p>
                <div className="mt-2">
                  <StatusBadge status={atsDetail.recommendation} label={atsDetail.recommendation} tone={getRecommendationTone(atsDetail.recommendation)} showDot={false} />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Prochaine action</p>
                <p className="mt-2 font-medium text-text">{atsDetail.nextAction}</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card title="Forces détectées" contentClassName="p-4">
                <div className="space-y-3">
                  {atsDetail.strengths.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <ShieldCheck size={16} />
                      </span>
                      <p className="text-sm text-text">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Points de vigilance" contentClassName="p-4">
                <div className="space-y-3">
                  {atsDetail.risks.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                        <ClipboardList size={16} />
                      </span>
                      <p className="text-sm text-text">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {Array.isArray(atsDetail.screening?.items) && atsDetail.screening.items.length ? (
              <DataTable
                title="Détail par critère"
                description="Justification de scoring par critère ATS."
                columns={[
                  { header: 'Critère', accessor: 'label' },
                  { header: 'Poids', render: (row) => row.weight ?? '-' },
                  { header: 'Score', render: (row) => row.rawScore ?? '-' },
                  { header: 'Preuve', render: (row) => row.evidenceSnippet || '-' },
                ]}
                data={atsDetail.screening.items}
                emptyMessage="Aucun détail de scoring disponible."
              />
            ) : null}

            {atsDetail.profile?.profile ? (
              <Card
                title="Profil structuré"
                subtitle="Résumé exploitable du CV une fois transformé en données propres."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">Rôle actuel</p>
                    <p className="mt-2 text-sm text-text">{atsDetail.profile.profile.currentRole || 'À confirmer'}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">Années d expérience</p>
                    <p className="mt-2 text-sm text-text">{atsDetail.profile.profile.totalYearsExperience ?? 'À confirmer'}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-4 md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted">Résumé professionnel</p>
                    <p className="mt-2 text-sm text-text">{atsDetail.profile.profile.parsedSummary || 'Aucun résumé disponible.'}</p>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={scorecardState.open}
        onClose={() => setScorecardState({ open: false, jobPostingId: '', scorecardId: '', jobTitle: '' })}
        title={scorecardState.jobTitle ? `Scorecard ATS - ${scorecardState.jobTitle}` : 'Scorecard ATS'}
        description="Définis les critères, poids et règles knockout avant le screening."
        size="lg"
        footer={(
          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={addScorecardCriterion}>
              <Plus size={16} />
              Ajouter un critère
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setScorecardState({ open: false, jobPostingId: '', scorecardId: '', jobTitle: '' })}>Annuler</Button>
              <Button type="submit" form="scorecard-form" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer la scorecard'}</Button>
            </div>
          </div>
        )}
      >
        <form id="scorecard-form" className="space-y-4" onSubmit={handleSaveScorecard}>
          <Input label="Nom" value={scorecardForm.name} onChange={(event) => setScorecardForm((current) => ({ ...current, name: event.target.value }))} />
          <TextAreaField label="Description" value={scorecardForm.description} onChange={(value) => setScorecardForm((current) => ({ ...current, description: value }))} placeholder="Décris les attentes du recruteur et le contexte du poste." />

          <div className="space-y-4">
            {scorecardForm.criteria.map((criterion, index) => (
              <Card key={`${criterion.code}_${index}`} contentClassName="p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input label="Code" value={criterion.code} onChange={(event) => updateScorecardCriterion(index, 'code', event.target.value)} />
                  <Input label="Libellé" value={criterion.label} onChange={(event) => updateScorecardCriterion(index, 'label', event.target.value)} />
                  <Input label="Poids" type="number" min="0" max="100" value={criterion.weight} onChange={(event) => updateScorecardCriterion(index, 'weight', event.target.value)} />
                  <Input label="Score minimum" type="number" min="0" max="100" value={criterion.minimumScore} onChange={(event) => updateScorecardCriterion(index, 'minimumScore', event.target.value)} />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <input
                    id={`knockout_${index}`}
                    type="checkbox"
                    checked={criterion.knockout}
                    onChange={(event) => updateScorecardCriterion(index, 'knockout', event.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <label htmlFor={`knockout_${index}`} className="text-sm text-text">Critère knockout</label>
                  {scorecardForm.criteria.length > 1 ? (
                    <Button variant="ghost" size="sm" onClick={() => removeScorecardCriterion(index)}>Supprimer</Button>
                  ) : null}
                </div>
                <div className="mt-4">
                  <TextAreaField
                    label="Description"
                    value={criterion.description}
                    onChange={(value) => updateScorecardCriterion(index, 'description', value)}
                    placeholder="Précise la logique métier et les attentes du recruteur."
                    rows={3}
                  />
                </div>
              </Card>
            ))}
          </div>
        </form>
      </Sheet>

      <ConfirmModal
        open={Boolean(candidateDeleteTarget)}
        onClose={() => setCandidateDeleteTarget(null)}
        onConfirm={handleDeleteCandidate}
        title="Supprimer le candidat"
        description={candidateDeleteTarget
          ? `Voulez-vous vraiment supprimer ${candidateDeleteTarget.firstName} ${candidateDeleteTarget.lastName} ? Ses candidatures et donnees ATS associees seront egalement supprimees.`
          : ''}
        confirmLabel="Supprimer"
        loading={deletingCandidate}
      />
    </div>
  );
}

export default RecruitmentSelectionInterviews;
