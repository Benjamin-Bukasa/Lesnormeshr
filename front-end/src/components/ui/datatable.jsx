/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Trash2,
} from 'lucide-react';
import DropdownAction from './dropdownAction';
import DropdownFilter from './dropdownFilter';
import DropdownSort from './dropdownSort';
import ConfirmModal from './confirm-modal';
import DropdownSelect from './dropdown-select';
import { formatFrenchNode, formatFrenchTypography } from '../../utils/frenchTypography';

const DEFAULT_EXPORT_ITEMS = [
  { id: 'csv', label: 'Exporter CSV' },
  { id: 'excel', label: 'Exporter Excel' },
  { id: 'pdf', label: 'Exporter PDF' },
];

const DEFAULT_EMPTY_MESSAGE = 'Aucune donnee';

const getRowKey = (row, index) => {
  if (row?.id !== undefined && row?.id !== null) return String(row.id);
  if (row?._id !== undefined && row?._id !== null) return String(row._id);
  if (row?.key !== undefined && row?.key !== null) return String(row.key);
  return `row_${index}`;
};

const DataTable = ({
  title = '',
  description = '',
  columns = [],
  data = [],
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  tableMaxHeightClass = 'max-h-[52vh]',
  searchInput = null,
  onFilterSelect,
  onSortSelect,
  onExportSelect,
  actionsHeader = 'Actions',
  renderActions,
  onDeleteSelected,
  deleteConfirmConfig = null,
  pagination = null,
  pageSizeSelect = null,
}) => {
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const headerCheckboxRef = useRef(null);
  const rows = Array.isArray(data) ? data : [];

  const rowKeys = useMemo(
    () => rows.map((row, index) => getRowKey(row, index)),
    [rows],
  );

  const selectedRows = useMemo(
    () =>
      rows.filter((row, index) => selectedKeys.includes(getRowKey(row, index))),
    [rows, selectedKeys],
  );

  const allSelected = rows.length > 0 && rowKeys.every((key) => selectedKeys.includes(key));
  const someSelected = selectedKeys.length > 0 && !allSelected;

  useEffect(() => {
    setSelectedKeys((prev) => prev.filter((key) => rowKeys.includes(key)));
  }, [rowKeys]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const hasActions = typeof renderActions === 'function';
  const hasSelection = typeof onDeleteSelected === 'function';
  const colSpan = columns.length + (hasSelection ? 1 : 0) + (hasActions ? 1 : 0);

  const currentPage = Number(pagination?.page || 1);
  const totalPages = Math.max(1, Number(pagination?.totalPages || 1));
  const pageRange = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedKeys([]);
      return;
    }
    setSelectedKeys(rowKeys);
  };

  const handleToggleRow = (rowKey) => {
    setSelectedKeys((prev) => {
      if (prev.includes(rowKey)) {
        return prev.filter((key) => key !== rowKey);
      }
      return [...prev, rowKey];
    });
  };

  const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    if (typeof searchInput?.onChange === 'function') {
      searchInput.onChange(nextValue, event);
    }
  };

  const handleDeleteSelected = () => {
    if (!hasSelection || selectedRows.length === 0) return;
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteSelected = async () => {
    if (!hasSelection || selectedRows.length === 0) {
      setIsDeleteConfirmOpen(false);
      return;
    }

    try {
      setIsDeleting(true);
      await Promise.resolve(onDeleteSelected(selectedRows));
      setSelectedKeys([]);
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteConfirmTitle = formatFrenchTypography(deleteConfirmConfig?.title || 'Confirmation de suppression');
  const defaultDeleteDescription = selectedRows.length <= 1
    ? 'Voulez-vous vraiment supprimer cet element ? Cette action est irreversible.'
    : `Voulez-vous vraiment supprimer ces ${selectedRows.length} elements ? Cette action est irreversible.`;
  const deleteConfirmDescription = typeof deleteConfirmConfig?.description === 'function'
    ? deleteConfirmConfig.description(selectedRows)
    : formatFrenchTypography(deleteConfirmConfig?.description || defaultDeleteDescription);
  const deleteConfirmLabel = formatFrenchTypography(deleteConfirmConfig?.confirmLabel || 'Supprimer');
  const deleteCancelLabel = formatFrenchTypography(deleteConfirmConfig?.cancelLabel || 'Annuler');

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      {(title || description) ? (
        <div className="space-y-1">
          {title ? (
            <h3 className="text-base font-semibold text-text-primary">{formatFrenchTypography(title)}</h3>
          ) : null}
          {description ? (
            <p className="text-sm text-text-secondary">{formatFrenchTypography(description)}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {searchInput ? (
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              name={searchInput.name}
              type={searchInput.type || 'text'}
              value={searchInput.value ?? ''}
              onChange={handleSearchChange}
              placeholder={formatFrenchTypography(searchInput.placeholder || 'Rechercher...')}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
        ) : null}

        {typeof onFilterSelect === 'function' ? (
          <DropdownFilter
            label="Filtrer"
            onApply={(value) => onFilterSelect(value)}
          />
        ) : null}

        {typeof onSortSelect === 'function' ? (
          <DropdownSort
            label="Trier"
            onApply={(value) => onSortSelect(value)}
          />
        ) : null}

        {typeof onExportSelect === 'function' ? (
          <DropdownAction
            label={(
              <span className="inline-flex items-center gap-2">
                <Download size={16} strokeWidth={1.5} />
                Exporter
              </span>
            )}
            items={DEFAULT_EXPORT_ITEMS}
            onSelect={(item) => onExportSelect(item)}
          />
        ) : null}

        {hasSelection ? (
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedRows.length === 0}
            className={[
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
              selectedRows.length === 0
                ? 'cursor-not-allowed border-border text-text-secondary opacity-60'
                : 'border-rose-300 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20',
            ].join(' ')}
          >
            <Trash2 size={16} />
            Supprimer selection ({selectedRows.length})
          </button>
        ) : null}
      </div>

      <div className={['overflow-auto rounded-lg border border-border', tableMaxHeightClass].join(' ')}>
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b border-border">
              {hasSelection ? (
                <th className="w-12 px-3 py-2">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleAll}
                    className="h-4 w-4 rounded border-border accent-primary"
                    aria-label="Selectionner toutes les lignes"
                  />
                </th>
              ) : null}

              {columns.map((column) => (
                <th
                  key={`${column.accessor || column.header}`}
                  className="whitespace-nowrap px-3 py-2 font-semibold text-text-primary"
                >
                  {formatFrenchTypography(column.header)}
                </th>
              ))}

              {hasActions ? (
                <th className="whitespace-nowrap px-3 py-2 font-semibold text-text-primary">
                  {formatFrenchTypography(actionsHeader)}
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-10 text-center text-text-secondary">
                  {formatFrenchTypography(emptyMessage)}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const rowKey = getRowKey(row, rowIndex);
                const checked = selectedKeys.includes(rowKey);

                return (
                  <tr key={rowKey} className="border-b border-border/60 hover:bg-background/70">
                    {hasSelection ? (
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleRow(rowKey)}
                          className="h-4 w-4 rounded border-border accent-primary"
                          aria-label={`Selectionner la ligne ${rowIndex + 1}`}
                        />
                      </td>
                    ) : null}

                    {columns.map((column) => (
                      <td
                        key={`${rowKey}_${column.accessor || column.header}`}
                        className="px-3 py-2 text-text-primary"
                      >
                        {typeof column.render === 'function'
                          ? formatFrenchNode(column.render(row, rowIndex))
                          : formatFrenchTypography(row?.[column.accessor] ?? '-')}
                      </td>
                    ))}

                    {hasActions ? (
                      <td className="px-3 py-2">
                        {formatFrenchNode(renderActions(row, rowIndex))}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {(pagination || pageSizeSelect) ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {pageSizeSelect ? (
            <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <span>{formatFrenchTypography(pageSizeSelect.label || 'Afficher')}</span>
              <DropdownSelect
                value={pageSizeSelect.value}
                onChange={(nextValue) => pageSizeSelect.onChange?.(Number(nextValue))}
                options={(pageSizeSelect.options || []).map((optionValue) => ({
                  value: optionValue,
                  label: String(optionValue),
                }))}
                className="w-24"
                buttonClassName="bg-background py-1.5"
              />
            </div>
          ) : <span />}

          {pagination ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-text-secondary">{formatFrenchTypography(pagination.label)}</span>

              <button
                type="button"
                onClick={pagination.onPrev}
                disabled={Boolean(pagination.disablePrev)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-text-primary transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Page precedente"
              >
                <ChevronLeft size={16} />
              </button>

              {pageRange.map((pageValue) => (
                <button
                  key={pageValue}
                  type="button"
                  onClick={() => pagination.onPageChange?.(pageValue)}
                  className={[
                    'inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm transition',
                    pageValue === currentPage
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-background text-text-primary hover:bg-secondary',
                  ].join(' ')}
                >
                  {pageValue}
                </button>
              ))}

              <button
                type="button"
                onClick={pagination.onNext}
                disabled={Boolean(pagination.disableNext)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-text-primary transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasSelection ? (
        <ConfirmModal
          open={isDeleteConfirmOpen}
          onClose={() => {
            if (!isDeleting) {
              setIsDeleteConfirmOpen(false);
            }
          }}
          onConfirm={handleConfirmDeleteSelected}
          title={deleteConfirmTitle}
          description={deleteConfirmDescription}
          confirmLabel={deleteConfirmLabel}
          cancelLabel={deleteCancelLabel}
          confirmVariant="danger"
          loading={isDeleting}
        />
      ) : null}
    </div>
  );
};

export default DataTable;
