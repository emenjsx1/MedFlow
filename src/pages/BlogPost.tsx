import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import Logo from "@/components/Logo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock data - em produção, viria do Supabase
const posts: Record<string, {
  title: string;
  content: string;
  author: string;
  date: Date;
  category: string;
  image: string;
}> = {
  "reduzir-faltas-automacao": {
    title: "Como reduzir faltas em até 70% com automação",
    category: "Automação",
    author: "Equipe MedFlow",
    date: new Date("2024-01-15"),
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200",
    content: `
# Como reduzir faltas em até 70% com automação

As faltas de pacientes são um dos maiores desafios enfrentados por clínicas e consultórios. Estudos mostram que a taxa média de faltas pode chegar a 30% ou mais, causando perdas significativas de receita e tempo.

## O Problema das Faltas

Quando um paciente não comparece à consulta agendada:
- O profissional perde tempo que poderia estar atendendo outros pacientes
- A clínica perde receita
- Outros pacientes que poderiam ser atendidos ficam sem vaga
- A frustração aumenta tanto para o profissional quanto para pacientes em lista de espera

## A Solução: Automação Inteligente

Com o MedFlow, você pode reduzir faltas em até 70% através de:

### 1. Lembretes Automáticos

O sistema envia lembretes automáticos:
- 1 hora antes da consulta
- 10 minutos antes da consulta
- Via WhatsApp, o canal preferido pelos pacientes

### 2. Confirmação Automática

A IA do MedFlow:
- Envia mensagens de confirmação
- Responde automaticamente a pacientes
- Agenda reagendamentos quando necessário

### 3. Fila de Espera Inteligente

Quando um paciente cancela ou falta:
- O sistema automaticamente oferece a vaga para pacientes em lista de espera
- Reduz o tempo ocioso do profissional
- Aumenta a taxa de ocupação

## Resultados Reais

Clínicas que implementaram o MedFlow reportaram:
- Redução de 65-70% nas faltas
- Aumento de 35% na receita
- Melhoria na satisfação dos pacientes
- Economia de 15 horas semanais em gestão manual

## Como Começar

1. Cadastre-se no MedFlow
2. Conecte seu WhatsApp
3. Configure os lembretes automáticos
4. Deixe a automação trabalhar por você

**Teste grátis por 3 dias, sem cartão de crédito.**
    `
  },
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const post = slug ? posts[slug] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
            <p className="text-muted-foreground mb-6">
              O artigo que você está procurando não existe.
            </p>
            <Button onClick={() => navigate('/blog')}>
              Voltar para o Blog
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/blog')}>
                Blog
              </Button>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <div className="mb-8">
            <Badge className="mb-4">{post.category}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(post.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>

          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-8">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>

          <Card>
            <CardContent className="p-8 md:p-12">
              <div 
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: post.content
                    .split('\n')
                    .map(line => {
                      if (line.startsWith('# ')) {
                        return `<h1>${line.substring(2)}</h1>`;
                      }
                      if (line.startsWith('## ')) {
                        return `<h2>${line.substring(3)}</h2>`;
                      }
                      if (line.startsWith('### ')) {
                        return `<h3>${line.substring(4)}</h3>`;
                      }
                      if (line.startsWith('- ')) {
                        return `<li>${line.substring(2)}</li>`;
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return `<p><strong>${line.replace(/\*\*/g, '')}</strong></p>`;
                      }
                      if (line.trim() === '') {
                        return '<br/>';
                      }
                      return `<p>${line}</p>`;
                    })
                    .join('')
                }}
              />
            </CardContent>
          </Card>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MedFlow. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}




