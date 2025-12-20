import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare, Bell, Clock, Sparkles, Play, Headphones, AlertTriangle, ArrowDown, CheckCircle2 } from "lucide-react";
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
  "Pacientes que não aparecem e você fica com horário vago",
  "Ter que responder WhatsApp fora do horário de trabalho",
  "Perder pacientes porque não conseguiu responder a tempo",
  "Funcionários gastando horas confirmando consultas manualmente"
];

const benefits = [
  "IA atendendo seus pacientes 24 horas por dia, 7 dias por semana",
  "Lembretes automáticos que reduzem faltas em até 70%",
  "Fila de espera que preenche horários vagos automaticamente",
  "Mais tempo para você e sua equipe focarem no que importa"
];

export default function LandingPage() {
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    navigate(`/login?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Attention Header */}
      <div className="bg-destructive text-destructive-foreground py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm md:text-base font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            ATENÇÃO: Assista o vídeo abaixo até o final para entender como funciona
            <AlertTriangle className="w-4 h-4" />
          </p>
        </div>
      </div>

      {/* Hero Section - Direct Response Style */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
            🚨 VOCÊ JÁ SE IMAGINOU SUA AGENDA FUNCIONANDO SOZINHA?
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Descubra como clínicas e consultórios estão <span className="font-bold text-foreground">eliminando faltas</span> e <span className="font-bold text-foreground">atendendo pacientes 24 horas por dia</span> sem contratar mais funcionários
          </p>

          <div className="flex items-center justify-center gap-2 mb-8 text-muted-foreground">
            <ArrowDown className="w-5 h-5 animate-bounce" />
            <span className="text-sm font-medium">ASSISTA O VÍDEO ABAIXO</span>
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </section>

      {/* VSL Section */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* VTurb Embed Container */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-primary/20">
              {/* Replace this div with your VTurb embed code */}
              <div 
                id="vturb-embed" 
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black"
              >
                <div className="text-center text-white/60">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Cole aqui o embed do VTurb</p>
                  <p className="text-xs mt-2 opacity-50">Substitua este div pelo código do player</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Se você está cansado de...
            </h2>
            <div className="space-y-4">
              {painPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3 bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                  <span className="text-destructive text-xl">✗</span>
                  <p className="text-lg">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Com o AgendaClin você terá...
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            O que está incluso em todos os planos
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Acesso completo a todas as funcionalidades, sem surpresas
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {allFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 bg-background p-4 rounded-lg border">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
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
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105 z-10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Mais Escolhido</Badge>
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
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Quero Automatizar Minha Clínica
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
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
