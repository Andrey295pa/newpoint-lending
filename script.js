document.addEventListener('DOMContentLoaded', function () {
  // Бургер-меню
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  function setMenu(open) {
    burger.classList.toggle('active', open);
    nav.classList.toggle('active', open);
    burger.setAttribute('aria-expanded', open);
  }

  burger.addEventListener('click', function () {
    setMenu(!nav.classList.contains('active'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setMenu(false);
  });

  // Форми заявок (усі форми з атрибутом data-form) — відправка в Telegram через Netlify Function
  document.querySelectorAll('[data-form]').forEach(function (form) {
    const message = form.querySelector('.form-message');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const data = Object.fromEntries(new FormData(form).entries());
      const name = (data.name || '').trim();
      const phone = (data.phone || '').trim();
      const email = (data.email || '').trim();

      if (!name || !(phone || email)) {
        showMessage('Будь ласка, заповніть ім\'я та контакт.', 'error');
        return;
      }

      if (submitButton) submitButton.disabled = true;

      const formName = form.getAttribute('data-form-name') || 'Форма на сайті';

      fetch('/.netlify/functions/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone || '—', email: email, source: formName })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok || !data.success) {
              throw new Error(data.error || 'Не вдалося відправити заявку.');
            }
            showMessage('Дякуємо, ' + name + '! Ми зв\'яжемося з вами найближчим часом 🎉', 'success');
            form.reset();
          });
        })
        .catch(function (err) {
          console.error('Помилка відправки заявки:', err);
          showMessage('Сталася помилка. Спробуйте, будь ласка, ще раз або зателефонуйте нам.', 'error');
        })
        .finally(function () {
          if (submitButton) submitButton.disabled = false;
        });
    });

    function showMessage(text, type) {
      message.textContent = text;
      message.className = 'form-message ' + type;
    }
  });
});
