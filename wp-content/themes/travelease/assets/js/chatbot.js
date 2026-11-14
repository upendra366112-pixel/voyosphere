/**
 * VoyoBot AI - Intelligent Interactive Travel Chatbot
 * Supports English, Hindi & Hinglish with Rich Action Cards & Voice Input
 */

(function () {
  'use strict';

  // 1. Audio Synthesizer (No external mp3 files required)
  class VoyoAudioSynth {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('voyo_bot_muted') === 'true';
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    }

    playSendTone() {
      if (this.muted) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {
        // Audio policy ignore
      }
    }

    playReceiveTone() {
      if (this.muted) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } catch (e) {
        // Audio policy ignore
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('voyo_bot_muted', this.muted);
      return this.muted;
    }
  }

  // 2. Chatbot Core Controller
  const VoyoBot = {
    isOpen: false,
    synth: new VoyoAudioSynth(),
    recognition: null,
    isListening: false,
    history: [],

    // Destination & Tour Data for Rich Cards
    destinationsData: [
      {
        id: 'goa',
        name: 'Goa Beach Escape',
        state: 'Goa, India',
        img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹12,000 - ₹18,000',
        duration: '4 Days / 3 Nights',
        tag: '🏖️ Top Beach',
        bestSeason: 'November to February',
        highlights: 'Baga & Calangute Beach, Water Sports, Sunset Cruise, North Goa Cafes',
        link: '/destinations/goa/'
      },
      {
        id: 'manali',
        name: 'Manali & Solang Valley',
        state: 'Himachal Pradesh',
        img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹14,000 - ₹22,000',
        duration: '5 Days / 4 Nights',
        tag: '❄️ Snow & Mountains',
        bestSeason: 'October to February (Snow) & May-June',
        highlights: 'Rohtang Pass, Solang Valley Skiing, Old Manali Cafes, River Rafting',
        link: '/destinations/manali/'
      },
      {
        id: 'kerala',
        name: 'Kerala Backwaters & Munnar',
        state: 'Kerala, India',
        img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹18,000 - ₹28,000',
        duration: '6 Days / 5 Nights',
        tag: '🌴 Nature & Houseboat',
        bestSeason: 'September to March',
        highlights: 'Alleppey Deluxe Houseboat, Munnar Tea Gardens, Kovalam Beach',
        link: '/destinations/kerala/'
      },
      {
        id: 'kashmir',
        name: 'Kashmir Paradise Tour',
        state: 'Jammu & Kashmir',
        img: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹22,000 - ₹35,000',
        duration: '6 Days / 5 Nights',
        tag: '🏔️ Heavenly Valley',
        bestSeason: 'April to October (Tulips & Greenery) & Dec-Feb (Snow)',
        highlights: 'Srinagar Shikara Ride, Gulmarg Gondola Phase 2, Betaab Valley Pahalgam',
        link: '/destinations/kashmir/'
      },
      {
        id: 'jaipur',
        name: 'Royal Jaipur & Heritage Forts',
        state: 'Rajasthan, India',
        img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹9,500 - ₹15,000',
        duration: '3 Days / 2 Nights',
        tag: '👑 Royal Heritage',
        bestSeason: 'October to March',
        highlights: 'Amer Fort Light Show, Hawa Mahal, Chokhi Dhani Cultural Village',
        link: '/destinations/jaipur/'
      },
      {
        id: 'bali',
        name: 'Bali Tropical Wonderland',
        state: 'Indonesia',
        img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹55,000 - ₹85,000',
        duration: '7 Days / 6 Nights',
        tag: '✈️ International',
        bestSeason: 'April to October',
        highlights: 'Ubud Private Pool Villas, Nusa Penida Island, Kuta Sunset Beach',
        link: '/destinations/bali/'
      },
      {
        id: 'meghalaya',
        name: 'Meghalaya Nature & Root Bridges',
        state: 'Meghalaya, India',
        img: 'https://images.unsplash.com/photo-1593813738953-fb3c93e0769d?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹16,000 - ₹28,000',
        duration: '5 Days / 4 Nights',
        tag: '🌿 Nature & Waterfalls',
        bestSeason: 'October to April',
        highlights: 'Double Decker Living Root Bridge, Nohkalikai Falls, Dawki River Boating',
        link: '/destinations/meghalaya/'
      },
      {
        id: 'udaipur',
        name: 'Royal Udaipur & Lake Palaces',
        state: 'Rajasthan, India',
        img: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹12,000 - ₹22,000',
        duration: '4 Days / 3 Nights',
        tag: '👑 Royal Heritage',
        bestSeason: 'October to March',
        highlights: 'City Palace, Lake Pichola Sunset Cruise, Jag Mandir, Sajjangarh',
        link: '/destinations/udaipur/'
      },
      {
        id: 'darjeeling',
        name: 'Darjeeling & Kanchenjunga',
        state: 'West Bengal, India',
        img: 'https://images.unsplash.com/photo-1622308644420-b20142dc993c?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹11,000 - ₹19,000',
        duration: '4 Days / 3 Nights',
        tag: '🏔️ Mountains & Tea',
        bestSeason: 'March to May & Oct to Dec',
        highlights: 'Tiger Hill Sunrise, Himalayan Toy Train, Happy Valley Tea Estate',
        link: '/destinations/darjeeling/'
      },
      {
        id: 'hampi',
        name: 'Hampi Ancient UNESCO Ruins',
        state: 'Karnataka, India',
        img: 'https://images.unsplash.com/photo-1616606484004-5ef3cc46e39d?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹8,500 - ₹16,000',
        duration: '3 Days / 2 Nights',
        tag: '🏛️ UNESCO Heritage',
        bestSeason: 'October to March',
        highlights: 'Stone Chariot Vittala Temple, Virupaksha, Tungabhadra Coracle Ride',
        link: '/destinations/hampi/'
      },
      {
        id: 'sikkim',
        name: 'Sikkim Himalayan Adventure',
        state: 'Sikkim, India',
        img: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹18,000 - ₹32,000',
        duration: '5 Days / 4 Nights',
        tag: '🧗 Alpine Adventure',
        bestSeason: 'March to June & Sep to Dec',
        highlights: 'Gurudongmar Lake, Nathula Pass Border, Tsomgo Lake, Yumthang Valley',
        link: '/destinations/sikkim/'
      },
      {
        id: 'rann-of-kutch',
        name: 'Rann of Kutch White Desert',
        state: 'Gujarat, India',
        img: 'https://images.unsplash.com/photo-1670406312373-6d4d1776e4aa?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹14,000 - ₹24,000',
        duration: '3 Days / 2 Nights',
        tag: '🏜️ White Desert',
        bestSeason: 'November to February (Rann Utsav)',
        highlights: 'Full Moon Salt Desert, Dhordo Tent City, Kalo Dungar, Kutchi Crafts',
        link: '/destinations/rann-of-kutch/'
      },
      {
        id: 'singapore',
        name: 'Singapore City Break & Luxury',
        state: 'Singapore',
        img: '/wp-content/themes/travelease/assets/images/singapore-marina-bay.jpg',
        approxPrice: '₹55,000 - ₹90,000',
        duration: '5 Days / 4 Nights',
        tag: '🏙️ City Break · Shopping · Luxury',
        bestSeason: 'Year-Round',
        highlights: 'Marina Bay Sands aur Gardens by the Bay, Luxury Orchard Road Shopping, Jewel Changi',
        link: '/destinations/singapore/'
      },
      {
        id: 'istanbul',
        name: 'Istanbul Crossroads of Continents',
        state: 'Turkey',
        img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=600&q=80',
        approxPrice: '₹65,000 - ₹1,05,000',
        duration: '6 Days / 5 Nights',
        tag: '✈️ International',
        bestSeason: 'April-May & Sept-Nov',
        highlights: 'Hagia Sophia, Blue Mosque, Bosphorus Sunset Yacht Cruise, Grand Bazaar',
        link: '/destinations/istanbul/'
      }
    ],

    init() {
      this.bindDOM();
      this.initVoiceRecognition();
      this.loadChatHistory();
      this.setupProactiveTooltip();
    },

    bindDOM() {
      this.launcherWrap = document.getElementById('voyoChatbotWrap');
      this.launcherBtn = document.getElementById('voyoChatbotLauncher');
      this.tooltip = document.getElementById('voyoChatbotTooltip');
      this.window = document.getElementById('voyoChatbotWindow');
      this.body = document.getElementById('voyoChatBody');
      this.input = document.getElementById('voyoChatInput');
      this.sendBtn = document.getElementById('voyoChatSendBtn');
      this.voiceBtn = document.getElementById('voyoChatVoiceBtn');
      this.muteBtn = document.getElementById('voyoChatMuteBtn');
      this.clearBtn = document.getElementById('voyoChatClearBtn');
      this.closeBtn = document.getElementById('voyoChatCloseBtn');
      this.badge = document.getElementById('voyoChatBadge');

      if (this.launcherBtn) {
        this.launcherBtn.addEventListener('click', () => this.toggle());
      }
      if (this.tooltip) {
        this.tooltip.addEventListener('click', (e) => {
          if (e.target.closest('.voyo-tooltip-close')) {
            e.stopPropagation();
            this.dismissTooltip();
          } else {
            this.open();
          }
        });
      }
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }
      if (this.muteBtn) {
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.updateMuteIcon();
      }
      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => this.clearHistory());
      }
      if (this.sendBtn) {
        this.sendBtn.addEventListener('click', () => this.handleSend());
      }
      if (this.input) {
        this.input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.handleSend();
          }
        });
      }
      if (this.voiceBtn) {
        this.voiceBtn.addEventListener('click', () => this.toggleVoice());
      }

      // Delegate Quick Chips
      document.addEventListener('click', (e) => {
        const chip = e.target.closest('.voyo-chip-btn');
        if (chip) {
          const query = chip.getAttribute('data-query');
          if (query) {
            this.open();
            this.sendMessage(query, 'user');
            this.generateBotResponse(query);
          }
        }
      });
    },

    setupProactiveTooltip() {
      const dismissed = sessionStorage.getItem('voyo_tooltip_dismissed');
      if (this.tooltip && !dismissed) {
        setTimeout(() => {
          if (!this.isOpen && this.tooltip) {
            this.tooltip.style.display = 'flex';
          }
        }, 3200);
      }
    },

    dismissTooltip() {
      if (this.tooltip) {
        this.tooltip.style.display = 'none';
        sessionStorage.setItem('voyo_tooltip_dismissed', 'true');
      }
    },

    open() {
      this.isOpen = true;
      if (this.window) this.window.classList.add('is-open');
      if (this.launcherBtn) this.launcherBtn.classList.add('is-active');
      this.dismissTooltip();
      if (this.badge) this.badge.style.display = 'none';
      if (this.input) this.input.focus();
      this.scrollToBottom();
    },

    close() {
      this.isOpen = false;
      if (this.window) this.window.classList.remove('is-open');
      if (this.launcherBtn) this.launcherBtn.classList.remove('is-active');
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    toggleMute() {
      const isMuted = this.synth.toggleMute();
      this.updateMuteIcon();
    },

    updateMuteIcon() {
      if (!this.muteBtn) return;
      this.muteBtn.innerHTML = this.synth.muted ? '🔇' : '🔊';
      this.muteBtn.title = this.synth.muted ? 'Unmute Sound' : 'Mute Sound';
    },

    scrollToBottom() {
      if (this.body) {
        setTimeout(() => {
          this.body.scrollTop = this.body.scrollHeight;
        }, 50);
      }
    },

    // 3. Voice Input via Web Speech API
    initVoiceRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'hi-IN'; // Will recognize Hindi & English mixed

        this.recognition.onstart = () => {
          this.isListening = true;
          if (this.voiceBtn) this.voiceBtn.classList.add('is-listening');
          if (this.input) this.input.placeholder = 'Bolna shuru karein (Listening)...';
        };

        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (this.input) this.input.value = transcript;
          setTimeout(() => this.handleSend(), 400);
        };

        this.recognition.onerror = () => {
          this.stopVoice();
        };

        this.recognition.onend = () => {
          this.stopVoice();
        };
      } else {
        if (this.voiceBtn) this.voiceBtn.style.display = 'none';
      }
    },

    toggleVoice() {
      if (!this.recognition) return;
      if (this.isListening) {
        this.recognition.stop();
      } else {
        try {
          this.recognition.start();
        } catch (e) {
          this.recognition.stop();
        }
      }
    },

    stopVoice() {
      this.isListening = false;
      if (this.voiceBtn) this.voiceBtn.classList.remove('is-listening');
      if (this.input) this.input.placeholder = 'Puchiye koi bhi sawal / Type your question...';
    },

    // 4. Message Handling & Rendering
    handleSend() {
      if (!this.input) return;
      const text = this.input.value.trim();
      if (!text) return;

      this.input.value = '';
      this.sendMessage(text, 'user');
      this.synth.playSendTone();

      // Show typing indicator
      this.showTypingIndicator();

      // Generate Response with realistic delay
      const delay = Math.floor(Math.random() * 350) + 500;
      setTimeout(() => {
        this.hideTypingIndicator();
        this.generateBotResponse(text);
        this.synth.playReceiveTone();
      }, delay);
    },

    sendMessage(text, sender, cardData = null) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const msgObj = {
        id: Date.now(),
        sender: sender,
        text: text,
        time: timeStr,
        cardData: cardData
      };

      this.history.push(msgObj);
      this.saveChatHistory();
      this.renderMessage(msgObj);
    },

    renderMessage(msg) {
      if (!this.body) return;

      const isUser = msg.sender === 'user';
      const row = document.createElement('div');
      row.className = `voyo-msg-row ${isUser ? 'is-user' : 'is-bot'}`;

      let cardHTML = '';
      if (msg.cardData) {
        cardHTML = this.createCardHTML(msg.cardData);
      }

      row.innerHTML = `
        <div class="voyo-msg-avatar">
          ${isUser ? '👤' : '🤖'}
        </div>
        <div class="voyo-msg-bubble">
          <div>${this.formatMarkdown(msg.text)}</div>
          ${cardHTML}
          <span class="voyo-msg-time">${msg.time}</span>
        </div>
      `;

      this.body.appendChild(row);
      this.scrollToBottom();
    },

    createCardHTML(data) {
      if (data.type === 'lead_form') {
        return `
          <div class="voyo-chat-lead-box">
            <div style="font-weight: 800; color: #0a192f; margin-bottom: 6px; font-size: 0.85rem;">📞 Request Free Callback from Travel Specialist</div>
            <input type="text" id="voyoLeadName" class="voyo-chat-lead-input" placeholder="Aapka Naam (Your Name)" required>
            <input type="tel" id="voyoLeadPhone" class="voyo-chat-lead-input" placeholder="WhatsApp / Mobile Number" required>
            <button type="button" onclick="window.submitVoyoChatLead('${data.destination || 'General Trip'}')" class="voyo-card-btn voyo-card-btn-primary" style="width: 100%; padding: 8px; font-size: 0.8125rem;">
              ⚡ Connect with Concierge (15 Min Callback)
            </button>
          </div>
        `;
      }

      if (data.type === 'lead_success') {
        return `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; margin-top: 8px; text-align: center;">
            <div style="font-size: 1.5rem; margin-bottom: 2px;">✅</div>
            <div style="font-weight: 800; color: #166534; font-size: 0.85rem;">Callback Request Confirmed!</div>
            <div style="font-size: 0.75rem; color: #15803d; margin-top: 4px;">
              Reference ID: <strong>${data.refId}</strong><br>
              Our destination specialist will call <strong>${data.phone}</strong> shortly.
            </div>
          </div>
        `;
      }

      if (data.type === 'destination_card') {
        return `
          <div class="voyo-chat-card">
            <img src="${data.img}" alt="${data.name}" class="voyo-chat-card-img" loading="lazy">
            <div class="voyo-chat-card-body">
              <span class="voyo-chat-card-tag">${data.tag}</span>
              <div class="voyo-chat-card-title">${data.name}</div>
              <div class="voyo-chat-card-meta">
                <span>⏱️ ${data.duration}</span>
                <span class="voyo-chat-card-price">${data.approxPrice}</span>
              </div>
              <div style="font-size: 0.75rem; color: #475569; margin-bottom: 10px;">
                🌟 <strong>Highlights:</strong> ${data.highlights}
              </div>
              <div class="voyo-chat-card-actions">
                <a href="${data.link}" class="voyo-card-btn voyo-card-btn-primary">
                  View Full Guide ➔
                </a>
                <button type="button" onclick="window.openVoyoChatLead('${data.name}')" class="voyo-card-btn voyo-card-btn-secondary">
                  📞 Get Quote
                </button>
              </div>
            </div>
          </div>
        `;
      }

      return '';
    },

    formatMarkdown(text) {
      if (!text) return '';
      let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Bold: **text**
      escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic: *text*
      escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Bullet points
      escaped = escaped.replace(/^•\s*(.*)$/gm, '<li>$1</li>');
      if (escaped.includes('<li>')) {
        escaped = escaped.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
      }
      // Line breaks
      escaped = escaped.replace(/\n/g, '<br>');

      return escaped;
    },

    showTypingIndicator() {
      if (!this.body) return;
      const indicator = document.createElement('div');
      indicator.id = 'voyoTypingIndicator';
      indicator.className = 'voyo-typing-row';
      indicator.innerHTML = `
        <div class="voyo-msg-avatar" style="font-size: 11px;">🤖</div>
        <div class="voyo-typing-dots">
          <span class="voyo-typing-dot"></span>
          <span class="voyo-typing-dot"></span>
          <span class="voyo-typing-dot"></span>
        </div>
      `;
      this.body.appendChild(indicator);
      this.scrollToBottom();
    },

    hideTypingIndicator() {
      const el = document.getElementById('voyoTypingIndicator');
      if (el) el.remove();
    },

    // 5. Intelligent NLP Response Engine (Hindi, Hinglish & English)
    generateBotResponse(query) {
      const q = query.toLowerCase().trim();

      // Check Callback / Contact human
      if (q.includes('call') || q.includes('contact') || q.includes('baat karni') || q.includes('human') || q.includes('phone') || q.includes('agent') || q.includes('number') || q.includes('help desk')) {
        this.sendMessage(
          "Sure! Humare licensed travel concierges available hain. Please apna naam aur contact number enter karein — humari team aapko 15 minute ke andar call karegi:",
          'bot',
          { type: 'lead_form', destination: 'Custom Trip' }
        );
        return;
      }

      // Check Goa
      if (q.includes('goa')) {
        const dest = this.destinationsData.find(d => d.id === 'goa');
        this.sendMessage(
          "🏖️ **Goa Beach Holiday Details:**\n\n• **Best Season:** November se February (perfect weather & beach parties)\n• **Estimated Budget:** ₹12,000 - ₹18,000 per person (4 Days/3 Nights)\n• **Top Attractions:** Baga Beach, Calangute, Dudhsagar Waterfalls, Sunset Cruise & North Goa Nightlife.\n• **Safety:** 100% verified homestays & solo-women friendly cab partners.",
          'bot',
          { type: 'destination_card', ...dest }
        );
        return;
      }

      // Check Manali
      if (q.includes('manali') || q.includes('snow') || q.includes('himachal')) {
        const dest = this.destinationsData.find(d => d.id === 'manali');
        this.sendMessage(
          "❄️ **Manali & Solang Valley Package:**\n\n• **Snow Season:** December se February (Solang Valley & Rohtang me heavy snowfall)\n• **Estimated Budget:** ₹14,000 - ₹22,000 per person (5 Days/4 Nights)\n• **Inclusions:** Scenic river-view hotel, daily buffet breakfast, Solang Valley transfer & Old Manali tour.\n• **Transit Tip:** Delhi/Chandigarh se luxury overnight Volvo bus sabse comfortable aur sasta option hai!",
          'bot',
          { type: 'destination_card', ...dest }
        );
        return;
      }

      // Check Kerala
      if (q.includes('kerala') || q.includes('munnar') || q.includes('alleppey')) {
        const dest = this.destinationsData.find(d => d.id === 'kerala');
        this.sendMessage(
          "🌴 **Kerala God's Own Country Tour:**\n\n• **Highlights:** Alleppey private houseboat cruise, Munnar tea hills, and Kovalam lighthouse beach.\n• **Estimated Budget:** ₹18,000 - ₹28,000 per person (6 Days/5 Nights)\n• **Best Time:** September to March (pleasant tropical climate).\n• **Zero Hidden Fees:** All taxes, fuel & toll allowances include rehte hain.",
          'bot',
          { type: 'destination_card', ...dest }
        );
        return;
      }

      // Check Kashmir
      if (q.includes('kashmir') || q.includes('gulmarg') || q.includes('srinagar')) {
        const dest = this.destinationsData.find(d => d.id === 'kashmir');
        this.sendMessage(
          "🏔️ **Kashmir Valley Tour:**\n\n• **Top Attractions:** Srinagar Dal Lake Shikara ride, Gulmarg Gondola Cable Car, and Pahalgam Betaab Valley.\n• **Budget:** Approx ₹22,000 - ₹35,000 per person (6 Days/5 Nights).\n• **Best Time:** April to October for gardens; Dec-Feb for winter skiing in Gulmarg.",
          'bot',
          { type: 'destination_card', ...dest }
        );
        return;
      }

      // Check Jaipur / Rajasthan
      if (q.includes('jaipur') || q.includes('rajasthan') || q.includes('fort') || q.includes('udaipur')) {
        const dest = this.destinationsData.find(d => d.id === 'jaipur');
        this.sendMessage(
          "👑 **Royal Rajasthan Tour:**\n\n• **Highlights:** Amer Fort sound & light show, City Palace, Hawa Mahal, and cultural dinner.\n• **Budget:** ₹9,500 - ₹15,000 per person (3 Days / 2 Nights).\n• **Best Time:** October to March.",
          'bot',
          { type: 'destination_card', ...dest }
        );
        return;
      }

      // Check Bali / Dubai / International
      if (q.includes('bali') || q.includes('dubai') || q.includes('international') || q.includes('abroad')) {
        const dest = this.destinationsData.find(d => d.id === 'bali');
        this.sendMessage(
          "✈️ **International Escapes (Bali & Dubai):**\n\n• **Bali Package:** 7D/6N in Ubud & Seminyak private pool villa (₹55,000 - ₹85,000)\n• **Dubai Package:** 5D/4N with Burj Khalifa 124th floor, Desert Safari & Dhow Cruise (₹45,000 - ₹75,000)\n• **Visa Assistance:** VoyoSphere team handles seamless e-Visa documentation for Indian travelers.",
          'bot',
          { type: 'destination_card', ...dest }
        );
        return;
      }

      // Check Budget & Cost Calculation
      if (q.includes('budget') || q.includes('kharcha') || q.includes('cost') || q.includes('sasta') || q.includes('calculator') || q.includes('price')) {
        this.sendMessage(
          "💰 **VoyoSphere Budget Planner:**\n\nHumare platform par har destination ka transparent price breakdown milta hai:\n\n• **Budget Trips (< ₹12,000):** Jaipur, Rishikesh, Agra, Amritsar, Kasol\n• **Moderate Trips (₹12,000 - ₹22,000):** Goa, Manali, Shimla, Udaipur, Nainital\n• **Luxury Trips (₹25,000+):** Kerala, Kashmir, Andaman, Ladakh, Bali\n\nAap humara [AI Trip Planner & Cost Calculator](/trip-planner/) try kar sakte hain, jahan group size aur days ke according per-person share calculate hota hai!",
          'bot'
        );
        return;
      }

      // Check Solo Women Travel
      if (q.includes('women') || q.includes('female') || q.includes('safety') || q.includes('safe') || q.includes('akeli')) {
        this.sendMessage(
          "👩 **Solo Women Safe Guarantee on VoyoSphere:**\n\n• **Vetted Stays:** Har hotel and homestay ka safety score 4.8+ verified hota hai.\n• **Police-Verified Drivers:** Sightseeing cabs me background-checked chauffeurs rehte hain.\n• **24/7 Live Concierge:** Trip ke dauran dedicated support manager WhatsApp/Call par continuously connected rehta hai.\n• Check all [Solo Women Stays & Destinations](/destinations/?category=solo-women)!",
          'bot'
        );
        return;
      }

      // Check Flights & Transit
      if (q.includes('flight') || q.includes('train') || q.includes('bus') || q.includes('ticket') || q.includes('transit')) {
        this.sendMessage(
          "🚆 **Multi-Modal Transit Comparison (Train vs Bus vs Flight):**\n\n• **Flight:** Sabse fast (saves ~15 to 18 hours travel time). [Compare Live Flights Here](/flights/)\n• **Express Trains (Rajdhani/Vande Bharat):** Scenic, comfortable aur flight se 40% sasta.\n• **AC Sleeper Buses:** Direct connectivity to hill stations (Manali, Kasol, Rishikesh) without layovers.\n\nAap kis destination ke liye tickets compare karna chahte hain?",
          'bot'
        );
        return;
      }

      // Check Refund & Cancellation Policy
      if (q.includes('refund') || q.includes('cancel') || q.includes('paisa') || q.includes('wapas') || q.includes('guarantee')) {
        this.sendMessage(
          "🔄 **100% Refund Policy on VoyoSphere:**\n\n• **Flexible 48-Hour Cancellation:** Check-in se 48 hours pehle cancel karne par 100% full refund milta hai.\n• **Instant Bank / UPI Transfer:** Refund 3–5 working days me seedhe aapke account me credit hota hai.\n• **Zero Hidden Deduction:** No processing penalty charges. Read full [Cancellation & Refund Policy](/cancellation-refund-policy/).",
          'bot'
        );
        return;
      }

      // Check Discount & Promo Codes
      if (q.includes('discount') || q.includes('offer') || q.includes('coupon') || q.includes('code') || q.includes('promo')) {
        this.sendMessage(
          "🎉 **Active Special Discounts for You:**\n\n• Use Promo Code: `SUMMER35` checkout par lagane par **Flat 15% Instant Discount** milta hai!\n• **Group Travel:** 4 ya usse zyada participants par extra 5% saving.\n• Abhi kisi bhi tour ya hotel par ye code use kar sakte hain!",
          'bot'
        );
        return;
      }

      // Greetings (Hi, Hello, Namaste, etc.)
      if (q.includes('hi') || q.includes('hello') || q.includes('namaste') || q.includes('hey') || q.includes('kaise ho')) {
        this.sendMessage(
          "👋 **Namaste! VoyoBot AI me aapka swagat hai.**\n\nMain aapki travel planning, package selection, hotels, flights aur budget estimation me madad kar sakta hu.\n\nAap kahan ghumne ka plan kar rahe hain? (e.g. *Goa, Manali, Kerala, Kashmir, Bali ya koi aur jagah*)?",
          'bot'
        );
        return;
      }

      // Default Fallback
      this.sendMessage(
        `Main aapki is inquiry: **"${query}"** me madad kar sakta hu!\n\n• 🏖️ **Packages dekhne ke liye:** [Guided Tours](/tours/) ya [Destinations](/destinations/) check karein.\n• 💰 **Budget calculate karne ke liye:** [AI Trip Planner](/trip-planner/) par jayein.\n• 📞 **Specialist se baat karne ke liye:** Niche diye gaye button se free callback request karein:`,
        'bot',
        { type: 'lead_form', destination: query }
      );
    },

    // 6. Persistence & History
    saveChatHistory() {
      try {
        sessionStorage.setItem('voyo_chat_history', JSON.stringify(this.history));
      } catch (e) {}
    },

    loadChatHistory() {
      try {
        const saved = sessionStorage.getItem('voyo_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.history = parsed;
            if (this.body) this.body.innerHTML = '';
            parsed.forEach(msg => this.renderMessage(msg));
            return;
          }
        }
      } catch (e) {}

      // Default initial bot welcome
      this.sendMessage(
        "👋 **Namaste & Welcome to VoyoSphere!**\n\nI am **VoyoBot**, your 24/7 AI travel guide. How can I help you today?\n• 🏖️ Find best holiday packages & hidden gems\n• 💰 Calculate complete holiday budget\n• ✈️ Compare flights, trains & hotels\n• 👩 Verified solo women safe stays\n• 📞 Request a free callback from our travel expert",
        'bot'
      );
    },

    clearHistory() {
      sessionStorage.removeItem('voyo_chat_history');
      this.history = [];
      if (this.body) this.body.innerHTML = '';
      this.loadChatHistory();
    }
  };

  // 7. Global API Exposure
  window.VoyoBot = VoyoBot;

  window.openVoyoChatBot = function (initialPrompt = '') {
    VoyoBot.open();
    if (initialPrompt && initialPrompt.trim()) {
      VoyoBot.sendMessage(initialPrompt, 'user');
      VoyoBot.showTypingIndicator();
      setTimeout(() => {
        VoyoBot.hideTypingIndicator();
        VoyoBot.generateBotResponse(initialPrompt);
        VoyoBot.synth.playReceiveTone();
      }, 600);
    }
  };

  window.closeVoyoChatBot = function () {
    VoyoBot.close();
  };

  window.toggleVoyoChatBot = function () {
    VoyoBot.toggle();
  };

  window.openVoyoChatLead = function (destName) {
    VoyoBot.open();
    VoyoBot.sendMessage(
      `Specialist callback request for: **${destName}**. Enter your details below:`,
      'bot',
      { type: 'lead_form', destination: destName }
    );
  };

  window.submitVoyoChatLead = function (destName) {
    const nameInput = document.getElementById('voyoLeadName');
    const phoneInput = document.getElementById('voyoLeadPhone');
    if (!phoneInput || !phoneInput.value.trim()) {
      alert('Please enter your mobile/WhatsApp number.');
      if (phoneInput) phoneInput.focus();
      return;
    }

    const name = nameInput ? nameInput.value.trim() : 'Valued Traveler';
    const phone = phoneInput.value.trim();
    const refId = 'VOYO-INQ-' + Math.floor(100000 + Math.random() * 900000);

    // Save lead in localStorage for persistence
    try {
      const savedLeads = JSON.parse(localStorage.getItem('voyo_leads') || '[]');
      savedLeads.unshift({
        refId: refId,
        name: name,
        phone: phone,
        destination: destName,
        date: new Date().toISOString()
      });
      localStorage.setItem('voyo_leads', JSON.stringify(savedLeads));
    } catch (e) {}

    // Send via AJAX if WordPress endpoint exists
    if (window.travelEaseData && window.travelEaseData.ajaxUrl) {
      const formData = new FormData();
      formData.append('action', 'travelease_chatbot_lead');
      formData.append('nonce', window.travelEaseData.nonce || '');
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('destination', destName);
      formData.append('ref_id', refId);

      fetch(window.travelEaseData.ajaxUrl, {
        method: 'POST',
        body: formData
      }).catch(() => {});
    }

    VoyoBot.sendMessage(
      `Dhanyawaad ${name}! Aapka request register ho gaya hai. Humare travel expert 15 minutes me ${phone} par call karke best custom itinerary & discount rates share karenge.`,
      'bot',
      { type: 'lead_success', refId: refId, phone: phone }
    );
  };

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VoyoBot.init());
  } else {
    VoyoBot.init();
  }
})();
