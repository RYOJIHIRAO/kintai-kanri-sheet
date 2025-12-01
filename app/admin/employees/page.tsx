'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { getAllUsers, createUser, updateUser, deleteUser } from '@/lib/storage';
import type { User } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '@/utils/validation';
import { z } from 'zod';

type UserFormData = z.infer<typeof userSchema>;

export default function EmployeesManagementPage() {
  const { user: adminUser, isLoading: authLoading } = useAuth('admin');
  const router = useRouter();

  const [employees, setEmployees] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const allUsers = await getAllUsers();
    const employees = allUsers.filter((u) => u.role === 'user');
    setEmployees(employees);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    reset({
      name: '',
      email: '',
      employee_id: '',
      role: 'user',
      employment_type: 'regular',
      hourly_wage: 1500,
      closing_date: 31,
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: User) => {
    setEditingEmployee(employee);
    reset({
      name: employee.name,
      email: employee.email,
      employee_id: employee.employee_id,
      role: employee.role,
      employment_type: employee.employment_type,
      hourly_wage: employee.hourly_wage,
      closing_date: employee.closing_date,
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (confirm('本当にこの従業員を削除しますか?')) {
      deleteUser(employeeId);
      loadEmployees();
    }
  };

  const onSubmit = (data: UserFormData) => {
    if (editingEmployee) {
      // 更新
      updateUser(editingEmployee.id, data);
    } else {
      // 新規作成
      createUser(data);
    }
    loadEmployees();
    setIsModalOpen(false);
  };

  if (authLoading || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/admin/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">従業員管理</h1>
            </div>
            <Button onClick={handleAddEmployee}>
              <Plus className="h-4 w-4 mr-2" />
              従業員を追加
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>従業員一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>社員番号</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>雇用形態</TableHead>
                  <TableHead className="text-right">時給</TableHead>
                  <TableHead className="text-right">締日</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      従業員データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employee_id}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        {employee.employment_type === 'regular'
                          ? '正社員'
                          : employee.employment_type === 'part_time'
                          ? 'アルバイト'
                          : '業務委託'}
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{employee.hourly_wage.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{employee.closing_date}日</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* 従業員追加・編集モーダル */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? '従業員情報を編集' : '新しい従業員を追加'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">氏名 *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_id">社員番号 *</Label>
                <Input id="employee_id" {...register('employee_id')} />
                {errors.employee_id && (
                  <p className="text-sm text-red-600">{errors.employee_id.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employment_type">雇用形態 *</Label>
                <select
                  id="employment_type"
                  {...register('employment_type')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="regular">正社員</option>
                  <option value="part_time">アルバイト</option>
                  <option value="contract">業務委託</option>
                </select>
                {errors.employment_type && (
                  <p className="text-sm text-red-600">{errors.employment_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_wage">時給 (円) *</Label>
                <Input
                  id="hourly_wage"
                  type="number"
                  {...register('hourly_wage', { valueAsNumber: true })}
                />
                {errors.hourly_wage && (
                  <p className="text-sm text-red-600">{errors.hourly_wage.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="closing_date">締日 *</Label>
                <Input
                  id="closing_date"
                  type="number"
                  min="1"
                  max="31"
                  {...register('closing_date', { valueAsNumber: true })}
                />
                {errors.closing_date && (
                  <p className="text-sm text-red-600">{errors.closing_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  パスワード {editingEmployee ? '(変更する場合のみ)' : '*'}
                </Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit">
                {editingEmployee ? '更新' : '追加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
