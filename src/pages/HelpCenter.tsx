import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, MessageSquare, Calendar, Bot, BarChart3, Settings, HelpCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

const categories = [
  {
    id: "getting-started",
    name: "Primeiros Passos",
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    articles: [
      { id: "1", title: "Como criar sua conta", slug: "como-criar-conta" },
      { id: "2", title: "Configuração inicial", slug: "configuracao-inicial" },
      { id: "3", title: "Tour pelo dashboard", slug: "tour-dashboard" },
    ]
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageSquare,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
    articles: [
      { id: "4", title: "Conectar WhatsApp", slug: "conectar-whatsapp" },
      { id: "5", title: "Configurar mensagens automáticas", slug: "configurar-mensagens" },
      { id: "6", title: "Troubleshooting WhatsApp", slug: "troubleshooting-whatsapp" },
    ]
  },
  {
    id: "appointments",
    name: "Agendamentos",
    icon: Calendar,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    articles: [
      { id: "7", title: "Criar agendamento", slug: "criar-agendamento" },
      { id: "8", title: "Gerenciar agenda", slug: "gerenciar-agenda" },
      { id: "9", title: "Fila de espera", slug: "fila-espera" },
    ]
  },
  {
    id: "ai",
    name: "IA e Automação",
    icon: Bot,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    articles: [
      { id: "10", title: "Como funciona a IA", slug: "como-funciona-ia" },
      { id: "11", title: "Takeover humano", slug: "takeover-humano" },
      { id: "12", title: "Personalizar respostas da IA", slug: "personalizar-ia" },
    ]
  },
  {
    id: "reports",
    name: "Relatórios",
    icon: BarChart3,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950",
    articles: [
      { id: "13", title: "Entender relatórios", slug: "entender-relatorios" },
      { id: "14", title: "Exportar dados", slug: "exportar-dados" },
      { id: "15", title: "Métricas importantes", slug: "metricas-importantes" },
    ]
  },
  {
    id: "integrations",
    name: "Integrações",
    icon: Settings,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
    articles: [
      { id: "16", title: "Google Calendar", slug: "google-calendar" },
      { id: "17", title: "Outras integrações", slug: "outras-integracoes" },
    ]
  },
];

const popularArticles = [
  { id: "1", title: "Como conectar seu WhatsApp", category: "WhatsApp", slug: "conectar-whatsapp" },
  { id: "2", title: "Configuração inicial passo a passo", category: "Primeiros Passos", slug: "configuracao-inicial" },
  { id: "3", title: "Reduzir faltas com lembretes", category: "Agendamentos", slug: "reduzir-faltas" },
  { id: "4", title: "Como funciona a IA de atendimento", category: "IA e Automação", slug: "como-funciona-ia" },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleArticleClick = (slug: string) => {
    navigate(`/help/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Entrar
              </Button>
              <Button onClick={() => navigate('/register')}>
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Como podemos ajudar?
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Encontre respostas rápidas para suas dúvidas ou entre em contato com nosso suporte
            </p>
            
            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar artigos de ajuda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Artigos Populares</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularArticles.map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleArticleClick(article.slug)}
              >
                <CardHeader>
                  <CardTitle className="text-base">{article.title}</CardTitle>
                  <CardDescription>{article.category}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Navegar por Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>
                      {category.articles.length} artigos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.articles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => handleArticleClick(article.slug)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left group"
                        >
                          <span className="text-sm">{article.title}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-12 text-center">
              <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Não encontrou o que procurava?</h2>
              <p className="text-muted-foreground mb-6">
                Nossa equipe está pronta para ajudar você
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/contact')} size="lg">
                  Entrar em Contato
                </Button>
                <Button variant="outline" onClick={() => navigate('/register')} size="lg">
                  Começar Teste Grátis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MedFlow. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}




