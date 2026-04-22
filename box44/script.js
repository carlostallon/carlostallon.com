const ROUTINES = [
  { key: "gymnasticos", label: "Gymnasticos" },
  { key: "fuerza-parejas", label: "Fuerza en parejas" },
  { key: "halterofilia", label: "Halterofilia" },
  { key: "deka", label: "Deka" },
  { key: "fuerza", label: "Fuerza" }
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "box44-selected-routines";
const selectedRoutines = new Set(loadStoredSelection());

const filtersRoot = document.querySelector("#routine-filters");
const calendarGrid = document.querySelector("#calendar-grid");
const clearSelectionButton = document.querySelector("#clear-selection");
const visibleMonthLabel = document.querySelector("#visible-month-label");
const previousMonthButton = document.querySelector("#previous-month");
const nextMonthButton = document.querySelector("#next-month");

const today = new Date();
let visibleMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
const currentWeekMonday = startOfWeek(today);

render();

clearSelectionButton.addEventListener("click", () => {
  selectedRoutines.clear();
  persistSelection();
  render();
});

previousMonthButton.addEventListener("click", () => {
  visibleMonthDate = new Date(
    visibleMonthDate.getFullYear(),
    visibleMonthDate.getMonth() - 1,
    1
  );
  render();
});

nextMonthButton.addEventListener("click", () => {
  visibleMonthDate = new Date(
    visibleMonthDate.getFullYear(),
    visibleMonthDate.getMonth() + 1,
    1
  );
  render();
});

function render() {
  renderFilters();
  renderCalendar();
}

function renderFilters() {
  filtersRoot.innerHTML = "";

  ROUTINES.forEach((routine, index) => {
    const isActive = selectedRoutines.has(routine.key);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `filter-card${isActive ? " is-active" : ""}`;
    card.setAttribute("aria-pressed", String(isActive));

    card.innerHTML = `
      <div class="filter-top">
        <div>
          <strong>${routine.label}</strong>
        </div>
        <div class="filter-chip">${index + 1}</div>
      </div>
    `;

    card.addEventListener("click", () => {
      toggleRoutine(routine.key);
    });

    filtersRoot.appendChild(card);
  });
}

function renderCalendar() {
  calendarGrid.innerHTML = "";

  const monthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric"
  }).format(visibleMonthDate);

  visibleMonthLabel.textContent = capitalize(monthLabel);

  const visibleYear = visibleMonthDate.getFullYear();
  const visibleMonth = visibleMonthDate.getMonth();
  const firstDayOfMonth = new Date(visibleYear, visibleMonth, 1);
  const lastDayOfMonth = new Date(visibleYear, visibleMonth + 1, 0);
  const leadingPadding = (firstDayOfMonth.getDay() + 6) % 7;
  const trailingPadding = (7 - ((leadingPadding + lastDayOfMonth.getDate()) % 7)) % 7;

  for (let index = 0; index < leadingPadding; index += 1) {
    const date = new Date(visibleYear, visibleMonth, index - leadingPadding + 1);
    calendarGrid.appendChild(buildDayCard(date, true));
  }

  for (let day = 1; day <= lastDayOfMonth.getDate(); day += 1) {
    const date = new Date(visibleYear, visibleMonth, day);
    calendarGrid.appendChild(buildDayCard(date, false));
  }

  for (let index = 1; index <= trailingPadding; index += 1) {
    const date = new Date(visibleYear, visibleMonth + 1, index);
    calendarGrid.appendChild(buildDayCard(date, true));
  }
}

function buildDayCard(date, isOutsideMonth) {
  const card = document.createElement("article");
  const routine = getDisplayRoutineForDate(date);
  const isToday = isSameDate(date, today);
  const isWeekend = !routine;
  const isSelected = routine ? selectedRoutines.has(routine.key) : false;
  const classes = ["day-card"];

  if (isOutsideMonth) {
    classes.push("is-outside-month");
  }
  if (isWeekend) {
    classes.push("is-weekend");
  }
  if (isSelected) {
    classes.push("is-selected");
  }
  if (isToday) {
    classes.push("is-today");
  }

  card.className = classes.join(" ");
  card.innerHTML = `
    <div class="day-top">
      <span class="day-number">${date.getDate()}</span>
    </div>
    <div>
      <p class="routine-name">${routine ? routine.label : "Descanso"}</p>
      <p class="routine-meta">${buildMeta(date, routine)}</p>
    </div>
  `;

  return card;
}

function buildMeta(date, routine) {
  const weekdayLabel = new Intl.DateTimeFormat("es-ES", {
    weekday: "long"
  }).format(date);

  if (!routine) {
    return `${capitalize(weekdayLabel)} · descanso`;
  }

  return capitalize(weekdayLabel);
}

function getDisplayRoutineForDate(date) {
  if (getWeekdayIndex(date) === 5) {
    return {
      key: "sabado-hyrox",
      label: "Fuerza en parejas + Hyrox"
    };
  }

  return getRoutineForDate(date);
}

function getRoutineForDate(date) {
  const weekdayIndex = getWeekdayIndex(date);

  if (weekdayIndex < 0 || weekdayIndex > 4) {
    return null;
  }

  const weekOffset = getWeekOffset(date);
  const routineIndex = mod(weekdayIndex - weekOffset, ROUTINES.length);
  return ROUTINES[routineIndex];
}

function getWeekOffset(date) {
  const weekMonday = startOfWeek(date);
  return Math.round((weekMonday - currentWeekMonday) / (MS_PER_DAY * 7));
}

function getWeekdayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function startOfWeek(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekdayIndex = getWeekdayIndex(copy);
  copy.setDate(copy.getDate() - weekdayIndex);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDate(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function toggleRoutine(routineKey) {
  if (selectedRoutines.has(routineKey)) {
    selectedRoutines.delete(routineKey);
  } else {
    selectedRoutines.add(routineKey);
  }

  persistSelection();
  render();
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function loadStoredSelection() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(storedValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSelection() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(Array.from(selectedRoutines))
  );
}
