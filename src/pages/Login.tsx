import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      setError('Email ou senha incorretos');
      toast.error('Falha no login');
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    const { error } = await signUp(signupEmail, signupPassword, signupName);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
      toast.error('Falha no cadastro');
    } else {
      toast.success('Conta criada! Faça login para continuar.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar p-12 flex-col justify-between" style={{ background: 'var(--gradient-sidebar)' }}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">AgendaAI</span>
          </div>
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
          © 2024 AgendaAI. Todos os direitos reservados.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AgendaAI</span>
          </div>

          <Card className="border-0 shadow-soft">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
              <CardDescription>Entre na sua conta para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Criar conta</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
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
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Usuários de teste:</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p><strong>Admin:</strong> admin@clinica.com / admin123</p>
                      <p><strong>Staff:</strong> staff@clinica.com / staff123</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome completo</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    {error && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Criando conta...' : 'Criar conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
