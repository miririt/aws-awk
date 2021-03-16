
function sendForm(fetchUrl) {
  const subscribeForm = document.querySelector('form');

  const formValues = [];
  subscribeForm.querySelectorAll('input').forEach(inputElem => {
    formValues.push(`${inputElem.name}=${inputElem.value}`);
  });

  return fetch(fetchUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formValues.join('&')
  }).then(resp => {
    if(resp.status !== 200) {
      throw new Error(`HTTP ${resp.status}`);
    }
  })
  .then(() => {
    alert('적용 성공');
  }).catch(err => {
    alert(`적용 실패===\n${err.stack}`);
  });
}

window.addEventListener('load', () => {
  const subscribeBtn = document.querySelector('#subscribe');
  const unsubscribeBtn = document.querySelector('#unsubscribe');

  subscribeBtn.addEventListener('click', () => {
    sendForm('/subscribe');
  });

  unsubscribeBtn.addEventListener('click', () => {
    sendForm('/unsubscribe');
  });
});