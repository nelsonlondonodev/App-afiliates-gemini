// --- Constantes y Configuración ---
const USERS_DB_KEY = "barberAppUsers";
const BOOKINGS_DB_KEY = "barberAppBookings";
const LOGGED_IN_USER_KEY = "barberAppLoggedInUser";
const REFERRAL_BONUS_REFERRER = 50; // Puntos para quien refiere
const REFERRAL_BONUS_REFEREE = 20; // Puntos de bienvenida para el referido (o descuento)
const POINTS_PER_EURO = 1; // Puntos ganados por cada euro gastado

// --- Estado de la Aplicación ---
let currentUser = null;

// --- Elementos del DOM ---
const sections = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll(
  ".nav-link:not(#nav-logout):not(#mobile-nav-logout)"
);
const navLogin = document.getElementById("nav-login");
const navDashboard = document.getElementById("nav-dashboard");
const navLogout = document.getElementById("nav-logout");
const mobileNavLogin = document.getElementById("mobile-nav-login");
const mobileNavDashboard = document.getElementById("mobile-nav-dashboard");
const mobileNavLogout = document.getElementById("mobile-nav-logout");
const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");

// Formularios
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const bookingForm = document.getElementById("booking-form");

// Dashboard
const userNameDisplay = document.getElementById("user-name-display");
const referralCodeDisplay = document.getElementById("referral-code-display");
const copyReferralCodeBtn = document.getElementById("copy-referral-code");
const loyaltyPointsDisplay = document.getElementById("loyalty-points-display");
const referralCountDisplay = document.getElementById("referral-count");
const referralList = document.getElementById("referral-list");
const bookingHistoryList = document.getElementById("booking-history-list");

// Modal
const messageModal = document.getElementById("message-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalCloseBtn = document.getElementById("modal-close-btn");

document.getElementById("current-year").textContent = new Date().getFullYear();

// --- Funciones Auxiliares ---
function uuidv4() {
  // Generador de IDs únicos
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_DB_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

function getBookings() {
  return JSON.parse(localStorage.getItem(BOOKINGS_DB_KEY)) || [];
}

function saveBookings(bookings) {
  localStorage.setItem(BOOKINGS_DB_KEY, JSON.stringify(bookings));
}

function showModal(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  messageModal.classList.remove("opacity-0", "pointer-events-none");
  messageModal.classList.add("open");
}

function closeModal() {
  messageModal.classList.add("opacity-0", "pointer-events-none");
  messageModal.classList.remove("open");
}

// --- Navegación ---
function navigateTo(sectionId) {
  sections.forEach((section) => {
    section.classList.remove("active");
    if (section.id === sectionId) {
      section.classList.add("active");
    }
  });
  navLinks.forEach((link) => {
    link.classList.remove("nav-link-active");
    if (
      link.dataset.section === sectionId ||
      (link.href && link.href.endsWith(`#${sectionId.replace("-section", "")}`))
    ) {
      link.classList.add("nav-link-active");
    }
  });
  window.scrollTo(0, 0); // Scroll al inicio de la página
  if (mobileMenu.classList.contains("block")) {
    // Ocultar menú móvil si está abierto
    mobileMenu.classList.add("hidden");
    mobileMenu.classList.remove("block");
  }
}

// Event listeners para navegación
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const sectionId = link.dataset.section;
    if (sectionId) navigateTo(sectionId);
  });
});

// Botones en la página de inicio para navegar a secciones
document.querySelectorAll("[data-target-section]").forEach((button) => {
  button.addEventListener("click", (e) => {
    const targetSectionId = e.currentTarget.dataset.targetSection;
    if (targetSectionId) {
      navigateTo(targetSectionId);
    }
  });
});

// Menú móvil
mobileMenuButton.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
  mobileMenu.classList.toggle("block");
});

// --- Lógica de Autenticación ---
function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value.toLowerCase();
  const password = document.getElementById("register-password").value;
  const referredByCode = document
    .getElementById("register-referral")
    .value.trim()
    .toUpperCase();

  const users = getUsers();
  if (users.find((user) => user.email === email)) {
    showModal(
      "Error de Registro",
      "Este correo electrónico ya está registrado."
    );
    return;
  }
  if (password.length < 6) {
    showModal(
      "Error de Registro",
      "La contraseña debe tener al menos 6 caracteres."
    );
    return;
  }

  const referralCode =
    name.substring(0, Math.min(name.length, 4)).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  let initialPoints = 0;
  let referrerUser = null;

  if (referredByCode) {
    referrerUser = users.find((user) => user.referralCode === referredByCode);
    if (referrerUser) {
      initialPoints = REFERRAL_BONUS_REFEREE; // Puntos de bienvenida para el referido
      showModal(
        "¡Bienvenido!",
        `Has usado el código de ${referrerUser.name} y ganas ${REFERRAL_BONUS_REFEREE} puntos de bienvenida.`
      );
    } else {
      showModal(
        "Código Inválido",
        "El código de referido no es válido, pero puedes registrarte sin él."
      );
    }
  }

  const newUser = {
    id: uuidv4(),
    name,
    email,
    password, // En una app real, hashear la contraseña
    referralCode,
    loyaltyPoints: initialPoints,
    referredByCode: referrerUser ? referredByCode : null,
    referralsMade: [], // { userId, userName, date }
  };
  users.push(newUser);
  saveUsers(users);

  // Simular el login después del registro
  loginUser(email, password);
  registerForm.reset();
  if (!referrerUser && referredByCode) return; // Si el código era inválido y no se aplicó bono, no mostrar doble modal
  showModal(
    "Registro Exitoso",
    `¡Bienvenido, ${name}! Tu cuenta ha sido creada. Tu código de referido es ${referralCode}.`
  );
}

function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(
    (u) => u.email === email.toLowerCase() && u.password === password
  ); // Comparación directa, inseguro
  if (user) {
    currentUser = user;
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
    updateUIAfterLogin();
    navigateTo("dashboard-section");
    loginForm.reset();
  } else {
    showModal("Error de Acceso", "Email o contraseña incorrectos.");
  }
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  loginUser(email, password);
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem(LOGGED_IN_USER_KEY);
  updateUIAfterLogout();
  navigateTo("home-section");
  showModal("Sesión Cerrada", "Has cerrado sesión correctamente.");
}

function updateUIAfterLogin() {
  if (!currentUser) return;
  navLogin.classList.add("hidden");
  mobileNavLogin.classList.add("hidden");
  navDashboard.classList.remove("hidden");
  mobileNavDashboard.classList.remove("hidden");
  navLogout.classList.remove("hidden");
  mobileNavLogout.classList.remove("hidden");

  userNameDisplay.textContent = currentUser.name;
  referralCodeDisplay.value = currentUser.referralCode;
  loyaltyPointsDisplay.textContent = currentUser.loyaltyPoints;

  updateReferralList();
  updateBookingHistory();
}

function updateReferralList() {
  if (!currentUser) return;
  referralCountDisplay.textContent = currentUser.referralsMade.length;
  referralList.innerHTML = ""; // Limpiar lista
  if (currentUser.referralsMade.length === 0) {
    referralList.innerHTML =
      "<li>Aún no has referido a nadie. ¡Comparte tu código!</li>";
  } else {
    currentUser.referralsMade.forEach((ref) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<i class="fas fa-check-circle text-green-400 mr-2"></i>${
        ref.userName
      } (Registrado: ${new Date(ref.date).toLocaleDateString()})`;
      referralList.appendChild(listItem);
    });
  }
}

function updateBookingHistory() {
  if (!currentUser) return;
  const bookings = getBookings()
    .filter((b) => b.userId === currentUser.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  bookingHistoryList.innerHTML = ""; // Limpiar
  if (bookings.length === 0) {
    bookingHistoryList.innerHTML =
      '<p class="text-gray-400">Aún no tienes reservas registradas.</p>';
  } else {
    bookings.forEach((booking) => {
      const bookingItem = document.createElement("div");
      bookingItem.className = "p-3 bg-gray-700 rounded-lg";
      bookingItem.innerHTML = `
                        <p class="font-semibold text-white">${
                          booking.serviceName
                        } - ${booking.cost}€</p>
                        <p class="text-sm text-gray-400">Fecha: ${new Date(
                          booking.date + "T" + booking.time
                        ).toLocaleString("es-ES", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}</p>
                        <p class="text-sm text-gray-400">Puntos ganados: ${
                          booking.pointsEarned
                        }</p>
                        ${
                          booking.referralCodeUsed
                            ? `<p class="text-xs text-amber-400">Usó código: ${booking.referralCodeUsed}</p>`
                            : ""
                        }
                    `;
      bookingHistoryList.appendChild(bookingItem);
    });
  }
}

function updateUIAfterLogout() {
  navLogin.classList.remove("hidden");
  mobileNavLogin.classList.remove("hidden");
  navDashboard.classList.add("hidden");
  mobileNavDashboard.classList.add("hidden");
  navLogout.classList.add("hidden");
  mobileNavLogout.classList.add("hidden");
}

// --- Lógica de Reservas ---
function handleBooking(e) {
  e.preventDefault();
  const name = document.getElementById("booking-name").value;
  const serviceElement = document.getElementById("booking-service");
  const serviceValue = serviceElement.value;
  const serviceName = serviceElement.options[serviceElement.selectedIndex].text;
  const servicePrice = parseFloat(
    serviceElement.options[serviceElement.selectedIndex].dataset.price
  );
  const date = document.getElementById("booking-date").value;
  const time = document.getElementById("booking-time").value;
  const referralCodeUsed = document
    .getElementById("booking-referral")
    .value.trim()
    .toUpperCase();

  if (!serviceValue || !date || !time || !name) {
    showModal(
      "Error de Reserva",
      "Por favor, completa todos los campos requeridos."
    );
    return;
  }

  let finalPrice = servicePrice;
  let discountApplied = false;

  if (!currentUser && referralCodeUsed) {
    // Nuevo cliente usando código
    const users = getUsers();
    const referrer = users.find((u) => u.referralCode === referralCodeUsed);
    if (referrer) {
      finalPrice *= 0.9; // 10% descuento para el nuevo cliente
      discountApplied = true;
      showModal(
        "Descuento Aplicado",
        `¡Genial! Por usar el código de ${
          referrer.name
        }, tienes un 10% de descuento. Precio final: ${finalPrice.toFixed(2)}€`
      );
    } else {
      showModal(
        "Código Inválido",
        "El código de referido no es válido. Puedes reservar sin él."
      );
    }
  }

  const pointsEarned = Math.floor(finalPrice * POINTS_PER_EURO);

  const newBooking = {
    id: uuidv4(),
    userId: currentUser ? currentUser.id : "guest-" + uuidv4(), // Si no está logueado, es un invitado
    userName: name,
    serviceName: serviceName.split(" (")[0], // Quitar precio del nombre
    serviceValue,
    cost: finalPrice,
    date,
    time,
    referralCodeUsed: discountApplied ? referralCodeUsed : null,
    pointsEarned: currentUser ? pointsEarned : 0, // Solo usuarios logueados ganan puntos por su propia reserva
    status: "confirmada", // En una app real, podría ser 'pendiente'
  };

  const bookings = getBookings();
  bookings.push(newBooking);
  saveBookings(bookings);

  if (currentUser) {
    currentUser.loyaltyPoints += pointsEarned;
    // Si el usuario actual usó un código de referido EN SU PRIMERA RESERVA (esto es complejo de trackear sin más campos)
    // Aquí simplificamos: si un usuario logueado usa un código (que no sea el suyo), no se aplica descuento, pero se podría notificar al referente.
    // La lógica de recompensa al referente se maneja mejor cuando el *nuevo* usuario se registra o hace su primera reserva.
    saveCurrentUserState();
    updateUIAfterLogin(); // Para refrescar puntos y historial
  }

  // Si un código de referido fue usado exitosamente por un *nuevo* cliente (no logueado o en su primera reserva)
  if (discountApplied && referralCodeUsed) {
    const users = getUsers();
    const referrerIndex = users.findIndex(
      (u) => u.referralCode === referralCodeUsed
    );
    if (referrerIndex !== -1) {
      users[referrerIndex].loyaltyPoints += REFERRAL_BONUS_REFERRER;
      users[referrerIndex].referralsMade.push({
        userId: newBooking.userId, // Podría ser el ID del nuevo usuario si se registra después
        userName: name,
        date: new Date().toISOString(),
      });
      saveUsers(users);
      // Si el referente está logueado y es el usuario actual, refrescar su UI
      if (currentUser && currentUser.id === users[referrerIndex].id) {
        currentUser = users[referrerIndex]; // Actualizar el objeto currentUser
        saveCurrentUserState();
        updateUIAfterLogin();
      }
      showModal(
        "¡Referido Exitoso!",
        `Gracias a tu reserva, ${users[referrerIndex].name} ha ganado ${REFERRAL_BONUS_REFERRER} puntos.`
      );
    }
  }

  bookingForm.reset();
  if (!discountApplied) {
    // Solo mostrar este modal si no se mostró el de descuento
    showModal(
      "Reserva Confirmada",
      `Gracias, ${name}. Tu reserva para ${
        serviceName.split(" (")[0]
      } el ${date} a las ${time} está confirmada. Precio: ${finalPrice.toFixed(
        2
      )}€.`
    );
  }
  if (currentUser)
    navigateTo("dashboard-section"); // Ir al dashboard si está logueado
  else navigateTo("home-section");
}

function saveCurrentUserState() {
  if (!currentUser) return;
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === currentUser.id);
  if (userIndex !== -1) {
    users[userIndex] = currentUser;
    saveUsers(users);
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(currentUser));
  }
}

// --- Lógica de Referidos y Puntos ---
if (copyReferralCodeBtn) {
  copyReferralCodeBtn.addEventListener("click", () => {
    referralCodeDisplay.select();
    document.execCommand("copy");
    showModal("Copiado", "¡Código de referido copiado al portapapeles!");
  });
}

document.querySelectorAll(".redeem-reward-btn").forEach((button) => {
  button.addEventListener("click", (e) => {
    if (!currentUser) {
      showModal("Error", "Debes iniciar sesión para canjear recompensas.");
      return;
    }
    const pointsNeeded = parseInt(e.currentTarget.dataset.points);
    const rewardName = e.currentTarget.dataset.reward;

    if (currentUser.loyaltyPoints >= pointsNeeded) {
      currentUser.loyaltyPoints -= pointsNeeded;
      saveCurrentUserState();
      updateUIAfterLogin(); // Actualizar puntos en UI
      showModal(
        "¡Recompensa Canjeada!",
        `Has canjeado "${rewardName}". Presenta este mensaje en la barbería.`
      );
    } else {
      showModal(
        "Puntos Insuficientes",
        `Necesitas ${pointsNeeded} puntos para "${rewardName}". ¡Sigue acumulando!`
      );
    }
  });
});

// --- Inicialización ---
function initApp() {
  // Cargar usuario logueado si existe
  const loggedInUser = localStorage.getItem(LOGGED_IN_USER_KEY);
  if (loggedInUser) {
    currentUser = JSON.parse(loggedInUser);
    // Validar que el usuario aún exista en la "BD" (por si se borró desde otro lado)
    const users = getUsers();
    const userExists = users.find((u) => u.id === currentUser.id);
    if (userExists) {
      currentUser = userExists; // Usar la versión más actualizada
      saveCurrentUserState(); // Guardar por si hubo cambios
      updateUIAfterLogin();
      navigateTo("dashboard-section");
    } else {
      handleLogout(); // Usuario no encontrado, limpiar sesión
    }
  } else {
    navigateTo("home-section"); // Por defecto, ir a inicio
  }

  // Asignar event listeners a formularios
  if (registerForm) registerForm.addEventListener("submit", handleRegister);
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (bookingForm) bookingForm.addEventListener("submit", handleBooking);

  // Logout
  if (navLogout) navLogout.addEventListener("click", handleLogout);
  if (mobileNavLogout) mobileNavLogout.addEventListener("click", handleLogout);

  // Modal close
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);

  // Validar fecha mínima en el input de fecha de reserva
  const today = new Date().toISOString().split("T")[0];
  if (document.getElementById("booking-date")) {
    document.getElementById("booking-date").setAttribute("min", today);
  }
}

// Ejecutar al cargar el DOM
document.addEventListener("DOMContentLoaded", initApp);
