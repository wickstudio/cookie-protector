document.addEventListener('DOMContentLoaded', function() {
    var toggleSwitch = document.getElementById('toggleProtection');
    
    chrome.storage.local.get('protectionEnabled', function(data) {
        toggleSwitch.checked = data.protectionEnabled;
    });
    
    toggleSwitch.addEventListener('change', function() {
        var protectionEnabled = this.checked;
        
        chrome.storage.local.set({protectionEnabled: protectionEnabled}, function() {
            console.log('Protection status updated:', protectionEnabled);
        });
        
        chrome.runtime.sendMessage({message: "toggleProtection", status: protectionEnabled}, function(response) {
            console.log('Response from background:', response);
        });
    });
});
