import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  MessageSquare,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Clock,
  RefreshCw,
  Loader2,
  QrCode,
  Building2,
  MapPin,
  Phone,
  Bot,
  Key,
  Plus,
  Trash2,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCalendarName, setGoogleCalendarName] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappState, setWhatsappState] = useState<'open' | 'close' | 'connecting' | 'unknown'>('unknown');
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);
  
  // QR Code modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  // Rules state
  const [confirmHoursBefore, setConfirmHoursBefore] = useState(24);
  const [reconfirmHoursBefore, setReconfirmHoursBefore] = useState(3);
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [responseWindowHours, setResponseWindowHours] = useState(2);
  const [minHoursForReplacement, setMinHoursForReplacement] = useState(2);

  // Templates
  const [confirmationTemplate, setConfirmationTemplate] = useState(
    'Olá {nome}! Confirmando sua consulta para {data} às {hora}. Responda: 1-Confirmar, 2-Cancelar, 3-Reagendar'
  );
  const [reconfirmationTemplate, setReconfirmationTemplate] = useState(
    'Olá {nome}, não recebemos sua confirmação. Sua consulta está marcada para {hora}. Confirma? 1-Sim, 2-Cancelar'
  );

  // Clinic config state
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [businessHoursStart, setBusinessHoursStart] = useState('08:00');
  const [businessHoursEnd, setBusinessHoursEnd] = useState('18:00');
  const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [appointmentDuration, setAppointmentDuration] = useState(30);
  const [useCustomOpenai, setUseCustomOpenai] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [agentGreeting, setAgentGreeting] = useState('Olá! Bem-vindo à nossa clínica. Como posso ajudá-lo hoje?');
  const [agentBusinessContext, setAgentBusinessContext] = useState('');
  const [agentFaqs, setAgentFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [savingClinic, setSavingClinic] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Handle OAuth callback from URL params
  useEffect(() => {
    const googleSuccess = searchParams.get('google_success');
    const googleError = searchParams.get('google_error');
    const calendarName = searchParams.get('calendar_name');

    if (googleSuccess === 'true') {
      setGoogleConnected(true);
      setGoogleCalendarName(calendarName || 'Calendário Principal');
      toast.success('Google Agenda conectado com sucesso!');
      // Clean up URL
      navigate('/settings', { replace: true });
    } else if (googleError) {
      toast.error('Erro ao conectar Google: ' + googleError);
      navigate('/settings', { replace: true });
    }
  }, [searchParams, navigate]);

  // Load initial status and clinic settings
  useEffect(() => {
    loadIntegrationStatus();
    loadClinicSettings();
  }, []);

  const loadClinicSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile?.tenant_id) return;

      const { data: settings } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      if (settings) {
        setClinicName(settings.clinic_name || '');
        setClinicAddress(settings.clinic_address || '');
        setClinicPhone(settings.clinic_phone || '');
        setBusinessHoursStart(settings.business_hours_start || '08:00');
        setBusinessHoursEnd(settings.business_hours_end || '18:00');
        setWorkingDays(settings.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
        setAppointmentDuration(settings.appointment_duration_minutes || 30);
        setUseCustomOpenai(settings.use_custom_openai || false);
        setAgentGreeting(settings.agent_greeting_message || 'Olá! Bem-vindo à nossa clínica. Como posso ajudá-lo hoje?');
        setAgentBusinessContext((settings as any).agent_business_context || '');
        setAgentFaqs((settings as any).agent_faqs || []);
      }

      // Load OpenAI API key from tenant_secrets (admin only)
      const { data: secrets } = await supabase
        .from('tenant_secrets')
        .select('openai_api_key')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();
      
      if (secrets) {
        setOpenaiApiKey(secrets.openai_api_key || '');
      }
    } catch (error) {
      console.error('Error loading clinic settings:', error);
    }
  };

  const loadIntegrationStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check WhatsApp status - handle errors gracefully
      try {
        const whatsappResponse = await supabase.functions.invoke('whatsapp-qrcode', {
          body: { action: 'status' },
        });
        console.log('WhatsApp status:', whatsappResponse.data);

        const state = whatsappResponse.data?.state as 'open' | 'close' | 'connecting' | undefined;
        setWhatsappState(state || 'unknown');
        setLastStatusCheck(new Date());

        if (whatsappResponse.data?.connected || state === 'open') {
          setWhatsappConnected(true);
        } else {
          setWhatsappConnected(false);
        }
      } catch (e) {
        console.log('WhatsApp status check failed (instance may not exist yet)');
        setWhatsappState('unknown');
      }

      // Check Google Calendar status
      try {
        const googleResponse = await supabase.functions.invoke('google-calendar-auth', {
          body: { action: 'status' },
        });
        console.log('Google Calendar status:', googleResponse.data);

        if (googleResponse.data?.connected) {
          setGoogleConnected(true);
          setGoogleCalendarName(googleResponse.data.calendarId || 'Calendário Principal');
        }
      } catch (e) {
        console.log('Google Calendar status check failed');
      }
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const handleSaveClinicSettings = async () => {
    setSavingClinic(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', session.user.id)
        .single();

      if (!profile?.tenant_id) throw new Error('Tenant not found');

      // Save non-sensitive settings to tenant_settings
      const { error } = await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: profile.tenant_id,
          clinic_name: clinicName,
          clinic_address: clinicAddress,
          clinic_phone: clinicPhone,
          business_hours_start: businessHoursStart,
          business_hours_end: businessHoursEnd,
          working_days: workingDays,
          appointment_duration_minutes: appointmentDuration,
          use_custom_openai: useCustomOpenai,
          agent_greeting_message: agentGreeting,
          agent_business_context: agentBusinessContext,
          agent_faqs: agentFaqs,
        } as any, { onConflict: 'tenant_id' });

      // Save OpenAI API key to tenant_secrets (secure storage)
      if (useCustomOpenai && openaiApiKey) {
        await supabase
          .from('tenant_secrets')
          .upsert({
            tenant_id: profile.tenant_id,
            openai_api_key: openaiApiKey,
          }, { onConflict: 'tenant_id' });
      }

      if (error) throw error;
      toast.success('Configurações da clínica salvas!');
    } catch (error) {
      console.error('Error saving clinic settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSavingClinic(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    setWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleConnectGoogle = async () => {
    try {
      const returnUrl = window.location.origin + '/settings';
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'getAuthUrl', returnUrl },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Redirect to Google OAuth (not popup)
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting Google:', error);
      toast.error('Erro ao conectar Google Agenda');
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'disconnect' },
      });
      setGoogleConnected(false);
      setGoogleCalendarName('');
      toast.success('Google Agenda desconectado');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar');
    }
  };

  const handleConnectWhatsapp = async () => {
    setQrModalOpen(true);
    setQrLoading(true);
    setQrCode('');

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: { action: 'create' },
      });

      console.log('WhatsApp create response:', data, error);

      if (error) throw error;

      if (data?.alreadyConnected) {
        setWhatsappConnected(true);
        setQrModalOpen(false);
        toast.success('WhatsApp já está conectado!');
        return;
      }

      if (data?.qrcode) {
        setQrCode(data.qrcode);
        // Start polling for connection status
        startStatusPolling();
      } else {
        throw new Error(data?.error || 'Falha ao gerar QR Code');
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('Erro ao gerar QR Code. Verifique se a Evolution API está configurada corretamente.');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const startStatusPolling = () => {
    setCheckingStatus(true);
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const { data } = await supabase.functions.invoke('whatsapp-qrcode', {
          body: { action: 'status' },
        });

        if (data?.connected) {
          clearInterval(interval);
          setCheckingStatus(false);
          setQrModalOpen(false);
          setWhatsappConnected(true);
          toast.success('WhatsApp conectado com sucesso!');
        }
      } catch (error) {
        console.error('Status check error:', error);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setCheckingStatus(false);
        toast.error('Tempo esgotado. Tente novamente.');
      }
    }, 2000);
  };

  const handleDisconnectWhatsapp = async () => {
    try {
      await supabase.functions.invoke('whatsapp-qrcode', {
        body: { action: 'disconnect' },
      });
      setWhatsappConnected(false);
      setWhatsappNumber('');
      toast.success('WhatsApp desconectado');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar');
    }
  };

  const handleRestartWhatsapp = async () => {
    setQrModalOpen(true);
    setQrLoading(true);
    setQrCode('');

    try {
      toast.info('Reiniciando conexão WhatsApp...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: { action: 'restart' },
      });

      console.log('WhatsApp restart response:', data, error);

      if (error) throw error;

      if (data?.qrcode) {
        setQrCode(data.qrcode);
        setWhatsappConnected(false);
        setWhatsappState('connecting');
        toast.success('Conexão reiniciada! Escaneie o novo QR Code.');
        startStatusPolling();
      } else {
        throw new Error(data?.error || 'Falha ao reiniciar conexão');
      }
    } catch (error) {
      console.error('Error restarting WhatsApp:', error);
      toast.error('Erro ao reiniciar WhatsApp');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleGenerateNewQR = async () => {
    setQrModalOpen(true);
    setQrLoading(true);
    setQrCode('');

    try {
      // Just request connect to get a fresh QR without deleting instance
      const { data, error } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: { action: 'create' },
      });

      console.log('WhatsApp new QR response:', data, error);

      if (error) throw error;

      if (data?.alreadyConnected) {
        setWhatsappConnected(true);
        setWhatsappState('open');
        setQrModalOpen(false);
        toast.success('WhatsApp já está conectado!');
        return;
      }

      if (data?.qrcode) {
        setQrCode(data.qrcode);
        setWhatsappState('connecting');
        startStatusPolling();
      } else {
        throw new Error(data?.error || 'Falha ao gerar QR Code');
      }
    } catch (error) {
      console.error('Error generating new QR:', error);
      toast.error('Erro ao gerar novo QR Code');
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setRefreshingStatus(true);
    try {
      const { data } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: { action: 'status' },
      });

      const state = data?.state as 'open' | 'close' | 'connecting' | undefined;
      setWhatsappState(state || 'unknown');
      setLastStatusCheck(new Date());

      if (data?.connected || state === 'open') {
        setWhatsappConnected(true);
      } else {
        setWhatsappConnected(false);
      }

      toast.success('Status atualizado');
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleSaveRules = () => {
    toast.success('Regras salvas com sucesso!');
  };

  const handleSaveTemplates = () => {
    toast.success('Templates salvos com sucesso!');
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Configure integrações, regras de confirmação e mensagens
          </p>
        </div>

        <Tabs defaultValue="clinic" className="space-y-6">
          <TabsList className="bg-muted/50 flex-wrap h-auto p-1">
            <TabsTrigger value="clinic" className="gap-2">
              <Building2 className="w-4 h-4" />
              Clínica
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Zap className="w-4 h-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="agent" className="gap-2">
              <Bot className="w-4 h-4" />
              Agente IA
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              Regras
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Clinic Config Tab */}
          <TabsContent value="clinic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Informações da Clínica
                </CardTitle>
                <CardDescription>
                  Configure os dados da sua clínica para o agente de IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Nome da Clínica</Label>
                    <Input
                      id="clinicName"
                      placeholder="Ex: Clínica Saúde Total"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicPhone">Telefone</Label>
                    <Input
                      id="clinicPhone"
                      placeholder="(11) 99999-0000"
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">Endereço Completo</Label>
                  <Input
                    id="clinicAddress"
                    placeholder="Rua das Flores, 123 - Centro, São Paulo - SP"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Horário de Funcionamento
                  </h4>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Horário de Abertura</Label>
                      <Input
                        type="time"
                        value={businessHoursStart}
                        onChange={(e) => setBusinessHoursStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário de Fechamento</Label>
                      <Input
                        type="time"
                        value={businessHoursEnd}
                        onChange={(e) => setBusinessHoursEnd(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duração da Consulta (min)</Label>
                      <Input
                        type="number"
                        min={15}
                        max={120}
                        step={15}
                        value={appointmentDuration}
                        onChange={(e) => setAppointmentDuration(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dias de Funcionamento</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'monday', label: 'Seg' },
                        { id: 'tuesday', label: 'Ter' },
                        { id: 'wednesday', label: 'Qua' },
                        { id: 'thursday', label: 'Qui' },
                        { id: 'friday', label: 'Sex' },
                        { id: 'saturday', label: 'Sáb' },
                        { id: 'sunday', label: 'Dom' },
                      ].map((day) => (
                        <Button
                          key={day.id}
                          type="button"
                          variant={workingDays.includes(day.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleWorkingDay(day.id)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveClinicSettings} disabled={savingClinic}>
                  {savingClinic ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Informações'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Config Tab */}
          <TabsContent value="agent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Configurações do Agente de IA
                </CardTitle>
                <CardDescription>
                  Configure como o agente irá interagir com seus pacientes via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="agentGreeting">Mensagem de Boas-Vindas</Label>
                  <Textarea
                    id="agentGreeting"
                    value={agentGreeting}
                    onChange={(e) => setAgentGreeting(e.target.value)}
                    rows={3}
                    className="resize-none"
                    placeholder="Olá! Bem-vindo à nossa clínica..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta mensagem será usada para iniciar conversas com novos pacientes
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="agentBusinessContext">Contexto do Negócio</Label>
                  <Textarea
                    id="agentBusinessContext"
                    value={agentBusinessContext}
                    onChange={(e) => setAgentBusinessContext(e.target.value)}
                    rows={8}
                    className="resize-none"
                    placeholder="Descreva seu negócio aqui...

Exemplo:
- Tipo de clínica: Clínica de Fisioterapia
- Serviços oferecidos: Fisioterapia ortopédica, RPG, Pilates clínico, Acupuntura
- Preços: Sessão avulsa R$ 150, Pacote 10 sessões R$ 1.200
- Diferenciais: Profissionais especializados, equipamentos modernos
- Informações importantes: Primeira avaliação gratuita, estacionamento no local"
                  />
                  <p className="text-xs text-muted-foreground">
                    Escreva informações sobre sua clínica, serviços, preços e qualquer detalhe que o agente deve saber para atender seus pacientes. Este texto será usado como contexto em todas as conversas.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Usar OpenAI Personalizada</p>
                        <p className="text-sm text-muted-foreground">
                          Use sua própria chave da OpenAI em vez da IA padrão
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useCustomOpenai}
                      onCheckedChange={setUseCustomOpenai}
                    />
                  </div>

                  {useCustomOpenai && (
                    <div className="space-y-2 p-4 border rounded-lg">
                      <Label htmlFor="openaiKey">Chave da API OpenAI</Label>
                      <Input
                        id="openaiKey"
                        type="password"
                        placeholder="sk-..."
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Sua chave será armazenada de forma segura e usada apenas para o agente
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* FAQs Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label className="text-base font-medium">Perguntas Frequentes (FAQ)</Label>
                      <p className="text-xs text-muted-foreground">
                        Adicione perguntas e respostas que o agente deve usar para responder automaticamente
                      </p>
                    </div>
                  </div>

                  {/* Existing FAQs */}
                  {agentFaqs.length > 0 && (
                    <div className="space-y-3">
                      {agentFaqs.map((faq, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <p className="font-medium text-sm">P: {faq.question}</p>
                              <p className="text-sm text-muted-foreground">R: {faq.answer}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setAgentFaqs(prev => prev.filter((_, i) => i !== index))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new FAQ */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <Input
                      placeholder="Digite a pergunta... Ex: Qual o valor da consulta?"
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                    />
                    <Textarea
                      placeholder="Digite a resposta... Ex: O valor da consulta é R$ 200,00"
                      value={newFaqAnswer}
                      onChange={(e) => setNewFaqAnswer(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newFaqQuestion.trim() && newFaqAnswer.trim()) {
                          setAgentFaqs(prev => [...prev, { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }]);
                          setNewFaqQuestion('');
                          setNewFaqAnswer('');
                        }
                      }}
                      disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar FAQ
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-medium text-primary mb-2">Webhook para Evolution API</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Configure este webhook na sua Evolution API para receber mensagens:
                  </p>
                  <code className="block p-2 bg-muted rounded text-xs break-all">
                    {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`}
                  </code>
                </div>

                <Button onClick={handleSaveClinicSettings} disabled={savingClinic}>
                  {savingClinic ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Google Calendar */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Google Agenda</CardTitle>
                        <CardDescription>
                          Sincronize suas consultas automaticamente
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        googleConnected
                          ? 'border-success/50 bg-success/10 text-success'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {googleConnected ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conectado
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Desconectado
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {googleConnected ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Calendário selecionado:</p>
                        <p className="font-medium">{googleCalendarName}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sincronizar agora
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={handleDisconnectGoogle}
                        >
                          Desconectar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleConnectGoogle} className="w-full">
                      Conectar Google Agenda
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* WhatsApp */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">WhatsApp</CardTitle>
                        <CardDescription>
                          Envie confirmações automaticamente
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        whatsappConnected
                          ? 'border-success/50 bg-success/10 text-success'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {whatsappConnected ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conectado
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Desconectado
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status Monitor */}
                  <div className="mb-4 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Status da Conexão</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshStatus}
                        disabled={refreshingStatus}
                        className="h-7 px-2"
                      >
                        <RefreshCw className={cn("w-3 h-3", refreshingStatus && "animate-spin")} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          whatsappState === 'open' && "bg-success animate-pulse",
                          whatsappState === 'connecting' && "bg-warning animate-pulse",
                          whatsappState === 'close' && "bg-destructive",
                          whatsappState === 'unknown' && "bg-muted-foreground"
                        )}
                      />
                      <span className="text-sm">
                        {whatsappState === 'open' && 'Conectado'}
                        {whatsappState === 'connecting' && 'Conectando...'}
                        {whatsappState === 'close' && 'Desconectado'}
                        {whatsappState === 'unknown' && 'Desconhecido'}
                      </span>
                    </div>
                    {lastStatusCheck && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Última verificação: {lastStatusCheck.toLocaleTimeString('pt-BR')}
                      </p>
                    )}
                  </div>

                  {whatsappConnected ? (
                    <div className="space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateNewQR}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          Novo QR
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRestartWhatsapp}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Reiniciar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={handleDisconnectWhatsapp}
                        >
                          Desconectar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button onClick={handleConnectWhatsapp} className="w-full">
                        <QrCode className="w-4 h-4 mr-2" />
                        Conectar via QR Code
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={handleGenerateNewQR}
                          className="flex-1"
                          size="sm"
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          Gerar novo QR
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleRestartWhatsapp} 
                          className="flex-1"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Reiniciar (se travado)
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Integration status alert */}
            {(!googleConnected || !whatsappConnected) && (
              <Card className="border-warning/50 bg-warning/5">
                <CardContent className="flex items-center gap-4 py-4">
                  <AlertCircle className="w-5 h-5 text-warning shrink-0" />
                  <div>
                    <p className="font-medium">Configuração incompleta</p>
                    <p className="text-sm text-muted-foreground">
                      Conecte ambas as integrações para que o sistema funcione automaticamente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Confirmação</CardTitle>
                <CardDescription>
                  Configure quando e como as confirmações serão enviadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="confirmHours">Enviar confirmação (horas antes)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="confirmHours"
                        type="number"
                        min={1}
                        max={72}
                        value={confirmHoursBefore}
                        onChange={(e) => setConfirmHoursBefore(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">horas antes da consulta</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reconfirmHours">Reconfirmar (horas antes)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="reconfirmHours"
                        type="number"
                        min={1}
                        max={24}
                        value={reconfirmHoursBefore}
                        onChange={(e) => setReconfirmHoursBefore(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">horas se ainda pendente</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts">Número máximo de tentativas</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min={1}
                      max={5}
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(Number(e.target.value))}
                      className="w-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responseWindow">Janela de resposta (horas)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="responseWindow"
                        type="number"
                        min={1}
                        max={12}
                        value={responseWindowHours}
                        onChange={(e) => setResponseWindowHours(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">horas para responder</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="minReplacement">Tempo mínimo para reposição</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="minReplacement"
                      type="number"
                      min={1}
                      max={24}
                      value={minHoursForReplacement}
                      onChange={(e) => setMinHoursForReplacement(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      horas antes (mínimo para acionar fila de espera)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Marcar como risco automaticamente</p>
                      <p className="text-sm text-muted-foreground">
                        Consultas pendentes próximas do horário serão destacadas
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button onClick={handleSaveRules}>Salvar regras</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab - Simplified */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lembretes Automáticos</CardTitle>
                <CardDescription>
                  O sistema envia lembretes automaticamente aos pacientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Lembrete 1 hora antes</p>
                    <p className="text-sm text-muted-foreground">
                      Enviado automaticamente 1h antes da consulta
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Lembrete 10 minutos antes</p>
                    <p className="text-sm text-muted-foreground">
                      Enviado automaticamente 10min antes da consulta
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Como funciona:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• O agente IA responde perguntas sobre horários, localização e suporte automaticamente</li>
                    <li>• Lembretes são enviados 1h e 10min antes de cada consulta</li>
                    <li>• O paciente pode perguntar sobre localização, horários e pedir suporte</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Altere sua senha de acesso ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Digite a nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                </div>

                <Button onClick={handleChangePassword} disabled={savingPassword}>
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Alterar Senha'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* WhatsApp QR Code Modal */}
        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-success" />
                Conectar WhatsApp
              </DialogTitle>
              <DialogDescription>
                Escaneie o QR Code abaixo com o WhatsApp do seu celular
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6">
              {qrLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                </div>
              ) : qrCode ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-xl">
                    <img 
                      src={qrCode} 
                      alt="WhatsApp QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                  {checkingStatus && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Aguardando conexão...
                    </div>
                  )}
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Abra o WhatsApp no seu celular</li>
                    <li>2. Toque em Menu &gt; Dispositivos conectados</li>
                    <li>3. Toque em Conectar dispositivo</li>
                    <li>4. Aponte o celular para esta tela</li>
                  </ol>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <AlertCircle className="w-12 h-12 text-destructive" />
                  <p className="text-sm text-muted-foreground">Erro ao gerar QR Code</p>
                  <Button onClick={handleConnectWhatsapp} variant="outline">
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
