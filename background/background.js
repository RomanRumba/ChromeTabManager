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

/* Usage : clearTimeoutOnTab(tabId)
     For : - tabId is an integer indicating what tab you wish to clear the timeout function from
   After : checks if there is a settimeout on the tab whose id= tabId, if it exists then we clear it.*/
function clearTimeoutOnTab(tabId){
    if(TimersOnTabs['TabID'+tabId]) { 
        clearTimeout(TimersOnTabs['TabID'+tabId]); 
        delete TimersOnTabs['TabID'+tabId];
    }
}

/* Usage : closeTab(tabId)
     For : - tabId is an integer that indicates which tab needs to be closed
   After : Closes the tab whose id = tabId if it is not active, if it active then it's time to close get reset */
function closeTab(tabId){
    chrome.tabs.get(tabId, (tab) => {
        // if its the active tab then we just set another default timer on 
        if(tab.active){
            TimersOnTabs['TabID'+tabId] = setTimeout(closeTab, GetDefaultTime() * 60 * 1000, tabId);
            return;
        }
        delete TimersOnTabs['TabID'+tabId];
        chrome.tabs.remove(tabId);
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
        if(result){ return; }

        /*
         * For each url in result check if the current url is the same url
         * as the one that the user opened, if it was then assign it a priority that the user has specified to it
         */
        result.forEach(crrurl => {
            if(crrurl.url === tab.url){
                // change fav icon
            }
        });

    });

    // if timeout already exists we remove it 
    if(TimersOnTabs['TabID'+tabId]) { clearTimeout(TimersOnTabs['TabID'+tabId]); }

    // set a timeout on the tab
    TimersOnTabs['TabID'+tabId] = setTimeout(closeTab, GetDefaultTime() * 60 * 1000, tabId);
}

/* A listener that will listen to when a tab is closed, if closed 
   then we remove the corresponding settimeout along with TimersOnTabs */
chrome.tabs.onRemoved.addListener((tabid, removed) => { clearTimeoutOnTab(tabid); })

//#endregion

//#region Shortcut commands 

/* When the user hits a shortcut we check what shortcut was pressed and call the
   corresponding shortcut function */
chrome.commands.onCommand.addListener((command) =>{
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) =>{
        const currentTab = tabs[0];

        if(command === _markPageHigh){
            clearTimeoutOnTab(currentTab.id);
            chrome.tabs.sendMessage(currentTab.id, {color: "redprio.png"});
        }
        else if(command === _markPageMed) {
            clearTimeoutOnTab(currentTab.id);
            chrome.tabs.sendMessage(currentTab.id, {color: "yellowprio.png"});
        }
        else if(command === _markPageLow) {
            chrome.tabs.sendMessage(currentTab.id, {color: "greenprio.png"});
        }
    });
});

//#endregion