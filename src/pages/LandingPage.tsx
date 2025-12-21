import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Bell, Clock, Sparkles, Play, ArrowRight, CheckCircle2, Users, Calendar, Bot, Shield, Zap, ChevronLeft, ChevronRight, Star, Plus, Minus, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
const allFeatures = ["Agendamentos ilimitados", "WhatsApp integrado", "Lembretes automáticos (1h e 10min antes)", "Suporte 24/7 automatizado via IA", "Fila de espera inteligente", "Relatórios e métricas", "Gestão de pacientes", "Integrações com Google Calendar", "Suporte prioritário via WhatsApp", "Atualizações gratuitas", "Acesso Mobile e Desktop"];
const plans = [{
  id: "monthly",
  name: "Mensal",
  originalPrice: 197,
  price: 47,
  interval: "mês",
  description: "Pagamento mensal",
  features: allFeatures,
  checkoutUrl: "https://checkout.escalepay.com/3004344"
}, {
  id: "quarterly",
  name: "Trimestral",
  originalPrice: 591,
  price: 127,
  interval: "trimestre",
  savings: "Economize 78%",
  popular: true,
  hot: true,
  description: "3 meses de acesso",
  features: allFeatures,
  checkoutUrl: "https://checkout.escalepay.com/8383727"
}, {
  id: "annual",
  name: "Anual",
  originalPrice: 2364,
  price: 470,
  interval: "ano",
  savings: "Economize mais de 80%",
  description: "12 meses de acesso",
  features: allFeatures,
  checkoutUrl: "https://checkout.escalepay.com/3059186"
}];
const features = [{
  icon: Bot,
  title: "Atendimento 24/7 por IA",
  description: "Responda pacientes a qualquer hora, mesmo enquanto você dorme"
}, {
  icon: Bell,
  title: "Lembretes automáticos",
  description: "Reduza faltas em até 70% com lembretes inteligentes"
}, {
  icon: Calendar,
  title: "Agenda inteligente",
  description: "Múltiplos profissionais com agendas independentes"
}, {
  icon: Users,
  title: "Fila de espera",
  description: "Preencha horários vagos automaticamente"
}, {
  icon: Shield,
  title: "Google Calendar",
  description: "Sincronização em tempo real com sua agenda"
}, {
  icon: Zap,
  title: "Relatórios",
  description: "Métricas e insights sobre sua clínica"
}];
const testimonials = [{
  name: "Dr. Carlos Silva",
  role: "Dentista",
  image: "https://randomuser.me/api/portraits/men/32.jpg",
  text: "Reduzi as faltas em 65% no primeiro mês. A IA responde meus pacientes perfeitamente, mesmo de madrugada.",
  rating: 5
}, {
  name: "Dra. Ana Paula",
  role: "Dermatologista",
  image: "https://randomuser.me/api/portraits/women/44.jpg",
  text: "Minha secretária agora foca no atendimento presencial. O WhatsApp automático mudou nossa rotina completamente.",
  rating: 5
}, {
  name: "Dr. Roberto Mendes",
  role: "Fisioterapeuta",
  image: "https://randomuser.me/api/portraits/men/52.jpg",
  text: "Em 3 meses recuperei o investimento. Menos faltas = mais faturamento. Simples assim.",
  rating: 5
}, {
  name: "Dra. Mariana Costa",
  role: "Psicóloga",
  image: "https://randomuser.me/api/portraits/women/68.jpg",
  text: "Pacientes adoram a praticidade de agendar pelo WhatsApp a qualquer hora. Recomendo para todos os colegas.",
  rating: 5
}];
const targetAudience = [{
  title: "Clínicas médicas"
}, {
  title: "Consultórios odontológicos"
}, {
  title: "Estéticas e spas"
}, {
  title: "Psicólogos e terapeutas"
}, {
  title: "Fisioterapeutas"
}, {
  title: "Oftalmologistas"
}];
const faqs = [{
  question: "Preciso ter conhecimento técnico para usar?",
  answer: "Não! O AgendaClin foi feito para ser simples. Em menos de 5 minutos você conecta seu WhatsApp e começa a usar. Temos tutoriais em vídeo e suporte em português."
}, {
  question: "Funciona com meu sistema atual?",
  answer: "Sim! O AgendaClin funciona de forma independente e se integra com Google Calendar. Você pode continuar usando seu sistema atual enquanto aproveita nossa automação."
}, {
  question: "Posso cancelar a qualquer momento?",
  answer: "Sim! Não temos fidelidade. Você pode cancelar quando quiser sem multas ou taxas extras."
}, {
  question: "A IA realmente responde bem os pacientes?",
  answer: "Nossa IA foi treinada especificamente para atendimento em saúde. Ela entende contexto, horários, e responde de forma natural e profissional."
}, {
  question: "E se o paciente quiser falar com uma pessoa?",
  answer: "A IA identifica quando o paciente precisa de atendimento humano e encaminha automaticamente para você ou sua equipe."
}, {
  question: "Quantos profissionais posso cadastrar?",
  answer: "Ilimitados! Cada profissional tem sua própria agenda, horários de trabalho e pode ter seu próprio Google Calendar sincronizado."
}];
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      return {
        hours: Math.floor(diff / (1000 * 60 * 60) % 24),
        minutes: Math.floor(diff / (1000 * 60) % 60),
        seconds: Math.floor(diff / 1000 % 60)
      };
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <div className="flex items-center justify-center gap-1 sm:gap-2 text-lg sm:text-2xl md:text-3xl font-bold">
      <div className="bg-background text-foreground px-2 sm:px-3 py-1 sm:py-2 rounded-lg min-w-[45px] sm:min-w-[60px] text-center">
        {String(timeLeft.hours).padStart(2, '0')}h
      </div>
      <span>:</span>
      <div className="bg-background text-foreground px-2 sm:px-3 py-1 sm:py-2 rounded-lg min-w-[45px] sm:min-w-[60px] text-center">
        {String(timeLeft.minutes).padStart(2, '0')}m
      </div>
      <span>:</span>
      <div className="bg-background text-foreground px-2 sm:px-3 py-1 sm:py-2 rounded-lg min-w-[45px] sm:min-w-[60px] text-center">
        {String(timeLeft.seconds).padStart(2, '0')}s
      </div>
    </div>;
}
function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const next = () => setCurrent(prev => (prev + 1) % testimonials.length);
  const prev = () => setCurrent(prev => (prev - 1 + testimonials.length) % testimonials.length);
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);
  return <div className="relative max-w-4xl mx-auto px-2 sm:px-0">
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500 ease-in-out" style={{
        transform: `translateX(-${current * 100}%)`
      }}>
          {testimonials.map((testimonial, index) => <div key={index} className="w-full flex-shrink-0 px-1 sm:px-4">
              <Card className="bg-background border-2">
                <CardContent className="pt-4 sm:pt-8 pb-4 sm:pb-6 px-4 sm:px-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-primary" />
                    <div>
                      <h4 className="font-semibold text-sm sm:text-lg">{testimonial.name}</h4>
                      <p className="text-xs sm:text-base text-muted-foreground">{testimonial.role}</p>
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({
                      length: testimonial.rating
                    }).map((_, i) => <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm sm:text-lg italic text-muted-foreground">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            </div>)}
        </div>
      </div>

      <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 sm:-translate-x-4 w-8 h-8 sm:w-10 sm:h-10 bg-background border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors z-10">
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 sm:translate-x-4 w-8 h-8 sm:w-10 sm:h-10 bg-background border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors z-10">
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <div className="flex justify-center gap-2 mt-4 sm:mt-6">
        {testimonials.map((_, index) => <button key={index} onClick={() => setCurrent(index)} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${current === index ? 'bg-primary' : 'bg-muted-foreground/30'}`} />)}
      </div>
    </div>;
}
function FAQItem({
  question,
  answer
}: {
  question: string;
  answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return <div className="border rounded-lg overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 text-left bg-background hover:bg-muted/50 transition-colors">
        <span className="font-medium">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
      </button>
      {isOpen && <div className="px-4 pb-4 text-muted-foreground">{answer}</div>}
    </div>;
}
function SignupModal({
  isOpen,
  onClose,
  selectedPlan
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: typeof plans[0] | null;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setIsLoading(true);
    try {
      // Send data to webhook
      const response = await fetch("https://aeilvaampnacbcrpkkyi.supabase.co/functions/v1/create-user-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          plan: selectedPlan?.id,
          planName: selectedPlan?.name,
          planPrice: selectedPlan?.price
        })
      });
      if (response.ok) {
        toast.success("Dados enviados! Redirecionando para pagamento...");
        // You can redirect to payment page here
        onClose();
      } else {
        toast.error("Erro ao processar. Tente novamente.");
      }
    } catch (error) {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">AgendaClin</span>
            </div>
          </div>
          <DialogTitle className="text-xl">Crie sua conta no AgendaClin</DialogTitle>
          <DialogDescription>
            Preencha seus dados para continuar com a assinatura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="Seu nome" value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} className="border-primary/30 focus:border-primary" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({
            ...formData,
            phone: e.target.value
          })} />
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" size="lg" disabled={isLoading}>
            {isLoading ? "Processando..." : "Continuar para Pagamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>;
}
function SimpleLogo({
  size = "md"
}: {
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: {
      icon: "w-8 h-8",
      text: "text-lg"
    },
    md: {
      icon: "w-10 h-10",
      text: "text-xl"
    },
    lg: {
      icon: "w-12 h-12",
      text: "text-2xl"
    }
  };
  return <div className="flex items-center gap-2">
      <div className={`${sizes[size].icon} rounded-lg bg-primary flex items-center justify-center`}>
        <Calendar className="w-2/3 h-2/3 text-primary-foreground" />
      </div>
      <span className={`${sizes[size].text} font-bold text-primary`}>AgendaClin</span>
    </div>;
}
export default function LandingPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const handleSelectPlan = (plan: typeof plans[0]) => {
    // Redirecionar diretamente para o checkout do plano selecionado
    window.location.href = plan.checkoutUrl;
  };
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <SimpleLogo size="sm" />
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" onClick={scrollToPricing} className="hidden sm:inline-flex text-sm">
                Planos
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-3 sm:px-4" onClick={() => navigate('/login')}>
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Discount Banner */}
      

      {/* Hero Section */}
      <section className="py-8 sm:py-12 md:py-20 overflow-hidden">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 sm:mb-6 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Automação inteligente para clínicas
            </Badge>

            <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-tight mb-4 sm:mb-6 leading-tight">
              Elimine as faltas, automatize confirmações e{" "}
              <span className="text-primary">aumente o faturamento</span>
            </h1>

            <p className="text-sm sm:text-base md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
              Chega de{" "}
              <span className="font-semibold text-foreground">pacientes que não aparecem</span>,{" "}
              <span className="font-semibold text-foreground">WhatsApp tocando fora de hora</span> e{" "}
              <span className="font-semibold text-foreground">funcionários perdendo tempo com ligações</span>.
            </p>
          </div>
        </div>
      </section>

      {/* VSL Section */}
      <section className="pb-10 sm:pb-16">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl">
              <div 
                dangerouslySetInnerHTML={{
                  __html: `
                    <vturb-smartplayer id="vid-69487a1e798d3e9d452d5a4b" style="display: block; margin: 0 auto; width: 100%;"></vturb-smartplayer>
                    <script type="text/javascript">
                      var s=document.createElement("script");
                      s.src="https://scripts.converteai.net/06360127-0c05-416d-8bd8-3f5e34305802/players/69487a1e798d3e9d452d5a4b/v4/player.js";
                      s.async=!0;
                      document.head.appendChild(s);
                    </script>
                  `
                }}
              />
            </div>

            <div className="flex justify-center mt-4 sm:mt-6">
              <Button size="lg" className="gap-2 text-sm sm:text-base px-4 sm:px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto" onClick={scrollToPricing}>
                Quero automatizar minha clínica
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-10 sm:py-16 bg-muted/30">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
              100% Online e Automatizado
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Acesse de qualquer lugar, a qualquer hora. Sua clínica no piloto automático.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-base sm:text-xl font-semibold mb-2">Conecte seu WhatsApp</h3>
              <p className="text-sm text-muted-foreground">Em menos de 5 minutos você conecta sua conta</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-base sm:text-xl font-semibold mb-2">IA assume o atendimento</h3>
              <p className="text-sm text-muted-foreground">Nossa IA responde, agenda e confirma consultas automaticamente</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4 sm:mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-base sm:text-xl font-semibold mb-2">Foque no que importa</h3>
              <p className="text-sm text-muted-foreground">Você atende seus pacientes enquanto a tecnologia cuida do resto</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-10 sm:py-16">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
              Funcionalidades Completas
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Tudo o que você precisa para gerenciar sua clínica em um só lugar
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => <Card key={index} className="bg-background hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardHeader>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-10 sm:py-16 bg-muted/30">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
              Para quem é o AgendaClin?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Ideal para qualquer profissional de saúde que quer automatizar agendamentos
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {targetAudience.map((item, index) => <div key={index} className="bg-background rounded-xl p-4 sm:p-6 text-center hover:shadow-lg transition-shadow border">
                <span className="text-xs sm:text-sm font-medium">{item.title}</span>
              </div>)}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-10 sm:py-16">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Profissionais que já transformaram suas clínicas
            </p>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* Urgency Banner */}
      <section className="py-8 sm:py-12 bg-destructive text-destructive-foreground">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto text-center">
          <h3 className="text-lg sm:text-xl md:text-3xl font-bold mb-2">
            OFERTA POR TEMPO LIMITADO
          </h3>
          <p className="text-sm sm:text-lg mb-4 sm:mb-6 opacity-90">
            Preço promocional encerra em:
          </p>
          <CountdownTimer />
          <Button size="lg" variant="secondary" className="mt-4 sm:mt-6 gap-2 font-semibold text-sm sm:text-base w-full sm:w-auto" onClick={scrollToPricing}>
            Garantir minha vaga
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-10 sm:py-16">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-3 sm:mb-4">
            Incluso em todos os planos
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 sm:mb-10 max-w-2xl mx-auto px-2">
            Acesso completo a todas as funcionalidades, sem surpresas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {allFeatures.map((feature, index) => <div key={index} className="flex items-center gap-2 sm:gap-3 bg-muted/50 p-3 sm:p-4 rounded-xl">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{feature}</span>
              </div>)}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-10 sm:py-16 bg-muted/30">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Escolha seu plano e comece agora
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              ⚡Todos os planos estão com desconto nesse momento⚡
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto">
            {plans.map(plan => <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-xl ring-2 ring-primary/20 md:scale-105 z-10' : ''}`}>
                {plan.hot && <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-destructive text-destructive-foreground shadow-lg gap-1 text-xs">
                      <Flame className="w-3 h-3" />
                      Mais Escolhido
                    </Badge>
                  </div>}
                <CardHeader className="text-center pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="py-3 sm:py-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-sm sm:text-lg text-muted-foreground line-through">
                        R$ {plan.originalPrice}
                      </span>
                    </div>
                    <span className="text-3xl sm:text-4xl font-bold text-primary">R$ {plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                  </div>
                  {plan.savings && <Badge variant="secondary" className={`text-xs ${plan.id === 'annual' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'}`}>
                      {plan.savings}
                    </Badge>}
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div className="space-y-2">
                    {plan.features.slice(0, 6).map((feature, idx) => <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>)}
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      + mais {plan.features.length - 6} funcionalidades
                    </p>
                  </div>
                  <Button className={`w-full text-sm sm:text-base ${plan.popular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}`} size="lg" variant={plan.popular ? "default" : "outline"} onClick={() => handleSelectPlan(plan)}>
                    Quero Este Plano
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-10 sm:py-16">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Tire suas dúvidas sobre o AgendaClin
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-2 sm:space-y-3">
            {faqs.map((faq, index) => <FAQItem key={index} question={faq.question} answer={faq.answer} />)}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-10 sm:py-16 bg-primary text-primary-foreground">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Sua agenda no piloto automático
          </h2>
          <p className="text-sm sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 px-2">
            Enquanto você descansa, a IA continua agendando e atendendo seus pacientes
          </p>
          <Button size="lg" variant="secondary" className="gap-2 font-semibold text-sm sm:text-base w-full sm:w-auto" onClick={scrollToPricing}>
            Quero Automatizar Minha Clínica
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 sm:py-8 bg-background">
        <div className="w-full px-3 sm:px-4 md:container md:mx-auto">
          <div className="flex flex-col items-center gap-4 text-center">
            <SimpleLogo size="sm" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              AgendaClin — o sistema que transforma desorganização em lucro
            </p>
            <div className="flex gap-4 text-xs sm:text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            © {new Date().getFullYear()} AgendaClin. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Signup Modal */}
      <SignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedPlan={selectedPlan} />
    </div>;
}