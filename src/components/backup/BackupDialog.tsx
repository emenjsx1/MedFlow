import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Database, Users, Calendar, FileJson, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { exportToJSON, exportToCSV, patientExportColumns, appointmentExportColumns, professionalExportColumns } from '@/lib/export';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BackupStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'loading' | 'done' | 'error';
}

export default function BackupDialog({ open, onOpenChange }: BackupDialogProps) {
  const { tenantId } = useAuth();
  const [steps, setSteps] = useState<BackupStep[]>([
    { id: 'patients', label: 'Pacientes', icon: Users, status: 'pending' },
    { id: 'appointments', label: 'Agendamentos', icon: Calendar, status: 'pending' },
    { id: 'professionals', label: 'Profissionais', icon: Users, status: 'pending' },
    { id: 'messages', label: 'Mensagens', icon: Database, status: 'pending' },
    { id: 'settings', label: 'Configurações', icon: Database, status: 'pending' },
  ]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupData, setBackupData] = useState<Record<string, any[]>>({});

  const updateStepStatus = (id: string, status: BackupStep['status']) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const progress = (steps.filter(s => s.status === 'done').length / steps.length) * 100;

  const handleBackup = async () => {
    if (!tenantId) {
      toast.error('Tenant não encontrado');
      return;
    }

    setIsBackingUp(true);
    const data: Record<string, any[]> = {};

    try {
      // Fetch patients
      updateStepStatus('patients', 'loading');
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', tenantId);
      if (patientsError) throw patientsError;
      data.patients = patients || [];
      updateStepStatus('patients', 'done');

      // Fetch appointments
      updateStepStatus('appointments', 'loading');
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenant_id', tenantId);
      if (appointmentsError) throw appointmentsError;
      data.appointments = appointments || [];
      updateStepStatus('appointments', 'done');

      // Fetch professionals
      updateStepStatus('professionals', 'loading');
      const { data: professionals, error: professionalsError } = await supabase
        .from('professionals')
        .select('*')
        .eq('tenant_id', tenantId);
      if (professionalsError) throw professionalsError;
      data.professionals = professionals || [];
      updateStepStatus('professionals', 'done');

      // Fetch messages
      updateStepStatus('messages', 'loading');
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('tenant_id', tenantId);
      if (messagesError) throw messagesError;
      data.messages = messages || [];
      updateStepStatus('messages', 'done');

      // Fetch settings
      updateStepStatus('settings', 'loading');
      const { data: settings, error: settingsError } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenantId);
      if (settingsError) throw settingsError;
      data.settings = settings || [];
      updateStepStatus('settings', 'done');

      setBackupData(data);
      toast.success('Backup concluído com sucesso!');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Erro ao fazer backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadJSON = () => {
    const filename = `backup_agendaclin_${format(new Date(), 'yyyy-MM-dd_HH-mm')}`;
    exportToJSON(backupData as any, filename);
    toast.success('Backup JSON baixado!');
  };

  const handleDownloadCSVs = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    
    if (backupData.patients?.length > 0) {
      exportToCSV(backupData.patients, patientExportColumns, `pacientes_${dateStr}`);
    }
    if (backupData.appointments?.length > 0) {
      exportToCSV(backupData.appointments, appointmentExportColumns, `agendamentos_${dateStr}`);
    }
    if (backupData.professionals?.length > 0) {
      exportToCSV(backupData.professionals, professionalExportColumns, `profissionais_${dateStr}`);
    }
    
    toast.success('Arquivos CSV baixados!');
  };

  const handleReset = () => {
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const })));
    setBackupData({});
  };

  const hasBackupData = Object.keys(backupData).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Backup dos Dados
          </DialogTitle>
          <DialogDescription>
            Faça download de todos os dados da sua clínica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress */}
          {isBackingUp && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {Math.round(progress)}% concluído
              </p>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step) => (
              <div 
                key={step.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <step.icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1">{step.label}</span>
                {step.status === 'loading' && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
                {step.status === 'done' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {backupData[step.id]?.length || 0} itens
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Download buttons */}
          {hasBackupData && (
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium">Baixar backup:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleDownloadJSON} className="gap-2">
                  <FileJson className="w-4 h-4" />
                  JSON (completo)
                </Button>
                <Button variant="outline" onClick={handleDownloadCSVs} className="gap-2">
                  <Download className="w-4 h-4" />
                  CSVs (planilhas)
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {hasBackupData ? (
            <Button variant="outline" onClick={handleReset}>
              Fazer novo backup
            </Button>
          ) : (
            <Button onClick={handleBackup} disabled={isBackingUp} className="gap-2">
              {isBackingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fazendo backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Iniciar Backup
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
