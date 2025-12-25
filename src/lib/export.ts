import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string);
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create header row
  const headers = columns.map(col => col.header);
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value: any;
      if (typeof col.accessor === 'function') {
        value = col.accessor(item);
      } else {
        value = item[col.accessor];
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert to string and escape quotes
      const stringValue = String(value).replace(/"/g, '""');
      
      // Wrap in quotes if contains comma, newline, or quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue}"`;
      }
      
      return stringValue;
    });
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToJSON<T>(data: T[], filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Predefined export configurations
export const patientExportColumns = [
  { header: 'Nome', accessor: 'name' as const },
  { header: 'WhatsApp', accessor: 'whatsapp' as const },
  { header: 'Email', accessor: 'email' as const },
  { header: 'Notas', accessor: 'notes' as const },
  { header: 'Score de Risco', accessor: 'risk_score' as const },
  { header: 'Criado em', accessor: (p: any) => p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '' },
];

export const appointmentExportColumns = [
  { header: 'Paciente', accessor: 'patient_name' as const },
  { header: 'Telefone', accessor: 'patient_phone' as const },
  { header: 'Data/Hora', accessor: (a: any) => a.scheduled_at ? format(new Date(a.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '' },
  { header: 'Duração (min)', accessor: 'duration_minutes' as const },
  { header: 'Profissional', accessor: 'professional_name' as const },
  { header: 'Status', accessor: (a: any) => {
    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      no_show: 'Não compareceu',
      rescheduled: 'Reagendado',
      in_replacement: 'Em reposição',
      filled: 'Preenchido',
    };
    return statusMap[a.status] || a.status;
  }},
  { header: 'Risco', accessor: (a: any) => {
    const riskMap: Record<string, string> = {
      low: 'Baixo',
      medium: 'Médio',
      high: 'Alto',
    };
    return riskMap[a.risk_level] || a.risk_level;
  }},
  { header: 'Notas', accessor: 'notes' as const },
];

export const professionalExportColumns = [
  { header: 'Nome', accessor: 'name' as const },
  { header: 'Especialidade', accessor: 'specialty' as const },
  { header: 'Duração Consulta (min)', accessor: 'appointment_duration_minutes' as const },
  { header: 'Início Expediente', accessor: 'business_hours_start' as const },
  { header: 'Fim Expediente', accessor: 'business_hours_end' as const },
  { header: 'Ativo', accessor: (p: any) => p.is_active ? 'Sim' : 'Não' },
];
