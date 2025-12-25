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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  MoreHorizontal,
  Search,
  Users,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Edit,
  Trash2,
  AlertTriangle,
  History,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import PatientHistorySheet from '@/components/patients/PatientHistorySheet';
import { exportToCSV, patientExportColumns } from '@/lib/export';

interface Patient {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  notes: string | null;
  risk_score: number | null;
  created_at: string;
  updated_at: string;
  appointment_count?: number;
  last_appointment?: string | null;
}

export default function Patients() {
  const { tenantId } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientNotes, setNewPatientNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadPatients();
    }
  }, [tenantId]);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Get appointment counts for each patient
      const patientsWithCounts = await Promise.all(
        (data || []).map(async (patient) => {
          const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patient.id);

          const { data: lastAppt } = await supabase
            .from('appointments')
            .select('scheduled_at')
            .eq('patient_id', patient.id)
            .order('scheduled_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...patient,
            appointment_count: count || 0,
            last_appointment: lastAppt?.scheduled_at || null,
          };
        })
      );

      setPatients(patientsWithCounts);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  const handleAddPatient = async () => {
    if (!newPatientName || !newPatientPhone) {
      toast.error('Preencha nome e telefone');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('patients').insert({
        tenant_id: tenantId,
        name: newPatientName,
        whatsapp: newPatientPhone,
        email: newPatientEmail || null,
        notes: newPatientNotes || null,
      });

      if (error) throw error;

      toast.success('Paciente adicionado com sucesso');
      setIsDialogOpen(false);
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientEmail('');
      setNewPatientNotes('');
      loadPatients();
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Erro ao adicionar paciente');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${name}?`)) return;

    try {
      const { error } = await supabase.from('patients').delete().eq('id', id);

      if (error) throw error;

      setPatients(patients.filter((p) => p.id !== id));
      toast.success('Paciente excluído');
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Erro ao excluir paciente');
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.whatsapp.includes(searchQuery) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            <h1 className="text-3xl font-bold">Pacientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua base de pacientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                exportToCSV(filteredPatients, patientExportColumns, `pacientes_${format(new Date(), 'yyyy-MM-dd')}`);
                toast.success('Pacientes exportados!');
              }}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
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
                  <span className="hidden sm:inline">Novo Paciente</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Paciente</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo paciente no sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Nome *</Label>
                    <Input
                      id="patientName"
                      placeholder="Nome completo"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">WhatsApp *</Label>
                    <Input
                      id="patientPhone"
                      placeholder="5511999999999"
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientEmail">Email (opcional)</Label>
                    <Input
                      id="patientEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newPatientEmail}
                      onChange={(e) => setNewPatientEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientNotes">Observações (opcional)</Label>
                    <Input
                      id="patientNotes"
                      placeholder="Anotações sobre o paciente"
                      value={newPatientNotes}
                      onChange={(e) => setNewPatientNotes(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddPatient} className="w-full" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Adicionar Paciente
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
                <p className="text-2xl font-bold">{patients.length}</p>
                <p className="text-sm text-muted-foreground">Total de pacientes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {patients.reduce((acc, p) => acc + (p.appointment_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total de consultas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {patients.filter((p) => (p.risk_score || 0) > 50).length}
                </p>
                <p className="text-sm text-muted-foreground">Alto risco</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Patients Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Lista de Pacientes</CardTitle>
            <CardDescription>
              {filteredPatients.length} paciente(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Paciente</TableHead>
                    <TableHead className="font-semibold">Contato</TableHead>
                    <TableHead className="font-semibold">Consultas</TableHead>
                    <TableHead className="font-semibold">Última consulta</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Nenhum paciente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {patient.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              {patient.notes && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {patient.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {patient.whatsapp}
                            </div>
                            {patient.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {patient.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{patient.appointment_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          {patient.last_appointment ? (
                            <span className="text-sm">
                              {format(new Date(patient.last_appointment), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedPatient(patient);
                                setHistoryOpen(true);
                              }}>
                                <History className="w-4 h-4 mr-2" />
                                Ver histórico
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Enviar mensagem
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeletePatient(patient.id, patient.name)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
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

        {/* Patient History Sheet */}
        <PatientHistorySheet
          patient={selectedPatient}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      </div>
    </DashboardLayout>
  );
}
