export function init({ registerButton, playBeep, speak }) {
  let voices = [];

  function populateVoices() {
    voices = window.speechSynthesis.getVoices();
  }
  populateVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoices;
  }

  registerButton('Voice', () => {
    playBeep();
    const content = document.getElementById('content');
    const list = document.createElement('ul');
    list.id = 'voice-list';
    voices.forEach(v => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = v.name;
      btn.addEventListener('click', () => {
        localStorage.setItem('lcars-voice', v.name);
        speak(`Voice set to ${v.name}`);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
    content.innerHTML = '<h2>Select Voice</h2>';
    content.appendChild(list);
    content.classList.remove('hidden');
  });
}
