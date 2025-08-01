const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe?.user;
if (!user?.id) {
  alert("❌ Не вдалося авторизуватись через Telegram");
  throw new Error("Telegram user not found");
}

const userId = user.id;
const apiUrl = 'https://habitflow-backend.onrender.com/habits';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addHabitBtn')?.addEventListener('click', addHabit);
  loadHabits();
});

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

function createHabitCard(habit) {
  const card = document.createElement('div');
  card.className = 'habit-card';
  card.dataset.id = habit.id;

  const title = document.createElement('div');
  title.className = 'habit-title';
  title.textContent = habit.title;

  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'habit-actions';
  buttonGroup.innerHTML = `
    <button class="edit-btn">✏️</button>
    <button class="delete-btn">🗑️</button>
  `;
  buttonGroup.style.display = 'none';

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

  card.appendChild(title);
  card.appendChild(container);
  card.appendChild(buttonGroup);

  // ===== Свайп логіка =====
  let startX = 0;
  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });

  card.addEventListener('touchend', e => {
    const diffX = e.changedTouches[0].clientX - startX;
    if (diffX < -30) {
      buttonGroup.style.display = 'flex';
    } else if (diffX > 30) {
      buttonGroup.style.display = 'none';
    }
  });

  // ===== Обробка кнопок =====
  buttonGroup.querySelector('.delete-btn').onclick = () => deleteHabit(habit.id);
  buttonGroup.querySelector('.edit-btn').onclick = () => editHabit(habit);

  return card;
}

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

async function deleteHabit(habitId) {
  if (!confirm("Видалити цю звичку?")) return;
  try {
    await fetch(`${apiUrl}/${habitId}`, {
      method: 'DELETE'
    });
    await loadHabits();
  } catch (err) {
    alert("Не вдалося видалити звичку");
  }
}

async function editHabit(habit) {
  const newTitle = prompt("Редагувати звичку:", habit.title);
  if (!newTitle || newTitle.trim() === '') return;

  try {
    await fetch(`${apiUrl}/${habit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...habit,
        title: newTitle.trim(),
        user_id: userId
      })
    });
    await loadHabits();
  } catch (err) {
    alert("Не вдалося редагувати звичку");
  }
}
