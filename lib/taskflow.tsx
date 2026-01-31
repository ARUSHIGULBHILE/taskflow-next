"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";

import { cn } from "./utils";

import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";


import {
  Menu,
  X,
  ClipboardList,
  Plus,
  Search,
  Calendar,
  User,
  Folder,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  UserPlus,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Edit,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type TaskStatus = 'todo' | 'in-progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface UserType {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedUserId: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskWithRelations extends Task {
  assignedUser?: UserType;
  project?: Project;
  subtasks: Subtask[];
  comments: Comment[];
}

interface CreateTaskInput {
  title: string;
  description: string;
  assignedUserId: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
}

interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}

interface TaskFilters {
  search?: string;
  status?: TaskStatus | 'all';
  projectId?: string | 'all';
  assignedUserId?: string;
}

// ============================================
// CONSTANTS
// ============================================
const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; label: string }> = {
  todo: { bg: 'bg-status-todo', text: 'text-status-todo-text', label: 'To Do' },
  'in-progress': { bg: 'bg-status-progress', text: 'text-status-progress-text', label: 'In Progress' },
  done: { bg: 'bg-status-done', text: 'text-status-done-text', label: 'Done' },
};

const PRIORITY_STYLES: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-priority-high', text: 'text-priority-high-text', label: 'High' },
  medium: { bg: 'bg-priority-medium', text: 'text-priority-medium-text', label: 'Medium' },
  low: { bg: 'bg-priority-low', text: 'text-priority-low-text', label: 'Low' },
};

const STORAGE_KEYS = {
  TASKS: 'pms_tasks',
  SUBTASKS: 'pms_subtasks',
  COMMENTS: 'pms_comments',
  USERS: 'pms_users',
  PROJECTS: 'pms_projects',
  CURRENT_USER: 'pms_current_user',
  INITIALIZED: 'pms_initialized',
} as const;

const CURRENT_USER_ID = 'user-1';

const SEED_USERS: UserType[] = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user-3', name: 'Bob Wilson', email: 'bob@example.com' },
  { id: 'user-4', name: 'Alice Brown', email: 'alice@example.com' },
];

const SEED_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'Website Redesign', description: 'Complete overhaul of company website', color: '#1e3a8a' },
  { id: 'proj-2', name: 'Mobile App', description: 'iOS and Android app development', color: '#60a5fa' },
  { id: 'proj-3', name: 'API Integration', description: 'Third-party API integrations', color: '#1e40af' },
  { id: 'proj-4', name: 'Dashboard', description: 'Analytics dashboard project', color: '#3b82f6' },
];

const SEED_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Design homepage mockup',
    description: 'Create initial wireframes and high-fidelity mockups for the new homepage design.',
    assignedUserId: 'user-1',
    projectId: 'proj-1',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-02-15',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-25T14:30:00Z',
  },
  {
    id: 'task-2',
    title: 'Implement user authentication',
    description: 'Set up JWT-based authentication with login, register, and password reset flows.',
    assignedUserId: 'user-2',
    projectId: 'proj-2',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-02-10',
    createdAt: '2026-01-22T09:00:00Z',
    updatedAt: '2026-01-22T09:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Write API documentation',
    description: 'Document all API endpoints with examples and response schemas.',
    assignedUserId: 'user-1',
    projectId: 'proj-3',
    status: 'done',
    priority: 'medium',
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-01-28T16:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Setup CI/CD pipeline',
    description: 'Configure automated testing and deployment workflows.',
    assignedUserId: 'user-3',
    projectId: 'proj-2',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-02-05',
    createdAt: '2026-01-18T08:00:00Z',
    updatedAt: '2026-01-26T10:00:00Z',
  },
  {
    id: 'task-5',
    title: 'Create dashboard widgets',
    description: 'Build reusable chart and metric components for the analytics dashboard.',
    assignedUserId: 'user-4',
    projectId: 'proj-4',
    status: 'todo',
    priority: 'low',
    createdAt: '2026-01-25T14:00:00Z',
    updatedAt: '2026-01-25T14:00:00Z',
  },
];

// ============================================
// VALIDATION
// ============================================
interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function validateTask(input: Partial<CreateTaskInput>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title?.trim()) errors.title = 'Title is required';
  else if (input.title.length > 200) errors.title = 'Title must be less than 200 characters';

  if (!input.assignedUserId) errors.assignedUserId = 'Assigned user is required';
  if (!input.projectId) errors.projectId = 'Project is required';
  if (!input.status) errors.status = 'Status is required';
  if (!input.priority) errors.priority = 'Priority is required';

  if (input.description && input.description.length > 2000) {
    errors.description = 'Description must be less than 2000 characters';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ============================================
// STORAGE HELPERS
// ============================================
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initializeData(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (initialized) return;

  setToStorage(STORAGE_KEYS.USERS, SEED_USERS);
  setToStorage(STORAGE_KEYS.PROJECTS, SEED_PROJECTS);
  setToStorage(STORAGE_KEYS.TASKS, SEED_TASKS);
  setToStorage(STORAGE_KEYS.SUBTASKS, []);
  setToStorage(STORAGE_KEYS.COMMENTS, []);
  setToStorage(STORAGE_KEYS.CURRENT_USER, CURRENT_USER_ID);

  localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
}



// ============================================
// SERVICE FUNCTIONS
// ============================================
async function getTasks(filters?: TaskFilters): Promise<TaskWithRelations[]> {
  const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const users = getFromStorage<UserType[]>(STORAGE_KEYS.USERS, []);
  const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const subtasks = getFromStorage<Subtask[]>(STORAGE_KEYS.SUBTASKS, []);
  const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);

  let filteredTasks = tasks;

  if (filters) {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (t) => t.title.toLowerCase().includes(searchLower) || t.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status && filters.status !== 'all') {
      filteredTasks = filteredTasks.filter((t) => t.status === filters.status);
    }

    if (filters.projectId && filters.projectId !== 'all') {
      filteredTasks = filteredTasks.filter((t) => t.projectId === filters.projectId);
    }

    if (filters.assignedUserId) {
      filteredTasks = filteredTasks.filter((t) => t.assignedUserId === filters.assignedUserId);
    }
  }

  return filteredTasks.map((task) => ({
    ...task,
    assignedUser: users.find((u) => u.id === task.assignedUserId),
    project: projects.find((p) => p.id === task.projectId),
    subtasks: subtasks.filter((s) => s.taskId === task.id),
    comments: comments.filter((c) => c.taskId === task.id),
  }));
}

async function getTaskById(id: string): Promise<TaskWithRelations | null> {
  const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;

  const users = getFromStorage<UserType[]>(STORAGE_KEYS.USERS, []);
  const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const subtasks = getFromStorage<Subtask[]>(STORAGE_KEYS.SUBTASKS, []);
  const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);

  return {
    ...task,
    assignedUser: users.find((u) => u.id === task.assignedUserId),
    project: projects.find((p) => p.id === task.projectId),
    subtasks: subtasks.filter((s) => s.taskId === task.id),
    comments: comments.filter((c) => c.taskId === task.id),
  };
}

async function createTask(input: CreateTaskInput): Promise<Task> {
  const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const now = new Date().toISOString();

  const newTask: Task = {
    id: generateId(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(newTask);
  setToStorage(STORAGE_KEYS.TASKS, tasks);

  return newTask;
}

async function updateTask(input: UpdateTaskInput): Promise<Task> {
  const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const index = tasks.findIndex((t) => t.id === input.id);
  if (index === -1) throw new Error('Task not found');

  const updatedTask: Task = {
    ...tasks[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };

  tasks[index] = updatedTask;
  setToStorage(STORAGE_KEYS.TASKS, tasks);

  return updatedTask;
}

async function deleteTask(id: string): Promise<void> {
  const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const subtasks = getFromStorage<Subtask[]>(STORAGE_KEYS.SUBTASKS, []);
  const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);

  setToStorage(STORAGE_KEYS.TASKS, tasks.filter((t) => t.id !== id));
  setToStorage(STORAGE_KEYS.SUBTASKS, subtasks.filter((s) => s.taskId !== id));
  setToStorage(STORAGE_KEYS.COMMENTS, comments.filter((c) => c.taskId !== id));
}

async function createSubtask(taskId: string, title: string): Promise<Subtask> {
  const subtasks = getFromStorage<Subtask[]>(STORAGE_KEYS.SUBTASKS, []);

  const newSubtask: Subtask = {
    id: generateId(),
    taskId,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  subtasks.push(newSubtask);
  setToStorage(STORAGE_KEYS.SUBTASKS, subtasks);

  return newSubtask;
}

async function toggleSubtask(id: string): Promise<Subtask> {
  const subtasks = getFromStorage<Subtask[]>(STORAGE_KEYS.SUBTASKS, []);
  const index = subtasks.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('Subtask not found');

  subtasks[index].completed = !subtasks[index].completed;
  setToStorage(STORAGE_KEYS.SUBTASKS, subtasks);

  return subtasks[index];
}

async function deleteSubtask(id: string): Promise<void> {
  const subtasks = getFromStorage<Subtask[]>(STORAGE_KEYS.SUBTASKS, []);
  setToStorage(STORAGE_KEYS.SUBTASKS, subtasks.filter((s) => s.id !== id));
}

async function createComment(taskId: string, userId: string, content: string): Promise<Comment> {
  const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);

  const newComment: Comment = {
    id: generateId(),
    taskId,
    userId,
    content,
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);
  setToStorage(STORAGE_KEYS.COMMENTS, comments);

  return newComment;
}

function getUsers(): UserType[] {
  return getFromStorage<UserType[]>(STORAGE_KEYS.USERS, []);
}

function getProjects(): Project[] {
  return getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, []);
}

function getCurrentUser(): UserType | null {
  const currentUserId = getFromStorage<string>(STORAGE_KEYS.CURRENT_USER, CURRENT_USER_ID);
  const users = getFromStorage<UserType[]>(STORAGE_KEYS.USERS, []);
  return users.find((u) => u.id === currentUserId) || null;
}

// ============================================
// HOOKS
// ============================================
function useTasks(initialFilters?: TaskFilters) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters || {});

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const data = await getTasks(filters);
    setTasks(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, filters, setFilters, refetch: fetchTasks };
}

function useTask(taskId: string | undefined) {
  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getTaskById(taskId);
    setTask(data);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return { task, loading, refetch: fetchTask };
}

function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    setProjects(getProjects());
  }, []);
  return { projects };
}

function useUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    setUsers(getUsers());
    setCurrentUser(getCurrentUser());
  }, []);

  return { users, currentUser };
}

// ============================================
// UI COMPONENTS
// ============================================
function StatusBadge({
  children,
  variant = 'default',
  status,
  priority,
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'status' | 'priority';
  status?: TaskStatus;
  priority?: TaskPriority;
  className?: string;
}) {
  const getStyles = () => {
    if (variant === 'status' && status) return cn(STATUS_STYLES[status].bg, STATUS_STYLES[status].text);
    if (variant === 'priority' && priority) return cn(PRIORITY_STYLES[priority].bg, PRIORITY_STYLES[priority].text);
    if (variant === 'outline') return 'border-2 border-primary bg-transparent text-primary';
    return 'bg-secondary text-secondary-foreground';
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold', getStyles(), className)}>
      {children}
    </span>
  );
}

function EmptyState({
  icon = 'tasks',
  title,
  description,
  action,
}: {
  icon?: 'tasks' | 'search' | 'done';
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const icons = { tasks: FileText, search: Search, done: CheckCircle };
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && <p className="text-muted-foreground max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const ok = window.confirm(`${title}\n\n${description}`);
    onOpenChange(false);
    if (ok) onConfirm();
  }, [open, title, description, onConfirm, onOpenChange]);

  return null;
}

// ============================================
// NAVBAR
// ============================================
const navItems = [
  { path: '/', label: 'Home' },
  { path: '/tasks', label: 'Tasks' },
  { path: '/my-tasks', label: 'My Tasks' },
  { path: '/docs', label: 'Docs' },
];

function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-primary bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-bold text-primary">
            
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-neubrutalist-active"
                    : "text-foreground hover:bg-secondary hover:shadow-neubrutalist"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            className="md:hidden p-2 rounded-md border-2 border-primary hover:bg-secondary shadow-neubrutalist-active"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t-2 border-primary animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-md text-sm font-medium",
                    pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}


function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

// ============================================
// TASK COMPONENTS
// ============================================
function TaskCard({ task }: { task: TaskWithRelations }) {
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <Link href={`/tasks/${task.id}`} className="neubrutalist-card block p-4 bg-white hover:bg-card transition-colors">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant="status" status={task.status}>
            {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
          </StatusBadge>

          <StatusBadge variant="priority" priority={task.priority}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </StatusBadge>
        </div>

        <h3 className="font-semibold text-foreground text-lg leading-tight">{task.title}</h3>

        {task.description && <p className="text-muted-foreground text-sm line-clamp-2">{task.description}</p>}

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {task.project && (
            <div className="flex items-center gap-1.5">
              <Folder className="w-4 h-4" />
              <span>{task.project.name}</span>
            </div>
          )}

          {task.assignedUser && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{task.assignedUser.name}</span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function TaskFiltersComponent({
  filters,
  onFiltersChange,
}: {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}) {
  const { projects } = useProjects();

  return (
    <div className="neubrutalist-card bg-white p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10 border-2 border-primary"
          />
        </div>

        <select
          value={filters.status || 'all'}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as TaskFilters['status'] })}
          className="h-10 px-3 rounded-md border-2 border-primary bg-white text-foreground font-medium"
        >
          <option value="all">All Status</option>
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={filters.projectId || 'all'}
          onChange={(e) => onFiltersChange({ ...filters, projectId: e.target.value })}
          className="h-10 px-3 rounded-md border-2 border-primary bg-white text-foreground font-medium"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TaskList({
  tasks,
  loading,
  emptyMessage,
  showCreateButton = true,
}: {
  tasks: TaskWithRelations[];
  loading?: boolean;
  emptyMessage?: string;
  showCreateButton?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="neubrutalist-card bg-white p-4 animate-pulse">
            <div className="h-4 bg-secondary rounded w-20 mb-3" />
            <div className="h-6 bg-secondary rounded w-3/4 mb-2" />
            <div className="h-4 bg-secondary rounded w-full mb-4" />
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="tasks"
        title={emptyMessage || 'No tasks found'}
        description="Get started by creating your first task"
        action={
          showCreateButton ? (
            <Link href="/tasks/new">
              <Button className="neubrutalist-button bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function TaskForm({
  initialData,
  onSubmit,
  submitLabel = 'Create Task',
}: {
  initialData?: Partial<Task>;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  submitLabel?: string;
}) {
  const router = useRouter();
  const { projects } = useProjects();
  const { users } = useUsers();

  const [formData, setFormData] = useState<Partial<CreateTaskInput>>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assignedUserId: initialData?.assignedUserId || '',
    projectId: initialData?.projectId || '',
    status: initialData?.status || 'todo',
    priority: initialData?.priority || 'medium',
    dueDate: initialData?.dueDate || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTask(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData as CreateTaskInput);
      router.push('/tasks');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter task title"
          className="border-2 border-primary"
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter task description"
          rows={4}
          className="border-2 border-primary"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="assignedUserId">
            Assigned To <span className="text-destructive">*</span>
          </Label>
          <select
            id="assignedUserId"
            name="assignedUserId"
            value={formData.assignedUserId}
            onChange={handleChange}
            className="w-full h-10 px-3 rounded-md border-2 border-primary bg-white"
          >
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {errors.assignedUserId && <p className="text-sm text-destructive">{errors.assignedUserId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectId">
            Project <span className="text-destructive">*</span>
          </Label>
          <select
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="w-full h-10 px-3 rounded-md border-2 border-primary bg-white"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.projectId && <p className="text-sm text-destructive">{errors.projectId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">
            Status <span className="text-destructive">*</span>
          </Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full h-10 px-3 rounded-md border-2 border-primary bg-white"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">
            Priority <span className="text-destructive">*</span>
          </Label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full h-10 px-3 rounded-md border-2 border-primary bg-white"
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleChange}
          className="border-2 border-primary"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={submitting} className="neubrutalist-button bg-primary text-primary-foreground">
          {submitting ? 'Saving...' : submitLabel}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="neubrutalist-button bg-secondary text-secondary-foreground"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SubtaskListComponent({
  subtasks,
  taskId,
  onRefetch,
}: {
  subtasks: Subtask[];
  taskId: string;
  onRefetch: () => void;
}) {
  const [newSubtask, setNewSubtask] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAdd = async () => {
    if (!newSubtask.trim()) return;
    await createSubtask(taskId, newSubtask.trim());
    setNewSubtask('');
    onRefetch();
  };

  return (
    <div className="neubrutalist-card bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Subtasks</h3>
          {subtasks.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
              placeholder="Add a subtask..."
              className="border-2 border-primary"
            />
            <Button
              onClick={handleAdd}
              disabled={!newSubtask.trim()}
              className="neubrutalist-button bg-primary text-primary-foreground px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {subtasks.length > 0 && (
            <ul className="space-y-2">
              {subtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 group">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={async () => {
                      await toggleSubtask(subtask.id);
                      onRefetch();
                    }}
                    className="border-2 border-primary"
                  />

                  <span className={cn('flex-1 text-sm', subtask.completed && 'line-through text-muted-foreground')}>
                    {subtask.title}
                  </span>

                  <button
                    onClick={async () => {
                      await deleteSubtask(subtask.id);
                      onRefetch();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {subtasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No subtasks yet</p>}
        </div>
      )}
    </div>
  );
}

function CommentListComponent({
  comments,
  taskId,
  onRefetch,
}: {
  comments: Comment[];
  taskId: string;
  onRefetch: () => void;
}) {
  const { users } = useUsers();
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    await createComment(taskId, CURRENT_USER_ID, newComment.trim());
    setNewComment('');
    onRefetch();
  };

  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name || 'Unknown';

  return (
    <div className="neubrutalist-card bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Comments</h3>
          {comments.length > 0 && <span className="text-sm text-muted-foreground">({comments.length})</span>}
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="border-2 border-primary"
            />
            <Button
              onClick={handleAdd}
              disabled={!newComment.trim()}
              className="neubrutalist-button bg-primary text-primary-foreground"
            >
              <Send className="w-4 h-4 mr-2" />
              Post Comment
            </Button>
          </div>

          {comments.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border">
              {comments
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground">{getUserName(comment.userId)}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>}
        </div>
      )}
    </div>
  );
}

// ============================================
// DOCS COMPONENTS
// ============================================
const lifecycleSteps = [
  { id: 1, title: 'Create', description: 'Task is created with title, description, and initial details', icon: FileText },
  { id: 2, title: 'Assign', description: 'Task is assigned to a team member with priority and due date', icon: UserPlus },
  { id: 3, title: 'Update', description: 'Task status and details are updated as work progresses', icon: RefreshCw },
  { id: 4, title: 'Complete', description: 'Task is marked as done when all requirements are met', icon: CheckCircle },
];

function LifecycleStepper() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((prev) => (prev + 1) % lifecycleSteps.length), 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="neubrutalist-card bg-white p-6">
      <h2 className="text-xl font-bold text-foreground mb-6">Task Lifecycle</h2>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-secondary hidden sm:block" />
        <div className="space-y-4">
          {lifecycleSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;

            return (
              <div key={step.id} className={cn('lifecycle-step relative z-10', isActive && 'active')}>
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300',
                    isActive ? 'bg-primary-foreground/20' : 'bg-secondary'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 transition-all duration-300',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className={cn('font-semibold transition-all duration-300', isActive ? 'text-primary-foreground' : 'text-foreground')}>
                    {step.title}
                  </h3>
                  <p className={cn('text-sm transition-all duration-300', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const screenMappings = [
  { screen: 'Home', route: '/', purpose: 'Landing page with navigation links' },
  { screen: 'Tasks', route: '/tasks', purpose: 'All tasks across projects with search, status filter, project filter' },
  { screen: 'Create Task', route: '/tasks/new', purpose: 'Form to create a new task' },
  { screen: 'Task Detail', route: '/tasks/[taskId]', purpose: 'View, edit, delete task + subtasks + comments' },
  { screen: 'My Tasks', route: '/my-tasks', purpose: 'Tasks assigned to current user' },
  { screen: 'Docs', route: '/docs', purpose: 'Lifecycle + screen docs' },
];

function ScreenMappingTable() {
  return (
    <div className="neubrutalist-card bg-white overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">Screen Mapping</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary">
              <th className="px-4 py-3 text-left text-sm font-semibold">Screen</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Route</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Purpose</th>
            </tr>
          </thead>

          <tbody>
            {screenMappings.map((m, i) => (
              <tr key={m.route} className={i % 2 === 0 ? 'bg-white' : 'bg-secondary/30'}>
                <td className="px-4 py-3 text-sm font-medium">{m.screen}</td>
                <td className="px-4 py-3 text-sm font-mono text-accent">{m.route}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// PAGES
// ============================================
export function HomePage() {
  const features = [
    {
      icon: ClipboardList,
      title: 'Task Management',
      description: 'Create, edit, and organize tasks with priorities and due dates',
      link: '/tasks',
      linkLabel: 'View All Tasks',
    },
    {
      icon: User,
      title: 'My Tasks',
      description: 'Focus on tasks assigned to you across all projects',
      link: '/my-tasks',
      linkLabel: 'View My Tasks',
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'System overview, task lifecycle, and feature scope',
      link: '/docs',
      linkLabel: 'View Docs',
    },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-12 md:py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6 shadow-neubrutalist-lg">
            <ClipboardList className="w-10 h-10 text-primary-foreground" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Task Management</h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Task management , subtasks, comments, and filtering.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/tasks">
              <Button className="neubrutalist-button bg-primary text-primary-foreground text-lg px-8 py-6">
                Browse Tasks
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <Link href="/tasks/new">
              <Button className="neubrutalist-button bg-secondary text-secondary-foreground text-lg px-8 py-6">
                Create Task
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 pb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="neubrutalist-card bg-white p-6">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <Link href={feature.link} className="inline-flex items-center text-sm font-medium text-accent hover:underline">
                  {feature.linkLabel}
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

export function TasksPage() {
  const { tasks, loading, filters, setFilters } = useTasks();

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">All Tasks</h1>
            <p className="text-muted-foreground">Manage and track tasks across projects</p>
          </div>

          <Link href="/tasks/new">
            <Button className="neubrutalist-button bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>

        <TaskFiltersComponent filters={filters} onFiltersChange={setFilters} />

        <TaskList
          tasks={tasks}
          loading={loading}
          emptyMessage={
            filters.search || filters.status !== 'all' || filters.projectId !== 'all'
              ? 'No tasks match your filters'
              : 'No tasks yet'
          }
        />
      </div>
    </AppShell>
  );
}

export function CreateTaskPage() {
  const handleSubmit = async (data: CreateTaskInput) => {
    await createTask(data);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <Link href="/tasks" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Tasks
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Create New Task</h1>
          <p className="text-muted-foreground">Fill in the details below</p>
        </div>

        <div className="neubrutalist-card bg-white p-6">
          <TaskForm onSubmit={handleSubmit} submitLabel="Create Task" />
        </div>
      </div>
    </AppShell>
  );
}

export function TaskDetailPage({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { task, loading, refetch } = useTask(taskId);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    await deleteTask(taskId);
    router.push('/tasks');
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto">
          <div className="neubrutalist-card bg-white p-6 animate-pulse">
            <div className="h-8 bg-secondary rounded w-1/3 mb-4" />
            <div className="h-4 bg-secondary rounded w-full mb-2" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Task not found</h2>
          <Link href="/tasks">
            <Button className="neubrutalist-button bg-primary text-primary-foreground">Back to Tasks</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  if (isEditing) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Cancel Editing
          </button>

          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Edit Task</h1>
          </div>

          <div className="neubrutalist-card bg-white p-6">
            <TaskForm
              initialData={task}
              onSubmit={async (data) => {
                await updateTask({ id: task.id, ...data });
                setIsEditing(false);
                refetch();
              }}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <Link href="/tasks" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Tasks
        </Link>

        <div className="neubrutalist-card bg-white p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="status" status={task.status}>
                {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
              </StatusBadge>

              <StatusBadge variant="priority" priority={task.priority}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </StatusBadge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="neubrutalist-button bg-secondary text-secondary-foreground"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="neubrutalist-button bg-destructive text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-4">{task.title}</h1>

          {task.description && <p className="text-foreground mb-6 whitespace-pre-wrap">{task.description}</p>}

          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {task.project && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Folder className="w-4 h-4" />
                <span>Project:</span>
                <span className="text-foreground font-medium">{task.project.name}</span>
              </div>
            )}

            {task.assignedUser && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Assigned to:</span>
                <span className="text-foreground font-medium">{task.assignedUser.name}</span>
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Due:</span>
                <span className="text-foreground font-medium">{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Created:</span>
              <span className="text-foreground font-medium">{format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <SubtaskListComponent subtasks={task.subtasks} taskId={task.id} onRefetch={refetch} />
        </div>

        <CommentListComponent comments={task.comments} taskId={task.id} onRefetch={refetch} />

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Task"
          description="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={handleDelete}
        />
      </div>
    </AppShell>
  );
}

export function MyTasksPage() {
  const { currentUser } = useUsers();
  const { tasks, loading, filters, setFilters } = useTasks({
    assignedUserId: currentUser?.id || CURRENT_USER_ID,
  });

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Tasks</h1>
          <p className="text-muted-foreground">Tasks assigned to {currentUser?.name || 'you'}</p>
        </div>

        <TaskFiltersComponent filters={filters} onFiltersChange={setFilters} />

        <TaskList
          tasks={tasks}
          loading={loading}
          emptyMessage={
            filters.search || filters.status !== 'all' || filters.projectId !== 'all'
              ? 'No tasks match your filters'
              : 'No tasks assigned to you yet'
          }
          showCreateButton={false}
        />
      </div>
    </AppShell>
  );
}

export function DocsPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Documentation</h1>
          <p className="text-muted-foreground">System overview, lifecycle, and scope</p>
        </div>

        <div className="space-y-8">
          <LifecycleStepper />
          <ScreenMappingTable />
        </div>
      </div>
    </AppShell>
  );
}
