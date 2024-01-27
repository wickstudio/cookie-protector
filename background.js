chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ protectionEnabled: true })
        .then(() => console.log("Protection is enabled by default."))
        .catch(error => console.error("Error setting default protection:", error));

    setupPeriodicTasks()
        .then(() => updateDynamicRules())
        .catch(error => console.error("Error during initialization:", error));
});

async function setupPeriodicTasks() {
    if (!chrome.alarms) {
        throw new Error('chrome.alarms API is not available.');
    }
    await chrome.alarms.create("periodicTask", { periodInMinutes: 60 });
    chrome.alarms.onAlarm.addListener(alarm => {
        if (alarm.name === "periodicTask") {
            updateDynamicRules().catch(console.error);
        }
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "toggleProtection") {
        chrome.storage.local.get('protectionEnabled', function(data) {
            const currentStatus = !data.protectionEnabled;
            chrome.storage.local.set({ protectionEnabled: currentStatus }, function() {
                if (chrome.runtime.lastError) {
                    console.error("Error toggling protection:", chrome.runtime.lastError);
                    sendResponse({ error: chrome.runtime.lastError.message });
                } else {
                    console.log("Protection status changed: ", currentStatus);
                    sendResponse({ status: currentStatus });
                }
            });
        });
        return true;
    }
});

function createNotification() {
    if (!chrome.notifications) {
        console.error('Notifications API is not available.');
        return;
    }
    chrome.notifications.create('', {
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Cookie Theft Alert',
        message: 'A potential cookie theft attempt was detected.'
    }, notificationId => {
        if (chrome.runtime.lastError) {
            console.error('Error creating notification:', chrome.runtime.lastError);
        } else {
            console.log("Notification created with ID:", notificationId);
        }
    });
}

async function updateDynamicRules() {
    try {
        const response = await fetch(chrome.runtime.getURL('blacklist.txt'));
        const text = await response.text();
        const domains = text.split('\n').filter(Boolean);

        await removeExistingRules();
        await addNewRules(domains);
    } catch (error) {
        console.error('Error updating dynamic rules:', error);
    }
}

async function removeExistingRules() {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(rule => rule.id);
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIdsToRemove });
}

async function addNewRules(domains) {
    const rulesToAdd = domains.map((domain, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: 'block' },
        condition: { urlFilter: `*://${domain}/*`, resourceTypes: ['main_frame', 'sub_frame', 'script', 'xmlhttprequest'] }
    }));
    await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rulesToAdd });
}
