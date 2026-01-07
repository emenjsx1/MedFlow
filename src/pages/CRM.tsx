import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Search,
  Users,
  UserPlus,
  Filter,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  Calendar,
  Star,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { PatientCRMPanel } from '@/components/crm/PatientCRMPanel';

interface Patient {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  status?: string;
  pipeline_stage?: string;
  tags?: string[];
  source?: string;
  priority?: number;
  total_appointments?: number;
  total_revenue?: number;
  last_interaction_at?: string;
  created_at?: string;
}

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'active', label: 'Ativo', color: 'bg-green-500' },
  { value: 'inactive', label: 'Inativo', color: 'bg-gray-500' },
  { value: 'vip', label: 'VIP', color: 'bg-amber-500' },
  { value: 'churned', label: 'Perdido', color: 'bg-red-500' },
];

const pipelineStages = [
  { value: 'new', label: 'Novo', icon: '🆕', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contactado', icon: '📞', color: 'bg-indigo-500' },
  { value: 'scheduled', label: 'Agendado', icon: '📅', color: 'bg-purple-500' },
  { value: 'attended', label: 'Atendido', icon: '✅', color: 'bg-green-500' },
  { value: 'follow_up', label: 'Follow-up', icon: '🔄', color: 'bg-amber-500' },
  { value: 'loyal', label: 'Fidelizado', icon: '⭐', color: 'bg-yellow-500' },
];

export default function CRM() {
  const { tenantId } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadPatients = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      let query = supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('last_interaction_at', { ascending: false, nullsFirst: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (pipelineFilter !== 'all') {
        query = query.eq('pipeline_stage', pipelineFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pacientes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, statusFilter, pipelineFilter]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.whatsapp.includes(searchQuery) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group patients by pipeline stage for kanban view
  const patientsByStage = pipelineStages.reduce((acc, stage) => {
    acc[stage.value] = filteredPatients.filter(p => (p.pipeline_stage || 'new') === stage.value);
    return acc;
  }, {} as Record<string, Patient[]>);

  // Calculate stats
  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    vip: patients.filter(p => p.status === 'vip').length,
    totalRevenue: patients.reduce((sum, p) => sum + (p.total_revenue || 0), 0),
  };

  const openPatientDetail = (patient: Patient) => {
    setSelectedPatient(patient);
    setSheetOpen(true);
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
            <h1 className="text-3xl font-bold">CRM de Pacientes</h1>
            <p className="text-muted-foreground mt-1">Gerencie relacionamentos e pipeline de vendas</p>
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

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Pacientes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.vip}</p>
                <p className="text-sm text-muted-foreground">VIP</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</p>
                <p className="text-sm text-muted-foreground">Receita Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.color && <div className={cn("w-2 h-2 rounded-full", opt.color)} />}
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Pipeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estágios</SelectItem>
                  {pipelineStages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      <span>{stage.icon} {stage.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="kanban" className="w-full">
          <TabsList>
            <TabsTrigger value="kanban">Pipeline Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {pipelineStages.map(stage => (
                <div key={stage.value} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stage.icon}</span>
                      <span className="font-medium text-sm">{stage.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {patientsByStage[stage.value]?.length || 0}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 pr-2">
                      {patientsByStage[stage.value]?.map(patient => (
                        <Card 
                          key={patient.id} 
                          className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => openPatientDetail(patient)}
                        >
                          <div className="space-y-2">
                            <p className="font-medium text-sm truncate">{patient.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{patient.whatsapp}</p>
                            <div className="flex items-center justify-between">
                              {patient.priority === 2 ? (
                                <Badge variant="destructive" className="text-[10px]">Urgente</Badge>
                              ) : patient.priority === 1 ? (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">Alta</Badge>
                              ) : (
                                <span />
                              )}
                              {patient.status === 'vip' && (
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                      {(!patientsByStage[stage.value] || patientsByStage[stage.value].length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Nenhum paciente
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {filteredPatients.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p>Nenhum paciente encontrado</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredPatients.map(patient => {
                        const stage = pipelineStages.find(s => s.value === (patient.pipeline_stage || 'new'));
                        const statusOpt = statusOptions.find(s => s.value === (patient.status || 'active'));
                        
                        return (
                          <div
                            key={patient.id}
                            className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => openPatientDetail(patient)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-sm font-medium text-primary">
                                  {patient.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{patient.name}</p>
                                  {patient.status === 'vip' && (
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {patient.whatsapp}
                                  </span>
                                  {patient.email && (
                                    <span className="flex items-center gap-1 hidden sm:flex">
                                      <Mail className="w-3 h-3" />
                                      {patient.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="hidden sm:flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {stage?.icon} {stage?.label}
                                </Badge>
                                {statusOpt?.color && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <div className={cn("w-2 h-2 rounded-full", statusOpt.color)} />
                                    {statusOpt.label}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right hidden md:block">
                                <p className="text-sm font-medium">
                                  {patient.total_appointments || 0} consultas
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  R$ {(patient.total_revenue || 0).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Patient Detail Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {selectedPatient?.name}
                {selectedPatient?.status === 'vip' && (
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                )}
              </SheetTitle>
            </SheetHeader>
            {selectedPatient && (
              <div className="mt-6">
                <PatientCRMPanel 
                  patient={selectedPatient} 
                  onUpdate={() => {
                    loadPatients();
                    // Update local selected patient
                    const updated = patients.find(p => p.id === selectedPatient.id);
                    if (updated) setSelectedPatient(updated);
                  }} 
                />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
