import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

const competitors = [
  {
    name: "MedFlow",
    features: {
      "IA 24/7": true,
      "WhatsApp": true,
      "Google Calendar": true,
      "CRM": true,
      "Relatórios": true,
      "Fila de Espera": true,
      "Preço": "A partir de R$ 197/mês"
    }
  },
  {
    name: "Concorrente A",
    features: {
      "IA 24/7": false,
      "WhatsApp": true,
      "Google Calendar": true,
      "CRM": false,
      "Relatórios": true,
      "Fila de Espera": false,
      "Preço": "A partir de R$ 350/mês"
    }
  },
];

export default function Compare() {
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
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Compare MedFlow</h1>
            <p className="text-lg text-muted-foreground">
              Veja por que MedFlow é a melhor escolha
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left">Funcionalidade</th>
                      {competitors.map((comp) => (
                        <th key={comp.name} className="p-4 text-center">
                          {comp.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(competitors[0].features).map((feature) => (
                      <tr key={feature} className="border-b">
                        <td className="p-4 font-medium">{feature}</td>
                        {competitors.map((comp) => (
                          <td key={comp.name} className="p-4 text-center">
                            {comp.features[feature] === true ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : comp.features[feature] === false ? (
                              <X className="h-5 w-5 text-red-500 mx-auto" />
                            ) : (
                              <span className="text-sm">{comp.features[feature]}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button size="lg" onClick={() => navigate('/register')}>
              Começar Teste Grátis
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}




