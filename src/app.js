import { buildTask, clearCompleted, deleteTask, parseStoredTasks, serializeTasks, toggleTask, updateTask, visibleTasks, STORAGE_KEY } from './task-state.js';

const $ = selector => document.querySelector(selector);
const list = $('#task-list');
const empty = $('#empty-state');
const dialog = $('#task-dialog');
const form = $('#task-form');
const titleInput = $('#task-title');
const notesInput = $('#task-notes');
const priorityInput = $('#task-priority');
const dueInput = $('#task-due');
const errorMessage = $('#form-error');
const announcer = $('#announcer');
let tasks = loadTasks();
let filter = 'all';
let editingId = null;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseStoredTasks(raw) : [];
  } catch (error) {
    announce(`Saved tasks could not be loaded: ${error.message}`);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, serializeTasks(tasks));
    return true;
  } catch {
    announce('Could not save to this browser. Check available storage and try again.');
    return false;
  }
}

function announce(message) { announcer.textContent = message; }

function render() {
  list.replaceChildren();
  const shown = visibleTasks(tasks, filter, $('#search').value);
  for (const task of shown) list.append(makeTaskRow(task));
  const activeCount = tasks.filter(task => !task.completed).length;
  const completedCount = tasks.length - activeCount;
  const percent = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0;
  $('#active-count').textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'}`;
  $('#footer-count').textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} · ${completedCount} done`;
  $('#progress-percent').textContent = `${percent}%`;
  $('#progress-fill').style.width = `${percent}%`;
  $('#progress-track').setAttribute('aria-valuenow', String(percent));
  $('#progress-label').textContent = tasks.length ? `${completedCount} of ${tasks.length} complete` : 'Start with one small task.';
  $('#clear-completed').disabled = completedCount === 0;
  empty.hidden = shown.length > 0;
  if (shown.length === 0 && tasks.length > 0) {
    $('#empty-title').textContent = 'No tasks match this view.';
    $('#empty-copy').textContent = 'Try a different filter or search.';
  } else {
    $('#empty-title').textContent = 'Your queue is clear.';
    $('#empty-copy').textContent = 'Add one thing you want to make progress on.';
  }
}

function makeTaskRow(task) {
  const row = document.createElement('article');
  row.className = `task-row${task.completed ? ' is-complete' : ''}`;
  row.dataset.taskId = task.id;
  const checkbox = document.createElement('input');
  checkbox.className = 'task-check';
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', `${task.completed ? 'Mark as not done' : 'Mark as done'}: ${task.title}`);
  checkbox.dataset.action = 'toggle';
  const copy = document.createElement('div');
  copy.className = 'task-copy';
  const title = document.createElement('strong');
  title.className = 'task-title';
  title.textContent = task.title;
  copy.append(title);
  if (task.notes) {
    const notes = document.createElement('span');
    notes.className = 'task-notes';
    notes.textContent = task.notes;
    copy.append(notes);
  }
  const meta = document.createElement('div');
  meta.className = 'task-meta';
  const priority = document.createElement('span');
  priority.className = `priority priority-${task.priority}`;
  priority.textContent = `${task.priority} priority`;
  meta.append(priority);
  if (task.dueDate) {
    const due = document.createElement('span');
    due.className = 'due-date';
    due.textContent = `Due ${formatDate(task.dueDate)}`;
    meta.append(due);
  }
  copy.append(meta);
  const actions = document.createElement('div');
  actions.className = 'task-actions';
  actions.append(actionButton('Edit', 'edit', task.title), actionButton('Delete', 'delete', task.title));
  row.append(checkbox, copy, actions);
  return row;
}

function actionButton(label, action, taskTitle) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `icon-button task-action action-${action}`;
  button.dataset.action = action;
  button.setAttribute('aria-label', `${label} ${taskTitle}`);
  button.textContent = action === 'edit' ? '✎' : '×';
  return button;
}

function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
}

function openForm(task = null) {
  editingId = task?.id ?? null;
  $('#dialog-title').textContent = task ? 'Edit task' : 'Add a task';
  $('#save-task').textContent = task ? 'Save changes' : 'Save task';
  titleInput.value = task?.title ?? '';
  notesInput.value = task?.notes ?? '';
  priorityInput.value = task?.priority ?? 'normal';
  dueInput.value = task?.dueDate ?? '';
  errorMessage.textContent = '';
  dialog.showModal();
  titleInput.focus();
}

function closeForm() {
  dialog.close();
  $('#add-task').focus();
}

$('#add-task').addEventListener('click', () => openForm());
$('#close-dialog').addEventListener('click', closeForm);
$('#cancel-dialog').addEventListener('click', closeForm);
dialog.addEventListener('click', event => { if (event.target === dialog) closeForm(); });

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const input = { title: titleInput.value, notes: notesInput.value, priority: priorityInput.value, dueDate: dueInput.value };
    tasks = editingId ? updateTask(tasks, editingId, input) : [...tasks, buildTask(input)];
    saveTasks();
    render();
    announce(editingId ? 'Task updated.' : 'Task added.');
    closeForm();
  } catch (error) { errorMessage.textContent = error.message; }
});

list.addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const row = control.closest('[data-task-id]');
  const task = tasks.find(item => item.id === row?.dataset.taskId);
  if (!task) return;
  if (control.dataset.action === 'edit') openForm(task);
  else if (control.dataset.action === 'delete') {
    if (window.confirm(`Delete “${task.title}”?`)) { tasks = deleteTask(tasks, task.id); saveTasks(); render(); announce('Task deleted.'); }
  } else if (control.dataset.action === 'toggle') {
    tasks = toggleTask(tasks, task.id); saveTasks(); render(); announce(task.completed ? 'Task moved back to to do.' : 'Task marked done.');
  }
});

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  render();
}));

$('#search').addEventListener('input', render);
$('#clear-completed').addEventListener('click', () => {
  const count = tasks.length - tasks.filter(task => !task.completed).length;
  tasks = clearCompleted(tasks); saveTasks(); render(); announce(`${count} completed ${count === 1 ? 'task' : 'tasks'} cleared.`);
});

render();
