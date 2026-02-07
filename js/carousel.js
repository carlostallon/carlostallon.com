// Carousel Interactive Controller
(function() {
  'use strict';

  // Verifica si el usuario prefiere movimiento reducido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Selecciona elementos del DOM
  const slides = document.querySelectorAll('.slide');
  const indicators = document.querySelectorAll('.indicator');
  const carouselContainer = document.querySelector('.carousel-container');
  const carousel = document.querySelector('.carousel');

  if (!slides.length || !indicators.length) return;

  let currentSlide = 0;
  let autoplayInterval = null;
  let isAutoplayPaused = false;

  // Función para mostrar un slide específico
  function showSlide(index) {
    // Asegura que el índice esté dentro del rango
    if (index < 0) {
      currentSlide = slides.length - 1;
    } else if (index >= slides.length) {
      currentSlide = 0;
    } else {
      currentSlide = index;
    }

    // Actualiza slides
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });

    // Actualiza indicadores
    indicators.forEach((indicator, i) => {
      const isActive = i === currentSlide;
      indicator.classList.toggle('active', isActive);
      indicator.setAttribute('aria-selected', isActive);
    });
  }

  // Función para ir al siguiente slide
  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  // Función para ir al slide anterior
  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  // Inicia el autoplay
  function startAutoplay() {
    if (prefersReducedMotion) return;

    stopAutoplay();
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  // Detiene el autoplay
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  // Event listeners para indicadores
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      showSlide(index);
      stopAutoplay();
      // Reinicia autoplay después de interacción
      setTimeout(startAutoplay, 3000);
    });
  });

  // Click en el carrusel para avanzar
  carouselContainer.addEventListener('click', () => {
    nextSlide();
    stopAutoplay();
    // Reinicia autoplay después de interacción
    setTimeout(startAutoplay, 3000);
  });

  // Pausa autoplay en hover
  carousel.addEventListener('mouseenter', () => {
    isAutoplayPaused = true;
    stopAutoplay();
  });

  carousel.addEventListener('mouseleave', () => {
    isAutoplayPaused = false;
    startAutoplay();
  });

  // Navegación con teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); // Evita scroll de página

      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else {
        nextSlide();
      }

      stopAutoplay();
      setTimeout(startAutoplay, 3000);
    }
  });

  // Inicializa el carrusel
  showSlide(0);

  // Inicia autoplay solo si no hay preferencia de movimiento reducido
  if (!prefersReducedMotion) {
    startAutoplay();
  }

  // Soporte para visibilidad de página (pausa cuando la pestaña no está visible)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else if (!isAutoplayPaused && !prefersReducedMotion) {
      startAutoplay();
    }
  });
})();
