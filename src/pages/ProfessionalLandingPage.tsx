import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MessageSquare, 
  Bot, 
  Bell, 
  Users, 
  BarChart3, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Smartphone,
  Globe,
  Lock,
  Sparkles,
  ChevronRight,
  Play,
  Award,
  Target,
  BookOpen,
  HelpCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { useCurrency } from "@/hooks/useCurrency";
import { Flame } from "lucide-react";
import { SecurityBadges } from "@/components/trust/SecurityBadges";
import { ComplianceBadges } from "@/components/trust/ComplianceBadges";

const allFeatures = [
  "Agendamentos ilimitados",
  "WhatsApp integrado com QR Code",
  "Lembretes automáticos (1h e 10min antes)",
  "Atendimento 24/7 automatizado via IA",
  "Fila de espera inteligente",
  "Relatórios e métricas detalhadas",
  "Gestão completa de pacientes",
  "Sincronização com Google Calendar",
  "CRM com pipeline drag & drop",
  "Campanhas de marketing em massa",
  "Automação de follow-up",
  "Check-in digital com QR Code",
  "Múltiplos profissionais/agendas",
  "Exportação de dados (CSV/Excel)",
  "Histórico completo de atendimentos",
  "Backup automático de dados",
  "Takeover humano da IA",
  "Suporte prioritário via WhatsApp",
  "Atualizações gratuitas",
  "Acesso Mobile e Desktop",
];

const features = [
  {
    icon: Bot,
    title: "IA Inteligente 24/7",
    description: "Atendimento automatizado que responde pacientes a qualquer hora, mesmo enquanto você descansa",
    color: "text-blue-500"
  },
  {
    icon: Bell,
    title: "Lembretes Automáticos",
    description: "Reduza faltas em até 70% com lembretes inteligentes enviados 1h e 10min antes da consulta",
    color: "text-green-500"
  },
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description: "Múltiplos profissionais com agendas independentes e sincronização com Google Calendar",
    color: "text-purple-500"
  },
  {
    icon: Users,
    title: "Fila de Espera",
    description: "Preencha horários vagos automaticamente quando pacientes cancelam ou faltam",
    color: "text-orange-500"
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    description: "Métricas detalhadas sobre sua clínica, pacientes e performance financeira",
    color: "text-red-500"
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Dados protegidos com criptografia de ponta e backup automático diário",
    color: "text-indigo-500"
  }
];

const sectors = [
  { title: "Clínicas médicas" },
  { title: "Consultórios odontológicos" },
  { title: "Estéticas e spas" },
  { title: "Psicólogos e terapeutas" },
  { title: "Fisioterapeutas" },
  { title: "Oftalmologistas" },
  { title: "Veterinárias" },
  { title: "Nutricionistas" },
  { title: "Fonoaudiólogos" },
  { title: "Quiropraxistas" },
  { title: "Acupunturistas" },
  { title: "Massoterapeutas" }
];

const plans = [
  {
    id: "monthly",
    name: "Mensal",
    originalPrice: 297,
    price: 197,
    interval: "mês",
    description: "Pagamento mensal",
    features: allFeatures,
    checkoutUrl: "https://checkout.escalepay.com/3004344"
  },
  {
    id: "quarterly",
    name: "Trimestral",
    originalPrice: 891,
    price: 497,
    interval: "trimestre",
    savings: "Economize 44%",
    popular: true,
    hot: true,
    description: "3 meses de acesso",
    features: allFeatures,
    checkoutUrl: "https://checkout.escalepay.com/8383727"
  },
  {
    id: "annual",
    name: "Anual",
    originalPrice: 3564,
    price: 1497,
    interval: "ano",
    savings: "Economize 37%",
    description: "12 meses de acesso",
    features: allFeatures,
    checkoutUrl: "https://checkout.escalepay.com/3059186"
  }
];

const benefits = [
  {
    title: "Redução de Faltas",
    value: "70%",
    description: "Menos pacientes que não aparecem",
    icon: TrendingUp
  },
  {
    title: "Economia de Tempo",
    value: "15h/semana",
    description: "Tempo economizado em atendimentos",
    icon: Clock
  },
  {
    title: "Aumento de Receita",
    value: "+35%",
    description: "Mais consultas realizadas",
    icon: Target
  },
  {
    title: "Satisfação",
    value: "98%",
    description: "Pacientes satisfeitos com o atendimento",
    icon: Award
  }
];

const testimonials = [
  {
    name: "Dr. Carlos Silva",
    role: "Dentista - Clínica Sorriso Perfeito",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "Em 3 meses, reduzi as faltas em 65%. A IA responde meus pacientes perfeitamente, mesmo de madrugada. Recomendo para todos os colegas.",
    rating: 5
  },
  {
    name: "Dra. Ana Paula",
    role: "Dermatologista - Clínica DermaCare",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    text: "Minha secretária agora foca no atendimento presencial. O WhatsApp automático mudou completamente nossa rotina. Valeu cada centavo investido.",
    rating: 5
  },
  {
    name: "Dr. Roberto Mendes",
    role: "Fisioterapeuta - Centro de Reabilitação",
    image: "https://randomuser.me/api/portraits/men/52.jpg",
    text: "Em 3 meses recuperei o investimento. Menos faltas = mais faturamento. Simples assim. O sistema é intuitivo e fácil de usar.",
    rating: 5
  }
];

const faqs = [
  {
    question: "Quanto tempo leva para configurar?",
    answer: "Menos de 5 minutos! Basta conectar seu WhatsApp através do QR Code, sincronizar com Google Calendar (opcional) e começar a usar. Não precisa conhecimento técnico."
  },
  {
    question: "Funciona com meu sistema atual?",
    answer: "Sim! O MedFlow funciona de forma independente e se integra com Google Calendar. Você pode continuar usando seu sistema atual enquanto aproveita nossa automação."
  },
  {
    question: "A IA realmente funciona bem?",
    answer: "Nossa IA foi treinada especificamente para atendimento em saúde. Ela entende contexto, horários, e responde de forma natural e profissional. Se necessário, você pode assumir o atendimento a qualquer momento."
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim! Não temos fidelidade. Você pode cancelar quando quiser sem multas ou taxas extras. Seus dados ficam disponíveis por 30 dias após o cancelamento."
  },
  {
    question: "Quantos profissionais posso cadastrar?",
    answer: "Ilimitados! Cada profissional tem sua própria agenda, horários de trabalho e pode ter seu próprio Google Calendar sincronizado."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Absolutamente! Utilizamos criptografia de ponta, backup automático diário e seguimos todas as normas de proteção de dados (LGPD). Seus dados nunca são compartilhados com terceiros."
  }
];

export default function ProfessionalLandingPage() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { formatWithSymbol } = useCurrency();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Logo size="md" className="text-primary" />
            <div className="hidden md:flex items-center gap-6">
              <button onClick={scrollToFeatures} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </button>
              <button onClick={scrollToPricing} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Planos
              </button>
              <Button variant="ghost" onClick={() => navigate('/blog')} className="text-sm">
                Blog
              </Button>
              <Button variant="ghost" onClick={() => navigate('/help')} className="text-sm">
                Ajuda
              </Button>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Entrar
              </Button>
              <Button onClick={() => navigate('/register')}>
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="md:hidden">
              <Button size="sm" onClick={() => navigate('/register')}>
                Começar
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
              <Sparkles className="mr-2 h-3 w-3" />
              Sistema de Gestão Inteligente para Clínicas
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Transforme sua clínica em uma{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                máquina de eficiência
              </span>
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
              Automatize agendamentos, reduza faltas em até 70% e aumente sua receita com IA que trabalha 24/7 para você
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate('/register')}>
                Começar Teste Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={scrollToFeatures}>
                <Play className="mr-2 h-5 w-5" />
                Ver Demonstração
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Teste grátis de 3 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Cancelamento a qualquer momento</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Stats */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="mb-1 text-3xl font-bold text-primary">{benefit.value}</div>
                <div className="mb-1 text-sm font-semibold">{benefit.title}</div>
                <div className="text-xs text-muted-foreground">{benefit.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground">
              Funcionalidades poderosas projetadas para transformar a gestão da sua clínica
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="group border-2 transition-all hover:border-primary hover:shadow-lg">
                <CardHeader>
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* All Features List */}
          <div className="mx-auto max-w-4xl">
            <Card className="border-2 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Funcionalidades Incluídas</CardTitle>
                <CardDescription className="text-center">
                  Todas essas funcionalidades estão disponíveis em todos os planos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sectors Section */}
      <section className="bg-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Para quem é o MedFlow?
            </h2>
            <p className="text-lg text-muted-foreground">
              Ideal para qualquer profissional de saúde que quer automatizar agendamentos
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {sectors.map((sector, index) => (
              <Card key={index} className="text-center hover:border-primary hover:shadow-lg transition-all border-2">
                <CardContent className="p-6">
                  <span className="text-sm font-medium">{sector.title}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Como funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Em 3 passos simples, sua clínica estará no piloto automático
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Conecte seu WhatsApp",
                description: "Escaneie o QR Code e conecte sua conta em menos de 2 minutos. Não precisa instalar nada."
              },
              {
                step: "02",
                title: "Configure sua agenda",
                description: "Sincronize com Google Calendar ou configure manualmente. Defina horários de trabalho e disponibilidade."
              },
              {
                step: "03",
                title: "Deixe a IA trabalhar",
                description: "A IA assume o atendimento, agenda consultas, envia lembretes e confirmações automaticamente."
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <Card className="h-full border-2">
                  <CardHeader>
                    <div className="mb-4 text-5xl font-bold text-primary/20">{item.step}</div>
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                    <CardDescription className="text-base">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
                {index < 2 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block">
                    <ChevronRight className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              O que nossos clientes dizem
            </h2>
            <p className="text-lg text-muted-foreground">
              Profissionais que transformaram suas clínicas com o MedFlow
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <img
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].name}
                    className="h-16 w-16 rounded-full border-2 border-primary"
                  />
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="mb-4 text-lg italic text-muted-foreground">
                      "{testimonials[currentTestimonial].text}"
                    </p>
                    <div>
                      <div className="font-semibold">{testimonials[currentTestimonial].name}</div>
                      <div className="text-sm text-muted-foreground">{testimonials[currentTestimonial].role}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentTestimonial ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Escolha seu plano e comece agora
            </h2>
            <p className="text-lg text-muted-foreground">
              Todos os planos incluem todas as funcionalidades. Escolha o período que melhor se adapta a você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative border-2 transition-all ${
                  plan.popular
                    ? 'border-primary shadow-xl ring-2 ring-primary/20 md:scale-105 z-10'
                    : 'hover:border-primary/50'
                }`}
              >
                {plan.hot && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-destructive text-destructive-foreground shadow-lg gap-1">
                      <Flame className="w-3 h-3" />
                      Mais Escolhido
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="py-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg text-muted-foreground line-through">
                        {formatWithSymbol(plan.originalPrice)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-primary">
                        {formatWithSymbol(plan.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                    </div>
                  </div>
                  {plan.savings && (
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        plan.id === 'annual'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      }`}
                    >
                      {plan.savings}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {plan.features.slice(0, 10).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 10 && (
                      <div className="text-xs text-muted-foreground text-center pt-2">
                        +{plan.features.length - 10} funcionalidades adicionais
                      </div>
                    )}
                  </div>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : ''
                    }`}
                    size="lg"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => {
                      window.location.href = plan.checkoutUrl;
                    }}
                  >
                    Assinar {plan.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Todos os planos incluem teste grátis de 3 dias
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Ou comece com teste grátis
            </Button>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Segurança e Confiança
            </h2>
            <p className="text-lg text-muted-foreground">
              Seus dados protegidos com os mais altos padrões de segurança
            </p>
          </div>
          <div className="flex flex-col items-center gap-6 mb-8">
            <SecurityBadges />
            <ComplianceBadges />
          </div>
          <div className="text-center">
            <Button variant="outline" onClick={() => navigate('/security')}>
              Saiba mais sobre segurança
            </Button>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Recursos e Aprendizado
            </h2>
            <p className="text-lg text-muted-foreground">
              Aprenda mais sobre gestão de clínicas e aproveite ao máximo o MedFlow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="cursor-pointer hover:border-primary hover:shadow-lg transition-all" onClick={() => navigate('/blog')}>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Blog</CardTitle>
                <CardDescription>
                  Artigos, dicas e estratégias para transformar sua clínica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  Ler Artigos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:shadow-lg transition-all" onClick={() => navigate('/help')}>
              <CardHeader>
                <HelpCircle className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Central de Ajuda</CardTitle>
                <CardDescription>
                  Encontre respostas rápidas e tutoriais passo a passo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  Acessar Ajuda <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:shadow-lg transition-all" onClick={() => navigate('/case-studies')}>
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Case Studies</CardTitle>
                <CardDescription>
                  Veja como outras clínicas estão transformando resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  Ver Cases <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Perguntas frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas sobre o MedFlow
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Não encontrou sua resposta? <button onClick={() => navigate('/help')} className="text-primary hover:underline">Visite nossa Central de Ajuda</button>
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <CardTitle className="text-left">{faq.question}</CardTitle>
                  <CardDescription className="text-base text-left">{faq.answer}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-12 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Comece a transformar sua clínica hoje
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Junte-se a centenas de profissionais que já automatizaram suas clínicas
              </p>
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate('/register')}>
                Teste Grátis por 3 Dias
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <Logo size="md" className="mb-4 text-primary" />
              <p className="text-sm text-muted-foreground mb-4">
                Sistema inteligente de gestão para clínicas e consultórios. 
                Automatize agendamentos, reduza faltas e aumente sua receita com IA.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" size="sm" onClick={() => navigate('/register')}>
                  Teste Grátis
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/contact')}>
                  Contato
                </Button>
              </div>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={scrollToFeatures} className="hover:text-foreground transition-colors">Funcionalidades</button></li>
                <li><button onClick={scrollToPricing} className="hover:text-foreground transition-colors">Planos</button></li>
                <li><button onClick={() => navigate('/compare')} className="hover:text-foreground transition-colors">Comparar</button></li>
                <li><button onClick={() => navigate('/case-studies')} className="hover:text-foreground transition-colors">Case Studies</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-foreground transition-colors">Login</button></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Recursos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/blog')} className="hover:text-foreground transition-colors">Blog</button></li>
                <li><button onClick={() => navigate('/help')} className="hover:text-foreground transition-colors">Central de Ajuda</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-foreground transition-colors">Contato</button></li>
                <li><button onClick={() => navigate('/security')} className="hover:text-foreground transition-colors">Segurança</button></li>
                <li><button onClick={() => navigate('/status')} className="hover:text-foreground transition-colors">Status</button></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/about')} className="hover:text-foreground transition-colors">Sobre Nós</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacidade</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">Termos</button></li>
                <li><button onClick={() => navigate('/security')} className="hover:text-foreground transition-colors">LGPD</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © {new Date().getFullYear()} MedFlow. Todos os direitos reservados.
              </p>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacidade</button>
                <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">Termos</button>
                <button onClick={() => navigate('/security')} className="hover:text-foreground transition-colors">Segurança</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

