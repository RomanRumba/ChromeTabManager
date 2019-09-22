/** Author : Róman Rumba
 *  The background.js script will listen for the opening/closing of tabs,
 *  when a new tab is opened :
 *      - A timer will be set on the tab, when the time runs out the tab will be closed (user can specify the default closing time)
 *  
 *  when a tab is closed :
 *      - Timer should be removed for the tab that is closed
 */

 //#region Extention Global constants 

 //object that holds all the tabs that have a close timer on them
const TimersOnTabs = {};

//Constant strings that represent possible commands that the user can perform
const _markPageHigh = "mark-page-high-priority";
const _markPageMed = "mark-page-med-priority";
const _markPageLow = "mark-page-low-priority";
const _removeUrlPriority = "remove-url-priority";

//#endregion

//#region  Utility functions

/* Usage : GetDefaultTime()
     For : nothing
   After : Checks if the user has set a custom default close timer,
           if he has then return it else return the default time */
function GetDefaultTime() {
    let defaultTimer = 5; // default timer is set to 5 minutes
    // Check if the user has a altered the default time on closing tabs 
    chrome.storage.sync.get(['CTMS_timer'],(result) => {
        if(result){ return; }
        defaultTimer = result;
    });
    return defaultTimer;
}

/* Usage : ClearTimeoutOnTab(tabId)
     For : - tabId is an integer indicating what tab you wish to clear the timeout function from
   After : checks if there is a settimeout on the tab whose id= tabId, if it exists then we clear it.*/
function ClearTimeoutOnTab(tabId){
    if(TimersOnTabs['TabID'+tabId]) { 
        clearTimeout(TimersOnTabs['TabID'+tabId]); 
        delete TimersOnTabs['TabID'+tabId];
    }
}

/* Usage : CloseTab(tabId)
     For : - tabId is an integer that indicates which tab needs to be closed
   After : Closes the tab whose id = tabId if it is not active, if it active then it's time to close get reset */
function CloseTab(tabId){
    chrome.tabs.get(tabId, (tab) => {
        // if its the active tab then we just set another default timer on 
        if(tab.active){
            TimersOnTabs['TabID'+tabId] = setTimeout(CloseTab, GetDefaultTime() * 60 * 1000, tabId);
            return;
        }
        delete TimersOnTabs['TabID'+tabId];
        chrome.tabs.remove(tabId);
    });
}

/* Usage : SetNewPriorityOnWebsite(tabId,tabUrl,color)
     For : - tabId is an interger that indicates which tab is the website on
           - tabUrl is a string that indicates what url is the user on
           - color is a string can be ether 'redprio.png' , 'yellowprio.png' , 'greenprio.png'
   After : Clear the timeout on the given tabId and changes the favIcon to the desired color 
           alsong with saving the url and it's priority in any Chrome browser that the user is logged into.*/
function SetNewPriorityOnWebsite(tabId,tabUrl,color){
    ClearTimeoutOnTab(tabId);
    chrome.tabs.sendMessage(tabId, {color: color});
    chrome.storage.sync.get(['CTMS_urls'], function(result) {
        let userPrioUrls = [];
        if(!result){ 
            userPrioUrls = result; 

            userPrioUrls.forEach(crrurl => {
                if(crrurl.url === tabUrl){
                   userPrioUrls.remove(crrurl);
                   return;
                }
            });
        }
        userPrioUrls.push({
            url : tabUrl,
            color : "redprio.png"
        });

        chrome.storage.sync.set({'CTMS_urls': userPrioUrls});
    });
}

/* Usage : RemovePriorityFromWebsite(url)
     For : - url is a string of the url you wish to remove from priorties
   After : Removes the priority from the specified url if it had a priority. */
function RemovePriorityFromWebsite(url) {
    chrome.storage.sync.get(['CTMS_urls'], function(result) {
        let userPrioUrls = [];
        if(!result){ 
            userPrioUrls = result;
            userPrioUrls.forEach(crrurl => {
                if(crrurl.url === url){
                   userPrioUrls.remove(crrurl);
                   return;
                }
            });
        }
        chrome.storage.sync.set({'CTMS_urls': userPrioUrls});
    });
}

//#endregion

//#region  Manage tabs when opened or closed

chrome.tabs.onUpdated.addListener(listenToTab) // TABS API : https://developer.chrome.com/extensions/tabs

/* Usage : listenToTab(tabId,changeInfo, tab)
     For : - tabId is an integer that shows u the id of the tab that triggered the event
           - changeInfo is a object that shows whether the tabs have completed loading.
           - tab is a googles Tab object : https://developer.chrome.com/extensions/tabs#type-Tab  
   After : Checks if the page has loaded and if it has it proceds to check if the page has a priority assigned to it
           if it does not then it sets a timer to close the page.*/
function listenToTab (tabId,changeInfo, tab){
    // we only want to start our operation when the page has completed loading 
    if(!('status' in changeInfo)){ return; }
    // I dont fck know why i cant make this into one line, it just stops working when its in a one if statement 
    if(changeInfo.status !== "complete"){ return; }
    // Check if the user has the url set a priority on it  
    chrome.storage.sync.get(['CTMS_urls'], (result) => {
        // fetch the urs that the user has set priorities to
        if('CTMS_urls' in result){
            /* For each url in result check if the current url is the same url as the one that the user opened, 
             * if it was then assign it a priority that the user has specified to it. */
            for(let i = 0; i < result.CTMS_urls.length; i++){
                if(result.CTMS_urls[i].url === tab.url){
                    chrome.tabs.sendMessage(tab.id, {color: result.CTMS_urls[i].color});
                    return;
                }
            }
        }
        // if timeout already exists we remove it 
        if(TimersOnTabs['TabID'+tabId]) { clearTimeout(TimersOnTabs['TabID'+tabId]); } 
        // set a timeout on the tab
        TimersOnTabs['TabID'+tabId] = setTimeout(CloseTab, GetDefaultTime() * 60 * 1000, tabId);
    });
}

/* A listener that will listen to when a tab is closed, if closed 
   then we remove the corresponding settimeout along with TimersOnTabs */
chrome.tabs.onRemoved.addListener((tabid, removed) => { ClearTimeoutOnTab(tabid); })

//#endregion

//#region Shortcut commands 

/* When the user hits a shortcut we check what shortcut was pressed and call the
   corresponding shortcut function */
chrome.commands.onCommand.addListener((command) =>{
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) =>{
        const currentTab = tabs[0];
        if(command === _markPageHigh){
            SetNewPriorityOnWebsite(currentTab.id,currentTab.url,"redprio.png");
        }
        else if(command === _markPageMed) {
            SetNewPriorityOnWebsite(currentTab.id,currentTab.url,"yellowprio.png");
        }
        else if(command === _markPageLow) {
            SetNewPriorityOnWebsite(currentTab.id,currentTab.url,"greenprio.png");
        }
        else if(command === _removeUrlPriority){
            RemovePriorityFromWebsite(currentTab.url);
        }
    });
});

//#endregion