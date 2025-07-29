// Підключення Telegram WebApp SDK
const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe?.user;

if (!user || !user.id) {
  alert("❌ Користувач не авторизований через Telegram");
  window.location.href = "/";
}

const userId = user.id;
console.log("✅ Telegram user ID:", userId);

const apiUrl = 'https://habitflow-backend-production.up.railway.app/habits';

document.addEventListener('DOMContentLoaded', loadHabits);

// Завантаження звичок з бекенду
async function loadHabits() {
  const response = await fetch(`${apiUrl}?user_id=${userId}`);
  const habits = await response.json();

  const container = document.getElementById('habitList');
  container.innerHTML = '';

  habits.forEach(habit => {
    const card = createHabitCard(habit);
    container.appendChild(card);
  });
}

// Додавання нової звички
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

// Створення картки звички з 7 кружечками і стріком
function createHabitCard(habit) {
  const card = document.createElement('div');
  card.className = 'habit-card';

  // Для прикладу — генеруємо рандомний стрік із 7 днів (TODO: отримувати зі звички)
  // Для реальної логіки потрібно зберігати стан виконань на бекенді
  const streakData = habit.streak || generateEmptyStreak(); // масив із 7 елементів: 'done', 'missed', 'none'

  // Обчислюємо скільки тижнів поспіль (приблизно)
  const weeksCount = habit.weeks_count || 0;

  card.innerHTML = `
    <div class="habit-title">${escapeHtml(habit.title)}</div>
    <div class="streak-container"></div>
  `;

  const streakContainer = card.querySelector('.streak-container');

  // Генеруємо кружечки
  streakData.forEach((status, index) => {
    const circle = document.createElement('div');
    circle.className = 'streak-point';

    if (status === 'done') {
      circle.classList.add('done-today');
    } else if (status === 'missed') {
      circle.classList.add('missed');
    }

    // Додаємо обробник кліку — лише для сьогоднішнього дня (припустимо останній індекс)
    if (index === streakData.length - 1 && status !== 'done') {
      circle.style.cursor = 'pointer';
      circle.addEventListener('click', async (e) => {
        e.stopPropagation();
        await markTodayDone(habit.id);
      });
    } else {
      circle.style.cursor = 'default';
    }

    streakContainer.appendChild(circle);
  });

  // Додаємо індикатор тижнів і вогонь, якщо >=1
  const weeksDiv = document.createElement('div');
  weeksDiv.className = 'streak-weeks';
  weeksDiv.textContent = weeksCount;
  streakContainer.appendChild(weeksDiv);

  if (weeksCount >= 1) {
    const fire = document.createElement('div');
    fire.className = 'fire-icon';
    streakContainer.appendChild(fire);
  }

  // Події на картці:
  // Довгий тап — редагування/видалення
  let longPressTimer;
  card.addEventListener('touchstart', () => {
    longPressTimer = setTimeout(() => openEditMenu(habit), 600);
  });
  card.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
  });
  card.addEventListener('touchmove', () => {
    clearTimeout(longPressTimer);
  });

  // Клік — відкриваємо деталі (поки просто alert)
  card.addEventListener('click', () => {
    openHabitDetails(habit);
  });

  return card;
}

// Заміщення потенційно небезпечних символів у назві
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

// Генерує масив із 7 днів зі статусом 'none' (порожні кружечки)
function generateEmptyStreak() {
  return Array(7).fill('none');
}

// Позначити сьогоднішній день як виконаний, оновити бекенд і перезавантажити список
async function markTodayDone(habitId) {
  // Тут потрібно реалізувати запит на бекенд, який позначає сьогодні як виконано
  // Поки що просто вивід
  console.log(`Позначено сьогодні як виконано у звичці ${habitId}`);

  // Після успішного оновлення перезавантажуємо звички
  await loadHabits();
}

// Відкриття модалки редагування/видалення (поки просто alert)
function openEditMenu(habit) {
  if (confirm(`Редагувати або видалити "${habit.title}"?\nНатисни OK щоб редагувати, Відміна - видалити.`)) {
    const newTitle = prompt('Введи нову назву звички:', habit.title);
    if (newTitle && newTitle.trim() !== habit.title) {
      editHabit(habit.id, newTitle.trim());
    }
  } else {
    if (confirm('Впевнені, що хочете видалити?')) {
      deleteHabit(habit.id);
    }
  }
}

// Відкриття детальної інформації (поки просто alert)
function openHabitDetails(habit) {
  alert(`Деталі звички:\n${habit.title}\n\nТут буде графік та статистика.`);
}

// Редагування звички
async function editHabit(id, newTitle) {
  await fetch(`${apiUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle, user_id: userId })
  });
  loadHabits();
}

// Видалення звички
async function deleteHabit(id) {
  await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
  loadHabits();
}
