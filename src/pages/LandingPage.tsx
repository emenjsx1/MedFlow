import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, MessageSquare, Bell, Clock, Users, Building2, Stethoscope, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "monthly",
    name: "Mensal",
    price: 47,
    interval: "mês",
    description: "Perfeito para começar",
    features: [
      "Agendamentos ilimitados",
      "WhatsApp integrado",
      "Lembretes automáticos",
      "Suporte por email"
    ]
  },
  {
    id: "quarterly",
    name: "Trimestral",
    price: 127,
    interval: "trimestre",
    savings: "Economize 10%",
    popular: true,
    description: "Mais economia",
    features: [
      "Tudo do plano mensal",
      "Relatórios avançados",
      "Suporte prioritário",
      "Fila de espera inteligente"
    ]
  },
  {
    id: "annual",
    name: "Anual",
    price: 470,
    interval: "ano",
    savings: "Economize 17%",
    description: "Melhor custo-benefício",
    features: [
      "Tudo do plano trimestral",
      "Onboarding personalizado",
      "Suporte 24/7",
      "Integrações premium"
    ]
  }
];

const features = [
  {
    icon: Calendar,
    title: "Agendamento Inteligente",
    description: "Sistema completo de agendamento com calendário integrado e gestão de horários"
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Automatizado",
    description: "Confirmações e lembretes automáticos via WhatsApp para seus pacientes"
  },
  {
    icon: Bell,
    title: "Lembretes Automáticos",
    description: "Notificações 1 hora e 10 minutos antes da consulta, reduzindo faltas"
  },
  {
    icon: Clock,
    title: "Fila de Espera",
    description: "Preencha horários vagos automaticamente com pacientes da lista de espera"
  },
  {
    icon: Users,
    title: "Gestão de Pacientes",
    description: "Cadastro completo de pacientes com histórico de consultas"
  },
  {
    icon: Sparkles,
    title: "IA Assistente",
    description: "Agente de IA que agenda consultas automaticamente via WhatsApp"
  }
];

const targetAudience = [
  {
    icon: Stethoscope,
    title: "Clínicas Médicas",
    description: "Ideal para clínicas de todas as especialidades"
  },
  {
    icon: Building2,
    title: "Consultórios",
    description: "Perfeito para consultórios individuais ou em grupo"
  },
  {
    icon: Users,
    title: "Profissionais de Saúde",
    description: "Dentistas, psicólogos, fisioterapeutas e mais"
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    // For now, navigate to login - later can integrate with checkout
    navigate(`/login?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AgendaAI</span>
          </div>
          <Button onClick={() => navigate("/login")}>Entrar</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">
            🚀 Automatize seu consultório
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            Agendamento inteligente com{" "}
            <span className="text-primary">IA e WhatsApp</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Reduza faltas em até 70% com lembretes automáticos, fila de espera inteligente 
            e um agente de IA que agenda consultas pelo WhatsApp.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver Planos
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para sua clínica
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Funcionalidades completas para automatizar seu consultório e melhorar a experiência dos pacientes
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Para quem é o AgendaAI?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Desenvolvido especialmente para profissionais de saúde que querem otimizar seu tempo
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {targetAudience.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
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
              Escolha seu plano
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comece a automatizar sua clínica hoje mesmo
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Mais Popular</Badge>
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
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {plan.savings}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar sua clínica?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de profissionais que já automatizaram seus agendamentos
          </p>
          <Button size="lg" onClick={() => navigate("/login")}>
            Criar Minha Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AgendaAI</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Sistema inteligente de agendamento para clínicas e consultórios.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Planos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">WhatsApp</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} AgendaAI. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
