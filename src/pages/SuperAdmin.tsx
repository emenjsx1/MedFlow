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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Shield, Settings, Users, Building2, Key, Calendar, 
  Ban, Trash2, CheckCircle, Clock, AlertTriangle, 
  RefreshCw, LogOut, Eye, EyeOff, Save, Activity,
  DollarSign, BarChart3, UserCog, Package, Link2,
  Edit, Plus, Mail, Phone, TrendingUp
} from 'lucide-react';

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
  plan_id: string | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  tenant_id: string | null;
  created_at: string;
  tenant_name?: string;
  role?: string;
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

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  max_patients: number | null;
  max_professionals: number | null;
  sort_order: number;
}

interface ActivityLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
  created_at: string;
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  expiredTenants: number;
  blockedTenants: number;
}

interface UsageMetrics {
  totalPatients: number;
  totalAppointments: number;
  totalMessages: number;
  totalProfessionals: number;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading, signOut } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<TenantStats>({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    expiredTenants: 0,
    blockedTenants: 0,
  });
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics>({
    totalPatients: 0,
    totalAppointments: 0,
    totalMessages: 0,
    totalProfessionals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [activeTab, setActiveTab] = useState('tenants');
  const [userSearchEmail, setUserSearchEmail] = useState('');

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
    await Promise.all([
      fetchTenants(), 
      fetchGlobalSettings(), 
      fetchProfiles(),
      fetchPlans(),
      fetchActivityLogs(),
      fetchUsageMetrics()
    ]);
    setLoading(false);
  };

  const fetchTenants = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Erro ao carregar negócios');
      return;
    }

    setTenants(data || []);
    
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

  const fetchProfiles = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    // Fetch roles for each profile
    const profilesWithRoles = await Promise.all((profilesData || []).map(async (profile) => {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .single();

      const tenant = tenants.find(t => t.id === profile.tenant_id);

      return {
        ...profile,
        role: roleData?.role || 'staff',
        tenant_name: tenant?.name || 'Sem tenant',
      };
    }));

    setProfiles(profilesWithRoles);
  };

  const fetchGlobalSettings = async () => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching global settings:', error);
      return;
    }

    if (data) {
      setGlobalSettings(data);
    } else {
      // Create initial settings
      const { data: newData, error: insertError } = await supabase
        .from('global_settings')
        .insert({})
        .select()
        .single();
      
      if (!insertError && newData) {
        setGlobalSettings(newData);
      }
    }
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return;
    }

    setPlans((data || []).map(p => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]')
    })));
  };

  const fetchActivityLogs = async () => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return;
    }

    setActivityLogs(data || []);
  };

  const fetchUsageMetrics = async () => {
    const [patientsRes, appointmentsRes, messagesRes, professionalsRes] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('professionals').select('id', { count: 'exact', head: true }),
    ]);

    setUsageMetrics({
      totalPatients: patientsRes.count || 0,
      totalAppointments: appointmentsRes.count || 0,
      totalMessages: messagesRes.count || 0,
      totalProfessionals: professionalsRes.count || 0,
    });
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

  const handleActivateSubscription = async (tenantId: string, planId?: string) => {
    const { error } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        plan_id: planId || null,
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

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    const planData = {
      name: editingPlan.name,
      slug: editingPlan.slug,
      description: editingPlan.description,
      price_monthly: editingPlan.price_monthly,
      price_yearly: editingPlan.price_yearly,
      currency: editingPlan.currency,
      features: editingPlan.features,
      is_active: editingPlan.is_active,
      is_featured: editingPlan.is_featured,
      stripe_price_id: editingPlan.stripe_price_id,
      stripe_product_id: editingPlan.stripe_product_id,
      max_patients: editingPlan.max_patients,
      max_professionals: editingPlan.max_professionals,
      sort_order: editingPlan.sort_order,
      updated_at: new Date().toISOString(),
    };

    if (editingPlan.id) {
      const { error } = await supabase
        .from('subscription_plans')
        .update(planData)
        .eq('id', editingPlan.id);

      if (error) {
        toast.error('Erro ao atualizar plano');
        return;
      }
      toast.success('Plano atualizado!');
    } else {
      const { error } = await supabase
        .from('subscription_plans')
        .insert(planData);

      if (error) {
        toast.error('Erro ao criar plano');
        return;
      }
      toast.success('Plano criado!');
    }

    setIsPlanDialogOpen(false);
    setEditingPlan(null);
    fetchPlans();
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-500"><Shield className="w-3 h-3 mr-1" />Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500"><UserCog className="w-3 h-3 mr-1" />Admin</Badge>;
      default:
        return <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />Staff</Badge>;
    }
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
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

        {/* Usage Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-xl font-bold">{usageMetrics.totalPatients}</div>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-xl font-bold">{usageMetrics.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">Consultas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-xl font-bold">{usageMetrics.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">Mensagens</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-xl font-bold">{usageMetrics.totalProfessionals}</div>
                  <p className="text-xs text-muted-foreground">Profissionais</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="tenants">
              <Building2 className="w-4 h-4 mr-2" />
              Negócios
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="plans">
              <Package className="w-4 h-4 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Key className="w-4 h-4 mr-2" />
              APIs
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
                        <TableHead>Plano</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Trial Expira</TableHead>
                        <TableHead>Assinatura Expira</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.map((tenant) => {
                        const plan = plans.find(p => p.id === tenant.plan_id);
                        return (
                          <TableRow key={tenant.id}>
                            <TableCell className="font-medium">{tenant.name}</TableCell>
                            <TableCell>{getStatusBadge(tenant)}</TableCell>
                            <TableCell>
                              {plan ? (
                                <Badge variant="outline">{plan.name}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
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
                        );
                      })}
                      {tenants.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>
                  Visualize todos os usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar por email (ex: emenjoseph7@gmail.com)"
                      value={userSearchEmail}
                      onChange={(e) => setUserSearchEmail(e.target.value)}
                      className="max-w-md"
                    />
                    {userSearchEmail && (
                      <Button
                        variant="outline"
                        onClick={() => setUserSearchEmail('')}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles
                        .filter((profile) => 
                          !userSearchEmail || 
                          profile.email?.toLowerCase().includes(userSearchEmail.toLowerCase())
                        )
                        .map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.full_name}</TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>{profile.tenant_name || '-'}</TableCell>
                          <TableCell>{getRoleBadge(profile.role || 'staff')}</TableCell>
                          <TableCell>
                            {format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                      {profiles.filter((profile) => 
                        !userSearchEmail || 
                        profile.email?.toLowerCase().includes(userSearchEmail.toLowerCase())
                      ).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {userSearchEmail 
                              ? `Nenhum usuário encontrado com o email "${userSearchEmail}"`
                              : 'Nenhum usuário encontrado'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Planos de Assinatura</CardTitle>
                  <CardDescription>
                    Configure os planos e preços disponíveis
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingPlan({
                    id: '',
                    name: '',
                    slug: '',
                    description: '',
                    price_monthly: 0,
                    price_yearly: null,
                    currency: 'BRL',
                    features: [],
                    is_active: true,
                    is_featured: false,
                    stripe_price_id: null,
                    stripe_product_id: null,
                    max_patients: null,
                    max_professionals: null,
                    sort_order: plans.length + 1,
                  });
                  setIsPlanDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Plano
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.map((plan) => (
                    <Card key={plan.id} className={plan.is_featured ? 'border-primary' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          {plan.is_featured && <Badge className="bg-primary">Destaque</Badge>}
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <span className="text-3xl font-bold">
                            {plan.currency} {plan.price_monthly.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">/mês</span>
                        </div>
                        {plan.price_yearly && (
                          <p className="text-sm text-muted-foreground mb-4">
                            ou {plan.currency} {plan.price_yearly.toFixed(2)}/ano
                          </p>
                        )}
                        <ul className="space-y-2 text-sm mb-4">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setEditingPlan(plan);
                              setIsPlanDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {plan.stripe_price_id && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <Link2 className="w-3 h-3 inline mr-1" />
                            Stripe: {plan.stripe_price_id}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Atividade</CardTitle>
                <CardDescription>
                  Histórico de ações no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {activityLogs.length > 0 ? (
                    <div className="space-y-4">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 p-3 border rounded-lg">
                          <Activity className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{log.action}</span>
                              <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {log.user_email || 'Sistema'}
                              {log.entity_id && ` • ID: ${log.entity_id.slice(0, 8)}...`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum log de atividade ainda</p>
                    </div>
                  )}
                </ScrollArea>
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
                    <Phone className="w-4 h-4" />
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
                    <Mail className="w-4 h-4" />
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
                    <TrendingUp className="w-4 h-4" />
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

      {/* Plan Edit Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan?.id ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                    placeholder="Professional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editingPlan.slug}
                    onChange={(e) => setEditingPlan({...editingPlan, slug: e.target.value})}
                    placeholder="professional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                  placeholder="Para clínicas em crescimento"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preço Mensal</Label>
                  <Input
                    type="number"
                    value={editingPlan.price_monthly}
                    onChange={(e) => setEditingPlan({...editingPlan, price_monthly: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Anual</Label>
                  <Input
                    type="number"
                    value={editingPlan.price_yearly || ''}
                    onChange={(e) => setEditingPlan({...editingPlan, price_yearly: parseFloat(e.target.value) || null})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Input
                    value={editingPlan.currency}
                    onChange={(e) => setEditingPlan({...editingPlan, currency: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stripe Price ID</Label>
                  <Input
                    value={editingPlan.stripe_price_id || ''}
                    onChange={(e) => setEditingPlan({...editingPlan, stripe_price_id: e.target.value || null})}
                    placeholder="price_xxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stripe Product ID</Label>
                  <Input
                    value={editingPlan.stripe_product_id || ''}
                    onChange={(e) => setEditingPlan({...editingPlan, stripe_product_id: e.target.value || null})}
                    placeholder="prod_xxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máx. Pacientes</Label>
                  <Input
                    type="number"
                    value={editingPlan.max_patients || ''}
                    onChange={(e) => setEditingPlan({...editingPlan, max_patients: parseInt(e.target.value) || null})}
                    placeholder="Ilimitado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Profissionais</Label>
                  <Input
                    type="number"
                    value={editingPlan.max_professionals || ''}
                    onChange={(e) => setEditingPlan({...editingPlan, max_professionals: parseInt(e.target.value) || null})}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Funcionalidades (uma por linha)</Label>
                <Textarea
                  value={editingPlan.features.join('\n')}
                  onChange={(e) => setEditingPlan({...editingPlan, features: e.target.value.split('\n').filter(f => f.trim())})}
                  rows={6}
                  placeholder="Até 500 pacientes&#10;3 profissionais&#10;WhatsApp integrado"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPlan.is_active}
                    onCheckedChange={(checked) => setEditingPlan({...editingPlan, is_active: checked})}
                  />
                  <Label>Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingPlan.is_featured}
                    onCheckedChange={(checked) => setEditingPlan({...editingPlan, is_featured: checked})}
                  />
                  <Label>Destaque</Label>
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={editingPlan.sort_order}
                    onChange={(e) => setEditingPlan({...editingPlan, sort_order: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPlanDialogOpen(false);
              setEditingPlan(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
