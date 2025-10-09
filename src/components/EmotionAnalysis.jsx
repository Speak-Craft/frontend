import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaMicrophone, FaStop, FaPlay, FaPause, FaCamera, FaBrain, FaTrophy } from 'react-icons/fa';
import Webcam from 'react-webcam';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import Gauge from './Gauge';
import Footer from './Footer';
import EmotionAnalysisActivity from './EmotionAnalysisActivity';

const BACKEND_ANALYZE = 'http://localhost:8000/analyze';
const BACKEND_FRAME = 'http://localhost:8000/analyze_frame';
const EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise'];
const TARGETS = ['Happy', 'Neutral', 'Confident', 'Calm', 'Empathetic', 'Serious'];

// Affect map for client alignment
const AFFECT = {
  Angry: { v: -0.6, e: 0.9 },
  Disgust: { v: -0.8, e: 0.6 },
  Fear: { v: -0.7, e: 0.7 },
  Happy: { v: 0.8, e: 0.8 },
  Neutral: { v: 0.1, e: 0.2 },
  Sad: { v: -0.8, e: 0.2 },
  Surprise: { v: 0.4, e: 0.8 },
};

const TARGET_VEC = {
  Happy: { v: 0.75, e: 0.75 },
  Neutral: { v: 0.1, e: 0.25 },
  Confident: { v: 0.55, e: 0.65 },
  Calm: { v: 0.35, e: 0.35 },
  Empathetic: { v: 0.45, e: 0.4 },
  Serious: { v: 0.15, e: 0.45 },
};

// Text emotion inference
const KW = {
  Sad: ['sad','cry','tears','loss','lost','grief','grieving','passed away','funeral','lonely','alone','empty','hurt','heartbroken','pain','miss you','regret','mourn','sorrow','devastated'],
  Happy: ['happy','joy','smile','excited','delight','glad','cheer','proud','celebrate','win','won','great news','thanks','grateful','relieved','blessed','hurray'],
  Angry: ['angry','mad','furious','hate','rage','annoyed','irritated','upset','frustrated','unfair','betrayed','disgusting','disgrace']
};
const NEGATIONS = ['not','never','no','hardly','barely','scarcely','without',"isn't","wasn't","don't","didn't","can't","won't"];
const INTENSE = ['very','so','extremely','really','too','incredibly','super','utterly','deeply','truly'];

function scoreBag(text) {
  const t = text.toLowerCase();
  let sc = { Sad: 0, Happy: 0, Angry: 0 };
  const words = t.split(/\b/).map(w => w.trim()).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    Object.entries(KW).forEach(([emo, list]) => {
      if (list.some(k => t.includes(k))) {
        const winStart = Math.max(0, i - 3), winEnd = Math.min(words.length - 1, i + 3);
        const win = words.slice(winStart, winEnd + 1);
        const neg = win.some(x => NEGATIONS.includes(x));
        const amp = 1 + 0.3 * win.filter(x => INTENSE.includes(x)).length;
        sc[emo] += neg ? 0 : amp;
      }
    });
  }
  return sc;
}

function inferTextEmotion(text) {
  if (!text || !text.trim()) return { label: 'Neutral', confidence: 0.55 };
  const sc = scoreBag(text);
  const entries = Object.entries(sc).sort((a,b)=>b[1]-a[1]);
  const [top, val] = entries[0];
  if (val === 0) return { label: 'Neutral', confidence: 0.6 };
  const sum = entries.reduce((s, [,v]) => s+v, 0) || 1;
  const conf = Math.min(0.95, 0.6 + 0.4 * (val / sum));
  return { label: top, confidence: conf };
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));

function mixToVector(mix) {
  const entries = Object.entries(mix);
  if (!entries.length) return { v: 0.1, e: 0.1 };
  let V = 0, E = 0, sum = 0;
  entries.forEach(([emo, pct]) => {
    const a = AFFECT[emo]; if (!a) return;
    const w = clamp01((Number(pct)||0)/100);
    V += a.v * w; E += a.e * w; sum += w;
  });
  if (sum === 0) return { v: 0.1, e: 0.1 };
  return { v: V / sum, e: E / sum };
}

function scoreAlignmentClient(mix, target) {
  const tgt = TARGET_VEC[target] || TARGET_VEC['Confident'];
  const obs = mixToVector(mix);
  const dv = Math.abs(tgt.v - obs.v);
  const de = Math.abs(tgt.e - obs.e);
  const dist = Math.sqrt(dv*dv + de*de);
  return Math.round(clamp01(1 - dist / 1.6) * 100);
}

const EmotionAnalysis = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('emotion-aware');
  
  // Face Analysis state
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recordingStopped, setRecordingStopped] = useState(false);
  const [serverError, setServerError] = useState('');

  const [ferEmotions, setFerEmotions] = useState({});
  const [faceDetected, setFaceDetected] = useState(false);
  const [visibleSeconds, setVisibleSeconds] = useState(0);
  const [awaySeconds, setAwaySeconds] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [annotatedUrl, setAnnotatedUrl] = useState('');
  const [summaryTop3, setSummaryTop3] = useState([]);

  // coaching / alignment
  const [coachSummary, setCoachSummary] = useState('');
  const [coachScore, setCoachScore] = useState(null);
  const [coachStrengths, setCoachStrengths] = useState([]);
  const [coachAreas, setCoachAreas] = useState([]);
  const [coachTips, setCoachTips] = useState([]);
  const [coachMoments, setCoachMoments] = useState([]);
  const [coachEntropy, setCoachEntropy] = useState(null);
  const [coachSwitches, setCoachSwitches] = useState(null);

  // target & intent & script
  const [targetEmotion, setTargetEmotion] = useState(localStorage.getItem('ea_targetEmotion') || 'Confident');
  const [intentText, setIntentText] = useState(localStorage.getItem('ea_intentText') || '');
  const [scriptText, setScriptText] = useState(localStorage.getItem('ea_scriptText') || '');

  // strict + smoothing controls
  const [strictMode, setStrictMode] = useState(localStorage.getItem('ea_strictMode') === '1');
  const [windowSec, setWindowSec] = useState(Number(localStorage.getItem('ea_windowSec') || 3));
  const [emaAlpha, setEmaAlpha] = useState(Number(localStorage.getItem('ea_emaAlpha') || 0.4));

  // Live aggregates
  const [liveTop, setLiveTop] = useState(null);
  const [liveProbs, setLiveProbs] = useState({});
  const [liveSamples, setLiveSamples] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const emaRef = useRef({});
  const framesRef = useRef([]);
  const lastFlagRef = useRef(0);

  // refs
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const liveRef = useRef(null);
  const activeStreamRef = useRef(null);

  // Tab configuration
  const tabs = [
    { id: 'face-analysis', label: 'Face Analyzer', icon: FaCamera },
    { id: 'emotion-aware', label: 'Emotionally Analyzer', icon: FaBrain },
    { id: 'activity', label: 'Challenge Mode', icon: FaTrophy }
  ];

  // Effects
  useEffect(() => {
    if (isRecording) timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    if (recordingStopped && videoBlob) analyzeVideo();
  }, [recordingStopped, videoBlob]);

  useEffect(() => {
    return () => {
      try { if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop(); } catch {}
      if (activeStreamRef.current) activeStreamRef.current.getTracks().forEach(t => t.stop());
      clearInterval(liveRef.current);
    };
  }, []);

  // persist settings
  useEffect(() => { localStorage.setItem('ea_targetEmotion', targetEmotion); }, [targetEmotion]);
  useEffect(() => { localStorage.setItem('ea_intentText', intentText); }, [intentText]);
  useEffect(() => { localStorage.setItem('ea_scriptText', scriptText); }, [scriptText]);
  useEffect(() => { localStorage.setItem('ea_strictMode', strictMode ? '1' : '0'); }, [strictMode]);
  useEffect(() => { localStorage.setItem('ea_windowSec', String(windowSec)); }, [windowSec]);
  useEffect(() => { localStorage.setItem('ea_emaAlpha', String(emaAlpha)); }, [emaAlpha]);

  // Helper functions
  const resetForNewRecording = () => {
    setRecordingTime(0);
    setFerEmotions({});
    setFaceDetected(false);
    setVisibleSeconds(0);
    setAwaySeconds(0);
    setStartTime(0);
    setEndTime(0);
    setRecordingStopped(false);
    setServerError('');
    setVideoBlob(null);
    setLiveTop(null);
    setLiveProbs({});
    setLiveSamples(0);
    setSummaryTop3([]);
    setAnnotatedUrl('');

    setCoachSummary('');
    setCoachScore(null);
    setCoachStrengths([]);
    setCoachAreas([]);
    setCoachTips([]);
    setCoachMoments([]);
    setCoachEntropy(null);
    setCoachSwitches(null);

    emaRef.current = {};
    framesRef.current = [];
    lastFlagRef.current = 0;
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      resetForNewRecording();
      setCameraOn(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      activeStreamRef.current = stream;

      if (webcamRef.current?.video) {
        webcamRef.current.video.srcObject = stream;
        await webcamRef.current.video.play().catch(() => {});
      }

      const mime =
        MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' :
        MediaRecorder.isTypeSupported('video/webm;codecs=vp8')      ? 'video/webm;codecs=vp8' :
        MediaRecorder.isTypeSupported('video/webm')                  ? 'video/webm' : undefined;

      mediaRecorderRef.current = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 128000 } : undefined);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach(t => t.stop());
          activeStreamRef.current = null;
        }
        try { if (webcamRef.current?.video) webcamRef.current.video.srcObject = null; } catch {}
        setCameraOn(false);
        clearInterval(liveRef.current);
      };

      mediaRecorderRef.current.start(250);
      setIsRecording(true);

      liveRef.current = setInterval(sendLiveFrame, 650); // ~1.5 fps
    } catch (e) {
      console.error('startRecording error:', e);
      setServerError('Could not access camera/mic. Allow permissions or try another browser.');
      setIsRecording(false);
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(t => t.stop());
        activeStreamRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    try { mediaRecorderRef.current.stop(); } catch {}
    setIsRecording(false);
    setRecordingStopped(true);
    setLoading(true);
    // proactively stop live frame loop and camera
    clearInterval(liveRef.current);
    if (activeStreamRef.current) {
      try { activeStreamRef.current.getTracks().forEach(t => t.stop()); } catch {}
      activeStreamRef.current = null;
    }
    try { if (webcamRef.current?.video) webcamRef.current.video.srcObject = null; } catch {}
    setCameraOn(false);

    // Finalize avg FER
    if (framesRef.current.length > 0) {
      const sum = {};
      let n = 0;
      framesRef.current.forEach(({ probs }) => {
        EMOTIONS.forEach(e => { sum[e] = (sum[e]||0) + (probs[e]||0); });
        n++;
      });
      const avgPct = {};
      EMOTIONS.forEach(e => { avgPct[e] = n ? +(sum[e] / n).toFixed(1) : 0; });
      setFerEmotions(avgPct);
      const sorted = Object.entries(avgPct).sort((a, b) => b[1] - a[1]);
      setSummaryTop3(sorted.slice(0, 3));
    }
  };

  // EMA smoothing for live probs
  const smooth = (probs) => {
    const out = {};
    EMOTIONS.forEach(k => {
      const prev = emaRef.current[k] ?? probs[k] ?? 0;
      const x = probs[k] ?? 0;
      const y = emaAlpha * x + (1 - emaAlpha) * prev;
      emaRef.current[k] = y;
      out[k] = y;
    });
    return out;
  };

  // live frame
  const sendLiveFrame = async () => {
    try {
      if (!webcamRef.current) return;
      const dataUrl = webcamRef.current.getScreenshot();
      if (!dataUrl) return;

      const res  = await fetch(dataUrl);
      const blob = await res.blob();

      const form = new FormData();
      form.append('frame', blob, 'frame.jpg');

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);

      const r = await fetch(BACKEND_FRAME, { method: 'POST', body: form, signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) return;
      const j = await r.json();

      if (j.face_detected) {
        setFaceDetected(true);
        // smooth + keep window
        const sm = smooth(j.probs || {});
        const now = recordingTime;
        framesRef.current.push({ t: now, probs: sm });
        // keep only last windowSec seconds
        const cutoff = now - windowSec;
        framesRef.current = framesRef.current.filter(f => f.t >= cutoff);

        // current dominant over window
        const agg = {};
        framesRef.current.forEach(({ probs }) => {
          EMOTIONS.forEach(e => { agg[e] = (agg[e]||0) + (probs[e]||0); });
        });
        const denom = framesRef.current.length || 1;
        const avg = {};
        EMOTIONS.forEach(e => avg[e] = +( (agg[e]||0) / denom ).toFixed(1) );
        setLiveProbs(avg);

        const dom = Object.entries(avg).sort((a,b)=>b[1]-a[1])[0] || ['Neutral', 0];
        setLiveTop(dom[0]);
        setLiveSamples(s => s + 1);

        // LIVE strict mismatch detector
        const { label: expectedLabel } = inferTextEmotion(scriptText);
        if (expectedLabel) {
          const detectedLabel = dom[0];
          const detectedConf  = dom[1]; // 0..100
          const strong = detectedConf >= 40; // window-avg confidence threshold
          const hardMismatch =
            (expectedLabel === 'Sad' && detectedLabel === 'Happy') ||
            (expectedLabel === 'Happy' && (detectedLabel === 'Sad' || detectedLabel === 'Angry')) ||
            (expectedLabel === 'Angry' && (detectedLabel === 'Happy' || detectedLabel === 'Neutral'));

          const shouldFlag = strictMode
            ? (expectedLabel !== detectedLabel && strong)
            : (hardMismatch && strong);

          // debounce: flag at most once each 2s
          if (shouldFlag && now - lastFlagRef.current >= 2) {
            lastFlagRef.current = now;
            const suggestion = buildMismatchSuggestion(expectedLabel, detectedLabel);
            setCoachMoments(prev => [
              ...prev,
              {
                type: 'text_face_mismatch',
                time: now,
                text: clip(scriptText, 140),
                expected: expectedLabel,
                detected: detectedLabel,
                prob: detectedConf/100,
                label: 'Text–Face mismatch',
                suggestion
              }
            ]);
          }
        }
      } else {
        setFaceDetected(false);
        setLiveTop(null);
        setLiveProbs({});
      }
    } catch {}
  };

  // Suggestions for mismatches (concrete actions)
  function buildMismatchSuggestion(expected, detected) {
    if (expected === 'Sad' && detected === 'Happy') {
      return 'Lower smile intensity, soften cheeks, relax eyebrows; slow tempo and reduce pitch rise at sentence ends.';
    }
    if (expected === 'Happy' && (detected === 'Sad' || detected === 'Angry')) {
      return 'Add gentle smile, brighten eyes; raise pitch ~20–40 cents and add upbeat stress on positive keywords.';
    }
    if (expected === 'Angry' && (detected === 'Happy' || detected === 'Neutral')) {
      return 'Tighten jaw subtly, firm brow; punch key words with shorter vowels; reduce smiling micro-expressions.';
    }
    // generic
    return 'Align face with meaning: adjust eyebrows/jaw + pacing to match the text emotion.';
  }

  const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');

  // analyze video (backend full report + client tips)
  const analyzeVideo = async () => {
    if (!videoBlob) { setLoading(false); setServerError('No recording captured.'); return; }

    // calculate simple visible/away based on whether we had face in last frames
    setStartTime(0); setEndTime(recordingTime);

    const formData = new FormData();
    formData.append('video', videoBlob, 'recorded_video.webm');
    formData.append('target_emotion', targetEmotion);
    formData.append('intent_text', intentText || '');

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 120000);

    try {
      setServerError('');
      const res  = await fetch(BACKEND_ANALYZE, { method: 'POST', body: formData, signal: ctrl.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Server error (${res.status})`);

      setFerEmotions(data.fer_emotions || ferEmotions);
      const t3 =
        data?.coaching?.metrics?.top3
          ? data.coaching.metrics.top3
          : Object.entries(data.fer_emotions || ferEmotions).sort((a, b) => b[1] - a[1]).slice(0, 3);
      setSummaryTop3(t3);

      setVisibleSeconds(Number(data.visible_seconds || visibleSeconds));
      setAwaySeconds(Number(data.away_seconds || awaySeconds));
      setAnnotatedUrl(data.annotated_url ? `http://localhost:8000${data.annotated_url}` : '');

      setCoachSummary(data?.coaching?.summary || coachSummary);
      setCoachScore(typeof data?.coaching?.score === 'number' ? data.coaching.score : coachScore);
      setCoachStrengths(Array.isArray(data?.coaching?.strengths) ? data.coaching.strengths : coachStrengths);
      setCoachAreas(Array.isArray(data?.coaching?.areas_to_improve) ? data.coaching.areas_to_improve : coachAreas);
      setCoachTips(
        Array.isArray(data?.coaching?.tips) && data.coaching.tips.length
          ? data.coaching.tips
          : coachTips
      );
      setCoachMoments(prev => {
        const m = Array.isArray(data?.coaching?.moments_to_review) ? data.coaching.moments_to_review : [];
        return [...prev, ...m];
      });
      setCoachEntropy(typeof data?.coaching?.metrics?.entropy === 'number' ? data.coaching.metrics.entropy : coachEntropy);
      setCoachSwitches(typeof data?.coaching?.metrics?.switches_per_min === 'number' ? data.coaching.metrics.switches_per_min : coachSwitches);

      // Add client tips if backend didn't provide
      if (!data?.coaching?.tips?.length) {
        const extra = buildAlignmentTips(data.fer_emotions || ferEmotions, targetEmotion, intentText);
        if (extra.length) setCoachTips(prev => [...prev, ...extra]);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setServerError(String(err.message || err));
    } finally {
      clearTimeout(to);
      setLoading(false);
    }
  };

  function buildAlignmentTips(mix, target, intentText) {
    const tips = [];
    const tgt = TARGET_VEC[target] || TARGET_VEC['Confident'];
    const obs = mixToVector(mix);
    const deltaE = tgt.e - obs.e;
    const deltaV = tgt.v - obs.v;

    if (deltaE > 0.2) tips.push('Energy below target: increase tempo slightly, lift volume 5–10%, add hand gestures.');
    if (deltaE < -0.25) tips.push('Energy above target: slow pacing, add brief pauses, soften volume.');
    if (deltaV > 0.2) tips.push('Sound warmer: smile lightly on key points, brighten pitch ending, relax eyebrows.');
    if (deltaV < -0.25) tips.push('Tone too negative: reduce frown tension, avoid clipped endings, add positive reframe.');

    const neutral = Number(mix.Neutral || 0);
    if (neutral > 55 && target !== 'Serious') tips.push('Too much Neutral—layer more expressiveness; vary pitch and stress keywords.');
    const anger = Number(mix.Angry || 0) + Number(mix.Disgust || 0);
    if (anger > 15 && target !== 'Serious') tips.push('Trace of negative affect—soften jaw/forehead; extend vowels on positives.');

    if (intentText && intentText.length > 12) {
      tips.push(`Map emotion to intent: emphasize 1–2 keywords ("${intentText.split(/\s+/).slice(0,4).join(' ')}…") with clear stress.`);
    }
    return tips;
  }

  // SVG Components for Emotion Aware Analysis
  const WaveSVG = () => (
    <svg viewBox="0 0 400 90" className="w-full h-16">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#g)"
        strokeWidth="3"
        points="0,45 20,40 40,50 60,30 80,60 100,25 120,70 140,20 160,75 180,25 200,65 220,30 240,55 260,35 280,60 300,28 320,70 340,35 360,55 380,45 400,45"
      >
        <animate
          attributeName="points"
          dur="2.4s"
          repeatCount="indefinite"
          values="
            0,45 20,40 40,50 60,30 80,60 100,25 120,70 140,20 160,75 180,25 200,65 220,30 240,55 260,35 280,60 300,28 320,70 340,35 360,55 380,45 400,45;
            0,45 20,55 40,35 60,60 80,25 100,65 120,30 140,70 160,25 180,75 200,30 220,60 240,35 260,55 280,30 300,62 320,28 340,65 360,35 380,50 400,45;
            0,45 20,40 40,50 60,30 80,60 100,25 120,70 140,20 160,75 180,25 200,65 220,30 240,55 260,35 280,60 300,28 320,70 340,35 360,55 380,45 400,45
          "
        />
      </polyline>
    </svg>
  );

  const RadarSVG = () => (
    <svg viewBox="0 0 140 140" className="w-28 h-28">
      <circle cx="70" cy="70" r="65" fill="none" stroke="#134e4a" strokeWidth="2" />
      <circle cx="70" cy="70" r="45" fill="none" stroke="#115e59" strokeWidth="2" />
      <circle cx="70" cy="70" r="25" fill="none" stroke="#0f766e" strokeWidth="2" />
      <line x1="70" y1="70" x2="130" y2="70" stroke="#2dd4bf" strokeWidth="3">
        <animateTransform attributeName="transform" type="rotate" from="0 70 70" to="360 70 70" dur="6s" repeatCount="indefinite" />
      </line>
      <circle cx="95" cy="30" r="5" fill="#22d3ee">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'face-analysis':
        return renderFaceAnalysis();
      case 'emotion-aware':
        return renderEmotionAwareAnalysis();
      case 'activity':
        return <EmotionAnalysisActivity />;
      default:
        return renderFaceAnalysis();
    }
  };

  // Helper function for time formatting
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Variables for the new UI
  const expectedTextEmotion = inferTextEmotion(scriptText);
  const detectedNow = liveTop || (summaryTop3?.[0]?.[0] ?? '—');
  const detectedNowConf = detectedNow && liveProbs[detectedNow] != null ? Math.round(liveProbs[detectedNow]) : null;
  const mismatchNow = expectedTextEmotion.label && detectedNow && expectedTextEmotion.label !== detectedNow;

  // Gauge needle calculation
  const engagementPercentage = typeof coachScore === 'number'
    ? coachScore
    : Math.round((visibleSeconds / (visibleSeconds + awaySeconds || 1)) * 100);
  
  const angle = Math.PI * (1 - engagementPercentage / 100);
  const needleX = 100 + 80 * Math.cos(angle);
  const needleY = 100 - 80 * Math.sin(angle);


  const renderFaceAnalysis = () => {
    const expectedTextEmotion = inferTextEmotion(scriptText);
    const detectedNow = liveTop || (summaryTop3?.[0]?.[0] ?? '—');
    const detectedNowConf = detectedNow && liveProbs[detectedNow] != null ? Math.round(liveProbs[detectedNow]) : null;
    const mismatchNow = expectedTextEmotion.label && detectedNow && expectedTextEmotion.label !== detectedNow;
    
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full max-h-[calc(100vh-20rem)]">
        {/* LEFT PANEL - Camera and Controls */}
        <div className="bg-[#014753] rounded-2xl shadow-lg p-4 flex flex-col h-full overflow-hidden">
          <h2 className="text-xl font-semibold text-white text-center mb-4">Live Camera</h2>

          {/* Controls row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-[#01333a] rounded-lg p-3 flex items-center gap-2">
              <label className="text-sm text-white/80 shrink-0">Target</label>
              <select
                value={targetEmotion}
                onChange={(e) => setTargetEmotion(e.target.value)}
                className="flex-1 bg-black/20 rounded-md px-2 py-1 text-sm outline-none text-white"
              >
                {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="bg-[#01333a] rounded-lg p-3 flex items-center gap-2">
              <label className="text-sm text-white/80 shrink-0">Strict</label>
              <input
                type="checkbox"
                checked={strictMode}
                onChange={(e)=>setStrictMode(e.target.checked)}
                className="accent-emerald-400"
                title="100% alignment mode"
              />
              <label className="text-sm text-white/80 shrink-0 ml-2">Win</label>
              <input
                type="number" min={2} max={8} step={1}
                value={windowSec}
                onChange={(e)=>setWindowSec(Math.max(2, Math.min(8, Number(e.target.value)||3)))}
                className="w-16 bg-black/20 rounded-md px-2 py-1 text-sm outline-none text-white"
                title="Sliding window seconds"
              />
              <label className="text-sm text-white/80 shrink-0 ml-2">EMA</label>
              <input
                type="number" min={0.1} max={0.8} step={0.05}
                value={emaAlpha}
                onChange={(e)=>setEmaAlpha(Math.max(0.1, Math.min(0.8, Number(e.target.value)||0.4)))}
                className="w-16 bg-black/20 rounded-md px-2 py-1 text-sm outline-none text-white"
                title="Smoothing α"
              />
            </div>
            <div className="bg-[#01333a] rounded-lg p-3">
              <input
                value={intentText}
                onChange={(e) => setIntentText(e.target.value)}
                placeholder="Section intent (optional)"
                className="w-full bg-black/20 rounded-md px-2 py-1 text-sm outline-none placeholder:text-white/50 text-white"
              />
            </div>
          </div>

          {/* Script input */}
          <div className="bg-[#01333a] rounded-lg p-3 mb-3">
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste the line or paragraph you will read..."
              className="w-full h-16 bg-black/20 rounded-md px-2 py-1 text-sm outline-none placeholder:text-white/50 text-white"
            />
            <div className="mt-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-400/50 rounded-lg px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-200">Expected from text:</span>
                <span className="text-sm font-bold text-red-300">{expectedTextEmotion.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-red-500/30 rounded-full px-2 py-1">
                  <span className="text-xs font-semibold text-red-100">{Math.round(expectedTextEmotion.confidence*100)}%</span>
                </div>
                <span className="text-[10px] text-red-200/80">conf</span>
              </div>
            </div>
          </div>

          {/* Webcam */}
          <div className="w-full rounded-xl overflow-hidden bg-black/20 aspect-video relative mb-3 flex-shrink-0">
            {mismatchNow && faceDetected && (
              <div className="absolute top-2 left-2 right-2 z-10 text-xs bg-red-600/80 text-white px-2 py-1 rounded">
                ❌ Mismatch: Text expects <b>{expectedTextEmotion.label}</b>, face shows <b>{detectedNow}</b>
                {detectedNowConf != null ? <> ({detectedNowConf}%)</> : null}
              </div>
            )}
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover scale-x-[-1]"
              videoConstraints={{ facingMode: 'user' }}
              mirrored={true}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center mb-3">
            <div className="flex gap-2">
              <button
                onClick={startRecording}
                disabled={isRecording}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
              >
                Start
              </button>
              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
              >
                Stop
              </button>
            </div>
            <p className="mt-1 text-xs italic text-white/80">
              {isRecording ? `🎥 ${recordingTime}s` : recordingStopped ? (loading ? '⏳ Processing…' : 'Done') : ''}
            </p>
            {serverError && <p className="text-xs text-red-300 mt-1">{serverError}</p>}
          </div>

          {/* Live Emotion Tracking */}
          <div className="w-full mt-4 bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#00ccff] text-base font-semibold">🟦 Live Emotion (smoothed {windowSec}s)</h3>
              <span className="text-sm font-bold text-white bg-[#00ccff]/20 px-3 py-1 rounded-full">{liveTop || '—'}</span>
            </div>
            {Object.keys(liveProbs).length === 0 ? (
              <p className="text-white/70 text-center py-6 text-sm">No face detected yet…</p>
            ) : (
              <div className="space-y-3">
                {EMOTIONS.map((lab) => {
                  const val = Math.round(liveProbs[lab] ?? 0);
                  return (
                    <div key={lab} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-sm font-medium text-white">{lab}</span>
                      <div className="flex-1 h-4 rounded-full bg-[#0b4952] overflow-hidden">
                        <div
                          className="h-4 rounded-full transition-[width] duration-200"
                          style={{ width: `${Math.min(100, val)}%`, background: '#00d1d1' }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-sm text-right font-semibold text-white">{val}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Analysis Report */}
        <div className="bg-[#012e33] rounded-2xl shadow-lg p-4 text-white flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">📊 Analysis Report</h2>
            {annotatedUrl && (
              <a
                href={annotatedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-teal-700 rounded-md text-sm hover:bg-teal-600 transition-colors"
              >
                ▶ Annotated video
              </a>
            )}
          </div>

          <div className="text-sm flex flex-wrap gap-3 mb-3">
            <span><strong>Status:</strong> {faceDetected ? '✅ Face' : '❌ No face'}</span>
            <span><strong>Visible:</strong> {visibleSeconds}s</span>
            <span><strong>Away:</strong> {awaySeconds}s</span>
            <span><strong>Range:</strong> {startTime}s–{endTime}s</span>
            <span><strong>Target:</strong> {targetEmotion}</span>
            {summaryTop3?.length > 0 && (
              <span><strong>Top 3:</strong> {summaryTop3.map(([e, p]) => `${e} ${p}%`).join(', ')}</span>
            )}
          </div>

          {/* Expected vs Detected comparison */}
          <div className="bg-black/25 rounded-lg p-3 mb-3">
            <h3 className="font-semibold mb-2 text-sm">Expected vs Detected (now)</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#0b3640] rounded-md p-2">
                <div className="opacity-80 mb-1">Expected from text</div>
                <div className="text-emerald-300 font-semibold text-base">{expectedTextEmotion.label}</div>
                <div className="opacity-70">Conf: {Math.round(expectedTextEmotion.confidence*100)}%</div>
              </div>
                <div className="bg-[#0b3640] rounded-md p-2">
                  <div className="opacity-80 mb-1">Detected (window avg)</div>
                  <div className="text-sky-300 font-semibold text-base">{detectedNow || '—'}</div>
                  {detectedNowConf != null && <div className="opacity-70">Conf: {detectedNowConf}%</div>}
                </div>
              </div>
              {mismatchNow && faceDetected && (
                <div className="mt-2 text-xs text-yellow-300">
                  Tip: {buildMismatchSuggestion(expectedTextEmotion.label, detectedNow)}
                </div>
              )}
            </div>

          {/* Chart */}
          <div className="bg-black/25 rounded-lg p-3 mb-3 flex-1 overflow-hidden">
            <h3 className="font-semibold mb-2 text-sm">Facial Emotions (avg from recording)</h3>
            <div className="h-32">
              <Bar
                data={{
                  labels: Object.keys(ferEmotions),
                  datasets: [{
                    label: 'Facial Emotions (%)',
                    data: Object.values(ferEmotions),
                    backgroundColor: ['#f44336', '#ff9800', '#2196f3', '#4caf50', '#9c27b0', '#00bcd4', '#ffeb3b'],
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  barPercentage: 0.6,
                  categoryPercentage: 0.7,
                  scales: {
                    x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 0, minRotation: 0, font: { size: 12 }, color: '#a9c2c8' } },
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { font: { size: 12 }, color: '#a9c2c8', padding: 20 } },
                  },
                  plugins: { legend: { labels: { boxWidth: 20, font: { size: 12 }, color: '#cfe6ea' } }, tooltip: { enabled: true } },
                  layout: { padding: { left: 10, right: 10, bottom: 0, top: 0 } },
                }}
              />
            </div>
          </div>

          {/* Bottom section with scrollable content */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {/* Engagement Gauge */}
            <div className="bg-[#0e2a30] rounded-lg flex flex-col items-center justify-center p-3">
              <h3 className="mb-2 text-sm font-semibold">🚗 Engagement</h3>
              <svg viewBox="0 0 200 100" className="w-44">
                <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="#f44336" strokeWidth="20" />
                <path d="M55 100 A45 45 0 0 1 145 100" fill="none" stroke="#ff9800" strokeWidth="20" />
                <line x1="100" y1="100" x2={needleX} y2={needleY} stroke="#ffc107" strokeWidth="6" strokeLinecap="round" />
                <circle cx="100" cy="100" r="5" fill="#ffc107" />
              </svg>
              <p className="text-yellow-300 font-bold text-lg mt-2">{engagementPercentage}%</p>
              {(coachEntropy != null || coachSwitches != null) && (
                <p className="text-xs text-white/70 mt-1">
                  {coachEntropy != null && <>Variety (entropy): <b>{coachEntropy}</b>&nbsp;&nbsp;</>}
                  {coachSwitches != null && <>Switches: <b>{coachSwitches}</b>/min</>}
                </p>
              )}
            </div>

            {/* Alignment Score */}
            <div className="bg-[#0b3640] rounded-lg p-3">
              <h3 className="text-xs font-semibold mb-1">🎯 Alignment to target</h3>
              <p className="text-xs text-white/85">
                Target <b>{targetEmotion}</b>{intentText ? <> for "{intentText}"</> : null}. Estimated alignment:
                {' '}<b>{scoreAlignmentClient(ferEmotions, targetEmotion)}%</b> (backend score overrides if provided).
              </p>
            </div>

            {/* Coaching summary */}
            {coachSummary && (
              <div className="bg-[#0b3640] rounded-lg p-3">
                <h3 className="text-xs font-semibold mb-1">🧭 Coaching</h3>
                <p className="text-xs text-white/85">{coachSummary}</p>
              </div>
            )}

            {/* Strengths & Areas */}
            {(coachStrengths.length > 0 || coachAreas.length > 0) && (
              <div className="space-y-2">
                {coachStrengths.length > 0 && (
                  <div className="bg-[#0b3640] rounded-lg p-3">
                    <h4 className="text-xs font-semibold mb-1">✅ Strengths</h4>
                    <ul className="list-disc pl-4 text-xs space-y-1">
                      {coachStrengths.map((s, i) => <li key={`str-${i}`}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {coachAreas.length > 0 && (
                  <div className="bg-[#0b3640] rounded-lg p-3">
                    <h4 className="text-xs font-semibold mb-1">⚠️ Areas to improve</h4>
                    <ul className="list-disc pl-4 text-xs space-y-1">
                      {coachAreas.map((s, i) => <li key={`area-${i}`}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tips */}
            {coachTips.length > 0 && (
              <div className="bg-[#0b3640] rounded-lg p-3">
                <h4 className="text-xs font-semibold mb-2">💡 Tips</h4>
                <ul className="space-y-1">
                  {coachTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-300 mt-0.5">💡</span>
                      <span className="text-white text-xs">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Moments to review */}
            {coachMoments.length > 0 && (
              <div className="bg-[#0b3640] rounded-lg p-3">
                <h4 className="text-xs font-semibold mb-2">🎯 Moments to review</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-white/70">
                      <tr>
                        <th className="text-left pb-1">Type</th>
                        <th className="text-left pb-1">Time / Range</th>
                        <th className="text-left pb-1">Label</th>
                        <th className="text-left pb-1">Conf.</th>
                        <th className="text-left pb-1">Suggestion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coachMoments.slice(0, 3).map((m, i) => (
                        <tr key={`mom-${i}`} className="border-t border-white/10">
                          <td className="py-1">{m.type === 'text_face_mismatch' ? 'Text–Face mismatch' : (m.type === 'neutral_span' ? 'Neutral span' : 'Negative spike')}</td>
                          <td className="py-1">
                            {m.type === 'text_face_mismatch'
                              ? `${m.time?.toFixed?.(2)}s`
                              : (m.type === 'neutral_span'
                                  ? `${m.start?.toFixed?.(2)}s – ${m.end?.toFixed?.(2)}s`
                                  : `${m.time?.toFixed?.(2)}s`)}
                          </td>
                          <td className="py-1">
                            {m.type === 'text_face_mismatch'
                              ? <span className="text-yellow-300">{`${m.label}: Text ${m.expected} vs Face ${m.detected}`}</span>
                              : (m.label || '—')}
                          </td>
                          <td className="py-1">{m.prob != null ? `${Math.round(m.prob * 100)}%` : '—'}</td>
                          <td className="py-1">{m.suggestion || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {coachMoments.length > 3 && (
                    <p className="text-gray-300 text-xs text-center mt-1">
                      And {coachMoments.length - 3} more moments...
                    </p>
                  )}
                </div>
              </div>
            )}

            {loading && <p className="text-center text-xs text-white/70 mt-2">Processing…</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderEmotionAwareAnalysis = () => {
    const card = "bg-[#0b3640] rounded-lg p-3 border border-white/10";
    const pill = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border border-white/10 bg-white/10";
    
  return (
      <div className="space-y-4 h-full overflow-y-auto">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#014753] to-[#013a42] p-6"
        >
          <div className="absolute inset-0 opacity-8 pointer-events-none"
               style={{
                 backgroundImage: 'radial-gradient(1px 1px at 1px 1px, white 1px, transparent 0)',
                 backgroundSize: '22px 22px'
               }}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 relative">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={pill}>New</span>
                <span className="text-emerald-300/90 text-xs">
                  Realtime Emotion • Intent Alignment • Coaching
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-extrabold mb-3 leading-tight">
                Emotionally-Aware Delivery <span className="text-emerald-300">Trainer</span>
              </h1>
              
              <p className="text-sm text-white/85 mb-4">
                Detects your <b>facial emotions</b>, checks alignment with your <b>message intent</b>, then
                gives <b>instant coaching</b> and a final score.
              </p>

              <div className="mt-4">
                <button 
                  onClick={() => setActiveTab('face-analysis')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-black font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-lg"
                >
                  Start Training
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="mt-4"><WaveSVG /></div>
            </div>

            {/* Mini demo */}
            <div className="relative rounded-2xl border border-white/10 bg-[#01333a] p-4">
              <div className="grid grid-cols-2 gap-3">
                <motion.div whileHover={{ y: -3 }} className="rounded-lg bg-black/20 p-3">
                  <p className="text-xs opacity-80">Alignment</p>
                  <p className="text-sm font-semibold text-emerald-300">Confident • 86%</p>
                  <div className="mt-2 flex items-center justify-center"><RadarSVG /></div>
                </motion.div>
                <motion.div whileHover={{ y: -3 }} className="rounded-lg bg-black/20 p-3">
                  <p className="text-xs opacity-80">Coaching Tip</p>
                  <p className="mt-1 text-xs text-white/85">
                    "Slow pacing 5% and relax eyebrows to match <b>Calm</b> intent."
                  </p>
                </motion.div>
                <motion.div whileHover={{ y: -3 }} className="col-span-2 rounded-lg bg-black/20 p-3">
                  <p className="text-xs opacity-80">Moment Flag</p>
                  <p className="mt-1 text-xs text-yellow-300">12.3s – Text says <b>Sad</b>, face shows <b>Happy</b>.</p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* LEFT: Features & Benefits */}
          <section className="bg-gradient-to-b from-[#014753] to-[#013a42] rounded-2xl border border-white/10 p-4">
            <h2 className="text-lg font-bold mb-4">Core Features</h2>

            <div className="grid grid-cols-1 gap-3">
              <div className={card}>
                <h3 className="text-sm font-semibold mb-2">Realtime Emotion Detection</h3>
                <p className="text-xs text-white/80">
                  FER across Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise—with smoothed probability bars.
                </p>
              </div>
              <div className={card}>
                <h3 className="text-sm font-semibold mb-2">Content Alignment Check</h3>
                <p className="text-xs text-white/80">
                  Compare your target emotion (Confident, Calm, Empathetic, etc.) vs. detected stream.
                </p>
              </div>
              <div className={card}>
                <h3 className="text-sm font-semibold mb-2">Coaching & Score</h3>
                <p className="text-xs text-white/80">
                  Strengths, areas to improve, tailored tips, and an overall score from 0–100.
                </p>
              </div>
              <div className={card}>
                <h3 className="text-sm font-semibold mb-2">Moments to Review</h3>
                <p className="text-xs text-white/80">
                  Flags neutral spans or negative spikes; jump back precisely to improve that line.
                </p>
              </div>
              <div className={card}>
                <h3 className="text-sm font-semibold mb-2">Variety Metrics</h3>
                <p className="text-xs text-white/80">
                  Entropy (emotion variety) and switches/minute to avoid monotone or chaos.
                </p>
              </div>
              <div className={card}>
                <h3 className="text-sm font-semibold mb-2">Privacy-Aware</h3>
                <p className="text-xs text-white/80">
                  Runs on your infra per policy. No third-party sharing by default.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#0e2a30] p-3">
              <h3 className="text-sm font-semibold mb-2">Benefits</h3>
              <ul className="text-xs text-white/85 space-y-1">
                <li>• Immediate understanding of whether your face matches the story.</li>
                <li>• Higher credibility and clarity with emotion-intent alignment.</li>
                <li>• Faster practice loops: record → fix flagged moments → re-test.</li>
              </ul>
            </div>
          </section>

          {/* RIGHT: Steps + Use cases + FAQ */}
          <section className="bg-gradient-to-b from-[#012e33] to-[#01282c] rounded-2xl border border-white/10 p-4">
            <div className="rounded-xl bg-black/30 p-3 mb-4">
              <h3 className="text-sm font-semibold mb-3">How it works</h3>

              <div className="grid grid-cols-1 gap-3">
                <div className="border border-emerald-500/30 bg-[#0b3640] rounded-lg p-3 shadow-lg">
                  <div className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white mb-2">1</div>
                  <p className="text-xs">
                    Choose a target emotion & paste the line/paragraph you'll read.
                  </p>
                </div>
                <div className="border border-emerald-500/30 bg-[#0b3640] rounded-lg p-3 shadow-lg">
                  <div className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white mb-2">2</div>
                  <p className="text-xs">
                    Record 10–30s. We track live emotions and compare to your text.
                  </p>
                </div>
                <div className="border border-emerald-500/30 bg-[#0b3640] rounded-lg p-3 shadow-lg">
                  <div className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white mb-2">3</div>
                  <p className="text-xs">
                    Get score, tips, and highlighted mismatch moments to fix.
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <button 
                  onClick={() => setActiveTab('face-analysis')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-black font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-lg"
                >
                  Start Training
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-4">
              <div className="bg-black/25 rounded-lg p-3">
                <p className="text-xs font-semibold">Pitch Rehearsal</p>
                <p className="mt-1 text-[11px] text-white/80">Keep enthusiasm consistent across demo beats.</p>
              </div>
              <div className="bg-black/25 rounded-lg p-3">
                <p className="text-xs font-semibold">Lectures/Webinars</p>
                <p className="mt-1 text-[11px] text-white/80">Avoid monotone; add variety without chaos.</p>
              </div>
              <div className="bg-black/25 rounded-lg p-3">
                <p className="text-xs font-semibold">Interview Prep</p>
                <p className="mt-1 text-[11px] text-white/80">Project calm confidence for tough questions.</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#0e2a30] p-3">
              <h3 className="text-sm font-semibold mb-3">FAQ</h3>
              <details className="group mb-2">
                <summary className="text-xs cursor-pointer select-none group-open:text-emerald-300">Do I need a mic?</summary>
                <p className="mt-1 text-[11px] text-white/80">Mic helps energy/pitch cues, but face-only works too.</p>
              </details>
              <details className="group mb-2">
                <summary className="text-xs cursor-pointer select-none group-open:text-emerald-300">Which emotions are detected?</summary>
                <p className="mt-1 text-[11px] text-white/80">Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise.</p>
              </details>
              <details className="group">
                <summary className="text-xs cursor-pointer select-none group-open:text-emerald-300">What do "entropy" and "switches" mean?</summary>
                <p className="mt-1 text-[11px] text-white/80">Entropy ≈ variety; switches/min ≈ how often you change emotion.</p>
              </details>
            </div>
          </section>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute top-[4rem] left-0 w-full lg:left-64 lg:w-[calc(100%-17rem)] p-3 sm:p-4 lg:p-8 flex justify-center items-start overflow-y-auto">
      <div className="w-full h-auto lg:h-full bg-gradient-to-b from-[#003b46] to-[#07575b] text-white shadow-xl rounded-2xl p-3 sm:p-4 lg:p-6 flex flex-col justify-start items-center">
        <div className="flex flex-col lg:flex-row w-full h-auto lg:h-full gap-3 sm:gap-4 lg:gap-8">
          {/* LEFT PANEL - Camera Controls */}
          <div
            className="bg-gradient-to-b from-[#00171f] to-[#003b46] w-full lg:min-w-[800px] rounded-xl shadow-xl p-3 sm:p-4 lg:p-6 flex flex-col mx-auto overflow-hidden"
            style={{ height: 'calc(100vh - 1rem)' }}
          >
            {/* Title - Fixed
            <h2 className="text-lg font-semibold text-white mb-2 flex-shrink-0">
              Face Analyzer
            </h2> */}

            {/* Controls row - Fixed */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 flex-shrink-0">
              <div className="bg-[#01333a] rounded-lg p-2 flex items-center gap-2">
                <label className="text-xs text-white/80 shrink-0">Target</label>
                <select
                  value={targetEmotion}
                  onChange={(e) => setTargetEmotion(e.target.value)}
                  className="flex-1 bg-black/20 rounded-md px-2 py-1 text-xs outline-none text-white"
                >
                  {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="bg-[#01333a] rounded-lg p-2 flex items-center gap-2">
                <label className="text-xs text-white/80 shrink-0">Strict</label>
                <input
                  type="checkbox"
                  checked={strictMode}
                  onChange={(e)=>setStrictMode(e.target.checked)}
                  className="accent-emerald-400"
                  title="100% alignment mode"
                />
                <label className="text-xs text-white/80 shrink-0 ml-2">Win</label>
                <input
                  type="number" min={2} max={8} step={1}
                  value={windowSec}
                  onChange={(e)=>setWindowSec(Math.max(2, Math.min(8, Number(e.target.value)||3)))}
                  className="w-12 bg-black/20 rounded-md px-1 py-0.5 text-xs outline-none text-white"
                  title="Sliding window seconds"
                />
                <label className="text-xs text-white/80 shrink-0 ml-2">EMA</label>
                <input
                  type="number" min={0.1} max={0.8} step={0.05}
                  value={emaAlpha}
                  onChange={(e)=>setEmaAlpha(Math.max(0.1, Math.min(0.8, Number(e.target.value)||0.4)))}
                  className="w-14 bg-black/20 rounded-md px-1 py-0.5 text-xs outline-none text-white"
                  title="Smoothing α"
                />
              </div>
              <div className="bg-[#01333a] rounded-lg p-2">
                <input
                  value={intentText}
                  onChange={(e) => setIntentText(e.target.value)}
                  placeholder="Section intent (optional)"
                  className="w-full bg-black/20 rounded-md px-2 py-1 text-xs outline-none placeholder:text-white/50 text-white"
                />
              </div>
            </div>
  {/* Script Input - Fixed */}
  <div className="w-full mb-2 flex-shrink-0">
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Paste the line or paragraph you will read..."
                className="w-full h-25 bg-black/20 rounded-md px-2 py-1 text-s outline-none placeholder:text-white/50 text-white border border-white/20"
              />
              <div className="mt-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-400/50 rounded-lg px-2 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-red-200">Expected:</span>
                  <span className="text-sm font-bold text-red-300">{expectedTextEmotion.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-red-500/30 rounded-full px-2 py-0.5">
                    <span className="text-xs font-semibold text-red-100">{Math.round(expectedTextEmotion.confidence*100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Section - Fixed aspect ratio */}
            <div className="w-full bg-white/10 rounded-lg p-2 mb-2 flex-shrink-0">
              <div className="w-full rounded-md overflow-hidden bg-black/20 relative" style={{ height: '450px' }}>
                {mismatchNow && faceDetected && (
                  <div className="absolute top-3 left-3 right-3 z-20 bg-red-600/95 text-white px-4 py-3 rounded-lg shadow-2xl border-2 border-red-400 animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold">MISMATCH DETECTED!</p>
                        <p className="text-xs mt-0.5">
                          Text expects <span className="font-bold underline">{expectedTextEmotion.label}</span> but face shows <span className="font-bold underline">{detectedNow}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {cameraOn ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover scale-x-[-1]"
                    videoConstraints={{ facingMode: 'user' }}
                    mirrored={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
                    Camera is off
                  </div>
                )}
              </div>
            </div>

            {/* Controls & Status - Fixed */}
            <div className="flex flex-col items-center mb-2 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-black p-3 rounded-full shadow-md transition-colors"
                >
                  <FaPlay className="text-lg" />
                </button>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-black p-3 rounded-full shadow-md transition-colors"
                >
                  <FaStop className="text-lg" />
                </button>
              </div>
              <p className="text-white/80 text-xs mt-1">
                {isRecording ? `🎥 Recording: ${formatTime(recordingTime)}` : 
                 recordingStopped ? (loading ? '⏳ Processing…' : '✅ Done') : 
                 'Ready to record'}
              </p>
              {serverError && <p className="text-red-300 text-xs mt-1">{serverError}</p>}
            </div>

          
            {/* Live Emotion Tracking - Scrollable only this section */}
            <div className="w-full flex-1 bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40 p-5 overflow-y-auto min-h-0">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-[#00ccff] text-base font-semibold">🟦 Live Emotion (smoothed {windowSec}s)</h3>
                <span className="text-sm font-bold text-white bg-[#00ccff]/20 px-3 py-1 rounded-full">{liveTop || '—'}</span>
              </div>
              {Object.keys(liveProbs).length === 0 ? (
                <p className="text-white/70 text-center py-6 text-sm">No face detected yet…</p>
              ) : (
                <div className="space-y-3">
                  {EMOTIONS.map((lab) => {
                    const val = Math.round(liveProbs[lab] ?? 0);
                    return (
                      <div key={lab} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-sm font-medium text-white">{lab}</span>
                        <div className="flex-1 h-4 rounded-full bg-[#0b4952] overflow-hidden">
                          <div
                            className="h-4 rounded-full transition-[width] duration-200"
                            style={{ width: `${Math.min(100, val)}%`, background: '#00d1d1' }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-sm text-right font-semibold text-white">{val}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* RIGHT PANEL - Analysis */}
          <div className="w-full flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto">
              {/* Face Analysis Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "face-analysis"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-black"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-black/30"
                }`}
                onClick={() => setActiveTab("face-analysis")}
              >
                <FaCamera />
                Face Analysis
              </button>

              {/* Emotion Aware Analysis Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "emotion-aware"
                    ? "bg-[#d0ebff] text-[#003b46]"
                    : "bg-[#e0f7fa] text-[#003b46]/70"
                }`}
                onClick={() => setActiveTab("emotion-aware")}
              >
                <FaBrain />
                Emotionally Analyzer
              </button>

            </div>

            {/* Tab Content */}
            {activeTab === "face-analysis" && (
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between mt-7 mb-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">
                    Emotion Analysis Report
                  </h2>
                  {annotatedUrl && (
                    <a
                      href={annotatedUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{color: 'white'}}
                      className="px-3 py-1.5 bg-teal-700 rounded-md text-sm hover:bg-teal-600 transition-colors"
                    >
                      ▶ Annotated video
                    </a>
                  )}
                </div>

                {/* Status Summary */}
                <div className="text-sm flex flex-wrap gap-3 mb-4">
                  <span><strong>Status:</strong> {faceDetected ? '✅ Face' : '❌ No face'}</span>
                  <span><strong>Visible:</strong> {visibleSeconds}s</span>
                  <span><strong>Away:</strong> {awaySeconds}s</span>
                  <span><strong>Range:</strong> {startTime}s–{endTime}s</span>
                  <span><strong>Target:</strong> {targetEmotion}</span>
                  {summaryTop3?.length > 0 && (
                    <span><strong>Top 3:</strong> {summaryTop3.map(([e, p]) => `${e} ${p}%`).join(', ')}</span>
                  )}
                </div>

                {/* Expected vs Detected (now) */}
                <div className="bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40 p-4 mb-4">
                  <h3 className="font-semibold mb-3 text-sm text-[#00ccff]">Expected vs Detected (now)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#0b3640] rounded-md p-3">
                      <div className="opacity-80 mb-1">Expected from text</div>
                      <div className="text-emerald-300 font-semibold text-base">{expectedTextEmotion.label}</div>
                      <div className="opacity-70">Conf: {Math.round(expectedTextEmotion.confidence*100)}%</div>
                    </div>
                    <div className="bg-[#0b3640] rounded-md p-3">
                      <div className="opacity-80 mb-1">Detected (window avg)</div>
                      <div className="text-sky-300 font-semibold text-base">{detectedNow || '—'}</div>
                      {detectedNowConf != null && <div className="opacity-70">Conf: {detectedNowConf}%</div>}
                    </div>
                  </div>
                  {mismatchNow && faceDetected && (
                    <div className="mt-2 text-xs text-yellow-300">
                      Tip: {buildMismatchSuggestion(expectedTextEmotion.label, detectedNow)}
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-6 w-full">
                  {/* Face Detection */}
                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">Face Detection</h3>
                    <div className={`flex justify-center items-center rounded-full w-16 h-16 lg:w-20 lg:h-20 text-xl font-semibold border-2 ${
                      faceDetected ? 'bg-green-500/30 text-green-300 border-green-500/50' : 'bg-red-500/30 text-red-300 border-red-500/50'
                    }`}>
                      {faceDetected ? '✅' : '❌'}
                    </div>
                    <p className="text-white/70 text-xs mt-1">{faceDetected ? 'Detected' : 'Not Detected'}</p>
                  </div>

                  {/* Visible Time */}
                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">Visible Time</h3>
                    <div className="flex justify-center items-center rounded-full w-16 h-16 lg:w-20 lg:h-20 bg-blue-500/30 text-blue-300 text-xl font-semibold border-2 border-blue-500/50">
                      {visibleSeconds}s
                    </div>
                    <p className="text-white/70 text-xs mt-1">Face visible</p>
                  </div>

                  {/* Engagement Score */}
                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">Engagement</h3>
                    <div className="flex justify-center items-center rounded-full w-16 h-16 lg:w-20 lg:h-20 bg-emerald-500/30 text-emerald-300 text-xl font-semibold border-2 border-emerald-500/50">
                      {Math.round((visibleSeconds / (visibleSeconds + awaySeconds || 1)) * 100)}%
                    </div>
                    <p className="text-white/70 text-xs mt-1">Engagement</p>
                  </div>

                  {/* Top Emotion */}
                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">Top Emotion</h3>
                    <div className="flex justify-center items-center rounded-full w-16 h-16 lg:w-20 lg:h-20 bg-purple-500/30 text-purple-300 text-lg font-semibold border-2 border-purple-500/50">
                      {summaryTop3[0]?.[0] || '—'}
                    </div>
                    <p className="text-white/70 text-xs mt-1">{summaryTop3[0]?.[1] ? `${summaryTop3[0][1]}%` : 'No data'}</p>
                  </div>
                </div>

                {/* Chart Section */}
                <div className="mt-6 p-4 bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40">
                  <h3 className="text-[#00ccff] text-lg font-semibold mb-3">📊 Emotion Distribution</h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: Object.keys(ferEmotions),
                        datasets: [{
                          label: 'Facial Emotions (%)',
                          data: Object.values(ferEmotions),
                          backgroundColor: ['#f44336', '#ff9800', '#2196f3', '#4caf50', '#9c27b0', '#00bcd4', '#ffeb3b'],
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: true }
                        },
                        scales: {
                          y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#a9c2c8' } },
                          x: { grid: { display: false }, ticks: { color: '#a9c2c8' } }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Engagement (SVG Gauge) + Alignment */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40 p-4 flex flex-col items-center justify-center">
                    <h3 className="text-sm font-semibold mb-2 text-white">🚗 Engagement</h3>
                    <svg viewBox="0 0 200 100" className="w-44">
                      <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="#f44336" strokeWidth="20" />
                      <path d="M55 100 A45 45 0 0 1 145 100" fill="none" stroke="#ff9800" strokeWidth="20" />
                      <line x1="100" y1="100" x2={needleX} y2={needleY} stroke="#ffc107" strokeWidth="6" strokeLinecap="round" />
                      <circle cx="100" cy="100" r="5" fill="#ffc107" />
                    </svg>
                    <p className="text-yellow-300 font-bold text-base mt-2">{engagementPercentage}%</p>
                    {(coachEntropy != null || coachSwitches != null) && (
                      <p className="text-[12px] text-white/70 mt-1">
                        {coachEntropy != null && <>Variety (entropy): <b>{coachEntropy}</b>&nbsp;&nbsp;</>}
                        {coachSwitches != null && <>Switches: <b>{coachSwitches}</b>/min</>}
                      </p>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40 p-4">
                    <h3 className="text-sm font-semibold mb-1 text-white">🎯 Alignment to target</h3>
                    <p className="text-xs text-white/85">
                      Target <b>{targetEmotion}</b>{intentText ? <> for "{intentText}"</> : null}. Estimated alignment: <b>{scoreAlignmentClient(ferEmotions, targetEmotion)}%</b> (backend score overrides if provided).
                    </p>
                  </div>
                </div>


                {/* Coaching Summary */}
                {coachSummary && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40">
                    <h3 className="text-[#00ccff] text-lg font-semibold mb-2">🧭 Coaching</h3>
                    <p className="text-white/85 text-sm">{coachSummary}</p>
                  </div>
                )}

                {/* Strengths & Areas */}
                {(coachStrengths.length > 0 || coachAreas.length > 0) && (
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {coachStrengths.length > 0 && (
                      <div className="bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40 p-4">
                        <h4 className="text-[#00ccff] text-base font-semibold mb-2">✅ Strengths</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1 text-white/90">
                          {coachStrengths.map((s, i) => <li key={`str-${i}`}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {coachAreas.length > 0 && (
                      <div className="bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40 p-4">
                        <h4 className="text-[#00ccff] text-base font-semibold mb-2">⚠️ Areas to improve</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1 text-white/90">
                          {coachAreas.map((s, i) => <li key={`area-${i}`}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Coaching Tips */}
                {coachTips.length > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40">
                    <h3 className="text-[#00ccff] text-lg font-semibold mb-3">💡 Coaching Tips</h3>
                    <div className="space-y-2">
                      {coachTips.map((tip, i) => (
                        <div key={i} className="text-white/90 text-sm bg-white/10 rounded-lg p-2">
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Moments to review */}
                {coachMoments.length > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-[#00171f] to-[#003b46] rounded-lg border-2 border-[#00ccff]/40">
                    <h4 className="text-[#00ccff] text-lg font-semibold mb-2">🎯 Moments to review</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-white/70">
                          <tr>
                            <th className="text-left pb-1">Type</th>
                            <th className="text-left pb-1">Time / Range</th>
                            <th className="text-left pb-1">Label</th>
                            <th className="text-left pb-1">Conf.</th>
                            <th className="text-left pb-1">Suggestion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coachMoments.slice(0, 3).map((m, i) => (
                            <tr key={`mom-${i}`} className="border-t border-white/10">
                              <td className="py-1">{m.type === 'text_face_mismatch' ? 'Text–Face mismatch' : (m.type === 'neutral_span' ? 'Neutral span' : 'Negative spike')}</td>
                              <td className="py-1">
                                {m.type === 'text_face_mismatch'
                                  ? `${m.time?.toFixed?.(2)}s`
                                  : (m.type === 'neutral_span'
                                      ? `${m.start?.toFixed?.(2)}s – ${m.end?.toFixed?.(2)}s`
                                      : `${m.time?.toFixed?.(2)}s`)}
                              </td>
                              <td className="py-1">
                                {m.type === 'text_face_mismatch'
                                  ? <span className="text-yellow-300">{`${m.label}: Text ${m.expected} vs Face ${m.detected}`}</span>
                                  : (m.label || '—')}
                              </td>
                              <td className="py-1">{m.prob != null ? `${Math.round(m.prob * 100)}%` : '—'}</td>
                              <td className="py-1">{m.suggestion || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {coachMoments.length > 3 && (
                        <p className="text-gray-300 text-xs text-center mt-1">
                          And {coachMoments.length - 3} more moments...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "emotion-aware" && (
              <div className="flex flex-col w-full h-full overflow-y-auto">
                {renderEmotionAwareAnalysis()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionAnalysis;
