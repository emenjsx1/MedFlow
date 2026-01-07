import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  MoreHorizontal,
  Send,
  Trash2,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Loader2,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { DateRangeFilter, DateRange } from '@/components/filters/DateRangeFilter';

interface WaitlistEntry {
  id: string;
  patient_id: string;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  patient?: {
    name: string;
    whatsapp: string;
  } | null;
}

interface ReplacementSlot {
  id: string;
  patient_name: string;
  patient_phone: string | null;
  scheduled_at: string;
  status: string;
  professional_name: string | null;
}

export default function Waitlist() {
  const { tenantId } = useAuth();
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [replacements, setReplacements] = useState<ReplacementSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPreferredDate, setNewPreferredDate] = useState('');
  const [newPreferredTimeStart, setNewPreferredTimeStart] = useState('');
  const [newPreferredTimeEnd, setNewPreferredTimeEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('waitlist');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  // Filter data by date range
  const filteredWaitlist = dateRange.from || dateRange.to
    ? waitlist.filter((entry) => {
        const entryDate = new Date(entry.created_at);
        const from = dateRange.from ? startOfDay(dateRange.from) : null;
        const to = dateRange.to ? endOfDay(dateRange.to) : null;
        
        if (from && to) {
          return isWithinInterval(entryDate, { start: from, end: to });
        } else if (from) {
          return entryDate >= from;
        } else if (to) {
          return entryDate <= to;
        }
        return true;
      })
    : waitlist;

  const filteredReplacements = dateRange.from || dateRange.to
    ? replacements.filter((slot) => {
        const slotDate = new Date(slot.scheduled_at);
        const from = dateRange.from ? startOfDay(dateRange.from) : null;
        const to = dateRange.to ? endOfDay(dateRange.to) : null;
        
        if (from && to) {
          return isWithinInterval(slotDate, { start: from, end: to });
        } else if (from) {
          return slotDate >= from;
        } else if (to) {
          return slotDate <= to;
        }
        return true;
      })
    : replacements;

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  const loadData = async () => {
    try {
      // Load waitlist
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('waitlist')
        .select(`*, patient:patients(name, whatsapp)`)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (waitlistError) throw waitlistError;
      setWaitlist(waitlistData || []);

      // Load appointments in replacement status
      const { data: replacementData, error: replacementError } = await supabase
        .from('appointments')
        .select('id, patient_name, patient_phone, scheduled_at, status, professional_name')
        .eq('tenant_id', tenantId)
        .in('status', ['in_replacement', 'cancelled'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (replacementError) throw replacementError;
      setReplacements(replacementData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddToWaitlist = async () => {
    if (!newPatientName || !newPatientPhone) {
      toast.error('Preencha nome e telefone');
      return;
    }

    setSaving(true);
    try {
      let patientId: string;

      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('whatsapp', newPatientPhone)
        .maybeSingle();

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            tenant_id: tenantId,
            name: newPatientName,
            whatsapp: newPatientPhone,
          })
          .select('id')
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      const { error: waitlistError } = await supabase.from('waitlist').insert({
        tenant_id: tenantId,
        patient_id: patientId,
        preferred_date: newPreferredDate || null,
        preferred_time_start: newPreferredTimeStart || null,
        preferred_time_end: newPreferredTimeEnd || null,
        priority: waitlist.length + 1,
        is_active: true,
      });

      if (waitlistError) throw waitlistError;

      toast.success(newPatientName + ' adicionado à fila de espera');
      setIsDialogOpen(false);
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPreferredDate('');
      setNewPreferredTimeStart('');
      setNewPreferredTimeEnd('');
      loadData();
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast.error('Erro ao adicionar à fila');
    } finally {
      setSaving(false);
    }
  };

  const handleOfferSlot = async (patientName: string, whatsapp: string | undefined, slotDate?: string) => {
    if (!whatsapp) {
      toast.error('Paciente não tem WhatsApp cadastrado');
      return;
    }

    try {
      let slotMessage = 'Temos vagas disponíveis!';
      if (slotDate) {
        const slot = new Date(slotDate);
        slotMessage = `Temos uma vaga disponível: ${format(slot, "dd/MM 'às' HH:mm", { locale: ptBR })}`;
      }

      const { error } = await supabase.functions.invoke('send-manual-message', {
        body: {
          tenantId,
          patientPhone: whatsapp,
          message: `Olá ${patientName}! 🎉\n\n${slotMessage}\n\nDeseja agendar? Responda SIM para confirmar.\n\nAguardamos sua resposta!`,
        },
      });

      if (error) throw error;

      toast.success(`Vaga oferecida para ${patientName}`);
    } catch (error) {
      console.error('Error offering slot:', error);
      toast.error('Erro ao enviar oferta de vaga');
    }
  };

  const handleRemoveFromWaitlist = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from('waitlist').delete().eq('id', id);

      if (error) throw error;

      setWaitlist(waitlist.filter((w) => w.id !== id));
      toast.success(name + ' removido da fila');
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      toast.error('Erro ao remover da fila');
    }
  };

  const handleFillSlot = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'filled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Vaga marcada como preenchida');
      loadData();
    } catch (error) {
      console.error('Error filling slot:', error);
      toast.error('Erro ao preencher vaga');
    }
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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fila de Espera</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie pacientes aguardando e vagas disponíveis
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Adicionar à fila</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar à fila de espera</DialogTitle>
                  <DialogDescription>
                    Registre um paciente para receber notificações de vagas disponíveis
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Nome do paciente</Label>
                    <Input
                      id="patientName"
                      placeholder="Nome completo"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">WhatsApp</Label>
                    <Input
                      id="patientPhone"
                      placeholder="5511999999999"
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Data preferida (opcional)</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={newPreferredDate}
                      onChange={(e) => setNewPreferredDate(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="preferredTimeStart">Horário início</Label>
                      <Input
                        id="preferredTimeStart"
                        type="time"
                        value={newPreferredTimeStart}
                        onChange={(e) => setNewPreferredTimeStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredTimeEnd">Horário fim</Label>
                      <Input
                        id="preferredTimeEnd"
                        type="time"
                        value={newPreferredTimeEnd}
                        onChange={(e) => setNewPreferredTimeEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddToWaitlist} className="w-full" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Adicionar à fila
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitlist.length}</p>
                <p className="text-sm text-muted-foreground">Na fila de espera</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{replacements.length}</p>
                <p className="text-sm text-muted-foreground">Vagas disponíveis</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {replacements.filter((r) => r.status === 'in_replacement').length}
                </p>
                <p className="text-sm text-muted-foreground">Em reposição ativa</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="waitlist" className="gap-2">
              <Users className="w-4 h-4" />
              Pacientes na fila
              {waitlist.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {waitlist.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="replacements" className="gap-2">
              <Clock className="w-4 h-4" />
              Vagas/Reposições
              {replacements.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {replacements.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Waitlist Tab */}
          <TabsContent value="waitlist">
            <Card>
              <CardHeader>
                <CardTitle>Pacientes aguardando vagas</CardTitle>
                <CardDescription>
                  Ordenados por prioridade de entrada
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold w-12">#</TableHead>
                        <TableHead className="font-semibold">Paciente</TableHead>
                        <TableHead className="font-semibold">Preferência</TableHead>
                        <TableHead className="font-semibold">Na fila desde</TableHead>
                        <TableHead className="font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWaitlist.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            {waitlist.length > 0 ? 'Nenhum paciente encontrado no período.' : 'Nenhum paciente na fila de espera.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredWaitlist.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <span className="font-mono text-sm text-muted-foreground">
                                {entry.priority}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-accent">
                                    {(entry.patient?.name || 'P').charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{entry.patient?.name || 'Paciente'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {entry.patient?.whatsapp || ''}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {entry.preferred_date && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span>
                                      {format(new Date(entry.preferred_date), "dd 'de' MMM", {
                                        locale: ptBR,
                                      })}
                                    </span>
                                  </div>
                                )}
                                {(entry.preferred_time_start || entry.preferred_time_end) && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span>
                                      {entry.preferred_time_start || '?'} -{' '}
                                      {entry.preferred_time_end || '?'}
                                    </span>
                                  </div>
                                )}
                                {!entry.preferred_date && !entry.preferred_time_start && (
                                  <span className="text-sm text-muted-foreground">
                                    Qualquer horário
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {entry.created_at &&
                                  format(new Date(entry.created_at), "dd/MM 'às' HH:mm", {
                                    locale: ptBR,
                                  })}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOfferSlot(
                                        entry.patient?.name || 'Paciente',
                                        entry.patient?.whatsapp
                                      )
                                    }
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Oferecer vaga
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleRemoveFromWaitlist(
                                        entry.id,
                                        entry.patient?.name || 'Paciente'
                                      )
                                    }
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remover da fila
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Replacements Tab */}
          <TabsContent value="replacements">
            <Card>
              <CardHeader>
                <CardTitle>Vagas disponíveis para reposição</CardTitle>
                <CardDescription>
                  Consultas canceladas ou em reposição que podem ser preenchidas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Data/Hora</TableHead>
                        <TableHead className="font-semibold">Paciente original</TableHead>
                        <TableHead className="font-semibold">Profissional</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {replacements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            Nenhuma vaga disponível para reposição.
                          </TableCell>
                        </TableRow>
                      ) : (
                        replacements.map((slot) => (
                          <TableRow key={slot.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(slot.scheduled_at), "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(slot.scheduled_at), "HH:mm", { locale: ptBR })}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{slot.patient_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {slot.patient_phone || '-'}
                              </p>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {slot.professional_name || 'Não especificado'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  slot.status === 'in_replacement'
                                    ? 'border-warning/50 bg-warning/10 text-warning'
                                    : 'border-destructive/50 bg-destructive/10 text-destructive'
                                }
                              >
                                {slot.status === 'in_replacement' ? 'Em reposição' : 'Cancelado'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {waitlist.slice(0, 3).map((entry) => (
                                    <DropdownMenuItem
                                      key={entry.id}
                                      onClick={() =>
                                        handleOfferSlot(
                                          entry.patient?.name || 'Paciente',
                                          entry.patient?.whatsapp,
                                          slot.scheduled_at
                                        )
                                      }
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Oferecer para {entry.patient?.name?.split(' ')[0]}
                                    </DropdownMenuItem>
                                  ))}
                                  {waitlist.length === 0 && (
                                    <DropdownMenuItem disabled>
                                      <Users className="w-4 h-4 mr-2" />
                                      Fila vazia
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleFillSlot(slot.id)}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Marcar como preenchido
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
