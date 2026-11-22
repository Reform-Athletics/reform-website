/* Reform Athletics · 90-Day Roadmap
 * Quiz → contact gate → personal roadmap on screen + PDF download.
 * The lead (contact + answers) goes to the n8n workflow "Roadmap leads", which saves it in Twenty
 * and drafts Priscilla's follow-ups as tasks. Nothing on this page messages the lead.
 * No prices anywhere on this page, by design.
 */
(function () {
  'use strict';

  // ---------- Settings ----------
  var WEBHOOK_URL = 'https://n8n.crm.reformathletics.net/webhook/roadmap-lead';
  var BOOKING_URL = 'https://book.reformathletics.net/priss/free-consultation';
  var STORE_KEY = 'ra-roadmap-v1';
  var LOCAL = ['spring_hill', 'thompsons_station', 'franklin', 'brentwood', 'columbia', 'middle_tn'];

  // ---------- Questions ----------
  var QUESTIONS = [
    { id: 'goal', q: 'What do you want most from the next 90 days?', hint: 'Pick the one that matters most right now.', options: [
      ['fat', 'Lose body fat', 'Leaner, lighter, more in control'],
      ['muscle', 'Build muscle and shape', 'Glutes, arms, definition'],
      ['recomp', 'Lose fat and build muscle', 'Change how my body looks, not just the scale'],
      ['strength', 'Get stronger and have more energy', 'Feel capable and move better'],
      ['consistent', 'Get consistent and feel like myself again', 'Stop starting over']
    ] },
    { id: 'start', q: 'Where are you starting from?', hint: 'No wrong answer. This sets your first four weeks.', options: [
      ['new', 'Brand new to training', 'Or it has been years'],
      ['returning', 'Coming back after a break', 'I used to be consistent'],
      ['stuck', 'Training, but not seeing results', 'Putting in work, body isn’t changing'],
      ['consistent', 'Consistent and ready for the next level', 'I want structure and a coach']
    ] },
    { id: 'days', q: 'How many days a week can you realistically train?', hint: 'Choose what you can keep on a busy week, not a perfect one.', options: [
      ['2', '2 days'], ['3', '3 days'], ['4', '4 days'], ['5', '5 or more days']
    ] },
    { id: 'blockers', q: 'What has held you back before?', hint: 'Choose up to two.', multi: 2, options: [
      ['time', 'Not enough time'],
      ['know', 'Not knowing what to do'],
      ['consistency', 'Starting strong, then stopping'],
      ['nutrition', 'Nutrition'],
      ['mindset', 'Motivation, stress or mindset'],
      ['pain', 'A past injury or pain'],
      ['travel', 'Travel or a schedule that keeps changing']
    ] },
    { id: 'life', q: 'What does your week usually look like?', options: [
      ['parent', 'Parent life', 'Kids, activities, family first'],
      ['workdays', 'Long workdays', 'Career, meetings, little margin'],
      ['travel', 'I travel often', 'Hotels, airports, changing time zones'],
      ['shift', 'Shift work or military', 'Rotating hours, early mornings'],
      ['flexible', 'Fairly flexible', 'I can make time if I have a plan']
    ] },
    { id: 'nutrition', q: 'How would you describe your eating right now?', options: [
      ['none', 'No real structure', 'I eat when and what I can'],
      ['sometimes', 'I track sometimes', 'On and off, never for long'],
      ['eatwell', 'I eat pretty well, but nothing changes'],
      ['mealplan', 'I want it mapped out for me', 'Tell me exactly what to eat']
    ] },
    { id: 'style', q: 'How would you like to train?', options: [
      ['inhome', 'In my home', 'Priscilla comes to you'],
      ['gym', 'In the gym, one-on-one', 'Private sessions at a partner gym'],
      ['online', 'Online coaching', 'Your plan, check-ins and coaching from anywhere'],
      ['hybrid', 'Hybrid', 'Online coaching plus in-person sessions'],
      ['unsure', 'Not sure yet', 'Recommend what fits me']
    ] },
    { id: 'area', q: 'Where are you based?', hint: 'In-person training covers Middle Tennessee. Online coaching works anywhere.',
      when: function (a) { return a.style !== 'online'; }, options: [
      ['spring_hill', 'Spring Hill'], ['thompsons_station', 'Thompson’s Station'], ['franklin', 'Franklin'], ['brentwood', 'Brentwood'],
      ['columbia', 'Columbia'], ['middle_tn', 'Elsewhere in Middle Tennessee'], ['outside', 'Outside Middle Tennessee']
    ] },
    { id: 'timing', q: 'When do you want to start?', options: [
      ['now', 'This week', 'I’m ready'],
      ['month', 'Within the next month'],
      ['exploring', 'Just exploring for now']
    ] }
  ];
  var QMAP = {}; QUESTIONS.forEach(function (q) { QMAP[q.id] = q; });
  function label(id, val) {
    var q = QMAP[id]; if (!q) return val;
    for (var i = 0; i < q.options.length; i++) if (q.options[i][0] === val) return q.options[i][1];
    return val;
  }

  // ---------- Roadmap engine (plain rules, same answers → same roadmap) ----------
  var GOALS = {
    fat: { line: 'losing body fat in a way you can actually keep', short: 'Fat loss',
      p1: 'Build the habits that make fat loss automatic: training on your days, protein at every meal, and a calorie target you can live with.',
      p2: 'Progress the training and tighten the nutrition. This is where the scale and your clothes start moving together.',
      p3: 'Lock it in. Higher training standards, fewer decisions, and a plan to keep the results past day 90.',
      fuel: 'a moderate calorie deficit with protein first, so you lose fat and keep your muscle' },
    muscle: { line: 'building real muscle and shape', short: 'Muscle and shape',
      p1: 'Own the movements and find your working weights. Muscle is built on form you can load.',
      p2: 'Progressive overload: more weight, more reps or more control every week, with extra focus on the areas you want to shape.',
      p3: 'Push your best lifts and refine the details. You finish stronger, fuller and more defined than you started.',
      fuel: 'enough food to grow, with protein at every meal and carbs around your training' },
    recomp: { line: 'losing fat while you build muscle', short: 'Body recomposition',
      p1: 'Lift with intent from day one and set a small, steady deficit. You change shape before the scale tells the whole story.',
      p2: 'Heavier training, sharper nutrition. Measurements and photos start showing what the scale can’t.',
      p3: 'Peak strength and definition, then set the standard you carry into your next 90 days.',
      fuel: 'a slight deficit with high protein, so you lose fat and build muscle at the same time' },
    strength: { line: 'getting stronger with energy to spare', short: 'Strength and energy',
      p1: 'Learn the big patterns (squat, hinge, push, pull, carry) at a weight that feels good, and fix your sleep and fuel.',
      p2: 'Steady strength progressions and conditioning that gives you energy instead of draining it.',
      p3: 'Test your strength, see how far you’ve come, and set your next targets.',
      fuel: 'consistent meals that fuel performance: protein, smart carbs, water and enough total food' },
    consistent: { line: 'becoming someone who doesn’t restart, but resumes', short: 'Consistency and confidence',
      p1: 'Small, non-negotiable standards you keep every single week. Keeping promises to yourself is the first result.',
      p2: 'Raise the standard: more structure in training and food, and a plan for your hardest weeks.',
      p3: 'By now it’s who you are. We refine the plan so it carries you through any season.',
      fuel: 'consistent meals over perfect meals: protein, water and one planned meal a day to start' }
  };
  var START = {
    new: 'Your first month is about learning the movements, owning your form and making training a habit. Nothing extreme.',
    returning: 'We rebuild momentum without overdoing it, so you come back stronger instead of sore and discouraged.',
    stuck: 'We change the stimulus, track what matters and find the gap that has been keeping your body from changing.',
    consistent: 'You already show up. Now we add structure, progressive overload and coaching to break through.'
  };
  var SPLITS = {
    '2': { days: [0, 3], names: ['Full body A', 'Full body B'] },
    '3': { days: [0, 2, 4], names: ['Lower body', 'Upper body', 'Full body'] },
    '4': { days: [0, 1, 3, 4], names: ['Lower body', 'Upper body', 'Lower body', 'Upper body'] },
    '5': { days: [0, 1, 2, 4, 5], names: ['Lower body', 'Upper body', 'Conditioning + core', 'Lower body', 'Upper body'] }
  };
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var BLOCKERS = {
    time: ['Not enough time', 'Sessions are built for the time you actually have, plus a worst-day minimum of 20 minutes, so a busy day never turns into a zero.'],
    know: ['Not knowing what to do', 'Every session is written for you. You walk in knowing exactly what to do, how much, and why.'],
    consistency: ['Starting strong, then stopping', 'We don’t restart, we resume. Check-ins and a plan for your hardest weeks keep one missed day from becoming a missed month.'],
    nutrition: ['Nutrition', 'Simple standards first, then numbers that fit your life. No extreme cutting, no foods you have to give up forever.'],
    mindset: ['Motivation, stress or mindset', 'Coaching covers the mental and emotional side too: the stress, stories and habits that quietly stall progress.'],
    pain: ['A past injury or pain', 'We start with a movement assessment and build around what your body needs before we add load. Please clear anything medical with your doctor first.'],
    travel: ['Travel or a changing schedule', 'You get a travel version of your plan (hotel gym or room) so trips don’t break your streak.']
  };
  var LIFE = {
    parent: 'Your plan works around school runs, practices and bedtime. I’m a mom too, so I build for real family weeks, not ideal ones.',
    workdays: 'Your sessions are planned like meetings that don’t get cancelled: set days, set times, and a short version for the long days.',
    travel: 'Your plan travels with you, with hotel-gym and no-equipment versions ready before you pack.',
    shift: 'A rotating schedule is part of the plan, not an excuse. As an Army officer, I know what it takes to meet a standard on short sleep.',
    flexible: 'Flexibility is an advantage once there’s a plan. We put your sessions on the calendar so “I’ll find time” becomes “it’s done.”'
  };
  var FUEL1 = {
    none: 'Start with three standards: protein at every meal, a daily water target, and one planned meal a day.',
    sometimes: 'Track four days a week (not seven) to learn your patterns without burning out.',
    eatwell: 'We find the gap. Usually it’s protein, portions or weekends, and small fixes there change everything.',
    mealplan: 'Your meals mapped out so there’s no guessing. We’ll set this up together on your consult.'
  };
  var STYLES = {
    inhome: ['In-home concierge training', 'I come to you with everything you need. No commute, no gym crowds, and a session that fits between everything else on your day.'],
    gym: ['Private in-gym training', 'One-on-one sessions at partner gyms in Spring Hill, Franklin and Columbia, with me coaching every rep.'],
    online: ['Online coaching', 'Your custom plan in your pocket, check-ins on your progress, and direct access to me, from anywhere.'],
    hybrid: ['Hybrid coaching', 'Online coaching for the structure, plus in-person sessions with me when you want hands-on coaching.']
  };

  function pickStyle(a) {
    var local = LOCAL.indexOf(a.area) > -1;
    var bl = a.blockers || [];
    if (a.style === 'online') return { key: 'online', why: '' };
    if (!local && a.area) return { key: 'online', why: 'In-person training covers Middle Tennessee, so online coaching gives you the same custom plan and accountability wherever you are.' };
    if (a.style !== 'unsure') return { key: a.style, why: '' };
    if (a.life === 'travel' || bl.indexOf('travel') > -1) return { key: local ? 'hybrid' : 'online', why: 'You travel, so your plan needs to go where you go. Online keeps you on track on the road, and in-person sessions sharpen things when you’re home.' };
    if (bl.indexOf('pain') > -1 || a.start === 'new') return { key: 'gym', why: 'Starting with me beside you means your form is right from day one and we can build around anything your body needs.' };
    if (a.life === 'parent' || bl.indexOf('time') > -1) return { key: 'inhome', why: 'Time is the biggest barrier, so we remove the commute. Training at home makes the session easy to keep.' };
    return { key: 'hybrid', why: 'You get daily structure online, plus in-person sessions to push harder and refine your form.' };
  }

  function tierOf(a) {
    if (a.timing === 'now') return 'Hot';
    if (a.timing === 'exploring') return 'Exploring';
    return 'Warm';
  }

  function build(a) {
    var g = GOALS[a.goal] || GOALS.consistent;
    var split = SPLITS[a.days] || SPLITS['3'];
    var bl = (a.blockers || []).slice(0, 2);
    var style = pickStyle(a);
    var mindset1 = bl.indexOf('mindset') > -1 ? 'Write down why this matters to you, and set one non-negotiable for your hardest day.'
      : bl.indexOf('consistency') > -1 ? 'One rule: never miss twice. A missed day gets a 20-minute minimum the next day.'
      : 'Set your worst-day minimum: the smallest version of your plan you’ll do no matter what.';
    var phases = [
      { name: 'Foundation', weeks: 'Weeks 1–4', focus: g.p1, training: START[a.start] || START.new,
        fuel: (FUEL1[a.nutrition] || FUEL1.none), mind: mindset1,
        win: 'You’ve trained ' + a.days + (a.days === '5' ? '+' : '') + ' days a week for four weeks straight, and you know your plan cold.' },
      { name: 'Build', weeks: 'Weeks 5–8', focus: g.p2,
        training: 'Your program updates. Weights, reps or tempo progress every week so your body keeps adapting.',
        fuel: 'Dial in your numbers for ' + g.fuel + '.',
        mind: 'Plan for your hardest week before it happens: travel, a sick kid, a deadline. The plan bends; it doesn’t break.',
        win: a.goal === 'fat' || a.goal === 'recomp' ? 'Your measurements and progress photos show real change, and your clothes fit differently.'
          : a.goal === 'muscle' ? 'Your working weights are clearly up from week 1, and you can see the shape changing.'
          : a.goal === 'strength' ? 'Your lifts are up and your energy holds through the whole day.'
          : 'Training is part of your week, not something you have to talk yourself into.' },
      { name: 'Reform', weeks: 'Weeks 9–12', focus: g.p3,
        training: 'Your strongest block yet, then a test week to measure how far you’ve come.',
        fuel: 'Nutrition becomes second nature: you know what to eat on a normal day, a busy day and a day out.',
        mind: 'Set your next standard. You fall to your standard, so we raise it before day 90.',
        win: 'Day 90: you’re ' + ({ fat: 'leaner and in control of your nutrition', muscle: 'stronger and visibly more shaped', recomp: 'leaner, stronger and more defined', strength: 'stronger, fitter and full of energy', consistent: 'consistent, confident and fully back in your rhythm' }[a.goal] || 'consistent and confident') + ', with a plan for what comes next.' }
    ];
    // What's covered, how it feels, and the phase guarantee (shown when a phase is opened)
    var daysTxt = a.days === '5' ? '5 or more days' : a.days + ' days';
    var blockLine = {
      time: 'Sessions built for the time you actually have, with a 20-minute version for the crazy days',
      know: 'Every session written for you, so you never walk in wondering what to do',
      consistency: 'A plan for missed days, so one off day never turns into starting over',
      nutrition: 'Simple nutrition standards you can keep, not a diet you have to survive',
      mindset: 'Coaching on the mental side: stress, self-talk and the habits that quietly stall you',
      pain: 'Training built around what your body needs, cleared with your doctor where needed',
      travel: 'Hotel-gym and no-equipment versions of your plan, ready before you pack'
    };
    var feel2 = {
      fat: 'This is when it gets real. Your clothes fit differently, the scale and the mirror start agreeing, and you catch yourself trusting your own word again.',
      recomp: 'This is when it gets real. Your clothes fit differently, you see shape where there wasn’t any, and the mirror starts telling a better story than the scale.',
      muscle: 'This is when it gets real. Weights that felt heavy feel easy, you see shape in the mirror, and you start to look like you train.',
      strength: 'This is when it gets real. Stairs, kids, long days: everything feels lighter, and you have energy left at the end of the day.',
      consistent: 'This is when it gets real. You stop needing motivation because the habit carries you, and you start trusting yourself again.'
    };
    phases[0].tagline = 'Stop guessing. Start keeping promises to yourself.';
    phases[0].feel = 'The relief of finally knowing exactly what to do. No more Monday restarts, no more piecing together plans from the internet. Just a plan that fits your real life and a coach in your corner.';
    phases[0].covered = [
      'A movement assessment, so your plan fits how your body moves today',
      'Your custom program for ' + daysTxt + ' a week, every session written for you',
      'Your first nutrition standards: ' + (FUEL1[a.nutrition] || FUEL1.none).replace(/\.$/, '').toLowerCase().replace(/^start with three standards: /, ''),
      bl[0] ? blockLine[bl[0]] : 'Your worst-day minimum, so busy weeks never turn into zero weeks',
      'Coaching check-ins, so you always know it’s working'
    ];
    phases[0].guarantee = { title: 'The Fit Guarantee',
      text: 'If your plan doesn’t fit your real life in the first two weeks, I rebuild it around your schedule at no extra cost.',
      fine: 'Applies to active Reform Athletics coaching clients. Request the rebuild by the end of week 2. Covers program changes only, not refunds or session credits.' };

    phases[1].tagline = 'Where the work starts showing.';
    phases[1].feel = feel2[a.goal] || feel2.consistent;
    phases[1].covered = [
      'Your program progresses as you get stronger, so your body keeps changing',
      'Nutrition dialed in for ' + g.fuel,
      'Progress tracked beyond the scale: measurements, photos and strength',
      bl[1] ? blockLine[bl[1]] : 'A plan for your hardest weeks: travel, a sick kid, a deadline',
      'The mental side too: the stress, stories and habits that usually stall people here'
    ];
    phases[1].guarantee = { title: 'The Progress Guarantee',
      text: 'Follow the plan and you’ll see measurable progress by week 8. If not, I change your program and add extra check-ins at no extra cost until you do.',
      fine: 'Measurable progress means improvement in at least one of: body measurements, progress photos, strength numbers or body-weight trend toward your goal. Requires completing at least 80% of scheduled sessions, logging workouts and nutrition as assigned, and attending check-ins. Extra check-ins run up to 4 additional weeks. No refunds; specific results are not guaranteed.' };

    phases[2].tagline = 'Become the person who doesn’t restart.';
    phases[2].feel = 'You’re not chasing motivation anymore. You set a standard and you keep it, on the good weeks and the hard ones. That’s the version of you that lasts past day 90.';
    phases[2].covered = [
      'Your strongest training block, then a test week to see how far you’ve come',
      'Nutrition that works on a normal day, a busy day and a day out',
      'Your 90-day review: side-by-side progress and what changed',
      'Your next 90-day plan, so day 91 is a step forward, not a restart'
    ];
    phases[2].guarantee = { title: 'The No-Restart Guarantee',
      text: 'Finish your 12 weeks and your next 90-day plan is built and ready before day 90, so you never start from zero.',
      fine: 'Applies to clients active through week 12. The plan is delivered by your final check-in of the 12 weeks. Coaching after week 12 continues at your current rate.' };

    var week = DAYS.map(function (d, i) {
      var k = split.days.indexOf(i);
      return { day: d, on: k > -1, what: k > -1 ? split.names[k] : (i === 6 ? 'Rest + reset' : 'Walk + recover') };
    });
    return {
      goal: g, goalKey: a.goal, phases: phases, week: week, blockers: bl.map(function (b) { return BLOCKERS[b]; }).filter(Boolean),
      life: LIFE[a.life] || '', style: style, styleInfo: STYLES[style.key], tier: tierOf(a)
    };
  }

  // ---------- State ----------
  var answers = {};
  var person = { first: '' };
  var step = 0;
  var $ = function (id) { return document.getElementById(id); };
  var visible = function () { return QUESTIONS.filter(function (q) { return !q.when || q.when(answers); }); };

  function show(id) {
    ['intro', 'quiz', 'gate', 'roadmap'].forEach(function (s) { $(s).classList.toggle('hidden', s !== id); });
    $('back').classList.toggle('hidden', id === 'intro' || id === 'roadmap');
    window.scrollTo(0, 0);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function renderQuestion() {
    var qs = visible(), q = qs[step];
    $('bar').style.width = Math.round((step / (qs.length + 1)) * 100) + '%';
    var sel = answers[q.id];
    var html = '<div class="screen"><p class="count">Question ' + (step + 1) + ' of ' + qs.length + '</p>' +
      '<h2 class="q" id="qt">' + esc(q.q) + '</h2>' + (q.hint ? '<p class="hint">' + esc(q.hint) + '</p>' : '') +
      '<div class="opts" role="group" aria-labelledby="qt">';
    q.options.forEach(function (o) {
      var on = q.multi ? (sel || []).indexOf(o[0]) > -1 : sel === o[0];
      html += '<button type="button" class="opt' + (q.multi ? ' multi' : '') + '" data-v="' + o[0] + '" aria-pressed="' + on + '">' +
        '<span class="mark" aria-hidden="true"></span><span class="txt">' + esc(o[1]) + (o[2] ? '<small>' + esc(o[2]) + '</small>' : '') + '</span></button>';
    });
    html += '</div>';
    if (q.multi) html += '<button type="button" class="btn next" id="cont"' + ((sel || []).length ? '' : ' disabled') + '>Continue</button>';
    html += '</div>';
    $('qbox').innerHTML = html;

    Array.prototype.forEach.call($('qbox').querySelectorAll('.opt'), function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-v');
        if (q.multi) {
          var arr = (answers[q.id] || []).slice(), i = arr.indexOf(v);
          if (i > -1) arr.splice(i, 1); else { if (arr.length >= q.multi) arr.shift(); arr.push(v); }
          answers[q.id] = arr;
          Array.prototype.forEach.call($('qbox').querySelectorAll('.opt'), function (x) { x.setAttribute('aria-pressed', arr.indexOf(x.getAttribute('data-v')) > -1); });
          $('cont').disabled = !arr.length;
        } else {
          answers[q.id] = v;
          if (q.id === 'style' && v === 'online') delete answers.area;
          Array.prototype.forEach.call($('qbox').querySelectorAll('.opt'), function (x) { x.setAttribute('aria-pressed', x === b); });
          setTimeout(advance, 180);
        }
      });
    });
    if (q.multi) $('cont').addEventListener('click', advance);
    var h = $('qt'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  function advance() {
    if (step < visible().length - 1) { step++; renderQuestion(); window.scrollTo(0, 0); }
    else openGate();
  }
  function goBack() {
    if (!$('gate').classList.contains('hidden')) { show('quiz'); step = visible().length - 1; renderQuestion(); return; }
    if (step > 0) { step--; renderQuestion(); } else show('intro');
  }
  function openGate() {
    var g = GOALS[answers.goal];
    $('gate-preview').textContent = 'Your 90 days to ' + (g ? g.short.toLowerCase() : 'your goal');
    show('gate');
    try { $('first').focus({ preventScroll: true }); } catch (e) {}
  }

  // ---------- Share token (answers + first name only; no contact details) ----------
  function encodeToken(a, first) {
    var json = JSON.stringify({ v: 1, n: first, a: a });
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeToken(t) {
    try {
      var s = t.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
      var o = JSON.parse(decodeURIComponent(escape(atob(s))));
      if (!o || !o.a || !o.a.goal) return null;
      return o;
    } catch (e) { return null; }
  }
  function viewUrl(a, first) { return 'https://reformathletics.net/roadmap/?r=' + encodeToken(a, first); }

  function bookingUrl(p) {
    var q = new URLSearchParams();
    if (p.name) q.set('name', p.name);
    if (p.email) q.set('email', p.email);
    q.set('notes', 'From my 90-Day Roadmap: ' + label('goal', answers.goal) + '.');
    q.set('utm_source', 'roadmap');
    return BOOKING_URL + '?' + q.toString();
  }

  // ---------- Roadmap render ----------
  function renderRoadmap(a, p, opts) {
    opts = opts || {};
    var r = build(a);
    var first = p.first || '';
    var h = '';
    h += '<div class="rm-head"><p class="eyebrow">' + (opts.shared ? 'A 90-Day Roadmap prepared for ' + esc(first || 'you') : 'Your 90-Day Roadmap') + '</p>';
    h += '<h1>' + (first ? esc(first) + ', here’s your <em>next 90 days.</em>' : 'Your <em>next 90 days.</em>') + '</h1>';
    h += '<p class="rm-sub">The path to ' + esc(r.goal.line) + '.</p>';
    h += '<div class="chips"><span class="chip">' + esc(r.goal.short) + '</span><span class="chip">' + esc(label('days', a.days)) + ' a week</span><span class="chip">' + esc(r.styleInfo[0]) + '</span></div>';
    h += '<div class="actions"><a class="btn" href="' + esc(bookingUrl(p)) + '" id="book-top">Book my free consult</a><button class="btn ghost" type="button" id="dl">Download my roadmap</button></div></div>';

    // ---- The road: a winding path with three tappable phase stops; the chosen phase opens below ----
    var NODES = [[60, 26], [272, 138], [68, 262], [272, 378], [160, 468]];
    var ROAD = 'M60,26 C60,96 272,70 272,138 C272,206 68,192 68,262 C68,330 272,312 272,378 C272,440 160,420 160,468';
    h += '<section class="sec rv"><p class="eyebrow">Your road to day 90</p><h2>Three phases. <em>One you, reformed.</em></h2><p class="k">Tap a phase to see what’s covered, how it feels and what I guarantee.</p>';
    h += '<div class="map" id="map"><svg viewBox="0 0 340 500" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2b4a2"/><stop offset=".5" stop-color="#c08a78"/><stop offset="1" stop-color="#9c7463"/></linearGradient>' +
      '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs>' +
      '<path class="r-edge" d="' + ROAD + '"/><path class="r-bed" d="' + ROAD + '"/><path class="r-lane" d="' + ROAD + '"/>' +
      '<path class="r-done" id="rdone" d="' + ROAD + '"/>' +
      '<circle class="r-glow" id="rglow" r="13" filter="url(#glow)"/><circle class="r-dot" id="rdot" r="6"/></svg>';
    function pos(n) { return 'left:' + (NODES[n][0] / 340 * 100) + '%;top:' + (NODES[n][1] / 500 * 100) + '%'; }
    h += '<div class="m-end m-start" style="' + pos(0) + '"><span class="m-pin"></span><span class="m-lab r"><b>Today</b>' + esc(label('start', a.start)) + '</span></div>';
    r.phases.forEach(function (ph, i) {
      var side = NODES[i + 1][0] > 170 ? 'l' : 'r';
      h += '<button type="button" class="m-stop" data-i="' + i + '" style="' + pos(i + 1) + '" aria-controls="phase-panel" aria-pressed="false">' +
        '<span class="m-ring"></span><span class="m-num">0' + (i + 1) + '</span>' +
        '<span class="m-lab ' + side + '"><b>' + esc(ph.weeks) + '</b><strong>' + esc(ph.name) + '</strong></span></button>';
    });
    h += '<div class="m-end m-finish" style="' + pos(4) + '"><span class="m-pin"></span><span class="m-lab c"><b>Day 90</b>' + esc(r.goal.short) + ', reformed</span></div></div>';
    h += '<div class="panel" id="phase-panel" aria-live="polite"></div>';
    h += '<p class="g-all">Guarantees apply to paid Reform Athletics coaching programs, not this free roadmap, and are set out in full in your service agreement. Results vary with starting point, consistency and individual factors.</p></section>';

    h += '<section class="sec rv"><h2>Your training week</h2><p class="k">' + esc(label('days', a.days)) + ', 45 to 60 minutes each. Your exact sessions are written for you once we’ve assessed how you move.</p><div class="week">';
    r.week.forEach(function (d) { h += '<div class="day' + (d.on ? ' on' : '') + '"><b>' + d.day.toUpperCase() + '</b><span>' + esc(d.what) + '</span></div>'; });
    h += '</div><p class="weeknote">Days can move to fit your week. What matters is the number you keep.</p></section>';

    h += '<section class="sec rv"><h2>What stopped you before, handled</h2><p class="k">The plan is built around these from day one.</p><div class="blocks">';
    r.blockers.forEach(function (b) { h += '<div class="block"><h3>' + esc(b[0]) + '</h3><p>' + esc(b[1]) + '</p></div>'; });
    if (r.life) h += '<div class="block"><h3>Built for your life</h3><p>' + esc(r.life) + '</p></div>';
    h += '</div></section>';

    h += '<section class="sec rv"><h2>Your best fit</h2><p class="k">How you’ll train to make this happen.</p><div class="fit"><p class="tag">' + (a.style === 'unsure' || r.style.why ? 'My recommendation' : 'Your choice') + '</p>' +
      '<h3>' + esc(r.styleInfo[0]) + '</h3><p>' + esc(r.styleInfo[1]) + '</p>' + (r.style.why ? '<p>' + esc(r.style.why) + '</p>' : '') + '</div></section>';

    if (a.goal === 'fat' || a.goal === 'recomp') {
      h += '<p class="proof">On average, my clients lose 10 to 15 pounds in their first four weeks.<small>Individual results vary with starting point and consistency.</small></p>';
    }

    var ctaHead = r.tier === 'Exploring' ? 'When you’re ready, <em>we build it together.</em>' : 'Let’s turn this into <em>your plan.</em>';
    h += '<section class="cta rv"><p class="eyebrow">Your next step</p><h2>' + ctaHead + '</h2>' +
      '<p>This roadmap is the outline. On a free consult, we turn it into your actual plan, together:</p>' +
      '<ul><li>Your training days and the sessions that go in them</li><li>Your nutrition targets, set for your goal and your life</li><li>Your first four weeks, mapped out before you start</li></ul>' +
      '<a class="btn" href="' + esc(bookingUrl(p)) + '" id="book">Book my free consult</a>' +
      '<button class="btn ghost" type="button" id="dl2">Download my roadmap</button></section>';

    h += '<div class="sign"><img src="/assets/priscilla.webp" alt=""><p><b>Priscilla Claude, CPT, CN</b>Certified Personal Trainer and Nutritionist · Army officer · Mom · Founder, Reform Athletics</p></div>';
    h += '<p class="disc">This roadmap is general guidance based on your answers, not medical advice. Talk with your doctor before starting a new exercise or nutrition program, especially if you have an injury, a health condition or are pregnant.</p>';

    var el = $('roadmap'); el.innerHTML = h; show('roadmap');
    setupMap(el, r, NODES);
    reveal(el);
    $('dl').addEventListener('click', function () { downloadPdf(a, p, r); });
    $('dl2').addEventListener('click', function () { downloadPdf(a, p, r); });
    ['book', 'book-top'].forEach(function (id) { $(id).addEventListener('click', function () { track('roadmap-book'); }); });
    try { $('app').focus({ preventScroll: true }); } catch (e) {}
  }

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function phasePanel(ph, i) {
    return '<div class="pp" data-i="' + i + '">' +
      '<div class="pp-head"><span class="pp-n">0' + (i + 1) + '</span><div><p class="pp-wk">Phase ' + (i + 1) + ' of 3 · ' + esc(ph.weeks) + '</p><h3>' + esc(ph.name) + '</h3></div></div>' +
      '<p class="pp-tag">' + esc(ph.tagline) + '</p>' +
      '<blockquote class="feel">' + esc(ph.feel) + '</blockquote>' +
      '<p class="lbl">What’s covered</p><ul class="cov">' + ph.covered.map(function (c, k) { return '<li style="--d:' + (k * 70 + 120) + 'ms">' + esc(c) + '</li>'; }).join('') + '</ul>' +
      '<div class="pp-win"><span>Milestone</span><p>' + esc(ph.win) + '</p></div>' +
      '<div class="seal"><svg class="seal-badge" viewBox="0 0 80 80" aria-hidden="true"><defs><path id="sc' + i + '" d="M40,40 m-29,0 a29,29 0 1,1 58,0 a29,29 0 1,1 -58,0"/></defs>' +
        '<circle cx="40" cy="40" r="38" fill="none" stroke="#c08a78" stroke-width="1.2"/><circle cx="40" cy="40" r="21" fill="none" stroke="#c08a78" stroke-width=".8"/>' +
        '<text><textPath href="#sc' + i + '" startOffset="0" textLength="180" lengthAdjust="spacing">GUARANTEED · REFORM ATHLETICS · </textPath></text>' +
        '<text x="40" y="46" text-anchor="middle" class="seal-n">0' + (i + 1) + '</text></svg>' +
        '<div><p class="seal-k">Your guarantee</p><h4>' + esc(ph.guarantee.title) + '</h4><p>' + esc(ph.guarantee.text) + '</p></div>' +
        '<details class="fine-d"><summary>Fine print</summary><p>' + esc(ph.guarantee.fine) + '</p></details></div>' +
      '<div class="pp-nav">' + (i > 0 ? '<button type="button" class="pp-go" data-go="' + (i - 1) + '">&larr; ' + 'Phase ' + i + '</button>' : '<span></span>') +
        (i < 2 ? '<button type="button" class="pp-go pp-next" data-go="' + (i + 1) + '">Phase ' + (i + 2) + ' &rarr;</button>' : '<a class="pp-go pp-next" href="#book">Start at Phase 1 &rarr;</a>') + '</div></div>';
  }

  function setupMap(root, r, NODES) {
    var map = root.querySelector('#map'), path = root.querySelector('#rdone'), dot = root.querySelector('#rdot'), glow = root.querySelector('#rglow');
    var panel = root.querySelector('#phase-panel'), stops = root.querySelectorAll('.m-stop');
    var L = path.getTotalLength(), at = [], cur = 0, anim;
    // length along the road for each stop
    NODES.forEach(function (n) {
      var best = 0, bd = 1e9;
      for (var t = 0; t <= L; t += 2) { var pt = path.getPointAtLength(t), d = (pt.x - n[0]) * (pt.x - n[0]) + (pt.y - n[1]) * (pt.y - n[1]); if (d < bd) { bd = d; best = t; } }
      at.push(best);
    });
    path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
    function place(len) {
      var pt = path.getPointAtLength(len);
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); glow.setAttribute('cx', pt.x); glow.setAttribute('cy', pt.y);
      path.style.strokeDashoffset = L - len; cur = len;
    }
    function travel(to, ms) {
      cancelAnimationFrame(anim);
      if (REDUCED || !ms) { place(to); return; }
      var from = cur, t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        place(from + (to - from) * e); if (k < 1) anim = requestAnimationFrame(step);
      })(performance.now());
    }
    function select(i, scroll) {
      Array.prototype.forEach.call(stops, function (b) { var on = +b.getAttribute('data-i') <= i; b.classList.toggle('reached', on); b.classList.toggle('current', +b.getAttribute('data-i') === i); b.setAttribute('aria-pressed', +b.getAttribute('data-i') === i); });
      map.classList.add('touched');
      travel(at[i + 1], 900);
      panel.innerHTML = phasePanel(r.phases[i], i);
      Array.prototype.forEach.call(panel.querySelectorAll('.pp-go[data-go]'), function (g) { g.addEventListener('click', function () { select(+g.getAttribute('data-go'), true); }); });
      if (scroll) { var y = map.getBoundingClientRect().top + window.pageYOffset - 70; window.scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' }); }
      track('roadmap-phase-' + (i + 1));
    }
    Array.prototype.forEach.call(stops, function (b) { b.addEventListener('click', function () { select(+b.getAttribute('data-i')); }); });
    place(0);
    // When the map scrolls into view: draw the road to Phase 1 and open it
    var started = false;
    function start() { if (started) return; started = true; map.classList.add('drawn'); setTimeout(function () { select(0); map.classList.remove('touched'); }, REDUCED ? 0 : 500); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { start(); io.disconnect(); } }, { threshold: .35 });
      io.observe(map);
    } else start();
  }

  function reveal(root) {
    var els = root.querySelectorAll('.rv');
    if (REDUCED || !('IntersectionObserver' in window)) { Array.prototype.forEach.call(els, function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .12 });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }

  function track(name) { try { if (window.umami) window.umami.track(name); } catch (e) {} }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200);
  }

  // ---------- PDF (built on the phone with jsPDF; fonts are the site's own Bodoni Moda + Jost) ----------
  var pdfLibs = null;
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function fetchB64(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (buf) {
      var bytes = new Uint8Array(buf), bin = '', CH = 0x8000;
      for (var i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      return btoa(bin);
    });
  }
  function imgData(url) {
    return new Promise(function (res) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { try { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); res(c.toDataURL('image/png')); } catch (e) { res(null); } };
      im.onerror = function () { res(null); }; im.src = url;
    });
  }
  function libs() {
    if (pdfLibs) return pdfLibs;
    var L = '/roadmap/lib/';
    pdfLibs = Promise.all([
      window.jspdf ? Promise.resolve() : loadScript(L + 'jspdf.umd.min.js'),
      fetchB64(L + 'BodoniModa_500Medium.ttf'), fetchB64(L + 'BodoniModa_400Regular_Italic.ttf'),
      fetchB64(L + 'Jost_300Light.ttf'), fetchB64(L + 'Jost_400Regular.ttf'), fetchB64(L + 'Jost_500Medium.ttf'),
      imgData('/assets/ra-mark.png')
    ]).catch(function (e) { pdfLibs = null; throw e; });
    return pdfLibs;
  }

  function downloadPdf(a, p, r) {
    track('roadmap-download');
    var btns = [$('dl'), $('dl2')]; btns.forEach(function (b) { if (b) { b.disabled = true; b.textContent = 'Preparing…'; } });
    libs().then(function (out) {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ unit: 'pt', format: 'letter' });
      var F = [['BodoniModa_500Medium.ttf', 'Bodoni', 'normal', out[1]], ['BodoniModa_400Regular_Italic.ttf', 'Bodoni', 'italic', out[2]],
        ['Jost_300Light.ttf', 'Jost', 'light', out[3]], ['Jost_400Regular.ttf', 'Jost', 'normal', out[4]], ['Jost_500Medium.ttf', 'Jost', 'bold', out[5]]];
      F.forEach(function (f) { doc.addFileToVFS(f[0], f[3]); doc.addFont(f[0], f[1], f[2]); });
      var logo = out[6];
      var W = 612, H = 792, M = 54, CW = W - M * 2, y = 0;
      var INK = [11, 11, 12], ROSE = [192, 138, 120], DEEP = [156, 116, 99], IVORY = [243, 242, 240], GREY = [92, 86, 83], TEXT = [40, 37, 35];

      function bg() { doc.setFillColor(IVORY[0], IVORY[1], IVORY[2]); doc.rect(0, 0, W, H, 'F'); }
      function footer() {
        doc.setFont('Jost', 'normal'); doc.setFontSize(8.5); doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text('Reform Athletics · reformathletics.net · Every Rep. Every Choice. Reformed.', W / 2, H - 28, { align: 'center' });
      }
      function newPage() { doc.addPage(); bg(); footer(); y = M; }
      function need(h) { if (y + h > H - 56) newPage(); }
      function text(str, o) {
        o = o || {};
        doc.setFont(o.font || 'Jost', o.style || 'normal'); doc.setFontSize(o.size || 10.5);
        var c = o.color || TEXT; doc.setTextColor(c[0], c[1], c[2]);
        var lines = doc.splitTextToSize(str, o.width || CW), lh = (o.size || 10.5) * (o.lh || 1.45);
        need(lines.length * lh);
        doc.text(lines, o.x || M, y + (o.size || 10.5)); y += lines.length * lh + (o.after == null ? 6 : o.after);
      }
      function eyebrow(str, c) { text(str.toUpperCase(), { size: 8, style: 'bold', color: c || DEEP, after: 4, lh: 1.2 }); }

      // Cover band
      bg();
      doc.setFillColor(INK[0], INK[1], INK[2]); doc.rect(0, 0, W, 250, 'F');
      if (logo) { try { doc.addImage(logo, 'PNG', M, 40, 34, 34); } catch (e) {} }
      doc.setFont('Jost', 'bold'); doc.setFontSize(8.5); doc.setTextColor(IVORY[0], IVORY[1], IVORY[2]);
      doc.text('REFORM ATHLETICS', M + (logo ? 44 : 0), 61, { charSpace: 2.2 });
      doc.setTextColor(ROSE[0], ROSE[1], ROSE[2]); doc.text('YOUR 90-DAY ROADMAP', M, 116, { charSpace: 2 });
      doc.setFont('Bodoni', 'normal'); doc.setFontSize(34); doc.setTextColor(IVORY[0], IVORY[1], IVORY[2]);
      var title = (p.first ? p.first + ', here’s your next 90 days.' : 'Your next 90 days.');
      var tl = doc.splitTextToSize(title, CW); doc.text(tl, M, 156);
      doc.setFont('Bodoni', 'italic'); doc.setFontSize(15); doc.setTextColor(ROSE[0], ROSE[1], ROSE[2]);
      doc.text(doc.splitTextToSize('The path to ' + r.goal.line + '.', CW), M, 160 + tl.length * 38);
      doc.setDrawColor(ROSE[0], ROSE[1], ROSE[2]); doc.setLineWidth(0.6); doc.line(M, 250, W - M, 250);
      footer();
      y = 282;
      text(r.goal.short + '  ·  ' + label('days', a.days) + ' a week  ·  ' + r.styleInfo[0], { size: 10, style: 'bold', color: DEEP, after: 18 });

      // Phases
      r.phases.forEach(function (ph, i) {
        need(150);
        doc.setFont('Bodoni', 'normal'); doc.setFontSize(20); doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text((i + 1) + '. ' + ph.name, M, y + 18);
        doc.setFont('Jost', 'bold'); doc.setFontSize(8); doc.setTextColor(DEEP[0], DEEP[1], DEEP[2]);
        doc.text(ph.weeks.toUpperCase().replace('–', ' TO '), W - M, y + 16, { align: 'right', charSpace: 1.4 });
        y += 28;
        text(ph.tagline, { font: 'Bodoni', style: 'italic', size: 12.5, color: DEEP, after: 6 });
        text(ph.feel, { style: 'light', size: 10.5, color: TEXT, after: 10 });
        eyebrow('What’s covered');
        ph.covered.forEach(function (c) {
          var ls = doc.splitTextToSize(c, CW - 16); need(ls.length * 15 + 4);
          doc.setFillColor(ROSE[0], ROSE[1], ROSE[2]); doc.rect(M + 2, y + 6, 4, 4, 'F');
          doc.setFont('Jost', 'light'); doc.setFontSize(10.5); doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
          doc.text(ls, M + 14, y + 11); y += ls.length * 15 + 3;
        });
        y += 6;
        need(40);
        var winLines = doc.splitTextToSize('Milestone: ' + ph.win, CW - 20);
        var bh = winLines.length * 15 + 16;
        need(bh);
        doc.setFillColor(236, 225, 219); doc.rect(M, y, CW, bh, 'F');
        doc.setFillColor(ROSE[0], ROSE[1], ROSE[2]); doc.rect(M, y, 2.5, bh, 'F');
        doc.setFont('Jost', 'normal'); doc.setFontSize(10.5); doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text(winLines, M + 14, y + 19); y += bh + 10;
        var gT = doc.splitTextToSize(ph.guarantee.text, CW - 28), gF;
        doc.setFontSize(7.5); gF = doc.splitTextToSize(ph.guarantee.fine, CW - 28);
        var gh = 30 + gT.length * 14 + 6 + gF.length * 10 + 12; need(gh);
        doc.setDrawColor(ROSE[0], ROSE[1], ROSE[2]); doc.setLineWidth(0.8); doc.rect(M, y, CW, gh, 'S');
        doc.setFont('Bodoni', 'normal'); doc.setFontSize(13); doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text(ph.guarantee.title, M + 14, y + 20);
        doc.setFont('Jost', 'normal'); doc.setFontSize(10); doc.setTextColor(TEXT[0], TEXT[1], TEXT[2]);
        doc.text(gT, M + 14, y + 38);
        doc.setFont('Jost', 'light'); doc.setFontSize(7.5); doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text(gF, M + 14, y + 38 + gT.length * 14 + 4);
        y += gh + 24;
      });

      // Week
      need(140);
      text('Your training week', { font: 'Bodoni', size: 20, color: INK, after: 2 });
      text(label('days', a.days) + ', 45 to 60 minutes each. Days can move to fit your week.', { style: 'light', size: 10, color: GREY, after: 10 });
      var cw = (CW - 6 * 6) / 7;
      r.week.forEach(function (d, i) {
        var x = M + i * (cw + 6);
        if (d.on) { doc.setFillColor(INK[0], INK[1], INK[2]); doc.rect(x, y, cw, 62, 'F'); }
        else { doc.setDrawColor(210, 198, 192); doc.setLineWidth(0.6); doc.rect(x, y, cw, 62, 'S'); }
        doc.setFont('Jost', 'bold'); doc.setFontSize(7.5);
        var c = d.on ? ROSE : GREY; doc.setTextColor(c[0], c[1], c[2]);
        doc.text(d.day.toUpperCase(), x + cw / 2, y + 15, { align: 'center', charSpace: 1 });
        doc.setFont('Jost', 'normal'); doc.setFontSize(8);
        c = d.on ? IVORY : TEXT; doc.setTextColor(c[0], c[1], c[2]);
        doc.text(doc.splitTextToSize(d.what, cw - 8), x + cw / 2, y + 30, { align: 'center' });
      });
      y += 84;

      // Blockers
      need(80);
      text('What stopped you before, handled', { font: 'Bodoni', size: 20, color: INK, after: 8 });
      r.blockers.concat(r.life ? [['Built for your life', r.life]] : []).forEach(function (b) {
        need(50); text(b[0], { style: 'bold', size: 10.5, color: INK, after: 2 }); text(b[1], { style: 'light', size: 10.5, after: 10 });
      });

      // Fit
      need(110); y += 6;
      text(r.style.why || a.style === 'unsure' ? 'My recommendation' : 'Your best fit', { font: 'Bodoni', size: 20, color: INK, after: 4 });
      text(r.styleInfo[0], { style: 'bold', size: 11, color: DEEP, after: 4 });
      text(r.styleInfo[1] + (r.style.why ? ' ' + r.style.why : ''), { style: 'light', size: 10.5, after: 16 });

      // Next step
      need(150);
      var top = y; doc.setFillColor(INK[0], INK[1], INK[2]); doc.rect(M, top, CW, 132, 'F');
      doc.setFont('Jost', 'bold'); doc.setFontSize(8); doc.setTextColor(ROSE[0], ROSE[1], ROSE[2]);
      doc.text('YOUR NEXT STEP', M + 20, top + 26, { charSpace: 1.6 });
      doc.setFont('Bodoni', 'normal'); doc.setFontSize(19); doc.setTextColor(IVORY[0], IVORY[1], IVORY[2]);
      doc.text('Turn this roadmap into your plan.', M + 20, top + 52);
      doc.setFont('Jost', 'light'); doc.setFontSize(10.5);
      doc.text(doc.splitTextToSize('On a free consult we set your training days, your nutrition targets and your first four weeks, together.', CW - 40), M + 20, top + 74);
      doc.setFont('Jost', 'bold'); doc.setFontSize(10.5); doc.setTextColor(ROSE[0], ROSE[1], ROSE[2]);
      doc.textWithLink('Book at book.reformathletics.net/priss/free-consultation', M + 20, top + 112, { url: BOOKING_URL + '?utm_source=roadmap-pdf' });
      y = top + 150;

      text('Guarantees apply to paid Reform Athletics coaching programs, not this free roadmap, and are set out in full in your service agreement. Results vary with starting point, consistency and individual factors.', { style: 'light', size: 8, color: GREY, after: 8 });
      text('Priscilla Claude, CPT, CN · Certified Personal Trainer and Nutritionist · Army officer · Mom · (615) 905-6358 · priscilla@reformathletics.net', { size: 9, color: GREY, after: 8 });
      text('This roadmap is general guidance based on your answers, not medical advice. Talk with your doctor before starting a new exercise or nutrition program.', { style: 'light', size: 8.5, color: GREY });

      var file = 'Reform-Athletics-90-Day-Roadmap' + (p.first ? '-' + p.first.replace(/[^A-Za-z0-9]+/g, '') : '') + '.pdf';
      doc.save(file);
      toast('Your roadmap is downloading.');
    }).catch(function () {
      toast('The download didn’t start. Opening print, where you can save as PDF.');
      setTimeout(function () { window.print(); }, 600);
    }).then(function () {
      btns.forEach(function (b) { if (b) { b.disabled = false; b.textContent = 'Download my roadmap'; } });
    });
  }

  // ---------- Lead submit ----------
  function sendLead(payload) {
    var body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    function once() {
      return fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body, keepalive: true })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r; });
    }
    return once().catch(function () { return new Promise(function (r) { setTimeout(r, 1200); }).then(once); });
  }

  function onSubmit(e) {
    e.preventDefault();
    var err = $('err'); err.classList.add('hidden');
    var first = $('first').value.trim(), last = $('last').value.trim(), email = $('email').value.trim(), phone = $('phone').value.trim();
    var digits = phone.replace(/\D/g, '');
    var bad = !first ? 'first' : !last ? 'last' : !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) ? 'email' : (digits.length < 10 || digits.length > 15) ? 'phone' : '';
    if (bad) {
      err.textContent = { first: 'Please add your first name.', last: 'Please add your last name.', email: 'Please check your email address.', phone: 'Please add a phone number with area code.' }[bad];
      err.classList.remove('hidden'); $(bad).focus(); return;
    }
    var btn = $('submit'); btn.disabled = true; btn.textContent = 'Building your roadmap…';
    person = { first: first, last: last, name: first + ' ' + last, email: email };
    var r = build(answers);
    var q = new URLSearchParams(location.search);
    var labels = {}; Object.keys(answers).forEach(function (k) { labels[k] = Array.isArray(answers[k]) ? answers[k].map(function (v) { return label(k, v); }) : label(k, answers[k]); });
    var payload = {
      first_name: first, last_name: last, email: email, phone: phone,
      the_edit_opt_in: $('edit').checked ? 'yes' : 'no', company: $('company').value,
      answers: answers, labels: labels,
      roadmap: { goal: r.goal.short, recommended: r.styleInfo[0], recommendedKey: r.style.key, why: r.style.why, tier: r.tier, viewUrl: viewUrl(answers, first) },
      source: { src: q.get('src') || '', utm_source: q.get('utm_source') || '', utm_medium: q.get('utm_medium') || '', utm_campaign: q.get('utm_campaign') || '', code: q.get('code') || '', referrer: document.referrer || '', page: location.href }
    };
    var minWait = new Promise(function (res) { setTimeout(res, 900); });
    var sent = sendLead(payload).catch(function () {
      // Keep the lead on the device and try again next visit, so nobody is lost to a bad connection.
      try { localStorage.setItem(STORE_KEY + '-pending', JSON.stringify(payload)); } catch (x) {}
    });
    Promise.race([Promise.all([sent, minWait]), new Promise(function (res) { setTimeout(res, 6000); })]).then(function () {
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ t: encodeToken(answers, first), name: person.name, email: email })); } catch (x) {}
      track('roadmap-lead');
      renderRoadmap(answers, person);
    });
  }

  // ---------- Start ----------
  function init() {
    $('start').addEventListener('click', function () { track('roadmap-start'); answers = {}; step = 0; show('quiz'); renderQuestion(); });
    $('back').addEventListener('click', goBack);
    $('lead').addEventListener('submit', onSubmit);

    // Retry a lead that didn't go through last time
    try {
      var pending = localStorage.getItem(STORE_KEY + '-pending');
      if (pending) sendLead(JSON.parse(pending)).then(function () { localStorage.removeItem(STORE_KEY + '-pending'); }, function () {});
    } catch (e) {}

    // Shared link (?r=…): open the roadmap directly. Used by Priscilla on consults and by leads revisiting.
    var t = new URLSearchParams(location.search).get('r');
    var o = t && decodeToken(t);
    if (o) { answers = o.a; renderRoadmap(o.a, { first: o.n || '' }, { shared: true }); return; }

    // Returning visitor on the same device
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      var so = saved && decodeToken(saved.t);
      if (so) {
        $('resume').classList.remove('hidden');
        $('resume-link').addEventListener('click', function (e) {
          e.preventDefault(); answers = so.a; person = { first: so.n, name: saved.name, email: saved.email }; renderRoadmap(so.a, person);
        });
      }
    } catch (e) {}
  }
  init();

  // Exposed for tests only
  window.__roadmap = { build: build, QUESTIONS: QUESTIONS, encodeToken: encodeToken, decodeToken: decodeToken, pickStyle: pickStyle };
})();
