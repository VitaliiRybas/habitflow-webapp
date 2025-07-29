const apiUrl = 'http://127.0.0.1:8000/habits';

const urlParams = new URLSearchParams(window.location.search);
const userId = parseInt(urlParams.get("user_id"));

if (!userId || isNaN(userId)) {
  alert("❌ Користувач не авторизований через Telegram");
  window.location.href = "/"; // повертаємо на головну
}

console.log("userId =", userId);


document.addEventListener('DOMContentLoaded', loadHabits);

async function loadHabits() {
  if (!userId || isNaN(userId)) {
    alert("❌ user_id не передано або некоректний.");
    return;
  }

  const response = await fetch(`${apiUrl}?user_id=${userId}`);
  const habits = await response.json();

  const list = document.getElementById('habitList');
  list.innerHTML = '';

  habits.forEach(habit => {
    const li = createHabitElement(habit);
    list.appendChild(li);
  });
}

async function addHabit() {
  const input = document.getElementById('habitInput');
  const title = input.value.trim();
  if (!title) return;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, user_id: userId })
  });

  input.value = '';
  loadHabits();
}

function createHabitElement(habit) {
  const li = document.createElement('li');
  li.innerHTML = `
    <strong>${habit.title}</strong>
    <small>📆 ${new Date(habit.created_at).toLocaleDateString()}</small>
    <button onclick="editHabit(${habit.id}, '${habit.title}')">✏️</button>
    <button onclick="deleteHabit(${habit.id})">❌</button>
  `;
  return li;
}

async function deleteHabit(id) {
  await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
  loadHabits();
}

async function editHabit(id, oldTitle) {
  const newTitle = prompt('Введи нову назву звички:', oldTitle);
  if (!newTitle || newTitle.trim() === oldTitle) return;

  await fetch(`${apiUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle.trim(), user_id: userId })
  });

  loadHabits();
}
