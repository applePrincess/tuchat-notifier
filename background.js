let browserRoot = undefined; // for compatibility this is the root elemen.

if (chrome !== undefined){
  browserRoot = chrome;
} else if (browser !== undefined){
  browserRoot = browser;
}

let receivedAny = false;
const HomepageURL = 'tk2-217-18218.vs.sakura.ne.jp';
const ChatPort = 8891;
let WS = null;
let timerId = undefined;
const queue = [];
function notify(options, callback) {
  const defaultNotificationOption = {title:'', message:'', type:'basic', 'iconUrl':'./icon.png'};
  browserRoot.notifications.create(
    '',
    {...defaultNotificationOption, ...options},
    (notificationId) => callback(notificationId));
}

browserRoot.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.close !== undefined){
    WS.close();
    // we want to use sendResponse here.
    // but for firefox compatibility issue, we cannot. at least AFAIK
    clearInterval(timerId);
    timerId = undefined;
    WS = null;
    browserRoot.runtime.sendMessage({status:2, message:'Websocket is closed.'});
    receivedAny = false;
    queue.length = 0;
    //sendResponse({status:2, message:'Websocket is closed.'});
    return;
  }
  if(request.checkingStatus !== undefined){
    if(WS == null){
      browserRoot.runtime.sendMessage({status: 3, message: ''});
    } else {
      browserRoot.runtime.sendMessage({status: 4, message: ''});
    }
    return;
  }
  WS = new WebSocket(`ws://${HomepageURL}:${ChatPort}`);
  WS.addEventListener('open', () => {
    WS.send(`\t${request.uid}\t${request.passwd}`);
  });
  WS.addEventListener('message', (event) => {
    if(event.data === 'ID又はPASSが違います')
    {
      WS.close();
      browserRoot.runtime.sendMessage({status:-1, message: 'ID or Password is incorrect.'});
      return;
    }
    if(!receivedAny) {
      browserRoot.runtime.sendMessage({status:0, message:'Websocket is OK.'});
      //sendResponse({status:0, message:'Websocket is OK.'});
      receivedAny = true;
    }
    queue.push(new Chat(event.data).toNotifiable(), () => {});
  });
  WS.addEventListener('close', () => {
    // console.log(event);
    WS = null;
    clearInterval(timerId);
    timerId = undefined;
    receivedAny = false;
    queue.length = 0;
  });

  // ボタン以外のエリアが押された時
  browserRoot.notifications.onClicked.addListener(() => {
    browserRoot.tabs.create({url:'http://' + HomepageURL}, () => {});
  });

  //ボタンが押された時 ( 通知バーに出てくるあいつはボタンという扱いらしい。)
  browserRoot.notifications.onButtonClicked.addListener(() => {
    browserRoot.tabs.create({url:'http://' + HomepageURL}, () => {});
  });
  // it can be as sensitive as one notification per one messsage, but, for here, once per 30s
  if (timerId === undefined) {
    timerId = setInterval(() => {
      if(queue.length !== 0)
      {
        notify({message:'You got new message.'}, () => {
        // console.log(id)
        });
        queue.length = 0; // queue.clear;
      }
    }, 30000);
  }
});

class Chat
{
  // @param message The entire message which represents a chat message.
  constructor(message){
    const splittedMessage = message.split('\t');
    if(splittedMessage.length !== 4)
      throw new Error(`Format of message expected, got: ${message}`);
    this.origin = splittedMessage[0];
    this.servertime = splittedMessage[1];
    this.sender = splittedMessage[2];
    this.message = splittedMessage[3];
  }

  toNotifiable() {
    return {title:`${this.sender} ${this.servertime}`, message: this.message};
  }
}
