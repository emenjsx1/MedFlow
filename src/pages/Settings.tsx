import { useState } from 'react';
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
  Calendar,
  MessageSquare,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Settings() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);

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

  const handleConnectGoogle = () => {
    // In production, this would redirect to Google OAuth
    toast.success('Redirecionando para autenticação do Google...');
    setTimeout(() => {
      setGoogleConnected(true);
      toast.success('Google Agenda conectado com sucesso!');
    }, 1500);
  };

  const handleConnectWhatsapp = () => {
    // In production, this would open a QR code modal
    toast.success('Gerando QR Code para conexão...');
    setTimeout(() => {
      setWhatsappConnected(true);
      toast.success('WhatsApp conectado com sucesso!');
    }, 1500);
  };

  const handleSaveRules = () => {
    toast.success('Regras salvas com sucesso!');
  };

  const handleSaveTemplates = () => {
    toast.success('Templates salvos com sucesso!');
  };

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Configure integrações, regras de confirmação e mensagens
          </p>
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="integrations" className="gap-2">
              <Zap className="w-4 h-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              Regras
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensagens
            </TabsTrigger>
          </TabsList>

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
                        <p className="font-medium">Consultas - Dr. Carlos</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sincronizar agora
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setGoogleConnected(false)}
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
                  {whatsappConnected ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Número conectado:</p>
                        <p className="font-medium">(11) 99999-0000</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          Testar conexão
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setWhatsappConnected(false)}
                        >
                          Desconectar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleConnectWhatsapp} className="w-full">
                      Conectar via QR Code
                    </Button>
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

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens Personalizadas</CardTitle>
                <CardDescription>
                  Customize as mensagens enviadas aos pacientes. Use as variáveis: {'{nome}'}, {'{data}'}, {'{hora}'}, {'{endereco}'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="confirmTemplate">Mensagem de confirmação</Label>
                  <Textarea
                    id="confirmTemplate"
                    value={confirmationTemplate}
                    onChange={(e) => setConfirmationTemplate(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enviada {confirmHoursBefore}h antes da consulta
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reconfirmTemplate">Mensagem de reconfirmação</Label>
                  <Textarea
                    id="reconfirmTemplate"
                    value={reconfirmationTemplate}
                    onChange={(e) => setReconfirmationTemplate(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enviada {reconfirmHoursBefore}h antes se não houver resposta
                  </p>
                </div>

                <Separator />

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Prévia da mensagem:</p>
                  <p className="text-sm text-muted-foreground italic">
                    "Olá Maria! Confirmando sua consulta para 20/12/2024 às 14:00. Responda: 1-Confirmar, 2-Cancelar, 3-Reagendar"
                  </p>
                </div>

                <Button onClick={handleSaveTemplates}>Salvar mensagens</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
