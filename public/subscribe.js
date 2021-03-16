
function sendForm(fetchUrl) {
  const subscribeForm = document.querySelector('form');
  const formData = new FormData(subscribeForm);

  return fetch(fetchUrl, {
    method: 'POST',
    body: formData
  }).catch(err => {
    alert(`적용 실패===\n${err.stack}`);
  });
}

window.addEventListener('load', () => {
  const subscribeBtn = document.querySelector('#subscribe');
  const unsubscribeBtn = document.querySelector('#unsubscribe');

  subscribeBtn.addEventListener('click', () => {
    fetchUrl('/subscribe')
      .then(() => {
        alert('구독 성공');
      });
  });

  unsubscribeBtn.addEventListener('click', () => {
    fetchUrl('/unsubscribe')
      .then(() => {
        alert('구독 해지 성공');
      });
  });
});