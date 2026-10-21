// Learning content. Add more items here — the app picks them up automatically.
// zh = Traditional Chinese meaning, to help Hong Kong learners.

const VOCAB = [
  // ---- Daily life ----
  { word: "appointment", pos: "noun", ipa: "/əˈpɔɪnt.mənt/", meaning: "an arranged time to meet someone", zh: "預約；約會", example: "I have a doctor's appointment at 3 p.m.", topic: "Daily life", level: 1 },
  { word: "convenient", pos: "adj", ipa: "/kənˈviː.ni.ənt/", meaning: "easy to use or suitable for your plans", zh: "方便的", example: "Is Friday convenient for you?", topic: "Daily life", level: 1 },
  { word: "crowded", pos: "adj", ipa: "/ˈkraʊ.dɪd/", meaning: "full of people", zh: "擠擁的", example: "The MTR is very crowded in the morning.", topic: "Daily life", level: 1 },
  { word: "borrow", pos: "verb", ipa: "/ˈbɒr.əʊ/", meaning: "to take something and give it back later", zh: "借（入）", example: "Can I borrow your pen?", topic: "Daily life", level: 1 },
  { word: "lend", pos: "verb", ipa: "/lend/", meaning: "to give something to someone for a short time", zh: "借（出）", example: "Could you lend me twenty dollars?", topic: "Daily life", level: 1 },
  { word: "receipt", pos: "noun", ipa: "/rɪˈsiːt/", meaning: "a paper that shows you have paid", zh: "收據", example: "Please keep the receipt.", topic: "Daily life", level: 1 },
  { word: "available", pos: "adj", ipa: "/əˈveɪ.lə.bəl/", meaning: "free to use, buy or meet", zh: "有空的；可用的", example: "Are you available this afternoon?", topic: "Daily life", level: 1 },
  { word: "recommend", pos: "verb", ipa: "/ˌrek.əˈmend/", meaning: "to suggest something is good", zh: "推薦", example: "Can you recommend a good restaurant?", topic: "Daily life", level: 1 },
  { word: "delicious", pos: "adj", ipa: "/dɪˈlɪʃ.əs/", meaning: "tasting very good", zh: "美味的", example: "This milk tea is delicious.", topic: "Daily life", level: 1 },
  { word: "exhausted", pos: "adj", ipa: "/ɪɡˈzɔː.stɪd/", meaning: "extremely tired", zh: "筋疲力盡的", example: "I was exhausted after the exam.", topic: "Daily life", level: 2 },
  { word: "afford", pos: "verb", ipa: "/əˈfɔːd/", meaning: "to have enough money for something", zh: "負擔得起", example: "I can't afford a new phone.", topic: "Daily life", level: 2 },
  { word: "complain", pos: "verb", ipa: "/kəmˈpleɪn/", meaning: "to say you are unhappy about something", zh: "投訴；抱怨", example: "He complained about the noise.", topic: "Daily life", level: 2 },

  // ---- University ----
  { word: "assignment", pos: "noun", ipa: "/əˈsaɪn.mənt/", meaning: "a piece of work given to students", zh: "功課；作業", example: "The assignment is due next Monday.", topic: "University", level: 1 },
  { word: "deadline", pos: "noun", ipa: "/ˈded.laɪn/", meaning: "the latest time to finish something", zh: "限期", example: "I need an extension on the deadline.", topic: "University", level: 1 },
  { word: "lecture", pos: "noun", ipa: "/ˈlek.tʃər/", meaning: "a formal talk to teach students", zh: "講課", example: "The lecture starts at nine.", topic: "University", level: 1 },
  { word: "tutorial", pos: "noun", ipa: "/tjuːˈtɔː.ri.əl/", meaning: "a small class for discussion", zh: "導修課", example: "We discussed the case study in the tutorial.", topic: "University", level: 1 },
  { word: "presentation", pos: "noun", ipa: "/ˌprez.ənˈteɪ.ʃən/", meaning: "a talk that explains something to a group", zh: "簡報；演講", example: "Our group presentation is ten minutes long.", topic: "University", level: 1 },
  { word: "supervisor", pos: "noun", ipa: "/ˈsuː.pə.vaɪ.zər/", meaning: "a person who guides your project", zh: "導師；主管", example: "I will meet my supervisor about my final year project.", topic: "University", level: 2 },
  { word: "plagiarism", pos: "noun", ipa: "/ˈpleɪ.dʒər.ɪ.zəm/", meaning: "copying someone else's work as your own", zh: "抄襲", example: "Plagiarism is taken very seriously.", topic: "University", level: 2 },
  { word: "submit", pos: "verb", ipa: "/səbˈmɪt/", meaning: "to give your work to be checked", zh: "提交", example: "Submit your report on Moodle.", topic: "University", level: 1 },
  { word: "extension", pos: "noun", ipa: "/ɪkˈsten.ʃən/", meaning: "extra time to finish something", zh: "延期", example: "Can I ask for an extension?", topic: "University", level: 2 },
  { word: "reference", pos: "noun", ipa: "/ˈref.ər.əns/", meaning: "a source you mention in your writing", zh: "參考資料", example: "Include at least ten references.", topic: "University", level: 2 },

  // ---- Academic / Science ----
  { word: "hypothesis", pos: "noun", ipa: "/haɪˈpɒθ.ə.sɪs/", meaning: "an idea to be tested by experiment", zh: "假設", example: "Our hypothesis is that temperature affects efficiency.", topic: "Academic", level: 2 },
  { word: "analyse", pos: "verb", ipa: "/ˈæn.əl.aɪz/", meaning: "to study something in detail", zh: "分析", example: "We analysed the data using Excel.", topic: "Academic", level: 2 },
  { word: "significant", pos: "adj", ipa: "/sɪɡˈnɪf.ɪ.kənt/", meaning: "important or large enough to notice", zh: "顯著的；重要的", example: "There was a significant increase in current.", topic: "Academic", level: 2 },
  { word: "approximately", pos: "adv", ipa: "/əˈprɒk.sɪ.mət.li/", meaning: "close to but not exactly", zh: "大約", example: "The sample is approximately two millimetres thick.", topic: "Academic", level: 2 },
  { word: "efficiency", pos: "noun", ipa: "/ɪˈfɪʃ.ən.si/", meaning: "how well something works without waste", zh: "效率", example: "The solar cell has an efficiency of 12 percent.", topic: "Academic", level: 2 },
  { word: "consequently", pos: "adv", ipa: "/ˈkɒn.sɪ.kwənt.li/", meaning: "as a result", zh: "因此", example: "The film cracked; consequently, the device failed.", topic: "Academic", level: 3 },
  { word: "limitation", pos: "noun", ipa: "/ˌlɪm.ɪˈteɪ.ʃən/", meaning: "a weakness or limit of something", zh: "限制；局限", example: "One limitation of this study is the small sample size.", topic: "Academic", level: 3 },
  { word: "demonstrate", pos: "verb", ipa: "/ˈdem.ən.streɪt/", meaning: "to show clearly", zh: "證明；展示", example: "The results demonstrate a clear trend.", topic: "Academic", level: 2 },
  { word: "methodology", pos: "noun", ipa: "/ˌmeθ.əˈdɒl.ə.dʒi/", meaning: "the methods used in research", zh: "方法論", example: "Section two describes our methodology.", topic: "Academic", level: 3 },
  { word: "comprehensive", pos: "adj", ipa: "/ˌkɒm.prɪˈhen.sɪv/", meaning: "including everything", zh: "全面的", example: "We did a comprehensive literature review.", topic: "Academic", level: 3 },

  // ---- Workplace / Interview ----
  { word: "colleague", pos: "noun", ipa: "/ˈkɒl.iːɡ/", meaning: "a person you work with", zh: "同事", example: "My colleagues are very friendly.", topic: "Workplace", level: 1 },
  { word: "responsible", pos: "adj", ipa: "/rɪˈspɒn.sə.bəl/", meaning: "having a duty to take care of something", zh: "負責的", example: "I was responsible for the lab equipment.", topic: "Workplace", level: 2 },
  { word: "experience", pos: "noun", ipa: "/ɪkˈspɪə.ri.əns/", meaning: "knowledge you get from doing something", zh: "經驗", example: "I have two years of experience in customer service.", topic: "Workplace", level: 1 },
  { word: "strength", pos: "noun", ipa: "/streŋθ/", meaning: "a good quality or ability", zh: "優點；強項", example: "My biggest strength is teamwork.", topic: "Workplace", level: 2 },
  { word: "weakness", pos: "noun", ipa: "/ˈwiːk.nəs/", meaning: "a quality that is not good", zh: "弱點", example: "My weakness is public speaking, but I am improving.", topic: "Workplace", level: 2 },
  { word: "opportunity", pos: "noun", ipa: "/ˌɒp.əˈtʃuː.nə.ti/", meaning: "a chance to do something", zh: "機會", example: "Thank you for this opportunity.", topic: "Workplace", level: 2 },
  { word: "negotiate", pos: "verb", ipa: "/nəˈɡəʊ.ʃi.eɪt/", meaning: "to discuss to reach an agreement", zh: "談判；商討", example: "We need to negotiate the price.", topic: "Workplace", level: 3 },
  { word: "schedule", pos: "noun", ipa: "/ˈʃedʒ.uːl/", meaning: "a plan of times for activities", zh: "時間表", example: "Let me check my schedule.", topic: "Workplace", level: 1 },
  { word: "confident", pos: "adj", ipa: "/ˈkɒn.fɪ.dənt/", meaning: "sure about your abilities", zh: "有自信的", example: "Practise every day and you will feel more confident.", topic: "Workplace", level: 1 },
  { word: "motivated", pos: "adj", ipa: "/ˈməʊ.tɪ.veɪ.tɪd/", meaning: "wanting to do something well", zh: "積極的；有動力的", example: "I am highly motivated to learn.", topic: "Workplace", level: 2 },
];

// Listening (dictation): hear it, type it.
const LISTENING = [
  { text: "Good morning, how are you today?", zh: "早晨，你今日好嗎？", level: 1 },
  { text: "Could you say that again, please?", zh: "可以再講一次嗎？", level: 1 },
  { text: "I'm sorry, I don't understand.", zh: "對唔住，我唔明。", level: 1 },
  { text: "Where is the nearest MTR station?", zh: "最近嘅港鐵站喺邊？", level: 1 },
  { text: "I would like a cup of coffee, please.", zh: "我想要一杯咖啡。", level: 1 },
  { text: "What time does the library close?", zh: "圖書館幾點關門？", level: 1 },
  { text: "My lecture starts at nine o'clock.", zh: "我嘅課九點開始。", level: 1 },
  { text: "Can we meet after class tomorrow?", zh: "我哋聽日下堂後見面好嗎？", level: 1 },
  { text: "The assignment is due next Friday.", zh: "份功課下星期五交。", level: 2 },
  { text: "I need to finish my lab report tonight.", zh: "我今晚要完成實驗報告。", level: 2 },
  { text: "Could you explain this part in more detail?", zh: "可唔可以詳細解釋呢部分？", level: 2 },
  { text: "Let me check my schedule and get back to you.", zh: "等我睇睇時間表再覆你。", level: 2 },
  { text: "The results show a significant increase in efficiency.", zh: "結果顯示效率有顯著提升。", level: 3 },
  { text: "One limitation of this study is the small sample size.", zh: "本研究嘅一個局限係樣本數量細。", level: 3 },
  { text: "I am interested in this position because it matches my skills.", zh: "我對呢個職位有興趣因為佢配合我嘅技能。", level: 3 },
  { text: "Thank you for giving me the opportunity to present today.", zh: "多謝你畀機會我今日做簡報。", level: 3 },
];

// Speaking: read aloud / shadowing.
const SPEAKING = [
  { text: "Hello, my name is Yuk Fung. Nice to meet you.", tip: "Link the words: 'name_is', 'meet_you'.", level: 1 },
  { text: "I study at the University of Hong Kong.", tip: "'study' has a short /ʌ/ sound, like 'stud-ee'.", level: 1 },
  { text: "I think this is a really good idea.", tip: "'think' starts with /θ/ — put your tongue between your teeth. Not 'fink' or 'sink'.", level: 1 },
  { text: "Could you help me with this, please?", tip: "Say 'could you' as 'cou-jew'.", level: 1 },
  { text: "I'm sorry I'm late. The traffic was terrible.", tip: "Pronounce the final /t/ in 'late'.", level: 1 },
  { text: "Today I would like to talk about my final year project.", tip: "Stress: to-DAY, FI-nal, PRO-ject.", level: 2 },
  { text: "First, I will introduce the background of the research.", tip: "Clear /r/ in 'research' and 'introduce'. Don't say /l/.", level: 2 },
  { text: "As you can see from this graph, the efficiency increases.", tip: "Final /s/ in 'increases' — don't drop it.", level: 2 },
  { text: "In conclusion, our results support the hypothesis.", tip: "Stress: con-CLU-sion, hy-PO-the-sis.", level: 3 },
  { text: "I believe my experience makes me a strong candidate.", tip: "'believe' — long /iː/. 'strong' ends with /ŋ/.", level: 3 },
];

// Minimal pairs — sounds Cantonese speakers often mix up.
const MINIMAL_PAIRS = [
  { a: "ship", b: "sheep", focus: "/ɪ/ short vs /iː/ long" },
  { a: "live", b: "leave", focus: "/ɪ/ short vs /iː/ long" },
  { a: "full", b: "fool", focus: "/ʊ/ short vs /uː/ long" },
  { a: "light", b: "right", focus: "/l/ vs /r/" },
  { a: "glass", b: "grass", focus: "/l/ vs /r/" },
  { a: "think", b: "sink", focus: "/θ/ vs /s/" },
  { a: "three", b: "free", focus: "/θ/ vs /f/" },
  { a: "they", b: "day", focus: "/ð/ vs /d/" },
  { a: "vest", b: "west", focus: "/v/ vs /w/" },
  { a: "very", b: "wary", focus: "/v/ vs /w/" },
  { a: "bad", b: "bed", focus: "/æ/ vs /e/" },
  { a: "man", b: "men", focus: "/æ/ vs /e/" },
  { a: "night", b: "nine", focus: "final /t/ vs /n/" },
  { a: "rice", b: "rise", focus: "final /s/ vs /z/" },
];
