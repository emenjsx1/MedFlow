import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare, Bell, Clock, Sparkles, Play, Headphones, ArrowRight, CheckCircle2, Users, Calendar, Bot, Shield, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

const allFeatures = [
  "Agendamentos ilimitados",
  "WhatsApp integrado",
  "Lembretes automáticos (1h e 10min antes)",
  "Suporte 24/7 automatizado via IA",
  "Fila de espera inteligente",
  "Relatórios e métricas",
  "Gestão de pacientes",
  "Integrações com Google Calendar"
];

const plans = [
  {
    id: "monthly",
    name: "Mensal",
    price: 47,
    interval: "mês",
    description: "Pagamento mensal",
    features: allFeatures
  },
  {
    id: "quarterly",
    name: "Trimestral",
    price: 127,
    interval: "trimestre",
    savings: "Economize 10%",
    popular: true,
    description: "3 meses de acesso",
    features: allFeatures
  },
  {
    id: "annual",
    name: "Anual",
    price: 470,
    interval: "ano",
    savings: "Economize 17%",
    description: "12 meses de acesso",
    features: allFeatures
  }
];

const painPoints = [
  {
    icon: Clock,
    title: "Pacientes que faltam",
    description: "Horários vagos que geram prejuízo financeiro e bagunçam sua agenda"
  },
  {
    icon: MessageSquare,
    title: "WhatsApp fora de hora",
    description: "Ter que responder mensagens à noite, finais de semana e feriados"
  },
  {
    icon: Users,
    title: "Equipe sobrecarregada",
    description: "Funcionários gastando horas confirmando consultas manualmente"
  }
];

const howItWorks = [
  {
    step: 1,
    title: "Conecte seu WhatsApp",
    description: "Em menos de 5 minutos você conecta sua conta e configura as mensagens"
  },
  {
    step: 2,
    title: "IA assume o atendimento",
    description: "Nossa IA responde, agenda e confirma consultas automaticamente"
  },
  {
    step: 3,
    title: "Foque no que importa",
    description: "Você atende seus pacientes enquanto a tecnologia cuida do resto"
  }
];

const features = [
  {
    icon: Bot,
    title: "Atendimento 24/7 por IA",
    description: "Responda pacientes a qualquer hora, mesmo enquanto você dorme"
  },
  {
    icon: Bell,
    title: "Lembretes automáticos",
    description: "Reduza faltas em até 70% com lembretes inteligentes"
  },
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description: "Múltiplos profissionais com agendas independentes"
  },
  {
    icon: Users,
    title: "Fila de espera",
    description: "Preencha horários vagos automaticamente"
  },
  {
    icon: Shield,
    title: "Google Calendar",
    description: "Sincronização em tempo real com sua agenda"
  },
  {
    icon: Zap,
    title: "Relatórios",
    description: "Métricas e insights sobre sua clínica"
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    navigate(`/login?plan=${planId}`);
  };

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={scrollToPricing}>
                Planos
              </Button>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              Automação inteligente para clínicas
            </Badge>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-6 leading-tight">
              Elimine as faltas, automatize confirmações e{" "}
              <span className="text-primary">aumente o faturamento</span> da sua clínica
            </h1>
            
            {/* Subheadline with 3 pain points */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Chega de{" "}
              <span className="font-semibold text-foreground">pacientes que não aparecem</span>,{" "}
              <span className="font-semibold text-foreground">WhatsApp tocando fora de hora</span> e{" "}
              <span className="font-semibold text-foreground">funcionários perdendo tempo com ligações</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="gap-2 text-base px-8" onClick={scrollToPricing}>
                Quero automatizar minha clínica
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base" onClick={() => navigate('/login')}>
                Já tenho conta
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Sem fidelidade</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Configuração em 5 min</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Suporte em português</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VSL Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-2xl overflow-hidden shadow-2xl border">
              <div 
                id="vturb-embed" 
                className="w-full h-full flex items-center justify-center"
              >
                <div className="text-center text-muted-foreground">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Cole aqui o embed do VTurb</p>
                  <p className="text-xs mt-1 opacity-60">Substitua este div pelo código do player</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Você está cansado de...
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Esses problemas afetam milhares de clínicas todos os dias
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {painPoints.map((point, index) => (
              <Card key={index} className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                    <point.icon className="w-6 h-6 text-destructive" />
                  </div>
                  <CardTitle className="text-lg">{point.title}</CardTitle>
                  <CardDescription>{point.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Em 3 passos simples você automatiza toda sua operação
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Tudo o que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Funcionalidades completas para transformar sua clínica
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="bg-background">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            O que está incluso em todos os planos
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Acesso completo a todas as funcionalidades, sem surpresas
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {allFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 bg-muted/50 p-4 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha seu plano e comece agora
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Todos os planos incluem as mesmas funcionalidades. Escolha apenas o período.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary shadow-xl ring-2 ring-primary/20 scale-105 z-10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary shadow-lg">Mais Escolhido</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="py-4">
                    <span className="text-4xl font-bold">R$ {plan.price}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                  {plan.savings && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      {plan.savings}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-center text-muted-foreground">
                    Acesso completo a todas as funcionalidades
                  </p>
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    Quero Este Plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sua agenda no piloto automático
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Enquanto você descansa, a IA continua agendando e atendendo seus pacientes
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="gap-2"
            onClick={scrollToPricing}
          >
            Quero Automatizar Minha Clínica
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AgendaClin. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
