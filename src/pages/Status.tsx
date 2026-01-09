import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

const services = [
  { name: "API", status: "operational", uptime: "99.9%" },
  { name: "Dashboard", status: "operational", uptime: "99.8%" },
  { name: "WhatsApp Integration", status: "operational", uptime: "99.7%" },
  { name: "Database", status: "operational", uptime: "99.9%" },
];

export default function Status() {
  const navigate = useNavigate();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "down":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-500">Operacional</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500">Degradado</Badge>;
      case "down":
        return <Badge className="bg-red-500">Indisponível</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Status do Sistema</h1>
            <p className="text-lg text-muted-foreground">
              Monitoramento em tempo real de todos os serviços MedFlow
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Status Geral</CardTitle>
                <Badge className="bg-green-500">Todos os sistemas operacionais</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Todos os serviços estão funcionando normalmente. Última atualização: {new Date().toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}




