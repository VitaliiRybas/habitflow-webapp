const tg = window.Telegram.WebApp;
tg.ready();

// ===== Перевірка авторизації =====
const user = tg.initDataUnsafe?.user;
if (!user?.id) {
  alert("❌ Не вдалося авторизуватись через Telegram");
  throw new Error("Telegram user not found");
}

const userId = user.id;
const apiUrl = 'https://habitflow-backend-production.up.railway.app/habits';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addHabitBtn')?.addEventListener('click', addHabit);
  loadHabits();
});

// ===== Завантаження звичок =====
async function loadHabits() {
  try {
    const response = await fetch(`${apiUrl}?user_id=${userId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const habits = await response.json();
    const container = document.getElementById('habitList');
    container.innerHTML = '';

    habits.forEach(habit => {
      const card = createHabitCard(habit);
      container.appendChild(card);
    });

  } catch (err) {
    console.error("⛔ Load habits error:", err);
    alert("Не вдалося завантажити звички 😢\nLoad failed");
  }
}

// ===== Додавання звички =====
async function addHabit() {
  const input = document.getElementById('habitInput');
  const title = input?.value.trim();
  if (!title) return;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, user_id: userId })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    input.value = '';
    await loadHabits();
  } catch (err) {
    console.error("⛔ Add habit error:", err);
    alert("Не вдалося додати звичку 😢\nLoad failed");
  }
}

// ===== Генерація картки звички =====
function createHabitCard(habit) {
  const card = document.createElement('div');
  card.className = 'habit-card';

  const title = document.createElement('div');
  title.className = 'habit-title';
  title.textContent = habit.title;

  card.appendChild(title);

  // Стрік (кружечки)
  const streak = habit.streak_data || Array(7).fill('none');
  const container = document.createElement('div');
  container.className = 'streak-container';

  streak.forEach((status, i) => {
    const circle = document.createElement('div');
    circle.className = 'streak-point';

    if (status === 'done') circle.classList.add('done-today');
    if (status === 'missed') circle.classList.add('missed');

    if (i === streak.length - 1 && status !== 'done') {
      circle.style.cursor = 'pointer';
      circle.onclick = () => markTodayDone(habit.id);
    }

    container.appendChild(circle);
  });

  card.appendChild(container);
  return card;
}

// ===== Позначити сьогоднішній день виконаним =====
async function markTodayDone(habitId) {
  try {
    await fetch(`${apiUrl}/${habitId}/done`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    await loadHabits();
  } catch (err) {
    alert("Не вдалося оновити стрік");
  }
}
