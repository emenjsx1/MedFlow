import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, FileCheck, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Security() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/lp')}>Início</Button>
              <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Segurança e Privacidade</h1>
            <p className="text-lg text-muted-foreground">
              Seus dados estão protegidos com os mais altos padrões de segurança
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lock className="h-6 w-6 text-primary" />
                  <CardTitle>Criptografia</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Todos os dados são criptografados em trânsito (TLS/SSL) e em repouso (AES-256).
                  Suas informações nunca são acessíveis sem autenticação adequada.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-primary" />
                  <CardTitle>Conformidade LGPD</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  MedFlow está em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
                  Você tem controle total sobre seus dados e pode solicitá-los ou excluí-los a qualquer momento.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileCheck className="h-6 w-6 text-primary" />
                  <CardTitle>Backup Automático</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Seus dados são copiados automaticamente diariamente em servidores seguros e redundantes.
                  Nunca perdemos informações importantes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certificações e Conformidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>LGPD Compliant</Badge>
                  <Badge>ISO 27001</Badge>
                  <Badge>HIPAA Ready</Badge>
                  <Badge>SSL/TLS Encrypted</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

