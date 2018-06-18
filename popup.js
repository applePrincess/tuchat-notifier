// this script is relying on the fact that it is loaded after DOM is fully loaded.

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
    toggleMessageBox('ID and Password cannot be empty.');
    return;
  }
  browserRoot.runtime.sendMessage({uid, passwd});
});

browserRoot.runtime.onMessage.addListener((request) => {
  if(request.status === -1) {
    toggleMessageBox(request.message);
  }

  if (request.status === 0) {
    toggleMessageBox();
    toggleLoginButton();
    document.querySelector('#submitO').addEventListener('click', () => {
      browserRoot.runtime.sendMessage({close:1});
    });
  }

  if (request.status === 1) {
    window.open(request.destination, request.target);
  }

  if (request.status === 2) {
    toggleLoginButton();
  }
  if (request.status == 3) {
    if (document.querySelector('#submit').style.visibility === 'hidden') {
      toggleLoginButton();
    }
  }
  if (request.status == 4) {
    if (document.querySelector('#submitO').style.visibility === 'hidden') {
      document.querySelector('#submitO').addEventListener('click', () => {
        browserRoot.runtime.sendMessage({close:1});
      });
      toggleLoginButton();
    }
  }

});

browserRoot.runtime.sendMessage({checkingStatus: true});

function toggleLoginButton() {
  const loginBtn = document.querySelector('#submit');
  const logoutBtn = document.querySelector('#submitO');
  loginBtn.style.visibility = (loginBtn.style.visibility === 'visible' ? 'hidden' : 'visible');
  logoutBtn.style.visibility = (logoutBtn.style.visibility === 'visible' ? 'hidden' : 'visible');
}

function toggleMessageBox(msg) {
  const messageBox = document.querySelector('#message');
  if(msg === undefined) {
    messageBox.innerHTML = '';
    messageBox.style.visibility = 'hidden';
  } else {
    messageBox.innerHTMl = msg;
    messageBox.style.visibility = 'visible';
  }
}
