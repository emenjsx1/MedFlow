import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Repeat, Loader2 } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { RecurrenceRule, getRecurrenceLabel, generateRecurringDates, formatRecurrenceDescription } from '@/lib/recurrence';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecurringAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    patient_name: string;
    patient_phone: string | null;
    patient_id: string | null;
    professional_id: string | null;
    professional_name: string | null;
    scheduled_at: string;
    duration_minutes: number | null;
    tenant_id: string;
    notes: string | null;
  };
  onSuccess: () => void;
}

export default function RecurringAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: RecurringAppointmentDialogProps) {
  const [rule, setRule] = useState<RecurrenceRule>('weekly');
  const [endDate, setEndDate] = useState<Date>(addMonths(new Date(), 3));
  const [loading, setLoading] = useState(false);

  const startDate = new Date(appointment.scheduled_at);
  const startTime = format(startDate, 'HH:mm');

  const previewDates = generateRecurringDates({
    rule,
    endDate,
    startDate,
    startTime,
  });

  const handleCreate = async () => {
    if (previewDates.length === 0) {
      toast.error('Nenhuma data para criar');
      return;
    }

    setLoading(true);
    try {
      // Update original appointment to mark as recurring
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          is_recurring: true,
          recurrence_rule: rule,
          recurrence_end_date: format(endDate, 'yyyy-MM-dd'),
        })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      // Create recurring appointments
      const newAppointments = previewDates.map(date => ({
        tenant_id: appointment.tenant_id,
        patient_name: appointment.patient_name,
        patient_phone: appointment.patient_phone,
        patient_id: appointment.patient_id,
        professional_id: appointment.professional_id,
        professional_name: appointment.professional_name,
        scheduled_at: date.toISOString(),
        duration_minutes: appointment.duration_minutes || 30,
        notes: appointment.notes,
        parent_appointment_id: appointment.id,
        status: 'pending' as const,
      }));

      const { error: insertError } = await supabase
        .from('appointments')
        .insert(newAppointments);

      if (insertError) throw insertError;

      toast.success(`${previewDates.length} agendamentos recorrentes criados!`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating recurring appointments:', error);
      toast.error('Erro ao criar agendamentos recorrentes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Agendamento Recorrente
          </DialogTitle>
          <DialogDescription>
            Configure a repetição para o agendamento de {appointment.patient_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original appointment info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Agendamento original:</p>
            <p className="font-medium">
              {format(startDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>

          {/* Recurrence rule */}
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select value={rule} onValueChange={(v) => setRule(v as RecurrenceRule)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal (toda semana)</SelectItem>
                <SelectItem value="biweekly">Quinzenal (a cada 2 semanas)</SelectItem>
                <SelectItem value="monthly">Mensal (todo mês)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* End date */}
          <div className="space-y-2">
            <Label>Repetir até</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  disabled={(date) => date < startDate}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Prévia ({previewDates.length} agendamentos)</Label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {previewDates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum agendamento será criado
                </p>
              ) : (
                previewDates.slice(0, 10).map((date, index) => (
                  <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                    {format(date, "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                ))
              )}
              {previewDates.length > 10 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ... e mais {previewDates.length - 10} agendamentos
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading || previewDates.length === 0}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              `Criar ${previewDates.length} agendamentos`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
