// this script is relying on the fact that it is loaded after DOM is fully loaded.
const messageBox = document.querySelector('#message');

let browserRoot;
if(chrome !== undefined) {
  browserRoot = chrome;
} else if (browser !== undefined) {
  browserRoot = browser;
}
document.querySelector('#submit').addEventListener('click', () => {
  const uid = document.querySelector('#uid').value;
  const passwd = document.querySelector('#passwd').value;
  if(uid === '' || passwd === '') {
    const messageBox = document.querySelector('#message');
    messageBox.innerHTML = 'ID and Password cannot be empty.';
    messageBox.style.visibility = 'visible';
    return;
  }
  browserRoot.runtime.sendMessage({uid, passwd});
});

browserRoot.runtime.onMessage.addListener((request) => {
  if(request.status === -1) {
    messageBox.innerHTML = request.message;
    messageBox.style.visibility = 'visible';
  }
  if(request.status === 0) {
    messageBox.innerHTML = '';
    messageBox.style.visibility = 'hidden';
    document.querySelector('#submitO').style.visibility = 'visible';
    document.querySelector('#submit').style.visibility = 'hidden';
    document.querySelector('#submitO').addEventListener('click', () => {
      browserRoot.runtime.sendMessage({close:1});
    });
  }
  if(request.status === 1) {
    window.open(request.destination, request.target);
  }
  if(request.status === 2) {
    document.querySelector('#submit').style.visibility = 'visible';
    document.querySelector('#submitO').style.visibility = 'hidden';

  }
});
