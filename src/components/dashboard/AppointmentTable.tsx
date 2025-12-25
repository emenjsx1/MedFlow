import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Send,
  UserPlus,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Ban,
  RefreshCw,
  Repeat,
  UserCheck,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import RecurringAppointmentDialog from '@/components/appointments/RecurringAppointmentDialog';
import { useAuth } from '@/contexts/AuthContext';

export interface Appointment {
  id: string;
  patient_name: string;
  patient_phone?: string | null;
  patient_id?: string | null;
  scheduled_at: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'rescheduled' | 'in_replacement' | 'filled';
  risk_level: 'low' | 'medium' | 'high';
  professional_id?: string | null;
  professional_name?: string | null;
  last_contact_at?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
  tenant_id?: string;
  is_recurring?: boolean;
  checked_in_at?: string | null;
}

interface AppointmentTableProps {
  appointments: Appointment[];
  onAction: (id: string, action: string) => void;
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    className: 'status-pending',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmado',
    className: 'status-confirmed',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    className: 'status-cancelled',
    icon: XCircle,
  },
  no_show: {
    label: 'Não compareceu',
    className: 'status-cancelled',
    icon: Ban,
  },
  rescheduled: {
    label: 'Reagendado',
    className: 'bg-primary/15 text-primary',
    icon: RefreshCw,
  },
  in_replacement: {
    label: 'Em reposição',
    className: 'bg-accent/15 text-accent',
    icon: UserPlus,
  },
  filled: {
    label: 'Preenchido',
    className: 'status-confirmed',
    icon: CheckCircle2,
  },
};

const riskBadge = {
  low: null,
  medium: {
    label: 'Risco médio',
    className: 'bg-warning/15 text-warning border-warning/30',
  },
  high: {
    label: 'Alto risco',
    className: 'bg-danger/15 text-danger border-danger/30 animate-pulse-soft',
  },
};

export default function AppointmentTable({ appointments, onAction }: AppointmentTableProps) {
  const { tenantId } = useAuth();
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleAction = (id: string, action: string, patientName: string) => {
    onAction(id, action);
    
    const actionMessages: Record<string, string> = {
      resend: `Confirmação reenviada para ${patientName}`,
      offer_waitlist: `Vaga oferecida para fila de espera`,
      mark_cancelled: `Consulta de ${patientName} marcada como cancelada`,
      mark_noshow: `${patientName} marcado como não compareceu`,
      check_in: `${patientName} fez check-in`,
      send_reminder: `Lembrete de check-in enviado para ${patientName}`,
    };
    
    toast.success(actionMessages[action] || 'Ação realizada');
  };

  const handleRecurring = (appointment: Appointment) => {
    setSelectedAppointment({
      ...appointment,
      tenant_id: appointment.tenant_id || tenantId || '',
    });
    setRecurringDialogOpen(true);
  };

  return (
    <>
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold w-24">ID</TableHead>
            <TableHead className="font-semibold">Paciente</TableHead>
            <TableHead className="font-semibold">Horário</TableHead>
            <TableHead className="font-semibold">Profissional</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Último contato</TableHead>
            <TableHead className="font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                Nenhuma consulta encontrada para os filtros selecionados.
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appointment) => {
              const status = statusConfig[appointment.status];
              const StatusIcon = status.icon;
              const risk = riskBadge[appointment.risk_level];
              const isHighRisk = appointment.risk_level === 'high';

              return (
                <TableRow
                  key={appointment.id}
                  className={cn(
                    'transition-colors',
                    isHighRisk && 'bg-danger/5'
                  )}
                >
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      {appointment.id.substring(0, 8)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {appointment.patient_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{appointment.patient_name}</p>
                        {appointment.patient_phone && (
                          <p className="text-xs text-muted-foreground">
                            {appointment.patient_phone}
                          </p>
                        )}
                      </div>
                      {appointment.checked_in_at && (
                        <Badge variant="outline" className="bg-success/15 text-success border-success/30">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Check-in
                        </Badge>
                      )}
                      {risk && (
                        <Badge variant="outline" className={cn('text-xs', risk.className)}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {risk.label}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {format(new Date(appointment.scheduled_at), 'HH:mm', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appointment.scheduled_at), "dd 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {appointment.professional_name || 'Dr. Padrão'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn('status-badge', status.className)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    {appointment.last_contact_at ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(appointment.last_contact_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {/* Check-in button - for pending or confirmed appointments that haven't checked in */}
                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && !appointment.checked_in_at && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleAction(appointment.id, 'check_in', appointment.patient_name)}
                              className="text-success focus:text-success"
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Fazer Check-in
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {/* Send check-in reminder - for pending appointments */}
                        {appointment.status === 'pending' && appointment.patient_phone && (
                          <DropdownMenuItem
                            onClick={() => handleAction(appointment.id, 'send_reminder', appointment.patient_name)}
                            className="text-primary focus:text-primary"
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            Enviar lembrete check-in
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleAction(appointment.id, 'resend', appointment.patient_name)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Reenviar confirmação
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRecurring(appointment)}
                        >
                          <Repeat className="w-4 h-4 mr-2" />
                          Tornar recorrente
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction(appointment.id, 'offer_waitlist', appointment.patient_name)}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Oferecer para fila
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleAction(appointment.id, 'mark_cancelled', appointment.patient_name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Marcar cancelado
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction(appointment.id, 'mark_noshow', appointment.patient_name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Marcar não compareceu
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>

    {/* Recurring Appointment Dialog */}
    {selectedAppointment && (
      <RecurringAppointmentDialog
        open={recurringDialogOpen}
        onOpenChange={setRecurringDialogOpen}
        appointment={selectedAppointment as any}
        onSuccess={() => {
          setRecurringDialogOpen(false);
          toast.success('Agendamentos recorrentes criados!');
        }}
      />
    )}
    </>
  );
}
