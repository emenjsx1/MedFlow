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
  TrendingUp,
  Clock,
  Smartphone,
  Globe,
  Lock,
  ChevronRight,
  Award,
  Target,
  BookOpen,
  HelpCircle,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencySelector } from "@/components/CurrencySelector";
import { Flame } from "lucide-react";
import { SecurityBadges } from "@/components/trust/SecurityBadges";
import { ComplianceBadges } from "@/components/trust/ComplianceBadges";
import { Pricing } from "@/components/ui/pricing";
import { Marquee } from "@/components/ui/3d-testimonials";
import { SplineScene } from "@/components/ui/spline";
import { Spotlight } from "@/components/ui/spotlight";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ShaderBackground from "@/components/ui/shader-background";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const allFeatures = [
  "Agendamentos ilimitados",
  "WhatsApp integrado com QR Code",
  "Lembretes automáticos (1h e 10min antes)",
  "Atendimento 24/7 automatizado",
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
  "Atendimento humano quando necessário",
  "Suporte prioritário via WhatsApp",
  "Atualizações gratuitas",
  "Acesso Mobile e Desktop",
];

const features = [
  {
    icon: Bot,
    title: "Atendimento 24/7 que você NÃO tem",
    description: "Enquanto você dorme, seus pacientes desistem porque ninguém responde. Seus concorrentes estão agendando consultas às 3h da manhã. Você não.",
    color: "text-blue-500"
  },
  {
    icon: Bell,
    title: "Lembretes que você DEVERIA ter",
    description: "70% das suas faltas acontecem porque você não avisa os pacientes. R$ 5.000/mês indo embora por pura falta de organização.",
    color: "text-primary"
  },
  {
    icon: Calendar,
    title: "Agenda que seus concorrentes têm",
    description: "Enquanto você perde tempo organizando manualmente, eles já sincronizaram tudo e estão atendendo mais pacientes",
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
    description: "R$ 5.000/mês que você está jogando no lixo por não usar o MedFlow",
    icon: TrendingUp
  },
  {
    title: "Economia de Tempo",
    value: "15h/semana",
    description: "Tempo que sua secretária desperdiça fazendo o que o sistema faz sozinho",
    icon: Clock
  },
  {
    title: "Aumento de Receita",
    value: "+35%",
    description: "Dinheiro que seus concorrentes estão ganhando enquanto você hesita",
    icon: Target
  },
  {
    title: "Satisfação",
    value: "98%",
    description: "Pacientes que fogem para quem responde rápido - você não está perdendo?",
    icon: Award
  }
];

const testimonials = [
  {
    name: "Dr. Carlos Silva",
    username: "@carlos",
    role: "Dentista - Clínica Sorriso Perfeito",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "Recuperei R$ 18.000 em 3 meses. Quem não usa isso está literalmente jogando dinheiro fora. Não entendo como alguém ainda hesita.",
    country: "🇧🇷 Brasil",
    rating: 5
  },
  {
    name: "Dra. Ana Paula",
    username: "@ana",
    role: "Dermatologista - Clínica DermaCare",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    text: "Aumentei minha receita em 40% sem contratar ninguém. Quem ainda não usa está ficando para trás. É simples assim.",
    country: "🇧🇷 Brasil",
    rating: 5
  },
  {
    name: "Dr. Roberto Mendes",
    username: "@roberto",
    role: "Fisioterapeuta - Centro de Reabilitação",
    image: "https://randomuser.me/api/portraits/men/52.jpg",
    text: "Recuperei o investimento em 3 meses. Agora ganho R$ 5.000/mês a mais. Quem não usa está perdendo dinheiro todo dia.",
    country: "🇧🇷 Brasil",
    rating: 5
  },
  {
    name: "Dra. Mariana Costa",
    username: "@mariana",
    role: "Psicóloga - Clínica Bem Estar",
    image: "https://randomuser.me/api/portraits/women/28.jpg",
    text: "70% menos faltas = R$ 60.000/ano a mais no bolso. Quem ainda hesita não quer realmente resolver o problema.",
    country: "🇧🇷 Brasil",
    rating: 5
  },
  {
    name: "Dr. Paulo Santos",
    username: "@paulo",
    role: "Ortopedista - Clínica Ortopédica",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    text: "Economizei 20h/semana. Minha secretária agora faz o que realmente importa. Quem não usa está desperdiçando tempo e dinheiro.",
    country: "🇧🇷 Brasil",
    rating: 5
  },
  {
    name: "Dra. Juliana Lima",
    username: "@juliana",
    role: "Nutricionista - Clínica NutriVida",
    image: "https://randomuser.me/api/portraits/women/35.jpg",
    text: "O CRM integrado facilitou muito o acompanhamento dos pacientes. A fila de espera preenche automaticamente os horários vagos.",
    country: "🇧🇷 Brasil",
    rating: 5
  },
  {
    name: "Dr. Fernando Alves",
    username: "@fernando",
    role: "Cardiologista - Clínica CardioCare",
    image: "https://randomuser.me/api/portraits/men/38.jpg",
    text: "R$ 60.000 a mais no primeiro ano. Quem não usa isso está literalmente deixando dinheiro na mesa. Não faz sentido.",
    country: "🇧🇷 Brasil",
    rating: 5
  },
  {
    name: "Dra. Camila Rocha",
    username: "@camila",
    role: "Pediatra - Clínica PediCare",
    image: "https://randomuser.me/api/portraits/women/42.jpg",
    text: "Os pais adoram receber lembretes pelo WhatsApp. A experiência do paciente melhorou muito desde que implementei o MedFlow.",
    country: "🇧🇷 Brasil",
    rating: 5
  },
  {
    name: "Dr. Lucas Oliveira",
    username: "@lucas",
    role: "Veterinário - Clínica PetCare",
    image: "https://randomuser.me/api/portraits/men/41.jpg",
    text: "Funciona perfeitamente para clínicas veterinárias também. Os tutores recebem lembretes e conseguem reagendar facilmente.",
    country: "🇧🇷 Brasil",
    rating: 5
  }
];

const faqs = [
  {
    question: "Quanto tempo leva para configurar?",
    answer: "Menos de 5 minutos! Se você demorar mais que isso, o problema não é o sistema. Você já começa a reduzir faltas no primeiro dia. Enquanto você inventa desculpas, seus concorrentes já configuraram e estão recuperando milhares de reais. Quanto mais você espera, mais dinheiro vai embora."
  },
  {
    question: "Funciona com meu sistema atual?",
    answer: "Sim! O MedFlow funciona de forma independente e se integra com Google Calendar. Você pode continuar usando seu sistema atual enquanto aproveita nossa automação."
  },
  {
    question: "O sistema realmente funciona bem?",
    answer: "Centenas de profissionais já recuperaram R$ 60.000/ano usando o MedFlow. Se você ainda tem dúvidas, talvez o problema seja você não querer resolver o problema. O sistema funciona 24/7, responde pacientes enquanto você dorme, e reduz faltas em 70%. Se isso não é suficiente, talvez você não queira realmente resolver o problema."
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim! Não temos fidelidade. Mas vamos ser honestos: se você cancelar, você vai voltar a perder R$ 5.000/mês com faltas. A escolha é sua: continuar perdendo dinheiro ou resolver o problema de uma vez por todas."
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

function TestimonialCard({ img, name, username, text, country }: { img: string; name: string; username: string; text: string; country: string }) {
  return (
    <Card className="w-50">
      <CardContent>
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9">
            <AvatarImage src={img} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium text-foreground flex items-center gap-1">
              {name} <span className="text-xs">{country}</span>
            </figcaption>
            <p className="text-xs font-medium text-muted-foreground">{username}</p>
          </div>
        </div>
        <blockquote className="mt-3 text-sm text-secondary-foreground">{text}</blockquote>
      </CardContent>
    </Card>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { formatWithSymbol } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated Shader Background */}
      <ShaderBackground />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Logo size="md" className="text-primary" />
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <button onClick={scrollToFeatures} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </button>
              <button onClick={scrollToPricing} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                Planos
              </button>
              <Button variant="ghost" onClick={() => navigate('/blog')} className="text-sm font-bold">
                Blog
              </Button>
              <Button variant="ghost" onClick={() => navigate('/help')} className="text-sm font-bold">
                Ajuda
              </Button>
              <CurrencySelector variant="minimal" />
              <Button variant="ghost" onClick={() => navigate('/login')} className="font-bold">
                Entrar
              </Button>
              <Button onClick={() => navigate('/register')} className="font-bold">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <CurrencySelector variant="minimal" />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="text-left">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-semibold"
                      onClick={scrollToFeatures}
                    >
                      Funcionalidades
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-semibold"
                      onClick={scrollToPricing}
                    >
                      Planos
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-semibold"
                      onClick={() => {
                        navigate('/blog');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Blog
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-semibold"
                      onClick={() => {
                        navigate('/help');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Ajuda
                    </Button>
                    <div className="border-t pt-4 mt-4">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left font-semibold mb-2"
                        onClick={() => {
                          navigate('/login');
                          setMobileMenuOpen(false);
                        }}
                      >
                        Entrar
                      </Button>
                      <Button
                        className="w-full font-bold"
                        onClick={() => {
                          navigate('/register');
                          setMobileMenuOpen(false);
                        }}
                      >
                        Começar Agora
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20 lg:py-32 bg-background">
        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              <Badge className="mb-4 md:mb-6 bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs md:text-sm px-3 py-1 border-2 border-destructive/50 inline-block font-bold animate-pulse">
                <Flame className="inline mr-1 h-3 w-3" />
                <span className="hidden sm:inline">⚠️ VOCÊ ESTÁ PERDENDO R$ 167/DIA</span>
                <span className="sm:hidden">⚠️ PERDENDO R$ 167/DIA</span>
              </Badge>
              
              <h1 className="mb-4 md:mb-6 text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight text-foreground">
                Você está{" "}
                <span className="text-primary">
                  perdendo R$ 5.000/mês
                </span>{" "}
                enquanto lê isso
              </h1>
              
              <p className="mb-6 md:mb-8 text-lg sm:text-xl md:text-xl lg:text-2xl text-muted-foreground leading-relaxed font-semibold">
                Enquanto você hesita, seus concorrentes já estão recuperando R$ 60.000/ano em receita perdida. <span className="text-primary font-bold">A cada dia que passa, você perde mais dinheiro.</span>
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-start">
                <Button size="lg" className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-auto sm:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/50" onClick={() => navigate('/register')}>
                  PARAR DE PERDER DINHEIRO AGORA
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>

              <div className="mt-6 md:mt-8 p-4 md:p-6 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
                <p className="text-sm md:text-base font-bold text-destructive mb-2">
                  ⚠️ ATENÇÃO: A cada dia sem o MedFlow, você perde:
                </p>
                <ul className="text-xs md:text-sm text-foreground space-y-1 font-semibold">
                  <li>• R$ 167 em receita perdida (por dia)</li>
                  <li>• 2-3 pacientes que desistem por falta de resposta rápida</li>
                  <li>• 5 horas da sua secretária fazendo trabalho manual</li>
                </ul>
              </div>

              <div className="mt-6 md:mt-8 flex flex-col sm:flex-row flex-wrap items-start gap-4 md:gap-8 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                  <span className="font-bold">Teste grátis - Sem cartão</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                  <span className="font-bold">Resultados em 24h</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                  <span className="font-bold">Cancele quando quiser</span>
                </div>
              </div>
            </div>

            {/* Right Content - 3D Scene (Desktop only) */}
            <div className="hidden lg:block relative h-[400px] lg:h-[500px] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
              <Spotlight
                className="-top-40 left-0 md:left-60 md:-top-20"
                fill="hsl(210, 100%, 40%)"
              />
              <div className="relative w-full h-full">
                <SplineScene 
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="w-full h-full"
                />
                {/* Blue overlay to tint the 3D scene */}
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Stats */}
      <section className="border-y bg-background py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center px-2">
                <div className="mb-2 inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary/10">
                  <benefit.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="mb-1 text-2xl md:text-3xl font-bold text-primary">{benefit.value}</div>
                <div className="mb-1 text-xs md:text-sm font-semibold leading-tight">{benefit.title}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">{benefit.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              O que você está perdendo por não ter isso?
            </h2>
            <p className="text-lg text-muted-foreground font-semibold">
              Enquanto você continua perdendo pacientes e dinheiro, seus concorrentes já estão usando essas ferramentas para dominar o mercado
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="group border border-border transition-all hover:border-primary hover:shadow-md bg-background">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* All Features List */}
          <div className="mx-auto max-w-4xl">
            <Card className="border border-border bg-background">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Tudo que você NÃO tem (e seus concorrentes têm)</CardTitle>
                <CardDescription className="text-center font-semibold">
                  Todas essas funcionalidades estão disponíveis em todos os planos. <span className="text-primary">Enquanto você hesita, seus concorrentes já estão usando tudo isso.</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
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
      <section className="bg-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Você se reconhece aqui?
            </h2>
            <p className="text-lg text-muted-foreground font-semibold">
              Se você ainda perde R$ 5.000/mês com faltas, gasta horas no telefone fazendo o que um sistema faz sozinho, ou está vendo seus concorrentes crescerem enquanto você fica para trás - <span className="text-primary font-bold">o problema é você, não o mercado</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {sectors.map((sector, index) => (
              <Card key={index} className="text-center hover:border-primary hover:shadow-lg transition-all border border-border">
                <CardContent className="p-6">
                  <span className="text-sm font-medium">{sector.title}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
              É mais fácil do que você pensa (e você está complicando)
            </h2>
            <p className="text-lg text-muted-foreground font-semibold">
              Enquanto você fica inventando desculpas, outros profissionais já configuraram em 5 minutos e estão recuperando milhares de reais. <span className="text-primary font-bold">Você vai continuar perdendo dinheiro por preguiça?</span>
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Conecte seu WhatsApp (2 minutos)",
                description: "Escaneie o QR Code. É isso. Se você não consegue fazer isso, talvez o problema seja outro."
              },
              {
                step: "02",
                title: "Configure sua agenda (2 minutos)",
                description: "Sincronize com Google Calendar ou configure manualmente. Seus concorrentes já fizeram isso há meses."
              },
              {
                step: "03",
                title: "Pronto! Agora você para de perder dinheiro",
                description: "O sistema trabalha 24/7 enquanto você dorme. Enquanto você hesitava, outros já recuperaram R$ 60.000/ano. Você ainda vai continuar perdendo?"
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <Card className="h-full border border-border bg-background">
                  <CardHeader>
                    <div className="mb-4 text-5xl font-bold text-primary/20">{item.step}</div>
                    <CardTitle className="text-2xl text-foreground">{item.title}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">{item.description}</CardDescription>
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
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Enquanto você hesita, eles já recuperaram R$ 60.000/ano
            </h2>
            <p className="text-lg text-muted-foreground font-semibold">
              Profissionais que não inventaram desculpas e simplesmente começaram. <span className="text-primary font-bold">Você vai continuar sendo o único que perde dinheiro?</span>
            </p>
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="border border-border rounded-lg relative flex h-[500px] md:h-[600px] w-full flex-row items-center justify-center overflow-hidden gap-1.5 [perspective:300px] bg-background">
              <div
                className="flex flex-row items-center gap-4"
                style={{
                  transform:
                    'translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
                }}
              >
                {/* Vertical Marquee (downwards) */}
                <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                  {testimonials.map((review) => (
                    <TestimonialCard 
                      key={review.username} 
                      img={review.image}
                      name={review.name}
                      username={review.username}
                      text={review.text}
                      country={review.country}
                    />
                  ))}
                </Marquee>
                {/* Vertical Marquee (upwards) */}
                <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                  {testimonials.map((review) => (
                    <TestimonialCard 
                      key={review.username} 
                      img={review.image}
                      name={review.name}
                      username={review.username}
                      text={review.text}
                      country={review.country}
                    />
                  ))}
                </Marquee>
                {/* Vertical Marquee (downwards) */}
                <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                  {testimonials.map((review) => (
                    <TestimonialCard 
                      key={review.username} 
                      img={review.image}
                      name={review.name}
                      username={review.username}
                      text={review.text}
                      country={review.country}
                    />
                  ))}
                </Marquee>
                {/* Vertical Marquee (upwards) */}
                <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                  {testimonials.map((review) => (
                    <TestimonialCard 
                      key={review.username} 
                      img={review.image}
                      name={review.name}
                      username={review.username}
                      text={review.text}
                      country={review.country}
                    />
                  ))}
                </Marquee>
                {/* Gradient overlays for vertical marquee */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-background"></div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-background">
        <Pricing
          plans={plans.map((plan) => {
            // Calcular preço anual (20% desconto)
            const monthlyPrice = plan.price;
            const yearlyPrice = plan.id === 'annual' 
              ? plan.price 
              : Math.floor(monthlyPrice * 12 * 0.8);
            
            return {
              name: plan.name,
              price: monthlyPrice.toString(),
              yearlyPrice: yearlyPrice.toString(),
              period: plan.interval,
              features: plan.features.slice(0, 10),
              description: plan.description,
              buttonText: `Assinar ${plan.name}`,
              href: plan.checkoutUrl,
              isPopular: plan.popular || false,
            };
          })}
          title="Pare de perder dinheiro - escolha seu plano AGORA"
          description="Todos os planos incluem todas as funcionalidades - sem pegadinhas, sem surpresas.\nA cada dia que você espera, perde mais R$ 167. Quanto mais você demora, mais dinheiro vai embora."
        />
        
        <div className="container mx-auto px-4 mt-8 text-center">
          <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-base font-bold text-destructive mb-2">
              ⏰ A CADA HORA QUE VOCÊ ESPERA, PERDE MAIS R$ 7
            </p>
            <p className="text-sm text-foreground font-semibold">
              Enquanto você pensa, seus concorrentes já estão recuperando milhares de reais. Quanto mais você demora, mais dinheiro vai embora.
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-4 font-semibold">
            Todos os planos incluem teste grátis de 3 dias - <span className="text-primary">sem desculpas, sem complicação</span>
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/50 font-bold text-lg px-8 py-6"
            onClick={() => navigate('/register')}
          >
            PARAR DE PERDER DINHEIRO AGORA - TESTE GRÁTIS
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-4 text-xs text-muted-foreground font-semibold">
            ⚠️ A cada minuto que você espera, perde mais R$ 0,12. Isso soma R$ 5.000/mês. <span className="text-destructive">Você realmente vai continuar perdendo?</span>
          </p>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 md:py-32 bg-background">
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
                <CardTitle className="text-foreground">Blog</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Artigos, dicas e estratégias para transformar sua clínica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  Ler Artigos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all border border-border bg-background" onClick={() => navigate('/help')}>
              <CardHeader>
                <HelpCircle className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-foreground">Central de Ajuda</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Encontre respostas rápidas e tutoriais passo a passo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  Acessar Ajuda <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all border border-border bg-background" onClick={() => navigate('/case-studies')}>
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-4" />
                <CardTitle className="text-foreground">Case Studies</CardTitle>
                <CardDescription className="text-muted-foreground">
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
      <section className="py-20 md:py-32 bg-background">
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
              <Card key={index} className="border border-border bg-background">
                <CardHeader>
                  <CardTitle className="text-left text-foreground">{faq.question}</CardTitle>
                  <CardDescription className="text-base text-left text-muted-foreground">{faq.answer}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t bg-background py-20">
        <div className="container mx-auto px-4">
          <Card className="border-2 border-destructive/50 bg-gradient-to-br from-destructive/10 to-destructive/5">
            <CardContent className="p-12 text-center">
              <div className="mb-6 inline-block px-4 py-2 bg-destructive/20 border-2 border-destructive/50 rounded-lg">
                <p className="text-sm font-bold text-destructive animate-pulse">
                  ⚠️ VOCÊ ESTÁ PERDENDO R$ 167/DIA ENQUANTO LÊ ISSO
                </p>
              </div>
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl text-foreground">
                Última chance: você vai continuar perdendo R$ 5.000/mês?
              </h2>
              <p className="mb-6 text-lg text-muted-foreground font-semibold">
                Centenas de profissionais já recuperaram R$ 60.000/ano. <span className="text-destructive font-bold">Você vai ser o único que continua perdendo dinheiro por pura preguiça?</span>
              </p>
              <div className="mb-6 p-4 bg-background/80 border border-destructive/30 rounded-lg max-w-md mx-auto">
                <p className="text-sm font-bold text-foreground mb-2">
                  A cada minuto que você espera:
                </p>
                <ul className="text-xs text-left space-y-1 text-muted-foreground font-semibold">
                  <li>• Perde R$ 0,12 (isso soma R$ 5.000/mês)</li>
                  <li>• Seus concorrentes agendam mais consultas</li>
                  <li>• Seus pacientes desistem por falta de resposta</li>
                </ul>
              </div>
              <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/50 font-bold" onClick={() => navigate('/register')}>
                PARAR DE PERDER DINHEIRO AGORA - TESTE GRÁTIS
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-4 text-xs text-muted-foreground font-semibold">
                Sem cartão de crédito • Resultados em 24h • Cancele quando quiser
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <Logo size="md" className="mb-4 text-primary" />
              <p className="text-sm text-muted-foreground mb-4">
                Sistema de gestão para clínicas e consultórios. 
                Automatize agendamentos, reduza faltas e aumente sua receita.
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
