
const card = document.querySelector('[data-testid="test-todo-card"]');
const titleEl = document.querySelector('[data-testid="test-todo-title"]');
const descriptionEl = document.querySelector('[data-testid="test-todo-description"]');
const dueDateEl = document.querySelector('[data-testid="test-todo-due-date"]');
const timeEl = document.querySelector('[data-testid="test-todo-time-remaining"]');
const checkbox = document.querySelector('[data-testid="test-todo-complete-toggle"]');
const statusText = document.querySelector('[data-testid="test-todo-status"]');
const statusControl = document.querySelector('[data-testid="test-todo-status-control"]');
const expandToggle = document.querySelector('[data-testid="test-todo-expand-toggle"]');
const collapsibleSection = document.querySelector('[data-testid="test-todo-collapsible-section"]');
const overdueIndicator = document.querySelector('[data-testid="test-todo-overdue-indicator"]');
const editButton = document.querySelector('[data-testid="test-todo-edit-button"]');
const deleteButton = document.querySelector('[data-testid="test-todo-delete-button"]');
const editForm = document.querySelector('[data-testid="test-todo-edit-form"]');
const saveButton = document.querySelector('[data-testid="test-todo-save-button"]');
const cancelButton = document.querySelector('[data-testid="test-todo-cancel-button"]');
const titleInput = document.querySelector('[data-testid="test-todo-edit-title-input"]');
const descriptionInput = document.querySelector('[data-testid="test-todo-edit-description-input"]');
const prioritySelect = document.querySelector('[data-testid="test-todo-edit-priority-select"]');
const dueDateInput = document.querySelector('[data-testid="test-todo-edit-due-date-input"]');
const priorityBadge = document.querySelector('[data-testid="test-todo-priority"]');
const priorityIndicator = document.querySelector('[data-testid="test-todo-priority-indicator"]');

const STORAGE_KEY = 'todoCardState';
const isEditPage = window.location.pathname.endsWith('edit.html');

const state = {
  title: 'Develop your Portfolio 😊',
  description: 'Create a clean and user friendly Portfolio for your Front-end Development.',
  priority: 'High',
  dueDate: '2026-04-17T18:00:00Z',
  status: 'Pending',
};

let draftState = null;
let updateInterval = null;
let trappedFocusElements = [];
let isDescriptionCollapsed = false;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  } catch (error) {
    console.warn('Unable to load saved state:', error);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save state:', error);
  }
}

function toLocalDateTimeValue(isoString) {
  const date = new Date(isoString);
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - tzOffset);
  return localDate.toISOString().slice(0, 16);
}

function formatDueDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function setPriorityVisuals(priority) {
  ['High', 'Medium', 'Low'].forEach((level) => {
    const className = level.toLowerCase();
    if (priorityBadge) {
      priorityBadge.classList.toggle(className, priority === level);
    }
    if (priorityIndicator) {
      priorityIndicator.classList.toggle(className, priority === level);
    }
    if (card) {
      card.classList.toggle(className, priority === level);
    }
  });
  if (priorityBadge) {
    priorityBadge.textContent = priority;
  }
}

function setStatusVisuals(status) {
  ['Pending', 'In Progress', 'Done'].forEach((value) => {
    if (card) {
      card.classList.toggle(value.toLowerCase().replace(/ /g, '-'), status === value);
    }
  });
  if (statusText) {
    statusText.textContent = status;
  }
  if (statusControl) {
    statusControl.value = status;
  }
  if (checkbox) {
    checkbox.checked = status === 'Done';
  }
}

function setDescriptionCollapsed(collapsed) {
  if (!collapsibleSection || !expandToggle) {
    return;
  }
  collapsibleSection.classList.toggle('collapsed', collapsed);
  expandToggle.setAttribute('aria-expanded', String(!collapsed));
  expandToggle.textContent = collapsed ? 'Show more' : 'Show less';
}

function updateCollapseButton() {
  if (!expandToggle || !collapsibleSection) {
    return;
  }

  const wordCount = state.description.trim().split(/\s+/).filter(Boolean).length;
  isDescriptionCollapsed = wordCount > 20;

  expandToggle.classList.remove('hidden');
  setDescriptionCollapsed(isDescriptionCollapsed);
}

function updateTimeRemaining() {
  if (!timeEl) {
    return;
  }

  if (state.status === 'Done') {
    timeEl.textContent = 'Completed';
    if (overdueIndicator) {
      overdueIndicator.classList.add('hidden');
    }
    if (card) {
      card.classList.remove('overdue');
    }
    return;
  }

  const now = new Date();
  const due = new Date(state.dueDate);
  const diff = due - now;
  let text = '';

  if (diff < 0) {
    const overdueMinutes = Math.ceil(Math.abs(diff) / 60000);
    const overdueHours = Math.ceil(overdueMinutes / 60);
    const overdueDays = Math.ceil(overdueHours / 24);
    text = overdueDays > 0
      ? `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`
      : overdueHours > 0
        ? `Overdue by ${overdueHours} hour${overdueHours !== 1 ? 's' : ''}`
        : `Overdue by ${overdueMinutes} minute${overdueMinutes !== 1 ? 's' : ''}`;
    if (overdueIndicator) {
      overdueIndicator.classList.remove('hidden');
    }
  } else {
    if (overdueIndicator) {
      overdueIndicator.classList.add('hidden');
    }
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      text = 'Due now!';
    } else if (hours < 1) {
      text = `Due in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (days < 1) {
      text = `Due in ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      text = `Due in ${days} day${days !== 1 ? 's' : ''}`;
    }
  }

  timeEl.textContent = text;
}

function startTimer() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }

  if (state.status !== 'Done') {
    updateInterval = setInterval(updateTimeRemaining, 30000);
  }

  updateTimeRemaining();
}

function renderCard() {
  const isPlaceholder = state.title === 'Enter new task' || state.description === 'Enter your description.';

  if (titleEl) {
    titleEl.textContent = state.title;
    titleEl.classList.toggle('placeholder-text', isPlaceholder);
    if (isPlaceholder) {
      titleEl.setAttribute('aria-readonly', 'true');
    } else {
      titleEl.removeAttribute('aria-readonly');
    }
  }
  if (descriptionEl) {
    descriptionEl.textContent = state.description;
    descriptionEl.classList.toggle('placeholder-text', isPlaceholder);
    if (isPlaceholder) {
      descriptionEl.setAttribute('aria-readonly', 'true');
    } else {
      descriptionEl.removeAttribute('aria-readonly');
    }
  }

  if (state.deleted) {
    if (dueDateEl) {
      dueDateEl.textContent = '';
      dueDateEl.removeAttribute('datetime');
    }
    if (priorityBadge) {
      priorityBadge.textContent = state.priority;
      priorityBadge.className = 'badge';
    }
    if (priorityIndicator) {
      priorityIndicator.className = 'priority-indicator';
    }
    if (statusText) {
      statusText.textContent = 'Deleted';
    }
    if (statusControl) {
      statusControl.value = 'Pending';
    }
    if (checkbox) {
      checkbox.checked = false;
    }
    if (timeEl) {
      timeEl.textContent = 'Task removed';
    }
    if (overdueIndicator) {
      overdueIndicator.classList.add('hidden');
    }
    if (card) {
      card.classList.remove('overdue');
      card.classList.add('deleted');
    }
    if (expandToggle) {
      expandToggle.classList.add('hidden');
    }
    if (collapsibleSection) {
      collapsibleSection.classList.remove('collapsed');
    }
    return;
  }

  if (dueDateEl) {
    dueDateEl.textContent = formatDueDateTime(state.dueDate);
    dueDateEl.setAttribute('datetime', state.dueDate);
  }
  setPriorityVisuals(state.priority);
  setStatusVisuals(state.status);
  updateCollapseButton();
  startTimer();
}

function openEditMode() {
  if (!editForm) {
    return;
  }
  draftState = { ...state };
  titleInput.value = draftState.title;
  descriptionInput.value = draftState.description;
  prioritySelect.value = draftState.priority;
  dueDateInput.value = toLocalDateTimeValue(draftState.dueDate);
  editForm.classList.remove('hidden');
  if (editButton) {
    editButton.setAttribute('aria-expanded', 'true');
  }
  titleInput.focus();
  trappedFocusElements = Array.from(editForm.querySelectorAll('input, textarea, select, button'));
}

function closeEditMode(returnFocus = true) {
  if (!editForm) {
    return;
  }
  editForm.classList.add('hidden');
  if (editButton) {
    editButton.setAttribute('aria-expanded', 'false');
  }
  if (returnFocus && editButton) {
    editButton.focus();
  }
}

function applyFormChanges() {
  const updatedDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
  if (updatedDate && !Number.isNaN(updatedDate.getTime())) {
    draftState.dueDate = updatedDate.toISOString();
  }
  draftState.title = titleInput.value.trim() || 'Untitled task';
  draftState.description = descriptionInput.value.trim() || 'No description provided.';
  draftState.priority = prioritySelect.value;
  draftState.deleted = false;
  Object.assign(state, draftState);
  saveState();
  renderCard();
}

function clearTask() {
  state.title = 'Enter a new Task';
  state.description = 'Enter a description for your task.';
  state.priority = 'Low';
  state.dueDate = new Date().toISOString();
  state.status = 'Pending';
  state.deleted = true;
  if (editForm) {
    editForm.classList.add('hidden');
  }
  if (editButton) {
    editButton.setAttribute('aria-expanded', 'false');
  }
  saveState();
  renderCard();
}

function syncStatusFromControl(newStatus) {
  if (newStatus === 'Done') {
    if (checkbox) {
      checkbox.checked = true;
    }
  } else if (checkbox && checkbox.checked) {
    checkbox.checked = false;
  }
  state.status = newStatus;
  setStatusVisuals(state.status);
  startTimer();
}

if (checkbox) {
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      state.status = 'Done';
    } else if (state.status === 'Done') {
      state.status = 'Pending';
    }
    setStatusVisuals(state.status);
    startTimer();
  });
}

if (statusControl) {
  statusControl.addEventListener('change', (event) => {
    syncStatusFromControl(event.target.value);
  });
}

if (expandToggle && collapsibleSection) {
  expandToggle.addEventListener('click', () => {
    isDescriptionCollapsed = !collapsibleSection.classList.contains('collapsed');
    setDescriptionCollapsed(isDescriptionCollapsed);
  });
}

if (editButton) {
  editButton.addEventListener('click', () => {
    window.location.href = 'edit.html';
  });
}

if (cancelButton) {
  cancelButton.addEventListener('click', () => {
    if (isEditPage) {
      window.location.href = 'index.html';
      return;
    }
    if (draftState) {
      Object.assign(state, draftState);
    }
    renderCard();
    closeEditMode();
  });
}

if (saveButton) {
  saveButton.addEventListener('click', () => {
    applyFormChanges();
    if (isEditPage) {
      window.location.href = 'index.html';
      return;
    }
    closeEditMode();
  });
}

if (deleteButton) {
  deleteButton.addEventListener('click', () => {
    clearTask();
  });
}

if (editForm) {
  editForm.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = trapFocusElements.filter((node) => !node.disabled && node.offsetParent !== null);
    const index = focusable.indexOf(document.activeElement);
    if (event.shiftKey && index === 0) {
      event.preventDefault();
      focusable[focusable.length - 1].focus();
    } else if (!event.shiftKey && index === focusable.length - 1) {
      event.preventDefault();
      focusable[0].focus();
    }
  });
}

loadState();
renderCard();
if (isEditPage) {
  openEditMode();
}

