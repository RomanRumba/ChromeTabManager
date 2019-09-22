chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if ('color' in request) {
          const imgUrl = chrome.runtime.getURL("../img/"+request.color);
          changeTabFavIcon(imgUrl);
      }
});

/* Usage : changeTabFavIcon(imgUrl)
     For : imgUrl is a string that holds the url of the favIcon we want to use
   After : Checks if the current site has a favIcon if so replace it with the one we provoide
           else create a new favIcon and add it to the dom */
function changeTabFavIcon(imgUrl){
    const head = document.querySelector('head');
    const faviconAlreadyExists = document.getElementById('CTMS_ICON');
    const favicon = faviconAlreadyExists? faviconAlreadyExists : document.createElement('link');
    favicon.setAttribute('id',"CTMS_ICON");
    favicon.setAttribute('rel','icon');
    favicon.setAttribute('href',imgUrl);
    head.appendChild(favicon);

}