import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Send,
  Image,
  Mic,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Upload,
  Trash2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

// Message templates for dental clinic
const messageTemplates = [
  {
    id: 'reminder',
    name: '📅 Lembrete de Consulta',
    message: 'Olá {nome}! 🦷\n\nPassando para lembrar da sua consulta agendada conosco.\n\nEm caso de dúvidas, estamos à disposição!\n\nClínica Sorriso Perfeito',
  },
  {
    id: 'return',
    name: '🔄 Retorno Preventivo',
    message: 'Olá {nome}! 😊\n\nJá faz algum tempo desde sua última visita. Que tal agendar uma consulta de rotina?\n\nA prevenção é o melhor tratamento! 🦷\n\nAguardamos seu contato.\n\nClínica Sorriso Perfeito',
  },
  {
    id: 'promo',
    name: '💰 Promoção Especial',
    message: 'Olá {nome}! 🎉\n\nTemos uma promoção especial para você!\n\n✨ Clareamento Dental com 20% de desconto\n✨ Limpeza + Avaliação por apenas 300 MT\n\nPromoção válida até o fim do mês. Agende já!\n\nClínica Sorriso Perfeito',
  },
  {
    id: 'birthday',
    name: '🎂 Feliz Aniversário',
    message: 'Olá {nome}! 🎂🎈\n\nA equipe da Clínica Sorriso Perfeito deseja um Feliz Aniversário!\n\nComo presente especial, você ganha 15% de desconto em qualquer tratamento este mês!\n\nPasse para nos visitar! 🦷✨',
  },
  {
    id: 'holiday',
    name: '🎄 Boas Festas',
    message: 'Olá {nome}! ✨\n\nA equipe da Clínica Sorriso Perfeito deseja Boas Festas e um Ano Novo repleto de saúde e sorrisos!\n\n🎄 Que 2025 seja incrível!\n\nObrigado por confiar em nós. 🦷💙',
  },
  {
    id: 'thanks',
    name: '💙 Agradecimento',
    message: 'Olá {nome}! 😊\n\nAgradecemos pela confiança em nosso trabalho!\n\nSua satisfação é nossa maior recompensa. Se precisar de algo, estamos sempre à disposição.\n\nUm abraço da equipe!\n\nClínica Sorriso Perfeito 🦷',
  },
];

interface Campaign {
  id: string;
  name: string;
  message: string | null;
  image_url: string | null;
  audio_url: string | null;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
}

interface Patient {
  id: string;
  name: string;
  whatsapp: string;
}

export default function Campaigns() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!tenantId,
  });

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['patients-list', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, whatsapp')
        .order('name');
      
      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!tenantId,
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error('Tenant not found');
      if (selectedPatients.length === 0) throw new Error('Selecione pelo menos um paciente');
      if (!newCampaign.name) throw new Error('Nome da campanha é obrigatório');
      if (!newCampaign.message && !imageFile && !audioFile) {
        throw new Error('Adicione uma mensagem, imagem ou áudio');
      }

      setIsUploading(true);

      let imageUrl = null;
      let audioUrl = null;

      // Upload image if exists
      if (imageFile) {
        const fileName = `${tenantId}/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('campaign-media')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('campaign-media')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // Upload audio if exists
      if (audioFile) {
        const fileName = `${tenantId}/${Date.now()}_${audioFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('campaign-media')
          .upload(fileName, audioFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('campaign-media')
          .getPublicUrl(fileName);
        
        audioUrl = urlData.publicUrl;
      }

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          tenant_id: tenantId,
          name: newCampaign.name,
          message: newCampaign.message || null,
          image_url: imageUrl,
          audio_url: audioUrl,
          status: 'draft',
          total_recipients: selectedPatients.length,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create recipients
      const recipients = selectedPatients.map(patientId => ({
        campaign_id: campaign.id,
        patient_id: patientId,
        status: 'pending',
      }));

      const { error: recipientsError } = await supabase
        .from('campaign_recipients')
        .insert(recipients);

      if (recipientsError) throw recipientsError;

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDialogOpen(false);
      setNewCampaign({ name: '', message: '' });
      setSelectedPatients([]);
      setImageFile(null);
      setAudioFile(null);
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar campanha');
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: { campaignId, tenantId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(`Campanha enviada! ${data.sent} enviados, ${data.failed} falhas`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar campanha');
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha excluída');
    },
    onError: () => {
      toast.error('Erro ao excluir campanha');
    },
  });

  const toggleSelectAll = () => {
    if (selectedPatients.length === patients?.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients?.map(p => p.id) || []);
    }
  };

  const togglePatient = (patientId: string) => {
    setSelectedPatients(prev =>
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
    draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground', icon: Clock },
    sending: { label: 'Enviando', className: 'bg-primary/15 text-primary', icon: Loader2 },
    completed: { label: 'Concluída', className: 'bg-success/15 text-success', icon: CheckCircle2 },
    cancelled: { label: 'Cancelada', className: 'bg-destructive/15 text-destructive', icon: XCircle },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campanhas</h1>
            <p className="text-muted-foreground">
              Envie mensagens em massa para seus pacientes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Campaign Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Campanha</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Feliz Natal 2024"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  />
                </div>

                {/* Message Templates */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Templates Prontos
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {messageTemplates.map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setNewCampaign({ 
                          ...newCampaign, 
                          message: template.message,
                          name: newCampaign.name || template.name.replace(/^[^\s]+\s/, '')
                        })}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="message">Mensagem</Label>
                    <span className="text-xs text-muted-foreground">
                      Variáveis: {'{nome}'}, {'{clinica}'}, {'{telefone}'}
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Olá {nome}! Desejamos um Feliz Natal..."
                    value={newCampaign.message}
                    onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                    rows={5}
                    className="font-mono text-sm"
                  />
                  {newCampaign.message && (
                    <p className="text-xs text-muted-foreground">
                      {newCampaign.message.length} caracteres
                    </p>
                  )}
                </div>

                {/* Media Upload */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Imagem (opcional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {imageFile ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm truncate">{imageFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setImageFile(null)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Clique para upload
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Áudio (opcional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {audioFile ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm truncate">{audioFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAudioFile(null)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Mic className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Clique para upload
                          </span>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Patient Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Selecionar Destinatários</Label>
                    <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                      {selectedPatients.length === patients?.length
                        ? 'Desmarcar todos'
                        : 'Selecionar todos'}
                    </Button>
                  </div>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {patients?.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 border-b last:border-0"
                      >
                        <Checkbox
                          checked={selectedPatients.includes(patient.id)}
                          onCheckedChange={() => togglePatient(patient.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">{patient.whatsapp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatients.length} paciente(s) selecionado(s)
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => createCampaignMutation.mutate()}
                    disabled={isUploading || createCampaignMutation.isPending}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Campanha
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaigns?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total de Campanhas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {campaigns?.reduce((acc, c) => acc + c.sent_count, 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {campaigns?.reduce((acc, c) => acc + c.failed_count, 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Falhas de Envio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : campaigns?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma campanha criada ainda.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destinatários</TableHead>
                    <TableHead>Enviados</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns?.map((campaign) => {
                    const status = statusConfig[campaign.status] || statusConfig.draft;
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {campaign.image_url && <Image className="w-3 h-3" />}
                                {campaign.audio_url && <Mic className="w-3 h-3" />}
                                {campaign.message && (
                                  <span className="truncate max-w-[200px]">
                                    {campaign.message.substring(0, 50)}...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={status.className}>
                            <StatusIcon className={`w-3 h-3 mr-1 ${campaign.status === 'sending' ? 'animate-spin' : ''}`} />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{campaign.total_recipients}</TableCell>
                        <TableCell>
                          <span className="text-success">{campaign.sent_count}</span>
                          {campaign.failed_count > 0 && (
                            <span className="text-destructive"> / {campaign.failed_count} falhas</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(campaign.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {campaign.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => sendCampaignMutation.mutate(campaign.id)}
                                disabled={sendCampaignMutation.isPending}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Enviar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Excluir esta campanha?')) {
                                  deleteCampaignMutation.mutate(campaign.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
