
const dueDate = new Date("2026-03-01T18:00:00Z");
  const timeEl = document.querySelector('[data-testid="test-todo-time-remaining"]');
  const checkbox = document.querySelector('[data-testid="test-todo-complete-toggle"]');
  const card = document.querySelector('[data-testid="test-todo-card"]');
  const status = document.querySelector('[data-testid="test-todo-status"]');

  function updateTimeRemaining() {
    const now = new Date();
    const diff = dueDate - now;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let text = "";

    if (diff < 0) {
      const overdueHours = Math.abs(hours);
      text = `Overdue by ${overdueHours} hour${overdueHours !== 1 ? 's' : ''}`;
    } else if (minutes < 1) {
      text = "Due now!";
    } else if (hours < 24) {
      text = `Due in ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      text = `Due in ${days} day${days !== 1 ? 's' : ''}`;
    }

    timeEl.textContent = text;
  }

  updateTimeRemaining();
  setInterval(updateTimeRemaining, 60000);

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      card.classList.add("completed");
      status.textContent = "Done";
    } else {
      card.classList.remove("completed");
      status.textContent = "Pending";
    }
  });

  document.querySelector('[data-testid="test-todo-edit-button"]')
    .addEventListener("click", () => console.log("edit clicked"));

  document.querySelector('[data-testid="test-todo-delete-button"]')
    .addEventListener("click", () => alert("Delete clicked"));
