import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  FileText,
  User,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  notes: string | null;
  risk_score: number | null;
  created_at: string;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  professional_name: string | null;
  notes: string | null;
  duration_minutes: number;
}

interface Message {
  id: string;
  body: string;
  direction: string;
  sent_at: string;
  status: string;
}

interface PatientHistorySheetProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PatientHistorySheet({
  patient,
  open,
  onOpenChange,
}: PatientHistorySheetProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient && open) {
      loadPatientHistory();
    }
  }, [patient, open]);

  const loadPatientHistory = async () => {
    if (!patient) return;
    setLoading(true);

    try {
      // Load appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('id, scheduled_at, status, professional_name, notes, duration_minutes')
        .eq('patient_id', patient.id)
        .order('scheduled_at', { ascending: false });

      setAppointments(appointmentsData || []);

      // Load messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, body, direction, sent_at, status')
        .eq('patient_id', patient.id)
        .order('sent_at', { ascending: false })
        .limit(50);

      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading patient history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
      confirmed: { label: 'Confirmado', variant: 'default' },
      pending: { label: 'Pendente', variant: 'secondary' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      no_show: { label: 'Não compareceu', variant: 'destructive' },
      rescheduled: { label: 'Reagendado', variant: 'outline' },
      filled: { label: 'Preenchido', variant: 'default' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'filled':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'cancelled':
      case 'no_show':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Calculate stats
  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'confirmed' || a.status === 'filled').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    noShow: appointments.filter((a) => a.status === 'no_show').length,
  };

  const attendanceRate = stats.total > 0 
    ? Math.round((stats.confirmed / stats.total) * 100) 
    : 0;

  if (!patient) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="block">{patient.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                Cadastrado em {format(new Date(patient.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Histórico completo do paciente
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Patient Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{patient.whatsapp}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{patient.notes}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-success/10">
                <p className="text-2xl font-bold text-success">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-destructive/10">
                <p className="text-2xl font-bold text-destructive">{stats.cancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-warning/10">
                <p className="text-2xl font-bold text-warning">{attendanceRate}%</p>
                <p className="text-xs text-muted-foreground">Comparecimento</p>
              </div>
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="appointments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="appointments" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Consultas ({appointments.length})
                </TabsTrigger>
                <TabsTrigger value="messages" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Mensagens ({messages.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="appointments" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {appointments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma consulta encontrada
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="mt-1">
                            {getStatusIcon(appointment.status || 'pending')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">
                                {format(new Date(appointment.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                              {getStatusBadge(appointment.status || 'pending')}
                            </div>
                            {appointment.professional_name && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Dr(a). {appointment.professional_name}
                              </p>
                            )}
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {appointment.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Duração: {appointment.duration_minutes || 30} min
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="messages" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma mensagem encontrada
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-3 rounded-lg max-w-[85%]",
                            message.direction === 'outbound'
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            message.direction === 'outbound' ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {format(new Date(message.sent_at || new Date()), "dd/MM HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
