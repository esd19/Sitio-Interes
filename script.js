// Interacción mínima para la sección dinámica
const chips = document.querySelectorAll('.chip');
const section = document.getElementById('dynamic-section');
const title = document.getElementById('dynamic-title');
const text = document.getElementById('dynamic-text');

const contenido = {
  tecnologia: {
    t: 'Tecnología — Tips rápidos',
    p: 'Mantén tus dependencias actualizadas y usa linters/formateadores automáticos. Versiona tu proyecto en GitHub para desplegarlo fácilmente en Render o Railway.'
  },
  ciencia: {
    t: 'Ciencia — Dato curioso',
    p: 'Los aceleradores de partículas ayudan a investigar el origen de la materia y la energía del universo. ¡La ciencia impulsa la tecnología!'
  },
  libros: {
    t: 'Libros — Recomendación',
    p: 'Explora “Clean Code” para aprender buenas prácticas de programación y mejorar la legibilidad de tu código.'
  },
  ciberseguridad: {
    t: 'Ciberseguridad — Buenas prácticas',
    p: 'Activa HTTPS, usa contraseñas fuertes y variables de entorno para secretos. Mantén logs y monitoreo en producción.'
  }
};

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    const key = chip.dataset.topic;
    const item = contenido[key];
    if(!item) return;
    section.hidden = false;
    title.textContent = item.t;
    text.textContent = item.p;
    section.scrollIntoView({behavior: 'smooth', block: 'start'});
  });
});
