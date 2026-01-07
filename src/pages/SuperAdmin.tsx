import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Shield, Settings, Users, Building2, Key, Calendar, 
  Ban, Trash2, CheckCircle, Clock, AlertTriangle, 
  RefreshCw, LogOut, Eye, EyeOff, Save
} from 'lucide-react';
import Logo from '@/components/Logo';

interface Tenant {
  id: string;
  name: string;
  created_at: string;
  subscription_status: string;
  trial_started_at: string;
  trial_ends_at: string;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
}

interface GlobalSettings {
  id: string;
  evolution_api_url: string | null;
  evolution_api_key: string | null;
  google_client_id: string | null;
  google_client_secret: string | null;
  resend_api_key: string | null;
  lovable_api_key: string | null;
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  expiredTenants: number;
  blockedTenants: number;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading, signOut } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [stats, setStats] = useState<TenantStats>({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    expiredTenants: 0,
    blockedTenants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      toast.error('Acesso negado. Você não é super admin.');
      navigate('/dashboard');
      return;
    }
    
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTenants(), fetchGlobalSettings()]);
    setLoading(false);
  };

  const fetchTenants = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar negócios');
      return;
    }

    setTenants(data || []);
    
    // Calculate stats
    const total = data?.length || 0;
    const active = data?.filter(t => t.subscription_status === 'active').length || 0;
    const trial = data?.filter(t => t.subscription_status === 'trial' && new Date(t.trial_ends_at) > new Date()).length || 0;
    const expired = data?.filter(t => t.subscription_status === 'trial' && new Date(t.trial_ends_at) <= new Date()).length || 0;
    const blocked = data?.filter(t => t.subscription_status === 'blocked').length || 0;

    setStats({
      totalTenants: total,
      activeTenants: active,
      trialTenants: trial,
      expiredTenants: expired,
      blockedTenants: blocked,
    });
  };

  const fetchGlobalSettings = async () => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching global settings:', error);
      return;
    }

    setGlobalSettings(data);
  };

  const handleSaveSettings = async () => {
    if (!globalSettings) return;

    const { error } = await supabase
      .from('global_settings')
      .update({
        evolution_api_url: globalSettings.evolution_api_url,
        evolution_api_key: globalSettings.evolution_api_key,
        google_client_id: globalSettings.google_client_id,
        google_client_secret: globalSettings.google_client_secret,
        resend_api_key: globalSettings.resend_api_key,
        lovable_api_key: globalSettings.lovable_api_key,
        updated_at: new Date().toISOString(),
      })
      .eq('id', globalSettings.id);

    if (error) {
      toast.error('Erro ao salvar configurações');
      return;
    }

    toast.success('Configurações salvas com sucesso!');
  };

  const handleBlockTenant = async () => {
    if (!selectedTenant) return;

    const { error } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'blocked',
        blocked_at: new Date().toISOString(),
        blocked_reason: blockReason,
      })
      .eq('id', selectedTenant.id);

    if (error) {
      toast.error('Erro ao bloquear negócio');
      return;
    }

    toast.success('Negócio bloqueado com sucesso');
    setIsBlockDialogOpen(false);
    setBlockReason('');
    fetchTenants();
  };

  const handleUnblockTenant = async (tenantId: string) => {
    const { error } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'trial',
        blocked_at: null,
        blocked_reason: null,
      })
      .eq('id', tenantId);

    if (error) {
      toast.error('Erro ao desbloquear negócio');
      return;
    }

    toast.success('Negócio desbloqueado');
    fetchTenants();
  };

  const handleActivateSubscription = async (tenantId: string) => {
    const { error } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .eq('id', tenantId);

    if (error) {
      toast.error('Erro ao ativar assinatura');
      return;
    }

    toast.success('Assinatura ativada com sucesso!');
    fetchTenants();
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Tem certeza que deseja excluir este negócio? Esta ação não pode ser desfeita.')) {
      return;
    }

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) {
      toast.error('Erro ao excluir negócio. Verifique se existem dados associados.');
      return;
    }

    toast.success('Negócio excluído com sucesso');
    fetchTenants();
  };

  const getStatusBadge = (tenant: Tenant) => {
    if (tenant.subscription_status === 'blocked') {
      return <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" />Bloqueado</Badge>;
    }
    if (tenant.subscription_status === 'active') {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
    }
    if (tenant.subscription_status === 'trial') {
      const isExpired = new Date(tenant.trial_ends_at) <= new Date();
      if (isExpired) {
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Trial Expirado</Badge>;
      }
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
    }
    return <Badge variant="outline">{tenant.subscription_status}</Badge>;
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-sidebar border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">Super Admin</h1>
              <p className="text-xs text-sidebar-foreground/70">Painel de Administração Global</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalTenants}</div>
              <p className="text-xs text-muted-foreground">Total de Negócios</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{stats.activeTenants}</div>
              <p className="text-xs text-muted-foreground">Assinaturas Ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-500">{stats.trialTenants}</div>
              <p className="text-xs text-muted-foreground">Em Trial</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">{stats.expiredTenants}</div>
              <p className="text-xs text-muted-foreground">Trial Expirado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{stats.blockedTenants}</div>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tenants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="tenants">
              <Building2 className="w-4 h-4 mr-2" />
              Negócios
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Key className="w-4 h-4 mr-2" />
              APIs & Configurações
            </TabsTrigger>
          </TabsList>

          {/* Tenants Tab */}
          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Negócios Cadastrados</CardTitle>
                <CardDescription>
                  Gerencie todas as clínicas e negócios cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Trial Expira</TableHead>
                        <TableHead>Assinatura Expira</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">{tenant.name}</TableCell>
                          <TableCell>{getStatusBadge(tenant)}</TableCell>
                          <TableCell>
                            {format(new Date(tenant.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {tenant.trial_ends_at ? (
                              <span className={new Date(tenant.trial_ends_at) <= new Date() ? 'text-destructive' : ''}>
                                {format(new Date(tenant.trial_ends_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {tenant.subscription_ends_at ? 
                              format(new Date(tenant.subscription_ends_at), 'dd/MM/yyyy', { locale: ptBR }) : 
                              '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {tenant.subscription_status !== 'active' && tenant.subscription_status !== 'blocked' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleActivateSubscription(tenant.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Ativar
                                </Button>
                              )}
                              {tenant.subscription_status === 'blocked' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnblockTenant(tenant.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Desbloquear
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-500"
                                  onClick={() => {
                                    setSelectedTenant(tenant);
                                    setIsBlockDialogOpen(true);
                                  }}
                                >
                                  <Ban className="w-4 h-4 mr-1" />
                                  Bloquear
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteTenant(tenant.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {tenants.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum negócio cadastrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Globais de API</CardTitle>
                <CardDescription>
                  Configure as APIs e chaves de integração do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Evolution API */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Evolution API (WhatsApp)
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>URL da API</Label>
                      <Input
                        value={globalSettings?.evolution_api_url || ''}
                        onChange={(e) => setGlobalSettings(prev => prev ? {...prev, evolution_api_url: e.target.value} : null)}
                        placeholder="https://api.evolution.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showSecrets['evolution_api_key'] ? 'text' : 'password'}
                          value={globalSettings?.evolution_api_key || ''}
                          onChange={(e) => setGlobalSettings(prev => prev ? {...prev, evolution_api_key: e.target.value} : null)}
                          placeholder="••••••••"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => toggleShowSecret('evolution_api_key')}
                        >
                          {showSecrets['evolution_api_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google API */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Google API (Calendar)
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <Input
                        value={globalSettings?.google_client_id || ''}
                        onChange={(e) => setGlobalSettings(prev => prev ? {...prev, google_client_id: e.target.value} : null)}
                        placeholder="xxx.apps.googleusercontent.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Secret</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showSecrets['google_client_secret'] ? 'text' : 'password'}
                          value={globalSettings?.google_client_secret || ''}
                          onChange={(e) => setGlobalSettings(prev => prev ? {...prev, google_client_secret: e.target.value} : null)}
                          placeholder="••••••••"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => toggleShowSecret('google_client_secret')}
                        >
                          {showSecrets['google_client_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resend API */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Resend API (Email)
                  </h3>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets['resend_api_key'] ? 'text' : 'password'}
                        value={globalSettings?.resend_api_key || ''}
                        onChange={(e) => setGlobalSettings(prev => prev ? {...prev, resend_api_key: e.target.value} : null)}
                        placeholder="re_••••••••"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleShowSecret('resend_api_key')}
                      >
                        {showSecrets['resend_api_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lovable API */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Lovable API (AI)
                  </h3>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets['lovable_api_key'] ? 'text' : 'password'}
                        value={globalSettings?.lovable_api_key || ''}
                        onChange={(e) => setGlobalSettings(prev => prev ? {...prev, lovable_api_key: e.target.value} : null)}
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleShowSecret('lovable_api_key')}
                      >
                        {showSecrets['lovable_api_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Block Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Negócio</DialogTitle>
            <DialogDescription>
              Bloquear "{selectedTenant?.name}" impedirá o acesso ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo do bloqueio</Label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Pagamento pendente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBlockTenant}>
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}