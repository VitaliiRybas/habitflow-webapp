// Підключення Telegram WebApp SDK
const tg = window.Telegram.WebApp;
tg.ready(); // сигналізує Telegram, що все готово

const user = tg.initDataUnsafe?.user;

if (!user || !user.id) {
  alert("❌ Користувач не авторизований через Telegram");
  window.location.href = "/"; // повертаємо на головну
}

const userId = user.id;
console.log("✅ Telegram user ID:", userId);

const apiUrl = 'https://habitflow-backend-0k9bpqzmj0h6e208.up.railway.app/habits';

document.addEventListener('DOMContentLoaded', loadHabits);

async function loadHabits() {
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

  await fetch(apiUrl, {
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
