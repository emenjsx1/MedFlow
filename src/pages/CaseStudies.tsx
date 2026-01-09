import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

const caseStudies = [
  {
    id: "1",
    clinic: "Clínica Sorriso Perfeito",
    professional: "Dr. Carlos Silva",
    specialty: "Odontologia",
    results: {
      noShows: "-65%",
      revenue: "+42%",
      timeSaved: "18h/semana"
    },
    testimonial: "Em 3 meses, reduzi as faltas em 65%. A IA responde meus pacientes perfeitamente, mesmo de madrugada.",
    slug: "clinica-sorriso-perfeito"
  },
  {
    id: "2",
    clinic: "Clínica DermaCare",
    professional: "Dra. Ana Paula",
    specialty: "Dermatologia",
    results: {
      noShows: "-58%",
      revenue: "+38%",
      timeSaved: "15h/semana"
    },
    testimonial: "Minha secretária agora foca no atendimento presencial. O WhatsApp automático mudou completamente nossa rotina.",
    slug: "clinica-dermacare"
  },
];

export default function CaseStudies() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <Button variant="ghost" onClick={() => navigate('/lp')}>Início</Button>
          </div>
        </div>
      </header>

      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Case Studies</h1>
            <p className="text-lg text-muted-foreground">
              Veja como clínicas estão transformando seus resultados com MedFlow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {caseStudies.map((study) => (
              <Card key={study.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge className="mb-2">{study.specialty}</Badge>
                  <CardTitle>{study.clinic}</CardTitle>
                  <CardDescription>{study.professional}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-500">{study.results.noShows}</div>
                      <div className="text-xs text-muted-foreground">Faltas</div>
                    </div>
                    <div className="text-center">
                      <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-500">{study.results.revenue}</div>
                      <div className="text-xs text-muted-foreground">Receita</div>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-500">{study.results.timeSaved}</div>
                      <div className="text-xs text-muted-foreground">Economia</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-4">"{study.testimonial}"</p>
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/case-studies/${study.slug}`)}>
                    Ver Detalhes <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}




