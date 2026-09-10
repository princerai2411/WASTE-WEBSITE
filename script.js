/* ========================================
   WasteWise – Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollAnimations();
    initCounters();
    initGame();
    initCharts();
    initCalculator();
    initLiveCounter();
    initCityComparison();
    initWasteToMoney();
    initQuiz();
    initTipOfDay();
});

/* ========== NAVBAR ========== */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    const navItems = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        updateActiveLink();
    });

    toggle.addEventListener('click', () => {
        links.classList.toggle('open');
        toggle.classList.toggle('active');
    });

    navItems.forEach(link => {
        link.addEventListener('click', () => {
            links.classList.remove('open');
            toggle.classList.remove('active');
        });
    });

    function updateActiveLink() {
        const sections = document.querySelectorAll('.section, .hero');
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) current = section.getAttribute('id');
        });
        navItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) link.classList.add('active');
        });
    }
}

/* ========== SCROLL ANIMATIONS ========== */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

/* ========== ANIMATED COUNTERS ========== */
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    let animated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                counters.forEach(counter => animateCounter(counter));
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));

    function animateCounter(el) {
        const target = parseInt(el.dataset.target);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        function update() {
            current += step;
            if (current >= target) {
                el.textContent = prefix + target.toLocaleString('en-IN') + suffix;
                return;
            }
            el.textContent = prefix + Math.floor(current).toLocaleString('en-IN') + suffix;
            requestAnimationFrame(update);
        }
        update();
    }
}

/* ========== DRAG & DROP GAME ========== */
function initGame() {
    const wasteItems = [
        { name: 'Banana Peel', emoji: '🍌', bin: 'wet' },
        { name: 'Apple Core', emoji: '🍎', bin: 'wet' },
        { name: 'Vegetable Scraps', emoji: '🥕', bin: 'wet' },
        { name: 'Tea Leaves', emoji: '🍵', bin: 'wet' },
        { name: 'Egg Shells', emoji: '🥚', bin: 'wet' },
        { name: 'Plastic Bottle', emoji: '🧴', bin: 'dry' },
        { name: 'Newspaper', emoji: '📰', bin: 'dry' },
        { name: 'Cardboard Box', emoji: '📦', bin: 'dry' },
        { name: 'Metal Can', emoji: '🥫', bin: 'dry' },
        { name: 'Glass Jar', emoji: '🫙', bin: 'dry' },
        { name: 'Battery', emoji: '🔋', bin: 'hazardous' },
        { name: 'Paint Can', emoji: '🎨', bin: 'hazardous' },
        { name: 'Medicine', emoji: '💊', bin: 'hazardous' },
        { name: 'Light Bulb', emoji: '💡', bin: 'hazardous' },
    ];

    let score = 0, correct = 0, wrong = 0;
    const itemsContainer = document.getElementById('gameItems');
    const scoreEl = document.getElementById('gameScore');
    const correctEl = document.getElementById('correctCount');
    const wrongEl = document.getElementById('wrongCount');
    const feedbackEl = document.getElementById('gameFeedback');
    const resetBtn = document.getElementById('resetGame');

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function renderItems() {
        itemsContainer.innerHTML = '';
        const shuffled = shuffle(wasteItems);
        shuffled.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'game-item';
            el.draggable = true;
            el.dataset.bin = item.bin;
            el.dataset.name = item.name;
            el.id = 'item-' + i;
            el.innerHTML = `<span class="item-emoji">${item.emoji}</span> ${item.name}`;

            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: el.id, bin: item.bin, name: item.name
                }));
                el.style.opacity = '0.4';
            });
            el.addEventListener('dragend', () => { el.style.opacity = '1'; });

            // Touch support
            el.addEventListener('touchstart', handleTouchStart, { passive: false });
            el.addEventListener('touchmove', handleTouchMove, { passive: false });
            el.addEventListener('touchend', handleTouchEnd, { passive: false });

            itemsContainer.appendChild(el);
        });
    }

    // Touch drag support
    let touchDragItem = null;
    let touchClone = null;
    let touchData = null;

    function handleTouchStart(e) {
        e.preventDefault();
        touchDragItem = e.currentTarget;
        touchData = {
            id: touchDragItem.id,
            bin: touchDragItem.dataset.bin,
            name: touchDragItem.dataset.name
        };
        touchDragItem.style.opacity = '0.4';

        touchClone = touchDragItem.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.zIndex = '10000';
        touchClone.style.opacity = '0.85';
        touchClone.style.transform = 'scale(1.1)';
        document.body.appendChild(touchClone);

        const touch = e.touches[0];
        touchClone.style.left = (touch.clientX - 60) + 'px';
        touchClone.style.top = (touch.clientY - 25) + 'px';
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (!touchClone) return;
        const touch = e.touches[0];
        touchClone.style.left = (touch.clientX - 60) + 'px';
        touchClone.style.top = (touch.clientY - 25) + 'px';

        // Highlight bins on hover
        document.querySelectorAll('.bin').forEach(bin => {
            const rect = bin.getBoundingClientRect();
            if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                bin.classList.add('drag-over');
            } else {
                bin.classList.remove('drag-over');
            }
        });
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        if (!touchClone || !touchDragItem || !touchData) return;

        const touch = e.changedTouches[0];
        let droppedBin = null;

        document.querySelectorAll('.bin').forEach(bin => {
            const rect = bin.getBoundingClientRect();
            if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                droppedBin = bin.dataset.bin;
            }
            bin.classList.remove('drag-over');
        });

        if (droppedBin) {
            processDropResult(touchData.bin, droppedBin, touchData.name, touchDragItem);
        }

        touchDragItem.style.opacity = '1';
        touchClone.remove();
        touchClone = null;
        touchDragItem = null;
        touchData = null;
    }

    // Setup bin drop zones
    document.querySelectorAll('.bin').forEach(bin => {
        bin.addEventListener('dragover', (e) => {
            e.preventDefault();
            bin.classList.add('drag-over');
        });
        bin.addEventListener('dragleave', () => {
            bin.classList.remove('drag-over');
        });
        bin.addEventListener('drop', (e) => {
            e.preventDefault();
            bin.classList.remove('drag-over');
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const droppedBin = bin.dataset.bin;
            const itemEl = document.getElementById(data.id);
            processDropResult(data.bin, droppedBin, data.name, itemEl);
        });
    });

    function processDropResult(correctBin, droppedBin, itemName, itemEl) {
        if (correctBin === droppedBin) {
            correct++;
            score += 10;
            showFeedback(`✅ Correct! "${itemName}" belongs in ${getBinName(correctBin)}.`, 'correct');
            if (itemEl) {
                itemEl.style.transition = 'all 0.3s ease';
                itemEl.style.transform = 'scale(0)';
                itemEl.style.opacity = '0';
                setTimeout(() => itemEl.remove(), 300);
            }
        } else {
            wrong++;
            score = Math.max(0, score - 5);
            showFeedback(`❌ Wrong! "${itemName}" should go in ${getBinName(correctBin)}, not ${getBinName(droppedBin)}.`, 'wrong');
        }
        updateScore();

        // Check if all items sorted
        setTimeout(() => {
            const remaining = itemsContainer.querySelectorAll('.game-item');
            if (remaining.length === 0) {
                showFeedback(`🎉 Congratulations! You sorted all items! Final Score: ${score}`, 'correct');
            }
            // Update achievement badge
            updateBadge(score, correct, wrong, remaining.length === 0);
        }, 400);
    }

    function getBinName(bin) {
        const names = { wet: 'Green (Wet Waste)', dry: 'Blue (Dry Waste)', hazardous: 'Red (Hazardous)' };
        return names[bin] || bin;
    }

    function showFeedback(msg, type) {
        feedbackEl.textContent = msg;
        feedbackEl.className = 'game-feedback ' + type;
        clearTimeout(feedbackEl._timeout);
        feedbackEl._timeout = setTimeout(() => {
            feedbackEl.textContent = '';
            feedbackEl.className = 'game-feedback';
        }, 3000);
    }

    function updateScore() {
        scoreEl.textContent = score;
        correctEl.textContent = correct;
        wrongEl.textContent = wrong;
    }

    resetBtn.addEventListener('click', () => {
        score = 0; correct = 0; wrong = 0;
        updateScore();
        feedbackEl.textContent = '';
        feedbackEl.className = 'game-feedback';
        renderItems();
    });

    renderItems();
}

/* ========== CHARTS ========== */
function initCharts() {
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    font: { family: "'Inter', sans-serif", size: 13 },
                    padding: 16,
                    usePointStyle: true,
                }
            },
            tooltip: {
                backgroundColor: 'rgba(27,67,50,0.92)',
                titleFont: { family: "'Outfit', sans-serif", size: 14 },
                bodyFont: { family: "'Inter', sans-serif", size: 13 },
                padding: 12,
                cornerRadius: 8,
            }
        }
    };

    // -- Pie Chart: Waste Composition --
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Organic/Biodegradable', 'Plastic', 'Paper', 'Glass', 'Metal', 'Hazardous', 'Other'],
                datasets: [{
                    data: [50, 8, 6, 3, 2, 4, 27],
                    backgroundColor: [
                        '#2d6a4f', '#2196F3', '#FF9800', '#26a69a',
                        '#78909C', '#e63946', '#b39ddb'
                    ],
                    borderWidth: 3,
                    borderColor: '#f8faf9',
                    hoverOffset: 14,
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '55%',
                plugins: {
                    ...chartDefaults.plugins,
                    legend: { ...chartDefaults.plugins.legend, position: 'bottom' },
                    tooltip: {
                        ...chartDefaults.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`
                        }
                    }
                },
                animation: { animateRotate: true, duration: 1500 }
            }
        });
    }

    // -- Line Chart: Yearly Waste Generation --
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['2011', '2013', '2015', '2017', '2019', '2021', '2023', '2025'],
                datasets: [{
                    label: 'Waste Generated (MT)',
                    data: [31, 36, 42, 48, 54, 58, 62, 67],
                    borderColor: '#2d6a4f',
                    backgroundColor: 'rgba(45,106,79,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#2d6a4f',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    borderWidth: 3,
                }, {
                    label: 'Waste Processed (MT)',
                    data: [5, 7, 10, 14, 18, 21, 25, 30],
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33,150,243,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#2196F3',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    borderWidth: 3,
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: { font: { family: "'Inter', sans-serif" } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: "'Inter', sans-serif" } }
                    }
                },
                animation: { duration: 2000, easing: 'easeInOutQuart' }
            }
        });
    }

    // -- Bar Chart: Recycling Revenue --
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Plastic', 'Paper', 'Metal', 'Glass', 'E-Waste', 'Composting'],
                datasets: [{
                    label: 'Revenue (₹ Crores)',
                    data: [6000, 3500, 3500, 800, 1800, 1200],
                    backgroundColor: [
                        'rgba(33,150,243,0.8)', 'rgba(255,152,0,0.8)', 'rgba(120,144,156,0.8)',
                        'rgba(38,166,154,0.8)', 'rgba(230,57,70,0.8)', 'rgba(45,106,79,0.8)'
                    ],
                    borderColor: [
                        '#2196F3', '#FF9800', '#78909C', '#26a69a', '#e63946', '#2d6a4f'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: {
                            font: { family: "'Inter', sans-serif" },
                            callback: (v) => '₹' + v.toLocaleString('en-IN')
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: "'Inter', sans-serif" } }
                    }
                },
                animation: { duration: 1800, easing: 'easeInOutQuart' }
            }
        });
    }
}

/* ========== WASTE CALCULATOR ========== */
function initCalculator() {
    const calcBtn = document.getElementById('calcBtn');
    const resultsDiv = document.getElementById('calcResults');

    calcBtn.addEventListener('click', () => {
        const dailyWaste = parseFloat(document.getElementById('dailyWaste').value);
        const household = parseInt(document.getElementById('householdSize').value) || 1;

        if (isNaN(dailyWaste) || dailyWaste <= 0) {
            alert('Please enter a valid daily waste amount.');
            return;
        }

        const totalDaily = dailyWaste * household;
        const yearly = totalDaily * 365;
        const recyclable = yearly * 0.45;         // ~45% recyclable
        const co2Saved = recyclable * 0.8;        // ~0.8 kg CO₂ per kg recycled
        const economicValue = recyclable * 12;    // ~₹12 per kg recycled material

        document.getElementById('yearlyWaste').textContent = yearly.toFixed(1);
        document.getElementById('recyclable').textContent = recyclable.toFixed(1);
        document.getElementById('co2Saved').textContent = co2Saved.toFixed(1);
        document.getElementById('economicValue').textContent = '₹' + Math.round(economicValue).toLocaleString('en-IN');

        // Insight text
        const insight = document.getElementById('resultInsight');
        const trees = (co2Saved / 22).toFixed(1); // avg tree absorbs ~22kg CO₂/year
        insight.innerHTML = `
            💡 <strong>Insight:</strong> By recycling ${recyclable.toFixed(1)} kg of waste per year, 
            your household could save the equivalent of <strong>${trees} trees</strong> worth of CO₂ absorption. 
            The recyclable materials have an estimated economic value of 
            <strong>₹${Math.round(economicValue).toLocaleString('en-IN')}</strong>, 
            contributing to India's growing circular economy. Every kilogram counts!
        `;

        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

/* ========== LIVE WASTE COUNTER ========== */
function initLiveCounter() {
    const counterEl = document.getElementById('liveWasteCounter');
    if (!counterEl) return;

    // India generates ~170,000 tons/day = ~1.97 tons/second
    const tonsPerSecond = 170000 / 86400;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let secondsSinceMidnight = (now - startOfDay) / 1000;

    function updateCounter() {
        secondsSinceMidnight += 1;
        const generated = Math.floor(tonsPerSecond * secondsSinceMidnight);
        counterEl.textContent = generated.toLocaleString('en-IN');
    }

    updateCounter();
    setInterval(updateCounter, 1000);
}

/* ========== CITY WASTE COMPARISON ========== */
function initCityComparison() {
    const select = document.getElementById('citySelect');
    const canvas = document.getElementById('cityBarChart');
    if (!select || !canvas) return;

    const cityData = {
        delhi:      { generated: 11000, collected: 9500, recycled: 2200, composted: 1100 },
        mumbai:     { generated: 9500,  collected: 8800, recycled: 1900, composted: 950 },
        bangalore:  { generated: 6000,  collected: 5200, recycled: 1500, composted: 1200 },
        chandigarh: { generated: 450,   collected: 420,  recycled: 180,  composted: 120 }
    };

    let cityChart = null;

    function renderCityChart(city) {
        const d = cityData[city];
        if (cityChart) cityChart.destroy();

        cityChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Generated', 'Collected', 'Recycled', 'Composted'],
                datasets: [{
                    label: 'TPD (Tons/Day)',
                    data: [d.generated, d.collected, d.recycled, d.composted],
                    backgroundColor: [
                        'rgba(45,106,79,0.75)', 'rgba(33,150,243,0.75)',
                        'rgba(64,145,108,0.75)', 'rgba(149,213,178,0.75)'
                    ],
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(27,67,50,0.92)',
                        cornerRadius: 6,
                        callbacks: {
                            label: (ctx) => ` ${ctx.parsed.y.toLocaleString('en-IN')} TPD`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { font: { size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    }
                },
                animation: { duration: 800 }
            }
        });
    }

    select.addEventListener('change', () => renderCityChart(select.value));
    renderCityChart('delhi');
}

/* ========== WASTE-TO-MONEY CONVERTER ========== */
function initWasteToMoney() {
    const btn = document.getElementById('w2mCalcBtn');
    if (!btn) return;

    // Approx INR per kg for scrap dealers
    const rates = { plastic: 15, paper: 10, metal: 35 };
    const co2Factors = { plastic: 1.5, paper: 0.8, metal: 2.5 }; // kg CO2 saved per kg recycled

    btn.addEventListener('click', () => {
        const plastic = parseFloat(document.getElementById('w2mPlastic').value) || 0;
        const paper = parseFloat(document.getElementById('w2mPaper').value) || 0;
        const metal = parseFloat(document.getElementById('w2mMetal').value) || 0;

        const totalValue = plastic * rates.plastic + paper * rates.paper + metal * rates.metal;
        const totalCO2 = plastic * co2Factors.plastic + paper * co2Factors.paper + metal * co2Factors.metal;

        const resultDiv = document.getElementById('w2mResult');
        document.getElementById('w2mValue').textContent = '₹' + Math.round(totalValue).toLocaleString('en-IN');
        document.getElementById('w2mSavings').innerHTML =
            `🌱 You'd save <strong>${totalCO2.toFixed(1)} kg</strong> of CO₂ emissions by recycling this waste.`;
        resultDiv.style.display = 'block';
    });
}

/* ========== WASTE AWARENESS QUIZ ========== */
function initQuiz() {
    const questions = [
        {
            q: 'Which bin should banana peels go into?',
            options: ['🔵 Blue (Dry)', '🟢 Green (Wet)', '🔴 Red (Hazardous)'],
            answer: 1
        },
        {
            q: 'What percentage of India\'s waste is organic/biodegradable?',
            options: ['~20%', '~35%', '~50%'],
            answer: 2
        },
        {
            q: 'Used batteries should be disposed in which bin?',
            options: ['🟢 Green (Wet)', '🔵 Blue (Dry)', '🔴 Red (Hazardous)'],
            answer: 2
        },
        {
            q: 'Recycling 1 ton of paper saves approximately how many trees?',
            options: ['5 trees', '17 trees', '50 trees'],
            answer: 1
        },
        {
            q: 'What does SWM stand for?',
            options: ['Smart Waste Machine', 'Solid Waste Management', 'Systematic Waste Method'],
            answer: 1
        }
    ];

    let currentQ = 0;
    let quizScore = 0;
    const questionEl = document.getElementById('quizQuestion');
    const optionsEl = document.getElementById('quizOptions');
    const progressEl = document.getElementById('quizProgress');
    const resultEl = document.getElementById('quizResult');
    const scoreEl = document.getElementById('quizScore');
    const contentEl = document.getElementById('quizContent');
    const restartBtn = document.getElementById('quizRestart');

    if (!questionEl) return;

    function showQuestion() {
        const q = questions[currentQ];
        questionEl.textContent = q.q;
        optionsEl.innerHTML = '';
        progressEl.textContent = `Question ${currentQ + 1} of ${questions.length}`;

        q.options.forEach((opt, i) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleAnswer(i, btn));
            optionsEl.appendChild(btn);
        });
    }

    function handleAnswer(selected, btnEl) {
        const q = questions[currentQ];
        const allOptions = optionsEl.querySelectorAll('.quiz-option');
        allOptions.forEach(o => o.style.pointerEvents = 'none');

        if (selected === q.answer) {
            btnEl.classList.add('correct-answer');
            quizScore++;
        } else {
            btnEl.classList.add('wrong-answer');
            allOptions[q.answer].classList.add('correct-answer');
        }

        setTimeout(() => {
            currentQ++;
            if (currentQ < questions.length) {
                showQuestion();
            } else {
                showResult();
            }
        }, 1200);
    }

    function showResult() {
        contentEl.style.display = 'none';
        resultEl.style.display = 'block';
        const emoji = quizScore >= 4 ? '🏆' : quizScore >= 2 ? '👍' : '📚';
        scoreEl.innerHTML = `${emoji} You scored <strong>${quizScore}</strong> out of <strong>${questions.length}</strong>!<br><span style="font-size:0.85rem;font-weight:400;color:#4a5a50;">${quizScore >= 4 ? 'Excellent! You\'re a waste management expert!' : quizScore >= 2 ? 'Good effort! Keep learning about waste management.' : 'Keep going! Review the About section to learn more.'}</span>`;
    }

    restartBtn.addEventListener('click', () => {
        currentQ = 0;
        quizScore = 0;
        contentEl.style.display = 'block';
        resultEl.style.display = 'none';
        showQuestion();
    });

    showQuestion();
}

/* ========== TIP OF THE DAY ========== */
function initTipOfDay() {
    const tips = [
        '🌿 Composting organic waste at home can reduce your household waste by up to 30% and create nutrient-rich soil for your garden.',
        '🧴 Rinse plastic containers before recycling – contaminated plastics often end up in landfills instead of being recycled.',
        '📰 Recycling one ton of newspaper saves about 17 trees and 7,000 gallons of water.',
        '🔋 Never throw batteries in regular trash. Take them to designated e-waste collection centers to prevent soil contamination.',
        '🛍️ Carry reusable bags while shopping. India banned single-use plastics in 2022 – support this initiative!',
        '🥕 Plan your meals to reduce food waste. Indian households waste approximately 50 kg of food per person annually.',
        '♻️ The recycling symbol with number 1 (PET) and 2 (HDPE) plastics are the most commonly recycled – look for these numbers.',
        '💧 A single plastic bottle takes 450+ years to decompose. Choose reusable water bottles instead.',
        '🏠 Segregate waste at source into wet, dry, and hazardous bins – it makes the entire recycling process 3x more efficient.',
        '📱 E-waste is the fastest growing waste stream globally. Donate or recycle old electronics responsibly.'
    ];

    const tipEl = document.getElementById('tipText');
    const newTipBtn = document.getElementById('newTipBtn');
    if (!tipEl || !newTipBtn) return;

    let lastIndex = -1;

    function showTip() {
        let idx;
        do { idx = Math.floor(Math.random() * tips.length); } while (idx === lastIndex);
        lastIndex = idx;
        tipEl.textContent = tips[idx];
    }

    newTipBtn.addEventListener('click', showTip);
    showTip();
}

/* ========== ACHIEVEMENT BADGE ========== */
function updateBadge(score, correct, wrong, gameComplete) {
    const badgeIcon = document.getElementById('badgeIcon');
    const badgeTitle = document.getElementById('badgeTitle');
    const badgeSubtitle = document.getElementById('badgeSubtitle');
    const badgeDisplay = document.getElementById('badgeDisplay');
    if (!badgeIcon || !badgeTitle || !badgeSubtitle || !badgeDisplay) return;

    if (!gameComplete) {
        // Show progress-based badge
        if (correct > 0) {
            badgeDisplay.classList.add('earned');
            badgeIcon.textContent = '🌱';
            badgeTitle.textContent = 'Eco Beginner';
            badgeSubtitle.textContent = `You've sorted ${correct} item${correct > 1 ? 's' : ''} correctly. Keep going to upgrade your badge!`;
        }
        return;
    }

    // Game complete – assign final badge
    badgeDisplay.classList.add('earned');
    const accuracy = correct / (correct + wrong);

    if (accuracy >= 0.9 && score >= 100) {
        badgeIcon.textContent = '🏆';
        badgeTitle.textContent = 'Recycling Champion';
        badgeSubtitle.textContent = `Perfect performance! Score: ${score} | Accuracy: ${Math.round(accuracy * 100)}%. You're a true sustainability champion!`;
    } else if (accuracy >= 0.7) {
        badgeIcon.textContent = '⚔️';
        badgeTitle.textContent = 'Waste Warrior';
        badgeSubtitle.textContent = `Great job! Score: ${score} | Accuracy: ${Math.round(accuracy * 100)}%. You understand waste segregation well!`;
    } else {
        badgeIcon.textContent = '🌱';
        badgeTitle.textContent = 'Eco Beginner';
        badgeSubtitle.textContent = `Score: ${score} | Accuracy: ${Math.round(accuracy * 100)}%. Keep practicing to become a Recycling Champion!`;
    }
}
