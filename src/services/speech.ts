export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

export function stopSpeech(): void {
  if (!isSpeechSupported()) {
    return;
  }
  window.speechSynthesis.cancel();
}

export function pauseSpeech(): void {
  if (!isSpeechSupported()) {
    return;
  }
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech(): void {
  if (!isSpeechSupported()) {
    return;
  }
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

type SpeakOptions = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
};

export function speakText(text: string, options: SpeakOptions = {}): boolean {
  if (!isSpeechSupported()) {
    return false;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = "pt-BR";
  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onError?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function isSpeechPaused(): boolean {
  if (!isSpeechSupported()) {
    return false;
  }
  return window.speechSynthesis.paused;
}

export function isSpeechSpeaking(): boolean {
  if (!isSpeechSupported()) {
    return false;
  }
  return window.speechSynthesis.speaking;
}
