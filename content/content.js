chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if ('color' in request) {
          const faviconAlreadyExists = document.getElementById('CTMS_ICON');
          const imgUrl = chrome.runtime.getURL("../img/"+request.color);
          const head = document.querySelector('head');
          const favicon = faviconAlreadyExists? faviconAlreadyExists : document.createElement('link');
          favicon.setAttribute('id',"CTMS_ICON");
          favicon.setAttribute('rel','icon');
          favicon.setAttribute('href',imgUrl);
          head.appendChild(favicon);
      }
});