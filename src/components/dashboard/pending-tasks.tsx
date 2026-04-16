'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';

export interface PendingTask {
  id: string;
  text: string;
  done: boolean;
}

interface Student {
    tasks?: PendingTask[];
}


export function PendingTasks() {
  const { t } = useTranslation();
  const { user } = useUser();
  const firestore = useFirestore();
  const [newTaskText, setNewTaskText] = useState('');

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );

  const { data: studentProfile } = useDoc<Student>(studentDocRef);

  const tasks = useMemo(() => studentProfile?.tasks || [], [studentProfile]);

  const handleAddTask = () => {
    if (newTaskText.trim() === '' || !studentDocRef) return;
    const newTask: PendingTask = {
      id: `user-task-${Date.now()}`,
      text: newTaskText.trim(),
      done: false,
    };
    const updatedTasks = [...tasks, newTask];
    updateDocumentNonBlocking(studentDocRef, { tasks: updatedTasks });
    setNewTaskText('');
  };

  const handleDeleteTask = (taskId: string) => {
    if (!studentDocRef) return;
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    updateDocumentNonBlocking(studentDocRef, { tasks: updatedTasks });
  };

  const handleToggleTask = (taskId: string) => {
    if (!studentDocRef) return;
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task
    );
    updateDocumentNonBlocking(studentDocRef, { tasks: updatedTasks });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  if (!user) {
    return (
        <Card className="lg:col-span-2 shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t('dashboard.pendingTasks')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {t('dashboard.loginToSeeTasks')}
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 shadow-soft rounded-lg border-2 border-brand-purple">
      <CardHeader>
        <CardTitle>{t('dashboard.pendingTasks')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            placeholder={t('dashboard.addNewTask')}
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-muted border-0 focus-visible:ring-primary"
          />
          <Button onClick={handleAddTask} size="icon">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 group">
              <Checkbox
                id={task.id}
                checked={task.done}
                onCheckedChange={() => handleToggleTask(task.id)}
              />
              <label
                htmlFor={task.id}
                className={`flex-1 text-sm cursor-pointer ${
                  task.done ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {task.text}
              </label>
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTask(task.id)}
                  className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
              >
                  <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

    