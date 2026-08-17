const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const STATUS_META = {
  ACTIVE: { label: 'Actif', tone: 'success' },
  PROBATION: { label: 'Probation', tone: 'warning' },
  ON_LEAVE: { label: 'En conge', tone: 'info' },
  SUSPENDED: { label: 'Suspendu', tone: 'danger' },
  ARCHIVED: { label: 'Archive', tone: 'neutral' },
};

async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Erreur API');
  }

  return payload;
}

function toDateInput(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function mapEmployeeToRow(employee) {
  const statusMeta = STATUS_META[employee.employmentStatus] || { label: employee.employmentStatus, tone: 'neutral' };

  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.workEmail || '',
    departmentId: employee.department?.id || '',
    department: employee.department?.name || '',
    departmentCode: employee.department?.code || '',
    position: employee.position?.title || '',
    joinDate: toDateInput(employee.hireDate),
    status: statusMeta.label,
    statusTone: statusMeta.tone,
    documentCount: employee.documentCount || 0,
    raw: employee,
  };
}

export function mapEmployeeToFormValues(employee) {
  return {
    employeeNumber: employee.employeeNumber || '',
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    preferredName: employee.preferredName || '',
    workEmail: employee.workEmail || '',
    workPhone: employee.workPhone || '',
    personalEmail: employee.personalEmail || '',
    personalPhone: employee.personalPhone || '',
    dateOfBirth: toDateInput(employee.dateOfBirth),
    hireDate: toDateInput(employee.hireDate),
    probationEndDate: toDateInput(employee.probationEndDate),
    nationality: employee.nationality || '',
    nationalIdNumber: employee.nationalIdNumber || '',
    taxNumber: employee.taxNumber || '',
    socialSecurityNumber: employee.socialSecurityNumber || '',
    gender: employee.gender || '',
    maritalStatus: employee.maritalStatus || '',
    employmentType: employee.employmentType || '',
    employeeStatus: employee.employmentStatus || '',
    department: employee.department?.code || '',
    position: employee.position?.code || '',
    location: employee.location?.code || '',
    costCenter: employee.costCenter?.code || '',
    baseSalary: employee.payrollProfile?.baseSalary ?? '',
    currency: employee.payrollProfile?.currency || '',
    payFrequency: employee.payrollProfile?.payFrequency || '',
    paymentMethod: employee.payrollProfile?.paymentMethod || '',
  };
}

function mapFormValuesToPayload(values) {
  return {
    employeeNumber: values.employeeNumber,
    firstName: values.firstName,
    lastName: values.lastName,
    preferredName: values.preferredName,
    workEmail: values.workEmail,
    workPhone: values.workPhone,
    personalEmail: values.personalEmail,
    personalPhone: values.personalPhone,
    dateOfBirth: values.dateOfBirth || null,
    hireDate: values.hireDate,
    probationEndDate: values.probationEndDate || null,
    nationality: values.nationality,
    nationalIdNumber: values.nationalIdNumber,
    taxNumber: values.taxNumber,
    socialSecurityNumber: values.socialSecurityNumber,
    gender: values.gender,
    maritalStatus: values.maritalStatus,
    employmentType: values.employmentType,
    employeeStatus: values.employeeStatus,
    department: values.department,
    position: values.position,
    location: values.location,
    costCenter: values.costCenter,
    baseSalary: values.baseSalary,
    currency: values.currency,
    payFrequency: values.payFrequency,
    paymentMethod: values.paymentMethod,
  };
}

export async function listEmployees(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.set(key, String(value));
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await apiRequest(`/api/employees${suffix}`);

  return {
    items: (payload.data || []).map(mapEmployeeToRow),
    pagination: payload.pagination || null,
  };
}

export async function createEmployee(values) {
  const payload = await apiRequest('/api/employees', {
    method: 'POST',
    body: mapFormValuesToPayload(values),
  });

  return mapEmployeeToRow(payload.data);
}

export async function updateEmployee(employeeId, values) {
  const payload = await apiRequest(`/api/employees/${employeeId}`, {
    method: 'PATCH',
    body: mapFormValuesToPayload(values),
  });

  return mapEmployeeToRow(payload.data);
}

export async function updateEmployeeStatus(employeeId, status) {
  const payload = await apiRequest(`/api/employees/${employeeId}/status`, {
    method: 'PATCH',
    body: { status },
  });

  return mapEmployeeToRow(payload.data);
}

export async function deleteEmployee(employeeId) {
  await apiRequest(`/api/employees/${employeeId}`, {
    method: 'DELETE',
  });
}

export async function listEmployeeDocuments(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return;
    }

    query.set(key, String(value));
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await apiRequest(`/api/employees/documents${suffix}`);

  return {
    items: payload.data || [],
    pagination: payload.pagination || null,
  };
}

export async function listEmployeeFolderDocuments(employeeId, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return;
    }

    query.set(key, String(value));
  });

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await apiRequest(`/api/employees/${employeeId}/documents${suffix}`);

  return {
    items: payload.data || [],
    pagination: payload.pagination || null,
  };
}

export async function uploadEmployeeDocument(employeeId, formData) {
  const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/documents`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Erreur API');
  }

  return payload.data;
}

export async function verifyEmployeeDocument(documentId) {
  const payload = await apiRequest(`/api/employees/documents/${documentId}/verify`, {
    method: 'PATCH',
  });

  return payload.data;
}

export async function deleteEmployeeDocument(documentId) {
  return apiRequest(`/api/employees/documents/${documentId}`, {
    method: 'DELETE',
  });
}
