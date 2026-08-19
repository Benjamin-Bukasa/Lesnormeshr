import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, ClipboardList, EllipsisVertical, Plus, Sparkles } from 'lucide-react';
import { Button, Card, DataTable, DropdownSelect, Input, Sheet, StatusBadge, useToast } from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import { listAdminUsers } from '../services/adminApi';
import {
  createJobPosting,
  createRecruitmentRequest,
  listJobPostings,
  listRecruitmentRequests,
  talentStatusTone,
  updateJobPosting,
  updateRecruitmentRequestStatus,
} from '../services/talentAcquisitionApi';

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'TEMPORAIRE', label: 'Temporaire' },
  { value: 'APPRENTISSAGE', label: 'Apprentissage' },
  { value: 'OTHER', label: 'Autre' },
];

const REQUEST_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SUBMITTED', label: 'Soumise' },
  { value: 'APPROVED', label: 'Approuvee' },
  { value: 'REJECTED', label: 'Rejetee' },
  { value: 'CLOSED', label: 'Cloturee' },
];

const POSTING_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'PUBLISHED', label: 'Publiee' },
  { value: 'PAUSED', label: 'En pause' },
  { value: 'CLOSED', label: 'Cloturee' },
  { value: 'ARCHIVED', label: 'Archivee' },
];

const EMPTY_REQUEST_FORM = {
  title: '',
  departmentName: '',
  location: '',
  employmentType: 'CDI',
  headcount: '1',
  budgetAmount: '',
  currency: 'USD',
  targetStartDate: '',
  reason: '',
  status: 'DRAFT',
};

const EMPTY_POSTING_FORM = {
  recruitmentRequestId: '',
  code: '',
  title: '',
  description: '',
  departmentName: '',
  location: '',
  employmentType: 'CDI',
  openings: '1',
  status: 'DRAFT',
  recruiterId: '',
  hiringManagerId: '',
};

function buildPostingFormFromRecord(record = null) {
  if (!record) {
    return EMPTY_POSTING_FORM;
  }

  return {
    recruitmentRequestId: record.recruitmentRequestId || '',
    code: record.code || '',
    title: record.title || '',
    description: record.description || '',
    departmentName: record.departmentName || '',
    location: record.location || '',
    employmentType: record.employmentType || 'CDI',
    openings: String(record.openings || 1),
    status: record.status || 'DRAFT',
    recruiterId: record.recruiterId || record.recruiter?.id || '',
    hiringManagerId: record.hiringManagerId || record.hiringManager?.id || '',
  };
}

function getPostingReadiness(posting) {
  const checklist = [
    { label: 'Demande liée', passed: Boolean(posting.recruitmentRequestId) },
    { label: 'Code d’offre', passed: Boolean(posting.code?.trim()) },
    { label: 'Titre', passed: Boolean(posting.title?.trim()) },
    { label: 'Description détaillée', passed: Boolean(posting.description?.trim() && posting.description.trim().length >= 80) },
    { label: 'Département', passed: Boolean(posting.departmentName?.trim()) },
    { label: 'Localisation', passed: Boolean(posting.location?.trim()) },
    { label: 'Recruteur', passed: Boolean(posting.recruiterId || posting.recruiter?.id) },
    { label: 'Hiring manager', passed: Boolean(posting.hiringManagerId || posting.hiringManager?.id) },
  ];

  const completed = checklist.filter((item) => item.passed).length;
  const score = Math.round((completed / checklist.length) * 100);

  return {
    score,
    checklist,
    missing: checklist.filter((item) => !item.passed).map((item) => item.label),
  };
}

function getReadinessTone(score) {
  if (score >= 85) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

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

function RecruitmentPublication() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [postings, setPostings] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [sheetState, setSheetState] = useState({ open: false, type: '', record: null });
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST_FORM);
  const [postingForm, setPostingForm] = useState(EMPTY_POSTING_FORM);

  const requestOptions = useMemo(
    () => [{ value: '', label: 'Aucune demande liee' }, ...requests.map((item) => ({ value: item.id, label: `${item.title} - ${item.departmentName}` }))],
    [requests],
  );
  const postingReadinessById = useMemo(
    () => new Map(postings.map((posting) => [posting.id, getPostingReadiness(posting)])),
    [postings],
  );
  const publicationPostings = useMemo(
    () => postings.filter((posting) => ['PUBLISHED', 'DRAFT'].includes(posting.status)),
    [postings],
  );
  const publicationOverview = useMemo(() => {
    const enrichedPostings = postings.map((posting) => ({
      ...posting,
      readiness: getPostingReadiness(posting),
    }));
    const sortedByReadiness = [...enrichedPostings].sort((left, right) => right.readiness.score - left.readiness.score);
    const readyToPublishCount = enrichedPostings.filter((posting) => posting.readiness.score >= 85).length;
    const needsAttentionCount = enrichedPostings.filter((posting) => posting.readiness.score < 60).length;

    return {
      bestPosting: sortedByReadiness[0] || null,
      readyToPublishCount,
      needsAttentionCount,
      draftCount: postings.filter((item) => item.status === 'DRAFT').length,
      publishedCount: postings.filter((item) => item.status === 'PUBLISHED').length,
    };
  }, [postings]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        const [requestsPayload, postingsPayload, usersPayload] = await Promise.all([
          listRecruitmentRequests(),
          listJobPostings(),
          listAdminUsers({ page: 1, limit: 100 }).catch(() => ({ users: [] })),
        ]);

        if (cancelled) return;

        setRequests(requestsPayload.items || []);
        setPostings(postingsPayload.items || []);
        setUserOptions((usersPayload.users || []).map((user) => ({
          value: user.id,
          label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || user.phone || 'Utilisateur',
        })));
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Impossible de charger la publication recrutement.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const openRequestSheet = () => {
    setRequestForm(EMPTY_REQUEST_FORM);
    setSheetState({ open: true, type: 'request', record: null });
  };

  const openPostingSheet = (record = null) => {
    setPostingForm(buildPostingFormFromRecord(record));
    setSheetState({ open: true, type: 'posting', record });
  };

  const duplicatePosting = (record) => {
    const duplicatedCode = record.code ? `${record.code}-COPY` : '';
    setPostingForm({
      ...buildPostingFormFromRecord(record),
      code: duplicatedCode,
      status: 'DRAFT',
    });
    setSheetState({ open: true, type: 'posting', record: null });
  };

  const closeSheet = () => {
    if (!saving) {
      setSheetState({ open: false, type: '', record: null });
    }
  };

  const handleCreateRequest = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const created = await createRecruitmentRequest({
        ...requestForm,
        headcount: Number(requestForm.headcount || 1),
        budgetAmount: requestForm.budgetAmount === '' ? undefined : Number(requestForm.budgetAmount),
      });
      setRequests((current) => [created, ...current]);
      toast.success('Demande de recrutement creee.');
      closeSheet();
    } catch (error) {
      toast.error(error.message || 'Impossible de creer la demande.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePosting = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = {
        ...postingForm,
        openings: Number(postingForm.openings || 1),
        recruitmentRequestId: postingForm.recruitmentRequestId || undefined,
        recruiterId: postingForm.recruiterId || undefined,
        hiringManagerId: postingForm.hiringManagerId || undefined,
      };

      const result = sheetState.record
        ? await updateJobPosting(sheetState.record.id, payload)
        : await createJobPosting(payload);

      setPostings((current) => (
        sheetState.record
          ? current.map((item) => (item.id === result.id ? result : item))
          : [result, ...current]
      ));
      toast.success(sheetState.record ? 'Offre de recrutement mise a jour.' : 'Offre de recrutement creee.');
      closeSheet();
    } catch (error) {
      toast.error(error.message || "Impossible d'enregistrer l'offre.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestStatus = async (requestId, status) => {
    try {
      const updated = await updateRecruitmentRequestStatus(requestId, { status });
      setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)));
      toast.success('Statut de la demande mis a jour.');
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre a jour la demande.');
    }
  };

  const handlePostingStatus = async (postingId, status, successLabel) => {
    try {
      const updated = await updateJobPosting(postingId, { status });
      setPostings((current) => current.map((item) => (item.id === postingId ? updated : item)));
      toast.success(successLabel);
    } catch (error) {
      toast.error(error.message || "Impossible de mettre à jour l'offre.");
    }
  };

  const requestColumns = [
    { header: 'Besoin', render: (row) => <div><p className="font-medium text-text">{row.title}</p><p className="text-xs text-muted">{row.departmentName}</p></div> },
    { header: 'Type', accessor: 'employmentType' },
    { header: 'Headcount', accessor: 'headcount' },
    { header: 'Demarrage cible', render: (row) => formatDate(row.targetStartDate) },
    { header: 'Statut', render: (row) => <StatusBadge status={row.status} label={row.status} tone={talentStatusTone(row.status)} /> },
  ];

  const postingColumns = [
    { header: 'Offre', render: (row) => <div><p className="font-medium text-text">{row.title}</p><p className="text-xs text-muted">{row.code}</p></div> },
    { header: 'Departement', accessor: 'departmentName' },
    { header: 'Type', accessor: 'employmentType' },
    { header: 'Ouvertures', accessor: 'openings' },
    {
      header: 'Préparation',
      render: (row) => {
        const readiness = postingReadinessById.get(row.id) || getPostingReadiness(row);

        return (
          <div className="flex items-center gap-2">
            <StatusBadge
              status={`Prêt ${readiness.score}%`}
              label={`${readiness.score}% prêt`}
              tone={getReadinessTone(readiness.score)}
              showDot={false}
            />
            <span className="text-xs text-muted">
              {readiness.missing.length ? `${readiness.missing.length} champ(s) à compléter` : 'Publication prête'}
            </span>
          </div>
        );
      },
    },
    { header: 'Candidatures', render: (row) => row._count?.applications || 0 },
    { header: 'Statut', render: (row) => <StatusBadge status={row.status} label={row.status} tone={talentStatusTone(row.status)} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card contentClassName="p-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ClipboardList size={22} /></div>
            <div><p className="text-sm text-muted">Demandes</p><p className="text-2xl font-semibold text-text">{requests.length}</p></div>
          </div>
        </Card>
        <Card contentClassName="p-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600"><BriefcaseBusiness size={22} /></div>
            <div><p className="text-sm text-muted">Offres actives et brouillons</p><p className="text-2xl font-semibold text-text">{publicationPostings.length}</p></div>
          </div>
        </Card>
        <Card contentClassName="p-5">
          <div className="space-y-1"><p className="text-sm text-muted">Offres publiees</p><p className="text-2xl font-semibold text-text">{postings.filter((item) => item.status === 'PUBLISHED').length}</p></div>
        </Card>
        <Card contentClassName="p-5">
          <div className="space-y-1"><p className="text-sm text-muted">Demandes a valider</p><p className="text-2xl font-semibold text-text">{requests.filter((item) => item.status === 'SUBMITTED').length}</p></div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={openRequestSheet}><Plus size={16} />Nouvelle demande</Button>
        <Button type="button" onClick={() => openPostingSheet()}><Sparkles size={16} />Nouvelle offre</Button>
      </div>

      <Card
        title="Préparation des annonces"
        subtitle="On garde la main sur la qualité de publication avec une vue rapide des champs manquants et du niveau de préparation ATS."
      >
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-xl border border-border bg-background/70 p-4">
            {publicationOverview.bestPosting ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">Offre la plus prête</p>
                    <p className="mt-1 text-lg font-semibold text-text">{publicationOverview.bestPosting.title}</p>
                    <p className="text-sm text-muted">{publicationOverview.bestPosting.departmentName}</p>
                  </div>
                  <StatusBadge
                    status={`Prêt ${publicationOverview.bestPosting.readiness.score}%`}
                    label={`${publicationOverview.bestPosting.readiness.score}% prêt`}
                    tone={getReadinessTone(publicationOverview.bestPosting.readiness.score)}
                    showDot={false}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {publicationOverview.bestPosting.readiness.checklist.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                    >
                      <span className={item.passed ? 'text-emerald-600' : 'text-amber-600'}>
                        <CheckCircle2 size={16} />
                      </span>
                      <span className="text-sm text-text">{item.label}</span>
                    </div>
                  ))}
                </div>

                {publicationOverview.bestPosting.readiness.missing.length ? (
                  <p className="text-sm text-muted">
                    À compléter en priorité : {publicationOverview.bestPosting.readiness.missing.join(', ')}.
                  </p>
                ) : (
                  <p className="text-sm text-muted">
                    Cette offre est prête pour publication. Tu peux la diffuser ou la dupliquer comme modèle.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Aucune offre disponible pour construire un aperçu de préparation.</p>
            )}
          </div>

          <div className="grid gap-3">
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Offres prêtes</p>
              <p className="mt-2 text-2xl font-semibold text-text">{publicationOverview.readyToPublishCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Brouillons</p>
              <p className="mt-2 text-2xl font-semibold text-text">{publicationOverview.draftCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Publiées</p>
              <p className="mt-2 text-2xl font-semibold text-text">{publicationOverview.publishedCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">À revoir</p>
              <p className="mt-2 text-2xl font-semibold text-text">{publicationOverview.needsAttentionCount}</p>
            </div>
          </div>
        </div>
      </Card>

      <DataTable
        title="Demandes de recrutement"
        description={loading ? 'Chargement...' : 'Base des demandes qui alimentent les offres a publier.'}
        columns={requestColumns}
        data={requests}
        emptyMessage="Aucune demande de recrutement"
        renderActions={(row) => (
          <DropdownAction
            label={<EllipsisVertical size={18} strokeWidth={1.5} />}
            buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
            items={[
              { id: `submit-${row.id}`, label: 'Soumettre', onClick: () => handleRequestStatus(row.id, 'SUBMITTED') },
              { id: `approve-${row.id}`, label: 'Approuver', onClick: () => handleRequestStatus(row.id, 'APPROVED') },
              { id: `reject-${row.id}`, label: 'Rejeter', onClick: () => handleRequestStatus(row.id, 'REJECTED') },
              { id: `close-${row.id}`, label: 'Cloturer', onClick: () => handleRequestStatus(row.id, 'CLOSED') },
            ]}
          />
        )}
      />

      <DataTable
        title="Offres publiees et brouillons"
        description={loading ? 'Chargement...' : 'Offres publiees et brouillons chargees depuis la base de donnees.'}
        columns={postingColumns}
        data={publicationPostings}
        emptyMessage="Aucune offre publiee ou brouillon en base"
        renderActions={(row) => (
          <DropdownAction
            label={<EllipsisVertical size={18} strokeWidth={1.5} />}
            buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
            items={[
              { id: `edit-${row.id}`, label: 'Modifier', onClick: () => openPostingSheet(row) },
              { id: `duplicate-${row.id}`, label: 'Dupliquer', onClick: () => duplicatePosting(row) },
              { id: `publish-${row.id}`, label: 'Publier', onClick: () => handlePostingStatus(row.id, 'PUBLISHED', 'Offre publiée.') },
              { id: `pause-${row.id}`, label: 'Mettre en pause', onClick: () => handlePostingStatus(row.id, 'PAUSED', 'Offre mise en pause.') },
              { id: `archive-${row.id}`, label: 'Archiver', onClick: () => handlePostingStatus(row.id, 'ARCHIVED', 'Offre archivée.') },
            ]}
          />
        )}
      />

      <Sheet
        open={sheetState.open}
        onClose={closeSheet}
        title={sheetState.type === 'request' ? 'Nouvelle demande de recrutement' : sheetState.record ? "Modifier l'offre de recrutement" : 'Nouvelle offre de recrutement'}
        description={sheetState.type === 'request' ? 'Formalise le besoin avant publication.' : 'Renseigne les informations de publication et les responsables.'}
        size="lg"
      >
        {sheetState.type === 'request' ? (
          <form className="space-y-4" onSubmit={handleCreateRequest}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Intitule" value={requestForm.title} onChange={(event) => setRequestForm((current) => ({ ...current, title: event.target.value }))} />
              <Input label="Departement" value={requestForm.departmentName} onChange={(event) => setRequestForm((current) => ({ ...current, departmentName: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Localisation" value={requestForm.location} onChange={(event) => setRequestForm((current) => ({ ...current, location: event.target.value }))} />
              <DropdownSelect label="Type d'emploi" value={requestForm.employmentType} onChange={(value) => setRequestForm((current) => ({ ...current, employmentType: String(value) }))} options={EMPLOYMENT_TYPE_OPTIONS} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Headcount" type="number" min="1" value={requestForm.headcount} onChange={(event) => setRequestForm((current) => ({ ...current, headcount: event.target.value }))} />
              <Input label="Budget" type="number" min="0" value={requestForm.budgetAmount} onChange={(event) => setRequestForm((current) => ({ ...current, budgetAmount: event.target.value }))} />
              <Input label="Devise" value={requestForm.currency} onChange={(event) => setRequestForm((current) => ({ ...current, currency: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Demarrage cible" type="date" value={requestForm.targetStartDate} onChange={(event) => setRequestForm((current) => ({ ...current, targetStartDate: event.target.value }))} />
              <DropdownSelect label="Statut" value={requestForm.status} onChange={(value) => setRequestForm((current) => ({ ...current, status: String(value) }))} options={REQUEST_STATUS_OPTIONS} />
            </div>
            <TextAreaField label="Justification" value={requestForm.reason} onChange={(value) => setRequestForm((current) => ({ ...current, reason: value }))} placeholder="Contexte, urgence et objectifs du recrutement." />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeSheet} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Creer la demande'}</Button>
            </div>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleSavePosting}>
            <div className="grid gap-4 md:grid-cols-2">
              <DropdownSelect label="Demande liee" value={postingForm.recruitmentRequestId} onChange={(value) => setPostingForm((current) => ({ ...current, recruitmentRequestId: String(value) }))} options={requestOptions} />
              <Input label="Code" value={postingForm.code} onChange={(event) => setPostingForm((current) => ({ ...current, code: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Titre" value={postingForm.title} onChange={(event) => setPostingForm((current) => ({ ...current, title: event.target.value }))} />
              <Input label="Departement" value={postingForm.departmentName} onChange={(event) => setPostingForm((current) => ({ ...current, departmentName: event.target.value }))} />
            </div>
            <TextAreaField label="Description" value={postingForm.description} onChange={(value) => setPostingForm((current) => ({ ...current, description: value }))} placeholder="Contenu de l'annonce." rows={5} />
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Localisation" value={postingForm.location} onChange={(event) => setPostingForm((current) => ({ ...current, location: event.target.value }))} />
              <DropdownSelect label="Type d'emploi" value={postingForm.employmentType} onChange={(value) => setPostingForm((current) => ({ ...current, employmentType: String(value) }))} options={EMPLOYMENT_TYPE_OPTIONS} />
              <Input label="Ouvertures" type="number" min="1" value={postingForm.openings} onChange={(event) => setPostingForm((current) => ({ ...current, openings: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <DropdownSelect label="Statut" value={postingForm.status} onChange={(value) => setPostingForm((current) => ({ ...current, status: String(value) }))} options={POSTING_STATUS_OPTIONS} />
              <DropdownSelect label="Recruteur" value={postingForm.recruiterId} onChange={(value) => setPostingForm((current) => ({ ...current, recruiterId: String(value) }))} options={[{ value: '', label: 'Non assigne' }, ...userOptions]} />
              <DropdownSelect label="Hiring manager" value={postingForm.hiringManagerId} onChange={(value) => setPostingForm((current) => ({ ...current, hiringManagerId: String(value) }))} options={[{ value: '', label: 'Non assigne' }, ...userOptions]} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeSheet} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : sheetState.record ? 'Mettre a jour' : 'Creer l offre'}</Button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}

export default RecruitmentPublication;
