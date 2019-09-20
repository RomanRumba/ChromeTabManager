/** Author : Róman Rumba
 *  The background.js script will listen for the opening/closing of tabs,
 *  when a new tab is opened :
 *      - A timer will be set on the tab, when the time runs out the tab will be closed (user can specify the default closing time)
 *  
 *  when a tab is closed :
 *      - Timer should be removed for the tab that is closed
 */
// TABS API : https://developer.chrome.com/extensions/tabs
chrome.tabs.onUpdated.addListener(listenToTab)

const TimersOnTabs = {}; //object that holds all the tabs that have a close timer on them

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

    const defaultTimer = 5; // default timer is set to 5 minutes
    // Check if the user has a altered the default time on closing tabs 
    chrome.storage.sync.get(['CTMS_timer'], function(result) {
        if(result){ return; }
        defaultTimer = result;
    });

    // Check if the user has the url set a priority on it  
    chrome.storage.sync.get(['CTMS_urls'], function(result) {
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
    TimersOnTabs['TabID'+tabId] = setTimeout(closeTab, defaultTimer * 60 * 1000, tabId);
}

/* Usage : closeTab(tabId)
     For : - tabId is an integer that indicates which tab needs to be closed
   After : Closes the tab whose id = tabId */
function closeTab(tabId){
    delete TimersOnTabs['TabID'+tabId];
    chrome.tabs.remove(tabId);
}