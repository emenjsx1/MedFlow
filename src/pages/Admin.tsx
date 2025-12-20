import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CreditCard, TrendingUp, Building2, Check } from "lucide-react";

const plans = [
  {
    id: "monthly",
    name: "Mensal",
    price: 47,
    interval: "mês",
    features: ["Agendamentos ilimitados", "WhatsApp integrado", "Lembretes automáticos", "Suporte por email"]
  },
  {
    id: "quarterly",
    name: "Trimestral",
    price: 127,
    interval: "trimestre",
    savings: "10% de desconto",
    features: ["Tudo do plano mensal", "Relatórios avançados", "Suporte prioritário"]
  },
  {
    id: "annual",
    name: "Anual",
    price: 470,
    interval: "ano",
    savings: "17% de desconto",
    features: ["Tudo do plano trimestral", "Onboarding personalizado", "Suporte 24/7"]
  }
];

// Mock data for demonstration
const mockTenants = [
  { id: "1", name: "Clínica Saúde Total", plan: "monthly", status: "active", createdAt: "2024-01-15", users: 3 },
  { id: "2", name: "Consultório Dr. Silva", plan: "annual", status: "active", createdAt: "2024-02-20", users: 1 },
  { id: "3", name: "Centro Médico ABC", plan: "quarterly", status: "active", createdAt: "2024-03-10", users: 5 },
  { id: "4", name: "Clínica Bem Estar", plan: "monthly", status: "cancelled", createdAt: "2024-01-05", users: 2 },
];

const getPlanBadge = (planId: string) => {
  switch (planId) {
    case "annual":
      return <Badge className="bg-amber-500">Anual</Badge>;
    case "quarterly":
      return <Badge className="bg-blue-500">Trimestral</Badge>;
    default:
      return <Badge variant="secondary">Mensal</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  return status === "active" 
    ? <Badge className="bg-green-500">Ativo</Badge>
    : <Badge variant="destructive">Cancelado</Badge>;
};

export default function Admin() {
  const totalRevenue = mockTenants
    .filter(t => t.status === "active")
    .reduce((acc, t) => {
      const plan = plans.find(p => p.id === t.plan);
      return acc + (plan?.price || 0);
    }, 0);

  const activeAccounts = mockTenants.filter(t => t.status === "active").length;
  const totalUsers = mockTenants.reduce((acc, t) => acc + t.users, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-muted-foreground">Gestão de contas e planos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">De {activeAccounts} contas ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAccounts}</div>
              <p className="text-xs text-muted-foreground">De {mockTenants.length} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Em todas as contas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Mensal, Trimestral, Anual</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accounts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="accounts">Contas</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Contas</CardTitle>
                <CardDescription>Lista de todas as clínicas cadastradas no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Clínica</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                        <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                        <TableCell>{tenant.users}</TableCell>
                        <TableCell>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Ver detalhes</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={plan.id === "annual" ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.savings && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {plan.savings}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">R$ {plan.price}</span>
                      <span className="text-muted-foreground">/{plan.interval}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Planos</CardTitle>
                <CardDescription>Quantidade de contas por tipo de plano</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan) => {
                    const count = mockTenants.filter(t => t.plan === plan.id && t.status === "active").length;
                    const percentage = (count / activeAccounts) * 100 || 0;
                    return (
                      <div key={plan.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{plan.name}</span>
                          <span className="text-sm text-muted-foreground">{count} contas ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div 
                            className="h-2 rounded-full bg-primary" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
