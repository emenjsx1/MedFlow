import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { User, Clock } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Appointment {
  id: string;
  patient_name: string;
  scheduled_at: string;
  duration_minutes?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'rescheduled' | 'in_replacement' | 'filled';
  professional_id?: string | null;
  professional_name?: string | null;
}

interface Professional {
  id: string;
  name: string;
}

interface DailyScheduleCalendarProps {
  appointments: Appointment[];
  professionals: Professional[];
  businessHoursStart?: string;
  businessHoursEnd?: string;
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  pending: {
    bg: 'bg-warning/20',
    border: 'border-warning',
    text: 'text-warning-foreground',
  },
  confirmed: {
    bg: 'bg-success/20',
    border: 'border-success',
    text: 'text-success',
  },
  cancelled: {
    bg: 'bg-destructive/20',
    border: 'border-destructive',
    text: 'text-destructive',
  },
  no_show: {
    bg: 'bg-destructive/30',
    border: 'border-destructive',
    text: 'text-destructive',
  },
  rescheduled: {
    bg: 'bg-accent/20',
    border: 'border-accent',
    text: 'text-accent-foreground',
  },
  in_replacement: {
    bg: 'bg-primary/20',
    border: 'border-primary',
    text: 'text-primary',
  },
  filled: {
    bg: 'bg-primary/30',
    border: 'border-primary',
    text: 'text-primary',
  },
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  no_show: 'Faltou',
  rescheduled: 'Reagendado',
  in_replacement: 'Em reposição',
  filled: 'Preenchido',
};

export default function DailyScheduleCalendar({
  appointments,
  professionals,
  businessHoursStart = '08:00',
  businessHoursEnd = '18:00',
}: DailyScheduleCalendarProps) {
  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const [startHour] = businessHoursStart.split(':').map(Number);
    const [endHour] = businessHoursEnd.split(':').map(Number);

    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, [businessHoursStart, businessHoursEnd]);

  // Group appointments by professional
  const appointmentsByProfessional = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    
    // Add "Sem profissional" category
    grouped['none'] = [];
    
    professionals.forEach((prof) => {
      grouped[prof.id] = [];
    });

    appointments.forEach((apt) => {
      const profId = apt.professional_id || 'none';
      if (grouped[profId]) {
        grouped[profId].push(apt);
      } else {
        grouped['none'].push(apt);
      }
    });

    return grouped;
  }, [appointments, professionals]);

  // Calculate position and height for an appointment
  const getAppointmentStyle = (apt: Appointment) => {
    const aptTime = new Date(apt.scheduled_at);
    const aptHour = aptTime.getHours();
    const aptMinute = aptTime.getMinutes();
    
    const [startHour] = businessHoursStart.split(':').map(Number);
    
    // Calculate top position (each hour = 60px, each 30min = 30px)
    const minutesFromStart = (aptHour - startHour) * 60 + aptMinute;
    const top = (minutesFromStart / 30) * 40; // 40px per 30min slot
    
    // Calculate height based on duration (default 30 minutes)
    const duration = apt.duration_minutes || 30;
    const height = (duration / 30) * 40;
    
    return { top, height: Math.max(height, 36) }; // minimum height of 36px
  };

  const allProfessionals = [
    { id: 'none', name: 'Sem profissional' },
    ...professionals,
  ].filter((prof) => {
    // Only show professionals that have appointments or are active
    return appointmentsByProfessional[prof.id]?.length > 0 || prof.id !== 'none';
  });

  if (professionals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>Nenhum profissional cadastrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Agenda do Dia por Profissional
        </h3>
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2 text-xs">
              <div
                className={cn(
                  'w-3 h-3 rounded border-2',
                  statusColors[status].bg,
                  statusColors[status].border
                )}
              />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="min-w-[800px]">
          {/* Header with professional names */}
          <div className="flex border-b border-border/50 bg-muted/30">
            <div className="w-16 shrink-0 p-2 text-xs font-medium text-muted-foreground border-r border-border/50">
              Horário
            </div>
            {allProfessionals.filter(p => p.id !== 'none' || appointmentsByProfessional['none']?.length > 0).map((prof) => (
              <div
                key={prof.id}
                className="flex-1 min-w-[150px] p-3 text-sm font-medium text-center border-r border-border/50 last:border-r-0"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="truncate">{prof.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative flex">
            {/* Time column */}
            <div className="w-16 shrink-0 border-r border-border/50">
              {timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="h-10 flex items-center justify-center text-xs text-muted-foreground border-b border-border/30"
                >
                  {slot}
                </div>
              ))}
            </div>

            {/* Columns for each professional */}
            {allProfessionals.filter(p => p.id !== 'none' || appointmentsByProfessional['none']?.length > 0).map((prof) => (
              <div
                key={prof.id}
                className="flex-1 min-w-[150px] relative border-r border-border/50 last:border-r-0"
              >
                {/* Grid lines */}
                {timeSlots.map((slot, idx) => (
                  <div
                    key={slot}
                    className={cn(
                      'h-10 border-b border-border/30',
                      idx % 2 === 0 && 'bg-muted/20'
                    )}
                  />
                ))}

                {/* Appointments */}
                <TooltipProvider delayDuration={100}>
                  {appointmentsByProfessional[prof.id]?.map((apt) => {
                    const { top, height } = getAppointmentStyle(apt);
                    const colors = statusColors[apt.status] || statusColors.pending;
                    const aptTime = format(new Date(apt.scheduled_at), 'HH:mm');

                    return (
                      <Tooltip key={apt.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md border-l-4 overflow-hidden',
                              colors.bg,
                              colors.border
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                            }}
                          >
                            <p className={cn('text-xs font-medium truncate', colors.text)}>
                              {apt.patient_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {aptTime} • {apt.duration_minutes}min
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                          <div className="space-y-1">
                            <p className="font-medium">{apt.patient_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(apt.scheduled_at), "HH:mm 'às' HH:mm", {
                                locale: ptBR,
                              }).replace(
                                /às.*$/,
                                `às ${format(
                                  new Date(
                                    new Date(apt.scheduled_at).getTime() +
                                      apt.duration_minutes * 60000
                                  ),
                                  'HH:mm'
                                )}`
                              )}
                            </p>
                            <p className={cn('text-xs font-medium', colors.text)}>
                              {statusLabels[apt.status]}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
