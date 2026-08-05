import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ChevronDown, Download, Search, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button, Card, Input } from '../ui';
import formatFrenchTypography from '../../utils/frenchTypography';

export const DEFAULT_VALUES = {
  employeeNumber: '',
  firstName: '',
  lastName: '',
  preferredName: '',
  workEmail: '',
  workPhone: '',
  personalEmail: '',
  personalPhone: '',
  dateOfBirth: '',
  hireDate: '',
  probationEndDate: '',
  nationality: '',
  nationalIdNumber: '',
  taxNumber: '',
  socialSecurityNumber: '',
  gender: '',
  maritalStatus: '',
  employmentType: '',
  employeeStatus: '',
  department: '',
  position: '',
  location: '',
  costCenter: '',
  baseSalary: '',
  currency: '',
  payFrequency: '',
  paymentMethod: '',
};

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Homme' },
  { value: 'FEMALE', label: 'Femme' },
  { value: 'OTHER', label: 'Autre' },
  { value: 'UNDISCLOSED', label: 'Non divulgue' },
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Celibataire' },
  { value: 'MARRIED', label: 'Marie(e)' },
  { value: 'DIVORCED', label: 'Divorce(e)' },
  { value: 'WIDOWED', label: 'Veuf(ve)' },
  { value: 'OTHER', label: 'Autre' },
];

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

const EMPLOYEE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'PROBATION', label: 'Probation' },
  { value: 'ON_LEAVE', label: 'En conge' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'ARCHIVED', label: 'Archive' },
];

const DEPARTMENT_OPTIONS = [
  { value: 'rh', label: 'Ressources humaines' },
  { value: 'finance', label: 'Finance' },
  { value: 'it', label: 'Informatique' },
  { value: 'operations', label: 'Operations' },
  { value: 'juridique', label: 'Juridique' },
];

const POSITION_OPTIONS = [
  { value: 'hr_manager', label: 'Responsable RH' },
  { value: 'hr_officer', label: 'Charge RH' },
  { value: 'payroll_manager', label: 'Gestionnaire paie' },
  { value: 'frontend_dev', label: 'Developpeur frontend' },
  { value: 'backend_dev', label: 'Developpeur backend' },
  { value: 'accountant', label: 'Comptable' },
];

const LOCATION_OPTIONS = [
  { value: 'kinshasa_hq', label: 'Kinshasa - Siege' },
  { value: 'kinshasa_gombe', label: 'Kinshasa - Gombe' },
  { value: 'lubumbashi', label: 'Lubumbashi' },
  { value: 'remote', label: 'Remote' },
];

const COST_CENTER_OPTIONS = [
  { value: 'cc-rh', label: 'CC-RH' },
  { value: 'cc-fin', label: 'CC-FIN' },
  { value: 'cc-it', label: 'CC-IT' },
  { value: 'cc-ops', label: 'CC-OPS' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'CDF', label: 'CDF' },
  { value: 'EUR', label: 'EUR' },
];

const PAY_FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'BIMONTHLY', label: 'Bimensuel' },
  { value: 'BIWEEKLY', label: 'Bi-hebdomadaire' },
  { value: 'WEEKLY', label: 'Hebdomadaire' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECK', label: 'Cheque' },
];

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const TEMPLATE_SAMPLE_ROW = {
  Matricule: 'EMP-1001',
  Prenom: 'Jean',
  Nom: 'Mukendi',
  'Nom prefere': 'Jean',
  'Email pro': 'jean.mukendi@entreprise.com',
  'Telephone pro': '+243900000001',
  'Email personnel': 'jean@gmail.com',
  'Telephone personnel': '+243970000001',
  'Date de naissance': '1994-01-15',
  Nationalite: 'Congolaise',
  "Numero piece d'identite": 'AB123456',
  'Numero fiscal': 'A1234567',
  'Numero CNSS/INSS': 'INSS-001',
  Sexe: 'Homme',
  'Situation matrimoniale': 'Marie(e)',
  "Date d'embauche": '2026-04-15',
  'Fin de probation': '2026-07-15',
  'Type de contrat': 'CDI',
  'Statut employe': 'Actif',
  Departement: 'Ressources humaines',
  Poste: 'Responsable RH',
  'Site / Localisation': 'Kinshasa - Siege',
  'Centre de cout': 'CC-RH',
  'Salaire de base': 1500,
  Devise: 'USD',
  'Periodicite de paie': 'Mensuel',
  'Mode de paiement': 'Virement bancaire',
};

const SearchDropdownInput = ({
  label,
  value,
  onChange,
  options = [],
  error,
  required = false,
  placeholder = 'Rechercher...',
}) => {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value],
  );

  useEffect(() => {
    setQuery(selectedOption?.label || '');
  }, [selectedOption]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery(selectedOption?.label || '');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedOption]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return options;
    return options.filter((option) => normalizeText(option.label).includes(normalizedQuery));
  }, [options, query]);

  return (
    <div ref={containerRef} className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-text">
        {formatFrenchTypography(label)}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={formatFrenchTypography(placeholder)}
          className={[
            'w-full rounded-lg border bg-surface py-2.5 pl-10 pr-9 text-text placeholder:text-muted',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
              : 'border-border focus:border-primary focus:ring-ring/30',
          ].join(' ')}
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute inset-y-0 right-2 inline-flex items-center text-muted"
          aria-label={`Afficher les options: ${label}`}
        >
          <ChevronDown size={16} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>

        {isOpen ? (
          <div className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-sm text-text-secondary">{formatFrenchTypography('Aucun resultat')}</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setQuery(option.label);
                    setIsOpen(false);
                  }}
                  className={[
                    'w-full rounded-md px-2 py-2 text-left text-sm transition',
                    option.value === value
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-primary hover:bg-secondary/60',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-1 text-xs text-rose-600">{formatFrenchTypography(error)}</p> : null}
    </div>
  );
};

const FormSection = ({ title, children }) => (
  <section className="space-y-3 rounded-lg border border-border bg-background p-4">
    <h4 className="text-sm font-semibold text-text-primary">{formatFrenchTypography(title)}</h4>
    {children}
  </section>
);

const resolveOptionValue = (options, rawValue) => {
  if (rawValue === null || rawValue === undefined || rawValue === '') return '';
  const normalized = normalizeText(rawValue);
  const matched = options.find(
    (option) =>
      normalizeText(option.value) === normalized
      || normalizeText(option.label) === normalized,
  );
  return matched?.value || '';
};

const toDateInput = (rawValue) => {
  if (!rawValue) return '';

  if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) {
    return rawValue.toISOString().slice(0, 10);
  }

  if (typeof rawValue === 'number') {
    const excelDate = new Date(Math.round((rawValue - 25569) * 86400 * 1000));
    if (!Number.isNaN(excelDate.getTime())) {
      return excelDate.toISOString().slice(0, 10);
    }
  }

  const text = String(rawValue).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return '';
};

const toText = (rawValue) => {
  if (rawValue === null || rawValue === undefined) return '';
  return String(rawValue).trim();
};

const mapImportedRowToFormValues = (row) => {
  const normalizedRow = Object.entries(row || {}).reduce((acc, [key, value]) => {
    acc[normalizeText(key)] = value;
    return acc;
  }, {});

  const read = (...aliases) => {
    for (const alias of aliases) {
      const value = normalizedRow[normalizeText(alias)];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }
    return '';
  };

  const salaryRaw = read('salaire de base', 'basesalary');
  const salaryText = salaryRaw === '' ? '' : String(salaryRaw).replace(',', '.');

  return {
    employeeNumber: toText(read('matricule', 'employee number', 'employeenumber')),
    firstName: toText(read('prenom', 'first name', 'firstname')),
    lastName: toText(read('nom', 'last name', 'lastname')),
    preferredName: toText(read('nom prefere', 'preferred name', 'preferredname')),
    workEmail: toText(read('email pro', 'work email', 'workemail')),
    workPhone: toText(read('telephone pro', 'work phone', 'workphone')),
    personalEmail: toText(read('email personnel', 'personal email', 'personalemail')),
    personalPhone: toText(read('telephone personnel', 'personal phone', 'personalphone')),
    dateOfBirth: toDateInput(read('date de naissance', 'dateofbirth')),
    hireDate: toDateInput(read("date d'embauche", 'hire date', 'hiredate')),
    probationEndDate: toDateInput(read('fin de probation', 'probation end date', 'probationenddate')),
    nationality: toText(read('nationalite', 'nationality')),
    nationalIdNumber: toText(read("numero piece d'identite", 'national id number', 'nationalidnumber')),
    taxNumber: toText(read('numero fiscal', 'tax number', 'taxnumber')),
    socialSecurityNumber: toText(read('numero cnss/inss', 'social security number', 'socialsecuritynumber')),
    gender: resolveOptionValue(GENDER_OPTIONS, read('sexe', 'gender')),
    maritalStatus: resolveOptionValue(MARITAL_STATUS_OPTIONS, read('situation matrimoniale', 'marital status', 'maritalstatus')),
    employmentType: resolveOptionValue(EMPLOYMENT_TYPE_OPTIONS, read('type de contrat', 'employment type', 'employmenttype')),
    employeeStatus: resolveOptionValue(EMPLOYEE_STATUS_OPTIONS, read('statut employe', 'employee status', 'employeestatus')),
    department: resolveOptionValue(DEPARTMENT_OPTIONS, read('departement', 'department')),
    position: resolveOptionValue(POSITION_OPTIONS, read('poste', 'position')),
    location: resolveOptionValue(LOCATION_OPTIONS, read('site / localisation', 'site', 'location')),
    costCenter: resolveOptionValue(COST_CENTER_OPTIONS, read('centre de cout', 'cost center', 'costcenter')),
    baseSalary: salaryText,
    currency: resolveOptionValue(CURRENCY_OPTIONS, read('devise', 'currency')),
    payFrequency: resolveOptionValue(PAY_FREQUENCY_OPTIONS, read('periodicite de paie', 'pay frequency', 'payfrequency')),
    paymentMethod: resolveOptionValue(PAYMENT_METHOD_OPTIONS, read('mode de paiement', 'payment method', 'paymentmethod')),
  };
};

function AddEmployeeForm({
  mode = 'create',
  initialValues = DEFAULT_VALUES,
  onSubmit: onSubmitProp,
  onCancel,
  embedded = false,
  showImportSection = true,
  submitLabel,
  title,
  subtitle,
}) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    reset({
      ...DEFAULT_VALUES,
      ...(initialValues || {}),
    });
  }, [initialValues, reset]);

  const handleFormSubmit = async (values) => {
    if (onSubmitProp) {
      await onSubmitProp(values);
      if (mode === 'create') {
        reset(DEFAULT_VALUES);
        setImportMessage('');
        setImportError('');
      }
      return;
    }

    console.log(mode === 'edit' ? 'Employe a mettre a jour:' : 'Nouveau employe a creer:', values);
    reset(DEFAULT_VALUES);
    setImportMessage('');
    setImportError('');
  };

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([TEMPLATE_SAMPLE_ROW]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employes');
    XLSX.writeFile(workbook, 'template_import_employes.xlsx');
  };

  const handleImportedFile = async (file) => {
    setImportError('');
    setImportMessage('');

    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['xlsx', 'xls', 'csv'];
    if (!allowed.includes(extension || '')) {
      setImportError('Format non supporte. Utilisez un fichier .xlsx, .xls ou .csv.');
      return;
    }

    try {
      const content = await file.arrayBuffer();
      const workbook = XLSX.read(content, {
        type: 'array',
        cellDates: true,
      });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        defval: '',
        raw: true,
      });

      if (!rows.length) {
        setImportError('Le fichier est vide ou ne contient aucune ligne exploitable.');
        return;
      }

      const mappedRows = rows.map(mapImportedRowToFormValues);
      reset({
        ...DEFAULT_VALUES,
        ...mappedRows[0],
      });

      if (mappedRows.length > 1) {
        setImportMessage(`${mappedRows.length} lignes detectees. La premiere ligne a ete chargee dans le formulaire.`);
      } else {
        setImportMessage('Import reussi. Les donnees ont ete chargees dans le formulaire.');
      }
    } catch (error) {
      setImportError("Impossible de lire le fichier. Verifiez le format et les colonnes.");
    }
  };

  const onDrop = async (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    await handleImportedFile(file);
  };

  const formContent = (
    <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
      {showImportSection ? (
        <FormSection title="Import Excel / CSV">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={handleDownloadTemplate}>
              <Download size={16} />
              Template Excel
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              Importer un fichier
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => handleImportedFile(event.target.files?.[0])}
            />
          </div>

          <button
            type="button"
            onDragEnter={() => setIsDragActive(true)}
            onDragLeave={() => setIsDragActive(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              'w-full rounded-lg border-2 border-dashed px-4 py-8 text-center transition',
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface hover:bg-secondary/40',
            ].join(' ')}
          >
            <p className="text-sm font-medium text-text-primary">
              Glissez-deposez un fichier Excel/CSV ici
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              ou cliquez pour selectionner un fichier
            </p>
          </button>

          {importMessage ? (
            <p className="text-xs text-emerald-600">{importMessage}</p>
          ) : null}
          {importError ? (
            <p className="text-xs text-rose-600">{importError}</p>
          ) : null}
        </FormSection>
      ) : null}

      <FormSection title="Identite et contact">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Matricule"
              placeholder="EMP-0001"
              required
              error={errors.employeeNumber?.message}
              {...register('employeeNumber', { required: 'Le matricule est requis' })}
            />
            <Input
              label="Prenom"
              required
              error={errors.firstName?.message}
              {...register('firstName', { required: 'Le prenom est requis' })}
            />
            <Input
              label="Nom"
              required
              error={errors.lastName?.message}
              {...register('lastName', { required: 'Le nom est requis' })}
            />
            <Input
              label="Nom prefere"
              {...register('preferredName')}
            />
            <Input
              label="Email pro"
              type="email"
              required
              error={errors.workEmail?.message}
              {...register('workEmail', {
                required: "L'email professionnel est requis",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email invalide',
                },
              })}
            />
            <Input
              label="Telephone pro"
              required
              error={errors.workPhone?.message}
              {...register('workPhone', { required: 'Le telephone professionnel est requis' })}
            />
            <Input
              label="Email personnel"
              type="email"
              {...register('personalEmail')}
            />
            <Input
              label="Telephone personnel"
              {...register('personalPhone')}
            />
          </div>
      </FormSection>

      <FormSection title="Administratif">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Date de naissance"
              type="date"
              {...register('dateOfBirth')}
            />
            <Input
              label="Nationalite"
              {...register('nationality')}
            />
            <Input
              label="Numero piece d'identite"
              {...register('nationalIdNumber')}
            />
            <Input
              label="Numero fiscal"
              {...register('taxNumber')}
            />
            <Input
              label="Numero CNSS/INSS"
              {...register('socialSecurityNumber')}
            />

            <Controller
              name="gender"
              control={control}
              rules={{ required: 'Le sexe est requis' }}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Sexe"
                  required
                  options={GENDER_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher le sexe..."
                />
              )}
            />

            <Controller
              name="maritalStatus"
              control={control}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Situation matrimoniale"
                  options={MARITAL_STATUS_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher la situation..."
                />
              )}
            />
          </div>
      </FormSection>

      <FormSection title="Organisation et contrat">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Date d'embauche"
              type="date"
              required
              error={errors.hireDate?.message}
              {...register('hireDate', { required: "La date d'embauche est requise" })}
            />
            <Input
              label="Fin de probation"
              type="date"
              {...register('probationEndDate')}
            />

            <Controller
              name="employmentType"
              control={control}
              rules={{ required: 'Le type de contrat est requis' }}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Type de contrat"
                  required
                  options={EMPLOYMENT_TYPE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher le type..."
                />
              )}
            />

            <Controller
              name="employeeStatus"
              control={control}
              rules={{ required: 'Le statut employe est requis' }}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Statut employe"
                  required
                  options={EMPLOYEE_STATUS_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher le statut..."
                />
              )}
            />

            <Controller
              name="department"
              control={control}
              rules={{ required: 'Le departement est requis' }}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Departement"
                  required
                  options={DEPARTMENT_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher le departement..."
                />
              )}
            />

            <Controller
              name="position"
              control={control}
              rules={{ required: 'Le poste est requis' }}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Poste"
                  required
                  options={POSITION_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher le poste..."
                />
              )}
            />

            <Controller
              name="location"
              control={control}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Site / Localisation"
                  options={LOCATION_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher le site..."
                />
              )}
            />

            <Controller
              name="costCenter"
              control={control}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Centre de cout"
                  options={COST_CENTER_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher le centre..."
                />
              )}
            />
          </div>
      </FormSection>

      <FormSection title="Paie">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Salaire de base"
              type="number"
              step="0.01"
              required
              error={errors.baseSalary?.message}
              {...register('baseSalary', {
                required: 'Le salaire de base est requis',
                min: {
                  value: 0,
                  message: 'Le salaire doit etre positif',
                },
              })}
            />

            <Controller
              name="currency"
              control={control}
              rules={{ required: 'La devise est requise' }}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Devise"
                  required
                  options={CURRENCY_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher la devise..."
                />
              )}
            />

            <Controller
              name="payFrequency"
              control={control}
              rules={{ required: 'La periodicite est requise' }}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Periodicite de paie"
                  required
                  options={PAY_FREQUENCY_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher la periodicite..."
                />
              )}
            />

            <Controller
              name="paymentMethod"
              control={control}
              rules={{ required: 'Le mode de paiement est requis' }}
              render={({ field, fieldState }) => (
                <SearchDropdownInput
                  label="Mode de paiement"
                  required
                  options={PAYMENT_METHOD_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Rechercher le mode..."
                />
              )}
            />
          </div>
      </FormSection>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {mode === 'create' ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset(DEFAULT_VALUES);
              setImportMessage('');
              setImportError('');
            }}
          >
            Reinitialiser
          </Button>
        ) : onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel || (mode === 'edit' ? "Mettre a jour l'employe" : "Enregistrer l'employe")}
        </Button>
      </div>
    </form>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Card
      title={title || 'Creer un employe'}
      subtitle={subtitle || "Renseignez les informations principales de l'employe."}
    >
      {formContent}
    </Card>
  );
}

export default AddEmployeeForm;
