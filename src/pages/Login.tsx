import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      setError('Email ou senha incorretos');
      toast.error('Falha no login');
      setLoading(false);
      return;
    }

    // Verificar se o usuário é admin ou super_admin
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Erro ao verificar usuário');
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      // Verificar também se é super_admin via auth.users
      const isSuperAdmin = user.is_super_admin === true;

      // Se for super_admin, redirecionar para Super Admin
      if (isSuperAdmin || roleData?.role === 'super_admin') {
        toast.success('Bem-vindo, Super Administrador!');
        navigate('/super-admin');
      } else {
        // Admin e usuários normais vão para o dashboard
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar p-12 flex-col justify-between" style={{ background: 'var(--gradient-sidebar)' }}>
        <div>
          <Logo size="lg" variant="white" className="text-sidebar-foreground mb-2" />
          <p className="text-sidebar-foreground/70 text-sm">Confirmação inteligente de consultas</p>
        </div>

        <div className="space-y-8">
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-sidebar-accent/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground mb-1">Sincronização Automática</h3>
                <p className="text-sidebar-foreground/70 text-sm">Conecte seu Google Calendar e deixe o sistema trabalhar por você</p>
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-sidebar-accent/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground mb-1">Confirmação via WhatsApp</h3>
                <p className="text-sidebar-foreground/70 text-sm">Mensagens automáticas e respostas inteligentes</p>
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-sidebar-accent/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground mb-1">Fila de Espera Inteligente</h3>
                <p className="text-sidebar-foreground/70 text-sm">Preencha buracos automaticamente com pacientes da fila</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sidebar-foreground/50 text-xs">
          © 2024 MedFlow. Todos os direitos reservados.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Logo size="lg" variant="white" />
          </div>

          <Card className="border-0 shadow-soft">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
              <CardDescription>Entre na sua conta para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Dica:</strong> Use seu email e a senha padrão <strong>MedFlow</strong>. Você pode alterar sua senha nas configurações após o login.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
