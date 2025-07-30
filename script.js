// Підключення Telegram WebApp SDK
const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe?.user;

if (!user || !user.id) {
  alert("❌ Користувач не авторизований через Telegram. Відкрий додаток з Telegram.");
  throw new Error("Користувач не авторизований");
}

const userId = user.id;
console.log("✅ Telegram user ID:", userId);

const apiUrl = 'https://habitflow-backend-production.up.railway.app/habits';

document.addEventListener('DOMContentLoaded', loadHabits);

// ======================
// Завантаження звичок
// ======================
async function loadHabits() {
  try {
    const response = await fetch(`${apiUrl}?user_id=${userId}`);
    if (!response.ok) throw new Error(`Помилка ${response.status}`);

    const habits = await response.json();
    const container = document.getElementById('habitList');
    container.innerHTML = '';

    habits.forEach(habit => {
      const card = createHabitCard(habit);
      container.appendChild(card);
    });
  } catch (error) {
    console.error("❌ Помилка при завантаженні звичок:", error);
    alert("Не вдалося завантажити звички 😢");
  }
}

// ======================
// Додавання звички
// ======================
async function addHabit() {
  const input = document.getElementById('habitInput');
  const title = input.value.trim();
  if (!title) return;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, user_id: userId })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Помилка ${response.status}: ${text}`);
    }

    input.value = '';
    await loadHabits();
  } catch (error) {
    console.error("❌ Помилка при додаванні звички:", error);
    alert("Не вдалося додати звичку 😢");
  }
}

// ======================
// Створення картки
// ======================
function createHabitCard(habit) {
  const card = document.createElement('div');
  card.className = 'habit-card';

  const streakData = habit.streak || generateEmptyStreak();
  const weeksCount = habit.weeks_count || 0;

  card.innerHTML = `
    <div class="habit-title">${escapeHtml(habit.title)}</div>
    <div class="streak-container"></div>
  `;

  const streakContainer = card.querySelector('.streak-container');

  streakData.forEach((status, index) => {
    const circle = document.createElement('div');
    circle.className = 'streak-point';

    if (status === 'done') circle.classList.add('done-today');
    if (status === 'missed') circle.classList.add('missed');

    if (index === streakData.length - 1 && status !== 'done') {
      circle.style.cursor = 'pointer';
      circle.addEventListener('click', async (e) => {
        e.stopPropagation();
        await markTodayDone(habit.id);
      });
    }

    streakContainer.appendChild(circle);
  });

  const weeksDiv = document.createElement('div');
  weeksDiv.className = 'streak-weeks';
  weeksDiv.textContent = weeksCount;
  streakContainer.appendChild(weeksDiv);

  if (weeksCount >= 1) {
    const fire = document.createElement('div');
    fire.className = 'fire-icon';
    streakContainer.appendChild(fire);
  }

  // Довгий тап
  let longPressTimer;
  card.addEventListener('touchstart', () => {
    longPressTimer = setTimeout(() => openEditMenu(habit), 600);
  });
  card.addEventListener('touchend', () => clearTimeout(longPressTimer));
  card.addEventListener('touchmove', () => clearTimeout(longPressTimer));

  card.addEventListener('click', () => openHabitDetails(habit));

  return card;
}

// ======================
// Допоміжні функції
// ======================
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function generateEmptyStreak() {
  return Array(7).fill('none');
}

async function markTodayDone(habitId) {
  console.log(`✅ Позначаємо звичку як виконану: ${habitId}`);
  // TODO: реалізувати запит на бекенд
  await loadHabits();
}

function openEditMenu(habit) {
  if (confirm(`Редагувати або видалити "${habit.title}"?\nOK — редагувати, Відміна — видалити.`)) {
    const newTitle = prompt('Введи нову назву звички:', habit.title);
    if (newTitle && newTitle.trim() !== habit.title) {
      editHabit(habit.id, newTitle.trim());
    }
  } else {
    if (confirm('Ви точно хочете видалити звичку?')) {
      deleteHabit(habit.id);
    }
  }
}

function openHabitDetails(habit) {
  alert(`Деталі звички:\n${habit.title}\n\n(тут буде статистика)`);
}

async function editHabit(id, newTitle) {
  try {
    await fetch(`${apiUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, user_id: userId })
    });
    loadHabits();
  } catch (error) {
    console.error("❌ Помилка при редагуванні:", error);
  }
}

async function deleteHabit(id) {
  try {
    await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
    loadHabits();
  } catch (error) {
    console.error("❌ Помилка при видаленні:", error);
  }
}
