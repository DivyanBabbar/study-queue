import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTask, clearCompleted, deleteTask, parseStoredTasks, serializeTasks, toggleTask, updateTask, visibleTasks } from '../src/task-state.js';

const sample = (id, title, extra = {}) => ({ id, title, notes: '', priority: 'normal', dueDate: '', completed: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...extra });

test('task creation trims text and applies defaults', () => {
  const task = buildTask({ title: '  Review graphs  ' }, 'a');
  assert.equal(task.id, 'a');
  assert.equal(task.title, 'Review graphs');
  assert.equal(task.priority, 'normal');
  assert.equal(task.completed, false);
});

test('task creation validates title, limits, priority, and real dates', () => {
  assert.throws(() => buildTask({ title: '   ' }), /title/);
  assert.throws(() => buildTask({ title: 'x'.repeat(121) }), /120/);
  assert.throws(() => buildTask({ title: 'Read', priority: 'urgent' }), /priority/);
  assert.throws(() => buildTask({ title: 'Read', dueDate: '2025-02-29' }), /date/);
  assert.doesNotThrow(() => buildTask({ title: 'Read', dueDate: '2024-02-29' }));
});

test('update preserves completion and original creation time', () => {
  const original = sample('a', 'Review arrays', { completed: true });
  const updated = updateTask([original], 'a', { title: 'Review graphs' })[0];
  assert.equal(updated.title, 'Review graphs');
  assert.equal(updated.completed, true);
  assert.equal(updated.createdAt, original.createdAt);
});

test('filters and searches without changing the source array', () => {
  const tasks = [sample('a', 'Graph traversal'), sample('b', 'Read API notes', { completed: true })];
  assert.deepEqual(visibleTasks(tasks, 'active', 'graph').map(task => task.id), ['a']);
  assert.deepEqual(visibleTasks(tasks, 'completed').map(task => task.id), ['b']);
  assert.equal(tasks.length, 2);
});

test('toggle, deletion, and clear-completed return expected tasks', () => {
  const tasks = [sample('a', 'One'), sample('b', 'Two')];
  const toggled = toggleTask(tasks, 'a');
  assert.equal(toggled[0].completed, true);
  assert.equal(tasks[0].completed, false);
  assert.deepEqual(clearCompleted(toggled).map(task => task.id), ['b']);
  assert.deepEqual(deleteTask(tasks, 'a').map(task => task.id), ['b']);
});

test('stored data uses a versioned envelope and survives a round trip', () => {
  const tasks = [sample('a', 'Review CSS', { priority: 'high', dueDate: '2026-12-01' })];
  const raw = serializeTasks(tasks);
  assert.deepEqual(parseStoredTasks(raw).map(task => ({ ...task, updatedAt: tasks[0].updatedAt })), tasks);
  assert.throws(() => parseStoredTasks('{"version":9,"tasks":[]}'), /unsupported/);
});
