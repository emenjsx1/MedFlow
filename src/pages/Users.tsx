import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MoreHorizontal, Mail, Key, Trash2, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'active' | 'pending';
  createdAt: string;
}

const mockUsers: TeamMember[] = [
  {
    id: '1',
    name: 'Dr. Carlos Oliveira',
    email: 'admin@clinica.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'staff@clinica.com',
    role: 'staff',
    status: 'active',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'João Silva',
    email: 'joao@clinica.com',
    role: 'staff',
    status: 'pending',
    createdAt: '2024-12-18',
  },
];

export default function Users() {
  const [users, setUsers] = useState<TeamMember[]>(mockUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('staff');

  const handleAddUser = () => {
    if (!newUserName || !newUserEmail) {
      toast.error('Preencha todos os campos');
      return;
    }

    const newUser: TeamMember = {
      id: String(Date.now()),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers([...users, newUser]);
    setIsDialogOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('staff');
    toast.success('Convite enviado para ' + newUserEmail);
  };

  const handleResendInvite = (email: string) => {
    toast.success('Convite reenviado para ' + email);
  };

  const handleResetPassword = (email: string) => {
    toast.success('Email de redefinição enviado para ' + email);
  };

  const handleRemoveUser = (id: string, name: string) => {
    setUsers(users.filter((u) => u.id !== id));
    toast.success(name + ' foi removido da equipe');
  };

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie a equipe da sua clínica
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar novo usuário</DialogTitle>
                <DialogDescription>
                  Envie um convite para um novo membro da equipe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Nome do usuário"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@clinica.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as 'admin' | 'staff')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Operador (Staff)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>Administrador</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {newUserRole === 'admin'
                      ? 'Administradores podem gerenciar integrações, regras e usuários.'
                      : 'Operadores podem gerenciar consultas e usar as ações rápidas.'}
                  </p>
                </div>
                <Button onClick={handleAddUser} className="w-full">
                  Enviar convite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total de usuários</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === 'admin').length}
                </p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Convites pendentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users table */}
        <Card>
          <CardHeader>
            <CardTitle>Equipe</CardTitle>
            <CardDescription>
              Todos os usuários com acesso ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Usuário</TableHead>
                  <TableHead className="font-semibold">Função</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Desde</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          user.role === 'admin'
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Administrador
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Operador
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          user.status === 'active'
                            ? 'border-success/50 bg-success/10 text-success'
                            : 'border-warning/50 bg-warning/10 text-warning'
                        )}
                      >
                        {user.status === 'active' ? 'Ativo' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{user.createdAt}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {user.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleResendInvite(user.email)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Reenviar convite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>
                            <Key className="w-4 h-4 mr-2" />
                            Redefinir senha
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveUser(user.id, user.name)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
