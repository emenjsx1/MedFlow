import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, User, Clock, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Professional {
  id: string;
  name: string;
  specialty: string | null;
  working_days: string[];
  business_hours_start: string;
  business_hours_end: string;
  appointment_duration_minutes: number;
  is_active: boolean;
  google_calendar_id: string | null;
}

const WEEKDAYS = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const defaultFormData = {
  name: "",
  specialty: "",
  working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  business_hours_start: "08:00",
  business_hours_end: "18:00",
  appointment_duration_minutes: 30,
  is_active: true,
  google_calendar_id: "",
};

export default function Professionals() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: professionals, isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Professional[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { error } = await supabase.from("professionals").insert({
        tenant_id: profile.tenant_id,
        name: data.name.trim(),
        specialty: data.specialty.trim() || null,
        working_days: data.working_days,
        business_hours_start: data.business_hours_start,
        business_hours_end: data.business_hours_end,
        appointment_duration_minutes: data.appointment_duration_minutes,
        is_active: data.is_active,
        google_calendar_id: data.google_calendar_id.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional adicionado com sucesso");
      handleCloseDialog();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao adicionar profissional");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("professionals")
        .update({
          name: data.name.trim(),
          specialty: data.specialty.trim() || null,
          working_days: data.working_days,
          business_hours_start: data.business_hours_start,
          business_hours_end: data.business_hours_end,
          appointment_duration_minutes: data.appointment_duration_minutes,
          is_active: data.is_active,
          google_calendar_id: data.google_calendar_id.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional atualizado com sucesso");
      handleCloseDialog();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar profissional");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional removido com sucesso");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao remover profissional");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfessional(null);
    setFormData(defaultFormData);
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormData({
      name: professional.name,
      specialty: professional.specialty || "",
      working_days: professional.working_days || defaultFormData.working_days,
      business_hours_start: professional.business_hours_start || "08:00",
      business_hours_end: professional.business_hours_end || "18:00",
      appointment_duration_minutes: professional.appointment_duration_minutes || 30,
      is_active: professional.is_active,
      google_calendar_id: professional.google_calendar_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (formData.working_days.length === 0) {
      toast.error("Selecione pelo menos um dia de trabalho");
      return;
    }

    if (editingProfessional) {
      updateMutation.mutate({ id: editingProfessional.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleWorkingDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day],
    }));
  };

  const formatWorkingDays = (days: string[]) => {
    return days
      .map((d) => WEEKDAYS.find((w) => w.value === d)?.label?.slice(0, 3))
      .filter(Boolean)
      .join(", ");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profissionais</h1>
            <p className="text-muted-foreground">
              Gerencie os profissionais e suas agendas
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setFormData(defaultFormData)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Profissional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingProfessional ? "Editar Profissional" : "Novo Profissional"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Dr. João Silva"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="specialty">Especialidade</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData((prev) => ({ ...prev, specialty: e.target.value }))}
                      placeholder="Cardiologista"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Dias de Trabalho *</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.value}
                            checked={formData.working_days.includes(day.value)}
                            onCheckedChange={() => toggleWorkingDay(day.value)}
                          />
                          <Label htmlFor={day.value} className="text-sm cursor-pointer">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start">Horário Início</Label>
                      <Input
                        id="start"
                        type="time"
                        value={formData.business_hours_start}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, business_hours_start: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end">Horário Fim</Label>
                      <Input
                        id="end"
                        type="time"
                        value={formData.business_hours_end}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, business_hours_end: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duração da Consulta (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={15}
                      max={180}
                      value={formData.appointment_duration_minutes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          appointment_duration_minutes: parseInt(e.target.value) || 30,
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="calendar">ID do Google Calendar (opcional)</Label>
                    <Input
                      id="calendar"
                      value={formData.google_calendar_id}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, google_calendar_id: e.target.value }))
                      }
                      placeholder="exemplo@group.calendar.google.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se vazio, usa o calendário principal da clínica
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_active: checked }))
                      }
                    />
                    <Label htmlFor="active">Ativo</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingProfessional ? "Salvar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Lista de Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !professionals?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum profissional cadastrado</p>
                <p className="text-sm">Adicione profissionais para gerenciar suas agendas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Especialidade</TableHead>
                    <TableHead className="hidden lg:table-cell">Horário</TableHead>
                    <TableHead className="hidden lg:table-cell">Dias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionals.map((prof) => (
                    <TableRow key={prof.id}>
                      <TableCell className="font-medium">{prof.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {prof.specialty || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {prof.business_hours_start?.slice(0, 5)} - {prof.business_hours_end?.slice(0, 5)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatWorkingDays(prof.working_days || [])}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={prof.is_active ? "default" : "secondary"}>
                          {prof.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(prof)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Profissional?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O profissional será removido
                                  permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(prof.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
