import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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

export default function Waitlist() {
  const { tenantId } = useAuth();
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPreferredDate, setNewPreferredDate] = useState('');
  const [newPreferredTimeStart, setNewPreferredTimeStart] = useState('');
  const [newPreferredTimeEnd, setNewPreferredTimeEnd] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadWaitlist();
    }
  }, [tenantId]);

  const loadWaitlist = async () => {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select(`*, patient:patients(name, whatsapp)`)
        .eq('tenant_id', tenantId)
        .order('priority', { ascending: true });

      if (error) throw error;
      setWaitlist(data || []);
    } catch (error) {
      console.error('Error loading waitlist:', error);
      toast.error('Erro ao carregar fila de espera');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWaitlist();
  };

  const activeCount = waitlist.filter((w) => w.is_active).length;

  const handleAddToWaitlist = async () => {
    if (!newPatientName || !newPatientPhone) {
      toast.error('Preencha nome e telefone');
      return;
    }

    setSaving(true);
    try {
      // Create or find patient
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

      // Add to waitlist
      const { error: waitlistError } = await supabase
        .from('waitlist')
        .insert({
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
      loadWaitlist();
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast.error('Erro ao adicionar à fila');
    } finally {
      setSaving(false);
    }
  };

  const handleOfferSlot = async (id: string, name: string, whatsapp: string | undefined) => {
    if (!whatsapp) {
      toast.error('Paciente não tem WhatsApp cadastrado');
      return;
    }
    
    try {
      // Get next available slots
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { data: appointments } = await supabase
        .from('appointments')
        .select('scheduled_at')
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', today.toISOString())
        .lte('scheduled_at', nextWeek.toISOString())
        .in('status', ['cancelled', 'no_show', 'in_replacement']);
      
      let slotMessage = 'Temos vagas disponíveis esta semana!';
      if (appointments && appointments.length > 0) {
        const slot = new Date(appointments[0].scheduled_at);
        slotMessage = `Temos uma vaga disponível: ${format(slot, "dd/MM 'às' HH:mm", { locale: ptBR })}`;
      }
      
      const { error } = await supabase.functions.invoke('send-manual-message', {
        body: {
          tenantId,
          patientPhone: whatsapp,
          message: `Olá ${name}! 🎉\n\n${slotMessage}\n\nDeseja agendar? Responda SIM para confirmar.\n\nAguardamos sua resposta!`,
        },
      });
      
      if (error) throw error;
      
      toast.success(`Vaga oferecida para ${name}`);
    } catch (error) {
      console.error('Error offering slot:', error);
      toast.error('Erro ao enviar oferta de vaga');
    }
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setWaitlist(waitlist.filter((w) => w.id !== id));
      toast.success(name + ' removido da fila');
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      toast.error('Erro ao remover da fila');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fila de Espera</h1>
            <p className="text-muted-foreground mt-1">
              Pacientes aguardando por vagas de encaixe
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              Atualizar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar à fila
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

        {/* Explicação da fila de espera */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Como funciona a Fila de Espera?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Pacientes aguardando vagas</p>
                <p className="text-muted-foreground">Adicione pacientes que querem consulta mas não encontraram horário disponível.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Prioridade automática</p>
                <p className="text-muted-foreground">Pacientes são ordenados por ordem de entrada. O primeiro da fila tem prioridade.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Oferecer vaga</p>
                <p className="text-muted-foreground">Quando uma consulta é cancelada, clique em "Oferecer para fila" no Painel do Dia para notificar os pacientes da fila via WhatsApp.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-success" />
              </div>
              <div>
                <p className="font-medium">Preenchimento</p>
                <p className="text-muted-foreground">O paciente responde via WhatsApp confirmando interesse e a vaga é preenchida!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitlist.length}</p>
                <p className="text-sm text-muted-foreground">Total na fila</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{waitlist.length - activeCount}</p>
                <p className="text-sm text-muted-foreground">Inativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waitlist table */}
        <Card>
          <CardHeader>
            <CardTitle>Pacientes na fila</CardTitle>
            <CardDescription>
              Ordenados por prioridade de entrada
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold w-12">#</TableHead>
                  <TableHead className="font-semibold">Paciente</TableHead>
                  <TableHead className="font-semibold">Preferência</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Na fila desde</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhum paciente na fila de espera.
                    </TableCell>
                  </TableRow>
                ) : (
                  waitlist.map((entry) => (
                    <TableRow key={entry.id} className={!entry.is_active ? 'opacity-50' : ''}>
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
                            <p className="text-xs text-muted-foreground">{entry.patient?.whatsapp || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.preferred_date && (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span>{format(new Date(entry.preferred_date), "dd 'de' MMM", { locale: ptBR })}</span>
                            </div>
                          )}
                          {(entry.preferred_time_start || entry.preferred_time_end) && (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span>
                                {entry.preferred_time_start || '?'} - {entry.preferred_time_end || '?'}
                              </span>
                            </div>
                          )}
                          {!entry.preferred_date && !entry.preferred_time_start && (
                            <span className="text-sm text-muted-foreground">Qualquer horário</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            entry.is_active
                              ? 'border-success/50 bg-success/10 text-success'
                              : 'border-muted-foreground/30'
                          }
                        >
                          {entry.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {entry.created_at && format(new Date(entry.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
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
                              onClick={() => handleOfferSlot(entry.id, entry.patient?.name || 'Paciente', entry.patient?.whatsapp)}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Oferecer vaga
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemove(entry.id, entry.patient?.name || 'Paciente')}
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
