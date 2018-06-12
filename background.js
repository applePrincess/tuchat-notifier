let browserRoot = undefined; // for compatibility this is the root elemen.

if (chrome !== undefined){
  browserRoot = chrome;
}
let receivedAny = false;
const HomepageURL = 'tk2-217-18218.vs.sakura.ne.jp';
const ChatPort = 8891;
let WS = null;
const queue = [];
function notify(options, callback) {
  const defaultNotificationOption = {title:'', message:'', type:'basic', 'iconUrl':'./icon.png'};
  browserRoot.notifications.create('', {...defaultNotificationOption, ...options},
                                   (notificationId) => callback(notificationId));
}

browserRoot.runtime.onMessage.addListener((request, sender, sendResponse) => {
  WS = new WebSocket(`ws://${HomepageURL}:${ChatPort}`);
  WS.addEventListener('open', (event) => {
    WS.send(`\t${request.uid}\t${request.passwd}`);
  });
  WS.addEventListener('message', (event) => {
    if(event.data === 'ID又はPASSが違います')
    {
      WS.close();
      sendResponse({status:-1, message: 'ID またはパスワードが違います。'});
      return;
    }
    if(!receivedAny) {
      sendResponse({status:0, message:'Websocketが開通しました。'});
      receivedAny = true;
    }
    queue.push(new Chat(event.data).toNotifiable(), (e) => {});
  });
  WS.addEventListener('close', (event) => {
    console.log(event);
    WS = null;
  })

  // ボタン以外のエリアが押された時
  browserRoot.notifications.onClicked.addListener((nid) => {
    browserRoot.tabs.create({url:'http://' + HomepageURL}, () => {});
  })

  //ボタンが押された時 ( 通知バーに出てくるあいつはボタンという扱いらしい。)
  browserRoot.notifications.onButtonClicked.addListener((nid) => {
    browserRoot.tabs.create({url:'http://' + HomepageURL}, () => {});
  })
  // it can be as sensitive as one notification per one messsage, but, for here, once per 30s
  setInterval(() => {
    if(queue.length !== 0)
    {
      notify({message:'新規メーセジがあります'}, id => {
        console.log(id);
      });
      queue.length = 0; // queue.clear;
    }
  }, 30000);
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
