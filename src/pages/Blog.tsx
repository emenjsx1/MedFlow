import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const categories = [
  "Todos",
  "Gestão de Clínicas",
  "Automação",
  "Marketing para Saúde",
  "Dicas e Melhores Práticas",
  "Novidades e Atualizações"
];

// Mock data - em produção, viria do Supabase
const blogPosts = [
  {
    id: "1",
    title: "Como reduzir faltas em até 70% com automação",
    excerpt: "Descubra como clínicas estão usando automação para reduzir drasticamente o número de pacientes que não aparecem nas consultas.",
    author: "Equipe MedFlow",
    date: new Date("2024-01-15"),
    category: "Automação",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800",
    slug: "reduzir-faltas-automacao"
  },
  {
    id: "2",
    title: "10 dicas para melhorar a gestão da sua clínica",
    excerpt: "Aprenda estratégias práticas para otimizar a administração do seu consultório e aumentar a satisfação dos pacientes.",
    author: "Dr. João Silva",
    date: new Date("2024-01-10"),
    category: "Gestão de Clínicas",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800",
    slug: "10-dicas-gestao-clinica"
  },
  {
    id: "3",
    title: "Marketing digital para profissionais de saúde",
    excerpt: "Como usar estratégias de marketing digital para atrair mais pacientes e construir uma marca forte no setor de saúde.",
    author: "Maria Santos",
    date: new Date("2024-01-05"),
    category: "Marketing para Saúde",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    slug: "marketing-digital-saude"
  },
];

export default function Blog() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "Todos" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/lp')}>
                Início
              </Button>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blog MedFlow
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Dicas, estratégias e novidades para transformar a gestão da sua clínica
            </p>
            
            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar artigos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(post.date, "dd MMM yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" className="mt-4 w-full" size="sm">
                    Ler mais <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum artigo encontrado.</p>
            </div>
          )}
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




