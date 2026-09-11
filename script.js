/* ========================================
   WasteWise – Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollAnimations();
    initCounters();
    initEcoArcade();
    initCharts();
    initCalculator();
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

/* ========== ECO GAMES ARCADE ========== */
function initEcoArcade() {
    initGameTabs();
    initBinSegregator();
    initConveyorRush();
    initDecompositionDetective();
    initEcoCityTycoon();
}

/* --- Tabs Controller --- */
function initGameTabs() {
    const tabBtns = document.querySelectorAll('.game-tab-btn');
    const panels = document.querySelectorAll('.game-panel');
    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetGame = btn.dataset.game;
            tabBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = document.getElementById('gamePanel-' + targetGame);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });
}

/* ========== GAME 1: BIN SEGREGATOR (Drag & Tap) ========== */
function initBinSegregator() {
    const wasteItems = [
        { name: 'Banana Peel', emoji: '🍌', bin: 'wet', fact: 'Organic waste decomposes in 2-4 weeks and turns into nutrient-dense compost for agriculture.' },
        { name: 'Plastic Bottle', emoji: '🧴', bin: 'dry', fact: 'PET plastic takes 450 years to decompose in landfills, but can be recycled into polyester yarn and jackets!' },
        { name: 'Newspaper', emoji: '📰', bin: 'dry', fact: 'Recycling 1 ton of paper saves 17 trees, 7,000 gallons of water, and 4,000 kWh of electricity.' },
        { name: 'Used AA Battery', emoji: '🔋', bin: 'hazardous', fact: 'Batteries contain heavy metals like cadmium and lead that leach into groundwater if thrown in normal bins.' },
        { name: 'Apple Core', emoji: '🍎', bin: 'wet', fact: 'Food scraps make up ~50% of municipal solid waste in India. Segregating wet waste prevents toxic landfill fires.' },
        { name: 'Glass Soda Bottle', emoji: '🍾', bin: 'dry', fact: 'Glass can be recycled indefinitely without any loss in purity, strength, or clarity.' },
        { name: 'Expired Medicine', emoji: '💊', bin: 'hazardous', fact: 'Medicines must be treated as hazardous biomedical waste to prevent antibiotic resistance in soil and water.' },
        { name: 'Cardboard Box', emoji: '📦', bin: 'dry', fact: 'Cardboard is among the easiest packaging materials to pulp and remanufacture into new shipping boxes.' },
        { name: 'Fluorescent Bulb', emoji: '💡', bin: 'hazardous', fact: 'CFLs and tube lights contain mercury vapor; always dispose of them at designated hazardous drop-offs.' },
        { name: 'Vegetable Peels', emoji: '🥕', bin: 'wet', fact: 'Kitchen vegetable peels can generate biogas for clean cooking energy or vermicompost for gardens.' },
        { name: 'Aluminium Can', emoji: '🥫', bin: 'dry', fact: 'Recycling aluminium saves 95% of the energy needed to smelt new aluminium from raw bauxite ore!' },
        { name: 'Broken Phone Cable', emoji: '🔌', bin: 'hazardous', fact: 'E-waste wires contain valuable copper and rare metals, but toxic PVC insulation needs specialized recycling.' }
    ];

    let score = 0, correct = 0, wrong = 0, streak = 0;
    let selectedItem = null;

    const itemsContainer = document.getElementById('gameItems');
    const scoreEl = document.getElementById('gameScore');
    const correctEl = document.getElementById('correctCount');
    const wrongEl = document.getElementById('wrongCount');
    const streakEl = document.getElementById('streakCount');
    const feedbackEl = document.getElementById('gameFeedback');
    const factTickerEl = document.getElementById('gameFactTicker');
    const resetBtn = document.getElementById('resetGame');

    if (!itemsContainer) return;

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
        selectedItem = null;
        const shuffled = shuffle(wasteItems);
        shuffled.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'game-item';
            el.draggable = true;
            el.dataset.bin = item.bin;
            el.dataset.name = item.name;
            el.dataset.fact = item.fact;
            el.id = 'item-' + i;
            el.innerHTML = `<span class="item-emoji">${item.emoji}</span> ${item.name}`;

            // Drag support
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: el.id, bin: item.bin, name: item.name, fact: item.fact
                }));
                el.style.opacity = '0.4';
            });
            el.addEventListener('dragend', () => { el.style.opacity = '1'; });

            // Tap-to-select support (mobile & desktop click)
            el.addEventListener('click', () => {
                if (selectedItem === el) {
                    el.classList.remove('selected');
                    selectedItem = null;
                } else {
                    document.querySelectorAll('.game-item').forEach(it => it.classList.remove('selected'));
                    el.classList.add('selected');
                    selectedItem = el;
                    showFeedback(`👉 Selected "${item.name}". Now tap the correct bin below!`, 'correct');
                }
            });

            itemsContainer.appendChild(el);
        });
    }

    // Bins click & drop
    document.querySelectorAll('#gamePanel-segregator .bin').forEach(bin => {
        // Drag events
        bin.addEventListener('dragover', (e) => { e.preventDefault(); bin.classList.add('drag-over'); });
        bin.addEventListener('dragleave', () => { bin.classList.remove('drag-over'); });
        bin.addEventListener('drop', (e) => {
            e.preventDefault();
            bin.classList.remove('drag-over');
            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                const itemEl = document.getElementById(data.id);
                processDrop(data.bin, bin.dataset.bin, data.name, data.fact, itemEl);
            } catch (err) { console.error(err); }
        });

        // Tap-to-sort click
        bin.addEventListener('click', () => {
            if (selectedItem) {
                const correctBin = selectedItem.dataset.bin;
                const itemName = selectedItem.dataset.name;
                const fact = selectedItem.dataset.fact;
                const targetBin = bin.dataset.bin;
                const el = selectedItem;
                selectedItem = null;
                processDrop(correctBin, targetBin, itemName, fact, el);
            }
        });
    });

    function processDrop(correctBin, droppedBin, itemName, fact, itemEl) {
        if (correctBin === droppedBin) {
            correct++;
            streak++;
            const pointsEarned = 10 + Math.min(streak * 2, 20);
            score += pointsEarned;
            showFeedback(`✅ Spot on! "${itemName}" belongs in ${getBinName(correctBin)} (+${pointsEarned} pts).`, 'correct');
            if (fact && factTickerEl) factTickerEl.innerHTML = `💡 <strong>Recycling Fact:</strong> ${fact}`;
            if (itemEl) {
                itemEl.style.transition = 'all 0.3s ease';
                itemEl.style.transform = 'scale(0)';
                itemEl.style.opacity = '0';
                setTimeout(() => itemEl.remove(), 300);
            }
        } else {
            wrong++;
            streak = 0;
            score = Math.max(0, score - 5);
            showFeedback(`❌ Oops! "${itemName}" goes into ${getBinName(correctBin)}, not ${getBinName(droppedBin)}.`, 'wrong');
        }
        updateScore();

        setTimeout(() => {
            const remaining = itemsContainer.querySelectorAll('.game-item');
            if (remaining.length === 0) {
                showFeedback(`🎉 Awesome job! You sorted every single item! Final Score: ${score}`, 'correct');
            }
        }, 350);
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
        if (streakEl) streakEl.textContent = `${streak} 🔥`;
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            score = 0; correct = 0; wrong = 0; streak = 0;
            updateScore();
            feedbackEl.textContent = '';
            feedbackEl.className = 'game-feedback';
            renderItems();
        });
    }

    renderItems();
}

/* ========== GAME 2: CONVEYOR RUSH (Speed Sorting) ========== */
function initConveyorRush() {
    const rushItems = [
        { name: 'Water Bottle', emoji: '🧴', bin: 'dry' },
        { name: 'Banana Skin', emoji: '🍌', bin: 'wet' },
        { name: 'Car Battery', emoji: '🔋', bin: 'hazardous' },
        { name: 'Pizza Cardboard', emoji: '📦', bin: 'dry' },
        { name: 'Egg Shells', emoji: '🥚', bin: 'wet' },
        { name: 'Broken Phone', emoji: '📱', bin: 'hazardous' },
        { name: 'Soda Can', emoji: '🥫', bin: 'dry' },
        { name: 'Orange Peels', emoji: '🍊', bin: 'wet' },
        { name: 'Fluorescent Tube', emoji: '💡', bin: 'hazardous' },
        { name: 'Magazine Paper', emoji: '📰', bin: 'dry' },
        { name: 'Tea Leaves', emoji: '🍂', bin: 'wet' },
        { name: 'Chemical Bottle', emoji: '🧪', bin: 'hazardous' },
        { name: 'Glass Tumbler', emoji: '🫙', bin: 'dry' },
        { name: 'Bread Crusts', emoji: '🍞', bin: 'wet' },
        { name: 'Thermometer', emoji: '🌡️', bin: 'hazardous' },
        { name: 'Milk Carton', emoji: '🥛', bin: 'dry' },
        { name: 'Watermelon Rind', emoji: '🍉', bin: 'wet' },
        { name: 'Lead Paint Can', emoji: '🎨', bin: 'hazardous' }
    ];

    let timer = 30;
    let score = 0;
    let streak = 0;
    let timerInterval = null;
    let isPlaying = false;
    let currentItem = null;

    const stage = document.getElementById('rushItemStage');
    const timerEl = document.getElementById('rushTimer');
    const scoreEl = document.getElementById('rushScore');
    const multEl = document.getElementById('rushMultiplier');
    const startBtn = document.getElementById('startRushBtn');

    if (!stage || !startBtn) return;

    startBtn.addEventListener('click', startRushGame);

    function startRushGame() {
        isPlaying = true;
        timer = 30;
        score = 0;
        streak = 0;
        updateRushStats();

        nextItem();

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timer--;
            timerEl.textContent = timer + 's';
            if (timer <= 0) {
                endRushGame();
            }
        }, 1000);
    }

    function nextItem() {
        if (!isPlaying) return;
        const rand = rushItems[Math.floor(Math.random() * rushItems.length)];
        currentItem = rand;
        stage.innerHTML = `
            <div class="rush-active-item">
                <div class="rush-item-emoji">${rand.emoji}</div>
                <div class="rush-item-title">${rand.name}</div>
            </div>`;
    }

    function handleBinChoice(chosenBin) {
        if (!isPlaying || !currentItem) return;

        if (chosenBin === currentItem.bin) {
            streak++;
            const mult = streak >= 8 ? 4 : streak >= 4 ? 2 : 1;
            score += 15 * mult;
            stage.classList.add('flash-correct');
            setTimeout(() => stage.classList.remove('flash-correct'), 200);
        } else {
            streak = 0;
            score = Math.max(0, score - 10);
            stage.classList.add('flash-wrong');
            setTimeout(() => stage.classList.remove('flash-wrong'), 200);
        }

        updateRushStats();
        nextItem();
    }

    function updateRushStats() {
        if (scoreEl) scoreEl.textContent = score;
        const mult = streak >= 8 ? 4 : streak >= 4 ? 2 : 1;
        if (multEl) multEl.textContent = mult + 'x (' + streak + ' streak)';
    }

    function endRushGame() {
        isPlaying = false;
        clearInterval(timerInterval);
        const rank = score >= 350 ? '🏆 Speed Sorting Legend!' : score >= 200 ? '⚡ Rapid Sorter Pro' : '🌱 Green Trainee';
        stage.innerHTML = `
            <div class="rush-idle-msg">
                <h3>🏁 Time Up! Final Score: ${score}</h3>
                <p>Rank: <strong>${rank}</strong><br>Sorted rapidly to keep Indian landfills free of mixed contamination.</p>
                <button class="btn btn-primary" id="retryRushBtn" type="button">🔄 Play Again</button>
            </div>`;
        const retry = document.getElementById('retryRushBtn');
        if (retry) retry.addEventListener('click', startRushGame);
    }

    // Buttons
    ['Wet', 'Dry', 'Hazard'].forEach((type) => {
        const btn = document.getElementById('rushBtn' + type);
        const binType = type === 'Wet' ? 'wet' : type === 'Dry' ? 'dry' : 'hazardous';
        if (btn) btn.addEventListener('click', () => handleBinChoice(binType));
    });

    // Keyboard support: 1, 2, 3
    window.addEventListener('keydown', (e) => {
        if (!isPlaying) return;
        if (e.key === '1') handleBinChoice('wet');
        if (e.key === '2') handleBinChoice('dry');
        if (e.key === '3') handleBinChoice('hazardous');
    });
}

/* ========== GAME 3: DECOMPOSITION DETECTIVE ========== */
function initDecompositionDetective() {
    const detectiveData = [
        {
            name: 'Banana Peel',
            emoji: '🍌',
            options: ['2 to 4 Weeks', '2 Years', '10 Years', '25 Years'],
            correct: 0,
            lifespan: '2 to 4 Weeks',
            meterPercent: 5,
            fact: 'Banana peels break down rapidly because they are rich in nitrogen, water, and organic plant cells. In home composting, they turn into black gold for your garden in less than a month!'
        },
        {
            name: 'Newspaper',
            emoji: '📰',
            options: ['6 Weeks', '1 Year', '5 Years', '20 Years'],
            correct: 0,
            lifespan: '6 Weeks',
            meterPercent: 8,
            fact: 'Paper cellulose breaks down quickly when exposed to moisture and air. However, packed tightly in oxygen-deprived landfills, unsegregated newspapers have been found readable after 50 years!'
        },
        {
            name: 'Cigarette Butt',
            emoji: '🚬',
            options: ['3 Months', '10 to 12 Years', '50 Years', '100 Years'],
            correct: 1,
            lifespan: '10 to 12 Years',
            meterPercent: 30,
            fact: 'Cigarette filters are NOT cotton—they are made of cellulose acetate, a non-biodegradable plastic that leaches nicotine, arsenic, and microplastics into stormwater drains and city rivers.'
        },
        {
            name: 'Aluminium Beverage Can',
            emoji: '🥫',
            options: ['5 Years', '20 Years', '80 to 200 Years', '500 Years'],
            correct: 2,
            lifespan: '80 to 200 Years',
            meterPercent: 55,
            fact: 'Aluminium oxidizes very slowly. But recycling just 1 can saves enough electricity to power an LED television for 3 full hours. It can be back on a store shelf as a new can in just 60 days!'
        },
        {
            name: 'Plastic Water Bottle (PET)',
            emoji: '🧴',
            options: ['10 Years', '50 Years', '150 Years', '450 Years'],
            correct: 3,
            lifespan: '450 Years',
            meterPercent: 78,
            fact: 'Petroleum-based PET polymers never truly decompose biologically—sunlight only photo-degrades them into microscopic toxic particles that enter fish, farm soil, and human drinking water.'
        },
        {
            name: 'Disposable Baby Diaper',
            emoji: '👶',
            options: ['5 Years', '50 Years', '200 Years', '500 Years'],
            correct: 3,
            lifespan: '500 Years',
            meterPercent: 85,
            fact: 'Single-use diapers contain superabsorbent polymers, polyethylene film, and polypropylene that persist for five centuries. India generates thousands of tons of diaper waste daily.'
        },
        {
            name: 'Alkaline Battery',
            emoji: '🔋',
            options: ['1 Year', '10 Years', '100 Years', 'Never'],
            correct: 2,
            lifespan: '100 Years',
            meterPercent: 65,
            fact: 'The metal casing takes ~100 years to corrode, during which dangerous potassium hydroxide and heavy metals contaminate surrounding soil and groundwater.'
        },
        {
            name: 'Glass Soda Bottle',
            emoji: '🍾',
            options: ['100 Years', '1,000 Years', '10,000 Years', '1 Million+ Years (Never)'],
            correct: 3,
            lifespan: '1,000,000+ Years',
            meterPercent: 100,
            fact: 'Made from liquid quartz sand, glass virtually never biodegrades in a landfill. The good news? Glass is 100% infinitely recyclable without any quality degradation.'
        }
    ];

    let currentIndex = 0;
    let score = 0;

    const stepEl = document.getElementById('detectiveStep');
    const scoreEl = document.getElementById('detectiveScore');
    const iconEl = document.getElementById('detectiveIcon');
    const nameEl = document.getElementById('detectiveName');
    const optionsContainer = document.getElementById('detectiveOptions');
    const revealCard = document.getElementById('detectiveReveal');
    const resultText = document.getElementById('detectiveResultText');
    const meterBar = document.getElementById('detectiveMeterBar');
    const factText = document.getElementById('detectiveFactText');
    const nextBtn = document.getElementById('detectiveNextBtn');

    if (!stepEl || !optionsContainer) return;

    function renderQuestion() {
        const item = detectiveData[currentIndex];
        stepEl.textContent = `Item ${currentIndex + 1} of ${detectiveData.length}`;
        iconEl.textContent = item.emoji;
        nameEl.textContent = item.name;
        revealCard.style.display = 'none';
        optionsContainer.innerHTML = '';

        item.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'detective-opt-btn';
            btn.type = 'button';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleGuess(idx, btn));
            optionsContainer.appendChild(btn);
        });
    }

    function handleGuess(selectedIdx, btnEl) {
        const item = detectiveData[currentIndex];
        const allBtns = optionsContainer.querySelectorAll('.detective-opt-btn');
        allBtns.forEach(b => b.disabled = true);

        const isCorrect = selectedIdx === item.correct;
        if (isCorrect) {
            score++;
            btnEl.classList.add('correct');
            resultText.innerHTML = `🎉 <span style="color:#2e7d32;">Spot On!</span> Real Lifespan: <strong>${item.lifespan}</strong>`;
        } else {
            btnEl.classList.add('wrong');
            allBtns[item.correct].classList.add('correct');
            resultText.innerHTML = `⚠️ <span style="color:#c62828;">Surprise!</span> It actually takes: <strong>${item.lifespan}</strong>`;
        }

        if (scoreEl) scoreEl.textContent = score;
        meterBar.style.width = item.meterPercent + '%';
        factText.textContent = item.fact;
        revealCard.style.display = 'block';

        if (currentIndex === detectiveData.length - 1) {
            nextBtn.textContent = '🏁 View Final Assessment';
        } else {
            nextBtn.textContent = 'Next Item ➔';
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < detectiveData.length - 1) {
                currentIndex++;
                renderQuestion();
            } else {
                showFinalSummary();
            }
        });
    }

    function showFinalSummary() {
        const detectiveBody = document.querySelector('.detective-body');
        const badge = score >= 7 ? '🎖️ Master Degradation Sleuth' : score >= 5 ? '🔎 Keen Eco Investigator' : '📚 Waste Apprentice';
        detectiveBody.innerHTML = `
            <div style="text-align:center; padding: 24px;">
                <div style="font-size:3.5rem; margin-bottom:12px;">🕵️‍♂️</div>
                <h3 style="color:var(--green-dark); font-size:1.6rem;">${badge}</h3>
                <p style="margin: 12px 0 24px; color:var(--gray-600); font-size:1.05rem;">
                    You scored <strong>${score} out of ${detectiveData.length}</strong>! Understanding waste degradation timelines is the secret to knowing why immediate segregation and recycling are so vital.
                </p>
                <button class="btn btn-primary" id="restartDetectiveBtn" type="button">🔁 Try Detective Challenge Again</button>
            </div>`;
        const restart = document.getElementById('restartDetectiveBtn');
        if (restart) restart.addEventListener('click', () => {
            currentIndex = 0;
            score = 0;
            if (scoreEl) scoreEl.textContent = '0';
            location.reload();
        });
    }

    renderQuestion();
}

/* ========== GAME 4: ECO-CITY TYCOON (Municipal Simulator) ========== */
function initEcoCityTycoon() {
    const rounds = [
        {
            title: 'Round 1: The Collection Dilemma',
            event: 'Unsegregated Central Dump Crisis',
            desc: '60% of city trash arrives completely mixed at the overburdened outer landfill. Neighborhoods are complaining about smoke and groundwater contamination.',
            choices: [
                {
                    title: 'Mandate 2-Bin Door-to-Door Segregation',
                    desc: 'Issue color-coded green & blue bins with fines for mixed trash.',
                    cost: '-₹18 Cr Budget',
                    effect: { budget: -18, clean: +25, eco: +30, jobs: +450 },
                    feedback: 'Great vision! 2-bin segregation clean rates surged, keeping 4,000 tons of wet waste out of the dump.'
                },
                {
                    title: 'Buy Heavy Hydraulic Mixed Trash Compactors',
                    desc: 'Faster collection speed, but dumps all waste together indiscriminately.',
                    cost: '-₹10 Cr Budget',
                    effect: { budget: -10, clean: +15, eco: -15, jobs: +50 },
                    feedback: 'Streets look cleaner temporarily, but landfill fires worsened and recycling recovery fell by 40%.'
                },
                {
                    title: 'Incentivize Informal Ragpickers / Kabadiwalas',
                    desc: 'Partner with local scrap collectors to sort recyclable plastics at source.',
                    cost: '-₹6 Cr Budget',
                    effect: { budget: -6, clean: +18, eco: +22, jobs: +600 },
                    feedback: 'Incredible economic return! 600 informal workers gained dignified livelihood and plastic salvage soared.'
                }
            ]
        },
        {
            title: 'Round 2: The Wet Food Waste Surge',
            event: 'Monsoon Compost Opportunity',
            desc: 'Wholesale vegetable mandis and household wet waste is producing massive leachate slurry. What bio-processing infrastructure do you commission?',
            choices: [
                {
                    title: 'Decentralized Ward Biogas & Vermicompost Units',
                    desc: 'Convert wet waste locally into cooking gas and agricultural fertilizer.',
                    cost: '-₹15 Cr Budget',
                    effect: { budget: -15, clean: +20, eco: +35, jobs: +350 },
                    feedback: 'Ward-level composting eliminated long transport emissions and produced 200 tons of green organic fertilizer weekly!'
                },
                {
                    title: 'Build Mega Waste-to-Energy Incineration Plant',
                    desc: 'Burns high-volume waste to generate clean grid electricity.',
                    cost: '-₹35 Cr Budget',
                    effect: { budget: -35, clean: +25, eco: +10, jobs: +150 },
                    feedback: 'Significant capital cost and high-moisture Indian garbage required extra fuel, but generated 10MW of steady power.'
                },
                {
                    title: 'Dig a New Deep Clay-Lined Landfill Pit',
                    desc: 'Cheap short-term dumping solution for the rainy season.',
                    cost: '-₹5 Cr Budget',
                    effect: { budget: -5, clean: -10, eco: -25, jobs: +20 },
                    feedback: 'Public protests erupted near the new site; methane gas emissions reached dangerous pollution thresholds.'
                }
            ]
        },
        {
            title: 'Round 3: Single-Use Plastic Crackdown',
            event: 'Clogged Stormwater Drains',
            desc: 'Single-use carry bags and gutka pouches are choking stormwater drains, creating urban flash flooding. How do you enforce the ban?',
            choices: [
                {
                    title: 'Market Raids + Women Self-Help Cloth Bag Subsidy',
                    desc: 'Strict fines for plastic wholesalers while funding cotton bag production.',
                    cost: '-₹8 Cr Budget',
                    effect: { budget: -8, clean: +22, eco: +28, jobs: +400 },
                    feedback: 'Flood risk reduced by 60%! 400 women SHG artisans gained stable income stitching reusable cloth bags.'
                },
                {
                    title: 'High-Tech AI Camera & Drone Drain Monitoring',
                    desc: 'Surveil black-spots where plastic is illegally dumped at night.',
                    cost: '-₹12 Cr Budget',
                    effect: { budget: -12, clean: +14, eco: +12, jobs: +30 },
                    feedback: 'Tech cameras spotted repeat commercial offenders, leading to ₹4 Cr in penalty recovery.'
                },
                {
                    title: 'Media Awareness Billboard Campaign',
                    desc: 'Radio jingles, celebrity hoardings, and school rallies.',
                    cost: '-₹3 Cr Budget',
                    effect: { budget: -3, clean: +5, eco: +8, jobs: +10 },
                    feedback: 'Awareness reached students, but without enforcement on wholesale manufacturers, thin plastics kept appearing.'
                }
            ]
        },
        {
            title: 'Round 4: High-Value E-Waste & Circular Hub',
            event: 'Tech Waste & Lithium Battery Boom',
            desc: 'The city tech corridor is discarding 15,000 tons of computers, smartphones, and lithium batteries annually. Informal burning is poisoning air.',
            choices: [
                {
                    title: 'Establish Municipal Material Recovery Facility (MRF)',
                    desc: 'State-of-the-art facility to harvest copper, gold, and clean polymers safely.',
                    cost: '-₹20 Cr Budget',
                    effect: { budget: +25, clean: +28, eco: +35, jobs: +500 },
                    feedback: 'Economic jackpot! Precious metal recovery generated ₹45 Cr in scrap sales, turning waste management into a net profit center!'
                },
                {
                    title: 'Mandatory Extended Producer Responsibility (EPR)',
                    desc: 'Compel electronics brands to fund authorized take-back collection kiosks.',
                    cost: '+₹5 Cr Budget',
                    effect: { budget: +5, clean: +20, eco: +25, jobs: +200 },
                    feedback: 'Corporate brands funded city drop-boxes, creating an effortless recycling loop for urban citizens.'
                },
                {
                    title: 'Export Unprocessed Electronic Scrap Abroad',
                    desc: 'Quickly clear municipal warehouses by auctioning raw e-waste containers.',
                    cost: '+₹10 Cr Budget',
                    effect: { budget: +10, clean: +10, eco: -10, jobs: -50 },
                    feedback: 'Brought quick one-off cash, but the city missed out on long-term recycling revenue and industrial green jobs.'
                }
            ]
        }
    ];

    let currentRound = 0;
    let budget = 100;
    let cleanliness = 50;
    let eco = 50;
    let jobs = 1200;

    const roundTag = document.getElementById('tycoonRoundTag');
    const badgeEl = document.getElementById('tycoonEventBadge');
    const titleEl = document.getElementById('tycoonScenarioTitle');
    const descEl = document.getElementById('tycoonScenarioDesc');
    const choicesContainer = document.getElementById('tycoonChoices');
    const scenarioCard = document.getElementById('tycoonScenarioCard');
    const summaryCard = document.getElementById('tycoonSummaryCard');
    const restartBtn = document.getElementById('tycoonRestartBtn');

    if (!roundTag || !choicesContainer) return;

    function renderRound() {
        const r = rounds[currentRound];
        roundTag.textContent = r.title;
        badgeEl.textContent = `🚨 Policy Decision #${currentRound + 1}`;
        titleEl.textContent = r.event;
        descEl.textContent = r.desc;
        choicesContainer.innerHTML = '';

        r.choices.forEach((choice) => {
            const btn = document.createElement('button');
            btn.className = 'tycoon-choice-btn';
            btn.type = 'button';
            btn.innerHTML = `
                <div class="choice-info">
                    <strong>${choice.title}</strong>
                    <span>${choice.desc}</span>
                </div>
                <div class="choice-cost">${choice.cost}</div>`;
            btn.addEventListener('click', () => selectChoice(choice));
            choicesContainer.appendChild(btn);
        });
    }

    function selectChoice(choice) {
        budget += choice.effect.budget;
        cleanliness = Math.max(0, Math.min(100, cleanliness + choice.effect.clean));
        eco = Math.max(0, Math.min(100, eco + choice.effect.eco));
        jobs += choice.effect.jobs;
        updateDashboard();

        alert(`📋 Policy Enacted!

${choice.feedback}`);

        currentRound++;
        if (currentRound < rounds.length) {
            renderRound();
        } else {
            showTenureReport();
        }
    }

    function updateDashboard() {
        document.getElementById('tycoonBudget').textContent = `₹${budget} Cr`;
        document.getElementById('tycoonCleanliness').textContent = `${cleanliness}%`;
        document.getElementById('tycoonEco').textContent = `${eco}%`;
        document.getElementById('tycoonJobs').textContent = jobs.toLocaleString('en-IN');

        document.getElementById('tycoonBudgetBar').style.width = Math.min(100, Math.max(10, budget)) + '%';
        document.getElementById('tycoonCleanBar').style.width = cleanliness + '%';
        document.getElementById('tycoonEcoBar').style.width = eco + '%';
        document.getElementById('tycoonJobsBar').style.width = Math.min(100, (jobs / 3000) * 100) + '%';
    }

    function showTenureReport() {
        scenarioCard.style.display = 'none';
        summaryCard.style.display = 'block';

        const totalScore = cleanliness + eco + (budget > 50 ? 20 : 0);
        const title = totalScore >= 180 ? '🌟 National Swachh Bharat Pioneer City' :
                      totalScore >= 140 ? '🌿 Sustainable Green Metropolis' : '⚠️ Developing Municipality with Lingering Challenges';

        document.getElementById('tycoonSummaryTitle').textContent = title;
        document.getElementById('tycoonSummaryDesc').textContent =
            `As Commissioner, you balanced economic capital with ground-level environmental stewardship. Your city created ${jobs.toLocaleString('en-IN')} green livelihoods while maintaining a ${cleanliness}% cleanliness rating!`;

        document.getElementById('tycoonFinalStats').innerHTML = `
            <div class="final-stat-box"><strong>₹${budget} Cr</strong><span>Final Treasury</span></div>
            <div class="final-stat-box"><strong>${cleanliness}%</strong><span>City Cleanliness</span></div>
            <div class="final-stat-box"><strong>${eco}%</strong><span>Eco & Health Index</span></div>
            <div class="final-stat-box"><strong>${jobs.toLocaleString('en-IN')}</strong><span>Green Jobs</span></div>`;
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            currentRound = 0;
            budget = 100; cleanliness = 50; eco = 50; jobs = 1200;
            updateDashboard();
            scenarioCard.style.display = 'block';
            summaryCard.style.display = 'none';
            renderRound();
        });
    }

    renderRound();
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

