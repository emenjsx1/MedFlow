import { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import AppointmentTable, { Appointment } from '@/components/dashboard/AppointmentTable';
import DailyScheduleCalendar from '@/components/dashboard/DailyScheduleCalendar';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding();
  const { tenantId } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenantTimezone, setTenantTimezone] = useState<string>('America/Sao_Paulo');
  const [businessHoursStart, setBusinessHoursStart] = useState<string>('08:00');
  const [businessHoursEnd, setBusinessHoursEnd] = useState<string>('18:00');

  useEffect(() => {
    if (tenantId) {
      loadAppointments();
      loadProfessionals();
      loadTenantSettings();
    }
  }, [tenantId, selectedDate]);

  const loadTenantSettings = async () => {
    try {
      const { data } = await supabase
        .from('tenant_settings')
        .select('timezone, business_hours_start, business_hours_end')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (data) {
        setTenantTimezone(data.timezone || 'America/Sao_Paulo');
        setBusinessHoursStart(data.business_hours_start || '08:00');
        setBusinessHoursEnd(data.business_hours_end || '18:00');
      }
    } catch (error) {
      console.error('Error loading tenant settings:', error);
    }
  };

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error loading professionals:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const dayStart = startOfDay(selectedDate).toISOString();
      const dayEnd = endOfDay(selectedDate).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  // Calculate stats
  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled' || a.status === 'no_show').length,
    atRisk: appointments.filter((a) => a.risk_level === 'high' || a.risk_level === 'medium').length,
    filled: appointments.filter((a) => a.status === 'filled').length,
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesProfessional = professionalFilter === 'all' || appointment.professional_id === professionalFilter;
    const matchesSearch = appointment.patient_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesProfessional && matchesSearch;
  });

  const handleAction = async (id: string, action: string) => {
    console.log('Action:', action, 'on appointment:', id);
    
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;
    
    try {
      type AppointmentStatus = 'confirmed' | 'cancelled' | 'no_show' | 'pending' | 'rescheduled' | 'in_replacement' | 'filled';
      let newStatus: AppointmentStatus | null = null;
      
      switch (action) {
        case 'confirm':
          newStatus = 'confirmed';
          break;
        case 'cancel':
        case 'mark_cancelled':
          newStatus = 'cancelled';
          break;
        case 'no_show':
        case 'mark_noshow':
          newStatus = 'no_show';
          break;
        case 'check_in':
          // Mark patient as checked in AND change status to confirmed
          await supabase
            .from('appointments')
            .update({ 
              checked_in_at: new Date().toISOString(),
              status: 'confirmed'
            })
            .eq('id', id);
          toast({
            title: 'Check-in realizado',
            description: `${appointment.patient_name} fez check-in e está confirmado.`,
          });
          loadAppointments();
          return;
        case 'resend':
          // Send confirmation message via WhatsApp
          if (appointment.patient_phone) {
            const { error } = await supabase.functions.invoke('send-manual-message', {
              body: {
                tenantId,
                patientPhone: appointment.patient_phone,
                message: `Olá ${appointment.patient_name}! 📋\n\nLembramos da sua consulta agendada para:\n📅 ${format(new Date(appointment.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\nPor favor, confirme sua presença respondendo esta mensagem.\n\nAtenciosamente,\nEquipe da Clínica`,
              },
            });
            
            if (error) throw error;
            
            // Update last_contact_at
            await supabase
              .from('appointments')
              .update({ last_contact_at: new Date().toISOString() })
              .eq('id', id);
            
            toast({
              title: 'Confirmação enviada',
              description: `Mensagem enviada para ${appointment.patient_name}`,
            });
            loadAppointments();
          } else {
            toast({
              title: 'Erro',
              description: 'Paciente não tem telefone cadastrado.',
              variant: 'destructive',
            });
          }
          return;
          
        case 'send_reminder':
          // Send check-in reminder with link
          if (appointment.patient_phone) {
            const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
            const publicBaseUrl = projectId ? `https://${projectId}.lovableproject.com` : window.location.origin;
            const checkinUrl = `${publicBaseUrl}/checkin/${id}`;
            const scheduledDate = new Date(appointment.scheduled_at);
            const dateStr = format(scheduledDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
            const timeStr = format(scheduledDate, 'HH:mm', { locale: ptBR });
            
            const { error } = await supabase.functions.invoke('send-manual-message', {
              body: {
                tenantId,
                patientPhone: appointment.patient_phone,
                message: `⏰ *${appointment.patient_name}, sua consulta está chegando!*\n\n📅 ${dateStr}\n⏰ ${timeStr}\n\n✅ *Para CONFIRMAR sua presença, faça o check-in:*\n👉 ${checkinUrl}\n\n⚠️ Sem check-in, sua consulta ficará como *não compareceu*.`,
              },
            });
            
            if (error) throw error;
            
            // Update last_contact_at
            await supabase
              .from('appointments')
              .update({ last_contact_at: new Date().toISOString() })
              .eq('id', id);
            
            toast({
              title: 'Lembrete enviado',
              description: `Link de check-in enviado para ${appointment.patient_name}`,
            });
            loadAppointments();
          } else {
            toast({
              title: 'Erro',
              description: 'Paciente não tem telefone cadastrado.',
              variant: 'destructive',
            });
          }
          return;
          
        case 'offer_waitlist':
          // Mark as in_replacement and offer to waitlist
          newStatus = 'in_replacement';
          
          // Get waitlist patients and offer them the slot
          const { data: waitlistPatients } = await supabase
            .from('waitlist')
            .select('*, patient:patients(name, whatsapp)')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .order('priority', { ascending: true })
            .limit(3);
          
          if (waitlistPatients && waitlistPatients.length > 0) {
            for (const entry of waitlistPatients) {
              if (entry.patient?.whatsapp) {
                await supabase.functions.invoke('send-manual-message', {
                  body: {
                    tenantId,
                    patientPhone: entry.patient.whatsapp,
                    message: `Olá ${entry.patient.name}! 🎉\n\nSurgiu uma vaga disponível:\n📅 ${format(new Date(appointment.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\nDeseja agendar? Responda SIM para confirmar ou NÃO para recusar.\n\nAguardamos sua resposta!`,
                  },
                });
              }
            }
            
            toast({
              title: 'Vaga oferecida',
              description: `Oferecida para ${waitlistPatients.length} paciente(s) da fila de espera`,
            });
          } else {
            toast({
              title: 'Aviso',
              description: 'Nenhum paciente ativo na fila de espera.',
              variant: 'default',
            });
          }
          break;
      }

      if (newStatus) {
        const { error } = await supabase
          .from('appointments')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        
        toast({
          title: 'Sucesso',
          description: 'Status atualizado com sucesso.',
        });
        
        loadAppointments();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar a ação.',
        variant: 'destructive',
      });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate((current) =>
      direction === 'prev' ? subDays(current, 1) : addDays(current, 1)
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Onboarding Modal */}
      <OnboardingModal 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding}
        onComplete={completeOnboarding}
      />
      
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Painel do Dia</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as consultas e confirmações de hoje
            </p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total de consultas"
            value={stats.total}
            icon={CalendarIcon}
            variant="default"
          />
          <StatsCard
            title="Confirmadas"
            value={stats.confirmed}
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Pendentes"
            value={stats.pending}
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Em risco"
            value={stats.atRisk}
            icon={AlertTriangle}
            variant="danger"
          />
          <StatsCard
            title="Canceladas"
            value={stats.cancelled}
            icon={XCircle}
            variant="danger"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Date selector */}
          <div className="flex items-center gap-2 bg-card rounded-lg border border-border/50 p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="min-w-[180px] justify-center font-medium"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
              <SelectItem value="no_show">Não compareceu</SelectItem>
              <SelectItem value="in_replacement">Em reposição</SelectItem>
            </SelectContent>
          </Select>

          {/* Professional filter */}
          {professionals.length > 0 && (
            <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Visual Calendar */}
        <DailyScheduleCalendar
          appointments={appointments}
          professionals={professionals}
          businessHoursStart={businessHoursStart}
          businessHoursEnd={businessHoursEnd}
          timezone={tenantTimezone}
        />

        {/* Table */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-card rounded-xl border border-border/50 p-12 shadow-card text-center">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhum agendamento para esta data</p>
          </div>
        ) : (
          <AppointmentTable appointments={filteredAppointments} onAction={handleAction} />
        )}

        {/* Summary */}
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-card">
          <h3 className="font-semibold mb-4">Resumo do dia</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Consultas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/10">
              <p className="text-2xl font-bold text-success">{stats.confirmed}</p>
              <p className="text-xs text-muted-foreground">Confirmadas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/10">
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-danger/10">
              <p className="text-2xl font-bold text-danger">{stats.cancelled}</p>
              <p className="text-xs text-muted-foreground">Canceladas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-danger/10">
              <p className="text-2xl font-bold text-danger">{stats.atRisk}</p>
              <p className="text-xs text-muted-foreground">Em risco</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className="text-2xl font-bold text-primary">{stats.filled}</p>
              <p className="text-xs text-muted-foreground">Buracos preenchidos</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
