
function sendForm(fetchUrl) {
  const subscribeForm = document.querySelector('form');
  const formData = new FormData(subscribeForm);

  fetch(fetchUrl, {
    method: 'POST',
    body: formData
  });
}

window.addEventListener('load', () => {
  const subscribeBtn = document.querySelector('#subscribe');
  const unsubscribeBtn = document.querySelector('#unsubscribe');

  subscribeBtn.addEventListener('click', () => {
    fetchUrl('/subscribe');
  });

  unsubscribeBtn.addEventListener('click', () => {
    fetchUrl('/unsubscribe');
  });
});