import { format, addWeeks, addMonths, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type RecurrenceRule = 'weekly' | 'biweekly' | 'monthly';

export interface RecurrenceOptions {
  rule: RecurrenceRule;
  endDate: Date;
  startDate: Date;
  startTime: string;
}

export function getRecurrenceLabel(rule: RecurrenceRule): string {
  const labels: Record<RecurrenceRule, string> = {
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
  };
  return labels[rule];
}

export function generateRecurringDates(options: RecurrenceOptions): Date[] {
  const { rule, endDate, startDate, startTime } = options;
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  // Set the time from startTime
  const [hours, minutes] = startTime.split(':').map(Number);
  currentDate.setHours(hours, minutes, 0, 0);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));

    switch (rule) {
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'biweekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
    }
  }

  // Remove the first date since it's the original appointment
  return dates.slice(1);
}

export function formatRecurrenceDescription(rule: RecurrenceRule, endDate: Date): string {
  const ruleLabel = getRecurrenceLabel(rule).toLowerCase();
  const formattedEndDate = format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  return `Repetir ${ruleLabel} até ${formattedEndDate}`;
}
