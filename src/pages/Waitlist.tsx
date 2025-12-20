import { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WaitlistEntry {
  id: string;
  patientName: string;
  patientPhone: string;
  preferredDate?: string;
  preferredTime?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

const mockWaitlist: WaitlistEntry[] = [
  {
    id: '1',
    patientName: 'Luciana Almeida',
    patientPhone: '(11) 99999-1111',
    preferredDate: '2024-12-20',
    preferredTime: '14:00 - 16:00',
    priority: 1,
    isActive: true,
    createdAt: '2024-12-18T10:30:00',
  },
  {
    id: '2',
    patientName: 'Ricardo Mendes',
    patientPhone: '(11) 98888-2222',
    preferredTime: 'Manhã',
    priority: 2,
    isActive: true,
    createdAt: '2024-12-17T15:45:00',
  },
  {
    id: '3',
    patientName: 'Camila Rodrigues',
    patientPhone: '(11) 97777-3333',
    priority: 3,
    isActive: true,
    createdAt: '2024-12-16T09:00:00',
  },
  {
    id: '4',
    patientName: 'Fernando Costa',
    patientPhone: '(11) 96666-4444',
    preferredDate: '2024-12-21',
    priority: 4,
    isActive: false,
    createdAt: '2024-12-15T14:20:00',
  },
];

export default function Waitlist() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(mockWaitlist);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPreferredDate, setNewPreferredDate] = useState('');
  const [newPreferredTime, setNewPreferredTime] = useState('');

  const activeCount = waitlist.filter((w) => w.isActive).length;

  const handleAddToWaitlist = () => {
    if (!newPatientName || !newPatientPhone) {
      toast.error('Preencha nome e telefone');
      return;
    }

    const newEntry: WaitlistEntry = {
      id: String(Date.now()),
      patientName: newPatientName,
      patientPhone: newPatientPhone,
      preferredDate: newPreferredDate || undefined,
      preferredTime: newPreferredTime || undefined,
      priority: waitlist.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setWaitlist([...waitlist, newEntry]);
    setIsDialogOpen(false);
    setNewPatientName('');
    setNewPatientPhone('');
    setNewPreferredDate('');
    setNewPreferredTime('');
    toast.success(newPatientName + ' adicionado à fila de espera');
  };

  const handleOfferSlot = (id: string, name: string) => {
    toast.success('Vaga oferecida para ' + name);
  };

  const handleRemove = (id: string, name: string) => {
    setWaitlist(waitlist.filter((w) => w.id !== id));
    toast.success(name + ' removido da fila');
  };

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
                    placeholder="(11) 99999-9999"
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
                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Horário preferido (opcional)</Label>
                  <Input
                    id="preferredTime"
                    placeholder="Ex: Manhã, 14:00-16:00"
                    value={newPreferredTime}
                    onChange={(e) => setNewPreferredTime(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddToWaitlist} className="w-full">
                  Adicionar à fila
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Encaixes este mês</p>
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
                    <TableRow key={entry.id} className={!entry.isActive ? 'opacity-50' : ''}>
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">
                          {entry.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-accent">
                              {entry.patientName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{entry.patientName}</p>
                            <p className="text-xs text-muted-foreground">{entry.patientPhone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.preferredDate && (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span>{format(new Date(entry.preferredDate), "dd 'de' MMM", { locale: ptBR })}</span>
                            </div>
                          )}
                          {entry.preferredTime && (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span>{entry.preferredTime}</span>
                            </div>
                          )}
                          {!entry.preferredDate && !entry.preferredTime && (
                            <span className="text-sm text-muted-foreground">Qualquer horário</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            entry.isActive
                              ? 'border-success/50 bg-success/10 text-success'
                              : 'border-muted-foreground/30'
                          }
                        >
                          {entry.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
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
                              onClick={() => handleOfferSlot(entry.id, entry.patientName)}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Oferecer vaga
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemove(entry.id, entry.patientName)}
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
