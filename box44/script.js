const ROUTINES = [
  { key: "hyrox", label: "Hyrox", shortLabel: "HYR" },
  { key: "fuerza", label: "Fuerza", shortLabel: "FUE" },
  { key: "gymnasticos", label: "Gymnasticos", shortLabel: "GYM" },
  { key: "fuerza-parejas", label: "Fuerza en parejas", shortLabel: "FPAR" },
  { key: "halterofilia", label: "Halterofilia", shortLabel: "HAL" }
];

const DEKA_ROUTINE = { key: "deka", label: "DEKA", shortLabel: "DEKA" };
const FILTER_ROUTINES = [...ROUTINES, DEKA_ROUTINE];

const SATURDAY_ROUTINE = {
  key: "sabado-hyrox",
  label: "Fuerza en parejas + Hyrox",
  shortLabel: "FPAR+HY"
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "box44-selected-routines";
const selectedRoutines = new Set(loadStoredSelection());

const filtersRoot = document.querySelector("#routine-filters");
const calendarGrid = document.querySelector("#calendar-grid");
const clearSelectionButton = document.querySelector("#clear-selection");
const visibleWeekLabel = document.querySelector("#visible-week-label");
const previousWeekButton = document.querySelector("#previous-week");
const nextWeekButton = document.querySelector("#next-week");

const today = new Date();
let visibleWeekStart = getInitialWeekStart(today);
const REFERENCE_WEEK_MONDAY = new Date(2026, 7, 24);
REFERENCE_WEEK_MONDAY.setHours(0, 0, 0, 0);

render();

clearSelectionButton.addEventListener("click", () => {
  selectedRoutines.clear();
  persistSelection();
  render();
});

previousWeekButton.addEventListener("click", () => {
  visibleWeekStart = addDays(visibleWeekStart, -7);
  render();
});

nextWeekButton.addEventListener("click", () => {
  visibleWeekStart = addDays(visibleWeekStart, 7);
  render();
});

function render() {
  renderFilters();
  renderCalendar();
}

function renderFilters() {
  filtersRoot.innerHTML = "";

  FILTER_ROUTINES.forEach((routine, index) => {
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
  visibleWeekLabel.textContent = formatWeekLabel(visibleWeekStart);

  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(visibleWeekStart, offset);
    calendarGrid.appendChild(buildDayCard(date));
  }
}

function buildDayCard(date) {
  const card = document.createElement("article");
  const routine = getDisplayRoutineForDate(date);
  const isToday = isSameDate(date, today);
  const isWeekend = !routine;
  const isSelected = routine ? selectedRoutines.has(routine.key) : false;
  const classes = ["day-card"];

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
      <p class="routine-name">
        <span class="routine-name-full">${routine ? routine.label : "Descanso"}</span>
        <span class="routine-name-short">${routine ? routine.shortLabel : "OFF"}</span>
      </p>
    </div>
  `;

  return card;
}

function getDisplayRoutineForDate(date) {
  if (getWeekdayIndex(date) === 5) {
    return SATURDAY_ROUTINE;
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
  const routine = ROUTINES[routineIndex];

  if (routine.key === "hyrox" && mod(weekOffset, 2) !== 0) {
    return DEKA_ROUTINE;
  }

  return routine;
}

function getWeekOffset(date) {
  const weekMonday = startOfWeek(date);
  return Math.round((weekMonday - REFERENCE_WEEK_MONDAY) / (MS_PER_DAY * 7));
}

function getInitialWeekStart(date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (getWeekdayIndex(normalized) === 6) {
    normalized.setDate(normalized.getDate() + 1);
  }

  return startOfWeek(normalized);
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

function addDays(date, days) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatWeekLabel(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  const startText = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short"
  }).format(weekStart);

  const endText = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    year: sameYear ? undefined : "numeric"
  }).format(weekEnd);

  const yearText = sameYear ? weekStart.getFullYear() : weekEnd.getFullYear();
  return `${capitalize(startText)} - ${capitalize(endText)} ${yearText}`;
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
