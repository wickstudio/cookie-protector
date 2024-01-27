function secureCookie(cookie) {
    return cookie + '; Secure; HttpOnly; SameSite=Strict';
}

function protectCookies() {
    var cookies = document.cookie.split(';');

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        if (!cookie.toLowerCase().includes('secure') ||
            !cookie.toLowerCase().includes('httponly') ||
            !cookie.toLowerCase().includes('samesite=strict')) {
            document.cookie = secureCookie(cookie);
        }
    }
}

function notifyBackground(cookie) {
    chrome.runtime.sendMessage({type: 'cookieProtected', data: cookie}, function(response) {
        console.log('Background response:', response);
    });
}

function detectSuspiciousActivities() {
    var suspiciousActivityDetected = false;

    if (suspiciousActivityDetected) {
        chrome.runtime.sendMessage({message: 'suspectedCookieTheft'}, function(response) {
            console.log('Suspected cookie theft reported to background.');
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    protectCookies();
    notifyBackground(document.cookie);
    detectSuspiciousActivities();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command === 'updateProtection') {
        protectCookies();
        sendResponse({status: 'Cookies updated'});
    }
});
