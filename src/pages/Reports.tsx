import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Bot,
  MessageSquare,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DateRangeFilter, DateRange } from '@/components/filters/DateRangeFilter';

const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export default function Reports() {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('custom');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [agentConversations, setAgentConversations] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: subMonths(new Date(), 1), to: new Date() });
  const [professionals, setProfessionals] = useState<any[]>([]);

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange.from || subMonths(new Date(), 1);
      const endDate = dateRange.to || new Date();
      
      // Load appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', startOfDay(startDate).toISOString())
        .lte('scheduled_at', endOfDay(endDate).toISOString())
        .order('scheduled_at', { ascending: true });

      setAppointments(appointmentsData || []);

      // Load agent conversations
      const { data: conversationsData } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('started_at', startOfDay(startDate).toISOString())
        .lte('started_at', endOfDay(endDate).toISOString())
        .order('started_at', { ascending: true });

      setAgentConversations(conversationsData || []);

      // Load professionals
      const { data: professionalsData } = await supabase
        .from('professionals')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      setProfessionals(professionalsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'confirmed' || a.status === 'filled').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    noShow: appointments.filter((a) => a.status === 'no_show').length,
    pending: appointments.filter((a) => a.status === 'pending').length,
  };

  const attendanceRate = stats.total > 0 
    ? Math.round(((stats.confirmed) / (stats.total - stats.pending)) * 100) || 0
    : 0;

  const cancellationRate = stats.total > 0 
    ? Math.round((stats.cancelled / stats.total) * 100) 
    : 0;

  // Status distribution for pie chart
  const statusData = [
    { name: 'Confirmados', value: stats.confirmed },
    { name: 'Pendentes', value: stats.pending },
    { name: 'Cancelados', value: stats.cancelled },
    { name: 'Não compareceu', value: stats.noShow },
  ].filter(d => d.value > 0);

  // Appointments by hour
  const appointmentsByHour = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // 8:00 to 19:00
    const count = appointments.filter((a) => {
      const apptHour = new Date(a.scheduled_at).getHours();
      return apptHour === hour;
    }).length;
    return { hour: `${hour}:00`, count };
  });

  // Appointments by day of week
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const appointmentsByDay = dayNames.map((name, index) => {
    const count = appointments.filter((a) => {
      return new Date(a.scheduled_at).getDay() === index;
    }).length;
    return { day: name, count };
  });

  // Performance by professional
  const professionalPerformance = professionals.map((prof) => {
    const profAppointments = appointments.filter((a) => a.professional_id === prof.id);
    const confirmed = profAppointments.filter((a) => a.status === 'confirmed' || a.status === 'filled').length;
    const total = profAppointments.length;
    return {
      name: prof.name,
      total,
      confirmed,
      rate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  }).filter(p => p.total > 0);

  // Agent stats
  const agentStats = {
    totalConversations: agentConversations.length,
    bookingSuccess: agentConversations.filter((c) => c.outcome === 'booking_success').length,
    bookingFailed: agentConversations.filter((c) => c.outcome === 'booking_failed').length,
    infoOnly: agentConversations.filter((c) => c.outcome === 'info_only').length,
    abandoned: agentConversations.filter((c) => c.outcome === 'abandoned').length,
  };

  const agentSuccessRate = agentStats.totalConversations > 0
    ? Math.round((agentStats.bookingSuccess / agentStats.totalConversations) * 100)
    : 0;

  // Daily trend
  const last30Days = eachDayOfInterval({
    start: subMonths(new Date(), 1),
    end: new Date(),
  });

  const dailyTrend = last30Days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const count = appointments.filter((a) => {
      const apptDate = new Date(a.scheduled_at);
      return apptDate >= dayStart && apptDate <= dayEnd;
    }).length;
    return {
      date: format(day, 'dd/MM'),
      consultas: count,
    };
  });

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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground mt-1">
              Métricas e análises de performance
            </p>
          </div>
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de consultas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de comparecimento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cancellationRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de cancelamento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.noShow}</p>
                <p className="text-sm text-muted-foreground">Não comparecimentos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="professionals">Profissionais</TabsTrigger>
            <TabsTrigger value="agent">Agente IA</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Daily Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendência Diária
                </CardTitle>
                <CardDescription>Consultas agendadas por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="consultas" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                  <CardDescription>Proporção de cada status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Appointments by Hour */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horários Populares
                  </CardTitle>
                  <CardDescription>Consultas por horário</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={appointmentsByHour}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="hour" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Appointments by Day */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Consultas por Dia da Semana</CardTitle>
                  <CardDescription>Distribuição semanal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={appointmentsByDay}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="count" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="professionals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Performance por Profissional
                </CardTitle>
                <CardDescription>Taxa de comparecimento e total de consultas</CardDescription>
              </CardHeader>
              <CardContent>
                {professionalPerformance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum dado de profissionais no período
                  </p>
                ) : (
                  <div className="space-y-4">
                    {professionalPerformance.map((prof) => (
                      <div key={prof.name} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {prof.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{prof.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {prof.total} consultas • {prof.confirmed} confirmadas
                            </p>
                          </div>
                        </div>
                        <Badge variant={prof.rate >= 80 ? 'default' : prof.rate >= 60 ? 'secondary' : 'destructive'}>
                          {prof.rate}% comparecimento
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent" className="space-y-6">
            {/* Agent Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{agentStats.totalConversations}</p>
                    <p className="text-sm text-muted-foreground">Conversas totais</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{agentSuccessRate}%</p>
                    <p className="text-sm text-muted-foreground">Taxa de sucesso</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{agentStats.bookingSuccess}</p>
                    <p className="text-sm text-muted-foreground">Agendamentos feitos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{agentStats.infoOnly}</p>
                    <p className="text-sm text-muted-foreground">Apenas informações</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resultados das Conversas</CardTitle>
                <CardDescription>Distribuição dos resultados do agente IA</CardDescription>
              </CardHeader>
              <CardContent>
                {agentStats.totalConversations === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma conversa do agente registrada no período
                  </p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Agendamento realizado', value: agentStats.bookingSuccess },
                            { name: 'Falha no agendamento', value: agentStats.bookingFailed },
                            { name: 'Apenas informações', value: agentStats.infoOnly },
                            { name: 'Abandonado', value: agentStats.abandoned },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[0, 1, 2, 3].map((index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
