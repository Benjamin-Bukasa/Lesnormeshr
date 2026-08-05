import React, { useEffect, useMemo, useState } from 'react';
import { EllipsisVertical, Eye, Pencil, UserX } from 'lucide-react';
import { DataTable, Sheet, StatusBadge, useToast } from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import AddEmployeeForm, { DEFAULT_VALUES } from '../components/Employees/AddEmployeeForm';
import {
  deleteEmployee,
  listEmployees,
  mapEmployeeToFormValues,
  updateEmployee,
  updateEmployeeStatus,
} from '../services/employeesApi';

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const formatDate = (dateValue) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`));
};

const makeInitials = (firstName, lastName) => {
  return `${String(firstName || '').charAt(0)}${String(lastName || '').charAt(0)}`.toUpperCase();
};

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildCsvContent = (rows, columns) => {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.accessor])).join(','),
  );
  return [header, ...lines].join('\n');
};

const escapeHtmlValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const buildHtmlTable = (rows, columns) => {
  const headerRow = columns.map((column) => `<th>${escapeHtmlValue(column.header)}</th>`).join('');
  const bodyRows = rows
    .map((row) => {
      const cells = columns.map((column) => `<td>${escapeHtmlValue(row[column.accessor])}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
};

const downloadBlob = (blob, filename) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
};

function EmployeesList() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [editingEmployeeId, setEditingEmployeeId] = useState('');
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({
    from: '',
    to: '',
    stock: 'all',
    status: 'all',
    keyword: '',
  });
  const [sortValues, setSortValues] = useState({
    date: 'asc',
    activity: 'az',
    name: 'az',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      try {
        setIsLoading(true);
        const payload = await listEmployees({ page: 1, limit: 200 });
        if (!cancelled) {
          setRows(payload.items);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Impossible de charger les employes.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const editingEmployee = useMemo(
    () => rows.find((employee) => employee.id === editingEmployeeId) || null,
    [rows, editingEmployeeId],
  );

  const editInitialValues = useMemo(() => {
    if (!editingEmployee) {
      return DEFAULT_VALUES;
    }

    return {
      ...DEFAULT_VALUES,
      ...mapEmployeeToFormValues(editingEmployee.raw || {}),
    };
  }, [editingEmployee]);

  const filteredRows = useMemo(() => {
    const searchQuery = normalizeText(search);
    const keywordQuery = normalizeText(filterValues.keyword);
    const statusFilter = normalizeText(filterValues.status);
    const fromDate = filterValues.from ? new Date(`${filterValues.from}T00:00:00`) : null;
    const toDate = filterValues.to ? new Date(`${filterValues.to}T23:59:59`) : null;

    return rows.filter((employee) => {
      const employeeStatus = normalizeText(employee.status);
      const haystack = normalizeText(
        [
          employee.employeeNumber,
          employee.firstName,
          employee.lastName,
          employee.email,
          employee.department,
          employee.position,
          employee.status,
        ].join(' '),
      );

      if (statusFilter && statusFilter !== 'all' && !employeeStatus.includes(statusFilter)) {
        return false;
      }

      if (fromDate || toDate) {
        const joinedAt = new Date(`${employee.joinDate}T00:00:00`);
        if (fromDate && joinedAt < fromDate) return false;
        if (toDate && joinedAt > toDate) return false;
      }

      if (searchQuery && !haystack.includes(searchQuery)) return false;
      if (keywordQuery && !haystack.includes(keywordQuery)) return false;

      return true;
    });
  }, [rows, search, filterValues]);

  const sortedRows = useMemo(() => {
    const nextRows = [...filteredRows];

    const compareText = (aValue, bValue, direction) => {
      const aText = normalizeText(aValue);
      const bText = normalizeText(bValue);
      if (direction === 'za' || direction === 'desc') {
        return bText.localeCompare(aText, 'fr');
      }
      return aText.localeCompare(bText, 'fr');
    };

    nextRows.sort((a, b) => {
      const dateA = new Date(`${a.joinDate}T00:00:00`).getTime();
      const dateB = new Date(`${b.joinDate}T00:00:00`).getTime();
      const dateCompare = sortValues.date === 'desc' ? dateB - dateA : dateA - dateB;
      if (dateCompare !== 0) return dateCompare;

      const activityCompare = compareText(
        `${a.department} ${a.position}`,
        `${b.department} ${b.position}`,
        sortValues.activity,
      );
      if (activityCompare !== 0) return activityCompare;

      return compareText(
        `${a.firstName} ${a.lastName}`,
        `${b.firstName} ${b.lastName}`,
        sortValues.name,
      );
    });

    return nextRows;
  }, [filteredRows, sortValues]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const rangeLabel = useMemo(() => {
    if (sortedRows.length === 0) return '0 sur 0';
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, sortedRows.length);
    return `${start}-${end} sur ${sortedRows.length}`;
  }, [sortedRows.length, page, pageSize]);

  const exportRows = useMemo(
    () =>
      sortedRows.map((employee) => ({
        matricule: employee.employeeNumber,
        employe: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        departement: employee.department,
        poste: employee.position,
        dateEmbauche: formatDate(employee.joinDate),
        statut: employee.status,
      })),
    [sortedRows],
  );

  const exportColumns = useMemo(
    () => [
      { header: 'Matricule', accessor: 'matricule' },
      { header: 'Employe', accessor: 'employe' },
      { header: 'Email', accessor: 'email' },
      { header: 'Departement', accessor: 'departement' },
      { header: 'Poste', accessor: 'poste' },
      { header: "Date d'embauche", accessor: 'dateEmbauche' },
      { header: 'Statut', accessor: 'statut' },
    ],
    [],
  );

  const handleExport = (item) => {
    const timestamp = new Date().toISOString().slice(0, 10);
    if (item?.id === 'csv') {
      const csv = '\uFEFF' + buildCsvContent(exportRows, exportColumns);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `employes-${timestamp}.csv`);
      return;
    }

    if (item?.id === 'excel') {
      const tableHtml = buildHtmlTable(exportRows, exportColumns);
      const blob = new Blob(['\uFEFF' + tableHtml], {
        type: 'application/vnd.ms-excel;charset=utf-8;',
      });
      downloadBlob(blob, `employes-${timestamp}.xls`);
      return;
    }

    if (item?.id === 'pdf') {
      const tableHtml = buildHtmlTable(exportRows, exportColumns);
      const printWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (!printWindow) return;
      printWindow.document.write(`
        <html>
          <head>
            <title>Export employes</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; }
              th { background: #f3f4f6; text-align: left; }
            </style>
          </head>
          <body>
            <h2>Export employes</h2>
            ${tableHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const closeEditSheet = () => {
    setIsEditSheetOpen(false);
    setEditingEmployeeId('');
  };

  const openEditSheet = (employeeId) => {
    setEditingEmployeeId(employeeId);
    setIsEditSheetOpen(true);
  };

  const handleEmployeeUpdate = async (values) => {
    try {
      const updatedRow = await updateEmployee(editingEmployeeId, values);
      setRows((previousRows) =>
        previousRows.map((employee) => (employee.id === editingEmployeeId ? updatedRow : employee)),
      );
      toast.success("Informations de l'employe mises a jour.");
      closeEditSheet();
    } catch (error) {
      toast.error(error.message || "Impossible de mettre a jour l'employe.");
      throw error;
    }
  };

  const columns = useMemo(
    () => [
      {
        header: 'Employe',
        accessor: 'fullName',
        render: (row) => (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-text-primary">
              {makeInitials(row.firstName, row.lastName)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{`${row.firstName} ${row.lastName}`}</p>
              <p className="truncate text-xs text-text-secondary">{row.employeeNumber}</p>
            </div>
          </div>
        ),
      },
      { header: 'Email', accessor: 'email' },
      { header: 'Departement', accessor: 'department' },
      { header: 'Poste', accessor: 'position' },
      {
        header: "Date d'embauche",
        accessor: 'joinDate',
        render: (row) => formatDate(row.joinDate),
      },
      {
        header: 'Statut',
        accessor: 'status',
        render: (row) => (
          <StatusBadge
            status={row.status}
            label={row.status}
            tone={row.statusTone}
            size="sm"
          />
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DataTable
        title="Liste des employes"
        description={isLoading ? 'Chargement des employes...' : 'Vue globale des employes avec recherche, filtres, tri et export.'}
        columns={columns}
        data={pagedRows}
        emptyMessage="Aucun employe trouve"
        tableMaxHeightClass="max-h-[62vh]"
        searchInput={{
          name: 'employeesSearch',
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: 'Rechercher un employe, email, poste...',
        }}
        onFilterSelect={(values) => {
          setFilterValues(values);
          setPage(1);
        }}
        onSortSelect={(values) => {
          setSortValues(values);
          setPage(1);
        }}
        onExportSelect={handleExport}
        onDeleteSelected={(selectedRows) => {
          return Promise.all(selectedRows.map((row) => deleteEmployee(row.id)))
            .then(() => {
              const selectedIds = new Set(selectedRows.map((row) => row.id));
              setRows((prev) => prev.filter((row) => !selectedIds.has(row.id)));
              toast.success('Employes supprimes.');
            })
            .catch((error) => {
              toast.error(error.message || 'Impossible de supprimer les employes.');
              throw error;
            });
        }}
        actionsHeader="Action"
        renderActions={(row) => (
          <DropdownAction
            label={<EllipsisVertical size={18} strokeWidth={1.5} />}
            buttonClassName="rounded-lg bg-transparent p-1 text-text-primary hover:bg-secondary/70"
            items={[
              {
                id: `view_${row.id}`,
                label: 'Voir profil',
                icon: Eye,
                onClick: () => openEditSheet(row.id),
              },
              {
                id: `edit_${row.id}`,
                label: 'Modifier',
                icon: Pencil,
                onClick: () => openEditSheet(row.id),
              },
              {
                id: `deactivate_${row.id}`,
                label: 'Desactiver',
                icon: UserX,
                variant: 'danger',
                onClick: async () => {
                  try {
                    const updatedRow = await updateEmployeeStatus(row.id, 'ARCHIVED');
                    setRows((prev) => prev.map((item) => (item.id === row.id ? updatedRow : item)));
                    toast.success(`Employe desactive : ${row.employeeNumber}.`);
                  } catch (error) {
                    toast.error(error.message || "Impossible de desactiver l'employe.");
                  }
                },
              },
            ]}
          />
        )}
        pagination={{
          page,
          totalPages,
          label: rangeLabel,
          onPageChange: (nextPage) => setPage(nextPage),
          onPrev: () => setPage((prev) => Math.max(1, prev - 1)),
          onNext: () => setPage((prev) => Math.min(totalPages, prev + 1)),
          disablePrev: page <= 1,
          disableNext: page >= totalPages,
        }}
        pageSizeSelect={{
          value: pageSize,
          options: [8, 12, 20, 30],
          onChange: (value) => {
            setPageSize(value);
            setPage(1);
          },
          label: 'Afficher',
        }}
      />

      <Sheet
        open={isEditSheetOpen}
        onClose={closeEditSheet}
        title="Modifier l'employe"
        description="Mettez a jour les informations de l'employe depuis ce panneau lateral."
        size="lg"
        className="max-w-[1080px]"
      >
        <AddEmployeeForm
          mode="edit"
          embedded
          showImportSection={false}
          initialValues={editInitialValues}
          onSubmit={handleEmployeeUpdate}
          onCancel={closeEditSheet}
          submitLabel="Mettre a jour l'employe"
        />
      </Sheet>
    </>
  );
}

export default EmployeesList;
