import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  EllipsisVertical,
  FilePlus2,
  FileText,
  FolderOpen,
  LayoutGrid,
  List,
  Plus,
  Search,
  Upload,
  UserRound,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Card,
  ConfirmModal,
  DropdownSelect,
  Input,
  Sheet,
  StatusBadge,
  useToast,
} from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import {
  deleteEmployeeDocument,
  listEmployeeDocuments,
  listEmployees,
  uploadEmployeeDocument,
  verifyEmployeeDocument,
} from '../services/employeesApi';
import { listDepartments } from '../services/adminApi';

const RUBRIC_STORAGE_KEY = 'lesnormesrh.employee-document-rubrics';

const DEFAULT_RUBRICS = [
  {
    id: 'id_card',
    label: "Pièce d'identité",
    category: 'ID_CARD',
    required: true,
    custom: false,
    description: 'Carte nationale, passeport ou document officiel.',
  },
  {
    id: 'contract',
    label: 'Contrat de travail',
    category: 'CONTRACT',
    required: true,
    custom: false,
    description: 'Contrat initial, renouvellement ou avenant.',
  },
  {
    id: 'diploma',
    label: 'Diplôme',
    category: 'DIPLOMA',
    required: true,
    custom: false,
    description: 'Diplôme, attestation ou certificat académique.',
  },
  {
    id: 'cv',
    label: 'CV',
    category: 'CV',
    required: true,
    custom: false,
    description: 'Curriculum vitae et notes d’entretien.',
  },
  {
    id: 'work_permit',
    label: 'Permis de travail',
    category: 'WORK_PERMIT',
    required: false,
    custom: false,
    description: 'Document d’autorisation légale de travail.',
  },
  {
    id: 'medical_certificate',
    label: 'Certificat médical',
    category: 'MEDICAL_CERTIFICATE',
    required: false,
    custom: false,
    description: 'Certificat d’aptitude ou dossier médical RH.',
  },
  {
    id: 'warning_letter',
    label: 'Avertissement disciplinaire',
    category: 'WARNING_LETTER',
    required: false,
    custom: false,
    description: 'Courriers d’avertissement et de suivi disciplinaire.',
  },
  {
    id: 'disciplinary_action',
    label: 'Action disciplinaire',
    category: 'DISCIPLINARY_ACTION',
    required: false,
    custom: false,
    description: 'Décisions et rapports liés à la discipline.',
  },
  {
    id: 'payslip',
    label: 'Bulletin de paie',
    category: 'PAYSLIP',
    required: false,
    custom: false,
    description: 'Bulletins mensuels ou historiques de paie.',
  },
  {
    id: 'other',
    label: 'Autre',
    category: 'OTHER',
    required: false,
    custom: false,
    description: 'Tout document non classé ailleurs.',
  },
];

const INITIAL_UPLOAD_FORM = {
  employeeId: '',
  category: 'OTHER',
  title: '',
  documentNumber: '',
  issuedBy: '',
  issuedAt: '',
  expiresAt: '',
  file: null,
};

const INITIAL_RUBRIC_FORM = {
  label: '',
  description: '',
  required: false,
};

const VIEW_OPTIONS = [
  { id: 'list', label: 'Vue liste' },
  { id: 'mosaic', label: 'Vue mosaïque' },
];

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

function loadCustomRubrics() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(RUBRIC_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((rubric) => rubric && rubric.label)
      .map((rubric) => ({
        id: String(rubric.id || `custom_${Date.now()}`),
        label: String(rubric.label || '').trim(),
        category: 'OTHER',
        required: Boolean(rubric.required),
        custom: true,
        description: String(rubric.description || '').trim(),
      }));
  } catch (error) {
    return [];
  }
}

function saveCustomRubrics(customRubrics) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(RUBRIC_STORAGE_KEY, JSON.stringify(customRubrics));
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getRubricLabel(document, rubrics) {
  const matchedCustom = rubrics.find(
    (rubric) =>
      rubric.custom
      && normalizeText(rubric.label) === normalizeText(document.title),
  );

  if (matchedCustom) {
    return matchedCustom.label;
  }

  const matchedSystem = rubrics.find(
    (rubric) => !rubric.custom && rubric.category === document.category,
  );

  return matchedSystem?.label || document.title || document.category || 'Document';
}

function documentMatchesRubric(document, rubric) {
  if (rubric.custom) {
    return normalizeText(document.title) === normalizeText(rubric.label);
  }

  return document.category === rubric.category;
}

function buildEmployeesByDepartment(employees, departmentId) {
  return employees.filter((employee) => String(employee.departmentId || '') === String(departmentId || ''));
}

function EmployeesDocuments() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [customRubrics, setCustomRubrics] = useState(() => loadCustomRubrics());
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [rubricSheetOpen, setRubricSheetOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [uploadForm, setUploadForm] = useState(INITIAL_UPLOAD_FORM);
  const [rubricForm, setRubricForm] = useState(INITIAL_RUBRIC_FORM);
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);
  const [isSubmittingRubric, setIsSubmittingRubric] = useState(false);
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        const [departmentPayload, employeePayload, documentPayload] = await Promise.all([
          listDepartments(),
          listEmployees({ limit: 500 }),
          listEmployeeDocuments({ limit: 500 }),
        ]);

        if (cancelled) return;

        setDepartments(departmentPayload.departments || []);
        setEmployees(employeePayload.items || []);
        setDocuments(documentPayload.items || []);
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Impossible de charger les dossiers RH.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    saveCustomRubrics(customRubrics);
  }, [customRubrics]);

  const rubrics = useMemo(() => [...DEFAULT_RUBRICS, ...customRubrics], [customRubrics]);

  const departmentOptions = useMemo(
    () => [
      { value: 'all', label: 'Tous les départements' },
      ...departments.map((department) => ({
        value: department.id,
        label: department.name,
      })),
    ],
    [departments],
  );

  const employeeOptions = useMemo(
    () => employees.map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName} — ${employee.employeeNumber}`,
    })),
    [employees],
  );

  const rubricOptions = useMemo(
    () => rubrics.map((rubric) => ({
      value: rubric.id,
      label: rubric.label,
    })),
    [rubrics],
  );

  const documentsByEmployee = useMemo(() => {
    return documents.reduce((accumulator, document) => {
      const key = String(document.employeeId || 'unknown');
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(document);
      return accumulator;
    }, {});
  }, [documents]);

  const departmentsWithEmployees = useMemo(() => {
    const filteredDepartments = selectedDepartmentId === 'all'
      ? departments
      : departments.filter((department) => department.id === selectedDepartmentId);

    return filteredDepartments
      .map((department) => {
        const departmentEmployees = buildEmployeesByDepartment(employees, department.id).filter((employee) => {
          if (selectedEmployeeId && employee.id !== selectedEmployeeId) {
            return false;
          }

          const searchValue = normalizeText(search);
          if (!searchValue) return true;

          const employeeDocuments = documentsByEmployee[employee.id] || [];
          const haystack = normalizeText([
            department.name,
            department.code,
            employee.employeeNumber,
            employee.firstName,
            employee.lastName,
            employee.department,
            employee.position,
            employeeDocuments.map((document) => [document.title, document.originalName, document.category].join(' ')).join(' '),
          ].join(' '));

          return haystack.includes(searchValue);
        });

        const departmentDocuments = departmentEmployees.flatMap((employee) => documentsByEmployee[employee.id] || []);
        const missingRequired = departmentEmployees.reduce((total, employee) => {
          const employeeDocuments = documentsByEmployee[employee.id] || [];
          const missingCount = rubrics.filter((rubric) => rubric.required && !employeeDocuments.some((document) => documentMatchesRubric(document, rubric))).length;
          return total + missingCount;
        }, 0);

        return {
          ...department,
          employees: departmentEmployees,
          documents: departmentDocuments,
          documentsCount: departmentDocuments.length,
          employeesCount: departmentEmployees.length,
          missingRequired,
        };
      })
      .filter((department) => {
        if (!search.trim()) return true;
        return department.employees.length > 0 || normalizeText([department.name, department.code].join(' ')).includes(normalizeText(search));
      });
  }, [departments, documentsByEmployee, employees, rubrics, search, selectedDepartmentId, selectedEmployeeId]);

  const totalRequiredMissing = useMemo(
    () => departmentsWithEmployees.reduce((total, department) => total + department.missingRequired, 0),
    [departmentsWithEmployees],
  );

  const employeeCount = employees.length;
  const documentCount = documents.length;
  const folderCount = departmentsWithEmployees.length;

  const employeeRows = useMemo(
    () => departmentsWithEmployees.flatMap((department) => department.employees.map((employee) => ({
      ...employee,
      departmentName: department.name,
      departmentCode: department.code,
    }))),
    [departmentsWithEmployees],
  );

  const requiredRubricCount = Math.max(1, rubrics.filter((rubric) => rubric.required).length);

  const completeEmployeeCount = useMemo(
    () => employeeRows.filter((employee) => {
      const employeeDocuments = documentsByEmployee[employee.id] || [];
      return rubrics.filter((rubric) => rubric.required)
        .every((rubric) => employeeDocuments.some((document) => documentMatchesRubric(document, rubric)));
    }).length,
    [documentsByEmployee, employeeRows, rubrics],
  );

  const latestDocument = useMemo(
    () => [...documents].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))[0] || null,
    [documents],
  );

  const getEmployeeCompletion = (employee) => {
    const employeeDocuments = documentsByEmployee[employee.id] || [];
    const completedRequired = rubrics.filter(
      (rubric) => rubric.required && employeeDocuments.some((document) => documentMatchesRubric(document, rubric)),
    ).length;

    return Math.min(100, Math.round((completedRequired / requiredRubricCount) * 100));
  };

  const getEmployeeLastModified = (employee) => {
    const employeeDocuments = documentsByEmployee[employee.id] || [];
    const latest = employeeDocuments.reduce((current, document) => {
      if (!current || new Date(document.createdAt || 0) > new Date(current.createdAt || 0)) {
        return document;
      }
      return current;
    }, null);

    return latest ? formatDate(latest.createdAt) : 'Aucun document';
  };

  const toggleEmployeeDocuments = (employeeId) => {
    setExpandedEmployeeIds((current) => (
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    ));
  };

  const openUploadForEmployee = (employeeId = '') => {
    setSelectedEmployeeId(employeeId);
    setUploadForm({
      ...INITIAL_UPLOAD_FORM,
      employeeId,
    });
    setUploadSheetOpen(true);
  };

  const handleUploadFile = async () => {
    if (!uploadForm.employeeId) {
      toast.error('Sélectionnez un employé.');
      return;
    }

    if (!uploadForm.file) {
      toast.error('Ajoutez un fichier à téléverser.');
      return;
    }

    try {
      setIsSubmittingUpload(true);
      const formData = new FormData();
      formData.append('employeeId', uploadForm.employeeId);
      formData.append('title', uploadForm.title || '');
      formData.append('category', uploadForm.category || 'OTHER');
      formData.append('documentNumber', uploadForm.documentNumber || '');
      formData.append('issuedBy', uploadForm.issuedBy || '');
      formData.append('issuedAt', uploadForm.issuedAt || '');
      formData.append('expiresAt', uploadForm.expiresAt || '');
      formData.append('file', uploadForm.file);

      await uploadEmployeeDocument(uploadForm.employeeId, formData);
      toast.success('Document RH ajouté.');
      setUploadSheetOpen(false);
      setUploadForm(INITIAL_UPLOAD_FORM);
      const documentPayload = await listEmployeeDocuments({ limit: 500 });
      setDocuments(documentPayload.items || []);
    } catch (error) {
      toast.error(error.message || "Impossible d'ajouter le document.");
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  const handleAddRubric = async () => {
    const label = String(rubricForm.label || '').trim();
    if (!label) {
      toast.error('Le nom de la rubrique est requis.');
      return;
    }

    try {
      setIsSubmittingRubric(true);
      const rubric = {
        id: `custom_${Date.now()}`,
        label,
        category: 'OTHER',
        required: Boolean(rubricForm.required),
        custom: true,
        description: String(rubricForm.description || '').trim(),
      };

      setCustomRubrics((current) => [...current, rubric]);
      setRubricSheetOpen(false);
      setRubricForm(INITIAL_RUBRIC_FORM);
      toast.success('Nouvelle rubrique ajoutée.');
    } catch (error) {
      toast.error("Impossible d'ajouter la rubrique.");
    } finally {
      setIsSubmittingRubric(false);
    }
  };

  const handleVerifyDocument = async (documentId) => {
    try {
      const updatedDocument = await verifyEmployeeDocument(documentId);
      setDocuments((current) => current.map((document) => (document.id === updatedDocument.id ? updatedDocument : document)));
      toast.success('Document vérifié.');
    } catch (error) {
      toast.error(error.message || 'Impossible de vérifier le document.');
    }
  };

  const handleDeleteDocument = async () => {
    if (!confirmDeleteId) {
      return;
    }

    try {
      await deleteEmployeeDocument(confirmDeleteId);
      setDocuments((current) => current.filter((document) => document.id !== confirmDeleteId));
      toast.success('Document supprimé.');
      setConfirmDeleteId('');
    } catch (error) {
      toast.error(error.message || 'Impossible de supprimer le document.');
    }
  };

  const openEmployeeUpload = (employeeId) => {
    openUploadForEmployee(employeeId);
  };

  const openDepartmentUpload = (departmentId) => {
    const departmentEmployees = employees.filter((employee) => employee.departmentId === departmentId);
    const firstEmployee = departmentEmployees[0];
    if (!firstEmployee) {
      toast.error('Ajoutez d’abord un employé dans ce département.');
      return;
    }

    openUploadForEmployee(firstEmployee.id);
  };

  const renderEmployeeDocuments = (employee) => {
    const employeeDocuments = documentsByEmployee[employee.id] || [];
    if (!employeeDocuments.length) {
      return (
        <div className="rounded-lg border border-dashed border-border bg-background/80 p-3 text-sm text-muted">
          Aucun document encore rattaché à ce sous-dossier.
        </div>
      );
    }

    return (
      <div className="grid gap-2">
        {employeeDocuments.map((document) => (
          <div
            key={document.id}
            className="grid gap-2 rounded-lg border border-border bg-background p-3 md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={document.status === 'VERIFIED' ? 'valide' : 'en attente'}
                  label={document.status === 'VERIFIED' ? 'Vérifié' : 'En attente'}
                  tone={document.status === 'VERIFIED' ? 'success' : 'warning'}
                />
                <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-medium text-text">
                  {getRubricLabel(document, rubrics)}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-text">{document.title}</p>
              <p className="text-xs text-muted">
                {document.originalName}
                {' · '}
                {document.documentNumber || 'Référence non renseignée'}
                {' · '}
                {formatDate(document.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {document.status !== 'VERIFIED' ? (
                <Button size="sm" variant="secondary" onClick={() => handleVerifyDocument(document.id)}>
                  <CheckCircle2 size={14} />
                  Vérifier
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(document.id)}>
                <Trash2 size={14} />
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEmployeeCard = (employee) => {
    const employeeDocuments = documentsByEmployee[employee.id] || [];
    const missingRequired = rubrics.filter(
      (rubric) => rubric.required && !employeeDocuments.some((document) => documentMatchesRubric(document, rubric)),
    );

    return (
      <div key={employee.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <UserRound size={16} className="text-primary" />
              <h4 className="font-semibold text-text">
                {employee.firstName} {employee.lastName}
              </h4>
            </div>
            <p className="mt-1 text-xs text-muted">
              {employee.employeeNumber}
              {employee.position ? ` · ${employee.position}` : ''}
            </p>
          </div>
          <Button size="sm" variant="primary" onClick={() => openEmployeeUpload(employee.id)}>
            <Upload size={14} />
            Ajouter
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <StatusBadge
            status={employee.status}
            label={employee.status}
            tone={employee.statusTone}
          />
          <span className="rounded-full bg-secondary px-2 py-1 font-medium text-text">
            {employeeDocuments.length} document(s)
          </span>
          {missingRequired.length ? (
            <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-800">
              {missingRequired.length} rubrique(s) manquante(s)
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-800">
              Dossier complet
            </span>
          )}
        </div>

        <div className="mt-3">{renderEmployeeDocuments(employee)}</div>
      </div>
    );
  };

  const uploadSheetFooter = (
    <div className="flex items-center justify-end gap-2">
      <Button variant="secondary" onClick={() => setUploadSheetOpen(false)} disabled={isSubmittingUpload}>
        Annuler
      </Button>
      <Button onClick={handleUploadFile} disabled={isSubmittingUpload}>
        <Upload size={16} />
        {isSubmittingUpload ? 'Téléversement...' : 'Ajouter le document'}
      </Button>
    </div>
  );

  const rubricSheetFooter = (
    <div className="flex items-center justify-end gap-2">
      <Button variant="secondary" onClick={() => setRubricSheetOpen(false)} disabled={isSubmittingRubric}>
        Annuler
      </Button>
      <Button onClick={handleAddRubric} disabled={isSubmittingRubric}>
        <Plus size={16} />
        Ajouter la rubrique
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-text">Dossiers employés</h2>
          <p className="text-sm text-muted">
            Organisez les documents RH par département et par employé.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setRubricSheetOpen(true)}>
            <FilePlus2 size={16} />
            Nouvelle rubrique
          </Button>
          <Button onClick={() => openUploadForEmployee(selectedEmployeeId)}>
            <Upload size={16} />
            Ajouter un document
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(320px,0.82fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading ? (
              <Card contentClassName="p-5 sm:col-span-2">
                <p className="text-sm text-muted">Chargement des dossiers RH...</p>
              </Card>
            ) : departmentsWithEmployees.length ? (
              departmentsWithEmployees.map((department, index) => {
                const folderStyles = [
                  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
                  'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300',
                  'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
                ];

                return (
                  <article
                    key={department.id}
                    className="rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 truncate text-base font-semibold text-text">
                        {department.name}
                      </h3>
                      <DropdownAction
                        label={<EllipsisVertical size={18} strokeWidth={1.5} />}
                        buttonClassName="rounded-lg bg-transparent p-1 text-muted hover:bg-secondary hover:text-text"
                        items={[
                          {
                            id: `upload_department_${department.id}`,
                            label: 'Ajouter un document',
                            icon: Upload,
                            onClick: () => openDepartmentUpload(department.id),
                          },
                          {
                            id: `filter_department_${department.id}`,
                            label: 'Afficher le département',
                            icon: FolderOpen,
                            onClick: () => {
                              setSelectedDepartmentId(department.id);
                              setSelectedEmployeeId('');
                            },
                          },
                        ]}
                      />
                    </div>

                    <div className="mt-8 flex items-end justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${folderStyles[index % folderStyles.length]}`}>
                          <FolderOpen size={24} strokeWidth={1.7} />
                        </span>
                        <div>
                          <p className="text-lg font-semibold text-text">{department.documentsCount}</p>
                          <p className="text-xs text-muted">document(s)</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted">
                        <p>{department.employeesCount} employé(s)</p>
                        <p className="mt-1">{department.code}</p>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <Card contentClassName="p-5 sm:col-span-2">
                <p className="text-sm text-muted">
                  Aucun dossier trouvé. Créez un département dans les paramètres pour générer la structure RH.
                </p>
              </Card>
            )}
          </div>

          <Card
            title="Dossiers employés"
            subtitle="Suivez la complétude des dossiers et ouvrez les documents associés."
          >
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <Input
                className="min-w-[220px] max-w-[320px] flex-1"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un employé ou un document..."
                leftIcon={Search}
              />
              <DropdownSelect
                id="documents-department-filter"
                className="w-[190px] shrink-0"
                label="Département"
                value={selectedDepartmentId}
                onChange={(value) => setSelectedDepartmentId(value)}
                options={departmentOptions}
              />
              <DropdownSelect
                id="documents-employee-filter"
                className="w-[210px] shrink-0"
                label="Employé"
                value={selectedEmployeeId}
                onChange={(value) => setSelectedEmployeeId(value)}
                options={[{ value: '', label: 'Tous les employés' }, ...employeeOptions]}
                placeholder="Tous les employés"
              />
              <div className="shrink-0">
                <div className="inline-flex rounded-lg border border-border bg-background p-1">
                  {VIEW_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      type="button"
                      size="sm"
                      variant={viewMode === option.id ? 'primary' : 'ghost'}
                      className="flex-1 whitespace-nowrap"
                      onClick={() => setViewMode(option.id)}
                    >
                      {option.id === 'list' ? <List size={15} /> : <LayoutGrid size={15} />}
                      {option.id === 'list' ? 'Liste' : 'Mosaïque'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-[720px] w-full text-left text-sm">
                  <thead className="bg-background">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 font-semibold text-text">Employé</th>
                      <th className="px-4 py-3 font-semibold text-text">Dernière mise à jour</th>
                      <th className="px-4 py-3 font-semibold text-text">Complétude</th>
                      <th className="w-16 px-4 py-3 text-right font-semibold text-text">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeRows.length ? employeeRows.map((employee) => {
                      const employeeDocuments = documentsByEmployee[employee.id] || [];
                      const completion = getEmployeeCompletion(employee);
                      const isExpanded = expandedEmployeeIds.includes(employee.id);
                      const initials = `${employee.firstName?.charAt(0) || ''}${employee.lastName?.charAt(0) || ''}`.toUpperCase();

                      return (
                        <React.Fragment key={employee.id}>
                          <tr className="border-b border-border/60 transition hover:bg-background/70">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                  {initials || <UserRound size={15} />}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-text">
                                    {employee.firstName} {employee.lastName}
                                  </p>
                                  <p className="truncate text-xs text-muted">
                                    {employee.employeeNumber} · {employee.departmentName}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted">{getEmployeeLastModified(employee)}</td>
                            <td className="px-4 py-3">
                              <div className="flex min-w-[170px] items-center gap-2">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${completion}%` }}
                                  />
                                </div>
                                <span className="w-10 text-right text-xs font-medium text-text">{completion}%</span>
                              </div>
                              <p className="mt-1 text-xs text-muted">{employeeDocuments.length} document(s)</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownAction
                                label={<EllipsisVertical size={18} strokeWidth={1.5} />}
                                buttonClassName="rounded-lg bg-transparent p-1 text-muted hover:bg-secondary hover:text-text"
                                items={[
                                  {
                                    id: `documents_${employee.id}`,
                                    label: isExpanded ? 'Masquer les documents' : 'Voir les documents',
                                    icon: FileText,
                                    onClick: () => toggleEmployeeDocuments(employee.id),
                                  },
                                  {
                                    id: `upload_${employee.id}`,
                                    label: 'Ajouter un document',
                                    icon: Upload,
                                    onClick: () => openEmployeeUpload(employee.id),
                                  },
                                ]}
                              />
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="border-b border-border/60 bg-background/40">
                              <td colSpan={4} className="px-4 py-4">
                                {renderEmployeeDocuments(employee)}
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    }) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">
                          Aucun employé ne correspond aux filtres sélectionnés.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {employeeRows.length ? employeeRows.map((employee) => renderEmployeeCard(employee)) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted md:col-span-2">
                    Aucun employé ne correspond aux filtres sélectionnés.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4">
          <Card
            title="Ajouter un document"
            action={<span className="rounded-md border border-border px-3 py-1.5 text-xs text-muted">Aujourd'hui</span>}
          >
            <div className="space-y-4">
              <DropdownSelect
                label="Dossier employé"
                value={selectedEmployeeId}
                onChange={(value) => setSelectedEmployeeId(value)}
                options={[{ value: '', label: 'Sélectionner un employé' }, ...employeeOptions]}
                placeholder="Sélectionner un employé"
              />

              <div
                onClick={() => openUploadForEmployee(selectedEmployeeId)}
                className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center transition hover:border-primary/50 hover:bg-primary/5"
              >
                <FilePlus2 size={28} className="mx-auto text-primary" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-text">Déposer un fichier RH</p>
                <p className="mt-1 text-xs text-muted">PDF, JPG ou PNG, jusqu'à 15 MB</p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-4"
                  onClick={(event) => {
                    event.stopPropagation();
                    openUploadForEmployee(selectedEmployeeId);
                  }}
                >
                  Choisir un fichier
                </Button>
              </div>

              {latestDocument ? (
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start gap-3">
                    <FileText size={22} className="mt-0.5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{latestDocument.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {latestDocument.status === 'VERIFIED' ? 'Document vérifié' : 'En attente de vérification'}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-text">
                      {latestDocument.status === 'VERIFIED' ? '100%' : '65%'}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: latestDocument.status === 'VERIFIED' ? '100%' : '65%' }}
                    />
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-background p-3 text-xs text-muted">
                  Les derniers documents ajoutés apparaîtront ici.
                </p>
              )}
            </div>
          </Card>

          <Card
            title="Suivi documentaire"
            action={(
              <Button variant="secondary" size="sm" onClick={() => setRubricSheetOpen(true)}>
                <Plus size={14} />
                Rubrique
              </Button>
            )}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted">Départements</p>
                <p className="mt-1 text-lg font-semibold text-text">{folderCount}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted">Employés complets</p>
                <p className="mt-1 text-lg font-semibold text-text">{completeEmployeeCount}/{employeeCount}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-text">Documents classés</span>
                <span className="text-sm font-semibold text-primary">{documentCount}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${employeeCount ? Math.min(100, Math.round((documentCount / Math.max(employeeCount * requiredRubricCount, 1)) * 100)) : 0}%` }}
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Rubriques suivies</p>
              <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
                {rubrics.map((rubric) => (
                  <div key={rubric.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {rubric.required ? <AlertCircle size={13} className="shrink-0 text-primary" /> : <FolderOpen size={13} className="shrink-0 text-muted" />}
                      <span className="truncate text-xs font-medium text-text">{rubric.label}</span>
                    </div>
                    {rubric.required ? <span className="text-[10px] font-semibold text-primary">Obligatoire</span> : null}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <div className="hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-text">Dossiers employés</h2>
          <p className="text-sm text-muted">
            Classez les documents RH par département et par employé, avec vue liste ou mosaïque.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setRubricSheetOpen(true)}>
            <FilePlus2 size={16} />
            Nouvelle rubrique
          </Button>
          <Button onClick={() => openUploadForEmployee(selectedEmployeeId)}>
            <Upload size={16} />
            Ajouter un document
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card contentClassName="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Départements</p>
          <p className="mt-2 text-2xl font-semibold text-text">{folderCount}</p>
          <p className="mt-1 text-sm text-muted">Dossiers racines créés automatiquement.</p>
        </Card>
        <Card contentClassName="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Employés</p>
          <p className="mt-2 text-2xl font-semibold text-text">{employeeCount}</p>
          <p className="mt-1 text-sm text-muted">Sous-dossiers employés préparés par département.</p>
        </Card>
        <Card contentClassName="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Documents</p>
          <p className="mt-2 text-2xl font-semibold text-text">{documentCount}</p>
          <p className="mt-1 text-sm text-muted">Contrats, diplômes, discipline et plus.</p>
        </Card>
        <Card contentClassName="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Rubriques manquantes</p>
          <p className="mt-2 text-2xl font-semibold text-text">{totalRequiredMissing}</p>
          <p className="mt-1 text-sm text-muted">Pièces obligatoires à compléter sur les dossiers actifs.</p>
        </Card>
      </section>

      <Card
        title="Rubriques RH"
        subtitle="Les rubriques de base sont fournies, et vous pouvez en ajouter une nouvelle quand votre processus RH évolue."
        action={<Button variant="secondary" size="sm" onClick={() => setRubricSheetOpen(true)}><Plus size={14} />Ajouter</Button>}
      >
        <div className="flex flex-wrap gap-2">
          {rubrics.map((rubric) => (
            <span
              key={rubric.id}
              className={[
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
                rubric.required ? 'bg-primary/10 text-primary' : 'bg-secondary text-text',
              ].join(' ')}
            >
              {rubric.required ? <AlertCircle size={12} /> : <FolderOpen size={12} />}
              {rubric.label}
            </span>
          ))}
        </div>
      </Card>

      <Card
        title="Filtres et affichage"
        subtitle="Filtrez par département, recherchez un dossier et changez la présentation."
      >
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un dossier, un employé ou un document..."
            leftIcon={Search}
          />
          <DropdownSelect
            label="Département"
            value={selectedDepartmentId}
            onChange={(value) => setSelectedDepartmentId(value)}
            options={departmentOptions}
          />
          <DropdownSelect
            label="Employé"
            value={selectedEmployeeId}
            onChange={(value) => setSelectedEmployeeId(value)}
            options={[
              { value: '', label: 'Tous les employés' },
              ...employeeOptions,
            ]}
            placeholder="Tous les employés"
          />
          <div className="flex items-end gap-2">
            {VIEW_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={viewMode === option.id ? 'primary' : 'secondary'}
                onClick={() => setViewMode(option.id)}
              >
                {option.id === 'list' ? <List size={16} /> : <LayoutGrid size={16} />}
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card contentClassName="p-6">
          <p className="text-sm text-muted">Chargement des dossiers RH...</p>
        </Card>
      ) : departmentsWithEmployees.length === 0 ? (
        <Card contentClassName="p-6">
          <p className="text-sm text-muted">
            Aucun dossier trouvé. Créez un département dans les paramètres pour générer la structure RH.
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {departmentsWithEmployees.map((department) => (
            <Card
              key={department.id}
              title={department.name}
              subtitle={`${department.code} · ${department.employeesCount} employé(s) · ${department.documentsCount} document(s)`}
              action={(
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openDepartmentUpload(department.id)}>
                    <Upload size={14} />
                    Ajouter un document
                  </Button>
                </div>
              )}
            >
              <div className="space-y-3">
                {department.employees.length ? (
                  department.employees.map((employee) => (
                    <div key={employee.id} className="rounded-xl border border-border bg-background p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <FolderOpen size={16} className="text-primary" />
                            <h4 className="font-semibold text-text">
                              {employee.firstName} {employee.lastName}
                            </h4>
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            {employee.employeeNumber}
                            {employee.position ? ` · ${employee.position}` : ''}
                            {documentsByEmployee[employee.id]?.length ? ` · ${documentsByEmployee[employee.id].length} document(s)` : ''}
                          </p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => openEmployeeUpload(employee.id)}>
                          <Upload size={14} />
                          Dossier employé
                        </Button>
                      </div>
                      <div className="mt-3">{renderEmployeeDocuments(employee)}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
                    Aucun employé dans ce département.
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {departmentsWithEmployees.map((department) => (
            <Card
              key={department.id}
              title={department.name}
              subtitle={`${department.employeesCount} employé(s) · ${department.documentsCount} document(s)`}
              action={(
                <Button size="sm" variant="secondary" onClick={() => openDepartmentUpload(department.id)}>
                  <Upload size={14} />
                  Ajouter
                </Button>
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Building2 size={14} />
                  <span>{department.code}</span>
                  {department.description ? <span>· {department.description}</span> : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {department.employees.length ? department.employees.map((employee) => renderEmployeeCard(employee)) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted md:col-span-2">
                      Aucun employé dans ce département.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      </div>

      <Sheet
        open={uploadSheetOpen}
        onClose={() => setUploadSheetOpen(false)}
        title="Ajouter un document RH"
        description="Rattachez un dossier à un employé, puis organisez-le dans la bonne rubrique."
        footer={uploadSheetFooter}
        size="lg"
      >
        <div className="space-y-4">
          <DropdownSelect
            label="Employé"
            value={uploadForm.employeeId}
            onChange={(value) => setUploadForm((current) => ({ ...current, employeeId: value }))}
            options={employeeOptions}
            placeholder="Choisir un employé"
          />
          <DropdownSelect
            label="Rubrique"
            value={uploadForm.rubricId || ''}
            onChange={(value) => {
              const selectedRubric = rubrics.find((rubric) => rubric.id === value);
              setUploadForm((current) => ({
                ...current,
                rubricId: value,
                category: selectedRubric?.category || 'OTHER',
                title: current.title || selectedRubric?.label || '',
              }));
            }}
            options={rubricOptions}
            placeholder="Choisir une rubrique"
          />
          <Input
            label="Intitulé du document"
            value={uploadForm.title}
            onChange={(event) => setUploadForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Contrat signé, pièce d'identité, diplôme..."
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Numéro de document"
              value={uploadForm.documentNumber}
              onChange={(event) => setUploadForm((current) => ({ ...current, documentNumber: event.target.value }))}
              placeholder="Référence interne"
            />
            <Input
              label="Émis par"
              value={uploadForm.issuedBy}
              onChange={(event) => setUploadForm((current) => ({ ...current, issuedBy: event.target.value }))}
              placeholder="Administration, école, autorité..."
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Date d’émission"
              type="date"
              value={uploadForm.issuedAt}
              onChange={(event) => setUploadForm((current) => ({ ...current, issuedAt: event.target.value }))}
            />
            <Input
              label="Date d’expiration"
              type="date"
              value={uploadForm.expiresAt}
              onChange={(event) => setUploadForm((current) => ({ ...current, expiresAt: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Fichier</label>
            <input
              type="file"
              onChange={(event) => setUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
              className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-white hover:file:bg-primary/90"
            />
          </div>
        </div>
      </Sheet>

      <Sheet
        open={rubricSheetOpen}
        onClose={() => setRubricSheetOpen(false)}
        title="Créer une nouvelle rubrique"
        description="Ajoutez une rubrique supplémentaire pour vos dossiers RH."
        footer={rubricSheetFooter}
      >
        <div className="space-y-4">
          <Input
            label="Nom de la rubrique"
            value={rubricForm.label}
            onChange={(event) => setRubricForm((current) => ({ ...current, label: event.target.value }))}
            placeholder="Exemple : Attestation sur l'honneur"
            required
          />
          <Input
            label="Description"
            value={rubricForm.description}
            onChange={(event) => setRubricForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Brève note sur le contenu attendu"
          />
          <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm text-text">
            <input
              type="checkbox"
              checked={rubricForm.required}
              onChange={(event) => setRubricForm((current) => ({ ...current, required: event.target.checked }))}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Marquer comme rubrique obligatoire
          </label>
          <p className="text-xs text-muted">
            Les rubriques personnalisées sont conservées dans votre navigateur et réutilisées à chaque ouverture.
          </p>
        </div>
      </Sheet>

      <ConfirmModal
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId('')}
        onConfirm={handleDeleteDocument}
        title="Supprimer le document"
        description="Cette suppression retirera définitivement le fichier du dossier RH."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
      />
    </div>
  );
}

export default EmployeesDocuments;
