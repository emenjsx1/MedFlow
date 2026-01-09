import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    const { error } = await signUp(formData.email, formData.password, formData.fullName);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
      toast.error('Falha no cadastro');
    } else {
      setSuccess(true);
      toast.success('Conta criada com sucesso!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-soft">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Conta criada com sucesso!</h2>
            <p className="text-muted-foreground mb-4">
              Seu período de teste gratuito de 3 dias começou. Aproveite!
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando para o dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar p-12 flex-col justify-between" style={{ background: 'var(--gradient-sidebar)' }}>
        <div>
          <Logo size="lg" variant="white" className="text-sidebar-foreground mb-2" />
          <p className="text-sidebar-foreground/70 text-sm">Teste grátis por 3 dias</p>
        </div>

        <div className="space-y-8">
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-sidebar-accent/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground mb-1">3 Dias Grátis</h3>
                <p className="text-sidebar-foreground/70 text-sm">Acesso completo a todas as funcionalidades sem compromisso</p>
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-sidebar-accent/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground mb-1">Sem cartão de crédito</h3>
                <p className="text-sidebar-foreground/70 text-sm">Não precisa de cartão para começar a testar</p>
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-sidebar-accent/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground mb-1">Cancele quando quiser</h3>
                <p className="text-sidebar-foreground/70 text-sm">Sem multas ou taxas de cancelamento</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sidebar-foreground/50 text-xs">
          © 2024 MedFlow. Todos os direitos reservados.
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Logo size="lg" variant="white" />
          </div>

          <Card className="border-0 shadow-soft">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Comece seu teste grátis</CardTitle>
              <CardDescription>3 dias de acesso completo, sem compromisso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Começar teste grátis'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-primary hover:underline"
                  >
                    Faça login
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}