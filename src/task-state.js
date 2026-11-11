export const STORAGE_KEY = 'study-queue:v1';
const PRIORITIES = new Set(['low', 'normal', 'high']);

export function buildTask(input, id = globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}`) {
  const title = String(input.title ?? '').trim();
  const notes = String(input.notes ?? '').trim();
  const priority = String(input.priority ?? 'normal');
  const dueDate = String(input.dueDate ?? '');
  if (!title) throw new Error('Add a title for this task.');
  if (title.length > 120) throw new Error('Keep the title under 120 characters.');
  if (notes.length > 500) throw new Error('Keep notes under 500 characters.');
  if (!PRIORITIES.has(priority)) throw new Error('Choose a valid priority.');
  if (dueDate && !isRealDate(dueDate)) throw new Error('Choose a valid due date.');
  const now = new Date().toISOString();
  return { id, title, notes, priority, dueDate, completed: false, createdAt: now, updatedAt: now };
}

export function updateTask(tasks, id, input) {
  const current = tasks.find(task => task.id === id);
  if (!current) throw new Error('That task no longer exists.');
  const updated = buildTask(input, id);
  return tasks.map(task => task.id === id ? { ...updated, completed: current.completed, createdAt: current.createdAt } : task);
}

export function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() } : task);
}

export function deleteTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}

export function clearCompleted(tasks) {
  return tasks.filter(task => !task.completed);
}

export function visibleTasks(tasks, filter = 'all', query = '') {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return tasks.filter(task => {
    const statusMatches = filter === 'all' || (filter === 'active' && !task.completed) || (filter === 'completed' && task.completed);
    const textMatches = !normalizedQuery || `${task.title} ${task.notes}`.toLocaleLowerCase().includes(normalizedQuery);
    return statusMatches && textMatches;
  }).sort((a, b) => Number(a.completed) - Number(b.completed) || priorityRank(b.priority) - priorityRank(a.priority) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || a.createdAt.localeCompare(b.createdAt));
}

export function parseStoredTasks(raw) {
  const decoded = JSON.parse(raw);
  const rows = Array.isArray(decoded) ? decoded : decoded?.version === 1 && Array.isArray(decoded.tasks) ? decoded.tasks : null;
  if (!rows) throw new Error('This saved queue has an unsupported format.');
  return rows.map((row, index) => {
    const task = buildTask(row, String(row.id ?? `imported-${index}`));
    if (typeof row.completed !== 'boolean') throw new Error('A saved task has an invalid completion state.');
    return { ...task, completed: row.completed, createdAt: isIsoDate(row.createdAt) ? row.createdAt : task.createdAt, updatedAt: isIsoDate(row.updatedAt) ? row.updatedAt : task.updatedAt };
  });
}

export function serializeTasks(tasks) {
  return JSON.stringify({ version: 1, tasks });
}

function priorityRank(priority) { return priority === 'high' ? 2 : priority === 'normal' ? 1 : 0; }
function isIsoDate(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }
function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
