import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Home } from "lucide-react";
import Logo from "@/components/Logo";

// Mock data - em produção, isso viria do Supabase
const articles: Record<string, { title: string; content: string; category: string }> = {
  "conectar-whatsapp": {
    title: "Como conectar seu WhatsApp",
    category: "WhatsApp",
    content: `
# Como conectar seu WhatsApp

Conectar seu WhatsApp ao MedFlow é simples e leva menos de 2 minutos.

## Passo 1: Acesse as Configurações

1. Faça login no MedFlow
2. Vá para **Configurações** no menu lateral
3. Clique em **Integrações** > **WhatsApp**

## Passo 2: Escaneie o QR Code

1. Abra o WhatsApp no seu celular
2. Vá em **Configurações** > **Aparelhos conectados** > **Conectar um aparelho**
3. Escaneie o QR Code exibido na tela

## Passo 3: Confirmação

Após escanear, você verá uma mensagem de confirmação. Seu WhatsApp está conectado!

## Dúvidas Frequentes

**P: Posso usar o mesmo WhatsApp em múltiplas contas?**
R: Não, cada WhatsApp só pode estar conectado a uma conta MedFlow por vez.

**P: O que acontece se eu desconectar?**
R: As mensagens automáticas param de funcionar, mas seus dados permanecem salvos.

**P: Preciso manter o celular ligado?**
R: Sim, o celular precisa estar ligado e com internet para o WhatsApp funcionar.
    `
  },
  "configuracao-inicial": {
    title: "Configuração inicial passo a passo",
    category: "Primeiros Passos",
    content: `
# Configuração inicial passo a passo

Siga este guia para configurar seu MedFlow pela primeira vez.

## 1. Conecte seu WhatsApp

O primeiro passo é conectar seu WhatsApp. Veja o artigo "Como conectar seu WhatsApp" para instruções detalhadas.

## 2. Configure sua clínica

1. Vá em **Configurações** > **Geral**
2. Preencha:
   - Nome da clínica
   - Endereço
   - Telefone
   - Horário de funcionamento

## 3. Adicione profissionais

1. Vá em **Profissionais**
2. Clique em **Adicionar Profissional**
3. Preencha os dados e defina horários de trabalho

## 4. Configure lembretes

1. Vá em **Configurações** > **Lembretes**
2. Ative os lembretes automáticos
3. Configure os horários (recomendado: 1h e 10min antes)

## 5. Teste o sistema

Crie um agendamento de teste para verificar se tudo está funcionando corretamente.

Pronto! Seu MedFlow está configurado e pronto para uso.
    `
  },
};

export default function HelpArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const article = slug ? articles[slug] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
            <p className="text-muted-foreground mb-6">
              O artigo que você está procurando não existe ou foi removido.
            </p>
            <Button onClick={() => navigate('/help')}>
              Voltar para Central de Ajuda
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
              <Button variant="ghost" onClick={() => navigate('/help')}>
                <Home className="mr-2 h-4 w-4" />
                Central de Ajuda
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
            onClick={() => navigate('/help')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card>
            <CardContent className="p-8 md:p-12">
              <Badge className="mb-4">{article.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-6">
                {article.title}
              </h1>
              
              <div 
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: article.content
                    .split('\n')
                    .map(line => {
                      if (line.startsWith('# ')) {
                        return `<h1>${line.substring(2)}</h1>`;
                      }
                      if (line.startsWith('## ')) {
                        return `<h2>${line.substring(3)}</h2>`;
                      }
                      if (line.startsWith('**')) {
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

          {/* Related Articles */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Artigos Relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(articles)
                .filter(([key]) => key !== slug)
                .slice(0, 4)
                .map(([key, art]) => (
                  <Card
                    key={key}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => navigate(`/help/${key}`)}
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">{art.title}</h3>
                      <p className="text-sm text-muted-foreground">{art.category}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
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




