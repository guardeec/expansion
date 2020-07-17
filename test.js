let opn = require('opn');

openWebPage();

function openWebPage(){
    opn('https://vk.com/app7103178_-184087965');
    setInterval(openWebPage, 10000);
}
