/**
 * Conservation Geography - NPTEL Practice Web App
 * Interactive Quiz Controller
 */

(() => {
  // --- DOM Elements ---
  const startScreen = document.getElementById('startScreen');
  const quizScreen = document.getElementById('quizScreen');
  const analysisScreen = document.getElementById('analysisScreen');

  const startBtn = document.getElementById('startBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const restartBtn = document.getElementById('restartBtn');

  const quizCard = document.getElementById('quizCard');
  const questionText = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');

  // Live Tracker Elements
  const liveDone = document.getElementById('liveDone');
  const liveCorrect = document.getElementById('liveCorrect');
  const liveIncorrect = document.getElementById('liveIncorrect');

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeMoonIcon = document.getElementById('themeMoonIcon');
  const themeSunIcon = document.getElementById('themeSunIcon');

  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');

  // Analysis Elements
  const statScore = document.getElementById('statScore');
  const statAccuracy = document.getElementById('statAccuracy');
  const statTime = document.getElementById('statTime');
  const statIncorrect = document.getElementById('statIncorrect');
  const analysisTrophy = document.getElementById('analysisTrophy');
  const analysisTitle = document.getElementById('analysisTitle');
  const analysisSubtitle = document.getElementById('analysisSubtitle');

  const filterAll = document.getElementById('filterAll');
  const filterWrong = document.getElementById('filterWrong');
  const filterCorrect = document.getElementById('filterCorrect');
  const wrongCountBadge = document.getElementById('wrongCountBadge');
  const correctCountBadge = document.getElementById('correctCountBadge');
  const reviewList = document.getElementById('reviewList');

  // --- App State ---
  let shuffledQuestions = [];
  let currentIndex = 0;
  let answersRecord = [];
  let isTransitioning = false;
  let quizStartTime = null;
  let quizEndTime = null;
  let soundEnabled = true;
  let activeFilter = 'all';
  let transitionTimer = null;
  let animationTimer = null;

  function clearPendingTimers() {
    if (transitionTimer) {
      clearTimeout(transitionTimer);
      transitionTimer = null;
    }
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }

  // Letters for 4 options
  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

  // SVG Icons for Options
  const CHECK_ICON_SVG = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;

  const CROSS_ICON_SVG = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;

  // --- Audio Synthesizer (Web Audio API) ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'correct') {
        // Melodic pleasant chime (E5 -> G5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'wrong') {
        // Soft low rejection buzz
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      console.warn("Audio feedback unavailable", e);
    }
  }

  // --- Fisher-Yates Shuffle Algorithm ---
  function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // --- Live Tracker Realtime Updates ---
  function updateLiveTracker(animateTarget = null) {
    const total = shuffledQuestions.length || 120;
    const doneCount = answersRecord.length;
    const correctCount = answersRecord.filter(r => r.isCorrect).length;
    const incorrectCount = doneCount - correctCount;

    if (liveDone) {
      liveDone.textContent = `${doneCount} / ${total}`;
    }
    if (liveCorrect) {
      liveCorrect.textContent = `${correctCount}`;
      if (animateTarget === 'correct') triggerPop(liveCorrect);
    }
    if (liveIncorrect) {
      liveIncorrect.textContent = `${incorrectCount}`;
      if (animateTarget === 'wrong') triggerPop(liveIncorrect);
    }
  }

  function resetLiveTracker() {
    const total = (typeof QUESTIONS !== 'undefined' && QUESTIONS.length) || 120;
    if (liveDone) liveDone.textContent = `0 / ${total}`;
    if (liveCorrect) liveCorrect.textContent = '0';
    if (liveIncorrect) liveIncorrect.textContent = '0';
  }

  function triggerPop(el) {
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 200);
  }

  // --- Initialize Session with Fresh Shuffling ---
  function prepareNewSession() {
    clearPendingTimers();
    const questionSource = (typeof window !== 'undefined' && window.QUESTIONS) || (typeof QUESTIONS !== 'undefined' ? QUESTIONS : []);
    if (!Array.isArray(questionSource) || questionSource.length === 0) {
      alert("Error: Question bank could not be loaded. Please ensure questions.js is present.");
      return;
    }

    // Scramble questions order, and scramble each question's options order
    shuffledQuestions = shuffleArray(questionSource).map(q => ({
      id: q.id,
      question: q.question,
      options: shuffleArray(q.options)
    }));

    currentIndex = 0;
    answersRecord = [];
    isTransitioning = false;
    quizStartTime = null;
    quizEndTime = null;
    resetLiveTracker();
  }

  // --- Screen Navigation ---
  function showScreen(screen) {
    startScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    analysisScreen.classList.add('hidden');

    screen.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Start Practice ---
  function startQuiz() {
    initAudio();
    prepareNewSession();
    quizStartTime = Date.now();
    showScreen(quizScreen);
    renderQuestion(0);
  }

  // --- Reset to Start Screen ---
  function resetToStart() {
    prepareNewSession();
    showScreen(startScreen);
  }

  // --- Render Single Question ---
  function renderQuestion(index) {
    if (index >= shuffledQuestions.length) {
      finishQuiz();
      return;
    }

    isTransitioning = false;
    const currentQ = shuffledQuestions[index];

    // Card entrance animation
    quizCard.classList.remove('slide-out');
    quizCard.classList.remove('slide-in');
    void quizCard.offsetWidth; // trigger reflow
    quizCard.classList.add('slide-in');

    // Set Question text (Pure question statement - no hints, no numbers)
    questionText.textContent = currentQ.question;

    // Clear and build options
    optionsContainer.innerHTML = '';

    currentQ.options.forEach((opt, optIdx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.setAttribute('type', 'button');
      btn.dataset.index = optIdx;

      const letterBadge = document.createElement('span');
      letterBadge.className = 'option-letter';
      letterBadge.textContent = OPTION_LETTERS[optIdx] || (optIdx + 1);

      const textSpan = document.createElement('span');
      textSpan.className = 'option-text';
      textSpan.textContent = opt.text;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'option-status-icon';

      btn.appendChild(letterBadge);
      btn.appendChild(textSpan);
      btn.appendChild(iconSpan);

      btn.addEventListener('click', () => handleOptionSelection(optIdx));
      optionsContainer.appendChild(btn);
    });
  }

  // --- Handle Option Click ---
  function handleOptionSelection(selectedIndex) {
    if (isTransitioning) return;
    isTransitioning = true;

    const currentQ = shuffledQuestions[currentIndex];
    const selectedOption = currentQ.options[selectedIndex];
    const optionButtons = optionsContainer.querySelectorAll('.option-btn');

    // Disable all options immediately to lock input
    optionButtons.forEach(btn => {
      btn.disabled = true;
    });

    const isCorrect = selectedOption.is_correct === true;
    const selectedBtn = optionButtons[selectedIndex];

    if (isCorrect) {
      // Correct answer clicked: Highlight Green with Check Icon
      selectedBtn.classList.add('state-correct');
      const icon = selectedBtn.querySelector('.option-status-icon');
      if (icon) icon.innerHTML = CHECK_ICON_SVG;
      playSound('correct');
    } else {
      // Wrong answer clicked:
      // 1. Highlight chosen option in Red with Cross Icon
      selectedBtn.classList.add('state-wrong');
      const wrongIcon = selectedBtn.querySelector('.option-status-icon');
      if (wrongIcon) wrongIcon.innerHTML = CROSS_ICON_SVG;

      // 2. SIMULTANEOUSLY highlight the true correct option in Green with Check Icon!
      currentQ.options.forEach((opt, idx) => {
        if (opt.is_correct) {
          const correctBtn = optionButtons[idx];
          if (correctBtn) {
            correctBtn.classList.add('state-correct');
            const rightIcon = correctBtn.querySelector('.option-status-icon');
            if (rightIcon) rightIcon.innerHTML = CHECK_ICON_SVG;
          }
        }
      });
      playSound('wrong');
    }

    // Save answer record for final analysis
    const correctOptionObj = currentQ.options.find(o => o.is_correct) || {};
    answersRecord.push({
      question: currentQ.question,
      options: currentQ.options,
      selectedIndex: selectedIndex,
      selectedText: selectedOption.text,
      correctText: correctOptionObj.text,
      isCorrect: isCorrect
    });

    // Update Live Tracker HUD during the test
    updateLiveTracker(isCorrect ? 'correct' : 'wrong');

    // Exactly 1 second (1000ms) automatic transition to next question
    clearPendingTimers();
    transitionTimer = setTimeout(() => {
      quizCard.classList.remove('slide-in');
      quizCard.classList.add('slide-out');

      animationTimer = setTimeout(() => {
        currentIndex++;
        if (currentIndex < shuffledQuestions.length) {
          renderQuestion(currentIndex);
        } else {
          finishQuiz();
        }
      }, 150);
    }, 1000);
  }

  // --- Finish Quiz & Display Final Analysis ---
  function finishQuiz() {
    quizEndTime = Date.now();
    showScreen(analysisScreen);

    const totalQuestions = shuffledQuestions.length || 120;
    const correctCount = answersRecord.filter(r => r.isCorrect).length;
    const incorrectCount = totalQuestions - correctCount;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);

    // Calculate time spent
    const elapsedSeconds = Math.max(1, Math.round(((quizEndTime || Date.now()) - (quizStartTime || Date.now())) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Update Stats
    statScore.textContent = `${correctCount} / ${totalQuestions}`;
    statAccuracy.textContent = `${accuracy}%`;
    statTime.textContent = timeFormatted;
    statIncorrect.textContent = `${incorrectCount}`;

    wrongCountBadge.textContent = `${incorrectCount}`;
    correctCountBadge.textContent = `${correctCount}`;

    // Motivational Header Evaluation
    if (accuracy >= 90) {
      analysisTrophy.textContent = '🏆';
      analysisTitle.textContent = 'Extraordinary Mastery!';
      analysisSubtitle.textContent = `Brilliant score of ${accuracy}%! You have thoroughly mastered Conservation Geography.`;
    } else if (accuracy >= 75) {
      analysisTrophy.textContent = '🌟';
      analysisTitle.textContent = 'Great Performance!';
      analysisSubtitle.textContent = `Solid grasp of the syllabus with ${accuracy}%. Review the questions below to hit 100%!`;
    } else if (accuracy >= 50) {
      analysisTrophy.textContent = '🎯';
      analysisTitle.textContent = 'Good Effort!';
      analysisSubtitle.textContent = `You scored ${accuracy}%. Focus on the incorrect answers below to sharpen your concepts.`;
    } else {
      analysisTrophy.textContent = '📚';
      analysisTitle.textContent = 'Practice Makes Perfect!';
      analysisSubtitle.textContent = `You completed all ${totalQuestions} questions. Review the solutions below and give it another shot!`;
    }

    // Render review items
    activeFilter = 'all';
    renderReviewList();
  }

  // --- Render Detailed Review List ---
  function renderReviewList() {
    reviewList.innerHTML = '';

    // Update active button state
    [filterAll, filterWrong, filterCorrect].forEach(btn => {
      if (btn.dataset.filter === activeFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const filteredRecords = answersRecord.filter(r => {
      if (activeFilter === 'wrong') return !r.isCorrect;
      if (activeFilter === 'correct') return r.isCorrect;
      return true;
    });

    if (filteredRecords.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.textAlign = 'center';
      emptyDiv.style.padding = '2rem';
      emptyDiv.style.color = 'var(--text-dim)';
      emptyDiv.textContent = activeFilter === 'wrong' ? '🎉 Amazing! No incorrect answers.' : 'No items match this filter.';
      reviewList.appendChild(emptyDiv);
      return;
    }

    filteredRecords.forEach((item) => {
      const row = document.createElement('div');
      row.className = `review-item ${item.isCorrect ? 'item-correct' : 'item-wrong'}`;

      const qEl = document.createElement('div');
      qEl.className = 'review-q-text';
      qEl.textContent = item.question;

      const answersContainer = document.createElement('div');
      answersContainer.className = 'review-answers';

      if (item.isCorrect) {
        const yourTag = document.createElement('div');
        yourTag.className = 'review-tag tag-correct';
        yourTag.innerHTML = `<strong>Your Answer:</strong> ${escapeHtml(item.selectedText)} (Correct)`;
        answersContainer.appendChild(yourTag);
      } else {
        const yourTag = document.createElement('div');
        yourTag.className = 'review-tag tag-wrong';
        yourTag.innerHTML = `<strong>Your Answer:</strong> ${escapeHtml(item.selectedText)}`;

        const correctTag = document.createElement('div');
        correctTag.className = 'review-tag tag-correct';
        correctTag.innerHTML = `<strong>Correct Answer:</strong> ${escapeHtml(item.correctText)}`;

        answersContainer.appendChild(yourTag);
        answersContainer.appendChild(correctTag);
      }

      row.appendChild(qEl);
      row.appendChild(answersContainer);
      reviewList.appendChild(row);
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Keyboard Shortcuts Support ---
  window.addEventListener('keydown', (e) => {
    // If on Start Screen
    if (!startScreen.classList.contains('hidden')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startQuiz();
      }
      return;
    }

    // If on Quiz Screen
    if (!quizScreen.classList.contains('hidden') && !isTransitioning) {
      const key = e.key.toLowerCase();
      let selectedIdx = -1;

      if (key === '1' || key === 'a') selectedIdx = 0;
      else if (key === '2' || key === 'b') selectedIdx = 1;
      else if (key === '3' || key === 'c') selectedIdx = 2;
      else if (key === '4' || key === 'd') selectedIdx = 3;

      if (selectedIdx >= 0) {
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        if (buttons[selectedIdx]) {
          buttons[selectedIdx].click();
        }
      }
      return;
    }

    // If on Analysis Screen
    if (!analysisScreen.classList.contains('hidden')) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startQuiz();
      }
    }
  });

  // --- Event Listeners ---
  startBtn.addEventListener('click', startQuiz);
  restartBtn.addEventListener('click', resetToStart);
  refreshBtn.addEventListener('click', resetToStart);

  // Review Filters
  filterAll.addEventListener('click', () => {
    activeFilter = 'all';
    renderReviewList();
  });
  filterWrong.addEventListener('click', () => {
    activeFilter = 'wrong';
    renderReviewList();
  });
  filterCorrect.addEventListener('click', () => {
    activeFilter = 'correct';
    renderReviewList();
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
      soundToggleBtn.title = "Sound: ON";
      playSound('correct');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
      soundToggleBtn.title = "Sound: OFF (Muted)";
    }
  });

  // Theme Toggle (Dark / Light)
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);

    if (nextTheme === 'dark') {
      themeMoonIcon.classList.remove('hidden');
      themeSunIcon.classList.add('hidden');
      themeToggleBtn.title = "Current: Dark Theme (Click for Light)";
    } else {
      themeMoonIcon.classList.add('hidden');
      themeSunIcon.classList.remove('hidden');
      themeToggleBtn.title = "Current: Light Theme (Click for Dark)";
    }
  });

  // Pre-prepare session on initial page load
  prepareNewSession();
})();
