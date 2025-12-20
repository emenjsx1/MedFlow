import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import AppointmentTable, { Appointment } from '@/components/dashboard/AppointmentTable';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for the MVP
const mockAppointments: Appointment[] = [
  {
    id: '1',
    patient_name: 'Maria Silva',
    patient_phone: '(11) 99999-1234',
    scheduled_at: new Date().toISOString().replace(/T.*/, 'T09:00:00'),
    status: 'confirmed',
    risk_level: 'low',
    professional_name: 'Dr. Carlos Oliveira',
    last_contact_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    patient_name: 'João Santos',
    patient_phone: '(11) 98888-5678',
    scheduled_at: new Date().toISOString().replace(/T.*/, 'T10:30:00'),
    status: 'pending',
    risk_level: 'medium',
    professional_name: 'Dr. Carlos Oliveira',
    last_contact_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    patient_name: 'Ana Costa',
    patient_phone: '(11) 97777-9012',
    scheduled_at: new Date().toISOString().replace(/T.*/, 'T11:00:00'),
    status: 'pending',
    risk_level: 'high',
    professional_name: 'Dra. Paula Mendes',
  },
  {
    id: '4',
    patient_name: 'Pedro Ferreira',
    patient_phone: '(11) 96666-3456',
    scheduled_at: new Date().toISOString().replace(/T.*/, 'T14:00:00'),
    status: 'cancelled',
    risk_level: 'low',
    professional_name: 'Dr. Carlos Oliveira',
    last_contact_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '5',
    patient_name: 'Carla Rocha',
    patient_phone: '(11) 95555-7890',
    scheduled_at: new Date().toISOString().replace(/T.*/, 'T14:30:00'),
    status: 'in_replacement',
    risk_level: 'low',
    professional_name: 'Dr. Carlos Oliveira',
  },
  {
    id: '6',
    patient_name: 'Roberto Lima',
    patient_phone: '(11) 94444-2345',
    scheduled_at: new Date().toISOString().replace(/T.*/, 'T15:30:00'),
    status: 'confirmed',
    risk_level: 'low',
    professional_name: 'Dra. Paula Mendes',
    last_contact_at: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: '7',
    patient_name: 'Fernanda Souza',
    patient_phone: '(11) 93333-6789',
    scheduled_at: new Date().toISOString().replace(/T.*/, 'T16:00:00'),
    status: 'pending',
    risk_level: 'low',
    professional_name: 'Dr. Carlos Oliveira',
  },
];

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate stats
  const stats = {
    total: mockAppointments.length,
    confirmed: mockAppointments.filter((a) => a.status === 'confirmed').length,
    pending: mockAppointments.filter((a) => a.status === 'pending').length,
    cancelled: mockAppointments.filter((a) => a.status === 'cancelled' || a.status === 'no_show').length,
    atRisk: mockAppointments.filter((a) => a.risk_level === 'high' || a.risk_level === 'medium').length,
    filled: mockAppointments.filter((a) => a.status === 'filled').length,
  };

  // Filter appointments
  const filteredAppointments = mockAppointments.filter((appointment) => {
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesSearch = appointment.patient_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAction = (id: string, action: string) => {
    console.log('Action:', action, 'on appointment:', id);
    // Here you would call the API to perform the action
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate((current) =>
      direction === 'prev' ? subDays(current, 1) : addDays(current, 1)
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Painel do Dia</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as consultas e confirmações de hoje
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sincronizar agenda
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

        {/* Table */}
        <AppointmentTable appointments={filteredAppointments} onAction={handleAction} />

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
