// Reform Athletics — site script
(function () {
  document.documentElement.classList.remove('no-js');

  // Reveal sections as they scroll into view
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Close mobile menu after tapping a link
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { var c = document.getElementById('menu-check'); if (c) c.checked = false; });
  });

  // Contact form: opens the visitor's email app with the inquiry pre-filled
  var form = document.getElementById('inquiry-form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = new FormData(form);
      var lines = [
        'Full name: ' + (f.get('name') || ''),
        'Email: ' + (f.get('email') || ''),
        'Phone: ' + (f.get('phone') || ''),
        'Preferred training type: ' + (f.get('type') || ''),
        'Primary fitness goal: ' + (f.get('goal') || ''),
        'Preferred training frequency: ' + (f.get('frequency') || ''),
        'General availability: ' + (f.get('availability') || ''),
        'Location / ZIP: ' + (f.get('zip') || ''),
        'Preferred contact method: ' + (f.get('contact_method') || ''),
        '',
        'Anything else: ' + (f.get('notes') || '')
      ];
      var subject = 'Training Inquiry — ' + (f.get('type') || 'Reform Athletics') + ' — ' + (f.get('name') || '');
      window.location.href = 'mailto:priscilla@reformathletics.net?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    });
  }
})();

// Newsletter forms: record when the form was shown (simple bot check)
document.querySelectorAll('.form-ts').forEach(function (el) { el.value = String(Date.now()); });
