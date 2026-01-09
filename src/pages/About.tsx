import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Heart, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

export default function About() {
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
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Sobre o MedFlow</h1>
            <p className="text-lg text-muted-foreground">
              Transformando a gestão de clínicas com tecnologia inteligente
            </p>
          </div>

          <div className="space-y-12">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Nossa Missão</h2>
                <p className="text-muted-foreground">
                  Democratizar o acesso à tecnologia de gestão para profissionais de saúde, 
                  permitindo que eles foquem no que realmente importa: cuidar de seus pacientes.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Missão</h3>
                  <p className="text-sm text-muted-foreground">
                    Simplificar a gestão de clínicas com tecnologia acessível
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Visão</h3>
                  <p className="text-sm text-muted-foreground">
                    Ser a plataforma líder em gestão inteligente para saúde
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Heart className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Valores</h3>
                  <p className="text-sm text-muted-foreground">
                    Inovação, simplicidade e compromisso com resultados
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}




